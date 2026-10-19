# Lịch sử chỉnh sửa

## Cập nhật bằng chứng P3 — 19/10/2026

Đưa [quan sát P3 ngày 17/10/2026](../01-phong-van/P3.md) vào hồ sơ 01–07: AI có sẵn trên MyVinmec khoảng 6 phút và đặt lịch thành công; luồng thường 11 phút, gặp khó ở trường bắt buộc, trạng thái lựa chọn, tìm mục và nhập chữ. P3 đánh giá AI dễ làm hơn. Đây là căn cứ nghiên cứu cho tính năng voiceover thêm vào, không phải kết quả thử tính năng đó. Kế hoạch tiếp theo so cùng luồng AI tắt/bật giọng đọc; nhập giọng nói được đánh giá riêng. Lượt cập nhật này chỉnh tài liệu, không thay đổi mã hay ghi nhận thêm kết quả kiểm tra kỹ thuật/người dùng.

| Phiên bản / ngày | Bằng chứng từ thử nghiệm | Thay đổi | Lý do | Kết quả kiểm tra lại |
| --- | --- | --- | --- | --- |
| v0.1 / 18-10-2026 | Yêu cầu chuyển hướng chính; tham chiếu Google Play, chưa phải phản hồi người tham gia | Dựng đặt lịch, sửa, xem trạng thái, trợ lý thao tác và log | Có bản click được để thử giả thuyết | Xem verification.md |
| v0.1 / 18-10-2026 | Test phân loại câu hỏi | Phân biệt “xem lịch đã đặt” với “đã đặt chưa” trong mock | Tránh nhầm điều hướng và trạng thái | Unit test cả hai ý |
| v0.1 / 18-10-2026 | Quan sát ảnh viewport điện thoại | Đổi trợ lý sang bảng mở/thu cuối màn hình | Tránh phải tìm trợ lý bằng cách cuộn dài | Kiểm tra lại desktop và mobile |
| v0.2 / 18-10-2026 | Người làm bài yêu cầu thao tác bằng giọng nói | Thêm micro, đồng ý nhận dạng, xem/sửa câu nói và xác nhận mở đặt lịch/xem lịch; dự phòng nhập chữ | Người dùng có thêm cách diễn đạt yêu cầu; chưa nhập toàn bộ lịch bằng giọng nói | 21 test logic/API và 42 lượt E2E qua; sự kiện giọng nói giả lập, chưa thử micro thật |

| v0.3 / 18-10-2026 | Người làm bài xác định 090654 là UI gốc, ảnh còn lại là trạng thái khi bấm tiện ích | Dựng trang chủ, 12 tiện ích, màn hình tham chiếu, bảng liên hệ/tất cả dịch vụ, hộp thoại kết nối; giữ đặt lịch và giọng nói | Prototype theo bộ UI mới, có điều hướng thực | 22 test logic/API và 48 lượt E2E qua; 13/13 ảnh gốc giữ nguyên; xem ảnh chụp mobile/desktop |
| v0.4 / 18-10-2026 | Yêu cầu chatbot nhân vật, ba kịch bản hội thoại/guide/mở giúp | Robot chào, đặt lịch hội thoại có bác sĩ, nhận nhiều thông tin, highlight từng bước, giữ hội thoại và giọng nói mô phỏng | Có thể trình diễn cả hướng dẫn tự thao tác và điều hướng hộ | Kiểm tra chung với v0.5; không tự xác nhận lịch qua câu nói |
| v0.5 / 18-10-2026 | Bộ 23 ảnh UI bổ sung; yêu cầu tiếp tục xử lý | Trang MIA, bảng loại hẹn, form thường, ba bước đặt lịch, hộp cơ sở/chuyên khoa/bác sĩ/ngày giờ, xác nhận và lịch dùng chung | Bám UI mới; dữ liệu cá nhân thay bằng hồ sơ mẫu | 27 test logic/API và 64 lượt E2E qua; 36/36 JPEG gốc giữ nguyên; đã xem ảnh mobile và desktop |

## 19/10/2026 — Mia theo reference mới

