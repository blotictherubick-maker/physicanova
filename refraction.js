// refraction.js

const canvas = document.getElementById('refractionCanvas');
const ctx = canvas.getContext('2d');

let state = {
    na: 1.33,
    nb: 1.00,
    r: 0, // 0 means infinity (plane)
    s: 200,
    y: -40 // Object height (negative means below axis if we draw it horizontally)
};

const COLORS = {
    axis: 'rgba(255,255,255,0.2)',
    mediaA: 'rgba(56, 189, 248, 0.2)', // Water-like blue
    mediaB: 'rgba(255, 255, 255, 0.05)', // Air
    surfaceOutline: '#38bdf8',
    object: '#facc15', // yellow
    imageReal: '#22c55e', // green
    imageVirtual: '#f43f5e', // rose/red
    ray: '#ef4444',
    rayVirtual: 'rgba(239, 68, 68, 0.4)'
};

const els = {
    naSlider: document.getElementById('naSlider'),
    nbSlider: document.getElementById('nbSlider'),
    rSlider: document.getElementById('rSlider'),
    sSlider: document.getElementById('sSlider'),
    naDisplay: document.getElementById('naDisplay'),
    nbDisplay: document.getElementById('nbDisplay'),
    rDisplay: document.getElementById('rDisplay'),
    sDisplay: document.getElementById('sDisplay'),

    resS: document.getElementById('resS'),
    resSPrime: document.getElementById('resSPrime'),
    resType: document.getElementById('resType'),
    magLabel: document.getElementById('magLabel')
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

function init() {
    els.naSlider.addEventListener('input', (e) => {
        state.na = parseFloat(e.target.value);
        els.naDisplay.innerText = state.na.toFixed(2);
        updatePhysics();
    });

    els.nbSlider.addEventListener('input', (e) => {
        state.nb = parseFloat(e.target.value);
        els.nbDisplay.innerText = state.nb.toFixed(2);
        updatePhysics();
    });

    els.rSlider.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if (Math.abs(val) < 10) val = 0; // snap to plane
        state.r = val;
        els.rDisplay.innerText = val === 0 ? "Düzlem (∞)" : val;
        updatePhysics();
    });

    els.sSlider.addEventListener('input', (e) => {
        state.s = parseFloat(e.target.value);
        els.sDisplay.innerText = state.s.toFixed(0);
        updatePhysics();
    });

    resize();
    updatePhysics();
}

let calc = {
    sPrime: 0,
    m: 1,
    isReal: false
};

function updatePhysics() {
    // Equation: na / s + nb / s' = (nb - na) / r
    // If r = 0 -> plane surface -> (nb - na)/r = 0
    // nb / s' = - na / s => s' = -s * (nb / na)

    if (state.r === 0) {
        calc.sPrime = -state.s * (state.nb / state.na);
        calc.m = 1; // Lateral magnification for plane surface is 1
    } else {
        let rhs = (state.nb - state.na) / state.r;
        let lhs = state.na / state.s;
        let term = rhs - lhs;

        if (Math.abs(term) < 1e-6) {
            calc.sPrime = Infinity;
        } else {
            calc.sPrime = state.nb / term;
        }

        // m = -(na * s') / (nb * s)
        // Wait, text says:  m = -(na * s') / (nb * s)? Let me check the provided image.
        // The image says: Spherical Refracting Surface: m = - (na * s') / (nb * s). Yes!
        calc.m = -(state.na * calc.sPrime) / (state.nb * state.s);
    }

    if (Math.abs(calc.sPrime) > 10000) calc.sPrime = Infinity;
    calc.isReal = (calc.sPrime > 0 && calc.sPrime !== Infinity);

    updateUI();
    draw();
}

function updateUI() {
    els.resS.innerText = state.s.toFixed(1);

    if (calc.sPrime === Infinity) {
        els.resSPrime.innerText = "∞";
        els.resType.innerText = "Oluşmuyor (Sonsuzda)";
        els.resType.style.color = "#9da1b9";
        els.magLabel.innerText = "∞";
    } else {
        els.resSPrime.innerText = calc.sPrime.toFixed(1);
        els.magLabel.innerText = calc.m.toFixed(2);

        if (calc.isReal) {
            els.resType.innerText = "Gerçek Görüntü";
            els.resType.style.color = "var(--accent-green)";
        } else {
            els.resType.innerText = "Sanal Görüntü";
            if (state.r === 0) els.resType.innerText += " (Görünür Derinlik)";
            els.resType.style.color = "var(--accent-yellow)";
        }
    }
}

