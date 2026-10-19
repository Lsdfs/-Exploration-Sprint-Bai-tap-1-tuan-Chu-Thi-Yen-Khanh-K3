"""Five downloaded Kokoro voices: offline full-sentence synthesis benchmark."""
import importlib.util
import io
import json
import os
from pathlib import Path
import socket
import sys
import time
import wave

os.environ['HF_HUB_OFFLINE']='1'
os.environ['TRANSFORMERS_OFFLINE']='1'
os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
def offline(*args, **kwargs):
    raise RuntimeError('Network access is disabled; only local model files are allowed')
socket.create_connection=offline
socket.socket.connect=offline

required=['torch','vig2p','onnxruntime','kokoro_vietnamese']
missing=[name for name in required if importlib.util.find_spec(name) is None]
if missing:
    print('Missing runtime libraries: '+', '.join(missing))
    print('Install manually: .\\tts\\setup-kokoro.ps1')
    sys.exit(2)

import soundfile as sf
import torch
from kokoro_vietnamese.onnx_cli import KokoroVietnameseONNX

root=Path(__file__).resolve().parent
model=root/'models'/'kokoro-vi'
out=root.parent/'artifacts'/'kokoro-samples'
voices=['hung_thinh','manh_dung','phat_tai','thanh_dat','tuan_ngoc']
labels=json.loads((model/'voices.json').read_text(encoding='utf-8'))
for filename in ['kokoro_vi.onnx','config.json',*['voicepacks/'+name+'.pt' for name in voices]]:
    if not (model/filename).is_file():
        raise FileNotFoundError(f'Required local file: {model/filename}')
out.mkdir(parents=True,exist_ok=True)
started=time.perf_counter()
tts=KokoroVietnameseONNX(onnx_path=model/'kokoro_vi.onnx',
    voicepack_path=model/'voicepacks'/f'{voices[0]}.pt',config_path=model/'config.json',device='cpu')
load_ms=round((time.perf_counter()-started)*1000,1)
text='Cô chú muốn đặt lịch khám vào ngày nào?'
rows=[]
for name in voices:
    tts.voicepack=torch.load(model/'voicepacks'/f'{name}.pt',map_location='cpu',weights_only=True)
    tts.synthesize('Xin chào cô chú.')  # Exclude warmup and model loading, not inference.
    timings=[]
    for _ in range(3):
        started=time.perf_counter()
        audio,phonemes=tts.synthesize(text)
        buffer=io.BytesIO()
        sf.write(buffer,audio,24000,format='WAV',subtype='PCM_16')
        wav=buffer.getvalue()
        timings.append(round((time.perf_counter()-started)*1000,1))
    with wave.open(io.BytesIO(wav)) as check:
        assert check.getnframes()>0 and check.getframerate()==24000
        duration=check.getnframes()/check.getframerate()
    (out/f'{name}.wav').write_bytes(wav)
    row=dict(voice=name,label=labels[name]['label'],file=f'{name}.wav',generationMs=timings,
             maxMs=max(timings),under300=max(timings)<300,audioSeconds=round(duration,2),phonemes=phonemes)
    rows.append(row)
    print(json.dumps(row,ensure_ascii=True),flush=True)
report=dict(text=text,loadMs=load_ms,networkDisabled=True,voices=rows)
(out/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
cards=''.join(f'<article><h2>{r["label"]}</h2><p>Tạo cả WAV: {r["generationMs"]} ms · Audio {r["audioSeconds"]} giây</p><audio controls preload="none" src="{r["file"]}"></audio></article>' for r in rows)
page=f'''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Kokoro: 5 mẫu tiếng Việt</title><style>body{{font:17px system-ui;max-width:850px;margin:24px auto;padding:16px;background:#eef3f7}}article{{background:white;padding:18px;border-radius:12px;margin:18px 0}}audio{{width:100%}}</style><h1>Nghe thử 5 giọng Kokoro</h1><p>{text}</p><p>Ba lượt tạo cả WAV, không cache, sau khi nạp model và làm nóng. Không bao gồm chat hay mạng; cần nghe để đánh giá rõ lời.</p>{cards}<script>document.addEventListener('play',e=>document.querySelectorAll('audio').forEach(a=>{{if(a!==e.target)a.pause();}}),true);</script></html>'''
(out/'index.html').write_text(page,encoding='utf-8')
print('Open: '+str(out/'index.html'),flush=True)
