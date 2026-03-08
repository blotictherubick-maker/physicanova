// lens_sim.js

const canvas = document.getElementById('lensCanvas');
const ctx = canvas.getContext('2d');

// State
let state = {
    lensType: 'converging', // 'converging', 'diverging'
    fAbs: 100, // Absolute focal length (pixels mapping)
    s: 200,    // Object distance from vertex (lens center)
    y: 60,     // Object height

    // Dragging state
    isDragging: false,
    dragType: null // 'object' for s adjustment
};

// Colors for rays
const COLORS = {
    axis: 'rgba(255,255,255,0.2)',
    lens: 'rgba(125, 211, 252, 0.5)', // light blue glass
    lensOutline: '#38bdf8',
    object: '#facc15', // yellow
    imageReal: '#22c55e', // green
    imageVirtual: '#f43f5e', // rose/red
    ray1: '#ef4444', // red (parallel)
    ray1Virtual: 'rgba(239, 68, 68, 0.4)',
    ray2: '#3b82f6', // blue (focal)
    ray2Virtual: 'rgba(59, 130, 246, 0.4)',
    ray3: '#10b981', // green (vertex/center)
    ray3Virtual: 'rgba(16, 185, 129, 0.4)'
};

// UI Elements
const els = {
    typeRadios: document.querySelectorAll('input[name="lensType"]'),
    focalSlider: document.getElementById('focalSlider'),
    sSlider: document.getElementById('sSlider'),
    ySlider: document.getElementById('ySlider'),
    focalDisplay: document.getElementById('focalDisplay'),
    sDisplay: document.getElementById('sDisplay'),
    yDisplay: document.getElementById('yDisplay'),

    // Results
    resF: document.getElementById('resF'),
    resS: document.getElementById('resS'),
    resSPrime: document.getElementById('resSPrime'),
    resType: document.getElementById('resType'),
    resYPrime: document.getElementById('resYPrime'),
    magLabel: document.getElementById('magLabel')
};

// Convert canvas coords to physics coords
// Origin (0,0) is at the center of the lens
let originX = 0;
let originY = 0;

