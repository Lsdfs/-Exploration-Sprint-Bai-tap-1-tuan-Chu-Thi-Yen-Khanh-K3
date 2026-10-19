# Rủi ro và đạo đức — Agent voice cho người cao tuổi

**Đánh giá thiết kế dự kiến, chưa phải chứng nhận/kết quả kiểm thử.** AI hỗ trợ theo [docs tổng hợp](../docs/tong-hop-kien-thuc-can-nho.md), mục 7, 9–10, 13.4. Phạm vi đặt lịch mô phỏng, không tư vấn y khoa hoặc dùng hồ sơ thật.

| Rủi ro / tình huống | Tác động | Giảm thiểu đề xuất | Cách kiểm tra | Rủi ro còn lại |
| --- | --- | --- | --- | --- |
| Nghe sai ngày giờ/cơ sở/tiếng địa phương | Yêu cầu sai | Hiện bản nhận dạng, hỏi mơ hồ, đọc/hiện tóm tắt, cho sửa | Cài lỗi giờ, thử giọng/hoàn cảnh khác nhau có đồng ý | Người dùng vẫn có thể bỏ sót |
| Im lặng/đồng ý ở ngữ cảnh khác bị coi là xác nhận | Hành động ngoài ý muốn | Chỉ xác nhận rõ sau tóm tắt, sửa phải xác nhận lại; đồng ý micro không là đồng ý đặt lịch | Im lặng, đồng ý lượt trước, đổi giờ, dừng | Cần kiểm soát trạng thái ở ứng dụng, không chỉ prompt |
| Tool lỗi/hết slot/gửi lặp nhưng báo thành công | Nhầm trạng thái, trùng yêu cầu | Dựa kết quả công cụ, kiểm tra slot/chống lặp, phân biệt đã gửi/chờ xác nhận | Timeout, lỗi, xác nhận lặp | Chưa kiểm chứng với tích hợp thật |
| Bịa slot/cơ sở hoặc vượt quyền | Thông tin/hành động sai | Chỉ dùng danh mục công cụ trả về; giới hạn quyền, kiểm tra tham số phía ứng dụng; đầu vào không được thay quy tắc | Lệnh bỏ xác nhận, chỉ dẫn lạ trong dữ liệu tool, danh mục không có | Prompt không bảo đảm tuân thủ tuyệt đối |
| Thu âm/lưu giọng hoặc đọc lớn nơi công cộng | Lộ thông tin | Chủ động bật micro, hiện đang nghe, dừng được, không nghe nền; dữ liệu giả và chế độ chữ | Từ chối/rút quyền, dừng, kiểm tra log/luồng gửi | Nhà cung cấp có thể xử lý âm thanh; cần xác minh cấu hình |
| Voice khó dùng, trả lời dài, không có kênh khác | Loại trừ người dùng | Câu ngắn, nghe lại/dừng, chữ/bấm và nhờ giúp theo ý người dùng | Không micro/âm thanh, giọng địa phương, chữ lớn | Mẫu nhỏ chưa đại diện mọi nhu cầu tiếp cận |
| Tưởng agent là bác sĩ hoặc nhân viên thật | Tin quá mức, chờ lời khuyên | Giới thiệu là AI cho thao tác dịch vụ, không diễn giải triệu chứng/kết quả/thuốc | Hỏi y khoa, hỏi có phải bác sĩ; kiểm tra hiểu giới hạn | Giới thiệu giới hạn có thể bị bỏ qua |

## Dừng và chuyển hỗ trợ

Sau hai lần chưa hiểu, đưa lựa chọn chữ/bấm hoặc nhờ nhân sự/người thân theo ý người dùng. Hai lần là quy tắc thử ban đầu, cần xem lại qua quan sát. Không tự gọi hoặc chia sẻ dữ liệu. Chưa có kết nối hỗ trợ thật phải nói rõ; không báo đã chuyển khi chưa thực hiện.

Nếu người dùng nói cần trợ giúp y tế khẩn cấp, dừng đặt lịch, hướng liên hệ cơ sở y tế/cấp cứu địa phương hoặc người ở gần; không để họ chờ agent giải đáp. Không chèn số/cơ sở chưa xác minh. Trước khi trình diễn liên hệ cụ thể, kiểm tra nguồn chính thức và ghi ngày/nguồn; phân biệt mở kênh liên hệ với đã kết nối. Đây là đường phục hồi thiết kế, chưa là dịch vụ cấp cứu tích hợp.

## Đồng ý và dữ liệu

Xin đồng ý trước hỏi; ghi âm và xử lý voice cần đồng ý riêng, nêu rõ xử lý tại thiết bị/dịch vụ nào trước thử. Chưa xác minh nơi xử lý/lưu thì dùng bản chép lời giả hoặc chữ, không thu voice thật; không gọi mô phỏng là kiểm chứng STT.

Dùng mã P1–P3 và hồ sơ/lịch giả, không ghi tên, sức khỏe, tài khoản, OTP. Đề xuất không lưu âm thanh, chỉ giữ ghi chép ẩn danh tối thiểu, giới hạn quyền cho người thực hiện; không đưa âm thanh lên repo. Thống nhất thời hạn lưu/xóa và cách rút dữ liệu trước buổi hỏi; cần điền các thông tin đó trước tuyển người, chưa có cam kết đã triển khai. Rà log, nhà cung cấp STT/LLM/TTS và quyền micro theo cấu hình thực tế.

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

Khi đóng gói hồ sơ, chỉ tổng hợp trải nghiệm dịch vụ; bỏ chi tiết sức khỏe không cần thiết khỏi bản nộp. P3 đã được đưa vào đánh giá từ quan sát MyVinmec ngày 17/10/2026. Các vướng mắc app được phân biệt với rủi ro thiết kế dự kiến; chưa có sự cố hoặc kết quả thử người dùng của tính năng voiceover bổ sung.
