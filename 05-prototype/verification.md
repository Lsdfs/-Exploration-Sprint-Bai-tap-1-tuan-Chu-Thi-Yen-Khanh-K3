# Kiểm chứng prototype

Ngày: 18/10/2026. AI hỗ trợ viết và chạy các bài kiểm tra. Đây là bằng chứng kỹ thuật, không phải phỏng vấn hoặc thử nghiệm với người lớn tuổi.

## Môi trường

- Node.js 24.18.1, Windows; Playwright 1.64.1, trình duyệt Microsoft Edge có sẵn.
- Hai viewport: desktop 1440×1000 và mobile 390×844. Không khẳng định tương thích Safari hay thiết bị điện thoại thật.
- Dữ liệu hồ sơ, ngày giờ và yêu cầu đều mô phỏng. Test không gọi OpenAI thật, không phát sinh chi phí API.

## Các nhóm kiểm tra

| Nhóm | Nội dung |
| --- | --- |
| Logic | Ngày theo múi giờ Việt Nam, qua tháng/năm; lựa chọn hợp lệ; yêu cầu đủ thông tin và xác nhận; giờ hết chỗ; nội dung tóm tắt |
| Hướng dẫn | Hiểu ý câu hỏi mock; phân biệt xem lịch với hỏi trạng thái; có hướng dẫn theo từng màn; từ chối câu hỏi chuyên môn |
| HTTP và API | Không phục vụ .env/mã máy chủ; không lộ key qua config; kiểm tra input, kích thước, origin; đồng ý trước khi gửi AI |
| AI giả lập | Structured Outputs; che email/chuỗi số; xử lý timeout, 429, từ chối, không hoàn tất, sai JSON và intent lạ bằng hướng dẫn dự phòng |
| Đặt lịch E2E | Bản thân/người thân, cơ sở và chuyên khoa khác nhau; thiếu trường; quay lại; sửa người khám; ngày/giờ; xác nhận trước gửi |
| Kết quả E2E | Chờ xác nhận, xem lại yêu cầu; chống bấm gửi lặp và chống yêu cầu trùng; lỗi gửi rồi thử lại |
| Dùng giao diện E2E | Bỏ bản nháp có xác nhận; trợ lý bật/tắt; tô sáng; mạng lỗi; bỏ phản hồi AI cũ khi chuyển màn; chữ lớn; bàn phím; không tràn ngang |
| Phiên và log E2E | Xuất JSON có sự kiện nhưng không có nội dung câu hỏi; bắt đầu phiên mới; cổng đồng ý khi giả lập live mode |

## Kết quả chạy

- `npm.cmd test`: **27/27** bài qua.
- E2E: **64/64** lượt qua (32 kịch bản × 2 viewport): 16 luồng nền, 5 giọng nói, 3 UI gốc, 6 chatbot và 2 UI MIA/form mới.
- Lần cuối `npm.cmd run test:all` kết thúc tự động với mã 0; E2E hoàn tất trong 66.2 giây. Máy chủ test được tạo và đóng trong global setup/teardown, không để lại tiến trình con.
- Giọng nói: kiểm tra xem/sửa transcript trước khi thực hiện, mở luồng đặt lịch, mở lịch hẹn, từ chối quyền, lỗi mạng, thiếu hỗ trợ và bỏ kết quả nhận dạng cũ sau khi chuyển màn. Các sự kiện nhận giọng nói trong test được giả lập; chưa kiểm tra micro và nhận dạng tiếng Việt với âm thanh thật.
- Server kiểm tra cục bộ chạy tại `http://127.0.0.1:4175/`; khi chạy `npm.cmd start`, địa chỉ mặc định là `http://127.0.0.1:4173/`.
- Báo cáo Playwright được sinh cục bộ trong `playwright-report/index.html`, kết quả JSON ở `test-results/results.json`. Hai thư mục này được Git bỏ qua.
- Ảnh các màn chính được giữ ở [artifacts/](artifacts/).

## Những việc chưa xác nhận

- Chưa đánh giá phản hồi OpenAI bằng key thật; kiểm tra hợp đồng API dùng phản hồi giả lập.
- Chưa kiểm tra phát âm tiếng Việt của từng thiết bị. Chức năng nghe dùng `speechSynthesis`, phụ thuộc giọng được cài và hỗ trợ trình duyệt.
- Chưa thực hiện kết nối, đăng nhập hoặc đặt lịch với hệ thống Vinmec thật.
- Chưa kết luận người lớn tuổi có nhu cầu hoặc hoàn thành nhanh hơn nhờ AI. Ghi riêng kết quả 2–3 người thật ở [user-test-log.md](user-test-log.md), xin đồng ý trước khi thử.

