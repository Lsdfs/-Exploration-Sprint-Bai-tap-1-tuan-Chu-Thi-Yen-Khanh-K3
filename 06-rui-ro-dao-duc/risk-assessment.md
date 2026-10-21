# Rủi ro và đạo đức — Agent voice cho người cao tuổi

**Đánh giá rủi ro thiết kế, chưa phải chứng nhận an toàn.** AI hỗ trợ theo tài liệu học AI Thực Chiến (bản ghi chú cá nhân lưu cục bộ), mục 7, 9–10, 13.4. Phạm vi đánh giá và trình diễn của bài là đặt lịch mô phỏng bằng hồ sơ/lịch mẫu. Sản phẩm hiện có thêm công cụ triệu chứng và dinh dưỡng gọi Gemini bằng văn bản; các công cụ này nằm ngoài phạm vi đánh giá đặt lịch, chưa được xác nhận an toàn hoặc hiệu quả qua T1/T2. Không mô tả toàn bộ sản phẩm là chỉ hướng dẫn thao tác.

Buổi thử đã ghi nhận người dùng nêu câu hỏi triệu chứng trong hội thoại; không dùng đó làm bằng chứng kiểm định tư vấn y khoa, cũng chưa xác định đó là triệu chứng thật hay giả. Các buổi tiếp theo chỉ dùng tình huống dịch vụ và dữ liệu giả theo thẻ tác vụ, không hỏi bệnh sử hoặc triệu chứng thật để nghiên cứu theo đề. Nếu trình diễn công cụ sức khỏe riêng, phải thông báo phạm vi, dữ liệu gửi AI và giới hạn: không thay khám bác sĩ, không kê đơn, không kết luận chẩn đoán; ước tính dinh dưỡng có thể sai. Bộ lọc khẩn cấp và prompt không bảo đảm phát hiện mọi tình huống nguy hiểm.

| Rủi ro / tình huống | Tác động | Giảm thiểu đề xuất | Cách kiểm tra | Rủi ro còn lại |
| --- | --- | --- | --- | --- |
| Nghe sai ngày giờ/cơ sở/tiếng địa phương | Yêu cầu sai | Hiện bản nhận dạng, hỏi mơ hồ, đọc/hiện tóm tắt, cho sửa | Cài lỗi giờ, thử giọng/hoàn cảnh khác nhau có đồng ý | Người dùng vẫn có thể bỏ sót |
| Im lặng/đồng ý ở ngữ cảnh khác bị coi là xác nhận | Hành động ngoài ý muốn | Chỉ xác nhận rõ sau tóm tắt, sửa phải xác nhận lại; đồng ý micro không là đồng ý đặt lịch | Im lặng, đồng ý lượt trước, đổi giờ, dừng | Cần kiểm soát trạng thái ở ứng dụng, không chỉ prompt |
| Tool lỗi/hết slot/gửi lặp nhưng báo thành công | Nhầm trạng thái, trùng yêu cầu | Dựa kết quả công cụ, kiểm tra slot/chống lặp, phân biệt đã gửi/chờ xác nhận | Timeout, lỗi, xác nhận lặp | Chưa kiểm chứng với tích hợp thật |
| Bịa slot/cơ sở hoặc vượt quyền | Thông tin/hành động sai | Chỉ dùng danh mục công cụ trả về; giới hạn quyền, kiểm tra tham số phía ứng dụng; đầu vào không được thay quy tắc | Lệnh bỏ xác nhận, chỉ dẫn lạ trong dữ liệu tool, danh mục không có | Prompt không bảo đảm tuân thủ tuyệt đối |
| Thu âm/lưu giọng hoặc đọc lớn nơi công cộng | Lộ thông tin | Nêu rõ micro được giữ mở tối đa 60 giây giữa lượt để tái sử dụng; dùng dữ liệu giả và chế độ chữ; thu hồi quyền micro nếu muốn đóng ngay | Từ chối/rút quyền, chuyển tab, kiểm tra trạng thái micro và luồng gửi | Giữ thiết bị mở khác với đang gửi âm thanh; chỉ báo của trình duyệt có thể vẫn sáng |
| Voice khó dùng, trả lời dài, không có kênh khác | Loại trừ người dùng | Câu ngắn, nghe lại/dừng, chữ/bấm và nhờ giúp theo ý người dùng | Không micro/âm thanh, giọng địa phương, chữ lớn | Mẫu nhỏ chưa đại diện mọi nhu cầu tiếp cận |
| Tưởng agent là bác sĩ hoặc nhân viên thật | Tin quá mức, chờ lời khuyên | Giới thiệu AI và phạm vi buổi thử đặt lịch; công cụ sức khỏe ngoài phạm vi có thể nêu khả năng bệnh/ước tính sai, không phải chẩn đoán | Kiểm tra hiểu giới hạn; đánh giá sức khỏe riêng trước khi mở rộng sử dụng | Giới thiệu giới hạn có thể bị bỏ qua; người dùng vẫn có thể tiết lộ dữ liệu thật |

