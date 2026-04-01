# Scope MVP Customer Lite

## Routes in scope now
- `/`: landing page tiếng Việt với hero, giới thiệu ngắn, preview dịch vụ, CTA `Đặt lịch ngay`
- `/dat-lich`: chọn ngày và giờ bắt đầu, xem trạng thái ngày, danh sách slot, summary booking, thời lượng dự kiến và giờ dự kiến xong
- `/dat-lich/thong-tin`: form khách hàng với validation client-side; bắt buộc có họ tên, số điện thoại, số người, số bộ, loại móng, kiểu sơn, ngày, giờ bắt đầu; tùy chọn có hiệu ứng và ghi chú
- `/dat-lich/xac-nhan`: xác nhận đặt lịch với mã giả lập, ngày giờ, giờ dự kiến xong, tóm tắt dịch vụ, trạng thái `pending`

## Routes explicitly out of scope now
- `/dashboard`, `/admin` và mọi màn nội bộ
- `/dang-nhap`, `/tai-khoan` và mọi màn account
- `/thanh-toan`, `/nap-coc`
- `/tra-cuu`, `/doi-lich`, `/huy-lich`
- `/dich-vu` riêng, `/thong-bao`, `/bao-cao`

## Hard constraints
- Chỉ customer-side/public flow, chỉ tiếng Việt, ưu tiên mobile-first
- Chỉ frontend mock/demo; không backend, không API thật, không realtime
- Dùng mock data, local state hoặc `sessionStorage`
- Slot hiển thị theo bước 30 phút và chỉ hiện điểm bắt đầu hợp lệ
- Không login/account, không payment/deposit, không dashboard
