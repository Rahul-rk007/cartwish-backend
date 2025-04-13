// routes/order.js
const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart'); // Import Cart model
const Product = require('../models/Product'); // Import Product model
const authenticate = require('../middleware/auth');

const router = express.Router();

// Checkout (Create a new order)
router.post('/checkout', authenticate, async (req, res) => {
    try {
        // Find the user's cart
        const cart = await Cart.findOne({ user: req.user.id });
console.log(1);

        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ message: 'Cart is empty. Cannot proceed to checkout.' });
        }
        console.log(2);
        // Check stock for each product
        for (const item of cart.products) {
            const product = await Product.findById(item.product);
            if (!product || product.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for product: ${item.title}` });
            }
        }
        console.log(3);
        // Calculate total price
        const total = cart.products.reduce((acc, item) => acc + item.price * item.quantity, 0);
        console.log(4);
        // Create a new order
        const newOrder = new Order({
            user: req.user.id,
            products: cart.products,
            total,
            status: 'pending',
            payment: req.body.payment, // Assuming payment info is sent in the request body
            transactionId: req.body.transactionId // Assuming transaction ID is sent in the request body
        });

        await newOrder.save();
        console.log(5);
        // Update stock for each purchased product
        for (const item of cart.products) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
        }

        // Optionally, clear the cart after checkout
        await Cart.deleteOne({ user: req.user.id });
        console.log(6);
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all orders for the authenticated user
router.get('/', authenticate, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).populate('products.product');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get order details by order ID
router.get('/detail/:orderId', authenticate, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('products.product');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Ship an order
router.put('/ship/:orderId', authenticate, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        order.status = 'shipped';
        await order.save();
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;