const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import your models
const Category = require('./models/Category');
const Product = require('./models/Product');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected...');
        loadData();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

// Load data from data.json
const loadData = async () => {
    try {
        // Read data.json file
        const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));

        // Insert categories
        await Category.deleteMany(); // Clear existing categories
        const categories = await Category.insertMany(data.categories);
        console.log('Categories inserted:', categories);

        // Insert products
        await Product.deleteMany(); // Clear existing products
        const productsWithCategoryId = data.products.map(product => {
            const category = categories.find(cat => cat.name === product.category);
            if (!category) {
                console.error(`Category not found for product: ${product.title}`);
                return null; // Skip this product if the category is not found
            }
            return {
                ...product,
                category: category._id // Set category ID
            };
        }).filter(product => product !== null); // Filter out any null products

        const products = await Product.insertMany(productsWithCategoryId);
        console.log('Products inserted:', products);

        // Close the database connection
        mongoose.connection.close();
    } catch (error) {
        console.error('Error loading data:', error);
        mongoose.connection.close();
    }
};