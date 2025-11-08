// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title MeltyDAO
 * @notice Governance contract for MeltyFi protocol
 * @dev OpenZeppelin Governor implementation with timelock control
 *
 * Key Features:
 * - ChocoChip token-based voting power
 * - 1 block voting delay
 * - ~7 day voting period (50,400 blocks)
 * - 100k CHOC proposal threshold
 * - 4% quorum requirement
 * - 48-hour timelock for execution
 * - Upgradeable via UUPS pattern
 */
contract MeltyDAO is
    Initializable,
    GovernorUpgradeable,
    GovernorSettingsUpgradeable,
    GovernorCountingSimpleUpgradeable,
    GovernorVotesUpgradeable,
    GovernorVotesQuorumFractionUpgradeable,
    GovernorTimelockControlUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // ============ Constants ============

    /// @notice Voting delay in blocks (1 block)
    uint48 private constant VOTING_DELAY = 1;

    /// @notice Voting period in blocks (~7 days at 12s/block)
    uint32 private constant VOTING_PERIOD = 50_400;

    /// @notice Proposal threshold (100,000 CHOC tokens)
    uint256 private constant PROPOSAL_THRESHOLD = 100_000 * 10**18;

    /// @notice Quorum percentage (4% of total supply)
    uint256 private constant QUORUM_PERCENTAGE = 4;

    // ============ Initializer ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the MeltyDAO Governor
     * @param chocoChipToken Address of ChocoChip governance token
     * @param timelock Address of TimelockController
     * @param initialOwner Address of initial owner (for upgrades)
     */
    function initialize(
        address chocoChipToken,
        address timelock,
        address initialOwner
    ) external initializer {
        require(chocoChipToken != address(0), "Invalid token address");
        require(timelock != address(0), "Invalid timelock address");
        require(initialOwner != address(0), "Invalid owner address");

        __Governor_init("MeltyDAO");
        __GovernorSettings_init(VOTING_DELAY, VOTING_PERIOD, PROPOSAL_THRESHOLD);
        __GovernorCountingSimple_init();
        __GovernorVotes_init(IVotes(chocoChipToken));
        __GovernorVotesQuorumFraction_init(QUORUM_PERCENTAGE);
        __GovernorTimelockControl_init(TimelockControllerUpgradeable(payable(timelock)));
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    // ============ Overrides Required by Solidity ============

    /**
     * @notice Get voting delay
     */
    function votingDelay()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingDelay();
    }

    /**
     * @notice Get voting period
     */
    function votingPeriod()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    /**
     * @notice Get quorum for a specific block
     */
    function quorum(uint256 blockNumber)
        public
        view
        override(GovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    /**
     * @notice Get proposal state
     */
    function state(uint256 proposalId)
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    /**
     * @notice Check if proposal needs queuing
     */
    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    /**
     * @notice Get proposal threshold
     */
    function proposalThreshold()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    /**
     * @notice Internal propose function
     */
    function _propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        address proposer
    ) internal override(GovernorUpgradeable) returns (uint256) {
        return super._propose(targets, values, calldatas, description, proposer);
    }

    /**
     * @notice Internal queue operations
     */
    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @notice Internal execute operations
     */
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @notice Internal cancel operations
     */
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    /**
     * @notice Get executor (timelock)
     */
    function _executor()
        internal
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (address)
    {
        return super._executor();
    }

    // ============ Internal Functions ============

    /**
     * @notice Authorize contract upgrade
     * @param newImplementation Address of new implementation
     * @dev Only callable by owner (timelock via governance)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
