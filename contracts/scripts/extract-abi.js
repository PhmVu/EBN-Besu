const fs = require("fs");
const path = require("path");
const { loadDeployment } = require("./load-deployment");

/**
 * Extract ABI and addresses from compiled artifacts and deployment files
 * Creates contracts.json for backend integration
 */
async function main() {
  console.log("==========================================");
  console.log("Extracting Contract ABIs and Addresses");
  console.log("==========================================");
  console.log("");

  const artifactsDir = path.join(__dirname, "../artifacts/contracts");
  const contracts = {};

  // Contract names to extract
  const contractNames = ["ClassManager", "ScoreManager"];

  // Load deployment info
  let deployment;
  try {
    deployment = loadDeployment();
    console.log(`✅ Loaded deployment from network: ${deployment.network}`);
    console.log("");
  } catch (error) {
    console.error("❌ Error loading deployment:", error.message);
    console.error("Please deploy contracts first using: npm run deploy:besu");
    process.exit(1);
  }

  // Extract ABI and addresses for each contract
  for (const contractName of contractNames) {
    console.log(`Processing ${contractName}...`);

    // Get contract address from deployment
    const contractAddress = deployment.contracts[contractName].address;
    if (!contractAddress) {
      console.warn(
        `⚠️  Warning: ${contractName} address not found in deployment`
      );
      continue;
    }

    // Load ABI from artifacts: tìm JSON theo tên contract ở artifacts/contracts/**/<Name>.json
    let artifactPath = null;
    function findArtifact(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const found = findArtifact(full);
          if (found) return found;
        } else if (entry.isFile() && entry.name === `${contractName}.json`) {
          return full;
        }
      }
      return null;
    }

    artifactPath = findArtifact(artifactsDir);

    if (!artifactPath || !fs.existsSync(artifactPath)) {
      console.warn(
        `⚠️  Warning: Artifact not found for ${contractName} under ${artifactsDir}`
      );
      console.warn("Please compile contracts first using: npm run compile");
      continue;
    }

    try {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      const abi = artifact.abi;

      if (!abi || abi.length === 0) {
        console.warn(`⚠️  Warning: ABI is empty for ${contractName}`);
        continue;
      }

      contracts[contractName] = {
        address: contractAddress,
        abi: abi,
      };

      console.log(`  ✅ Address: ${contractAddress}`);
      console.log(`  ✅ ABI: ${abi.length} functions/events`);
    } catch (error) {
      console.error(`❌ Error processing ${contractName}:`, error.message);
      continue;
    }
  }

  // Save to contracts.json
  const outputFile = path.join(__dirname, "../contracts.json");
  fs.writeFileSync(outputFile, JSON.stringify(contracts, null, 2));
  console.log("");
  console.log("==========================================");
  console.log("✅ Extraction completed!");
  console.log("==========================================");
  console.log(`📄 Output saved to: ${outputFile}`);
  console.log("");
  console.log("Contract addresses:");
  for (const [name, data] of Object.entries(contracts)) {
    console.log(`  ${name}: ${data.address}`);
  }
  console.log("");
  console.log("You can now use contracts.json in your backend:");
  console.log('  const contracts = require("./contracts.json");');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Extraction failed:", error);
    process.exit(1);
  });
