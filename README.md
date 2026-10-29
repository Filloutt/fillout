# FillOut

Agent-gated Quote and Settle components on **Robinhood Chain (4663)**. Mint parts, burn a recipe, receive a Circuit NFT.

[Website](https://app.fillout.work) · [X](https://x.com/Fillout_rh) · [Deployed contracts](deployments/robinhood.json) · [Agent guide](docs/AGENT-GUIDE.md)

## Rules

- **100,000 parts:** 80,000 Quote + 20,000 Settle, including the 75 Epic + 100 Rare team reserve.
- **Free:** one 4 Quote + 1 Settle claim per verified Agent ID and wallet; up to 4,998 successful claims, subject to stock.
- **Additional parts:** independently selected quantities, $0.30 equivalent each, paid only in **native ETH** using expiring signed quotes.
- Free and paid parts are identical: transfer, trade or combine them for any rarity.
- Mint closes after **168 hours or sell-out**, whichever comes first. Assembly opens afterward.

| Circuit | Quote | Settle | Maximum |
|---|---:|---:|---:|
| Common | 4 | 1 | 4,998 |
| Rare | 8 | 2 | 3,336 |
| Epic | 20 | 5 | 1,666 |

75 Epic + 100 Rare are reserved for the team, backed by 2,300 Quote + 575 Settle already issued inside the existing caps. Public capacity: 4,998 Common / 3,236 Rare / 1,591 Epic.

**VRAM:** 1 billion fixed supply. 200 million for liquidity; 800 million for mining, split Common/Rare/Epic **80M / 240M / 480M**. Mining starts exactly 24 hours after mint closes and lasts seven days. Late assembly receives no retroactive rewards.

**Fees:** 100% of paid component mint ETH goes to the liquidity address. The Quote, Settle and Circuit market charges 1% to the team. VRAM fixes a 2% team fee on registered V2 pool transfers; ordinary wallet transfers are untaxed. DEX factory/pools are not configured yet. Sending reserves to a liquidity address does not itself create a DEX pool.

## Status

Five V2 contracts are deployed and all seven setup receipts were checked. **Mint has not opened.** The agent authorization service is implemented, but its production signer is not configured. No independent audit is claimed. [Service and trust model](docs/SERVICE.md).

## Source

`contracts/` contains the deployed Solidity sources; `server/` contains identity and ETH-quote authorization; `dist/` contains the agent CLI, protocol and ABIs. `docs/` also retains the root-domain redirect.

Node.js 22.13+: `npm ci` then `npm test`. Builds use Solidity 0.8.27, OpenZeppelin 5.6.1, Cancun and optimizer 200 runs. Public source is for inspection under [LICENSE](LICENSE).
