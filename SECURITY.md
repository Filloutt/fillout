# Security

No independent audit is claimed. Mint, burn and mining are inactive. Report vulnerabilities privately to the maintainers before publishing exploit details; routine issues can be filed at https://github.com/Filloutt/fillout/issues. Never post secrets or participant records.

Wallet connection requests an address and a readable message signature, verified against that address. It does not authorize transactions or token transfers. A manually entered quest address proves no ownership.

Quest applications are stored server-side. Same-origin checks, bounded bodies, HttpOnly sessions and unique address/post constraints reduce abuse. Clicking Verify is not proof of follow, like, repost or account ownership. The owner must inspect those tasks manually. Deleted or invalid posts must be rejected. API integration is optional; without it manual approval is sufficient for publication. Rejection removes eligibility even after publication. New approvals become visible once campaign results have been published.

Admin endpoints require the hosting platform's authenticated owner identity. The public source requires a deployment-specific owner email; it contains no personal owner identity. The platform must strip untrusted identity headers. Do not expose the Worker behind a proxy that accepts spoofed authentication headers.

Compiler checks cover structure, dependencies and Boolean execution, not semantic uniqueness or smart-contract safety. Before paid mint disclose owner, upgrade, pause, pricing, supply and withdrawal powers, addresses and single-key/multisig control. Team policy is not technically enforced unless final code does so.
