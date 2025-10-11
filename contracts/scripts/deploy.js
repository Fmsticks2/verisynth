const hre = require("hardhat");

async function main() {
  console.log("Deploying DatasetRegistry contract...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // Deploy the DatasetRegistry contract
  const DatasetRegistry = await hre.ethers.getContractFactory("DatasetRegistry");
  const datasetRegistry = await DatasetRegistry.deploy();

  await datasetRegistry.waitForDeployment();

  console.log("DatasetRegistry deployed to:", await datasetRegistry.getAddress());
  
  // Save the contract address and ABI to a file for frontend use
  const contractData = {
    address: await datasetRegistry.getAddress(),
    abi: DatasetRegistry.interface.format('json')
  };

  const fs = require('fs');
  const path = require('path');
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Save contract address
  fs.writeFileSync(
    path.join(deploymentsDir, 'DatasetRegistry.json'),
    JSON.stringify(contractData, null, 2)
  );
  
  // Also save to frontend directory
  const frontendDir = path.join(__dirname, '../../frontend/src/contracts');
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(frontendDir, 'DatasetRegistry.json'),
    JSON.stringify(contractData, null, 2)
  );
  
  console.log("Contract data saved to deployments and frontend directories");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });