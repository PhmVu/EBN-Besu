const pool = require("../config/database");

class Student {
  static async create(studentData) {
    const { classId, userId, walletAddress, privateKeyEncrypted = null } = studentData;
    const result = await pool.query(
      `INSERT INTO students (class_id, user_id, wallet_address, private_key_encrypted)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [classId, userId, walletAddress, privateKeyEncrypted]
    );
    return result.rows[0];
  }

  static async findByClass(classId) {
    const result = await pool.query(
      `SELECT s.*, u.email, u.full_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.class_id = $1
       ORDER BY s.enrolled_at DESC`,
      [classId]
    );
    return result.rows;
  }

  static async findByUser(userId) {
    const result = await pool.query(
      `SELECT s.*, c.class_id, c.name as class_name, c.status as class_status, c.score_manager_address
       FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE s.user_id = $1
       ORDER BY s.enrolled_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async findByClassAndUser(classId, userId) {
    const result = await pool.query(
      "SELECT * FROM students WHERE class_id = $1 AND user_id = $2",
      [classId, userId]
    );
    return result.rows[0];
  }

  static async findByWalletAddress(walletAddress) {
    const result = await pool.query(
      "SELECT * FROM students WHERE wallet_address = $1",
      [walletAddress]
    );
    return result.rows;
  }
}

module.exports = Student;
