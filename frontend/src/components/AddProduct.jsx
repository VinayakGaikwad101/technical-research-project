
import { useState } from 'react';
import { ethToWei, formatEth } from '../utils/web3Utils';

const AddProduct = ({ contract, account, onProductAdded, onCancel }) => {
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  
  /**
   * Validate form inputs
   */
  const validateForm = () => {
    const errors = {};
    
    // Validate product name
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Product name must be at least 3 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Product name must be less than 100 characters';
    }
    
    // Validate description
    if (!formData.description.trim()) {
      errors.description = 'Product description is required';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    
    // Validate price
    if (!formData.price) {
      errors.price = 'Price is required';
    } else {
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum)) {
        errors.price = 'Price must be a valid number';
      } else if (priceNum <= 0) {
        errors.price = 'Price must be greater than 0';
      } else if (priceNum > 1000) {
        errors.price = 'Price seems too high (max 1000 ETH)';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  
  /**
   * Handle input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error
    if (error) {
      setError('');
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Convert price to Wei
      const priceInWei = ethToWei(formData.price);
      
      console.log('📦 Adding product:', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price,
        priceInWei
      });
      
      // Call smart contract function
      const result = await contract.methods.addProduct(
        formData.name.trim(),
        formData.description.trim(),
        priceInWei
      ).send({
        from: account
      });
      
      console.log('✅ Product added successfully:', result.transactionHash);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: ''
      });
      
      // Notify parent component
      onProductAdded();
      
    } catch (err) {
      console.error('❌ Error adding product:', err);
      
      // Handle different error types
      let errorMessage = 'Failed to add product';
      
      if (err.message.includes('User denied')) {
        errorMessage = 'Transaction cancelled by user';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH for gas fees';
      } else if (err.message.includes('Product name cannot be empty')) {
        errorMessage = 'Product name cannot be empty';
      } else if (err.message.includes('Product price must be greater than 0')) {
        errorMessage = 'Product price must be greater than 0';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form reset
   */
  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      price: ''
    });
    setValidationErrors({});
    setError('');
  };

  
  /**
   * Render input field with validation
   */
  const renderInput = (name, label, type = 'text', placeholder = '', maxLength = null) => (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        <span className="required">*</span>
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`form-input ${validationErrors[name] ? 'error' : ''}`}
        disabled={loading}
      />
      {validationErrors[name] && (
        <span className="error-text">{validationErrors[name]}</span>
      )}
      {maxLength && (
        <span className="char-count">
          {formData[name].length}/{maxLength}
        </span>
      )}
    </div>
  );

  /**
   * Render textarea field with validation
   */
  const renderTextarea = (name, label, placeholder = '', maxLength = null) => (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        <span className="required">*</span>
      </label>
      <textarea
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        className={`form-textarea ${validationErrors[name] ? 'error' : ''}`}
        disabled={loading}
      />
      {validationErrors[name] && (
        <span className="error-text">{validationErrors[name]}</span>
      )}
      {maxLength && (
        <span className="char-count">
          {formData[name].length}/{maxLength}
        </span>
      )}
    </div>
  );

  
  return (
    <div className="add-product">
      <div className="add-product-container">
        
        {/* Header */}
        <div className="add-product-header">
          <h3>➕ Add New Product</h3>
          <p>List your product on the blockchain marketplace</p>
        </div>

        {/* Error display */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">❌</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="add-product-form">
          
          {/* Product Name */}
          {renderInput(
            'name',
            '📝 Product Name',
            'text',
            'e.g., iPhone 15 Pro Max',
            100
          )}

          {/* Product Description */}
          {renderTextarea(
            'description',
            '📄 Product Description',
            'Describe your product in detail...',
            500
          )}

          {/* Price */}
          <div className="form-group">
            <label htmlFor="price" className="form-label">
              💰 Price (ETH)
              <span className="required">*</span>
            </label>
            <div className="price-input-container">
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.1"
                step="0.0001"
                min="0"
                max="1000"
                className={`form-input price-input ${validationErrors.price ? 'error' : ''}`}
                disabled={loading}
              />
              <span className="price-unit">ETH</span>
            </div>
            {validationErrors.price && (
              <span className="error-text">{validationErrors.price}</span>
            )}
            {formData.price && !validationErrors.price && (
              <div className="price-info">
                <span className="price-conversion">
                  ≈ {formatEth(formData.price, 6)} ETH
                </span>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              ❌ Cancel
            </button>
            
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleReset}
              disabled={loading}
            >
              🔄 Reset
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || Object.keys(validationErrors).length > 0}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Adding Product...
                </>
              ) : (
                <>
                  ➕ Add Product
                </>
              )}
            </button>
          </div>
        </form>

        {/* Help section */}
        <div className="add-product-help">
          <h4>💡 Tips for Success</h4>
          <ul>
            <li>✅ Use clear, descriptive product names</li>
            <li>✅ Provide detailed descriptions</li>
            <li>✅ Set competitive prices</li>
            <li>✅ Double-check all information before submitting</li>
            <li>⚠️ Transactions cannot be undone once confirmed</li>
          </ul>
        </div>

        {/* Transaction info */}
        <div className="transaction-info">
          <h4>🔧 Transaction Details</h4>
          <p>
            <strong>Gas Fee:</strong> You'll pay a small gas fee to add your product to the blockchain.
          </p>
          <p>
            <strong>Permanence:</strong> Once added, your product will be permanently stored on the blockchain.
          </p>
          <p>
            <strong>Ownership:</strong> Only you can receive payments for this product.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
