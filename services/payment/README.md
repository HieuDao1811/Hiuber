# Hiuber Payment Service

Payment Service owns payment attempts and provider webhook receipts in its own
PostgreSQL database. It keeps only Order/Auth identifiers (no cross-database
foreign keys), reads amount, currency and ownership from Order, and never
accepts `amount`, `currency`, `customerId`, or a status from a client.

## Run locally

1. Create a separate `hiuber_payment` PostgreSQL database.
2. Copy `.env.example` to `.env`. Use the same `INTERNAL_SERVICE_KEY` in Order
   and Payment, configure Auth/Order URLs, and replace
   `MOCK_PROVIDER_WEBHOOK_SECRET` with at least 32 random characters.
3. Run `npm install`, `npm run db:generate`, and `npm run db:migrate` (or
   `npm run db:deploy`).
4. Start Auth, Order and their dependencies, then run `npm run dev` here.

Validation: `npm run db:validate`, `npm run typecheck`, `npm test`, `npm run build`.

## API

The customer endpoints require a valid `CUSTOMER` bearer token.

- `POST /v1/payments` requires an `Idempotency-Key` header (8-255 visible ASCII
  characters) and body `{ "orderId": "<uuid>", "method": "COD" }` or
  `MOCK_ONLINE`.
- `GET /v1/payments/:id` only returns a payment owned by that customer.

A first create returns `201`; a completed idempotent replay returns `200`; a
duplicate while the first request is processing returns `202`. Reusing the key
for different content returns `422`. COD stays `PENDING`/Order `UNPAID`.

The provider callback is `POST /v1/payment-provider/webhooks/mock`. It requires
the exact raw JSON body to be signed as
`HMAC-SHA256(MOCK_PROVIDER_WEBHOOK_SECRET, rawBody)` and sent in
`X-Mock-Signature: sha256=<hex>`. The event contains `paymentId`, `orderId`,
`providerTransactionId`, `amount`, and `currency`; all are checked against the
stored payment. Provider event IDs have a database unique constraint, and a
terminal payment cannot be applied twice or downgraded.

The mock adapter is deliberately gated by `PAYMENT_PROVIDER=MOCK`,
`ENABLE_MOCK_PAYMENT_PROVIDER=true`, and `NODE_ENV=development|test`; startup
fails for every other environment. `MOCK_ONLINE_OUTCOME=PENDING` exercises the
signed webhook path. `SUCCESS` and `FAILURE` are deterministic adapter-response
modes for development tests. There is no customer or production endpoint that
marks a payment successful. A failed attempt can be retried with a new
idempotency key; the database allows only one `PENDING`, `PROCESSING`, or
`SUCCEEDED` attempt per order.

Successful online payments and COD registration are synchronized to Order
immediately. Payment status and the pending Order-sync marker are written in the
same database update before any Order network call. If Order times out or is
down, the durable `orderSyncStatus`, attempt count, and next-attempt timestamp
drive a background reconciliation worker with bounded exponential backoff. The Order
consumer is idempotent. A success arriving after cancellation leaves the Order
`CANCELLED`, records it as paid, and sets Payment `resolutionStatus` to
`REFUND_REQUIRED`. All Order calls use `RPC_TIMEOUT_MS`.

Example:

```sh
curl -i http://localhost:3004/v1/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: checkout-6f9d3f07-1" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"33333333-3333-4333-8333-333333333333","method":"MOCK_ONLINE"}'

curl -i http://localhost:3004/v1/payments/<payment-id> \
  -H "Authorization: Bearer $TOKEN"
```

To exercise a delayed success, keep `MOCK_ONLINE_OUTCOME=PENDING`, copy the
returned payment and provider transaction IDs, construct this compact JSON
(without changing whitespace after signing), and post it with its HMAC:

```json
{"id":"evt_demo_1","type":"payment.succeeded","data":{"paymentId":"<payment-id>","orderId":"<order-id>","providerTransactionId":"<provider-transaction-id>","amount":"125000.00","currency":"VND"}}
```

The success redirect in a browser is informational only; it never changes
Payment or Order state.

## Beyond the mock

A real provider adapter still needs provider credentials, its official signature
scheme, provider-side idempotency, resolution of unknown/time-out outcomes,
refund execution, and operational reconciliation/alerts. The provider port,
verified-event handler, and durable synchronization fields are the extension
points for that work.
