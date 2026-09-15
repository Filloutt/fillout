# Recovered Solidity sources

Recovered from the project's `mainnet-ready-kit/contracts` directory. Files are preserved without Solidity edits:

- `FillOutParts.sol`: ERC-1155 Quote and Settle parts with separate lifetime caps.
- `OpenBookDesk.sol`: mint desk.
- `FillOutMarket.sol`: fixed-price listings.
- `FillOutCircuits.sol`: circuit NFTs and permanent parts locking.

## Compile locally

```sh
cd contracts
npm install
npm run compile
```

This validation build pins solc 0.8.26 and OpenZeppelin 5.6.1, optimizer 200 runs, Cancun EVM. These are the locally tested validation dependencies, **not confirmed deployment settings**. The recovered kit configuration requested Solidity 0.8.27 and an unpinned OpenZeppelin range. Exact Remix compiler metadata has not been recovered.

Generated artifacts are ignored by Git. No deployment command or wallet key is needed to compile.

## Verification status

Compilation is a source check, not an audit. Mainnet bytecode equivalence remains unverified. Obtain the original Remix build metadata and compare deployed bytecode, including constructor immutable values, before calling these verified deployed sources or redeploying them. Existing configured addresses are in `../docs/contracts.md`.

Integration follow-up: the recovered Circuits source exposes `nextId()`, while the frontend's circuit holdings reader currently uses the selector for `nextListingId()`. This discrepancy requires separate ABI/on-chain validation and a frontend fix; this source upload does not change the live site.
