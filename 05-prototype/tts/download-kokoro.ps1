# Run manually. Uses curl's normal meter: bytes, speed, percent and remaining time.
$ErrorActionPreference = 'Stop'
$voiceTarget = Join-Path $PSScriptRoot 'models/kokoro-vi'
$voiceFiles = @(
    'README.md', 'config.json', 'voices.json', 'kokoro_vi.onnx',
    'kokoro_vi_voicepack.pt',
    'voicepacks/hung_thinh.pt', 'voicepacks/manh_dung.pt',
    'voicepacks/phat_tai.pt', 'voicepacks/thanh_dat.pt', 'voicepacks/tuan_ngoc.pt'
)
foreach ($voiceFile in $voiceFiles) {
    $voiceOutput = Join-Path $voiceTarget $voiceFile
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $voiceOutput) | Out-Null
    if (Test-Path -LiteralPath $voiceOutput) {
        Write-Host "Already downloaded: $voiceFile"
        continue
    }
    Write-Host "Downloading: $voiceFile"
    $voicePartial = "$voiceOutput.partial"
    & curl.exe --location --fail --retry 3 --connect-timeout 30 --continue-at - --output $voicePartial "https://huggingface.co/contextboxai/Kokoro-Vietnamese/resolve/main/$voiceFile"
    if ($LASTEXITCODE -ne 0) { throw "Download failed: $voiceFile. Re-run this script to resume." }
    Move-Item -LiteralPath $voicePartial -Destination $voiceOutput
}
Write-Host "Download complete: $voiceTarget"
