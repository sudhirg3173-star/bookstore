# Cashfree Sandbox Validation

Date: 2026-10-05

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Server startup | PASS | `npm run dev:payments`, ready on http://localhost:3001 in 2.8 seconds |
| Payment regression tests | PASS | `npm run test:payments`: 7 passed, 0 failed, exit code 0 |
| Real Cashfree order creation | PASS | HTTP 200, sandbox payment session returned; official SDK opened https://sandbox.cashfree.com/checkout/ |
| Successful hosted payment | PASS | Cashfree test card and simulator SUCCESS; redirected to local return page, server verified payment, cart cleared |
| Paid order persistence | PASS | Local order status `Credit`, payment ID present, amount INR 14726.69; assertion command exit code 0 |
| Failed hosted payment | PASS | Cashfree simulator FAILED with insufficient-funds reason; return page did not show success, cart retained |
| Unpaid order persistence | PASS | Order remained `Pending`, no successful payment ID; Cashfree keeps active orders retryable |
| Real sandbox HTTP assertions | PASS | Repeatable script below, exit code 0 |
| Invalid webhook signature | PASS | Running server returned HTTP 403; unpaid status unchanged |
| Forged return URL | PASS | `/api/payment/verify?status=Credit` returned HTTP 400 |
| Browser-written order status | PASS | Legacy save-order endpoint returned HTTP 410 |

No actual debit occurred. Both hosted payment flows used Cashfree's sandbox
simulator and documented test card. Credentials were checked only for presence
and were never printed. Test orders are stored in ignored `.local/payments/`,
not production Firestore.

## Repeatable Checks

The HTTP check calls the running app, which fetches current order status from
the real Cashfree sandbox API. It does not mock payment responses.

```bash
npm run test:payments
node scripts/test-payments-sandbox.mjs kb_80de9c78a71244a69b1116747a9fda1b kb_1ff773f3429e48ec8f912f7295763917
```

For a different server origin, set `PAYMENT_SANDBOX_URL`. For a new test run,
supply a completed sandbox order ID followed by an unpaid sandbox order ID.

## Remaining Gaps

- Cashfree-delivered signed webhooks and browser-closed completion were not tested: localhost is not publicly reachable. Use an HTTPS tunnel and register its webhook URL in the Cashfree sandbox dashboard.
- Production credentials, production Firestore writes, and authenticated account checkout were not exercised; this run used isolated local storage and guest checkout.
- The integrated browser's request client failed with `Storage.getCookies: Method not found`; real HTTP assertions were run successfully using Node instead. Hosted browser interactions were unaffected.

Overall: PASS for guest hosted sandbox checkout, success/failure handling,
return-page verification, isolated persistence, and forged-status rejection.
Public webhook delivery remains unverified.

## Earlier Combined Configuration Check

Date: 2026-10-05. This follow-up is separate from the earlier hosted Cashfree
results above; no new hosted payment or real ShipGlobal quote was performed.

| Check | Result | Evidence |
| --- | --- | --- |
| Combined regression suite | PASS | `npm run test:payments`: 12 passed, 0 failed, exit code 0 |
| Shipping-inclusive payment total | PASS (mocked providers) | INR 100 catalogue subtotal plus INR 300 shipping creates an INR 400 Cashfree order |
| Paid verification and persistence | PASS (mocked providers) | Order becomes `Credit` with payment ID; shipping metadata, country, address and total remain intact |
| Webhook safety and retries | PASS (mocked providers) | Invalid signature rejected; repeated valid webhooks preserve shipping data; later failed event cannot downgrade a paid order |
| Changed/unavailable shipping | PASS (mocked providers) | Changed fee rejected with HTTP 409; unavailable provider rejected with HTTP 502; neither creates another payment order |
| Sandbox prerequisites | PARTIAL | Node.js v22.16.0 and Cashfree credential presence confirmed; values were not displayed |
| Real two-provider checkout | BLOCKED | `SHIPGLOBAL_EMAIL` and `SHIPGLOBAL_PASSWORD` are missing; `SHIPGLOBAL_WEIGHTS_KG` has zero configured physical SKUs |

### Live-Test Prerequisites

