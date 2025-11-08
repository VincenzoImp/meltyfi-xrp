# MeltyFi Deployment Guide

## Automatic Contract Address Updates

The deployment script now **automatically updates** the contract addresses in `packages/nextjs/lib/contracts.ts` after each deployment.

## How It Works

When you run `yarn deploy` or `yarn deploy --reset`, the deployment script will:

1. ✅ Deploy all MeltyFi contracts
2. ✅ Save deployment info to `deployments/{network}/meltyfi.json`
3. ✅ **Automatically update** `packages/nextjs/lib/contracts.ts` with the new addresses
4. ✅ Generate TypeScript ABIs for the frontend

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

## Manual Address Update (if needed)

If you need to manually update the addresses from a previous deployment:

```bash
yarn update-addresses
```

This reads from `deployments/{network}/meltyfi.json` and updates `contracts.ts`.

## What Gets Updated

The following contract addresses are automatically updated for the target network:

- ChocoChip (Governance Token)
- WonkaBar (Lottery Tickets)
- PseudoRandomGenerator (On-chain RNG)
- MeltyTimelock (Governance Timelock)
- MeltyFiProtocol (Main Protocol)
- MeltyDAO (Governance)
- TestNFT (Test NFT Collection)

## Network Mapping

The deployment script automatically maps network names:

- `hardhat` → `localhost` in contracts.ts
- `localhost` → `localhost` in contracts.ts
- `xrplEvmTestnet` → `xrplEvmTestnet` in contracts.ts
- `xrplEvmMainnet` → `xrplEvmMainnet` in contracts.ts

## Example Output

```
✅ Auto-updated contract addresses in contracts.ts for localhost
```

No manual editing required! 🎉
