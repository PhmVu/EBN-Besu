require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    besu: {
      url: process.env.RPC_URL || "http://localhost:8549",
      accounts: process.env.ADMIN_PRIVATE_KEY
        ? [process.env.ADMIN_PRIVATE_KEY]
        : [],
      chainId: parseInt(process.env.CHAIN_ID || "1337"),
      gasPrice: 0,
      gas: 10000000,
    },
    hardhat: {
      chainId: 1337,
    },
  },
  paths: {
    // Đặt tất cả Solidity sources trong thư mục sol/ để tránh trùng với node_modules
    sources: "./sol",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