## Dừng và chuyển hỗ trợ

Sau hai lần chưa hiểu, đưa lựa chọn chữ/bấm hoặc nhờ nhân sự/người thân theo ý người dùng. Hai lần là quy tắc thử ban đầu, cần xem lại qua quan sát. Không tự gọi hoặc chia sẻ dữ liệu. Chưa có kết nối hỗ trợ thật phải nói rõ; không báo đã chuyển khi chưa thực hiện.

Nếu người dùng nói cần trợ giúp y tế khẩn cấp, dừng đặt lịch, hướng liên hệ cơ sở y tế/cấp cứu địa phương hoặc người ở gần; không để họ chờ agent giải đáp. Không chèn số/cơ sở chưa xác minh. Trước khi trình diễn liên hệ cụ thể, kiểm tra nguồn chính thức và ghi ngày/nguồn; phân biệt mở kênh liên hệ với đã kết nối. Đây là đường phục hồi thiết kế, chưa là dịch vụ cấp cứu tích hợp.

## Đồng ý và dữ liệu

### Đã triển khai trong bản hiện tại

- Gemini live: server cấp token tạm; trình duyệt gửi âm thanh PCM tới Google để chép lời tiếng Việt. Chữ đang nhận hiển thị ở giao diện; bản chép hoàn tất được dùng cho quy tắc cục bộ hoặc gửi tới Gemini chat qua `/api/help`. Không gửi lại cả bản thu cho model chat sau live. Tắt live trong cấu hình sẽ dùng nhánh gửi bản thu tới server rồi Gemini để chép lời.
- Chat gửi câu hỏi, mã màn hình và, với mode sức khỏe, tối đa 6 message lịch sử. Server che email/chuỗi số nhưng không bảo đảm khử định danh hoặc lọc hết sức khỏe/tên riêng. TTS gửi văn bản tới worker Kokoro cục bộ, không dùng Google để tạo giọng.
- Sau lượt nói, kết nối và thiết bị micro có thể được giữ mở tối đa 60 giây để giảm thời gian khởi động; lượt tiếp theo tái sử dụng và đặt lại thời gian chờ. Luồng live không gửi PCM giữa lượt khi bộ xử lý thu đã được gỡ. Chuyển tab sang nền hoặc rời trang sẽ đóng tài nguyên. Không mô tả là “không giữ micro mở”.
- Dừng nghe/hủy lượt không đồng nghĩa luôn thu hồi thiết bị đang được giữ để tái sử dụng. Muốn đóng ngay: thu hồi quyền micro của trang trong trình duyệt hoặc đóng/rời trang; chuyển tab sang nền cũng đóng tài nguyên theo mã hiện tại. “Dừng đọc” chỉ dừng giọng trả lời. Nút đóng micro ngay và chỉ báo giữ kết nối rõ hơn là đề xuất cần kiểm tra tiếp.
- Ứng dụng có kiểm tra đồng ý trước khi chuyển câu hỏi tới model chat. Quyền micro của trình duyệt hoặc đồng ý ghi âm phỏng vấn không thay thế thông báo và đồng ý gửi âm thanh lên Google. Chưa có căn cứ xác nhận giao diện đã thông báo đủ mọi mục dữ liệu/nhà cung cấp.

### Ghi nhận buổi thử và việc cần hoàn thiện

Người thực hiện xác nhận P1 và P3 đã thử trên điện thoại ngày 19/10/2026, đã xin đồng ý thử/gửi âm thanh lên AI. Chưa ghi hình thức, thời điểm và nội dung thông báo cụ thể; không suy rộng từ đồng ý phỏng vấn. Bản sau sửa cũng ngày 19/10, chưa thử lại; luồng kỹ thuật hiện tại không được tự gán cho buổi thử nếu thiếu build/commit.

