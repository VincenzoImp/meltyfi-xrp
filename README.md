# MeltyFi - NFT Liquidity Protocol on XRP EVM

> Unlock liquidity for your NFTs through decentralized lotteries on the XRP Ledger EVM Sidechain

## Overview

MeltyFi is a decentralized NFT liquidity protocol that allows NFT holders to create lotteries and earn XRP as participants buy tickets for a chance to win. Built on XRP EVM Sidechain, MeltyFi provides instant liquidity without selling your NFTs.

### Key Features

- **NFT Lotteries**: Create time-bound lotteries for your NFTs with customizable ticket prices and supply
- **Instant Liquidity**: Receive 95% of XRP proceeds as tickets sell (5% protocol fee)
- **Fair Winner Selection**: On-chain pseudo-random number generation for transparent draws
- **ChocoChips Rewards**: Participants earn CHOC tokens (10% of XRP USD value via Band Protocol oracle)
- **Flexible Cancellation**: Lottery owners can repay and cancel to retrieve their NFTs
- **Governance**: CHOC token holders participate in protocol governance via MeltyDAO

## Technology Stack

- **Smart Contracts**: Solidity 0.8.20 with OpenZeppelin UUPS upgradeable pattern
- **Blockchain**: XRP Ledger EVM Sidechain (Mainnet Chain ID: 1440000, Testnet: 1449000)
- **Price Oracle**: Band Protocol for XRP/USD price feeds
- **Frontend**: Next.js 15.2.3 with App Router
- **Web3**: wagmi 2.16.4 + viem 2.34.0
- **Development**: Hardhat with TypeScript

## Architecture

### Smart Contracts

1. **MeltyFiProtocol** - Core lottery management contract
2. **ChocoChip** - ERC20 governance token with minting controls
3. **WonkaBar** - ERC1155 lottery ticket NFTs
4. **PseudoRandomGenerator** - On-chain randomness for winner selection
5. **MeltyDAO** - Governance contract (Governor + Timelock)
6. **MeltyTimelock** - 48-hour timelock for governance actions

### Contract Addresses

> Deployed contracts will be listed here after deployment

## Requirements

