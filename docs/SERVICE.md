# Agent service

The service verifies the pinned SPACE ID Agent ID registry on BSC (56), checks `ownerOf(keccak256(handle))` against the Robinhood wallet address, then verifies a wallet-bound EIP-712 ownership challenge. The `.ai` suffix is omitted from the registry token ID hash. A typed name or client-side `claimed` flag never grants access. Agent ID ownership is an eligibility credential, not proof that an autonomous AI generated a transaction.

Requests bind wallet, identity, action, target contract, chain, nonce and expiry. D1 consumes each challenge atomically. Actual Quote, Settle, Circuit and VRAM balances are read from Robinhood Chain. Contract-code mismatches, unavailable ownership reads and expired prices fail closed.

Prices use Coinbase ETH/USD spot with HTTP freshness and absolute price checks. Integer wei math rounds upward to cover USD 0.30 per additional part. The creator signs a wallet-bound quote valid for two minutes. This is a trusted signing service, not a decentralized price oracle. No stablecoin payment method exists.

## Configure

Deploy `server/worker.mjs` on a Worker-compatible runtime, with D1 binding `DB`, and apply `drizzle/0003_agent_authorizations.sql`. Set runtime secrets using the hosting provider's secure configuration:

- `FILLOUT_SIGNER_PRIVATE_KEY`: the deployed creator/verifier/price-signer key. Never commit it or submit it in chat or to the public API.
- `FILLOUT_AGENT_SERVICE_ENABLED`: defaults to disabled; use `true` only after the real proof/signing flow is checked.
- `FILLOUT_RPC_URL`: trusted HTTPS Robinhood Chain 4663 RPC.
- `FILLOUT_IDENTITY_RPC_URL`: trusted HTTPS BSC 56 RPC.

The creator/verifier is fixed at `0xe9F1E05929B33C2E7dd8da650FD390BBcE22F75f`, an EOA, not a multisig. Its signing key also controls one-time setup and mint scheduling. The other immutable recipients and deployment evidence are in [robinhood.json](../deployments/robinhood.json). No private key is included here. Wallet approval of deployment does not provision a server signer.

The contract suite has no proxy upgrade, pause, supply increase or fee-change method. The creator can bind the assembler once, bind VRAM once, bind one V2-compatible VRAM DEX factory once and schedule opening once. Start cannot be changed after scheduling. Mining begins exactly 24 hours after closure. The vault has no administrator sweep of unused rewards. Team spending purposes and actual DEX liquidity provisioning are operational policies, not automatically enforced spending rules.

## API

`GET /api/protocol`, `/api/agent/status`, `/api/agent/inventory?wallet=0x…`, `/api/agent/market?asset=quote|settle|circuit`, `/api/agent/quote?quote=4&settle=1`.

`POST /api/agent/challenge` accepts `{wallet,agentId,intent}` and returns an EIP-712 ownership document. `POST /api/agent/authorize` accepts `{challenge,signature}` and returns contract calldata and any separately required operator approval. It never signs a user's transaction or broadcasts one.

Use official wallet preview → explicit user confirmation → execute. The CLI checks actual supported wallet networks; Robinhood support must not be assumed. Missing signer configuration returns HTTP 503. Mint was scheduled on-chain for 29 October 2026 at 11:49:25 UTC; the nominal deadline is 5 November 2026 at 11:49:25 UTC, subject to earlier sell-out. Query live status before each operation.

Local service tests use ephemeral identities. Contract-flow tests use an in-process Hardhat chain, a registry ownership fixture and a price fixture; they do not claim a real customer mint, independent audit, or production signing-service validation.

## V2 fees and reserve
100% of paid mint ETH goes to the liquidity address. Team reserve: 75 Epic + 100 Rare inside existing caps, backed by 2,300 Quote + 575 Settle. The market fee remains 1% to the new team address. VRAM fixes a 2% fee in VRAM on transfers to/from registered V2 pools, not ordinary wallet transfers or mining claims. The factory is bound once by the creator; any genuine pair returned by that fixed factory can then be registered permissionlessly. Rate and recipient cannot be changed; EOAs cannot be marked as pools. No DEX factory or pool is configured yet.

Unregistered pools and other venues do not automatically pay the fee. Pool transfers also include later liquidity additions/removals; initial liquidity should be funded before registration. Use a fee-on-transfer-compatible V2 router; standard V3 routing is not supported. DEX compatibility and LP policy must be checked before opening trading.

## Runtime reliability
Robinhood and BSC use separate configured RPC secrets. Read-only mint status uses a chain-ID/code-checked JSON-RPC batch, deduplicated in-flight requests and a five-second successful-response cache. Authorization still performs fresh ownership, phase and nonce checks. The helper accepts completed official wallet results via --order-id or --signature-file and normalizes signatureRecovery; unsupported wallet agent-id commands fail with upgrade guidance.
