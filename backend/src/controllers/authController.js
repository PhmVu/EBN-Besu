const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { jwtSecret, jwtExpiresIn } = require("../config/env");

class AuthController {
  /**
   * Register a new teacher
   */
  static async register(req, res, next) {
    try {
      const { email, password, fullName } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user (only teachers can register)
      const user = await User.create({
        email,
        passwordHash,
        role: "teacher",
        fullName,
      });

      // Generate JWT
      const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
        expiresIn: jwtExpiresIn,
      });

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
        expiresIn: jwtExpiresIn,
      });

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          walletAddress: user.wallet_address,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user info
   */
  static async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        walletAddress: user.wallet_address,
        createdAt: user.created_at,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
