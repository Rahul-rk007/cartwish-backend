const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        title: { type: String, required: true }, // Add title field
        price: { type: Number, required: true } 
    }],
    total: { type: Number, required: true },
    status: { type: String, required: true, enum: ['pending', 'completed', 'canceled'] },
    payment: { type: String, required: true },
    transactionId: { type: String, required: true }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;