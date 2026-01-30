const fs = require("fs");
const path = require("path");

/**
 * Load deployment information from the latest deployment file
 * @param {string} network - Network name (optional, defaults to latest)
 * @returns {Object} Deployment information
 */
function loadDeployment(network = null) {
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    throw new Error("Deployments directory does not exist. Please deploy contracts first.");
  }

  // Try to load latest.json
  const latestFile = path.join(deploymentsDir, "latest.json");
  if (fs.existsSync(latestFile)) {
    const deployment = JSON.parse(fs.readFileSync(latestFile, "utf8"));
    
    // If network is specified, check if it matches
    if (network && deployment.network !== network) {
      throw new Error(
        `Network mismatch: expected ${network}, got ${deployment.network}`
      );
    }
    
    return deployment;
  }

  // If latest.json doesn't exist, try to find the most recent deployment
  const files = fs.readdirSync(deploymentsDir)
    .filter((file) => file.startsWith("deployment-") && file.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error("No deployment files found. Please deploy contracts first.");
  }

  const latestDeploymentFile = path.join(deploymentsDir, files[0]);
  return JSON.parse(fs.readFileSync(latestDeploymentFile, "utf8"));
}

/**
 * Get contract address from deployment
 * @param {string} contractName - Name of the contract (ClassManager or ScoreManager)
 * @param {string} network - Network name (optional)
 * @returns {string} Contract address
 */
function getContractAddress(contractName, network = null) {
  const deployment = loadDeployment(network);
  
  if (!deployment.contracts[contractName]) {
    throw new Error(`Contract ${contractName} not found in deployment`);
  }
  
  return deployment.contracts[contractName].address;
}

/**
 * Get all contract addresses
 * @param {string} network - Network name (optional)
 * @returns {Object} Object with contract addresses
 */
function getContractAddresses(network = null) {
  const deployment = loadDeployment(network);
  
  return {
    ClassManager: deployment.contracts.ClassManager.address,
    ScoreManager: deployment.contracts.ScoreManager.address,
  };
}

// If run as script, print deployment info
if (require.main === module) {
  try {
    const deployment = loadDeployment();
    console.log("Deployment Information:");
    console.log(JSON.stringify(deployment, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

module.exports = {
  loadDeployment,
  getContractAddress,
  getContractAddresses,
};