function resize() {
    const parent = canvas.parentElement;
    if (parent.clientWidth === 0 || parent.clientHeight === 0) return;

    // Yüksek çözünürlüklü ekranlar (Retina vb.) için DPI ayarı
    const dpr = window.devicePixelRatio || 1;
    canvas.width = parent.clientWidth * dpr;
    canvas.height = parent.clientHeight * dpr;
    canvas.style.width = `${parent.clientWidth}px`;
    canvas.style.height = `${parent.clientHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Sağ taraftaki UI panelini hesaba katarak merkezleme
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
    // Bind events
    els.typeRadios.forEach(r => r.addEventListener('change', (e) => {
        state.lensType = e.target.value;
        updatePhysics();
    }));

    els.focalSlider.addEventListener('input', (e) => {
        state.fAbs = parseFloat(e.target.value);
        els.focalDisplay.innerText = state.fAbs;
        updatePhysics();
    });

    els.sSlider.addEventListener('input', (e) => {
        state.s = parseFloat(e.target.value);
        els.sDisplay.innerText = state.s;
        updatePhysics();
    });

    els.ySlider.addEventListener('input', (e) => {
        state.y = parseFloat(e.target.value);
        els.yDisplay.innerText = state.y;
        updatePhysics();
    });

    // Canvas dragging
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Touch support for dragging
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    // Force initial resize attempt
    resize();
    updatePhysics();
}

// Drag interactions
function isPointInObject(mouseX, mouseY) {
    const objX = originX - state.s;
    const objYTop = originY - state.y;

    const hitRadiusX = 15;

    return Math.abs(mouseX - objX) < hitRadiusX &&
        ((state.y >= 0 && mouseY <= originY && mouseY >= objYTop) ||
            (state.y < 0 && mouseY >= originY && mouseY <= objYTop));
}

function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isPointInObject(mouseX, mouseY)) {
        state.isDragging = true;
        state.dragType = 'object';
        canvas.style.cursor = 'grabbing';
    }
}

function handleTouchStart(e) {
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.touches[0].clientX - rect.left;
        const mouseY = e.touches[0].clientY - rect.top;
        if (isPointInObject(mouseX, mouseY)) {
            state.isDragging = true;
            state.dragType = 'object';
            e.preventDefault();
        }
    }
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (!state.isDragging) {
        if (isPointInObject(mouseX, mouseY)) {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = 'default';
        }
        return;
    }

    if (state.dragType === 'object') {
        let newS = originX - mouseX;
        newS = Math.max(10, Math.min(newS, originX - 50));

        let newY = originY - mouseY;
        newY = Math.max(-150, Math.min(newY, 150));

        state.s = Math.round(newS);
        state.y = Math.round(newY);

        els.sSlider.value = state.s;
        els.sDisplay.innerText = state.s;
        els.ySlider.value = state.y;
        els.yDisplay.innerText = state.y;

        updatePhysics();
    }
}

function handleTouchMove(e) {
    if (state.isDragging && e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.touches[0].clientX - rect.left;
        const mouseY = e.touches[0].clientY - rect.top;

        let newS = originX - mouseX;
        newS = Math.max(10, Math.min(newS, originX - 50));
        let newY = originY - mouseY;
        newY = Math.max(-150, Math.min(newY, 150));

        state.s = Math.round(newS);
        state.y = Math.round(newY);

        els.sSlider.value = state.s;
        els.sDisplay.innerText = state.s;
        els.ySlider.value = state.y;
        els.yDisplay.innerText = state.y;

        updatePhysics();
        e.preventDefault();
    }
}

// Physics logic
let calc = {
    f: 0,
    sPrime: 0,
    m: 0,
    yPrime: 0,
    isReal: true
};

function updatePhysics() {
    // Thin lens formula: 1/s + 1/s' = 1/f
    // Converging: f > 0
    // Diverging: f < 0

    if (state.lensType === 'converging') {
        calc.f = state.fAbs;
    } else {
        calc.f = -state.fAbs;
    }

    // sPrime = sf / (s - f)
    if (state.s === calc.f) {
        calc.sPrime = Infinity;
        calc.m = Infinity;
    } else {
        calc.sPrime = 1 / ((1 / calc.f) - (1 / state.s));
        // lateral mag m = -s'/s for lenses too? Yes, y'/y = -s'/s. Wait, for lenses, if real image (s'>0), m < 0 so inverted.
        // Yes, m = -s'/s is true.
        calc.m = -calc.sPrime / state.s;
    }

    if (Math.abs(calc.sPrime) > 10000) calc.sPrime = Infinity;

    calc.yPrime = calc.m * state.y;
    calc.isReal = (calc.sPrime > 0 && calc.sPrime !== Infinity);

    updateUI();
    draw();
}

function updateUI() {
    els.resF.innerText = calc.f.toFixed(1);
    els.resS.innerText = state.s.toFixed(1);

    if (calc.sPrime === Infinity) {
        els.resSPrime.innerText = "∞";
        els.resYPrime.innerText = "∞";
        els.resType.innerText = "Oluşmuyor / Sonsuzda";
        els.resType.style.color = "#9da1b9";
        els.magLabel.innerText = "∞";
    } else {
        els.resSPrime.innerText = calc.sPrime.toFixed(1);
        els.resYPrime.innerText = calc.yPrime.toFixed(1);
        els.magLabel.innerText = calc.m.toFixed(2);

        let typeStr = calc.isReal ? "Gerçek" : "Sanal";
        let orientationStr = calc.m > 0 ? "Düz" : "Ters";
        let color = calc.isReal ? "var(--accent-green)" : "var(--accent-red)";

        els.resType.innerText = `${typeStr}, ${orientationStr}`;
        els.resType.style.color = color;
    }
}

// Drawing logic
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawOpticAxis();
    drawLens();
    drawPoints();
    drawObject();

    if (calc.sPrime !== Infinity) {
        drawRays();
        drawImage();
    }
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
    // vertical lens axis
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawLens() {
    // Draw lens shape
    let h = 200; // Half height of lens
    let w = 40;  // Half width of lens

    ctx.fillStyle = COLORS.lens;
    ctx.strokeStyle = COLORS.lensOutline;
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (state.lensType === 'converging') {
        // Bi-convex
        ctx.moveTo(originX, originY - h);
        ctx.quadraticCurveTo(originX + w, originY, originX, originY + h);
        ctx.quadraticCurveTo(originX - w, originY, originX, originY - h);
    } else {
        // Bi-concave
        w = 20;
        let edgeW = 40;
        ctx.moveTo(originX - w, originY - h);
        ctx.lineTo(originX + w, originY - h);
        ctx.quadraticCurveTo(originX + edgeW / 4, originY, originX + w, originY + h);
        ctx.lineTo(originX - w, originY + h);
        ctx.quadraticCurveTo(originX - edgeW / 4, originY, originX - w, originY - h);
    }
    ctx.fill();
    ctx.stroke();
}

function drawPoints() {
    let focus1X = originX - Math.abs(calc.f); // Primary focal point for rays arriving from left
    let focus2X = originX + Math.abs(calc.f);

    ctx.fillStyle = COLORS.lensOutline;

    // F1
    ctx.beginPath();
    ctx.arc(focus1X, originY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '14px Inter';
    ctx.fillText('F1', focus1X - 5, originY + 20);

    // F2
    ctx.beginPath();
    ctx.arc(focus2X, originY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('F2', focus2X - 5, originY + 20);
}

function drawArrow(xBase, yBase, yTip, color, width = 3) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(xBase, yBase);
    ctx.lineTo(xBase, yTip);
    ctx.stroke();

    let headSize = 10;
    let dir = yTip < yBase ? 1 : -1;

    ctx.beginPath();
    ctx.moveTo(xBase, yTip);
    ctx.lineTo(xBase - headSize / 2, yTip + dir * headSize);
    ctx.lineTo(xBase + headSize / 2, yTip + dir * headSize);
    ctx.fill();
}

function drawObject() {
    let objX = originX - state.s;
    drawArrow(objX, originY, originY - state.y, COLORS.object);

    ctx.fillStyle = COLORS.object;
    let dir = state.y > 0 ? 1 : -1;
    ctx.fillText('Cisim', objX - 15, originY - state.y - dir * 15);
}

function drawImage() {
    let imgX = originX + calc.sPrime; // Important: for lens, s' > 0 is on the right
    let imgYTip = originY - calc.yPrime;

    if (!calc.isReal) ctx.setLineDash([5, 3]);
    drawArrow(imgX, originY, imgYTip, calc.isReal ? COLORS.imageReal : COLORS.imageVirtual);
    ctx.setLineDash([]);

    ctx.fillStyle = calc.isReal ? COLORS.imageReal : COLORS.imageVirtual;
    let dir = calc.yPrime > 0 ? 1 : -1;
    ctx.fillText('Görüntü', imgX - 25, imgYTip - dir * 15);
}

function drawLine(x1, y1, x2, y2, color, isDashed = false) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    if (isDashed) ctx.setLineDash([5, 5]);
    else ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawRays() {
    let objX = originX - state.s;
    let objYTip = originY - state.y;

    let imgX = originX + calc.sPrime;
    let imgYTip = originY - calc.yPrime;

    // Ray 1: Parallel to principal axis -> Refracts through Focus F2 (or appears from F1 if diverging)
    let hit1Y = objYTip;
    drawLine(objX, objYTip, originX, hit1Y, COLORS.ray1);

    if (state.lensType === 'converging') {
        let focus2X = originX + calc.f;

        let m1 = (originY - hit1Y) / (focus2X - originX);
        if (calc.isReal) {
            drawLine(originX, hit1Y, originX + 2000, hit1Y + 2000 * m1, COLORS.ray1);
        } else {
            drawLine(originX, hit1Y, originX + 2000, hit1Y + 2000 * m1, COLORS.ray1);
            drawLine(originX, hit1Y, originX - 2000, hit1Y - 2000 * m1, COLORS.ray1Virtual, true);
        }
    } else {
        // Diverging: Appears to come from F1 (focus1X)
        let focus1X = originX - Math.abs(calc.f);
        let m1 = (hit1Y - originY) / (originX - focus1X);
        // actual ray refracts outwards
        drawLine(originX, hit1Y, originX + 2000, hit1Y + 2000 * m1, COLORS.ray1);
        // virtual extension to F1
        drawLine(originX, hit1Y, originX - 2000, hit1Y - 2000 * m1, COLORS.ray1Virtual, true);
    }

    // Ray 2: Through optical center (V) -> straight through
    let m2 = (originY - objYTip) / (originX - objX);
    drawLine(objX, objYTip, originX, originY, COLORS.ray2);

    if (calc.isReal) {
        drawLine(originX, originY, originX + 1000, originY + 1000 * m2, COLORS.ray2);
    } else {
        drawLine(originX, originY, originX + 1000, originY + 1000 * m2, COLORS.ray2);
        drawLine(originX, originY, originX - 1000, originY - 1000 * m2, COLORS.ray2Virtual, true);
    }
}

// Start
init();
