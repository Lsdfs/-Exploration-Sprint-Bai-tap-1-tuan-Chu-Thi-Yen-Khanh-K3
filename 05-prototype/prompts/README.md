# Prompt và quy tắc đang sử dụng

Đối chiếu mã nguồn và cấu hình cục bộ ngày 21/10/2026. Các mục cấu hình, vị trí prompt và quy tắc dưới đây mô tả bản hiện tại; mô tả cũ được giữ trong mục lịch sử cuối tài liệu.

## Cấu hình hiện tại

| Thành phần | Cấu hình và nhiệm vụ |
| --- | --- |
| Hội thoại Gemini | `AI_PROVIDER=gemini`, `GEMINI_CHAT_MODEL=gemini-3.5-flash-lite`. Server ưu tiên `GEMINI_CHAT_MODEL`, sau đó `GEMINI_MODEL`, rồi mặc định `gemini-3.5-flash-lite` |
| Chép lời trực tiếp | `VOICE_PROVIDER=gemini-live`, `LIVE_TRANSCRIPT_ENABLED=true`. Model `gemini-3.5-transcribe-live` đặt trực tiếp trong setup server; ngôn ngữ `vi-VN`, chế độ `VERBATIM` |
| Chép lời từ bản thu, tùy chọn | `LIVE_TRANSCRIPT_ENABLED=false` chuyển sang nhánh bản thu Gemini; `GEMINI_TRANSCRIBE_MODEL=gemini-3.8-flash`, `GEMINI_TRANSCRIBE_THINKING_LEVEL=medium`. Không chạy như bước chép lại sau live |
| Đọc câu trả lời | Kokoro cục bộ, ONNX FP32, voicepack `thanh_dat.pt` (Thành Đạt), không dùng Gemini để tạo giọng đọc |

Xem [cấu hình mẫu](../.env.example), [server](../server.mjs) và [hướng dẫn TTS](../tts/README.md). `GEMINI_MODEL=gemini-3.8-flash` là giá trị dùng chung dự phòng, không ghi đè model chat khi đã có `GEMINI_CHAT_MODEL` và không điều khiển model live đặt trong setup. API key chỉ nằm phía server, không ghi vào tài liệu.

## Vị trí prompt thực thi

| Tác vụ | Nguồn và phạm vi |
| --- | --- |
| Phân loại điều hướng, không stream | `SYSTEM_PROMPT` trong [server.mjs](../server.mjs): nhận màn hình và câu hỏi, trả JSON một intent hợp lệ; ứng dụng lấy hướng dẫn cố định. Model không có công cụ đặt/sửa/hủy lịch |
| Hướng dẫn app, có stream | Prompt inline trong nhánh `body.stream` của [server.mjs](../server.mjs), ghép `GUIDES` và `BOOKING_SUPPORT_PROMPT`: sinh văn bản tiếng Việt ngắn từ câu hỏi và màn hình; lịch/hồ sơ là mẫu |
| Dinh dưỡng và triệu chứng | `shared`, `HEALTH_TOOLS.nutrition.prompt`, `HEALTH_TOOLS.symptoms.prompt`, `BOOKING_SUPPORT_PROMPT` trong [health-tools.mjs](../health-tools.mjs). Hai mode `nutrition`/`symptoms` đã có nhánh gọi Gemini qua `/api/help`, chỉ nhận mô tả văn bản, không phân tích ảnh |
| Chép lời live | Setup trong [server.mjs](../server.mjs); gửi PCM và nhận chữ trong [gemini-live.mjs](../src/gemini-live.mjs), [pcm-capture.mjs](../src/pcm-capture.mjs). Không có prompt hội thoại sức khỏe trong setup live, chỉ cấu hình chép nguyên văn tiếng Việt |
| Chép lời từ bản thu | Chuỗi chỉ dẫn trong `transcribeGemini` ở [gemini-provider.mjs](../gemini-provider.mjs): chép nguyên văn, giữ tên riêng/số, không dịch hoặc trả lời nội dung âm thanh |
| Giọng đọc | [local-speech.mjs](../src/local-speech.mjs) → `/api/tts` → [local-tts.mjs](../local-tts.mjs) → [worker.py](../tts/worker.py), [kokoro_voice.py](../tts/kokoro_voice.py). Nhận văn bản để tổng hợp âm thanh, không có system prompt. Kokoro sinh theo câu, không suy luận tăng dần từng token |

Prompt dinh dưỡng yêu cầu ghi giả định và khoảng ước tính; prompt triệu chứng yêu cầu hỏi làm rõ, nêu khả năng chưa xác định và hướng dẫn đi khám, không kê đơn hoặc khẳng định chẩn đoán. Các công cụ có thể báo không sẵn sàng khi thiếu key hoặc API lỗi; điều đó khác với chưa được kết nối trong mã.

