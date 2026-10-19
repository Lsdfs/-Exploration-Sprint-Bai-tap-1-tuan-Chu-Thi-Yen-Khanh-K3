# Ba best practice quốc tế — Agent voice cho người cao tuổi

AI hỗ trợ đọc nguồn và biên soạn, đối chiếu ngày **19/10/2026**. Đây là thực hành tham khảo, chưa chứng minh hiệu quả tương tự với người cao tuổi Việt Nam hoặc Mia. Cơ sở phương pháp: tài liệu học AI Thực Chiến (bản ghi chú cá nhân lưu cục bộ), D2 về PAIR/quyền kiểm soát, P18 về thử nhiều cơ chế; bổ sung nguồn chính thức theo đề bài mục 6.3.

| Nguồn quốc tế | Thực hành được nguồn mô tả | Bài học đề xuất cho Mia | Giới hạn / kiểm chứng |
| --- | --- | --- | --- |
| **NHS England — NHS App accessibility statement**. [Nguồn chính thức](https://www.nhs.uk/nhs-app/about/privacy-legal-information/nhs-app-accessibility-statement/) | Nêu khả năng dùng screen reader, speech recognition, phóng to và công khai hạn chế tiếp cận | Giữ bấm/gõ bên cạnh voice, chữ dễ đọc, nhãn nút rõ; kiểm tra thiết bị thật | Không chứng minh NHS App có agent voice hoặc phù hợp mọi người cao tuổi. Thử tắt micro, tăng chữ và trình đọc màn hình |
| **Google Design — Conversation Design: Speaking the Same Language**. [Nguồn chính thức](https://design.google/library/speaking-the-same-language-vui) | Thiết kế theo cách con người hội thoại; câu hỏi lại ngắn giúp tiếp tục khi nhận sai | Hỏi từng phần thiếu, giữ thông tin đã rõ, cho sửa. Ví dụ: “Bác muốn 8 giờ hay 9 giờ ạ?” | Nguyên tắc VUI chung, không bảo đảm nhận dạng tiếng Việt. Thử giọng địa phương, lỗi giờ và đo công sửa |
| **Microsoft Research — Guidelines for Human-AI Interaction**. [Nguồn chính thức](https://www.microsoft.com/en-us/research/project/guidelines-for-human-ai-interaction/) | Làm rõ khả năng/giới hạn, hỗ trợ sửa và tương tác khi AI sai; bộ hướng dẫn được phát triển qua nghiên cứu HCI | Nói rõ chỉ hỗ trợ dịch vụ đặt lịch; cho sửa/dừng, kiểm tra trước xác nhận, hiện trạng thái từ công cụ | Không phải chứng nhận an toàn sản phẩm. Quan sát người thử có hiểu giới hạn và phát hiện lỗi không |

## Cách chuyển thành phép thử

- **Tiếp cận:** cùng tác vụ giả hoàn tất bằng chữ/bấm khi voice không dùng được; không ép nói nơi đông người.
- **Hội thoại:** cài một lỗi giờ giả định, quan sát phát hiện/sửa và tiếp tục; đo lượt hỏi lại và tổng thời gian.
- **Kiểm soát:** sau tóm tắt thử đổi giờ, dừng và im lặng; chưa được tạo yêu cầu. Tool lỗi thì không báo đã đặt thành công.

Đây là đề xuất cho [kế hoạch đánh giá](../03-need-statement/need-statement.md), chưa phải chức năng đã kiểm chứng. Không dùng uy tín nguồn để tuyên bố giảm thời gian hoặc giảm tải.

## Liên hệ với P1/P2/P3

| Bằng chứng địa phương | Thực hành tham khảo phía trên | Quyết định thiết kế cần thử |
| --- | --- | --- |
| P1-E08, P2-E08: gõ chậm, khó phân biệt nút | NHS: nhiều cách tiếp cận và công khai giới hạn | Giữ chữ/bấm, nhãn rõ, chữ lớn; voice là lựa chọn |
| P1-E09, P2-E09: mong đơn giản như gọi điện | Google: hội thoại ngắn, hỏi lại để tiếp tục | Hỏi từng phần thiếu, cho đổi ý; thử tiếng Việt thật trước kết luận |
| Rào cản thiết bị ở E08; chưa có bằng chứng hiểu trạng thái | Microsoft: làm rõ giới hạn, hỗ trợ sửa khi AI sai | Đọc/hiện tóm tắt và cho sửa; đo hiểu trạng thái như giả thuyết mới |
| P3-E06, P3-E11–P3-E12: cần chỉ nút AI, bỏ sót trường và khó phân biệt trạng thái | NHS và Microsoft: khả năng tiếp cận, làm rõ điều kiện và hỗ trợ sửa | Nhãn rõ, chỉ trường còn thiếu và lý do chưa thể tiếp tục; voiceover cần được thử riêng |
| P3-E07–P3-E09, P3-E13–P3-E15: biểu mẫu AI dễ làm hơn; luồng thường khó tìm mục và nhập chữ | Google: hỏi từng phần, giảm gánh nặng tương tác | Giữ thông tin đã rõ, giảm danh sách dài; so cùng luồng AI bật/tắt voiceover để đo phần thêm |

Đã đối chiếu lại ba đường dẫn chính thức ngày 19/10/2026. Đây là nguyên tắc thiết kế tham khảo; chưa có dữ liệu chứng minh tác động với P1/P2. Nhận/trả kết quả đang thuận tiện (P1-E10, P2-E10), nên chưa chọn thay đổi phần này.

P3 đã dùng AI có sẵn trên MyVinmec, chưa thử tính năng voiceover bổ sung. Nhận xét AI dễ dùng hơn không xác thực hiệu quả giọng đọc hoặc nhập giọng nói; biểu mẫu ít trường hơn cũng có thể góp phần. Các cập nhật P3 là đối chiếu bằng chứng địa phương, không thay đổi nội dung nguồn quốc tế.
