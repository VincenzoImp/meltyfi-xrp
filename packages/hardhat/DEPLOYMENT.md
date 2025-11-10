# MeltyFi Deployment Guide

## Automatic Frontend Sync

The deployment script now **automatically synchronizes** contract information for the frontend every time you deploy.

### What happens on deploy

When you run `yarn deploy` or `yarn deploy --reset`, the script will:

1. ✅ Deploy all MeltyFi contracts
2. ✅ Save deployment info to `deployments/{network}/meltyfi.json`
3. ✅ Update `packages/nextjs/lib/contracts.ts` with the latest addresses for the active network
4. ✅ Regenerate `packages/nextjs/contracts/deployedContracts.ts` so Scaffold-ETH hooks resolve the correct ABI + address per chain
5. ✅ Regenerate TypeScript ABIs for the frontend helpers

## Deployment Commands

### Deploy to Localhost

```bash
# In terminal 1: Start local node
yarn chain

# In terminal 2: Deploy contracts (auto-updates addresses)
yarn deploy
```

### Reset and Redeploy

```bash
yarn deploy --reset
```

### Deploy to XRP EVM Testnet

```bash
yarn deploy --network xrplEvmTestnet
```

### Deploy to XRP EVM Mainnet

```bash
yarn deploy --network xrplEvmMainnet
```

## What Gets Updated

The following contract addresses are written to both `contracts.ts` and `deployedContracts.ts` for the current network:

- ChocoChip (Governance Token)
- WonkaBar (Lottery Tickets)
- PseudoRandomGenerator (On-chain RNG)
- MeltyFiProtocol (Main Protocol)
- TestNFT (Test NFT Collection)

Other governance contracts (MeltyDAO, MeltyTimelock) remain unchanged and can be added manually if needed.

## Network Mapping

The deployment script automatically maps network names:

- `hardhat` → `localhost`
- `localhost` → `localhost`
- `xrplEvmTestnet` → `xrplEvmTestnet`
- `xrplEvmMainnet` → `xrplEvmMainnet`

No manual editing required! 🎉
