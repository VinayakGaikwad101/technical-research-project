

import { useState } from 'react';
import ProductCard from './ProductCard';

const ProductList = ({ 
  products, 
  contract, 
  account, 
  loading, 
  onProductPurchased 
}) => {
  
  const [purchasingId, setPurchasingId] = useState(null);
  const [error, setError] = useState('');

  
  /**
   * Handle product purchase
   */
  const handlePurchase = async (productId, price) => {
    try {
      setPurchasingId(productId);
      setError('');
      
      console.log(`🛒 Attempting to buy product ${productId} for ${price} Wei`);
      
      // Call the buyProduct function on the smart contract
      const result = await contract.methods.buyProduct(productId).send({
        from: account,
        value: price
      });
      
      console.log('✅ Purchase successful:', result.transactionHash);
      
      // Notify parent component to refresh products
      onProductPurchased();
      
    } catch (err) {
      console.error('❌ Purchase failed:', err);
      
      // Handle different error types
      let errorMessage = 'Purchase failed';
      
      if (err.message.includes('User denied')) {
        errorMessage = 'Transaction cancelled by user';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH balance';
      } else if (err.message.includes('Product already sold')) {
        errorMessage = 'Product already sold';
      } else if (err.message.includes('Cannot buy your own product')) {
        errorMessage = 'Cannot buy your own product';
      } else if (err.message.includes('Insufficient payment')) {
        errorMessage = 'Insufficient payment amount';
      } else if (err.message.includes('Product does not exist')) {
        errorMessage = 'Product does not exist';
      }
      
      setError(errorMessage);
      
    } finally {
      setPurchasingId(null);
    }
  };

  
  /**
   * Render loading state
   */
  const renderLoading = () => (
    <div className="products-loading">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h3>🔄 Loading products from blockchain...</h3>
        <p>This may take a few seconds</p>
      </div>
    </div>
  );

  /**
   * Render empty state
   */
  const renderEmpty = () => (
    <div className="products-empty">
      <div className="empty-container">
        <div className="empty-icon">🏪</div>
        <h3>No products available</h3>
        <p>Be the first to add a product to the marketplace!</p>
      </div>
    </div>
  );

  /**
   * Render error state
   */
  const renderError = () => (
    <div className="products-error">
      <div className="error-container">
        <span className="error-icon">❌</span>
        <span className="error-text">{error}</span>
        <button 
          className="btn btn-secondary btn-small"
          onClick={() => setError('')}
        >
          Dismiss
        </button>
      </div>
    </div>
  );

  /**
   * Filter and categorize products
   */
  const categorizeProducts = () => {
    const available = products.filter(product => !product.sold);
    const sold = products.filter(product => product.sold);
    const myProducts = products.filter(product => 
      product.seller.toLowerCase() === account?.toLowerCase()
    );
    
    return { available, sold, myProducts };
  };

  
  // Show loading state
  if (loading && products.length === 0) {
    return renderLoading();
  }

  // Show empty state
  if (!loading && products.length === 0) {
    return renderEmpty();
  }

  const { available, sold, myProducts } = categorizeProducts();

  return (
    <div className="product-list">
      
      {/* Error banner */}
      {error && renderError()}

      {/* Products sections */}
      <div className="products-sections">
        
        {/* Available Products */}
        {available.length > 0 && (
          <section className="products-section">
            <div className="section-header">
              <h3>🛒 Available Products ({available.length})</h3>
              <p>Products you can buy right now</p>
            </div>
            <div className="products-grid">
              {available.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  account={account}
                  onPurchase={handlePurchase}
                  purchasing={purchasingId === product.id}
                  canPurchase={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* My Products */}
        {myProducts.length > 0 && (
          <section className="products-section">
            <div className="section-header">
              <h3>📦 My Products ({myProducts.length})</h3>
              <p>Products you've added to the marketplace</p>
            </div>
            <div className="products-grid">
              {myProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  account={account}
                  onPurchase={handlePurchase}
                  purchasing={false}
                  canPurchase={false}
                  isOwner={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sold Products */}
        {sold.length > 0 && (
          <section className="products-section">
            <div className="section-header">
              <h3>✅ Sold Products ({sold.length})</h3>
              <p>Products that have been purchased</p>
            </div>
            <div className="products-grid">
              {sold.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  account={account}
                  onPurchase={handlePurchase}
                  purchasing={false}
                  canPurchase={false}
                  isSold={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* All sections empty */}
        {available.length === 0 && sold.length === 0 && myProducts.length === 0 && (
          <div className="no-products">
            <div className="no-products-content">
              <h3>🏪 No products found</h3>
              <p>There are no products in the marketplace yet.</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      {products.length > 0 && (
        <div className="products-summary">
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-number">{products.length}</span>
              <span className="stat-label">Total Products</span>
            </div>
            <div className="stat">
              <span className="stat-number">{available.length}</span>
              <span className="stat-label">Available</span>
            </div>
            <div className="stat">
              <span className="stat-number">{sold.length}</span>
              <span className="stat-label">Sold</span>
            </div>
            <div className="stat">
              <span className="stat-number">{myProducts.length}</span>
              <span className="stat-label">Mine</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
