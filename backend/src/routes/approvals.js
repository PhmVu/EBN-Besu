const express = require("express");
const router = express.Router();
const ApprovalController = require("../controllers/approvalController");
const { verifyToken, authorizeTeacher, authorizeStudent } = require("../middleware/auth");

// Student: Request approval to join class
router.post(
  "/classes/:classId/request-approval",
  verifyToken,
  authorizeStudent,
  ApprovalController.requestApproval
);

// Student: Check my approval status
router.get(
  "/classes/:classId/my-approval-status",
  verifyToken,
  authorizeStudent,
  ApprovalController.getMyApprovalStatus
);

// Teacher: Get pending approvals for class
router.get(
  "/classes/:classId/approvals",
  verifyToken,
  authorizeTeacher,
  ApprovalController.getPendingApprovals
);

// Teacher: Approve student + whitelist on-chain
router.post(
  "/approvals/:approvalId/approve",
  verifyToken,
  authorizeTeacher,
  ApprovalController.approveStudent
);

// Teacher: Reject student
router.post(
  "/approvals/:approvalId/reject",
  verifyToken,
  authorizeTeacher,
  ApprovalController.rejectStudent
);

module.exports = router;
