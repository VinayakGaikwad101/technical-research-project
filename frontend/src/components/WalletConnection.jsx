/**
 * WALLET CONNECTION COMPONENT
 *
 * This component handles the initial wallet connection flow.
 * It's shown when the user hasn't connected their MetaMask wallet yet.
 *
 * FEATURES:
 * - MetaMask detection
 * - Connection instructions
 * - Error handling
 * - Loading states
 *
 * BEGINNER CONCEPTS:
 * - Component props
 * - Event handling
 * - Conditional rendering
 * - User experience design
 */

import { useState, useEffect } from "react";
import { checkNetwork, switchToLocalNetwork } from "../utils/web3Utils";

const WalletConnection = ({ onConnect, loading }) => {
  // ==================== STATE MANAGEMENT ====================

  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState("");
  const [network, setNetwork] = useState(null);

  // ==================== EFFECTS ====================

  /**
   * Check if MetaMask is installed when component mounts
   */
  useEffect(() => {
    checkMetaMaskInstallation();
  }, []);

  // ==================== METAMASK DETECTION ====================

  /**
   * Check if MetaMask is installed and available
   */
  const checkMetaMaskInstallation = async () => {
    try {
      setIsChecking(true);

      // Wait a bit for MetaMask to inject
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Multiple detection methods for better compatibility
      const hasEthereum = typeof window.ethereum !== "undefined";
      const isMetaMask = window.ethereum && window.ethereum.isMetaMask;
      const hasWeb3 = typeof window.web3 !== "undefined";

      console.log("🔍 Detection results:", {
        hasEthereum,
        isMetaMask,
        hasWeb3,
        ethereum: window.ethereum,
        ethereumIsMetaMask: window.ethereum?.isMetaMask,
      });

      // More aggressive detection - if ANY ethereum provider exists, assume MetaMask
      if (hasEthereum) {
        setHasMetaMask(true);
        console.log("✅ Ethereum provider detected - assuming MetaMask");

        // Check network status
        try {
          const networkInfo = await checkNetwork();
          setNetwork(networkInfo);
          console.log("✅ Network check successful:", networkInfo);
        } catch (err) {
          console.log("⚠️ Network check failed, but continuing...", err);
          // Set a default network state to allow connection
          setNetwork({ correct: false, name: "Unknown Network" });
        }
      } else {
        setHasMetaMask(false);
        console.log("❌ No Ethereum provider detected");
      }
    } catch (error) {
      console.error("❌ Error checking MetaMask:", error);
      setError("Failed to detect MetaMask");
    } finally {
      setIsChecking(false);
    }
  };

  // ==================== EVENT HANDLERS ====================

  /**
   * Handle connect wallet button click
   */
  const handleConnect = async () => {
    try {
      setError("");
      await onConnect();
    } catch (err) {
      setError(err.message || "Failed to connect wallet");
    }
  };

  /**
   * Handle network switch
   */
  const handleSwitchNetwork = async () => {
    try {
      setError("");
      await switchToLocalNetwork();

      // Recheck network after switch
      setTimeout(async () => {
        const networkInfo = await checkNetwork();
        setNetwork(networkInfo);
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to switch network");
    }
  };

  // ==================== RENDER HELPERS ====================

  /**
   * Render MetaMask installation instructions
   */
  const renderInstallInstructions = () => (
    <div className="wallet-connection-card">
      <div className="connection-icon">🦊</div>
      <h2>MetaMask Required</h2>
      <p>
        To use this blockchain marketplace, you need to install MetaMask - a
        secure wallet for interacting with Ethereum applications.
      </p>

      <div className="installation-steps">
        <h3>📋 Installation Steps:</h3>
        <ol>
          <li>
            Visit{" "}
            <a
              href="https://metamask.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              metamask.io
            </a>
          </li>
          <li>Click "Download" and install the browser extension</li>
          <li>Create a new wallet or import existing one</li>
          <li>Return to this page and refresh</li>
        </ol>
      </div>

      <div className="action-buttons">
        <a
          href="https://metamask.io"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          🦊 Install MetaMask
        </a>
        <button
          className="btn btn-secondary"
          onClick={checkMetaMaskInstallation}
        >
          🔄 Check Again
        </button>
      </div>
    </div>
  );

  /**
   * Render connection interface
   */
  const renderConnectionInterface = () => (
    <div className="wallet-connection-card">
      <div className="connection-icon">🔗</div>
      <h2>Connect Your Wallet</h2>
      <p>
        Connect your MetaMask wallet to start buying and selling products on the
        blockchain marketplace.
      </p>

      {/* Network status */}
      {network && (
        <div className="network-info">
          <div
            className={`network-status ${network.correct ? "good" : "warning"}`}
          >
            <span className="status-icon">{network.correct ? "🟢" : "🟡"}</span>
            <span className="status-text">Network: {network.name}</span>
          </div>

          {!network.correct && (
            <div className="network-warning">
              <p>⚠️ You're on the wrong network!</p>
              <p>Please switch to Hardhat Local network for development.</p>
              <button
                className="btn btn-warning btn-small"
                onClick={handleSwitchNetwork}
              >
                🔄 Switch Network
              </button>
            </div>
          )}
        </div>
      )}

      {/* Connection instructions */}
      <div className="connection-instructions">
        <h3>🚀 What happens when you connect?</h3>
        <ul>
          <li>✅ View products on the blockchain</li>
          <li>✅ Add your own products for sale</li>
          <li>✅ Buy products with ETH</li>
          <li>✅ Track your transactions</li>
        </ul>
      </div>

      {/* Error display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {/* Connect button */}
      <div className="action-buttons">
        <button
          className="btn btn-primary btn-large"
          onClick={handleConnect}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Connecting...
            </>
          ) : (
            <>🦊 Connect MetaMask</>
          )}
        </button>
      </div>

      {/* Help section */}
      <div className="help-section">
        <h4>❓ Need Help?</h4>
        <details>
          <summary>Common Issues</summary>
          <div className="help-content">
            <p>
              <strong>MetaMask not opening?</strong>
            </p>
            <p>Click the MetaMask extension icon in your browser toolbar.</p>

            <p>
              <strong>Wrong network?</strong>
            </p>
            <p>Switch to "Hardhat Local" network in MetaMask settings.</p>

            <p>
              <strong>No test ETH?</strong>
            </p>
            <p>Import a test account from the Hardhat node console output.</p>
          </div>
        </details>
      </div>
    </div>
  );

  /**
   * Render loading state
   */
  const renderLoading = () => (
    <div className="wallet-connection-card">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Checking MetaMask...</h2>
        <p>Please wait while we detect your wallet.</p>
      </div>
    </div>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className="wallet-connection">
      <div className="connection-container">
        {isChecking
          ? renderLoading()
          : hasMetaMask
          ? renderConnectionInterface()
          : renderInstallInstructions()}
      </div>

      {/* Background info */}
      <div className="background-info">
        <div className="info-grid">
          <div className="info-card">
            <h3>🔒 Secure</h3>
            <p>
              Your wallet keys never leave your device. All transactions are
              signed locally.
            </p>
          </div>
          <div className="info-card">
            <h3>🌐 Decentralized</h3>
            <p>
              No central authority controls this marketplace. It runs on the
              Ethereum blockchain.
            </p>
          </div>
          <div className="info-card">
            <h3>💰 Direct Payments</h3>
            <p>Payments go directly from buyer to seller. No middleman fees.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnection;

/**
 * ==================== COMPONENT SUMMARY ====================
 *
 * The WalletConnection component handles:
 *
 * 1. METAMASK DETECTION:
 *    - Checks if MetaMask is installed
 *    - Provides installation instructions
 *    - Handles browser compatibility
 *
 * 2. NETWORK VALIDATION:
 *    - Checks current network
 *    - Shows network warnings
 *    - Provides network switching
 *
 * 3. CONNECTION FLOW:
 *    - Clear connection button
 *    - Loading states
 *    - Error handling
 *    - Success feedback
 *
 * 4. USER EDUCATION:
 *    - Explains what connection does
 *    - Shows benefits of the dApp
 *    - Provides troubleshooting help
 *
 * 5. RESPONSIVE DESIGN:
 *    - Works on all screen sizes
 *    - Clear visual hierarchy
 *    - Accessible interactions
 *
 * BEGINNER CONCEPTS DEMONSTRATED:
 * - Component lifecycle with useEffect
 * - Conditional rendering patterns
 * - Error state management
 * - User experience considerations
 * - External link handling
 * - Loading state patterns
 * - Help and documentation integration
 */