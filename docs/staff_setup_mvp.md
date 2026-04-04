# Staff Setup MVP

## Mục tiêu đạt được
- Đã thêm một khu nội bộ cơ bản để cấu hình staff, lịch tuần, block-off, và duration rules.
- Khu nội bộ này dùng cùng shared runtime/repository path với customer flow.
- Customer availability không còn chỉ phụ thuộc seed/mock cứng ở frontend. Nó đọc active staff, working schedules, block-off, và duration rules từ shared runtime hiện hành.

## Internal routes added
- `/noi-bo`
- `/noi-bo/nhan-su`
- `/noi-bo/lich-lam-viec`
- `/noi-bo/block-off`
- `/noi-bo/cau-hinh`

## Internal API routes added
- `GET/POST /api/internal/staff`
- `PATCH /api/internal/staff/:id`
- `GET/PUT /api/internal/staff-schedules`
- `GET/POST /api/internal/block-off`
- `DELETE /api/internal/block-off/:id`
- `GET /api/internal/duration-rules`
- `PATCH /api/internal/duration-rules/:id`

## Staff management capabilities
- Liệt kê toàn bộ staff trong shared runtime.
- Thêm staff mới.
- Sửa `display_name`, `initials`, `sort_order`.
- Bật/tắt `is_active`.
- Thứ tự hiển thị dùng trực tiếp `sort_order`.

## Working schedule capabilities
- Chọn staff để cấu hình lịch tuần.
- Lưu `start_time`, `end_time`, `isWorkingDay`.
- Hỗ trợ nhập khoảng nghỉ cơ bản qua `breakRanges`.
- Save theo mô hình replace weekly schedule cho từng staff để MVP gọn và dễ hiểu.

## Block-off capabilities
- Tạo block-off salon-wide hoặc theo staff.
- Nhập ngày, giờ bắt đầu, giờ kết thúc, lý do.
- Liệt kê block-off hiện có.
- Xóa block-off.

## Duration/config support
- Có màn hình tối thiểu để xem và sửa `service_duration_rules`.
- Các trường chỉnh được hiện tại:
  - `baseDurationMinutes`
  - `blockRoundToMinutes`
  - `guestCountStrategy`
  - `guestCountMultiplier`
  - `active`
  - `notes`

## What customer availability now reads from
- `StaffRepository.listActive(...)`
- `StaffScheduleRepository.listByDateRange(...)`
- `BlockOffRepository.listActive(...)`
- `ServiceDurationRuleRepository.findBestMatch(...)`
- `DefaultAvailabilityService`
- `DefaultDurationService`
- `buildPublicBookingContext(...)`

## Important shared behavior
- Staff inactive sẽ bị loại khỏi pool availability.
- Specific staff query cũng không còn treat staff inactive như đang làm việc.
- Lưu lịch tuần xong thì availability của staff đó thay đổi ngay qua shared service path.
- Tạo block-off xong thì slot tương ứng bị invalidated trong customer availability.
- Nếu có Postgres env, admin setup và customer flow cùng chạm DB.
- Nếu chưa có Postgres env, cả hai cùng dùng `memory_fallback` nhưng vẫn chung một runtime/source of truth trong process.

## What remains mocked
- Auth cho khu nội bộ chưa có.
- Persisted `TEMP_HOLD` chưa có.
- Audit log persistence chưa có.
- Customer draft transport giữa Step 2, 3, 4 vẫn còn `sessionStorage`.
- Chưa có full staff calendar/day-booking board.

## Prompt 5 should build next
- Full staff calendar/day-booking view trên cùng shared runtime.
- Staff-side booking list/day agenda với create/edit/reschedule/cancel actions.
- Persisted temporary hold resource để customer và staff cùng dùng một hold source of truth.
- Booking lifecycle actions rõ hơn cho staff flow: confirm, check-in, complete, cancel, no-show.
