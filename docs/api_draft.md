# API Draft

This is the draft future API surface for the shared booking system.

Current MVP implementation in this repo:
- `POST /api/public-booking/context`
- `POST /api/public-booking/bookings`
- `GET /api/public-booking/bookings/:id`

These implemented routes are intentionally thin wrappers around the shared runtime and services. The broader route list below remains the target API shape for the next prompts.

## Availability

### `GET /availability`
- Purpose: shared availability query for customer web and future staff dashboard
- Query params:
  - `date`
  - `branchId`
  - `requestedStaffId`
  - `staffAssignmentMode`
  - `guestCount`
  - `setType`
  - `nailType`
  - `polishStyle`
  - `effects[]`
  - `slotIntervalMinutes`
- Response:
  - `date`
  - `estimate`
  - `slots[]`
  - `suggestedDates[]`
  - `generatedAt`

### `POST /booking-holds`
- Purpose: create a TEMP_HOLD before booking confirmation
- Request body:
  - `date`
  - `startTime`
  - `durationMinutes`
  - `branchId`
  - `requestedStaffId`
  - `createdBySessionId`
- Response:
  - `hold`
  - `expiresAt`
  - `status`

## Bookings

### `POST /bookings`
- Purpose: create a shared booking after final availability recheck
- Request body:
  - `customer`
  - `date`
  - `startTime`
  - `guestCount`
  - `setType`
  - `nailType`
  - `polishStyle`
  - `effects`
  - `notes`
  - `source`
  - `channel`
  - `assignedStaffMode`
  - `assignedStaffId`
  - `shopId`
  - `paymentSummary`
  - `pricingSummary`
  - `finalAvailabilityQuery`
- Response:
  - full `booking`

### `GET /bookings/:id`
- Purpose: fetch one booking by internal id
- Response:
  - full `booking`
  - optional `auditLog[]`

### `POST /bookings/:id/confirm`
- Purpose: transition booking to `confirmed`
- Response:
  - updated `booking`

### `POST /bookings/:id/check-in`
- Purpose: transition booking to `checked_in`
- Response:
  - updated `booking`

### `POST /bookings/:id/complete`
- Purpose: transition booking to `completed`
- Request body:
  - `actualCompletedAt`
- Response:
  - updated `booking`

### `POST /bookings/:id/cancel`
- Purpose: transition booking to `cancelled`
- Request body:
  - `reason`
- Response:
  - updated `booking`

### `POST /bookings/:id/reschedule`
- Purpose: move an existing booking to a new slot
- Request body:
  - `newDate`
  - `newStartTime`
- Response:
  - updated `booking`

### `GET /bookings/lookup`
- Purpose: customer self-service lookup by booking code plus phone
- Query params:
  - `referenceCode`
  - `phone`
- Response:
  - matched `booking` or `404`

## Customers

### `GET /customers/search`
- Purpose: future staff-side customer lookup
- Query params:
  - `name`
  - `phone`
  - `limit`
- Response:
  - `customers[]`

### `POST /customers/upsert-from-booking`
- Purpose: normalize a customer profile from booking input
- Request body:
  - `bookingId`
  - `fullName`
  - `phoneE164`
  - `phoneDisplay`
  - `anonymousSessionId`
  - `notes`
- Response:
  - `customer`

## Staff and scheduling

### `GET /staff`
- Purpose: list active staff for booking flows
- Query params:
  - `branchId`
  - `activeOnly`
- Response:
  - `staff[]`

### `GET /staff-schedules`
- Purpose: fetch schedule rows that feed the availability engine
- Query params:
  - `branchId`
  - `staffIds[]`
  - `dateFrom`
  - `dateTo`
- Response:
  - `staffWorkingSchedules[]`

### `GET /block-off`
- Purpose: fetch active block-off periods
- Query params:
  - `branchId`
  - `staffIds[]`
  - `dateFrom`
  - `dateTo`
- Response:
  - `blockOff[]`

## Optional support endpoints

### `GET /pricing/:shopId`
- Purpose: future pricing lookup for shop-specific pricing configs
- Response:
  - `shopId`
  - `priceListVersion`
  - `categories[]`

### `GET /payment-methods`
- Purpose: fetch enabled payment methods for the current shop or branch
- Response:
  - `methods[]`

## Notes

- `TEMP_HOLD` should remain a separate resource and not be modeled as a booking status.
- Both customer and future staff clients should call the same availability and booking endpoints.
- The current customer demo still uses `sessionStorage` for in-progress draft transport.
- The current shared runtime prefers Postgres when configured and falls back to in-memory adapters when no database connection string is available.
