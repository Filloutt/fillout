# Recovered Solidity sources

These four recovered sources describe Parts, Desk, Market and Circuits. Solidity source files are preserved without edits.

## Compile locally

Run npm ci and npm run compile in this directory. The build pins Solidity 0.8.27 and OpenZeppelin 5.6.1, optimizer.enabled = false, Cancun EVM, matching the settings used for the recorded runtime comparison. No wallet or deployment is required.

## Verification status

The internal comparison matched all deployed runtime bytes for both Parts, Desk and Market contracts (six contracts), after populating constructor immutable values from the recorded getters. Both Circuits contracts have a complete deployed runtime byte-for-byte match, including compiler metadata, using the recovered FillOutCircuits.sol source with LF line endings, Solidity 0.8.27, OpenZeppelin 5.6.1, optimizer.enabled = false and EVM Cancun. Constructor execution was not independently replayed. Compilation alone does not repeat that on-chain comparison or establish security.

See [the transparency report](../TRANSPARENCY.md), [comparison evidence](../verified-comparison.json), and the four root Standard JSON inputs. Both Circuits contracts received explorer exact-match confirmations on 27 September 2026: FillOut (0x1cc873CC2b86536aEdE951e54D2aDA6154018d95) and OpenBook (0xd57Ad2d8AD81606Bd529D483EAfd50CdaA912ddE). The six Parts, Desk and Market contracts remain unconfirmed in the explorer; local runtime matching is complete for all eight. No independent audit has been performed.

The frontend Circuits holdings reader now calls nextId() (0x61b8ce8c). Market listing reads continue to use nextListingId() (0xaaccf1ec). Repository changes do not by themselves deploy the live website.

## Local adversarial checks

Run `npm run test:security` after `npm ci`. See [BEHAVIOR-TESTS.md](../BEHAVIOR-TESTS.md) for passed scenarios and limitations. Fixtures use an in-memory chain, never mainnet.