- [Node.js >= v20.18.3](https://nodejs.org/en/download/)
- [Yarn v1](https://classic.yarnpkg.com/en/docs/install/) or [Yarn v2+](https://yarnpkg.com/getting-started/install)
- [Git](https://git-scm.com/downloads)

## Quickstart

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure Network

The project is pre-configured for XRP EVM networks in `packages/hardhat/hardhat.config.ts`:

- **XRP EVM Mainnet**: RPC `https://rpc.xrplevm.org` (Chain ID: 1440000)
- **XRP EVM Testnet**: RPC `https://rpc.testnet.xrplevm.org` (Chain ID: 1449000)

### 3. Set Up Environment

Create `.env` file in `packages/hardhat/`:

```env
# Private key for deployment (NEVER commit this!)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Optional: Block explorer API key
ETHERSCAN_V2_API_KEY=your_key_here
```

### 4. Compile Contracts

```bash
yarn hardhat:compile
```

### 5. Run Tests

```bash
yarn hardhat:test
```

### 6. Deploy to XRP EVM Testnet

```bash
yarn hardhat:deploy --network xrplEvmTestnet
```

### 7. Start Frontend

```bash
yarn start
```

Visit `http://localhost:3000` to interact with the application.

## Project Structure

```
meltyfi-xrp/
├── packages/
│   ├── hardhat/                 # Smart contracts & deployment
│   │   ├── contracts/           # Solidity contracts
│   │   │   ├── MeltyFiProtocol.sol
│   │   │   ├── ChocoChip.sol
│   │   │   ├── WonkaBar.sol
│   │   │   ├── PseudoRandomGenerator.sol
│   │   │   ├── MeltyDAO.sol
│   │   │   └── MeltyTimelock.sol
│   │   ├── deploy/              # Deployment scripts
│   │   │   └── 00_deploy_meltyfi.ts
│   │   └── test/                # Contract tests
│   └── nextjs/                  # Frontend application
│       ├── app/                 # Next.js App Router pages
│       ├── components/          # React components
│       │   └── meltyfi/         # MeltyFi-specific components
│       ├── hooks/               # Custom React hooks
│       └── scaffold.config.ts   # Network configuration
└── README.md
```

## How It Works

### For NFT Owners (Lottery Creators)

1. **Create Lottery**
   - Lock your NFT in the protocol
   - Set ticket price in XRP
   - Choose number of tickets (5-100)
   - Set duration (1-30 days)

2. **Earn as Tickets Sell**
   - Receive 95% of XRP proceeds instantly
   - Withdraw anytime during the lottery

3. **Outcomes**
   - **Sells Out/Expires**: Random winner selected, gets NFT
   - **Cancel**: Repay 100% of sales to cancel and retrieve NFT

### For Participants

1. **Buy Tickets**
   - Browse active lotteries
   - Purchase 1-20 tickets per lottery
   - Maximum 25% of total supply per user

2. **Earn CHOC Tokens**
   - Receive ChocoChips (10% of XRP USD value)
   - Use for governance voting

3. **Win or Redeem**
   - **Winner**: Claim the NFT
   - **Non-winner**: Melt tickets for CHOC rewards
   - **Cancelled**: Melt tickets for XRP refund + CHOC

## Key Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Protocol Fee | 5% | Fee on all ticket sales |
| Owner Share | 95% | Share of sales to NFT owner |
| Max Tickets | 100 | Maximum tickets per lottery |
| Min Tickets | 5 | Minimum tickets per lottery |
| Max User Balance | 25% | Max tickets one user can hold |
| CHOC Rewards | 10% | Of XRP USD value spent |
| Timelock Delay | 48 hours | Governance execution delay |
| Voting Period | ~7 days | Governance proposal duration |

## Band Protocol Integration

MeltyFi uses Band Protocol's decentralized oracle for real-time XRP/USD price feeds to calculate CHOC token rewards:

- **Mainnet Oracle**: `0x6ec95bC946DcC7425925801F4e262092E0d1f83b`
- **Testnet Oracle**: `0x8c064bCf7C0DA3B3b090BAbFE8f3323534D84d68`

## Security Considerations

- All core contracts use OpenZeppelin's UUPS upgradeable pattern
- Governance changes require 48-hour timelock
- PseudoRandomGenerator is NOT cryptographically secure (acceptable for NFT lottery use case)
- Comprehensive test coverage in `packages/hardhat/test/`

## Development

### Available Commands

```bash
# Smart contract development
yarn hardhat:compile      # Compile contracts
yarn hardhat:test        # Run tests
yarn hardhat:deploy      # Deploy to network
yarn hardhat:verify      # Verify on block explorer

# Frontend development
yarn start               # Start Next.js dev server
yarn next:build         # Build for production
yarn next:lint          # Lint frontend code

# Combined
yarn compile            # Compile all
yarn deploy             # Deploy all
yarn test               # Run all tests
```

### Network Configuration

Edit `packages/nextjs/scaffold.config.ts` to change target network:

```typescript
const scaffoldConfig = {
  targetNetworks: [xrplEvmTestnet], // or xrplEvmMainnet
  // ...
}
```

## Deployment Checklist

Before deploying to mainnet:

- [ ] Audit smart contracts
- [ ] Test on XRP EVM Testnet
- [ ] Verify Band Protocol oracle address
- [ ] Set up multisig for DAO treasury
- [ ] Update frontend contract addresses
- [ ] Configure proper RPC endpoints
- [ ] Test all user flows

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Resources

- [XRP Ledger EVM Sidechain Docs](https://docs.xrplevm.org/)
- [Band Protocol Integration](https://docs.bandchain.org/)
- [OpenZeppelin Upgradeable Contracts](https://docs.openzeppelin.com/contracts/4.x/upgradeable)
- [Next.js Documentation](https://nextjs.org/docs)
- [Hardhat Documentation](https://hardhat.org/docs)

## Support

For questions and support:
- Create an issue in this repository
- Join our community discussions

---

Built with ❤️ for the XRP Ledger ecosystem
