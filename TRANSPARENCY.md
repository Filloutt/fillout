# FillOut security and transparency review

Prepared 27 September 2026. Internal technical review, not an independent audit or certificate.

## Evidence and scope

Eight configured contracts were read on Robinhood Chain, chain ID 4663, at block 0x465a073. See onchain.json for addresses, runtime code hashes, balances and returned values. No transaction was signed or sent.

Recovered sources were compiled using Solidity 0.8.27+commit.40a35a09, OpenZeppelin 5.6.1, optimizer disabled (runs 200), EVM Cancun. Immutable values were populated from the recorded contract getters before comparison.

- Both Parts, Desk and Market contracts: complete deployed runtime bytes matched, including metadata (six contracts).
- Both Circuits contracts: executable runtime bytes matched; compiler metadata differed. This is not a complete byte-for-byte match.
- Constructor execution and historical transactions were not independently reproduced by this runtime comparison.
- Explorer verification was attempted for FillOut Parts through the Standard JSON form. No success confirmation was returned. Explorer verification remains unconfirmed; no verified badge is claimed.

These results improve source provenance but do not establish absence of vulnerabilities. The complete comparison is in verified-comparison.json. Standard JSON compiler inputs are included for explorer verification.

## Observed configuration

| Collection | Quote cap | Settle cap | Unit mint price | Market fee |
| --- | --- | --- | --- | --- |
| OpenBook | 78,261 | 21,739 | 0.0002 ETH | 100 bps (1%) |
| FillOut | 31,304 | 8,696 | 0.0002 ETH | 100 bps (1%) |

The owner of each Parts contract is its respective Desk contract. Both Desk and Market contracts report owner and treasury as 0x7734306b68ffa63b03ed6e3aa05ed72a63106b71. This review has not established whether that address uses multisignature controls.

## Authority and fund flows in the matched source

Parts: only the owner can mint, subject to immutable caps. Ownership transfer and renunciation functions are inherited. The currently recorded owner is the Desk, whose reviewed interface does not expose arbitrary minting or transfer of the Parts ownership.

Desk: anyone can buy parts through buy. Unit price and treasury are immutable. The part price remains in the Desk; its owner can call withdraw to send its full balance to the fixed treasury. The supplied platform fee is forwarded to treasury during purchase. Gas is paid separately to the network. The frontend's gas-equivalent fee policy is not independently enforced by the Desk: platformFee is a caller-supplied argument.

Market: sellers escrow parts, choose a price and can cancel their own active listings to recover the remainder. A purchase sends 1% to the fixed treasury and the remainder to the seller, then delivers parts. The reviewed source has no owner-only listing seizure, fee setter, pause or marketplace withdrawal function. Inherited ownership functions remain present.

Circuits: fill validates the netlist, permanently receives parts and creates an ERC-721 NFT. The reviewed executable logic has no part withdrawal or dismantling operation and no owner/admin role. Its metadata mismatch remains an open provenance item. Recompiling recovered modular and flattened source variants with the matching compiler did not reproduce the metadata hash. The embedded IPFS metadata reference is QmVK6ukRJNZZnqhq44yGG9H7Tt9qU4uXKP6Lh9hDDfPgtQ; attempts to retrieve it through public gateways did not return metadata.

No proxy upgrade or pause mechanism appears in the reviewed source. This statement is limited to the matched runtime and does not cover website administration, wallet compromise or future contracts.

## Remaining work

1. Submit the compiler inputs to the explorer and record actual verification results.
2. Resolve the two Circuits metadata differences before claiming full source matching.
3. Publish this disclosure and evidence on GitHub and link it from the live site.
4. Independently review contract security, including receiver behavior, approvals, fee handling and failed payments.
5. Review any future VRAM token and reward system separately before activation.

The local site config still contains OpenBook 50,000/50,000 legacy tokenomics values; the on-chain getters above return 78,261/21,739. The fallback configuration is corrected to the observed caps in the accompanying website update.

## Publication status

Prepared for publication with the evidence files. Sites owner access has been restored. No independent audit was commissioned and no public “audited” or “verified” badge is claimed.
