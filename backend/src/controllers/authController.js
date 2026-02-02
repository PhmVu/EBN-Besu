const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const WalletService = require("../services/walletService");
const BlockchainService = require("../services/blockchainService");
const { jwtSecret, jwtExpiresIn } = require("../config/env");
const db = require("../config/database");

class AuthController {
  /**
   * Register a new teacher
   */
  static async register(req, res, next) {
    try {
      const { email, password, fullName, name, role } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Validate role
      const userRole = role || "teacher";
      if (!["teacher", "student"].includes(userRole)) {
        return res.status(400).json({ error: "Invalid role. Must be 'teacher' or 'student'" });
      }

      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Generate wallet for students
      let walletAddress = null;
      if (userRole === "student") {
        const walletInfo = WalletService.generateWallet();
        walletAddress = walletInfo.address;

        // Create user with wallet
        const user = await User.create({
          email,
          passwordHash,
          role: userRole,
          fullName: fullName || name,
          walletAddress,
        });

        // Store encrypted private key
        const encryptedKey = WalletService.encryptPrivateKey(
          walletInfo.privateKey,
          password
        );
        await db.query(
          "INSERT INTO wallet_keys (user_id, encrypted_key) VALUES ($1, $2)",
          [user.id, encryptedKey]
        );

        // Generate JWT
        const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
          expiresIn: jwtExpiresIn,
        });

        return res.status(201).json({
          message: "User registered successfully",
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            walletAddress: walletInfo.address,
          },
          token,
        });
      }

      // Create user (teacher - no wallet)
      const user = await User.create({
        email,
        passwordHash,
        role: userRole,
        fullName: fullName || name,
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

  /**
   * Register a new student with wallet and add to class
   * POST /api/auth/register-student
   * { email, password, classCode }
   */
  static async registerStudent(req, res, next) {
    const client = await db.connect();
    try {
      const { email, password, classCode } = req.body;

      // Validation
      if (!email || !password || !classCode) {
        return res
          .status(400)
          .json({ error: "Email, password, and classCode required" });
      }

      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Verify class exists
      const classResult = await client.query(
        "SELECT id, name, class_manager_address FROM classes WHERE class_id = $1",
        [classCode]
      );
      if (classResult.rows.length === 0) {
        return res.status(404).json({ error: "Class not found" });
      }
      const classId = classResult.rows[0].id;
      const contractAddress = classResult.rows[0].class_manager_address;

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Generate wallet
      const walletInfo = WalletService.generateWallet();

      // Create user with wallet
      const user = await User.create({
        email,
        passwordHash,
        role: "student",
        walletAddress: walletInfo.address,
      });

      // Encrypt and save private key
      const encryptedKey = WalletService.encryptPrivateKey(
        walletInfo.privateKey,
        password
      );
      await client.query(
        "INSERT INTO wallet_keys (user_id, encrypted_key) VALUES ($1, $2)",
        [user.id, encryptedKey]
      );

      // Add student to class
      await client.query(
        "INSERT INTO class_students (class_id, user_id) VALUES ($1, $2)",
        [classId, user.id]
      );

      // Whitelist on blockchain
      if (contractAddress) {
        try {
          await BlockchainService.addStudentToClass(
            contractAddress,
            classCode,
            walletInfo.address
          );
        } catch (error) {
          console.error("Failed to whitelist student on-chain:", error.message);
          // Continue anyway - DB is the source of truth
        }
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
        expiresIn: jwtExpiresIn,
      });

      res.status(201).json({
        message: "Student registered successfully",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          walletAddress: walletInfo.address,
        },
        walletInfo: {
          address: walletInfo.address,
          privateKey: walletInfo.privateKey,
          message:
            "This private key is shown only once. Save it securely. You will not be able to retrieve it again.",
        },
        token,
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Get private key (show once policy)
   * GET /api/auth/wallet-key
   * Body: { password }
   */
  static async getPrivateKey(req, res, next) {
    const client = await db.connect();
    try {
      const { password } = req.body;
      const userId = req.user.id;

      if (!password) {
        return res.status(400).json({ error: "Password required" });
      }

      // Verify password
      const user = await User.findById(userId);
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Check if private key was already shown
      const isShown = await WalletService.isPrivateKeyShown(client, userId);
      if (isShown) {
        return res.status(403).json({
          error:
            "Private key has already been shown once. Contact admin to reset.",
        });
      }

      // Get and decrypt private key
      const privateKey = await WalletService.getPrivateKeyIfNotShown(
        client,
        userId,
        password
      );

      if (!privateKey) {
        return res.status(403).json({
          error: "Private key has already been shown once.",
        });
      }

      res.json({
        walletAddress: user.wallet_address,
        privateKey,
        message:
          "This is your private key. Keep it safe. You will not be able to view it again.",
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }
}

module.exports = AuthController;
