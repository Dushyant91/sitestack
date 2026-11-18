Add-Type -AssemblyName System.Drawing

function Create-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    if ($r -le 0) {
        $path.AddRectangle([System.Drawing.RectangleF]::new($x, $y, $w, $h))
        return $path
    }
    $d = $r * 2
    if ($d -gt $w) { $d = $w }
    if ($d -gt $h) { $d = $h }
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

# -------------------------------------------------------------------------
# 16x16: Pixel-Crafted Optical Tuning for 1x Toolbar
# -------------------------------------------------------------------------
function Render-Icon16() {
    $bmp = New-Object System.Drawing.Bitmap(16, 16, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $navy = [System.Drawing.Color]::FromArgb(255, 11, 20, 43)
    $darkNavy = [System.Drawing.Color]::FromArgb(255, 18, 32, 69)
    $white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
    $trans = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
    $semiNavy = [System.Drawing.Color]::FromArgb(160, 11, 20, 43)

    # 1. Fill background with 16x16 squircle corner cuts
    for ($y = 0; $y -lt 16; $y++) {
        for ($x = 0; $x -lt 16; $x++) {
            if (($x -eq 0 -and $y -eq 0) -or ($x -eq 15 -and $y -eq 0) -or 
                ($x -eq 0 -and $y -eq 15) -or ($x -eq 15 -and $y -eq 15)) {
                $bmp.SetPixel($x, $y, $trans)
            } elseif (($x -le 1 -and $y -eq 0) -or ($x -ge 14 -and $y -eq 0) -or 
                      ($x -le 1 -and $y -eq 15) -or ($x -ge 14 -and $y -eq 15) -or
                      ($x -eq 0 -and $y -le 1) -or ($x -eq 15 -and $y -le 1) -or
                      ($x -eq 0 -and $y -ge 14) -or ($x -eq 15 -and $y -ge 14)) {
                $bmp.SetPixel($x, $y, $semiNavy)
            } else {
                $bmp.SetPixel($x, $y, $navy)
            }
        }
    }

    # 2. Window container: x=2..13, y=2..13 (12x12, exactly 2px margin on all sides)
    # Header bar: y=2, 3 (2px height, x=3..12)
    for ($x = 3; $x -le 12; $x++) {
        $bmp.SetPixel($x, 2, $white)
        $bmp.SetPixel($x, 3, $white)
    }
    # Window header control dots (navy pixels cut into white header)
    $bmp.SetPixel(4, 3, $navy)
    $bmp.SetPixel(6, 3, $navy)

    # Window sides and viewport fill
    for ($y = 4; $y -le 12; $y++) {
        $bmp.SetPixel(2, $y, $white)
        $bmp.SetPixel(13, $y, $white)
        for ($x = 3; $x -le 12; $x++) {
            $bmp.SetPixel($x, $y, $darkNavy)
        }
    }

    # Window bottom border: y=13, x=3..12
    for ($x = 3; $x -le 12; $x++) {
        $bmp.SetPixel($x, 13, $white)
    }

    # Stack Layer 1 (top): y=5, 6, x=4..11 (2px height)
    for ($x = 4; $x -le 11; $x++) {
        $bmp.SetPixel($x, 5, $white)
        $bmp.SetPixel($x, 6, $white)
    }

    # Stack Layer 2 (middle): y=8, x=4..8 (5px) + detection indicator dot at x=11 (Sky blue #38BDF8)
    for ($x = 4; $x -le 8; $x++) {
        $bmp.SetPixel($x, 8, $white)
    }
    $sky = [System.Drawing.Color]::FromArgb(255, 56, 189, 248)
    $bmp.SetPixel(11, 8, $sky)

    # Stack Layer 3 (bottom): y=10, 11, x=4..11 (2px height)
    for ($x = 4; $x -le 11; $x++) {
        $bmp.SetPixel($x, 10, $white)
        $bmp.SetPixel($x, 11, $white)
    }

    return $bmp
}

# -------------------------------------------------------------------------
# 32x32: High-DPI Toolbar Icon
# -------------------------------------------------------------------------
function Render-Icon32() {
    $size = 32
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background squircle
    $bgPath = Create-RoundedPath 1 1 30 30 6.5
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.PointF]::new(16, 1),
        [System.Drawing.PointF]::new(16, 31),
        [System.Drawing.Color]::FromArgb(255, 15, 29, 60),
        [System.Drawing.Color]::FromArgb(255, 7, 14, 30)
    )
    $g.FillPath($bgBrush, $bgPath)

    # Edge highlight
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 255, 255, 255), 1)
    $g.DrawPath($borderPen, $bgPath)

    # Browser Window (x=5, y=4, w=22, h=24)
    $winPath = Create-RoundedPath 5 4 22 24 3.5
    $winFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 18, 32, 69))
    $g.FillPath($winFill, $winPath)

    $winPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), 1.5)
    $g.DrawPath($winPen, $winPath)

    # Header Bar: y=4 to y=10
    $headerPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $hd = 7
    $headerPath.AddArc(5, 4, $hd, $hd, 180, 90)
    $headerPath.AddArc(27 - $hd, 4, $hd, $hd, 270, 90)
    $headerPath.AddLine(27, 10, 5, 10)
    $headerPath.CloseFigure()
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $g.FillPath($whiteBrush, $headerPath)

    # Header Dots
    $navyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 18, 32, 69))
    $g.FillEllipse($navyBrush, 7.5, 6, 2, 2)
    $g.FillEllipse($navyBrush, 10.5, 6, 2, 2)

    # Stack Layers
    # Layer 1
    $l1 = Create-RoundedPath 7.5 13 17 2.2 1
    $g.FillPath($whiteBrush, $l1)

    # Layer 2
    $l2 = Create-RoundedPath 7.5 17.5 12.5 2.2 1
    $g.FillPath($whiteBrush, $l2)
    $skyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
    $g.FillEllipse($skyBrush, 22, 17.5, 2.2, 2.2)

    # Layer 3
    $l3 = Create-RoundedPath 7.5 22 17 2.2 1
    $g.FillPath($whiteBrush, $l3)

    $g.Dispose()
    return $bmp
}

