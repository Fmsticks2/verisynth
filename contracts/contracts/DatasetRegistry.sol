// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DatasetRegistry
 * @dev Smart contract for registering and verifying synthetic datasets
 */
contract DatasetRegistry is Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _datasetIds;
    
    struct Dataset {
        uint256 id;
        string modelVersion;
        string seed;
        string dataHash;
        string cid; // IPFS or 0G Storage reference
        address owner;
        uint256 timestamp;
    }
    
    // Mapping from dataset ID to Dataset
    mapping(uint256 => Dataset) public datasets;
    
    // Mapping from owner to array of dataset IDs
    mapping(address => uint256[]) public ownerDatasets;
    
    // Events
    event DatasetRegistered(
        uint256 indexed id,
        address indexed owner,
        string cid,
        string modelVersion,
        string dataHash
    );
    
    event DatasetVerified(
        uint256 indexed id,
        bool verified,
        address indexed verifier
    );
    
    constructor() {}
    
    /**
     * @dev Register a new dataset
     * @param modelVersion The version of the model used to generate the dataset
     * @param seed The seed used for data generation
     * @param dataHash The keccak256 hash of the dataset
     * @param cid The IPFS or storage CID reference
     * @return The ID of the registered dataset
     */
    function registerDataset(
        string memory modelVersion,
        string memory seed,
        string memory dataHash,
        string memory cid
    ) external returns (uint256) {
        require(bytes(modelVersion).length > 0, "Model version cannot be empty");
        require(bytes(seed).length > 0, "Seed cannot be empty");
        require(bytes(dataHash).length > 0, "Data hash cannot be empty");
        require(bytes(cid).length > 0, "CID cannot be empty");
        
        _datasetIds.increment();
        uint256 newDatasetId = _datasetIds.current();
        
        Dataset memory newDataset = Dataset({
            id: newDatasetId,
            modelVersion: modelVersion,
            seed: seed,
            dataHash: dataHash,
            cid: cid,
            owner: msg.sender,
            timestamp: block.timestamp
        });
        
        datasets[newDatasetId] = newDataset;
        ownerDatasets[msg.sender].push(newDatasetId);
        
        emit DatasetRegistered(
            newDatasetId,
            msg.sender,
            cid,
            modelVersion,
            dataHash
        );
        
        return newDatasetId;
    }
    
    /**
     * @dev Get dataset details by ID
     * @param id The dataset ID
     * @return The dataset struct
     */
    function getDataset(uint256 id) external view returns (Dataset memory) {
        require(id > 0 && id <= _datasetIds.current(), "Dataset does not exist");
        return datasets[id];
    }
    
    /**
     * @dev Verify a dataset by comparing hashes
     * @param id The dataset ID
     * @param computedHash The hash computed from the dataset
     * @return Whether the dataset is verified
     */
    function verifyDataset(uint256 id, string memory computedHash) 
        external 
        returns (bool) 
    {
        require(id > 0 && id <= _datasetIds.current(), "Dataset does not exist");
        require(bytes(computedHash).length > 0, "Computed hash cannot be empty");
        
        Dataset memory dataset = datasets[id];
        bool verified = keccak256(abi.encodePacked(dataset.dataHash)) == 
                       keccak256(abi.encodePacked(computedHash));
        
        emit DatasetVerified(id, verified, msg.sender);
        
        return verified;
    }
    
    /**
     * @dev Get all dataset IDs owned by an address
     * @param owner The owner address
     * @return Array of dataset IDs
     */
    function getDatasetsByOwner(address owner) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return ownerDatasets[owner];
    }
    
    /**
     * @dev Get the total number of registered datasets
     * @return The total count
     */
    function getTotalDatasets() external view returns (uint256) {
        return _datasetIds.current();
    }
    
    /**
     * @dev Check if a dataset exists
     * @param id The dataset ID
     * @return Whether the dataset exists
     */
    function datasetExists(uint256 id) external view returns (bool) {
        return id > 0 && id <= _datasetIds.current();
    }
}