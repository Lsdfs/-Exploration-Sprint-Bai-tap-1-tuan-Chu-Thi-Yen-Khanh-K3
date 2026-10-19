# Prototype: hỗ trợ người lớn tuổi đặt lịch từng bước

### Cập nhật Mia và giọng nói

Giao diện vào app đã đổi theo hai ảnh mới từ thư mục Drive `1T7IzNPQNbYeSP2pEmV4NysUm79GqqqoW`: dùng nguyên biểu tượng tròn có chữ AI ở `src/assets/mia-launcher.jpg`, nằm nhỏ góc dưới phải. Lần vào tab hiện lớp tối làm nổi bật Mia và lời mời trò chuyện. Bấm **Đã hiểu** để đóng giới thiệu, giữ khung chat thu gọn; bấm Mia để mở chat. Chuyển trang không hiện lại giới thiệu. Mô tả cũ về tự mở khung chat bên dưới đã được thay thế.

Chatbot dùng `src/assets/mia.png`, nhân vật từ ảnh tham chiếu bổ sung, cho phần chào và nút nổi. Nút **Nói với Mia** hỗ trợ micro thật hoặc chế độ mô phỏng có bản chép lời chỉnh sửa được. Trong chế độ hướng dẫn, micro nằm trong bong bóng hướng dẫn.

Lệnh mẫu: “Đặt giúp tôi khám tim ngày mai chín giờ tại Vinmec Times City”, “Không chọn bác sĩ cụ thể”, “Đổi sang tám giờ”, “Chọn giờ thứ hai”, “Sửa người khám”, “Đọc lại thông tin”, “Quay lại bước trước”, “Mở giúp tôi luôn”, “Dừng hướng dẫn”, “Đóng khung chat”. Chỉ khi đã hiển thị bản tóm tắt đầy đủ mới chấp nhận câu “Xác nhận đặt lịch”. Quy tắc này thay thế mô tả cũ bên dưới về việc bắt buộc bấm nút xác nhận. Lịch vẫn là dữ liệu mô phỏng trong phiên, không gửi đến bệnh viện.

Hướng chính: **đặt lịch khám** cho người lớn tuổi ít quen ứng dụng. Đây là thiết kế đề xuất tham khảo MyVinmec, không phải sản phẩm chính thức. AI hỗ trợ tạo mã nguồn, giao diện và bài kiểm tra.

## Chạy ngay — chưa cần API key

Nhận giọng nói được bổ sung ngữ cảnh đặt lịch, tên chuyên khoa và cơ sở cho OpenAI. Trong luồng đặt lịch, “khoa nội”, “khám nội”, “nội khoa” được hiểu là Nội tổng quát; không tự sửa câu nhận sai như “hoa nụ” thành lựa chọn khám. Thay đổi cấu hình nhận giọng nói cần khởi động lại server và tải lại trang. Độ chính xác với giọng thật cần thử bằng micro thực tế.

Cần Node.js 22 trở lên. Mở terminal trong thư mục `05-prototype/`:

```powershell
npm.cmd start
```

Mở **http://127.0.0.1:4173**. Chạy mặc định không cần cài thư viện, dùng hướng dẫn mô phỏng và không gọi AI bên ngoài. Không mở trực tiếp `src/index.html` bằng `file://`.

## Luồng đã có

### UI bổ sung: MIA và đặt lịch hẹn

Bộ [23 ảnh mới](references/additional/index.html) đã được tích hợp vào prototype:

