const express = require("express");
const router = express.Router();
const SubmissionController = require("../controllers/submissionController");
const { verifyToken, authorizeTeacher, authorizeStudent } = require("../middleware/auth");

// Submit assignment (student only)
router.post(
  "/assignments/:assignmentId/submit",
  verifyToken,
  authorizeStudent,
  SubmissionController.submitAssignment
);

// Get submissions for assignment (teacher only)
router.get(
  "/assignments/:assignmentId/submissions",
  verifyToken,
  authorizeTeacher,
  SubmissionController.getSubmissions
);

// Record score (teacher only)
router.post(
  "/assignments/:assignmentId/submissions/:studentId/score",
  verifyToken,
  authorizeTeacher,
  SubmissionController.recordScore
);

// Get my submission (student)
router.get(
  "/assignments/:assignmentId/my-submission",
  verifyToken,
  authorizeStudent,
  SubmissionController.getMySubmission
);

module.exports = router;
