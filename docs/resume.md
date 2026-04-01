# Resume

## What was built
- Đã khởi tạo app Next.js chạy được với App Router, TypeScript và Tailwind CSS
- Đã tạo public theme tối giản theo Stitch: nền kem sáng, dusty rose + gold nhẹ, headline serif, body sans
- Đã build landing page `/` với hero, intro salon ngắn, service preview cards và CTA `Đặt lịch ngay`
- Đã thêm placeholder pages cho `/dat-lich`, `/dat-lich/thong-tin`, `/dat-lich/xac-nhan`
- Đã build `/dat-lich` thành booking page frontend-only với staff filter, lịch tháng, slot panel 30 phút, summary bar và CTA sang bước thông tin khách
- Đã build `/dat-lich/thong-tin` thành guest details page với summary card, form tiếng Việt, validation client-side và CTA sang bước xác nhận
- Đã build `/dat-lich/xac-nhan` thành confirmation page theo Stitch success layout, loại bỏ hoàn toàn payment/deposit và đọc dữ liệu local đã lưu
- Đã thêm TEMP_HOLD mock 5 phút trên `/dat-lich`, restore trong session, countdown, trạng thái hết hạn và notice gợi ý khung giờ gần kề
- Đã thêm final availability recheck mock trên `/dat-lich/thong-tin`, với nhánh fail có conflict message tiếng Việt và 2 slot thay thế gần nhất
- Đã fix regression P5: happy path từ `/dat-lich` sang `/dat-lich/thong-tin` giờ persist booking selection ổn định hơn trước khi điều hướng
- Đã hoàn tất refinement pass cuối cho public flow: hydrate storage an toàn hơn, polish mobile/focus states, siết card/spacing/button treatment và làm recap cuối flow rõ ràng hơn
- Đã refactor lại landing page `/` để bám sát Stitch landing reference hơn: header kính mờ, hero image-led, headline serif italic, 2 signature cards, newsletter card, footer tối giản và floating booking FAB
- Đã nâng cấp mock availability engine cho `/dat-lich`: lịch tháng động nhiều tháng, artist mode/pool mode, service configurator, duration estimator theo SRS và slot-fit engine theo khoảng trống liên tục
- Đã refine lại Step 2 `/dat-lich` theo product requirement mới: thứ tự `calendar -> dịch vụ -> thợ -> khung giờ`, heading/copy gọn hơn, control dịch vụ mới và slot occupancy trực quan hơn
- Đã fix hydration mismatch trên `/dat-lich` bằng cách làm initial render SSR-safe và restore booking draft sau mount
- Đã áp dụng feedback client mới cho public flow: chỉnh occupancy Step 2, đơn giản hóa Step 3 và đổi lại cấu trúc confirmation kèm payment mock
- Đã align lại header của landing page để dùng cùng visual system với Step 2, Step 3 và confirmation
- Đã cập nhật payment mock trên màn xác nhận để có trạng thái hoàn tất thanh toán rõ ràng hơn khi demo
- Đã cập nhật headline hero trên landing page theo copy tiếng Việt mới

## Latest landing hero copy update
- Headline hero của route `/` đã được thay bằng copy mới: `Nét đẹp bắt đầu từ những chi tiết nhỏ / Xinh từ đầu ngón tay`

## Files changed in latest landing hero copy update
- `app/page.tsx`
- `docs/resume.md`

## Latest payment block update
- Đã xoá hoàn toàn nút `Thanh toán sau`
- Giữ `Thanh toán tại salon` như một phương thức thanh toán offline trong nhóm lựa chọn
- Nút `Tiến hành thanh toán` giờ kích hoạt success state ngay trên cùng page với nội dung `Hoàn tất thanh toán` và trạng thái `Đã thanh toán`
- Success state hiển thị lại phương thức thanh toán đã chọn trong cùng visual language hiện tại

## Files changed in latest payment mock update
- `app/dat-lich/xac-nhan/_components/confirmation-experience.tsx`
- `docs/resume.md`

## Latest landing header alignment
- Header của route `/` giờ dùng cùng shell với các page còn lại: cùng spacing `px-6 py-4`, brand căn giữa trong `max-w-lg`, typography `19NAIL.STUDIO` đồng nhất và dot nhỏ bên phải
- Hero và các section landing được giữ nguyên; chỉ chỉnh phần header để toàn bộ public flow trông như cùng một product
- Không tạo shared header component mới trong pass này; chỉ cập nhật trực tiếp landing header để giữ thay đổi nhỏ và an toàn

