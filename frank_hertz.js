const tubeCanvas = document.getElementById('tubeCanvas');
const tubeCtx = tubeCanvas.getContext('2d');
const graphCanvas = document.getElementById('graphCanvas');
const graphCtx = graphCanvas.getContext('2d');

// Physics Constants
const EXCITATION_ENERGY = 4.9; // eV (Mercury)
const CONTACT_POTENTIAL = 2.0; // V

// State
let state = {
    vAcc: 0, // U2
    vRet: 1.5, // U3
    temperature: 180, // T
    current: 0,
    electrons: [],
    collisions: [],
    autoScanning: false,
    history: []
};

// UI Elements
const accVoltageSlider = document.getElementById('accVoltage');
const retVoltageSlider = document.getElementById('retVoltage');
const tempSlider = document.getElementById('temperature');
const accDisplay = document.getElementById('accVoltageDisplay');
const retDisplay = document.getElementById('retVoltageDisplay');
const tempDisplay = document.getElementById('tempDisplay');
const resetBtn = document.getElementById('resetBtn');
const autoScanBtn = document.getElementById('autoScanBtn');

// Resizing
function resizeCanvases() {
    tubeCanvas.width = tubeCanvas.offsetWidth;
    tubeCanvas.height = tubeCanvas.offsetHeight;
    graphCanvas.width = graphCanvas.offsetWidth;
    graphCanvas.height = graphCanvas.offsetHeight;
}
window.addEventListener('resize', resizeCanvases);
resizeCanvases();

updateStateFromDOM();

// Listeners
accVoltageSlider.addEventListener('input', () => {
    updateStateFromDOM();
    if (state.autoScanning) stopAutoScan();
});
retVoltageSlider.addEventListener('input', updateStateFromDOM);
tempSlider.addEventListener('input', updateStateFromDOM);

resetBtn.addEventListener('click', () => {
    accVoltageSlider.value = 0;
    state.history = [];
    state.electrons = [];
    stopAutoScan();
    updateStateFromDOM();
});

autoScanBtn.addEventListener('click', () => {
    if (state.autoScanning) {
        stopAutoScan();
    } else {
        startAutoScan();
    }
});

function updateStateFromDOM() {
    state.vAcc = parseFloat(accVoltageSlider.value);
    state.vRet = parseFloat(retVoltageSlider.value);
    state.temperature = parseFloat(tempSlider.value);

    accDisplay.textContent = state.vAcc.toFixed(1) + " V";
    retDisplay.textContent = state.vRet.toFixed(1) + " V";
    tempDisplay.textContent = state.temperature + " °C";
}

function startAutoScan() {
    state.autoScanning = true;
    autoScanBtn.textContent = "Durdur";
    accVoltageSlider.disabled = true;
    state.history = [];
    accVoltageSlider.value = 0;
    state.vAcc = 0;
}

function stopAutoScan() {
    state.autoScanning = false;
    autoScanBtn.textContent = "Otomatik Tara";
    accVoltageSlider.disabled = false;
}

// --- Physics Engine (Advanced) ---

// Helper: Calculate efficacy factor based on Temperature
function getTemperatureFactor(t) {
    // Optimal T is around 170-190 C.
    // If T < 140: Vapor pressure too low -> No collisions -> Factor ~ 0
    // If T > 220: Vapor pressure too high -> Too many collisions -> Factor destroys current

    // We want a "Dip Strength" factor (0 to 1)
    // And a "Current Transmission" factor (0 to 1)

    let dipStrength = 0;
    let transmission = 1;

    if (t < 140) {
        // Cold: Vacuum tube mode
        dipStrength = 0;
        transmission = 1; // High current allowed
    } else if (t >= 140 && t <= 200) {
        // Optimal range
        // Gaussian peak at 180
        const dist = Math.abs(t - 180);
        dipStrength = Math.exp(-(dist * dist) / (20 * 20)); // exp(-x^2) shape
        transmission = 0.8; // Some scattering loss
    } else {
        // Hot
        dipStrength = 0.5; // Dips still exist but messy
        // Transmission drops drastically with T
        transmission = Math.exp(-(t - 200) / 20) * 0.5;
    }

    return { dipStrength, transmission };
}


