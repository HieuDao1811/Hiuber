# Hiuber Order Service

Order Service owns order history and immutable checkout snapshots. It verifies
access tokens through Auth, resolves the selected address through Customer with
the customer's bearer token, and reads menu/ownership data from Restaurant.
There are no cross-database foreign keys or distributed transactions.

## Run locally

Requirements: Node.js with built-in `fetch`, PostgreSQL, and the Auth, Customer,
and Restaurant services.

1. Copy `.env.example` to `.env` and configure the service URLs, Order database,
   fixed `DELIVERY_FEE`, and server-owned `ORDER_CURRENCY`.
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
`INTERNAL_SERVICE_KEY` to the same value in Order, Payment, and Restaurant.
Payment alone uses the protected internal payment context/synchronization API,
while Order uses the same service credential for Restaurant ownership and menu
lookups. Repeating the same payment synchronization is safe. Order processing
status remains independent from payment status: a late paid callback never
reopens a `CANCELLED` order. The internal payment context is the authoritative
source for total and currency.

## Notifications and Socket.IO

Notifications are stored in the Order database in the same transaction as the
order mutation and its outbox event. The database is the source of truth;
Socket.IO is only the low-latency delivery path. On initial load and every
reconnect, clients fetch the latest Order and notification state through HTTP.

Authenticated customers and restaurant owners can use:

- `GET /v1/notifications?limit=20&cursor=<notificationId>`
- `GET /v1/notifications/unread-count`
- `PATCH /v1/notifications/:notificationId/read`
- `PATCH /v1/notifications/read-all`

Every operation is scoped to `requester.userId`. The
`(recipientUserId, sourceEventId)` unique constraint prevents a replayed source
event from creating a duplicate notification.

Connect Socket.IO to the Order Service with the access token in
`socket.handshake.auth.accessToken`. The server verifies it through Auth, stores
the requester in `socket.data`, and joins `user:<verified-user-id>`. It
reverifies the token every `SOCKET_AUTH_RECHECK_MS`; an invalid or expired token
receives `auth.expired` and is disconnected. The only client events are:

```ts
socket.emit("order:subscribe", { orderId });
socket.emit("order:unsubscribe", { orderId });
socket.emit("restaurant:subscribe", { restaurantId });
socket.emit("restaurant:unsubscribe", { restaurantId });
```

Order subscriptions are authorized against customer ownership or current
Restaurant-Service ownership. Restaurant rooms are restricted to the verified
owner. Client-supplied identity and role values are ignored, and socket events
cannot mutate orders or payments.

Server events are `order.created`, `order.status.updated`,
`payment.status.updated`, `notification.created`, and `auth.expired`.
Order-related payloads contain `eventId`, `orderId`, `occurredAt`, `version`,
`orderStatus`, `paymentStatus`, and `paymentMethod`; clients discard versions
that are not newer than their displayed Order. Notification events contain the
persisted notification and its source Order version. Payment still synchronizes
through the authenticated internal Order API; Socket.IO never reads Payment's
database.

The outbox is polled only after commit and failed publishing is retried with
exponential backoff. This keeps the event durable if realtime delivery is
temporarily unavailable and prevents a failed business transaction from
emitting a success event.

### Try with two accounts

1. Apply the Order and Payment migrations, then start Auth, Customer,
   Restaurant, Order, Payment and the frontend.
2. Sign in as a customer in one window and as the selected restaurant's owner
   in a private window.
3. Open `/orders/<order-id>` as the customer and
   `/restaurants/<restaurant-id>/orders/<order-id>` as the owner.
4. Update through an authorized HTTP API, or complete the signed mock webhook
   flow documented in `services/payment/README.md`.
5. Verify both pages update without reload and the notification inboxes retain
   messages after disconnecting and reconnecting.
6. Attempt to subscribe to another customer's order or another owner's
   restaurant and verify the acknowledgement returns `FORBIDDEN`.

### Multiple instances

The current Socket.IO adapter and outbox poller are process-local, so realtime
delivery is supported for a single Order instance. Persistent notifications,
event IDs, Order versions, and API resynchronization remain safe, but horizontal
scaling requires a shared Socket.IO adapter (such as Redis) and an atomic outbox
claim/lease or broker consumer. Without those additions, instances can race to
publish one row or publish on an instance that does not own the target socket.
Frontend event-ID deduplication is a safety net, not a replacement for that
infrastructure.

## Internal Restaurant contract

Restaurant Service exposes `POST /internal/restaurants/order-context` for an
exact, server-side read of the restaurant, owner, status, and requested menu
items, including unavailable items. It requires the shared key in the
`X-Internal-Service-Key` header. Deploy `/internal/*` routes only on the private
service network as an additional boundary.

Restaurant currently has no inventory model, so checkout validates menu
existence, restaurant ownership/status, availability, and price but does not
reserve stock. Address/menu reads and the Order database transaction are not a
distributed transaction; the persisted snapshots are the checkout-time values
returned by the owning services.

