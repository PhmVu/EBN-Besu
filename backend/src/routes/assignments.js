const express = require("express");
const router = express.Router();
const AssignmentController = require("../controllers/assignmentController");
const { verifyToken, authorizeTeacher } = require("../middleware/auth");

// Create assignment (teacher only)
router.post(
  "/classes/:classId/assignments",
  verifyToken,
  authorizeTeacher,
  AssignmentController.createAssignment
);

// Get all assignments for a class
router.get(
  "/classes/:classId/assignments",
  verifyToken,
  AssignmentController.getAssignments
);

// Get assignment by ID
router.get(
  "/assignments/:assignmentId",
  verifyToken,
  AssignmentController.getAssignmentById
);

// Update assignment (teacher only)
router.put(
  "/assignments/:assignmentId",
  verifyToken,
  authorizeTeacher,
  AssignmentController.updateAssignment
);

// Delete assignment (teacher only)
router.delete(
  "/assignments/:assignmentId",
  verifyToken,
  authorizeTeacher,
  AssignmentController.deleteAssignment
);

module.exports = router;
