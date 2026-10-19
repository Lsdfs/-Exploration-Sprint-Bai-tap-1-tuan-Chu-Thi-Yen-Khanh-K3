# Prototype Mia — hỗ trợ đặt lịch khám

Prototype nghiên cứu cho bài tập Exploration Sprint, ưu tiên người cao tuổi ít quen ứng dụng. AI (Codex) hỗ trợ mã nguồn, giao diện, prompt và tài liệu. Các hồ sơ, cơ sở, giờ khám và lịch hẹn dùng trong demo là dữ liệu mô phỏng; không kết nối đặt lịch với bệnh viện.

## Chạy prototype

Gemini live giữ kết nối, micro và AudioContext trong 60 giây giữa các lượt nói hoàn tất để lượt tiếp theo không phải mở lại. Mỗi lượt hoàn tất đặt lại bộ đếm 60 giây. Micro vẫn mở trong thời gian nghỉ (trình duyệt có thể hiện biểu tượng micro), nhưng không gửi âm thanh tới Gemini khi chưa bấm nói. Hủy một lượt, đóng/ẩn tab hoặc hết thời gian nghỉ giải phóng các tài nguyên đang giữ. Lần mở đầu tiên vẫn cần chờ thiết lập với Gemini.

Cấu hình nhận giọng hiện tại: `VOICE_PROVIDER=gemini-live`, `LIVE_TRANSCRIPT_ENABLED=true` dùng `gemini-3.5-transcribe-live` với tiếng Việt `vi-VN`. Chữ tạm hiện liên tục trên bảng trạng thái; chỉ câu hoàn tất đi vào hội thoại. Khóa Gemini ở server, trình duyệt nhận token tạm thời một lần. Để tắt live, đặt `LIVE_TRANSCRIPT_ENABLED=false` trong `.env` rồi khởi động lại server; micro quay về Gemini nhận đoạn thu, chat giữ nguyên. Không có công tắc mới trên giao diện.

Cần Node.js 22 trở lên. Trong thư mục `05-prototype/`, chạy:

```powershell
npm.cmd start
```

Mở **http://127.0.0.1:4173**. Không mở `src/index.html` trực tiếp bằng `file://`. Chế độ mặc định có hướng dẫn và luồng đặt lịch mô phỏng, không cần API key hoặc cài dependency Node.

Để dùng AI chat và nhận giọng nói thật, sao chép `.env.example` thành `.env`, đặt `AI_PROVIDER=gemini` và `GEMINI_API_KEY`, rồi khởi động lại server. Key chỉ ở server; không đưa `.env` lên Git. Cấu hình nhánh Gemini lấy từ dự án `double fun`: `GEMINI_CHAT_MODEL=gemini-3.5-flash-lite` cho chat và `GEMINI_TRANSCRIBE_MODEL=gemini-3.8-flash` cho nhận âm thanh tiếng Việt.

Micro thu trọn câu trong bộ nhớ trình duyệt, chờ 900 ms im lặng sau khi có lời nói rồi gửi tới `/api/voice/transcribe`. Gemini trả bản chép lời sau khi nhận đoạn thu, chưa có chữ chạy trực tiếp khi đang nói. Dừng nghe hoặc chuyển trang sẽ hủy thu/gửi âm thanh. Cần đồng ý chia sẻ âm thanh trước khi cấp quyền micro; không nhập thông tin người bệnh thật. Có thể chọn riêng `AI_PROVIDER=openai` để dùng nhánh WebRTC với `OPENAI_LIVE_TRANSCRIBE_MODEL`; Gemini không tự chuyển âm thanh sang OpenAI khi gặp lỗi.

Có thể bấm **Nói xong** để gửi ngay khi đã nói hết câu, bỏ thời gian đợi khoảng lặng. Trạng thái mở micro, đang nghe, nhận lời nói và chuẩn bị/trả lời hiện ngay trên ô nhập, kèm thời gian đã chờ và nút dừng. Gemini 3.8 giữ mức suy luận `medium` như cấu hình mặc định; thử `low` chưa cho thấy nhanh hơn trên mẫu tổng hợp được đo.

Giọng đọc dùng VieNeu cục bộ, giọng Thanh Bình. Cần cài Python và tải model riêng theo [hướng dẫn TTS](tts/README.md). Model và môi trường Python không nằm trong bản nộp. Khi giọng đọc không sẵn sàng, vẫn có thể gõ và bấm; ứng dụng báo lỗi giọng đọc.

## Luồng trình diễn

1. Mở Mia, chọn đặt lịch hoặc nhập yêu cầu bằng chữ/giọng nói.
2. Bổ sung người khám, cơ sở, chuyên khoa, bác sĩ hoặc không chọn bác sĩ, ngày và giờ. Mia giữ thông tin đã rõ và hỏi phần còn thiếu.
3. Sửa lựa chọn, kiểm tra bản tóm tắt và xác nhận rõ ràng trước khi ghi nhận lịch mẫu.
4. Xem lại tại Lịch hẹn. Trạng thái chờ xác nhận là mô phỏng, không chứng minh bệnh viện đã nhận lịch.

Mã xử lý nằm trong `server.mjs`, `health-tools.mjs`, `openai-stream.mjs`, `local-tts.mjs` và `src/`; tài nguyên giao diện cần để chạy nằm trong `src/assets/`. AI hỗ trợ hướng dẫn thao tác và câu trả lời streaming. Hai thẻ triệu chứng/dinh dưỡng có nhánh hội thoại riêng, chưa được xác thực lâm sàng; không dùng kết quả làm chẩn đoán hoặc đơn thuốc. Trọng tâm bài nộp là đặt lịch.

Bản nháp và lịch mẫu lưu trong sessionStorage của tab; bắt đầu phiên mới xóa dữ liệu này. Không lưu âm thanh hoặc hội thoại sức khỏe vào storage/log của ứng dụng. Khi bật Gemini hoặc OpenAI, câu hỏi hoặc âm thanh tương ứng được gửi tới nhà cung cấp đã chọn sau bước đồng ý.

## Bằng chứng và giới hạn

- [Prompt và vai trò AI](prompts/README.md).
- [Log T1/T2](user-test-log.md): phản hồi, khó khăn và sửa đổi; chưa có số đo thời gian hoặc kết quả thử lại sau sửa.
- [Lịch sử chỉnh sửa](iteration-log.md).
- [Need statement và bằng chứng](../03-need-statement/need-statement.md).
- [Rủi ro và giảm thiểu](../06-rui-ro-dao-duc/risk-assessment.md).

Trước khi đóng gói, 66/66 kiểm tra logic/API đã qua. Kiểm tra kỹ thuật không thay thế thử người thật; chất lượng nghe/nhận giọng nói với người cao tuổi và thiết bị thật còn cần đánh giá. Bộ test, ảnh tham chiếu, báo cáo kỹ thuật, benchmark và mẫu giọng được giữ cục bộ ngoài phạm vi repo nộp bài.
