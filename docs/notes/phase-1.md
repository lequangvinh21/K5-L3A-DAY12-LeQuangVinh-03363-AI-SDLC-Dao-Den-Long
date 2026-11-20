# Phase 1 · Đảo Bến

Nguồn: tab PRD-0, Test Contract v1.0 trên lab board. Mốc gốc của repo là 64e83c7.

## Tiêu chí trước khi triển khai

- Có một đom đóm ở chân Mây và đèn L1 ở gần. Tick 0 có điểm 0. Bước đầu nhặt một con, lần nhấn tương tác tiếp theo nạp đúng một con. Giữ nút không được nạp lần hai.
- Di chuyển về trước với yaw 90° trong 60 bước trên đất trống: tăng X đúng player_speed, Z không đổi.
- Bốn đèn đặt sẵn sáng, đèn thứ năm thiếu một đốm: nạp một đốm phải thắng, thưởng một lần và dừng sớm.
- Bóng Mực chạm Mây còn một lửa phải dẫn đến no_flames. Hết thời gian phải dẫn đến dawn. Pulse đủ tài nguyên phải đẩy và làm choáng mục tiêu trong bán kính.
- Hai tiến trình dùng cùng seed và input phải cho JSONL giống từng byte. File input trùng tick phải trả mã 2.
- Kiểm tra riêng camera, nhảy, HUD, màu sắc, nón lá, khả năng chơi lại và độ sáng của đảo.

## Giả định thiết kế

Đảo có mép chặn, Mây không rơi. Thu thập tự động. Mỗi lần tương tác với đèn gần nhất chỉ nạp lượng còn thiếu. Chỉ đèn đã thắp tạo vùng an toàn. Mỗi lần bị chạm mất một lửa và mất phần nguyên của số đốm mang theo nhân hit_drop_ratio. Ánh sáng rơi tan vào sương. Tính thưởng thời gian và lửa khi thắng, lấy phần nguyên số giây còn lại. Trong cùng bước, hoàn tất đèn cuối ưu tiên trước bình minh.

## Nhật ký AI và kiểm chứng

Codex đọc sáu tài liệu repo và tab Phase 1 của board, thiết kế scenario cuối màn trước khi viết mã, triển khai lõi dùng chung, CLI và renderer Three.js. Đã dùng Node 22.15 trên Ubuntu/WSL để chạy bộ test và tái lập scenario cuối màn. Lệnh tái chạy nằm trong README. Kết quả nguyên bản nằm ở docs/proof/phase-1/.

Ảnh chụp lần đầu phát hiện hai mặt đồng phẳng gây sọc trên đảo. Đã tách độ cao mặt đá và lớp cỏ, sau đó chụp lại. Tách kiểm tra thị giác khỏi kiểm tra headless giúp phát hiện lỗi này. Gameplay đầu-cuối bằng người chơi và hidden tests của giảng viên chưa được xác nhận.

Không có số liệu token hoặc chi phí của phiên. Dùng terminal cho build/test và giữ một mô phỏng dùng chung để giảm số lần đối chiếu. Phase 2 đã xuất hiện trên board trong lúc đọc PRD-0; thời điểm tag Phase 1 và việc chấm trễ phụ thuộc Coach.
