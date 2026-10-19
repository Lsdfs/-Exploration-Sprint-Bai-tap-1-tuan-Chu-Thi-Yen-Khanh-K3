"""Download the CPU voice once. Runtime uses this cache in offline mode."""
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen, Request
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

def download(url, partial):
    # Large CDN responses stall on this connection; bounded range requests work.
    if url.endswith('.data'):
        with urlopen(Request(url + '?download=true', headers={'Range': 'bytes=0-0'}), timeout=40) as response:
            total = int(response.headers['Content-Range'].split('/')[-1])
        with partial.open('wb') as output:
            output.truncate(total)
        block = 4 * 1024 * 1024
        def piece(start):
            end = min(start + block, total) - 1
            for attempt in range(3):
                try:
                    request = Request(url + f'?download=true&part={start}', headers={'Range': f'bytes={start}-{end}'})
                    with urlopen(request, timeout=60) as response, partial.open('r+b') as output:
                        if response.status != 206 or not response.headers.get('Content-Range', '').startswith(f'bytes {start}-{end}/'):
                            raise ValueError('Unexpected download range')
                        output.seek(start)
                        remaining = end - start + 1
                        while remaining:
                            chunk = response.read(min(65536, remaining))
                            if not chunk:
                                raise ValueError('Incomplete download')
                            output.write(chunk)
                            remaining -= len(chunk)
                    return
                except Exception:
                    if attempt == 2:
                        raise
                    time.sleep(1)
        with ThreadPoolExecutor(max_workers=6) as pool:
            jobs = [pool.submit(piece, start) for start in range(0, total, block)]
            for count, job in enumerate(as_completed(jobs), 1):
                job.result()
                if count % 8 == 0 or count == len(jobs):
                    print(f'Download {partial.name}: {count}/{len(jobs)} parts', flush=True)
    else:
        with urlopen(url, timeout=120) as response, partial.open('wb') as output:
            while chunk := response.read(65536):
                output.write(chunk)

root = Path(__file__).resolve().parent / 'models' / 'vieneu'

files = {
    'pnnbao-ump/VieNeu-TTS-v3-Turbo': [
        'README.md', 'config.json',
        *['onnx_update/' + name for name in [
            'vieneu_prefill.onnx', 'vieneu_decode_step.onnx',
            'vieneu_acoustic_cached.onnx', 'vieneu_backbone_shared.data',
            'vieneu_v3_heads.npz', 'config.json', 'tokenizer.json',
        ]],
    ],
    'OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX': [
        'README.md', 'moss_audio_tokenizer_decode_full.onnx',
        'moss_audio_tokenizer_decode_shared.data',
        'moss_audio_tokenizer_decode_step.onnx', 'codec_browser_onnx_meta.json',
        'moss_audio_tokenizer_encode.onnx', 'moss_audio_tokenizer_encode.data',
    ],
}
manifest = []
for repo, names in files.items():
    with urlopen('https://huggingface.co/api/models/' + repo, timeout=30) as response:
        revision = json.load(response)['sha']
    cache = root / 'hub' / ('models--' + repo.replace('/', '--'))
    for name in names:
        target = cache / 'snapshots' / revision / name
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.is_file():
            partial = target.with_suffix(target.suffix + '.partial')
            download(f'https://huggingface.co/{repo}/resolve/{revision}/{name}', partial)
            partial.replace(target)
        with target.open('rb') as source:
            digest = hashlib.file_digest(source, 'sha256').hexdigest()
        manifest.append(dict(repo=repo, file=name, revision=revision,
                             bytes=target.stat().st_size, sha256=digest))
        print(json.dumps(manifest[-1]), flush=True)
    (cache / 'refs').mkdir(exist_ok=True)
    (cache / 'refs' / 'main').write_text(revision, encoding='utf-8')
root.mkdir(parents=True, exist_ok=True)
(root.parent.parent / 'vieneu-sources.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
