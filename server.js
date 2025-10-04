const express = require('express');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// MongoDB connection
let db;
const connectToMongoDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  await client.connect();
  db = client.db(process.env.DB_NAME);
  console.log('Connected to MongoDB successfully');
  console.log(`Database: ${process.env.DB_NAME}`);
};

// Import routes
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const swaggerRoute = require('./routes/swagger');

const startServer = async () => {
  try {
    await connectToMongoDB();

    // Now db is ready, mount routes
    app.use('/api/users', userRoutes(db));
    app.use('/api/products', productRoutes(db));
    app.use('/', swaggerRoute);

    app.get('/', (req, res) => {
      res.json({
        message: 'Welcome to the API!',
        documentation: 'Visit /api-docs for Swagger documentation',
        endpoints: [
          '/api/users - User management',
          '/api/products - Product management',
          '/api-docs - Swagger documentation'
        ]
      });
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
  }
};

startServer();