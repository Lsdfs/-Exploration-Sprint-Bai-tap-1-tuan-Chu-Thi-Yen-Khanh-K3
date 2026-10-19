"""Read-only progress monitor for range downloads. Ctrl+C to exit."""
from pathlib import Path
import sys
import time

root = Path(__file__).resolve().parent
block = 4 * 1024 * 1024
previous = {}

def received(path):
    size = path.stat().st_size
    if path.name.endswith('.data.partial'):
        # Range downloader preallocates the whole file. A nonzero block tail
        # indicates that range has been written; estimates have 4 MiB resolution.
        done = 0
        with path.open('rb') as source:
            for start in range(0, size, block):
                end = min(start + block, size)
                source.seek(max(start, end - 65536))
                if any(source.read(min(65536, end - start))):
                    done += end - start
        return done, size
    return size, None

try:
    while True:
        now = time.monotonic()
        paths = list((root / 'models' / 'vieneu').rglob('*.partial'))
        if not paths:
            message = 'Download complete (manifest saved).' if (root / 'vieneu-sources.json').exists() else 'Waiting for next file / checking downloaded files...'
            print(time.strftime('%H:%M:%S'), message, flush=True)
        for path in paths:
            try:
                done, total = received(path)
            except (FileNotFoundError, PermissionError):
                continue
            history = previous.setdefault(str(path), [])
            history.append((now, done))
            history[:] = [entry for entry in history if now - entry[0] < 20]
            elapsed = now - history[0][0]
            speed = max(0, done - history[0][1]) / elapsed / 1000000 if elapsed else None
            progress = f'~{done/total:.0%} | ~{done/1000000:.1f}/{total/1000000:.1f} MB' if total else f'{done/1000000:.1f} MB'
            rate = f'~{speed:.2f} MB/s' if speed is not None else 'measuring speed...'
            print(f'{time.strftime("%H:%M:%S")} | {path.name} | {progress} | {rate}', flush=True)
        if '--once' in sys.argv:
            break
        time.sleep(2)
except KeyboardInterrupt:
    print('\nMonitor stopped; download continues.')
