# MeltyFi Protocol - Complete EVM Implementation Requirements Document

**Version:** 1.0
**Date:** November 8, 2025
**Target Blockchain:** XRP EVM (or compatible EVM blockchain)
**Project Type:** DeFi NFT Liquidity Protocol

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Protocol Overview](#2-protocol-overview)
3. [Smart Contract Requirements](#3-smart-contract-requirements)
4. [Frontend Requirements](#4-frontend-requirements)
5. [Technical Architecture](#5-technical-architecture)
6. [Security Requirements](#6-security-requirements)
7. [Testing Requirements](#7-testing-requirements)
8. [Deployment Requirements](#8-deployment-requirements)
9. [Integration Requirements](#9-integration-requirements)
10. [Performance Requirements](#10-performance-requirements)
11. [User Experience Requirements](#11-user-experience-requirements)
12. [Future Enhancements](#12-future-enhancements)

---

## 1. Executive Summary

### 1.1 Project Vision

**MeltyFi** is a revolutionary DeFi protocol that solves the NFT liquidity problem by enabling NFT holders to unlock instant liquidity without selling their assets. The protocol uses innovative lottery-based mechanics inspired by "Willy Wonka's Chocolate Factory" to create a win-win ecosystem where:

- **NFT Owners** receive instant liquidity (95% of potential proceeds) while retaining the option to reclaim their NFT
- **Lenders/Participants** purchase lottery tickets (WonkaBars) for a chance to win valuable NFTs at a fraction of their value
- **All Participants** earn governance tokens (ChocoChips) regardless of outcome

### 1.2 Core Value Propositions

| Stakeholder | Key Benefits |
|-------------|--------------|
| **NFT Owners** | • Instant 95% liquidity without selling<br>• No liquidation risk<br>• No interest rates<br>• Flexible repayment option |
| **Participants** | • Chance to win NFTs at discount<br>• Guaranteed ChocoChip rewards<br>• Lower entry cost vs. marketplace<br>• Gamified engagement |
| **Protocol** | • 5% fee on all transactions<br>• Self-sustaining tokenomics<br>• Network effects through NFT variety |

### 1.3 Implementation Goals

This requirements document defines a **complete, production-ready EVM implementation** that:

1. **Improves upon the deprecated Ethereum implementation** by fixing identified security issues
2. **Adopts best practices from the Sui implementation** including modern frontend architecture
3. **Adds new features** including upgradeability, enhanced governance, and better UX
4. **Ensures security** through comprehensive testing, audits, and safe patterns
5. **Optimizes for XRP EVM** or other target EVM-compatible blockchain

---

## 2. Protocol Overview

### 2.1 Core Mechanism

```
┌─────────────────────────────────────────────────────────────┐
│                    MeltyFi Protocol Flow                     │
└─────────────────────────────────────────────────────────────┘

Step 1: NFT Owner Creates Lottery
   ↓
   • Deposits NFT as collateral
   • Sets WonkaBar parameters (price, max supply, duration)
   • Receives instant 95% payout of max potential

Step 2: Participants Purchase WonkaBars
   ↓
   • Buy lottery tickets (WonkaBars)
   • Payment split: 95% → NFT owner, 5% → Protocol treasury
   • Receive WonkaBar ERC-1155 tokens
   • Earn ChocoChip rewards (1000 CHOC per 1 ETH spent)

Step 3: Two Possible Outcomes
   ↓
   ┌──────────────────┐              ┌─────────────────────┐
   │ A: Owner Repays  │              │ B: Lottery Expires  │
   │    Loan Early    │              │   & Concludes       │
   └──────────────────┘              └─────────────────────┘
          ↓                                   ↓
   • Pays 100% raised         • Random winner selected
   • Gets NFT back            • Winner gets NFT
   • Lottery cancelled        • All get ChocoChips
   • Participants refunded    • Non-winners consolation
```

### 2.2 State Machine

```
Lottery States:

   ┌─────────┐
   │ ACTIVE  │ ← Initial state after creation
   └─────────┘
      ↓   ↓  ↓
      │   │  └─────────────────┐
      │   │                    │
      │   └──────┐             │
      ↓          ↓             ↓
┌──────────┐  ┌───────────┐  ┌─────────┐
│CANCELLED │  │ CONCLUDED │  │ TRASHED │
│(Repaid)  │  │ (Expired) │  │ (No sale)│
└──────────┘  └───────────┘  └─────────┘
```

**State Definitions:**

- **ACTIVE (0)**: Lottery accepting WonkaBar purchases, not yet expired
- **CANCELLED (1)**: Owner repaid loan, NFT returned, participants get refunds
- **CONCLUDED (2)**: Lottery expired/sold out, winner drawn, prizes distributed
- **TRASHED (3)**: No WonkaBars sold, NFT returned to owner

### 2.3 Economic Model

#### Fee Structure

| Transaction Type | Fee Recipient | Amount | Notes |
|------------------|---------------|--------|-------|
| WonkaBar Purchase | NFT Owner | 95% | Immediate payout |
| WonkaBar Purchase | Protocol DAO | 5% | Treasury funding |
| Loan Repayment | Protocol | 5% premium | Owner pays 100%, received 95% initially |

#### Token Economics

**ChocoChip (CHOC) Governance Token:**
- **Issuance Rate**: 1000 CHOC per 1 ETH spent on WonkaBars
- **Max Supply**: 1,000,000,000 CHOC (1 billion)
- **Decimals**: 18 (standard ERC-20)
- **Distribution**:
  - 60% - Community Rewards (via protocol participation)
  - 20% - Team & Development
  - 15% - Ecosystem Growth Fund
  - 5% - Protocol Treasury Reserve

**Token Utility:**
- Governance voting power
- Proposal creation (threshold-based)
- Future staking rewards
- Fee discounts (future enhancement)
- Protocol parameter adjustments

### 2.4 Key Parameters

| Parameter | Value | Rationale | Adjustable? |
|-----------|-------|-----------|-------------|
| Protocol Fee | 5% | Sustainable revenue without burden | Yes (DAO) |
| Owner Immediate Payout | 95% | Attracts borrowers | No (hardcoded) |
| Max WonkaBars per Lottery | 100 | Prevents dilution | Yes (DAO) |
| Min WonkaBars per Lottery | 5 | Ensures minimum liquidity | Yes (DAO) |
| Max Balance per User | 25% | Prevents centralization | Yes (DAO) |
| ChocoChips per ETH | 1000 | Incentivizes participation | Yes (DAO) |
| Voting Delay | 1 block | Quick governance | Yes (DAO) |
| Voting Period | 50,400 blocks (~7 days) | Adequate participation time | Yes (DAO) |
| Quorum | 4% of voting power | Achievable threshold | Yes (DAO) |

---

## 3. Smart Contract Requirements

### 3.1 Contract Architecture

#### 3.1.1 Core Contracts

```
MeltyFi Smart Contract Ecosystem

┌──────────────────────────────────────────────────────────────┐
│                      MeltyFiProtocol                          │
│  (Main contract - Lottery logic, UUPS Upgradeable)           │
│                                                               │
│  • createLottery()                                           │
│  • buyWonkaBars()                                            │
│  • repayLoan()                                               │
│  • drawWinner()                                              │
│  • meltWonkaBars()                                           │
│  • cancelLottery()                                           │
└──────────────────────────────────────────────────────────────┘
        │              │              │              │
        ├──────────────┼──────────────┼──────────────┤
        ↓              ↓              ↓              ↓
┌─────────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────┐
│  ChocoChip  │ │ WonkaBar   │ │ MeltyDAO │ │  VRFManager  │
│ (ERC-20)    │ │ (ERC-1155) │ │ (Governor)│ │ (Chainlink)  │
└─────────────┘ └────────────┘ └──────────┘ └──────────────┘
                                     │
                                     ↓
                          ┌────────────────────┐
                          │ TimelockController │
                          │  (48hr delay)      │
                          └────────────────────┘
```

#### 3.1.2 Contract Specifications

**Contract 1: MeltyFiProtocol.sol**

**Purpose**: Main protocol logic managing lottery lifecycle

**Requirements**:

1. **Inheritance**:
   - `UUPSUpgradeable` - Upgradeable proxy pattern
   - `OwnableUpgradeable` - Access control
   - `PausableUpgradeable` - Emergency stop
   - `ReentrancyGuardUpgradeable` - Reentrancy protection
   - `ERC1155HolderUpgradeable` - Receive WonkaBar tokens

2. **State Variables**:
```solidity
// Immutable references (set in initializer)
ChocoChip public chocoChipToken;
WonkaBar public wonkaBarToken;
MeltyDAO public daoContract;
VRFManager public vrfManager;

// Protocol parameters (DAO-adjustable)
uint256 public protocolFeePercentage; // Default: 5% (500 bps)
uint256 public maxWonkaBarsPerLottery; // Default: 100
uint256 public minWonkaBarsPerLottery; // Default: 5
uint256 public maxBalancePercentage; // Default: 25%
uint256 public chocoChipsPerEther; // Default: 1000

// State tracking
uint256 public totalLotteriesCreated;
uint256 public totalValueLocked; // TVL tracking
mapping(uint256 => Lottery) public lotteries;
mapping(address => EnumerableSet.UintSet) private ownerLotteries;
mapping(address => EnumerableSet.UintSet) private participantLotteries;
mapping(uint256 => EnumerableSet.AddressSet) private lotteryParticipants;
EnumerableSet.UintSet private activeLotteryIds;
```

3. **Lottery Struct**:
```solidity
struct Lottery {
    uint256 id;
    address owner;
    address nftContract;
    uint256 nftTokenId;
    LotteryState state;
    uint256 createdAt;
    uint256 expirationDate;
    uint256 wonkaBarPrice; // in wei
    uint256 wonkaBarsMaxSupply;
    uint256 wonkaBarsSold;
    uint256 totalRaised;
    address winner;
    uint256 vrfRequestId;
    // NFT metadata caching
    string nftName;
    string nftDescription;
    string nftImageUrl;
}

enum LotteryState {
    ACTIVE,      // 0
    CANCELLED,   // 1
    CONCLUDED,   // 2
    TRASHED      // 3
}
```

4. **Key Functions**:

**a) createLottery**
```solidity
/**
 * @notice Create new lottery with NFT collateral
 * @param nftContract Address of ERC-721 NFT contract
 * @param nftTokenId Token ID of NFT
 * @param wonkaBarPrice Price per WonkaBar in wei
 * @param wonkaBarsMaxSupply Total WonkaBars available (5-100)
 * @param durationInDays Lottery duration in days
 * @return lotteryId The created lottery ID
 *
 * Requirements:
 * - Caller must own the NFT
 * - NFT contract must be approved
 * - wonkaBarsMaxSupply must be between min and max
 * - duration must be reasonable (1-90 days)
 *
 * Effects:
 * - Transfers NFT to contract
 * - Creates Lottery struct
 * - Emits LotteryCreated event
 */
function createLottery(
    address nftContract,
    uint256 nftTokenId,
    uint256 wonkaBarPrice,
    uint256 wonkaBarsMaxSupply,
    uint256 durationInDays
) external whenNotPaused nonReentrant returns (uint256 lotteryId);
```

**b) buyWonkaBars**
```solidity
/**
 * @notice Purchase WonkaBar lottery tickets
 * @param lotteryId ID of target lottery
 * @param amount Number of WonkaBars to purchase
 *
 * Requirements:
 * - Lottery must be ACTIVE
 * - Not expired
 * - Sufficient supply available
 * - Buyer doesn't exceed maxBalancePercentage
 * - msg.value == amount * wonkaBarPrice
 *
 * Effects:
 * - Transfers 95% ETH to NFT owner
 * - Transfers 5% ETH to DAO treasury
 * - Mints WonkaBar tokens to buyer
 * - Mints ChocoChip rewards to buyer
 * - Updates lottery state
 * - Emits WonkaBarsPurchased event
 */
function buyWonkaBars(uint256 lotteryId, uint256 amount)
    external
    payable
    whenNotPaused
    nonReentrant;
```

**c) repayLoan**
```solidity
/**
 * @notice Repay loan early to reclaim NFT
 * @param lotteryId ID of lottery to repay
 *
 * Requirements:
 * - Caller must be lottery owner
 * - Lottery must be ACTIVE
 * - msg.value == totalRaised (100% of funds raised)
 *
 * Effects:
 * - Transfers NFT back to owner
 * - Sets state to CANCELLED
 * - Holds funds for participant refunds
 * - Mints ChocoChips to owner as reward
 * - Emits LoanRepaid event
 */
function repayLoan(uint256 lotteryId)
    external
    payable
    whenNotPaused
    nonReentrant;
```

**d) drawWinner**
```solidity
/**
 * @notice Conclude lottery and draw winner via VRF
 * @param lotteryId ID of lottery to conclude
 *
 * Requirements:
 * - Lottery must be ACTIVE
 * - Must be expired OR sold out
 *
 * Effects:
 * - If no sales: return NFT, set TRASHED
 * - If sales: request VRF randomness
 * - VRF callback selects winner proportionally
 * - Sets state to CONCLUDED
 * - Emits LotteryResolved event
 */
function drawWinner(uint256 lotteryId) external whenNotPaused;
```

**e) meltWonkaBars**
```solidity
/**
 * @notice Claim rewards by melting WonkaBar tokens
 * @param lotteryId ID of lottery
 * @param amount Number of WonkaBars to melt
 *
 * Requirements:
 * - Caller must own WonkaBar tokens
 * - Lottery must be CANCELLED or CONCLUDED
 *
 * Effects:
 * - Burns WonkaBar tokens
 * - If CANCELLED: refund ETH + mint ChocoChips
 * - If CONCLUDED + winner: transfer NFT + mint ChocoChips
 * - If CONCLUDED + non-winner: mint ChocoChips only
 * - Emits WonkaBarsMelted event
 */
function meltWonkaBars(uint256 lotteryId, uint256 amount)
    external
    nonReentrant;
```

5. **View Functions**:
```solidity
function getLottery(uint256 lotteryId) external view returns (Lottery memory);
function getActiveLotteries() external view returns (uint256[] memory);
function getUserLotteries(address user) external view returns (uint256[] memory);
function getUserParticipations(address user) external view returns (uint256[] memory);
function getLotteryParticipants(uint256 lotteryId) external view returns (address[] memory);
function calculateWinProbability(address user, uint256 lotteryId) external view returns (uint256);
function getProtocolStats() external view returns (
    uint256 totalLotteries,
    uint256 activeLotteries,
    uint256 totalValueLocked,
    uint256 totalFeesCollected
);
```

6. **Admin Functions** (DAO-controlled):
```solidity
function setProtocolFee(uint256 newFee) external onlyOwner;
function setMaxWonkaBars(uint256 newMax) external onlyOwner;
function setMinWonkaBars(uint256 newMin) external onlyOwner;
function setMaxBalancePercentage(uint256 newPercentage) external onlyOwner;
function setChocoChipsPerEther(uint256 newRate) external onlyOwner;
function pause() external onlyOwner;
function unpause() external onlyOwner;
function _authorizeUpgrade(address newImplementation) internal override onlyOwner;
```

7. **Events**:
```solidity
event LotteryCreated(
    uint256 indexed lotteryId,
    address indexed owner,
    address nftContract,
    uint256 nftTokenId,
    uint256 wonkaBarPrice,
    uint256 maxSupply,
    uint256 expirationDate
);

event WonkaBarsPurchased(
    uint256 indexed lotteryId,
    address indexed buyer,
    uint256 amount,
    uint256 totalCost,
    uint256 chocoChipsEarned
);

event LotteryResolved(
    uint256 indexed lotteryId,
    address indexed winner,
    LotteryState finalState
);

event LoanRepaid(
    uint256 indexed lotteryId,
    address indexed owner,
    uint256 amountRepaid
);

event WonkaBarsMelted(
    uint256 indexed lotteryId,
    address indexed user,
    uint256 amount,
    uint256 ethRefunded,
    uint256 chocoChipsEarned,
    bool wonNFT
);

event ProtocolParameterUpdated(
    string parameter,
    uint256 oldValue,
    uint256 newValue
);
```

8. **Security Requirements**:
   - ✅ Verify NFT ownership before createLottery (FIX from deprecated version)
   - ✅ Use SafeERC20 for token transfers
   - ✅ Reentrancy guards on all payable functions
   - ✅ Pausable for emergency stops
   - ✅ Pull payment pattern for refunds
   - ✅ Check-Effects-Interactions pattern
   - ✅ Input validation on all parameters
   - ✅ Overflow/underflow protection (Solidity 0.8+)

---

**Contract 2: ChocoChip.sol**

**Purpose**: ERC-20 governance token with voting capabilities

**Requirements**:

1. **Inheritance**:
   - `ERC20Upgradeable`
   - `ERC20BurnableUpgradeable` - Allow token burning
   - `ERC20SnapshotUpgradeable` - Snapshot for voting
   - `ERC20PermitUpgradeable` - Gasless approvals
   - `ERC20VotesUpgradeable` - Voting power tracking
   - `OwnableUpgradeable`
   - `UUPSUpgradeable`

2. **Token Parameters**:
```solidity
string public constant NAME = "ChocoChip";
string public constant SYMBOL = "CHOC";
uint8 public constant DECIMALS = 18;
uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion
```

3. **State Variables**:
```solidity
uint256 public totalMinted;
mapping(address => bool) public authorizedMinters;
```

4. **Key Functions**:
```solidity
/**
 * @notice Mint ChocoChip tokens (only authorized minters)
 * @param to Recipient address
 * @param amount Amount to mint
 */
function mint(address to, uint256 amount) external onlyAuthorizedMinter {
    require(totalMinted + amount <= MAX_SUPPLY, "Max supply exceeded");
    totalMinted += amount;
    _mint(to, amount);
}

/**
 * @notice Authorize minter (only owner)
 */
function authorizeMinter(address minter) external onlyOwner {
    authorizedMinters[minter] = true;
}

/**
 * @notice Revoke minter authorization (only owner)
 */
function revokeMinter(address minter) external onlyOwner {
    authorizedMinters[minter] = false;
}

/**
 * @notice Create snapshot for voting (only owner/DAO)
 */
function snapshot() external onlyOwner returns (uint256) {
    return _snapshot();
}
```

5. **Modifiers**:
```solidity
modifier onlyAuthorizedMinter() {
    require(authorizedMinters[msg.sender], "Not authorized minter");
    _;
}
```

---

**Contract 3: WonkaBar.sol**

**Purpose**: ERC-1155 multi-token for lottery tickets

**Requirements**:

1. **Inheritance**:
   - `ERC1155Upgradeable`
   - `ERC1155BurnableUpgradeable`
   - `ERC1155SupplyUpgradeable`
   - `OwnableUpgradeable`
   - `UUPSUpgradeable`

2. **Token ID Scheme**:
   - Each lottery ID == token ID
   - Fungible tickets per lottery
   - Cross-lottery tickets non-fungible

3. **Key Functions**:
```solidity
/**
 * @notice Mint WonkaBar tokens (only MeltyFiProtocol)
 * @param to Recipient
 * @param lotteryId Lottery/Token ID
 * @param amount Number of tickets
 */
function mint(address to, uint256 lotteryId, uint256 amount)
    external
    onlyMeltyFiProtocol;

/**
 * @notice Burn WonkaBar tokens (only MeltyFiProtocol)
 */
function burn(address from, uint256 lotteryId, uint256 amount)
    external
    onlyMeltyFiProtocol;

/**
 * @notice Set metadata URI for lottery (only MeltyFiProtocol)
 */
function setURI(uint256 lotteryId, string memory newuri)
    external
    onlyMeltyFiProtocol;
```

4. **Metadata**:
   - Dynamic metadata based on lottery state
   - JSON format with NFT image, lottery details
   - On-chain or IPFS storage

---

**Contract 4: VRFManager.sol**

**Purpose**: Chainlink VRF v2.5 integration for randomness

**Requirements**:

1. **Inheritance**:
   - `VRFConsumerBaseV2Plus` (Chainlink)
   - `OwnableUpgradeable`

2. **VRF Configuration**:
```solidity
struct VRFConfig {
    bytes32 keyHash;           // Gas lane
    uint256 subscriptionId;    // Chainlink subscription
    uint32 callbackGasLimit;   // 200,000 gas
    uint16 requestConfirmations; // 3 blocks
    uint32 numWords;           // 1 random word
}
```

3. **Key Functions**:
```solidity
/**
 * @notice Request random words (only MeltyFiProtocol)
 * @return requestId VRF request ID
 */
function requestRandomWords() external onlyMeltyFiProtocol returns (uint256 requestId);

/**
 * @notice Callback from Chainlink VRF
 * @param requestId VRF request ID
 * @param randomWords Array of random numbers
 */
function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
    internal
    override;

/**
 * @notice Get request status
 */
function getRequestStatus(uint256 requestId)
    external
    view
    returns (bool fulfilled, uint256[] memory randomWords);
```

4. **Improvements over deprecated version**:
   - ✅ Store requestId → lotteryId mapping
   - ✅ Process winner in fulfillRandomWords callback (async)
   - ✅ Emit events for tracking
   - ✅ Handle VRF failures gracefully

---

**Contract 5: MeltyDAO.sol**

**Purpose**: OpenZeppelin Governor for protocol governance

**Requirements**:

1. **Inheritance**:
   - `GovernorUpgradeable`
   - `GovernorSettingsUpgradeable`
   - `GovernorCountingSimpleUpgradeable`
   - `GovernorVotesUpgradeable`
   - `GovernorVotesQuorumFractionUpgradeable`
   - `GovernorTimelockControlUpgradeable`

2. **Governance Parameters**:
```solidity
uint256 public constant VOTING_DELAY = 1; // 1 block
uint256 public constant VOTING_PERIOD = 50_400; // ~7 days
uint256 public constant PROPOSAL_THRESHOLD = 100_000 * 10**18; // 100k CHOC
uint256 public constant QUORUM_PERCENTAGE = 4; // 4% of supply
```

3. **Timelock**:
   - 48-hour delay for execution
   - Multi-sig proposer/executor roles
   - Emergency cancellation

4. **Governable Parameters**:
   - Protocol fee percentage
   - Max/min WonkaBars per lottery
   - Max balance percentage
   - ChocoChip issuance rate
   - Contract upgrades

---

**Contract 6: TimelockController.sol**

**Purpose**: Time-delayed execution for governance

**Requirements**:

1. Use OpenZeppelin `TimelockControllerUpgradeable`
2. Minimum delay: 48 hours
3. Roles:
   - PROPOSER_ROLE: MeltyDAO contract
   - EXECUTOR_ROLE: MeltyDAO contract + multi-sig
   - CANCELLER_ROLE: Multi-sig (emergency)
   - ADMIN_ROLE: Timelock itself (renounce after setup)

---

### 3.2 Security Requirements

#### 3.2.1 Critical Fixes from Deprecated Version

| Issue | Fix Required | Priority |
|-------|--------------|----------|
| Missing NFT ownership verification | Add `require(IERC721(nftContract).ownerOf(nftTokenId) == msg.sender)` | **CRITICAL** |
| Synchronous VRF calls | Use async callback pattern with requestId mapping | **HIGH** |
| No pause mechanism | Implement Pausable across all contracts | **HIGH** |
| Immutable parameters | Make parameters DAO-adjustable | **MEDIUM** |
| Limited event emission | Add comprehensive events for indexing | **MEDIUM** |

#### 3.2.2 Security Best Practices

**Required Patterns**:

1. **Checks-Effects-Interactions**:
```solidity
// ✅ GOOD
function buyWonkaBars(uint256 lotteryId, uint256 amount) external payable {
    // Checks
    require(lottery.state == LotteryState.ACTIVE, "Not active");
    require(block.timestamp < lottery.expirationDate, "Expired");

    // Effects
    lottery.wonkaBarsSold += amount;
    lottery.totalRaised += msg.value;

    // Interactions
    payable(lottery.owner).transfer(ownerAmount);
    payable(daoTreasury).transfer(feeAmount);
    wonkaBarToken.mint(msg.sender, lotteryId, amount);
}
```

2. **Pull Payment Pattern** for refunds:
```solidity
mapping(address => mapping(uint256 => uint256)) public refundsAvailable;

function meltWonkaBars(uint256 lotteryId, uint256 amount) external {
    uint256 refund = calculateRefund(lotteryId, amount);
    refundsAvailable[msg.sender][lotteryId] += refund;
    // ... other logic
}

function withdrawRefund(uint256 lotteryId) external nonReentrant {
    uint256 refund = refundsAvailable[msg.sender][lotteryId];
    require(refund > 0, "No refund available");
    refundsAvailable[msg.sender][lotteryId] = 0;
    payable(msg.sender).transfer(refund);
}
```

3. **SafeERC20** for all token transfers
4. **ReentrancyGuard** on all payable functions
5. **Input validation** on all parameters

#### 3.2.3 Access Control

| Function | Access | Rationale |
|----------|--------|-----------|
| createLottery | Anyone | Public protocol |
| buyWonkaBars | Anyone | Public protocol |
| repayLoan | Lottery owner only | Ownership verification |
| drawWinner | Anyone (after expiry) | Decentralized execution |
| meltWonkaBars | WonkaBar holders | Token ownership |
| pause/unpause | Owner/DAO | Emergency control |
| setProtocolFee | DAO only | Governance |
| upgradeContract | DAO + Timelock | Security |

#### 3.2.4 Audit Requirements

**Pre-Deployment**:
1. Internal security review
2. Professional smart contract audit (e.g., OpenZeppelin, Trail of Bits, Consensys Diligence)
3. Public bug bounty program
4. Testnet deployment with red team testing

**Audit Focus Areas**:
- Reentrancy vulnerabilities
- Integer overflow/underflow (verify 0.8+ protections)
- Access control bypass
- VRF manipulation
- Front-running attacks
- Gas optimization
- Upgrade safety

---

### 3.3 Testing Requirements

#### 3.3.1 Unit Tests

**Coverage Target**: 100% line coverage, 95%+ branch coverage

**Test Categories**:

1. **Lottery Creation Tests**:
```javascript
describe("createLottery", () => {
  it("should create lottery with valid NFT");
  it("should reject if caller doesn't own NFT");
  it("should reject if supply > maxWonkaBars");
  it("should reject if supply < minWonkaBars");
  it("should reject if duration > 90 days");
  it("should transfer NFT to contract");
  it("should emit LotteryCreated event");
  it("should increment totalLotteriesCreated");
});
```

2. **WonkaBar Purchase Tests**:
```javascript
describe("buyWonkaBars", () => {
  it("should purchase WonkaBars with valid payment");
  it("should reject if lottery expired");
  it("should reject if insufficient ETH sent");
  it("should reject if exceeds max balance");
  it("should split payment 95/5");
  it("should mint WonkaBar tokens");
  it("should mint ChocoChip rewards");
  it("should update lottery state");
  it("should emit WonkaBarsPurchased event");
});
```

3. **Loan Repayment Tests**:
```javascript
describe("repayLoan", () => {
  it("should repay loan and return NFT");
  it("should reject if not lottery owner");
  it("should reject if incorrect repayment amount");
  it("should set state to CANCELLED");
  it("should hold funds for refunds");
  it("should mint ChocoChips to owner");
  it("should emit LoanRepaid event");
});
```

4. **Winner Drawing Tests**:
```javascript
describe("drawWinner", () => {
  it("should draw winner after expiration");
  it("should request VRF randomness");
  it("should select winner proportionally");
  it("should set state to CONCLUDED");
  it("should handle case with no sales (TRASHED)");
  it("should emit LotteryResolved event");
});
```

5. **Melting Tests**:
```javascript
describe("meltWonkaBars", () => {
  it("should melt WonkaBars for winner (NFT + CHOC)");
  it("should melt WonkaBars for non-winner (CHOC only)");
  it("should melt WonkaBars for CANCELLED lottery (refund + CHOC)");
  it("should burn WonkaBar tokens");
  it("should reject if lottery still ACTIVE");
  it("should emit WonkaBarsMelted event");
});
```

6. **Edge Cases**:
```javascript
describe("Edge Cases", () => {
  it("should handle lottery with 1 participant");
  it("should handle lottery at max supply (100)");
  it("should handle user at max balance (25%)");
  it("should handle simultaneous purchases");
  it("should handle repayment with 0 sales");
  it("should handle VRF callback failure");
});
```

#### 3.3.2 Integration Tests

1. **Full Workflow Tests**:
   - Create → Buy → Repay flow
   - Create → Buy → Expire → Draw → Melt flow
   - Create → No sales → Trash flow

2. **Multi-User Tests**:
   - Multiple participants in same lottery
   - User participating in multiple lotteries
   - Concurrent lottery creation

3. **Governance Tests**:
   - Proposal creation and voting
   - Parameter updates via governance
   - Timelock execution
   - Emergency pause/unpause

#### 3.3.3 Gas Optimization Tests

**Gas Benchmarks**:

| Function | Target Gas | Notes |
|----------|------------|-------|
| createLottery | < 200,000 | NFT transfer expensive |
| buyWonkaBars (first) | < 150,000 | Includes mints |
| buyWonkaBars (subsequent) | < 100,000 | Fewer state changes |
| repayLoan | < 80,000 | NFT transfer |
| meltWonkaBars | < 120,000 | Burns + transfers |

#### 3.3.4 Fuzzing Tests

Use Echidna or Foundry fuzzing for:
- Random input values
- Random execution orders
- Invariant testing (e.g., "total supply never exceeds max")

---

## 4. Frontend Requirements

### 4.1 Technology Stack

**Required Stack** (based on Sui implementation best practices + Scaffold-ETH 2):

```
Frontend Technology Stack

┌─────────────────────────────────────────────────────────┐
│ Framework: Next.js 15 (App Router)                      │
│ Language: TypeScript 5+                                 │
│ Styling: Tailwind CSS 3+ + shadcn/ui                    │
│ State Management: React Query (TanStack Query)          │
│ Blockchain: wagmi v2 + viem                             │
│ Wallet: RainbowKit / ConnectKit                         │
│ Forms: React Hook Form + Zod                            │
│ Notifications: sonner (toast)                           │
│ Charts: Recharts (for stats)                            │
│ Icons: Lucide React                                     │
└─────────────────────────────────────────────────────────┘
```

**Rationale**:
- **Next.js 15**: Modern React framework, excellent DX, SEO-friendly
- **TypeScript**: Type safety reduces bugs
- **Tailwind + shadcn/ui**: Consistent UI, accessible components
- **React Query**: Perfect for blockchain data fetching/caching
- **wagmi + viem**: Industry-standard EVM tooling, better than ethers.js
- **RainbowKit**: Beautiful wallet connection UX

### 4.2 Architecture

```
frontend/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── page.tsx                      # Home/Landing
│   │   ├── lotteries/
│   │   │   ├── page.tsx                  # Browse lotteries
│   │   │   └── [id]/page.tsx             # Lottery details
│   │   ├── create/page.tsx               # Create lottery
│   │   ├── profile/page.tsx              # User dashboard
│   │   ├── governance/page.tsx           # DAO voting
│   │   ├── analytics/page.tsx            # Protocol stats
│   │   └── layout.tsx                    # Root layout
│   ├── components/
│   │   ├── ui/                           # shadcn components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── lottery/
│   │   │   ├── LotteryCard.tsx
│   │   │   ├── LotteryDetails.tsx
│   │   │   ├── CreateLotteryForm.tsx
│   │   │   ├── BuyWonkaBarsDialog.tsx
│   │   │   ├── RepayLoanDialog.tsx
│   │   │   └── MeltWonkaBarsDialog.tsx
│   │   ├── nft/
│   │   │   ├── NFTCard.tsx
│   │   │   ├── NFTGallery.tsx
│   │   │   └── NFTSelector.tsx
│   │   ├── governance/
│   │   │   ├── ProposalCard.tsx
│   │   │   ├── VotingInterface.tsx
│   │   │   └── DelegateDialog.tsx
│   │   └── wallet/
│   │       ├── WalletButton.tsx
│   │       └── NetworkSwitcher.tsx
│   ├── hooks/
│   │   ├── useMeltyFi.ts                 # Main protocol hook
│   │   ├── useLotteries.ts               # Lottery queries
│   │   ├── useCreateLottery.ts           # Create mutation
│   │   ├── useBuyWonkaBars.ts            # Buy mutation
│   │   ├── useRepayLoan.ts               # Repay mutation
│   │   ├── useMeltWonkaBars.ts           # Melt mutation
│   │   ├── useChocoChip.ts               # Token queries
│   │   ├── useGovernance.ts              # DAO queries
│   │   └── useNFTs.ts                    # NFT metadata
│   ├── lib/
│   │   ├── contracts.ts                  # Contract addresses/ABIs
│   │   ├── utils.ts                      # Helper functions
│   │   ├── constants.ts                  # App constants
│   │   └── wagmi.ts                      # Wagmi configuration
│   ├── types/
│   │   ├── lottery.ts                    # Lottery types
│   │   ├── nft.ts                        # NFT types
│   │   └── governance.ts                 # Governance types
│   └── providers/
│       ├── Web3Provider.tsx              # Wagmi + RainbowKit
│       └── QueryProvider.tsx             # React Query
├── public/
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 4.3 Pages & Features

#### 4.3.1 Home Page (`/`)

**Purpose**: Landing page introducing MeltyFi protocol

**Sections**:

1. **Hero Section**:
   - Catchy headline: "Turn Your NFTs Into Liquid Gold"
   - Subheadline explaining no-liquidation lending
   - CTA buttons: "Create Lottery" + "Browse Lotteries"
   - Protocol stats: Total lotteries, TVL, participants

2. **How It Works**:
   - 3-step visual flow:
     - Step 1: Deposit NFT → Get instant liquidity
     - Step 2: Participants buy lottery tickets
     - Step 3: Repay or let lottery conclude
   - Interactive animations (Framer Motion)

3. **Benefits Section**:
   - Two columns: "For NFT Owners" / "For Participants"
   - Icon + text for each benefit

4. **Featured Lotteries**:
   - Carousel of active lotteries (top 5 by value)
   - "View All" link to /lotteries

5. **Tokenomics**:
   - ChocoChip token utility
   - Governance visualization
   - "Join DAO" CTA

6. **Stats Dashboard**:
   - Total Value Locked (TVL)
   - Total lotteries created
   - Total participants
   - ChocoChips distributed

**Requirements**:
- Responsive design (mobile-first)
- < 3s page load time
- Accessibility (WCAG 2.1 AA)
- SEO optimized (meta tags, schema.org)

#### 4.3.2 Browse Lotteries Page (`/lotteries`)

**Purpose**: Marketplace for discovering and participating in lotteries

**Features**:

1. **Filters & Search**:
   ```tsx
   interface FilterState {
     search: string;              // NFT name/collection
     state: "all" | "active" | "ending-soon" | "sold-out";
     sortBy: "newest" | "ending-soon" | "price-low" | "price-high" | "popularity";
     priceRange: [number, number]; // Min/max WonkaBar price
     collections: string[];        // Filter by NFT collection
   }
   ```

2. **Lottery Grid**:
   - Responsive grid (1-3 columns)
   - LotteryCard component per lottery
   - Infinite scroll / pagination

3. **Lottery Card**:
   ```tsx
   interface LotteryCardProps {
     lottery: Lottery;
     onBuyClick: () => void;
   }

   // Displays:
   // - NFT image with hover zoom
   // - NFT name + collection
   // - State badge (Active/Ending Soon/Sold Out)
   // - Progress bar (sold/max supply)
   // - Price per WonkaBar
   // - Time remaining (countdown)
   // - Participants count
   // - "Buy WonkaBars" button
   // - Owner address (truncated)
   ```

4. **Quick Stats Sidebar**:
   - Total active lotteries
   - Ending soon (< 24h)
   - Average ticket price
   - Most popular collection

**State Management**:
```tsx
const {
  lotteries,
  isLoading,
  error,
  refetch
} = useLotteries({
  state: "active",
  sortBy: "newest",
  limit: 20,
  offset: 0
});
```

**Real-time Updates**:
- Poll every 15 seconds for new lotteries
- WebSocket for live purchase events (optional)
- Optimistic UI updates

#### 4.3.3 Lottery Details Page (`/lotteries/[id]`)

**Purpose**: Detailed view of single lottery

**Sections**:

1. **NFT Display**:
   - Large NFT image/video player
   - Collection name + verified badge
   - NFT attributes/traits (if available)
   - OpenSea/marketplace link

2. **Lottery Information**:
   ```tsx
   interface LotteryInfo {
     id: number;
     owner: string;
     state: LotteryState;
     nftContract: string;
     nftTokenId: number;
     wonkaBarPrice: bigint;
     wonkaBarsMaxSupply: number;
     wonkaBarsSold: number;
     totalRaised: bigint;
     createdAt: Date;
     expirationDate: Date;
     winner?: string;
   }
   ```

3. **Progress & Stats**:
   - Large progress bar (sold/max)
   - Percentage sold
   - Time remaining (countdown)
   - Participants count
   - Win probability calculator

4. **Action Panel**:
   - **If ACTIVE**:
     - Buy WonkaBars form (quantity selector)
     - Total cost calculator
     - ChocoChips reward preview
     - "Buy Now" button
   - **If owner + ACTIVE**:
     - Repay Loan button
     - Amount to repay displayed
   - **If CANCELLED/CONCLUDED**:
     - Melt WonkaBars button (if user has tokens)
     - Claim rewards preview

5. **Participants List**:
   - Table of all participants
   - Address, WonkaBars owned, Win probability
   - User's row highlighted

6. **Activity Feed**:
   - Recent events (purchases, melts)
   - Timeline view

**Requirements**:
- Real-time updates via polling/WebSocket
- Share functionality (Twitter, copy link)
- Transaction history

#### 4.3.4 Create Lottery Page (`/create`)

**Purpose**: Form for creating new lottery

**Workflow**:

```
Step 1: Connect Wallet
   ↓
Step 2: Select NFT from wallet
   ↓
Step 3: Set lottery parameters
   ↓
Step 4: Approve NFT transfer
   ↓
Step 5: Create lottery transaction
   ↓
Step 6: Confirmation & redirect
```

**Form Fields**:

```tsx
interface CreateLotteryForm {
  // Step 1: NFT Selection
  nftContract: string;
  nftTokenId: number;
  // Auto-filled from metadata
  nftName: string;
  nftImageUrl: string;

  // Step 2: Lottery Parameters
  wonkaBarPrice: string;        // in ETH, validates > 0
  wonkaBarsMaxSupply: number;   // 5-100, slider + input
  durationInDays: number;       // 1-90, datepicker
}

// Validation schema (Zod)
const createLotterySchema = z.object({
  nftContract: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  nftTokenId: z.number().int().positive(),
  wonkaBarPrice: z.string().refine(val => parseFloat(val) > 0),
  wonkaBarsMaxSupply: z.number().int().min(5).max(100),
  durationInDays: z.number().int().min(1).max(90)
});
```

**NFT Selection Component**:
```tsx
<NFTGallery>
  {userNFTs.map(nft => (
    <NFTCard
      key={`${nft.contract}-${nft.tokenId}`}
      nft={nft}
      selectable
      selected={selectedNFT?.tokenId === nft.tokenId}
      onClick={() => setSelectedNFT(nft)}
    />
  ))}
</NFTGallery>
```

**Parameter Preview**:
- Max potential payout: `wonkaBarPrice * wonkaBarsMaxSupply * 0.95`
- Estimated duration: `durationInDays` days
- Protocol fee: 5%

**Transaction Flow**:
```tsx
const { mutate: createLottery, isPending } = useCreateLottery();

const onSubmit = async (data: CreateLotteryForm) => {
  // Step 1: Approve NFT
  await approveNFT(data.nftContract, meltyFiAddress);

  // Step 2: Create lottery
  createLottery(data, {
    onSuccess: (lotteryId) => {
      toast.success(`Lottery #${lotteryId} created!`);
      router.push(`/lotteries/${lotteryId}`);
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });
};
```

**Requirements**:
- Multi-step form with progress indicator
- Form persistence (localStorage)
- Transaction status tracking
- Error handling with user-friendly messages

#### 4.3.5 Profile Page (`/profile`)

**Purpose**: User dashboard showing activity and assets

**Tabs**:

1. **Overview Tab**:
   ```tsx
   interface UserStats {
     suiBalance: bigint;
     chocoChipBalance: bigint;
     totalLotteriesCreated: number;
     activeLotteriesOwned: number;
     totalWonkaBarsOwned: number;
     lotteriesWon: number;
     totalValueLocked: bigint;
     totalEarned: bigint;
   }
   ```
   - Cards displaying each stat
   - Recent activity feed

2. **My Lotteries Tab**:
   - List of lotteries created by user
   - State badges (Active/Cancelled/Concluded/Trashed)
   - For each lottery:
     - NFT preview
     - Funds raised
     - Participants count
     - "View Details" / "Repay Loan" buttons

3. **My WonkaBars Tab**:
   - List of lotteries user participated in
   - For each:
     - NFT preview
     - WonkaBars owned
     - Win probability (if active)
     - Potential rewards
     - "Melt WonkaBars" button (if claimable)

4. **ChocoChips Tab**:
   - Balance display
   - Voting power
   - Delegation interface
   - Transaction history
   - "Delegate" / "Vote" buttons

5. **Settings Tab**:
   - Notification preferences
   - Display preferences (theme, currency)
   - Connect/disconnect wallet

**Requirements**:
- Real-time balance updates
- Transaction history with filtering
- Export data (CSV)

#### 4.3.6 Governance Page (`/governance`)

**Purpose**: DAO voting interface

**Sections**:

1. **Active Proposals**:
   ```tsx
   interface Proposal {
     id: number;
     proposer: string;
     title: string;
     description: string;
     forVotes: bigint;
     againstVotes: bigint;
     abstainVotes: bigint;
     state: ProposalState; // Pending/Active/Succeeded/Defeated/Executed
     startBlock: number;
     endBlock: number;
     eta?: Date; // Execution time if queued
   }
   ```
   - Card per proposal
   - Vote buttons (For/Against/Abstain)
   - Vote count display
   - Countdown to voting end

2. **Create Proposal**:
   - Form for creating new proposals
   - Requires PROPOSAL_THRESHOLD CHOC
   - Target contract + function selector
   - Parameters input

3. **Voting History**:
   - Past proposals with outcomes
   - User's voting record

**Requirements**:
- Only accessible with wallet connected
- Display user's voting power
- Show delegation status
- Queue/execute buttons for successful proposals

#### 4.3.7 Analytics Page (`/analytics`)

**Purpose**: Protocol statistics and insights

**Charts** (using Recharts):

1. **TVL Over Time** (Line chart)
2. **Lotteries Created** (Bar chart by week/month)
3. **WonkaBar Sales Volume** (Area chart)
4. **Top Collections** (Bar chart)
5. **Win Rate Distribution** (Pie chart)
6. **ChocoChip Distribution** (Pie chart)

**Key Metrics**:
- All-time TVL
- All-time lotteries
- All-time participants
- Average lottery duration
- Average ticket price
- Protocol fees collected

**Requirements**:
- Data from The Graph indexer (see section 9.2)
- CSV export functionality
- Date range filtering

### 4.4 Component Library

#### 4.4.1 Core Components

**LotteryCard.tsx**:
```tsx
interface LotteryCardProps {
  lottery: Lottery;
  variant?: "compact" | "detailed";
  showActions?: boolean;
  onBuyClick?: () => void;
}

export function LotteryCard({
  lottery,
  variant = "compact",
  showActions = true,
  onBuyClick
}: LotteryCardProps) {
  const timeRemaining = useCountdown(lottery.expirationDate);
  const progressPercent = (lottery.wonkaBarsSold / lottery.wonkaBarsMaxSupply) * 100;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <NFTImage src={lottery.nftImageUrl} alt={lottery.nftName} />
        <StateBadge state={lottery.state} />
      </CardHeader>
      <CardContent>
        <h3>{lottery.nftName}</h3>
        <ProgressBar value={progressPercent} />
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Price" value={formatEther(lottery.wonkaBarPrice)} />
          <Stat label="Sold" value={`${lottery.wonkaBarsSold}/${lottery.wonkaBarsMaxSupply}`} />
          <Stat label="Time Left" value={formatTimeRemaining(timeRemaining)} />
          <Stat label="Participants" value={lottery.participants.length} />
        </div>
      </CardContent>
      {showActions && (
        <CardFooter>
          <Button onClick={onBuyClick} className="w-full">
            Buy WonkaBars
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
```

**BuyWonkaBarsDialog.tsx**:
```tsx
interface BuyWonkaBarsDialogProps {
  lottery: Lottery;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuyWonkaBarsDialog({ lottery, open, onOpenChange }: BuyWonkaBarsDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const { mutate: buyWonkaBars, isPending } = useBuyWonkaBars();

  const maxAllowed = calculateMaxAllowed(lottery, userAddress);
  const totalCost = lottery.wonkaBarPrice * BigInt(quantity);
  const chocoChipsEarned = (totalCost * 1000n) / 10n**18n;

  const handleBuy = () => {
    buyWonkaBars(
      { lotteryId: lottery.id, amount: quantity, value: totalCost },
      {
        onSuccess: () => {
          toast.success(`Purchased ${quantity} WonkaBars!`);
          onOpenChange(false);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buy WonkaBars</DialogTitle>
          <DialogDescription>
            Purchase lottery tickets for a chance to win {lottery.nftName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Quantity (max: {maxAllowed})</Label>
            <Slider
              value={[quantity]}
              onValueChange={([val]) => setQuantity(val)}
              min={1}
              max={maxAllowed}
              step={1}
            />
            <div className="flex justify-between text-sm mt-1">
              <span>1</span>
              <span className="font-bold">{quantity}</span>
              <span>{maxAllowed}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Price per WonkaBar:</span>
              <span className="font-bold">{formatEther(lottery.wonkaBarPrice)} ETH</span>
            </div>
            <div className="flex justify-between">
              <span>Total Cost:</span>
              <span className="font-bold">{formatEther(totalCost)} ETH</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>ChocoChips Earned:</span>
              <span className="font-bold">{chocoChipsEarned.toString()} CHOC</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleBuy} disabled={isPending}>
            {isPending ? "Purchasing..." : `Buy ${quantity} WonkaBar${quantity > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.5 Hooks & Data Fetching

#### 4.5.1 Main Hook: useMeltyFi.ts

```tsx
/**
 * Main hook for MeltyFi protocol interactions
 * Aggregates all sub-hooks for convenience
 */
export function useMeltyFi() {
  const lotteries = useLotteries();
  const userLotteries = useUserLotteries();
  const userWonkaBars = useUserWonkaBars();
  const chocoChipBalance = useChocoChipBalance();
  const protocolStats = useProtocolStats();

  return {
    // Queries
    lotteries: lotteries.data,
    isLoadingLotteries: lotteries.isLoading,
    userLotteries: userLotteries.data,
    userWonkaBars: userWonkaBars.data,
    chocoChipBalance: chocoChipBalance.data,
    protocolStats: protocolStats.data,

    // Mutations
    createLottery: useCreateLottery(),
    buyWonkaBars: useBuyWonkaBars(),
    repayLoan: useRepayLoan(),
    meltWonkaBars: useMeltWonkaBars(),

    // Refetch functions
    refetchAll: () => {
      lotteries.refetch();
      userLotteries.refetch();
      userWonkaBars.refetch();
      chocoChipBalance.refetch();
      protocolStats.refetch();
    }
  };
}
```

#### 4.5.2 Query Hooks

**useLotteries.ts**:
```tsx
import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';

export function useLotteries(filters?: {
  state?: LotteryState;
  owner?: string;
  sortBy?: 'newest' | 'ending-soon';
}) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['lotteries', filters],
    queryFn: async () => {
      // Fetch active lottery IDs
      const lotteryIds = await publicClient.readContract({
        address: MELTYFI_ADDRESS,
        abi: MELTYFI_ABI,
        functionName: 'getActiveLotteries'
      });

      // Fetch full lottery data for each ID
      const lotteries = await Promise.all(
        lotteryIds.map(id =>
          publicClient.readContract({
            address: MELTYFI_ADDRESS,
            abi: MELTYFI_ABI,
            functionName: 'getLottery',
            args: [id]
          })
        )
      );

      // Apply filters and sorting
      return filterAndSortLotteries(lotteries, filters);
    },
    refetchInterval: 15_000, // Poll every 15 seconds
    staleTime: 10_000
  });
}
```

**useUserWonkaBars.ts**:
```tsx
import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';

export function useUserWonkaBars() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['userWonkaBars', address],
    queryFn: async () => {
      if (!address) return [];

      // Get all lotteries user participated in
      const participatedLotteryIds = await publicClient.readContract({
        address: MELTYFI_ADDRESS,
        abi: MELTYFI_ABI,
        functionName: 'getUserParticipations',
        args: [address]
      });

      // For each lottery, get user's WonkaBar balance
      const wonkaBars = await Promise.all(
        participatedLotteryIds.map(async (lotteryId) => {
          const balance = await publicClient.readContract({
            address: WONKABAR_ADDRESS,
            abi: WONKABAR_ABI,
            functionName: 'balanceOf',
            args: [address, lotteryId]
          });

          const lottery = await publicClient.readContract({
            address: MELTYFI_ADDRESS,
            abi: MELTYFI_ABI,
            functionName: 'getLottery',
            args: [lotteryId]
          });

          return { lotteryId, balance, lottery };
        })
      );

      return wonkaBars.filter(wb => wb.balance > 0n);
    },
    enabled: !!address,
    refetchInterval: 15_000
  });
}
```

#### 4.5.3 Mutation Hooks

**useBuyWonkaBars.ts**:
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

export function useBuyWonkaBars() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();

  return useMutation({
    mutationFn: async ({
      lotteryId,
      amount,
      value
    }: {
      lotteryId: number;
      amount: number;
      value: bigint
    }) => {
      const hash = await writeContractAsync({
        address: MELTYFI_ADDRESS,
        abi: MELTYFI_ABI,
        functionName: 'buyWonkaBars',
        args: [lotteryId, amount],
        value
      });

      // Wait for confirmation
      const receipt = await waitForTransactionReceipt({ hash });

      return { hash, receipt };
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch
      queryClient.invalidateQueries({ queryKey: ['lotteries'] });
      queryClient.invalidateQueries({ queryKey: ['userWonkaBars'] });
      queryClient.invalidateQueries({ queryKey: ['chocoChipBalance'] });
    }
  });
}
```

### 4.6 NFT Metadata Fetching

**useNFTs.ts**:
```tsx
import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';

export function useUserNFTs() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['userNFTs', address],
    queryFn: async () => {
      if (!address) return [];

      // Option 1: Use Alchemy/Moralis NFT API
      const response = await fetch(
        `https://eth-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTs?owner=${address}`
      );
      const data = await response.json();

      // Option 2: Use The Graph indexer (custom subgraph)
      // const nfts = await fetchFromTheGraph(...)

      // Transform and enrich NFT data
      return data.ownedNfts.map(nft => ({
        contract: nft.contract.address,
        tokenId: nft.id.tokenId,
        name: nft.title || `Token #${nft.id.tokenId}`,
        description: nft.description,
        imageUrl: nft.media[0]?.gateway || nft.metadata?.image,
        collectionName: nft.contract.name,
        attributes: nft.metadata?.attributes
      }));
    },
    enabled: !!address,
    staleTime: 60_000 // Cache for 1 minute
  });
}
```

**Metadata Sources**:
1. **Primary**: Alchemy NFT API / Moralis API
2. **Fallback**: Direct contract tokenURI calls
3. **Cache**: IPFS gateway with CDN

### 4.7 Real-time Updates

**Strategy**:

1. **Polling** (default):
   - React Query automatic refetch every 15 seconds
   - Stale-while-revalidate pattern

2. **WebSocket** (optional enhancement):
```tsx
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeLotteryUpdates(lotteryId: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Connect to WebSocket server (could be The Graph subscription)
    const ws = new WebSocket(`wss://api.meltyfi.com/lottery/${lotteryId}`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);

      // Update query cache optimistically
      queryClient.setQueryData(['lottery', lotteryId], (old: Lottery) => ({
        ...old,
        wonkaBarsSold: update.wonkaBarsSold,
        totalRaised: update.totalRaised
      }));
    };

    return () => ws.close();
  }, [lotteryId, queryClient]);
}
```

3. **Event Listening** (wagmi):
```tsx
import { useWatchContractEvent } from 'wagmi';

export function useWatchWonkaBarPurchases(lotteryId: number) {
  const queryClient = useQueryClient();

  useWatchContractEvent({
    address: MELTYFI_ADDRESS,
    abi: MELTYFI_ABI,
    eventName: 'WonkaBarsPurchased',
    onLogs: (logs) => {
      logs.forEach(log => {
        if (log.args.lotteryId === lotteryId) {
          // Invalidate lottery query to refetch
          queryClient.invalidateQueries({ queryKey: ['lottery', lotteryId] });
        }
      });
    }
  });
}
```

### 4.8 UI/UX Requirements

#### 4.8.1 Design System

**Theme**:
- **Primary Color**: Purple/Gold gradient (Willy Wonka theme)
- **Secondary Color**: Chocolate brown
- **Accent**: Bright yellow/gold
- **Neutrals**: Gray scale
- **Success**: Green
- **Error**: Red
- **Warning**: Orange

**Typography**:
- **Headings**: Inter Bold
- **Body**: Inter Regular
- **Monospace**: JetBrains Mono (for addresses/numbers)

**Component Style**:
- Rounded corners (8px default)
- Subtle shadows for depth
- Smooth animations (300ms easing)
- Glass morphism for cards

#### 4.8.2 Responsive Breakpoints

```tsx
const breakpoints = {
  sm: '640px',   // Mobile
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
};
```

**Mobile-First Approach**:
- All layouts designed for mobile first
- Progressive enhancement for larger screens
- Touch-friendly buttons (min 44x44px)
- Hamburger menu on mobile

#### 4.8.3 Accessibility

**Requirements**:
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader friendly (ARIA labels)
- Focus indicators
- Color contrast ratio ≥ 4.5:1
- Alt text for all images
- Semantic HTML

**Implementation**:
- Use shadcn/ui (built on Radix, highly accessible)
- Test with axe DevTools
- Manual screen reader testing (VoiceOver, NVDA)

#### 4.8.4 Loading States

**Patterns**:

1. **Skeleton Screens**:
```tsx
function LotteryCardSkeleton() {
  return (
    <Card>
      <Skeleton className="h-48 w-full" /> {/* NFT image */}
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}
```

2. **Loading Indicators**:
- Spinner for inline loading
- Progress bar for multi-step processes
- Shimmer effect for lazy-loaded images

3. **Optimistic Updates**:
```tsx
const { mutate: buyWonkaBars } = useBuyWonkaBars();

const handleBuy = () => {
  buyWonkaBars(params, {
    onMutate: async (newPurchase) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['lottery', lotteryId] });

      // Snapshot previous value
      const previousLottery = queryClient.getQueryData(['lottery', lotteryId]);

      // Optimistically update UI
      queryClient.setQueryData(['lottery', lotteryId], (old: Lottery) => ({
        ...old,
        wonkaBarsSold: old.wonkaBarsSold + newPurchase.amount
      }));

      return { previousLottery };
    },
    onError: (err, newPurchase, context) => {
      // Rollback on error
      queryClient.setQueryData(['lottery', lotteryId], context.previousLottery);
    }
  });
};
```

#### 4.8.5 Error Handling

**User-Friendly Messages**:

```tsx
const ERROR_MESSAGES: Record<string, string> = {
  'execution reverted: MeltyFi: Not active': 'This lottery is no longer active.',
  'execution reverted: MeltyFi: Expired': 'This lottery has expired.',
  'execution reverted: Insufficient funds': 'You don\'t have enough ETH for this purchase.',
  'execution reverted: Max balance exceeded': 'Purchase would exceed maximum balance (25% of supply).',
  'User rejected': 'Transaction was cancelled.',
  'insufficient funds for gas': 'Insufficient ETH for gas fees.'
};

function parseError(error: Error): string {
  const message = error.message.toLowerCase();

  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (message.includes(key.toLowerCase())) {
      return value;
    }
  }

  return 'An unexpected error occurred. Please try again.';
}
```

**Error Boundaries**:
```tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

