"""Persistent Thành Đạt voice. Local files only; preserve original FP32 quality."""
import io
import json
import os
from pathlib import Path
import socket

os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'

def offline(*args, **kwargs):
    raise RuntimeError('Local voice does not allow network access')

socket.create_connection = offline
socket.socket.connect = offline

import onnxruntime as ort
import soundfile as sf
import torch
from kokoro_vietnamese.onnx_cli import KokoroVietnameseONNX

class LocalVoice:
    sample_rate = 24000

    def __init__(self):
        model = Path(__file__).resolve().parent / 'models' / 'kokoro-vi'
        self.tts = KokoroVietnameseONNX.__new__(KokoroVietnameseONNX)
        self.tts.config = json.loads((model / 'config.json').read_text(encoding='utf-8'))
        self.tts.context_length = self.tts.config['plbert']['max_position_embeddings']
        self.tts.voicepack = torch.load(model / 'voicepacks' / 'thanh_dat.pt', map_location='cpu', weights_only=True)
        options = ort.SessionOptions()
        options.intra_op_num_threads = 8
        options.inter_op_num_threads = 1
        self.tts.session = ort.InferenceSession(str(model / 'kokoro_vi.onnx'), sess_options=options, providers=['CPUExecutionProvider'])

    def synthesize(self, text):
        audio, _ = self.tts.synthesize(text)
        output = io.BytesIO()
        sf.write(output, audio, self.sample_rate, format='WAV', subtype='PCM_16')
        return output.getvalue()

    def synthesize_stream(self, text):
        # Kokoro produces the whole sentence. Do not claim incremental inference.
        yield self.synthesize(text)
