const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const User = require("../models/User");

/**
 * Middleware to authenticate JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(500).json({ error: "Authentication error" });
  }
};

/**
 * Middleware to check if user is teacher
 */
const requireTeacher = (req, res, next) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ error: "Teacher access required" });
  }
  next();
};

/**
 * Middleware to check if user is student
 */
const requireStudent = (req, res, next) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Student access required" });
  }
  next();
};

/**
 * Middleware to verify JWT token and set req.user
 */
const verifyToken = authenticate;

/**
 * Middleware to authorize teacher role
 */
const authorizeTeacher = (req, res, next) => {
  if (!req.user || req.user.role !== "teacher") {
    return res.status(403).json({ error: "Teacher access required" });
  }
  next();
};

/**
 * Middleware to authorize student role
 */
const authorizeStudent = (req, res, next) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({ error: "Student access required" });
  }
  next();
};

module.exports = {
  authenticate,
  verifyToken,
  requireTeacher,
  authorizeTeacher,
  requireStudent,
  authorizeStudent,
};
