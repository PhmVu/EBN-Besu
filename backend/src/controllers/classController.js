const Class = require("../models/Class");
const Student = require("../models/Student");
const User = require("../models/User");
const BlockchainService = require("../services/blockchainService");
const WalletService = require("../services/walletService");
const { contractAddresses } = require("../config/blockchain");
const db = require("../config/database");

class ClassController {
  /**
   * Create a new class and deploy ClassManager + ScoreManager contracts
   */
  static async createClass(req, res, next) {
    const client = await db.connect();
    try {
      const { classId, name, description } = req.body;
      const teacherId = req.user.id;

      if (!classId || !name) {
        return res
          .status(400)
          .json({ error: "Class ID and name are required" });
      }

      // Check if class ID already exists
      const existingClass = await Class.findByClassId(classId);
      if (existingClass) {
        return res.status(400).json({ error: "Class ID already exists" });
      }

      // Use shared contract addresses from environment
      const classManagerAddress = process.env.CLASS_MANAGER_ADDRESS;
      const scoreManagerAddress = process.env.SCORE_MANAGER_ADDRESS;

      if (!classManagerAddress || !scoreManagerAddress) {
        return res.status(400).json({
          error: "Smart contracts not deployed yet. CLASS_MANAGER_ADDRESS and SCORE_MANAGER_ADDRESS must be set.",
        });
      }

      console.log(`Using shared contracts for class ${classId}:`, {
        classManager: classManagerAddress,
        scoreManager: scoreManagerAddress,
      });

      // Call smart contract to create class on-chain
      let onChainTxHash = null;
      try {
        const tx = await BlockchainService.createClassOnChain(
          classManagerAddress,
          classId,
          name
        );
        onChainTxHash = tx.transactionHash;
        console.log(`Class ${classId} created on-chain. TxHash: ${onChainTxHash}`);
      } catch (blockchainError) {
        console.error("Failed to create class on-chain:", blockchainError.message);
        return res.status(500).json({
          error: "Failed to create class on blockchain: " + blockchainError.message,
        });
      }

      // Create class in database with contract addresses
      const newClass = await Class.create({
        classId,
        teacherId,
        name,
        description,
        contractAddress: classManagerAddress,
      });

      // Update class with contract addresses
      await client.query(
        "UPDATE classes SET class_manager_address = $1, score_manager_address = $2 WHERE id = $3",
        [classManagerAddress, scoreManagerAddress, newClass.id]
      );

      res.status(201).json({
        message: "Class created successfully",
        class: {
          ...newClass,
          class_manager_address: classManagerAddress,
          score_manager_address: scoreManagerAddress,
        },
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Get all classes for teacher
   */
  static async getClasses(req, res, next) {
    try {
      const teacherId = req.user.id;
      const classes = await Class.findByTeacher(teacherId);
      res.json(classes);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get class by ID
   */
  static async getClassById(req, res, next) {
    try {
      const { id } = req.params;
      const classData = await Class.findById(id);

      if (!classData) {
        return res.status(404).json({ error: "Class not found" });
      }

      // Verify teacher owns this class
      if (classData.teacher_id !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get students in this class
      const students = await Student.findByClass(id);

      res.json({
        ...classData,
        students,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Close a class
   */
  static async closeClass(req, res, next) {
    try {
      const { id } = req.params;
      const classData = await Class.findById(id);

      if (!classData) {
        return res.status(404).json({ error: "Class not found" });
      }

      // Verify teacher owns this class
      if (classData.teacher_id !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (classData.status === "closed") {
        return res.status(400).json({ error: "Class is already closed" });
      }

      // Close class in database
      const updatedClass = await Class.closeClass(id);

      // Close class on blockchain
      if (updatedClass.class_manager_address) {
        try {
          const tx = await BlockchainService.closeClass(
            updatedClass.class_manager_address,
            updatedClass.class_id
          );
          console.log("Class closed on blockchain:", tx.hash);
        } catch (blockchainError) {
          console.error("Blockchain error (non-fatal):", blockchainError);
        }
      }

      res.json({
        message: "Class closed successfully",
        class: updatedClass,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add students to class (manual enrollment by teacher)
   * Creates pending approval records - students must request approval
   * Teacher will then review + approve + sign TX
   */
  static async addStudents(req, res, next) {
    const client = await db.connect();
    try {
      const { id } = req.params;
      const { studentEmails } = req.body; // Array of email addresses

      const classData = await Class.findById(id);
      if (!classData) {
        return res.status(404).json({ error: "Class not found" });
      }

      // Verify teacher owns this class
      if (classData.teacher_id !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (classData.status === "closed") {
        return res.status(400).json({ error: "Cannot add students to closed class" });
      }

      if (!Array.isArray(studentEmails) || studentEmails.length === 0) {
        return res.status(400).json({ error: "Student emails array required" });
      }

      const created = [];
      const skipped = [];
      const bcrypt = require("bcrypt");

      // Process each email
      for (const email of studentEmails) {
        try {
          // Check if user exists
          let user = await User.findByEmail(email);

          if (!user) {
            // Create new student user with random password
            const randomPassword = Math.random().toString(36).slice(-12);
            const passwordHash = await bcrypt.hash(randomPassword, 10);

            user = await User.create({
              email,
              passwordHash,
              role: "student",
            });
          }

          // Generate wallet if user doesn't have one
          if (!user.wallet_address) {
            const walletInfo = WalletService.generateWallet();
            const encryptedKey = WalletService.encryptPrivateKey(
              walletInfo.privateKey,
              "default"
            );

            // Update user wallet
            await User.updateWallet(user.id, walletInfo.address);

            // Save encrypted key
            await client.query(
              "INSERT INTO wallet_keys (user_id, encrypted_key) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET encrypted_key = $2",
              [user.id, encryptedKey]
            );

            user.wallet_address = walletInfo.address;
          }

          // CHANGED: Create pending approval instead of instant whitelist
          // Check if already has pending or approved approval
          const existingApproval = await client.query(
            "SELECT id, status FROM student_approvals WHERE class_id = $1 AND student_id = $2",
            [id, user.id]
          );

          if (existingApproval.rows.length > 0) {
            const { status } = existingApproval.rows[0];
            skipped.push({ 
              email, 
              reason: `Already has ${status} approval request` 
            });
            continue;
          }

          // Create pending approval record
          const approvalResult = await client.query(
            `INSERT INTO student_approvals (class_id, student_id, wallet_address, status)
             VALUES ($1, $2, $3, 'PENDING')
             RETURNING id, status, requested_at`,
            [id, user.id, user.wallet_address]
          );

          created.push({
            email,
            walletAddress: user.wallet_address,
            approvalId: approvalResult.rows[0].id,
            status: "PENDING",
            message: "Waiting for student to request approval"
          });
        } catch (error) {
          skipped.push({ email, reason: error.message });
        }
      }

      res.json({
        message: "Students added to class. Approval workflow initiated.",
        info: "Students will request approval, then teacher will review and approve each one.",
        created,
        skipped,
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Get class statistics (teacher only)
   * GET /api/classes/:id/statistics
   */
  static async getClassStatistics(req, res, next) {
    const client = await db.connect();
    try {
      const { id } = req.params;

      const classResult = await client.query(
        "SELECT id, class_id, name, teacher_id FROM classes WHERE id = $1",
        [id]
      );

      if (classResult.rows.length === 0) {
        return res.status(404).json({ error: "Class not found" });
      }

      const classInfo = classResult.rows[0];

      if (classInfo.teacher_id !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const statsResult = await client.query(
        `SELECT
            (SELECT COUNT(*) FROM students WHERE class_id = $1) AS total_students,
            (SELECT COUNT(*) FROM assignments WHERE class_id = $1) AS total_assignments,
            (SELECT COUNT(*)
             FROM submissions s
             JOIN assignments a ON s.assignment_id = a.id
             WHERE a.class_id = $1) AS total_submissions,
            (SELECT COUNT(*) FROM scores WHERE class_id = $1) AS graded_submissions,
            (SELECT AVG(score) FROM scores WHERE class_id = $1) AS average_score,
            (SELECT MIN(score) FROM scores WHERE class_id = $1) AS min_score,
            (SELECT MAX(score) FROM scores WHERE class_id = $1) AS max_score`,
        [id]
      );

      const stats = statsResult.rows[0];
      const totalSubmissions = Number(stats.total_submissions || 0);
      const gradedSubmissions = Number(stats.graded_submissions || 0);

      res.json({
        class: {
          id: classInfo.id,
          class_id: classInfo.class_id,
          name: classInfo.name,
        },
        totals: {
          students: Number(stats.total_students || 0),
          assignments: Number(stats.total_assignments || 0),
        },
        submissions: {
          total: totalSubmissions,
          graded: gradedSubmissions,
          pending: Math.max(totalSubmissions - gradedSubmissions, 0),
        },
        scores: {
          average: stats.average_score === null ? null : Number(stats.average_score),
          min: stats.min_score === null ? null : Number(stats.min_score),
          max: stats.max_score === null ? null : Number(stats.max_score),
        },
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }
}

module.exports = ClassController;
