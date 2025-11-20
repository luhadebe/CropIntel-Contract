const hre = require("hardhat");


const FACTORY_NONCE = 10;
const FACTORY_ADDRESS = "";
const EP_ADDRESS = "";
const PM_ADDRESS = "";


// CREATE: hash(deployer(AF) + nonce)
// CREATE2: hash( bytecode + salt)

async function main() {
  const entryPoint = await hre.ethers.getContractAt("EntryPoint", EP_ADDRESS);

//   const sender = await hre.ethers.getCreateAddress({
//     from: FACTORY_ADDRESS,
//     nonce: FACTORY_NONCE
//   })

  const AccountFactory = await hre.ethers.getContractFactory("AccountFactory");
  
  const [signer0, signer1] = await hre.ethers.getSigners();
  const address0 = await signer1.getAddress();
  
  
  const initCode = // "0x";
    FACTORY_ADDRESS +
    AccountFactory.interface
      .encodeFunctionData("createAccount", [address0])
      .slice(2);

      let sender
  try {
    await entryPoint.getSenderAddress(initCode);
  } catch (ex) {
    console.log(ex.data);
    sender = "0x" + ex.data.data.slice(-40) // test ex.data only
  }
    

    const code = await hre.ethers.provider.getCode(sender);
    if (code !== "0x") {
        initCode = "0x";
    }

    console.log(await hre.ethers.provider.getCode(sender)); // check if deployed
    console.log({ sender });


 






}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
