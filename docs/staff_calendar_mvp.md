# Staff Calendar MVP

## Muc tieu da dat
- Da them staff calendar/day agenda noi bo tren cung shared runtime voi customer flow.
- Bookings duoc tao tu customer web xuat hien trong dashboard staff ma khong can mock path rieng.
- Staff co the loc booking theo ngay, staff, trang thai, xem chi tiet, va cap nhat lifecycle co ban.
- Man hinh lich lam viec da ho tro chinh lich mac dinh va override cho cac tuan trong tuong lai.

## Internal routes/screens added
- `/noi-bo/lich`
- nang cap `/noi-bo/lich-lam-viec`
- cap nhat dashboard `/noi-bo`

## Internal API routes added
- `GET /api/internal/bookings`
- `PATCH /api/internal/bookings/:id/status`
- nang cap `GET/PUT /api/internal/staff-schedules` de ho tro `scope` va `weekStart`

## Calendar capabilities implemented
- Day agenda theo ngay duoc chon
- Group bookings theo staff
- Trong tung group, bookings duoc sap xep theo gio
- Loc theo:
  - `date`
  - `staff`
  - `status`
- Mo detail panel cho booking dang chon
- Empty state ro rang khi khong co booking

## Booking actions implemented
- `confirm`
- `check_in`
- `complete`
- `cancel`

Tat ca action deu di qua `DefaultBookingService` tren shared runtime.

## How bookings are read from shared data
- `GET /api/internal/bookings` goi `listInternalCalendarBookings(...)`
- helper nay dung `getSharedBookingRuntime()`
- bookings duoc doc tu `BookingRepository.listByDateRange(...)`
- staff labels duoc bo sung bang `StaffRepository.listActive(...)`
- customer-created bookings xuat hien vi Step 3 van tao booking qua `POST /api/public-booking/bookings` tren cung runtime

## Future-week schedule setup

### Editor scopes
- `default`
  - chinh lich mac dinh theo thu trong tuan
  - luu voi `effective_from = null` va `effective_to = null`
- `week_override`
  - chinh lich cho mot tuan cu the duoc chon
  - luu voi `effective_from = weekStart` va `effective_to = weekStart + 6 days`

### UI behavior
- Co bo chon `Pham vi chinh sua`
- Co bo dieu huong `Tuan truoc / Tuan sau / date picker`
- Neu tuan duoc chon chua co override:
  - form fallback tu lich mac dinh
  - `resolvedFrom = default`
- Neu da co override:
  - form doc va sua override do
  - `resolvedFrom = override`

## Override/fallback logic
- Availability engine bay gio resolve schedule theo thu tu:
  1. schedule override co `effective_from/effective_to` phu hop ngay dang query
  2. neu khong co, fallback ve schedule mac dinh khong co effective range
- Logic nay ap dung cho:
  - customer availability
  - future staff calendar/day-booking views

## Shared consistency now covered
- active/inactive staff
- week-specific schedules
- default schedule fallback
- block-off
- duration rules
- booking statuses

## What remains for the next phase
- week view / multi-day timeline cho staff calendar
- tao/sua/reschedule booking truc tiep tu dashboard staff
- persisted `TEMP_HOLD`
- auth cho noi bo
- audit log persistence
- richer payment and customer detail management
