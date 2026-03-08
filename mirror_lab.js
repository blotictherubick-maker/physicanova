// Physics Canvas Engine for Mirror Lab

const canvas = document.getElementById('mirrorCanvas');
const ctx = canvas.getContext('2d');

// State
let state = {
    mirrorType: 'concave', // 'concave', 'convex', 'plane'
    fAbs: 100, // Absolute focal length (pixels mapping)
    s: 150,    // Object distance from vertex
    y: 50,     // Object height

    // Dragging state
    isDragging: false,
    dragType: null // 'object' for s adjustment
};

// Colors for rays
const COLORS = {
    axis: 'rgba(255,255,255,0.2)',
    mirror: '#38bdf8',
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
    typeRadios: document.querySelectorAll('input[name="mirrorType"]'),
    focalSlider: document.getElementById('focalSlider'),
    sSlider: document.getElementById('sSlider'),
    ySlider: document.getElementById('ySlider'),
    focalDisplay: document.getElementById('focalDisplay'),
    sDisplay: document.getElementById('sDisplay'),
    yDisplay: document.getElementById('yDisplay'),
    focalControl: document.getElementById('focalLengthControl'),

    // Results
    resF: document.getElementById('resF'),
    resR: document.getElementById('resR'),
    resS: document.getElementById('resS'),
    resSPrime: document.getElementById('resSPrime'),
    resType: document.getElementById('resType'),
    resYPrime: document.getElementById('resYPrime'),
    magLabel: document.getElementById('magLabel')
};

// Convert canvas coords to physics coords
// Origin (0,0) is at the vertex (center of canvas horizontally, somewhat middle vertically)
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

    // Sağ taraftaki UI panel etkisini düşürüp aynayı biraz sağda konumlandırma
    let panelWidth = window.innerWidth >= 1024 ? 350 : 0;
    originX = (parent.clientWidth - panelWidth) * 0.5 + 50;
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
        state.mirrorType = e.target.value;
        if (state.mirrorType === 'plane') {
            els.focalControl.style.opacity = '0.3';
            els.focalSlider.disabled = true;
        } else {
            els.focalControl.style.opacity = '1';
            els.focalSlider.disabled = false;
        }
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

    resize();
    updatePhysics();
}

