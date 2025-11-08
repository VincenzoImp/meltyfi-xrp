# MeltyFi Frontend Implementation Guide

**Status**: Foundation Started
**Date**: November 8, 2025
**Backend Status**: ✅ Complete (v1.0.0-evm-backend)
**Frontend Status**: 🚧 In Progress

---

## Implementation Summary

The MeltyFi frontend follows the specifications in `MELTYFI_REQUIREMENTS.md` Section 4. This guide provides step-by-step instructions for completing the implementation.

### Technology Stack (Already Installed)

✅ **Core Framework**:
- Next.js 15.2.3 (App Router)
- React 19.0.0
- TypeScript 5.8.2

✅ **Blockchain Integration**:
- wagmi 2.16.4
- viem 2.34.0
- RainbowKit 2.2.8
- @tanstack/react-query 5.59.15

✅ **UI & Styling**:
- Tailwind CSS 4.1.3
- Radix UI components (Dialog, Dropdown, Select, Tabs, Progress, Toast, Slot)
- lucide-react (icons)
- son ner (toast notifications)
- class-variance-authority, clsx, tailwind-merge (utility)

✅ **Forms & Validation**:
- react-hook-form
- @hookform/resolvers
- zod

✅ **Charts & Visualization**:
- recharts
- date-fns

---

## Directory Structure

```
packages/nextjs/
├── app/                           # Next.js App Router
│   ├── page.tsx                   # ✅ Home/Landing page
│   ├── layout.tsx                 # Root layout (already exists)
│   ├── lotteries/
│   │   ├── page.tsx               # 🚧 Browse lotteries
│   │   └── [id]/page.tsx          # 🚧 Lottery details
│   ├── create/
│   │   └── page.tsx               # 🚧 Create lottery
│   ├── profile/
│   │   └── page.tsx               # 🚧 User dashboard
│   └── governance/
│       └── page.tsx               # 🚧 DAO voting
├── components/
│   ├── ui/                        # 🚧 shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   ├── progress.tsx
│   │   ├── select.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── meltyfi/                   # 🚧 MeltyFi-specific components
│       ├── lottery/
│       │   ├── LotteryCard.tsx
│       │   ├── LotteryDetails.tsx
│       │   ├── LotteryGrid.tsx
│       │   ├── BuyWonkaBarsDialog.tsx
│       │   ├── RepayLoanDialog.tsx
│       │   └── CreateLotteryForm.tsx
│       ├── nft/
│       │   ├── NFTCard.tsx
│       │   ├── NFTGallery.tsx
│       │   └── NFTSelector.tsx
│       └── stats/
│           ├── ProtocolStats.tsx
│           ├── UserStats.tsx
│           └── LotteryStats.tsx
├── hooks/
│   └── meltyfi/                   # 🚧 Custom hooks
│       ├── useMeltyFiProtocol.ts  # Main protocol hook
│       ├── useLotteries.ts        # Query active lotteries
│       ├── useLottery.ts          # Query single lottery
│       ├── useCreateLottery.ts    # Create lottery mutation
│       ├── useBuyWonkaBars.ts     # Buy WonkaBars mutation
│       ├── useRepayLoan.ts        # Repay loan mutation
│       ├── useChocoChip.ts        # ChocoChip token queries
│       ├── useWonkaBar.ts         # WonkaBar token queries
│       └── useUserNFTs.ts         # User NFT queries
├── lib/
│   ├── contracts.ts               # 🚧 Contract addresses & ABIs
│   ├── utils.ts                   # ✅ Utility functions
│   └── constants.ts               # ✅ App constants
└── types/
    ├── lottery.ts                 # 🚧 Lottery types
    ├── nft.ts                     # 🚧 NFT types
    └── contracts.ts               # 🚧 Contract types
```

---

## Phase 1: Core Infrastructure (CURRENT)

### 1.1 Utility Files ✅

**Created**:
- `lib/utils.ts` - Helper functions (cn, formatAddress, formatEth, etc.)
- `lib/constants.ts` - App constants and enums

### 1.2 Contract Configuration 🚧

**Next Step**: Create `lib/contracts.ts`

