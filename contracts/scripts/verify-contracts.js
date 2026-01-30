const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { loadDeployment } = require("./load-deployment");

/**
 * Verify contracts on blockchain
 * Compares bytecode and checks contract existence
 */
async function main() {
  console.log("==========================================");
  console.log("Verifying Contracts on Blockchain");
  console.log("==========================================");
  console.log("");

  // Load deployment info
  let deployment;
  try {
    deployment = loadDeployment();
    console.log(`✅ Loaded deployment from network: ${deployment.network}`);
    console.log("");
  } catch (error) {
    console.error("❌ Error loading deployment:", error.message);
    process.exit(1);
  }

  const artifactsDir = path.join(__dirname, "../artifacts/contracts");
  const contractNames = ["ClassManager", "ScoreManager"];

  const verificationResults = {};

  for (const contractName of contractNames) {
    console.log(`Verifying ${contractName}...`);
    const result = {
      name: contractName,
      address: deployment.contracts[contractName].address,
      verified: false,
      errors: [],
    };

    try {
      // 1. Check contract exists at address
      const code = await hre.ethers.provider.getCode(result.address);
      if (code === "0x") {
        result.errors.push("No contract code found at address");
        console.log(`   ❌ No contract code found at ${result.address}`);
        verificationResults[contractName] = result;
        continue;
      }
      console.log(`   ✅ Contract code exists at address`);

      // 2. Load compiled bytecode from artifacts
      const artifactPath = path.join(
        artifactsDir,
        `${contractName}.sol`,
        `${contractName}.json`
      );

      if (!fs.existsSync(artifactPath)) {
        result.errors.push("Artifact file not found");
        console.log(`   ❌ Artifact not found: ${artifactPath}`);
        verificationResults[contractName] = result;
        continue;
      }

      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      const compiledBytecode = artifact.deployedBytecode;

      if (!compiledBytecode) {
        result.errors.push("No deployed bytecode in artifact");
        console.log(`   ❌ No deployed bytecode in artifact`);
        verificationResults[contractName] = result;
        continue;
      }

      // 3. Compare bytecode (remove metadata hash which can differ)
      const deployedCode = code.replace(/a264697066735822[0-9a-f]{64}64736f6c6343[0-9a-f]{6}$/, "");
      const compiledCode = compiledBytecode.replace(/a264697066735822[0-9a-f]{64}64736f6c6343[0-9a-f]{6}$/, "");

      if (deployedCode.toLowerCase() === compiledCode.toLowerCase()) {
        result.verified = true;
        console.log(`   ✅ Bytecode matches`);
      } else {
        result.errors.push("Bytecode mismatch");
        console.log(`   ⚠️  Bytecode mismatch (may be due to compiler settings)`);
      }

      // 4. Check ABI exists
      if (artifact.abi && artifact.abi.length > 0) {
        console.log(`   ✅ ABI found (${artifact.abi.length} items)`);
      } else {
        result.errors.push("ABI not found or empty");
        console.log(`   ❌ ABI not found or empty`);
      }

      // 5. Try to call a view function to verify contract works
      try {
        const contract = await hre.ethers.getContractAt(
          contractName,
          result.address
        );
        
        // Try to call a simple view function
        if (contractName === "ClassManager") {
          const count = await contract.getClassCount();
          console.log(`   ✅ Contract is callable (getClassCount: ${count})`);
        } else if (contractName === "ScoreManager") {
          const teacher = await contract.teacher();
          console.log(`   ✅ Contract is callable (teacher: ${teacher})`);
        }
      } catch (error) {
        result.errors.push(`Cannot call contract: ${error.message}`);
        console.log(`   ⚠️  Could not call contract: ${error.message}`);
      }

    } catch (error) {
      result.errors.push(`Verification error: ${error.message}`);
      console.log(`   ❌ Error: ${error.message}`);
    }

    verificationResults[contractName] = result;
    console.log("");
  }

  // Print summary
  console.log("==========================================");
  console.log("Verification Summary");
  console.log("==========================================");

  let allVerified = true;
  for (const [name, result] of Object.entries(verificationResults)) {
    const status = result.verified ? "✅ VERIFIED" : "❌ NOT VERIFIED";
    console.log(`${name}: ${status}`);
    console.log(`  Address: ${result.address}`);
    if (result.errors.length > 0) {
      console.log(`  Errors:`);
      result.errors.forEach((err) => console.log(`    - ${err}`));
      allVerified = false;
    }
    console.log("");
  }

  // Save verification report
  const reportPath = path.join(__dirname, "../deployments/verification-report.json");
  const report = {
    verifiedAt: new Date().toISOString(),
    network: deployment.network,
    results: verificationResults,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Verification report saved to: ${reportPath}`);

  if (allVerified) {
    console.log("");
    console.log("✅ All contracts verified successfully!");
    process.exit(0);
  } else {
    console.log("");
    console.log("⚠️  Some contracts could not be fully verified.");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
