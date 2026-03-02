/**
 * Stokes Parameters and Polarization Ellipse Visualization (Jackson 7.1)
 */

const canvas = document.getElementById('stokesCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const els = {
    s0Scale: document.getElementById('sliderS0'),
    s1Scale: document.getElementById('sliderS1'),
    s2Scale: document.getElementById('sliderS2'),
    s3Scale: document.getElementById('sliderS3'),

    valS0: document.getElementById('valS0'),
    valS1: document.getElementById('valS1'),
    valS2: document.getElementById('valS2'),
    valS3: document.getElementById('valS3'),

    resA1: document.getElementById('res_a1'),
    resA2: document.getElementById('res_a2'),
    resDelta: document.getElementById('res_delta'),

    resAp: document.getElementById('res_ap'),
    resAm: document.getElementById('res_am'),
    resDeltaC: document.getElementById('res_DeltaC'),

    resPsi: document.getElementById('res_psi'),
    resEps: document.getElementById('res_eps'),
    resHelicity: document.getElementById('res_helicity'),

    valA: document.getElementById('valA'),
    valB: document.getElementById('valB'),

    warning: document.getElementById('polarizationWarning'),

    btnPartA: document.getElementById('btnPartA'),
    btnPartB: document.getElementById('btnPartB'),
    btnCustom: document.getElementById('btnCustom'),

    mathDetails: document.getElementById('mathDetails'),
    toggleMathSection: document.getElementById('toggleMathSection'),
    toggleIcon: document.getElementById('toggleIcon')
};

// State
const state = {
    S0: 3,
    S1: -1,
    S2: 2,
    S3: -2,
    time: 0,
    preset: 'a' // 'a', 'b', 'custom'
};

const GEO = {
    pixelScale: 40 // pixels per unit of amplitude
};

function resize() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
}

window.addEventListener('resize', resize);

function init() {
    resize();
    addListeners();
    // Initialize with Part (a)
    setPreset('a');
    requestAnimationFrame(loop);
}

function addListeners() {
    els.btnPartA.addEventListener('click', () => setPreset('a'));
    els.btnPartB.addEventListener('click', () => setPreset('b'));
    els.btnCustom.addEventListener('click', () => setPreset('custom'));

    els.s0Scale.addEventListener('input', (e) => onSliderChange('S0', e.target.value));
    els.s1Scale.addEventListener('input', (e) => onSliderChange('S1', e.target.value));
    els.s2Scale.addEventListener('input', (e) => onSliderChange('S2', e.target.value));
    els.s3Scale.addEventListener('input', (e) => onSliderChange('S3', e.target.value));

    els.toggleMathSection.addEventListener('click', () => {
        if (els.mathDetails.style.display === 'none') {
            els.mathDetails.style.display = 'flex';
            els.toggleIcon.innerText = 'expand_less';
        } else {
            els.mathDetails.style.display = 'none';
            els.toggleIcon.innerText = 'expand_more';
        }
    });

}

function setPreset(presetId) {
    state.preset = presetId;

    els.btnPartA.classList.remove('active');
    els.btnPartB.classList.remove('active');
    els.btnCustom.classList.remove('active');

    if (presetId === 'a') {
        els.btnPartA.classList.add('active');
        state.S0 = 3; state.S1 = -1; state.S2 = 2; state.S3 = -2;
        updateSliders();
    } else if (presetId === 'b') {
        els.btnPartB.classList.add('active');
        state.S0 = 25; state.S1 = 0; state.S2 = 24; state.S3 = 7;
        updateSliders();
    } else {
        els.btnCustom.classList.add('active');
    }

    updatePhysics();
}

function onSliderChange(param, val) {
    state[param] = parseFloat(val);
    if (state.preset !== 'custom') {
        state.preset = 'custom';
        els.btnPartA.classList.remove('active');
        els.btnPartB.classList.remove('active');
        els.btnCustom.classList.add('active');
    }

    els['val' + param].innerText = state[param];
    updatePhysics();
}

