# Ticket-02 · Ba hòn đảo
## Tiêu chí nghiệm thu
1. D1 đuổi Mây mang từ 5 đốm trong 15 m, cướp tối đa 3 một lần. Pulse khi D1 bỏ chạy làm rơi số đã cướp.
2. Bùa ở vị trí chuẩn có hiệu lực 600 bước, đổi tốc độ chạy và cho lướt lại sau 12 bước. Hồi bùa sau 2700 bước.
3. Menu → lời Ông Đăng → đêm hiện tại → kết quả. Thua chơi lại cùng đêm, thắng đi tiếp. Bình Minh cộng điểm ba đêm thắng.
4. Esc/P tạm dừng. Đồng hồ và mọi hoạt động đứng yên. Có bốn lựa chọn theo ticket.
5. Âm lượng và độ nhạy chuột vẫn giữ sau khi tải lại.
6. Nhạc đêm và hiệu ứng phản hồi đúng sự kiện, cảnh báo gió, đếm ngược mười giây.
7. HUD có lửa, thời gian nhấp nháy dưới ngưỡng, đèn, điểm, túi mười ô, hồi chiêu, lời nhắc nạp và hướng đèn.
8. Đối chiếu bảng màu ở renderer và HUD. Ánh sáng môi trường theo tỷ lệ đèn sáng.
## Hồi quy
V1.1 thay thông số, điểm từ nhặt sang nạp, đẩy lùi trong 15 bước, sinh địch theo lịch và cho phép rơi. Giữ quy ước tick, JSONL, xác định theo seed, move tương đối camera, input giữ giá trị, nút theo cạnh nhấn và mã lỗi file 2. Test v1.0 và bằng chứng nguyên bản tại tag phase-1.


## Giả định và bằng chứng
Đêm 3 dùng điểm xuất phát ở (0,0,−27) trên tầng 0 để tránh thân tháp. Bóng Mực sinh trải qua một bước spawning. Đẩy ra khỏi vùng an toàn ngay trong bước thắp đèn. Điểm per_mote của manifest tính khi nạp. Seed điều khiển chọn điểm trống và hướng gió. Âm thanh được tổng hợp bằng Web Audio.
Bộ test kiểm tra core và tiến trình CLI qua Node. bridge.jsonl ghi các sự kiện Gió Lạc, bùa, lướt và pause. Benchmark chạy nguyên 21.600 bước ở Đêm 3, tắt sinh Bóng Mực và gió để nhân vật đứng yên sống tới bình minh. browser.json ghi phép đo rAF 5 giây trên Chrome 1280×720 và các thao tác đã kiểm tra.
Codex đọc board từ tab Chrome và cập nhật các giả định cũ. Phát hiện so sánh chính xác số thực ở dốc nghiêng gây lỗi test; chuyển sang dung sai 1e−10. Chưa có số liệu token/chi phí. Hidden tests, nghe thẩm định âm thanh và chơi tay trọn ba đêm chưa được xác nhận.
