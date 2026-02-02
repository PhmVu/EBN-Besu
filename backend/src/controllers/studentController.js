const Student = require("../models/Student");
const User = require("../models/User");
const WalletService = require("../services/walletService");
const BlockchainService = require("../services/blockchainService");
const { contractAddresses } = require("../config/blockchain");
const db = require("../config/database");

class StudentController {
  /**
   * Get student's wallet info (private key shown only once via GET /api/auth/wallet-key)
   */
  static async getMyWallet(req, res, next) {
    const client = await db.connect();
    try {
      const userId = req.user.id;

      // Get user and wallet info
      const user = await User.findById(userId);
      if (!user.wallet_address) {
        return res.status(404).json({
          error: "No wallet found. Please contact your teacher to be added to a class.",
        });
      }

      // Check if private key has been shown
      const isShown = await WalletService.isPrivateKeyShown(client, userId);

      res.json({
        walletAddress: user.wallet_address,
        privateKeyShown: isShown,
        message: isShown
          ? "Your private key was already shown once. Contact admin if you need to reset."
          : "Use POST /api/auth/wallet-key with your password to retrieve your private key (one time only).",
        warning: "Keep your private key secure! Never share it with anyone.",
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Get student's classes
   */
  static async getMyClasses(req, res, next) {
    const client = await db.connect();
    try {
      const userId = req.user.id;

      const result = await client.query(
        `SELECT c.id, c.class_id, c.name, c.description, c.status, 
                c.class_manager_address, c.score_manager_address,
                u.email as teacher_email, s.enrolled_at
         FROM students s
         JOIN classes c ON s.class_id = c.id
         JOIN users u ON c.teacher_id = u.id
         WHERE s.user_id = $1
         ORDER BY s.enrolled_at DESC`,
        [userId]
      );

      res.json({
        classes: result.rows,
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Get student's scores
   */
  static async getMyScores(req, res, next) {
    const client = await db.connect();
    try {
      const userId = req.user.id;
      const { classId } = req.query;

      // Get user wallet
      const user = await User.findById(userId);
      if (!user.wallet_address) {
        return res.json({ scores: [] });
      }

      // Get scores from database
            let query = `SELECT sc.id, sc.score, sc.recorded_at, sc.transaction_hash,
                 a.id as assignment_id, a.title,
                 c.id as class_id, c.class_id as class_code, c.name as class_name,
                 s.wallet_address
               FROM scores sc
               JOIN students s ON sc.student_id = s.id
               JOIN assignments a ON sc.assignment_id = a.id
               JOIN classes c ON sc.class_id = c.id
               WHERE s.user_id = $1`;
      const params = [userId];

      if (classId) {
        query += " AND (c.id::text = $2 OR c.class_id = $2)";
        params.push(String(classId));
      }

      query += " ORDER BY sc.recorded_at DESC";

      const result = await client.query(query, params);

      res.json({
        scores: result.rows,
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }
}

module.exports = StudentController;
