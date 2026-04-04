# Availability Contracts

## Duration estimation contract

Shared type:
- `DurationInput`
- `DurationEstimate`

Contract:
- `AvailabilityServiceContract.estimateDuration(input)`

Behavior:
- Accepts service selections plus assignment mode and optional staff/branch context.
- Returns estimated duration, blocked duration, slot interval, matched rule codes, and draft notes.
- The current mock runtime already routes duration estimation through explicit `service_duration_rules`-style data.

## Availability query contract

Shared type:
- `AvailabilityQuery`
- `AvailabilitySlot`
- `AvailabilityResult`

Contract:
- `AvailabilityServiceContract.queryAvailability(input)`

Behavior:
- Uses one shared query model for customer web and future staff dashboard.
- Intended inputs include:
  - date
  - staff assignment mode
  - optional requested staff id
  - branch id if applicable
  - duration input
  - slot interval
- Intended results include:
  - slot state
  - start and end time
  - reason when unavailable
  - continuous free minutes
  - optional available staff ids

## Booking lifecycle-related contracts

Shared booking lifecycle actions are defined in `BookingServiceContract`:
- `createBooking(input)`
- `confirmBooking(id)`
- `checkInBooking(id)`
- `completeBooking(id, actualCompletedAt)`
- `cancelBooking(id, reason)`
- `rescheduleBooking(id, newDate, newStartTime)`
- `getBookingById(id)`
- `lookupBooking(referenceCode, phone)`
- `searchCustomers(query)`
- `upsertCustomerFromBooking(input)`

Lifecycle notes:
- Web booking default is `pending`.
- Final availability recheck must happen before create or confirm.
- `TEMP_HOLD` is separate from booking status and should never be collapsed into `confirmed`.
- `completed` captures `actualCompletedAt` so future slot release logic can reopen unused time.

## Pool staff vs specific staff mode

### Pool mode
- `assignedStaffMode = pool`
- Availability shows a slot when at least one eligible staff member can cover the full duration.
- Staff assignment can happen later.

### Specific staff mode
- `assignedStaffMode = specific_staff`
- Availability is evaluated only against the selected staff member’s working schedule, block-offs, and stored bookings.

## Current mock status

- The mock flow still runs locally, but it now uses the shared contract shapes.
- The next phase should replace the local runtime with real implementations of these contracts rather than building a second booking model.
