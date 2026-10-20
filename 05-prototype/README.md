# Prototype Mia — hỗ trợ đặt lịch khám

Prototype nghiên cứu cho bài tập Exploration Sprint, ưu tiên người cao tuổi ít quen ứng dụng. AI (Codex) hỗ trợ mã nguồn, giao diện, prompt và tài liệu. Các hồ sơ, cơ sở, giờ khám và lịch hẹn dùng trong demo là dữ liệu mô phỏng; không kết nối đặt lịch với bệnh viện.

## Chạy trên Windows

Cần Node.js 22 trở lên và Chrome/Edge mới. Python chỉ cần cho giọng đọc cục bộ. Từ thư mục gốc repo:

```powershell
cd 05-prototype
node --version
npm.cmd start
```

Mở **http://127.0.0.1:4173**, không mở HTML bằng `file://`. Server không cần `npm install` vì runtime Node chỉ dùng thư viện có sẵn. Khi chưa có `.env`, giao diện và đặt lịch mẫu chạy được; chat AI/micro cần khóa riêng. Dừng server bằng **Ctrl+C**.

### Cấu hình Gemini

Dừng server. Chỉ sao chép mẫu khi chưa có `.env`, tránh ghi đè khóa đang dùng:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Điền khóa của bạn:

```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_CHAT_MODEL=gemini-3.5-flash-lite
VOICE_PROVIDER=gemini-live
LIVE_TRANSCRIPT_ENABLED=true
```

Khóa cần quyền truy cập model và còn quota. Live dùng `gemini-3.5-transcribe-live`, tiếng Việt `vi-VN`, hiện cố định trong server. Không cần OpenAI API key cho cấu hình này. Khóa chỉ ở server; trình duyệt nhận token tạm thời một lần.

Chạy lại `npm.cmd start`, tải lại trang, mở Mia, đồng ý chia sẻ âm thanh và cấp quyền micro. Chờ “Mia đang nghe” rồi nói. Chữ tạm hiện trên bảng trạng thái; chỉ transcript hoàn tất được đưa sang chat. **Nói xong** chốt câu; **Dừng nghe/Hủy nhận giọng** hủy lượt.

Micro, AudioContext và kết nối được giữ 60 giây giữa các lượt hoàn tất; mỗi lượt đếm lại 60 giây. Micro vẫn mở khi nghỉ nhưng không gửi âm thanh khi chưa bấm nói. Hủy lượt, ẩn/đóng tab hoặc hết thời gian nghỉ giải phóng tài nguyên đang giữ.

### Tắt live

Đổi `.env` rồi khởi động lại server và tải lại trang:

```dotenv
LIVE_TRANSCRIPT_ENABLED=false
GEMINI_TRANSCRIBE_MODEL=gemini-3.8-flash
GEMINI_TRANSCRIBE_THINKING_LEVEL=medium
```

Micro quay về thu trọn câu rồi gửi Gemini chép lời, không hiện chữ trực tiếp khi đang nói. Chat giữ nguyên. Không có công tắc live trên giao diện; Gemini lỗi không tự chuyển âm thanh sang OpenAI.

### Giọng đọc và kiểm tra cấu hình

Giọng hiện tại là **Kokoro tiếng Việt / Thành Đạt**. Làm theo [hướng dẫn TTS](tts/README.md); Python, venv và model không có sẵn trong Git. Có thể dùng giao diện/chat/micro trước khi cài TTS; thiếu TTS thì vẫn có chữ nhưng không có giọng đọc.

Khi server chạy, mở PowerShell khác:

```powershell
Invoke-RestMethod http://127.0.0.1:4173/api/config
Invoke-RestMethod http://127.0.0.1:4173/api/tts
```

- Config mong đợi: `provider=gemini`, `voiceProvider=gemini-live`, `transcriptionModel=gemini-3.5-transcribe-live`, `ready=true`, `voiceReady=true`. Cờ ready ở config chỉ xác nhận có khóa, không xác minh quota/kết nối upstream.
- Giọng đọc sẵn sàng: `engine=kokoro-vi`, `voice=Thành Đạt`, `ready=true`; console báo `Mia: local Vietnamese TTS ready.`
- Cổng bận: Ctrl+C server cũ hoặc đổi `PORT` trong `.env` và mở URL theo cổng mới.
- Không có micro: kiểm tra quyền trình duyệt/hệ điều hành. Điện thoại/máy khác truy cập qua IP cần HTTPS; `127.0.0.1` chỉ trỏ tới chính thiết bị đó. `HOST` mặc định chỉ mở trên máy chạy server.
- Gemini lỗi: kiểm tra API key, quyền model, quota và mạng. Không chia sẻ `.env` hoặc ảnh chứa khóa.
- TTS lỗi: làm theo hướng dẫn TTS; đặt `TTS_PYTHON` thành đường dẫn tuyệt đối tới Python có đủ thư viện nếu dùng venv khác.
- Sau mỗi lần đổi `.env`: Ctrl+C, `npm.cmd start`, tải lại trang. Không có tự nạp lại cấu hình.

Hướng dẫn chính dành cho Windows/Python 3.12; chưa kiểm chứng cài mới trên Linux/macOS. Bộ test phát triển giữ cục bộ ngoài bản nộp; `package.json` phát hành không có script `npm test`.

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

Lần kiểm tra cục bộ gần nhất: 92/92 kiểm tra logic/API đã qua. Kiểm tra kỹ thuật không thay thế thử người thật; chất lượng nghe/nhận giọng nói với người cao tuổi và thiết bị thật còn cần đánh giá. Bộ test, ảnh tham chiếu, báo cáo kỹ thuật, benchmark và mẫu giọng được giữ cục bộ ngoài phạm vi repo nộp bài.
