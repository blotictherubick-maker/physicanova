// Physics Constants and State
const state = {
    mode: 'single', // 'single' or 'double'
    wavelength: 500, // nm
    slitWidth: 0.10, // mm (a)
    slitSeparation: 0.25, // mm (d) - for double slit
    screenDistance: 1.0, // m (L)
    screenParams: {
        widthInMeters: 0.2 // The physical width represented by the canvas
    },
    isGraphMaximized: false
};

// Canvas references
const patternCanvas = document.getElementById('patternCanvas');
const patternCtx = patternCanvas.getContext('2d');
const setupCanvas = document.getElementById('setupCanvas');
const setupCtx = setupCanvas.getContext('2d');
const graphCanvas = document.getElementById('graphCanvas');
const graphCtx = graphCanvas.getContext('2d');

// UI Elements
const els = {
    wavelength: document.getElementById('wavelength'),
    wavelengthVal: document.getElementById('wavelength-val'),
    slitWidth: document.getElementById('slit-width'),
    slitWidthVal: document.getElementById('slit-width-val'),
    slitSeparation: document.getElementById('slit-separation'),
    slitSeparationVal: document.getElementById('slit-separation-val'),
    screenDistance: document.getElementById('screen-distance'),
    screenDistanceVal: document.getElementById('screen-distance-val'),
    separationControl: document.getElementById('separation-control'),
    screenDistance: document.getElementById('screen-distance'),
    screenDistanceVal: document.getElementById('screen-distance-val'),
    separationControl: document.getElementById('separation-control'),
    formulaDisplay: document.getElementById('formula-display'),
    btnMaximize: document.getElementById('btn-maximize-graph'),
    graphView: document.querySelector('.graph-view')
};

// initialization
function init() {
    setupListeners();
    updateFormulas();
    draw();
    drawSetup();
}

function setupListeners() {
    els.wavelength.addEventListener('input', (e) => {
        state.wavelength = parseInt(e.target.value);
        els.wavelengthVal.textContent = state.wavelength;
        updateFormulas();
        draw();
        drawSetup();
    });

    els.slitWidth.addEventListener('input', (e) => {
        state.slitWidth = parseFloat(e.target.value);
        els.slitWidthVal.textContent = state.slitWidth.toFixed(2);
        updateFormulas();
        draw();
        drawSetup();
    });

    els.slitSeparation.addEventListener('input', (e) => {
        state.slitSeparation = parseFloat(e.target.value);
        els.slitSeparationVal.textContent = state.slitSeparation.toFixed(2);
        updateFormulas();
        draw();
        drawSetup();
    });

    els.screenDistance.addEventListener('input', (e) => {
        state.screenDistance = parseFloat(e.target.value);
        els.screenDistanceVal.textContent = state.screenDistance.toFixed(1);
        updateFormulas();
        draw();
        drawSetup();
    });

    els.btnMaximize.addEventListener('click', toggleMaximizeGraph);
    window.addEventListener('resize', () => {
        if (state.isGraphMaximized) {
            resizeGraphCanvas();
            drawGraph();
        }
    });
}

// Exposed to global scope for radio button calls
window.setMode = function (mode) {
    state.mode = mode;

    // Toggle Double Slit controls
    if (mode === 'double') {
        els.separationControl.classList.remove('disabled');
        els.slitSeparation.disabled = false;
    } else {
        els.separationControl.classList.add('disabled');
        els.slitSeparation.disabled = true;
    }

    updateFormulas();
    draw();
    drawSetup();
}

function updateFormulas() {
    // Dynamically update MathJax formulas based on mode
    let html = '';
    if (state.mode === 'single') {
        html = `<p><strong>Tek Yarık Minima:</strong><br> $\\sin(\\theta) = \\frac{n\\lambda}{a}$</p>`;
    } else {
        html = `
            <p><strong>Çift Yarık Maxima:</strong><br> $\\sin(\\theta) = \\frac{n\\lambda}{d}$</p>
            <p><strong>Tek Yarık Zarfı (Min):</strong><br> $\\sin(\\theta) = \\frac{m\\lambda}{a}$</p>
        `;
    }
    els.formulaDisplay.innerHTML = html;
    // Rerender MathJax
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
}