`BOOKING_SUPPORT_PROMPT` hỏi thông tin đặt khám còn thiếu, cho phép không chọn bác sĩ cụ thể; khi chưa rõ khoa có thể hỏi làm rõ và đề xuất Nội tổng quát để sàng lọc. Chuỗi này ghi rõ thay thế quy tắc cũ về chọn khoa, được ghép vào prompt app streaming và sức khỏe. Nhánh phân loại không stream vẫn dùng `SYSTEM_PROMPT` hạn chế hơn; hai nhánh không có cùng phạm vi.

## Phần xử lý bằng quy tắc

- [domain.mjs](../src/domain.mjs): dữ liệu mẫu, `GUIDES`, kiểm tra dữ liệu lịch, `localIntent` và văn bản `guidance`.
- [chatbot-domain.mjs](../src/chatbot-domain.mjs), [chatbot.mjs](../src/chatbot.mjs): nhận lựa chọn rõ ràng, quản lý bước hỏi/phần thiếu, sửa lựa chọn, tóm tắt, xác nhận lịch mẫu và điều hướng. Nhiều lượt không gọi model; biến `prompts` là các câu hỏi giao diện cố định.
- [health-tools.mjs](../health-tools.mjs): `urgentSymptomMessage` nhận một số cụm từ khẩn cấp và trả lời cố định trước khi gọi model; `healthUnavailable` trả thông báo dự phòng. Bộ lọc không phải hệ thống phân luồng y khoa đầy đủ.
- [server.mjs](../server.mjs): kiểm tra mode, màn hình, đồng ý gửi câu hỏi, độ dài, vai trò lịch sử; che email/chuỗi số; kiểm tra JSON/intent và xử lý lỗi/timeout. Che chuỗi không bảo đảm khử định danh toàn bộ văn bản.
- [gemini-provider.mjs](../gemini-provider.mjs): chuyển message hệ thống thành `systemInstruction`, đọc SSE Gemini, kiểm tra phản hồi hoàn tất. Server gửi delta xuống trình duyệt bằng NDJSON; cấu hình Gemini không dùng OpenAI Responses API.

`/api/help` nhận câu hỏi tối đa 500 ký tự; lịch sử tối đa 6 message `user`/`assistant`, mỗi message tối đa 2.000 ký tự, không nhận message `system` từ client. Nhánh sức khỏe gửi lịch sử đã che thông tin liên hệ; nhánh hướng dẫn app streaming dùng câu hỏi và màn hình. Request được tạo trong [app.mjs](../src/app.mjs).

Live transcript vẫn gửi âm thanh trực tiếp tới Gemini bằng token tạm do server cấp. Sau khi chép xong, ứng dụng dùng **văn bản** để xử lý quy tắc hoặc gọi `/api/help`, không gửi lại cả bản thu cho model hội thoại.

## Trạng thái kiểm chứng

Cấu hình trên mô tả triển khai hiện tại, không chứng minh mọi nhánh đã kiểm thử thành công bằng key thật. Ghi chú “chưa đánh giá bằng key thật” bên dưới thuộc lịch sử v0.1, không phải kết luận chung cho bản Gemini. Test giả lập kiểm tra giao thức và xử lý lỗi, không xác nhận chất lượng nhận tiếng Việt hoặc tư vấn sức khỏe. P1 và P3 đã thử trên điện thoại ngày 19/10/2026, bản sau sửa cùng ngày nhưng chưa thử lại và chưa có mã build/commit; không tự quy kết quả cho model hoặc voicepack hiện tại; xem [user-test-log.md](../user-test-log.md).

## Lịch sử — không phải cấu hình hiện tại

Các đoạn dưới được giữ để truy vết mô tả cũ: OpenAI từng là model mặc định; công cụ sức khỏe từng chỉ có màn thông báo, sau đó được bổ sung prompt và nhánh gọi AI. Mã tương thích OpenAI và biến cấu hình tùy chọn vẫn còn trong server/`.env.example`. Nhánh chép lời bản thu cũng được giữ như lựa chọn riêng khi tắt live.

### Bản ghi v0.1 và các bổ sung trước khi chuyển sang Gemini

v0.1: phân loại ý câu hỏi để hướng dẫn thao tác đặt lịch. Prompt hệ thống thực thi là `SYSTEM_PROMPT` trong [server.mjs](../server.mjs).

