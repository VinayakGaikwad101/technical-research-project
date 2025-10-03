const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment process...\n");
  
  /**
   * In local development, Hardhat provides test accounts with ETH
   */
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📋 Deployment Details:");
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check the deployer's balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("Network:", hre.network.name);
  console.log("─────────────────────────────────────────────────\n");

  /**
   * DEPLOYMENT PROCESS:
   * 1. Get the contract factory (template for creating contract instances)
   * 2. Deploy the contract (send it to blockchain)
   * 3. Wait for deployment confirmation
   */
  
  console.log("📦 Deploying SimpleMarket contract...");
  
  // Get the contract factory
  // This is like getting the blueprint to build our contract
  const SimpleMarket = await hre.ethers.getContractFactory("SimpleMarket");
  
  // Deploy the contract
  // This sends the contract to the blockchain and costs gas
  const simpleMarket = await SimpleMarket.deploy();
  
  // Wait for the deployment transaction to be confirmed
  // Blockchain needs time to process and confirm the transaction
  await simpleMarket.waitForDeployment();
  
  // Get the deployed contract address
  const contractAddress = await simpleMarket.getAddress();
  
  console.log("✅ SimpleMarket deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("─────────────────────────────────────────────────\n");
  
  /**
   * Let's verify the deployment by calling a simple function
   * This ensures our contract is working correctly
   */
  
  console.log("🔍 Verifying deployment...");
  
  try {
    // Call the getTotalProducts function to verify contract is working
    const totalProducts = await simpleMarket.getTotalProducts();
    console.log("✅ Contract verification successful!");
    console.log("📊 Initial product count:", totalProducts.toString());
    
    // Get the product count using the public variable (alternative way)
    const productCount = await simpleMarket.productCount();
    console.log("📊 Product count (via public variable):", productCount.toString());
    
  } catch (error) {
    console.log("❌ Contract verification failed:", error.message);
  }
  
  console.log("─────────────────────────────────────────────────\n");

  /**
   * Save important deployment information to a file
   * The frontend will need the contract address to interact with it
   */
  
  const deploymentInfo = {
    network: hre.network.name,
    contractName: "SimpleMarket",
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };
  
  // Create the contracts directory in frontend if it doesn't exist
  const fs = require('fs');
  const path = require('path');
  
  const contractsDir = path.join(__dirname, '../frontend/src/contracts');
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  
  // Save deployment info
  fs.writeFileSync(
    path.join(contractsDir, 'deploymentInfo.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("💾 Deployment info saved to frontend/src/contracts/deploymentInfo.json");
  
  /**
   * ABI (Application Binary Interface) is like a manual that tells
   * the frontend how to interact with our smart contract.
   * It contains information about all functions, events, and data structures.
   */
  
  try {
    // Read the compiled contract artifact (contains ABI)
    const artifactPath = path.join(__dirname, '../artifacts/contracts/SimpleMarket.sol/SimpleMarket.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Save just the ABI (the frontend doesn't need the full artifact)
    const contractABI = {
      contractName: "SimpleMarket",
      abi: artifact.abi,
      address: contractAddress,
      network: hre.network.name
    };
    
    fs.writeFileSync(
      path.join(contractsDir, 'SimpleMarket.json'),
      JSON.stringify(contractABI, null, 2)
    );
    
    console.log("📋 Contract ABI saved to frontend/src/contracts/SimpleMarket.json");
    
  } catch (error) {
    console.log("⚠️  Warning: Could not copy ABI file:", error.message);
  }
  
// when deployment is done, show the following:
  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("═══════════════════════════════════════════════════");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🌐 Network:", hre.network.name);
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Gas Used: Check your wallet for transaction details");
  console.log("═══════════════════════════════════════════════════");
  
  console.log("\n📝 NEXT STEPS:");
  console.log("1. Start the frontend: cd frontend && npm run dev");
  console.log("2. Connect MetaMask to your local network");
  console.log("3. Import a test account from Hardhat node");
  console.log("4. Start buying and selling products!");
  
  console.log("\n🔧 USEFUL COMMANDS:");
  console.log("- Compile contracts: npx hardhat compile");
  console.log("- Run tests: npx hardhat test");
  console.log("- Start local node: npx hardhat node");
  console.log("- Deploy again: npx hardhat run scripts/deploy.js --network localhost");
}

// ==================== ERROR HANDLING ====================

/**
 * Handle any errors that occur during deployment
 * This ensures we get helpful error messages if something goes wrong
 */
main()
  .then(() => {
    console.log("\n✅ Deployment script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed!");
    console.error("Error details:", error);
    
    // Provide helpful error messages for common issues
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 SOLUTION: Make sure your account has enough ETH for gas fees");
    } else if (error.message.includes("network")) {
      console.log("\n💡 SOLUTION: Check your network connection and Hardhat node");
    } else if (error.message.includes("compilation")) {
      console.log("\n💡 SOLUTION: Fix contract compilation errors first");
    }
    
    process.exit(1);
  });

/**
 * ==================== DEPLOYMENT SCRIPT SUMMARY ====================
 * 
 * This script does the following:
 * 
 * 1. PREPARATION:
 *    - Gets the deployer account
 *    - Checks account balance
 *    - Shows network information
 * 
 * 2. DEPLOYMENT:
 *    - Compiles the SimpleMarket contract
 *    - Deploys it to the blockchain
 *    - Waits for confirmation
 *    - Gets the contract address
 * 
 * 3. VERIFICATION:
 *    - Tests basic contract functions
 *    - Ensures deployment was successful
 * 
 * 4. SETUP FOR FRONTEND:
 *    - Saves contract address and ABI
 *    - Creates necessary files for frontend integration
 * 
 * 5. REPORTING:
 *    - Shows deployment summary
 *    - Provides next steps
 *    - Gives helpful commands
 * 
 * BEGINNER TIPS:
 * - Always deploy to local network first for testing
 * - Keep track of contract addresses
 * - Save gas by testing thoroughly before mainnet deployment
 * - Use version control to track deployments
 */