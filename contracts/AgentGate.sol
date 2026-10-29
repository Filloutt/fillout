// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

/// @notice A trusted verifier attests identity ownership, not intelligence.
/// @dev Each ticket binds the consuming contract, wallet, action, nonce and expiry.
contract AgentGate is EIP712 {
    address public immutable verifier;
    bytes32 public constant TYPEHASH = keccak256("AgentPermit(address consumer,address account,bytes32 agentId,bytes32 action,uint256 nonce,uint256 deadline)");
    mapping(bytes32 => bool) public consumed;
    event PermitConsumed(address indexed consumer, address indexed account, bytes32 indexed agentId, bytes32 action, uint256 nonce);
    constructor(address verifier_) EIP712("FillOut Agent Gate", "1") {
        require(verifier_ != address(0), "zero verifier"); verifier = verifier_;
    }
    function consume(address account, bytes32 agentId, bytes32 action, uint256 nonce, uint256 deadline, bytes calldata signature) external {
        require(account != address(0) && agentId != bytes32(0), "invalid identity");
        require(block.timestamp <= deadline && deadline <= block.timestamp + 1800, "permit expiry");
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(TYPEHASH, msg.sender, account, agentId, action, nonce, deadline)));
        require(!consumed[digest], "permit used");
        require(SignatureChecker.isValidSignatureNow(verifier, digest, signature), "invalid permit");
        consumed[digest] = true;
        emit PermitConsumed(msg.sender, account, agentId, action, nonce);
    }
}
