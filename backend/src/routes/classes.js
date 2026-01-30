const express = require("express");
const router = express.Router();
const ClassController = require("../controllers/classController");
const { authenticate, requireTeacher } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// Teacher-only routes
router.post("/", requireTeacher, ClassController.createClass);
router.get("/", requireTeacher, ClassController.getClasses);
router.get("/:id", requireTeacher, ClassController.getClassById);
router.post("/:id/close", requireTeacher, ClassController.closeClass);
router.post("/:id/students", requireTeacher, ClassController.addStudents);

module.exports = router;
