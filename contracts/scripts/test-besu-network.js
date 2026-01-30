const hre = require("hardhat");
const { ethers } = require("ethers");

/**
 * Test contracts on actual Besu network
 * This script connects to Besu, deploys contracts, and tests basic functionality
 */
async function main() {
  console.log("==========================================");
  console.log("Testing Contracts on Besu Network");
  console.log("==========================================");
  console.log("");

  // Test 1: Network Connection
  console.log("1. Testing network connection...");
  try {
    const network = await hre.ethers.provider.getNetwork();
    console.log(`   ✅ Connected to network: ${hre.network.name}`);
    console.log(`   ✅ Chain ID: ${network.chainId.toString()}`);
    
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log(`   ✅ Current block: ${blockNumber}`);
    console.log("");
  } catch (error) {
    console.error("   ❌ Network connection failed:", error.message);
    process.exit(1);
  }

  // Test 2: Deployer Account
  console.log("2. Checking deployer account...");
  const [deployer] = await hre.ethers.getSigners();
  console.log(`   ✅ Deployer address: ${deployer.address}`);
  
  try {
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const balanceInEth = ethers.formatEther(balance);
    console.log(`   ✅ Balance: ${balanceInEth} ETH`);
    
    if (balance === 0n) {
      console.warn("   ⚠️  Warning: Balance is 0. Some operations may fail.");
    }
    console.log("");
  } catch (error) {
    console.error("   ❌ Error checking balance:", error.message);
    process.exit(1);
  }

  // Test 3: Deploy Contracts
  console.log("3. Deploying contracts...");
  let classManager, scoreManager;
  let classManagerAddress, scoreManagerAddress;
  
  try {
    // Deploy ClassManager
    console.log("   Deploying ClassManager...");
    const ClassManager = await hre.ethers.getContractFactory("ClassManager");
    classManager = await ClassManager.deploy();
    await classManager.waitForDeployment();
    classManagerAddress = await classManager.getAddress();
    console.log(`   ✅ ClassManager deployed: ${classManagerAddress}`);

    // Deploy ScoreManager
    console.log("   Deploying ScoreManager...");
    const ScoreManager = await hre.ethers.getContractFactory("ScoreManager");
    scoreManager = await ScoreManager.deploy(
      deployer.address,
      classManagerAddress
    );
    await scoreManager.waitForDeployment();
    scoreManagerAddress = await scoreManager.getAddress();
    console.log(`   ✅ ScoreManager deployed: ${scoreManagerAddress}`);
    console.log("");
  } catch (error) {
    console.error("   ❌ Deployment failed:", error.message);
    process.exit(1);
  }

  // Test 4: Basic Contract Functions
  console.log("4. Testing contract functions...");
  const classId = "TEST-CS101";

  try {
    // Create class
    console.log("   Creating class...");
    const tx1 = await classManager.createClass(classId);
    await tx1.wait();
    console.log("   ✅ Class created");

    // Register class in ScoreManager
    console.log("   Registering class in ScoreManager...");
    const tx2 = await scoreManager.registerClass(classId);
    await tx2.wait();
    console.log("   ✅ Class registered");

    // Get class info
    const classInfo = await classManager.getClassInfo(classId);
    console.log(`   ✅ Class info retrieved: Teacher=${classInfo.teacher}, Status=${classInfo.status}`);
    console.log("");
  } catch (error) {
    console.error("   ❌ Function test failed:", error.message);
    process.exit(1);
  }

  // Test 5: Add Student and Submit Assignment
  console.log("5. Testing student operations...");
  
  // Create a test student wallet
  const studentWallet = ethers.Wallet.createRandom().connect(hre.ethers.provider);
  console.log(`   Test student address: ${studentWallet.address}`);
  
  // Fund student wallet (if deployer has balance)
  try {
    const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
    if (deployerBalance > ethers.parseEther("0.1")) {
      const fundTx = await deployer.sendTransaction({
        to: studentWallet.address,
        value: ethers.parseEther("0.1"),
      });
      await fundTx.wait();
      console.log("   ✅ Funded test student wallet");
    } else {
      console.log("   ⚠️  Skipping student funding (low balance)");
    }
  } catch (error) {
    console.log("   ⚠️  Could not fund student wallet:", error.message);
  }

  try {
    // Add student
    console.log("   Adding student to class...");
    const tx3 = await classManager.addStudent(classId, studentWallet.address);
    await tx3.wait();
    console.log("   ✅ Student added");

    // Check permission
    const isAllowed = await classManager.isStudentAllowed(classId, studentWallet.address);
    console.log(`   ✅ Student permission check: ${isAllowed}`);

    // Submit assignment
    console.log("   Submitting assignment...");
    const assignmentHash = ethers.keccak256(ethers.toUtf8Bytes("test-assignment"));
    const tx4 = await scoreManager.connect(studentWallet).submitAssignment(classId, assignmentHash);
    await tx4.wait();
    console.log("   ✅ Assignment submitted");

    // Record score
    console.log("   Recording score...");
    const tx5 = await scoreManager.recordScore(classId, studentWallet.address, 90);
    await tx5.wait();
    console.log("   ✅ Score recorded");

    // Query score
    const [score] = await scoreManager.getScore(classId, studentWallet.address);
    console.log(`   ✅ Score retrieved: ${score.toString()}`);
    console.log("");
  } catch (error) {
    console.error("   ❌ Student operations failed:", error.message);
    // Don't exit - this might fail if student wallet wasn't funded
    console.log("   ⚠️  Continuing with other tests...");
    console.log("");
  }

  // Test 6: Events
  console.log("6. Testing events...");
  try {
    // Listen for ClassCreated event
    const filter = classManager.filters.ClassCreated();
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    const fromBlock = currentBlock > 10 ? currentBlock - 10 : 0;
    const events = await classManager.queryFilter(
      filter,
      fromBlock,
      currentBlock
    );
    console.log(`   ✅ Found ${events.length} ClassCreated event(s)`);
    console.log("");
  } catch (error) {
    console.error("   ❌ Event test failed:", error.message);
    console.log("");
  }

  // Summary
  console.log("==========================================");
  console.log("✅ Network Test Summary");
  console.log("==========================================");
  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${(await hre.ethers.provider.getNetwork()).chainId.toString()}`);
  console.log(`ClassManager: ${classManagerAddress}`);
  console.log(`ScoreManager: ${scoreManagerAddress}`);
  console.log("");
  console.log("All tests completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
