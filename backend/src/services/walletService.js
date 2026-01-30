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
}

module.exports = WalletService;
