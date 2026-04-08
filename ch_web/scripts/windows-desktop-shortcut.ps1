# Crea un acceso directo en el escritorio con ícono explícito (motor).
# Útil cuando Edge deja el ícono genérico en el .lnk aunque la barra de tareas se vea bien.
#
# Uso (desde carpeta ch_web, después de npm run build):
#   powershell -ExecutionPolicy Bypass -File scripts/windows-desktop-shortcut.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/windows-desktop-shortcut.ps1 -AppUrl "http://127.0.0.1:4173/"
param(
  [string]$AppUrl = 'http://127.0.0.1:4173/',
  [string]$IconPath = ''
)

$ErrorActionPreference = 'Stop'
$chWebRoot = Split-Path $PSScriptRoot -Parent
$distIco = Join-Path $chWebRoot 'dist\favicon.ico'
$publicIco = Join-Path $chWebRoot 'public\favicon.ico'

$icon = if ($IconPath) { $IconPath } elseif (Test-Path -LiteralPath $distIco) { $distIco } else { $publicIco }

if (-not (Test-Path -LiteralPath $icon)) {
  Write-Error "No encuentro favicon.ico. Ejecutá antes: npm run icons:pwa && npm run build (en ch_web). Buscado: $distIco"
}

$edge = Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'
if (-not (Test-Path -LiteralPath $edge)) {
  $edge = Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'
}
if (-not (Test-Path -LiteralPath $edge)) {
  Write-Error "No encontré msedge.exe en las rutas típicas. Instalá Edge o pasá -IconPath y creá el acceso a mano."
}

$shell = New-Object -ComObject WScript.Shell
# Nombre sin tildes: evita rarezas de codificación al crear el .lnk desde npm/cmd.
$lnkPath = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Control hidraulico.lnk'
$sc = $shell.CreateShortcut($lnkPath)
$sc.TargetPath = $edge
$sc.Arguments = "--app=`"$AppUrl`""
$resolvedIcon = (Resolve-Path -LiteralPath $icon).Path
$sc.IconLocation = "$resolvedIcon,0"
$sc.Save()

Write-Host "Listo: $lnkPath"
Write-Host "Icono: $resolvedIcon"
