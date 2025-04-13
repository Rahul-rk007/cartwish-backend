const express = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticate = require("../middleware/auth");
const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Specify the upload directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Append timestamp to the filename
  },
});

const upload = multer({ storage });

// User registration route
router.post("/register", upload.single("profilePic"), async (req, res) => {
  const { name, email, password, address, isAdmin } = req.body;
  const profilePic = req.file ? req.file.path : null; // Get the uploaded file path

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Create a new user
    const newUser = new User({
      name,
      email,
      password,
      address,
      profilePic,
      isAdmin,
    });
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { user: { id: newUser._id } },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res
      .status(201)
      .json({
        token,
        user: { id: newUser._id, name, email, address, profilePic, isAdmin },
      });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// User login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    //console.log("user=>",user); // Log the user object

    if (!user) {
      return res.status(401).json({ message: "User  not found." });
    }

    // Check if the password is correct
    if (!(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ message: "You have entered wrong credentials." });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          address: user.address,
          profilePic: user.profilePic,
          isAdmin: user.isAdmin,
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        profilePic: user.profilePic,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get logged-in user profile
router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password from the response
    if (!user) return res.status(404).json({ message: "User  not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
