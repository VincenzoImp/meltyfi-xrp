// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title WonkaBar
 * @notice ERC-1155 multi-token contract for MeltyFi lottery tickets
 * @dev Each lottery ID corresponds to a unique token ID
 *
 * Key Features:
 * - Each lottery has its own fungible ticket tokens
 * - Tickets from different lotteries are non-fungible with each other
 * - Burnable tokens for claiming rewards
 * - Dynamic metadata per lottery
 * - Only MeltyFiProtocol can mint/burn tokens
 */
contract WonkaBar is
    Initializable,
    ERC1155Upgradeable,
    ERC1155BurnableUpgradeable,
    ERC1155SupplyUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // ============ State Variables ============

    /// @notice Address of the MeltyFi protocol contract (only authorized minter/burner)
    address public meltyFiProtocol;

    /// @notice Mapping of lottery ID to custom URI
    mapping(uint256 => string) private _tokenURIs;

    /// @notice Base URI for all tokens
    string private _baseURI;

    // ============ Events ============

    event ProtocolAddressUpdated(address indexed oldProtocol, address indexed newProtocol);
    event TokenURIUpdated(uint256 indexed lotteryId, string newURI);
    event BaseURIUpdated(string newBaseURI);

    // ============ Errors ============

    error OnlyMeltyFiProtocol();
    error ZeroAddress();
    error ZeroAmount();

    // ============ Modifiers ============

    modifier onlyMeltyFiProtocol() {
        if (msg.sender != meltyFiProtocol) revert OnlyMeltyFiProtocol();
        _;
    }

    // ============ Initializer ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the WonkaBar token
     * @param initialOwner Address of the initial owner (DAO/timelock)
     * @param baseURI_ Base URI for token metadata
     */
    function initialize(address initialOwner, string memory baseURI_) external initializer {
        if (initialOwner == address(0)) revert ZeroAddress();

        __ERC1155_init(baseURI_);
        __ERC1155Burnable_init();
        __ERC1155Supply_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();

        _baseURI = baseURI_;
    }

    // ============ External Functions ============

    /**
     * @notice Set the MeltyFi protocol contract address
     * @param protocol Address of the MeltyFiProtocol contract
     * @dev Only callable by owner (DAO)
     */
    function setMeltyFiProtocol(address protocol) external onlyOwner {
        if (protocol == address(0)) revert ZeroAddress();

        address oldProtocol = meltyFiProtocol;
        meltyFiProtocol = protocol;

        emit ProtocolAddressUpdated(oldProtocol, protocol);
    }

    /**
     * @notice Mint WonkaBar tokens for a lottery
     * @param to Address to receive the tokens
     * @param lotteryId Lottery ID (used as token ID)
     * @param amount Number of tokens to mint
     * @dev Only callable by MeltyFiProtocol
     */
    function mint(address to, uint256 lotteryId, uint256 amount) external onlyMeltyFiProtocol {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        _mint(to, lotteryId, amount, "");
    }

    /**
     * @notice Burn WonkaBar tokens
     * @param from Address to burn from
     * @param lotteryId Lottery ID (token ID)
     * @param amount Number of tokens to burn
     * @dev Only callable by MeltyFiProtocol (overrides ERC1155Burnable public burn)
     */
    function burn(address from, uint256 lotteryId, uint256 amount) public override onlyMeltyFiProtocol {
        if (amount == 0) revert ZeroAmount();

        _burn(from, lotteryId, amount);
    }

    /**
     * @notice Set custom URI for a specific lottery token
     * @param lotteryId Lottery ID (token ID)
     * @param newuri New URI for the token
     * @dev Only callable by MeltyFiProtocol
     */
    function setTokenURI(uint256 lotteryId, string memory newuri) external onlyMeltyFiProtocol {
        _tokenURIs[lotteryId] = newuri;
        emit TokenURIUpdated(lotteryId, newuri);
    }

    /**
     * @notice Set base URI for all tokens
     * @param newBaseURI New base URI
     * @dev Only callable by owner (DAO)
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @notice Get URI for a specific token
     * @param lotteryId Lottery ID (token ID)
     * @return Token URI
     */
    function uri(uint256 lotteryId) public view override returns (string memory) {
        string memory tokenURI = _tokenURIs[lotteryId];

        // If token has custom URI, return it
        if (bytes(tokenURI).length > 0) {
            return tokenURI;
        }

        // Otherwise, return base URI + token ID
        return string(abi.encodePacked(_baseURI, _toString(lotteryId)));
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
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable) {
        super._update(from, to, ids, values);
    }

    /**
     * @notice Convert uint256 to string
     * @param value Number to convert
     * @return String representation
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
