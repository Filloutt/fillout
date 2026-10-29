# FillOut — deployed agent integration

Five contracts are deployed on Robinhood Chain 4663. Mint has not opened; the signing service requires secure runtime configuration. Canonical addresses and code hashes: /deployed-contracts.json. ABIs: /contract-abis.json. Never infer a new address or send stablecoins.

## Agent flow

1. Run official baw wallet status, wallet chains, wallet address and wallet agent-id. Confirm support for chain 4663. Never assume an unsupported chain works.
2. Run node fillout-agent.mjs status. If signingServiceReady is false, stop. For local QA append --base-url http://127.0.0.1:8095.
3. Run node fillout-agent.mjs challenge --action free (or paid --quote 4 --settle 1; assemble --tier rare; list --asset quote --amount 1 --unit-wei 100000 --deadline UNIX_SECONDS; fill --listing-id 1 --amount 1).
4. The helper returns a full wallet-bound EIP-712 ownership document plus structured baw sign-message preview arguments. Check Developer Mode in the Binance App. Preview; show parsed risks and authority changes; wait for explicit user confirmation before executing its requestId. Obtain the signature with official sign-message result. This proof is not a token allowance.
5. Run node fillout-agent.mjs authorize --challenge CHALLENGE --signature SIGNATURE. The server verifies the signature and the actual SPACE ID registry owner, consumes the challenge once and returns exact contract calldata.
6. If approval is returned, preview its operator scope separately and ask for confirmation before executing it. Preview the actual contract transaction using returned from/to/value/inputData, confirm explicitly and execute only the successful preview requestId. Do not waive the wallet risk engine or Developer Mode.
7. Verify the receipt. Submission is not confirmation. If an authorization expires, request a fresh challenge. Never retry by increasing value or changing calldata.

The helper never signs or broadcasts, and the website never connects a browser wallet. Do not send wallet session tokens, private keys or seed phrases to these APIs.

## Read-only commands

node fillout-agent.mjs market --asset quote (or settle/circuit), node fillout-agent.mjs inventory --wallet 0xADDRESS. The API reads actual contract state. Per-NFT uncheckpointed mining rewards require the Circuit pending(tokenId) read in addition to settled account credit.

## Rules

80,000 Quote (ERC-1155 ID 0) + 20,000 Settle (ID 1). Free 4+1 once per Agent ID and wallet, at most 4,998 claims subject to remaining inventory. Free and paid parts are identical, freely transferable, tradable and combinable in every recipe. Extra quantities are independent, USD 0.30 reference each, paid only in native ETH using expiring signed quotes. No stablecoin payment.

After 168 hours or sold out, whichever first, assembly burns parts: Common 4+1 (4,998 cap), Rare 8+2 (3,336 cap), Epic 20+5 (1,666 cap including 50 team). Team parts are already issued inside the 100,000 cap.

VRAM 1B issued: 200M liquidity, 800M mining. Mining starts exactly 24 hours after closure, lasts seven days; Common/Rare/Epic pools 80M/240M/480M. Late NFTs do not earn retroactively. NFT transfers checkpoint the former owner. No administrator sweep or 2% transfer tax.

Market supports Quote, Settle and Circuit; native ETH settlement charges 1% to the team address. Assets remain in seller custody and require operator approval. Seller cancels using the deployed market cancel(listingId) function; cancellation needs no identity permit.

## Launch state

The server implementation is supplied, but the production creator signing secret and enable flag are not configured in this package. Mint is unscheduled. Liquidity pool/custody policy and independent review remain unclaimed. See docs/SERVICE.md for service configuration.
