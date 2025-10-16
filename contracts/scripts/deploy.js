const hre = require("hardhat");

async function main() {
  console.log("Deploying DatasetRegistry, Governance, and DatasetMarketplace contracts...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // Deploy the DatasetRegistry contract
  const DatasetRegistry = await hre.ethers.getContractFactory("DatasetRegistry");
  const datasetRegistry = await DatasetRegistry.deploy();

  await datasetRegistry.waitForDeployment();

  console.log("DatasetRegistry deployed to:", await datasetRegistry.getAddress());
  
  // Deploy Governance contract
  const Governance = await hre.ethers.getContractFactory("Governance");
  const governance = await Governance.deploy();
  await governance.waitForDeployment();
  console.log("Governance deployed to:", await governance.getAddress());

  // Deploy DatasetMarketplace with registry address
  const DatasetMarketplace = await hre.ethers.getContractFactory("DatasetMarketplace");
  const marketplace = await DatasetMarketplace.deploy(await datasetRegistry.getAddress());
  await marketplace.waitForDeployment();
  console.log("DatasetMarketplace deployed to:", await marketplace.getAddress());

  // Save the contract address and ABI to files for frontend use
  const contractDataRegistry = {
    address: await datasetRegistry.getAddress(),
    abi: DatasetRegistry.interface.format('json')
  };
  const contractDataGovernance = {
    address: await governance.getAddress(),
    abi: Governance.interface.format('json')
  };
  const contractDataMarketplace = {
    address: await marketplace.getAddress(),
    abi: DatasetMarketplace.interface.format('json')
  };

  const fs = require('fs');
  const path = require('path');
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Save contract addresses
  fs.writeFileSync(
    path.join(deploymentsDir, 'DatasetRegistry.json'),
    JSON.stringify(contractDataRegistry, null, 2)
  );
  fs.writeFileSync(
    path.join(deploymentsDir, 'Governance.json'),
    JSON.stringify(contractDataGovernance, null, 2)
  );
  fs.writeFileSync(
    path.join(deploymentsDir, 'DatasetMarketplace.json'),
    JSON.stringify(contractDataMarketplace, null, 2)
  );
  
  // Also save to frontend directory
  const frontendDir = path.join(__dirname, '../../frontend/src/contracts');
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(frontendDir, 'DatasetRegistry.json'),
    JSON.stringify(contractDataRegistry, null, 2)
  );
  fs.writeFileSync(
    path.join(frontendDir, 'Governance.json'),
    JSON.stringify(contractDataGovernance, null, 2)
  );
  fs.writeFileSync(
    path.join(frontendDir, 'DatasetMarketplace.json'),
    JSON.stringify(contractDataMarketplace, null, 2)
  );
  
  console.log("Contract data saved to deployments and frontend directories");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });