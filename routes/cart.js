// routes/cartRoutes.js
const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const authenticate = require("../middleware/auth");

const router = express.Router();

// Add to Cart API
router.post("/", authenticate, async (req, res) => {
  const { productId, quantity } = req.body;

  console.log(req.body);

  try {
    // Check if the product exists
    const product = await Product.findById(productId);
    console.log(product);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find the user's cart
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      // Create a new cart if it doesn't exist
      cart = new Cart({ user: req.user.id, products: [] });
    }

    // Check if the product is already in the cart
    const existingProduct = cart.products.find(
      (item) => item.product.toString() === productId
    );
    if (existingProduct) {
      // Update the quantity if the product is already in the cart
      existingProduct.quantity += quantity;
    } else {
      // Add the new product to the cart with title and price
      cart.products.push({
        product: productId,
        quantity,
        title: product.title, // Assuming the product has a title field
        price: product.price, // Assuming the product has a price field
      });
    }

    // Calculate the total amount
    let cartTotal = 0;
    for (const item of cart.products) {
      cartTotal += item.price * item.quantity; // Use the stored price
    }

    cart.cartTotal = cartTotal;
    // Save the cart
    await cart.save();
    res.status(200).json({
      cart,
      cartTotal,
      message: "Product added to cart successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get User Cart API
router.get("/", authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: "products.product",
      select: "title price", // Specify the fields you want to include
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json(cart.products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove Product from Cart API
router.delete("/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove the product from the cart
    cart.products = cart.products.filter(
      (item) => item.product.toString() !== id
    );
    // Save the cart
    await cart.save();
    res
      .status(200)
      .json({ cart, message: "Product removed from cart successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Increase Product Quantity API
router.patch("/increase/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the product in the cart
    const product = cart.products.find(
      (item) => item.product.toString() === id
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Increase the quantity
    product.quantity += 1;

    // Save the cart
    await cart.save();
    res
      .status(200)
      .json({ cart, message: "Product quantity increased successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Decrease Product Quantity API
router.patch("/decrease/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the product in the cart
    const product = cart.products.find(
      (item) => item.product.toString() === id
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Decrease the quantity
    if (product.quantity > 1) {
      product.quantity -= 1; // Decrease quantity only if it's greater than 1
    } else {
      // If quantity is 1, you might want to remove the product from the cart
      cart.products = cart.products.filter(
        (item) => item.product.toString() !== id
      );
    }

    // Save the cart
    await cart.save();
    res
      .status(200)
      .json({ cart, message: "Product quantity decreased successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/update/:type/:id", authenticate, async (req, res) => {
  const { type, id } = req.params; // Extract type and id from the URL

  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the product in the cart
    const product = cart.products.find(
      (item) => item.product.toString() === id
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Update the quantity based on the type
    if (type === "increase") {
      product.quantity += 1;
      await cart.save(); // Save the cart after updating the quantity
      return res
        .status(200)
        .json({ cart, message: "Product quantity increased successfully!" });
    } else if (type === "decrease") {
      if (product.quantity > 1) {
        product.quantity -= 1; // Decrease quantity only if it's greater than 1
      } else {
        // If quantity is 1, remove the product from the cart
        cart.products = cart.products.filter(
          (item) => item.product.toString() !== id
        );
      }
      await cart.save(); // Save the cart after updating the quantity
      return res
        .status(200)
        .json({ cart, message: "Product quantity decreased successfully!" });
    } else {
      return res
        .status(400)
        .json({ message: 'Invalid type. Use "increase" or "decrease".' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