Tích hợp hội thoại và micro ngay trong trang Mia, giữ bốn thẻ chức năng và bảng đặt lịch ba bước. Bổ sung gợi ý lựa chọn khoa, câu trả lời thao tác app, giữ bản nháp/lịch mẫu qua reload trong tab và thông báo chờ có thể dừng. Sửa nhầm lẫn giữa “khám tim… không chọn bác sĩ” với ý tìm bác sĩ. Kiểm chứng: 30 test logic/API và 96 lượt E2E qua; chưa thử âm thanh thật hoặc tạo lịch thật.

## QA mở rộng và lỗi hồi quy — 19/10/2026

Theo yêu cầu kiểm thử như người mới dùng, bổ sung kịch bản câu phủ định xác nhận, hỏi ý nghĩa xác nhận, câu trả lời ngắn, đổi ý, ngày/giờ sai, giờ hết chỗ theo ngày đã chọn, đổi cơ sở, đóng bảng chọn, lưu trữ bị lỗi, gửi lặp, timeout/stream lỗi và kiểm tra các nút dịch vụ. Đã sửa các lỗi tái hiện; chi tiết và bằng chứng trong [báo cáo QA](artifacts/qa-mia-2026-10-19.md). Đã gọi 5 yêu cầu OpenAI thật thành công bằng cấu hình hiện tại; không tạo lịch thật.

## Streaming chữ và voice — 19/10/2026

Đổi nhánh trợ lý AI streaming từ chờ JSON intent hoàn tất sang Responses API SSE văn bản, chuyển tiếp delta khi model đang sinh. Phần điều khiển đặt lịch vẫn cục bộ và cần xác nhận rõ ràng. Trình duyệt hiển thị từng delta, đệm đủ câu rồi đưa vào hàng đợi giọng đọc; flush phần cuối khi hoàn tất. Dừng đọc chỉ tắt voice; Dừng phản hồi/chuyển màn hủy upstream và voice. Stream lỗi thay phần chưa hoàn tất bằng hướng dẫn dự phòng, giữ trạng thái đã tắt voice.

Đã gọi một phản hồi thật và đo bằng trình duyệt: chữ đầu ~2,32 giây, dispatch câu đọc đầu ~2,50 giây, kết thúc ~2,75 giây. Kết quả ở `artifacts/live-stream-smoke.json`; không coi thời điểm dispatch là thời điểm loa thực sự phát âm thanh.

## TTS lưu sẵn trên máy — 19/10/2026

Theo yêu cầu TTS cục bộ, thay giọng trình duyệt bằng worker Piper nạp model tiếng Việt có sẵn trong repo trên đĩa. Thêm endpoint WAV, warmup khi khởi động, cache RAM giới hạn và trình phát theo câu có dừng/hủy. Đã tạo audio mẫu thật và kiểm tra playback trên Edge với mọi request ngoài localhost bị chặn. Xem tts/README.md và verification.md.

## Kiểm tra kỹ thuật theo tình huống — 19/10/2026

Đã chạy các câu đầu vào từ kịch bản bằng kiểm tra tự động, không phải phiên thử người dùng T1/T2 và không kiểm chứng micro/loa thật.

| Tình huống | Lỗi tái hiện trước sửa | Thay đổi | Kết quả kiểm tra lại |
| --- | --- | --- | --- |
| T1: “Tám giờ tôi chưa đi được. Đổi sang chín giờ…” | Bộ phân tích chọn 08:00, bỏ qua giờ thay thế | Ưu tiên phần giờ sau cụm “đổi sang” | Nhận 09:00, không tự đổi người khám/chuyên khoa |
| T1/T2: “ngày đầu tiên”, “ngày thứ hai trong danh sách” | Chưa nhận ngày theo vị trí danh sách | Phân biệt vị trí ngày trong danh sách với thứ trong tuần | Chọn đúng ngày thứ nhất/thứ hai; vẫn nhận thứ Hai như trước |

Hai kiểm tra mới thất bại trước sửa và qua sau sửa. Chạy `npm.cmd test`: **58/58 kiểm tra qua**. Đây chỉ xác nhận các nhánh logic đã kiểm tra; yêu cầu đọc chậm, dừng/đọc lại và hội thoại triệu chứng vẫn cần quan sát trên giao diện trong phiên thực tế.
