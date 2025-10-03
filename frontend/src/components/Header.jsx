

import { useState, useEffect } from 'react';
import { getAccountBalance, checkNetwork, formatAddress } from '../utils/web3Utils';

const Header = ({ account, onDisconnect }) => {
  
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState({ correct: false, name: 'Unknown' });
  const [loading, setLoading] = useState(false);

  
  /**
   * Load account balance and network info when account changes
   */
  useEffect(() => {
    if (account) {
      loadAccountInfo();
    } else {
      setBalance('0');
      setNetwork({ correct: false, name: 'Unknown' });
    }
  }, [account]);

  
  /**
   * Load account balance and network information
   */
  const loadAccountInfo = async () => {
    try {
      setLoading(true);
      
      // Load balance and network info in parallel
      const [accountBalance, networkInfo] = await Promise.all([
        getAccountBalance(account),
        checkNetwork()
      ]);
      
      setBalance(accountBalance);
      setNetwork(networkInfo);
      
    } catch (error) {
      console.error('❌ Error loading account info:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== EVENT HANDLERS ====================
  
  /**
   * Handle disconnect button click
   */
  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect your wallet?')) {
      onDisconnect();
    }
  };

  /**
   * Handle refresh button click
   */
  const handleRefresh = () => {
    if (account) {
      loadAccountInfo();
    }
  };

  // ==================== RENDER COMPONENT ====================
  
  return (
    <header className="header">
      <div className="header-container">
        
        {/* Left side - App branding */}
        <div className="header-left">
          <div className="app-logo">
            <span className="logo-icon">🛒</span>
            <div className="logo-text">
              <h1>Blockchain Market</h1>
              <span className="logo-subtitle">Decentralized Marketplace</span>
            </div>
          </div>
        </div>

        {/* Right side - Wallet info */}
        <div className="header-right">
          {account ? (
            /* Connected state */
            <div className="wallet-info">
              
              {/* Network status */}
              <div className={`network-status ${network.correct ? 'connected' : 'warning'}`}>
                <span className="network-indicator">
                  {network.correct ? '🟢' : '🟡'}
                </span>
                <span className="network-name">{network.name}</span>
              </div>

              {/* Account info */}
              <div className="account-info">
                <div className="account-details">
                  <div className="account-address">
                    <span className="address-label">Account:</span>
                    <span className="address-value" title={account}>
                      {formatAddress(account)}
                    </span>
                  </div>
                  <div className="account-balance">
                    <span className="balance-label">Balance:</span>
                    <span className="balance-value">
                      {loading ? '...' : `${balance} ETH`}
                    </span>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="account-actions">
                  <button 
                    className="btn btn-small btn-secondary"
                    onClick={handleRefresh}
                    disabled={loading}
                    title="Refresh balance"
                  >
                    🔄
                  </button>
                  <button 
                    className="btn btn-small btn-danger"
                    onClick={handleDisconnect}
                    title="Disconnect wallet"
                  >
                    🚪 Disconnect
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Not connected state */
            <div className="wallet-info">
              <div className="not-connected">
                <span className="connection-status">
                  🔴 Wallet Not Connected
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Network warning banner */}
      {account && !network.correct && (
        <div className="network-warning">
          <div className="warning-content">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">
              {network.message || 'Please switch to the correct network'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
