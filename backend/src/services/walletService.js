const { ethers } = require("ethers");
const crypto = require("crypto");

class WalletService {
  /**
   * Generate a new wallet for student
   * @returns {Object} { address, privateKey }
   */
  static generateWallet() {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  }

  /**
   * Encrypt private key with a password
   * @param {string} privateKey - Private key to encrypt
   * @param {string} password - Password for encryption
   * @returns {string} Encrypted private key (hex)
   */
  static encryptPrivateKey(privateKey, password) {
    const algorithm = "aes-256-cbc";
    const key = crypto
      .createHash("sha256")
      .update(password)
      .digest();
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return iv:encrypted format
    return `${iv.toString("hex")}:${encrypted}`;
  }

  /**
   * Decrypt private key
   * @param {string} encryptedPrivateKey - Encrypted private key
   * @param {string} password - Password for decryption
   * @returns {string} Decrypted private key
   */
  static decryptPrivateKey(encryptedPrivateKey, password) {
    const algorithm = "aes-256-cbc";
    const key = crypto
      .createHash("sha256")
      .update(password)
      .digest();

    const [ivHex, encrypted] = encryptedPrivateKey.split(":");
    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Validate Ethereum address
   * @param {string} address - Address to validate
   * @returns {boolean} True if valid
   */
  static isValidAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Mark private key as shown (one-time policy)
   * @param {Object} db - Database connection
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  static async markPrivateKeyAsShown(db, userId) {
    await db.query(
      "UPDATE wallet_keys SET shown = true, shown_at = NOW() WHERE user_id = $1",
      [userId]
    );
  }

  /**
   * Check if private key has been shown
   * @param {Object} db - Database connection
   * @param {number} userId - User ID
   * @returns {Promise<boolean>}
   */
  static async isPrivateKeyShown(db, userId) {
    const result = await db.query(
      "SELECT shown FROM wallet_keys WHERE user_id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return false;
    }
    return result.rows[0].shown;
  }

  /**
   * Get private key if not shown yet
   * @param {Object} db - Database connection
   * @param {number} userId - User ID
   * @param {string} password - Password to decrypt
   * @returns {Promise<string|null>} Private key or null if already shown
   */
  static async getPrivateKeyIfNotShown(db, userId, password) {
    const result = await db.query(
      "SELECT encrypted_key, shown FROM wallet_keys WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error("Wallet keys not found for user");
    }

    const { encrypted_key, shown } = result.rows[0];

    if (shown) {
      return null; // Already shown
    }

    try {
      const decrypted = this.decryptPrivateKey(encrypted_key, password);
      // Mark as shown immediately after decryption
      await this.markPrivateKeyAsShown(db, userId);
      return decrypted;
    } catch (error) {
      throw new Error("Failed to decrypt private key: " + error.message);
    }
  }
}

module.exports = WalletService;
