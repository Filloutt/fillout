// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FillOutParts.sol";
import "./VRAM.sol";



/// @notice Burn-to-build ERC721 and seven-day mining vault.
contract FillOutCircuits is ERC721, ReentrancyGuard {
    using SafeERC20 for IERC20;
    FillOutParts public immutable parts;
    AgentGate public immutable gate;
    address public immutable creator;
    address public immutable team;
    IERC20 public rewardToken;
    string private metadata;
    uint256 public totalIssued;
    uint256 public teamEpicIssued;
    uint256 public teamRareIssued;
    uint256[3] public issued;
    mapping(uint256 => uint8) public rarity;
    mapping(uint256 => uint256) public rewardIndex;
    mapping(address => uint256) public credit;
    event Assembled(address indexed owner, uint256 indexed tokenId, uint8 rarity, bool teamReserve);
    event Claimed(address indexed owner, uint256 amount);
    event RewardTokenBound(address indexed token);
    constructor(address parts_, string memory metadata_) ERC721("FillOut Circuit", "CIRCUIT") {
        parts = FillOutParts(parts_); gate = parts.gate(); creator = parts.creator(); team = parts.team(); metadata = metadata_;
    }
    function bindRewardToken(address token) external {
        require(msg.sender == creator && address(rewardToken) == address(0) && token.code.length > 0 && parts.openedAt() == 0, "bind denied");
        require(IERC20(token).balanceOf(address(this)) == 800_000_000 ether && IERC20(token).totalSupply() == 1_000_000_000 ether, "funding mismatch");
        rewardToken = IERC20(token); emit RewardTokenBound(token);
    }
    function _baseURI() internal view override returns (string memory) { return metadata; }
    function tokenURI(uint256 id) public view override returns (string memory) {
        ownerOf(id);
        return bytes(metadata).length == 0 ? FillOutMetadata.circuit(id, rarity[id]) : super.tokenURI(id);
    }
    function cap(uint8 tier) public pure returns (uint256) { require(tier < 3, "rarity"); return tier == 0 ? 4998 : tier == 1 ? 3336 : 1666; }
    function recipe(uint8 tier) public pure returns (uint256 quote, uint256 settle) { require(tier < 3, "rarity"); settle = tier == 0 ? 1 : tier == 1 ? 2 : 5; quote = settle * 4; }
    function pool(uint8 tier) public pure returns (uint256) { require(tier < 3, "rarity"); return tier == 0 ? 80_000_000 ether : tier == 1 ? 240_000_000 ether : 480_000_000 ether; }
    function miningStartsAt() public view returns (uint256) { uint256 c = parts.closesAt(); return c == 0 ? 0 : c + 1 days; }
    function index(uint8 tier) public view returns (uint256) {
        uint256 start = miningStartsAt();
        if (start == 0 || block.timestamp <= start) return 0;
        uint256 elapsed = block.timestamp - start; if (elapsed > 7 days) elapsed = 7 days;
        return pool(tier) * elapsed / (7 days * cap(tier));
    }
    function assemble(uint8 tier, FillOutParts.Permit calldata p) external nonReentrant {
        require(parts.closed() && address(rewardToken) != address(0), "assembly closed");
        require(issued[tier < 3 ? tier : 0] < cap(tier), "rarity sold out");
        if (tier == 2) require(issued[2] - teamEpicIssued < 1591, "public epic cap");
        if (tier == 1) require(issued[1] - teamRareIssued < 3236, "public rare cap");
        gate.consume(msg.sender, p.agentId, keccak256(abi.encode("ASSEMBLE", tier)), p.nonce, p.deadline, p.signature);
        _assemble(msg.sender, tier, false);
    }
    function assembleTeamEpic() external nonReentrant {
        require(msg.sender == team && parts.closed() && address(rewardToken) != address(0) && teamEpicIssued < 75, "team reserve denied");
        ++teamEpicIssued; _assemble(team, 2, true);
    }
    function assembleTeamRare() external nonReentrant {
        require(msg.sender == team && parts.closed() && address(rewardToken) != address(0) && teamRareIssued < 100, "team reserve denied");
        ++teamRareIssued; _assemble(team, 1, true);
    }
    function _assemble(address account, uint8 tier, bool reserved) internal {
        require(issued[tier] < cap(tier), "rarity cap");
        (uint256 q, uint256 s) = recipe(tier); parts.burnForCircuit(account, q, s);
        ++issued[tier]; uint256 id = ++totalIssued; rarity[id] = tier; rewardIndex[id] = index(tier);
        _safeMint(account, id); emit Assembled(account, id, tier, reserved);
    }
    function _update(address to, uint256 id, address auth) internal override returns (address) {
        address from = _ownerOf(id);
        if (from != address(0)) { uint256 current = index(rarity[id]); credit[from] += current - rewardIndex[id]; rewardIndex[id] = current; }
        return super._update(to, id, auth);
    }
    function pending(uint256 id) external view returns (uint256) { ownerOf(id); return index(rarity[id]) - rewardIndex[id]; }
    function claim(uint256[] calldata ids) external nonReentrant {
        for (uint256 i; i < ids.length; ++i) {
            require(ownerOf(ids[i]) == msg.sender, "not owner");
            uint256 current = index(rarity[ids[i]]); credit[msg.sender] += current - rewardIndex[ids[i]]; rewardIndex[ids[i]] = current;
        }
        uint256 amount = credit[msg.sender]; require(amount > 0, "no rewards"); credit[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, amount); emit Claimed(msg.sender, amount);
    }
}
