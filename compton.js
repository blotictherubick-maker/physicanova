/**
 * Compton Scattering Simulation
 */

const canvas = document.getElementById('comptonCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const els = {
    wavelengthSlide: document.getElementById('wavelength-slider'),
    wavelengthVal: document.getElementById('wavelength-val'),
    angleSlide: document.getElementById('angle-slider'),
    angleVal: document.getElementById('angle-val'),
    btnFire: document.getElementById('btn-fire'),

    // Readouts
    lambdaInc: document.getElementById('lambda-incident'),
    lambdaScat: document.getElementById('lambda-scattered'),
    lambdaShift: document.getElementById('lambda-shift'),
    enInc: document.getElementById('energy-incident'),
    enScat: document.getElementById('energy-scattered'),
    enElec: document.getElementById('energy-electron')
};

// Physics Constants
const HC = 1240; // keV * pm roughly. (h*c = 1239.8 eV*nm = 1239.8 keV*pm)
const LAMBDA_C = 2.43; // Compton Wavelength in pm

// State
const state = {
    lambda: 71, // Incident wavelength (pm)
    theta: 45, // Scattering angle (degrees)

    // Animation state
    photons: [], // {x, y, vx, vy, type: 'incident'|'scattered', lambda}
    electrons: [], // {x, y, vx, vy, speed}
    isAnimating: false,
    targetHit: false // New flag to track if target electron is gone
};

const GEO = {
    centerX: 400,
    centerY: 300,
    sourceX: 50,
    radius: 20 // Particle radius (visual)
};

function init() {
    addListeners();
    updatePhysics();
    requestAnimationFrame(loop);
}

function addListeners() {
    els.wavelengthSlide.addEventListener('input', (e) => {
        state.lambda = parseFloat(e.target.value);
        els.wavelengthVal.innerText = state.lambda + ' pm';
        updatePhysics();
    });

    els.angleSlide.addEventListener('input', (e) => {
        state.theta = parseFloat(e.target.value);
        els.angleVal.innerText = state.theta + '°';
        updatePhysics();
    });

    els.btnFire.addEventListener('click', firePhoton);
}

function toRad(deg) {
    return deg * Math.PI / 180;
}

function toDeg(rad) {
    return rad * 180 / Math.PI;
}

function updatePhysics() {
    // 1. Calculate Shift
    // Δλ = λc * (1 - cos θ)
    const thetaRad = toRad(state.theta);
    const shift = LAMBDA_C * (1 - Math.cos(thetaRad));
    const lambdaPrime = state.lambda + shift;

    // 2. Calculate Energies
    // E = hc / λ
    const E_inc = HC / state.lambda; // keV
    const E_scat = HC / lambdaPrime; // keV
    const K_e = E_inc - E_scat; // Energy conservation

    // 3. Update Readouts
    els.lambdaInc.innerText = state.lambda.toFixed(2) + ' pm';
    els.lambdaScat.innerText = lambdaPrime.toFixed(2) + ' pm';
    els.lambdaShift.innerText = shift.toFixed(2) + ' pm';

    els.enInc.innerText = E_inc.toFixed(2) + ' keV';
    els.enScat.innerText = E_scat.toFixed(2) + ' keV';
    els.enElec.innerText = K_e.toFixed(2) + ' keV';

    // 4. Calculate Recoil Angle (Phi)
    // Formula from Compton theory: cot(phi) = (1 + hv/mc^2) * tan(theta/2)
    const alpha = E_inc / 511; // E / m_e c^2
    const tanTheta2 = Math.tan(thetaRad / 2);

    let phi = 0;
    if (state.theta === 0) {
        phi = 0;
    } else if (state.theta === 180) {
        phi = 0; // Head-on, electron goes forward (0 degrees relative to incident)
    } else {
        const cotPhi = (1 + alpha) * tanTheta2;
        phi = Math.atan(1 / cotPhi);
    }

    state.phi = phi;
}

function firePhoton() {
    // Spawn incident photon
    state.photons.push({
        x: GEO.sourceX + 40, // Start end of gun
        y: GEO.centerY,
        vx: 4,
        vy: 0,
        type: 'incident',
        lambda: state.lambda
    });

    // Reset electrons
    state.electrons = [];
    state.targetHit = false;
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackgroundElements();
    updateEntities();
    drawEntities();

    requestAnimationFrame(loop);
}

