# FillOut V2 transparency

Scope: the eight active contracts listed in [docs/contracts.md](docs/contracts.md), deployed on 18 October 2026.

All deployment receipts were successful. Each transaction input was compared with the locally compiled creation bytecode and exact constructor arguments. Linked Parts, caps, mint authority, owner, treasury and unit price were read from chain. See [onchain.json](onchain.json) and [verified-comparison.json](verified-comparison.json). This is a creation-input comparison, not a claim of independently audited security or explorer verification.

## Permissions and payments

The Desk owner can set a nonzero unit price and transfer or renounce ownership. Mint authority belongs to the Desk. Treasury, linked Parts and supply caps are immutable. Successful purchases forward the entire msg.value to treasury immediately; failed payment reverts the mint. The residual withdraw method remains owner-only but normal mint income is not retained.

The frontend displays a network-estimate-equivalent platform fee; the Desk accepts a caller-supplied fee, including zero. Network gas is separate. Market fees are fixed at 1%, sellers receive proceeds directly, and unsold escrow can be recovered by cancelling the seller's listing. Circuit parts remain permanently locked.

## Build settings

Solidity 0.8.27; OpenZeppelin 5.6.1; Cancun EVM. Optimizer disabled for seven deployments, enabled with 200 runs only for FillOut Circuits. See contracts/README.md for reproducible inputs and tests.

## Limits

No independent audit. Explorer source verification is not confirmed for V2. Historical reports and explorer confirmations for earlier deployments do not apply to these addresses. Local behavioral tests cover selected scenarios, not all possible failures. Website and wallet compromise are outside this review.