function updateSliders() {
    els.s0Scale.value = state.S0; els.valS0.innerText = state.S0;
    els.s1Scale.value = state.S1; els.valS1.innerText = state.S1;
    els.s2Scale.value = state.S2; els.valS2.innerText = state.S2;
    els.s3Scale.value = state.S3; els.valS3.innerText = state.S3;
}

function enforcePhysicalConstraint() {
    const s0_sq = state.S0 * state.S0;
    const s_vec_sq = state.S1 * state.S1 + state.S2 * state.S2 + state.S3 * state.S3;

    if (s_vec_sq > s0_sq) {
        els.warning.style.display = 'block';
        // Normalize S1, S2, S3 vector length to S0
        if (s_vec_sq > 0) {
            const factor = state.S0 / Math.sqrt(s_vec_sq);
            state.S1 = Math.round(state.S1 * factor * 100) / 100 || 0;
            state.S2 = Math.round(state.S2 * factor * 100) / 100 || 0;
            state.S3 = Math.round(state.S3 * factor * 100) / 100 || 0;
            updateSliders(); // update ui to match reality
        }
    } else {
        els.warning.style.display = 'none';
    }
}

function calculateOutputs() {
    const { S0, S1, S2, S3 } = state;
    if (S0 === 0) return null; // Dark

    const P = Math.sqrt(S1 * S1 + S2 * S2 + S3 * S3) / S0; // Degree of polarization (fully polarized if P=1 like in problem)

    // We assume fully polarized light for drawing the ellipse of the *polarized part*
    // I_pol = Math.sqrt(S1*S1 + S2*S2 + S3*S3);
    // If not fully polarized, the Stokes params still define the ellipse of the polarized component.
    const I_pol = Math.sqrt(S1 * S1 + S2 * S2 + S3 * S3);
    if (I_pol === 0) return null; // Unpolarized

    // Linear Basis (x-y)
    // S0 = a1^2 + a2^2, S1 = a1^2 - a2^2, S2 = 2a1a2cos(delta), S3 = 2a1a2sin(delta)
    const a1_sq = (I_pol + S1) / 2;
    const a2_sq = (I_pol - S1) / 2;
    const a1 = Math.sqrt(Math.max(0, a1_sq));
    const a2 = Math.sqrt(Math.max(0, a2_sq));

    let delta = 0;
    if (a1 > 0 && a2 > 0) {
        delta = Math.atan2(S3, S2);
    } else if (a1 === 0) {
        delta = Math.PI / 2; // Arbitrary phase for pure y
    }

    // Circular Basis (+,-)
    // S0 = a+^2 + a-^2, S3 = a+^2 - a-^2
    const ap_sq = (I_pol + S3) / 2;
    const am_sq = (I_pol - S3) / 2;
    const ap = Math.sqrt(Math.max(0, ap_sq));
    const am = Math.sqrt(Math.max(0, am_sq));

    let delta_c = 0;
    if (ap > 0 && am > 0) {
        delta_c = Math.atan2(S2, -S1); // Jackson convention: tan(Delta) = S2 / -S1 ? Let's use arctan2(S2, -S1) to get correct quadrant
    }

    // Ellipse Orientation and Ellipticity
    let psi = 0.5 * Math.atan2(S2, S1);

    // sin(2eps) = S3 / I_pol
    let epsVal = S3 / I_pol;
    // clip
    if (epsVal > 1) epsVal = 1;
    if (epsVal < -1) epsVal = -1;
    let eps = 0.5 * Math.asin(epsVal);

    // Semi-major and semi-minor axes magnitudes
    const A = Math.sqrt(I_pol) * Math.cos(eps);
    const B = Math.sqrt(I_pol) * Math.abs(Math.sin(eps));

    return {
        a1, a2, delta,
        ap, am, delta_c,
        psi, eps, A, B,
        I_pol
    };
}

