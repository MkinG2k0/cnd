Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\assets\images\logo.jpg"
$img = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath))
$white = [System.Drawing.Color]::White
$outDir = Resolve-Path (Join-Path $PSScriptRoot "..\assets\images")

function Save-Scaled {
  param(
    [int]$Size,
    [string]$FileName,
    [bool]$Pad,
    [System.Drawing.Color]$Bg
  )

  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear($Bg)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  if ($Pad) {
    $inset = [int]($Size * 0.18)
    $dest = New-Object System.Drawing.Rectangle $inset, $inset, ($Size - 2 * $inset), ($Size - 2 * $inset)
  } else {
    $dest = New-Object System.Drawing.Rectangle 0, 0, $Size, $Size
  }

  $g.DrawImage($img, $dest)
  $outPath = Join-Path $outDir $FileName
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  Write-Host "wrote $outPath"
}

Save-Scaled -Size 1024 -FileName "icon.png" -Pad $false -Bg $white
Save-Scaled -Size 1024 -FileName "splash-icon.png" -Pad $true -Bg $white
Save-Scaled -Size 512 -FileName "android-icon-foreground.png" -Pad $true -Bg $white
Save-Scaled -Size 512 -FileName "android-icon-background.png" -Pad $false -Bg $white
Save-Scaled -Size 48 -FileName "favicon.png" -Pad $false -Bg $white
Save-Scaled -Size 512 -FileName "android-icon-monochrome.png" -Pad $true -Bg $white

$img.Dispose()
Write-Host "done"