## Cách thử người thật

Giao nhiệm vụ bằng thông tin giả: đặt cho Bác An, cơ sở Times City, chuyên khoa Nội tổng quát, một ngày và giờ được giao. Để họ tự thao tác; chỉ giúp khi cần và ghi nhận trong công cụ. Đổi nhiệm vụ tương đương khi so sánh bật/tắt hướng dẫn, đổi thứ tự nếu có thể. Đo hoàn tất đúng, thời gian, thao tác sai, số lần người điều phối giúp và người tham gia hiểu trạng thái nào sau khi gửi. Không dùng lời khen thay cho bằng chứng hoàn thành.

## Giao diện v0.3

- Trang chủ theo ảnh 090654; nút mở màn hình và bảng trong bộ 13 ảnh tham chiếu.
- Kiểm tra lưới 12 tiện ích, điều hướng/quay lại, tìm dịch vụ, bảng liên hệ và tất cả dịch vụ, hộp thoại kết nối, kiểm tra giá chỉ sau khi chọn bệnh viện, Escape đóng hộp thoại và nút Đặt hẹn mở luồng đặt lịch.
- Tài nguyên UI mới được phục vụ qua danh sách đường dẫn cho phép; đường dẫn tùy ý và tài liệu gốc không bị công khai qua server.
- Đã so SHA-256: 13/13 JPEG gốc giữ nguyên. Đã xem ảnh chụp trang chủ mobile và desktop; kiểm tra không tràn ngang trên các màn hình tham chiếu.
- Bước sau màn hình tham chiếu, giá, nội dung bài viết và hồ sơ kết nối vẫn là mô phỏng/chưa có dữ liệu thật.

## Chatbot nhân vật và UI bổ sung

- Robot chào ngay khi vào app; đặt lịch qua hội thoại, sửa thông tin, nhập nhiều thông tin trong một câu, không xác nhận bằng câu nói.
- Phân biệt hướng dẫn với mở giúp; mục tiêu là nút thật trên thanh dưới. Giữ hội thoại sau điều hướng; bỏ yêu cầu chưa xử lý và phản hồi API cũ khi chuyển màn.
- Thử chế độ giọng nói mô phỏng: đang nghe, dừng, bản chép lời có thể sửa, điều hướng thật sau khi dùng câu nói. Giọng nói thật trong E2E vẫn được giả lập, không chứng minh nhận dạng âm thanh thật.
- UI MIA: bảng chọn loại hẹn, bốn thẻ chức năng, thông tin cơ bản, hộp tìm cơ sở/chuyên khoa/bác sĩ, lịch tháng, giờ hết chỗ, hai lựa chọn đồng ý, ghi nhận và xem lịch. Form thường dùng cùng bộ dữ liệu.
- Tài nguyên UI phục vụ qua allowlist; 13 ảnh cũ và 23 ảnh mới không được phục vụ qua server prototype. Chỉ mascot/banner/biểu tượng cắt riêng được dùng. Không gọi API dịch vụ y khoa, không chẩn đoán hoặc phân tích dinh dưỡng.
- Đã xem ảnh chụp MIA và robot chào trên điện thoại, cùng màn xác nhận. Artifact: chat-welcome-mobile.png, mia-home-mobile.png, mia-review-mobile.png và bản desktop tương ứng.
# Cập nhật Mia và giọng nói — 18/10/2026

Chatbot sử dụng asset Mia có sẵn, giữ micro trong hướng dẫn và hỗ trợ lệnh sửa, chọn thứ tự, quay lại, mở trang theo ngữ cảnh và xác nhận từ bản tóm tắt. Đã kiểm tra đặt lịch bằng câu nói mô phỏng, đổi giờ viết bằng chữ và chặn xác nhận trước khi đủ thông tin. Kiểm thử micro thật dùng SpeechRecognition giả lập; chưa xác minh chất lượng nhận dạng tiếng Việt bằng micro trên thiết bị thật.


## Kiểm chứng Mia — 19/10/2026

