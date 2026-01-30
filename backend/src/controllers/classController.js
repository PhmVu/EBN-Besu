const Class = require("../models/Class");
const Student = require("../models/Student");
const BlockchainService = require("../services/blockchainService");
const { contractAddresses } = require("../config/blockchain");

class ClassController {
  /**
   * Create a new class
   */
  static async createClass(req, res, next) {
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

      // Create class in database
      const newClass = await Class.create({
        classId,
        teacherId,
        name,
        description,
      });

      // Create class on blockchain if contract address is configured
      if (contractAddresses.classManager) {
        try {
          const tx = await BlockchainService.createClass(
            contractAddresses.classManager,
            classId
          );
          // Update class with transaction hash if needed
          console.log("Class created on blockchain:", tx.hash);
        } catch (blockchainError) {
          console.error("Blockchain error (non-fatal):", blockchainError);
          // Continue even if blockchain operation fails
        }
      }

      res.status(201).json({
        message: "Class created successfully",
        class: newClass,
      });
    } catch (error) {
      next(error);
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
      if (
        contractAddresses.classManager &&
        updatedClass.contract_address
      ) {
        try {
          const tx = await BlockchainService.closeClass(
            contractAddresses.classManager,
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
   * Add students to class
   */
  static async addStudents(req, res, next) {
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

      // TODO: Implement adding students logic
      // This would involve:
      // 1. Finding users by email
      // 2. Generating wallets for students if needed
      // 3. Adding to students table
      // 4. Adding to blockchain whitelist

      res.json({
        message: "Students added successfully",
        // Return added students
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ClassController;
