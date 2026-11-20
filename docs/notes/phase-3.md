# ADR · Giữ đảo sáng đến bình minh

**Nguồn:** Ticket-03 “Đèn cạn dầu”, Contract 1.2. Lõi mô phỏng và giao diện vẫn dùng chung một trạng thái.

**Quyết định.** Lưu dầu dưới dạng số nguyên theo đơn vị 1/60. Một bước chơi trừ 1 đơn vị và thêm 5 cho mỗi Bóng Mực đang hút hợp lệ. Tắt đèn và xóa lượng đã nạp trước xử lý tương tác. Dùng giá trị nguyên để xét ngưỡng an toàn, tính ceil khi châm và floor khi cộng thưởng. Chỉ làm tròn khi tạo output. Mỗi đèn giữ ever_lit và relit_count. Mỗi đêm giữ số lần người chơi thực sự thắp đèn để tính sức chứa.

**Kết thúc.** Sau mọi cập nhật trong tick, ưu tiên no_flames. Tại bình minh, so số đèn đang sáng với ceil(0.6 × số đèn) rồi mới tính điểm. Vì thế nạp đèn đúng tick cuối vẫn có thể cứu được đảo.

**Quy ước triển khai.** fuel_drain ghi sau mỗi 60 bước hút liên tục của từng con, gửi lượng dầu còn lại sau khi cộng dồn hao và hút. Đèn hồi vùng sáng đẩy Bóng Mực ra mép ngay trong tick đó. ID tự gán cho Bóng Mực tránh các ID scenario đã chỉ định.

**Hồi quy thay đổi có chủ đích.** Test CLI “last-light” trước đây kết thúc ở tick 2. Nay nó tiếp tục đến tick 65 với 105 điểm. Test thời lượng lấy số từ manifest; test thắng đúng bình minh dùng dawn_survived. Sau khi hết choáng, test kiểm tra wander trước khi đuổi lại. Giữ test di chuyển, cooldown, rơi, pause, bản đồ và Gió Lạc. Không bỏ qua test cũ bằng skip.

**Bằng chứng.** Chạy sh scripts/verify-phase3.sh để tạo lại báo cáo test, output CLI và phép đo toàn bộ Đêm 3 trong 18.000 tick. Scenario oil-dawn khởi tạo ba đèn sáng, L1 chỉ còn 1/60 dầu. Tick 1 đèn tắt rồi nhận 5 đốm để thắp lại. Tick 2 bình minh, 3/5 đèn sáng, tổng 662 điểm. Ảnh giao diện và browser.txt ghi từ Chrome thật, kiểm tra checkbox lưu qua reload, HUD sức chứa và tạm dừng/tiếp tục.

**Đánh giá AI.** Viết kiểm tra cho ngưỡng đúng 30, nhiều con hút, ưu tiên hết lửa và châm dầu trước khi chốt. Khi rà lại thứ tự, đã chỉnh bước hết choáng để snapshot thể hiện wander. Bộ test công khai và scenario tự viết đã chạy; bộ chấm ẩn và một lượt chơi tay cả ba đêm chưa xác minh. Không có telemetry token/chi phí cho phiên này.