- `npm.cmd run test:all`: 30/30 test logic/API và 96/96 lượt E2E qua (desktop và mobile). Chạy lại `npm.cmd test` sau khi thêm assertion hồi quy phân loại “khám tim… không chọn bác sĩ”: 30/30 qua.
- E2E mới kiểm tra trang Mia có micro/ô chat, gợi ý khoa, trả lời chức năng app, bản nháp và lịch đã xác nhận giữ sau reload, chưa tạo lịch trước xác nhận, sửa giờ bằng giọng nói trước khi lưu, phản hồi chậm sau 4 giây và Dừng chờ.
- Đã xem ảnh trang Mia trên desktop/mobile: `artifacts/mia-reference-desktop.png`, `artifacts/mia-reference-mobile.png`.
- Nhận dạng giọng nói trong test được giả lập qua SpeechRecognition; chưa đánh giá âm thanh tiếng Việt thật. API trong test dùng mock, chưa đánh giá câu trả lời bằng key thật.
- Bản nháp hội thoại/lịch mẫu dùng sessionStorage trong tab; chưa lưu vào máy chủ hay bệnh viện. Không lưu âm thanh hoặc nội dung hội thoại vào storage. Log nghiên cứu tiếp tục không chứa câu hỏi.

## Kết quả QA toàn luồng — 19/10/2026

- `npm.cmd run test:all`: **36/36** bài logic/API và **160/160** lượt E2E qua, không skip/retry; mã thoát 0. E2E khoảng 2,2 phút trên Edge desktop/mobile.
- Thêm 32 kịch bản trình duyệt đóng vai người mới và kiểm tra nút/nhánh lỗi (64 lượt trên hai viewport), cùng 6 bài logic/API mới. Ma trận logic kiểm tra 2.835 tổ hợp đặt lịch.
- Đã tái hiện và sửa lỗi hiểu câu phủ định/câu hỏi thành xác nhận, giữ giờ/ngày cũ khi sửa sai, nhận câu ngắn, nhầm “đổi sang” với buổi sáng, giờ hết chỗ theo ngày đã chọn, đóng picker làm mất form và JSON null gây HTTP 500.
- API thật: 5/5 yêu cầu OpenAI trả HTTP 200, đúng hướng dẫn và không dùng fallback; 821–2.722 ms trong lần chạy. Hai ca không đồng ý và câu hỏi thuốc không gọi upstream. Không in/lưu key.
- [Báo cáo phạm vi, tình huống và giới hạn](artifacts/qa-mia-2026-10-19.md); [kết quả gọi API thật](artifacts/live-api-smoke.json).
- Giọng nói E2E vẫn giả lập SpeechRecognition. Chưa thử âm thanh trên thiết bị thật, chưa đặt lịch với bệnh viện hoặc thực hiện giao dịch thật. Không ghi kết quả tự động thành dữ liệu thử người tham gia.

## Streaming end-to-end — 19/10/2026

- `npm.cmd run test:all`: **43/43** test logic/API và **166/166** lượt E2E qua; mã thoát 0. Chạy lại `npm.cmd test` sau chỉnh prompt: 43/43 qua. E2E khoảng 2,9 phút, không skip/retry.
- Test server giữ upstream chưa kết thúc và xác nhận delta đã đến client; kiểm tra hủy upstream khi client ngắt, stream thiếu completion/từ chối/lỗi dữ liệu, UTF-8 bị chia byte và fallback thay thế phần chưa hoàn tất.
- Test voice nhận nhiều mẩu chữ: chưa đủ câu thì chưa đọc, đủ câu thì đọc ngay, flush phần cuối khi done; Dừng đọc giữ chữ stream nhưng tắt voice phần còn lại; đổi màn bỏ chữ/giọng cũ; fallback không bật lại voice đã tắt.
- Đã gọi một API thật qua trình duyệt: chữ đầu 2.321 ms, dispatch giọng câu đầu 2.498 ms, hoàn tất 2.752 ms, không fallback. Đây là một lần đo, không phải benchmark; thời gian voice đo tại điểm gọi speechSynthesis, không đo âm thanh loa. [Kết quả](artifacts/live-stream-smoke.json).
- Voice tiếp tục dùng speechSynthesis tiếng Việt của trình duyệt, không thêm dịch vụ TTS ngoài. Chưa đo tiếng Việt phát qua loa trên thiết bị thật. Câu trả lời cục bộ hiện ngay; câu trả lời OpenAI live chuyển delta ngay từ SSE. Các lệnh đặt lịch vẫn cần bản tóm tắt và xác nhận rõ ràng.

