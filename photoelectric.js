/**
 * Photoelectric Effect Simulation
 */

const canvas = document.getElementById('photoelectricCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const els = {
    wavelength: document.getElementById('wavelength-slider'),
    wavelengthVal: document.getElementById('wavelength-val'),
    intensity: document.getElementById('intensity-slider'),
    intensityVal: document.getElementById('intensity-val'),
    voltage: document.getElementById('voltage-slider'),
    voltageVal: document.getElementById('voltage-val'),
    metal: document.getElementById('metal-select'),
    current: document.getElementById('current-display'),
    ke: document.getElementById('ke-display'),
    photonEnergy: document.getElementById('photon-energy-display'),
    thresholdFreq: document.getElementById('threshold-freq'),
    btnZero: document.getElementById('btn-zero-voltage')
};

// State
const state = {
    lambda: 510, // nm
    intensity: 5, // %
    voltage: 0, // V
    workFunction: 2.36, // Sodium
    metalName: 'sodium',
    electrons: [],
    ammeterCurrent: 0,
    time: 0,
    wavePhase: 0,
    hitHistory: [],
    lastUIRefresh: 0
};

// Constants
const HC = 1240;
const SCALE_SPEED = 2;

// Geometry
const GEO = {
    tubeCenter: { x: 400, y: 250 },
    tubeRadius: 150,
    // Cathode: Curved Dish
    cathode: {
        center: { x: 350, y: 250 }, // Center of curvature (Focus point)
        radius: 180, // Radius of curvature
        angleSpread: 0.6 // Radians (+/- from 0)
    },
    anode: { x: 300, y: 250, w: 10, h: 200 },

    // Circuit
    wireXLeft: 100,
    wireXRight: 700,
    boxY: 500
};

const METALS = {
    sodium: { phi: 2.36, name: 'Sodyum' },
    calcium: { phi: 2.90, name: 'Kalsiyum' },
    zinc: { phi: 4.30, name: 'Çinko' },
    copper: { phi: 4.70, name: 'Bakır' },
    platinum: { phi: 6.35, name: 'Platin' },
    unknown: { phi: 3.50, name: '?' }
};

function init() {
    updatePhysics();
    addListeners();
    requestAnimationFrame(loop);
}

function addListeners() {
    els.wavelength.addEventListener('input', (e) => {
        state.lambda = parseInt(e.target.value);
        els.wavelengthVal.innerText = state.lambda + ' nm';
        updatePhysics();
    });

    els.intensity.addEventListener('input', (e) => {
        state.intensity = parseInt(e.target.value);
        els.intensityVal.innerText = state.intensity + ' %';
    });

    els.voltage.addEventListener('input', (e) => {
        state.voltage = parseFloat(e.target.value);
        els.voltageVal.innerText = state.voltage.toFixed(2) + ' V';
        updatePhysics();
    });

    els.metal.addEventListener('change', (e) => {
        state.metalName = e.target.value;
        state.workFunction = METALS[state.metalName].phi;
        state.electrons = [];
        updatePhysics();
    });

    els.btnZero.addEventListener('click', () => {
        state.voltage = 0;
        els.voltage.value = 0;
        els.voltageVal.innerText = '0.00 V';
        updatePhysics();
    });
}

function updatePhysics() {
    const energy = HC / state.lambda;
    const thresholdFreqHz = (state.workFunction * 1.602e-19) / 6.626e-34;
    const tfTHz = (thresholdFreqHz / 1e12).toFixed(2);
    els.thresholdFreq.innerText = tfTHz;
    els.photonEnergy.innerText = energy.toFixed(2) + ' eV';

    let kemax = energy - state.workFunction;
    if (kemax < 0) kemax = 0;
    els.ke.innerText = kemax.toFixed(2) + ' eV';
}

function spawnElectron(x, y, normalAngle) {
    const photonE = HC / state.lambda;
    const workFn = state.workFunction;

    if (photonE <= workFn) return;

    const maxKE = photonE - workFn;
    const ke = maxKE * (0.9 + Math.random() * 0.1);

    const speed = Math.sqrt(ke) * SCALE_SPEED;

    // Emission Direction:
    // Should be predominantly along the Normal Vector (towards focus).
    // Normal Angle is the angle from the emission point to the center of curvature.
    // If Cathode is on Right, and Center is Left, Normal is roughly Pi (180 deg).
    // But it varies with arc.

    // Add random spread to normal
    const spread = (Math.random() - 0.5) * 1.0; // +/- 0.5 rad approx (30 deg)
    const angle = normalAngle + spread;

    state.electrons.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ke: ke,
        dead: false
    });
}

function waveLengthToColor(wavelength) {
    if (wavelength >= 380 && wavelength < 440) return '#8b00ff';
    if (wavelength >= 440 && wavelength < 490) return '#0000ff';
    if (wavelength >= 490 && wavelength < 510) return '#00ffff';
    if (wavelength >= 510 && wavelength < 580) return '#00ff00';
    if (wavelength >= 580 && wavelength < 645) return '#ffff00';
    if (wavelength >= 645 && wavelength < 780) return '#ff0000';
    if (wavelength < 380) return '#4b0082';
    return '#800000';
}

