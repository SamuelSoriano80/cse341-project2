const { ObjectId } = require('mongodb');

// GET all products
const getAllProducts = async (req, res) => {
    try {
        const products = await req.db.collection('products').find().toArray();
        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
};

// GET product by ID
const getProductById = async (req, res) => {
    try {
        // Validate ID format
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        const product = await req.db.collection('products').findOne({ _id: new ObjectId(req.params.id) });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
};

// POST create new product
const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, inStock } = req.body;
        
        // Validation
        if (!name || !price) {
            return res.status(400).json({
                success: false,
                message: 'Name and price are required'
            });
        }
        
        if (price < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price cannot be negative'
            });
        }
        
        if (name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Product name must be at least 2 characters long'
            });
        }
        
        const newProduct = {
            name: name.trim(),
            description: description ? description.trim() : '',
            price: parseFloat(price),
            category: category ? category.trim() : 'general',
            inStock: inStock !== undefined ? Boolean(inStock) : true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await req.db.collection('products').insertOne(newProduct);
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { _id: result.insertedId, ...newProduct }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
};

// PUT update product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, inStock } = req.body;
        
        // Validate ID format
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }
        
        // Check if product exists
        const existingProduct = await req.db.collection('products').findOne({ _id: new ObjectId(id) });
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Price validation
        if (price && price < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price cannot be negative'
            });
        }
        
        // Name validation
        if (name && name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Product name must be at least 2 characters long'
            });
        }
        
        const updateData = {
            ...(name && { name: name.trim() }),
            ...(description !== undefined && { description: description.trim() }),
            ...(price && { price: parseFloat(price) }),
            ...(category && { category: category.trim() }),
            ...(inStock !== undefined && { inStock: Boolean(inStock) }),
            updatedAt: new Date()
        };
        
        const result = await req.db.collection('products').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        
        if (result.modifiedCount === 0) {
            return res.status(400).json({
                success: false,
                message: 'No changes made to product'
            });
        }
        
        // Get updated product
        const updatedProduct = await req.db.collection('products').findOne({ _id: new ObjectId(id) });
        
        res.json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
};

// DELETE product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ID format
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }
        
        // Check if product exists
        const existingProduct = await req.db.collection('products').findOne({ _id: new ObjectId(id) });
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        const result = await req.db.collection('products').deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Product deleted successfully',
            data: { _id: id }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};