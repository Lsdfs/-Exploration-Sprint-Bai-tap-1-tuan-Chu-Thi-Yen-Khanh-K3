# Hai tình huống thử prototype và log T1/T2

Mục tiêu là xem người dùng có hiểu hướng dẫn được đọc, bổ sung thông tin, đổi ý và kiểm tra trước khi gửi hay không. Không cần ép hội thoại đi đúng kịch bản; phản hồi sai hoặc tính năng chưa hỗ trợ là điều cần ghi lại.

## Log T1 và T2

### Trạng thái bằng chứng dùng chung cho hồ sơ

Đã có ghi nhận thử định tính prototype Mia theo hai mã **T1/T2** ở bên dưới. T1 ghi rõ sử dụng giọng đọc; T2 ghi nhận tương tác hội thoại và nhu cầu dừng giọng đọc để xem màn hình. Nội dung giúp xác định khó khăn và sửa thiết kế, chưa chứng minh mức cải thiện do voiceover.

| Nội dung cần xác định | Trạng thái theo log hiện có |
| --- | --- |
| Ai thử | Hai người thật: P1 và P3, theo xác nhận của người thực hiện. T1/T2 là mã tình huống; chưa xác nhận riêng ánh xạ từng mã với từng người |
| Ngày và phiên bản | Thử ngày 19/10/2026; bản sau sửa cũng ngày 19/10/2026. Chưa có mã build/commit hoặc giờ để tách bản trước/sau sửa; không tự đồng nhất với bản hiện tại |
| Thiết bị và đồng ý | Điện thoại; chưa ghi hãng, hệ điều hành hoặc trình duyệt. Người thực hiện xác nhận đã xin đồng ý thử và gửi âm thanh lên AI; chưa ghi hình thức/thời điểm và nội dung thông báo cụ thể |
| Đã thử gì | T1: đặt lịch mẫu, sửa giờ, nghe/kiểm tra tóm tắt. T2: cung cấp thông tin theo hội thoại, làm rõ, dừng đọc/xem màn hình và kiểm tra trạng thái. Chi tiết phản hồi giữ ở từng log |
| Những gì đã sửa | Các sửa hiển thị, cách gợi ý/hỏi và giọng đọc thuộc bản sau sửa ngày 19/10/2026; chi tiết và giới hạn kiểm tra lại ở bảng bên dưới |
| Chưa có kết quả | Thử lại sau sửa; phép so sánh cùng tác vụ bật/tắt voiceover; đo thời gian, số lần trợ giúp và hiệu quả nhận giọng nói thật trên bản hiện tại |

Metadata trên được người thực hiện bổ sung khi rà hồ sơ ngày 21/10/2026, không phải ngày diễn ra buổi thử. P1 và P3 đã thử Mia ngày 19/10; quan sát P3 trên MyVinmec ngày 17/10 là buổi khác. Không lấy đồng ý ghi âm phỏng vấn thay cho đồng ý gửi âm thanh lên AI. Người thực hiện xác nhận chưa thử lại sau sửa.

### Truy vết sửa đổi

| Vấn đề | Sửa đã ghi nhận | Phiên bản/ngày | Kiểm tra lại và kết quả |
| --- | --- | --- | --- |
| T1 khó thấy thông tin đã chốt | Hiển thị rõ thông tin đã xác nhận | Bản sau sửa 19/10/2026; chưa có commit | Chưa thử lại với người dùng; chưa có kết quả sau sửa |
| T1 không biết trả lời, hội thoại máy móc | Bổ sung gợi ý khi người dùng không biết trả lời | Bản sau sửa 19/10/2026; chưa có commit | Chưa thử lại với người dùng |
| T1 giọng khó nghe | Đổi giọng đọc; chưa xác định voicepack của bản 19/10 | Bản sau sửa 19/10/2026; chưa có commit | Chưa thử lại; không kết luận giọng mới dễ dùng hơn |
| T2 hỏi lặp, trả lời cứng nhắc | Chỉnh prompt gợi ý và phản hồi theo ngữ cảnh | Bản sau sửa 19/10/2026; chưa có commit | Chưa thử lại với người dùng |
| T2 màn hình lệch thứ tự hỏi, vẫn yêu cầu bác sĩ, ngày chưa rõ | Chưa có mô tả sửa riêng đủ chi tiết trong log | Chưa xác định thay đổi riêng | Cần kiểm tra tiếp; không coi chỉnh prompt là đã giải quyết tất cả |

