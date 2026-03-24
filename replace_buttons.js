const fs = require('fs');
const path = require('path');

const targetDir = 'f:\\PhysicaNova';
const htmlFiles = [
    '202_sinif_deneyleri.html',
    'compton.html',
    'diffraction.html',
    'frank_hertz.html',
    'lens_maker.html',
    'lens_sim.html',
    'malus.html',
    'michelson_morley.html',
    'millikan.html',
    'mirror_lab.html',
    'photoelectric.html',
    'refraction.html',
    'stokes.html'
];

const newButton = `        <a href="index.html" class="back-link" style="text-decoration: none; display: flex; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: center; justify-content: center; color: #2F4F6F;">
                <span class="material-symbols-outlined" style="font-size: 26px;">science</span>
            </div>
            <span style="font-family: Lora, serif; font-weight: bold; font-size: 1.25rem; color: #1F2933; letter-spacing: -0.015em;">Physica<span style="font-weight: normal;">Nova</span></span>
        </a>`;

htmlFiles.forEach(file => {
    const filePath = path.join(targetDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Match the <a href="index.html"... up to the closing </a>
        // Typically it's in a <header> or inside the page. We will replace the whole tag.
        // Needs careful regex or just replacing by searching for it
        content = content.replace(/<a\s+href="index\.html"[^>]*>[\s\S]*?<\/a>/, newButton.trim());
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(\`Updated \${file}\`);
    } else {
        console.log(\`File not found: \${file}\`);
    }
});
