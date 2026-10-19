# Mia — TTS tiếng Việt cục bộ

## Giọng mới: Thanh Bình / VieNeu v3 Turbo

Giọng mặc định mới là **Thanh Bình**, preset nam miền Bắc, phong cách kể chuyện của VieNeu. Chạy ONNX trên CPU, WAV mono 48 kHz; không ép thấp cao độ bằng cách đổi sample rate. Tốc độ nói giữ theo preset. Cảm nhận trầm ấm/dễ nghe cần người dùng nghe và đánh giá.

Môi trường hiện tại dùng `vieneu==3.8.3`; phiên bản các thư viện trong `requirements-lock.txt`. Model và codec tải một lần vào `tts/models/vieneu/` bằng:

```powershell
.\.tts-venv\Scripts\python.exe -X utf8 tts/download_vieneu.py
.\.tts-venv\Scripts\python.exe -X utf8 tts/vieneu_smoke.py
npm.cmd start
```

Worker đặt `HF_HUB_OFFLINE=1`, nạp model một lần và làm nóng trước khi báo sẵn sàng. Script smoke chặn socket mạng, tạo hai câu mẫu tại `artifacts/tts-thanh-binh-*.wav` và báo thời gian tại `artifacts/vieneu-smoke.json`. `tts/vieneu-sources.json` ghi revision và SHA-256 của file tải. Cần khởi động lại server để worker và cache dùng giọng mới. Micro OpenAI và chat streaming tiếp tục là các luồng riêng.

Nguồn và giấy phép: [VieNeu v3 Turbo](https://huggingface.co/pnnbao-ump/VieNeu-TTS-v3-Turbo), [MOSS codec ONNX](https://huggingface.co/OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX), [SDK](https://docs.vieneu.io/vi/docs/sdk/standard-mode/). Model card VieNeu công bố Apache-2.0, bao gồm preset voices; giữ attribution và giấy phép khi phân phối.

## Ghi chép cấu hình Piper trước đây

Phần bên dưới mô tả cấu hình cũ; giọng mặc định mới được mô tả ở trên.

Giọng được tổng hợp bằng Piper trên CPU. Model mặc định mới là `models/vivos/vi_VN-vivos-x_low.onnx` (27.789.413 byte), thay cho VAIS1000. Không dùng `speechSynthesis`, không tải model khi bấm đọc, không gọi API TTS bên ngoài. Model được nạp và chạy làm nóng một lần khi `npm.cmd start` khởi động server. Máy này đã cài và tải xong.

Mỗi câu hoàn chỉnh từ stream được gửi đến `/api/tts` trên chính server localhost; trình duyệt phát WAV theo thứ tự và chuẩn bị câu sau trong khi đọc câu trước. **Dừng đọc** hủy các yêu cầu đang chờ và dừng âm thanh. Lỗi TTS được báo rõ, không chuyển về giọng hệ điều hành. Chức năng nhận micro và OpenAI chat là các luồng riêng; thay TTS không biến toàn bộ app thành offline.

## Chạy

Model Vivos dùng `length_scale=1.0` (đổi từ 1.25 theo phản hồi đọc quá chậm), giữ nguyên sample rate 16 kHz và cao độ gốc, không dùng bước ép thấp giọng của model cũ. Cùng nội dung sẽ đọc nhanh hơn khoảng 25%, thời lượng ngắn hơn khoảng 20%. Khởi động lại server để worker và cache dùng cấu hình mới. Model card ghi 65 người nói, chất lượng x_low; cần nghe thử để đánh giá chất lượng. Các mẫu Vivos cũ trong artifacts được tạo trước lần chỉnh tốc độ này.

Vivos có giấy phép dữ liệu **CC BY-NC-SA 4.0**, theo [model card](models/vivos/MODEL_CARD); cần xem điều kiện phi thương mại trước khi dùng ngoài prototype. Nguồn và checksum tại [manifest Vivos](models/vivos/sources.json). Cài lại model mới bằng `python tts/download_vivos.py`; `download_model.py` chỉ tải model VAIS1000 cũ.

```powershell
cd 05-prototype
npm.cmd start
```

Đợi dòng `Mia: local Vietnamese TTS ready.` trước khi thử giọng. Lần nạp đo được khoảng 5,3 giây trên máy hiện tại, diễn ra lúc khởi động; không nạp lại mỗi câu.

## Cài lại trên máy khác

Python 3.12, 64-bit được dùng trong lần kiểm tra này:

```powershell
python -m venv .tts-venv
.\.tts-venv\Scripts\python.exe -m pip install -r tts/requirements-lock.txt
# Chỉ cần nếu chưa có các file model:
python tts/download_model.py
```

Trên Linux/macOS, venv dùng `.tts-venv/bin/python`. Có thể đặt `TTS_PYTHON` thành đường dẫn Python riêng có các thư viện tương ứng. Các phiên bản phụ thuộc trong lock được chụp trên Windows/Python 3.12; khả năng có wheel trên hệ điều hành khác chưa được kiểm tra.

Model được lưu tại repo trên đĩa. Venv được bỏ qua Git bằng `.gitignore` cục bộ. `sources.json` ghi URL revision cố định và SHA-256 của model/config/model card. Server không phục vụ thư mục model, venv hoặc mã worker ra trình duyệt.

## Kiểm tra và nghe thử

```powershell
node scripts/local-tts-smoke.mjs
node scripts/local-tts-browser-smoke.mjs
npm.cmd run test:e2e -- local-voice mia-design
```

Mẫu thật: [câu chào](../artifacts/tts-greeting.wav), [đặt lịch](../artifacts/tts-booking.wav). [Kết quả đo](../artifacts/local-tts-smoke.json), [trình duyệt phát WAV thật](../artifacts/local-tts-browser.json). Chưa đánh giá nghe bằng tai trên loa của người dùng; model card không công bố nhãn giới tính. Đây là giọng Việt cố định của model, không phải HoaiMy.

Cache âm thanh chỉ ở RAM, tối đa 24 câu/12 MiB và mất khi đóng server; không ghi văn bản người dùng hay âm thanh vào đĩa trong vận hành. Chỉ script smoke mới ghi các câu mẫu giả vào artifacts. Worker xử lý tuần tự và giới hạn số yêu cầu chờ. Dừng trên trình duyệt bỏ âm thanh cũ; câu đã vào phép tính CPU có thể vẫn chạy hết rồi kết quả bị bỏ.

## Nguồn và giấy phép

- [Piper](https://github.com/OHF-Voice/piper1-gpl), engine GPL-3.0. [Python API](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/API_PYTHON.md).
- [rhasspy/piper-voices — vais1000](https://huggingface.co/rhasspy/piper-voices/tree/main/vi/vi_VN/vais1000/medium), được tải nguyên model, không huấn luyện lại. Revision và checksum trong [sources.json](models/sources.json).
- Theo [model card](models/MODEL_CARD), tập dữ liệu [VAIS-1000](https://ieee-dataport.org/documents/vais-1000-vietnamese-speech-synthesis-corpus) có giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); model fine-tune từ Lessac tiếng Anh. Giữ attribution/model card khi chia sẻ tài nguyên này. Giấy phép engine và dữ liệu là hai thành phần khác nhau.
