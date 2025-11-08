// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MockERC721
 * @notice Mock ERC721 contract for testing purposes
 */
contract MockERC721 is ERC721 {
    constructor() ERC721("MockNFT", "MNFT") {}

    /**
     * @notice Mint a new NFT
     * @param to Recipient address
     * @param tokenId Token ID to mint
     */
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
