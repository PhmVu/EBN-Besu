const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const { authenticate, verifyToken } = require("../middleware/auth");

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/me", authenticate, AuthController.getMe);

// Student registration with class enrollment
router.post("/register-student", AuthController.registerStudent);

// Get private key (show once policy)
router.post("/wallet-key", verifyToken, AuthController.getPrivateKey);

module.exports = router;
