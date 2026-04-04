# Shared Booking Foundation

## What was refactored

The customer-side mock booking flow was moved toward a shared domain-first shape without changing the public UI flow itself.

Key refactors:
- Added `src/domain/booking/*` for booking entities, lifecycle rules, and booking service contracts.
- Added `src/domain/availability/*` for duration estimation and availability query contracts.
- Added `src/domain/customer/*` and `src/domain/staff/*` for shared customer, staff, schedule, and block-off models.
- Added `src/domain/config/*` for service duration rules and a code-first schema draft.
- Refactored `app/dat-lich/booking-mock.ts` so the current public demo flow now stores richer shared-domain-shaped booking data.

## Shared domain overview

### Booking
- One booking entity is intended to serve web self-booking, future staff dashboard booking, and future social-assisted booking.
- `source` and `channel` remain separate fields.
- `assignedStaffMode` supports both pool mode and specific-staff mode.
- Lifecycle rules are centralized in `src/domain/booking/lifecycle.ts`.

### Availability
- `DurationInput` and `DurationEstimate` define the duration engine contract.
- `AvailabilityQuery`, `AvailabilitySlot`, and `AvailabilityResult` define the shared availability engine contract.
- The mock runtime now uses explicit duration rules, staff working schedules, block-off windows, and mock stored bookings.

### Customer and staff
- `Customer` is the normalized shared customer record.
- `Staff`, `StaffWorkingSchedule`, and `BlockOff` provide the minimum shared scheduling foundation needed by both customer and staff surfaces later.

## How the customer flow connects now

- The public booking routes still use the existing screens and session-based demo transport.
- Those routes now depend on shared-domain-backed shapes for booking status, source, channel, staff assignment mode, duration estimate, and availability query context.
- This keeps the current demo intact while reducing the gap to a real backend-backed booking engine.

## How the future staff dashboard should connect

- The staff dashboard should call the same `AvailabilityServiceContract` and `BookingServiceContract`.
- The dashboard should not create a parallel booking model.
- Staff create/reschedule/confirm actions must reuse the same lifecycle rules, availability rules, booking entity, and audit model already added in this pass.