function updatePhysics() {
    enforcePhysicalConstraint();
    const res = calculateOutputs();

    if (!res) {
        // Zero intensity or totally unpolarized
        els.resA1.innerText = "0.00"; els.resA2.innerText = "0.00"; els.resDelta.innerText = "0.00";
        els.resAp.innerText = "0.00"; els.resAm.innerText = "0.00"; els.resDeltaC.innerText = "0.00";
        els.resPsi.innerText = "0.00"; els.resEps.innerText = "0.00";
        els.resHelicity.innerText = "Belirsiz";
        els.valA.innerText = "0.00"; els.valB.innerText = "0.00";
        return;
    }

    els.resA1.innerText = res.a1.toFixed(4);
    els.resA2.innerText = res.a2.toFixed(4);
    els.resDelta.innerText = (res.delta * 180 / Math.PI).toFixed(2);

    els.resAp.innerText = res.ap.toFixed(4);
    els.resAm.innerText = res.am.toFixed(4);
    els.resDeltaC.innerText = (res.delta_c * 180 / Math.PI).toFixed(2);

    // In Jackson convention, if psi is negative we can add 180 to it to keep it positive if we want,
    // but the ellipse is symmetric under 180 deg rotation. Let's just output it in deg.
    let psiDeg = res.psi * 180 / Math.PI;
    // Keep it in [0, 180) for display maybe, or just as calculated.
    els.resPsi.innerText = psiDeg.toFixed(2);
    els.resEps.innerText = (res.eps * 180 / Math.PI).toFixed(2);

    els.valA.innerText = res.A.toFixed(4);
    els.valB.innerText = res.B.toFixed(4);

    if (state.S3 > 0) {
        els.resHelicity.innerText = "Pozitif (Sol / RCP/LCP convention varies)";
        els.resHelicity.style.color = "#fbbf24"; // amber
    } else if (state.S3 < 0) {
        els.resHelicity.innerText = "Negatif (Sağ)";
        els.resHelicity.style.color = "#38bdf8"; // blue
    } else {
        els.resHelicity.innerText = "Lineer (Helisite Yok)";
        els.resHelicity.style.color = "#94a3b8"; // gray
    }
}