// Drag interactions
function isPointInObject(mouseX, mouseY) {
    const objX = originX - state.s;
    const objYTop = originY - state.y;

    const hitRadiusX = 15;

    // Check if mouse is near the object arrow
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
            e.preventDefault(); // Prevent scrolling
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
        // Find new s (distance from vertex)
        let newS = originX - mouseX;
        // Clamp it
        newS = Math.max(10, Math.min(newS, originX - 50));

        // Find new y
        let newY = originY - mouseY;
        newY = Math.max(-150, Math.min(newY, 150));

        state.s = Math.round(newS);
        state.y = Math.round(newY);

        // Update sliders visually
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

function handleMouseUp() {
    state.isDragging = false;
    state.dragType = null;
    canvas.style.cursor = 'default';
}

// Physics logic
let calc = {
    f: 0,
    r: 0,
    sPrime: 0,
    m: 0,
    yPrime: 0,
    isReal: true
};

function updatePhysics() {
    // 1/s + 1/s' = 1/f
    // Concave: f > 0, r > 0
    // Convex: f < 0, r < 0
    // Plane: f = Infinity, r = Infinity

    if (state.mirrorType === 'concave') {
        calc.f = state.fAbs;
    } else if (state.mirrorType === 'convex') {
        calc.f = -state.fAbs;
    } else {
        calc.f = Infinity;
    }
    calc.r = calc.f * 2;

    if (calc.f === Infinity) {
        // Plane mirror
        calc.sPrime = -state.s;
        calc.m = 1;
    } else {
        // Spherical
        if (state.s === calc.f) {
            calc.sPrime = Infinity;
            calc.m = Infinity;
        } else {
            calc.sPrime = 1 / ((1 / calc.f) - (1 / state.s));
            calc.m = -calc.sPrime / state.s;
        }
    }
    // Very large sPrime check
    if (Math.abs(calc.sPrime) > 10000) calc.sPrime = Infinity;

    calc.yPrime = calc.m * state.y;
    calc.isReal = (calc.sPrime > 0 && calc.sPrime !== Infinity);

    updateUI();
    draw();
}

function updateUI() {
    if (calc.f === Infinity) {
        els.resF.innerText = "∞";
        els.resR.innerText = "∞";
    } else {
        els.resF.innerText = calc.f.toFixed(1);
        els.resR.innerText = calc.r.toFixed(1);
    }

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
        let orientationStr = calc.yPrime * state.y > 0 ? "Düz" : "Ters"; // if same sign, erect. But actually m = y'/y. if m>0 erect, m<0 inverted
        orientationStr = calc.m > 0 ? "Düz" : "Ters";

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
    drawMirror();

    if (calc.f !== Infinity) {
        drawPoints();
    }

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
    ctx.setLineDash([]);
}

function drawMirror() {
    ctx.strokeStyle = COLORS.mirror;
    ctx.lineWidth = 4;
    ctx.beginPath();

    const h = 250; // half-height of mirror

    if (state.mirrorType === 'plane') {
        ctx.moveTo(originX, originY - h);
        ctx.lineTo(originX, originY + h);
        ctx.stroke();

        // draw hash marks backwards
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        for (let y = originY - h + 10; y < originY + h; y += 20) {
            ctx.beginPath();
            ctx.moveTo(originX, y);
            ctx.lineTo(originX + 15, y - 10);
            ctx.stroke();
        }
    } else {
        // Curve approximation with bezier
        // R is calc.r. If Concave, R > 0, center is on left (originX - R). Mirror bulges to right.
        // Wait, standard concave bulges away from light. Light comes from left. So surface bows left (center of curvature on left).

        let cx, cy = originY;
        let R = Math.abs(calc.r);

        // if large R, approximate
        if (R > 2000) R = 2000;

        if (state.mirrorType === 'concave') {
            // center on left
            ctx.arc(originX - R, originY, R, -Math.asin(h / R), Math.asin(h / R));
        } else {
            // convex, center on right
            ctx.arc(originX + R, originY, R, Math.PI - Math.asin(h / R), Math.PI + Math.asin(h / R), true);
        }
        ctx.stroke();

        // Hashes for non-reflective side
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;

        for (let i = -h + 10; i < h; i += 20) {
            let angle = Math.asin(i / R);
            let pX, pY;

            if (state.mirrorType === 'concave') {
                pX = (originX - R) + R * Math.cos(angle);
                pY = originY + i;
                ctx.beginPath();
                ctx.moveTo(pX, pY);
                // point right-up
                ctx.lineTo(pX + 15, pY - 10);
                ctx.stroke();
            } else {
                pX = (originX + R) - R * Math.cos(angle);
                pY = originY + i;
                ctx.beginPath();
                ctx.moveTo(pX, pY);
                // point right-up
                ctx.lineTo(pX + 15, pY - 10);
                ctx.stroke();
            }
        }
    }
}

function drawPoints() {
    let focusX = originX - calc.f;
    let centerX = originX - calc.r;

    ctx.fillStyle = COLORS.mirror;

    // Focus F
    ctx.beginPath();
    ctx.arc(focusX, originY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '14px Inter';
    ctx.fillText('F', focusX - 5, originY + 20);

    // Center C
    ctx.beginPath();
    ctx.arc(centerX, originY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('C', centerX - 5, originY + 20);
}

function drawArrow(xBase, yBase, yTip, color, width = 3) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(xBase, yBase);
    ctx.lineTo(xBase, yTip);
    ctx.stroke();

    // Arrow head
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

    // object text
    ctx.fillStyle = COLORS.object;
    let dir = state.y > 0 ? 1 : -1;
    ctx.fillText('Cisim', objX - 15, originY - state.y - dir * 15);
}

function drawImage() {
    let imgX = originX - calc.sPrime;
    let imgYTip = originY - calc.yPrime;

    // Use dashed line if virtual
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

    let imgX = originX - calc.sPrime;
    let imgYTip = originY - calc.yPrime;

    // Ray 1: Parallel to axis -> Through Focus
    // Hits mirror at (originX, objYTip) approx. (we ignore paraxial curve offset for drawing clarity)
    let hit1Y = objYTip;
    drawLine(objX, objYTip, originX, hit1Y, COLORS.ray1);

    if (calc.sPrime === Infinity) return;

    if (calc.f !== Infinity) {
        let focusX = originX - calc.f;

        let dx = (focusX - originX);
        let dy = (originY - hit1Y);
        // line is from (originX, hit1Y) passing through (imgX, imgYTip)

        if (calc.isReal) {
            // Reflects to real image, drawn long
            drawLine(originX, hit1Y, originX - 1000, hit1Y - 1000 * (imgYTip - hit1Y) / (imgX - originX), COLORS.ray1);
        } else {
            // Reflects to left, extends to right as virtual
            drawLine(originX, hit1Y, originX - 1000, hit1Y - 1000 * (imgYTip - hit1Y) / (imgX - originX), COLORS.ray1);
            drawLine(originX, hit1Y, originX + 1000, hit1Y + 1000 * (imgYTip - hit1Y) / (imgX - originX), COLORS.ray1Virtual, true);
        }
    } else {
        // Plane mirror, ray1 reflects back parallel to itself? No, normal to plane mirror.
        // It hits mirror perpendicularly, so it reflects right back.
        // It appears to come from image? No, parallel ray hits normal to mirror, reflects back.
        // Actually, for plane mirrors, usually we trace ray to vertex, and ray parallel. If parallel, it reflects back on itself, virtual extension goes straight through.
        drawLine(originX, hit1Y, originX - 1000, hit1Y, COLORS.ray1);
        drawLine(originX, hit1Y, originX + 1000, hit1Y, COLORS.ray1Virtual, true);
    }

    // Ray 2: Ray via Center of curvature (R)
    if (calc.f !== Infinity) {
        let hit2Y;
        // The ray from object tip to Center (originX - R)
        // If concave, C is on left. 
        if (state.mirrorType === 'concave') {
            // Line: passes originX - R, originY and objX, objYTip
            let mLine = (originY - objYTip) / ((originX - calc.r) - objX);
            hit2Y = objYTip + mLine * (originX - objX);

            if (calc.isReal) {
                drawLine(objX, objYTip, originX, hit2Y, COLORS.ray3);
                drawLine(originX, hit2Y, originX - 1000, hit2Y - 1000 * mLine, COLORS.ray3);
            } else {
                drawLine(objX, objYTip, originX, hit2Y, COLORS.ray3);
                drawLine(originX, hit2Y, originX - 1000, hit2Y - 1000 * mLine, COLORS.ray3);
                drawLine(originX, hit2Y, originX + 1000, hit2Y + 1000 * mLine, COLORS.ray3Virtual, true);
            }
        } else if (state.mirrorType === 'convex') {
            // Center is on right
            let mLine = (originY - objYTip) / ((originX - calc.r) - objX);
            hit2Y = objYTip + mLine * (originX - objX); // approx intersection
            drawLine(objX, objYTip, originX, hit2Y, COLORS.ray3);

            // Reflects back
            drawLine(originX, hit2Y, originX - 1000, hit2Y + 1000 * mLine, COLORS.ray3);
            // Virtual extension to C
            drawLine(originX, hit2Y, originX - calc.r, originY, COLORS.ray3Virtual, true);
        }
    } else {
        // Plane mirror: draw ray to vertex
        drawLine(objX, objYTip, originX, originY, COLORS.ray3);
        // reflects down
        drawLine(originX, originY, originX - 1000, originY + 1000 * (originY - objYTip) / (originX - objX), COLORS.ray3);
        // virtual extension
        drawLine(originX, originY, originX + 1000, originY - 1000 * (originY - objYTip) / (originX - objX), COLORS.ray3Virtual, true);
    }
}

// Start
init();
