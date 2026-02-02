const { ethers } = require("ethers");
const { provider, adminWallet } = require("../config/blockchain");

// Load ABI + bytecode from local artifacts (copied from contracts/)
const classManagerArtifact = require("../blockchain/artifacts/ClassManager.json");
const scoreManagerArtifact = require("../blockchain/artifacts/ScoreManager.json");

const CLASS_MANAGER_ABI = classManagerArtifact.abi;
const CLASS_MANAGER_BYTECODE = classManagerArtifact.bytecode;
const SCORE_MANAGER_ABI = scoreManagerArtifact.abi;
const SCORE_MANAGER_BYTECODE = scoreManagerArtifact.bytecode;

class BlockchainService {
  /**
   * Get ClassManager contract instance (with signer)
   * @param {string} address - Contract address
   * @param {ethers.Wallet} signer - Signer (optional, uses adminWallet if not provided)
   * @returns {ethers.Contract} Contract instance
   */
  static getClassManagerContract(address, signer = null) {
    const wallet = signer || adminWallet;
    if (!wallet) {
      throw new Error("No signer available");
    }
    return new ethers.Contract(address, CLASS_MANAGER_ABI, wallet);
  }

  /**
   * Get ScoreManager contract instance (with signer)
   * @param {string} address - Contract address
   * @param {ethers.Wallet} signer - Signer (optional, uses adminWallet if not provided)
   * @returns {ethers.Contract} Contract instance
   */
  static getScoreManagerContract(address, signer = null) {
    const wallet = signer || adminWallet;
    if (!wallet) {
      throw new Error("No signer available");
    }
    return new ethers.Contract(address, SCORE_MANAGER_ABI, wallet);
  }

  /**
   * Deploy new ClassManager + ScoreManager contracts for a classId
   * Uses teacherWallet as on-chain owner, adminWallet is pre-funded
   * @param {string} classId
   * @param {ethers.Wallet} teacherWallet - Teacher wallet to own the contracts
   * @returns {Promise<{ classManagerAddress: string, scoreManagerAddress: string, classManagerAbi: string, scoreManagerAbi: string }>}
   */
  static async deployClassContracts(classId, teacherWallet = null) {
    const signer = teacherWallet || adminWallet;
    if (!signer) {
      throw new Error("No signer (teacher or admin wallet) available");
    }

    try {
      // Deploy ClassManager
      const classFactory = new ethers.ContractFactory(
        CLASS_MANAGER_ABI,
        CLASS_MANAGER_BYTECODE,
        signer
      );
      const classManager = await classFactory.deploy();
      await classManager.waitForDeployment();
      const classManagerAddress = await classManager.getAddress();

      // Deploy ScoreManager with signer as teacher
      const scoreFactory = new ethers.ContractFactory(
        SCORE_MANAGER_ABI,
        SCORE_MANAGER_BYTECODE,
        signer
      );
      const scoreManager = await scoreFactory.deploy(
        signer.address,
        classManagerAddress
      );
      await scoreManager.waitForDeployment();
      const scoreManagerAddress = await scoreManager.getAddress();

      // Initialize class within contracts
      const txCreate = await classManager.createClass(classId);
      await txCreate.wait();

      const txRegister = await scoreManager.registerClass(classId);
      await txRegister.wait();

      return {
        classManagerAddress,
        scoreManagerAddress,
        classManagerAbi: JSON.stringify(CLASS_MANAGER_ABI),
        scoreManagerAbi: JSON.stringify(SCORE_MANAGER_ABI),
      };
    } catch (error) {
      throw new Error(`Failed to deploy contracts: ${error.message}`);
    }
  }

  /**
   * Create a new class on blockchain
   * @param {string} contractAddress - ClassManager contract address
   * @param {string} classId - Class ID
   * @returns {Promise<ethers.TransactionReceipt>} Transaction receipt
   */
  static async createClass(contractAddress, classId) {
    const contract = this.getClassManagerContract(contractAddress);
    const tx = await contract.createClass(classId);
    return await tx.wait();
  }

  /**
   * Create class on-chain
   * @param {string} contractAddress - ClassManager contract address
   * @param {string|number} classId - Class ID
   * @param {string} className - Class name (optional, for logging only)
   * @returns {Promise<ethers.TransactionReceipt>} Transaction receipt
   */
  static async createClassOnChain(contractAddress, classId, className) {
    const contract = this.getClassManagerContract(contractAddress);
    // Contract only takes classId (string)
    const tx = await contract.createClass(String(classId));
    return await tx.wait();
  }

