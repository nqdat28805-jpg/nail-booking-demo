# Backend MVP Foundation

## What became database-backed

The codebase now has a real Postgres-ready path for:
- `staff`
- `staff_working_schedules`
- `block_off`
- `service_duration_rules`
- `bookings`

Implemented layers:
- Postgres client bootstrap in `src/server/db/client.ts`
- schema bootstrap/seed in `src/server/db/schema.ts`
- Postgres repositories in `src/server/repositories/postgres.ts`
- shared runtime selector in `src/server/runtime/shared-booking-runtime.ts`
- public booking routes in `app/api/public-booking/*`

## What the customer flow now uses

The current customer flow still looks the same, but the core service path changed:
- Step 2 calls the shared availability and duration path through `POST /api/public-booking/context`
- Step 3 creates a booking through `DefaultBookingService` via `POST /api/public-booking/bookings`
- Step 4 can read the persisted booking by id through `GET /api/public-booking/bookings/:id`

This means the customer flow no longer depends only on client-local booking creation for the core source of truth.

## Fallback behavior

If no Postgres connection string is configured:
- the same shared repository/service path falls back to the in-memory runtime
- seeded staff, schedules, block-off windows, duration rules, and demo bookings still power the customer demo

This fallback keeps the local demo working while the real DB connection is still pending.

## What still remains mocked

- `TEMP_HOLD` persistence is still mocked and not stored in Postgres yet
- customer profiles still use a null/in-memory placeholder repository
- audit log persistence still uses a placeholder repository
- Step 2 to Step 4 draft transport still uses `sessionStorage`
- no staff dashboard UI exists yet

## Why this unblocks the next staff prompts

The next prompt can build a staff MVP on the same shared runtime because:
- staff lists come from the same repository path
- availability is queried through the same shared service
- bookings are created and read from the same shared service path
- schema/bootstrap already defines the minimum booking/staff/schedule/block-off/rule tables needed for staff operations
