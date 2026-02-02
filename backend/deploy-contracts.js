const { ethers } = require("ethers");
const fs = require("fs");

async function deploy() {
  try {
    // Connect to Besu - use rpc-node if running in container, localhost if on host
    const rpcUrl = process.env.RPC_URL || "http://localhost:8545";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const adminKey = process.env.ADMIN_PRIVATE_KEY || "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
    const adminWallet = new ethers.Wallet(adminKey, provider);

    console.log("Admin wallet:", adminWallet.address);

    // Load artifacts
    const classManagerArtifact = JSON.parse(
      fs.readFileSync("./src/blockchain/artifacts/ClassManager.json", "utf8")
    );
    const scoreManagerArtifact = JSON.parse(
      fs.readFileSync("./src/blockchain/artifacts/ScoreManager.json", "utf8")
    );

    console.log("\n1. Deploying ClassManager...");
    const ClassManagerFactory = new ethers.ContractFactory(
      classManagerArtifact.abi,
      classManagerArtifact.bytecode,
      adminWallet
    );
    console.log("Sending deploy transaction...");
    const deployTx1 = await ClassManagerFactory.deploy();
    const hash1 = deployTx1.deploymentTransaction()?.hash;
    console.log("Deploy TX hash:", hash1);
    console.log("Waiting for confirmation (1 block)...");
    const receipt1 = await deployTx1.deploymentTransaction()?.wait(1);
    const classManagerAddr = receipt1?.contractAddress || deployTx1.address;
    console.log("✅ ClassManager deployed at:", classManagerAddr);

    console.log("\n2. Deploying ScoreManager...");
    let scoreManagerAddr = "0x0000000000000000000000000000000000000000";
    try {
      const ScoreManagerFactory = new ethers.ContractFactory(
        scoreManagerArtifact.abi,
        scoreManagerArtifact.bytecode,
        adminWallet
      );
      console.log("Sending deploy transaction...");
      const deployTx2 = await ScoreManagerFactory.deploy(
        adminWallet.address,
        classManagerAddr
      );
      const hash2 = deployTx2.deploymentTransaction()?.hash;
      console.log("Deploy TX hash:", hash2);
      console.log("Waiting for confirmation (1 block)...");
      const receipt2 = await deployTx2.deploymentTransaction()?.wait(1);
      scoreManagerAddr = receipt2?.contractAddress || deployTx2.address;
      console.log("✅ ScoreManager deployed at:", scoreManagerAddr);
    } catch (error) {
      console.warn("⚠️  ScoreManager deployment failed:", error.message);
      console.log("Using ClassManager address as fallback");
      scoreManagerAddr = classManagerAddr;
    }

    console.log("\n====== ADD THESE TO DOCKER-COMPOSE.YML ======");
    console.log(`CLASS_MANAGER_ADDRESS=${classManagerAddr}`);
    console.log(`SCORE_MANAGER_ADDRESS=${scoreManagerAddr}`);
    console.log("============================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

deploy();
