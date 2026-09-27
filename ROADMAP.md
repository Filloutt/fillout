# Circuit challenges and VRAM

[Home](README.md) · [Circuit guide](CIRCUIT-GUIDE.md)

This page separates current functionality from proposed work after the mint phase. It is a design direction, not a release schedule or a reward commitment.

## Available foundation

- Quote NAND gates and Settle one-bit memory.
- Visual circuit design, local simulation and draft import/export.
- Collection-specific parts and circuit NFT creation.
- Wallet holdings and collection markets.

The GitHub application is a source snapshot; it can differ from the latest hosted interface. Publishing documentation here does not deploy website changes.

## Planned: challenges

A challenge would define a task, input/output ordering, allowed components, initial memory, step limits and expected behavior. A simple combinational challenge could require XOR for all four input combinations. A memory challenge would need multi-step input sequences and expected outputs.

The interface would show the task, let the user build a solution and explain failed cases. Production reward decisions would require a trusted verification path; a browser success message alone would not authorize rewards.

## Planned: circuit evaluation

Correctness comes first. A proposed evaluation process is:

1. Validate the circuit structure and selected challenge rules.
2. Evaluate all required cases or a defined verification suite.
3. Only for a passing solution, compare gate count, memory use and logic depth under that challenge's rules.
4. Record a versioned result so the same rules can be reproduced.

More parts should not automatically mean more power. Any scoring formula, weights, eligibility rules and caps remain undecided. Structural validity today is not a quality score.

## Planned: VRAM rewards

**VRAM is the chosen working name for the proposed reward token.** This repository update does not deploy a token or activate mining.

The intended direction is a daily reward allocation linked to verified, eligible circuit activity. A complete implementation would still need a token contract, emission policy, reward accounting, ownership rules and a claim mechanism.

There is no announced token contract address, supply, daily allocation, launch date or guaranteed return in this roadmap. Local simulation does not mine a token or perform proof-of-work.

## Decisions required before activation

- How challenge correctness is verified and who can publish challenges.
- How repeated, copied or equivalent solutions are handled.
- How multiple wallets, ownership changes and duplicate claims are handled.
- Whether participation requires locking an NFT, and how eligibility changes over time.
- How daily allocations, caps, rounding, unclaimed rewards and rule changes work.
- How contracts and the reward verifier are reviewed before real rewards are enabled.

These features are proposed additions. Existing part holders do not receive an automatic reward entitlement from this document.
