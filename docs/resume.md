# Resume

## Step 4 confirmation refinement
- Files changed:
  - `app/dat-lich/xac-nhan/_components/confirmation-experience.tsx`
  - `docs/resume.md`
- Step 4 success title change:
  - changed the success title to `Đặt lịch thành công`
  - kept `Mã lịch hẹn` and the existing unique booking reference generation logic
- Booking status hidden from UI:
  - removed the visible `Trạng thái` / `PENDING` row from the confirmation screen
  - booking status still remains in draft data for the demo flow
- Payment info merged into booking info block:
  - added payment rows directly inside `Thông tin đặt lịch`
  - now shows `Phương thức thanh toán`, `Trạng thái thanh toán`, and a short payment detail row when relevant
- Separate payment section removed:
  - removed the standalone payment card below the booking summary
  - removed repeated payment display modules from Step 4
- Minimal Step 3 data-carrying changes if needed:
  - none required in this prompt because Step 3 was already persisting the selected payment method and demo payment details
- Remaining demo/mock limitations:
  - confirmation still reads frontend demo data from `sessionStorage`
  - payment statuses are demo labels only and are not connected to a real backend or payment gateway

## Step 3 payment refinement
- Files changed:
  - `app/dat-lich/thong-tin/_components/guest-details-experience.tsx`
  - `app/dat-lich/thong-tin/_components/guest-summary-card.tsx`
  - `app/dat-lich/xac-nhan/_components/confirmation-experience.tsx`
  - `app/dat-lich/booking-mock.ts`
  - `docs/resume.md`
- Step 3 summary card changes:
  - removed `STEP 03`
  - removed `TỰ ĐỘNG CẬP NHẬT`
  - replaced `KIỂM TRA LỰA CHỌN CỦA BẠN` with `Tóm tắt lịch đã chọn`
  - replaced the dark `19` square with a softer monogram-style mark
  - removed `Đồng bộ từ bước chọn lịch`
  - reorganized the summary block to show `Ngày`, `Thợ`, `Bắt đầu`, and `Kết thúc dự kiến`
- Payment section added to Step 3:
  - moved payment selection below the contact form and above the main CTA
  - extra payment panels now reveal conditionally only for the selected method
  - `Thanh toán tại salon` keeps a clean selected state without extra fields
  - `Chuyển khoản` shows a demo QR block plus bank and transfer content info
  - `Thẻ nội địa` shows demo card fields for card number, cardholder name, expiry, and CVV
- Payment methods supported:
  - `Thanh toán tại salon`
  - `Chuyển khoản`
  - `Thẻ nội địa`
- CTA update:
  - Step 3 main CTA now says `XÁC NHẬN`
  - clicking it still continues to `/dat-lich/xac-nhan`
- Minimal Step 4 carry-forward changes:
  - Step 4 now reads the selected payment method and demo payment details from the Step 3 guest draft
  - removed the interactive payment simulation on Step 4 and replaced it with a read-only payment summary card
- Remaining demo/mock limitations:
  - payment data is still sessionStorage-only for the public demo flow
  - transfer QR and bank details are demo placeholders
  - card inputs are frontend-only and not connected to any gateway

## Step 2 client refinement
- Files changed:
  - `app/dat-lich/_components/booking-experience.tsx`
  - `app/dat-lich/_components/service-configurator.tsx`
  - `app/dat-lich/_components/staff-picker.tsx`
  - `app/dat-lich/_components/slot-panel.tsx`
  - `app/dat-lich/_components/calendar-block.tsx`
  - `app/dat-lich/booking-mock.ts`
  - `src/domain/booking/types.ts`
  - `docs/resume.md`
- Top layout simplification:
  - removed the lower in-body `Về trang chủ` block
  - removed `STEP 02`
  - tightened top spacing so the title sits higher with less empty scroll
