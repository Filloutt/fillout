// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FillOutCircuits.sol";

/// @notice Noncustodial listings: assets remain transferable until settlement.
contract FillOutMarket is ReentrancyGuard {
    FillOutParts public immutable parts;
    FillOutCircuits public immutable circuits;
    AgentGate public immutable gate;
    address payable public immutable feeRecipient;
    uint256 public nextListing;
    struct Listing { address seller; bool circuit; uint256 tokenId; uint256 amount; uint256 unitWei; uint256 deadline; }
    mapping(uint256 => Listing) public listings;
    event Listed(uint256 indexed listingId, address indexed seller, bool circuit, uint256 tokenId, uint256 amount, uint256 unitWei, uint256 deadline);
    event Cancelled(uint256 indexed listingId);
    event Filled(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 value, uint256 fee);
    constructor(address parts_, address circuits_, address payable feeRecipient_) {
        parts = FillOutParts(parts_); circuits = FillOutCircuits(circuits_); gate = parts.gate();
        require(address(circuits.parts()) == parts_ && feeRecipient_ != address(0), "invalid setup"); feeRecipient = feeRecipient_;
    }
    function list(bool circuit, uint256 tokenId, uint256 amount, uint256 unitWei, uint256 deadline, FillOutParts.Permit calldata p) external nonReentrant returns (uint256 id) {
        require(amount > 0 && unitWei > 0 && deadline > block.timestamp, "invalid listing");
        if (circuit) require(amount == 1 && circuits.ownerOf(tokenId) == msg.sender, "invalid NFT");
        else require(tokenId < 2 && parts.balanceOf(msg.sender, tokenId) >= amount, "invalid parts");
        gate.consume(msg.sender, p.agentId, keccak256(abi.encode("LIST", circuit, tokenId, amount, unitWei, deadline)), p.nonce, p.deadline, p.signature);
        id = ++nextListing; listings[id] = Listing(msg.sender, circuit, tokenId, amount, unitWei, deadline);
        emit Listed(id, msg.sender, circuit, tokenId, amount, unitWei, deadline);
    }
    function cancel(uint256 id) external { require(listings[id].seller == msg.sender, "not seller"); delete listings[id]; emit Cancelled(id); }
    function buy(uint256 id, uint256 amount, FillOutParts.Permit calldata p) external payable nonReentrant {
        Listing memory l = listings[id];
        require(l.seller != address(0) && l.seller != msg.sender && block.timestamp <= l.deadline && amount > 0 && amount <= l.amount, "unavailable");
        require(msg.value == amount * l.unitWei, "exact ETH required");
        gate.consume(msg.sender, p.agentId, keccak256(abi.encode("FILL", id, amount, l.unitWei, l.seller)), p.nonce, p.deadline, p.signature);
        listings[id].amount -= amount; if (listings[id].amount == 0) delete listings[id];
        if (l.circuit) circuits.safeTransferFrom(l.seller, msg.sender, l.tokenId);
        else parts.safeTransferFrom(l.seller, msg.sender, l.tokenId, amount, "");
        uint256 fee = msg.value / 100;
        (bool a,) = feeRecipient.call{value:fee}(""); require(a, "fee payout");
        (bool b,) = payable(l.seller).call{value:msg.value-fee}(""); require(b, "seller payout");
        emit Filled(id, msg.sender, amount, msg.value, fee);
    }
}
