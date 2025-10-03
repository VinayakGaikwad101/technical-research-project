// SPDX-License-Identifier: MIT
// This line specifies the license for the code. MIT is a permissive open-source license.
// SPDX (Software Package Data Exchange) is a standard way to declare licenses.

pragma solidity ^0.8.28;
// This line tells the compiler which version of Solidity to use.
// ^0.8.28 means "version 0.8.28 or higher, but less than 0.9.0"
// Solidity is the programming language for Ethereum smart contracts.

/**
 * @title SimpleMarket - A Beginner's Guide to Smart Contracts
 * @dev This contract demonstrates fundamental blockchain concepts:
 * - How to store data on the blockchain
 * - How to handle payments in cryptocurrency (ETH)
 * - How to create a simple marketplace where people can buy/sell items
 * 
 * WHAT IS A SMART CONTRACT?
 * A smart contract is like a digital vending machine:
 * - You put money in (ETH)
 * - You get something out (a product)
 * - The rules are automatic and can't be changed
 * - No middleman needed!
 */
contract SimpleMarket {
    
    // ==================== DATA TYPES & STRUCTURES ====================
    
    /**
     * @dev STRUCT: Think of this like a template or blueprint for creating objects
     * Just like a form with different fields, each Product has these properties:
     */
    struct Product {
        uint256 id;          // Unique number for each product (like a barcode)
        string name;         // Product name (e.g., "iPhone 15")
        string description;  // Product details (e.g., "Brand new, 128GB")
        uint256 price;       // Price in Wei (smallest unit of ETH)
        address payable seller; // Wallet address of the person selling
        bool sold;           // true/false - has this been sold yet?
    }
    
    /**
     * SOLIDITY DATA TYPES EXPLAINED:
     * 
     * uint256: Unsigned integer (positive numbers only), 256 bits
     *          Can store numbers from 0 to 2^256-1
     *          Perfect for IDs, prices, counts
     * 
     * string:  Text data, like "Hello World"
     *          Used for names, descriptions, URLs
     * 
     * address: Ethereum wallet address (42 characters starting with 0x)
     *          Like a bank account number for crypto
     *          'payable' means this address can receive ETH
     * 
     * bool:    Boolean - can only be true or false
     *          Perfect for yes/no, on/off states
     */

    // ==================== STATE VARIABLES ====================
    
    /**
     * @dev MAPPING: Think of this like a dictionary or phone book
     * Key: Product ID (number) → Value: Product details (struct)
     * Example: products[1] = {id: 1, name: "iPhone", price: 1000, ...}
     * 
     * 'public' means anyone can read this data from outside the contract
     */
    mapping(uint256 => Product) public products;
    
    /**
     * @dev Counter to track how many products we have
     * Starts at 0, increases by 1 each time someone adds a product
     * 'public' creates an automatic getter function
     */
    uint256 public productCount = 0;

    // ==================== EVENTS ====================
    
    /**
     * @dev EVENTS: Think of these like notifications or logs
     * When something important happens, we "emit" an event
     * Frontend applications can "listen" for these events
     * Events are cheaper than storing data and help track activity
     */
    
    /**
     * @dev Emitted when someone adds a new product to the marketplace
     * Parameters logged: product ID, name, description, price, seller's address
     */
    event ProductAdded(
        uint256 indexed id,        // 'indexed' makes this searchable
        string name,
        string description,
        uint256 price,
        address indexed seller     // 'indexed' makes this searchable too
    );

    /**
     * @dev Emitted when someone buys a product
     * Parameters logged: product ID, name, price, seller, buyer addresses
     */
    event ProductSold(
        uint256 indexed id,
        string name,
        uint256 price,
        address indexed seller,
        address indexed buyer
    );

    // ==================== FUNCTIONS ====================

    /**
     * @dev Function to add a new product to the marketplace
     * 
     * FUNCTION ANATOMY:
     * - function: keyword to declare a function
     * - addProduct: the function name
     * - (parameters): inputs the function needs
     * - public: anyone can call this function
     * - memory: temporary storage for string parameters
     * 
     * @param _name Product name (underscore prefix is convention for parameters)
     * @param _description Product description
     * @param _price Product price in Wei (1 ETH = 10^18 Wei)
     */
    function addProduct(
        string memory _name,        // 'memory' = temporary storage, cheaper gas
        string memory _description, // Strings must specify storage location
        uint256 _price              // Numbers don't need storage location
    ) public {
        
        // ==================== INPUT VALIDATION ====================
        
        /**
         * @dev REQUIRE statements are like security guards
         * If condition is false, the entire transaction fails and reverts
         * This protects against invalid or malicious inputs
         */
        
        // Check if name is not empty
        require(bytes(_name).length > 0, "Product name cannot be empty");
        // bytes(_name) converts string to bytes to check length
        // Empty strings have 0 length
        
        // Check if price is greater than 0
        require(_price > 0, "Product price must be greater than 0");
        // Can't sell something for free (would break our business logic)

        // ==================== BUSINESS LOGIC ====================
        
        // Increment the product counter (1, 2, 3, ...)
        productCount++;
        
        /**
         * @dev Create and store the new product
         * msg.sender = address of the person calling this function
         * payable(msg.sender) = makes the address able to receive ETH
         */
        products[productCount] = Product(
            productCount,           // Unique ID for this product
            _name,                  // Product name from parameter
            _description,           // Product description from parameter
            _price,                 // Product price from parameter
            payable(msg.sender),    // Seller is whoever called this function
            false                   // Not sold yet
        );

        // ==================== EVENT EMISSION ====================
        
        /**
         * @dev Emit event to notify the world that a product was added
         * Frontend apps can listen for this event and update the UI
         */
        emit ProductAdded(productCount, _name, _description, _price, msg.sender);
    }

    /**
     * @dev Function to buy a product from the marketplace
     * 
     * PAYABLE FUNCTION:
     * - 'payable' means this function can receive ETH
     * - msg.value = amount of ETH sent with the transaction
     * - Like putting money into a vending machine
     * 
     * @param _id The ID of the product to buy
     */
    function buyProduct(uint256 _id) public payable {
        
        /**
         * @dev Get reference to the product we want to buy
         * 'storage' means we're working with the actual data on blockchain
         * (not a copy like 'memory' would be)
         */
        Product storage product = products[_id];
        
        // ==================== VALIDATION CHECKS ====================
        
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
        // Prevents sellers from buying their own items

        // ==================== TRANSACTION LOGIC ====================
        
        // Mark product as sold (change state on blockchain)
        product.sold = true;

        /**
         * @dev Transfer payment to seller
         * .transfer() is a built-in function that sends ETH
         * If transfer fails, entire transaction reverts (safety feature)
         */
        product.seller.transfer(product.price);

        /**
         * @dev Refund excess payment to buyer
         * If buyer sent more ETH than needed, send the extra back
         * Example: Product costs 1 ETH, buyer sends 1.5 ETH → refund 0.5 ETH
         */
        if (msg.value > product.price) {
            payable(msg.sender).transfer(msg.value - product.price);
        }

        // ==================== EVENT EMISSION ====================
        
        // Notify the world that a sale happened
        emit ProductSold(_id, product.name, product.price, product.seller, msg.sender);
    }

    /**
     * @dev Function to get details of a specific product
     * 
     * VIEW FUNCTION:
     * - 'view' means this function only reads data, doesn't change anything
     * - No gas cost when called directly (not in a transaction)
     * - Returns data to the caller
     * 
     * @param _id The ID of the product to retrieve
     * @return id Product ID
     * @return name Product name
     * @return description Product description
     * @return price Product price in Wei
     * @return seller Address of the seller
     * @return sold Whether the product has been sold
     */
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
        
        /**
         * @dev Return all product details
         * Solidity can return multiple values (unlike many languages)
         * Frontend can destructure these values
         */
        return (
            product.id,
            product.name,
            product.description,
            product.price,
            product.seller,
            product.sold
        );
    }

    /**
     * @dev Function to get all products in the marketplace
     * 
     * ARRAYS IN SOLIDITY:
     * - Product[] = array of Product structs
     * - memory = temporary storage for the array
     * - Dynamic arrays can grow/shrink in size
     * 
     * @return Array of all products
     */
    function getAllProducts() public view returns (Product[] memory) {
        
        /**
         * @dev Create a new array in memory
         * Size = productCount (how many products we have)
         * This array will be returned to the caller
         */
        Product[] memory allProducts = new Product[](productCount);
        
        /**
         * @dev Loop through all products and copy them to our array
         * 
         * FOR LOOP EXPLAINED:
         * - uint256 i = 1: start counter at 1 (our IDs start at 1)
         * - i <= productCount: continue while i is less than or equal to total products
         * - i++: increase i by 1 each iteration
         */
        for (uint256 i = 1; i <= productCount; i++) {
            // Copy product from storage to our memory array
            // i-1 because array indices start at 0, but our IDs start at 1
            allProducts[i - 1] = products[i];
        }
        
        // Return the complete array to the caller
        return allProducts;
    }

    // ==================== ADDITIONAL HELPER FUNCTIONS ====================
    
    /**
     * @dev Get the total number of products in the marketplace
     * This is a simple getter function for productCount
     * @return The total number of products
     */
    function getTotalProducts() public view returns (uint256) {
        return productCount;
    }
    
    /**
     * @dev Check if a product is available for purchase
     * @param _id Product ID to check
     * @return true if product exists and is not sold, false otherwise
     */
    function isProductAvailable(uint256 _id) public view returns (bool) {
        if (_id == 0 || _id > productCount) {
            return false; // Product doesn't exist
        }
        return !products[_id].sold; // Return true if not sold
    }
}

/**
 * ==================== SUMMARY FOR BEGINNERS ====================
 * 
 * This smart contract creates a simple marketplace where:
 * 
 * 1. SELLERS can add products with name, description, and price
 * 2. BUYERS can purchase products by sending ETH
 * 3. EVERYONE can view products and check availability
 * 
 * KEY CONCEPTS LEARNED:
 * - Structs: Custom data types
 * - Mappings: Key-value storage
 * - Events: Blockchain notifications
 * - Functions: Code that does something
 * - Modifiers: public, view, payable
 * - Require: Input validation
 * - msg.sender: Who called the function
 * - msg.value: How much ETH was sent
 * 
 * SECURITY FEATURES:
 * - Input validation with require()
 * - Automatic refunds for overpayment
 * - Prevention of self-purchases
 * - Check for product existence and availability
 * 
 * This is a basic example - real marketplaces would need:
 * - User profiles and ratings
 * - Dispute resolution
 * - Product categories
 * - Search functionality
 * - And much more!
 */