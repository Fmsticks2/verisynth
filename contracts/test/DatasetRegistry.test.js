const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DatasetRegistry", function () {
  let DatasetRegistry;
  let datasetRegistry;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    DatasetRegistry = await ethers.getContractFactory("DatasetRegistry");
    [owner, addr1, addr2] = await ethers.getSigners();
    datasetRegistry = await DatasetRegistry.deploy();
    await datasetRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await datasetRegistry.owner()).to.equal(owner.address);
    });

    it("Should start with zero datasets", async function () {
      expect(await datasetRegistry.getTotalDatasets()).to.equal(0);
    });
  });

  describe("Dataset Registration", function () {
    it("Should register a dataset successfully", async function () {
      const modelVersion = "v1.0.0";
      const seed = "12345";
      const dataHash = "0x1234567890abcdef";
      const cid = "QmTest123";

      await expect(
        datasetRegistry.registerDataset(modelVersion, seed, dataHash, cid)
      )
        .to.emit(datasetRegistry, "DatasetRegistered")
        .withArgs(1, owner.address, cid, modelVersion, dataHash);

      expect(await datasetRegistry.getTotalDatasets()).to.equal(1);
    });

    it("Should fail with empty parameters", async function () {
      await expect(
        datasetRegistry.registerDataset("", "seed", "hash", "cid")
      ).to.be.revertedWith("Model version cannot be empty");

      await expect(
        datasetRegistry.registerDataset("v1.0.0", "", "hash", "cid")
      ).to.be.revertedWith("Seed cannot be empty");

      await expect(
        datasetRegistry.registerDataset("v1.0.0", "seed", "", "cid")
      ).to.be.revertedWith("Data hash cannot be empty");

      await expect(
        datasetRegistry.registerDataset("v1.0.0", "seed", "hash", "")
      ).to.be.revertedWith("CID cannot be empty");
    });

    it("Should assign correct dataset ID", async function () {
      await datasetRegistry.registerDataset("v1.0.0", "seed1", "hash1", "cid1");
      await datasetRegistry.registerDataset("v1.0.0", "seed2", "hash2", "cid2");

      expect(await datasetRegistry.getTotalDatasets()).to.equal(2);
    });
  });

  describe("Dataset Retrieval", function () {
    beforeEach(async function () {
      await datasetRegistry.registerDataset("v1.0.0", "seed123", "hash123", "cid123");
    });

    it("Should retrieve dataset correctly", async function () {
      const dataset = await datasetRegistry.getDataset(1);
      
      expect(dataset.id).to.equal(1);
      expect(dataset.modelVersion).to.equal("v1.0.0");
      expect(dataset.seed).to.equal("seed123");
      expect(dataset.dataHash).to.equal("hash123");
      expect(dataset.cid).to.equal("cid123");
      expect(dataset.owner).to.equal(owner.address);
    });

    it("Should fail for non-existent dataset", async function () {
      await expect(
        datasetRegistry.getDataset(999)
      ).to.be.revertedWith("Dataset does not exist");
    });
  });

  describe("Dataset Verification", function () {
    beforeEach(async function () {
      await datasetRegistry.registerDataset("v1.0.0", "seed123", "hash123", "cid123");
    });

    it("Should verify dataset with correct hash", async function () {
      await expect(
        datasetRegistry.verifyDataset(1, "hash123")
      )
        .to.emit(datasetRegistry, "DatasetVerified")
        .withArgs(1, true, owner.address);
    });

    it("Should fail verification with incorrect hash", async function () {
      await expect(
        datasetRegistry.verifyDataset(1, "wronghash")
      )
        .to.emit(datasetRegistry, "DatasetVerified")
        .withArgs(1, false, owner.address);
    });

    it("Should fail for non-existent dataset", async function () {
      await expect(
        datasetRegistry.verifyDataset(999, "hash123")
      ).to.be.revertedWith("Dataset does not exist");
    });

    it("Should fail with empty hash", async function () {
      await expect(
        datasetRegistry.verifyDataset(1, "")
      ).to.be.revertedWith("Computed hash cannot be empty");
    });
  });

  describe("Owner Datasets", function () {
    it("Should track datasets by owner", async function () {
      await datasetRegistry.connect(addr1).registerDataset("v1.0.0", "seed1", "hash1", "cid1");
      await datasetRegistry.connect(addr1).registerDataset("v1.0.0", "seed2", "hash2", "cid2");
      await datasetRegistry.connect(addr2).registerDataset("v1.0.0", "seed3", "hash3", "cid3");

      const addr1Datasets = await datasetRegistry.getDatasetsByOwner(addr1.address);
      const addr2Datasets = await datasetRegistry.getDatasetsByOwner(addr2.address);

      expect(addr1Datasets.length).to.equal(2);
      expect(addr2Datasets.length).to.equal(1);
      expect(addr1Datasets[0]).to.equal(1);
      expect(addr1Datasets[1]).to.equal(2);
      expect(addr2Datasets[0]).to.equal(3);
    });
  });

  describe("Utility Functions", function () {
    it("Should check dataset existence correctly", async function () {
      expect(await datasetRegistry.datasetExists(1)).to.be.false;
      
      await datasetRegistry.registerDataset("v1.0.0", "seed123", "hash123", "cid123");
      
      expect(await datasetRegistry.datasetExists(1)).to.be.true;
      expect(await datasetRegistry.datasetExists(2)).to.be.false;
    });
  });
});