### T1

- Tác vụ: hồ sơ mẫu Bác An; Times City; Nội tổng quát; ngày đầu tiên trong danh sách; đổi 08:00 thành 09:00 trước khi xác nhận. Không chọn bác sĩ cụ thể.
- Điều kiện: sử dụng giọng đọc

| Bước | Hành vi trong tình huống T1 | Khó khăn / phản ứng |
| --- | --- | --- |
| Bắt đầu | Tôi muốn đặt lịch khám vào thứ tư | Thấy chờ trả lời hơi lâu |
| Cung cấp thông tin | "Tôi bị đau đầu, nên khám khoa nào", AI trả lời không thể chọn khoa từ triệu chứng | Không hài lòng |
| Theo dõi hướng dẫn | Tôi yêu cầu “Từ từ nhé, nói từng bước thôi.” rồi nhìn lựa chọn trên màn hình | Tôi có thể bỏ sót nếu lời đọc dài; yêu cầu này cần kiểm tra trực tiếp, chưa xác nhận hệ thống hiểu hoặc đổi tốc độ |
| Chọn lịch | Chọn ngày đầu trong danh sách và 08:00 | Ổn |
| Đổi ý | Tôi gõ “À khoan, tám giờ tôi chưa đi được. Đổi sang chín giờ, còn những cái khác giữ nguyên.”, AI xác nhận lại và đổi | Ổn |
| Kiểm tra | Tôi yêu cầu “Đọc lại giúp tôi một lần, tôi kiểm tra đã.” và xem giờ trên bản tóm tắt | Ổn |

**Kết quả:** Không hài lòng do AI trả lời quá máy móc và giọng khó nghe

**Nhận xét T1:** Hơi khó dùng, khó kiểm tra lại vì nói chuyện nhưng không hiện thông tin lên màn hình là đã chốt cái gì

**Đã xử lý thực tế:** Hiện rõ thông tin đã xác nhận, sửa cho AI biết gợi ý khi người dùng trả lời không biết. Đổi sang giọng khác dễ nghe hơn.

### T2

- Tác vụ: hồ sơ mẫu Bác Bình; Central Park; Nội tổng quát theo thẻ tác vụ; ngày thứ hai trong danh sách; 14:00. Không chọn bác sĩ cụ thể.
- Điều kiện: sử dụng câu chữ tự nhiên, có lúc muốn dừng giọng đọc để xem màn hình.

| Bước | Hành vi trong tình huống T2 | Khó khăn / phản ứng  |
| --- | --- | --- |
| Nói bối cảnh | "Tôi cần đặt lịch khám tại bệnh viện central park ngày mai lúc 10 giờ" | Ổn |
| Nói lệch tác vụ | Hỏi “Ví dụ người nhà thấy mệt mấy hôm thì bắt đầu ở đâu?” | Ổn |
| Làm rõ | Nói “Ý tôi là cách đặt lịch ấy?” AI lặp lại yêu cầu hỏi đặt lịch cho bản thân hay người thân | Không hài lòng |
| Cung cấp từng phần | Bổ sung “Cho người nhà, Bác Bình… Central Park. Nội tổng quát theo bài thử, không chọn bác sĩ cụ thể.” | Vẫn yêu cầu chọn bác sĩ |
| Tạm dừng | Tôi nói “Khoan đọc tiếp, để tôi xem màn hình đã.” Màn hình hiện ra không khớp với thứ tự hỏi | Không hài lòng |
| Chọn ngày giờ | Tôi gõ “Ngày thứ hai trong danh sách, hai giờ chiều.” AI yêu cầu xác định lại đúng ngày | Không hài lòng |
| Kiểm tra trạng thái | Tôi hỏi “Tôi bấm thế này là bệnh viện nhận lịch luôn chưa?” rồi xem lại hồ sơ Bác Bình và giờ | Xác nhận ổn |

**Kết quả:** T2 quay về tác vụ đặt lịch và kiểm tra được các thông tin cần thiết trước khi quyết định gửi hoặc dừng.

**Nhận xét T2:** Dùng cũng được

**Đã xử lý thực tế:** thay đổi prompt biết gợi ý và trả lời theo ngữ cảnh, không bị quá cứng nhắc như ban đầu