function loop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    state.time++;
    state.wavePhase -= 0.1;

    drawVacuumTube();
    drawCircuit();
    drawLightWaves();

    updateElectrons(timestamp);

    // Spawning Logic
    if (state.intensity > 0) {
        // Linear scaling: 0 to 100 intensity
        // We want a noticeable difference.
        // Let's say max intensity (100) spawns ~3 electrons/frame avg.
        // Low intensity (10) spawns ~0.3 electrons/frame avg.

        const spawnRate = state.intensity * 0.03;
        const count = Math.floor(spawnRate);
        const remainder = spawnRate - count;

        // Guaranteed spawns
        for (let i = 0; i < count; i++) {
            spawnRandomElectron();
        }

        // Probabilistic extra spawn
        if (Math.random() < remainder) {
            spawnRandomElectron();
        }
    }

    calculateRealCurrent(timestamp);
    drawElectrons();

    requestAnimationFrame(loop);
}

function spawnRandomElectron() {
    // Pick random angle on the arc
    const theta = (Math.random() - 0.5) * 2 * GEO.cathode.angleSpread;

    const cx = GEO.cathode.center.x;
    const cy = GEO.cathode.center.y;
    const r = GEO.cathode.radius;

    const ex = cx + r * Math.cos(theta);
    const ey = cy + r * Math.sin(theta);

    const normalAngle = theta + Math.PI;

    spawnElectron(ex - 2, ey, normalAngle);
}

function drawLightWaves() {
    if (state.intensity === 0) return;

    const startX = 50;
    const startY = 30;

    // Target the dish surface
    ctx.save();
    const color = waveLengthToColor(state.lambda);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.2 + (state.intensity / 200);
    ctx.lineWidth = 2;

    const numWaves = 6;
    const spreadAngle = GEO.cathode.angleSpread * 0.8;

    const cx = GEO.cathode.center.x;
    const cy = GEO.cathode.center.y;
    const r = GEO.cathode.radius;

    for (let i = 0; i < numWaves; i++) {
        // Map i to angle
        const pct = i / (numWaves - 1); // 0 to 1
        const theta = -spreadAngle + pct * (2 * spreadAngle);

        const tx = cx + r * Math.cos(theta);
        const ty = cy + r * Math.sin(theta);

        drawSineLine(startX, startY, tx, ty, state.wavePhase + i);
    }

    ctx.restore();
}

function drawSineLine(x1, y1, x2, y2, phase) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    ctx.beginPath();

    const frequency = 0.05;
    const amplitude = 5;
    for (let x = 0; x <= dist; x += 5) {
        const y = Math.sin(x * frequency + phase) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
}

function drawVacuumTube() {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;

    // Caps
    ctx.beginPath();
    ctx.arc(GEO.tubeCenter.x - 50, GEO.tubeCenter.y, 130, Math.PI / 2, Math.PI * 1.5);
    ctx.arc(GEO.tubeCenter.x + 50, GEO.tubeCenter.y, 130, Math.PI * 1.5, Math.PI / 2);
    ctx.closePath();
    ctx.stroke();

    // Cathode (Curved Dish)
    const cx = GEO.cathode.center.x;
    const cy = GEO.cathode.center.y;
    const r = GEO.cathode.radius;
    const ang = GEO.cathode.angleSpread;

    ctx.save();
    ctx.beginPath();
    // Arc
    ctx.arc(cx, cy, r, -ang, ang);
    // Draw thick line or fill shape?
    // Let's draw a crescent shape
    ctx.arc(cx + 10, cy, r, ang, -ang, true); // Inner curve back
    ctx.closePath();

    ctx.fillStyle = getMetalColor(state.metalName);
    ctx.fill();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Anode (Left)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(GEO.anode.x, GEO.anode.y - GEO.anode.h / 2, GEO.anode.w, GEO.anode.h);

    // Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Inter';
    ctx.fillText("Katot (-)", cx + r + 20, cy);
    ctx.fillText("Anot (+)", GEO.anode.x - 50, GEO.anode.y);
}

function getMetalColor(name) {
    if (name === 'copper') return '#b87333';
    if (name === 'gold') return '#ffd700';
    if (name === 'zinc') return '#a1a1aa';
    return '#silver';
}

