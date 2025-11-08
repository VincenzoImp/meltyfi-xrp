# MeltyFi Protocol - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites

- Node.js >= 20.18.3
- Yarn package manager
- Git

### Installation

```bash
# Clone the repository (if not already done)
cd meltyfi-xrp

# Install dependencies
yarn install
```

### Compile Contracts

```bash
# Compile all smart contracts
yarn compile

# Expected output: "Compiled 81 Solidity files successfully"
```

### Run Tests

```bash
# Run test suite
yarn test

# Run with gas reporting
REPORT_GAS=true yarn test

# Run with coverage
yarn coverage
```

### Deploy Locally

```bash
# Terminal 1: Start local blockchain
yarn chain

# Terminal 2: Deploy contracts
yarn deploy
```

### Deploy to Testnet

```bash
# Configure your deployer private key in packages/hardhat/.env
echo "DEPLOYER_PRIVATE_KEY=your_private_key_here" >> packages/hardhat/.env

# Deploy to Sepolia testnet
yarn deploy --network sepolia
```

## 📁 Key Files

| File | Description |
|------|-------------|
| [MELTYFI_REQUIREMENTS.md](./MELTYFI_REQUIREMENTS.md) | Complete protocol specification |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | What was built & status |
| [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | Detailed implementation guide |
| [packages/hardhat/contracts/](./packages/hardhat/contracts/) | Smart contract source code |
| [packages/hardhat/deploy/](./packages/hardhat/deploy/) | Deployment scripts |
| [packages/hardhat/test/](./packages/hardhat/test/) | Test suites |

## 🏗️ Smart Contracts

All contracts compiled successfully ✅:

1. **ChocoChip.sol** - Governance token (ERC-20)
2. **WonkaBar.sol** - Lottery tickets (ERC-1155)
3. **VRFManager.sol** - Chainlink VRF integration
4. **MeltyFiProtocol.sol** - Main protocol logic
5. **MeltyTimelock.sol** - Governance timelock
6. **MeltyDAO.sol** - DAO governance

## 🔒 Security Features

✅ NFT ownership verification
✅ Reentrancy protection
✅ Pausable emergency stop
✅ DAO governance with timelock
✅ Upgradeable contracts (UUPS)
✅ Chainlink VRF for randomness

## 📊 Protocol Overview

```
NFT Owner → Deposits NFT → Receives 95% instant liquidity
                ↓
        Participants buy WonkaBar tickets
                ↓
    Either: Owner repays loan → NFT returned
       Or: Lottery expires → Random winner gets NFT
                ↓
    All participants earn ChocoChip governance tokens
```

## 🎯 Next Steps

1. ✅ Smart contracts implemented and compiled
2. ⏳ Complete test suite
3. ⏳ Frontend integration (wagmi/viem)
4. ⏳ Testnet deployment
5. ⏳ Security audit
6. ⏳ Mainnet deployment

## 📚 Documentation

- **Complete Spec**: [MELTYFI_REQUIREMENTS.md](./MELTYFI_REQUIREMENTS.md)
- **Implementation Details**: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- **Status Summary**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

## 💡 Key Commands

```bash
# Development
yarn compile          # Compile contracts
yarn test             # Run tests
yarn chain            # Start local blockchain
yarn deploy           # Deploy contracts
yarn start            # Start frontend

# Contract management
yarn hardhat:clean    # Clean artifacts
yarn hardhat:compile  # Compile only hardhat
yarn hardhat:test     # Test only hardhat

# Formatting & Linting
yarn format           # Format code
yarn lint             # Lint code
```

## ⚙️ Configuration

### Environment Variables

Create `.env` files in:
- `packages/hardhat/.env` - For deployment keys
- `packages/nextjs/.env` - For frontend config

### Required for Deployment

```bash
# packages/hardhat/.env
DEPLOYER_PRIVATE_KEY=your_private_key
ALCHEMY_API_KEY=your_alchemy_key # (optional)
ETHERSCAN_API_KEY=your_etherscan_key # (for verification)
```

## 🔗 Important Links

- **Chainlink VRF**: https://vrf.chain.link
- **OpenZeppelin**: https://docs.openzeppelin.com
- **Hardhat**: https://hardhat.org
- **Scaffold-ETH 2**: https://scaffoldeth.io

## ❓ Need Help?

1. Check [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for detailed docs
2. Review [MELTYFI_REQUIREMENTS.md](./MELTYFI_REQUIREMENTS.md) for protocol spec
3. See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for current status

---

**Status**: ✅ Ready for Testing & Deployment
**Built with**: Scaffold-ETH 2 + OpenZeppelin + Chainlink
