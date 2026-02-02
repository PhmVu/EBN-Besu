const db = require("../config/database");
const User = require("../models/User");
const BlockchainService = require("../services/blockchainService");
const { ethers } = require("ethers");
const { provider } = require("../config/blockchain");
const bcrypt = require("bcrypt");

class ApprovalController {
  /**
   * Student request approval to join class
   * POST /api/classes/:classId/request-approval
   * Body: { }
   * - Student tạo pending approval record
   * - Teacher sẽ review + approve sau
   */
  static async requestApproval(req, res, next) {
    const client = await db.connect();
    try {
      const { classId } = req.params;
      const studentId = req.user.id;

      // Verify class exists
      const classResult = await client.query(
        "SELECT id, name, teacher_id FROM classes WHERE id = $1",
        [classId]
      );

      if (classResult.rows.length === 0) {
        return res.status(404).json({ error: "Class not found" });
      }

      // Get student wallet
      const student = await User.findById(studentId);
      if (!student.wallet_address) {
        return res.status(400).json({
          error: "Wallet not created. Please register first.",
        });
      }

      // Check if already requested or approved
      const existing = await client.query(
        "SELECT id, status FROM student_approvals WHERE class_id = $1 AND student_id = $2",
        [classId, studentId]
      );

      if (existing.rows.length > 0) {
        const { status } = existing.rows[0];
        if (status === "APPROVED") {
          return res
            .status(400)
            .json({ error: "Already approved for this class" });
        }
        if (status === "PENDING") {
          return res
            .status(400)
            .json({ error: "Already requested approval. Waiting for teacher review." });
        }
      }

      // Create approval request (PENDING status)
      const result = await client.query(
        `INSERT INTO student_approvals (class_id, student_id, wallet_address, status)
         VALUES ($1, $2, $3, 'PENDING')
         RETURNING id, class_id, student_id, wallet_address, status, requested_at`,
        [classId, studentId, student.wallet_address]
      );

      res.status(201).json({
        message: "Approval request submitted. Waiting for teacher review.",
        approval: result.rows[0],
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Teacher: Get pending approvals for a class
   * GET /api/classes/:classId/approvals?status=PENDING
   * - Teacher xem danh sách sinh viên đang chờ approve
   */
  static async getPendingApprovals(req, res, next) {
    const client = await db.connect();
    try {
      const { classId } = req.params;
      const { status = "PENDING" } = req.query;
      const teacherId = req.user.id;

      // Verify teacher owns this class
      const classResult = await client.query(
        "SELECT id, teacher_id FROM classes WHERE id = $1",
        [classId]
      );

      if (classResult.rows.length === 0) {
        return res.status(404).json({ error: "Class not found" });
      }

      if (classResult.rows[0].teacher_id !== teacherId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get approval requests with specified status
      const result = await client.query(
        `SELECT a.id, a.class_id, a.student_id, u.email, u.wallet_address,
                a.wallet_address as approval_wallet, a.status, a.requested_at,
                a.reviewed_at, a.rejection_reason
         FROM student_approvals a
         JOIN users u ON a.student_id = u.id
         WHERE a.class_id = $1 AND a.status = $2
         ORDER BY a.requested_at ASC`,
        [classId, status]
      );

      res.json({
        status,
        count: result.rows.length,
        approvals: result.rows,
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Teacher: Approve student + sign TX to whitelist on-chain
   * POST /api/approvals/:approvalId/approve
   * Body: { password }
   * - Teacher nhập password
   * - Backend verify password → recover teacher's signer
   * - Call ClassManager.addStudent(studentAddress) ← signed by teacher
   * - Update approval record: status=APPROVED, tx_hash, reviewed_at
   */
  static async approveStudent(req, res, next) {
    const client = await db.connect();
    try {
      const { approvalId } = req.params;
      const { password } = req.body;
      const teacherId = req.user.id;

      if (!password) {
        return res.status(400).json({ error: "Password required" });
      }

      // Get approval record
      const approvalResult = await client.query(
        `SELECT a.id, a.class_id, a.student_id, a.status, a.wallet_address,
                c.class_id as class_code, c.class_manager_address
         FROM student_approvals a
         JOIN classes c ON a.class_id = c.id
         WHERE a.id = $1`,
        [approvalId]
      );

      if (approvalResult.rows.length === 0) {
        return res.status(404).json({ error: "Approval request not found" });
      }

      const approval = approvalResult.rows[0];

      // Verify teacher owns this class
      const classResult = await client.query(
        "SELECT teacher_id FROM classes WHERE id = $1",
        [approval.class_id]
      );

      if (classResult.rows[0].teacher_id !== teacherId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if already processed
      if (approval.status !== "PENDING") {
        return res.status(400).json({
          error: `Approval is already ${approval.status.toLowerCase()}`,
        });
      }

      // Verify teacher password
      const teacher = await User.findById(teacherId);
      const isValid = await bcrypt.compare(password, teacher.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Execute on-chain whitelist
      let txHash = null;
      if (approval.class_manager_address) {
        try {
          // Call BlockchainService to whitelist student
          // This uses admin wallet temporarily (in production, teacher would sign)
          const tx = await BlockchainService.addStudentToClass(
            approval.class_manager_address,
            approval.class_code,
            approval.wallet_address
          );
          txHash = tx.transactionHash;

          console.log(`Student ${approval.wallet_address} whitelisted in TX: ${txHash}`);
        } catch (blockchainError) {
          console.error("Failed to whitelist on-chain:", blockchainError.message);
          return res.status(500).json({
            error: "Failed to execute on-chain: " + blockchainError.message,
          });
        }
      }

      // Update approval record
      const updateResult = await client.query(
        `UPDATE student_approvals
         SET status = 'APPROVED', reviewed_by = $1, reviewed_at = NOW(), tx_hash = $2
         WHERE id = $3
         RETURNING id, class_id, student_id, status, reviewed_at, tx_hash`,
        [teacherId, txHash, approvalId]
      );

      // Add student to students table (enroll in class)
      const student = await User.findById(approval.student_id);
      try {
        await client.query(
          `INSERT INTO students (class_id, user_id, wallet_address)
           VALUES ($1, $2, $3)
           ON CONFLICT (class_id, user_id) DO NOTHING`,
          [approval.class_id, approval.student_id, student.wallet_address]
        );
      } catch (err) {
        console.error("Failed to enroll student:", err.message);
        // Don't fail if student enrollment fails, approval is still successful
      }

      res.json({
        message: "Student approved and whitelisted on-chain",
        approval: updateResult.rows[0],
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Teacher: Reject student approval request
   * POST /api/approvals/:approvalId/reject
   * Body: { password, reason }
   * - Teacher reject + provide reason
   */
  static async rejectStudent(req, res, next) {
    const client = await db.connect();
    try {
      const { approvalId } = req.params;
      const { password, reason } = req.body;
      const teacherId = req.user.id;

      if (!password) {
        return res.status(400).json({ error: "Password required" });
      }

      // Get approval record
      const approvalResult = await client.query(
        `SELECT a.id, a.class_id, a.status
         FROM student_approvals a
         WHERE a.id = $1`,
        [approvalId]
      );

      if (approvalResult.rows.length === 0) {
        return res.status(404).json({ error: "Approval request not found" });
      }

      const approval = approvalResult.rows[0];

      // Verify teacher owns this class
      const classResult = await client.query(
        "SELECT teacher_id FROM classes WHERE id = $1",
        [approval.class_id]
      );

      if (classResult.rows[0].teacher_id !== teacherId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (approval.status !== "PENDING") {
        return res.status(400).json({
          error: `Approval is already ${approval.status.toLowerCase()}`,
        });
      }

      // Verify teacher password
      const teacher = await User.findById(teacherId);
      const isValid = await bcrypt.compare(password, teacher.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Update approval record
      const updateResult = await client.query(
        `UPDATE student_approvals
         SET status = 'REJECTED', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2
         WHERE id = $3
         RETURNING id, class_id, student_id, status, reviewed_at, rejection_reason`,
        [teacherId, reason || "No reason provided", approvalId]
      );

      res.json({
        message: "Approval request rejected",
        approval: updateResult.rows[0],
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Student: Check approval status
   * GET /api/classes/:classId/my-approval-status
   */
  static async getMyApprovalStatus(req, res, next) {
    const client = await db.connect();
    try {
      const { classId } = req.params;
      const studentId = req.user.id;

      const result = await client.query(
        `SELECT id, class_id, status, requested_at, reviewed_at, 
                rejection_reason, tx_hash
         FROM student_approvals
         WHERE class_id = $1 AND student_id = $2`,
        [classId, studentId]
      );

      if (result.rows.length === 0) {
        return res.json({
          status: "NOT_REQUESTED",
          message: "You haven't requested approval for this class yet.",
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }
}

module.exports = ApprovalController;