function drawCircuit() {
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const yWireStart = 250;

    // Left side (Anode)
    ctx.moveTo(GEO.anode.x, yWireStart);
    ctx.lineTo(GEO.wireXLeft, yWireStart);
    ctx.lineTo(GEO.wireXLeft, GEO.boxY);
    ctx.lineTo(GEO.wireXRight, GEO.boxY);
    ctx.lineTo(GEO.wireXRight, yWireStart);

    // Right side (Cathode)
    // Connect to back of dish
    // Dish center is approx cx + r * cos(0) = cx+r.
    const cx = GEO.cathode.center.x;
    const r = GEO.cathode.radius;
    const backOfDishX = cx + r; // Approx

    ctx.lineTo(backOfDishX, yWireStart);

    ctx.stroke();

    // --- Voltage Source ---
    const centerX = (GEO.wireXLeft + GEO.wireXRight) / 2;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(centerX - 40, GEO.boxY - 20, 80, 40);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 10, GEO.boxY - 15);
    ctx.lineTo(centerX - 10, GEO.boxY + 15);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX + 10, GEO.boxY - 8);
    ctx.lineTo(centerX + 10, GEO.boxY + 8);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${state.voltage.toFixed(2)}V`, centerX, GEO.boxY + 35);

    // --- Ammeter ---
    const ammeterY = (yWireStart + GEO.boxY) / 2;
    const ammeterX = GEO.wireXLeft;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ammeterX - 30, ammeterY - 20, 60, 40);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(ammeterX - 30, ammeterY - 20, 60, 40);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 14px "Roboto Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(state.ammeterCurrent.toFixed(1), ammeterX, ammeterY + 5);
    ctx.font = '10px sans-serif';
    ctx.fillText("μA", ammeterX + 20, ammeterY + 15);

    // --- Light Bulb (Series on Right Wire) ---
    const bulbX = GEO.wireXRight;
    const bulbY = ammeterY; // Align with ammeter height but on right side

    drawBulb(bulbX, bulbY, state.ammeterCurrent);
}

function drawBulb(x, y, current) {
    // Clear wire behind (Scaled up area)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 50, y - 50, 100, 100);

    // Calculate Brightness
    const brightness = Math.min(1, Math.max(0, current / 10));

    ctx.save();

    // Scale factor 2.5
    const scale = 2.5;

    // Glow (Behind) - Larger
    if (brightness > 0) {
        ctx.shadowBlur = 50 * brightness;
        ctx.shadowColor = `rgba(255, 255, 200, ${brightness})`;
    }

    // Glass Bulb
    ctx.beginPath();
    // Offset y slightly up so it centers well
    ctx.arc(x, y - 10, 15 * scale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 224, ${0.1 + brightness * 0.8})`;
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Filament (Scaled)
    ctx.beginPath();
    ctx.strokeStyle = brightness > 0.1 ? '#ffff00' : '#475569';
    ctx.lineWidth = 3;

    const fW = 7 * scale; // Width/2
    const fH = 5 * scale; // Height/2

    ctx.moveTo(x - fW, y + fH);
    ctx.lineTo(x - (fW / 2), y - fH);
    ctx.lineTo(x, y);
    ctx.lineTo(x + (fW / 2), y - fH);
    ctx.lineTo(x + fW, y + fH);
    ctx.stroke();

    // Base screw (Visual only)
    const bW = 6 * scale * 2; // Width
    const bH = 6 * scale; // Height
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x - bW / 2, y + 15, bW, bH);

    ctx.restore();
}

function updateElectrons(timestamp) {
    const forceFactor = state.voltage * 0.05;
    const tubeTop = GEO.tubeCenter.y - 120;
    const tubeBottom = GEO.tubeCenter.y + 120;

    state.electrons.forEach(e => {
        // Force -x direction
        e.vx -= forceFactor;
        e.x += e.vx;
        e.y += e.vy;

        // Anode Hit (Collected)
        if (e.x <= GEO.anode.x + GEO.anode.w &&
            e.x >= GEO.anode.x &&
            Math.abs(e.y - GEO.anode.y) < GEO.anode.h / 2 &&
            !e.dead) {

            e.dead = true;
            recordHit(timestamp);
        }

        // Cathode Collision
        const dist = Math.hypot(e.x - GEO.cathode.center.x, e.y - GEO.cathode.center.y);
        if (dist > GEO.cathode.radius && e.x > GEO.cathode.center.x) {
            e.dead = true;
        }

        // Glass Hit / Leaking past Anode
        // If it passed the anode to the left without hitting it, it hits the back glass
        if (e.x < GEO.anode.x) e.dead = true;

        if (e.y < tubeTop || e.y > tubeBottom) e.dead = true;
        if (e.x < 0 || e.x > canvas.width) e.dead = true;
    });

    state.electrons = state.electrons.filter(e => !e.dead);
}

function recordHit(timestamp) {
    state.hitHistory.push(timestamp);
}

function calculateRealCurrent(timestamp) {
    const windowSize = 500;
    state.hitHistory = state.hitHistory.filter(t => (timestamp - t) < windowSize);

    const count = state.hitHistory.length;

    // Adjusted scale since we now have MORE electrons
    const scale = 0.2; // Reduced scale per hit because count is higher
    const current = count * scale * (1000 / windowSize);

    state.ammeterCurrent = state.ammeterCurrent * 0.9 + current * 0.1;

    if (!state.lastUIRefresh || timestamp - state.lastUIRefresh > 100) {
        els.current.innerText = state.ammeterCurrent.toFixed(2) + ' μA';
        state.lastUIRefresh = timestamp;
    }
}

function drawElectrons() {
    ctx.fillStyle = '#38bdf8';
    state.electrons.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}



init();
