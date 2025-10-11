const hre = require("hardhat");

async function main() {
  console.log("Deploying DatasetRegistry contract...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the DatasetRegistry contract
  const DatasetRegistry = await hre.ethers.getContractFactory("DatasetRegistry");
  const datasetRegistry = await DatasetRegistry.deploy();

  await datasetRegistry.deployed();

  console.log("DatasetRegistry deployed to:", datasetRegistry.address);
  
  // Save the contract address and ABI to a file for frontend use
  const fs = require('fs');
  const contractsDir = '../frontend/src/contracts';

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    contractsDir + '/contract-address.json',
    JSON.stringify({ DatasetRegistry: datasetRegistry.address }, undefined, 2)
  );

  const DatasetRegistryArtifact = await hre.artifacts.readArtifact("DatasetRegistry");

  fs.writeFileSync(
    contractsDir + '/DatasetRegistry.json',
    JSON.stringify(DatasetRegistryArtifact, null, 2)
  );

  console.log("Contract address and ABI saved to frontend/src/contracts/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });