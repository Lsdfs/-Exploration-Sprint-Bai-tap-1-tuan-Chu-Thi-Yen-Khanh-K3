"""Local-only VieNeu voice. Download assets with download_vieneu.py first."""
import contextlib
import io
import os
from pathlib import Path
import sys

os.environ['HF_HOME'] = str(Path(__file__).resolve().parent / 'models' / 'vieneu')
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'

VOICE_NAME = 'Thanh Bình'

class LocalVoice:
    def __init__(self):
        with contextlib.redirect_stdout(sys.stderr):
            from vieneu import Vieneu
            self.model = Vieneu(backend='onnx', device='cpu', precision='fp32', threads=4)

    def synthesize(self, text):
        with contextlib.redirect_stdout(sys.stderr):
            import soundfile as sf
            audio = self.model.infer(text, voice=VOICE_NAME, temperature=0.8)
            output = io.BytesIO()
            sf.write(output, audio, self.model.sample_rate, format='WAV', subtype='PCM_16')
            return output.getvalue()

    def synthesize_stream(self, text):
        import soundfile as sf
        chunks = self.model.infer_stream(text, voice=VOICE_NAME, temperature=0.8)
        while True:
            with contextlib.redirect_stdout(sys.stderr):
                try:
                    chunk = next(chunks)
                except StopIteration:
                    return
            if not len(chunk):
                continue
            output = io.BytesIO()
            sf.write(output, chunk, self.model.sample_rate, format='WAV', subtype='PCM_16')
            yield output.getvalue()
