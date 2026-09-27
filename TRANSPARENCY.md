# FillOut security and transparency review

Prepared 27 September 2026. Internal technical review, not an independent audit or certificate.

## Evidence and scope

Eight configured contracts were read on Robinhood Chain, chain ID 4663, at block 0x465a073. See onchain.json for addresses, runtime code hashes, balances and returned values. No transaction was signed or sent.

Recovered sources were compiled using Solidity 0.8.27+commit.40a35a09, OpenZeppelin 5.6.1, optimizer.enabled = false (the recorded runs parameter is 200), EVM Cancun. Immutable values were populated from the recorded contract getters before comparison.

- Both Parts, Desk and Market contracts: complete deployed runtime bytes matched, including metadata (six contracts).
- Both Circuits contracts have a complete deployed runtime byte-for-byte match, including compiler metadata, using the recovered FillOutCircuits.sol source with LF line endings, Solidity 0.8.27, OpenZeppelin 5.6.1, optimizer.enabled = false and EVM Cancun. Constructor execution was not independently replayed.
- Constructor execution and historical transactions were not independently reproduced by this runtime comparison.
- Both Circuits contracts received explorer exact-match confirmations on 27 September 2026: FillOut (0x1cc873CC2b86536aEdE951e54D2aDA6154018d95) and OpenBook (0xd57Ad2d8AD81606Bd529D483EAfd50CdaA912ddE). The six Parts, Desk and Market contracts remain unconfirmed in the explorer; local runtime matching is complete for all eight.

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

Circuits: fill validates the netlist, permanently receives parts and creates an ERC-721 NFT. The reviewed executable logic has no part withdrawal or dismantling operation and no owner/admin role. The earlier metadata mismatch was resolved: the recovered modular FillOutCircuits.sol file must use LF line endings. With that exact source text and the recorded compiler settings, both complete runtimes match after immutable substitution. The embedded IPFS metadata reference is QmVK6ukRJNZZnqhq44yGG9H7Tt9qU4uXKP6Lh9hDDfPgtQ; public gateway retrieval previously failed, but the matching compiler output now reproduces the metadata locally.

No proxy upgrade or pause mechanism appears in the reviewed source. This statement is limited to the matched runtime and does not cover website administration, wallet compromise or future contracts.

## Static analysis

Slither 0.11.6 completed a scan of the four recovered sources and their dependencies. The unfiltered output contains warnings; see [STATIC-ANALYSIS.md](STATIC-ANALYSIS.md) for counts, every High/Medium record group, dispositions and reproduction instructions. This is an internal automated check, not an independent audit. Local adversarial behavior tests passed; see [BEHAVIOR-TESTS.md](BEHAVIOR-TESTS.md) for coverage and limits. The repository workflow runs these checks on pushes and pull requests.

## Remaining work

1. Submit the compiler inputs to the explorer and record actual verification results.
2. Closed: both Circuits metadata matches and explorer exact-match confirmations are recorded. Continue explorer verification for the remaining six contracts.
3. Keep the published Security & Transparency page and GitHub evidence synchronized.
4. Independently review contract security, including receiver behavior, approvals, fee handling and failed payments.
5. Review any future VRAM token and reward system separately before activation.

The repository fallback configuration now uses the observed OpenBook caps of 78,261/21,739. The Circuits holdings reader uses nextId(); market listings use nextListingId(). These repository corrections do not confirm a live-site deployment.

## Publication status

The report and evidence are published on GitHub. Site owner access was confirmed and the Security & Transparency page was published in Sites version 56 on 27 September 2026. No independent audit was commissioned and no independent-audit badge is claimed. Explorer verification is limited to the specifically confirmed addresses above.
