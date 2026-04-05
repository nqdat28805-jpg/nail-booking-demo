# Technician Screen MVP

## Technician Route Refinement

### Route refined
- `/noi-bo/tho`

### Stitch package followed more literally
- Continued using the newest Stitch package as the primary visual source:
  - `C:\X\PERSONAL\ki work\ki\stitch_remix_of_remix_of_remix_of_guest_information.zip`
- Tightened the page to match the lighter mobile Stitch variant more closely:
  - cleaner top bar
  - no extra subtitle under the brand area
  - compact pill filters
  - compact date/staff controls
  - alert stack first
  - lighter timeline list underneath
  - hidden detail sheet that opens only after tapping a booking

### Compact card behavior
- Each booking card on the main list now shows only:
  - status label
  - time range
  - customer name
  - short service summary
  - one primary action
- Primary action rule:
  - upcoming guest: `Nhận khách`
  - in service: `Hoàn tất`
  - late / no-show attention state: `Liên hệ khách`
  - otherwise: `Chi tiết`
- Extra actions were removed from the compact list and moved into the detail sheet.

### Detail sheet behavior
- Detail is hidden on initial load.
- Tapping a booking opens the full bottom sheet on mobile.
- The detail sheet now carries the expanded fields and secondary actions:
  - phone
  - booking code
  - guest count
  - set type
  - nail type
  - polish style
  - effects
  - payment summary
  - notes
  - `Nhận khách`
  - `Hoàn tất`
  - `Gọi khách`
  - `Đánh dấu vắng mặt`

### Vietnamese localization cleanup
- Removed the old subtitle text `Thợ vận hành nhanh`.
- Converted remaining visible technician copy into proper Vietnamese with diacritics where practical.
- Replaced visible English/internal-facing labels on this route such as:
  - `No-show` -> `Vắng mặt`
  - `Check-in` -> `Nhận khách`
  - `Đánh dấu no-show` -> `Đánh dấu vắng mặt`
- Normalized the seeded customer/service/payment note strings at render time on `/noi-bo/tho` so the technician screen no longer surfaces obvious non-diacritic demo text.

## Route used
- `/noi-bo/tho`

## Stitch package located and used
- Primary visual source of truth:
  - `C:\X\PERSONAL\ki work\ki\stitch_remix_of_remix_of_remix_of_guest_information.zip`
- Extracted working copy used during implementation:
  - `C:\X\PERSONAL\ki work\ki\.codex-temp\stitch-tech-latest\stitch_remix_of_remix_of_remix_of_guest_information`
- Relevant Stitch screens mapped into the real app:
  - `l_ch_h_m_nay_giao_di_n_th_c_p_nh_t_n_i_dung_m_u_s_c`
  - `c_nh_b_o_late_show_no_show`
  - `chi_ti_t_c_nh_b_o_desktop`

## Regression repair completed first
- Repaired the public booking create path so Step 3 can still confirm a booking after the final availability recheck when the currently selected slot matches the active in-session hold.
- Separated the technician route from the manager shell wrapper so the new screen can follow the Stitch composition directly without inheriting the denser manager layout.
- Re-verified customer booking navigation and internal manager routes on a clean local server run after removing the stale broken local process.

## How the Stitch design was mapped
- Matched the Stitch layout more literally:
  - compact fixed top bar
  - large serif page title block
  - pill filter row
  - alert cluster near the top
  - dense stacked booking cards
  - desktop side detail panel
  - mobile bottom-sheet detail view
  - compact bottom navigation
- Replaced Stitch placeholder/demo text with real Vietnamese operational copy.
- Mapped the Stitch booking cards to the shared booking entity instead of static mock content.

## Real booking fields displayed
- Customer full name
- Phone number
- Service summary
- Guest count
- Nail type
- Polish style
- Effects when present
- Start time
- Estimated end time
- Assigned staff or pool label
- Payment method and payment summary
- Current booking status
- Booking reference code
- Notes when present

## Actions wired
- `Check-in`
- `Hoàn thành`
- `Đánh dấu no-show`
- `Gọi khách`
- `Xem chi tiết`

All write actions go through `PATCH /api/internal/bookings/:id/status` on the same shared runtime used by customer bookings and manager screens.

## Late-show / no-show logic used
- `late_show_threshold_minutes = 15`
- `no_show_threshold_minutes = 30`
- The technician UI derives alert state from today's booking start time unless the booking is already `checked_in`, `completed`, `cancelled`, or `no_show`.
- If a booking is already stored as `late_show` or `no_show`, that stored status is respected immediately in the technician UI.

## Shared backend/data integration
- Read path:
  - `GET /api/internal/bookings`
  - shared runtime via `getSharedBookingRuntime()`
  - shared `BookingRepository`
- Write path:
  - `PATCH /api/internal/bookings/:id/status`
  - shared `DefaultBookingService`
- `check_in`, `complete`, and `no_show` mutate the same booking entity used by:
  - customer booking flow
  - manager/internal calendar
  - future staff modules

## Manager screens preserved
- `/noi-bo`
- `/noi-bo/lich`
- `/noi-bo/nhan-su`
- `/noi-bo/lich-lam-viec`
- `/noi-bo/block-off`
- `/noi-bo/cau-hinh`

No manager/setup route was removed or replaced.

## What still remains for future polish
- Technician screen still reads through the existing internal bookings API rather than a dedicated technician read model endpoint.
- Local verification in this pass still ran on `memory_fallback`.
- Internal auth is still not implemented.
- `TEMP_HOLD` persistence is still not implemented.
