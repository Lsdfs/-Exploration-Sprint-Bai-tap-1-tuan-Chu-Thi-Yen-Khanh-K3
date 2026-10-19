# Prototype Mia — hỗ trợ đặt lịch khám

Prototype nghiên cứu cho bài tập Exploration Sprint, ưu tiên người cao tuổi ít quen ứng dụng. AI (Codex) hỗ trợ mã nguồn, giao diện, prompt và tài liệu. Các hồ sơ, cơ sở, giờ khám và lịch hẹn dùng trong demo là dữ liệu mô phỏng; không kết nối đặt lịch với bệnh viện.

## Chạy prototype

Cần Node.js 22 trở lên. Trong thư mục `05-prototype/`, chạy:

```powershell
npm.cmd start
```

Mở **http://127.0.0.1:4173**. Không mở `src/index.html` trực tiếp bằng `file://`. Chế độ mặc định có hướng dẫn và luồng đặt lịch mô phỏng, không cần API key hoặc cài dependency Node.

Để dùng AI chat và nhận giọng nói thật, sao chép `.env.example` thành `.env`, đặt `AI_PROVIDER=openai` và `OPENAI_API_KEY`, rồi khởi động lại server. Key chỉ ở server; không đưa `.env` lên Git. Nhận giọng nói dùng OpenAI Realtime qua WebRTC, cần mạng và đồng ý chia sẻ âm thanh trước khi cấp quyền micro. Không nhập thông tin người bệnh thật.

Giọng đọc dùng VieNeu cục bộ, giọng Thanh Bình. Cần cài Python và tải model riêng theo [hướng dẫn TTS](tts/README.md). Model và môi trường Python không nằm trong bản nộp. Khi giọng đọc không sẵn sàng, vẫn có thể gõ và bấm; ứng dụng báo lỗi giọng đọc.

## Luồng trình diễn

1. Mở Mia, chọn đặt lịch hoặc nhập yêu cầu bằng chữ/giọng nói.
2. Bổ sung người khám, cơ sở, chuyên khoa, bác sĩ hoặc không chọn bác sĩ, ngày và giờ. Mia giữ thông tin đã rõ và hỏi phần còn thiếu.
3. Sửa lựa chọn, kiểm tra bản tóm tắt và xác nhận rõ ràng trước khi ghi nhận lịch mẫu.
4. Xem lại tại Lịch hẹn. Trạng thái chờ xác nhận là mô phỏng, không chứng minh bệnh viện đã nhận lịch.

Mã xử lý nằm trong `server.mjs`, `health-tools.mjs`, `openai-stream.mjs`, `local-tts.mjs` và `src/`; tài nguyên giao diện cần để chạy nằm trong `src/assets/`. AI hỗ trợ hướng dẫn thao tác và câu trả lời streaming. Hai thẻ triệu chứng/dinh dưỡng có nhánh hội thoại riêng, chưa được xác thực lâm sàng; không dùng kết quả làm chẩn đoán hoặc đơn thuốc. Trọng tâm bài nộp là đặt lịch.

Bản nháp và lịch mẫu lưu trong sessionStorage của tab; bắt đầu phiên mới xóa dữ liệu này. Không lưu âm thanh hoặc hội thoại sức khỏe vào storage/log của ứng dụng. Khi bật OpenAI, câu hỏi hoặc âm thanh tương ứng được gửi tới nhà cung cấp sau bước đồng ý.

## Bằng chứng và giới hạn

- [Prompt và vai trò AI](prompts/README.md).
- [Log T1/T2](user-test-log.md): phản hồi, khó khăn và sửa đổi; chưa có số đo thời gian hoặc kết quả thử lại sau sửa.
- [Lịch sử chỉnh sửa](iteration-log.md).
- [Need statement và bằng chứng](../03-need-statement/need-statement.md).
- [Rủi ro và giảm thiểu](../06-rui-ro-dao-duc/risk-assessment.md).

Trước khi đóng gói, 66/66 kiểm tra logic/API đã qua. Kiểm tra kỹ thuật không thay thế thử người thật; chất lượng nghe/nhận giọng nói với người cao tuổi và thiết bị thật còn cần đánh giá. Bộ test, ảnh tham chiếu, báo cáo kỹ thuật, benchmark và mẫu giọng được giữ cục bộ ngoài phạm vi repo nộp bài.
