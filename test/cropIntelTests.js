import { expect } from "chai";
import { ethers } from "hardhat";

describe("ItemMarketplace", function () {
    let ItemMarketplace, itemMarketplace, owner, seller, buyer;
    const itemPrice = ethers.parseEther("1.0"); // 1 ETH
    const itemName = "Test Item";
    const itemDescription = "A very valuable test item";

    beforeEach(async function () {
        // Get signers to represent different roles
        [owner, seller, buyer] = await ethers.getSigners();

        // Deploy the ItemMarketplace contract
        const ItemMarketplaceFactory = await ethers.getContractFactory("ItemMarketplace");
        itemMarketplace = await ItemMarketplaceFactory.deploy();
    });

    describe("Deployment", function () {
        it("Should set the nextItemId to 0 initially", async function () {
            expect(await itemMarketplace.nextItemId()).to.equal(0);
        });
    });

    describe("listItem", function () {
        it("Should allow a user to list an item", async function () {
            // Seller lists an item
            await expect(itemMarketplace.connect(seller).listItem(itemName, itemDescription, itemPrice))
                .to.emit(itemMarketplace, "ItemListed")
                .withArgs(0, seller.address, itemName, itemPrice);

            // Check if the item was stored correctly
            const item = await itemMarketplace.items(0);
            expect(item.id).to.equal(0);
            expect(item.name).to.equal(itemName);
            expect(item.description).to.equal(itemDescription);
            expect(item.price).to.equal(itemPrice);
            expect(item.seller).to.equal(seller.address);
            expect(item.isAvailable).to.be.true;

            // Check if nextItemId was incremented
            expect(await itemMarketplace.nextItemId()).to.equal(1);
        });

        it("Should revert if the price is zero", async function () {
            await expect(
                itemMarketplace.connect(seller).listItem(itemName, itemDescription, 0)
            ).to.be.revertedWith("Price must be greater than zero");
        });
    });

    describe("buyItem", function () {
        const itemId = 0;

        beforeEach(async function () {
            // Seller lists an item before each test in this block
            await itemMarketplace.connect(seller).listItem(itemName, itemDescription, itemPrice);
        });

        it("Should allow a buyer to purchase an item", async function () {
            const sellerInitialBalance = await ethers.provider.getBalance(seller.address);

            // Buyer purchases the item
            await expect(
                itemMarketplace.connect(buyer).buyItem(itemId, { value: itemPrice })
            ).to.emit(itemMarketplace, "ItemPurchased")
             .withArgs(itemId, buyer.address, itemPrice);

            // Check item status after purchase
            const item = await itemMarketplace.items(itemId);
            expect(item.isAvailable).to.be.false;

            // Check if seller received the funds
            const sellerFinalBalance = await ethers.provider.getBalance(seller.address);
            expect(sellerFinalBalance).to.equal(sellerInitialBalance + itemPrice);
        });

        it("Should revert if the item ID does not exist", async function () {
            const nonExistentItemId = 99;
            await expect(
                itemMarketplace.connect(buyer).buyItem(nonExistentItemId, { value: itemPrice })
            ).to.be.revertedWithCustomError(itemMarketplace, "ItemNotFound");
        });

        it("Should revert if the payment is incorrect", async function () {
            const incorrectPrice = ethers.parseEther("0.5");
            await expect(
                itemMarketplace.connect(buyer).buyItem(itemId, { value: incorrectPrice })
            ).to.be.revertedWithCustomError(itemMarketplace, "IncorrectPayment");
        });

        it("Should revert if the item is not available", async function () {
            // First, buyer purchases the item successfully
            await itemMarketplace.connect(buyer).buyItem(itemId, { value: itemPrice });

            // Then, another buyer tries to purchase the same item
            await expect(
                itemMarketplace.connect(owner).buyItem(itemId, { value: itemPrice })
            ).to.be.revertedWithCustomError(itemMarketplace, "ItemNotAvailable");
        });
    });
});
