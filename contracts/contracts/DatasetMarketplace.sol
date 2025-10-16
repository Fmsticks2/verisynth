// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IDatasetRegistry {
    function datasets(
        uint256 id
    ) external view returns (
        uint256,
        string memory,
        string memory,
        string memory,
        string memory,
        address,
        uint256
    );
}

/**
 * @title DatasetMarketplace
 * @dev Marketplace for datasets registered in DatasetRegistry.
 *      Supports listings with pricing, license terms (CID), and purchases.
 */
contract DatasetMarketplace is Ownable, ReentrancyGuard {
    IDatasetRegistry public registry;

    struct Listing {
        uint256 datasetId;
        address seller;
        uint256 price; // in wei
        string licenseCid; // IPFS CID of license terms
        bool active;
        uint256 createdAt;
        uint256 purchaseCount;
    }

    // datasetId => Listing
    mapping(uint256 => Listing) public listings;

    event ListingCreated(
        uint256 indexed datasetId,
        address indexed seller,
        uint256 price,
        string licenseCid
    );

    event ListingUpdated(
        uint256 indexed datasetId,
        uint256 price,
        string licenseCid,
        bool active
    );

    event DatasetPurchased(
        uint256 indexed datasetId,
        address indexed buyer,
        uint256 amount
    );

    constructor(address registryAddress) Ownable(msg.sender) {
        require(registryAddress != address(0), "Invalid registry");
        registry = IDatasetRegistry(registryAddress);
    }

    /**
     * @dev Create a listing for a dataset. Only dataset owner can list.
     */
    function createListing(
        uint256 datasetId,
        uint256 price,
        string memory licenseCid
    ) external {
        (, , , , , address owner, ) = registry.datasets(datasetId);
        require(owner != address(0), "Dataset not found");
        require(owner == msg.sender, "Not dataset owner");
        require(price > 0, "Price must be > 0");

        listings[datasetId] = Listing({
            datasetId: datasetId,
            seller: msg.sender,
            price: price,
            licenseCid: licenseCid,
            active: true,
            createdAt: block.timestamp,
            purchaseCount: 0
        });

        emit ListingCreated(datasetId, msg.sender, price, licenseCid);
    }

    /**
     * @dev Update listing settings. Only seller can update.
     */
    function updateListing(
        uint256 datasetId,
        uint256 price,
        string memory licenseCid,
        bool active
    ) external {
        Listing storage l = listings[datasetId];
        require(l.seller == msg.sender, "Not seller");
        require(l.datasetId != 0, "No listing");
        require(price > 0, "Price must be > 0");

        l.price = price;
        l.licenseCid = licenseCid;
        l.active = active;

        emit ListingUpdated(datasetId, price, licenseCid, active);
    }

    /**
     * @dev Purchase a dataset license. Sends payment to seller.
     */
    function buy(uint256 datasetId) external payable nonReentrant {
        Listing storage l = listings[datasetId];
        require(l.datasetId != 0, "No listing");
        require(l.active, "Inactive listing");
        require(msg.value >= l.price, "Insufficient payment");

        l.purchaseCount += 1;

        // Transfer funds to seller
        (bool sent, ) = payable(l.seller).call{value: msg.value}("");
        require(sent, "Payment failed");

        emit DatasetPurchased(datasetId, msg.sender, msg.value);
    }

    function getListing(uint256 datasetId) external view returns (Listing memory) {
        return listings[datasetId];
    }

    function isListed(uint256 datasetId) external view returns (bool) {
        return listings[datasetId].datasetId != 0 && listings[datasetId].active;
    }

    function getPurchaseCount(uint256 datasetId) external view returns (uint256) {
        return listings[datasetId].purchaseCount;
    }
}