// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Simple fixed-price ERC-1155 marketplace for the FillOut testnet.
/// Sellers escrow Quote or Settle units; buyers purchase any quantity from a listing.
contract FillOutMarket is IERC1155Receiver, Ownable, ReentrancyGuard {
    IERC1155 public immutable parts;
    address payable public immutable treasury;
    uint16 public immutable feeBps;

    struct Listing {
        address seller;
        uint256 partId;
        uint256 remaining;
        uint256 pricePerUnit;
        bool active;
    }

    uint256 public nextListingId;
    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed listingId, address indexed seller, uint256 indexed partId, uint256 amount, uint256 pricePerUnit);
    event Purchased(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 total, uint256 fee);
    event Cancelled(uint256 indexed listingId, address indexed seller, uint256 amount);

    constructor(IERC1155 parts_, address payable treasury_, uint16 feeBps_, address owner_)
        Ownable(owner_)
    {
        require(address(parts_) != address(0) && treasury_ != address(0), "bad config");
        require(feeBps_ <= 1000, "fee too high");
        parts = parts_;
        treasury = treasury_;
        feeBps = feeBps_;
    }

    function createListing(uint256 partId, uint256 amount, uint256 pricePerUnit)
        external
        nonReentrant
        returns (uint256 listingId)
    {
        require((partId == 0 || partId == 1) && amount > 0 && pricePerUnit > 0, "bad listing");
        listingId = nextListingId++;
        listings[listingId] = Listing(msg.sender, partId, amount, pricePerUnit, true);
        parts.safeTransferFrom(msg.sender, address(this), partId, amount, "");
        emit Listed(listingId, msg.sender, partId, amount, pricePerUnit);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active && listing.seller == msg.sender, "not seller");
        uint256 amount = listing.remaining;
        listing.remaining = 0;
        listing.active = false;
        parts.safeTransferFrom(address(this), msg.sender, listing.partId, amount, "");
        emit Cancelled(listingId, msg.sender, amount);
    }

    function buy(uint256 listingId, uint256 amount) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active && amount > 0 && amount <= listing.remaining, "bad purchase");
        uint256 total = listing.pricePerUnit * amount;
        require(msg.value == total, "wrong value");
        listing.remaining -= amount;
        if (listing.remaining == 0) listing.active = false;
        uint256 fee = total * feeBps / 10000;
        (bool feeSent,) = treasury.call{value: fee}("");
        require(feeSent, "fee failed");
        (bool sellerSent,) = payable(listing.seller).call{value: total - fee}("");
        require(sellerSent, "seller payment failed");
        parts.safeTransferFrom(address(this), msg.sender, listing.partId, amount, "");
        emit Purchased(listingId, msg.sender, amount, total, fee);
    }

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }
    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId;
    }
}
