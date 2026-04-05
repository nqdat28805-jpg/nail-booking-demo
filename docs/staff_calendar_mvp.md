# Staff Calendar MVP

## Cancelled Bookings + Auto-Cancel Update

### /noi-bo/lich now shows cancelled bookings directly
- Cancelled bookings are now visible inside the same `Agenda theo staff` page.
- Grouping still stays by staff.
- Inside each staff group:
  - active bookings render first
  - cancelled bookings render after them in a compact `Đã huỷ` subsection
- This keeps cancelled items visible without moving them to another page.

### Staff grouping behavior
- If `assigned_staff_id` exists, the booking is rendered under that exact staff member.
- If no staff is assigned, the booking still falls back to the existing `Pool / chưa chỉ định` group.
- This applies to both active and cancelled bookings.

### 60-minute auto-cancel rule
- Shared operational thresholds now used by `/noi-bo/lich`:
  - `15` minutes: `Trễ lịch`
  - `30` minutes: `Vắng mặt`
  - `60` minutes: `Đã huỷ`
- The `60` minute rule is not only a UI label.
- When a booking passes that threshold without check-in on the selected current date, the shared booking service is called and the real booking status is updated to `cancelled`.
- After that shared update, the same booking appears in the cancelled subsection under the correct staff member.

### Effective vs persisted status
- `Trễ lịch` and `Vắng mặt` are currently derived operational statuses for the calendar view.
- `Đã huỷ` after `60` minutes is persisted as the real shared booking status through `DefaultBookingService.cancelBooking(...)`.
- Manual cancel compatibility remains intact.

### Filter updates
- The existing status filter now includes Vietnamese labels:
  - `Chờ xác nhận`
  - `Đã xác nhận`
  - `Trễ lịch`
  - `Vắng mặt`
  - `Đang làm`
  - `Hoàn tất`
  - `Đã huỷ`
- Filtering by `Đã huỷ` now returns the cancelled bookings that were either manually cancelled or auto-cancelled by the 60-minute rule.

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
