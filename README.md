# FillOut

Circuit workspace and marketplace for OpenBook and FillOut on Robinhood Chain.

Website: https://fillout.work

## Features

- Quote (NAND) and Settle (one-bit memory) circuit editor.
- Local simulation, draft import/export and circuit NFT creation.
- Independent OpenBook and FillOut minting and markets.
- Wallet holdings and contract references.
- English and Simplified Chinese interfaces.

## Run locally

Requires Node.js 22 or newer. No dependency installation is needed.

```sh
npm start
```

Open http://127.0.0.1:8080. Browser wallets and RPC access are needed for blockchain operations. The configured network is mainnet (chain ID 4663); local preview does not turn transactions into test transactions.

```sh
npm test
```

Tests check JavaScript syntax, NAND truth tables, memory transitions, binary encoding and invalid circuits. They do not submit wallet transactions or audit deployed contracts.

## Project layout

`dist/` contains the editable static application, including the local simulation engine and public chain configuration. `test-engine.mjs` exercises circuit logic. `scripts/` contains local development tools. `docs/contracts.md` records collection addresses and supply caps.

## Deployment

The live website is hosted on Sites. This repository is a source snapshot and development home; pushing to GitHub does not automatically deploy the live website. Publish reviewed changes through the existing Sites project. Do not change domain DNS to GitHub Pages unless intentionally migrating hosting.

## Contracts and source status

See [contract references](docs/contracts.md). Solidity source and verified deployment build artifacts are not included in the available project checkout. Their absence must not be mistaken for contract verification or an audit. Add the exact deployed sources and compiler settings before claiming reproducible smart-contract builds.

Creating a circuit NFT permanently locks the required parts in the selected collection's circuit contract. Browser drafts are stored locally and should be exported for backup.

## License

No open-source license has been selected. Public visibility does not grant a general license to redistribute or reuse the code.
