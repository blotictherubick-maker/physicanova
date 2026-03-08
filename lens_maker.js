// lens_maker.js

const canvas = document.getElementById('lensmakerCanvas');
const ctx = canvas.getContext('2d');

// State
let state = {
    n: 1.5,
    r1: 200, // + is convex to left (center on right)
    r2: -200, // - is convex to right (center on left)
    thickness: 40, // center thickness for drawing
    lensHeight: 150
};

// Colors
const COLORS = {
    axis: 'rgba(255,255,255,0.2)',
    lens: 'rgba(125, 211, 252, 0.4)',
    lensOutline: '#38bdf8',
    ray: 'rgba(239, 68, 68, 0.6)',
    rayHover: '#ef4444',
    focalPoint: '#eab308'
};

// UI Elements
const els = {
    nSlider: document.getElementById('nSlider'),
    r1Slider: document.getElementById('r1Slider'),
    r2Slider: document.getElementById('r2Slider'),
    nDisplay: document.getElementById('nDisplay'),
    r1Display: document.getElementById('r1Display'),
    r2Display: document.getElementById('r2Display'),

    // Results
    resRadiusTerm: document.getElementById('resRadiusTerm'),
    resNTerm: document.getElementById('resNTerm'),
    resF: document.getElementById('resF'),
    resType: document.getElementById('resType')
};

let originX = 0;
let originY = 0;

