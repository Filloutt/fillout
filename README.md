# FillOut

A visual circuit studio for logic, memory and circuit ownership.

**Application:** https://app.fillout.work · **X:** https://x.com/Fillout_rh

## Current release

The Studio, English/Chinese interface, wallet connection, social applications and manually reviewed whitelist are implemented. Paid mint, irreversible burn-to-build and VRAM mining are **not active**. No production contract addresses are published for this release.

| Allocation | Quote | Settle | Total |
|---|---:|---:|---:|
| Public | 109,566 | 30,434 | 140,000 |
| Team circuit allocation | 7,826 | 2,174 | 10,000 |
| Lifetime maximum | 117,392 | 32,608 | 150,000 |

Planned price: **0.00005 ETH per part**, plus gas. USD equivalents vary. Target: Robinhood Chain mainnet, chain ID 4663 ([official network documentation](https://docs.robinhood.com/chain/connecting/)).

Quote is a NAND gate; Settle is one-bit state. The planned circuit factory burns parts permanently. OpenBook is a later airdrop; VRAM economics and verification require a separate final specification.

- [Protocol decisions and open questions](docs/PROTOCOL-SPEC.md)
- [Full English whitepaper](docs/WHITEPAPER.md) · [完整中文白皮书](docs/WHITEPAPER-zh.md)
- [Repository file guide](docs/REPOSITORY-MAP.md)
- [Security](SECURITY.md) · [Transparency](TRANSPARENCY.md)
- [Roadmap](ROADMAP.md) · [Release readiness](RELEASE-READINESS.md)
- [Structured parameters](docs/release-spec.json)

## Development

Node.js 22 or newer; no package installation is needed for the static preview or tests.

```sh
npm test
npm start
```

The preview serves `dist/` on `http://127.0.0.1:8088`. It does not emulate authenticated hosting or the database. Quest APIs require a Worker with D1, the SQL migrations in `drizzle/`, and trusted owner identity supplied by the hosting platform. Never accept identity headers directly from an untrusted public proxy.

`npm run build` requires `FILL_OUT_ADMIN_EMAIL` in the build environment and an existing hosting manifest at `.openai/hosting.json`. Hosting IDs and generated Worker bundles are intentionally excluded from Git. `X_BEARER_TOKEN` is an optional runtime secret; manual review works without it. Never commit credentials or participant records.

`docs/index.html`, `docs/404.html` and `docs/CNAME` retain the root-domain redirect. GitHub Pages serves that directory, not the application backend. This repository is the application source; pushing it alone does not deploy the hosted application.

Obsolete contracts, addresses and deployment evidence were removed from the current tree. Git history remains available; old commits do not specify the current release.