- Model mặc định: `gpt-4.1-mini`, đổi bằng `OPENAI_MODEL`.
- Đầu vào: mã màn hình và một câu hỏi dùng thử tối đa 500 ký tự. Không gửi hồ sơ hoặc toàn bộ lịch hẹn.
- Đầu ra JSON: `intent` thuộc `next_step`, `explain_status`, `go_back`, `start_booking`, `view_appointments`, `clarify`, `out_of_scope`.
- Ứng dụng chọn văn bản và đích tô sáng từ [domain.mjs](../src/domain.mjs); đầu ra model không thực thi thao tác đặt lịch.
- API lỗi, timeout, từ chối, không hoàn tất, sai JSON hoặc intent ngoài danh sách → hướng dẫn cục bộ và nhãn dự phòng.
- Không tư vấn bệnh/thuốc/kết quả. Bộ lọc từ khóa không chứng nhận an toàn y khoa. Dữ liệu phải giả; che email và chuỗi số không bảo đảm khử định danh toàn bộ văn bản.
- Chưa đánh giá bằng key thật. Test API dùng phản hồi giả lập; mock dùng quy tắc từ khóa, có nhãn trên giao diện.

Ví dụ: màn `review`, câu “Bác muốn sửa người khám” → `go_back` → hướng dẫn bấm “Sửa”. Không tự thay hồ sơ hoặc gửi yêu cầu.

Hội thoại đặt lịch và điều hướng mới được xử lý cục bộ ở `src/chatbot-domain.mjs` và `src/chatbot.mjs`. Không cần gọi model để đặt lịch mẫu hoặc mở trang. Phân biệt yêu cầu chỉ cách mở với mở giúp; nhận thông tin rõ ràng về hồ sơ/chuyên khoa/cơ sở/ngày/giờ, hỏi lại phần thiếu. Không chọn chuyên khoa từ triệu chứng, không tự xác nhận từ câu nói. Chỉ các câu hỏi thao tác khác mới chuyển tới `/api/help` theo cơ chế đồng ý hiện có.

Luồng MIA dùng `src/additional-ui.mjs`, cùng các lựa chọn trong `domain.mjs` và `chatbot-domain.mjs`. Các màn phân tích triệu chứng/dinh dưỡng trong bộ tham chiếu chỉ có thông báo tính năng chưa kết nối, không thực thi chẩn đoán từ ảnh.


## Luồng câu trả lời streaming

Với `stream: true`, server dùng Responses API SSE và prompt riêng để tạo văn bản tiếng Việt ngắn dựa trên `GUIDES`. Chuyển từng delta xuống trình duyệt khi model đang sinh. Model không có công cụ thao tác lịch/hồ sơ. Nội dung về thuốc/triệu chứng thuộc bộ lọc hiện tại tiếp tục được xử lý cục bộ. Nhánh không stream giữ Structured Outputs phân loại intent.

Nếu đang stream mà timeout, từ chối, thiếu sự kiện completed hoặc lỗi dữ liệu, server gửi metadata thay thế và hướng dẫn dự phòng. Trình duyệt bỏ phần chưa hoàn tất, hủy giọng cũ và tôn trọng lựa chọn Dừng đọc. Streaming làm nội dung sinh tự do có thể hiện trước khi toàn bộ câu trả lời hoàn tất; các test kỹ thuật không chứng minh mọi câu trả lời model đều chính xác.

Nguồn: [OpenAI — Streaming API responses](https://developers.openai.com/api/docs/guides/streaming-responses).

## Prompt công cụ sức khỏe

`health-tools.mjs` tách hai tác vụ `nutrition_estimate` và `symptom_review`, được người dùng chọn bằng thẻ; không để model tự gọi tác vụ hay thao tác lịch. Yêu cầu /api/help dùng `mode` và tối đa 6 message user/assistant, mỗi message tối đa 2.000 ký tự; không chấp nhận message system từ client. Prompt cố định chỉ có ở server. Các số liên hệ/email được che như luồng cũ; cơ chế này không bảo đảm khử định danh toàn bộ văn bản.

Dinh dưỡng: ước tính có giả định từ khẩu phần/cách nấu; phân biệt thực phẩm chín/sống, không giả vờ tra dữ liệu hoặc đọc ảnh. Triệu chứng: hỏi thông tin còn thiếu, nêu các khả năng dưới dạng chưa xác định, hướng dẫn khi nào cần khám; không kết luận bệnh chắc chắn, không kê đơn. Không coi kết quả model là chẩn đoán hoặc thay thế bác sĩ.

Nguồn tham khảo để xây dựng yêu cầu hỏi khẩu phần và dấu hiệu khẩn cấp: [NIDDK — Food Portions](https://www.niddk.nih.gov/health-information/weight-management/just-enough-food-portions), [NHS — Heart attack](https://www.nhs.uk/conditions/heart-attack/), [NHS — Shortness of breath](https://www.nhs.uk/conditions/shortness-of-breath/). Không phải công cụ được những tổ chức này xác nhận. Không dùng số điện thoại cấp cứu Anh làm số địa phương Việt Nam.