- Real-date calendar behavior:
  - Step 2 now seeds from the actual local current date instead of the fixed mock April date
  - past dates in the current month are disabled
  - fully past months remain viewable but every day is disabled
  - stored session draft dates in the past are cleared on hydrate instead of being restored as selectable
- Updated legend colors:
  - `Còn chỗ` = green
  - `Gần hết` = yellow
  - `Hết chỗ / đóng` = red
- Updated service options:
  - `Loại móng`: `Móng thật`, `Móng úp`, `Đắp Gel`
  - `Kiểu sơn`: `Sơn trơn gel`, `Sơn nhũ`, `Mắt mèo`, `Tráng gương`
- Renamed staff labels:
  - `Thảo`
  - `Linh`
  - `Nga`
- Slot logic fix for insufficient duration:
  - real-time past-slot blocking now uses the current local date/time
  - mock held slots and mock stored bookings were reduced to appear only on some seeded days instead of fragmenting nearly every day
  - `Không đủ thời lượng` now appears only when the remaining continuous open window is genuinely shorter than the rounded blocked duration
- Remaining mocked limitations:
  - availability is still generated locally from seeded mock schedules, bookings, and holds
  - block-off windows are still hardcoded demo data
  - final availability recheck is still mock-only

## Landing pricing update
- Exact menu image path used as reference: `C:\X\PERSONAL\ki work\ki\19nail-main-price-menu.png`
- Landing hero changes:
  - headline now shows only `Nét đẹp bắt đầu từ những chi tiết nhỏ`
  - removed the small English eyebrow text
  - CTA changed from `BOOK NOW` to `Đặt lịch ngay`
  - removed the hamburger icon while keeping the branding balanced
- Replaced the old `Signature Services` cards with a Vietnamese `Bảng giá dịch vụ` section rendered from structured config data
- Shop-specific price config location: `src/config/shops/19nail-studio/price-list.ts`
- The raw menu image is not rendered on the website; it was used only as a reference source for extraction

## Price config review results
- Confirmed entries:
  - `Nail cơ bản`
  - `Móng giả`
  - `Design`
  - `Phụ kiện`
  - `Combo chân`
  - `Sửa móng (nhặt da, dũa form) - 40.000đ`
  - `Sơn gel - 80.000đ`
  - `Cứng móng tạo cầu - 30.000đ - 70.000đ`
  - `Phá móng thật (tuỳ độ dày) - 10.000đ - 20.000đ`
  - `Phá móng giả (tuỳ độ dày) - 30.000đ - 40.000đ`
  - `Nối móng đắp gel - 210.000đ`
  - `Dập gel móng thật - 80.000đ - 100.000đ`
  - `Fill móng nối gel - 100.000đ - 120.000đ`
  - `Fill úp gel - 50.000đ`
  - `Vẽ hoạt hình / Vẽ design - 5.000đ - 100.000đ / ngón`
  - `Ombre / Tráng gương / Nhũ / Mắt mèo - 10.000đ / ngón`
  - `Foil / Không nước / Sticker - 5.000đ - 10.000đ / ngón`
  - `Ăn xà cừ / Hoa khô - 10.000đ - 20.000đ / ngón`
  - `Loang / Vân đá - 10.000đ - 25.000đ / ngón`
  - `Vẽ gel nổi - 5.000đ - 25.000đ / ngón`
  - `Ngâm chân muối coffee, tẩy tế bào chết, chà gót - 150.000đ`
  - `Đắp mặt nạ chân (nửa / full) - 25.000đ - 40.000đ`
- Uncertain entries still marked for review:
  - dòng phụ của `Sơn gel` về phụ thu màu `20.000đ trên 3 màu`
  - tên mục `Úp móng mài cách chân (úp gel)` cần đối chiếu lần cuối chữ `mài/mai`
  - đơn vị của nhóm `Phụ kiện` nhiều khả năng là `viên`, hiện giữ trạng thái `OCR_UNCERTAIN`