// Physics Helpers
function nmToRGB(wavelength) {
    var Gamma = 0.80,
        IntensityMax = 255,
        Factor, red, green, blue;

    if ((wavelength >= 380) && (wavelength < 440)) {
        red = -(wavelength - 440) / (440 - 380);
        green = 0.0;
        blue = 1.0;
    } else if ((wavelength >= 440) && (wavelength < 490)) {
        red = 0.0;
        green = (wavelength - 440) / (490 - 440);
        blue = 1.0;
    } else if ((wavelength >= 490) && (wavelength < 510)) {
        red = 0.0;
        green = 1.0;
        blue = -(wavelength - 510) / (510 - 490);
    } else if ((wavelength >= 510) && (wavelength < 580)) {
        red = (wavelength - 510) / (580 - 510);
        green = 1.0;
        blue = 0.0;
    } else if ((wavelength >= 580) && (wavelength < 645)) {
        red = 1.0;
        green = -(wavelength - 645) / (645 - 580);
        blue = 0.0;
    } else if ((wavelength >= 645) && (wavelength < 781)) {
        red = 1.0;
        green = 0.0;
        blue = 0.0;
    } else {
        red = 0.0;
        green = 0.0;
        blue = 0.0;
    }

    // Let the intensity fall off near the vision limits
    if ((wavelength >= 380) && (wavelength < 420)) {
        Factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
    } else if ((wavelength >= 420) && (wavelength < 701)) {
        Factor = 1.0;
    } else if ((wavelength >= 701) && (wavelength < 781)) {
        Factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
    } else {
        Factor = 0.0;
    }

    var rgb = [];
    rgb[0] = Math.round(IntensityMax * Math.pow(red * Factor, Gamma));
    rgb[1] = Math.round(IntensityMax * Math.pow(green * Factor, Gamma));
    rgb[2] = Math.round(IntensityMax * Math.pow(blue * Factor, Gamma));
    return rgb;
}

function calculateIntensity(x, params) {
    // x: position on screen from center (meters)
    // params: { lambda (m), a (m), d (m), L (m) }

    // Angle theta. For small angles, tan(theta) approx sin(theta) approx theta = x / L
    // But we will use exact trig: tan(theta) = x / L => theta = atan(x/L)
    const theta = Math.atan(x / params.L);

    const k = (2 * Math.PI) / params.lambda;
    const beta = (k * params.a * Math.sin(theta)) / 2;

    let singleSlitFactor;
    if (Math.abs(beta) < 1e-6) {
        singleSlitFactor = 1;
    } else {
        singleSlitFactor = Math.pow(Math.sin(beta) / beta, 2);
    }

    if (state.mode === 'single') {
        return singleSlitFactor;
    } else {
        // Double Slit
        // alpha = (k * d * sin(theta)) / 2
        const alpha = (k * params.d * Math.sin(theta)) / 2;
        const interferenceFactor = Math.pow(Math.cos(alpha), 2);
        return singleSlitFactor * interferenceFactor;
    }
}

// Drawing Functions
function draw() {
    drawPattern();
    drawGraph();
}

function drawPattern() {
    const w = patternCanvas.width;
    const h = patternCanvas.height;
    patternCtx.clearRect(0, 0, w, h);

    // Physics parameters converted to SI units
    const params = {
        lambda: state.wavelength * 1e-9,
        a: state.slitWidth * 1e-3,
        d: state.slitSeparation * 1e-3,
        L: state.screenDistance
    };

    // Color
    const [r, g, b] = nmToRGB(state.wavelength);

    // We render every column of pixels
    const imgData = patternCtx.createImageData(w, h);
    const data = imgData.data;

    // Screen width in meters
    // Let's deduce physical width visible based on some arbitrary scale or fixed value
    // Let's say the canvas width corresponds to 20cm (0.2m)
    const screenPhysicalWidth = state.screenParams.widthInMeters;

    for (let i = 0; i < w; i++) {
        // Map pixel x to physical x (0 is center)
        const logicalX = (i - w / 2) / (w / 2); // -1 to 1
        const physicalX = logicalX * (screenPhysicalWidth / 2);

        const intensity = calculateIntensity(physicalX, params);

        // Render
        // We set alpha based on intensity
        const alpha = Math.floor(intensity * 255);

        for (let j = 0; j < h; j++) {
            const idx = (j * w + i) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = alpha;
        }
    }

    patternCtx.putImageData(imgData, 0, 0);
}

