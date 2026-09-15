// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import {ERC721} from '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import {IERC1155} from '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import {IERC1155Receiver} from '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
/// @notice Permanently locks existing parts; no withdrawal, burn, or admin backdoor.
contract FillOutCircuits is ERC721, IERC1155Receiver, ReentrancyGuard {
    IERC1155 public immutable parts;
    uint256 public nextId;
    mapping(uint256 => bytes) public netlists;
    mapping(uint256 => address) public creators;
    bool private receiving;
    event CircuitCreated(uint256 indexed id,address indexed creator,bytes32 indexed netlistHash,uint256 quote,uint256 settle);
    constructor(IERC1155 parts_) ERC721('FillOut Circuits','FILL') {require(address(parts_).code.length>0,'Invalid parts');parts=parts_;}
    function read(bytes calldata b,uint256 p,uint256 n) private pure returns(uint256 v){require(p+n<=b.length,'Truncated');for(uint256 i;i<n;i++)v=(v<<8)|uint8(b[p+i]);}
    function validate(bytes calldata b) public pure returns(uint256 quote,uint256 settle){
        require(b.length>=16 && read(b,0,4)==0x41434456 && read(b,4,2)==1,'Invalid format');
        uint256 inputs=read(b,6,2);uint256 outputs=read(b,8,2);settle=read(b,10,2);quote=read(b,12,4);
        require(outputs>0 && inputs<=256 && outputs<=256 && inputs+outputs+settle+quote<=512,'Limits');
        require(quote+settle>0,'No parts');require(b.length==16+quote*9+(settle+outputs)*4,'Invalid length');
        uint256 signals=2+inputs+settle;
        for(uint256 i;i<quote;i++){uint256 p=16+i*9;require(read(b,p,1)==16 && read(b,p+1,4)<signals+i && read(b,p+5,4)<signals+i,'Invalid gate');}
        for(uint256 i;i<settle+outputs;i++)require(read(b,16+quote*9+i*4,4)<signals+quote,'Invalid reference');
    }
    function fill(bytes calldata b) external nonReentrant returns(uint256 id){
        (uint256 q,uint256 s)=validate(b);uint256[] memory ids=new uint256[](2);ids[1]=1;uint256[] memory amounts=new uint256[](2);amounts[0]=q;amounts[1]=s;
        receiving=true;parts.safeBatchTransferFrom(msg.sender,address(this),ids,amounts,'');receiving=false;
        id=nextId++;netlists[id]=b;creators[id]=msg.sender;_safeMint(msg.sender,id);emit CircuitCreated(id,msg.sender,keccak256(b),q,s);
    }
    function onERC1155Received(address,address,uint256,uint256,bytes calldata) external pure returns(bytes4){revert('Use fill');}
    function onERC1155BatchReceived(address operator,address,uint256[] calldata,uint256[] calldata,bytes calldata) external view returns(bytes4){require(msg.sender==address(parts)&&operator==address(this)&&receiving,'Use fill');return this.onERC1155BatchReceived.selector;}
    function supportsInterface(bytes4 id) public view override(ERC721,IERC165) returns(bool){return id==type(IERC1155Receiver).interfaceId||super.supportsInterface(id);}
}

