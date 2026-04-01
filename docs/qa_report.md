# QA Report

## Routes tested
- `/`
- `/dat-lich`
- `/dat-lich/thong-tin`
- `/dat-lich/xac-nhan`

## Happy path status
- Đã siết lại flow local/sessionStorage để `/dat-lich -> /dat-lich/thong-tin -> /dat-lich/xac-nhan` đọc đúng draft mới nhất trong cùng tab
- Route render đều trả `200 OK`
- `eslint` pass
- Chưa có browser E2E automation, nên trạng thái hiện tại là sẵn sàng demo thủ công

## Hold-expired status
- Vẫn hoạt động theo logic mock 5 phút
- Guest page có fallback rõ hơn khi hold hết hạn hoặc notice hold-expired đã được lưu từ bước trước

## Conflict mock status
- Vẫn còn nhánh fail availability recheck
- Xác suất mock đã giảm nhẹ để happy path demo ổn định hơn, nhưng conflict vẫn xuất hiện theo seed local một cách có kiểm soát
- Khi fail, UI giữ message tiếng Việt rõ ràng, hiển thị slot thay thế gần nhất và dẫn người dùng quay lại `/dat-lich`

## What is still mocked
- Availability ngày/giờ
- TEMP_HOLD
- Final availability recheck
- Booking reference code
- Salon reminder/note ở màn xác nhận

## Known limitations
- Không có backend, realtime hay submit thật
- Dữ liệu chỉ bền trong session hiện tại
- Chưa có browser automation để xác nhận trực tiếp các nhánh tương tác
- Conflict alternatives hiện vẫn lấy từ mock slot cùng ngày

## Recommended next improvements
- Thêm E2E test cho happy path, hold-expired và conflict mock
- Tách helper storage nhỏ gọn hơn nếu tiếp tục mở rộng flow
- Thiết kế API contract tối thiểu cho availability và create booking
- Chuẩn bị backend validation cho slot recheck trước khi submit thật
