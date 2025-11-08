# MeltyFi XRP EVM Migration Summary

## Overview
This document summarizes the migration of MeltyFi Protocol from Ethereum to XRP EVM sidechain.

**Date**: 2025-11-08
**Target**: XRP EVM Sidechain
**Status**: ✅ Contract Migration Complete | ⚠️ Frontend Updates In Progress

---

## Key Changes Made

### 1. **Random Number Generation**
**Problem**: Chainlink VRF is not available on XRP EVM
**Solution**: Implemented `PseudoRandomGenerator.sol`

- ✅ Uses on-chain entropy sources (block.prevrandao, timestamp, etc.)
- ✅ Synchronous winner selection (no waiting for oracle)
- ⚠️ **NOT cryptographically secure** - suitable for NFT lotteries only
- ✅ Same interface as VRFManager for minimal code changes

**File**: `packages/hardhat/contracts/PseudoRandomGenerator.sol`

```solidity
// Combines multiple entropy sources:
- block.prevrandao (post-merge randomness)
- block.timestamp
- block.number
- msg.sender
- lotteryId
- internal nonce
- blockhash(block.number - 1)
```

---

### 2. **Price Oracle Integration**
**Problem**: Need XRP/USD price for CHOC reward calculation
**Solution**: Integrated Band Protocol StdReference oracle

- ✅ Created `IStdReference.sol` interface
- ✅ Added `priceOracle` state variable to MeltyFiProtocol
- ✅ Implemented `_calculateChocoChipRewards()` helper function

**File**: `packages/hardhat/contracts/interfaces/IStdReference.sol`

**Band Protocol Address**: TBD (Update in deployment script)

---

### 3. **CHOC Reward Calculation**
**Old System**: Fixed rate - 1000 CHOC per 1 ETH
**New System**: Dynamic rate - 10% of XRP USD value

**Example Calculation**:
```
User spends: 10 XRP
XRP Price: $2.50 USD
USD Value: 10 × 2.50 = $25 USD
CHOC Reward: $25 × 10% = 2.5 CHOC
```

**Contract Function**:
```solidity
function _calculateChocoChipRewards(uint256 xrpAmount) internal view returns (uint256) {
    IStdReference.ReferenceData memory data = priceOracle.getReferenceData("XRP", "USD");
    uint256 usdValue = (xrpAmount * data.rate) / 1e18;
    uint256 chocoChipsAmount = (usdValue * chocoChipsRewardPercentage) / BASIS_POINTS;
    return chocoChipsAmount;
}
```

---

### 4. **Contract Updates**

#### `MeltyFiProtocol.sol`
**Changes**:
- ✅ Replaced `VRFManager` with `PseudoRandomGenerator`
- ✅ Added `IStdReference priceOracle`
- ✅ Renamed `chocoChipsPerEther` → `chocoChipsRewardPercentage`
- ✅ Updated `buyWonkaBars()` to use new CHOC calculation
- ✅ Updated `repayLoan()` to use new CHOC calculation
- ✅ Updated `meltWonkaBars()` to use new CHOC calculation
- ✅ Changed all "ETH" comments to "XRP"
- ✅ Updated event `WonkaBarsMelted` parameter: `ethRefunded` → `xrpRefunded`

#### New Contracts
- ✅ `PseudoRandomGenerator.sol` - Pseudo-random winner selection
- ✅ `interfaces/IStdReference.sol` - Band Protocol oracle interface

---

### 5. **Deployment Script Updates**

**File**: `packages/hardhat/deploy/00_deploy_meltyfi.ts`

**Changes**:
- ✅ Removed VRF Coordinator configuration
- ✅ Added Band Protocol oracle address (placeholder - **UPDATE BEFORE DEPLOY**)
- ✅ Deploy `PseudoRandomGenerator` instead of `VRFManager`
- ✅ Pass oracle address to MeltyFiProtocol initialize
- ✅ Updated deployment parameters documentation

**Required Before Deployment**:
```typescript
// Line 31 - UPDATE THIS!
const BAND_ORACLE_ADDRESS = "0x0000..."; // Get from Band Protocol docs
```

---

### 6. **Frontend Updates**

#### Constants (`packages/nextjs/lib/constants.ts`)
- ✅ `CHOCO_CHIPS_PER_ETH` → `CHOCO_CHIPS_REWARD_PERCENTAGE`
- ✅ `ETHERSCAN_BASE_URL` → `BLOCK_EXPLORER_BASE_URL`
- ✅ Updated to XRP EVM Explorer

#### Utils (`packages/nextjs/lib/utils.ts`)
- ✅ Updated comments: "wei to eth" → "wei to XRP"
- ✅ Function names kept for compatibility (formatEth, parseEthToWei)

#### Components - **PENDING UPDATES**

**Files Needing Review** (Search for "ETH", "Ether", "ether"):
```
packages/nextjs/app/page.tsx - ✅ Already updated (liquidity potential)
packages/nextjs/app/create/page.tsx - ✅ Already updated
packages/nextjs/components/meltyfi/lottery/BuyWonkaBarsDialog.tsx - ✅ Updated
packages/nextjs/components/meltyfi/lottery/RepayLoanDialog.tsx - ✅ Updated
packages/nextjs/components/meltyfi/lottery/MeltWonkaBarsDialog.tsx - ✅ Updated
packages/nextjs/components/meltyfi/lottery/LotteryDetails.tsx - Needs review
packages/nextjs/components/meltyfi/lottery/CreateLotteryForm.tsx - Needs review
packages/nextjs/components/meltyfi/stats/*.tsx - Needs review
```

**Recommended Updates**:
1. Change all "ETH" display text to "XRP"
2. Update CHOC reward explanation: "1000 CHOC per 1 ETH" → "10% of XRP USD value"
3. Update tooltips and help text

