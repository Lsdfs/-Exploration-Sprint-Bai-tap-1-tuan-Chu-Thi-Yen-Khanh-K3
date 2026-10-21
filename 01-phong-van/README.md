# Phỏng vấn và khám phá — Trải nghiệm một ngày đi khám

Mục 01 tìm hiểu **một ngày đi khám diễn ra thế nào, chờ ở đâu/mất bao lâu, ai cần nhập liệu/đánh máy và bị mắc ở bước nào**. Quan sát cả ngày giúp nhận diện điểm đau, sau đó mới hội tụ một khoảnh khắc để thiết kế. Định hướng sản phẩm hiện tại vẫn là agent voice hỗ trợ người cao tuổi; không ép mọi lời kể thành bằng chứng cần agent.

## Nguồn và tình trạng biên soạn

P1 và P2 được phỏng vấn ngày **18/10/2026**. Cả hai đồng ý tham gia và ghi âm để ghi chép, nhưng **không đồng ý tải lên hoặc công khai bản ghi giọng nói gốc**. Không đính kèm âm thanh hoặc đường dẫn đến nguồn giọng nói trong hồ sơ. Một số phần trao đổi chưa kịp ghi âm. Đã truy cập một file âm thanh dài khoảng 9 phút 1 giây (mã A01). Bản nhận dạng tự động chưa đủ tin cậy nên không được dùng làm nguồn trích dẫn. Các quote hiện có trong P1/P2 do người phỏng vấn trực tiếp nghe, chép lại và xác nhận người nói. Nội dung tóm tắt dựa trên thông tin người phỏng vấn xác nhận; các đoạn khác chưa xác minh vẫn để bổ sung. Chính P1 và P2 đều đã xác nhận miệng rằng quy trình nhận và trả kết quả thuận tiện; nhận xét của từng người được ghi tóm tắt tại P1-E10 và P2-E10. Người phỏng vấn xác nhận có hai người tham gia trong file: P1 là người nam, P2 là người nữ, đều trong nhóm tuổi 70–85, kể hai lượt/ngày khám riêng tại bệnh viện công. Không nêu tên cơ sở và chưa biết có cùng bệnh viện hay không. P3 thuộc nhóm 50–60 tuổi, được phỏng vấn và quan sát thao tác MyVinmec ngày 17/10/2026; khá quen điện thoại nhưng chưa quen app. P3 đồng ý tham gia và ghi âm; không diễn giải thành quyền công khai giọng gốc. Không đưa âm thanh hoặc bản chép có thông tin nhạy cảm vào repo.

- [Hướng dẫn phỏng vấn và cách ghi nguồn](interview-guide.md).
- [Câu hỏi về một ngày đi khám](cau-hoi-nguoi-cao-tuoi-dung-app.md): thời gian, nhập liệu và chỗ bị mắc. Giữ tên file để không hỏng liên kết hiện có.
- [P1](P1.md): người nam; [P2](P2.md): người nữ; [P3](P3.md): nhóm 50–60 tuổi; ngày khám và hai luồng đặt lịch trên MyVinmec.
- [Tổng hợp bằng chứng và khoảng trống](insights.md).
- [Ghi chép dùng MyVinmec](myvinmec-notes.md): nguồn tự quan sát riêng.

Ký hiệu `[Bạn bổ sung: …]` dành cho phần chưa có trong nguồn được đối chiếu; không có nghĩa câu đó chưa được hỏi. Số phút nhớ lại là ước lượng. Chỉ dùng quote có căn cứ; phần ngoài ghi âm ghi dạng tóm tắt và nguồn bổ sung.

**Đã có ba hồ sơ phỏng vấn P1/P2/P3.** P3 đã dùng AI có sẵn bằng chữ/biểu mẫu và luồng thường trên MyVinmec; đây không phải thử Mia. Prototype Mia có log định tính T1/T2 riêng, trong đó T1 ghi rõ dùng giọng đọc; chưa có kết quả thử lại sau sửa hoặc so sánh bật/tắt voiceover. Người thực hiện xác nhận người thử là P1 và P3, dùng điện thoại ngày 19/10/2026 và đã đồng ý thử/gửi âm thanh lên AI; bản sau sửa cùng ngày. Chưa xác nhận riêng ánh xạ T1/T2 với từng người; xem [trạng thái và giới hạn của log](../05-prototype/user-test-log.md). Bài tập yêu cầu ít nhất 3 phỏng vấn dịch vụ ẩn danh theo đề bài trong tài liệu đề bài Exploration Sprint (lưu cục bộ), mục 6.


## Thông tin người phỏng vấn đã bổ sung

Cả hai không dùng app do ít quen điện thoại thông minh/thiết bị điện tử, gõ chậm và khó phân biệt chức năng các nút. Ghi nhận này là thông tin người phỏng vấn cung cấp ngày 19/10/2026 không phải quote nguyên văn của từng người. Hai người không cùng lượt hoặc ngày khám; trải nghiệm bệnh viện công có thể tương đối giống nhau dù không cùng cơ sở. Hồ sơ chỉ ghi trải nghiệm dịch vụ, không lưu lý do sức khỏe của từng người.

## Quy trình và thời điểm khám đã bổ sung

Cả hai không đặt lịch trước và tự thực hiện các bước: đến lấy số → chờ khoảng 1–2 tiếng, có thể lâu hơn → gặp bác sĩ → làm xét nghiệm liên quan → nhận kết luận → ra về. Khoảng chờ là ước lượng do người phỏng vấn cung cấp, không phải tổng thời gian cả ngày. P1 kể lần khám năm 2025; P2 kể lần khám tháng 9/2026. P1/P2 hiện có ước lượng lấy số vài phút, khám/xét nghiệm khoảng 2 tiếng, nhận kết quả khoảng 5 phút và hoàn tất/ra về khoảng 2 tiếng. Hai khoảng 2 tiếng chưa rõ có chồng nhau hay không; chưa tính tổng thời gian ngày khám.

## Quan sát MyVinmec của P3

Ngày 17/10/2026: luồng AI có sẵn khoảng 6 phút, đặt lịch thành công; luồng thường 11 phút từ nút đặt lịch, gặp khó ở trường bắt buộc, trạng thái lựa chọn, danh sách và nhập chữ. P3 đánh giá AI dễ làm hơn. Không coi chênh lệch thời gian là hiệu quả voiceover; xem giới hạn mốc đo và điểm dừng trong [P3](P3.md). Quan sát này cũng không thay thế ghi chép tự dùng app của người làm bài.



## Trải nghiệm tự dùng của người làm bài

[Ghi chép tự dùng MyVinmec](myvinmec-notes.md) ghi nhận cả luồng AI có sẵn và luồng thường đều thuận lợi, không có điểm nghẽn. Kết quả này được giữ riêng với khó khăn quan sát ở P3; không gán thời gian 6/11 phút của P3 cho người làm bài và không coi là thử tính năng voiceover bổ sung.
