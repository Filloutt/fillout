# Local adversarial behavior tests

27 September 2026. Internal checks; not an independent audit or an absence-of-vulnerabilities guarantee.

Run from contracts/: npm ci followed by npm run test:security. Uses pinned Solidity 0.8.27, OpenZeppelin 5.6.1, optimizer disabled, Cancun and Hardhat's in-memory chain 31337. No public RPC, private key or mainnet transaction is used. Production Solidity sources are unchanged. These locally deployed fixtures do not replay the mainnet deployment or all historical transactions.

## Passed scenarios

- An ERC-721 receiver attempts nested Circuits.fill: the reentrancy guard rejects it; exactly one NFT and one Quote lock are recorded.
- Rejected NFT receipt rolls back minting and part transfer. Missing approval, malformed netlist and direct circuit deposits are rejected.
- A separate malicious Parts fixture calls fill again during safeBatchTransferFrom: the guard rejects reentry. This fixture specifically exercises the static-analysis warning location; it is not the real deployed Parts contract and does not prove arbitrary Parts collateral accounting.
- Market rejects unauthorized cancellation, wrong payment and excess quantity. Successful purchase routes the exact 1% fee; cancellation returns unsold units and blocks later purchase.
- Rejected seller ETH receipt rolls back the listing and treasury fee. A seller callback cannot cancel during purchase.
- Rejected buyer token receipt rolls back seller payment, treasury fee and inventory.
- Desk enforces owner-only withdrawal, mint ownership, price and supply cap. Rejected treasury fee receipt rolls back minting. Failed withdrawal retains funds; successful withdrawal reaches the configured treasury.
- A mint receiver cannot reenter Desk.buy.

## Limits and retained behavior

The caller-supplied platformFee can be zero; the tests confirm this documented behavior rather than claiming enforcement of the frontend's fee policy. Permanent circuit locking is retained. Tests cover the stated scenarios, not every callback, compiler bug, website compromise, recipient behavior or future reward contract. The Slither warning remains present in raw output; passing adversarial scenarios is additional evidence, not suppression of the warning.
