$targetDir = "f:\PhysicaNova"
$htmlFiles = @(
    '202_sinif_deneyleri.html', 'compton.html', 'diffraction.html',
    'frank_hertz.html', 'lens_maker.html', 'lens_sim.html',
    'malus.html', 'michelson_morley.html', 'millikan.html',
    'mirror_lab.html', 'photoelectric.html', 'refraction.html', 'stokes.html'
)

$newButton = '        <a href="index.html" class="back-link" style="text-decoration: none; display: flex; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: center; justify-content: center; color: #2F4F6F;">
                <span class="material-symbols-outlined" style="font-size: 26px;">science</span>
            </div>
            <span style="font-family: Lora, serif; font-weight: bold; font-size: 1.25rem; color: #1F2933; letter-spacing: -0.015em;">Physica<span style="font-weight: normal;">Nova</span></span>
        </a>'

foreach ($file in $htmlFiles) {
    $path = Join-Path $targetDir $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        $content = $content -replace '(?s)<a\s+href="index\.html"[^>]*>.*?</a>', $newButton
        Set-Content -Path $path -Value $content -Encoding UTF8
        Write-Host "Updated $file"
    } else {
        Write-Host "File not found: $file"
    }
}
