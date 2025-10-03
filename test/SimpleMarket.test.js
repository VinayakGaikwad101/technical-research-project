

const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("SimpleMarket Contract", function () {
  
  
  let SimpleMarket;      // Contract factory
  let simpleMarket;      // Deployed contract instance
  let owner;             // Contract deployer
  let seller;            // Test seller account
  let buyer;             // Test buyer account
  let otherAccount;      // Additional test account
  
  
  beforeEach(async function () {
    console.log("    🔄 Setting up test environment...");
    
    // Get test accounts from Hardhat
    // Hardhat provides 20 test accounts with fake ETH
    [owner, seller, buyer, otherAccount] = await ethers.getSigners();
    
    // Get the contract factory
    SimpleMarket = await ethers.getContractFactory("SimpleMarket");
    
    // Deploy a fresh contract for this test
    simpleMarket = await SimpleMarket.deploy();
    await simpleMarket.waitForDeployment();
    
    console.log("    ✅ Fresh contract deployed for test");
  });


  describe("Deployment", function () {
    
    it("Should deploy with correct initial values", async function () {
      // Check that product count starts at 0
      expect(await simpleMarket.productCount()).to.equal(0);
      
      // Check that getTotalProducts also returns 0
      expect(await simpleMarket.getTotalProducts()).to.equal(0);
      
      console.log("    ✅ Contract deployed with productCount = 0");
    });
    
    it("Should have the correct contract address", async function () {
      // Contract address should exist and be valid
      const address = await simpleMarket.getAddress();
      expect(address).to.be.properAddress;
      
      console.log("    ✅ Contract has valid address:", address);
    });
  });

  describe("Adding Products", function () {
    
    it("Should add a product successfully", async function () {
      // Test data
      const productName = "iPhone 15";
      const productDescription = "Brand new iPhone 15, 128GB";
      const productPrice = ethers.parseEther("1.0"); // 1 ETH in Wei
      
      // Add product using seller account
      const tx = await simpleMarket.connect(seller).addProduct(
        productName,
        productDescription,
        productPrice
      );
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Check that product count increased
      expect(await simpleMarket.productCount()).to.equal(1);
      
      // Get the product details
      const product = await simpleMarket.getProduct(1);
      
      // Verify product details
      expect(product.id).to.equal(1);
      expect(product.name).to.equal(productName);
      expect(product.description).to.equal(productDescription);
      expect(product.price).to.equal(productPrice);
      expect(product.seller).to.equal(seller.address);
      expect(product.sold).to.equal(false);
      
      console.log("    ✅ Product added successfully with correct details");
    });
    
    it("Should emit ProductAdded event", async function () {
      const productName = "Test Product";
      const productDescription = "Test Description";
      const productPrice = ethers.parseEther("0.5");
      
      // Check that the event is emitted with correct parameters
      await expect(
        simpleMarket.connect(seller).addProduct(
          productName,
          productDescription,
          productPrice
        )
      )
        .to.emit(simpleMarket, "ProductAdded")
        .withArgs(1, productName, productDescription, productPrice, seller.address);
      
      console.log("    ✅ ProductAdded event emitted correctly");
    });
    
    it("Should reject empty product name", async function () {
      // Try to add product with empty name
      await expect(
        simpleMarket.connect(seller).addProduct(
          "", // Empty name
          "Some description",
          ethers.parseEther("1.0")
        )
      ).to.be.revertedWith("Product name cannot be empty");
      
      console.log("    ✅ Empty product name rejected correctly");
    });
    
    it("Should reject zero price", async function () {
      // Try to add product with zero price
      await expect(
        simpleMarket.connect(seller).addProduct(
          "Test Product",
          "Test Description",
          0 // Zero price
        )
      ).to.be.revertedWith("Product price must be greater than 0");
      
      console.log("    ✅ Zero price rejected correctly");
    });
    
    it("Should allow multiple products from same seller", async function () {
      // Add first product
      await simpleMarket.connect(seller).addProduct(
        "Product 1",
        "Description 1",
        ethers.parseEther("1.0")
      );
      
      // Add second product
      await simpleMarket.connect(seller).addProduct(
        "Product 2",
        "Description 2",
        ethers.parseEther("2.0")
      );
      
      // Check product count
      expect(await simpleMarket.productCount()).to.equal(2);
      
      console.log("    ✅ Multiple products from same seller allowed");
    });
  });


  describe("Buying Products", function () {
    
    // Add a test product before each buy test
    beforeEach(async function () {
      await simpleMarket.connect(seller).addProduct(
        "Test iPhone",
        "Test iPhone for sale",
        ethers.parseEther("1.0")
      );
    });
    
    it("Should buy a product successfully", async function () {
      const productPrice = ethers.parseEther("1.0");
      
      // Get initial balances
      const initialSellerBalance = await ethers.provider.getBalance(seller.address);
      const initialBuyerBalance = await ethers.provider.getBalance(buyer.address);
      
      // Buy the product
      const tx = await simpleMarket.connect(buyer).buyProduct(1, {
        value: productPrice
      });
      
      const receipt = await tx.wait();
      
      // Check that product is marked as sold
      const product = await simpleMarket.getProduct(1);
      expect(product.sold).to.equal(true);
      
      // Check seller received payment
      const finalSellerBalance = await ethers.provider.getBalance(seller.address);
      expect(finalSellerBalance).to.equal(initialSellerBalance + productPrice);
      
      console.log("    ✅ Product purchased successfully, seller received payment");
    });
    
    it("Should emit ProductSold event", async function () {
      const productPrice = ethers.parseEther("1.0");
      
      // Check that the event is emitted
      await expect(
        simpleMarket.connect(buyer).buyProduct(1, {
          value: productPrice
        })
      )
        .to.emit(simpleMarket, "ProductSold")
        .withArgs(1, "Test iPhone", productPrice, seller.address, buyer.address);
      
      console.log("    ✅ ProductSold event emitted correctly");
    });
    
    it("Should refund excess payment", async function () {
      const productPrice = ethers.parseEther("1.0");
      const overpayment = ethers.parseEther("1.5"); // Pay 1.5 ETH for 1 ETH product
      
      const initialBuyerBalance = await ethers.provider.getBalance(buyer.address);
      
      // Buy with overpayment
      const tx = await simpleMarket.connect(buyer).buyProduct(1, {
        value: overpayment
      });
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      // Calculate expected final balance
      // Should be: initial - product_price - gas_fees
      const expectedBalance = initialBuyerBalance - productPrice - gasUsed;
      const finalBuyerBalance = await ethers.provider.getBalance(buyer.address);
      
      // Allow small difference due to gas estimation
      expect(finalBuyerBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
      
      console.log("    ✅ Excess payment refunded correctly");
    });
    
    it("Should reject insufficient payment", async function () {
      const insufficientPayment = ethers.parseEther("0.5"); // Pay 0.5 ETH for 1 ETH product
      
      await expect(
        simpleMarket.connect(buyer).buyProduct(1, {
          value: insufficientPayment
        })
      ).to.be.revertedWith("Insufficient payment");
      
      console.log("    ✅ Insufficient payment rejected correctly");
    });
    
    it("Should reject buying non-existent product", async function () {
      await expect(
        simpleMarket.connect(buyer).buyProduct(999, {
          value: ethers.parseEther("1.0")
        })
      ).to.be.revertedWith("Product does not exist");
      
      console.log("    ✅ Non-existent product purchase rejected");
    });
    
    it("Should reject buying already sold product", async function () {
      const productPrice = ethers.parseEther("1.0");
      
      // First buyer purchases the product
      await simpleMarket.connect(buyer).buyProduct(1, {
        value: productPrice
      });
      
      // Second buyer tries to buy the same product
      await expect(
        simpleMarket.connect(otherAccount).buyProduct(1, {
          value: productPrice
        })
      ).to.be.revertedWith("Product already sold");
      
      console.log("    ✅ Already sold product purchase rejected");
    });
    
    it("Should reject seller buying their own product", async function () {
      const productPrice = ethers.parseEther("1.0");
      
      await expect(
        simpleMarket.connect(seller).buyProduct(1, {
          value: productPrice
        })
      ).to.be.revertedWith("Cannot buy your own product");
      
      console.log("    ✅ Self-purchase rejected correctly");
    });
  });


  describe("View Functions", function () {
    
    beforeEach(async function () {
      // Add some test products
      await simpleMarket.connect(seller).addProduct(
        "Product 1",
        "Description 1",
        ethers.parseEther("1.0")
      );
      
      await simpleMarket.connect(otherAccount).addProduct(
        "Product 2",
        "Description 2",
        ethers.parseEther("2.0")
      );
    });
    
    it("Should return correct product details", async function () {
      const product = await simpleMarket.getProduct(1);
      
      expect(product.id).to.equal(1);
      expect(product.name).to.equal("Product 1");
      expect(product.description).to.equal("Description 1");
      expect(product.price).to.equal(ethers.parseEther("1.0"));
      expect(product.seller).to.equal(seller.address);
      expect(product.sold).to.equal(false);
      
      console.log("    ✅ Product details returned correctly");
    });
    
    it("Should return all products", async function () {
      const allProducts = await simpleMarket.getAllProducts();
      
      expect(allProducts.length).to.equal(2);
      expect(allProducts[0].name).to.equal("Product 1");
      expect(allProducts[1].name).to.equal("Product 2");
      
      console.log("    ✅ All products returned correctly");
    });
    
    it("Should return correct total products count", async function () {
      expect(await simpleMarket.getTotalProducts()).to.equal(2);
      
      console.log("    ✅ Total products count correct");
    });
    
    it("Should check product availability correctly", async function () {
      // Product 1 should be available
      expect(await simpleMarket.isProductAvailable(1)).to.equal(true);
      
      // Buy product 1
      await simpleMarket.connect(buyer).buyProduct(1, {
        value: ethers.parseEther("1.0")
      });
      
      // Product 1 should no longer be available
      expect(await simpleMarket.isProductAvailable(1)).to.equal(false);
      
      // Product 2 should still be available
      expect(await simpleMarket.isProductAvailable(2)).to.equal(true);
      
      // Non-existent product should not be available
      expect(await simpleMarket.isProductAvailable(999)).to.equal(false);
      
      console.log("    ✅ Product availability checked correctly");
    });
  });

  // ==================== EDGE CASE TESTS ====================
  
  /**
   * Test unusual or extreme scenarios
   */
  describe("Edge Cases", function () {
    
    it("Should handle very large product prices", async function () {
      const largePrice = ethers.parseEther("1000000"); // 1 million ETH
      
      await simpleMarket.connect(seller).addProduct(
        "Expensive Product",
        "Very expensive item",
        largePrice
      );
      
      const product = await simpleMarket.getProduct(1);
      expect(product.price).to.equal(largePrice);
      
      console.log("    ✅ Large prices handled correctly");
    });
    
    it("Should handle long product names and descriptions", async function () {
      const longName = "A".repeat(1000); // 1000 character name
      const longDescription = "B".repeat(2000); // 2000 character description
      
      await simpleMarket.connect(seller).addProduct(
        longName,
        longDescription,
        ethers.parseEther("1.0")
      );
      
      const product = await simpleMarket.getProduct(1);
      expect(product.name).to.equal(longName);
      expect(product.description).to.equal(longDescription);
      
      console.log("    ✅ Long strings handled correctly");
    });
    
    it("Should handle multiple rapid transactions", async function () {
      // Add multiple products quickly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          simpleMarket.connect(seller).addProduct(
            `Product ${i}`,
            `Description ${i}`,
            ethers.parseEther("1.0")
          )
        );
      }
      
      await Promise.all(promises);
      
      expect(await simpleMarket.productCount()).to.equal(10);
      
      console.log("    ✅ Multiple rapid transactions handled correctly");
    });
  });
});