## Files changed in latest landing header alignment
- `app/page.tsx`
- `docs/resume.md`

## Latest client feedback applied
- `/dat-lich`: đổi label back link thành `Về trang chủ`, tăng khoảng đệm cuối trang để slot grid cuộn hết dưới mobile, và làm continuation slots trong block đã chọn trở nên rõ ràng hơn cũng như không còn tappable
- `/dat-lich/thong-tin`: bỏ toàn bộ service re-selection; bước này giờ chỉ cho nhập `Họ tên`, `Số điện thoại`, `Ghi chú`, còn toàn bộ ngày giờ/thợ/dịch vụ giữ ở summary read-only từ Step 2
- `/dat-lich/xac-nhan`: gộp số điện thoại vào block `Thông tin đặt lịch`, xoá riêng block `Thông tin khách` và `Thông tin salon`, thêm block `Thanh toán` mock để demo

## Latest slot occupancy logic fix
- Khi người dùng chọn start slot, toàn bộ block 30 phút tương ứng với thời lượng dịch vụ giờ được hiển thị là occupied range liên tục
- Continuation slots trong occupied range không còn trông như còn chọn được, giúp tránh trường hợp dịch vụ `60 phút` nhìn như chỉ chiếm `1` ô 30 phút
- Slot panel đã có thêm spacing đáy để hàng slot cuối không bị sticky summary che mất trên mobile

## Latest Step 3 simplification
- Form Step 3 chỉ còn 3 field chỉnh sửa được: `Họ tên`, `Số điện thoại`, `Ghi chú`
- Service selections không còn bị lặp lại ở Step 3
- Dữ liệu read-only từ Step 2 gồm: ngày, giờ bắt đầu, giờ kết thúc, thời lượng, thợ và dịch vụ đã chọn

## Latest confirmation structure changes
- Main block `Thông tin đặt lịch` giờ gồm thêm `Số điện thoại`
- Đã xoá riêng section `Thông tin khách`
- Đã xoá riêng section `Thông tin salon`
- Đã thêm block `Thanh toán` mock với trạng thái `Chưa thanh toán`, phương thức minh hoạ và CTA demo

## Files changed in latest client feedback pass
- `app/dat-lich/_components/booking-experience.tsx`
- `app/dat-lich/_components/slot-panel.tsx`
- `app/dat-lich/thong-tin/_components/guest-details-experience.tsx`
- `app/dat-lich/thong-tin/_components/guest-summary-card.tsx`
- `app/dat-lich/xac-nhan/_components/confirmation-experience.tsx`
- `app/dat-lich/booking-mock.ts`
- `docs/resume.md`

## Booking data now stored
- `sessionStorage` key: `nail-booking-draft`
- Dữ liệu đang lưu cho bước kế tiếp: ngày đã chọn, nhãn ngày hiển thị, giờ bắt đầu, staff id, staff name, thời lượng dự kiến, giờ dự kiến xong, bước slot 30 phút, TEMP_HOLD expiry, trạng thái flow và notice availability mock
- `sessionStorage` key: `nail-guest-details`
- Dữ liệu guest hiện lưu cho bước xác nhận: họ tên, số điện thoại hiển thị, số điện thoại chuẩn hóa, số người, số bộ, loại móng, kiểu sơn, hiệu ứng, ghi chú, service label

## What is still intentionally mocked
- Toàn bộ availability chỉ là dữ liệu mẫu cục bộ
- Thời lượng dự kiến và giờ kết thúc hiện tính theo rule mock bám SRS, chưa lấy từ catalog/service config thật
- TEMP_HOLD và final availability recheck hiện vẫn chỉ là logic mock cục bộ, chưa có backend/API thật
- Form khách hiện chỉ có validation client-side đơn giản
- Mã lịch hẹn và salon notes ở bước xác nhận đang là mock frontend-only

