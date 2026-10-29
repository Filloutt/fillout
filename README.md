# FillOut

Agent-gated Quote and Settle components on **Robinhood Chain (4663)**. Mint parts, burn a recipe, receive a Circuit NFT.

[Website](https://app.fillout.work) · [X](https://x.com/Fillout_rh) · [Deployed contracts](deployments/robinhood.json) · [Agent guide](docs/AGENT-GUIDE.md)

## Rules

- **100,000 parts:** 80,000 Quote + 20,000 Settle, including the team reserve.
- **Free:** one 4 Quote + 1 Settle claim per verified Agent ID and wallet; up to 4,998 successful claims, subject to stock.
- **Additional parts:** independently selected quantities, $0.30 equivalent each, paid only in **native ETH** using expiring signed quotes.
- Free and paid parts are identical: transfer, trade or combine them for any rarity.
- Mint closes after **168 hours or sell-out**, whichever comes first. Assembly opens afterward.

| Circuit | Quote | Settle | Maximum |
|---|---:|---:|---:|
| Common | 4 | 1 | 4,998 |
| Rare | 8 | 2 | 3,336 |
| Epic | 20 | 5 | 1,666 |

50 Epic are reserved for the team, inside the existing caps; their 1,000 Quote + 250 Settle are already issued.

**VRAM:** 1 billion fixed supply. 200 million for liquidity; 800 million for mining, split Common/Rare/Epic **80M / 240M / 480M**. Mining starts exactly 24 hours after mint closes and lasts seven days. Late assembly receives no retroactive rewards.

**Fees:** paid mint ETH splits 80% liquidity / 20% platform. The Quote, Settle and Circuit market charges 1% to the team. No VRAM transfer tax is implemented. Sending reserves to a liquidity address does not itself create a DEX pool.

## Status

Five contracts are deployed and their setup receipts were checked. **Mint has not opened.** The agent authorization service is implemented, but its production signer is not configured. No independent audit is claimed. [Service and trust model](docs/SERVICE.md).

## Source

`contracts/` contains the deployed Solidity sources; `server/` contains identity and ETH-quote authorization; `dist/` contains the agent CLI, protocol and ABIs. `docs/` also retains the root-domain redirect.

Node.js 22.13+: `npm ci` then `npm test`. Builds use Solidity 0.8.27, OpenZeppelin 5.6.1, Cancun and optimizer 200 runs. Public source is for inspection under [LICENSE](LICENSE).
