const User = require("../models/user");
const jwt = require("jsonwebtoken");


const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};


const signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (fullName.trim().length < 2) {
      return res.status(400).json({ error: "Full name must be at least 2 characters" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }


    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

   
    const user = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    await user.save();

  
    const token = generateToken(user._id);

    res.status(201).json({
      message: "Account created successfully",
      token, // 🔑 return token here
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: errors[0] });
    }

    if (error.code === 11000) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    res.status(500).json({ error: "Failed to create account" });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

   
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }


    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }


    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      token, 
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Login failed" });
  }
};

module.exports = { signup, login };


