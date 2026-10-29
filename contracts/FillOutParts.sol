// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "./AgentGate.sol";
import "./FillOutMetadata.sol";
interface IAssemblyReadiness { function rewardToken() external view returns (address); }

/// @notice Fungible Quote (0) and Settle (1). Free and paid parts are identical.
contract FillOutParts is ERC1155, ReentrancyGuard, EIP712 {
    AgentGate public immutable gate;
    address public immutable creator;
    address public immutable team;
    address payable public immutable liquidity;
    address payable public immutable platform;
    address public immutable priceSigner;
    address public assembler;
    uint256 public openedAt;
    uint256 public soldOutAt;
    uint256 public quoteIssued = 1000;
    uint256 public settleIssued = 250;
    uint256 public freeClaims;
    mapping(bytes32 => bool) public claimedAgent;
    mapping(address => bool) public claimedWallet;
    bytes32 public constant PRICE_TYPEHASH = keccak256("Price(address account,uint256 quote,uint256 settle,uint256 unitWei,uint256 nonce,uint256 deadline)");
    struct Permit { bytes32 agentId; uint256 nonce; uint256 deadline; bytes signature; }
    struct Price { uint256 unitWei; uint256 nonce; uint256 deadline; bytes signature; }
    event Started(uint256 openedAt, uint256 deadline);
    event AssemblerBound(address indexed assembler);
    event Purchased(address indexed buyer, uint256 quote, uint256 settle, uint256 value, uint256 liquidityAmount, uint256 platformAmount);
    event StarterClaimed(address indexed buyer, bytes32 indexed agentId);
    event SoldOut(uint256 timestamp);
    constructor(address gate_, address creator_, address team_, address payable liquidity_, address payable platform_, address priceSigner_, string memory uri_)
        ERC1155(uri_) EIP712("FillOut ETH Price", "1") {
        require(gate_.code.length > 0 && creator_ != address(0) && team_ != address(0) && liquidity_ != address(0) && platform_ != address(0) && priceSigner_ != address(0), "invalid setup");
        gate = AgentGate(gate_); creator = creator_; team = team_; liquidity = liquidity_; platform = platform_; priceSigner = priceSigner_;
        _mint(team_, 0, 1000, ""); _mint(team_, 1, 250, "");
    }
    function bindAssembler(address candidate) external {
        require(msg.sender == creator && assembler == address(0) && candidate.code.length > 0 && openedAt == 0, "bind denied");
        assembler = candidate; emit AssemblerBound(candidate);
    }
    function uri(uint256 id) public view override returns (string memory) {
        require(id < 2, "unknown part");
        string memory configured = super.uri(id);
        return bytes(configured).length == 0 ? FillOutMetadata.part(id) : configured;
    }
    function start(uint256 timestamp) external {
        require(msg.sender == creator && openedAt == 0 && assembler != address(0) && timestamp >= block.timestamp, "start denied");
        require(IAssemblyReadiness(assembler).rewardToken() != address(0), "mining not funded");
        openedAt = timestamp; emit Started(timestamp, timestamp + 7 days);
    }
    function closesAt() public view returns (uint256) {
        if (openedAt == 0) return 0;
        uint256 deadline = openedAt + 7 days;
        return soldOutAt != 0 && soldOutAt < deadline ? soldOutAt : deadline;
    }
    function closed() public view returns (bool) { return openedAt != 0 && block.timestamp >= closesAt(); }
    function _open() internal view { require(openedAt != 0 && block.timestamp >= openedAt && !closed(), "mint closed"); }
    function claimFree(Permit calldata p) external nonReentrant {
        _open(); require(freeClaims < 4998 && !claimedAgent[p.agentId] && !claimedWallet[msg.sender], "starter unavailable");
        gate.consume(msg.sender, p.agentId, keccak256("FREE"), p.nonce, p.deadline, p.signature);
        claimedAgent[p.agentId] = true; claimedWallet[msg.sender] = true; ++freeClaims;
        _issue(msg.sender, 4, 1); emit StarterClaimed(msg.sender, p.agentId);
    }
    /// @dev The price signer attests the ETH equivalent of USD 0.30 per part.
    /// Its honesty and price-feed freshness remain an explicit off-chain trust assumption.
    function buy(uint256 quote, uint256 settle, Permit calldata p, Price calldata price) external payable nonReentrant {
        _open(); require(quote + settle > 0 && quote <= 79000 && settle <= 19750, "invalid quantity");
        require(price.unitWei > 0 && price.deadline >= block.timestamp && price.deadline <= block.timestamp + 5 minutes, "price expiry");
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(PRICE_TYPEHASH, msg.sender, quote, settle, price.unitWei, price.nonce, price.deadline)));
        require(SignatureChecker.isValidSignatureNow(priceSigner, digest, price.signature), "invalid price");
        require(msg.value == (quote + settle) * price.unitWei, "exact ETH required");
        gate.consume(msg.sender, p.agentId, keccak256(abi.encode("BUY", quote, settle, digest)), p.nonce, p.deadline, p.signature);
        _issue(msg.sender, quote, settle);
        uint256 lp = msg.value * 8000 / 10000;
        (bool a,) = liquidity.call{value:lp}(""); require(a, "liquidity payout");
        (bool b,) = platform.call{value:msg.value-lp}(""); require(b, "platform payout");
        emit Purchased(msg.sender, quote, settle, msg.value, lp, msg.value-lp);
    }
    function _issue(address to, uint256 quote, uint256 settle) internal {
        require(quoteIssued + quote <= 80000 && settleIssued + settle <= 20000, "supply cap");
        quoteIssued += quote; settleIssued += settle;
        if (quoteIssued == 80000 && settleIssued == 20000) { soldOutAt = block.timestamp; emit SoldOut(block.timestamp); }
        if (quote > 0) _mint(to, 0, quote, "");
        if (settle > 0) _mint(to, 1, settle, "");
    }
    function burnForCircuit(address from, uint256 quote, uint256 settle) external {
        require(msg.sender == assembler && closed() && isApprovedForAll(from, msg.sender), "burn denied");
        _burn(from, 0, quote); _burn(from, 1, settle);
    }
}
