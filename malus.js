const canvas = document.getElementById('malusCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements
const sourceTypeInputs = document.querySelectorAll('input[name="sourceType"]');
const srcTypeLabel = document.getElementById('srcTypeLabel');

const theta1Slider = document.getElementById('theta1Slider');
const theta2Slider = document.getElementById('theta2Slider');

const theta1Display = document.getElementById('theta1Display');
const theta2Display = document.getElementById('theta2Display');
const p1AngleLabel = document.getElementById('p1AngleLabel');
const p2AngleLabel = document.getElementById('p2AngleLabel');
const finalIntLabel = document.getElementById('finalIntLabel');

const p1StepBox = document.getElementById('p1StepBox');
const i1ValueDisplay = document.getElementById('i1ValueDisplay');
const i2ValueDisplay = document.getElementById('i2ValueDisplay');
const intensityProgressBar = document.getElementById('intensityProgressBar');

// State
let isPolarizedSource = false;
let theta1 = 0; // degrees
let theta2 = 90; // degrees

let I0 = 100;
let I1 = 50;
let I2 = 25;

// Physics logic
function calculateIntensities() {
    theta1 = parseFloat(theta1Slider.value);
    theta2 = parseFloat(theta2Slider.value);

    if (isPolarizedSource) {
        // Source is vertically polarized (0 deg)
        // I1 = I0 * cos^2(theta1 - 0)
        let rad1 = theta1 * Math.PI / 180;
        I1 = I0 * Math.pow(Math.cos(rad1), 2);
    } else {
        // Source is unpolarized
        // P1 transmits half of the light intensity, regardless of theta1
        I1 = I0 / 2;
    }

    // P2 analyzes light coming from P1. Del_theta = theta2 - theta1
    let deltaTheta = (theta2 - theta1) * Math.PI / 180;
    I2 = I1 * Math.pow(Math.cos(deltaTheta), 2);

    updateUI();
}

function updateUI() {
    theta1Display.innerText = theta1 + '°';
    theta2Display.innerText = theta2 + '°';
    p1AngleLabel.innerText = theta1;
    p2AngleLabel.innerText = theta2;

    srcTypeLabel.innerText = isPolarizedSource ? "Dikey Polarize" : "Polarize Değil";

    // Update equations if polarized
    const p1Eq = p1StepBox.querySelector('.step-equation');
    if (isPolarizedSource) {
        p1Eq.innerHTML = `I<sub>0</sub> cos<sup>2</sup>(&theta;<sub>1</sub>)`;
    } else {
        p1Eq.innerHTML = `<sup>1</sup>&frasl;<sub>2</sub> I<sub>0</sub>`;
    }

    i1ValueDisplay.innerText = I1.toFixed(1) + '%';
    i2ValueDisplay.innerText = I2.toFixed(1) + '%';
    finalIntLabel.innerText = I2.toFixed(1);

    intensityProgressBar.style.width = I2 + '%';

    // Math rendering hack for visual only (since we don't have MathJax injected)
    // Basic math text replacements are already in the HTML.
}


// Canvas Drawing functions (Isometric 3D Projection)
let w, h;
function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    w = canvas.width;
    h = canvas.height;
    draw();
}
window.addEventListener('resize', resize);

// Isometric math helper: map 3d (x,y,z) to 2d (x,y)
// x goes bottom-right, z goes bottom-left, y goes up.
const isoAngle = Math.PI / 6; // 30 degrees
function iso(x, y, z) {
    let px = (x - z) * Math.cos(isoAngle);
    let py = (x + z) * Math.sin(isoAngle) - y;
    return { x: px + w / 2, y: py + h / 2 + 100 };
}

// Draw a circle perfectly in the 3D Y-Z plane
function drawIsoCircle(x, y, z, radius, fillStyle, strokeStyle, lineWidth) {
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        const pt = iso(x, y + radius * Math.cos(a), z + radius * Math.sin(a));
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth || 1;
        ctx.stroke();
    }
}

function draw() {
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    // Center scaling
    ctx.translate(w / 2, h / 2 + 100);
    ctx.scale(1.25, 1.25);
    ctx.translate(-w / 2, -(h / 2 + 100));

    // Draw optical bench (a long rail)
    const railLength = 800; // Increased length
    const p0 = iso(-railLength / 2, 0, 0);
    const p1 = iso(railLength / 2, 0, 0);

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Beam generation based on positions
    const srcX = -railLength / 2 + 50; // -350
    const pol1X = srcX + 220; // Increased spacing to -130
    const pol2X = pol1X + 220; // Increased spacing to 90
    const screenX = pol2X + 250; // Increased screen distance to 340

    // Drawn back-to-front for proper isometric depth sorting

    // 1. Draw Source Box
    drawIsoCube(srcX, 0, 0, 20, 100, 40, '#fde047');

    // 2. Incident Beam from front of source box
    drawBeam(srcX + 20, pol1X, isPolarizedSource ? I0 : I0, isPolarizedSource ? 0 : null, '#ffffff');

    // 3. Draw Polarizer 1
    drawPolarizer(pol1X, 0, 0, theta1, '#3b82f6', I1);

    // 4. Beam pass 1
    drawBeam(pol1X, pol2X, I1, theta1, '#60a5fa');

    // 5. Draw Polarizer 2
    drawPolarizer(pol2X, 0, 0, theta2, '#eab308', I2);

    // 6. Beam pass 2
    drawBeam(pol2X, screenX, I2, theta2, '#22c55e');

    // 7. Draw Screen
    drawScreen(screenX, 0, 0, I2);

    ctx.restore();
}