  /**
   * Add student to class whitelist
   * @param {string} contractAddress - ClassManager contract address
   * @param {string} classId - Class ID
   * @param {string} studentAddress - Student wallet address
   * @returns {Promise<ethers.TransactionReceipt>} Transaction receipt
   */
  static async addStudentToClass(
    contractAddress,
    classId,
    studentAddress
  ) {
    const contract = this.getClassManagerContract(contractAddress);
    const tx = await contract.addStudent(classId, studentAddress);
    return await tx.wait();
  }

  /**
   * Approve and add student to class (Phase 3.2 NEW)
   * Called when teacher approves student with password verification
   * @param {string} contractAddress - ClassManager contract address
   * @param {string} classId - Class ID
   * @param {string} studentAddress - Student wallet address
   * @returns {Promise<{ txHash: string, blockNumber: number, success: boolean }>}
   */
  static async approveAndAddStudent(
    contractAddress,
    classId,
    studentAddress
  ) {
    try {
      const contract = this.getClassManagerContract(contractAddress);
      const tx = await contract.approveAndAddStudent(classId, studentAddress);
      const receipt = await tx.wait();

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        success: receipt.status === 1,
      };
    } catch (error) {
      throw new Error(
        `Failed to approve and add student: ${error.message}`
      );
    }
  }

  /**
   * Close a class
   * @param {string} contractAddress - ClassManager contract address
   * @param {string} classId - Class ID
   * @returns {Promise<ethers.TransactionReceipt>} Transaction receipt
   */
  static async closeClass(contractAddress, classId) {
    const contract = this.getClassManagerContract(contractAddress);
    const tx = await contract.closeClass(classId);
    return await tx.wait();
  }

  /**
   * Check if student is allowed in class
   * @param {string} contractAddress - ClassManager contract address
   * @param {string} classId - Class ID
   * @param {string} studentAddress - Student wallet address
   * @returns {Promise<boolean>} True if allowed
   */
  static async isStudentAllowed(
    contractAddress,
    classId,
    studentAddress
  ) {
    const contract = this.getClassManagerContract(contractAddress);
    return await contract.isStudentAllowed(classId, studentAddress);
  }

  /**
   * Get class info from blockchain
   * @param {string} contractAddress - ClassManager contract address
   * @param {string} classId - Class ID
   * @returns {Promise<Object>} Class info
   */
  static async getClassInfo(contractAddress, classId) {
    const contract = this.getClassManagerContract(contractAddress);
    return await contract.getClassInfo(classId);
  }

  /**
   * Submit assignment
   * @param {string} contractAddress - ScoreManager contract address
   * @param {string} classId - Class ID
   * @param {string} assignmentHash - Hash of assignment
   * @param {ethers.Wallet} studentWallet - Student wallet to sign transaction
   * @returns {Promise<ethers.TransactionReceipt>} Transaction receipt
   */
  static async submitAssignment(
    contractAddress,
    classId,
    assignmentHash,
    studentWallet
  ) {
    const contract = this.getScoreManagerContract(contractAddress, studentWallet);
    const tx = await contract.submitAssignment(classId, assignmentHash);
    return await tx.wait();
  }

  /**
   * Record score for student
   * @param {string} contractAddress - ScoreManager contract address
   * @param {string} classId - Class ID
   * @param {string} studentAddress - Student wallet address
   * @param {number} score - Score (0-1000)
   * @returns {Promise<ethers.TransactionReceipt>} Transaction receipt
   */
  static async recordScore(
    contractAddress,
    classId,
    studentAddress,
    score
  ) {
    const contract = this.getScoreManagerContract(contractAddress);
    const tx = await contract.recordScore(classId, studentAddress, score);
    return await tx.wait();
  }

  /**
   * Get student score
   * @param {string} contractAddress - ScoreManager contract address
   * @param {string} classId - Class ID
   * @param {string} studentAddress - Student wallet address
   * @returns {Promise<Object>} Score info
   */
  static async getStudentScore(
    contractAddress,
    classId,
    studentAddress
  ) {
    const contract = this.getScoreManagerContract(contractAddress);
    return await contract.getScore(classId, studentAddress);
  }

  /**
   * Listen to contract events
   * @param {string} contractAddress - Contract address
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   * @param {string} abi - Contract ABI
   */
  static async listenToEvents(contractAddress, eventName, callback, abi) {
    const contract = new ethers.Contract(contractAddress, abi, provider);
    contract.on(eventName, callback);
  }

  /**
   * Get block number
   * @returns {Promise<number>} Current block number
   */
  static async getBlockNumber() {
    return await provider.getBlockNumber();
  }

  /**
   * Get transaction receipt
   * @param {string} txHash - Transaction hash
   * @returns {Promise<ethers.TransactionReceipt>} Transaction receipt
   */
  static async getTransactionReceipt(txHash) {
    return await provider.getTransactionReceipt(txHash);
  }
}

module.exports = BlockchainService;
