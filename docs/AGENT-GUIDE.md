# FillOut — deployed agent integration

The V2 contracts are deployed on Robinhood Chain 4663. Mint scheduling and signing availability must be read from the live agent status endpoint; do not infer current launch state from this static guide. Canonical addresses and code hashes: /deployed-contracts.json. ABIs: /contract-abis.json. Never infer a new address or send stablecoins.

## Agent flow

1. Run official baw wallet status, wallet chains, wallet address and wallet agent-id. Confirm support for chain 4663. Never assume an unsupported chain works.
2. Run node fillout-agent.mjs status. If signingServiceReady is false, stop. For local QA append --base-url http://127.0.0.1:8095.
3. Run node fillout-agent.mjs challenge --action free (or paid --quote 4 --settle 1; assemble --tier rare; list --asset quote --amount 1 --unit-wei 100000 --deadline UNIX_SECONDS; fill --listing-id 1 --amount 1).
4. The helper returns a full wallet-bound EIP-712 ownership document plus structured baw sign-message preview arguments. Check Developer Mode in the Binance App. Preview; show parsed risks and authority changes; wait for explicit user confirmation before executing its requestId. Obtain the signature with official sign-message result. This proof is not a token allowance.
5. Run node fillout-agent.mjs authorize --challenge ORIGINAL_FILLOUT_CHALLENGE --order-id WALLET_ORDER_ID. The helper reads the official completed wallet result and joins signature + signatureRecovery correctly. Alternatively save the full official JSON result and use --signature-file wallet-signature.json. Never substitute a wallet requestId for the original FillOut challenge. The server verifies the signature and the actual SPACE ID registry owner, consumes the challenge once and returns exact contract calldata.
6. If approval is returned, preview its operator scope separately and ask for confirmation before executing it. Preview the actual contract transaction using returned from/to/value/inputData, confirm explicitly and execute only the successful preview requestId. Do not waive the wallet risk engine or Developer Mode.
7. Verify the receipt. Submission is not confirmation. If an authorization expires, request a fresh challenge. Never retry by increasing value or changing calldata.

The helper never signs or broadcasts, and the website never connects a browser wallet. Do not send wallet session tokens, private keys or seed phrases to these APIs.

## Read-only commands

node fillout-agent.mjs market --asset quote (or settle/circuit), node fillout-agent.mjs inventory --wallet 0xADDRESS. The API reads actual contract state. Per-NFT uncheckpointed mining rewards require the Circuit pending(tokenId) read in addition to settled account credit.

## Rules

80,000 Quote (ERC-1155 ID 0) + 20,000 Settle (ID 1). Free 4+1 once per Agent ID and wallet, at most 4,998 claims subject to remaining inventory. Free and paid parts are identical, freely transferable, tradable and combinable in every recipe. Extra quantities are independent, USD 0.30 reference each, paid only in native ETH using expiring signed quotes. No stablecoin payment.

After 168 hours or sold out, whichever first, assembly burns parts: Common 4+1 (4,998 cap), Rare 8+2 (3,336 cap), Epic 20+5 (1,666 cap with 75 team Epic and 100 team Rare reserved inside the existing rarity caps). Team parts are already issued inside the 100,000 cap.

VRAM 1B issued: 200M liquidity, 800M mining. Mining starts exactly 24 hours after closure, lasts seven days; Common/Rare/Epic pools 80M/240M/480M. Late NFTs do not earn retroactively. NFT transfers checkpoint the former owner. No administrator sweep. VRAM charges a fixed 2% team fee on registered V2 pool transfers, not ordinary wallet transfers; factory/pool registration remains pending.

Market supports Quote, Settle and Circuit; native ETH settlement charges 1% to the team address. Assets remain in seller custody and require operator approval. Seller cancels using the deployed market cancel(listingId) function; cancellation needs no identity permit.

## Launch state

The live signing service is https://fillout-agent-signer.fillout-cloudflare-service.workers.dev. Query /api/agent/status for the authoritative current phase. Liquidity pool/custody policy and independent review remain unclaimed. Read HANDOFF-SITES.md in the source package before publication.

## V2 allocation and fees
Team: 75 Epic + 100 Rare, backed by 2,300 Quote + 575 Settle already issued inside the 100,000 cap. Public capacity: 4,998 Common / 3,236 Rare / 1,591 Epic. Public parts: 77,700 Quote + 19,425 Settle. All paid mint ETH goes to liquidity. Market fee 1% and VRAM registered-pool fee 2% go to the new team wallet. The 2% is in VRAM and also affects liquidity transfers after pool registration; use a fee-on-transfer-compatible V2 router. No pool or factory is configured yet.