function resize() {
    const parent = canvas.parentElement;
    if (parent.clientWidth === 0 || parent.clientHeight === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = parent.clientWidth * dpr;
    canvas.height = parent.clientHeight * dpr;
    canvas.style.width = `${parent.clientWidth}px`;
    canvas.style.height = `${parent.clientHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let panelWidth = window.innerWidth >= 1024 ? 350 : 0;
    originX = (parent.clientWidth - panelWidth) * 0.5;
    originY = parent.clientHeight * 0.5;

    draw();
}

const resizeObserver = new ResizeObserver(() => {
    resize();
});
resizeObserver.observe(canvas.parentElement);

// Initialization
function init() {
    els.nSlider.addEventListener('input', (e) => {
        state.n = parseFloat(e.target.value);
        els.nDisplay.innerText = state.n.toFixed(2);
        updatePhysics();
    });

    els.r1Slider.addEventListener('input', (e) => {
        state.r1 = parseInt(e.target.value);
        if (state.r1 === 0) { state.r1 = 10000; els.r1Slider.value = 10000; } // Prevent 0, treat as plane
        els.r1Display.innerText = Math.abs(state.r1) > 2000 ? "∞" : state.r1;
        updatePhysics();
    });

    els.r2Slider.addEventListener('input', (e) => {
        state.r2 = parseInt(e.target.value);
        if (state.r2 === 0) { state.r2 = 10000; els.r2Slider.value = 10000; }
        els.r2Display.innerText = Math.abs(state.r2) > 2000 ? "∞" : state.r2;
        updatePhysics();
    });

    // Check initial zero values
    if (state.r1 === 0) state.r1 = 0.001;
    if (state.r2 === 0) state.r2 = 0.001;

    resize();
    updatePhysics();
}

let calc = {
    f: 0,
    termRadius: 0,
    termN: 0
};

function updatePhysics() {
    // 1/f = (n - 1) * (1/R1 - 1/R2)
    let r1Effective = Math.abs(state.r1) > 2000 ? Infinity : state.r1;
    let r2Effective = Math.abs(state.r2) > 2000 ? Infinity : state.r2;

    let invR1 = r1Effective === Infinity ? 0 : 1 / r1Effective;
    let invR2 = r2Effective === Infinity ? 0 : 1 / r2Effective;

    calc.termRadius = invR1 - invR2;
    calc.termN = state.n - 1;

    let invF = calc.termN * calc.termRadius;

    if (Math.abs(invF) < 1e-6) {
        calc.f = Infinity;
    } else {
        calc.f = 1 / invF;
    }

    // Prevent lens height from exceeding surface radius
    let minR = Math.min(Math.abs(state.r1), Math.abs(state.r2));
    if (minR < 2000) {
        state.lensHeight = Math.min(150, minR - 5);
    } else {
        state.lensHeight = 150;
    }

    updateUI();
    draw();
}

function updateUI() {
    els.resRadiusTerm.innerText = calc.termRadius.toFixed(4);
    els.resNTerm.innerText = calc.termN.toFixed(2);

    if (calc.f === Infinity) {
        els.resF.innerText = "Sonsuz (∞)";
        els.resType.innerText = "Düz Cam / Pencere";
        els.resType.style.color = "#9da1b9";
    } else {
        els.resF.innerText = calc.f.toFixed(1);
        if (calc.f > 0) {
            els.resType.innerText = "Yakınsak Mercek (Toplayıcı)";
            els.resType.style.color = "var(--accent-green)";
        } else {
            els.resType.innerText = "Iraksak Mercek (Dağıtıcı)";
            els.resType.style.color = "var(--accent-red)";
        }
    }
}

// Surface shape x(y)
function getX1(y) {
    if (Math.abs(state.r1) > 2000) return -state.thickness / 2;
    let r = state.r1;
    return -state.thickness / 2 + r - Math.sign(r) * Math.sqrt(r * r - y * y);
}

function getX2(y) {
    if (Math.abs(state.r2) > 2000) return state.thickness / 2;
    let r = state.r2;
    return state.thickness / 2 + r - Math.sign(r) * Math.sqrt(r * r - y * y);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawOpticAxis();
    drawRays(); // Draw rays behind lens or in front depending on style
    drawLens();
    drawFocalPoint();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const spacing = 50;

    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += spacing) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y < canvas.height; y += spacing) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
}

function drawOpticAxis() {
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(canvas.width, originY);
    ctx.stroke();

    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(originX, originY - 200);
    ctx.lineTo(originX, originY + 200);
    ctx.stroke();

    ctx.setLineDash([]);
}

function drawLens() {
    ctx.fillStyle = COLORS.lens;
    ctx.strokeStyle = COLORS.lensOutline;
    ctx.lineWidth = 2;

    ctx.beginPath();

    // Top to bottom for surface 1
    for (let y = -state.lensHeight; y <= state.lensHeight; y += 2) {
        let x = getX1(y);
        if (y === -state.lensHeight) ctx.moveTo(originX + x, originY + y);
        else ctx.lineTo(originX + x, originY + y);
    }

    // Bottom to top for surface 2
    for (let y = state.lensHeight; y >= -state.lensHeight; y -= 2) {
        let x = getX2(y);
        ctx.lineTo(originX + x, originY + y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawFocalPoint() {
    if (calc.f === Infinity) return;

    let fX = originX + calc.f; // focal point on right

    ctx.fillStyle = COLORS.focalPoint;
    ctx.beginPath();
    ctx.arc(fX, originY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '14px Inter';
    ctx.fillText('f', fX - 5, originY + 20);

    // Also draw F' on left side
    let fXY = originX - calc.f;
    ctx.fillStyle = COLORS.focalPoint;
    ctx.beginPath();
    ctx.arc(fXY, originY, 4, 0, Math.PI * 2);
    ctx.fill();
}

// Vector math for ray tracing
function normalize(v) {
    let mag = Math.sqrt(v.x * v.x + v.y * v.y);
    return { x: v.x / mag, y: v.y / mag };
}

function dotProduct(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
}

// Snell's law vector form
// n1 * sin(theta1) = n2 * sin(theta2)
// i = incoming vector (normalized), n = normal vector (normalized, pointing against i)
function refract(i, n, n1, n2) {
    let rRatio = n1 / n2;
    let cosI = -dotProduct(i, n);
    let sinT2Sq = rRatio * rRatio * (1 - cosI * cosI);

    if (sinT2Sq > 1) {
        // Total internal reflection
        return null;
    }

    let cosT = Math.sqrt(1 - sinT2Sq);
    return {
        x: rRatio * i.x + (rRatio * cosI - cosT) * n.x,
        y: rRatio * i.y + (rRatio * cosI - cosT) * n.y
    };
}

function drawRays() {
    let numRays = 15;
    let step = (state.lensHeight * 0.8) * 2 / (numRays - 1);

    ctx.lineWidth = 1.5;

    for (let i = 0; i < numRays; i++) {
        let yStart = -state.lensHeight * 0.8 + i * step;
        if (Math.abs(yStart) < 1) yStart = 0; // ensure center ray is exact

        ctx.strokeStyle = (yStart === 0) ? '#fff' : COLORS.ray;

        // Ray starts on left, parallel to axis
        let rx = 0;
        let ry = yStart;

        // Intersection with Surface 1
        let hit1X = getX1(ry);
        let intersection1 = { x: originX + hit1X, y: originY + ry };

        ctx.beginPath();
        ctx.moveTo(rx, originY + ry);
        ctx.lineTo(intersection1.x, intersection1.y);
        ctx.stroke();

        // Normal at Surface 1
        let n1;
        if (Math.abs(state.r1) > 2000) {
            n1 = { x: -1, y: 0 }; // Plane surface normal points left
        } else {
            let cx = state.r1; // center relative to vertex
            let cXGlobal = originX - state.thickness / 2 + cx;
            // Normal points outwards from surface. For a spherical lens, it depends.
            // Vector from Center to Surface:
            let v = { x: intersection1.x - cXGlobal, y: intersection1.y - originY };
            v = normalize(v);
            // Light comes from left. Normal should point to the left (against incoming ray)
            if (v.x > 0) { v.x = -v.x; v.y = -v.y; }
            n1 = v;
        }

        let incRay1 = { x: 1, y: 0 };
        let refracted1 = refract(incRay1, n1, 1.0, state.n);

        if (!refracted1) continue; // TIR 

        // Ray travels inside lens and hits Surface 2
        // We will approximate the intersection with Surface 2 using small steps
        let curr = { x: hit1X, y: ry };
        let stepSize = 1;

        let hit2 = null;
        for (let s = 0; s < state.thickness + 50; s++) {
            curr.x += refracted1.x * stepSize;
            curr.y += refracted1.y * stepSize;

            let surf2X = getX2(curr.y);
            if (curr.x >= surf2X) {
                // Hit!
                hit2 = curr;
                break;
            }
        }

        if (!hit2) continue; // Missed surface 2?

        let intersection2 = { x: originX + hit2.x, y: originY + hit2.y };

        ctx.beginPath();
        ctx.moveTo(intersection1.x, intersection1.y);
        ctx.lineTo(intersection2.x, intersection2.y);
        ctx.stroke();

        // Refraction 2
        let n2;
        if (Math.abs(state.r2) > 2000) {
            n2 = { x: -1, y: 0 }; // Note: normal should point against internal ray. Internal goes right, so normal left.
        } else {
            let cx2 = state.r2;
            let cXGlobal2 = originX + state.thickness / 2 + cx2;
            let v2 = { x: intersection2.x - cXGlobal2, y: intersection2.y - originY };
            v2 = normalize(v2);
            // normal against ray
            if (dotProduct(v2, refracted1) > 0) {
                v2.x = -v2.x; v2.y = -v2.y;
            }
            n2 = v2;
        }

        let refracted2 = refract(refracted1, n2, state.n, 1.0);

        if (refracted2) {
            ctx.beginPath();
            ctx.moveTo(intersection2.x, intersection2.y);
            ctx.lineTo(intersection2.x + refracted2.x * 2000, intersection2.y + refracted2.y * 2000);
            ctx.stroke();

            // if diverging, trace backward
            if (calc.f < 0) {
                ctx.strokeStyle = COLORS.rayHover;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(intersection2.x, intersection2.y);
                ctx.lineTo(intersection2.x - refracted2.x * 2000, intersection2.y - refracted2.y * 2000);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }
}

// Start
init();
