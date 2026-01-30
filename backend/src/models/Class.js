const pool = require("../config/database");

class Class {
  static async create(classData) {
    const {
      classId,
      teacherId,
      name,
      description,
      contractAddress = null,
      classManagerAddress = null,
      scoreManagerAddress = null,
    } = classData;
    const result = await pool.query(
      `INSERT INTO classes (class_id, teacher_id, name, description, contract_address, class_manager_address, score_manager_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        classId,
        teacherId,
        name,
        description,
        contractAddress,
        classManagerAddress,
        scoreManagerAddress,
      ]
    );
    return result.rows[0];
  }

  static async updateContractAddresses(id, classManagerAddress, scoreManagerAddress) {
    const result = await pool.query(
      `UPDATE classes
       SET class_manager_address = $1,
           score_manager_address = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [classManagerAddress, scoreManagerAddress, id]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query("SELECT * FROM classes WHERE id = $1", [
      id,
    ]);
    return result.rows[0];
  }

  static async findByClassId(classId) {
    const result = await pool.query(
      "SELECT * FROM classes WHERE class_id = $1",
      [classId]
    );
    return result.rows[0];
  }

  static async findByTeacher(teacherId) {
    const result = await pool.query(
      "SELECT * FROM classes WHERE teacher_id = $1 ORDER BY created_at DESC",
      [teacherId]
    );
    return result.rows;
  }

  static async updateContractAddress(id, contractAddress) {
    const result = await pool.query(
      "UPDATE classes SET contract_address = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [contractAddress, id]
    );
    return result.rows[0];
  }

  static async closeClass(id) {
    const result = await pool.query(
      "UPDATE classes SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }

  static async getAll() {
    const result = await pool.query(
      "SELECT * FROM classes ORDER BY created_at DESC"
    );
    return result.rows;
  }
}

module.exports = Class;