#### 4.8.6 Transaction Status

**Flow**:
```tsx
enum TxStatus {
  IDLE = 'idle',
  PENDING_SIGNATURE = 'pending_signature',
  PENDING_CONFIRMATION = 'pending_confirmation',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

function TransactionDialog({ status, hash }: { status: TxStatus; hash?: string }) {
  return (
    <Dialog open={status !== TxStatus.IDLE}>
      <DialogContent>
        {status === TxStatus.PENDING_SIGNATURE && (
          <>
            <WalletIcon className="animate-pulse" />
            <p>Please confirm the transaction in your wallet...</p>
          </>
        )}

        {status === TxStatus.PENDING_CONFIRMATION && (
          <>
            <Spinner />
            <p>Transaction submitted! Waiting for confirmation...</p>
            <a href={`https://etherscan.io/tx/${hash}`} target="_blank">
              View on Explorer
            </a>
          </>
        )}

        {status === TxStatus.CONFIRMED && (
          <>
            <CheckCircle className="text-green-500" />
            <p>Transaction confirmed!</p>
            <Button onClick={onClose}>Close</Button>
          </>
        )}

        {status === TxStatus.FAILED && (
          <>
            <XCircle className="text-red-500" />
            <p>Transaction failed. Please try again.</p>
            <Button onClick={onRetry}>Retry</Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 5. Technical Architecture

### 5.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client (Browser)                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Next.js Frontend (SSR/CSR)                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │  │   Pages      │  │  Components  │  │   Hooks         │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │         wagmi + viem (Blockchain SDK)                │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────┬─────────────────────────────────────────────┘
                    │ HTTP/WebSocket
┌───────────────────┴─────────────────────────────────────────────┐
│                   API Layer (Optional)                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  The Graph (GraphQL)   │   Alchemy API   │   IPFS Gateway  │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────┬─────────────────────────────────────────────┘
                    │ JSON-RPC
┌───────────────────┴─────────────────────────────────────────────┐
│                    XRP EVM / EVM Blockchain                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Smart Contracts                           │ │
│  │  ┌───────────┐  ┌──────────┐  ┌─────────────┐  ┌────────┐ │ │
│  │  │ MeltyFi   │  │ ChocoChip│  │ WonkaBar    │  │  DAO   │ │ │
│  │  │ Protocol  │  │ (ERC-20) │  │ (ERC-1155)  │  │        │ │ │
│  │  └───────────┘  └──────────┘  └─────────────┘  └────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  External Services                          │ │
│  │  ┌──────────────────────────┐  ┌──────────────────────────┐│ │
│  │  │  Chainlink VRF (RNG)     │  │  Chainlink Automation   ││ │
│  │  └──────────────────────────┘  └──────────────────────────┘│ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Data Flow

#### 5.2.1 Create Lottery Flow

```
User Action: Click "Create Lottery"
   ↓
Frontend: Display Create Lottery Form
   ↓
User: Fill form (select NFT, set parameters)
   ↓
Frontend: Validate inputs (Zod schema)
   ↓
User: Click "Create"
   ↓
Frontend: Request NFT approval transaction
   ↓
User: Approve in wallet
   ↓
Blockchain: ERC-721.approve() executes
   ↓
Frontend: Wait for approval confirmation
   ↓
Frontend: Request createLottery transaction
   ↓
User: Approve in wallet
   ↓
Blockchain: MeltyFiProtocol.createLottery() executes
   │         - Verifies NFT ownership
   │         - Transfers NFT to contract
   │         - Creates Lottery struct
   │         - Emits LotteryCreated event
   ↓
Frontend: Wait for transaction confirmation
   ↓
Frontend: Invalidate queries, refetch lotteries
   ↓
Frontend: Show success toast, redirect to lottery page
```

#### 5.2.2 Buy WonkaBars Flow

```
User Action: Click "Buy WonkaBars" on lottery
   ↓
Frontend: Display BuyWonkaBarsDialog
   ↓
User: Select quantity
   ↓
Frontend: Calculate total cost, show preview
   ↓
User: Click "Buy"
   ↓
Frontend: Request buyWonkaBars transaction
   ↓
User: Approve in wallet
   ↓
Blockchain: MeltyFiProtocol.buyWonkaBars() executes
   │         - Validates lottery state
   │         - Transfers 95% ETH to NFT owner
   │         - Transfers 5% ETH to DAO treasury
   │         - Mints WonkaBar tokens to buyer
   │         - Mints ChocoChip tokens to buyer
   │         - Updates lottery state
   │         - Emits WonkaBarsPurchased event
   ↓
Frontend: Optimistically update UI
   ↓
Frontend: Wait for confirmation
   ↓
Frontend: Invalidate queries, refetch
   ↓
Frontend: Show success toast
```

### 5.3 Smart Contract Deployment Architecture

**Proxy Pattern** (UUPS):

```
┌─────────────────────────────────────────────────────────────┐
│                      Proxy Contract                          │
│  (ERC1967Proxy - stores state, delegates calls)             │
│                                                              │
│  Storage:                                                    │
│  - implementation address                                   │
│  - lottery mappings                                         │
│  - protocol state                                           │
└─────────────────┬───────────────────────────────────────────┘
                  │ delegatecall
┌─────────────────┴───────────────────────────────────────────┐
│             Implementation Contract v1                       │
│  (MeltyFiProtocol - logic only, no state)                   │
│                                                              │
│  Functions:                                                  │
│  - createLottery()                                          │
│  - buyWonkaBars()                                           │
│  - etc.                                                     │
└─────────────────────────────────────────────────────────────┘

         Upgradeable to v2 via DAO governance
```

**Deployment Steps**:

1. Deploy implementation contract (MeltyFiProtocol)
2. Deploy proxy contract pointing to implementation
3. Initialize proxy via initializer function
4. Deploy auxiliary contracts (ChocoChip, WonkaBar, etc.)
5. Set contract references and authorize minters
6. Transfer ownership to Timelock/DAO
7. Verify contracts on block explorer

### 5.4 Off-Chain Infrastructure

#### 5.4.1 The Graph Indexer

**Purpose**: Index blockchain events for fast querying

**Subgraph Schema**:
```graphql
type Lottery @entity {
  id: ID!
  lotteryId: BigInt!
  owner: Bytes!
  nftContract: Bytes!
  nftTokenId: BigInt!
  state: LotteryState!
  createdAt: BigInt!
  expirationDate: BigInt!
  wonkaBarPrice: BigInt!
  wonkaBarsMaxSupply: BigInt!
  wonkaBarsSold: BigInt!
  totalRaised: BigInt!
  winner: Bytes
  participants: [Participant!]! @derivedFrom(field: "lottery")
  purchases: [Purchase!]! @derivedFrom(field: "lottery")
}

type Participant @entity {
  id: ID!
  address: Bytes!
  lottery: Lottery!
  wonkaBarsOwned: BigInt!
  totalSpent: BigInt!
  chocoChipsEarned: BigInt!
}

type Purchase @entity {
  id: ID!
  lottery: Lottery!
  buyer: Bytes!
  amount: BigInt!
  totalCost: BigInt!
  timestamp: BigInt!
  transactionHash: Bytes!
}

type ProtocolStats @entity {
  id: ID!
  totalLotteries: BigInt!
  totalValueLocked: BigInt!
  totalFeesCollected: BigInt!
  totalChocoChipsMinted: BigInt!
}

enum LotteryState {
  ACTIVE
  CANCELLED
  CONCLUDED
  TRASHED
}
```

**Event Handlers** (AssemblyScript):
```typescript
export function handleLotteryCreated(event: LotteryCreatedEvent): void {
  let lottery = new Lottery(event.params.lotteryId.toString());
  lottery.lotteryId = event.params.lotteryId;
  lottery.owner = event.params.owner;
  lottery.nftContract = event.params.nftContract;
  lottery.nftTokenId = event.params.nftTokenId;
  lottery.state = "ACTIVE";
  lottery.wonkaBarPrice = event.params.wonkaBarPrice;
  lottery.wonkaBarsMaxSupply = event.params.maxSupply;
  lottery.wonkaBarsSold = BigInt.fromI32(0);
  lottery.totalRaised = BigInt.fromI32(0);
  lottery.createdAt = event.block.timestamp;
  lottery.expirationDate = event.params.expirationDate;
  lottery.save();

  // Update protocol stats
  let stats = loadOrCreateProtocolStats();
  stats.totalLotteries = stats.totalLotteries.plus(BigInt.fromI32(1));
  stats.save();
}

export function handleWonkaBarsPurchased(event: WonkaBarsPurchasedEvent): void {
  let lottery = Lottery.load(event.params.lotteryId.toString());
  if (lottery) {
    lottery.wonkaBarsSold = lottery.wonkaBarsSold.plus(event.params.amount);
    lottery.totalRaised = lottery.totalRaised.plus(event.params.totalCost);
    lottery.save();
  }

  // Create purchase record
  let purchase = new Purchase(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  purchase.lottery = event.params.lotteryId.toString();
  purchase.buyer = event.params.buyer;
  purchase.amount = event.params.amount;
  purchase.totalCost = event.params.totalCost;
  purchase.timestamp = event.block.timestamp;
  purchase.transactionHash = event.transaction.hash;
  purchase.save();

  // Update or create participant
  let participantId = event.params.lotteryId.toString() + "-" + event.params.buyer.toHex();
  let participant = Participant.load(participantId);
  if (!participant) {
    participant = new Participant(participantId);
    participant.address = event.params.buyer;
    participant.lottery = event.params.lotteryId.toString();
    participant.wonkaBarsOwned = BigInt.fromI32(0);
    participant.totalSpent = BigInt.fromI32(0);
    participant.chocoChipsEarned = BigInt.fromI32(0);
  }
  participant.wonkaBarsOwned = participant.wonkaBarsOwned.plus(event.params.amount);
  participant.totalSpent = participant.totalSpent.plus(event.params.totalCost);
  participant.chocoChipsEarned = participant.chocoChipsEarned.plus(event.params.chocoChipsEarned);
  participant.save();

  // Update protocol stats
  let stats = loadOrCreateProtocolStats();
  stats.totalValueLocked = stats.totalValueLocked.plus(event.params.totalCost);
  stats.totalFeesCollected = stats.totalFeesCollected.plus(event.params.totalCost.times(BigInt.fromI32(5)).div(BigInt.fromI32(100)));
  stats.save();
}
```

**Frontend Queries**:
```tsx
import { request, gql } from 'graphql-request';

const LOTTERIES_QUERY = gql`
  query GetActiveLotteries {
    lotteries(where: { state: ACTIVE }, orderBy: createdAt, orderDirection: desc) {
      id
      lotteryId
      owner
      nftContract
      nftTokenId
      wonkaBarPrice
      wonkaBarsMaxSupply
      wonkaBarsSold
      totalRaised
      expirationDate
      participants {
        address
        wonkaBarsOwned
      }
    }
  }
`;

export async function fetchLotteries() {
  const data = await request(SUBGRAPH_URL, LOTTERIES_QUERY);
  return data.lotteries;
}
```

#### 5.4.2 IPFS for Metadata

**Use Cases**:
- NFT metadata caching
- Lottery metadata (description, terms)
- DAO proposal documents

**Implementation**:
```tsx
import { create } from 'ipfs-http-client';

const ipfs = create({ url: 'https://ipfs.infura.io:5001' });

export async function uploadToIPFS(data: object): Promise<string> {
  const { cid } = await ipfs.add(JSON.stringify(data));
  return `ipfs://${cid}`;
}

export async function fetchFromIPFS(ipfsUrl: string): Promise<any> {
  const cid = ipfsUrl.replace('ipfs://', '');
  const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
  return response.json();
}
```

---

## 6. Security Requirements

### 6.1 Smart Contract Security

**Critical Requirements**:

1. **Audit**: Professional audit by 2+ firms before mainnet
2. **Bug Bounty**: $100k+ program on Immunefi/Code4rena
3. **Formal Verification**: Critical functions (payment splitting, winner selection)
4. **Upgrade Safety**: Comprehensive upgrade tests, storage layout checks
5. **Access Control**: Multi-sig for admin functions, DAO for governance
6. **Emergency Procedures**: Pause functionality, emergency withdrawal (with timelock)

**Testing Coverage**:
- 100% line coverage
- 95%+ branch coverage
- Fuzz testing (Echidna/Foundry)
- Integration tests
- Upgrade tests
- Gas optimization tests

### 6.2 Frontend Security

**Requirements**:

1. **Input Sanitization**: All user inputs validated and sanitized
2. **XSS Prevention**: Content Security Policy (CSP) headers
3. **CSRF Protection**: SameSite cookies, CSRF tokens
4. **Secure Communication**: HTTPS only, HSTS headers
5. **Dependency Scanning**: Regular npm audit, Snyk monitoring
6. **Environment Variables**: Never expose private keys/secrets in frontend

**CSP Header**:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: ipfs:;
  connect-src 'self' https://rpc.xrpevm.com https://api.thegraph.com;
  font-src 'self' https://fonts.gstatic.com;
```

### 6.3 Wallet Security

**Best Practices**:

1. **Never Request Private Keys**: Only use wallet signatures
2. **Verify Contract Addresses**: Display contract addresses for user verification
3. **Transaction Preview**: Show decoded transaction data before signing
4. **Phishing Protection**: Verify domain, display warnings for suspicious activity
5. **Hardware Wallet Support**: Full Ledger/Trezor compatibility

---

## 7. Testing Requirements

*(Detailed in Section 3.3)*

**Summary**:
- Unit tests: 100% coverage
- Integration tests: All workflows
- E2E tests: Cypress/Playwright
- Load tests: Simulate high traffic
- Security tests: Audit + bug bounty

---

## 8. Deployment Requirements

### 8.1 Contract Deployment

**Networks**:

1. **Development**: Local Hardhat network
2. **Testnet**: XRP EVM Testnet (or Sepolia)
3. **Mainnet**: XRP EVM Mainnet

**Deployment Checklist**:

- [ ] Compile contracts with optimizations (200 runs)
- [ ] Deploy implementation contracts
- [ ] Deploy proxy contracts
- [ ] Initialize contracts with correct parameters
- [ ] Verify contracts on block explorer
- [ ] Set up Chainlink VRF subscription
- [ ] Fund VRF subscription with LINK
- [ ] Configure Chainlink Automation
- [ ] Deploy subgraph to The Graph
- [ ] Transfer ownership to Timelock
- [ ] Create initial DAO proposals for testing
- [ ] Conduct final security review
- [ ] Execute deployment ceremony (if mainnet)

**Deployment Script** (Hardhat):
```typescript
import { ethers, upgrades } from "hardhat";

async function main() {
  // Deploy ChocoChip
  const ChocoChip = await ethers.getContractFactory("ChocoChip");
  const chocoChip = await upgrades.deployProxy(ChocoChip, [], { initializer: 'initialize' });
  await chocoChip.deployed();
  console.log("ChocoChip deployed to:", chocoChip.address);

  // Deploy WonkaBar
  const WonkaBar = await ethers.getContractFactory("WonkaBar");
  const wonkaBar = await upgrades.deployProxy(WonkaBar, [], { initializer: 'initialize' });
  await wonkaBar.deployed();
  console.log("WonkaBar deployed to:", wonkaBar.address);

  // Deploy VRFManager
  const VRFManager = await ethers.getContractFactory("VRFManager");
  const vrfManager = await VRFManager.deploy(/* VRF config */);
  await vrfManager.deployed();
  console.log("VRFManager deployed to:", vrfManager.address);

  // Deploy MeltyFiProtocol
  const MeltyFiProtocol = await ethers.getContractFactory("MeltyFiProtocol");
  const meltyFi = await upgrades.deployProxy(
    MeltyFiProtocol,
    [chocoChip.address, wonkaBar.address, vrfManager.address],
    { initializer: 'initialize' }
  );
  await meltyFi.deployed();
  console.log("MeltyFiProtocol deployed to:", meltyFi.address);

  // Authorize MeltyFiProtocol as minter
  await chocoChip.authorizeMinter(meltyFi.address);
  await wonkaBar.setMeltyFiProtocol(meltyFi.address);

  // Deploy Timelock
  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelock = await TimelockController.deploy(
    172800, // 48 hours
    [], // proposers (will be DAO)
    [], // executors (will be DAO)
    ethers.constants.AddressZero // admin
  );
  await timelock.deployed();
  console.log("Timelock deployed to:", timelock.address);

  // Deploy MeltyDAO
  const MeltyDAO = await ethers.getContractFactory("MeltyDAO");
  const dao = await upgrades.deployProxy(
    MeltyDAO,
    [chocoChip.address, timelock.address],
    { initializer: 'initialize' }
  );
  await dao.deployed();
  console.log("MeltyDAO deployed to:", dao.address);

  // Grant roles
  await timelock.grantRole(await timelock.PROPOSER_ROLE(), dao.address);
  await timelock.grantRole(await timelock.EXECUTOR_ROLE(), dao.address);

  // Transfer ownership to Timelock
  await meltyFi.transferOwnership(timelock.address);
  await chocoChip.transferOwnership(timelock.address);
  await wonkaBar.transferOwnership(timelock.address);

  console.log("Deployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 8.2 Frontend Deployment

**Hosting**: Vercel (recommended for Next.js)

**Deployment Steps**:

1. Connect GitHub repository to Vercel
2. Configure environment variables:
   ```
   NEXT_PUBLIC_CHAIN_ID=1440002 (XRP EVM testnet)
   NEXT_PUBLIC_RPC_URL=https://rpc.testnet.xrplevm.com
   NEXT_PUBLIC_MELTYFI_ADDRESS=0x...
   NEXT_PUBLIC_CHOCOCHIP_ADDRESS=0x...
   NEXT_PUBLIC_WONKABAR_ADDRESS=0x...
   NEXT_PUBLIC_DAO_ADDRESS=0x...
   NEXT_PUBLIC_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/...
   NEXT_PUBLIC_ALCHEMY_API_KEY=...
   ```
3. Set production domain (e.g., app.meltyfi.com)
4. Enable automatic deployments on push to main
5. Configure CDN and edge caching
6. Set up monitoring (Vercel Analytics, Sentry)

**CI/CD Pipeline** (GitHub Actions):
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 9. Integration Requirements

### 9.1 Chainlink Integration

**VRF v2.5**:

- Network: XRP EVM (or fallback to Ethereum)
- Subscription-based funding model
- Request confirmations: 3 blocks
- Callback gas limit: 200,000
- Fallback: Manual winner selection if VRF fails (admin-only, time-delayed)

**Automation (Keepers)**:

- Monitor expired lotteries
- Auto-trigger drawWinner()
- Upkeep frequency: Check every block, execute when condition met
- Conditional upkeep: Only if lottery.state == ACTIVE && block.timestamp > expirationDate

### 9.2 The Graph

**Subgraph Deployment**:

1. Create subgraph.yaml manifest
2. Define schema (see section 5.4.1)
3. Write event handlers (AssemblyScript)
4. Deploy to The Graph Studio or hosted service
5. Test queries via GraphiQL
6. Integrate into frontend

### 9.3 NFT Metadata APIs

**Primary**: Alchemy NFT API
**Fallback**: Moralis API
**Cache**: IPFS + CDN

### 9.4 Wallet Connectors

**Supported Wallets**:
- MetaMask
- WalletConnect (universal)
- Coinbase Wallet
- Ledger (hardware)
- Trezor (hardware)

**Implementation**: RainbowKit with wagmi

---

## 10. Performance Requirements

### 10.1 Smart Contract Gas Optimization

**Targets**:

| Operation | Max Gas | Optimization Strategy |
|-----------|---------|----------------------|
| createLottery | 200,000 | Pack struct, minimize storage |
| buyWonkaBars (first) | 150,000 | Batch mints, optimize storage |
| buyWonkaBars (subsequent) | 100,000 | Reuse storage slots |
| repayLoan | 80,000 | Single storage update |
| meltWonkaBars | 120,000 | Batch operations |

**Techniques**:
- Use `uint256` for all numbers (avoid smaller types)
- Pack structs to save storage slots
- Use events instead of storage where possible
- Batch operations (multi-call pattern)
- Immutable variables where applicable
- Short-circuit conditions (fail fast)

### 10.2 Frontend Performance

**Targets**:

| Metric | Target | Strategy |
|--------|--------|----------|
| First Contentful Paint (FCP) | < 1.5s | SSR, code splitting |
| Largest Contentful Paint (LCP) | < 2.5s | Image optimization, lazy loading |
| Time to Interactive (TTI) | < 3.5s | Minimize JS bundle |
| Cumulative Layout Shift (CLS) | < 0.1 | Reserve space for images |

**Optimizations**:

1. **Code Splitting**:
```tsx
import dynamic from 'next/dynamic';

const BuyWonkaBarsDialog = dynamic(() => import('./BuyWonkaBarsDialog'), {
  loading: () => <Skeleton />,
  ssr: false // Client-side only
});
```

2. **Image Optimization**:
```tsx
import Image from 'next/image';

<Image
  src={nftImageUrl}
  alt={nftName}
  width={400}
  height={400}
  placeholder="blur"
  blurDataURL={blurHash}
  loading="lazy"
/>
```

3. **Data Prefetching**:
```tsx
// Prefetch lottery details on hover
<Link
  href={`/lotteries/${lottery.id}`}
  onMouseEnter={() => queryClient.prefetchQuery(['lottery', lottery.id])}
>
  View Lottery
</Link>
```

4. **Bundle Size**:
- Target: < 200KB initial JS bundle
- Use `next-bundle-analyzer`
- Tree-shake unused code
- Remove moment.js (use date-fns)

### 10.3 Database/Indexing Performance

**The Graph Subgraph**:
- Indexed within 1-2 blocks
- Query response < 500ms
- Handles 1000+ req/min

---

## 11. User Experience Requirements

### 11.1 Onboarding Flow

**First-Time User**:

1. Land on homepage
2. See "How It Works" section
3. Click "Browse Lotteries"
4. Click on interesting lottery
5. Prompt to connect wallet
6. Guide through wallet connection (tooltips)
7. Return to lottery page
8. Buy WonkaBars with inline help
9. Success! Show confirmation + next steps

**Returning User**:

1. Auto-connect wallet (if previously connected)
2. Show personalized dashboard
3. Highlight new lotteries
4. Notifications for:
   - Lotteries ending soon (user participated)
   - Winnings available to claim
   - Proposals to vote on

### 11.2 Help & Documentation

**In-App**:
- Tooltips on hover (using Radix Tooltip)
- "?" icons for complex features
- Inline FAQs
- Video tutorials (embedded YouTube)

**External**:
- Comprehensive docs site (GitBook/Docusaurus)
- Video walkthrough (Loom)
- Discord community for support
- FAQ page

### 11.3 Notifications

**Types**:

1. **Transaction Status**:
   - Pending signature
   - Pending confirmation
   - Confirmed
   - Failed

2. **Lottery Updates**:
   - Lottery ending soon (< 24h)
   - Lottery sold out
   - Won lottery (you're the winner!)
   - Rewards available to claim

3. **Governance**:
   - New proposal created
   - Voting ending soon
   - Proposal executed

**Channels**:
- In-app toasts (Sonner)
- Email (optional, opt-in)
- Browser push notifications (optional)

### 11.4 Accessibility

**WCAG 2.1 AA Compliance**:

- Keyboard navigation (Tab, Enter, Esc)
- Screen reader support (ARIA labels)
- Focus indicators
- Color contrast ≥ 4.5:1
- Alt text for images
- Captions for videos

**Testing**:
- Automated: axe DevTools
- Manual: VoiceOver (macOS), NVDA (Windows)
- User testing with disabled users

---

## 12. Future Enhancements

### 12.1 Phase 2 Features

1. **Multi-NFT Lotteries**:
   - Deposit multiple NFTs as bundle
   - Winner gets entire collection

2. **Fractional Ownership**:
   - Instead of lottery, issue fractional NFT shares
   - Blend MeltyFi with fractionalization

3. **Insurance Option**:
   - Optional insurance for participants
   - Get partial refund if don't win

4. **Instant Buy Option**:
   - "Buy It Now" price for immediate NFT purchase
   - Bypasses lottery mechanism

5. **Secondary Market**:
   - Trade WonkaBar tokens on DEX
   - Price discovery for lottery tickets

### 12.2 Phase 3 Features

1. **Cross-Chain Support**:
   - Bridge to other EVM chains (Polygon, Arbitrum)
   - Chainlink CCIP for cross-chain lotteries

2. **Mobile App**:
   - React Native app (iOS/Android)
   - Push notifications
   - Wallet integration (WalletConnect)

3. **Gamification**:
   - Achievements/badges
   - Leaderboards (most lotteries created, most won)
   - Referral rewards

4. **Advanced Analytics**:
   - ML-powered pricing suggestions
   - Win probability calculator
   - Historical performance tracking

5. **Institutional Features**:
   - Bulk lottery creation API
   - White-label solution for NFT projects
   - Custom branding

---

## 13. Appendix

### 13.1 Glossary

| Term | Definition |
|------|------------|
| **MeltyFi** | Protocol name, represents "melting" NFTs into liquid assets |
| **WonkaBar** | Lottery ticket token (ERC-1155) |
| **ChocoChip** | Governance token (ERC-20) |
| **Lottery** | An active lending arrangement with NFT collateral |
| **Melting** | Claiming rewards by burning WonkaBar tokens |
| **NFT Owner** | Person who deposits NFT to create lottery |
| **Participant** | Person who buys WonkaBar tickets |
| **Protocol Fee** | 5% fee on all WonkaBar sales |
| **TVL** | Total Value Locked in active lotteries |

### 13.2 Technology Stack Summary

**Smart Contracts**:
- Solidity 0.8.20+
- Hardhat development framework
- OpenZeppelin contracts (upgradeable)
- Chainlink VRF v2.5
- Chainlink Automation

**Frontend**:
- Next.js 15 (App Router)
- TypeScript 5+
- Tailwind CSS + shadcn/ui
- wagmi v2 + viem
- RainbowKit
- React Query (TanStack Query)
- Recharts (analytics)

**Infrastructure**:
- The Graph (indexing)
- IPFS (metadata)
- Alchemy API (NFT metadata)
- Vercel (hosting)

**Blockchain**:
- XRP EVM (primary target)
- EVM-compatible chains (extensible)

### 13.3 Key Resources

**Documentation**:
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts/
- Hardhat: https://hardhat.org/docs
- wagmi: https://wagmi.sh/
- Next.js: https://nextjs.org/docs
- The Graph: https://thegraph.com/docs/

**Security**:
- Chainlink VRF: https://docs.chain.link/vrf/v2/introduction
- Smart Contract Security Best Practices: https://consensys.github.io/smart-contract-best-practices/

**Design**:
- shadcn/ui: https://ui.shadcn.com/
- Tailwind CSS: https://tailwindcss.com/

### 13.4 Success Metrics (KPIs)

**Protocol Metrics**:
- Total Value Locked (TVL)
- Number of active lotteries
- Number of unique participants
- Total protocol fees collected
- ChocoChip token holders

**User Metrics**:
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Average lottery duration
- Average WonkaBar price
- Lottery completion rate

**Technical Metrics**:
- Smart contract gas efficiency
- Frontend page load times
- Uptime (target: 99.9%)
- Transaction success rate
- Subgraph indexing speed

**Financial Metrics**:
- Protocol revenue (fees)
- DAO treasury balance
- Token price (CHOC)
- Market cap

---

## 14. Conclusion

This requirements document defines a **comprehensive, production-ready MeltyFi protocol** for EVM blockchains that:

1. **Improves upon the deprecated Ethereum implementation** by fixing critical security issues (NFT ownership verification, VRF integration, pausability)

2. **Adopts best practices from the Sui implementation** including modern frontend architecture (Next.js 15, TypeScript, React Query), excellent UI/UX, and comprehensive features

3. **Adds new capabilities** including upgradeability (UUPS proxies), enhanced governance (DAO voting), better error handling, and robust testing

4. **Ensures security** through comprehensive testing requirements, professional audits, bug bounties, and security best practices

5. **Optimizes for production** with performance requirements, analytics, real-time updates, and excellent developer experience

**Next Steps**:

1. **Review & Approval**: Stakeholders review this document
2. **Technical Design**: Detailed technical design document
3. **Development**: Implement smart contracts and frontend
4. **Testing**: Comprehensive testing (unit, integration, E2E)
5. **Audit**: Professional security audit
6. **Testnet Deployment**: Deploy to XRP EVM testnet
7. **Beta Testing**: Public beta with select users
8. **Mainnet Deployment**: Production launch
9. **Post-Launch**: Monitoring, support, iteration

**Estimated Timeline**:
- Smart Contracts: 6-8 weeks
- Frontend: 8-10 weeks
- Testing: 4 weeks
- Audit: 4-6 weeks
- **Total**: 22-28 weeks (~6 months)

**Team Requirements**:
- 2 Senior Solidity Developers
- 2 Senior Frontend Developers (Next.js/TypeScript)
- 1 DevOps Engineer
- 1 UI/UX Designer
- 1 Product Manager
- 1 Security Engineer (part-time)

---

**Document Version**: 1.0
**Last Updated**: November 8, 2025
**Author**: MeltyFi Development Team
**Status**: Draft - Pending Review