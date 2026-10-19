"""Generate short review samples with the network disabled at socket level."""
import json
from pathlib import Path
import socket
import time
import wave
import io

def no_network(*args, **kwargs):
    raise RuntimeError('Network must not be used for local speech')
socket.create_connection = no_network
socket.socket.connect = no_network

from vieneu_voice import LocalVoice, VOICE_NAME
root = Path(__file__).resolve().parent.parent / 'artifacts'
began = time.perf_counter()
voice = LocalVoice()
report = dict(voice=VOICE_NAME, engine='vieneu-v3-turbo', loadSeconds=round(time.perf_counter()-began, 2), samples=[])
for name, text in [('greeting', 'Xin chào cô chú. Mia có thể giúp cô chú đặt lịch khám và kiểm tra lại thông tin.'),
                   ('booking', 'Cô chú kiểm tra giúp Mia tên bác sĩ, cơ sở khám và ngày giờ trước khi xác nhận nhé.')]:
    start = time.perf_counter()
    audio = voice.synthesize(text)
    target = root / f'tts-thanh-binh-{name}.wav'
    target.write_bytes(audio)
    with wave.open(io.BytesIO(audio)) as wav:
        assert wav.getframerate() == 48000
        duration = wav.getnframes() / wav.getframerate()
        assert duration > 0 and wav.getnchannels() == 1
    report['samples'].append(dict(file=target.name, generationSeconds=round(time.perf_counter()-start,2), audioSeconds=round(duration,2)))
(root / 'vieneu-smoke.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(report, ensure_ascii=True, indent=2))