function drawBackgroundElements() {
    // 1. Source Gun
    ctx.fillStyle = '#334155';
    // Move slightly right and make wider to ensure text fits
    ctx.fillRect(0, GEO.centerY - 20, 100, 40);
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, GEO.centerY - 15, 95, 30);
    // Barrel hole
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(100, GEO.centerY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter';
    ctx.textAlign = 'left';
    ctx.fillText("Foton Kaynağı", 10, GEO.centerY - 25);


    // 2. Axis Line (Horizontal)
    ctx.strokeStyle = '#334155';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, GEO.centerY);
    ctx.lineTo(800, GEO.centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Target Marker (if empty)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(GEO.centerX, GEO.centerY, 10, 0, Math.PI * 2);
    ctx.fill();

    // 4. Expected Paths (Ghost lines & Angles)
    const thetaRad = toRad(state.theta);
    const r = 200;

    // Scattered Photon Expected Path (Positive Y / Down)
    const dx = Math.cos(thetaRad) * r;
    const dy = Math.sin(thetaRad) * r; // Positive Y is DOWN in canvas

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)'; // Blueish ghost
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(GEO.centerX, GEO.centerY);
    ctx.lineTo(GEO.centerX + dx, GEO.centerY + dy);
    ctx.stroke();

    // Detector (Thin and Long Rectangle, Rotated)
    ctx.save();
    ctx.translate(GEO.centerX + dx, GEO.centerY + dy);
    // Rotate to be perpendicular to the beam (beam angle is thetaRad)
    ctx.rotate(thetaRad);

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;

    // Draw Rect: -5, -20 to 10, 40 (Thin width 10, Height 40)
    // Centered vertically
    ctx.fillRect(0, -20, 10, 40); // 0 is "start" of detector
    ctx.strokeRect(0, -20, 10, 40);

    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    // Position label slightly further out
    ctx.fillText("Dedektör", GEO.centerX + dx * 1.2, GEO.centerY + dy * 1.2 + 4);

    // Theta Angle Arc
    if (state.theta > 5) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Arc from 0 to theta
        ctx.arc(GEO.centerX, GEO.centerY, 50, 0, thetaRad);
        ctx.stroke();

        // Theta Label
        ctx.fillStyle = '#38bdf8';
        const labelAng = thetaRad / 2;
        const lx = GEO.centerX + Math.cos(labelAng) * 70;
        const ly = GEO.centerY + Math.sin(labelAng) * 70;
        ctx.fillText(`θ = ${state.theta}°`, lx, ly);
    }

    // Electron Expected Path (Negative Y / Up)
    if (state.theta > 0) {
        // Phi is always positive in calculation usually, representing angle from axis.
        const phiRad = state.phi;
        const ex = Math.cos(phiRad) * r;
        const ey = -Math.sin(phiRad) * r; // UP

        ctx.strokeStyle = 'rgba(244, 63, 94, 0.2)'; // Reddish ghost
        ctx.beginPath();
        ctx.moveTo(GEO.centerX, GEO.centerY);
        ctx.lineTo(GEO.centerX + ex, GEO.centerY + ey);
        ctx.stroke();
    }
}

function updateEntities() {
    // Photons
    state.photons.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Incident Logic: Check if front hits center
        if (p.type === 'incident' && !p.hasHit) {
            // Calculate Packet Half Length (Visual approx)
            const lambdaScale = 0.2;
            const cycleLength = Math.max(5, p.lambda * lambdaScale);
            const numCycles = 8;
            const packetHalfLength = (cycleLength * numCycles) / 2;

            // Front of photon is x + halfLength
            // Hit happens when Front >= CenterX
            if (p.x + packetHalfLength >= GEO.centerX) {
                p.hasHit = true;
                scatter(p);
            }
        }

        // Kill if fully out of bounds OR fully absorbed
        if (p.type === 'incident' && p.hasHit) {
            // Check if Tail has passed Center
            const lambdaScale = 0.2;
            const cycleLength = Math.max(5, p.lambda * lambdaScale);
            const numCycles = 8;
            const packetHalfLength = (cycleLength * numCycles) / 2;

            // Tail is x - halfLength. If Tail > CenterX, it's fully inside/gone.
            if (p.x - packetHalfLength > GEO.centerX) {
                p.dead = true;
            }
        }

        // Out of bounds check
        const margin = 100;
        if (p.x < -margin || p.x > canvas.width + margin || p.y < -margin || p.y > canvas.height + margin) {
            p.dead = true;
        }
    });

    state.photons = state.photons.filter(p => !p.dead);

    // Electrons
    state.electrons.forEach(e => {
        e.x += e.vx;
        e.y += e.vy;

        if (e.x < 0 || e.x > canvas.width || e.y < 0 || e.y > canvas.height) {
            e.dead = true;
        }
    });
    state.electrons = state.electrons.filter(e => !e.dead);

    // Auto-reset check: If all particles are gone and we had a hit, reset target
    if (state.targetHit && state.photons.length === 0 && state.electrons.length === 0) {
        state.targetHit = false;
    }
}

