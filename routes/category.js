const express = require('express');
const Category = require('../models/Category');
const router = express.Router();

// Create a new category
router.post('/', async (req, res) => {
    const { name } = req.body;

    const category = new Category({ name });
    await category.save();
    res.status(201).json(category);
});

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single category by ID
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a category by ID
router.put('/:id', async (req, res) => {
    const { name } = req.body;

    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true }
        );
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a category by ID
router.delete('/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;