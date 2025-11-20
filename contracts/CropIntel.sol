// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title CropIntel
 * @notice A basic marketplace for buying and selling crops.
 * @dev This contract allows sellers to list crops and buyers to purchase them.
 */
contract CropIntel {
    // ============ Data Structures ============
    struct CropListing {
        uint256 id;
        string name;
        string description;
        uint256 price; // Price per unit in wei
        uint256 quantity; // Total quantity available
        address payable seller;
        bool isAvailable;
    }

    // ============ State Variables ============
    uint256 public nextListingId;
    mapping(uint256 => CropListing) public listings;

    // ============ Events ============
    event CropListed(
        uint256 indexed id,
        address indexed seller,
        string name,
        uint256 price,
        uint256 quantity
    );

    event CropPurchased(
        uint256 indexed id,
        address indexed buyer,
        uint256 quantity,
        uint256 totalCost
    );

    // ============ Errors ============
    error ListingNotFound();
    error NotEnoughQuantity();
    error IncorrectPayment();
    error ListingNotAvailable();

    // ============ Functions ============

    /**
     * @notice Allows a seller to list a crop for sale.
     * @param _name The name of the crop.
     * @param _description A description of the crop.
     * @param _price The price per unit in wei.
     * @param _quantity The total quantity available for sale.
     */
    function listCrop(string memory _name, string memory _description, uint256 _price, uint256 _quantity) external {
        require(_price > 0, "Price must be greater than zero");
        require(_quantity > 0, "Quantity must be greater than zero");

        uint256 listingId = nextListingId;
        listings[listingId] = CropListing(listingId, _name, _description, _price, _quantity, payable(msg.sender), true);

        emit CropListed(listingId, msg.sender, _name, _price, _quantity);
        nextListingId++;
    }

    /**
     * @notice Allows a buyer to purchase a specific quantity of a listed crop.
     * @param _listingId The ID of the crop listing to purchase from.
     * @param _quantityToBuy The quantity of the crop to buy.
     */
    function buyCrop(uint256 _listingId, uint256 _quantityToBuy) external payable {
        if (_listingId >= nextListingId) revert ListingNotFound();

        CropListing storage listing = listings[_listingId];

        if (!listing.isAvailable) revert ListingNotAvailable();
        if (_quantityToBuy > listing.quantity) revert NotEnoughQuantity();

        uint256 totalCost = listing.price * _quantityToBuy;
        if (msg.value != totalCost) revert IncorrectPayment();

        // Update state
        listing.quantity -= _quantityToBuy;
        if (listing.quantity == 0) {
            listing.isAvailable = false;
        }

        // Transfer funds to the seller
        (bool success, ) = listing.seller.call{value: totalCost}("");
        require(success, "Transfer failed");

        emit CropPurchased(_listingId, msg.sender, _quantityToBuy, totalCost);
    }
}