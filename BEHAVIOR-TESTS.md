# V2 local behavior checks

Run npm test in the root for application checks and npm ci followed by npm run test:security in contracts/.

Contract checks passed for automatic full treasury payment, zero retained mint balance, failed treasury rollback, owner-only nonzero price updates and events, stale-price rejection, both collection caps, NFT locking, approvals, malformed netlists, marketplace pricing, cancellation, payment rollback and callback reentrancy.

Application checks cover wallet account/network changes, balance isolation, bounded market listing reads, circuit inventory, simulation, draft history and workspace reset. V2 release checks ensure all active addresses agree with the deployment evidence and superseded addresses do not remain in public assets.

Tests do not submit mainnet transactions and are not an independent audit.
