const pool = require("../config/database");

class User {
  static async create(userData) {
    const { email, passwordHash, role, walletAddress, fullName } = userData;
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, wallet_address, full_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, wallet_address, full_name, created_at`,
      [email, passwordHash, role, walletAddress, fullName]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
  }

  static async findByWalletAddress(walletAddress) {
    const result = await pool.query(
      "SELECT * FROM users WHERE wallet_address = $1",
      [walletAddress]
    );
    return result.rows[0];
  }

  static async updateWalletAddress(userId, walletAddress) {
    const result = await pool.query(
      "UPDATE users SET wallet_address = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [walletAddress, userId]
    );
    return result.rows[0];
  }

  // Alias for updateWalletAddress
  static async updateWallet(userId, walletAddress) {
    return this.updateWalletAddress(userId, walletAddress);
  }
}

module.exports = User;
