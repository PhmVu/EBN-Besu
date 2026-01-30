const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==========================================");
  console.log("Deploying Smart Contracts to Besu Network");
  console.log("==========================================");
  console.log("");

  // Check network connection
  try {
    const network = await hre.ethers.provider.getNetwork();
    console.log(`Network: ${hre.network.name}`);
    console.log(`Chain ID: ${network.chainId.toString()}`);
    console.log("");
  } catch (error) {
    console.error("❌ Error connecting to network:", error.message);
    console.error("Please ensure Besu network is running and RPC_URL is correct.");
    process.exit(1);
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Check balance
  try {
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const balanceInEth = hre.ethers.formatEther(balance);
    console.log("Account balance:", balanceInEth, "ETH");
    
    if (balance === 0n) {
      console.warn("⚠️  Warning: Account balance is 0. Deployment may fail.");
    }
    console.log("");
  } catch (error) {
    console.error("❌ Error checking balance:", error.message);
    process.exit(1);
  }

  // Deploy ClassManager
  console.log("Deploying ClassManager...");
  let classManager, classManagerAddress;
  try {
    const ClassManager = await hre.ethers.getContractFactory("ClassManager");
    classManager = await ClassManager.deploy();
    await classManager.waitForDeployment();
    classManagerAddress = await classManager.getAddress();
    console.log("✅ ClassManager deployed to:", classManagerAddress);
    console.log("");
  } catch (error) {
    console.error("❌ Error deploying ClassManager:", error.message);
    process.exit(1);
  }

  // Deploy ScoreManager
  console.log("Deploying ScoreManager...");
  let scoreManager, scoreManagerAddress;
  try {
    const ScoreManager = await hre.ethers.getContractFactory("ScoreManager");
    scoreManager = await ScoreManager.deploy(
      deployer.address, // teacher address
      classManagerAddress // ClassManager address
    );
    await scoreManager.waitForDeployment();
    scoreManagerAddress = await scoreManager.getAddress();
    console.log("✅ ScoreManager deployed to:", scoreManagerAddress);
    console.log("");
  } catch (error) {
    console.error("❌ Error deploying ScoreManager:", error.message);
    process.exit(1);
  }

  // Get network info
  const networkInfo = await hre.ethers.provider.getNetwork();
  const blockNumber = await hre.ethers.provider.getBlockNumber();

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: networkInfo.chainId.toString(),
    blockNumber: blockNumber.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      ClassManager: {
        address: classManagerAddress,
        deployedAt: new Date().toISOString(),
      },
      ScoreManager: {
        address: scoreManagerAddress,
        deployedAt: new Date().toISOString(),
      },
    },
  };

  // Create deployments directory
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save to timestamped file
  const deploymentFile = path.join(
    deploymentsDir,
    `deployment-${Date.now()}.json`
  );
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("📄 Deployment info saved to:", deploymentFile);

  // Save to latest.json for easy access
  const latestFile = path.join(deploymentsDir, "latest.json");
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Latest deployment saved to:", latestFile);
  console.log("");

  // Print summary
  console.log("==========================================");
  console.log("Deployment Summary");
  console.log("==========================================");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");

  // Update .env file if it exists (optional)
  const envFile = path.join(__dirname, "../.env");
  if (fs.existsSync(envFile)) {
    try {
      let envContent = fs.readFileSync(envFile, "utf8");
      
      // Update or add CLASS_MANAGER_ADDRESS
      if (envContent.includes("CLASS_MANAGER_ADDRESS=")) {
        envContent = envContent.replace(
          /CLASS_MANAGER_ADDRESS=.*/,
          `CLASS_MANAGER_ADDRESS=${classManagerAddress}`
        );
      } else {
        envContent += `\nCLASS_MANAGER_ADDRESS=${classManagerAddress}\n`;
      }
      
      // Update or add SCORE_MANAGER_ADDRESS
      if (envContent.includes("SCORE_MANAGER_ADDRESS=")) {
        envContent = envContent.replace(
          /SCORE_MANAGER_ADDRESS=.*/,
          `SCORE_MANAGER_ADDRESS=${scoreManagerAddress}`
        );
      } else {
        envContent += `SCORE_MANAGER_ADDRESS=${scoreManagerAddress}\n`;
      }
      
      fs.writeFileSync(envFile, envContent);
      console.log("✅ Updated .env file with contract addresses");
    } catch (error) {
      console.warn("⚠️  Could not update .env file:", error.message);
    }
  }

  console.log("");
  console.log("==========================================");
  console.log("✅ Deployment completed successfully!");
  console.log("==========================================");
  console.log("");
  console.log("Next steps:");
  console.log("1. Run: node scripts/extract-abi.js");
  console.log("2. Use contracts.json in your backend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