---

### 7. **NFT Metadata Fetching**

**Reference Implementation**: `xrp/nft-faucet-xrp-main/packages/nextjs/components/nft-faucet/SimpleUserGallery.tsx`

**Pattern to Implement**:
```typescript
// 1. Define ABI for ERC721 functions
const nftABI = [
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// 2. Fetch tokenURI from contract
const tokenURI = await publicClient.readContract({
  address: nftContract as `0x${string}`,
  abi: nftABI,
  functionName: "tokenURI",
  args: [tokenId],
});

// 3. Fetch metadata from tokenURI (if IPFS/HTTP)
const metadata = await fetch(tokenURI).then(r => r.json());

// 4. Display image from metadata.image
<Image src={metadata.image} alt={metadata.name} />
```

**Files to Update**:
- `packages/nextjs/components/meltyfi/nft/NFTSelector.tsx`
- `packages/nextjs/hooks/meltyfi/useUserNFTs.ts`

---

### 8. **Network Configuration**

**Required Updates** in `packages/nextjs/scaffold.config.ts`:

```typescript
const scaffoldConfig = {
  targetNetworks: [
    {
      id: 1440002, // XRP EVM Devnet
      name: "XRP EVM Devnet",
      nativeCurrency: {
        decimals: 18,
        name: "XRP",
        symbol: "XRP",
      },
      rpcUrls: {
        default: { http: ["https://rpc-evm-sidechain.xrpl.org"] },
        public: { http: ["https://rpc-evm-sidechain.xrpl.org"] },
      },
      blockExplorers: {
        default: { name: "XRP EVM Explorer", url: "https://explorer.xrplevm.org" },
      },
    },
  ],
};
```

**Testnet/Mainnet** (check latest docs):
- Devnet: `https://rpc-evm-sidechain.xrpl.org`
- Testnet: TBD
- Mainnet: TBD

---

## Testing Checklist

### Smart Contracts
- [ ] Deploy PseudoRandomGenerator
- [ ] Deploy MeltyFiProtocol with oracle address
- [ ] Test CHOC rewards calculation with mock oracle
- [ ] Test lottery creation
- [ ] Test ticket purchase with XRP
- [ ] Test winner selection (pseudo-random)
- [ ] Test refund mechanism (melt WonkaBars)
- [ ] Test NFT claim for winner

### Frontend
- [ ] Update all "ETH" references to "XRP"
- [ ] Test wallet connection with XRP EVM
- [ ] Test NFT metadata loading
- [ ] Test CHOC reward display (dynamic based on price)
- [ ] Test lottery creation flow
- [ ] Test ticket purchase flow
- [ ] Test profile/dashboard
- [ ] Test all edge cases

---

## Deployment Steps

### 1. Pre-Deployment
```bash
# Update Band Protocol oracle address
# Edit: packages/hardhat/deploy/00_deploy_meltyfi.ts
const BAND_ORACLE_ADDRESS = "0x..."; # Get from Band docs

# Update network in hardhat.config.ts
networks: {
  xrpEvm: {
    url: "https://rpc-evm-sidechain.xrpl.org",
    accounts: [process.env.DEPLOYER_PRIVATE_KEY],
  },
}
```

### 2. Deploy Contracts
```bash
cd packages/hardhat
yarn deploy --network xrpEvm
```

### 3. Verify Deployment
- Check PseudoRandomGenerator is connected to MeltyFiProtocol
- Verify Band oracle address is correct
- Test CHOC reward calculation

### 4. Frontend Configuration
```bash
# Update contract addresses in generated files
cd packages/nextjs
# Contracts will be auto-imported from hardhat/deployments
```

### 5. Testing
```bash
# Run comprehensive tests
yarn test

# Manual testing on devnet
```

---

## Security Considerations

### ⚠️ Pseudo-Random Generation
- **NOT suitable for high-value lotteries**
- Miners can potentially influence block values
- Acceptable for NFT lotteries where manipulation cost > potential gain
- Consider adding minimum block delay or commit-reveal for added security

### ✅ Band Protocol Oracle
- Decentralized price feed
- Multiple validators
- Regular updates
- Check for stale data (lastUpdatedBase/lastUpdatedQuote)

---

## Migration Costs

### Gas Estimates (Approximate)
- Deploy PseudoRandomGenerator: ~500k gas
- Deploy MeltyFiProtocol: ~3M gas
- Create Lottery: ~200k gas
- Buy Tickets: ~150k gas (includes CHOC minting)
- Draw Winner: ~100k gas (synchronous, no VRF wait)

---

## Future Improvements

1. **Enhanced Randomness**
   - Implement commit-reveal scheme
   - Add minimum block delay
   - Consider multi-block entropy

2. **Oracle Fallback**
   - Add secondary price oracle
   - Implement price deviation checks
   - Add emergency price override

3. **NFT Metadata**
   - Cache metadata on-chain or IPFS
   - Implement metadata refresh mechanism
   - Support multiple metadata standards

4. **Cross-Chain**
   - Bridge to Ethereum mainnet
   - Support XRP Ledger NFTs
   - Multi-chain governance

---

## Resources

- **XRP EVM Docs**: https://docs.xrplevm.org
- **Band Protocol**: https://docs.bandchain.org
- **Reference NFT Faucet**: `xrp/nft-faucet-xrp-main`
- **Band Oracle Contract**: `xrp/band-std-reference-contracts-solidity-main`

---

## Contact & Support

For questions about this migration:
- Review contract changes in git diff
- Check deployment logs in `packages/hardhat/deployments`
- Test on XRP EVM devnet before mainnet

---

**Last Updated**: 2025-11-08
**Version**: v1.0.0-xrp-migration
**Status**: Smart contracts complete, frontend updates in progress
