// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title PseudoRandomGenerator
 * @notice Simple pseudo-random number generator for MeltyFi lotteries on XRP EVM
 * @dev NOT cryptographically secure - suitable for low-stakes lotteries only
 *
 * IMPORTANT: This is a pseudo-random solution since Chainlink VRF is not available
 * on XRP EVM sidechain. It combines multiple sources of entropy to make manipulation
 * more difficult:
 * - Block difficulty/prevrandao (post-merge)
 * - Block timestamp
 * - Block number
 * - Msg.sender
 * - Lottery-specific salt
 *
 * While not truly random, it provides reasonable unpredictability for NFT lotteries
 * where the value at stake is moderate and manipulation cost would exceed potential gain.
 */
contract PseudoRandomGenerator is OwnableUpgradeable, UUPSUpgradeable {
    // ============ State Variables ============

    /// @notice Address of the MeltyFi Protocol contract
    address public meltyFiProtocol;

    /// @notice Nonce for additional entropy
    uint256 private nonce;

    // ============ Events ============

    event RandomnessRequested(uint256 indexed lotteryId, uint256 indexed requestId);
    event RandomnessFulfilled(uint256 indexed lotteryId, uint256 randomNumber);

    // ============ Errors ============

    error UnauthorizedCaller();
    error InvalidLotteryId();

    // ============ Modifiers ============

    modifier onlyMeltyFiProtocol() {
        if (msg.sender != meltyFiProtocol) revert UnauthorizedCaller();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ============ Initialization ============

    /**
     * @notice Initialize the PseudoRandomGenerator
     * @param _owner Owner address
     * @param _meltyFiProtocol MeltyFi Protocol address
     */
    function initialize(address _owner, address _meltyFiProtocol) public initializer {
        __Ownable_init(_owner);
        meltyFiProtocol = _meltyFiProtocol;
        nonce = 0;
    }

    // ============ External Functions ============

    /**
     * @notice Request a pseudo-random number for a lottery
     * @param lotteryId The lottery ID
     * @return requestId A pseudo request ID (same as lotteryId for compatibility)
     * @dev Called by MeltyFiProtocol when concluding a lottery
     */
    function requestRandomWords(uint256 lotteryId) external onlyMeltyFiProtocol returns (uint256 requestId) {
        if (lotteryId == 0) revert InvalidLotteryId();

        // Use lotteryId as requestId for simplicity
        requestId = lotteryId;

        // Increment nonce for additional entropy
        nonce++;

        emit RandomnessRequested(lotteryId, requestId);

        // Generate pseudo-random number immediately
        uint256 randomNumber = _generatePseudoRandom(lotteryId);

        // Call back to MeltyFiProtocol immediately (synchronous)
        // This mimics VRF callback pattern but happens in same transaction
        (bool success, ) = meltyFiProtocol.call(
            abi.encodeWithSignature("processVRFCallback(uint256,uint256)", lotteryId, randomNumber)
        );

        // Don't revert on callback failure to match VRF behavior
        if (success) {
            emit RandomnessFulfilled(lotteryId, randomNumber);
        }

        return requestId;
    }

    // ============ Internal Functions ============

    /**
     * @notice Generate a pseudo-random number
     * @param lotteryId The lottery ID to use as salt
     * @return A pseudo-random uint256 number
     * @dev Combines multiple sources of entropy
     */
    function _generatePseudoRandom(uint256 lotteryId) internal view returns (uint256) {
        // Combine multiple sources of entropy
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.prevrandao, // Post-merge randomness (or difficulty pre-merge)
                        block.timestamp,
                        block.number,
                        msg.sender,
                        lotteryId,
                        nonce,
                        blockhash(block.number - 1) // Previous block hash
                    )
                )
            );
    }

    // ============ Admin Functions ============

    /**
     * @notice Update MeltyFi Protocol address
     * @param newProtocol New MeltyFi Protocol address
     */
    function updateMeltyFiProtocol(address newProtocol) external onlyOwner {
        require(newProtocol != address(0), "Invalid address");
        meltyFiProtocol = newProtocol;
    }

    /**
     * @notice Get current nonce value
     * @return Current nonce
     */
    function getNonce() external view returns (uint256) {
        return nonce;
    }

    /**
     * @notice Authorize contract upgrade (UUPS pattern)
     * @param newImplementation Address of new implementation
     * @dev Only owner can upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
