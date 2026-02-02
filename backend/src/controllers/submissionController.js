const db = require("../config/database");
const BlockchainService = require("../services/blockchainService");
const { ethers } = require("ethers");
const { provider } = require("../config/blockchain");

class SubmissionController {
  /**
   * Submit assignment (student only)
   * POST /api/assignments/:assignmentId/submit
   * Body: { assignmentHash }
   */
  static async submitAssignment(req, res, next) {
    const client = await db.connect();
    try {
      const { assignmentId } = req.params;
      const { assignmentHash } = req.body;
      const userId = req.user.id;

      if (!assignmentHash) {
        return res.status(400).json({ error: "Assignment hash is required" });
      }

      // Get assignment and class info
      const assignmentResult = await client.query(
        `SELECT a.id, a.class_id, c.score_manager_address, c.class_id as class_code
         FROM assignments a
         JOIN classes c ON a.class_id = c.id
         WHERE a.id = $1`,
        [assignmentId]
      );

      if (assignmentResult.rows.length === 0) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      const { class_id, score_manager_address, class_code } =
        assignmentResult.rows[0];

      // Get student enrollment record (students table ID and wallet)
      const studentEnrollmentResult = await client.query(
        `SELECT s.id as student_id, s.wallet_address
         FROM students s
         WHERE s.user_id = $1 AND s.class_id = $2`,
        [userId, class_id]
      );

      if (studentEnrollmentResult.rows.length === 0) {
        return res.status(400).json({
          error: "Student not enrolled in this class. Request approval first.",
        });
      }

      const { student_id, wallet_address } =
        studentEnrollmentResult.rows[0];

      // Check if already submitted
      const existingSubmission = await client.query(
        "SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2",
        [assignmentId, student_id]
      );

      if (existingSubmission.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Assignment already submitted by this student" });
      }

      // Submit on blockchain
      let txHash = null;
      if (score_manager_address) {
        try {
          // Create a temporary wallet for signing (using student address)
          // In production, we'd need the student's private key
          const tempWallet = new ethers.Wallet(
            ethers.zeroPadValue(userId, 32), // Placeholder
            provider
          );

          const tx = await BlockchainService.submitAssignment(
            score_manager_address,
            class_code,
            assignmentHash,
            tempWallet
          );
          txHash = tx.transactionHash;
        } catch (blockchainError) {
          console.error("Failed to submit on blockchain:", blockchainError.message);
          // Continue anyway - DB is source of truth
        }
      }

      // Save submission to database
      const result = await client.query(
        `INSERT INTO submissions (assignment_id, student_id, assignment_hash, transaction_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id, assignment_id, student_id, assignment_hash, transaction_hash, submitted_at`,
        [assignmentId, student_id, assignmentHash, txHash]
      );

      res.status(201).json({
        message: "Assignment submitted successfully",
        submission: result.rows[0],
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Get submissions for an assignment (teacher only)
   * GET /api/assignments/:assignmentId/submissions
   */
  static async getSubmissions(req, res, next) {
    const client = await db.connect();
    try {
      const { assignmentId } = req.params;
      const teacherId = req.user.id;

      // Verify teacher owns this assignment's class
      const classResult = await client.query(
        `SELECT c.id
         FROM classes c
         JOIN assignments a ON c.id = a.class_id
         WHERE a.id = $1 AND c.teacher_id = $2`,
        [assignmentId, teacherId]
      );

      if (classResult.rows.length === 0) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get submissions
      const result = await client.query(
        `SELECT s.id, s.assignment_id, s.student_id, u.email, s.assignment_hash,
                s.transaction_hash, s.submitted_at
         FROM submissions s
         JOIN students st ON s.student_id = st.id
         JOIN users u ON st.user_id = u.id
         WHERE s.assignment_id = $1
         ORDER BY s.submitted_at DESC`,
        [assignmentId]
      );

      res.json({
        submissions: result.rows,
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Record score for a student's submission (teacher only)
   * POST /api/assignments/:assignmentId/submissions/:studentId/score
   * Body: { score }
   */
  static async recordScore(req, res, next) {
    const client = await db.connect();
    try {
      const { assignmentId, studentId } = req.params;
      const { score } = req.body;
      const teacherId = req.user.id;

      if (typeof score !== "number" || score < 0) {
        return res.status(400).json({ error: "Valid score is required (0-100)" });
      }

      // Verify teacher owns this assignment's class and get contract address
      const classResult = await client.query(
        `SELECT c.id, c.score_manager_address, c.class_id as class_code
         FROM classes c
         JOIN assignments a ON c.id = a.class_id
         WHERE a.id = $1 AND c.teacher_id = $2`,
        [assignmentId, teacherId]
      );

      if (classResult.rows.length === 0) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { score_manager_address, class_code } = classResult.rows[0];

      // Get student wallet address
      const studentResult = await client.query(
        "SELECT wallet_address FROM students WHERE id = $1",
        [studentId]
      );

      if (studentResult.rows.length === 0) {
        return res.status(404).json({ error: "Student not found" });
      }

      const { wallet_address } = studentResult.rows[0];

      // Record score on blockchain
      let txHash = null;
      if (score_manager_address) {
        try {
          const tx = await BlockchainService.recordScore(
            score_manager_address,
            class_code,
            wallet_address,
            score
          );
          txHash = tx.transactionHash;
        } catch (blockchainError) {
          console.error("Failed to record score on blockchain:", blockchainError.message);
          // Continue anyway
        }
      }

      // Save score to database
      const scoreResult = await client.query(
        `INSERT INTO scores (class_id, assignment_id, student_id, score, transaction_hash)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (assignment_id, student_id)
         DO UPDATE SET
           score = EXCLUDED.score,
           transaction_hash = COALESCE(EXCLUDED.transaction_hash, scores.transaction_hash),
           recorded_at = NOW()
         RETURNING id, class_id, assignment_id, student_id, score, recorded_at, transaction_hash`,
        [classResult.rows[0].id, assignmentId, studentId, score, txHash]
      );

      const submissionResult = await client.query(
        `UPDATE submissions 
         SET transaction_hash = COALESCE($1, transaction_hash)
         WHERE assignment_id = $2 AND student_id = $3
         RETURNING *`,
        [txHash, assignmentId, studentId]
      );

      res.json({
        message: "Score recorded successfully",
        score: scoreResult.rows[0],
        submission: submissionResult.rows[0],
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Get student's submission
   * GET /api/assignments/:assignmentId/my-submission
   */
  static async getMySubmission(req, res, next) {
    const client = await db.connect();
    try {
      const { assignmentId } = req.params;
      const userId = req.user.id;

      // Get assignment's class
      const assignmentResult = await client.query(
        "SELECT class_id FROM assignments WHERE id = $1",
        [assignmentId]
      );

      if (assignmentResult.rows.length === 0) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      const { class_id } = assignmentResult.rows[0];

      // Get student enrollment record
      const studentResult = await client.query(
        "SELECT id FROM students WHERE user_id = $1 AND class_id = $2",
        [userId, class_id]
      );

      if (studentResult.rows.length === 0) {
        return res
          .status(400)
          .json({ error: "Student not enrolled in this class" });
      }

      const { id: studentId } = studentResult.rows[0];

      const result = await client.query(
        `SELECT id, assignment_id, student_id, assignment_hash, transaction_hash, submitted_at
         FROM submissions
         WHERE assignment_id = $1 AND student_id = $2`,
        [assignmentId, studentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "No submission found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }
}

module.exports = SubmissionController;
