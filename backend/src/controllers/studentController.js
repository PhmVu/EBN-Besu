const Student = require("../models/Student");
const User = require("../models/User");
const BlockchainService = require("../services/blockchainService");
const { contractAddresses } = require("../config/blockchain");

class StudentController {
  /**
   * Get student's wallet info (private key shown only once)
   */
  static async getMyWallet(req, res, next) {
    try {
      const userId = req.user.id;

      // Find student records for this user
      const studentRecords = await Student.findByUser(userId);

      if (studentRecords.length === 0) {
        return res.status(404).json({
          error: "No wallet found. Please contact your teacher to be added to a class.",
        });
      }

      // Get the first student record (assuming one wallet per student)
      const studentRecord = studentRecords[0];

      // Return wallet address and private key (if available)
      // Note: In production, implement a "shown once" flag
      res.json({
        walletAddress: studentRecord.wallet_address,
        privateKey: studentRecord.private_key_encrypted
          ? "Decrypt using your password"
          : null,
        warning:
          "Keep your private key secure! Never share it with anyone.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student's classes
   */
  static async getMyClasses(req, res, next) {
    try {
      const userId = req.user.id;
      const classes = await Student.findByUser(userId);
      res.json(classes);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student's scores
   */
  static async getMyScores(req, res, next) {
    try {
      const userId = req.user.id;
      const { classId } = req.query;

      // Get student records
      const studentRecords = await Student.findByUser(userId);

      if (studentRecords.length === 0) {
        return res.json([]);
      }

      const scores = [];

      // Get scores from blockchain for each class
      if (contractAddresses.scoreManager) {
        for (const record of studentRecords) {
          if (classId && record.class_id !== classId) {
            continue;
          }

          try {
            const scoreInfo = await BlockchainService.getStudentScore(
              contractAddresses.scoreManager,
              record.class_id,
              record.wallet_address
            );

            scores.push({
              classId: record.class_id,
              className: record.class_name,
              walletAddress: record.wallet_address,
              score: scoreInfo.score?.toString() || "0",
              recordedAt: scoreInfo.recordedAt?.toString() || null,
            });
          } catch (error) {
            console.error("Error fetching score:", error);
            // Continue with other classes
          }
        }
      }

      res.json(scores);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = StudentController;
