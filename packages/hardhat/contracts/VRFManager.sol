// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/**
 * @title VRFManager
 * @notice Manages Chainlink VRF v2.5 randomness requests for MeltyFi lotteries
 * @dev Handles random number generation for fair winner selection
 *
 * Key Features:
 * - Chainlink VRF v2.5 integration for verifiable randomness
 * - Request tracking and status management
 * - Callback to MeltyFiProtocol with random numbers
 * - Configurable VRF parameters
 */
contract VRFManager is VRFConsumerBaseV2Plus {
    // ============ Structs ============

    struct VRFConfig {
        bytes32 keyHash; // Gas lane key hash
        uint256 subscriptionId; // Chainlink subscription ID
        uint32 callbackGasLimit; // Gas limit for callback
        uint16 requestConfirmations; // Number of block confirmations
        uint32 numWords; // Number of random words
    }

    struct RequestStatus {
        bool fulfilled; // Whether request is fulfilled
        bool exists; // Whether request exists
        uint256[] randomWords; // Random words received
        uint256 lotteryId; // Associated lottery ID
    }

    // ============ State Variables ============

    /// @notice VRF configuration parameters
    VRFConfig public vrfConfig;

    /// @notice Address of the MeltyFi protocol contract
    address public meltyFiProtocol;

    /// @notice Mapping of request ID to status
    mapping(uint256 => RequestStatus) public requests;

    /// @notice Mapping of lottery ID to request ID
    mapping(uint256 => uint256) public lotteryToRequest;

    /// @notice Array of all request IDs
    uint256[] public requestIds;

    /// @notice Last request ID
    uint256 public lastRequestId;

    // ============ Events ============

    event RandomnessRequested(
        uint256 indexed requestId,
        uint256 indexed lotteryId,
        uint256 subscriptionId,
        uint32 numWords
    );

    event RandomnessFulfilled(uint256 indexed requestId, uint256 indexed lotteryId, uint256[] randomWords);

    event VRFConfigUpdated(
        bytes32 keyHash,
        uint256 subscriptionId,
        uint32 callbackGasLimit,
        uint16 requestConfirmations,
        uint32 numWords
    );

    event ProtocolAddressUpdated(address indexed oldProtocol, address indexed newProtocol);

    // ============ Errors ============

    error OnlyMeltyFiProtocol();
    error RequestNotFound();
    error RequestAlreadyFulfilled();
    error InvalidConfig();

    // ============ Modifiers ============

    modifier onlyMeltyFiProtocol() {
        if (msg.sender != meltyFiProtocol) revert OnlyMeltyFiProtocol();
        _;
    }

    // ============ Initializer ============

    constructor(address vrfCoordinator, VRFConfig memory _vrfConfig) VRFConsumerBaseV2Plus(vrfCoordinator) {
        if (_vrfConfig.keyHash == bytes32(0)) revert InvalidConfig();
        if (_vrfConfig.subscriptionId == 0) revert InvalidConfig();

        vrfConfig = _vrfConfig;
    }

    // ============ External Functions ============

    /**
     * @notice Set the MeltyFi protocol contract address
     * @param protocol Address of the MeltyFiProtocol contract
     * @dev Only callable by owner (Chainlink owner)
     */
    function setMeltyFiProtocol(address protocol) external onlyOwner {
        require(protocol != address(0), "Zero address");

        address oldProtocol = meltyFiProtocol;
        meltyFiProtocol = protocol;

        emit ProtocolAddressUpdated(oldProtocol, protocol);
    }

    /**
     * @notice Request random words from Chainlink VRF
     * @param lotteryId ID of the lottery requesting randomness
     * @return requestId The VRF request ID
     * @dev Only callable by MeltyFiProtocol
     */
    function requestRandomWords(uint256 lotteryId) external onlyMeltyFiProtocol returns (uint256 requestId) {
        // Request random words from VRF coordinator
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: vrfConfig.keyHash,
                subId: vrfConfig.subscriptionId,
                requestConfirmations: vrfConfig.requestConfirmations,
                callbackGasLimit: vrfConfig.callbackGasLimit,
                numWords: vrfConfig.numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
            })
        );

        // Store request status
        requests[requestId] = RequestStatus({
            fulfilled: false,
            exists: true,
            randomWords: new uint256[](0),
            lotteryId: lotteryId
        });

        // Map lottery to request
        lotteryToRequest[lotteryId] = requestId;

        // Track request ID
        requestIds.push(requestId);
        lastRequestId = requestId;

        emit RandomnessRequested(requestId, lotteryId, vrfConfig.subscriptionId, vrfConfig.numWords);

        return requestId;
    }

    /**
     * @notice Update VRF configuration
     * @param newConfig New VRF configuration
     * @dev Only callable by owner (Chainlink owner)
     */
    function updateVRFConfig(VRFConfig memory newConfig) external onlyOwner {
        require(newConfig.keyHash != bytes32(0), "Invalid key hash");
        require(newConfig.subscriptionId != 0, "Invalid subscription");

        vrfConfig = newConfig;

        emit VRFConfigUpdated(
            newConfig.keyHash,
            newConfig.subscriptionId,
            newConfig.callbackGasLimit,
            newConfig.requestConfirmations,
            newConfig.numWords
        );
    }

    /**
     * @notice Get request status
     * @param requestId VRF request ID
     * @return fulfilled Whether request is fulfilled
     * @return randomWords Random words received
     * @return lotteryId Associated lottery ID
     */
    function getRequestStatus(uint256 requestId)
        external
        view
        returns (
            bool fulfilled,
            uint256[] memory randomWords,
            uint256 lotteryId
        )
    {
        if (!requests[requestId].exists) revert RequestNotFound();

        RequestStatus memory request = requests[requestId];
        return (request.fulfilled, request.randomWords, request.lotteryId);
    }

    // ============ Internal Functions ============

    /**
     * @notice Callback function called by VRF Coordinator
     * @param requestId VRF request ID
     * @param randomWords Array of random words
     * @dev This is called by Chainlink VRF when randomness is ready
     */
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        if (!requests[requestId].exists) revert RequestNotFound();
        if (requests[requestId].fulfilled) revert RequestAlreadyFulfilled();

        // Update request status
        requests[requestId].fulfilled = true;
        requests[requestId].randomWords = randomWords;

        uint256 lotteryId = requests[requestId].lotteryId;

        emit RandomnessFulfilled(requestId, lotteryId, randomWords);

        // Call back to MeltyFiProtocol with the random number
        (bool success, ) = meltyFiProtocol.call(
            abi.encodeWithSignature("processVRFCallback(uint256,uint256)", lotteryId, randomWords[0])
        );

        // Note: We don't revert on failure to avoid blocking VRF callback
        // The protocol should have error handling for failed callbacks
        require(success, "Protocol callback failed");
    }
}
