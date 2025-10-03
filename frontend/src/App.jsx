import { useState, useEffect } from "react";
import "./App.css";
import WalletConnection from "./components/WalletConnection";
import ProductList from "./components/ProductList";
import AddProduct from "./components/AddProduct";
import Header from "./components/Header";
import {
  connectWallet,
  getCurrentAccount,
  getContract,
} from "./utils/web3Utils";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (account) {
      initializeContract();
    } else {
      setContract(null);
      setProducts([]);
    }
  }, [account]);

  const initializeApp = async () => {
    try {
      setLoading(true);

      const currentAccount = await getCurrentAccount();
      if (currentAccount) {
        setAccount(currentAccount);
        console.log("👤 Found existing wallet connection:", currentAccount);
      } else {
        console.log("👤 No existing wallet connection found");
      }
    } catch (err) {
      console.error("❌ Error initializing app:", err);
      setError("Failed to initialize app. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  const initializeContract = async () => {
    try {
      setLoading(true);
      setError("");

      const contractInstance = await getContract();
      setContract(contractInstance);
      console.log("📋 Contract connected successfully");

      await loadProducts(contractInstance);
    } catch (err) {
      console.error("❌ Error initializing contract:", err);
      setError(
        "Failed to connect to smart contract. Make sure it's deployed and you're on the correct network."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      setError("");

      const walletAccount = await connectWallet();
      setAccount(walletAccount);
      console.log("✅ Wallet connected:", walletAccount);
    } catch (err) {
      console.error("❌ Error connecting wallet:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectWallet = () => {
    setAccount(null);
    setContract(null);
    setProducts([]);
    console.log("👋 Wallet disconnected");
  };

  const loadProducts = async (contractInstance = contract) => {
    if (!contractInstance) return;

    try {
      setLoading(true);

      console.log("🔍 Loading products from contract...");
      console.log(
        "📋 Contract methods available:",
        Object.keys(contractInstance.methods)
      );

      if (!contractInstance.methods.getAllProducts) {
        throw new Error("getAllProducts method not found on contract");
      }

      const allProducts = await contractInstance.methods
        .getAllProducts()
        .call();

      console.log("📦 Raw products from contract:", allProducts);

      const formattedProducts = allProducts.map((product) => ({
        id: Number(product.id),
        name: product.name,
        description: product.description,
        price: product.price.toString(), 
        seller: product.seller,
        sold: product.sold,
      }));

      setProducts(formattedProducts);
      console.log(`📦 Loaded ${formattedProducts.length} products`);
    } catch (err) {
      console.error("❌ Error loading products:", err);
      setError("Failed to load products from blockchain");
    } finally {
      setLoading(false);
    }
  };

  const handleProductAdded = () => {
    loadProducts();
    setShowAddProduct(false);
    console.log("✅ Product added successfully");
  };

  const handleProductPurchased = () => {
    loadProducts();
    console.log("✅ Product purchased successfully");
  };

  if (loading && !account) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>🔄 Initializing Blockchain Marketplace...</h2>
          <p>Checking for wallet connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header account={account} onDisconnect={handleDisconnectWallet} />

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <span>❌ {error}</span>
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        {!account ? (
          <WalletConnection onConnect={handleConnectWallet} loading={loading} />
        ) : (
          <div className="marketplace">
            <div className="marketplace-controls">
              <div className="controls-left">
                <h2>🛒 Marketplace ({products.length} products)</h2>
              </div>
              <div className="controls-right">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddProduct(!showAddProduct)}
                >
                  {showAddProduct ? "❌ Cancel" : "➕ Add Product"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => loadProducts()}
                  disabled={loading}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {showAddProduct && (
              <AddProduct
                contract={contract}
                account={account}
                onProductAdded={handleProductAdded}
                onCancel={() => setShowAddProduct(false)}
              />
            )}

            <ProductList
              products={products}
              contract={contract}
              account={account}
              loading={loading}
              onProductPurchased={handleProductPurchased}
            />

            {products.length === 0 && !loading && (
              <div className="empty-state">
                <h3>🏪 No products yet!</h3>
                <p>Be the first to add a product to the marketplace.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddProduct(true)}
                >
                  ➕ Add First Product
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>
          🚀 Built with React + Hardhat + Solidity |
          {account && (
            <span>
              {" "}
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          )}
        </p>
      </footer>
    </div>
  );
}

export default App;