function drawGraph() {
    const w = graphCanvas.width;
    const h = graphCanvas.height;
    graphCtx.clearRect(0, 0, w, h);

    // Grid/Axis
    graphCtx.strokeStyle = '#334155';
    graphCtx.lineWidth = 1;

    // Center Line
    graphCtx.beginPath();
    graphCtx.moveTo(w / 2, 0);
    graphCtx.lineTo(w / 2, h);
    graphCtx.stroke();

    // Bottom Axis
    graphCtx.beginPath();
    graphCtx.moveTo(0, h - 20);
    graphCtx.lineTo(w, h - 20);
    graphCtx.stroke();

    // Plot intensity curve
    const params = {
        lambda: state.wavelength * 1e-9,
        a: state.slitWidth * 1e-3,
        d: state.slitSeparation * 1e-3,
        L: state.screenDistance
    };

    const screenPhysicalWidth = state.screenParams.widthInMeters;

    const [r, g, b] = nmToRGB(state.wavelength);
    graphCtx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    graphCtx.lineWidth = 2;
    graphCtx.beginPath();

    // Padding from bottom
    const bottomPad = 25;
    const graphHeight = h - 35; // Max height of peak

    for (let i = 0; i < w; i++) {
        const logicalX = (i - w / 2) / (w / 2);
        const physicalX = logicalX * (screenPhysicalWidth / 2);

        const intensity = calculateIntensity(physicalX, params);

        // y coordinate (0 is top, h is bottom)
        // intensity 1 -> y = h - bottomPad - graphHeight
        // intensity 0 -> y = h - bottomPad
        const y = (h - bottomPad) - (intensity * graphHeight);

        if (i === 0) {
            graphCtx.moveTo(i, y);
        } else {
            graphCtx.lineTo(i, y);
        }
    }
    graphCtx.stroke();

    // Fill under curve
    graphCtx.lineTo(w, h - bottomPad);
    graphCtx.lineTo(0, h - bottomPad);
    graphCtx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
    graphCtx.fill();

    // Draw Ticks (1 cm intervals)
    graphCtx.fillStyle = '#94a3b8';
    graphCtx.font = '10px monospace';
    graphCtx.textAlign = 'center';

    const halfPhysicalWidth = screenPhysicalWidth / 2; // meters
    const oneCm = 0.01; // meters
    // Pixels per meter
    const pixelsPerMeter = (w / 2) / halfPhysicalWidth;
    const pixelsPerCm = pixelsPerMeter * oneCm;

    // Center Tick
    graphCtx.beginPath();
    graphCtx.strokeStyle = '#334155';
    graphCtx.moveTo(w / 2, h - bottomPad);
    graphCtx.lineTo(w / 2, h - bottomPad + 5);
    graphCtx.stroke();
    graphCtx.fillText('0', w / 2, h - 10);

    // Ticks to the right
    let cmCount = 1;
    for (let x = w / 2 + pixelsPerCm; x < w; x += pixelsPerCm) {
        if (x > w - 10) break; // Don't draw too close to edge
        graphCtx.beginPath();
        graphCtx.moveTo(x, h - bottomPad);
        graphCtx.lineTo(x, h - bottomPad + 5);
        graphCtx.stroke();
        // Label every 5 cm to avoid overcrowding if small, or every 1cm if plenty space
        // Let's label every 1cm but skipping if too crowded?
        // For simplicity, label every cm if spacing permits > 20px
        if (pixelsPerCm > 25 || cmCount % 5 === 0) {
            graphCtx.fillText(`${cmCount}`, x, h - 10);
        }
        cmCount++;
    }

    // Ticks to the left
    cmCount = 1;
    for (let x = w / 2 - pixelsPerCm; x > 0; x -= pixelsPerCm) {
        if (x < 10) break;
        graphCtx.beginPath();
        graphCtx.moveTo(x, h - bottomPad);
        graphCtx.lineTo(x, h - bottomPad + 5);
        graphCtx.stroke();
        if (pixelsPerCm > 25 || cmCount % 5 === 0) {
            graphCtx.fillText(`-${cmCount}`, x, h - 10);
        }
        cmCount++;
    }

    // X-Axis Label
    graphCtx.textAlign = 'right';
    graphCtx.fillText('cm', w - 5, h - 10);
}

