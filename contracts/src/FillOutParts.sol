// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Quote (id 0) and Settle (id 1) are the two FillOut building blocks.
contract FillOutParts is ERC1155, Ownable {
    uint256 public constant QUOTE = 0;
    uint256 public constant SETTLE = 1;
    uint256 public immutable quoteCap;
    uint256 public immutable settleCap;
    uint256 public quoteMinted;
    uint256 public settleMinted;

    constructor(uint256 quoteCap_, uint256 settleCap_, string memory uri_, address owner_)
        ERC1155(uri_)
        Ownable(owner_)
    {
        require(quoteCap_ > 0 && settleCap_ > 0, "zero cap");
        quoteCap = quoteCap_;
        settleCap = settleCap_;
    }

    function mint(address to, uint256 id, uint256 amount) external onlyOwner {
        require(id == QUOTE || id == SETTLE, "unknown part");
        if (id == QUOTE) { require(quoteMinted + amount <= quoteCap, "quote cap"); quoteMinted += amount; }
        else { require(settleMinted + amount <= settleCap, "settle cap"); settleMinted += amount; }
        _mint(to, id, amount, "");
    }
}
