# Deployed contract references

Network: Robinhood Chain mainnet, chain ID 4663. Native currency: ETH.

RPC: https://rpc.mainnet.chain.robinhood.com

Explorer: https://robinhoodchain.blockscout.com

These are the addresses configured in the website, not an independent audit or source-code verification.

| Collection | Parts | Mint desk |
|---|---|---|
| OpenBook | 0xcAEacd999E09524A47CC790cc2AA65148DA2C484 | 0x71893bc051D74c521D6E9F3464cc6c155294e735 |
| FillOut | 0x700d8b2c19225CA05E3B0a7840ccEBfa0CC2D1E0 | 0x1295c70dAE7B792368dbaC5a95D22B1eBD37086d |

| Collection | Market | Circuits |
|---|---|---|
| OpenBook | 0x9CD6694A2247243FABA441B1c434D0443318395e | 0xd57Ad2d8AD81606Bd529D483EAfd50CdaA912ddE |
| FillOut | 0x3541B64787F90930b2664551cb572a1717fB965B | 0x1cc873CC2b86536aEdE951e54D2aDA6154018d95 |

Quote is ERC-1155 token ID 0; Settle is ID 1. OpenBook caps: 78,261 Quote and 21,739 Settle (100,000 total). FillOut caps: 31,304 Quote and 8,696 Settle (40,000 total). Ratios are approximately 3.6:1, rounded to whole tokens.

The UI reads live caps and minted counts from contracts. The copied config still contains legacy 50,000/50,000 values in its root `tokenomics` metadata; these are not the deployed OpenBook caps. Preserve this distinction when changing configuration. The source snapshot is kept faithful to the published application.

No Solidity source is supplied in this snapshot. Obtain the exact deployed sources and compiler settings from the original Remix workspace before attempting contract maintenance.
