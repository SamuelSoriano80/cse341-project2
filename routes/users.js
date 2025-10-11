const express = require('express');
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const bcrypt = require('bcrypt');
const passport = require('passport');

module.exports = (db) => {
    const router = express.Router();
    
    router.use((req, res, next) => {
        if (!db) {
            return res.status(503).json({
                success: false,
                message: 'Database not connected'
            });
        }
        req.db = db;
        next();
    });

     // Register
    router.post('/register', async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: 'Missing fields' });

        const existingUser = await db.collection('users').findOne({ username });
        if (existingUser) return res.status(409).json({ message: 'Username already exists' });

        const hash = await bcrypt.hash(password, 10);
        const result = await db.collection('users').insertOne({ username, password: hash });
        res.status(201).json({ message: 'User created', userId: result.insertedId });
    });

    // Login
    router.post('/login', passport.authenticate('local'), (req, res) => {
        res.json({ message: 'Logged in', user: { id: req.user._id, username: req.user.username } });
    });

    // Logout
    router.post('/logout', (req, res) => {
        req.logout(err => {
            if (err) return res.status(500).json({ message: 'Logout failed' });
            res.json({ message: 'Logged out' });
        });
    });
    
    // GET /api/users - Get all users
    router.get('/', getAllUsers);

    // GET /api/users/:id - Get user by ID
    router.get('/:id', getUserById);

    // POST /api/users - Create new user
    router.post('/', createUser);

    // PUT /api/users/:id - Update user
    router.put('/:id', updateUser);

    // DELETE /api/users/:id - Delete user
    router.delete('/:id', deleteUser);

    return router;
};