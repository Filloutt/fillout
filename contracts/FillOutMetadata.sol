// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @notice Self-contained fallback metadata; no web host or mutable administrator URI.
library FillOutMetadata {
    function uri(string memory name, string memory label, string memory color, string memory description) internal pure returns (string memory) {
        string memory svg = string.concat('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><rect width="640" height="640" fill="#13171a"/><g fill="none" stroke="',color,'" stroke-width="6"><path d="M40 160h120v120h70M40 480h120V360h70M410 280h70V160h120M410 360h70v120h120"/><rect x="210" y="210" width="220" height="220" rx="12"/><path d="M230 320q90-100 180 0-90 100-180 0Z"/><circle cx="320" cy="320" r="29"/></g><g fill="',color,'" font-family="monospace" text-anchor="middle"><text x="320" y="115" font-size="30">FILLOUT</text><text x="320" y="520" font-size="28">',label,'</text></g></svg>');
        return string.concat('data:application/json;base64,',Base64.encode(bytes(string.concat('{"name":"',name,'","description":"',description,'","image":"data:image/svg+xml;base64,',Base64.encode(bytes(svg)),'"}'))));
    }
    function part(uint256 id) internal pure returns (string memory) {
        require(id < 2, "unknown part");
        return uri(id == 0 ? "FillOut Quote" : "FillOut Settle", id == 0 ? "QUOTE" : "SETTLE", id == 0 ? "#d3b7a1" : "#a6c4c3", "Transferable FillOut component. Free and paid components are identical. Burn components after mint closure to assemble a Circuit.");
    }
    function circuit(uint256 id, uint8 tier) internal pure returns (string memory) {
        string memory name = tier == 0 ? "Common" : tier == 1 ? "Rare" : "Epic";
        return uri(string.concat("FillOut ",name," #",Strings.toString(id)),name,tier == 0 ? "#b7c1c7" : tier == 1 ? "#a6c4c3" : "#d3b7a1","FillOut Circuit assembled by permanently burning Quote and Settle components. Mining eligibility follows the fixed seven-day contract window.");
    }
}
