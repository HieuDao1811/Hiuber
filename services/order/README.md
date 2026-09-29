# Hiuber Order Service

Order Service owns order history and immutable checkout snapshots. It verifies
access tokens through Auth, resolves the selected address through Customer with
the customer's bearer token, and reads menu/ownership data from Restaurant.
There are no cross-database foreign keys or distributed transactions.

## Run locally

Requirements: Node.js with built-in `fetch`, PostgreSQL, and the Auth, Customer,
and Restaurant services.

1. Copy `.env.example` to `.env` and configure the service URLs, Order database,
   and fixed `DELIVERY_FEE`.
2. Install dependencies: `npm install`.
3. Generate Prisma Client: `npm run db:generate`.
4. Apply the Order migration: `npm run db:migrate` (or `npm run db:deploy`).
5. Start: `npm run dev`.

Validation commands:

```sh
npm run db:validate
npm run typecheck
npm test
npm run build
```

## HTTP API

Customer routes require a verified `CUSTOMER` token:

- `POST /v1/orders`
- `GET /v1/orders?limit=10&cursor=<orderId>`
- `GET /v1/orders/:orderId`

Create body:

```json
{
  "restaurantId": "44444444-4444-4444-8444-444444444444",
  "addressId": "55555555-5555-4555-8555-555555555555",
  "items": [
    {
      "menuItemId": "66666666-6666-4666-8666-666666666666",
      "quantity": 2
    }
  ]
}
```

Restaurant routes require a verified `RESTAURANT` token and ownership confirmed
against Restaurant Service:

- `GET /v1/restaurants/:restaurantId/orders?limit=10&cursor=<orderId>`
- `GET /v1/restaurants/:restaurantId/orders/:orderId`
- `PATCH /v1/restaurants/:restaurantId/orders/:orderId/status`

Status body:

```json
{ "status": "CONFIRMED" }
```

Allowed transitions are `PENDING -> CONFIRMED -> PREPARING -> READY ->
COMPLETED`. A restaurant may also move `PENDING`, `CONFIRMED`, or `PREPARING`
to `CANCELLED`.

Health endpoints are `GET /health` (process liveness) and `GET /ready` (Order
database connectivity). Successful JSON responses use `{ "data": ... }`;
errors use `{ "error": { "code": "...", "message": "..." } }`.

`POST /v1/orders` does not yet implement an idempotency key. A client must not
assume that retrying after an unknown network outcome is safe.

Orders also expose `paymentMethod` (`null`, `COD`, or `MOCK_ONLINE`) and
`paymentStatus` (`UNPAID` or `PAID`). They are server-owned fields. Configure
`INTERNAL_SERVICE_KEY` to the same value in Order and Payment; Payment alone
uses the protected internal payment context/synchronization API. Repeating the
same synchronization is safe.

## Internal Restaurant contract

Restaurant Service exposes `POST /internal/restaurants/order-context` for an
exact, server-side read of the restaurant, owner, status, and requested menu
items, including unavailable items. Deploy `/internal/*` routes only on the
private service network, matching the existing Auth internal-RPC convention.

Restaurant currently has no inventory model, so checkout validates menu
existence, restaurant ownership/status, availability, and price but does not
reserve stock. Address/menu reads and the Order database transaction are not a
distributed transaction; the persisted snapshots are the checkout-time values
returned by the owning services.