## Sửa điểm vào và giao diện Mia — 19/10/2026

Nút Mia nổi hiện mở trang Mia toàn màn hình thay cho panel cũ. Trang chào sử dụng nhân vật cắt từ reference, nền xám và bốn thẻ; ô chat ở cuối. Đặt lịch bằng lời nói mở form ba bước giống luồng bấm thẻ. Form có micro/ô nhập, dùng chung bản nháp với hội thoại. Bảng chọn giữ composer khi render lại và đồng bộ lựa chọn trước khi người dùng nói tiếp.

Kiểm tra: 43/43 logic/API qua trước thay asset; 12/12 lượt E2E giao diện/stream trên desktop/mobile qua; sau thay asset chạy lại 4/4 lượt giao diện qua. Ảnh: `artifacts/mia-matched-home-mobile.png`, `artifacts/mia-matched-basics-mobile.png`, `artifacts/mia-matched-review-mobile.png` và bản desktop. Bộ test cũ có giả định panel nổi cần cập nhật cho điều hướng mới; chưa khẳng định toàn bộ suite cũ qua với bố cục này. Giọng nói thật vẫn cần thử trên thiết bị.

## Công cụ dinh dưỡng và triệu chứng — 19/10/2026

Đã nối hai thẻ với Responses API streaming bằng prompt riêng, có hỏi tiếp theo ngữ cảnh và giọng đọc. Kết quả kiểm tra: 48/48 test logic/API; 20/20 lượt E2E liên quan (công cụ sức khỏe, giao diện Mia, stream) trên desktop/mobile. Đây không phải kết quả toàn bộ suite UI cũ có giả định panel nổi. Test kiểm tra mode, history, lỗi API, hướng dẫn khẩn cấp cục bộ, không tạo lịch, hỏi tiếp và quay lại đặt lịch.

Đã gọi 2 API thật với dữ liệu giả: dinh dưỡng và triệu chứng đều HTTP 200, provider openai, không fallback. Chữ đầu khoảng 1.444–1.767 ms, hoàn tất 2.646–3.735 ms trong lần đo. Bằng chứng: `artifacts/live-health-smoke.json`. Đã xem nội dung trả về để rà cách diễn đạt và siết thêm prompt tránh khẳng định bệnh/dấu markdown. Test kỹ thuật không chứng minh tính chính xác lâm sàng hoặc dinh dưỡng; chưa xác thực với bác sĩ/chuyên gia, chưa phân tích ảnh.

## Chọn giọng Mia — 19/10/2026

Bỏ chọn giọng tiếng Việt đầu tiên/mặc định vì có thể là NamMinh hoặc giọng nam khác. Ưu tiên HoaiMy hoặc giọng tiếng Việt có nhãn nữ, đợi tối đa 1,2 giây cho voiceschanged khi danh sách chưa sẵn sàng; cao độ 0,92 và tốc độ 0,88. Nếu chưa có giọng nữ phù hợp, báo trong ô chat và giữ trả lời chữ, không tự rơi về giọng nam. Khi chuyển màn hoặc dừng đọc, lời nói đang đợi giọng cũng bị bỏ theo generation hiện có.

Kiểm tra: 49 test logic/API qua; 22 lượt E2E giọng/stream/công cụ sức khỏe qua trên desktop/mobile, gồm giọng nữ tải muộn và máy chỉ có giọng nam. SpeechSynthesis trong test là giả lập; chưa nghe và đánh giá âm thanh thực tế trên máy người dùng.

## Chuyển TTS offline — 19/10/2026

Đã bỏ browser speechSynthesis và danh sách giọng hệ điều hành. Piper 1.8.0 + ONNX chạy trong venv của prototype, model vi_VN-vais1000-medium tải nguyên bản vào tts/models với revision/checksum/model card. Worker nạp một lần, làm nóng lúc npm start, tổng hợp WAV từng câu qua /api/tts. Cache RAM tối đa 24 câu/12 MiB; không ghi hội thoại hoặc âm thanh người dùng ra đĩa.

Kiểm tra: 52/52 logic/API và 26/26 lượt E2E liên quan trên desktop/mobile qua (local voice, thiết kế Mia, stream, hai công cụ sức khỏe). Test chọn giọng trình duyệt cũ được thay bằng kiểm tra WAV cục bộ, thứ tự phát, dừng/hủy và lỗi không quay lại browser TTS. Chưa khẳng định toàn bộ các E2E lịch sử có giả định giao diện cũ đều qua.

