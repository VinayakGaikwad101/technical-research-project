import { weiToEth, formatAddress, formatEth } from '../utils/web3Utils';

const ProductCard = ({ 
  product, 
  account, 
  onPurchase, 
  purchasing, 
  canPurchase, 
  isOwner = false,
  isSold = false 
}) => {
  
  /**
   * Format product price for display
   */
  const formatPrice = () => {
    const ethAmount = weiToEth(product.price);
    return formatEth(ethAmount, 4);
  };

  /**
   * Check if current user is the seller
   */
  const isCurrentUserSeller = () => {
    return product.seller.toLowerCase() === account?.toLowerCase();
  };

  /**
   * Get card status class
   */
  const getCardStatusClass = () => {
    if (isSold || product.sold) return 'sold';
    if (isOwner || isCurrentUserSeller()) return 'owner';
    if (canPurchase) return 'available';
    return 'default';
  };

  /**
   * Get status badge
   */
  const getStatusBadge = () => {
    if (isSold || product.sold) {
      return { text: 'SOLD', icon: '✅', class: 'sold' };
    }
    if (isOwner || isCurrentUserSeller()) {
      return { text: 'YOUR PRODUCT', icon: '👤', class: 'owner' };
    }
    if (canPurchase) {
      return { text: 'AVAILABLE', icon: '🛒', class: 'available' };
    }
    return null;
  };

  
  /**
   * Handle buy button click
   */
  const handleBuyClick = () => {
    if (canPurchase && !purchasing && onPurchase) {
      onPurchase(product.id, product.price);
    }
  };

  /**
   * Handle seller address click (copy to clipboard)
   */
  const handleSellerClick = async () => {
    try {
      await navigator.clipboard.writeText(product.seller);
      // You could add a toast notification here
      console.log('✅ Seller address copied to clipboard');
    } catch (err) {
      console.log('❌ Failed to copy address');
    }
  };

  
  /**
   * Render product status badge
   */
  const renderStatusBadge = () => {
    const badge = getStatusBadge();
    if (!badge) return null;

    return (
      <div className={`product-badge ${badge.class}`}>
        <span className="badge-icon">{badge.icon}</span>
        <span className="badge-text">{badge.text}</span>
      </div>
    );
  };

  /**
   * Render product actions (buy button, etc.)
   */
  const renderActions = () => {
    // No actions for sold products
    if (isSold || product.sold) {
      return (
        <div className="product-actions">
          <div className="sold-indicator">
            <span className="sold-icon">✅</span>
            <span className="sold-text">Product Sold</span>
          </div>
        </div>
      );
    }

    // No actions for owner's products
    if (isOwner || isCurrentUserSeller()) {
      return (
        <div className="product-actions">
          <div className="owner-indicator">
            <span className="owner-icon">👤</span>
            <span className="owner-text">Your Product</span>
          </div>
        </div>
      );
    }

    // Buy button for available products
    if (canPurchase) {
      return (
        <div className="product-actions">
          <button
            className="btn btn-primary btn-buy"
            onClick={handleBuyClick}
            disabled={purchasing}
          >
            {purchasing ? (
              <>
                <span className="loading-spinner"></span>
                Purchasing...
              </>
            ) : (
              <>
                🛒 Buy for {formatPrice()} ETH
              </>
            )}
          </button>
        </div>
      );
    }

    return null;
  };

  
  return (
    <div className={`product-card ${getCardStatusClass()}`}>
      
      {/* Status badge */}
      {renderStatusBadge()}

      {/* Product header */}
      <div className="product-header">
        <div className="product-id">
          <span className="id-label">ID:</span>
          <span className="id-value">#{product.id}</span>
        </div>
      </div>

      {/* Product content */}
      <div className="product-content">
        
        {/* Product name */}
        <h3 className="product-name" title={product.name}>
          {product.name}
        </h3>

        {/* Product description */}
        <p className="product-description" title={product.description}>
          {product.description}
        </p>

        {/* Product details */}
        <div className="product-details">
          
          {/* Price */}
          <div className="detail-item price-item">
            <span className="detail-label">💰 Price:</span>
            <span className="detail-value price-value">
              {formatPrice()} ETH
            </span>
          </div>

          {/* Seller */}
          <div className="detail-item seller-item">
            <span className="detail-label">👤 Seller:</span>
            <span 
              className="detail-value seller-value"
              onClick={handleSellerClick}
              title={`${product.seller} (click to copy)`}
            >
              {formatAddress(product.seller)}
            </span>
          </div>

          {/* Status */}
          <div className="detail-item status-item">
            <span className="detail-label">📊 Status:</span>
            <span className={`detail-value status-value ${product.sold ? 'sold' : 'available'}`}>
              {product.sold ? '❌ Sold' : '✅ Available'}
            </span>
          </div>
        </div>
      </div>

      {/* Product actions */}
      <div className="product-footer">
        {renderActions()}
      </div>

      {/* Additional info for debugging (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="product-debug">
          <details>
            <summary>🔧 Debug Info</summary>
            <div className="debug-content">
              <p><strong>Price (Wei):</strong> {product.price}</p>
              <p><strong>Seller:</strong> {product.seller}</p>
              <p><strong>Sold:</strong> {product.sold.toString()}</p>
              <p><strong>Can Purchase:</strong> {canPurchase.toString()}</p>
              <p><strong>Is Owner:</strong> {(isOwner || isCurrentUserSeller()).toString()}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
