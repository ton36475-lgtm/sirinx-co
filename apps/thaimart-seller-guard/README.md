# SIRINX ThaiMart Guard

Chrome Extension (Manifest V3) for a controlled handoff from ThaiMart Seller Center to the local SIRINX K01-K15 workflow service.

## What it does

- Runs only on `https://seller.thaimart.com/*`.
- Captures a session-only metadata snapshot: route, heuristic page kind, table presence, observed row count, and whether product-control labels are present. These observations do not prove rendered visibility or product identity.
- On **Start local dry-run**, captures the current Seller Center tab again and confirms that the active tab and URL have not changed before sending the request to `http://127.0.0.1:8790/api/thaimart/workflow/dry-run`.
- Sends workflow ID/type plus a closed `sellerPageContext`: `schemaVersion`, `sourceHost`, `pageKind`, `observedTableRowCount`, `hasTable`, `productControlsPresent`, and `capturedAt`. The raw route stays in extension session storage and is excluded from the request.
- Requires a canonical UTC timestamp no older than 120 seconds and no more than 5 seconds in the future. Missing, stale, invalid, or changed-tab context produces a local error before the workflow request.
- Confirms a matching local receipt, structural context, and false external capability flags before showing success. Empty or contradictory successful HTTP responses are errors; no fallback workflow state is invented.
- Shows an explicit blocked state for catalog, price, stock, order, chat, and publishing actions.

## What it never does

- Does not automate login, bypass anti-bot controls, inspect cookies, tokens, or Seller Center session storage.
- Does not collect form values, product details, customer data, addresses, orders, or messages.
- Does not click Seller Center controls.
- Does not create, upload, publish, hide, edit, or delete products.
- Does not call ThaiMart APIs or webhooks.

The structural context uses version `seller-page-structure-v1`. Row count is an integer from 0 to 9999, page kind is `product-list` or `unclassified`, and presence fields are strict booleans. Page observations are informational context and grant no read, write, publishing, or execution authority. The local engine also supports legacy workflow requests without page context and reports that context as absent.

## Load locally

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select this folder: `apps/thaimart-seller-guard`.
5. Keep the SIRINX Control API local if using the dry-run handoff. The extension never starts it automatically.

## External connector gate

The ThaiMart connector remains `disabled_pending_contract`. Enabling any read or write integration requires official documentation for authentication, available APIs, rate limits, webhook signing, reconciliation, rollback, and a separate scoped approval.
