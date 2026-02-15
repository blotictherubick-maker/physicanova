/**
 * Millikan Oil Drop Simulation
 * Physics Engine and UI Logic
 */

// --- Physics Constants ---
// Tüm hesaplamalar SI birimlerinde yapılacak (kg, m, s, Coulomb)
const CONSTANTS = {
    g: 9.80,                  // Yerçekimi ivmesi (m/s^2)
    rho_oil: 875,             // Yağ yoğunluğu (kg/m^3) - Yaklaşık zeytinyağı
    rho_air: 1.225,           // Hava yoğunluğu (kg/m^3)
    viscosity: 1.81e-5,       // Havanın viskozitesi (Pa.s) @ 20C
    e: 1.602e-19,             // Elementer yük (C)
    plateDistance: 0.005,     // Plakalar arası mesafe (m) => 5mm
    scale: 100000             // Piksel/Metre oranı (Yakınlaştırma faktörü)
    // 50px = 0.5mm => 100px = 1mm => 1m = 100,000px
};

// --- State ---
let drops = [];
let selectedDrop = null;
let voltage = 0; // Volt
let isSimulationRunning = true;
let lastTime = 0;

// Camera / Zoom State
let camera = {
    zoom: 1, // 1x or 10x
    x: 0,
    y: 0,
    target: null // drop to follow
};

// Stopwatch State
let stopwatch = {
    running: false,
    startTime: 0,
    elapsedTime: 0
};

// Canvas Setup
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// --- Drop Class ---
class OilDrop {
    constructor() {
        // Random Radius: 0.5 to 1.1 micrometers (Skewed smaller for better lift)
        this.radius = (0.5 + Math.random() * 0.6) * 1e-6; // m

        // Random Position
        this.x = (Math.random() * 0.8 + 0.1) * (width / CONSTANTS.scale);
        this.y = (Math.random() * 0.2) * (height / CONSTANTS.scale);

        // Initial Velocity
        this.vx = (Math.random() - 0.5) * 1e-5;
        this.vy = 0;

        // Charge: Ensure non-zero initially.
        // We want drops to be responsive.
        // For r=1um, mass ~ 3.6e-15 kg, Fg ~ 3.5e-14 N.
        // Max Force (500V) per 'e' is ~ 1.6e-14 N.
        // So we need > 2.2e to lift.
        // Charge Generation
        // USER REQUEST: Force exactly 1 elementary charge (1e).
        // Note: lifting 1e requires high voltage for typical drop sizes.
        let n = 1;
        if (Math.random() < 0.5) n = -1; // 50% chance - or +

        this.q = n * CONSTANTS.e;

        this.color = `rgba(255, 255, 200, ${0.7 + Math.random() * 0.3})`;
    }

