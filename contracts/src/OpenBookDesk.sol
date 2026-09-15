// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {FillOutParts} from "./FillOutParts.sol";

/// @notice Testnet Desk: fixed 0.0002 ETH part price and explicit fee routing.
contract OpenBookDesk is Ownable, ReentrancyGuard {
    FillOutParts public immutable parts;
    address payable public immutable treasury;
    uint256 public immutable unitPrice;
    uint256 public immutable quoteCap;
    uint256 public immutable settleCap;

    event PartsPurchased(address indexed buyer, uint256 indexed partId, uint256 amount, uint256 networkEquivalentFee, uint256 platformFee);

    constructor(FillOutParts parts_, address payable treasury_, uint256 unitPrice_, uint256 quoteCap_, uint256 settleCap_, address owner_)
        Ownable(owner_)
    {
        require(address(parts_) != address(0) && treasury_ != address(0) && unitPrice_ > 0, "bad config");
        parts = parts_; treasury = treasury_; unitPrice = unitPrice_; quoteCap = quoteCap_; settleCap = settleCap_;
    }

    /// @dev `platformFee` is supplied by the frontend from the live gas estimate and equals that estimate.
    function buy(uint256 partId, uint256 amount, uint256 platformFee) external payable nonReentrant {
        require(partId < 2 && amount > 0, "bad order");
        uint256 partsValue = unitPrice * amount;
        require(msg.value == partsValue + platformFee, "wrong value");
        parts.mint(msg.sender, partId, amount);
        if (platformFee > 0) {
            (bool sent, ) = treasury.call{value: platformFee}("");
            require(sent, "platform fee failed");
        }
        emit PartsPurchased(msg.sender, partId, amount, platformFee, platformFee);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool sent, ) = treasury.call{value: balance}("");
            require(sent, "withdraw failed");
        }
    }
}