# -------------------------------------------------------------------------
# 48x48: Extensions Management Icon
# -------------------------------------------------------------------------
function Render-Icon48() {
    $size = 48
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background
    $bgPath = Create-RoundedPath 1.5 1.5 45 45 10
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.PointF]::new(24, 1.5),
        [System.Drawing.PointF]::new(24, 46.5),
        [System.Drawing.Color]::FromArgb(255, 15, 29, 60),
        [System.Drawing.Color]::FromArgb(255, 7, 14, 30)
    )
    $g.FillPath($bgBrush, $bgPath)

    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 255, 255, 255), 1.2)
    $g.DrawPath($borderPen, $bgPath)

    # Browser Window (x=8, y=7, w=32, h=34)
    $winPath = Create-RoundedPath 8 7 32 34 5.5
    $winFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 18, 32, 69))
    $g.FillPath($winFill, $winPath)

    $winPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), 2.2)
    $g.DrawPath($winPen, $winPath)

    # Header Bar
    $headerPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $hd = 11
    $headerPath.AddArc(8, 7, $hd, $hd, 180, 90)
    $headerPath.AddArc(40 - $hd, 7, $hd, $hd, 270, 90)
    $headerPath.AddLine(40, 16, 8, 16)
    $headerPath.CloseFigure()
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $g.FillPath($whiteBrush, $headerPath)

    # Header Dots
    $navyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 18, 32, 69))
    $g.FillEllipse($navyBrush, 11.5, 10, 3, 3)
    $g.FillEllipse($navyBrush, 15.5, 10, 3, 3)
    $g.FillEllipse($navyBrush, 19.5, 10, 3, 3)

    # Pill on header
    $pill = Create-RoundedPath 25 10 12 3 1.5
    $pillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, 18, 32, 69))
    $g.FillPath($pillBrush, $pill)

    # Stack Layers
    $l1 = Create-RoundedPath 11.5 20 25 3.5 1.5
    $g.FillPath($whiteBrush, $l1)

    $l2 = Create-RoundedPath 11.5 26.5 18 3.5 1.5
    $g.FillPath($whiteBrush, $l2)
    $skyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
    $g.FillEllipse($skyBrush, 32.5, 26.5, 3.5, 3.5)

    $l3 = Create-RoundedPath 11.5 33 25 3.5 1.5
    $g.FillPath($whiteBrush, $l3)

    $g.Dispose()
    return $bmp
}

