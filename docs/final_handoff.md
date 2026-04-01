# Final Handoff

## Final route map
- `/`: landing page public
- `/dat-lich`: chọn thợ, ngày, giờ và giữ chỗ tạm
- `/dat-lich/thong-tin`: nhập thông tin khách, recheck mock trước xác nhận
- `/dat-lich/xac-nhan`: màn xác nhận lịch hẹn `pending`

## Key components
- `app/page.tsx`: landing page public
- `app/dat-lich/_components/booking-experience.tsx`: orchestration cho booking step
- `app/dat-lich/_components/calendar-block.tsx`: lịch tháng
- `app/dat-lich/_components/slot-panel.tsx`: slot states + hold notice
- `app/dat-lich/_components/booking-summary-bar.tsx`: summary + CTA đáy màn
- `app/dat-lich/thong-tin/_components/guest-details-experience.tsx`: guest form + recheck mock + fallback states
- `app/dat-lich/thong-tin/_components/guest-summary-card.tsx`: recap booking/service trong bước form
- `app/dat-lich/xac-nhan/_components/confirmation-experience.tsx`: màn xác nhận cuối flow
- `app/dat-lich/booking-mock.ts`: mock data, storage keys, hold helpers, recheck helpers

## State and storage approach
- Local component state cho interaction UI
- `sessionStorage` cho booking draft và guest details draft
- Same-tab custom events:
  - `booking-storage-updated`
  - `guest-storage-updated`
- Guest và confirmation pages hydrate từ storage bằng `useState` + `useEffect`, không dùng `useSyncExternalStore`

## Design-complete areas
- Landing page public
- Booking page visual hierarchy: staff picker, calendar, slot panel, summary bar
- Guest details form styling, helper text, validation states
- Confirmation page polish, recap card và CTA hierarchy
- Focus states và mobile spacing cơ bản cho toàn bộ public flow

## Logic-mocked areas
- Availability data
- TEMP_HOLD 5 phút
- Final recheck trước confirmation
- Booking reference generation
- Salon reminder/copy ở confirmation

## What should be built next
- Browser E2E tests cho 3 nhánh chính: happy path, hold expired, conflict
- API contract cho availability + create booking
- Backend persistence cho booking draft / booking record
- Real recheck trước submit cuối
