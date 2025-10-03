# Technical Research Blockchain Project (Vinayak Gaikwad and Vedant Khete)

This project is for the subject "Technical Research", showcasing blockchain technology for de-centralized transactions using smart contracts deployed over the blockchain network

Below are a few commands for specific purposes:

```shell
npx hardhat test # to test the smart contracts
npx hardhat node # to create 20 instances of a local blockchain network, to facilitate transactions in ETH (10000 in each instance)
npx hardhat run scripts/deploy.js --network localhost # to deploy the project on a local blockchain (localhost)
```


<!-- info for connection to blockchain -->

2. Add a Custom Network

Click your network dropdown (top center) → Add network → then:
Field	Value
Network name	Hardhat Localhost
RPC URL	http://127.0.0.1:8545
Chain ID	31337
Currency Symbol	ETH
Block Explorer	(leave blank)