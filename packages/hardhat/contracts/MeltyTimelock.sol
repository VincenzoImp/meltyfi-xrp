// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title MeltyTimelock
 * @notice Timelock controller for MeltyFi governance
 * @dev Implements time-delayed execution for governance proposals
 *
 * Key Features:
 * - 48-hour minimum delay for all governance actions
 * - Multi-signature capability for emergency actions
 * - Proposer role: MeltyDAO contract
 * - Executor role: MeltyDAO + emergency multi-sig
 * - Canceller role: Emergency multi-sig only
 */
contract MeltyTimelock is Initializable, TimelockControllerUpgradeable, UUPSUpgradeable {
    // ============ Constants ============

    /// @notice Minimum delay for governance actions (48 hours)
    uint256 public constant MIN_DELAY = 48 hours;

    // ============ Initializer ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the Timelock Controller
     * @param admin Address that will have admin role initially (should be renounced after setup)
     * @param proposers Array of addresses that can propose (MeltyDAO)
     * @param executors Array of addresses that can execute (MeltyDAO + multi-sig)
     * @param cancellers Array of addresses that can cancel (emergency multi-sig)
     */
    function initialize(
        address admin,
        address[] memory proposers,
        address[] memory executors,
        address[] memory cancellers
    ) external initializer {
        __TimelockController_init(MIN_DELAY, proposers, executors, admin);
        __UUPSUpgradeable_init();

        // Grant CANCELLER_ROLE to specified addresses
        for (uint256 i = 0; i < cancellers.length; i++) {
            _grantRole(CANCELLER_ROLE, cancellers[i]);
        }
    }

    // ============ Internal Functions ============

    /**
     * @notice Authorize contract upgrade
     * @param newImplementation Address of new implementation
     * @dev Only callable by timelock itself (via governance proposal)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
