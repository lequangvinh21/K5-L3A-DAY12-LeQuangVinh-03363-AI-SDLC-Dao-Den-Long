# Retro · Đảo Đèn Lồng v1.0.0

## Bốn lần bàn giao

**Phase 1 — dựng một đêm chơi được.** Quyết định quan trọng nhất là dùng chung một mô phỏng cho camera 3D và CLI. Scenario “đèn cuối” có kết quả tính tay, đủ nhỏ để đối chiếu từng sự kiện và từng tick. Năm nhóm test đầu tiên chạy được trên Linux. Ảnh chụp lại phát hiện sọc trên mặt đảo dù các test đều xanh: hai bề mặt đồng phẳng cần tách độ cao. Lần sau nên thử cả đầu ra headless và một khung hình thật ngay trong lát cắt chức năng đầu tiên. Tag Phase 1 được push sau khi Phase 2 đã mở.

**Phase 2 — chuẩn hóa rồi mở rộng.** Ba đảo dùng cùng bảng tọa độ cho gameplay và hiển thị. Các thay đổi về điểm, điều kiện rơi, lực đẩy và thời gian bất tử được thể hiện trong test. Bộ kiểm tra đạt 11 nhóm; thử Đêm 3 chạy đủ 21.600 bước. Một test độ cao dốc ban đầu so sánh số thực bằng phép bằng tuyệt đối. Việc in actual và expected cho thấy sai số cỡ phần triệu tỷ, nên phép so sánh hình học được đổi sang dung sai nhỏ. Kiểm tra ngoài bộ test còn tìm thấy một tình huống ID Bóng Mực tự sinh trùng ID đã đặt trong scenario. Điều này giải thích vì sao chỉ đếm test xanh chưa đủ.

**Phase 3 — thay luật mà giữ được lịch sử.** Giữ dầu dưới dạng số nguyên theo đơn vị 1/60 khiến ngưỡng 30 và cộng dồn nhiều con hút kiểm tra được bằng tay. ADR ghi rõ test thắng ngay khi thắp đủ đèn đã hết hiệu lực. Một fixture đặt L1 sắp tắt cho thấy đèn tắt và được thắp lại trong cùng tick, sau đó thắng 662 điểm ở bình minh. Có 17 nhóm test đạt trên Linux. Phản hồi về chữ “Lồng” cũng được xử lý: Chrome đã dùng hai phông cho một tiêu đề, sau sửa dùng một phông xuyên suốt.

**Phase 4 — đo bản phát hành.** Benchmark dùng cảnh Đêm 1 với 200 Bóng Mực và 100 đom đóm, hiển thị theo lô và quay camera. Lần đo đầu FPS trung bình cao nhưng 1% thấp nhất chỉ 4,28 FPS. Sau khi giảm việc sắp xếp danh sách đèn và cập nhật HUD trong cảnh cố định, phép đo chính thức tại máy phát triển đạt 202,49 FPS trung bình, 57,22 FPS cho 1% thấp nhất và tải trong 3.055 ms. Soak ban đầu vượt nhẹ mức tăng RSS 20%. Bản cuối dùng tùy chọn V8 tiết kiệm bộ nhớ cho tiến trình soak; 10 đêm đều kết thúc, RSS từ 41,00 đến 44,76 MiB. Kết quả máy chấm có thể khác. Mười kết quả thua của đầu vào ngẫu nhiên được giữ nguyên.

## Cách làm với AI

AGENTS.md hữu ích nhất ở quy tắc ghi expected trước và chỉ báo đạt khi có output. Các scenario được giữ trong repo và các script ở scripts/ tái tạo bằng chứng, giúp phiên sau tiếp tục từ tag gần nhất. Với giao diện, trình duyệt thật giúp phát hiện lỗi phông, xác minh xung đột phím, lưu cài đặt và tải lại điểm. Với bản phát hành, video quay một lượt thao tác có kết quả thua thực tế, lưu tên, mở lại leaderboard và trình bày log test, headless, benchmark và soak.

Tại thời điểm chuẩn bị đóng gói, telemetry cộng dồn của luồng Codex ghi **15.135.724 token** gồm **15.068.088 input** và **67.636 output**. Trong input có **14.687.872 token đọc từ cache**, đã nằm trong tổng trên. Đây là số quan sát đến thời điểm trích, bao gồm cả các lượt trao đổi và rà soát; không có bảng phân bổ chính xác theo phase hoặc hóa đơn USD. Dùng terminal để build, so diff và chạy test; chỉ lấy các dòng lỗi, số đo và phần ticket cần thiết. Lịch sử dài vẫn khiến số token ngữ cảnh đọc lại lớn.

Nếu làm lại, nên ghi số token ngay lúc mỗi tag được tạo, chốt Phase 1 trước khi đọc ticket tiếp theo và thêm scenario ID pha trộn từ đầu. Trước khi tuyên bố trải nghiệm hoàn chỉnh, cần một lượt chơi độc lập trọn ba đêm và kết quả từ bộ chấm ẩn. Bài hiện có kiểm tra tự động, smoke test trình duyệt và số đo trên máy phát triển.
