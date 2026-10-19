import json
from urllib.request import urlopen

for repo in ['pnnbao-ump/VieNeu-TTS-v3-Turbo', 'OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX']:
    data = json.load(urlopen('https://huggingface.co/api/models/' + repo))
    print(repo, data['sha'])
    print([x['rfilename'] for x in data['siblings'] if 'onnx' in x['rfilename'] or x['rfilename'].endswith('.json')])
data = json.load(urlopen('https://raw.githubusercontent.com/pnnbao97/VieNeu-TTS/main/src/vieneu/assets/voices_v3_turbo.json'))
print(json.dumps({k: {f: v.get(f) for f in ['description', 'gender']} for k,v in data['presets'].items()}, ensure_ascii=True, indent=2))
