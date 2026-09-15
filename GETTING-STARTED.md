# Working with the FillOut source

This repository contains the website's editable HTML, CSS and JavaScript files. The `dist` folder contains the application source, not a minified build.

## Continue with another AI assistant

Open this folder in your development tool and use the following instructions:

> Continue working on FillOut. Read GETTING-STARTED.md, README.md and docs/contracts.md first. Edit the website in dist. OpenBook and FillOut are separate collections; keep their contract addresses separate. Update the English and Chinese interfaces together. Write repository documentation, comments and commit messages in English. Do not initiate transactions that spend real funds. Run npm test after changes. Before publishing, check which hosting account and existing project will be used.

## Run locally

Install Node.js 22 or newer, then open a terminal in this folder:

```sh
npm start
```

Open http://127.0.0.1:8080 in your browser. Press Ctrl+C in the terminal to stop the server. Opening index.html directly does not provide the module loading environment the application needs. No additional packages are required for the website.

Run the local checks with:

```sh
npm test
```

## File guide

- `dist/app.mjs`: Pages, wallet integration, minting, markets, holdings and circuit creation.
- `dist/studio.mjs`: Canvas, collection selection and Studio controls.
- `dist/engine.mjs`: Circuit validation, simulation and netlist encoding.
- `dist/ui.mjs`: Language selection and shared helpers.
- `dist/styles.css`: Visual styling and layout.
- `dist/config.json`: Network settings and contract addresses for both collections.
- `dist/index.html`: Application entry point.
- `hosting-backup/hosting.json`: Connection information for the existing Sites project.

## Hosting and domain

The website is hosted on Sites, with fillout.work as its custom domain and Namecheap as its domain registrar. Having these files does not grant account access: publishing to the existing site requires authorization through its owner's Sites account. An assistant with Sites access should use the existing project ID in `hosting-backup/hosting.json`. In a Sites working copy, place that file at `.openai/hosting.json`.

The website can also be moved to another static hosting provider using `dist` as the publish directory. Test the pages and wallet connection at the new address before changing DNS in Namecheap. HTTPS is required. Pushing to this GitHub repository does not automatically publish the live website.

## Scope and limitations

Contracts remain on the blockchain when the website moves; moving files does not remove or redeploy them. Four Solidity source files recovered from the preparation kit are included in `contracts/src`. They compiled successfully, but equivalence to the deployed bytecode and the original Remix deployment settings remain unverified. See [the contract source guide](contracts/README.md).

Wallet private keys, recovery phrases, account passwords and deployment credentials are not included. Do not share them in AI conversations or commit them to this repository.

Studio drafts and some preferences are stored in the browser. Save important circuits using **Export draft** in Studio. Changing from the original site address to fillout.work does not automatically transfer browser drafts.

Mainnet transactions use real ETH. The local tests validate simulation behavior; they do not establish the safety of every deployed contract operation.