```typescript
// lib/contracts.ts
import { type Address } from "viem";

// Contract addresses (update per network)
export const CONTRACTS = {
  localhost: {
    ChocoChip: "0x21dF544947ba3E8b3c32561399E88B52Dc8b2823" as Address,
    WonkaBar: "0x2E2Ed0Cfd3AD2f1d34481277b3204d807Ca2F8c2" as Address,
    VRFManager: "0xD8a5a9b31c3C0232E196d518E89Fd8bF83AcAd43" as Address,
    MeltyTimelock: "0xDC11f7E700A4c898AE5CAddB1082cFfa76512aDD" as Address,
    MeltyFiProtocol: "0x51A1ceB83B83F1985a81C295d1fF28Afef186E02" as Address,
    MeltyDAO: "0x36b58F5C1969B7b6591D752ea6F5486D069010AB" as Address,
  },
  // Add other networks as needed
  sepolia: {
    // ... addresses
  },
} as const;

// Export ABIs (import from typechain-types or hardhat deployments)
export { MeltyFiProtocol__factory } from "../../hardhat/typechain-types";
```

### 1.3 Type Definitions 🚧

**Next Step**: Create type files

```typescript
// types/lottery.ts
export interface Lottery {
  id: number;
  owner: Address;
  nftContract: Address;
  nftTokenId: bigint;
  wonkaBarPrice: bigint;
  wonkaBarsMaxSupply: number;
  wonkaBarsSold: number;
  totalRaised: bigint;
  state: LotteryState;
  createdAt: Date;
  expirationDate: Date;
  winner?: Address;
  nftName: string;
  nftImageUrl: string;
}

// types/nft.ts
export interface NFT {
  contract: Address;
  tokenId: bigint;
  name: string;
  description?: string;
  image: string;
  owner: Address;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}
```

---

## Phase 2: Custom Hooks

### 2.1 Protocol Reading Hooks

```typescript
// hooks/meltyfi/useLotteries.ts
import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

export function useLotteries() {
  const { data: activeLotteriesIds } = useReadContract({
    address: CONTRACTS.localhost.MeltyFiProtocol,
    abi: MeltyFiProtocolABI,
    functionName: "getActiveLotteries",
  });

  // Fetch details for each lottery
  // ...

  return { lotteries, isLoading, error };
}
```

### 2.2 Protocol Writing Hooks

```typescript
// hooks/meltyfi/useBuyWonkaBars.ts
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

export function useBuyWonkaBars() {
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading } = useWaitForTransactionReceipt({ hash });

  const buyWonkaBars = async (lotteryId: number, amount: number, value: bigint) => {
    writeContract({
      address: CONTRACTS.localhost.MeltyFiProtocol,
      abi: MeltyFiProtocolABI,
      functionName: "buyWonkaBars",
      args: [lotteryId, amount],
      value,
    });
  };

  return { buyWonkaBars, isLoading, hash };
}
```

---

## Phase 3: UI Components

### 3.1 shadcn/ui Base Components

Install shadcn/ui CLI and add components:

```bash
# From packages/nextjs directory
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add card
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add select
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add toast
```

### 3.2 MeltyFi Components

Create custom components in `components/meltyfi/`:

**LotteryCard.tsx** - Display lottery summary
**LotteryDetails.tsx** - Full lottery information
**BuyWonkaBarsDialog.tsx** - Purchase modal
**CreateLotteryForm.tsx** - Multi-step lottery creation

---

## Phase 4: Pages

### 4.1 Home Page (`app/page.tsx`)

**Features**:
- Hero section with CTA
- Protocol statistics
- How it works section
- Featured lotteries carousel
- Tokenomics overview

### 4.2 Browse Lotteries (`app/lotteries/page.tsx`)

**Features**:
- Filter sidebar (state, price range, collections)
- Sort options (newest, ending soon, price, popularity)
- Lottery grid with cards
- Pagination/infinite scroll

### 4.3 Lottery Details (`app/lotteries/[id]/page.tsx`)

**Features**:
- NFT display with metadata
- Lottery information & stats
- Progress bar & countdown
- Buy WonkaBars interface
- Participants list
- Activity feed

### 4.4 Create Lottery (`app/create/page.tsx`)

**Features**:
- Multi-step form (NFT selection → Parameters → Confirm)
- NFT gallery from user wallet
- Parameter inputs with validation
- Transaction flow with approval

### 4.5 Profile Page (`app/profile/page.tsx`)

**Features**:
- User statistics overview
- Active lotteries owned
- WonkaBars held
- Participation history
- ChocoChip balance

### 4.6 Governance Page (`app/governance/page.tsx`)

**Features**:
- Active proposals list
- Voting interface
- Delegation management
- Proposal creation (for eligible users)