## Latest availability logic added
- Calendar engine của `/dat-lich` giờ tạo tháng động từ `visibleMonth`, hỗ trợ lùi/tới tháng mà vẫn giữ cùng visual style hiện tại
- Artist picker đã chuyển sang horizontal scroll / swipe selector trên mobile, giữ `Bất kỳ thợ nào` là chế độ pool thợ mặc định
- Duration estimator mới dùng `số người`, `số bộ`, `loại móng`, `kiểu sơn`, `hiệu ứng` để tính `estimated duration` và `estimated end time`
- Slot fit engine mới tính khoảng trống liên tục theo lưới 30 phút; chỉ slot bắt đầu đủ thời lượng mới được chọn
- Slot states giờ tách rõ `available`, `booked`, `held`, `past`, `closed`, `insufficient_duration`; trạng thái thiếu thời lượng có copy hướng dẫn riêng bằng tiếng Việt
- Khi đổi cấu hình dịch vụ làm slot đã chọn không còn vừa, UI sẽ tự gỡ slot/hold cũ một cách nhẹ nhàng và gợi ý khung giờ lân cận

## Latest Step 2 refinement
- Thứ tự tương tác trên `/dat-lich` giờ là: `Calendar` -> `Chọn tổ hợp dịch vụ` -> `Chọn thợ` -> `Khung giờ khả dụng`
- Heading chính đã rút gọn thành `Chọn lịch hẹn`, bỏ helper sentence cũ và thay bằng supporting copy ngắn hơn
- `Số người` đã chuyển sang dropdown styled từ `1` đến `10`
- `Số bộ` giờ map sang `Tay`, `Chân`, `Tay và chân`
- `Loại móng` giờ dùng `Móng thật`, `Móng úp`
- `Kiểu sơn` giờ dùng `Sơn trơn gel`, `Mắt mèo`, `Tráng gương`
- `Hiệu ứng` giờ là option boxes multi-select với rule độc quyền cho `Không có`
- Panel slot đã bỏ text đếm `23 khung giờ 30 phút`, tăng tương phản màu cho `available / booked / held / insufficient_duration`, và chỉ hiện banner cảnh báo thiếu thời lượng khi thực sự liên quan
- Khi chọn giờ bắt đầu, UI giờ hiển thị trực quan toàn bộ dải slot 30 phút bị chiếm theo đúng thời lượng ước tính

## New field mapping on Step 2
- `guestCount`: số người từ `1` đến `10`
- `setCount`: `hands` = `Tay`, `feet` = `Chân`, `both` = `Tay và chân`
- `nailType`: `natural` = `Móng thật`, `tip` = `Móng úp`
- `polishStyle`: `gel_solid` = `Sơn trơn gel`, `cat_eye` = `Mắt mèo`, `chrome` = `Tráng gương`
- `effect`: mảng multi-select gồm `none`, `sticker`, `design`; `none` loại trừ các lựa chọn còn lại

## Slot behavior changes
- Start slot chỉ chọn được khi có đủ thời gian liên tục cho toàn bộ dịch vụ
- `insufficient_duration` giờ tách bạch hơn khỏi disabled chung và có copy dễ hiểu hơn
- Slot đã chọn sẽ giữ TEMP_HOLD 5 phút như cũ, đồng thời hiển thị các ô tiếp nối bị chiếm theo duration
- Nếu đổi dịch vụ khiến slot đang giữ không còn đủ dài, UI sẽ tự clear slot cũ và hiển thị notice phù hợp

## Duration and occupancy behavior
- Thời lượng giờ tính theo tổ hợp `số người + số bộ + loại móng + kiểu sơn + hiệu ứng`
- `Tay và chân` nhân đôi nhu cầu theo block 30 phút; multi-effect cộng thêm thời lượng mock
- End time và số slot chiếm dụng được tính lại ngay sau mỗi thay đổi dịch vụ
- Occupancy hiển thị trực quan theo các block 30 phút liên tiếp, ví dụ `90 phút = 3 ô`, `120 phút = 4 ô`

## Files changed in latest availability upgrade
- `app/dat-lich/booking-mock.ts`
- `app/dat-lich/_components/booking-experience.tsx`
- `app/dat-lich/_components/service-configurator.tsx`
- `app/dat-lich/_components/calendar-block.tsx`
- `app/dat-lich/_components/staff-picker.tsx`
- `app/dat-lich/_components/slot-panel.tsx`
- `app/dat-lich/_components/booking-summary-bar.tsx`
- `docs/resume.md`