// x is along rail. We draw a disc/square and grid lines indicating polarization transmission axis
function drawPolarizer(x, y, z, angleDeg, colorStr, transmittedIntensity) {
    const size = 60;
    const thickness = 15;
    const rad = angleDeg * Math.PI / 180;

    // Base slider on rail
    const bx1 = iso(x - 20, y - 5, z + 20);
    const bx2 = iso(x + 20, y - 5, z + 20);
    const bx3 = iso(x + 20, y - 5, z - 20);
    const bx4 = iso(x - 20, y - 5, z - 20);
    ctx.beginPath();
    ctx.moveTo(bx1.x, bx1.y); ctx.lineTo(bx2.x, bx2.y); ctx.lineTo(bx3.x, bx3.y); ctx.lineTo(bx4.x, bx4.y);
    ctx.fillStyle = '#1e293b'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#0f172a'; ctx.stroke();

    // Stand Post
    const s1 = iso(x, y, z);
    const s2 = iso(x, y + 60, z); // Increased height to center ring better
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.strokeStyle = '#0f172a'; // Darker post
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.stroke(); // highlight

    // Center of lens
    const centerY = y + 80;

    // Outer Ring (Holder) Background Thickness
    for (let i = thickness; i >= 0; i -= 2) {
        drawIsoCircle(x - i, centerY, z, size + 15, null, i === 0 ? '#111827' : '#374151', 2);
    }

    // Outer Ring Front Face
    drawIsoCircle(x, centerY, z, size + 15, '#1f2937', '#000', 2);

    // Draw degree tick marks on the ring
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#9ca3af';
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Angle lines: 0 degrees is vertical (Y), 90 deg horizontal (Z)
    for (let a = 0; a < 360; a += 15) {
        let aRad = a * Math.PI / 180;
        let cY = Math.cos(aRad);
        let sZ = Math.sin(aRad);

        let pOutY = centerY + (size + 12) * cY;
        let pOutZ = z + (size + 12) * sZ;
        let pInY = centerY + (size + 7) * cY;
        let pInZ = z + (size + 7) * sZ;

        let pO = iso(x, pOutY, pOutZ);
        let pI = iso(x, pInY, pInZ);

        ctx.beginPath();
        ctx.moveTo(pO.x, pO.y);
        ctx.lineTo(pI.x, pI.y);

        // Emphasize 0, 90, 180, 270
        if (a % 90 === 0) {
            ctx.strokeStyle = '#fcd34d'; // Gold ticks for cardinal points
            ctx.stroke();

            // Draw numbers for cardinal points
            let textY = centerY + (size + 24) * cY;
            let textZ = z + (size + 24) * sZ;
            let pT = iso(x, textY, textZ);
            let textStr = "";
            if (a === 0) textStr = "0°";
            else if (a === 90) textStr = "90°";
            else if (a === 180) textStr = "180°";
            else if (a === 270) textStr = "270°";

            ctx.fillText(textStr, pT.x, pT.y);
        } else {
            ctx.strokeStyle = '#9ca3af';
            ctx.stroke();
        }
    }

    // Inner Lens Hole
    drawIsoCircle(x, centerY, z, size, '#0a0a0a', null);

    // Lens background (glass)
    drawIsoCircle(x, centerY, z, size, 'rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.2)', 1);

    // Setup clip path for transmission lines so they form a perfect circle
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        const pt = iso(x, centerY + size * Math.cos(a), z + size * Math.sin(a));
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
    }
    ctx.clip();

    // Draw transmission lines (grid) rotated by angleDeg
    ctx.beginPath();
    const lineCount = 10;
    for (let i = -lineCount; i <= lineCount; i++) {
        // Offset perpendicular to the main angle
        const offset = i * (size / lineCount);
        const perpY = offset * (-Math.sin(rad));
        const perpZ = offset * Math.cos(rad);

        // Draw long lines to ensure they cover the circle bounds, relies on clip
        const vY = size * Math.cos(rad) * 1.5;
        const vZ = size * Math.sin(rad) * 1.5;

        const pt1 = iso(x, centerY + perpY + vY, z + perpZ + vZ);
        const pt2 = iso(x, centerY + perpY - vY, z + perpZ - vZ);

        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
    }

    ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Restore clipping
    ctx.restore();

    // Central Axis Line (thicker highlighted line to show angle clearly)
    ctx.beginPath();
    const pt1 = iso(x, centerY + size * Math.cos(rad), z + size * Math.sin(rad));
    const pt2 = iso(x, centerY - size * Math.cos(rad), z - size * Math.sin(rad));
    ctx.moveTo(pt1.x, pt1.y);
    ctx.lineTo(pt2.x, pt2.y);
    ctx.strokeStyle = colorStr; // The blue or yellow highlight
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw an indicator knot on the outer ring matching the angle
    const knotY = centerY + (size + 15) * Math.cos(rad);
    const knotZ = z + (size + 15) * Math.sin(rad);
    const pknot = iso(x, knotY, knotZ);
    ctx.beginPath();
    ctx.arc(pknot.x, pknot.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = colorStr;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawScreen(x, y, z, finalInt) {
    const size = 60;

    // Stand
    const s1 = iso(x, y, z);
    const s2 = iso(x, y + 80, z); // match new centerY
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Board
    const centerY = y + 80;
    const tl = iso(x, centerY + size, z - size * 1.5);
    const tr = iso(x, centerY + size, z + size * 1.5);
    const br = iso(x, centerY - size, z + size * 1.5);
    const bl = iso(x, centerY - size, z - size * 1.5);

    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Hit spot (brightness depends on final intensity)
    const center = iso(x, centerY, z);
    const radSpot = 20 * (finalInt / 100) + 5; // size visual scaling

    ctx.beginPath();
    ctx.ellipse(center.x, center.y, radSpot * Math.cos(isoAngle), radSpot, -isoAngle, 0, Math.PI * 2);
    const alpha = (finalInt / 100).toFixed(2);
    ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
    ctx.fill();

    ctx.shadowBlur = 30 * (finalInt / 100);
    ctx.shadowColor = '#22c55e';
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Draw simple isometric cube
function drawIsoCube(x, y, z, dx, dy, dz, color) {
    // A rough box representing the source
    const p0 = iso(x - dx, y, z - dz);
    const p1 = iso(x + dx, y, z - dz);
    const p2 = iso(x + dx, y, z + dz);
    const p3 = iso(x - dx, y, z + dz);
    const p4 = iso(x - dx, y + dy, z - dz);
    const p5 = iso(x + dx, y + dy, z - dz);
    const p6 = iso(x + dx, y + dy, z + dz);
    const p7 = iso(x - dx, y + dy, z + dz);

    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p5.x, p5.y); ctx.lineTo(p4.x, p4.y); ctx.fillStyle = "#444"; ctx.fill();
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p6.x, p6.y); ctx.lineTo(p5.x, p5.y); ctx.fillStyle = "#555"; ctx.fill();
    ctx.beginPath(); ctx.moveTo(p4.x, p4.y); ctx.lineTo(p5.x, p5.y); ctx.lineTo(p6.x, p6.y); ctx.lineTo(p7.x, p7.y); ctx.fillStyle = "#666"; ctx.fill();

    // Output port glowing at exactly 80 height (aligns with beam)
    const portY = 80;
    const port = iso(x + dx, portY, z);
    ctx.beginPath();
    ctx.arc(port.x, port.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Draw the light beam. If polarizationAngle is null, draw unpolarized (squiggly lines all around). 
// If given, draw a sinusoidal wave acting in that transverse plane.
function drawBeam(startX, endX, intensity, polarizationAngle, baseColor) {
    if (intensity < 0.1) return; // effectively dark

    const alpha = Math.max(0.1, intensity / 100).toFixed(2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 2;

    // Core beam
    const centerY = 80; // match new optical axis height
    const s = iso(startX, centerY, 0);
    const e = iso(endX, centerY, 0);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();

    // Waveforms superimposed
    ctx.beginPath();
    ctx.strokeStyle = baseColor;

    // To make it animate slightly
    const wavelength = 30;
    // Amplitude is proportional to the square root of intensity
    const amp = 15 * 1.5 * Math.sqrt(intensity / 100);

    if (polarizationAngle !== null) {
        // Polarized: single plane wave
        const rad = polarizationAngle * Math.PI / 180;
        for (let x = startX; x <= endX; x += 2) {
            let phase = (x / wavelength) * Math.PI * 2 - (Date.now() / 200);
            let r = Math.sin(phase) * amp;

            let dY = r * Math.cos(rad);
            let dZ = r * Math.sin(rad);

            let p = iso(x, centerY + dY, dZ);
            if (x === startX) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    } else {
        // Unpolarized
        for (let a = 0; a < 180; a += 60) {
            ctx.beginPath();
            const rad = a * Math.PI / 180;
            for (let x = startX; x <= endX; x += 5) {
                let phase = (x / (wavelength * 1.2)) * Math.PI * 2 - (Date.now() / 200) + a;
                let r = Math.sin(phase) * amp;
                let dY = r * Math.cos(rad);
                let dZ = r * Math.sin(rad);
                let p = iso(x, centerY + dY, dZ);
                if (x === startX) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        }
    }
}

// Animation Loop
function animate() {
    draw();
    requestAnimationFrame(animate);
}

// Listeners
sourceTypeInputs.forEach(i => i.addEventListener('change', (e) => {
    isPolarizedSource = e.target.value === 'polarized';
    calculateIntensities();
}));

theta1Slider.addEventListener('input', calculateIntensities);
theta2Slider.addEventListener('input', calculateIntensities);

// Init
setTimeout(() => {
    resize();
    calculateIntensities();
    animate();
}, 100);
