"""One-time model download. Runtime never downloads a model."""
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

root = Path(__file__).resolve().parent / 'models'
root.mkdir(exist_ok=True)
revision = '3d796cc2f2c884b3517c527507e084f7bb245aea'
base = f'https://huggingface.co/rhasspy/piper-voices/resolve/{revision}/vi/vi_VN/vais1000/medium/'
files = ['vi_VN-vais1000-medium.onnx', 'vi_VN-vais1000-medium.onnx.json', 'MODEL_CARD']
manifest = []
for name in files:
    target = root / name
    if not target.exists():
        partial = root / (name + '.partial')
        with urlopen(base + name, timeout=120) as response, partial.open('wb') as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
        partial.replace(target)
    data = target.read_bytes()
    manifest.append(dict(file=name, bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), source=base + name))
(root / 'sources.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps(manifest, indent=2))
