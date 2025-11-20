// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ItemMarketplace {
    
    struct ItemListing {
        uint256 id;
        string name;
        string description;
        uint256 price;
        address payable seller;
        bool isAvailable;
    }

    uint256 public nextItemId;
    mapping(uint256 => ItemListing) public items;
    event ItemListed(
        uint256 indexed id,
        address indexed seller,
        string name,
        uint256 price
    );

    event ItemPurchased(
        uint256 indexed id,
        address indexed buyer,
        uint256 price
    );

    error ItemNotFound();
    error IncorrectPayment();
    error ItemNotAvailable();

    function listItem(string memory _name, string memory _description, uint256 _price) external {
        require(_price > 0, "Price must be greater than zero");

        uint256 itemId = nextItemId;
        items[itemId] = ItemListing(itemId, _name, _description, _price, payable(msg.sender), true);

        emit ItemListed(itemId, msg.sender, _name, _price);
        nextItemId++;
    }

    function buyItem(uint256 _itemId) external payable {
        if (_itemId >= nextItemId) revert ItemNotFound();

        ItemListing storage item = items[_itemId];

        if (!item.isAvailable) revert ItemNotAvailable();

        if (msg.value != item.price) revert IncorrectPayment();

        item.isAvailable = false;

        (bool success, ) = item.seller.call{value: item.price}("");
        require(success, "Transfer failed");

        emit ItemPurchased(_itemId, msg.sender, item.price);
    }
}