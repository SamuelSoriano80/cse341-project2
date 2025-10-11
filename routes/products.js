const express = require('express');
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    return res.status(401).json({ message: 'Unauthorized' });
}

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
    
    // GET /api/products - Get all products
    router.get('/', getAllProducts);

    // GET /api/products/:id - Get product by ID
    router.get('/:id', getProductById);

    // POST /api/products - Create new product
    router.post('/', isAuthenticated, createProduct);

    // PUT /api/products/:id - Update product
    router.put('/:id', isAuthenticated, updateProduct);

    // DELETE /api/products/:id - Delete product
    router.delete('/:id', isAuthenticated, deleteProduct);

    return router;
};