function scatter(incidentPhoton) {
    state.targetHit = true;
    // 1. Create Scattered Photon
    // Goes DOWN (+y), so angle is +theta
    const thetaRad = toRad(state.theta);
    const speed = 3;

    // Calculate new wavelength
    const shift = LAMBDA_C * (1 - Math.cos(thetaRad));
    const newLambda = incidentPhoton.lambda + shift;

    // Animation Continuity:
    // To ensure "One stream" look, the Scattered photon must emerge exactly as Incident disappears.
    // Spawn at Center - HalfLength in direction of motion.

    const lambdaScale = 0.2;
    const numCycles = 8;
    const packetLength = Math.max(5, newLambda * lambdaScale) * numCycles;
    const halfLength = packetLength / 2;

    const dirX = Math.cos(thetaRad);
    const dirY = Math.sin(thetaRad);

    // Spawn at Center - HalfLength
    state.photons.push({
        x: GEO.centerX - dirX * halfLength,
        y: GEO.centerY - dirY * halfLength,
        vx: dirX * speed,
        vy: dirY * speed,
        type: 'scattered',
        lambda: newLambda,
        dead: false
    });

    // 2. Create Recoil Electron
    // Goes UP (-y), angle -phi
    const phiRad = state.phi;
    const eSpeed = 3;

    // Recoil
    state.electrons.push({
        x: GEO.centerX,
        y: GEO.centerY,
        vx: Math.cos(phiRad) * eSpeed,
        vy: -Math.sin(phiRad) * eSpeed, // Up
        dead: false
    });
}


function drawEntities() {
    // Stationary Electron
    // Only draw if it hasn't been hit yet
    if (!state.targetHit) {
        drawParticle(GEO.centerX, GEO.centerY, '#f43f5e', 8);
    }

    // Moving Electrons
    state.electrons.forEach(e => {
        drawParticle(e.x, e.y, '#f43f5e', 8);
    });

    // Photons
    state.photons.forEach(p => {
        drawPhoton(p);
    });
}

function drawParticle(x, y, color, r) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x - r / 3, y - r / 3, r / 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawPhoton(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    const angle = Math.atan2(p.vy, p.vx);
    ctx.rotate(angle);

    // Wave Params
    const lambdaScale = 0.2;
    const cycleLength = Math.max(5, p.lambda * lambdaScale);
    const numCycles = 8;
    const packetLength = cycleLength * numCycles;
    const halfLength = packetLength / 2;

    // Clipping Logic
    // Incident: Clip Front if past center.
    // Scattered: Clip Tail if behind center (actually, behind origin in local frame).

    let minX = -halfLength;
    let maxX = halfLength;

    if (p.type === 'incident') {
        const distToCenter = GEO.centerX - p.x;
        // Clip front: cannot go past center
        if (maxX > distToCenter) maxX = distToCenter;

    } else if (p.type === 'scattered') {
        // Calculate signed distance along velocity vector
        const dx = p.x - GEO.centerX;
        const dy = p.y - GEO.centerY;
        const speed = Math.hypot(p.vx, p.vy);

        // Project displacement onto velocity direction to get distance from "origin" (collision point)
        // If negative, the center of the packet is still "behind" the collision point.
        const signedDist = (dx * p.vx + dy * p.vy) / speed;

        // We only want to draw the part of the wave that has passed the origin.
        // LocalX + SignedDist > 0  =>  LocalX > -SignedDist
        const limitByOrigin = -signedDist;
        if (minX < limitByOrigin) minX = limitByOrigin;
    }

    // If completely clipped
    if (minX >= maxX) {
        ctx.restore();
        return;
    }

    // Color
    const hue = mapRange(p.lambda, 10, 250, 260, 0);
    ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    // Iterate and draw
    const step = 2;
    let first = true;
    for (let x = -halfLength; x <= halfLength; x += step) {
        // Enforce clip
        if (x < minX || x > maxX) continue;

        // Envelope
        const t = x / halfLength; // -1 to 1
        const envelope = Math.cos(t * Math.PI / 2);

        const k = (2 * Math.PI) / cycleLength;
        const y = Math.sin(x * k) * 8 * envelope;

        if (first) {
            ctx.moveTo(x, y);
            first = false;
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    ctx.restore();
}

function mapRange(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

init();
