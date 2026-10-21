# Need statement — Tiếp cận đặt lịch cho người cao tuổi ít quen app

Bằng chứng khám phá được tổng hợp ngày 19/10/2026 từ P1, P2 và P3; trạng thái thử được rà lại ngày 21/10/2026. AI hỗ trợ tổng hợp. P3 đã sử dụng AI có sẵn và luồng thường trên MyVinmec ngày 17/10/2026, không phải thử Mia. Prototype Mia đã có ghi nhận định tính T1/T2, trong đó T1 ghi rõ dùng giọng đọc. P1 và P3 thử bằng điện thoại ngày 19/10/2026, đã đồng ý theo xác nhận của người thực hiện; bản sau sửa cùng ngày, chưa có mã build/commit; chưa có kết quả thử lại sau sửa hoặc so sánh bật/tắt voiceover. Xem [trạng thái bằng chứng](../05-prototype/user-test-log.md).

## Problem – Population – Outcome

- **Problem:** khó nhập chữ, tìm chức năng và nhận biết thông tin cần hoàn thành khi đặt lịch; P1/P2 ít quen thiết bị, còn P3 khá quen điện thoại nhưng vẫn mắc ở app chưa quen.
- **Population:** người trung niên và cao tuổi gặp khó khi thao tác đặt lịch trên app; mẫu gồm P1/P2 nhóm 70–85 tuổi và P3 nhóm 50–60 tuổi. Hướng thiết kế ưu tiên người cao tuổi, không khái quát từ ba trường hợp.
- **Outcome:** có thể gửi yêu cầu đặt lịch trước qua cách thao tác dễ tiếp cận, kiểm tra và sửa thông tin với mức hỗ trợ phù hợp.

> Cách để người trung niên và cao tuổi gặp khó khi nhập chữ, tìm lựa chọn và nhận biết thông tin bắt buộc có thể hoàn tất yêu cầu đặt lịch trước, kiểm tra và sửa thông tin với mức hỗ trợ phù hợp.

Nguồn: P1-E07–P1-E09, P2-E07–P2-E09 và P3-E06–P3-E15 trong [tổng hợp](../01-phong-van/insights.md). P3 bổ sung khó khăn với trường bắt buộc, trạng thái lựa chọn, danh sách và nhập chữ. Outcome là đích thiết kế; không mặc định người dùng muốn tự làm hoàn toàn. Need không chứa giải pháp.

## Problem Statement — 9 trường

| Trường | Nội dung |
| --- | --- |
| Actor | P1/P2 ít quen thiết bị; P3 khá quen điện thoại nhưng chưa quen MyVinmec. Ưu tiên thiết kế cho người cao tuổi, dùng P3 làm trường hợp đối chiếu |
| Workflow | Đến viện → lấy số → chờ → khám/xét nghiệm → nhận kết quả → về; xem journey |
| Bottleneck | P1/P2 kể rào cản thiết bị; P3 được quan sát bỏ sót trường bắt buộc, khó nhận biết trạng thái và tìm mục. Chờ khám là pain riêng |
| Impact | P3: AI có sẵn khoảng 6 phút, luồng thường 11 phút, một câu gõ hơn 1 phút. Mốc đo chưa tương đương nên không suy ra mức tiết kiệm. Chờ khám không phải baseline thao tác |
| Success Metric | Hoàn tất đúng yêu cầu giả, sửa được thông tin, hiểu trạng thái và số lần cần giúp; kế hoạch đo bên dưới |
| Boundary | Dữ liệu/lịch giả; không tư vấn y khoa, tự chọn chuyên khoa theo triệu chứng, đăng nhập hay đặt lịch thật |
| Điểm AI can thiệp | Hiểu yêu cầu nói/gõ, hỏi phần thiếu, hỗ trợ tìm lựa chọn, sửa và đọc lại |
| Mức giải pháp | Thử hội thoại có công cụ giới hạn so với form có hướng dẫn; chỉ giữ độ phức tạp tạo thêm giá trị |
| Rủi ro và HITL | Người dùng quyết định, sửa và xác nhận; lỗi phải báo rõ, có kênh chữ/bấm và nhờ hỗ trợ |

## Giả thuyết giải pháp và phương án so sánh

Tính năng voiceover bổ sung cho luồng AI có thể giúp người dùng nghe hướng dẫn thay vì chỉ đọc; nhập giọng nói là một khả năng riêng cần kiểm chứng về nhận dạng và sửa lỗi. P1-E08/P2-E08 và P3-E11–P3-E15 hỗ trợ nghiên cứu công đọc/nhập và hiểu bước tiếp theo. P3 đánh giá AI có sẵn dễ làm hơn, nhưng đã dùng chữ và biểu mẫu; đây chưa phải bằng chứng ưa thích hoặc hiệu quả voiceover.

Để đo giá trị tính năng thêm, so cùng luồng AI trên cùng dữ liệu giả: A tắt voiceover, B bật voiceover; giữ nguyên biểu mẫu và thông tin, đổi thứ tự giữa người thử nếu có thể. Nếu đánh giá nhập giọng nói, làm phép thử riêng, không đổi cả đầu vào và đầu ra rồi quy tác động cho voiceover. Form có hướng dẫn là phương án tham khảo về độ đơn giản. Người dùng quyết định; không giả định có API bệnh viện thật. Phép so sánh này là kế hoạch tiếp theo, chưa có kết quả; log T1/T2 đã có chỉ phản ánh thử định tính, không phải phép đo lợi ích riêng của voiceover.

## Baseline, mục tiêu và cách đo đề xuất

| Chỉ số | Baseline hiện có | Mục tiêu thử ban đầu | Cách đo |
| --- | --- | --- | --- |
| Hoàn tất đúng | P3 hoàn tất luồng AI MyVinmec; chưa có baseline voiceover | Hoàn tất đúng dữ liệu được giao, không tạo trước xác nhận | Đối chiếu yêu cầu cuối với thẻ tác vụ |
| Công thao tác | P3: khoảng 6 phút AI có sẵn, 11 phút luồng thường; không dùng làm baseline voiceover được kiểm soát | So bật/tắt voiceover theo từng người, tính cả sửa và trợ giúp | Cùng mốc bắt đầu/kết thúc; ghi số lần giúp/lỗi |
| Sửa lựa chọn | Chưa đo | Sửa được giờ trước gửi, không giữ nhầm giờ cũ | Giao một yêu cầu đổi giờ trong mỗi tác vụ |
| Hiểu trạng thái | Chưa đo | Người thử nói đúng đây là yêu cầu mô phỏng chờ xác nhận | Hỏi mở sau hoàn tất, không gợi đáp án |
| Khả năng tiếp cận | Chưa đo micro thật | Có thể tiếp tục bằng chữ/bấm khi từ chối micro | Quan sát chuyển kênh, ghi mức trợ giúp |

Các mục tiêu là tiêu chí đề xuất, không phải kết quả hoặc benchmark. Mẫu 2–3 người chỉ giúp sửa thiết kế, không đủ kết luận thống kê hay ROI. Go để thử tiếp khi an toàn và có tín hiệu giảm công thao tác; Not Yet khi thiếu dữ liệu hoặc cần giúp nhiều; bỏ hướng voice/agent nếu cách đơn giản phù hợp hơn. Không suy ra giảm thời gian chờ khám.

Liên kết: [journey](../02-journey-map/journey-map.md), [log thử](../05-prototype/user-test-log.md), [rủi ro](../06-rui-ro-dao-duc/risk-assessment.md). Nguồn phương pháp: docs tổng hợp mục 5–8 và đề bài mục 6.