Đã tổng hợp WAV thật không gọi cloud: warmup 5.288 ms, câu chào 606 ms, câu đặt lịch 1.472 ms, cache câu chào 21 ms trong lần đo. File artifacts/local-tts-smoke.json ghi kết quả. Script local-tts-browser-smoke.mjs kiểm tra trình duyệt phát WAV thật, sự kiện playing xuất hiện, không pageerror, không request mạng ngoài localhost; artifacts/local-tts-browser.json ghi kết quả. Có WAV mẫu để nghe; chưa đánh giá chất lượng nghe thực tế trên loa máy người dùng, không khẳng định giới tính của model vì model card không công bố.
# Micro streaming OpenAI — 19/10/2026

- Thay nhận dạng giọng nói trình duyệt bằng OpenAI Realtime transcription qua WebRTC; API key chỉ ở server. Giữ stream câu trả lời và Piper cục bộ.
- Kiểm tra test-first: 3 test API mới ban đầu thất bại 404, sau triển khai đều qua. Lần chạy cuối `npm.cmd test`: 58/58 qua (bao gồm các test khác đang có trong workspace).
- E2E liên quan: 42/42 trên desktop/mobile qua qua hai lượt chạy: `voice.spec mia-controls` (32), `mia-design mia-reference` (10 trong lượt chạy 36 test trước đó). Kiểm tra delta/final, kết quả lặp, đổi trang, hủy khi đang chờ quyền, từ chối chia sẻ âm thanh, lỗi cấu hình/quyền, giải phóng micro, đặt lịch cần đủ thông tin và xác nhận; giọng đọc vẫn cục bộ.
- Bài thử OpenAI thật: [realtime-voice-smoke.json](artifacts/realtime-voice-smoke.json). API trả 201, WebRTC/data channel kết nối, nhận speech_started/stopped, nhiều delta và completed. Bản chép lời được đưa vào chat. Dùng WAV chào tổng hợp có khoảng lặng cuối câu, không dùng micro vật lý; chạy `node scripts/realtime-voice-smoke.mjs` sẽ gọi API thật.
- Bài thử thật chứng minh đường truyền và tích hợp, không chứng minh độ chính xác nhận dạng: câu tổng hợp bị nhận sai một số từ/tên Mia. Chưa thử giọng người lớn tuổi, tiếng ồn, thiết bị iOS/Android hoặc nghe bằng tai. Cần kiểm tra bản tóm tắt và xác nhận trước khi ghi nhận lịch mẫu.

## Nhận tên chuyên khoa bằng giọng nói — 19/10/2026

- Bổ sung prompt tiếng Việt cho phiên Realtime transcription, gồm ngữ cảnh đặt lịch, cách gọi khoa nội và danh sách chuyên khoa/cơ sở từ dữ liệu prototype. Giữ model được cấu hình, ngôn ngữ, VAD và đường truyền âm thanh hiện có.
- Nhận “khoa nội”, “khám nội”, “nội khoa” là Nội tổng quát khi tên ngắn kết thúc hoặc được nối với thông tin đặt lịch. Không tự gán “hoa nụ”, “hoa nội”, “nội tiết”, “nội soi”, “nội thần kinh” và các từ không phải tên khoa thành Nội tổng quát.
- Test-first: hai bài logic/API mới thất bại đúng vì thiếu prompt/cách gọi ngắn; kịch bản giọng nói trên desktop/mobile thất bại vì hỏi lại chuyên khoa. Sau sửa, `npm.cmd test`: **66/66 qua**; `npm.cmd run test:e2e -- tests/e2e/voice.spec.mjs tests/e2e/mia-controls.spec.mjs`: **28/28 qua**. Sau bổ sung kiểm tra ngày hiển thị, chạy lại kịch bản `Spoken khoa noi`: **2/2 qua**.
- Kiểm tra xác nhận prompt đi tới upstream bằng mock và bản chép lời hoàn tất đi qua luồng giọng nói/đặt lịch. Đây không phải phép đo chất lượng nhận dạng âm thanh; lần sửa này không gọi OpenAI thật hoặc micro vật lý. Cần khởi động lại server, tải lại trang và thử lại giọng người dùng để đánh giá lỗi “khoa nội” → “hoa nụ”.
