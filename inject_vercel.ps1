$targetDir = "f:\PhysicaNova"
$files = Get-ChildItem -Path $targetDir -Filter "*.html"

$scriptBlock = @"

    <!-- Vercel Web Analytics -->
    <script>
        window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/insights/script.js"></script>

    <!-- Vercel Speed Insights -->
    <script>
        window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/speed-insights/script.js"></script>
</body>
"@

$utf8NoBom = New-Object System.Text.UTF8Encoding $false

foreach ($file in $files) {
    if ($file.Name -ne "index.html") {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if ($content -notmatch "Vercel Web Analytics") {
            # Use regex replace case-insensitive
            $newContent = $content -ireplace "<\/body>", $scriptBlock
            [System.IO.File]::WriteAllText($file.FullName, $newContent, $utf8NoBom)
            Write-Host "Injected into $($file.Name)"
        } else {
            Write-Host "Skipped $($file.Name) - Already contains script"
        }
    }
}
Write-Host "Finished processing all HTML files."