    update(dt) {
        // --- Forces ---

        // 1. Gravity (Down)
        // mass = volume * density
        const volume = (4 / 3) * Math.PI * Math.pow(this.radius, 3);
        const mass = volume * CONSTANTS.rho_oil;
        const Fg = mass * CONSTANTS.g;

        // 2. Buoyancy (Up)
        const Fb = volume * CONSTANTS.rho_air * CONSTANTS.g;

        // 3. Electric Force (Up or Down depending on charge and voltage polarity)
        // E = V / d.  (Voltage positive means Top plate +, Bottom - ? Or vice versa?)
        // Let's assume Top is +, Bottom is -.
        // Field points Down. E vector is (0, E).
        // Force F = qE.
        // If V > 0 (Top +), and q < 0 (electron), Force is UP (opposing gravity).
        // Let's standard convention: V is potential diff. E = V/d.
        // We generally define UP as -y in canvas, but in physics +y is up?
        // Let's stick to Canvas Coords: y increases DOWN.
        // Gravity acts in +y direction.
        // Buoyancy acts in -y direction.

        // Electric field Direction:
        // If we say 'Voltage' creates field that lifts negative charges:
        // Usually Bottom plate is negative, Top is positive. Electron attracted to Top.
        // Force on negative charge is UP (-y).
        // F_elec = q * (V / d).
        // If q is negative, V is positive => Result is negative (UP). Correct.
        // So F_elec formula is just q * (V/d) in Canvas Y axis?
        // Wait, if q=-e, V=500, F = -e*500/d (Negative value => Up direction). Perfect.
        // But field direction? If Top is +, Field is Down (+y).
        // F = qE. q(-e) * E(+y) = Force(-y) UP. Correct.
        // However, we want to allow user to reverse field?
        // If V is negative, F becomes positive (DOWN). Correct.
        const E = voltage / CONSTANTS.plateDistance;
        const Fe = this.q * E; // result in Newtons. + means Down, - means Up.

        // 4. Drag (Stokes) - Opposes velocity
        // Fd = -6 * pi * eta * r * v
        const Fd_x = -6 * Math.PI * CONSTANTS.viscosity * this.radius * this.vx;
        const Fd_y = -6 * Math.PI * CONSTANTS.viscosity * this.radius * this.vy;

        // 5. Brownian Motion (Random Fluctuations)
        // Simple random kick. Magnitude depends on Temperature and viscosity/radius?
        // Simplification: Random force F_brown
        const k_b = 1.38e-23;
        const T = 293; // 20 C
        // Magnitude scaling for visibility only, realistically it's very complex to sim properly at dt
        // Just adding small noise to velocity directly is easier visually.
        // Let's add it as a force?
        // F_random approx sqrt(2*k*T*gamma / dt) * GaussianRandom ??
        // Let's just do a velocity jitter.

        // Sum of deterministic forces
        const Fnet_y = Fg - Fb + Fe + Fd_y;
        const Fnet_x = Fd_x;

        // Acceleration (F=ma)
        // Note: For microscopic particles in fluid, inertia is negligible compared to drag.
        // They reach terminal velocity instantly (Aristotelian motion).
        // However, integrating F=ma works fine if dt is small enough, but might be unstable.
        // Better to use v = F_driving / (6*pi*eta*r) directly?
        // Let's try standard Euler integration first. Mass is very small (1e-15 kg).
        // F is very small. a = F/m will be HUGE.
        // dt must be TINY. Or we assume terminal velocity instantaneously.

        // Approach: Instant Terminal Velocity assumption is much more stable for this scale.
        // v_term = F_net_driving / (6 * pi * eta * r)
        // Driving forces: Gravity - Buoyancy + Electric

        const F_driving_y = Fg - Fb + Fe;
        const F_driving_x = 0; // No horizontal driving force

        const drag_coeff = 6 * Math.PI * CONSTANTS.viscosity * this.radius;

        // Velocity is Force / Drag_Coeff
        this.vy = F_driving_y / drag_coeff;
        this.vx = F_driving_x / drag_coeff;

        // Add Brownian Jitter
        // Just a random pixel jitter based on 1/r (smaller drops jitter more)
        const jitterMagnitude = (1e-6 / this.radius) * 2e-6; // heuristic
        this.vx += (Math.random() - 0.5) * jitterMagnitude;
        this.vy += (Math.random() - 0.5) * jitterMagnitude;

        // Update Position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        const r_px = Math.max(2, this.radius * CONSTANTS.scale * 10);

        const px = this.x * CONSTANTS.scale;
        const py = this.y * CONSTANTS.scale;

        ctx.beginPath();
        ctx.arc(px, py, r_px, 0, Math.PI * 2);
        ctx.fillStyle = this.color;

        if (Math.abs(this.q) > 0) {
            ctx.shadowBlur = 5;
            ctx.shadowColor = "white";
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Draw selection ring
        if (this === selectedDrop) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, r_px + 4, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Check if out of bounds
    isOffScreen() {
        const px = this.x * CONSTANTS.scale;
        const py = this.y * CONSTANTS.scale;
        const margin = 50; // buffer
        return (px < -margin || px > width + margin || py < -margin || py > height + margin);
    }
}

// --- Logic ---

function spawnDrop() {
    drops.push(new OilDrop());
}

function sprayDrops() {
    for (let i = 0; i < 5; i++) {
        setTimeout(spawnDrop, i * 100);
    }
}

// --- Interaction ---
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find clicked drop
    // Check distance in pixels
    let clickedDrop = null;
    let minDist = 20; // Hitbox radius (px)

    drops.forEach(drop => {
        const px = drop.x * CONSTANTS.scale;
        const py = drop.y * CONSTANTS.scale;
        const dist = Math.sqrt((px - mouseX) ** 2 + (py - mouseY) ** 2);

        if (dist < minDist) {
            minDist = dist;
            clickedDrop = drop;
        }
    });

    selectedDrop = clickedDrop;
    updateSelectionUI();
});

