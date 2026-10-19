"""Five low-pitched installed Vivos speakers; full-WAV benchmark, no downloads."""
import html
import io
import json
from pathlib import Path
import socket
import time
import wave

def offline(*args, **kwargs):
    raise RuntimeError('Network is disabled')
socket.create_connection = offline
socket.socket.connect = offline

from piper import PiperVoice, SynthesisConfig
root=Path(__file__).resolve().parent
model=root/'models'/'vivos'/'vi_VN-vivos-x_low.onnx'
config=json.loads(Path(str(model)+'.json').read_text(encoding='utf-8'))
out=root.parent/'artifacts'/'voice-shortlist'
out.mkdir(parents=True,exist_ok=True)
text='Xin chào cô chú. Mia có thể giúp cô chú đặt lịch khám.'
names=['VIVOSDEV12','VIVOSSPK24','VIVOSDEV11','VIVOSDEV09','VIVOSDEV10']
pitch=[109.6,131.1,133.3,136.8,137.9]
voice=PiperVoice.load(str(model),use_cuda=False)
def synth(speaker):
    output=io.BytesIO()
    with wave.open(output,'wb') as wav:
        voice.synthesize_wav(text,wav,syn_config=SynthesisConfig(speaker_id=speaker,length_scale=1.0))
    return output.getvalue()
synth(0)
rows=[]
for name,hz in zip(names,pitch):
    sid=config['speaker_id_map'][name]
    timings=[]
    for _ in range(5):
        start=time.perf_counter()
        audio=synth(sid)
        timings.append(round((time.perf_counter()-start)*1000,1))
    filename=name.lower()+'.wav'
    (out/filename).write_bytes(audio)
    with wave.open(io.BytesIO(audio)) as wav:
        assert wav.getframerate()==16000 and wav.getnframes()>0
    row=dict(name=name,speakerId=sid,file=filename,generationMs=timings,
             minMs=min(timings),maxMs=max(timings),estimatedPitchHz=hz,
             under300=max(timings)<300)
    rows.append(row)
    print(json.dumps(row),flush=True)
report=dict(text=text,engine='piper',model='vi_VN-vivos-x_low',
            methodology='Five uncached full-WAV generations per speaker after model warmup; excludes model load, chat and network. Pitch is a rough estimate from the earlier sample.',voices=rows)
(out/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
cards=''.join(f'''<article><h2>{r['name']}</h2><p>Tạo xong cả câu: <b>{r['minMs']}–{r['maxMs']} ms</b> (5 lượt, không cache). Cao độ ước tính ~{r['estimatedPitchHz']} Hz.</p><audio controls preload="none" src="{r['file']}"></audio><p><a href="{r['file']}" download>Tải mẫu WAV</a></p></article>''' for r in rows)
page=f'''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>5 giọng trầm, tạo nhanh</title><style>body{{font:17px system-ui;background:#f4f7fa;color:#183348;max-width:850px;margin:24px auto;padding:16px}}article{{padding:18px;margin:18px 0;background:white;border-radius:12px}}audio{{width:100%}}h2{{margin:0}}</style><h1>5 giọng để nghe thử</h1><p>Cùng câu: <b>{html.escape(text)}</b></p><p>Chọn từ model đã có trên máy, ưu tiên các mẫu cao độ thấp và tốc độ nhanh. Cao độ chỉ giúp sàng lọc; bạn nghe để chọn giọng dễ chịu. Thời gian đo sau khi nạp model, không bao gồm chat/mạng. Không bảo đảm mọi câu dài hay lúc máy bận đều dưới 300 ms.</p>{cards}<script>document.addEventListener('play',e=>document.querySelectorAll('audio').forEach(a=>{{if(a!==e.target)a.pause();}}),true);</script></html>'''
(out/'index.html').write_text(page,encoding='utf-8')
