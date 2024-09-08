// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BasicNFT is ERC721, Ownable {
    uint256 public tokenCounter;

    constructor() ERC721("BasicNFT", "BNFT") Ownable(msg.sender) {
        tokenCounter = 0;
    }

    // Function to mint a new NFT
    function mintNFT() public {
        _safeMint(msg.sender, tokenCounter);
        tokenCounter += 1;
    }
}
