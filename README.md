<br />
<div align="center">
  <a href="https://github.com/teyweikiet/stackup-aptos-nft-marketplace-bounty">
    <img src="frontend/public/favicon.ico" alt="Logo" width="50" height="50">
  </a>

  <h1 align="center" style="border-bottom: 0;">Aptos NFT Marketplace dApp</h1>

  <p align="center">
    A full stack NFT Marketplace dApp powered by Aptos!
    <br />
    <a href="https://stackup-aptos-nft-marketplace-bounty.netlify.app/"><strong>View Demo</strong></a>
    |
    <a href="https://explorer.aptoslabs.com/account/0x789cd3639816774c8529baedbd1a346944cdeb8efc893f8295e0064cd86a4886/modules/code/NFTMarketplaceV3?network=devnet"><strong>View Contract</strong></a>
    <br />
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#functionalities">Functionalities</a></li>
      </ul>
    </li>
    <li>
      <a href="#built-with">Built With</a>
      <ul>
        <li><a href="#backend">Backend</a></li>
        <li><a href="#frontend">Frontend</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
  </ol>
</details>

## About the project

This is a submission for [Bounty - Level Up Your Aptos NFT Marketplace dApp (Fullstack)](https://earn.stackup.dev/campaigns/move-on-aptos-iv/quests/bounty-level-up-your-aptos-nft-marketplace-dapp-fullstack-5b7a).

### Added Functionalities

- Minting for All Users. Users other than marketplace owner will be charged a minting fee.

- NFT Transfers. Users can transfer their NFT to each other as gifts.

- Advanced Filtering & Sorting. Users can filter NFTs on sale by rarity and price range. Besides, users can also sort the NFTs by date listed, date minted and price.

## Built With

### Backend

- Aptos Move for secure, sandboxed, and formally verified programming which is used for multiple chains.

### Frontend

- React for frontend web app development

- Ant Design for building beautiful, responsive & accessible components

- Aptos Wallet Adapter to interact with the deployed contract

- Netlify for hosting frontend app: https://stackup-aptos-nft-marketplace-bounty.netlify.app/

## Getting Started

### Prerequisites

- Install Node.js
- Install Aptos CLI

### Installation

1. Clone the repo
```sh
git clone https://github.com/teyweikiet/stackup-aptos-nft-marketplace-bounty
```

#### Backend

1. Go to backend/contracts directory
```sh
cd backend/contracts
```

2. Initialize the Aptos Project
```sh
aptos init
```

3. Select the network to deploy e.g. devnet

4. Enter private key of your account

5. Publish the Smart Contract to the Network by running
```sh
aptos move publish
```

#### Frontend

1. Go to frontend directory
```sh
cd frontend
```

2. Install NPM packages
```sh
npm install
```

3. Create .env and modify accordingly
```sh
cp .env.example .env
```

4. Start locally by running
```sh
npm start
```

