# Hiuber Payment Service

Payment Service owns payment attempts in its own PostgreSQL database. It keeps
only Order/Auth identifiers (no cross-database foreign keys), reads the amount
and ownership from Order, and never accepts `amount`, `customerId`, or a status
from a client.

## Run locally

1. Create a separate `hiuber_payment` PostgreSQL database.
2. Copy `.env.example` to `.env`. Use the same `INTERNAL_SERVICE_KEY` in Order
   and Payment, and configure Auth/Order URLs.
3. Run `npm install`, `npm run db:generate`, and `npm run db:migrate` (or
   `npm run db:deploy`).
4. Start Auth, Order and their dependencies, then run `npm run dev` here.

Validation: `npm run db:validate`, `npm run typecheck`, `npm test`, `npm run build`.

## API

Both endpoints require a valid `CUSTOMER` bearer token.

- `POST /v1/payments` requires an `Idempotency-Key` header (8–255 visible ASCII
  characters) and body `{ "orderId": "<uuid>", "method": "COD" }` or
  `MOCK_ONLINE`.
- `GET /v1/payments/:id` only returns a payment owned by that customer.

A first create returns `201`; a completed idempotent replay returns `200`; a
duplicate while the first request is processing returns `202`. Reusing the key
for different content returns `422`. COD stays `PENDING`/Order `UNPAID`.

`MOCK_ONLINE_OUTCOME=SUCCESS` or `FAILURE` controls the mock provider at process
startup. Clients cannot submit an outcome or mark a payment successful. A failed
attempt can be retried with a new idempotency key.

Successful online payments and COD registration are synchronized to Order
immediately. If that call times out or fails, the durable `orderSyncStatus`,
attempt count, and next-attempt timestamp drive a background reconciliation
worker with bounded exponential backoff. All Order calls use `RPC_TIMEOUT_MS`.

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

## Beyond the mock

A real provider adapter still needs provider credentials, provider-side
idempotency, signed webhook verification, resolution of unknown/time-out
outcomes, refunds, and operational reconciliation/alerts. The provider port and
durable attempt/synchronization fields are the extension points for that work.
