# Availability Contracts

## Duration estimation

Shared types:
- `DurationInput`
- `DurationEstimate`

Shared service:
- `DefaultDurationService`
- contract-compatible with `AvailabilityServiceContract.estimateDuration(input)`

Current draft behavior:
- reads active `service_duration_rules`
- applies effect modifiers
- rounds blocked time to slot interval
- returns matched rule codes plus explicit draft notes

## Availability query

Shared types:
- `AvailabilityQuery`
- `AvailabilitySlot`
- `AvailabilityResult`
- `TemporaryHold`

Shared service:
- `DefaultAvailabilityService`

Shared engine entrypoint:
- `runAvailabilityEngine(...)`

The engine now models:
- date
- branch
- requested staff or pool mode
- guest count
- set type
- nail type
- polish style
- effects
- estimated duration
- staff working schedules
- existing bookings
- block-off periods
- TEMP_HOLD windows

The engine currently returns:
- valid start slots
- slot states
- estimated end time per slot
- invalidation reason text
- invalidation reason code
- optional alternative start slot suggestions
- per-staff diagnostics

## Slot states

Current modeled states:
- `available`
- `booked`
- `held`
- `closed`
- `past`
- `insufficient_duration`
- `continuation`

Notes:
- `continuation` exists in the engine skeleton for future internal/staff-facing use.
- the current public customer flow still collapses continuation segments into the same visible behavior it already had before this refactor.

## Repository-backed inputs

Availability now has explicit repository boundaries for:
- `StaffRepository`
- `StaffScheduleRepository`
- `BlockOffRepository`
- `BookingRepository`
- `ServiceDurationRuleRepository`

This keeps the future customer API and future staff dashboard on one availability path.

## Booking lifecycle alignment

Shared lifecycle actions still live in `BookingServiceContract` and `DefaultBookingService`:
- `createBooking(input)`
- `getBookingById(id)`
- `lookupBooking(referenceCode, phone)`
- `confirmBooking(id)`
- `checkInBooking(id)`
- `completeBooking(id, actualCompletedAt)`
- `cancelBooking(id, reason)`
- `rescheduleBooking(id, newDate, newStartTime)`

Rules carried forward:
- web booking defaults to `pending`
- final availability recheck must happen before create or confirm
- `TEMP_HOLD` is not a booking status
- completed early can support future slot release behavior

## Pool vs specific staff

Pool mode:
- query shows a start slot when at least one eligible staff member can cover the full blocked duration

Specific staff mode:
- query evaluates only the selected staff member's schedule, bookings, holds, and block-offs

## Current mock status

- The public demo still runs locally.
- Step 2 now calls a shared public booking context route:
  - `POST /api/public-booking/context`
- Step 3 now creates bookings through:
  - `POST /api/public-booking/bookings`
- Step 4 now reads persisted bookings through:
  - `GET /api/public-booking/bookings/:id`
- When `DATABASE_URL` or `POSTGRES_URL` is configured, the same service path can use Postgres-backed repositories.
- TEMP_HOLD persistence remains TODO and still falls back to demo-only behavior.
