const { ObjectId } = require('mongodb');

// GET all users
const getAllUsers = async (req, res) => {
    try {
        const users = await req.db.collection('users').find().toArray();
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// GET user by ID
const getUserById = async (req, res) => {
    try {
        // Validate ID format
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await req.db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// POST create new user
const createUser = async (req, res) => {
    try {
        const { name, email, age, role } = req.body;
        
        // Validation
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required'
            });
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        // Age validation
        if (age && (age < 0 || age > 150)) {
            return res.status(400).json({
                success: false,
                message: 'Age must be between 0 and 150'
            });
        }
        
        // Check if email already exists
        const existingUser = await req.db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        const newUser = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            age: age ? parseInt(age) : null,
            role: role || 'user',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await req.db.collection('users').insertOne(newUser);
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { _id: result.insertedId, ...newUser }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

// PUT update user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, age, role } = req.body;
        
        // Validate ID format
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        // Check if user exists
        const existingUser = await req.db.collection('users').findOne({ _id: new ObjectId(id) });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Email validation if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }
            
            // Check if email is already used by another user
            const emailExists = await req.db.collection('users').findOne({ 
                email: email.toLowerCase().trim(), 
                _id: { $ne: new ObjectId(id) } 
            });
            
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already in use by another user'
                });
            }
        }
        
        // Age validation
        if (age && (age < 0 || age > 150)) {
            return res.status(400).json({
                success: false,
                message: 'Age must be between 0 and 150'
            });
        }
        
        const updateData = {
            ...(name && { name: name.trim() }),
            ...(email && { email: email.toLowerCase().trim() }),
            ...(age !== undefined && { age: age ? parseInt(age) : null }),
            ...(role && { role }),
            updatedAt: new Date()
        };
        
        const result = await req.db.collection('users').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        
        if (result.modifiedCount === 0) {
            return res.status(400).json({
                success: false,
                message: 'No changes made to user'
            });
        }
        
        // Get updated user
        const updatedUser = await req.db.collection('users').findOne({ _id: new ObjectId(id) });
        
        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// DELETE user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ID format
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        // Check if user exists
        const existingUser = await req.db.collection('users').findOne({ _id: new ObjectId(id) });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const result = await req.db.collection('users').deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User deleted successfully',
            data: { _id: id }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};