# FillOut V2

Circuit workspace, minting and marketplace for OpenBook and FillOut on Robinhood Chain mainnet (4663).

New application address: https://app.fillout.work (DNS/SSL activation is managed separately). Sites origin: https://fillout.stableflint1.chatgpt.site.

## V2 release · 18 October 2026

- Launch mint price: **0.00005 ETH per part**. The owner can update it; the mint page reads the current contract price.
- Mint price and any platform fee are forwarded directly to the treasury in the mint transaction. No claim is needed. Wallet gas is separate.
- OpenBook caps: 78,261 Quote / 21,739 Settle. FillOut caps: 31,304 Quote / 8,696 Settle.
- Marketplace fee: 1% of sale value.
- New contracts only; no migration of old balances or listings.

Owner and treasury: 0xEAF932dF3EaA0a0dff52afB97BFc95374907B614.

| Collection | Contract | Address |
| --- | --- | --- |
| OpenBook | parts | [0x47f7eFAC01dd53421CDCAD5c7662AfD997edcc4d](https://robinhoodchain.blockscout.com/address/0x47f7eFAC01dd53421CDCAD5c7662AfD997edcc4d) |
| OpenBook | desk | [0x0A406E9a39d88c5d6208dD3F7bf147B44F21918c](https://robinhoodchain.blockscout.com/address/0x0A406E9a39d88c5d6208dD3F7bf147B44F21918c) |
| OpenBook | circuits | [0x619Af4Bb17366AFA3c2d2247d1c88dbd37600030](https://robinhoodchain.blockscout.com/address/0x619Af4Bb17366AFA3c2d2247d1c88dbd37600030) |
| OpenBook | market | [0xEc78e3c7b80A409b344C6a7278370a3E2d5103B5](https://robinhoodchain.blockscout.com/address/0xEc78e3c7b80A409b344C6a7278370a3E2d5103B5) |
| FillOut | parts | [0x3c9A90776Ea892d72dFDf50A267a75cCD6102738](https://robinhoodchain.blockscout.com/address/0x3c9A90776Ea892d72dFDf50A267a75cCD6102738) |
| FillOut | desk | [0xc6780e3352dcC2f7E18724345C1c3A2af88aacE8](https://robinhoodchain.blockscout.com/address/0xc6780e3352dcC2f7E18724345C1c3A2af88aacE8) |
| FillOut | circuits | [0x33AF5F16225ECd37cC5405F2c95E66bbbB7Cf7B3](https://robinhoodchain.blockscout.com/address/0x33AF5F16225ECd37cC5405F2c95E66bbbB7Cf7B3) |
| FillOut | market | [0x6f68D300DDDb34C3f229905B99356DE2AB72D95E](https://robinhoodchain.blockscout.com/address/0x6f68D300DDDb34C3f229905B99356DE2AB72D95E) |

## Develop

Node.js 22 or newer: run npm start and open http://127.0.0.1:8080. Run npm test for public-app checks. No wallet transactions are performed by tests.

Run npm ci and npm run test:security in contracts/ for local adversarial contract checks. See [contract settings](contracts/README.md), [current evidence](TRANSPARENCY.md), [contract references](docs/contracts.md), [circuit guide](CIRCUIT-GUIDE.md) and [getting started](GETTING-STARTED.md).

The public app is in dist/. Private Sites analytics administration is managed in the Sites source repository, not this public repository. Pushing to GitHub does not deploy Sites automatically.

Simulation, draft import/export, minting, separate collection markets and circuit NFT creation are available. Circuit NFTs permanently lock parts. VRAM/reward features remain planned. English and Simplified Chinese are supported.

No independent audit or confirmed explorer source verification is claimed for V2. All rights reserved; see LICENSE.