- **Đặt lịch** ở thanh dưới mở bảng chọn loại đặt hẹn theo ảnh 104012. **Khám chuyên khoa tại bệnh viện** mở trang MIA; **Đặt hẹn theo mẫu** mở form thông thường.
- **Trợ lý sức khỏe AI MIA** trên trang chủ/tất cả dịch vụ mở màn hình có nhân vật và bốn thẻ theo ảnh 104751. **Đặt lịch khám** mở luồng ba bước: thông tin cơ bản → chuyên khoa, bác sĩ, ngày giờ → xác nhận.
- Các hộp chọn có tìm kiếm cơ sở/chuyên khoa/bác sĩ, lịch tháng và khung giờ mẫu theo ảnh 105031–105136. Ngày ngoài bộ lịch mẫu và giờ hết chỗ bị vô hiệu hóa. Thẻ cuối cho sửa từng mục, yêu cầu đồng ý hai lựa chọn rồi mới xác nhận.
- Form thông thường theo ảnh 104018–104029 và 104812–104820 dùng cùng hồ sơ, cơ sở, bác sĩ và giờ mẫu. Lịch tạo qua form, MIA hoặc hội thoại đều xuất hiện trong **Lịch hẹn** của phiên hiện tại, ở trạng thái **Chờ xác nhận · Mô phỏng**.
- Thẻ triệu chứng, dinh dưỡng và liên kết ứng dụng có tương tác thông báo giới hạn. Prototype chưa triển khai phân tích y khoa, kết nối vị trí hay dịch vụ bên ngoài. Không sao chép thông tin người bệnh trong ảnh vào dữ liệu demo.

### Chatbot nhân vật và ba kịch bản trình diễn

Robot xuất hiện ngay khi vào app với lời chào, **Đặt lịch khám**, **Hướng dẫn dùng app** và **Nói với mình**. Thu gọn bằng nút **−**; chạm robot ở góc dưới để mở lại. Trò chuyện được giữ khi chuyển trang.

1. Chọn **Đặt lịch khám** trong khung chat → người khám → chuyên khoa → cơ sở → bác sĩ hoặc không chọn bác sĩ cụ thể → ngày → giờ → thẻ tóm tắt → **Xác nhận đặt lịch** → **Xem lịch hẹn**.
2. Nhập **“Chỉ tôi cách xem lịch hẹn”** → trợ lý làm nổi bật nút Lịch hẹn dưới màn hình, đặt bong bóng chỉ dẫn cạnh mục tiêu → bấm đúng nút để sang bước tiếp theo. Có **Tiếp tục**, **Quay lại**, **Dừng hướng dẫn** và **Mở giúp tôi**. Áp dụng cả cho kết quả mẫu, tìm bác sĩ và thông tin cá nhân.
3. Nhập **“Mở trang lịch hẹn giúp tôi”** → mở trang thật trong prototype và hiển thị lời xác nhận đã mở. Với giọng nói, kiểm tra bản chép lời trước khi dùng. Chọn **Chế độ giọng nói → Mô phỏng** để trình diễn đang nghe, dừng, nhận bản chép lời và sửa câu mà không dùng micro.

Ví dụ **“Đặt giúp tôi khám tim sáng thứ Hai tại Vinmec Times City”** ghi nhận thông tin đã rõ và chỉ hỏi phần thiếu. “Buổi sáng” không được đổi thành một giờ cụ thể. Lệnh bằng chữ/giọng nói không tự xác nhận hoặc hủy lịch; sửa hồ sơ cũng có hộp xác nhận trước khi lưu. Có tùy chọn đọc câu trả lời thành tiếng nếu trình duyệt hỗ trợ.

Giao diện v0.3 dựng theo bộ ảnh MyVinmec người làm bài cung cấp: `Screenshot_20261018_090654_MyVinmec.jpg` là trang chủ. Các tiện ích mở màn hình hoặc bảng tương ứng:

| Nút trên trang chủ | Màn hình / bảng tham chiếu |
| --- | --- |
| Lịch hẹn | 090706; Đặt hẹn và dấu + mở luồng đặt lịch thử hiện có |
| Đơn thuốc / Nhắc lịch uống thuốc | 090713 / 090732 |
| Cẩm nang làm mẹ | 090719 |
| Liên hệ | Bảng dưới 090724 |
| Danh mục giá & quyền lợi | 090728; chọn bệnh viện trước khi kiểm tra |
| Dịch vụ y tế | 090736; tìm theo tên danh mục |
| Quyền lợi CBNV Vingroup | Hộp thoại 090741 |
| Tạm ứng viện phí / Sổ tiêm | 090745 / 090749 |
| Cộng đồng hỏi đáp bác sĩ | 090753; tìm theo tiêu đề chủ đề |
| Tất cả dịch vụ | Bảng dưới 090757 |