# -------------------------------------------------------------------------
# 128x128: High-Resolution Master Display Icon
# -------------------------------------------------------------------------
function Render-Icon128() {
    $size = 128
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background Squircle
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.PointF]::new(64, 4),
        [System.Drawing.PointF]::new(64, 124),
        [System.Drawing.Color]::FromArgb(255, 15, 29, 60),
        [System.Drawing.Color]::FromArgb(255, 7, 14, 30)
    )
    $bgPath = Create-RoundedPath 4 4 120 120 26
    $g.FillPath($bgBrush, $bgPath)

    # Subtle contrast edge
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 255, 255, 255), 1.5)
    $g.DrawPath($borderPen, $bgPath)

    # Browser Window Frame: x=22, y=20, w=84, h=88, radius=14
    $winPath = Create-RoundedPath 22 20 84 88 14
    $winFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 18, 32, 69))
    $g.FillPath($winFill, $winPath)

    $winPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), 4)
    $g.DrawPath($winPen, $winPath)

    # Browser Header Bar: y=20 to y=44 (height 24)
    $headerPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $hd = 28
    $headerPath.AddArc(22, 20, $hd, $hd, 180, 90)
    $headerPath.AddArc(106 - $hd, 20, $hd, $hd, 270, 90)
    $headerPath.AddLine(106, 44, 22, 44)
    $headerPath.CloseFigure()
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $g.FillPath($whiteBrush, $headerPath)

    # Window Header Dots
    $dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 18, 32, 69))
    $g.FillEllipse($dotBrush, 31, 29, 6, 6)
    $g.FillEllipse($dotBrush, 41, 29, 6, 6)
    $g.FillEllipse($dotBrush, 51, 29, 6, 6)

    # Minimal Address Bar Pill on right of header
    $pillPath = Create-RoundedPath 66 28.5 32 7 3.5
    $pillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 18, 32, 69))
    $g.FillPath($pillBrush, $pillPath)

    # Stack Layers inside Viewport
    # Layer 1 (Frontend / Framework)
    $l1Path = Create-RoundedPath 32 54 64 9.5 4
    $g.FillPath($whiteBrush, $l1Path)

    # Layer 2 (Platform / CMS / Libraries)
    $l2Path = Create-RoundedPath 32 70 48 9.5 4
    $g.FillPath($whiteBrush, $l2Path)
    # Layer 2 right indicator dot (active detection pulse - Sky blue #38BDF8)
    $skyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
    $g.FillEllipse($skyBrush, 87, 71, 8, 8)

    # Layer 3 (Analytics / Infrastructure)
    $l3Path = Create-RoundedPath 32 86 64 9.5 4
    $g.FillPath($whiteBrush, $l3Path)

    $g.Dispose()
    return $bmp
}

$destDir = "D:\SiteStack\public\icons"
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir
}

$b16 = Render-Icon16
$b16.Save("$destDir\icon-16.png", [System.Drawing.Imaging.ImageFormat]::Png)
$b16.Dispose()

$b32 = Render-Icon32
$b32.Save("$destDir\icon-32.png", [System.Drawing.Imaging.ImageFormat]::Png)
$b32.Dispose()

$b48 = Render-Icon48
$b48.Save("$destDir\icon-48.png", [System.Drawing.Imaging.ImageFormat]::Png)
$b48.Dispose()

$b128 = Render-Icon128
$b128.Save("$destDir\icon-128.png", [System.Drawing.Imaging.ImageFormat]::Png)
$b128.Dispose()

Write-Host "SiteStack icons generated successfully in public/icons/"
