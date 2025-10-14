const hre = require("hardhat");

async function main() {
  console.log("Verifying DatasetRegistry deployment on 0G testnet...");

  const contractAddress = "0xdc6c396319895dA489b0Cd145A4c5D660b9e10F6";
  
  // Get the contract instance
  const DatasetRegistry = await hre.ethers.getContractFactory("DatasetRegistry");
  const contract = DatasetRegistry.attach(contractAddress);

  try {
    // Test basic read functions
    console.log("Testing contract read functions...");
    
    const totalDatasets = await contract.getTotalDatasets();
    console.log("Total datasets:", totalDatasets.toString());
    
    const nextId = await contract.nextDatasetId();
    console.log("Next dataset ID:", nextId.toString());
    
    const owner = await contract.owner();
    console.log("Contract owner:", owner);
    
    console.log("✅ Contract verification successful!");
    console.log("Contract is deployed and responding correctly on 0G testnet");
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });