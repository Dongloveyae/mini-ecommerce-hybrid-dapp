const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("🚀 Starting EcommercePayment Contract Deployment...");
  console.log(`🌐 Target Network: ${hre.network.name}`);
  console.log("==================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`👤 Deploying with account: ${deployer.address}`);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} ETH`);

  // Deploy Contract
  const EcommercePayment = await hre.ethers.getContractFactory("EcommercePayment");
  const contract = await EcommercePayment.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("--------------------------------------------------");
  console.log(`✅ EcommercePayment deployed successfully!`);
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log("--------------------------------------------------");

  // Lấy ABI từ artifacts
  const artifactPath = path.join(__dirname, "../artifacts/contracts/EcommercePayment.sol/EcommercePayment.json");
  if (!fs.existsSync(artifactPath)) {
    console.error("Artifact not found. Please compile contract first.");
    return;
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const chainId = (await hre.ethers.provider.getNetwork()).chainId.toString();

  // 1. Ghi ĐỊA CHỈ CONTRACT (Address) vào file .env gốc dùng chung (D:\DA-BlockChain\.env)
  const rootEnvPath = path.join(__dirname, "../../.env");
  const envContent = [
    "# ==============================================================================",
    "# CẤU HÌNH SMART CONTRACT DÙNG CHUNG CHO CẢ FRONTEND & BACKEND",
    "# Sau này khi cập nhật Smart Contract mới, chỉ cần sửa địa chỉ tại file này!",
    "# ==============================================================================",
    `CONTRACT_ADDRESS=${contractAddress}`,
    `CONTRACT_CHAIN_ID=${chainId}`,
    `CONTRACT_NETWORK=${hre.network.name}`,
    "",
  ].join("\n");
  fs.writeFileSync(rootEnvPath, envContent, "utf8");
  console.log(`🔑 Updated CONTRACT_ADDRESS in shared .env: ${rootEnvPath}`);

  // 2. Ghi RIÊNG ABI (không kèm address) vào file .json dùng chung duy nhất (D:\DA-BlockChain\contractData.json)
  const abiOnlyData = {
    abi: artifact.abi,
  };

  const rootAbiPath = path.join(__dirname, "../../contractData.json");
  fs.writeFileSync(rootAbiPath, JSON.stringify(abiOnlyData, null, 2), "utf8");
  console.log(`📁 Synced ABI-only JSON to: ${rootAbiPath}`);

  console.log("==================================================");
  console.log("🎉 Address (.env) & ABI (.json) separated and synchronized!");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
