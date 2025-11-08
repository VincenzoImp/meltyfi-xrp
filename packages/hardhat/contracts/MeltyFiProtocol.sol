// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./ChocoChip.sol";
import "./WonkaBar.sol";
import "./PseudoRandomGenerator.sol";
import "./interfaces/IStdReference.sol";

/**
 * @title MeltyFiProtocol
 * @notice Main protocol contract for MeltyFi NFT liquidity lotteries on XRP EVM
 * @dev Manages lottery lifecycle: creation, participation, resolution, and rewards
 *
 * Key Features:
 * - NFT owners create lotteries and receive 95% as XRP tickets sell
 * - Participants buy WonkaBar tickets for chance to win NFTs
 * - All participants earn ChocoChip governance tokens (10% of XRP USD value)
 * - Pseudo-random winner selection (simple RNG without oracles)
 * - Repayment option for NFT owners
 * - Band Protocol price oracle for XRP/USD pricing
 * - Upgradeable via UUPS pattern
 */
contract MeltyFiProtocol is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC1155HolderUpgradeable
{
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    // ============ Enums ============

    enum LotteryState {
        ACTIVE, // 0: Lottery accepting purchases
        CANCELLED, // 1: Owner repaid, participants get refunds
        CONCLUDED, // 2: Lottery expired/sold out, winner drawn
        TRASHED // 3: No sales, NFT returned to owner
    }

    // ============ Structs ============

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
        string nftImageUrl;
    }

    // ============ State Variables ============

    /// @notice ChocoChip governance token
    ChocoChip public chocoChipToken;

    /// @notice WonkaBar lottery ticket token
    WonkaBar public wonkaBarToken;

    /// @notice Pseudo Random Generator for winner selection
    PseudoRandomGenerator public randomGenerator;

    /// @notice Band Protocol StdReference oracle for XRP/USD price
    IStdReference public priceOracle;

    /// @notice DAO treasury address
    address public daoTreasury;

    /// @notice Protocol fee percentage (in basis points, 500 = 5%)
    uint256 public protocolFeePercentage;

    /// @notice Maximum WonkaBars per lottery
    uint256 public maxWonkaBarsPerLottery;

    /// @notice Minimum WonkaBars per lottery
    uint256 public minWonkaBarsPerLottery;

    /// @notice Maximum balance percentage per user (in basis points, 2500 = 25%)
    uint256 public maxBalancePercentage;

    /// @notice ChocoChips reward percentage of XRP USD value (1000 = 10%)
    /// @dev 10% of the USD value of XRP spent
    uint256 public chocoChipsRewardPercentage;

    /// @notice Total lotteries created
    uint256 public totalLotteriesCreated;

    /// @notice Total value locked in active lotteries
    uint256 public totalValueLocked;

    /// @notice Total fees collected by protocol
    uint256 public totalFeesCollected;

    /// @notice Mapping of lottery ID to Lottery struct
    mapping(uint256 => Lottery) public lotteries;

    /// @notice Mapping of owner address to their lottery IDs
    mapping(address => EnumerableSet.UintSet) private ownerLotteries;

    /// @notice Mapping of participant address to lottery IDs they're in
    mapping(address => EnumerableSet.UintSet) private participantLotteries;

    /// @notice Mapping of lottery ID to participant addresses
    mapping(uint256 => EnumerableSet.AddressSet) private lotteryParticipants;

    /// @notice Set of active lottery IDs
    EnumerableSet.UintSet private activeLotteryIds;

    /// @notice Mapping of VRF request ID to lottery ID
    mapping(uint256 => uint256) private vrfRequestToLottery;

    // ============ Constants ============

    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant MAX_DURATION_DAYS = 90;
    uint256 private constant MIN_DURATION_DAYS = 1;

    // ============ Events ============

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

    event LotteryResolved(uint256 indexed lotteryId, address indexed winner, LotteryState finalState);

    event LoanRepaid(uint256 indexed lotteryId, address indexed owner, uint256 amountRepaid);

    event WonkaBarsMelted(
        uint256 indexed lotteryId,
        address indexed user,
        uint256 amount,
        uint256 xrpRefunded,
        uint256 chocoChipsEarned,
        bool wonNFT
    );

    event ProtocolParameterUpdated(string parameter, uint256 oldValue, uint256 newValue);

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // ============ Errors ============

    error ZeroAddress();
    error InvalidDuration();
    error InvalidSupply();
    error InvalidPrice();
    error NotNFTOwner();
    error NotLotteryOwner();
    error LotteryNotActive();
    error LotteryNotExpired();
    error LotteryExpired();
    error InsufficientPayment();
    error ExceedsMaxBalance();
    error ExceedsMaxSupply();
    error IncorrectRepaymentAmount();
    error NoWonkaBarsToBurn();
    error LotteryStillActive();
    error InvalidState();
    error TransferFailed();

    // ============ Initializer ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the MeltyFi Protocol
     * @param initialOwner Address of initial owner (DAO/timelock)
     * @param _chocoChipToken ChocoChip token address
     * @param _wonkaBarToken WonkaBar token address
     * @param _randomGenerator Pseudo Random Generator address
     * @param _priceOracle Band Protocol StdReference oracle address
     * @param _daoTreasury DAO treasury address
     */
    function initialize(
        address initialOwner,
        address _chocoChipToken,
        address _wonkaBarToken,
        address _randomGenerator,
        address _priceOracle,
        address _daoTreasury
    ) external initializer {
        if (initialOwner == address(0)) revert ZeroAddress();
        if (_chocoChipToken == address(0)) revert ZeroAddress();
        if (_wonkaBarToken == address(0)) revert ZeroAddress();
        if (_randomGenerator == address(0)) revert ZeroAddress();
        if (_priceOracle == address(0)) revert ZeroAddress();
        if (_daoTreasury == address(0)) revert ZeroAddress();

        __Ownable_init(initialOwner);
        __Pausable_init();
        __ReentrancyGuard_init();
        __ERC1155Holder_init();
        __UUPSUpgradeable_init();

        chocoChipToken = ChocoChip(_chocoChipToken);
        wonkaBarToken = WonkaBar(_wonkaBarToken);
        randomGenerator = PseudoRandomGenerator(_randomGenerator);
        priceOracle = IStdReference(_priceOracle);
        daoTreasury = _daoTreasury;

        // Set default parameters
        protocolFeePercentage = 500; // 5%
        maxWonkaBarsPerLottery = 100;
        minWonkaBarsPerLottery = 5;
        maxBalancePercentage = 2500; // 25%
        chocoChipsRewardPercentage = 1000; // 10% of USD value
    }

    // ============ External Functions ============

    /**
     * @notice Create a new lottery with NFT collateral
     * @param nftContract Address of ERC-721 NFT contract
     * @param nftTokenId Token ID of NFT
     * @param wonkaBarPrice Price per WonkaBar in wei
     * @param wonkaBarsMaxSupply Total WonkaBars available (5-100)
     * @param durationInDays Lottery duration in days
     * @param nftName Name of the NFT for metadata
     * @param nftImageUrl Image URL of the NFT
     * @return lotteryId The created lottery ID
     */
    function createLottery(
        address nftContract,
        uint256 nftTokenId,
        uint256 wonkaBarPrice,
        uint256 wonkaBarsMaxSupply,
        uint256 durationInDays,
        string memory nftName,
        string memory nftImageUrl
    ) external whenNotPaused nonReentrant returns (uint256 lotteryId) {
        // Validation
        if (nftContract == address(0)) revert ZeroAddress();
        if (wonkaBarPrice == 0) revert InvalidPrice();
        if (wonkaBarsMaxSupply < minWonkaBarsPerLottery || wonkaBarsMaxSupply > maxWonkaBarsPerLottery)
            revert InvalidSupply();
        if (durationInDays < MIN_DURATION_DAYS || durationInDays > MAX_DURATION_DAYS) revert InvalidDuration();

        // CRITICAL FIX: Verify NFT ownership before allowing lottery creation
        if (IERC721(nftContract).ownerOf(nftTokenId) != msg.sender) revert NotNFTOwner();

        // Transfer NFT to this contract
        IERC721(nftContract).transferFrom(msg.sender, address(this), nftTokenId);

        // Create lottery
        lotteryId = totalLotteriesCreated++;

        uint256 expirationDate = block.timestamp + (durationInDays * 1 days);

        lotteries[lotteryId] = Lottery({
            id: lotteryId,
            owner: msg.sender,
            nftContract: nftContract,
            nftTokenId: nftTokenId,
            state: LotteryState.ACTIVE,
            createdAt: block.timestamp,
            expirationDate: expirationDate,
            wonkaBarPrice: wonkaBarPrice,
            wonkaBarsMaxSupply: wonkaBarsMaxSupply,
            wonkaBarsSold: 0,
            totalRaised: 0,
            winner: address(0),
            vrfRequestId: 0,
            nftName: nftName,
            nftImageUrl: nftImageUrl
        });

        // Track lottery
        ownerLotteries[msg.sender].add(lotteryId);
        activeLotteryIds.add(lotteryId);

        emit LotteryCreated(
            lotteryId,
            msg.sender,
            nftContract,
            nftTokenId,
            wonkaBarPrice,
            wonkaBarsMaxSupply,
            expirationDate
        );
    }

    /**
     * @notice Purchase WonkaBar lottery tickets
     * @param lotteryId ID of target lottery
     * @param amount Number of WonkaBars to purchase
     */
    function buyWonkaBars(uint256 lotteryId, uint256 amount) external payable whenNotPaused nonReentrant {
        Lottery storage lottery = lotteries[lotteryId];

        // Validation
        if (lottery.state != LotteryState.ACTIVE) revert LotteryNotActive();
        if (block.timestamp >= lottery.expirationDate) revert LotteryExpired();
        if (lottery.wonkaBarsSold + amount > lottery.wonkaBarsMaxSupply) revert ExceedsMaxSupply();

        uint256 totalCost = lottery.wonkaBarPrice * amount;
        if (msg.value != totalCost) revert InsufficientPayment();

        // Check max balance constraint
        uint256 userBalance = wonkaBarToken.balanceOf(msg.sender, lotteryId) + amount;
        uint256 maxAllowed = (lottery.wonkaBarsMaxSupply * maxBalancePercentage) / BASIS_POINTS;
        if (userBalance > maxAllowed) revert ExceedsMaxBalance();

        // Calculate fees: 95% to owner, 5% to DAO
        uint256 feeAmount = (totalCost * protocolFeePercentage) / BASIS_POINTS;
        uint256 ownerAmount = totalCost - feeAmount;

        // Effects
        lottery.wonkaBarsSold += amount;
        lottery.totalRaised += totalCost;
        totalFeesCollected += feeAmount;

        // Track participant
        if (!lotteryParticipants[lotteryId].contains(msg.sender)) {
            lotteryParticipants[lotteryId].add(msg.sender);
            participantLotteries[msg.sender].add(lotteryId);
        }

        // Calculate ChocoChip rewards based on XRP USD value (10% of USD value)
        uint256 chocoChipsEarned = _calculateChocoChipRewards(msg.value);

        // Interactions
        // Transfer XRP
        (bool ownerSuccess, ) = payable(lottery.owner).call{value: ownerAmount}("");
        if (!ownerSuccess) revert TransferFailed();

        (bool daoSuccess, ) = payable(daoTreasury).call{value: feeAmount}("");
        if (!daoSuccess) revert TransferFailed();

        // Mint WonkaBar tokens
        wonkaBarToken.mint(msg.sender, lotteryId, amount);

        // Mint ChocoChip rewards
        chocoChipToken.mint(msg.sender, chocoChipsEarned);

        emit WonkaBarsPurchased(lotteryId, msg.sender, amount, totalCost, chocoChipsEarned);
    }

    /**
     * @notice Repay loan early to reclaim NFT
     * @param lotteryId ID of lottery to repay
     */
    function repayLoan(uint256 lotteryId) external payable whenNotPaused nonReentrant {
        Lottery storage lottery = lotteries[lotteryId];

        // Validation
        if (lottery.owner != msg.sender) revert NotLotteryOwner();
        if (lottery.state != LotteryState.ACTIVE) revert LotteryNotActive();
        if (msg.value != lottery.totalRaised) revert IncorrectRepaymentAmount();

        // Effects
        lottery.state = LotteryState.CANCELLED;
        activeLotteryIds.remove(lotteryId);

        // Mint ChocoChips to owner as reward based on XRP USD value
        uint256 chocoChipsEarned = _calculateChocoChipRewards(msg.value);
        chocoChipToken.mint(msg.sender, chocoChipsEarned);

        // Interactions
        // Return NFT to owner
        IERC721(lottery.nftContract).transferFrom(address(this), msg.sender, lottery.nftTokenId);

        // XRP is held in contract for participant refunds via meltWonkaBars

        emit LoanRepaid(lotteryId, msg.sender, msg.value);
    }

    /**
     * @notice Conclude lottery and draw winner via pseudo-random generation
     * @param lotteryId ID of lottery to conclude
     */
    function drawWinner(uint256 lotteryId) external whenNotPaused {
        Lottery storage lottery = lotteries[lotteryId];

        // Validation
        if (lottery.state != LotteryState.ACTIVE) revert LotteryNotActive();

        bool isSoldOut = lottery.wonkaBarsSold >= lottery.wonkaBarsMaxSupply;
        bool isExpired = block.timestamp >= lottery.expirationDate;

        if (!isSoldOut && !isExpired) revert LotteryNotExpired();

        // Handle no sales case
        if (lottery.wonkaBarsSold == 0) {
            lottery.state = LotteryState.TRASHED;
            activeLotteryIds.remove(lotteryId);

            // Return NFT to owner
            IERC721(lottery.nftContract).transferFrom(address(this), lottery.owner, lottery.nftTokenId);

            emit LotteryResolved(lotteryId, address(0), LotteryState.TRASHED);
            return;
        }

        // Request pseudo-random number for winner selection
        // Note: This calls back synchronously, unlike VRF
        uint256 requestId = randomGenerator.requestRandomWords(lotteryId);
        lottery.vrfRequestId = requestId;
        vrfRequestToLottery[requestId] = lotteryId;

        // State will be updated to CONCLUDED in processVRFCallback (called synchronously)
    }

    /**
     * @notice Process callback with pseudo-random number
     * @param lotteryId Lottery ID
     * @param randomWord Random number from PseudoRandomGenerator
     * @dev Called by PseudoRandomGenerator contract
     */
    function processVRFCallback(uint256 lotteryId, uint256 randomWord) external {
        if (msg.sender != address(randomGenerator)) revert ZeroAddress();

        Lottery storage lottery = lotteries[lotteryId];

        // Select winner proportionally based on WonkaBar holdings
        address winner = selectWinner(lotteryId, randomWord);

        // Update lottery state
        lottery.state = LotteryState.CONCLUDED;
        lottery.winner = winner;
        activeLotteryIds.remove(lotteryId);

        emit LotteryResolved(lotteryId, winner, LotteryState.CONCLUDED);
    }

    /**
     * @notice Claim rewards by melting WonkaBar tokens
     * @param lotteryId ID of lottery
     * @param amount Number of WonkaBars to melt
     */
    function meltWonkaBars(uint256 lotteryId, uint256 amount) external nonReentrant {
        Lottery storage lottery = lotteries[lotteryId];

        // Validation
        if (lottery.state == LotteryState.ACTIVE) revert LotteryStillActive();
        if (wonkaBarToken.balanceOf(msg.sender, lotteryId) < amount) revert NoWonkaBarsToBurn();

        uint256 xrpRefund = 0;
        uint256 chocoChipsEarned = 0;
        bool wonNFT = false;

        // Calculate rewards based on lottery state
        if (lottery.state == LotteryState.CANCELLED) {
            // Refund XRP + ChocoChips (based on XRP USD value)
            xrpRefund = (lottery.wonkaBarPrice * amount);
            chocoChipsEarned = _calculateChocoChipRewards(xrpRefund);
        } else if (lottery.state == LotteryState.CONCLUDED) {
            // Winner gets NFT, all get ChocoChips
            if (lottery.winner == msg.sender && amount > 0) {
                wonNFT = true;
                // Transfer NFT to winner
                IERC721(lottery.nftContract).transferFrom(address(this), msg.sender, lottery.nftTokenId);
                lottery.winner = address(0); // Prevent double claim
            }
            // All participants get ChocoChips based on XRP USD value
            uint256 spentAmount = lottery.wonkaBarPrice * amount;
            chocoChipsEarned = _calculateChocoChipRewards(spentAmount);
        }

        // Burn WonkaBar tokens
        wonkaBarToken.burn(msg.sender, lotteryId, amount);

        // Mint ChocoChips if earned
        if (chocoChipsEarned > 0) {
            chocoChipToken.mint(msg.sender, chocoChipsEarned);
        }

        // Send XRP refund if applicable
        if (xrpRefund > 0) {
            (bool success, ) = payable(msg.sender).call{value: xrpRefund}("");
            if (!success) revert TransferFailed();
        }

        emit WonkaBarsMelted(lotteryId, msg.sender, amount, xrpRefund, chocoChipsEarned, wonNFT);
    }

    // ============ View Functions ============

    /**
     * @notice Get lottery details
     * @param lotteryId Lottery ID
     * @return Lottery struct
     */
    function getLottery(uint256 lotteryId) external view returns (Lottery memory) {
        return lotteries[lotteryId];
    }

    /**
     * @notice Get all active lottery IDs
     * @return Array of active lottery IDs
     */
    function getActiveLotteries() external view returns (uint256[] memory) {
        return activeLotteryIds.values();
    }

    /**
     * @notice Get lotteries owned by a user
     * @param user User address
     * @return Array of lottery IDs
     */
    function getUserLotteries(address user) external view returns (uint256[] memory) {
        return ownerLotteries[user].values();
    }

    /**
     * @notice Get lotteries user is participating in
     * @param user User address
     * @return Array of lottery IDs
     */
    function getUserParticipations(address user) external view returns (uint256[] memory) {
        return participantLotteries[user].values();
    }

    /**
     * @notice Get all participants in a lottery
     * @param lotteryId Lottery ID
     * @return Array of participant addresses
     */
    function getLotteryParticipants(uint256 lotteryId) external view returns (address[] memory) {
        return lotteryParticipants[lotteryId].values();
    }

    /**
     * @notice Calculate win probability for a user
     * @param user User address
     * @param lotteryId Lottery ID
     * @return Probability in basis points (10000 = 100%)
     */
    function calculateWinProbability(address user, uint256 lotteryId) external view returns (uint256) {
        Lottery storage lottery = lotteries[lotteryId];
        if (lottery.wonkaBarsSold == 0) return 0;

        uint256 userBalance = wonkaBarToken.balanceOf(user, lotteryId);
        return (userBalance * BASIS_POINTS) / lottery.wonkaBarsSold;
    }

    /**
     * @notice Get protocol statistics
     * @return totalLotteries Total lotteries created
     * @return activeLotteries Number of active lotteries
     * @return tvl Total value locked
     * @return feesCollected Total fees collected
     */
    function getProtocolStats()
        external
        view
        returns (
            uint256 totalLotteries,
            uint256 activeLotteries,
            uint256 tvl,
            uint256 feesCollected
        )
    {
        return (totalLotteriesCreated, activeLotteryIds.length(), totalValueLocked, totalFeesCollected);
    }

    // ============ Admin Functions ============

    /**
     * @notice Set protocol fee percentage
     * @param newFee New fee in basis points
     */
    function setProtocolFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = protocolFeePercentage;
        protocolFeePercentage = newFee;
        emit ProtocolParameterUpdated("protocolFeePercentage", oldFee, newFee);
    }

    /**
     * @notice Set maximum WonkaBars per lottery
     * @param newMax New maximum
     */
    function setMaxWonkaBars(uint256 newMax) external onlyOwner {
        uint256 oldMax = maxWonkaBarsPerLottery;
        maxWonkaBarsPerLottery = newMax;
        emit ProtocolParameterUpdated("maxWonkaBarsPerLottery", oldMax, newMax);
    }

    /**
     * @notice Set minimum WonkaBars per lottery
     * @param newMin New minimum
     */
    function setMinWonkaBars(uint256 newMin) external onlyOwner {
        uint256 oldMin = minWonkaBarsPerLottery;
        minWonkaBarsPerLottery = newMin;
        emit ProtocolParameterUpdated("minWonkaBarsPerLottery", oldMin, newMin);
    }

    /**
     * @notice Set maximum balance percentage
     * @param newPercentage New percentage in basis points
     */
    function setMaxBalancePercentage(uint256 newPercentage) external onlyOwner {
        uint256 oldPercentage = maxBalancePercentage;
        maxBalancePercentage = newPercentage;
        emit ProtocolParameterUpdated("maxBalancePercentage", oldPercentage, newPercentage);
    }

    /**
     * @notice Set ChocoChips reward percentage (10% = 1000 basis points)
     * @param newPercentage New percentage in basis points
     */
    function setChocoChipsRewardPercentage(uint256 newPercentage) external onlyOwner {
        uint256 oldPercentage = chocoChipsRewardPercentage;
        chocoChipsRewardPercentage = newPercentage;
        emit ProtocolParameterUpdated("chocoChipsRewardPercentage", oldPercentage, newPercentage);
    }

    /**
     * @notice Set DAO treasury address
     * @param newTreasury New treasury address
     */
    function setDaoTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        address oldTreasury = daoTreasury;
        daoTreasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Pause the protocol
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the protocol
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Internal Functions ============

    /**
     * @notice Authorize contract upgrade
     * @param newImplementation Address of new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice Calculate ChocoChip rewards based on XRP USD value
     * @param xrpAmount Amount of XRP (in wei) spent
     * @return chocoChipsAmount Amount of CHOC tokens to mint (10% of USD value)
     * @dev Formula: (XRP amount * XRP/USD price * 10%) / 1e18
     * Example: 10 XRP @ $2.50 = $25 USD -> 2.5 CHOC (with 18 decimals)
     */
    function _calculateChocoChipRewards(uint256 xrpAmount) internal view returns (uint256 chocoChipsAmount) {
        // Get XRP/USD price from Band Protocol oracle
        // Returns rate with 18 decimals (e.g., 2.5 USD = 2500000000000000000)
        IStdReference.ReferenceData memory data = priceOracle.getReferenceData("XRP", "USD");

        // Calculate USD value: (xrpAmount * xrpPrice) / 1e18
        uint256 usdValue = (xrpAmount * data.rate) / 1e18;

        // Calculate CHOC rewards: 10% of USD value
        // chocoChipsRewardPercentage = 1000 (10% in basis points)
        chocoChipsAmount = (usdValue * chocoChipsRewardPercentage) / BASIS_POINTS;

        return chocoChipsAmount;
    }

    /**
     * @notice Select winner based on proportional WonkaBar ownership
     * @param lotteryId Lottery ID
     * @param randomWord Random number from pseudo-RNG
     * @return winner Address of winner
     */
    function selectWinner(uint256 lotteryId, uint256 randomWord) internal view returns (address winner) {
        Lottery storage lottery = lotteries[lotteryId];
        address[] memory participants = lotteryParticipants[lotteryId].values();

        // Create cumulative distribution
        uint256[] memory cumulativeBalances = new uint256[](participants.length);
        uint256 cumulative = 0;

        for (uint256 i = 0; i < participants.length; i++) {
            uint256 balance = wonkaBarToken.balanceOf(participants[i], lotteryId);
            cumulative += balance;
            cumulativeBalances[i] = cumulative;
        }

        // Select winner using random number
        uint256 winningNumber = randomWord % lottery.wonkaBarsSold;

        for (uint256 i = 0; i < participants.length; i++) {
            if (winningNumber < cumulativeBalances[i]) {
                return participants[i];
            }
        }

        // Fallback (should never reach here)
        return participants[0];
    }
}
