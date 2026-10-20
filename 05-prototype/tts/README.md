# Giọng đọc cục bộ — Kokoro tiếng Việt / Thành Đạt

Runtime hiện dùng `kokoro_voice.py` và `worker.py`, ONNX FP32, WAV mono 24 kHz. Model nạp một lần, tạo đủ câu rồi phát. VieNeu/Piper là cấu hình cũ, không cần cài.

## Cài trên Windows

Cần Python 3.12 64-bit, Git trong PATH, mạng tải thư viện/model và dung lượng cho PyTorch/model. Mở PowerShell trong `05-prototype/`:

```powershell
py -3.12 --version
git --version
powershell -NoProfile -ExecutionPolicy Bypass -File .\tts\setup-kokoro.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\tts\download-kokoro.ps1
npm.cmd start
```

Script setup tạo `.kokoro-venv`, cài PyTorch CPU và Kokoro ONNX. Không cần tạo `.tts-venv` trước. Nếu không có lệnh `py`, dùng Python 3.12 đã cài chạy `python -m venv .kokoro-venv` trước; script dùng lại venv có sẵn.

Script tải model về `tts/models/kokoro-vi/`; chạy lại để tiếp tục nếu gián đoạn. Runtime bắt buộc có `config.json`, `kokoro_vi.onnx`, `voicepacks/thanh_dat.pt` trong thư mục đó.

Đợi console báo `Mia: local Vietnamese TTS ready.` rồi tải lại trang. Kiểm tra từ cửa sổ PowerShell khác:

```powershell
Invoke-RestMethod http://127.0.0.1:4173/api/tts
```

Mong đợi `engine=kokoro-vi`, `voice=Thành Đạt`, `ready=true`. Nếu lỗi, chạy worker trực tiếp để thấy thư viện/file thiếu:

```powershell
.\.kokoro-venv\Scripts\python.exe -u tts\worker.py
```

Worker in `{"type": "ready"}` khi sẵn sàng; Ctrl+C để dừng bài kiểm tra. Server mặc định dùng Python trong `.kokoro-venv`; có thể đặt đường dẫn tuyệt đối qua `TTS_PYTHON` trong `.env`.

Runtime không tải mạng; âm thanh/cache ở bộ nhớ. Không đưa venv, model, voicepack, `.env` hoặc WAV riêng tư lên Git.

## Nguồn và giới hạn

- Mã Kokoro: https://github.com/iamdinhthuan/Kokoro-Vietnamese — revision được ghim trong script setup.
- Model: https://huggingface.co/contextboxai/Kokoro-Vietnamese — tải từ main, chưa ghim revision/checksum model; giữ model card và giấy phép khi phân phối model.
- Đã dùng trên Windows/Python 3.12; chưa kiểm chứng cài mới trên hệ điều hành khác. Dependency gián tiếp chưa khóa đầy đủ. Tốc độ và chất lượng cần thử trên thiết bị thật.
