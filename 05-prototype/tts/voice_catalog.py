"""Generate a review catalogue using only installed models. Never downloads."""
import contextlib
import html
import io
import json
from pathlib import Path
import socket
import sys
import time
import unicodedata
import wave

def offline(*args, **kwargs):
    raise RuntimeError('Downloads and network access are disabled for this catalogue')
socket.create_connection = offline
socket.socket.connect = offline

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parent / 'artifacts' / 'voice-samples'
OUT.mkdir(parents=True, exist_ok=True)
TEXT = 'Xin chào cô chú. Mia có thể giúp cô chú đặt lịch khám.'
rows = []

def slug(name):
    return ''.join(c if c.isalnum() else '-' for c in unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode()).strip('-').lower()

def record(engine, name, description, gender, generate):
    timings = []
    for _ in range(2):
        start = time.perf_counter()
        audio = generate()
        timings.append(round((time.perf_counter() - start) * 1000, 1))
    filename = f'{engine}-{slug(name)}.wav'
    (OUT / filename).write_bytes(audio)
    with wave.open(io.BytesIO(audio)) as wav:
        seconds = wav.getnframes() / wav.getframerate()
        assert wav.getnchannels() == 1 and seconds > 0
        rate = wav.getframerate()
    rows.append(dict(engine=engine, name=name, description=description, gender=gender,
                     file=filename, generationMs=timings, maxMs=max(timings),
                     under300=max(timings)<300, audioSeconds=round(seconds,2), sampleRate=rate))
    (OUT / 'results.json').write_text(json.dumps(dict(text=TEXT,voices=rows), ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'{len(rows):02d} {engine} {name}: {timings} ms', flush=True)

# Piper models are already present. Load once; no per-request model reload.
from piper import PiperVoice, SynthesisConfig
for path, engine in [(ROOT/'models'/'vivos'/'vi_VN-vivos-x_low.onnx','vivos'),
                     (ROOT/'models'/'vi_VN-vais1000-medium.onnx','vais1000')]:
    config = json.loads(Path(str(path)+'.json').read_text(encoding='utf-8'))
    voice = PiperVoice.load(str(path), use_cuda=False)
    speakers = config.get('speaker_id_map') or {'VAIS1000':0}
    def synth(speaker_id):
        output = io.BytesIO()
        with wave.open(output, 'wb') as wav:
            voice.synthesize_wav(TEXT, wav, syn_config=SynthesisConfig(speaker_id=speaker_id,length_scale=1.0))
        return output.getvalue()
    synth(0)  # warmup excluded from timings
    for name, speaker_id in sorted(speakers.items(),key=lambda pair:pair[1]):
        record(engine,name,f'Piper · speaker {speaker_id}', 'unknown',lambda:synth(speaker_id))
    del voice

# VieNeu has preset references bundled with its installed package.
from vieneu_voice import LocalVoice
local = LocalVoice()
local.synthesize('Xin chào.')
import soundfile as sf
def synth_vieneu(name):
    with contextlib.redirect_stdout(sys.stderr):
        audio=local.model.infer(TEXT,voice=name,temperature=0.8)
    output=io.BytesIO()
    sf.write(output,audio,local.model.sample_rate,format='WAV',subtype='PCM_16')
    return output.getvalue()
for name, info in local.model._preset_voices.items():
    record('vieneu',name,info.get('description',''),info.get('gender','unknown'),lambda:synth_vieneu(name))

cards = []
for row in sorted(rows,key=lambda r:(not r['under300'],r['maxMs'])):
    timings=' / '.join(str(ms) for ms in row['generationMs'])
    cards.append(f'''<article data-engine="{row['engine']}" data-gender="{row['gender']}" data-fast="{str(row['under300']).lower()}">
<h2>{html.escape(row['name'])}</h2><p>{html.escape(row['description'])} · {row['engine']}</p>
<p>Tạo toàn bộ WAV: <b>{timings} ms</b> · Audio {row['audioSeconds']} giây · {row['sampleRate']} Hz</p>
<audio controls preload="none" src="{row['file']}"></audio><p><a href="{row['file']}" download>Tải file mẫu</a></p></article>''')
page='''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Nghe thử các giọng đã cài</title>
<style>body{font:17px system-ui;max-width:1000px;margin:30px auto;padding:16px;background:#f4f7fa;color:#183348}article{background:white;border-radius:12px;padding:16px;margin:16px 0}audio{width:100%}select{font:inherit;margin:6px;padding:8px}h2{margin:0}label{display:inline-block}</style>
<h1>Giọng đang có trên máy</h1><p id="count"></p><p>Cùng câu mẫu: <strong>TEXT</strong></p>
<p>Đo hai lần sau khi nạp và làm nóng model, không dùng cache âm thanh. Đây là thời gian tạo xong cả WAV, không phải thời gian đến đoạn âm thanh đầu tiên. Thứ tự ưu tiên những giọng nhanh. Dưới 300 ms trong hai lần đo không bảo đảm mọi câu hoặc lúc máy bận đều đạt.</p>
<label>Model <select id="engine"><option value="">Tất cả</option><option>vivos</option><option>vais1000</option><option>vieneu</option></select></label>
<label>Giới tính theo preset <select id="gender"><option value="">Tất cả</option><option value="male">Nam</option><option value="female">Nữ</option><option value="unknown">Chưa có nhãn (Piper)</option></select></label>
<label><input id="fast" type="checkbox"> Chỉ giọng dưới 300 ms ở cả hai lần đo</label>
CARDS<script>function filter(){let n=0;document.querySelectorAll('article').forEach(a=>{a.hidden=(engine.value&&a.dataset.engine!==engine.value)||(gender.value&&a.dataset.gender!==gender.value)||(fast.checked&&a.dataset.fast!=='true');if(!a.hidden)n++;});document.querySelector('#count').textContent=n+' giọng';}document.querySelectorAll('select,input').forEach(e=>e.onchange=filter);document.addEventListener('play',e=>{document.querySelectorAll('audio').forEach(a=>{if(a!==e.target)a.pause();});},true);filter();</script></html>'''
(OUT/'index.html').write_text(page.replace('TEXT',html.escape(TEXT)).replace('CARDS','\n'.join(cards)),encoding='utf-8')
print(json.dumps(dict(total=len(rows),under300=sum(row['under300'] for row in rows),index=str(OUT/'index.html')),ensure_ascii=True),flush=True)
