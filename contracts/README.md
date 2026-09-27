# Recovered Solidity sources

These four recovered sources describe Parts, Desk, Market and Circuits. Solidity source files are preserved without edits.

## Compile locally

Run npm ci and npm run compile in this directory. The build pins Solidity 0.8.27 and OpenZeppelin 5.6.1, optimizer disabled (runs 200), Cancun EVM, matching the settings used for the recorded runtime comparison. No wallet or deployment is required.

## Verification status

The internal comparison matched all deployed runtime bytes for both Parts, Desk and Market contracts (six contracts), after populating constructor immutable values from the recorded getters. Both Circuits runtimes also match completely, including metadata, when the recovered modular source uses LF line endings. Constructor execution was not reproduced. Compilation alone does not repeat that on-chain comparison or establish security.

See [the transparency report](../TRANSPARENCY.md), [comparison evidence](../verified-comparison.json), and the four root Standard JSON inputs. Explorer verification remains unconfirmed; no independent audit has been performed.

The frontend Circuits holdings reader now calls nextId() (0x61b8ce8c). Market listing reads continue to use nextListingId() (0xaaccf1ec). Repository changes do not by themselves deploy the live website.