function updateSelectionUI() {
    const infoPanel = document.getElementById('selected-drop-info');
    if (selectedDrop) {
        // Display Info
        // r in micrometers
        const r_um = (selectedDrop.radius * 1e6).toFixed(3);
        infoPanel.innerHTML = `
            <strong>Seçili Damla</strong><br>
            Yarıçap (r): ${r_um} µm
        `;
        infoPanel.style.display = 'block';
    } else {
        infoPanel.style.display = 'none';
        infoPanel.innerHTML = '';
    }
}

function setVoltage(v) {
    // Determine source of value
    const slider = document.getElementById('voltage-slider');
    const input = document.getElementById('voltage-input');

    // If v is provided (from code/reset), update both
    if (v !== undefined) {
        voltage = v;
        slider.value = v;
        input.value = v;
    } else {
        // Did it come from slider or input?
        // We can just rely on who called it, or sync them.
        // Usually called by event listener.
        // Let's check which element triggered it event if passed? No.
        // simpler: logic handles "update others based on this".
        // But here we use a unified function.
    }
}

function updateVoltageFromSlider() {
    const val = parseInt(document.getElementById('voltage-slider').value);
    voltage = val;
    document.getElementById('voltage-input').value = val;
}

function updateVoltageFromInput() {
    let val = parseInt(document.getElementById('voltage-input').value);
    if (isNaN(val)) val = 0;
    // Clamp
    if (val > 2000) val = 2000;
    if (val < -2000) val = -2000;

    voltage = val;
    document.getElementById('voltage-slider').value = val;
    document.getElementById('voltage-input').value = val; // re-display clamped
}

// --- Main Loop ---
function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Simulation Step
    if (isSimulationRunning) {
        // Clear Canvas
        ctx.clearRect(0, 0, width, height);

        ctx.save(); // Save default state

        // Camera Logic
        if (camera.zoom > 1 && selectedDrop) {
            // Track selected drop
            // Center the camera on the drop
            // Camera (0,0) is top-left.
            // We want drop position (drop.x * scale, drop.y * scale) to be at canvas center (width/2, height/2).

            const targetX = selectedDrop.x * CONSTANTS.scale;
            const targetY = selectedDrop.y * CONSTANTS.scale;

            // Translate to center
            ctx.translate(width / 2, height / 2);
            ctx.scale(camera.zoom, camera.zoom);
            ctx.translate(-targetX, -targetY);

        } else {
            // Normal view
            camera.zoom = 1; // Reset if drop lost or zoomed out manually
            // No transform needed
        }

        // Draw Grid Lines (Dynamic)
        // Re-draw grid here so it moves with camera
        drawGrid(ctx);

        // Update and Draw Drops
        for (let i = drops.length - 1; i >= 0; i--) {
            const drop = drops[i];
            drop.update(dt);
            drop.draw(ctx); // Draw is local coordinates, transform handles position

            if (drop.isOffScreen() && camera.zoom === 1) { // Only cull if not zoomed (safety)
                if (selectedDrop === drop) {
                    selectedDrop = null;
                    updateSelectionUI();
                }
                drops.splice(i, 1);
            }
        }

        ctx.restore(); // Restore state
    }

    // Stopwatch update
    if (stopwatch.running) {
        const now = Date.now();
        const diff = now - stopwatch.startTime;
        document.getElementById('stopwatch-display').textContent = formatTime(stopwatch.elapsedTime + diff);
    }

    requestAnimationFrame(loop);
}

// --- Stopwatch Logic ---
function toggleStopwatch() {
    if (stopwatch.running) {
        // Stop
        stopwatch.running = false;
        stopwatch.elapsedTime += Date.now() - stopwatch.startTime;
        document.getElementById('start-stop-btn').textContent = "Başlat";
        document.getElementById('start-stop-btn').classList.remove('warning');
        document.getElementById('start-stop-btn').classList.add('primary-btn');
    } else {
        // Start
        stopwatch.running = true;
        stopwatch.startTime = Date.now();
        document.getElementById('start-stop-btn').textContent = "Durdur";
        document.getElementById('start-stop-btn').classList.remove('primary-btn');
        document.getElementById('start-stop-btn').classList.add('warning');
    }
}