## Local run fix
- Root cause: no local server was running when the URL was checked. The previous reported URL came from a temporary local process, but nothing was listening on `127.0.0.1:3000` afterward.
- Issue classification: `dev server not running`
- Verified fix: started the app locally and confirmed `http://127.0.0.1:3000`, `/dat-lich`, `/dat-lich/thong-tin`, and `/dat-lich/xac-nhan` all return `200`.

## How to run locally now
- Command: `npm run dev -- --hostname 127.0.0.1 --port 3000`
- Local URL: `http://127.0.0.1:3000`

## What was done
- Added a shared booking domain foundation under `src/domain/*` for booking, availability, customer, staff, config, lifecycle rules, and service contracts.
- Kept the current public routes working while migrating the customer flow to store and read richer shared-domain-shaped booking data.
- Refactored the current mock availability logic so it now has explicit shared-style models for staff schedules, block-off windows, duration rules, and stored bookings.
- Added draft backend schema documentation and a code-first schema draft for the future shared system.

## Files changed
- `app/page.tsx`
- `src/config/shops/19nail-studio/price-list.ts`
- `docs/resume.md`
- `app/dat-lich/booking-mock.ts`
- `app/dat-lich/_components/booking-experience.tsx`
- `app/dat-lich/_components/calendar-block.tsx`
- `app/dat-lich/_components/service-configurator.tsx`
- `app/dat-lich/_components/staff-picker.tsx`
- `app/dat-lich/_components/slot-panel.tsx`
- `app/dat-lich/thong-tin/_components/guest-details-experience.tsx`
- `app/dat-lich/xac-nhan/_components/confirmation-experience.tsx`
- `docs/shared_booking_foundation.md`
- `docs/schema_draft.md`
- `docs/availability_contracts.md`
- `docs/resume.md`
- `src/domain/index.ts`
- `src/domain/booking/types.ts`
- `src/domain/booking/lifecycle.ts`
- `src/domain/booking/contracts.ts`
- `src/domain/availability/types.ts`
- `src/domain/availability/contracts.ts`
- `src/domain/customer/types.ts`
- `src/domain/staff/types.ts`
- `src/domain/config/types.ts`
- `src/domain/config/schema-draft.ts`

## Domain types added
- `Booking`
- `BookingStatus`
- `BookingSource`
- `BookingChannel`
- `Customer`
- `Staff`
- `StaffWorkingSchedule`
- `BlockOff`
- `DurationInput`
- `DurationEstimate`
- `AvailabilityQuery`
- `AvailabilitySlot`
- `AvailabilityResult`
- `AuditLogEntry`

## Contracts added
- `AvailabilityServiceContract.estimateDuration(input)`
- `AvailabilityServiceContract.queryAvailability(input)`
- `BookingServiceContract.createBooking(input)`
- `BookingServiceContract.getBookingById(id)`
- `BookingServiceContract.lookupBooking(referenceCode, phone)`
- `BookingServiceContract.confirmBooking(id)`
- `BookingServiceContract.checkInBooking(id)`
- `BookingServiceContract.completeBooking(id, actualCompletedAt)`
- `BookingServiceContract.cancelBooking(id, reason)`
- `BookingServiceContract.rescheduleBooking(id, newDate, newStartTime)`
- `BookingServiceContract.searchCustomers(query)`
- `BookingServiceContract.upsertCustomerFromBooking(input)`

## What remains mocked
- The public customer flow still uses `sessionStorage` as a demo transport between steps.
- Availability is still generated locally, but now it is driven by explicit duration rules, staff schedules, block-off windows, and mock stored bookings instead of only frontend-local shapes.
- No database, API, auth, realtime sync, or staff dashboard UI has been added yet.
- Final availability recheck is still mock-only, although it is now aligned to the shared lifecycle and contract structure.

## Exact next step for Prompt 2
- Replace the current local `booking-mock.ts` runtime with real server-facing adapters that implement `AvailabilityServiceContract` and `BookingServiceContract`, then move the customer flow off `sessionStorage` into those contracts while still not building the staff dashboard UI yet.