function getSurfaceX(y) {
    if (state.r === 0 || Math.abs(state.r) > 2000) return 0;
    // R > 0 means center of curvature is on OUTGOING side (right side).
    // So if R > 0, it's convex to incoming light, bulging left.
    // Equation of circle: (x - R)^2 + y^2 = R^2 => x = R - sqrt(R^2 - y^2) (for left side of circle)
    let r = state.r;
    let val = r * r - y * y;
    if (val < 0) return 0; // Prevent NaN
    return r - Math.sign(r) * Math.sqrt(val);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackgrounds();
    drawGrid();
    drawOpticAxis();
    drawSurface();
    drawObject();

    if (calc.sPrime !== Infinity) {
        drawRays();
        drawImage();
    }
}

function drawBackgrounds() {
    // Environment a is on the left, environment b is on the right
    // Draw left rectangle
    ctx.fillStyle = COLORS.mediaA;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // trace surface from top to bottom
    for (let y = -canvas.height / 2; y <= canvas.height / 2; y += 5) {
        let x = getSurfaceX(y);
        ctx.lineTo(originX + x, originY + y);
    }
    ctx.lineTo(0, canvas.height);
    ctx.fill();

    // Draw right rectangle
    ctx.fillStyle = COLORS.mediaB;
    ctx.beginPath();
    for (let y = -canvas.height / 2; y <= canvas.height / 2; y += 5) {
        let x = getSurfaceX(y);
        ctx.lineTo(originX + x, originY + y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(canvas.width, 0);
    ctx.fill();

    // Labels for media
    ctx.fillStyle = '#fff';
    ctx.font = '16px Inter';
    ctx.fillText(`Ortam a (n = ${state.na.toFixed(2)})`, 20, 30);
    ctx.fillText(`Ortam b (n = ${state.nb.toFixed(2)})`, originX + 20, 30);
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
    ctx.setLineDash([]);
}

function drawSurface() {
    ctx.strokeStyle = COLORS.surfaceOutline;
    ctx.lineWidth = 3;

    ctx.beginPath();
    for (let y = -canvas.height / 2; y <= canvas.height / 2; y += 2) {
        let x = getSurfaceX(y);
        if (y === -canvas.height / 2) ctx.moveTo(originX + x, originY + y);
        else ctx.lineTo(originX + x, originY + y);
    }
    ctx.stroke();

    if (state.r !== 0) {
        let cX = originX + state.r;
        ctx.fillStyle = COLORS.surfaceOutline;
        ctx.beginPath();
        ctx.arc(cX, originY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '14px Inter';
        ctx.fillText('C', cX - 5, originY + 20);
    }
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
    let imgX = originX + calc.sPrime;
    let yPrime = calc.m * state.y;
    let imgYTip = originY - yPrime;

    if (!calc.isReal) ctx.setLineDash([5, 3]);
    drawArrow(imgX, originY, imgYTip, calc.isReal ? COLORS.imageReal : COLORS.imageVirtual);
    ctx.setLineDash([]);

    ctx.fillStyle = calc.isReal ? COLORS.imageReal : COLORS.imageVirtual;
    let dir = yPrime > 0 ? 1 : -1;
    ctx.fillText('Görüntü', imgX - 25, imgYTip - dir * 15);
}

function drawRays() {
    let objX = originX - state.s;
    let objYTip = originY - state.y;

    let imgX = originX + calc.sPrime;
    let yPrime = calc.m * state.y;
    let imgYTip = originY - yPrime;

    // Ray 1: Paraxial ray hitting vertex
    ctx.strokeStyle = COLORS.ray;
    ctx.lineWidth = 1.5;

    let hitX = getSurfaceX(0); // slightly off origin if R is not 0? 0 if at axis.

    // draw to vertex
    ctx.beginPath();
    ctx.moveTo(objX, objYTip);
    ctx.lineTo(originX, originY);
    ctx.stroke();

    // draw refracted
    if (calc.isReal) {
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(imgX, imgYTip);
        ctx.stroke();

        // extend
        let m = (imgYTip - originY) / (imgX - originX);
        ctx.beginPath();
        ctx.moveTo(imgX, imgYTip);
        ctx.lineTo(imgX + 1000, imgYTip + 1000 * m);
        ctx.stroke();
    } else {
        // refracts out but appears from virtual image
        let m = (originY - imgYTip) / (originX - imgX);
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX + 1000, originY + 1000 * m);
        ctx.stroke();

        ctx.strokeStyle = COLORS.rayVirtual;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(imgX, imgYTip);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

// Start
init();