Thanh điều hướng dưới mở trang chủ, hồ sơ mẫu, đặt lịch, thông báo và tài khoản. Trang kết nối hồ sơ và các bước không có ảnh tham chiếu được ghi rõ là mô phỏng/chưa kết nối. Lịch đã gửi vẫn xem lại được trong phiên. Trợ lý và nhận giọng nói được giữ lại; trên điện thoại bảng trợ lý nằm phía trên thanh điều hướng.

Ảnh banner, biểu tượng và minh họa trong `src/assets/` được cắt từ bộ ảnh tham chiếu; 13 JPEG gốc trong `references/` giữ nguyên. Đây là tài nguyên cho prototype nghiên cứu, không phải bộ tài nguyên sản phẩm chính thức.

- Chọn bản thân/người thân → cơ sở → chuyên khoa được giao → ngày giờ → kiểm tra → tự xác nhận gửi yêu cầu thử.
- Sửa lựa chọn, quay lại, bỏ bản nháp có xác nhận; chặn bước thiếu, giờ hết chỗ và gửi trùng.
- Xem yêu cầu ở trạng thái **Chờ xác nhận · Mô phỏng**. Không tạo lịch khám thật.
- Bật/tắt hướng dẫn trên cùng giao diện, phóng to chữ, tô sáng vị trí cần bấm, nghe hướng dẫn nếu thiết bị hỗ trợ.
- **Nói với mình:** bấm micro, đồng ý nhận giọng nói, kiểm tra/sửa câu nhận dạng rồi bấm “Dùng yêu cầu này”. Nói yêu cầu đặt lịch mở hội thoại; nói “Mở lịch hẹn giúp tôi” điều hướng trực tiếp; hỏi cách mở thì hiện hướng dẫn. Các câu hỏi thao tác khác được chuyển sang trợ lý. Không tự xác nhận lịch bằng giọng nói.
- Trên điện thoại, khung chat mở ngay lúc vào app; có thể thu gọn để thao tác trên giao diện. Các nút và thông tin ngoài khung chat vẫn có thể dùng khi thu gọn.
- Nút công cụ góc trên: tải log JSON, ghi nhận người điều phối giúp, giả lập lỗi lần gửi tiếp theo, bắt đầu phiên mới.

Yêu cầu và log chỉ lưu trong bộ nhớ tab, mất khi tải lại. Tải log trước khi bắt đầu phiên mới. Không ghi nội dung câu hỏi vào log, không nhập thông tin thật.

