# Circuits metadata resolution

27 September 2026. Internal reproducibility finding, not an independent audit or explorer verification.

The recovered modular source is named FillOutCircuits.sol. Its LF line-ending variant, with the previously recorded Solidity 0.8.27 / OpenZeppelin 5.6.1 / optimizer disabled (runs 200) / Cancun settings, reproduces the deployed metadata. CRLF source text produces a different metadata hash even though executable instructions match.

Both configured Circuits runtimes are 13,692 bytes. After substituting each recorded immutable parts address, the entire runtime matches byte-for-byte, including metadata:

- OpenBook: 0xd57Ad2d8AD81606Bd529D483EAfd50CdaA912ddE
- FillOut: 0x1cc873CC2b86536aEdE951e54D2aDA6154018d95

Comparison uses the existing onchain.json snapshot at block 0x465a073. No deployed contract or source logic was modified. Updated FillOutCircuits-standard-input.json preserves the exact source text; verified-comparison.json now records eight full runtime matches. Constructor execution was not independently replayed. Both Circuits contracts received explorer exact-match confirmations on 27 September 2026: FillOut (0x1cc873CC2b86536aEdE951e54D2aDA6154018d95) and OpenBook (0xd57Ad2d8AD81606Bd529D483EAfd50CdaA912ddE). The six Parts, Desk and Market contracts remain unconfirmed in the explorer; local runtime matching is complete for all eight.