class Electron {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 40; // Cathode
        this.y = 50 + Math.random() * (tubeCanvas.height - 100);
        this.vx = 0.5 + Math.random() * 0.5;
        this.energy = 0; // eV
        this.active = true;
        this.color = '#fff';
    }

    update() {
        if (!this.active) return;

        const cathodeX = 40;
        const gridX = tubeCanvas.width - 60;
        const anodeX = tubeCanvas.width - 20;

        // Physics Factors
        const { dipStrength } = getTemperatureFactor(state.temperature);

        if (this.x < gridX) {
            // Cathode -> Grid Region
            const dist = gridX - cathodeX;
            const E_field = state.vAcc / dist;

            // Gain Energy
            this.energy += E_field * this.vx;
            this.x += this.vx;

            // Speed visualization
            this.vx = 1 + Math.sqrt(this.energy) * 0.5;

            // Collision Check
            // Only if we have enough energy AND temperature allows collisions
            if (this.energy >= EXCITATION_ENERGY && dipStrength > 0.01) {
                // Probabilistic collision
                // Probability should depend on DipStrength (Vapor Density)
                if (Math.random() < 0.2 * dipStrength) {
                    this.energy -= EXCITATION_ENERGY;

                    // Visual Glow
                    state.collisions.push({
                        x: this.x,
                        y: this.y,
                        life: 1.0,
                        color: `rgba(0, 188, 212, ${dipStrength})` // Opacity based on effect strength
                    });

                    // Scattering? simple slowing down
                    this.vx = 0.5;
                }
            }

        } else if (this.x < anodeX) {
            // Grid -> Anode Region (Retarding)
            const dist = anodeX - gridX;
            const E_field = state.vRet / dist;

            this.energy -= E_field * this.vx;
            this.x += this.vx;

            if (this.energy <= 0) {
                this.active = false;
                this.color = '#555';
            }
        } else {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function calculateCurrent(v) {
    if (v < 0) return 0;

    const { dipStrength, transmission } = getTemperatureFactor(state.temperature);

    // Base Diode Current (Rising V^1.5)
    let baseCurrent = Math.pow(v, 1.5) * 0.2 * transmission;

    // Frank-Hertz Dips
    // We calculate "how many multiples of 4.9V" we passed.
    // For each multiple, a large fraction of electrons lose energy.
    // If result energy < vRet, they are stopped.

    // n = collision order
    const n = Math.floor((v + CONTACT_POTENTIAL) / EXCITATION_ENERGY);

    // Energy remaining after n collisions (ideal)
    const eRem = (v + CONTACT_POTENTIAL) - n * EXCITATION_ENERGY;

    // If eRem < vRet, current should drop.
    // However, energy is distributed. So it's not a step function drop.
    // Deepest drop is when eRem is slightly above 0 but less than vRet? 
    // Actually drop happens when eRem is roughly 0 (just after collision).

    let dipFactor = 1.0;

    // We model dips as subtracted Gaussian-like valleys at n*4.9
    // But we only want to subtract if dipStrength is high.

    // Instead of complex math, let's use the standard "Sawtooth" modulation approximation
    // Current I ~ V_acc but resets at 4.9.

    // Let's model the "Effective Voltage" for current purposes.
    // If DipStrength is 0 (Cold), Effective V = V_acc. Current rises smoothly.
    // If DipStrength is 1 (Opt), Effective V "resets" or dips periodically.

    // Let's use a modular function modulated by dipStrength
    const phase = (v + CONTACT_POTENTIAL) / EXCITATION_ENERGY;
    const cyclePos = phase - Math.floor(phase); // 0 to 1

    // A valley function: 1.0 normally, drops to 0.2 near cyclePos=0?
    // Actually peaks happen just before collision energy is reached? 
    // Peaks are when electrons reach anode with max energy just before collision.
    // Dips are when they collide just before grid and have 0 energy entering retarding zone.

    // So current is prop to probability of NOT being stopped.
    // P(stop) is high when (V % 4.9) implies collision near grid.

    // Simple mathematical curve fitting visual behavior:
    // Dip shape: 1 - Strength * exp(- (x - peak)^2 )
    // Just modulate baseCurrent by a periodic function.

    // Periodic attenuation
    // We want dips at roughly 4.9, 9.8... (actually slightly shifted by contact pot)
    // Let's say we have peaks at 4.9*n - retarding? 
    // Let's stick to the visual: Drops after 4.9n.

    // Smooth periodic drop
    // Valleys at 6.9, 11.8...
    // Let's use cos^2 or similar
    const period = EXCITATION_ENERGY;
    const offset = CONTACT_POTENTIAL;

    // We want a drop specifically when V implies electrons arrive at grid with ~0 energy after collision.
    // That means V approx n*4.9.

    // Let's compose the factor.
    // Base factor is 1.
    // Subtract Gaussian at each n*4.9 + small_offset

    let modulation = 0;
    // Iterate possible collision orders up to current voltage
    for (let k = 1; k < 15; k++) {
        const dropPos = k * EXCITATION_ENERGY + CONTACT_POTENTIAL;
        if (v < dropPos - 3) break; // Optimization

        // Define a "Drop Window"
        // If v is near dropPos, current drops.
        const diff = v - dropPos;
        // Asymmetric Sawtooth is better but Gaussian is easier.
        // Dips are usually sharp.
        const width = 1.5;
        modulation += Math.exp(-(diff * diff) / (width));
    }

    // Apply dip strength
    // If dipStrength is 1, modulation fully subtracts current (well, up to a limit).
    // Factor must be > 0.
    dipFactor = 1 - (0.8 * dipStrength * modulation);
    dipFactor = Math.max(0.1, dipFactor); // Clamp

    return baseCurrent * dipFactor;
}

function animate() {
    if (state.autoScanning) {
        state.vAcc += 0.1;
        accVoltageSlider.value = state.vAcc;
        updateStateFromDOM();
        if (state.vAcc >= 80) stopAutoScan();
    }

    state.current = calculateCurrent(state.vAcc);

    // Push history
    if (state.history.length === 0 || Math.abs(state.vAcc - state.history[state.history.length - 1].x) > 0.2) {
        state.history.push({ x: state.vAcc, y: state.current });
    }

    // Emission (Temp dependent)
    // Current simulation needs particles.
    // Particle count ~ Current? Or just visual?
    // Let's keep particle emission simple but scale by T.
    const emissionRate = Math.max(0, (state.temperature - 100) / 500);
    if (Math.random() < emissionRate) {
        state.electrons.push(new Electron());
    }

    // Logic
    for (let i = state.electrons.length - 1; i >= 0; i--) {
        state.electrons[i].update();
        if (!state.electrons[i].active || state.electrons[i].x > tubeCanvas.width) {
            state.electrons.splice(i, 1);
        }
    }
    // Collisions
    for (let i = state.collisions.length - 1; i >= 0; i--) {
        state.collisions[i].life -= 0.05;
        if (state.collisions[i].life <= 0) {
            state.collisions.splice(i, 1);
        }
    }

    // Drawings
    drawTube();
    drawGraph();

    requestAnimationFrame(animate);
}

function drawTube() {
    tubeCtx.fillStyle = '#000';
    tubeCtx.fillRect(0, 0, tubeCanvas.width, tubeCanvas.height);

    const h = tubeCanvas.height;

    // Visual Temperature Warning (Red Glow if hot)
    if (state.temperature > 200) {
        tubeCtx.fillStyle = `rgba(255, 0, 0, ${(state.temperature - 200) / 50 * 0.2})`;
        tubeCtx.fillRect(0, 0, tubeCanvas.width, tubeCanvas.height);
    }
    // Blue Glow if optimal
    if (state.temperature > 160 && state.temperature < 200) {
        tubeCtx.fillStyle = `rgba(0, 188, 212, 0.05)`;
        tubeCtx.fillRect(0, 0, tubeCanvas.width, tubeCanvas.height);
    }

    tubeCtx.strokeStyle = '#666';
    tubeCtx.lineWidth = 4;

    // Cathode
    tubeCtx.beginPath();
    tubeCtx.moveTo(40, h / 2 - 50);
    tubeCtx.lineTo(40, h / 2 + 50);
    tubeCtx.stroke();

    // Grid
    tubeCtx.beginPath();
    tubeCtx.setLineDash([5, 5]);
    tubeCtx.moveTo(tubeCanvas.width - 60, h / 2 - 60);
    tubeCtx.lineTo(tubeCanvas.width - 60, h / 2 + 60);
    tubeCtx.stroke();
    tubeCtx.setLineDash([]);

    // Anode
    tubeCtx.fillStyle = '#888';
    tubeCtx.fillRect(tubeCanvas.width - 20, h / 2 - 50, 10, 100);

    for (const c of state.collisions) {
        tubeCtx.beginPath();
        tubeCtx.fillStyle = c.color;
        tubeCtx.arc(c.x, c.y, 8, 0, Math.PI * 2);
        tubeCtx.fill();
    }

    for (const e of state.electrons) {
        e.draw(tubeCtx);
    }
}

function drawGraph() {
    graphCtx.fillStyle = '#1e1e1e';
    graphCtx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);

    const pad = 35;
    const w = graphCanvas.width - pad;
    const h = graphCanvas.height - pad;

    // Axes
    graphCtx.strokeStyle = '#444';
    graphCtx.lineWidth = 1;
    graphCtx.beginPath();
    graphCtx.moveTo(pad, pad);
    graphCtx.lineTo(pad, h);
    graphCtx.lineTo(w + pad, h);
    graphCtx.stroke();

    if (state.history.length < 2) return;

    // Scaling
    const maxX = 80; // Up to 80V now
    const maxY = 250; // Arbitrary unit

    graphCtx.strokeStyle = '#00bcd4';
    graphCtx.lineWidth = 2;
    graphCtx.beginPath();

    for (let i = 0; i < state.history.length; i++) {
        const p = state.history[i];
        const x = pad + (p.x / maxX) * w;
        const y = h - (p.y / maxY) * (h - pad); // Scale

        if (i === 0) graphCtx.moveTo(x, y);
        else graphCtx.lineTo(x, y);
    }
    graphCtx.stroke();

    // Current Dot
    const curX = pad + (state.vAcc / maxX) * w;
    const curY = h - (state.current / maxY) * (h - pad);
    graphCtx.fillStyle = '#ff4081';
    graphCtx.beginPath();
    graphCtx.arc(curX, curY, 4, 0, Math.PI * 2);
    graphCtx.fill();
}

animate();