## Remaining mocked limitations for availability
- Availability đang mô phỏng bằng rule cục bộ theo thợ/ngày, chưa có nguồn dữ liệu realtime hay inventory dịch vụ thật
- Pool mode hiện gom theo mock schedules của từng thợ chứ chưa có cơ chế phân công tối ưu thật
- Duration estimator bám SRS ở mức mock hợp lý, chưa phản ánh toàn bộ edge cases nâng cao như combo dịch vụ đặc biệt hoặc thời gian chuẩn bị
- Month navigation là “effectively infinite” theo generator local, không có server-side availability preload
- Step 2 mới chỉ refine ở frontend mock; guest form ở Step 3 vẫn dùng bộ option cũ riêng của nó và chưa tự đồng bộ thành cùng một control system

## Mocked TEMP_HOLD behavior
- Chọn slot sẽ giữ tạm 5 phút trong session hiện tại
- Countdown được hiển thị trên `/dat-lich` và `/dat-lich/thong-tin`
- Hết hạn sẽ tự xóa slot đang giữ, chặn tiếp tục và hiển thị notice tiếng Việt nhẹ nhàng

## Mocked final recheck behavior
- Submit form hợp lệ ở `/dat-lich/thong-tin` sẽ chạy recheck mock trước khi sang xác nhận
- Phần lớn trường hợp sẽ pass
- Một số trường hợp sẽ fail có kiểm soát và trả về conflict message cùng 2 khung giờ gần nhất
- Khi fail, booking draft sẽ bị xóa slot không còn hợp lệ để tránh UI stale

## Remaining known limitations
- TEMP_HOLD và recheck vẫn hoàn toàn frontend-only, chưa phản ánh tranh chấp thời gian thực
- Conflict alternatives hiện lấy từ mock slot logic cùng ngày
- Guest form hiện chỉ restore bằng session data cục bộ khi quay lại trong cùng session
- Chưa có test tự động cho flow booking
- QA hiện dựa trên lint sạch, route render 200 OK, kiểm tra logic local/sessionStorage và rà log dev; chưa có browser E2E automation

## Latest hydration root cause found
- `/dat-lich` đang đọc `sessionStorage` và dùng `Date.now()` ngay trong lần render đầu của `BookingExperience`
- Kết quả là HTML SSR luôn ra trạng thái trống, nhưng lần render đầu ở client có thể lập tức có ngày/giờ đã chọn hoặc trạng thái hold khác, dẫn tới hydration mismatch và React phải regenerate tree

## Hydration fix applied
- `BookingExperience` giờ khởi tạo bằng state mặc định ổn định, không phụ thuộc `sessionStorage` hay thời gian hệ thống trong first render
- Draft booking chỉ được đọc sau mount trong `useEffect`, rồi mới restore `selectedDate`, `selectedSlot`, `selectedStaffId`, `holdExpiresAt`, `notice` và `serviceSelections`
- Effect persist draft giờ đợi xong bước hydrate rồi mới ghi lại storage, tránh tự overwrite draft cũ bằng trạng thái rỗng lúc vừa mount

## Files changed in latest hydration fix
- `app/dat-lich/_components/booking-experience.tsx`
- `docs/resume.md`

## Root cause found
- `/dat-lich/thong-tin` và `/dat-lich/xac-nhan` đang đọc `sessionStorage` bằng `useSyncExternalStore` với `subscribe` rỗng
- Snapshot raw string vì vậy không được cập nhật đáng tin cậy trong same-tab flow sau khi `/dat-lich` ghi booking draft mới
- Kết quả là hai bước sau đôi lúc hydrate từ dữ liệu cũ hoặc thiếu trường bắt buộc và rơi vào fallback “Thiếu dữ liệu lịch hẹn”

## Corrected flow behavior
- `/dat-lich/thong-tin` và `/dat-lich/xac-nhan` giờ hydrate local state từ `sessionStorage` bằng `useState` + `useEffect`
- Khi storage được ghi lại trong cùng tab, custom event nhỏ sẽ báo cho các trang liên quan refresh snapshot mới nhất
- Nếu slot còn hold hợp lệ, `/dat-lich/thong-tin` sẽ vào happy path ổn định hơn; nếu hold hết hạn thật, fallback vẫn giữ nguyên
- `/dat-lich/xac-nhan` cũng đọc đúng booking draft và guest draft mới nhất sau submit hợp lệ, còn mock conflict vẫn chỉ xảy ra ở bước recheck