Dùng mã P1–P3 và hồ sơ/lịch giả, không ghi tên, sức khỏe, tài khoản, OTP; không đưa âm thanh gốc lên repo. **Đề xuất quản lý dữ liệu, chưa phải cam kết đã thực hiện:** xóa ghi chép làm việc tối đa 30 ngày sau khi kết thúc đợt đánh giá; chỉ giữ tổng hợp ẩn danh cần thiết. Người tham gia liên hệ trực tiếp người điều phối, nêu mã P1/P3 để yêu cầu rút dữ liệu; người điều phối xóa ghi chép có thể truy vết và sửa các bản tài liệu đang quản lý trong 7 ngày. Cần thống nhất các mốc và kênh liên hệ trước buổi tiếp theo. Chưa có chức năng rút/xóa tự động, chưa xác minh thời hạn lưu phía Google; xóa bản cục bộ không đồng nghĩa xóa dữ liệu nhà cung cấp hay bản nộp đã chuyển cho người khác. Không hứa xóa những bản ngoài quyền kiểm soát.

## Điều kiện thử tiếp

Kiểm tra nghe sai, thiếu dữ liệu, ngoài phạm vi, từ chối micro, tool lỗi, gửi lặp. Dừng nếu tạo yêu cầu chưa xác nhận, lộ dữ liệu hoặc thành công giả; sửa rồi mới thử tiếp. Người dùng được sửa, hủy nháp và dùng kênh khác. Các biện pháp trên là yêu cầu cần đối chiếu, chưa khẳng định đã triển khai/kiểm chứng ở mục 05.

## Ưu tiên rủi ro từ P1/P2/P3

- **Khó tiếp cận ngay bước mở trợ lý/micro:** P1-E08/P2-E08 ghi nhận ít quen thiết bị và khó phân biệt nút. Quan sát cả bước bắt đầu; không coi việc người điều phối mở sẵn Mia là tự dùng thành công. Giữ kênh chữ/bấm và ghi số lần giúp.
- **Hứa quá mức về chờ khám:** P1-E02/P2-E02 là chờ theo lời kể, không phải baseline đặt lịch. Không thông báo voice giúp giảm hàng đợi hoặc bảo đảm giờ khám; phân biệt yêu cầu mô phỏng với lịch được bệnh viện xác nhận.
- **Gán mong muốn gọi điện thành đồng ý với AI:** E09 chỉ nói mong cách đặt lịch đơn giản. Cần xin đồng ý thử, giải thích AI và xử lý âm thanh; quyền ghi âm phỏng vấn không tự cho phép gửi âm thanh tới dịch vụ AI.
- **Thay đổi phần đang tốt:** P1-E10/P2-E10 xác nhận nhận/trả kết quả thuận tiện. Giữ nghiên cứu ở đăng ký/đặt lịch, không tự động hóa diễn giải kết quả y khoa.

- **Bỏ sót trường và nhầm trạng thái:** P3-E11–P3-E12 ghi nhận không hiểu vì sao chưa tiếp tục được. Làm rõ trường thiếu và trạng thái đã chọn; voiceover phải đồng bộ với thông tin hiện tại, không đọc dữ liệu cũ sau khi sửa. Quan sát hiểu trạng thái khi thử tính năng mới.
- **Chọn ngày không còn lịch:** P3-E08 ghi nhận ngày hết lịch vẫn hiển thị và mất thời gian tải trong AI có sẵn. Phân biệt ngày hết lịch, đang tải và lỗi; không đọc ngày đó như lựa chọn còn chỗ. Đây là yêu cầu thiết kế cần kiểm tra ở tính năng bổ sung.
- **Suy quá mức từ AI có sẵn sang voiceover:** P3 dùng chữ và biểu mẫu; khoảng 6 phút so với 11 phút không phải kết quả thử giọng đọc. Chưa công bố tiết kiệm thời gian hoặc phù hợp người 70–85 tuổi từ một trường hợp 50–60 tuổi.

Khi đóng gói hồ sơ, chỉ tổng hợp trải nghiệm dịch vụ; bỏ chi tiết sức khỏe không cần thiết khỏi bản nộp. Quan sát P3 trên MyVinmec ngày 17/10/2026 tách khỏi thử Mia của P1/P3 ngày 19/10/2026. Log T1/T2 phản ánh khó khăn hội thoại và giọng đọc; bản sau sửa ngày 19/10 chưa được thử lại, chưa có so sánh bật/tắt voiceover. Giới hạn truy vết build và metadata được ghi trong [log](../05-prototype/user-test-log.md). Không coi phản hồi này là xác nhận an toàn hoặc hiệu quả của bản hiện tại; các rủi ro vẫn cần kiểm tra riêng.
