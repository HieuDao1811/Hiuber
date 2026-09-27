# Hiuber Customer Service

Customer Service owns customer profiles and delivery addresses. Auth identities
are verified through `POST /internal/auth/verify`; this service stores the Auth
`sub` as `userId` without a cross-database foreign key.

## Run locally

Requirements: Node.js with built-in `fetch`, PostgreSQL, and the Auth Service.

1. Copy `.env.example` to `.env` and update `DATABASE_URL` and
   `AUTH_SERVICE_URL`.
2. Install dependencies with `npm install`.
3. Generate the Prisma client with `npm run db:generate`.
4. Apply migrations with `npm run db:migrate` (or `npm run db:deploy` outside
   development).
5. Start the service with `npm run dev`.

Validation commands:

```sh
npm run db:validate
npm run typecheck
npm test
npm run build
```

## HTTP API

All customer routes require `Authorization: Bearer <accessToken>` and a verified
`CUSTOMER` role.

- `POST /v1/customers/me`
- `GET /v1/customers/me`
- `PATCH /v1/customers/me`
- `GET /v1/customers/me/addresses`
- `POST /v1/customers/me/addresses`
- `PATCH /v1/customers/me/addresses/:addressId`
- `DELETE /v1/customers/me/addresses/:addressId`
- `PATCH /v1/customers/me/addresses/:addressId/default`

Successful JSON responses use `{ "data": ... }`. Errors use
`{ "error": { "code": "...", "message": "...", "details": ... } }`.
The default-address endpoint takes no request fields. Address creation and
ordinary address updates always reject `isDefault`.
