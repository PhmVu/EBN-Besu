const express = require("express");
const router = express.Router();
const StudentController = require("../controllers/studentController");
const { authenticate, requireStudent } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);
router.use(requireStudent);

router.get("/my-wallet", StudentController.getMyWallet);
router.get("/my-classes", StudentController.getMyClasses);
router.get("/my-scores", StudentController.getMyScores);

module.exports = router;