## Current route flow status
- `/`: đã hoàn thiện landing page MVP
- `/dat-lich`: đã có booking UI mock hoạt động cùng TEMP_HOLD 5 phút
- `/dat-lich/thong-tin`: đã có form thông tin khách, persist local và recheck mock trước xác nhận
- `/dat-lich/xac-nhan`: đã có màn xác nhận hoàn chỉnh cho demo customer flow
- Flow hiện đã được polish thêm để giảm fallback/flicker do hydration, giữ hold/conflict states rõ ràng hơn và thống nhất visual treatment trên mobile

## Current confirmation data source
- Nguồn dữ liệu xác nhận hiện đọc từ `sessionStorage`
- `nail-booking-draft`: ngữ cảnh ngày giờ, thợ, thời lượng, giờ kết thúc
- `nail-guest-details`: thông tin khách, phone chuẩn hóa, lựa chọn dịch vụ/form

## Routes now available
- `/`
- `/dat-lich`
- `/dat-lich/thong-tin`
- `/dat-lich/xac-nhan`

## Files changed
- `package.json`
- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `app/dat-lich/page.tsx`
- `app/dat-lich/booking-mock.ts`
- `app/dat-lich/_components/booking-experience.tsx`
- `app/dat-lich/_components/staff-picker.tsx`
- `app/dat-lich/_components/calendar-block.tsx`
- `app/dat-lich/_components/slot-panel.tsx`
- `app/dat-lich/_components/booking-summary-bar.tsx`
- `app/dat-lich/thong-tin/page.tsx`
- `app/dat-lich/thong-tin/_components/guest-details-experience.tsx`
- `app/dat-lich/thong-tin/_components/guest-summary-card.tsx`
- `app/dat-lich/thong-tin/_components/field-shell.tsx`
- `app/dat-lich/xac-nhan/page.tsx`
- `app/dat-lich/xac-nhan/_components/confirmation-experience.tsx`
- `docs/resume.md`

## Files changed in latest fix
- `app/page.tsx`
- `app/dat-lich/booking-mock.ts`
- `app/dat-lich/_components/booking-experience.tsx`
- `app/dat-lich/_components/booking-summary-bar.tsx`
- `app/dat-lich/_components/calendar-block.tsx`
- `app/dat-lich/_components/slot-panel.tsx`
- `app/dat-lich/_components/staff-picker.tsx`
- `app/globals.css`
- `app/page.tsx`
- `app/dat-lich/thong-tin/_components/guest-details-experience.tsx`
- `app/dat-lich/thong-tin/_components/guest-summary-card.tsx`
- `app/dat-lich/thong-tin/_components/field-shell.tsx`
- `app/dat-lich/xac-nhan/_components/confirmation-experience.tsx`
- `docs/qa_report.md`
- `docs/final_handoff.md`
- `docs/resume.md`

## Landing page files changed
- `app/page.tsx`
- `next.config.ts`
- `docs/resume.md`

## Exact Stitch reference files used
- `.codex-temp/stitch_guest_information_extracted/stitch_guest_information/refined_landing_page_guest_flow/code.html`
- `.codex-temp/stitch_guest_information_extracted/stitch_guest_information/refined_landing_page_guest_flow/screen.png`

## What was aligned to the reference
- Header fixed trong suốt với branding cân giữa và menu icon tối giản bên trái
- Hero composition chuyển sang image-led, có overlay sáng mềm và bố cục text nằm chồng trên ảnh
- Headline chuyển về serif italic cỡ lớn, supporting copy ngắn và CTA tròn “Book Now”
- Section order của landing giờ theo reference rõ hơn: hero -> signature services -> join card -> minimal footer
- Signature services đổi sang 2 image-first cards với title + price dưới ảnh
- Join/newsletter section đổi sang card mềm, input tròn và subscribe button đậm
- Đã thêm floating booking FAB góc phải dưới để bám reference và vẫn nối vào flow `/dat-lich`

## Small intentional deviations
- CTA chính và FAB được nối sang route thật `/dat-lich` thay vì chỉ là prototype button
- Footer links giữ vai trò visual-only để không mở rộng scope route
- Menu icon chỉ là presentational control, chưa mở navigation vì ngoài scope hiện tại
- Ảnh reference được load qua `next/image` và `remotePatterns` tối thiểu để giữ implementation production-like hơn

## Exact next step
- Prompt tiếp theo: `Nếu tiếp tục phase sau, hãy bắt đầu bằng browser E2E test cho happy path, hold expired và conflict mock; sau đó thiết kế contract API tối thiểu cho availability, booking create và confirmation mà vẫn giữ nguyên public flow hiện tại.`
