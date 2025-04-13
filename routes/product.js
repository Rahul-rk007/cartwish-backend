const express = require("express");
const Product = require("../models/Product");
const Category = require("../models/Category");
const router = express.Router();

// Get product suggestions based on search term
router.get("/suggestions", async (req, res) => {
  const { search } = req.query;

  try {
    // Check if search term is provided
    if (!search) {
      return res.status(400).json({ message: "Search term is required" });
    }

    // Use a case-insensitive regex search for the product title
    const products = await Product.find({
      title: { $regex: search, $options: "i" }, // Case-insensitive search
    })
      .select("_id title") // Select only the _id and title fields
      .limit(10); // Limit the number of suggestions returned

    res.json(products);
  } catch (error) {
    console.error("Error fetching product suggestions:", error); // Log the error
    res.status(500).json({ message: "Server error", error: error.message }); // Return error message
  }
});

// Create a new product
router.post("/", async (req, res) => {
  const { name, price, category } = req.body;

  // Check if the category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return res.status(400).json({ message: "Category not found" });
  }

  const product = new Product({ name, price, category });
  await product.save();
  res.status(201).json(product);
});

// Get a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a product by ID
router.put("/:id", async (req, res) => {
  const { name, price, category } = req.body;

  // Check if the category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return res.status(400).json({ message: "Category not found" });
  }

  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, category },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a product by ID
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all products with pagination, filtering, and searching
router.get("/", async (req, res) => {
  const { currentPage = 1, productsPerPage = 10, category, search } = req.query;

  const query = {};

  try {
    // If a category name is provided, find the category ID
    if (category) {
      const foundCategory = await Category.findOne({ name: category });
      if (foundCategory) {
        query.category = foundCategory._id; // Use the category ID for filtering
      } else {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    // Search by name if provided
    if (search) {
      // Use a case-insensitive regex search for the product name
      query.title = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    const products = await Product.find(query)
      .populate("category")
      .skip((currentPage - 1) * productsPerPage)
      .limit(Number(productsPerPage));

    res.json({
      currentPage: Number(currentPage),
      productsPerPage: Number(productsPerPage),
      totalProducts,
      totalPages,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error); // Log the error for debugging
    res.status(500).json({ message: "Server error" });
  }
});

// Feature: Get featured products (3 items)
router.get("/featured/items", async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true }) // Find products that are featured
      .populate("category")
      .limit(3); // Limit the results to 3 products

    res.json(products);
  } catch (error) {
    console.error("Error fetching featured products:", error); // Log the error to the console
    res.status(500).json({ message: "Server error", error: error.message }); // Send the error message in the response
  }
});

module.exports = router;
