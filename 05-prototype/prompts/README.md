# Prompt đã sử dụng

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