function loop(timestamp) {
    state.time = timestamp / 1000; // seconds
    draw();
    requestAnimationFrame(loop);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const res = calculateOutputs();

    // 1. Draw Grid and Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); // x-axis
    ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); // y-axis
    ctx.stroke();

    // Labels for axes
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Inter';
    ctx.fillText('x (Yatay)', canvas.width - 70, cy - 10);
    ctx.fillText('y (Dikey)', cx + 10, 20);

    if (!res) return;

    // Adapt scale so the ellipse fits nicely on screen.
    // Max excursion is A. 
    // We want A to take up about 30% of the canvas height.
    const targetSize = Math.min(canvas.width, canvas.height) * 0.35;
    let scale = targetSize / res.A;
    if (!isFinite(scale) || scale === 0) scale = 40;

    // 2. Calculate Ellipse path
    // Parametric form: E_x(t) = a1 * cos(wt), E_y(t) = a2 * cos(wt - delta)
    const points = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
        const wt = (i / steps) * Math.PI * 2;
        const ex = res.a1 * Math.cos(wt);
        const ey = res.a2 * Math.cos(wt - res.delta);

        points.push({
            x: cx + ex * scale,
            y: cy - ey * scale // canvas y is down
        });
    }

    // 3. Draw Ellipse
    ctx.strokeStyle = '#38bdf8'; // Base blue
    if (state.S3 > 0) ctx.strokeStyle = '#fbbf24'; // Yellow if positive helicity
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // 4. Draw Major/Minor Axes of the Ellipse
    // Direction of major axis is angle psi
    ctx.save();
    ctx.translate(cx, cy);
    // Note: canvas y is down, mathematical y is up. 
    // Rotation by -psi handles this (since angle increases clockwise in canvas)
    ctx.rotate(-res.psi);

    // Major axis (lies on new x)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-res.A * scale, 0);
    ctx.lineTo(res.A * scale, 0);
    ctx.stroke();

    // Minor axis (lies on new y)
    ctx.beginPath();
    ctx.moveTo(0, -res.B * scale);
    ctx.lineTo(0, res.B * scale);
    ctx.stroke();

    // Label A and B
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Inter';
    ctx.fillText('A', (res.A * scale) / 2, -5); // Above major axis
    ctx.fillText('B', 5, -(res.B * scale) / 2); // Right of minor axis

    ctx.restore();

    // Draw psi angle indicator
    if (Math.abs(res.psi) > 0.01) {
        ctx.strokeStyle = '#a855f7'; // Purple for angle
        ctx.setLineDash([]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Mathematical psi is angle from positive x axis.
        // Canvas rotation is CW, so -psi is the angle we draw on canvas.
        const rPsi = targetSize * 0.4;

        // Draw arc from 0 to -res.psi (or from -res.psi to 0 depending on sign)
        if (res.psi > 0) {
            ctx.arc(cx, cy, rPsi, -res.psi, 0);
            ctx.stroke();
            ctx.fillStyle = '#a855f7';
            ctx.fillText('ψ', cx + rPsi * Math.cos(-res.psi / 2) + 10, cy + rPsi * Math.sin(-res.psi / 2));
        } else {
            ctx.arc(cx, cy, rPsi, 0, -res.psi);
            ctx.stroke();
            ctx.fillStyle = '#a855f7';
            ctx.fillText('ψ', cx + rPsi * Math.cos(-res.psi / 2) + 10, cy + rPsi * Math.sin(-res.psi / 2));
        }
    }

    // 5. Draw the Dynamic E-Vector Tip
    // Define direction based on S3:
    // positive S3 -> RCP (Right Circular Polarization) -> Clockwise rotation (when looking backward at incoming wave)
    // S3 < 0 -> CCW in standard optics, but Jackson convention often connects S3<0 to negative helicity and CW.
    // By using the physical phase expression: E_y = cos(wt - delta),
    // we trace the physically exact path for the observed electric field at z=0 over time.
    const wt = state.time * 2 * Math.PI * 0.5; // slow rotation (0.5 Hz)
    const currentEx = res.a1 * Math.cos(wt);
    const currentEy = res.a2 * Math.cos(wt - res.delta); // Note: -res.delta instead of +

    const tipX = cx + currentEx * scale;
    const tipY = cy - currentEy * scale;

    ctx.strokeStyle = '#f43f5e'; // Red vector
    ctx.setLineDash([]);
    ctx.lineWidth = 3;

    // Draw Arrow line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Draw Arrow head
    drawArrowHead(ctx, cx, cy, tipX, tipY, 10);

    // Draw Tracer dot
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
    ctx.fill();

    // 6. Draw indicating rotation direction
    if (Math.abs(state.S3) > 1e-4) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const arcR = targetSize * 0.3;

        // Draw an arc in the top-right quadrant
        const startRad = -Math.PI / 2 + 0.2; // roughly top
        const endRad = -0.2; // roughly right

        ctx.arc(cx, cy, arcR, startRad, endRad);
        ctx.stroke();

        // The physics: E_x = cos(wt), E_y = cos(wt - delta)
        // If delta > 0 (S3 > 0), E_y reaches peak after E_x -> so it moves x -> y. In x-y plane that's CCW.
        // Screen shows -y as UP. x is RIGHT.
        // Center -> Right -> Top. That's CCW on screen.
        // So S3 > 0 means CCW on screen. S3 < 0 means CW on screen.
        const isClockwiseScreen = state.S3 < 0;

        // Arrow head on arc depending on direction
        const tipA = isClockwiseScreen ? endRad : startRad;

        const hx = cx + arcR * Math.cos(tipA);
        const hy = cy + arcR * Math.sin(tipA);

        ctx.save();
        ctx.translate(hx, hy);
        // orient arrowhead tangent to the circle
        ctx.rotate(tipA + (isClockwiseScreen ? Math.PI / 2 : -Math.PI / 2));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-6, -6);
        ctx.lineTo(-6, 6);
        ctx.fill();
        ctx.restore();
    }
}

function drawArrowHead(ctx, x1, y1, x2, y2, size) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.translate(x2, y2);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size / 2);
    ctx.lineTo(-size, size / 2);
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.restore();
}

// Start
init();
