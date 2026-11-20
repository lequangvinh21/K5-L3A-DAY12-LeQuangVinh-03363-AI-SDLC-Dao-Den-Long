# Đảo Đèn Lồng

Node 22. Cài bằng `npm ci`, chạy game bằng `npm run dev`, build web bằng `npm run build`, chạy bộ kiểm tra bằng `npm test`. CLI chính thức nằm trong `game.contract.json`. Ghi chú bàn giao hiện tại ở `docs/notes/phase-2.md`.

- Đọc yêu cầu của phase đang mở trên lab board. Lấy tên tệp khai báo, lệnh headless, định dạng vào/ra và các giá trị bắt buộc từ Test Contract.
- Trước khi sửa luật chơi, ghi trạng thái đầu, hành động và kết quả kỳ vọng của ít nhất một tình huống theo yêu cầu. Ghi riêng các giả định được phép tự chọn.
- Game 3D và headless dùng chung logic cập nhật trạng thái. Camera và renderer thuộc phần hiển thị.
- Kiểm chứng qua lệnh chính thức từ thư mục gốc trên macOS hoặc Linux. Với từng yêu cầu chính, lưu đầu vào, output thực, lệnh và kết quả đối chiếu theo phase. Kiểm tra gameplay trực tiếp cho yêu cầu thị giác.
- Khi ticket thay đổi một luật, ghi điều khoản thay thế và chạy lại các scenario còn hiệu lực.
- Ghi lỗi AI, cách phát hiện và số liệu sử dụng có nguồn. Chỉ đánh dấu đạt cho hành vi đã kiểm chứng.
- Giữ harness và bằng chứng trong lịch sử. Commit, push, tag và Release theo phê duyệt của chủ repo.


Contract hiện hành 1.1. Dùng 60 bước/giây, phân biệt tick và sim_tick khi pause. Bản đồ dùng chung ở src/maps.js. Chạy sh scripts/verify-phase2.sh trên Linux/macOS để lưu log và benchmark 21.600 bước. Kiểm tra giao diện riêng ở 1280×720.
