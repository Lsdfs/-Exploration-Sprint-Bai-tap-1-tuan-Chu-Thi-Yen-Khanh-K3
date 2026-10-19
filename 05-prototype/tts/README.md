# Giọng đọc cục bộ — Thanh Bình / VieNeu v3 Turbo

Mia dùng VieNeu v3 Turbo, preset Thanh Bình, chạy ONNX trên CPU. Worker nạp và làm nóng model một lần khi server khởi động; mỗi câu trả lời được chuyển thành WAV tại `/api/tts`. Model và môi trường Python được tải/cài riêng, không nằm trong repo nộp bài.

## Cài và chạy

Môi trường đã dùng: Windows, Python 3.12 64-bit, `vieneu==3.8.3`. Trong thư mục `05-prototype/`:

```powershell
python -m venv .tts-venv
.\.tts-venv\Scripts\python.exe -m pip install -r tts/requirements-lock.txt
.\.tts-venv\Scripts\python.exe -X utf8 tts/download_vieneu.py
npm.cmd start
```

Đợi dòng `Mia: local Vietnamese TTS ready.` rồi tải lại trang. Script tải cần mạng và ghi model vào `tts/models/vieneu/`. Runtime đặt `HF_HUB_OFFLINE=1`, không tải model trong lúc đọc. Trên Linux/macOS, đường dẫn Python là `.tts-venv/bin/python`; có thể đặt `TTS_PYTHON` thành đường dẫn môi trường riêng. Lock được tạo trên Windows/Python 3.12; chưa kiểm tra cài mới trên hệ điều hành khác.

`worker.py` dùng `vieneu_voice.py`; `download_vieneu.py` tải model/codec và ghi revision, SHA-256 vào [vieneu-sources.json](vieneu-sources.json). Giữ manifest để đối chiếu nguồn tải. Không đưa model hoặc venv lên Git.

Giọng đọc và cache chỉ ở bộ nhớ khi vận hành; dừng đọc hủy phát và bỏ kết quả đang chờ. Khi worker lỗi, ứng dụng báo lỗi và giữ câu trả lời chữ. TTS cục bộ là một luồng riêng: chat AI và nhận micro thật vẫn cần OpenAI/mạng khi được bật. Chất lượng giọng đọc với người dùng thật còn cần đánh giá.

## Nguồn và giấy phép

- [VieNeu v3 Turbo](https://huggingface.co/pnnbao-ump/VieNeu-TTS-v3-Turbo): model card công bố Apache-2.0, bao gồm preset voices.
- [MOSS codec ONNX](https://huggingface.co/OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX).
- [VieNeu SDK](https://docs.vieneu.io/vi/docs/sdk/standard-mode/).

Giữ attribution và giấy phép của model/SDK khi phân phối các tài nguyên tải về. Repo này chỉ chứa mã tích hợp, hướng dẫn và manifest nguồn.