---

## Phase 5: Integration & Testing

### 5.1 Contract Integration

1. Import ABIs from typechain-types
2. Configure wagmi with correct chain and contracts
3. Test all read/write operations

### 5.2 Real-time Updates

Implement polling or WebSocket for:
- Active lotteries list (15s interval)
- Lottery details (10s interval)
- User stats (30s interval)

### 5.3 Error Handling

- Transaction rejection handling
- Network errors
- User-friendly error messages
- Toast notifications

### 5.4 Loading States

- Skeleton loaders
- Transaction pending states
- Page loading states

---

## Implementation Checklist

### Core Infrastructure
- [x] Install dependencies
- [x] Create `lib/utils.ts`
- [x] Create `lib/constants.ts`
- [ ] Create `lib/contracts.ts` with ABIs
- [ ] Create type definitions
- [ ] Configure wagmi providers

### Custom Hooks
- [ ] `useLotteries()` - Query active lotteries
- [ ] `useLottery(id)` - Query single lottery
- [ ] `useCreateLottery()` - Create lottery mutation
- [ ] `useBuyWonkaBars()` - Buy WonkaBars mutation
- [ ] `useRepayLoan()` - Repay loan mutation
- [ ] `useChocoChip()` - Token balance & stats
- [ ] `useWonkaBar()` - Token balance by lottery
- [ ] `useUserNFTs()` - Fetch user's NFTs

### UI Components (shadcn/ui)
- [ ] Button
- [ ] Dialog
- [ ] Card
- [ ] Tabs
- [ ] Progress
- [ ] Select
- [ ] Input
- [ ] Label
- [ ] Toast/Sonner

### MeltyFi Components
- [ ] LotteryCard
- [ ] LotteryDetails
- [ ] LotteryGrid
- [ ] LotteryFilters
- [ ] BuyWonkaBarsDialog
- [ ] RepayLoanDialog
- [ ] CreateLotteryForm (multi-step)
- [ ] NFTCard
- [ ] NFTGallery
- [ ] NFTSelector
- [ ] ProtocolStats
- [ ] UserStats
- [ ] CountdownTimer

### Pages
- [ ] Home page (`/`)
- [ ] Browse lotteries (`/lotteries`)
- [ ] Lottery details (`/lotteries/[id]`)
- [ ] Create lottery (`/create`)
- [ ] Profile (`/profile`)
- [ ] Governance (`/governance`)

### Polish
- [ ] Responsive design (mobile-first)
- [ ] Dark mode support
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] SEO optimization
- [ ] Accessibility (WCAG 2.1 AA)

---

## Next Steps

1. **Complete Contract Integration**:
   - Create `lib/contracts.ts` with all ABIs
   - Set up wagmi configuration
   - Test basic read/write operations

2. **Build Core Hooks**:
   - Start with read hooks (`useLotteries`, `useLottery`)
   - Then write hooks (`useBuyWonkaBars`, `useCreateLottery`)
   - Test with deployed localhost contracts

3. **UI Components**:
   - Initialize shadcn/ui
   - Create base components
   - Build MeltyFi-specific components

4. **Pages**:
   - Start with simple pages (Home, Browse)
   - Then complex pages (Details, Create)
   - Finally specialized pages (Profile, Governance)

5. **Testing & Polish**:
   - Integration testing with contracts
   - Responsive design
   - Error handling
   - Performance optimization

---

## Resources

- **Backend Contracts**: `packages/hardhat/contracts/`
- **Type Definitions**: `packages/hardhat/typechain-types/`
- **Deployment Info**: `packages/hardhat/deployments/localhost/meltyfi.json`
- **Requirements**: `MELTYFI_REQUIREMENTS.md` Section 4
- **Backend Tag**: `v1.0.0-evm-backend`

---

## Estimated Time

- **Phase 1 (Infrastructure)**: 2-4 hours
- **Phase 2 (Hooks)**: 4-6 hours
- **Phase 3 (Components)**: 8-12 hours
- **Phase 4 (Pages)**: 12-16 hours
- **Phase 5 (Polish & Testing)**: 6-8 hours

**Total**: 32-46 hours for complete frontend implementation

---

## Notes

This implementation follows the architecture specified in `MELTYFI_REQUIREMENTS.md` and integrates with the completed backend contracts (v1.0.0-evm-backend). The frontend uses modern best practices with Next.js 15, wagmi v2, and shadcn/ui for a production-ready DApp.
