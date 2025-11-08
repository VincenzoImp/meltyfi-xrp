# NFT Selection Implementation Guide

This document explains how NFT selection works in MeltyFi and how to configure it for XRP EVM.

## Overview

MeltyFi now supports **real on-chain NFT fetching** from ERC721Enumerable collections, with dynamic collection discovery via the NFTFaucet factory pattern from xrp/nft-faucet-xrp.

## Architecture

### 1. Dynamic Collection Discovery (Recommended)

**NFTFaucet Factory Pattern:**
- Factory contract manages multiple NFT collections
- Collections are fetched dynamically via `getAllCollections()`
- No manual configuration needed
- Automatically detects new collections

**Deployed Factories:**
- **XRP EVM Testnet**: `0x105f1e0Fb9B1C17ACDFEC8CB0B3b7002F8269a90`
- **Local Hardhat**: `0xCace1b78160AE76398F486c8a18044da0d66d86D`
- **XRP EVM Mainnet**: Not deployed yet

### 2. Static Collection Configuration (Fallback)

Manual configuration in [lib/nft-collections.ts](packages/nextjs/lib/nft-collections.ts) for collections not managed by a factory.

## How It Works

### Step 1: Collection Discovery

The `useNFTFaucetCollections` hook automatically:
1. Detects the current network (Mainnet/Testnet/Local)
2. Looks up the NFTFaucet factory address for that network
3. Calls `getAllCollections()` on the factory
4. Returns array of collection addresses

```typescript
// In CreateLotteryForm.tsx
const { collections: dynamicCollections } = useNFTFaucetCollections();
const staticCollections = getNFTCollections(targetNetwork.id);
const nftCollections = dynamicCollections.length > 0 ? dynamicCollections : staticCollections;
```

### Step 2: NFT Fetching

The `useUserNFTs` hook fetches user's NFTs from all collections:

```typescript
// For each collection:
1. Call `tokensOfOwner(userAddress)` → Get token IDs
2. Call `tokenURI(tokenId)` → Get metadata URI
3. Call `name()` → Get collection name
4. Fetch metadata from tokenURI (supports IPFS)
```

### Step 3: Display

The `NFTSelector` component shows:
- NFT grid with images
- Token ID badges on each NFT
- Total count badge
- Selection state
- Loading/error/empty states

## Smart Contract Requirements

NFT collections MUST implement ERC721Enumerable with these functions:

```solidity
// Returns all token IDs owned by an address
function tokensOfOwner(address owner) external view returns (uint256[] memory);

// Returns metadata URI for a token
function tokenURI(uint256 tokenId) external view returns (string memory);

// Returns collection name
function name() external view returns (string memory);
```

### Example Implementation

```solidity
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MyNFT is ERC721Enumerable, ERC721URIStorage {
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokenIds;
    }

    // Override required functions
    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    // ... other overrides
}
```

## Configuration

### Option 1: Use NFTFaucet Factory (Recommended)

**No configuration needed!** If you have the NFTFaucet factory deployed:

1. Users visit the NFT Faucet dApp
2. Create/mint NFTs from available collections
3. Collections automatically appear in MeltyFi

**How to mint NFTs on Testnet:**
1. Deploy the xrp/nft-faucet-xrp frontend or use existing deployment
2. Connect to XRP EVM Testnet (Chain ID 1449000)
3. Browse available collections
4. Mint NFTs (free from faucet)
5. Return to MeltyFi - your NFTs are now selectable!

### Option 2: Static Configuration

Add collection addresses manually to [lib/nft-collections.ts](packages/nextjs/lib/nft-collections.ts):

```typescript
// XRP EVM Testnet NFT Collections
export const XRPL_TESTNET_NFT_COLLECTIONS: Address[] = [
  "0xYourCollection1" as Address,
  "0xYourCollection2" as Address,
];

// XRP EVM Mainnet NFT Collections
export const XRPL_MAINNET_NFT_COLLECTIONS: Address[] = [
  "0xYourMainnetCollection" as Address,
];
```

## Testing Locally

### 1. Deploy NFTFaucet Factory

```bash
cd xrp/nft-faucet-xrp-main/packages/hardhat
yarn deploy
```

This deploys:
- NFTFaucet factory at `0xCace1b78160AE76398F486c8a18044da0d66d86D`
- Automatically creates some test collections

### 2. Start Local Chain

```bash
# Terminal 1: Start Hardhat node
yarn chain

# Terminal 2: Deploy contracts
yarn deploy

# Terminal 3: Start frontend
yarn start
```

### 3. Mint Test NFTs

Option A: Use NFT Faucet dApp
```bash
cd xrp/nft-faucet-xrp-main
yarn start
# Visit http://localhost:3000
# Mint NFTs from available collections
```

Option B: Script to mint NFTs
```typescript
// scripts/mintTestNFT.ts
const collections = await nftFaucet.getAllCollections();
await nftFaucet.batchMintFromCollection(collections[0], 5); // Mint 5 NFTs
```

