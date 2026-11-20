# Thay đổi theo phase

## Phase 4 · Contract v1.3 · Bình minh

Chế độ đo khung hình và soak, xuất điểm cục bộ, đổi phím, phụ đề cảnh báo, giảm chuyển động và chữ lớn. Bản web có máy chủ Node local, video và số đo đi cùng Release v1.0.0. Luật chơi v1.2 tiếp tục dùng trong game và headless.

## Phase 3 · Contract v1.2 · Đèn cạn dầu

- Đèn có vòng đời sáng, hao dầu, tắt và thắp lại. Đèn đang sáng nhận châm dầu. Vùng an toàn và mục tiêu của Bóng Mực phụ thuộc mức dầu.
- Điều kiện thắng chuyển sang sống tới bình minh với đủ đèn. Thay lý do all_lit bằng dawn_survived. Rút thời lượng đêm còn 240/270/300 giây.
- Túi tăng sức chứa theo số lần thắp trong đêm. Công thức điểm chuyển sang 5 điểm/đốm nạp, phân biệt lần đầu/thắp lại và Bóng Mực đang hút. Thưởng bình minh phụ thuộc dầu, đèn và lửa.
- Manifest, scenario, snapshot và sự kiện mở rộng theo v1.2. Chi tiết fixture v1.0 và v1.1 cùng test tương ứng nằm trong tag phase-1 và phase-2.
- Cài đặt lưu bảng màu dễ phân biệt. Bổ sung thanh dầu, dấu hiệu đèn xẹp, giấy rách, cảnh báo nhấp nháy và ký hiệu cảnh báo trong chế độ này.

## Phase 2 · Contract v1.1 · Ba hòn đảo

Ba bản đồ, số liệu chuẩn hóa, lướt, bục nhảy, gió, Gió Lạc, Bùa Gió, pause và chuyển đêm. Mở rộng snapshot và scenario, bổ sung âm thanh và HUD.

## Phase 1 · Contract v1.0 · Đảo Bến

Bản chơi đầu tiên của Mây với năm đèn, đom đóm và Bóng Mực. CLI 60 tick/giây, JSONL, kiểm thử seed, tag và bằng chứng.
