import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";

let web3 = null;
let contract = null;
let currentAccount = null;

// Contract configuration - these will be set after deployment
const CONTRACT_CONFIG = {
  // This will be populated from deployment files
  address: null,
  abi: null,
};

/**
 * Initialize Web3 provider
 * This connects our app to the Ethereum blockchain through MetaMask
 */
const initializeProvider = async () => {
  try {
    // Multiple detection methods for better compatibility
    let provider = null;

    // Method 1: Use detectEthereumProvider
    try {
      provider = await detectEthereumProvider({ timeout: 3000 });
    } catch (err) {
      console.log("detectEthereumProvider failed, trying direct detection...");
    }

    // Method 2: Direct window.ethereum check
    if (!provider && window.ethereum) {
      provider = window.ethereum;
      console.log("Using direct window.ethereum");
    }

    // Method 3: Check for MetaMask specifically
    if (!provider && window.ethereum && window.ethereum.isMetaMask) {
      provider = window.ethereum;
      console.log("Using MetaMask provider");
    }

    if (!provider) {
      throw new Error(
        "MetaMask not detected! Please install MetaMask browser extension."
      );
    }

    // Initialize Web3 with the provider
    web3 = new Web3(provider);

    console.log("✅ Web3 provider initialized");
    return web3;
  } catch (error) {
    console.error("❌ Error initializing provider:", error);
    throw error;
  }
};


/**
 * Connect to MetaMask wallet
 * This requests permission from user to access their wallet
 */
export const connectWallet = async () => {
  try {
    // Initialize provider if not already done
    if (!web3) {
      await initializeProvider();
    }

    // Request account access from MetaMask
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts.length === 0) {
      throw new Error(
        "No accounts found. Please create an account in MetaMask."
      );
    }

    currentAccount = accounts[0];
    console.log("✅ Wallet connected:", currentAccount);

    // Set up account change listener
    setupAccountChangeListener();

    // Set up network change listener
    setupNetworkChangeListener();

    return currentAccount;
  } catch (error) {
    console.error("❌ Error connecting wallet:", error);

    // Provide user-friendly error messages
    if (error.code === 4001) {
      throw new Error("Please connect your MetaMask wallet to continue.");
    } else if (error.code === -32002) {
      throw new Error(
        "MetaMask connection request is already pending. Please check MetaMask."
      );
    } else {
      throw new Error(error.message || "Failed to connect wallet");
    }
  }
};

/**
 * Get currently connected account without requesting permission
 * Used to check if user is already connected
 */
export const getCurrentAccount = async () => {
  try {
    if (!web3) {
      await initializeProvider();
    }

    const accounts = await web3.eth.getAccounts();

    if (accounts.length > 0) {
      currentAccount = accounts[0];
      return currentAccount;
    }

    return null;
  } catch (error) {
    console.error("❌ Error getting current account:", error);
    return null;
  }
};

/**
 * Get account balance in ETH
 */
export const getAccountBalance = async (address = currentAccount) => {
  try {
    if (!web3 || !address) return "0";

    const balanceWei = await web3.eth.getBalance(address);
    const balanceEth = web3.utils.fromWei(balanceWei, "ether");

    return parseFloat(balanceEth).toFixed(4);
  } catch (error) {
    console.error("❌ Error getting balance:", error);
    return "0";
  }
};


/**
 * Listen for account changes in MetaMask
 * When user switches accounts, update our app
 */
const setupAccountChangeListener = () => {
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        currentAccount = null;
        contract = null;
        console.log("👋 Wallet disconnected");
        window.location.reload(); // Refresh app
      } else {
        // User switched accounts
        currentAccount = accounts[0];
        console.log("🔄 Account changed to:", currentAccount);
        window.location.reload(); // Refresh app
      }
    });
  }
};

/**
 * Listen for network changes in MetaMask
 * When user switches networks, refresh the app
 */
const setupNetworkChangeListener = () => {
  if (window.ethereum) {
    window.ethereum.on("chainChanged", (chainId) => {
      console.log("🌐 Network changed to:", chainId);
      window.location.reload(); // Refresh app
    });
  }
};


/**
 * Load contract configuration from deployment files
 */
const loadContractConfig = async () => {
  try {
    // Try to load contract ABI and address from SimpleMarket.json
    const abiResponse = await fetch("/src/contracts/SimpleMarket.json");
    if (abiResponse.ok) {
      const contractData = await abiResponse.json();
      CONTRACT_CONFIG.abi = contractData.abi;
      CONTRACT_CONFIG.address = contractData.address;

      console.log("✅ Contract config loaded from SimpleMarket.json");
      console.log("📍 Contract address:", CONTRACT_CONFIG.address);
      console.log(
        "📋 Contract ABI methods:",
        CONTRACT_CONFIG.abi
          .filter((item) => item.type === "function")
          .map((f) => f.name)
      );
    } else {
      throw new Error("SimpleMarket.json not found");
    }

    // Fallback: Try to load deployment info if address is missing
    if (!CONTRACT_CONFIG.address) {
      const deploymentResponse = await fetch(
        "/src/contracts/deploymentInfo.json"
      );
      if (deploymentResponse.ok) {
        const deploymentInfo = await deploymentResponse.json();
        CONTRACT_CONFIG.address = deploymentInfo.contractAddress;
        console.log("✅ Contract address loaded from deploymentInfo.json");
      }
    }

    if (!CONTRACT_CONFIG.address || !CONTRACT_CONFIG.abi) {
      throw new Error(
        "Contract configuration not found. Please deploy the contract first."
      );
    }

    console.log("✅ Final contract config:", {
      address: CONTRACT_CONFIG.address,
      abiMethods: CONTRACT_CONFIG.abi.filter((item) => item.type === "function")
        .length,
    });
  } catch (error) {
    console.error("❌ Error loading contract config:", error);
    throw new Error(
      "Contract not deployed or configuration missing. Please run deployment script first."
    );
  }
};