function toggleMaximizeGraph() {
    state.isGraphMaximized = !state.isGraphMaximized;
    const btn = els.btnMaximize;

    if (state.isGraphMaximized) {
        els.graphView.classList.add('expanded');
        btn.textContent = '✕'; // Close icon
        btn.title = 'Küçült';
        resizeGraphCanvas();
    } else {
        els.graphView.classList.remove('expanded');
        btn.textContent = '⤢'; // Expand icon
        btn.title = 'Büyüt';
        // Reset dimensions
        graphCanvas.width = 600;
        graphCanvas.height = 300;
        drawGraph();
    }
}

function resizeGraphCanvas() {
    // When expanded, canvas should take full window size minus padding
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    graphCanvas.width = vw;
    graphCanvas.height = vh;

    // Also update physical width representation if we want 'zoom' effect?
    // User asked "measure" -> imply seeing DETAILS. 
    // Simply making canvas bigger with same physical width constant (0.2m) means 
    // we just have MORE PIXELS per cm. This is perfect for measurement.

    drawGraph();
}

function drawSetup() {
    const w = setupCanvas.width;
    const h = setupCanvas.height;
    setupCtx.clearRect(0, 0, w, h);

    // Coordinate settings
    const cy = h / 2; // Optical axis Y
    const slitX = 100; // Fixed slit position

    // Map L (0.5 - 5.0) to screen X position (250 - 550)
    const minL = 0.5;
    const maxL = 5.0;
    const minScreenX = 250;
    const maxScreenX = 550;
    const screenX = minScreenX + ((state.screenDistance - minL) / (maxL - minL)) * (maxScreenX - minScreenX);

    // Colors
    const [r, g, b] = nmToRGB(state.wavelength);
    const color = `rgb(${r},${g},${b})`;
    const waveColor = `rgba(${r},${g},${b}, 0.8)`;

    // 1. Optical Axis
    setupCtx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    setupCtx.setLineDash([5, 5]);
    setupCtx.beginPath();
    setupCtx.moveTo(0, cy);
    setupCtx.lineTo(w, cy);
    setupCtx.stroke();
    setupCtx.setLineDash([]);

    // 2. Incoming Plane Waves (Left)
    // Source Line
    setupCtx.strokeStyle = color;
    setupCtx.lineWidth = 2;
    setupCtx.beginPath();
    setupCtx.moveTo(20, cy - 60);
    setupCtx.lineTo(20, cy + 60);
    setupCtx.stroke();

    // Parallel Waves
    setupCtx.strokeStyle = waveColor;
    setupCtx.lineWidth = 1;
    const waveSpacing = 24;
    for (let x = 20 + waveSpacing; x < slitX; x += waveSpacing) {
        setupCtx.beginPath();
        setupCtx.moveTo(x, cy - 50);
        setupCtx.lineTo(x, cy + 50);
        setupCtx.stroke();
    }

    // 3. Diffracted Waves (Right)
    setupCtx.save();
    // Clip to region between slits and screen
    setupCtx.beginPath();
    setupCtx.rect(slitX, 0, screenX - slitX, h);
    setupCtx.clip();

    const maxRadius = Math.sqrt(Math.pow(screenX - slitX, 2) + Math.pow(100, 2));

    if (state.mode === 'single') {
        for (let rad = 0; rad < maxRadius; rad += waveSpacing) {
            setupCtx.beginPath();
            setupCtx.arc(slitX, cy, rad, -Math.PI / 2, Math.PI / 2);
            setupCtx.stroke();
        }
    } else {
        // Double Slit - visually exaggerated separation
        const visualD = 15; // pixels
        // Top Source
        for (let rad = 0; rad < maxRadius; rad += waveSpacing) {
            setupCtx.beginPath();
            setupCtx.arc(slitX, cy - visualD, rad, -Math.PI / 2, Math.PI / 2);
            setupCtx.stroke();
        }
        // Bottom Source
        for (let rad = 0; rad < maxRadius; rad += waveSpacing) {
            setupCtx.beginPath();
            setupCtx.arc(slitX, cy + visualD, rad, -Math.PI / 2, Math.PI / 2);
            setupCtx.stroke();
        }
    }
    setupCtx.restore();

    // 4. Slit Barrier
    setupCtx.fillStyle = '#94a3b8';
    const barrierW = 6;
    const barrierH = 140;

    if (state.mode === 'single') {
        // Simple gap
        const gap = 20;
        // Top
        setupCtx.fillRect(slitX - barrierW / 2, cy - barrierH / 2, barrierW, barrierH / 2 - gap / 2);
        // Bottom
        setupCtx.fillRect(slitX - barrierW / 2, cy + gap / 2, barrierW, barrierH / 2 - gap / 2);
    } else {
        // Double gap
        const visualD = 15; // Matches wave centers
        const gap = 8;
        // Top solid
        setupCtx.fillRect(slitX - barrierW / 2, cy - barrierH / 2, barrierW, barrierH / 2 - visualD - gap / 2);
        // Middle solid
        setupCtx.fillRect(slitX - barrierW / 2, cy - visualD + gap / 2, barrierW, (visualD * 2) - gap);
        // Bottom solid
        setupCtx.fillRect(slitX - barrierW / 2, cy + visualD + gap / 2, barrierW, barrierH / 2 - visualD - gap / 2);
    }

    // 5. Screen
    setupCtx.fillStyle = '#e2e8f0';
    setupCtx.fillRect(screenX - 2, cy - 90, 4, 180);

    // Screen label
    setupCtx.fillStyle = '#94a3b8';
    setupCtx.font = '12px Inter';
    setupCtx.fillText('Ekran', screenX - 15, cy - 100);

    // 6. Annotations (Dimensions)
    setupCtx.fillStyle = '#fff';
    setupCtx.strokeStyle = '#fff';
    setupCtx.lineWidth = 1;

    // L (Distance)
    const labelY = cy + 80;
    setupCtx.beginPath();
    setupCtx.moveTo(slitX, labelY);
    setupCtx.lineTo(screenX, labelY);
    setupCtx.stroke();
    // Arrowheads
    setupCtx.beginPath(); setupCtx.moveTo(slitX + 5, labelY - 3); setupCtx.lineTo(slitX, labelY); setupCtx.lineTo(slitX + 5, labelY + 3); setupCtx.stroke();
    setupCtx.beginPath(); setupCtx.moveTo(screenX - 5, labelY - 3); setupCtx.lineTo(screenX, labelY); setupCtx.lineTo(screenX - 5, labelY + 3); setupCtx.stroke();

    setupCtx.textAlign = 'center';
    setupCtx.fillText(`L = ${state.screenDistance.toFixed(1)} m`, (slitX + screenX) / 2, labelY + 15);

    // Slit params text
    setupCtx.textAlign = 'left';
    setupCtx.fillText(`a = ${state.slitWidth.toFixed(2)} mm`, slitX - 20, cy - 80);
    if (state.mode === 'double') {
        setupCtx.fillText(`d = ${state.slitSeparation.toFixed(2)} mm`, slitX - 20, cy - 95);
    }
}

// Start
window.onload = init;
