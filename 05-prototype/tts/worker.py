"""Persistent offline VieNeu worker: one model load, JSON-lines over stdin/stdout."""
import base64
import json
import sys
import io
import wave
from vieneu_voice import LocalVoice

sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')
voice = LocalVoice()

def synthesize(text):
    return voice.synthesize(text)

# Warm inference before reporting ready. No model download or network calls here.
synthesize('Xin chào.')
print(json.dumps(dict(type='ready')), flush=True)
for line in sys.stdin:
    request = {}
    try:
        request = json.loads(line)
        text = request['text']
        if not isinstance(text, str) or not text.strip() or len(text) > 1200:
            raise ValueError('Invalid text')
        if request.get('stream'):
            output = io.BytesIO()
            with wave.open(output, 'wb') as joined:
                joined.setnchannels(1)
                joined.setsampwidth(2)
                joined.setframerate(48000)
                for chunk in voice.synthesize_stream(text):
                    print(json.dumps(dict(id=request['id'], chunk=base64.b64encode(chunk).decode('ascii'))), flush=True)
                    with wave.open(io.BytesIO(chunk), 'rb') as part:
                        joined.writeframes(part.readframes(part.getnframes()))
            wav = output.getvalue()
        else:
            wav = synthesize(text)
        print(json.dumps(dict(id=request['id'], wav=base64.b64encode(wav).decode('ascii'))), flush=True)
    except Exception:
        print(json.dumps(dict(id=request.get('id') if isinstance(request, dict) else None, error='Synthesis failed')), flush=True)