/**
 * Get contract instance for interacting with smart contract
 */
export const getContract = async () => {
  try {
    if (!web3) {
      await initializeProvider();
    }

    if (!CONTRACT_CONFIG.address || !CONTRACT_CONFIG.abi) {
      await loadContractConfig();
    }

    // Create contract instance
    contract = new web3.eth.Contract(
      CONTRACT_CONFIG.abi,
      CONTRACT_CONFIG.address
    );

    console.log("✅ Contract instance created");
    console.log("📋 Contract address:", contract.options.address);
    console.log("📋 Available methods:", Object.keys(contract.methods));

    // Test if getAllProducts method exists
    if (contract.methods.getAllProducts) {
      console.log("✅ getAllProducts method is available");
    } else {
      console.error("❌ getAllProducts method NOT found!");
      console.log("Available methods:", Object.keys(contract.methods));
    }

    return contract;
  } catch (error) {
    console.error("❌ Error getting contract:", error);
    throw error;
  }
};

export const sendTransaction = async (contractMethod, options = {}) => {
  try {
    if (!currentAccount) {
      throw new Error("Please connect your wallet first");
    }

    // Estimate gas for the transaction
    const gasEstimate = await contractMethod.estimateGas({
      from: currentAccount,
      ...options,
    });

    // Add 20% buffer to gas estimate
    const gasLimit = Math.floor(gasEstimate * 1.2);

    // Send the transaction
    const result = await contractMethod.send({
      from: currentAccount,
      gas: gasLimit,
      ...options,
    });

    console.log("✅ Transaction successful:", result.transactionHash);
    return result;
  } catch (error) {
    console.error("❌ Transaction failed:", error);

    // Provide user-friendly error messages
    if (error.message.includes("User denied")) {
      throw new Error("Transaction cancelled by user");
    } else if (error.message.includes("insufficient funds")) {
      throw new Error("Insufficient ETH balance for transaction");
    } else if (error.message.includes("revert")) {
      // Extract revert reason from error message
      const revertReason =
        error.message.match(/revert (.+?)"/)?.[1] || "Transaction failed";
      throw new Error(revertReason);
    } else {
      throw new Error(error.message || "Transaction failed");
    }
  }
};

/**
 * Call a view function (read-only, no gas cost)
 */
export const callViewFunction = async (contractMethod) => {
  try {
    const result = await contractMethod.call();
    return result;
  } catch (error) {
    console.error("❌ View function call failed:", error);
    throw error;
  }
};


/**
 * Convert ETH to Wei (smallest unit of ETH)
 * 1 ETH = 10^18 Wei
 */
export const ethToWei = (ethAmount) => {
  if (!web3) return "0";
  return web3.utils.toWei(ethAmount.toString(), "ether");
};

/**
 * Convert Wei to ETH
 */
export const weiToEth = (weiAmount) => {
  if (!web3) return "0";
  return web3.utils.fromWei(weiAmount.toString(), "ether");
};

/**
 * Format address for display (show first 6 and last 4 characters)
 */
export const formatAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format ETH amount for display
 */
export const formatEth = (ethAmount, decimals = 4) => {
  const num = parseFloat(ethAmount);
  if (isNaN(num)) return "0";
  return num.toFixed(decimals);
};

/**
 * Check if current network is correct
 */
export const checkNetwork = async () => {
  try {
    if (!web3) return false;

    const chainId = await web3.eth.getChainId();

    // For local development (Hardhat network)
    if (chainId === 31337) {
      return { correct: true, name: "Hardhat Local" };
    }

    // For Sepolia testnet
    if (chainId === 11155111) {
      return { correct: true, name: "Sepolia Testnet" };
    }

    // For Ethereum mainnet
    if (chainId === 1) {
      return { correct: true, name: "Ethereum Mainnet" };
    }

    return {
      correct: false,
      name: `Unknown Network (${chainId})`,
      message: "Please switch to Hardhat Local network for development",
    };
  } catch (error) {
    console.error("❌ Error checking network:", error);
    return {
      correct: false,
      name: "Unknown",
      message: "Failed to check network",
    };
  }
};

/**
 * Switch to local Hardhat network
 */
export const switchToLocalNetwork = async () => {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x7A69" }], // 31337 in hex
    });
  } catch (error) {
    // If network doesn't exist, add it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x7A69",
            chainName: "Hardhat Local",
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: ["http://127.0.0.1:8545"],
            blockExplorerUrls: null,
          },
        ],
      });
    } else {
      throw error;
    }
  }
};


export const getWeb3 = () => web3;
export const getCurrentContract = () => contract;
export const getCurrentAccountAddress = () => currentAccount;
