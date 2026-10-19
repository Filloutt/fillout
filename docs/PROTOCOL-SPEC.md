# Current protocol decisions

Revision 1.1 · 19 October 2026. Application: https://app.fillout.work

## Issuance

150,000 lifetime parts: 140,000 public and 10,000 team. Quote cap 117,392; Settle cap 32,608. Public split 109,566 / 30,434; team split 7,826 / 2,174. Fixed planned unit price 50,000,000,000,000 wei (0.00005 ETH). Full public sell-out yields 7 ETH gross, before costs; this is not a funding guarantee.

Mint is closed. Unsold allocation remains unissued pending a published policy. Burning does not restore lifetime issuance capacity. Proposed standards: ERC-1155 parts and ERC-721 circuits; final implementation and permissions are pending.

## Construction

The editor compiles NAND logic and synchronous one-bit memory. The proposed circuit factory must atomically validate, burn exact authorized quantities and issue the circuit NFT, reverting on failure. No such production factory is deployed. Storage format, data availability and worst-case gas require benchmarks before activation.

A netlist hash identifies exact bytes, not equivalent functionality, originality or useful work. Public designs can be copied. Redundant gates must not automatically earn extra score. Studio warns about parts outside every output path; the compiler still counts them.

## OpenBook

Airdrop details follow FillOut mint. Social applications are manually reviewed. Holding thresholds, snapshots, quantities and dates are unannounced. Burned-part attribution, circuit transfers and double counting must be specified before qualifying snapshots or burn activation; no eligibility formula is implied yet.

## VRAM

Planned reward token, not live. FillOut is intended as a higher-weight tier; OpenBook a base tier. Either collection can participate independently. Coefficients, utility, supply, emissions, task scores, verifier authority and dispute rules are undecided. No simulated hash power or daily yield is a financial entitlement. An operator-run verifier would be a centralized dependency requiring explicit disclosure. Exhaustive evaluation of 256 input bits is infeasible.

## Team

10,000 parts are unlocked, committed to circuit construction rather than sale. This is a team commitment, not an implemented transfer restriction. Team-circuit VRAM rewards are intended for 50% manual liquidity support and 50% operations, development and community. Users' rewards are not subject to this allocation. Liquidity requires counterpart assets and offers no price guarantee.

## Launch requirements

Publish source, deployment addresses, permissions, signing authority, independent security review and remediation before paid mint. Mining requires its own economic and verifier specification. No historical deployment implements or certifies this release. No automatic migration or compensation is promised for historical balances.
