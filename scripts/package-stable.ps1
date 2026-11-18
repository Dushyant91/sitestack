$ProgressPreference = 'SilentlyContinue'
$stageDir = 'release/sitestack-v1.1.0-stable'
if (Test-Path $stageDir) { Remove-Item -Recurse -Force $stageDir }
New-Item -ItemType Directory -Force -Path $stageDir | Out-Null
New-Item -ItemType Directory -Force -Path "$stageDir/assets" | Out-Null
New-Item -ItemType Directory -Force -Path "$stageDir/icons" | Out-Null
New-Item -ItemType Directory -Force -Path "$stageDir/popup" | Out-Null

Copy-Item 'dist/manifest.json' "$stageDir/"
Copy-Item 'dist/service-worker.js' "$stageDir/"
Copy-Item 'dist/isolated-probe.js' "$stageDir/"
Copy-Item 'dist/main-probe.js' "$stageDir/"
Copy-Item 'dist/popup/index.html' "$stageDir/popup/"

Get-ChildItem 'dist/assets' -Exclude *.map | ForEach-Object {
    Copy-Item $_.FullName "$stageDir/assets/"
}

Get-ChildItem 'dist/icons' | ForEach-Object {
    Copy-Item $_.FullName "$stageDir/icons/"
}

$zipPath = 'release/sitestack-v1.1.0-stable.zip'
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

# Create zip directly from stage directory contents (manifest at root)
tar.exe -a -cf $zipPath -C $stageDir .
Write-Host "Created $zipPath successfully."

$hash = Get-FileHash -Path $zipPath -Algorithm SHA256
Write-Host "SHA256: $($hash.Hash)"