Nhận giọng nói dùng OpenAI Realtime transcription qua WebRTC, mặc định `gpt-4o-transcribe`, tiếng Việt. Bật `AI_PROVIDER=openai` và API key trên server; có thể đổi `OPENAI_TRANSCRIPTION_MODEL`. Trình duyệt hỏi đồng ý gửi âm thanh trước lần bật micro đầu tiên trong trang, rồi xin quyền micro. Âm thanh truyền trực tiếp tới OpenAI; server chỉ chuyển thông tin thiết lập kết nối và giữ API key. Chữ xuất hiện dần; câu hoàn tất đi vào luồng hội thoại hiện có, câu trả lời tiếp tục stream và Piper đọc cục bộ. Một lần bấm nhận một câu; kết thúc, dừng nghe, đổi trang hoặc sau 60 giây đều đóng micro/kết nối. Không ghi âm thanh vào storage/đĩa của ứng dụng. Lỗi hoặc từ chối quyền vẫn gõ/bấm được. Cần localhost hoặc HTTPS và mạng cho WebRTC. Nguồn: [Realtime transcription](https://developers.openai.com/api/docs/guides/realtime-transcription), [WebRTC](https://developers.openai.com/api/docs/guides/voice-webrtc?voice-api=realtime).

## AI thật cần key nào?

Đã tích hợp **OpenAI API**, mặc định **`gpt-4.1-mini`**, dùng Responses API và Structured Outputs. Có thể đổi `OPENAI_MODEL` nếu tài khoản hỗ trợ. Không cần thêm key Gemini, Claude hay dịch vụ giọng nói cho bản này.

Sao chép `.env.example` thành `.env` trong thư mục này, sửa cục bộ:

```dotenv
AI_PROVIDER=openai
OPENAI_API_KEY=YOUR_KEY_HERE
OPENAI_MODEL=gpt-4.1-mini
```

Khởi động lại server. Trong giao diện, đồng ý gửi câu hỏi dùng thử tới OpenAI trước khi hỏi. **Key chỉ ở máy chủ**, không gửi qua chat hoặc đưa vào mã trình duyệt. `.env` được Git bỏ qua. Chưa gọi API thật bằng key người dùng.

AI nhận diện ý câu hỏi rồi chọn hướng dẫn được ứng dụng kiểm soát theo màn hình. Không chọn chuyên khoa từ triệu chứng, tự đặt lịch hay tự tuyên bố thành công. API lỗi thì báo rõ và dùng hướng dẫn có sẵn. Chế độ mô phỏng không chứng minh năng lực AI thật.

Nguồn kỹ thuật đã đọc: [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## Kiểm tra tự động

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run test:all
```

- `npm.cmd test`: logic đặt lịch và HTTP/API, giả lập phản hồi AI.
- `npm.cmd run test:e2e`: Playwright trên viewport máy tính 1440×1000 và điện thoại 390×844.
- Windows mặc định dùng Edge đã cài. Máy khác có thể cài Chromium bằng `npx playwright install chromium`. Có thể đổi `PLAYWRIGHT_CHANNEL`.
- Báo cáo HTML: `playwright-report/index.html`; ảnh màn hình: [artifacts/](artifacts/).
- Kết quả và giới hạn: [verification.md](verification.md).

Test dùng mock/API giả lập, không tính phí AI. Viewport điện thoại trên Edge chưa thay thế thử trên thiết bị iOS/Android thật.

## Tài liệu

- [Prompt và vai trò AI](prompts/README.md)
- [Bộ tham chiếu UI mới từ Drive](references/index.html): 13 ảnh gốc do người làm bài cung cấp, thay bộ ảnh cũ đã xóa.
- [Log thử người dùng](user-test-log.md): ghi riêng, không dùng test tự động để điền người tham gia.
- [Lịch sử chỉnh sửa](iteration-log.md)

Giả thuyết cần kiểm chứng: người tham gia muốn tự đặt lịch và hướng dẫn có giúp hơn cách không bật trợ lý hay không. Test kỹ thuật chưa chứng minh nhu cầu hoặc hiệu quả với người lớn tuổi/Vinmec.


## Mia theo bộ tham chiếu ngày 19/10/2026

Trang Mia dùng nền xám, bốn thẻ chức năng và ô hội thoại cố định cuối màn hình theo `references/mia/`. Giữ bảng đặt lịch ba bước; micro và nhập chữ có sẵn ngay trên trang Mia để đặt lịch qua hội thoại. Mia hỏi phần còn thiếu, cho sửa lựa chọn, hiển thị bản tóm tắt và chỉ ghi nhận khi người dùng xác nhận bằng nút hoặc câu “Xác nhận đặt lịch”.

Có gợi ý danh sách chuyên khoa để người dùng tự chọn và hướng dẫn các chức năng app: đơn thuốc, nhắc thuốc, sổ tiêm, liên hệ, tạm ứng, lịch hẹn, kết quả và hồ sơ. Không chẩn đoán từ triệu chứng.

Bản nháp hội thoại và lịch mẫu đã xác nhận được lưu bằng `sessionStorage` trong tab, giữ sau tải lại. Bắt đầu phiên mới xóa dữ liệu này. Không lưu âm thanh hoặc nội dung hội thoại vào storage. Nếu trình duyệt chặn lưu trữ, phiên đang mở vẫn tiếp tục được. Cơ chế này thay thế mô tả cũ “mất khi tải lại” đối với bản nháp hội thoại và lịch hẹn; chưa kết nối lưu vào bệnh viện.

Khi gọi trợ lý, hiện trạng thái đang xử lý; sau 4 giây báo đang mất lâu hơn dự kiến và có nút Dừng chờ. Giữ timeout 14 giây và hướng dẫn dự phòng khi lỗi. Dừng chờ hoặc điều hướng sẽ bỏ phản hồi cũ.

## Đợt QA mở rộng ngày 19/10/2026

Báo cáo phạm vi, lỗi tìm được, sửa lỗi và API thật: [artifacts/qa-mia-2026-10-19.md](artifacts/qa-mia-2026-10-19.md). Kết quả gọi OpenAI thật ở [artifacts/live-api-smoke.json](artifacts/live-api-smoke.json). Các ghi chú “chưa gọi API thật” phía trên là kết quả các phiên trước.

Chạy kiểm thử thường bằng `npm.cmd run test:all` (mock, không gọi API trả phí). Chỉ khi muốn kiểm tra API thật bằng cấu hình `.env`, chạy `node scripts/live-api-smoke.mjs`; script gửi 5 yêu cầu tới OpenAI và không in API key.

## Streaming chữ và voice — 19/10/2026

Yêu cầu trợ lý ở chế độ AI thật hiện gửi `stream: true` tới Responses API. Server chuyển tiếp từng sự kiện `response.output_text.delta` ngay khi nhận được; trình duyệt hiển thị từng mẩu chữ, gom câu hoàn chỉnh rồi đưa vào `speechSynthesis` theo thứ tự. Phần cuối chưa có dấu câu được đọc khi stream hoàn tất. Câu trả lời cục bộ có sẵn vẫn hiện ngay và được đọc theo câu.

**Dừng đọc** tắt giọng cho phần còn lại của câu trả lời, chữ vẫn tiếp tục. **Dừng phản hồi** hoặc chuyển màn hủy yêu cầu và giọng đang đọc; kết quả cũ bị bỏ. Khi stream lỗi giữa chừng, phần chưa hoàn tất được thay bằng hướng dẫn dự phòng và hủy giọng cũ. Người dùng đã dừng đọc sẽ không bị tự bật lại khi dùng dự phòng.

`/api/help` với `stream: true` dùng câu trả lời văn bản có ràng buộc từ dữ liệu hướng dẫn của app; không dùng JSON phân loại intent làm nội dung đọc. Các lệnh đặt/sửa/xác nhận lịch vẫn được xử lý bởi luồng ứng dụng có kiểm tra. Nhánh JSON không stream giữ hợp đồng phân loại intent cũ.

Đo end-to-end qua trình duyệt bằng một yêu cầu API thật: [artifacts/live-stream-smoke.json](artifacts/live-stream-smoke.json). Script opt-in `node scripts/live-stream-smoke.mjs` gọi một phản hồi thật và ghi thời gian chữ đầu/câu đầu/kết thúc. Giọng trong script được đo tại điểm dispatch, không phát/đo âm thanh thật.

## Hai công cụ sức khỏe Mia — 19/10/2026

Hai thẻ Kiểm tra triệu chứng và Phân tích dinh dưỡng hiện mở chế độ hội thoại AI thay cho hộp thoại chưa kết nối. Dùng cùng `/api/help`, chọn `mode: symptoms` hoặc `mode: nutrition`, stream chữ và đọc từng câu. Có nút Quay lại Mia, hỏi tiếp với tối đa 6 lượt nội dung gần nhất trong bộ nhớ; không lưu hội thoại sức khỏe vào sessionStorage hoặc log thao tác. Nội dung được gửi tới OpenAI khi hỏi; chỉ nhập thông tin cần thiết, không nhập định danh.

Công cụ prompt được định nghĩa trên server trong `health-tools.mjs`: `nutrition_estimate` ước tính calo, protein/carbohydrate/chất béo/chất xơ từ món và khẩu phần, hỏi thêm cách nấu/dầu/sốt; `symptom_review` hỏi triệu chứng/diễn tiến/mức độ, giải thích khả năng và hướng dẫn mức độ cần khám. Đây là hai tác vụ prompt có định tuyến, không phải công cụ chẩn đoán lâm sàng đã kiểm định hoặc tích hợp cơ sở dữ liệu dinh dưỡng. Chưa phân tích ảnh.

Triệu chứng nguy hiểm khớp bộ sàng lọc đơn giản được nhắc liên hệ cấp cứu ngay trước khi chờ model. Bộ này không bao phủ mọi cấp cứu; prompt tiếp tục yêu cầu đánh giá mức độ khẩn cấp và không khẳng định chẩn đoán/kê đơn. Lỗi API hoặc thiếu key hiển thị chưa thể phân tích, không giả kết quả y khoa. Giữ nguyên kiểm tra input, lịch sử và luồng đặt lịch có xác nhận.

## TTS cục bộ — 19/10/2026

Mia hiện đọc bằng Piper chạy trên CPU, thay hoàn toàn speechSynthesis. Đã cài môi trường riêng `.tts-venv` và lưu model tiếng Việt ~63 MB trong `tts/models/`; không tải model lúc bấm voiceover. Server nạp/làm nóng model một lần khi khởi động. Giọng không còn phụ thuộc danh sách voice của trình duyệt. Hướng dẫn cài lại, giấy phép và nguồn: [tts/README.md](tts/README.md).

Khởi động lại `npm.cmd start` và đợi dòng `Mia: local Vietnamese TTS ready.`; sau đó tải lại trang. Nghe mẫu [câu chào](artifacts/tts-greeting.wav) hoặc [đặt lịch](artifacts/tts-booking.wav). Đây là giọng của model Piper, không phải HoaiMy. TTS offline không thay đổi việc AI chat cần OpenAI hoặc nhận dạng micro phụ thuộc trình duyệt.

## Cơ sở từ P1/P2/P3 và bước kiểm chứng voiceover

Phân tích ngày 19/10/2026 chọn đặt lịch vì P1-E08/P2-E08 ghi nhận gõ chậm, ít quen thiết bị, khó phân biệt nút; P1-E09/P2-E09 ghi nhận mong đặt lịch đơn giản như gọi điện. Đây là cơ sở thử Mia, chưa chứng minh người tham gia thích voice hoặc tự dùng được micro. P3 (17/10/2026, nhóm 50–60 tuổi) khá quen điện thoại nhưng vướng trường bắt buộc, trạng thái lựa chọn, tìm danh sách và nhập chữ (P3-E11–P3-E15). AI có sẵn trên MyVinmec khoảng 6 phút, đặt lịch thành công; luồng thường ghi nhận 11 phút. P3 đánh giá AI dễ làm hơn. Đây không phải kết quả thử tính năng voiceover bổ sung; mốc đo chưa tương đương nên không tuyên bố tiết kiệm 5 phút.

Để kiểm chứng phần voiceover bổ sung, dự kiến so cùng luồng AI khi tắt/bật giọng đọc, giữ tác vụ và biểu mẫu tương đương; đo hoàn tất đúng, công đọc/nghe, thời gian gồm công sửa, lần giúp và hiểu trạng thái. Nhập giọng nói được đánh giá riêng để tránh trộn tác động với giọng đọc. Không dùng khoảng chờ khám 1–2 tiếng làm baseline đặt lịch. Phỏng vấn P1/P2 và quan sát AI có sẵn trên MyVinmec của P3 không phải phiên thử tính năng voiceover bổ sung. [Kế hoạch và log](user-test-log.md) chưa có kết quả người thật; [kiểm chứng kỹ thuật](verification.md) ghi riêng các lần chạy đã có. Lượt cập nhật này chỉ sửa tài liệu nghiên cứu, không chạy lại hoặc thay đổi mã prototype.

