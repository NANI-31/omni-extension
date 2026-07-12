import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, "../public");
const logoPath = path.join(publicDir, "logo.png");

if (fs.existsSync(logoPath)) {
  console.log("Generating icons from logo.png using Windows .NET via PowerShell with Circular Cropping...");
  const ps1Path = path.join(publicDir, "resize.ps1");
  try {
    const scriptContent = `
      Add-Type -AssemblyName System.Drawing
      $src = [System.Drawing.Image]::FromFile('${logoPath.replace(/\\/g, '/')}')
      $sizes = @(16, 32, 48, 128)
      foreach ($size in $sizes) {
          $bmp = New-Object System.Drawing.Bitmap($size, $size)
          $g = [System.Drawing.Graphics]::FromImage($bmp)
          $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
          $g.DrawImage($src, 0, 0, $size, $size)
          $g.Dispose()
          
          # Perform circular crop (make background transparent outside radius)
          $cx = $size / 2
          $cy = $size / 2
          $radius = $size / 2
          for ($y = 0; $y -lt $size; $y++) {
              for ($x = 0; $x -lt $size; $x++) {
                  $dx = $x - $cx
                  $dy = $y - $cy
                  # Check if pixel is outside circular boundary
                  if (($dx * $dx + $dy * $dy) -ge (($radius - 0.5) * ($radius - 0.5))) {
                      $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                  }
              }
          }
          
          $destPath = Join-Path '${publicDir.replace(/\\/g, '/')}' "icon-$size.png"
          if (Test-Path $destPath) { Remove-Item $destPath -Force }
          $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
          $bmp.Dispose()
          Write-Output "Created: icon-$size.png ($size x $size) with transparent background"
      }
      $src.Dispose()
    `;
    
    fs.writeFileSync(ps1Path, scriptContent);
    const output = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1Path}"`, { encoding: 'utf-8' });
    console.log(output);
    console.log("All extension PNG icons generated, circularly cropped, and resized successfully.");
  } catch (err) {
    console.warn("PowerShell circular crop failed, falling back to raw buffer copy:", err.message);
    const buffer = fs.readFileSync(logoPath);
    const sizes = [16, 32, 48, 128];
    sizes.forEach((size) => {
      const filePath = path.join(publicDir, `icon-${size}.png`);
      fs.writeFileSync(filePath, buffer);
      console.log(`Created (Raw Fallback): ${filePath}`);
    });
  } finally {
    if (fs.existsSync(ps1Path)) {
      fs.unlinkSync(ps1Path);
    }
  }
} else {
  console.error("Error: logo.png not found in public folder!");
}
