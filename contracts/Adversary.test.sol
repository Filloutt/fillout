// Local test fixture only. Never deploy to a public network.
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract Adversary {
 address public target; bytes public payload; uint256 public amount;
 bool public rejectEth; bool public rejectTokens; bool public attempted; bool public succeeded; bytes public result;
 function arm(address t,bytes calldata p,uint256 v,bool re,bool rt) external {target=t;payload=p;amount=v;rejectEth=re;rejectTokens=rt;attempted=false;succeeded=false;delete result;}
 function execute(address t,bytes calldata p) external payable returns(bytes memory){(bool ok,bytes memory r)=t.call{value:msg.value}(p);if(!ok)assembly {revert(add(r,32),mload(r))}return r;}
 function attempt() private {if(target!=address(0)&&!attempted){attempted=true;(succeeded,result)=target.call{value:amount}(payload);}}
 receive() external payable {require(!rejectEth,'reject ETH');attempt();}
 function onERC721Received(address,address,uint256,bytes calldata) external returns(bytes4){require(!rejectTokens,'reject token');attempt();return this.onERC721Received.selector;}
 function onERC1155Received(address,address,uint256,uint256,bytes calldata) external returns(bytes4){require(!rejectTokens,'reject token');attempt();return this.onERC1155Received.selector;}
 function onERC1155BatchReceived(address,address,uint256[] calldata,uint256[] calldata,bytes calldata) external returns(bytes4){require(!rejectTokens,'reject token');attempt();return this.onERC1155BatchReceived.selector;}
 function safeBatchTransferFrom(address,address,uint256[] calldata,uint256[] calldata,bytes calldata) external {attempt();}
}
