// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IVramV2Factory { function getPair(address,address) external view returns (address); }
interface IVramV2Pair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function factory() external view returns (address);
}

/// @notice Fixed 2% VRAM fee on transfers to/from registered V2-compatible pools.
/// Normal wallet transfers and mining claims are not taxed.
contract VRAM is ERC20 {
    uint256 public constant TRADING_FEE_BPS = 200;
    address public immutable creator;
    address public immutable feeRecipient;
    address public dexFactory;
    mapping(address => bool) public tradingPools;
    event DexFactoryBound(address indexed factory);
    event PoolRegistered(address indexed pool, address indexed pairedToken);
    event TradingFee(address indexed from, address indexed to, uint256 gross, uint256 fee);

    constructor(address liquidity, address mining, address creator_, address team_) ERC20("FillOut VRAM", "VRAM") {
        require(liquidity != address(0) && mining.code.length > 0 && creator_ != address(0) && team_ != address(0), "invalid recipients");
        creator = creator_; feeRecipient = team_;
        _mint(liquidity, 200_000_000 ether); _mint(mining, 800_000_000 ether);
    }
    /// @dev One-time setup; choose a reviewed fee-on-transfer-compatible V2 DEX.
    function bindDexFactory(address factory_) external {
        require(msg.sender == creator && dexFactory == address(0) && factory_.code.length > 0, "factory bind denied");
        dexFactory = factory_; emit DexFactoryBound(factory_);
    }
    /// @notice Anyone may register an actual pair of the fixed DEX factory.
    /// An EOA or arbitrary wallet cannot be designated as a taxable pool.
    function registerPool(address pair) external {
        require(dexFactory != address(0) && pair.code.length > 0 && !tradingPools[pair], "invalid pool");
        address a = IVramV2Pair(pair).token0(); address b = IVramV2Pair(pair).token1();
        require(a != b && (a == address(this) || b == address(this)), "not VRAM pair");
        require(IVramV2Pair(pair).factory() == dexFactory && IVramV2Factory(dexFactory).getPair(a,b) == pair, "unrecognized pair");
        tradingPools[pair] = true; emit PoolRegistered(pair, a == address(this) ? b : a);
    }
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0) && from != to && (tradingPools[from] || tradingPools[to])) {
            uint256 fee = value / 50;
            if (fee > 0) super._update(from, feeRecipient, fee);
            super._update(from, to, value - fee);
            emit TradingFee(from, to, value, fee);
        } else super._update(from, to, value);
    }
}