Enter ShipGlobal account credentials directly in `.env.payments.local`, without
sharing them in chat. Configure `SHIPGLOBAL_WEIGHTS_KG` with the measured packed
weight in KG for a real, in-stock physical catalogue SKU. See the international
shipping setup in README.md. Restart using `npm run dev:payments`, which forces
Cashfree sandbox mode and isolates orders in `.local/payments/`.

The next live check must obtain an actual ShipGlobal quote, create a Cashfree
sandbox order including that shipping charge, complete the hosted test payment,
and verify both its stored total and shipping metadata. Do not call shipment
booking or label-purchase APIs for this rate-and-payment test.

Overall combined verdict: NEEDS CONFIGURATION. The application-level lifecycle
passes with mocked providers, but real ShipGlobal authentication, account rates,
and a shipping-inclusive hosted Cashfree checkout remain unverified.

## Latest Real Combined Retest

Date: 2026-10-05. This retest supersedes the earlier configuration blocker for
the sandbox test only. Cashfree and ShipGlobal credentials were present and
were never displayed. The user approved a temporary 0.5 KG test fixture for
SKU `9789373324883`, destination `GB`, postcode `SW1A 1AA`. The fixture was
injected only into the isolated server process; `.env.payments.local` was not
modified and no production catalogue weight was invented.

| Check | Result | Evidence |
| --- | --- | --- |
| Regression baseline | PASS | `npm run test:payments`: 12 passed, 0 failed, exit code 0 |
| Isolated server | PASS | http://localhost:3001 ready in 3.6 seconds; Cashfree forced to sandbox; orders stored in `.local/payments/` |
| Real ShipGlobal quote | PASS | HTTP 200; six services returned for the 0.5 KG UK parcel |
| Shipping-inclusive checkout | PASS | AI For Marketing subtotal INR 760 plus ShipGlobal Direct INR 691 equals INR 1451 |
| Real Cashfree order and hosted payment | PASS | Official SDK opened Cashfree sandbox; international phone accepted; simulator confirmed INR 1451 without actual debit |
| Successful return and persistence | PASS | Paid order `kb_639f6e960f2141ec89ea07d93700cca9` verified as `Credit`, payment ID present, cart cleared, pending browser marker cleared |
| Shipping metadata after payment | PASS | Paid order retained INR 691 fee, ShipGlobal Direct service, 0.5 KG weight, country GB and postcode SW1A 1AA |
| Failed hosted attempt | PASS | Sandbox insufficient-funds simulation; order `kb_16ec1d71acd64e7db9b501101ce8220c` remained `Pending`, no paid ID, no success message, cart retained |
| Repeatable real-provider assertions | PASS | Sandbox script below exited 0 and checked both orders, stored shipping totals and metadata |
| Forged payment status/webhook rejection | PASS | Invalid webhook HTTP 403, forged return HTTP 400, legacy browser save-order endpoint HTTP 410; paid/unpaid states unchanged |

### Repeatable Combined Assertions

Run while the isolated test server is available. `--shipping` checks local stored
shipping metadata and totals; this assertion mode uses INR catalogue fixtures.

```bash
node scripts/test-payments-sandbox.mjs kb_639f6e960f2141ec89ea07d93700cca9 kb_16ec1d71acd64e7db9b501101ce8220c --shipping
```

### Boundaries and Remaining Gaps

- ShipGlobal used its real rate endpoint; Cashfree used real sandbox APIs and its hosted simulator. No provider responses were mocked in the two browser payment flows.
- No real debit, shipping booking, wallet debit, label purchase or tracking request occurred. Test orders remain only in ignored local storage.
- Actual merchant parcel weights are still required before production international checkout. The approved 0.5 KG fixture is temporary test data, not a measured shipping specification.
- Public Cashfree webhook delivery and browser-closed completion remain unverified on localhost; a configured HTTPS tunnel is required.
- Production payments, Firestore writes, authenticated account checkout and other destinations were not exercised.

Latest overall verdict: PASS for the live ShipGlobal quote plus Cashfree sandbox
success/failure checkout, shipping-inclusive totals, isolated persistence and
forged-status rejection. Production fulfillment remains outside this test.