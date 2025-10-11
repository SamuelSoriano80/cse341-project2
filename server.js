const express = require('express');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const cors = require('cors');

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

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

// Session setup
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  }
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Local strategy
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await db.collection('users').findOne({ username });
      if (!user) return done(null, false, { message: 'Incorrect username.' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false, { message: 'Incorrect password.' });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => done(null, user._id));

const { ObjectId } = require('mongodb');

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(cors({
  origin: 'https://cse341-project2-8tr8.onrender.com',
  credentials: true
}));

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