# Shared Booking Foundation

## What was refactored

This pass keeps the customer demo UI unchanged while moving the codebase one layer closer to a real shared backend.

The latest layer now adds:
- a shared runtime selector that prefers Postgres when `DATABASE_URL` or `POSTGRES_URL` is configured
- real Postgres repository adapters for staff, schedules, block-off windows, duration rules, and bookings
- thin public booking API routes that the current customer flow can call without changing the visible UI
- a memory fallback runtime so local/demo use still works when no database is configured

Added:
- shared repository contracts under `src/domain/repositories/*`
- application service skeletons under `src/application/services/*`
- a shared availability engine skeleton in `src/domain/availability/engine.ts`
- in-memory repository adapters and a demo runtime under `src/infrastructure/memory/*`
- stronger booking/payment/pricing model support in the shared domain
- Postgres-backed runtime/bootstrap modules under `src/server/*`
- public booking routes under `app/api/public-booking/*`

Preserved:
- landing page pricing section for `19NAIL.STUDIO`
- Step 2 layout, labels, real-date behavior, and slot flow
- Step 3 contact and payment flow
- Step 4 confirmation and payment summary flow

## Shared domain overview

### Booking
- One `Booking` entity still serves customer web, future staff dashboard, and future assisted booking flows.
- `source` and `channel` remain separate fields.
- `assignedStaffMode` still supports both `pool` and `specific_staff`.
- The booking model now also has draft-ready payment and pricing summary fields so the current Step 3 and Step 4 behavior can map to the eventual shared schema.

### Repositories
- `BookingRepository`
- `CustomerRepository`
- `StaffRepository`
- `StaffScheduleRepository`
- `BlockOffRepository`
- `ServiceDurationRuleRepository`
- `AuditLogRepository`

These are the minimum persistence boundaries that both customer and future staff flows should use.

### Services
- `DefaultDurationService`
- `DefaultAvailabilityService`
- `DefaultBookingService`
- `DefaultCustomerService`

These are still skeletons, but their method signatures are backend-ready and align with the shared contracts already introduced earlier.

### Availability engine
- `runAvailabilityEngine(...)` is now the shared engine entrypoint.
- It models:
  - date
  - branch
  - pool vs specific staff mode
  - duration estimate
  - staff schedules
  - stored bookings
  - block-off periods
  - TEMP_HOLD windows
- It returns:
  - valid start slots
  - slot states
  - estimated end times
  - invalidation reasons
  - alternative slot suggestions

## How the customer flow connects now

- The public customer UI still uses session state to carry the in-progress draft between pages.
- Step 2 now calls the shared public booking context API for:
  - duration estimation
  - staff list
  - availability query
  - month/day slot-state summaries
- Step 3 now creates bookings through the shared `BookingService` path via `POST /api/public-booking/bookings`.
- Step 4 now reads the persisted booking by id through `GET /api/public-booking/bookings/:id` when a shared booking has already been created.
- The visible Step 2, Step 3, and Step 4 behavior was intentionally preserved.

## How the future staff dashboard should connect

- The future dashboard should call the same repository-backed services instead of building separate booking logic.
- Staff create/reschedule/confirm/check-in/complete actions should reuse:
  - `DefaultBookingService`
  - `DefaultAvailabilityService`
  - `DefaultDurationService`
  - the shared booking lifecycle rules
  - the same schema draft and repositories

## What is still mocked

- Postgres is optional until a real `DATABASE_URL` is configured; local verification in this prompt used the memory fallback runtime.
- The public flow still uses `sessionStorage` between steps for draft transport.
- TEMP_HOLD persistence is still draft-only and not a real backend resource yet.
- Customer profiles and audit logs do not have a real Postgres adapter yet.
