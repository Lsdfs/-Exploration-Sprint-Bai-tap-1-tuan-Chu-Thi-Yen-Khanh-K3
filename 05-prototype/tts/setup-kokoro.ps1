# Manual installation only. Does not download TTS models or change the app's venv.
$ErrorActionPreference = 'Stop'
$kokoroProject = Split-Path -Parent $PSScriptRoot
$kokoroEnv = Join-Path $kokoroProject '.kokoro-venv'
$kokoroPython = Join-Path $kokoroEnv 'Scripts/python.exe'
if (-not (Test-Path -LiteralPath $kokoroPython)) {
    & (Join-Path $kokoroProject '.tts-venv/Scripts/python.exe') -m venv $kokoroEnv
    if ($LASTEXITCODE -ne 0) { throw 'Could not create Kokoro environment.' }
}
& $kokoroPython -m pip install --progress-bar on torch --index-url https://download.pytorch.org/whl/cpu
if ($LASTEXITCODE -ne 0) { throw 'CPU PyTorch installation failed.' }
& $kokoroPython -m pip install --progress-bar on 'kokoro-vietnamese[onnx] @ git+https://github.com/iamdinhthuan/Kokoro-Vietnamese.git'
if ($LASTEXITCODE -ne 0) { throw 'Kokoro runtime installation failed.' }
Write-Host 'Runtime ready. Run: .\.kokoro-venv\Scripts\python.exe -X utf8 tts\kokoro_smoke.py'
