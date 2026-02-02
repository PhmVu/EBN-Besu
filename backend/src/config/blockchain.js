const { ethers } = require("ethers");
const { blockchain } = require("./env");

// RPC Provider
const provider = new ethers.JsonRpcProvider(blockchain.rpcUrl);

// Admin Wallet (for deploying contracts and admin operations)
let adminWallet = null;
if (blockchain.adminPrivateKey) {
  adminWallet = new ethers.Wallet(blockchain.adminPrivateKey, provider);
  console.log("Admin wallet loaded:", adminWallet.address);
} else {
  console.warn(
    "WARNING: ADMIN_PRIVATE_KEY not configured. Smart contract deployment will fail."
  );
}

// Contract addresses (set after deployment)
const contractAddresses = {
  classManager: process.env.CLASS_MANAGER_ADDRESS || "",
  scoreManager: process.env.SCORE_MANAGER_ADDRESS || "",
};

module.exports = {
  provider,
  adminWallet,
  contractAddresses,
  chainId: blockchain.chainId,
};