### 4. Create Lottery in MeltyFi

1. Visit MeltyFi dApp
2. Go to "Create Lottery"
3. See your minted NFTs in the gallery
4. Select one to create a lottery

## Troubleshooting

### "No NFTs found in your wallet"

**Possible causes:**
1. No NFT collections configured/available
2. User doesn't own any NFTs
3. NFT contract doesn't implement `tokensOfOwner()`

**Solutions:**
- Check if NFTFaucet factory is deployed: See [lib/nft-collections.ts](packages/nextjs/lib/nft-collections.ts)
- Mint test NFTs from NFT Faucet
- Verify contract implements ERC721Enumerable
- Check browser console for errors

### "Error loading NFTs"

**Check:**
1. Network is correct (Testnet/Mainnet/Local)
2. Factory address is correct for the network
3. RPC endpoint is working
4. Contract has `getAllCollections()` function

### NFT Images Not Loading

**IPFS URIs are automatically converted:**
- `ipfs://QmXXX...` → `https://ipfs.io/ipfs/QmXXX...`

**If still not loading:**
- Check tokenURI returns valid URL or IPFS hash
- Try different IPFS gateway
- Check browser console for CORS errors

## UI Features

### Enhanced from xrp/nft-faucet-xrp

✅ **Token ID Badge** - Shows token ID on each NFT card
✅ **Stats Badge** - Total NFT count in header
✅ **Gradient Backgrounds** - Better visual appeal
✅ **Loading States** - "Loading your NFT collection..."
✅ **Empty States** - Helpful guidance with refresh button
✅ **Error Handling** - Per-collection and per-token try-catch
✅ **IPFS Support** - Automatic IPFS URL conversion
✅ **Metadata Fetching** - Fetches name, image, description from tokenURI

### Responsive Grid Layout

- **Mobile**: 2 columns
- **Tablet**: 3 columns
- **Desktop**: 4 columns

## File Structure

```
packages/nextjs/
├── hooks/meltyfi/
│   ├── useUserNFTs.ts              # Fetches NFTs from collections
│   ├── useNFTFaucetCollections.ts  # Fetches collections from factory
│   └── index.ts                    # Exports all hooks
├── components/meltyfi/
│   ├── nft/NFTSelector.tsx         # NFT gallery UI
│   └── lottery/CreateLotteryForm.tsx # Uses NFTSelector
├── lib/
│   └── nft-collections.ts          # Configuration & factory addresses
└── types/
    └── nft.ts                      # NFT type definitions
```

## Next Steps

### For Development

1. **Deploy NFTFaucet Factory to XRP EVM Testnet** (already done: `0x105f1e0Fb9B1C17ACDFEC8CB0B3b7002F8269a90`)
2. **Create test collections** via NFT Faucet
3. **Mint test NFTs** for testing
4. **Test lottery creation** with real NFTs

### For Production

1. **Deploy NFTFaucet Factory to XRP EVM Mainnet**
2. Update `NFT_FAUCET_FACTORIES` in [lib/nft-collections.ts](packages/nextjs/lib/nft-collections.ts)
3. Partner with existing NFT projects on XRP EVM
4. Add their collection addresses to static config

## API Reference

### Hooks

#### `useUserNFTs(address, collections)`

Fetches NFTs owned by an address from specified collections.

```typescript
const { nfts, isLoading, error, refetch } = useUserNFTs(
  userAddress,
  collectionAddresses
);
```

**Returns:**
- `nfts: NFT[]` - Array of NFT objects
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error state
- `refetch: () => void` - Manually refetch NFTs

#### `useNFTFaucetCollections()`

Fetches collection addresses from NFTFaucet factory.

```typescript
const { collections, isLoading, error, refetch } = useNFTFaucetCollections();
```

**Returns:**
- `collections: Address[]` - Array of collection addresses
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error state
- `refetch: () => void` - Manually refetch collections

### Types

```typescript
interface NFT {
  contract: string;        // Collection contract address
  tokenId: string;         // Token ID
  name: string;           // NFT name from metadata
  image: string;          // Image URL (IPFS converted)
  collectionName: string; // Collection name
}
```

## Resources

- **NFT Faucet Reference**: [xrp/nft-faucet-xrp-main/packages/nextjs/components/nft-faucet/SimpleUserGallery.tsx](xrp/nft-faucet-xrp-main/packages/nextjs/components/nft-faucet/SimpleUserGallery.tsx)
- **ERC721Enumerable**: [OpenZeppelin Docs](https://docs.openzeppelin.com/contracts/4.x/api/token/erc721#ERC721Enumerable)
- **XRP EVM Testnet**: [https://explorer.testnet.xrplevm.org](https://explorer.testnet.xrplevm.org)
- **IPFS Gateways**: [https://ipfs.io](https://ipfs.io)

---

**Summary**: MeltyFi now has a fully functional NFT selection system that works with the NFTFaucet factory on XRP EVM Testnet. Users can mint NFTs from the faucet and immediately use them to create lotteries!
