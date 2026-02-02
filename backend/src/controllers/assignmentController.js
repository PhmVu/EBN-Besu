const db = require("../config/database");

class AssignmentController {
  /**
   * Create a new assignment (teacher only)
   * POST /api/classes/:classId/assignments
   */
  static async createAssignment(req, res, next) {
    const client = await db.connect();
    try {
      const { classId } = req.params;
      const { title, description, deadline, assignment_code } = req.body;
      const teacherId = req.user.id;

      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      // Verify teacher owns this class
      const classResult = await client.query(
        "SELECT id, teacher_id FROM classes WHERE id = $1",
        [classId]
      );

      if (classResult.rows.length === 0) {
        return res.status(404).json({ error: "Class not found" });
      }

      const { teacher_id } = classResult.rows[0];
      if (teacher_id !== teacherId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Create assignment
      const result = await client.query(
        `INSERT INTO assignments (class_id, assignment_code, title, description, deadline)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, class_id, assignment_code, title, description, deadline, created_at`,
        [classId, assignment_code || null, title, description, deadline || null]
      );

      res.status(201).json({
        message: "Assignment created successfully",
        assignment: result.rows[0],
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Get all assignments for a class
   * GET /api/classes/:classId/assignments
   */
  static async getAssignments(req, res, next) {
    const client = await db.connect();
    try {
      const { classId } = req.params;

      const result = await client.query(
        `SELECT id, class_id, assignment_code, title, description, deadline, created_at
         FROM assignments
         WHERE class_id = $1
         ORDER BY created_at DESC`,
        [classId]
      );

      res.json({
        assignments: result.rows,
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Get assignment by ID
   * GET /api/assignments/:assignmentId
   */
  static async getAssignmentById(req, res, next) {
    const client = await db.connect();
    try {
      const { assignmentId } = req.params;

      const result = await client.query(
        `SELECT id, class_id, assignment_code, title, description, deadline, created_at
         FROM assignments
         WHERE id = $1`,
        [assignmentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Update assignment (teacher only)
   * PUT /api/assignments/:assignmentId
   */
  static async updateAssignment(req, res, next) {
    const client = await db.connect();
    try {
      const { assignmentId } = req.params;
      const { title, description, deadline, assignment_code } = req.body;
      const teacherId = req.user.id;

      // Get assignment and verify teacher owns it
      const assignmentResult = await client.query(
        `SELECT a.id, c.teacher_id
         FROM assignments a
         JOIN classes c ON a.class_id = c.id
         WHERE a.id = $1`,
        [assignmentId]
      );

      if (assignmentResult.rows.length === 0) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      if (assignmentResult.rows[0].teacher_id !== teacherId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Update assignment
      const result = await client.query(
        `UPDATE assignments
         SET assignment_code = COALESCE($1, assignment_code),
             title = COALESCE($2, title),
             description = COALESCE($3, description),
             deadline = COALESCE($4, deadline),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING id, class_id, assignment_code, title, description, deadline, created_at, updated_at`,
        [assignment_code, title, description, deadline, assignmentId]
      );

      res.json({
        message: "Assignment updated successfully",
        assignment: result.rows[0],
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Delete assignment (teacher only)
   * DELETE /api/assignments/:assignmentId
   */
  static async deleteAssignment(req, res, next) {
    const client = await db.connect();
    try {
      const { assignmentId } = req.params;
      const teacherId = req.user.id;

      // Get assignment and verify teacher owns it
      const assignmentResult = await client.query(
        `SELECT a.id, c.teacher_id
         FROM assignments a
         JOIN classes c ON a.class_id = c.id
         WHERE a.id = $1`,
        [assignmentId]
      );

      if (assignmentResult.rows.length === 0) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      if (assignmentResult.rows[0].teacher_id !== teacherId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Delete assignment (cascade delete submissions)
      await client.query("DELETE FROM assignments WHERE id = $1", [assignmentId]);

      res.json({
        message: "Assignment deleted successfully",
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }
}

module.exports = AssignmentController;