function resetStopwatch() {
    stopwatch.running = false;
    stopwatch.elapsedTime = 0;
    document.getElementById('stopwatch-display').textContent = "00:00.00";
    document.getElementById('start-stop-btn').textContent = "Başlat";
    document.getElementById('start-stop-btn').classList.remove('warning');
    document.getElementById('start-stop-btn').classList.add('primary-btn');
}

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
}

function pad(n) {
    return n < 10 ? '0' + n : n;
}

// --- Helpers ---
function drawGrid(ctx) {
    // Grid spacing: 0.5mm = 50px at scale 1.
    const spacing = 50;

    // Draw infinite grid covering potential zoom area
    // Use a large bounds but ensure alignment with 0,0

    // Determine bounds based on camera
    // But simple large loop is safe for now
    const limit = 5000;

    ctx.strokeStyle = "rgba(100, 255, 100, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Vertical lines
    for (let x = -limit; x <= limit; x += spacing) {
        ctx.moveTo(x, -limit);
        ctx.lineTo(x, limit);
    }
    // Horizontal lines
    for (let y = -limit; y <= limit; y += spacing) {
        ctx.moveTo(-limit, y);
        ctx.lineTo(limit, y);
    }
    ctx.stroke();

    // Highlight Center Lines (Optional, helps orientation)
    ctx.strokeStyle = "rgba(100, 255, 100, 0.5)";
    ctx.beginPath();
    ctx.moveTo(0, -limit); ctx.lineTo(0, limit); // Y-axis
    ctx.moveTo(-limit, 0); ctx.lineTo(limit, 0); // X-axis (Top of canvas? No 0,0 is top-left)
    // Actually 0,0 is top-left corner of the "plate".
    // So the first line is at the very top.

    // Let's draw bottom plate line clearly
    ctx.moveTo(-limit, 500); ctx.lineTo(limit, 500);
    ctx.stroke();
}

function toggleZoom() {
    if (!selectedDrop) {
        alert("Zoom yapmak için önce bir damla seçmelisiniz!");
        // Ensure Grid is visible even if alert pops
        return;
    }

    if (camera.zoom === 1) {
        camera.zoom = 4; // 4x Zoom
        document.getElementById('zoom-btn').textContent = "🔍 Zoom: Açık (4x)";
        document.getElementById('zoom-btn').classList.remove('secondary-btn');
        document.getElementById('zoom-btn').classList.add('primary-btn');
    } else {
        camera.zoom = 1;
        document.getElementById('zoom-btn').textContent = "🔍 Zoom: Kapalı (1x)";
        document.getElementById('zoom-btn').classList.remove('primary-btn');
        document.getElementById('zoom-btn').classList.add('secondary-btn');
    }
}

// Update Zoom UI if drop is deselected automatically
function updateSelectionUI() {
    const infoPanel = document.getElementById('selected-drop-info');
    const zoomBtn = document.getElementById('zoom-btn');

    if (selectedDrop) {
        // Display Info
        const r_um = (selectedDrop.radius * 1e6).toFixed(3);
        infoPanel.innerHTML = `
            <strong>Seçili Damla</strong><br>
            Yarıçap (r): ${r_um} µm
        `;
        infoPanel.style.display = 'block';
        zoomBtn.textContent = camera.zoom > 1 ? "🔍 Zoom: Açık (4x)" : "🔍 Zoom: Kapalı (1x)";
    } else {
        infoPanel.style.display = 'none';
        infoPanel.innerHTML = '';

        // Auto exit zoom if drop lost
        if (camera.zoom > 1) {
            toggleZoom();
        }
        zoomBtn.textContent = "🔍 Zoom: Kilitli (Önce Seç)";
    }
}

// --- Event Listeners ---
document.getElementById('voltage-slider').addEventListener('input', updateVoltageFromSlider);
document.getElementById('voltage-input').addEventListener('change', updateVoltageFromInput);
// Also update on keyup/input for smoother feel? 'change' only fires on enter/blur.
// 'input' fires on every keystroke.
document.getElementById('voltage-input').addEventListener('input', updateVoltageFromInput);

document.getElementById('spray-btn').addEventListener('click', sprayDrops);
document.getElementById('start-stop-btn').addEventListener('click', toggleStopwatch);
document.getElementById('reset-btn').addEventListener('click', resetStopwatch);
document.getElementById('zoom-btn').addEventListener('click', toggleZoom);

// Init
requestAnimationFrame(loop);
sprayDrops(); // Start with some drops
