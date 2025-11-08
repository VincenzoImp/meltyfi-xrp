// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title ChocoChip
 * @notice ERC-20 governance token for MeltyFi protocol
 * @dev Implements voting and burning capabilities
 *
 * Key Features:
 * - Voting power for DAO governance (via ERC20Votes)
 * - Permit for gasless approvals
 * - Burnable tokens
 * - Max supply cap of 1 billion tokens
 * - Authorized minter pattern for protocol distribution
 */
contract ChocoChip is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // ============ Constants ============

    /// @notice Maximum supply of ChocoChip tokens (1 billion)
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;

    // ============ State Variables ============

    /// @notice Total tokens minted so far
    uint256 public totalMinted;

    /// @notice Mapping of authorized minter addresses
    mapping(address => bool) public authorizedMinters;

    // ============ Events ============

    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    event TokensMinted(address indexed to, uint256 amount, address indexed minter);

    // ============ Errors ============

    error NotAuthorizedMinter();
    error MaxSupplyExceeded();
    error ZeroAddress();
    error ZeroAmount();

    // ============ Modifiers ============

    modifier onlyAuthorizedMinter() {
        if (!authorizedMinters[msg.sender]) revert NotAuthorizedMinter();
        _;
    }

    // ============ Initializer ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the ChocoChip token
     * @param initialOwner Address of the initial owner (DAO/timelock)
     */
    function initialize(address initialOwner) external initializer {
        if (initialOwner == address(0)) revert ZeroAddress();

        __ERC20_init("ChocoChip", "CHOC");
        __ERC20Burnable_init();
        __ERC20Permit_init("ChocoChip");
        __ERC20Votes_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();

        totalMinted = 0;
    }

    // ============ External Functions ============

    /**
     * @notice Mint new ChocoChip tokens
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint
     * @dev Only callable by authorized minters (MeltyFiProtocol)
     */
    function mint(address to, uint256 amount) external onlyAuthorizedMinter {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (totalMinted + amount > MAX_SUPPLY) revert MaxSupplyExceeded();

        totalMinted += amount;
        _mint(to, amount);

        emit TokensMinted(to, amount, msg.sender);
    }

    /**
     * @notice Authorize a new minter address
     * @param minter Address to authorize
     * @dev Only callable by owner (DAO)
     */
    function authorizeMinter(address minter) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();

        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    /**
     * @notice Revoke minter authorization
     * @param minter Address to revoke
     * @dev Only callable by owner (DAO)
     */
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }

    // ============ Internal Functions ============

    /**
     * @notice Authorize contract upgrade
     * @param newImplementation Address of new implementation
     * @dev Only callable by owner (DAO via timelock)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice Hook called before any token transfer
     * @dev Overrides required by Solidity for multiple inheritance
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._update(from, to, value);
    }

    /**
     * @notice Get current nonce for permit
     * @dev Overrides required by Solidity for multiple inheritance
     */
    function nonces(address owner)
        public
        view
        override(ERC20PermitUpgradeable, NoncesUpgradeable)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
