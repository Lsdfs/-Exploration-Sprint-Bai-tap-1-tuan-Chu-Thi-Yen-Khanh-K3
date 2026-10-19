"""Benchmark installed Thanh Dat voice with bounded CPU threading. No downloads."""
import io
import json
import os
from pathlib import Path
import socket
import time

os.environ['HF_HUB_OFFLINE']='1'
os.environ['TRANSFORMERS_OFFLINE']='1'
def offline(*args,**kwargs):
    raise RuntimeError('Network disabled for this benchmark')
socket.socket.connect=offline
socket.create_connection=offline

import onnxruntime as ort
import soundfile as sf
from kokoro_vietnamese.onnx_cli import KokoroVietnameseONNX

root=Path(__file__).resolve().parent
model=root/'models'/'kokoro-vi'
out=root.parent/'artifacts'/'kokoro-tuning'
out.mkdir(parents=True,exist_ok=True)
tts=KokoroVietnameseONNX(onnx_path=model/'kokoro_vi.onnx',voicepack_path=model/'voicepacks'/'thanh_dat.pt',config_path=model/'config.json',device='cpu')
texts=['Cô chú muốn đặt lịch khám vào ngày nào?',
       'Cô chú kiểm tra ngày và giờ khám trước khi xác nhận nhé.']
report={'voice':'Thành Đạt','networkDisabled':True,'audioCache':False,'results':[]}
best=None
for threads in [1,2,4,8]:
    del tts.session
    options=ort.SessionOptions()
    options.intra_op_num_threads=threads
    options.inter_op_num_threads=1
    options.execution_mode=ort.ExecutionMode.ORT_SEQUENTIAL
    options.add_session_config_entry('session.intra_op.allow_spinning','0')
    tts.session=ort.InferenceSession(str(model/'kokoro_vi.onnx'),sess_options=options,providers=['CPUExecutionProvider'])
    tts.synthesize('Xin chào cô chú.')
    result={'threads':threads,'sentences':[]}
    audio_files=[]
    for index,text in enumerate(texts):
        timings=[]
        for _ in range(3):
            started=time.perf_counter()
            audio,phonemes=tts.synthesize(text)
            buffer=io.BytesIO()
            sf.write(buffer,audio,24000,format='WAV',subtype='PCM_16')
            wav=buffer.getvalue()
            timings.append(round((time.perf_counter()-started)*1000,1))
        filename=f'thanh-dat-threads-{threads}-sentence-{index+1}.wav'
        (out/filename).write_bytes(wav)
        result['sentences'].append({'text':text,'ms':timings,'file':filename})
    result['worstMs']=max(ms for sentence in result['sentences'] for ms in sentence['ms'])
    result['allUnder300']=result['worstMs']<300
    report['results'].append(result)
    print(json.dumps(result,ensure_ascii=True),flush=True)
    if best is None or result['worstMs']<best['worstMs']:best=result
    report['best']=best
    (out/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('Best:',json.dumps(best,ensure_ascii=True),flush=True)
