const { ethers } = require("ethers");
require("dotenv").config();

// RPC Provider
const rpcUrl = process.env.RPC_URL || "http://localhost:8549";
const provider = new ethers.JsonRpcProvider(rpcUrl);

// Admin Wallet (for deploying contracts and admin operations)
let adminWallet = null;
if (process.env.ADMIN_PRIVATE_KEY) {
  adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  console.log("Admin wallet loaded:", adminWallet.address);
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
  chainId: parseInt(process.env.CHAIN_ID || "1337"),
};
