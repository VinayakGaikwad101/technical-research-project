pragma solidity ^0.8.28;

contract SimpleMarket {
    
    struct Product {
        uint256 id;          // Unique number for each product (like a barcode)
        string name;         // Product name (e.g., "iPhone 15")
        string description;  // Product details (e.g., "Brand new, 128GB")
        uint256 price;       // Price in Wei (smallest unit of ETH)
        address payable seller; // Wallet address of the person selling
        bool sold;           // true/false - has this been sold yet?
    }

    
    mapping(uint256 => Product) public products;
    
    uint256 public productCount = 0;

    event ProductAdded(
        uint256 indexed id,        // 'indexed' makes this searchable
        string name,
        string description,
        uint256 price,
        address indexed seller     // 'indexed' makes this searchable too
    );

    event ProductSold(
        uint256 indexed id,
        string name,
        uint256 price,
        address indexed seller,
        address indexed buyer
    );

    function addProduct(
        string memory _name,        // 'memory' = temporary storage, cheaper gas
        string memory _description, // Strings must specify storage location
        uint256 _price              // Numbers don't need storage location
    ) public {
        
       
        require(bytes(_name).length > 0, "Product name cannot be empty");
        
        require(_price > 0, "Product price must be greater than 0");
        productCount++;
        
        
        products[productCount] = Product(
            productCount,           // Unique ID for this product
            _name,                  // Product name from parameter
            _description,           // Product description from parameter
            _price,                 // Product price from parameter
            payable(msg.sender),    // Seller is whoever called this function
            false                   // Not sold yet
        );

        emit ProductAdded(productCount, _name, _description, _price, msg.sender);
    }

    function buyProduct(uint256 _id) public payable {
        
        Product storage product = products[_id];
        
        
        // Check if product exists
        require(_id > 0 && _id <= productCount, "Product does not exist");
        // Product IDs start from 1, not 0
        
        // Check if buyer sent enough ETH
        require(msg.value >= product.price, "Insufficient payment");
        // msg.value = ETH sent with transaction
        
        // Check if product is still available
        require(!product.sold, "Product already sold");
        // ! means "not", so !product.sold means "not sold"
        
        // Check if buyer is not the seller
        require(product.seller != msg.sender, "Cannot buy your own product");
        product.sold = true;

        product.seller.transfer(product.price);

        if (msg.value > product.price) {
            payable(msg.sender).transfer(msg.value - product.price);
        }

        
        emit ProductSold(_id, product.name, product.price, product.seller, msg.sender);
    }

    function getProduct(uint256 _id) public view returns (
        uint256 id,
        string memory name,
        string memory description,
        uint256 price,
        address seller,
        bool sold
    ) {
        // Check if product exists
        require(_id > 0 && _id <= productCount, "Product does not exist");
        
        // Get reference to the product
        Product storage product = products[_id];
        
        return (
            product.id,
            product.name,
            product.description,
            product.price,
            product.seller,
            product.sold
        );
    }

    function getAllProducts() public view returns (Product[] memory) {
        
       
        Product[] memory allProducts = new Product[](productCount);
        
       
        for (uint256 i = 1; i <= productCount; i++) {
            
            allProducts[i - 1] = products[i];
        }
        
        // Return the complete array to the caller
        return allProducts;
    }

   
    function getTotalProducts() public view returns (uint256) {
        return productCount;
    }
    

    function isProductAvailable(uint256 _id) public view returns (bool) {
        if (_id == 0 || _id > productCount) {
            return false; // Product doesn't exist
        }
        return !products[_id].sold; // Return true if not sold
    }
}
