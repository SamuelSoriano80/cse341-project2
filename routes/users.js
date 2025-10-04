const express = require('express');
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');

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