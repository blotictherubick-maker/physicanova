const canvas = document.getElementById('fermatCanvas');
const ctx = canvas.getContext('2d');

// Configure canvas resolution
function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    // Set a good aspect ratio (e.g., 21:9 or similar for wide look, let's use 2:1)
    canvas.height = canvas.width * 0.5;
}

window.addEventListener('resize', () => { resizeCanvas(); draw(); });
resizeCanvas(); // initial sizing

// State
let v1 = 2.0;
let v2 = 1.0;

// Coordinate system mapped to 0-1 relative to canvas
const startRel = { x: 0.15, y: 0.2 }; // Cankurtaran
const endRel = { x: 0.85, y: 0.8 }; // Boğulan Kişi
const boundaryYRel = 0.5;

let pointXRel = 0.5; // Drag point initial x
let isDragging = false;
let hasInteracted = false;

// DOM Elements
const v1Slider = document.getElementById('v1Slider');
const v2Slider = document.getElementById('v2Slider');
const v1Display = document.getElementById('v1Display');
const v2Display = document.getElementById('v2Display');
const totalTimeDisplay = document.getElementById('totalTimeDisplay');
const minTimeDisplay = document.getElementById('minTimeDisplay');
const dist1Display = document.getElementById('dist1Display');
const dist2Display = document.getElementById('dist2Display');
const timeBar = document.getElementById('timeBar');
const sinRatioDisplay = document.getElementById('sinRatio');
const velRatioDisplay = document.getElementById('velRatio');
const snellMatchIndicator = document.getElementById('snellMatchIndicator');
const optimizeBtn = document.getElementById('findOptimalBtn');

// Base scale variable to show reasonable distance values (e.g. 1 unit canvas = 100 meters)
const distanceScale = 100;

function optimizePath(v1Val, v2Val) {
    let low = Math.min(startRel.x, endRel.x);
    let high = Math.max(startRel.x, endRel.x);
    for (let i = 0; i < 40; i++) {
        let mid = (low + high) / 2;
        let d1 = Math.sqrt(Math.pow(mid - startRel.x, 2) + Math.pow(boundaryYRel - startRel.y, 2));
        let d2 = Math.sqrt(Math.pow(endRel.x - mid, 2) + Math.pow(endRel.y - boundaryYRel, 2));

        let sinTheta1 = (mid - startRel.x) / d1;
        let sinTheta2 = (endRel.x - mid) / d2;

        let diff = (sinTheta1 / v1Val) - (sinTheta2 / v2Val);

        if (diff > 0) {
            high = mid;
        } else {
            low = mid;
        }
    }
    return (low + high) / 2;
}


function draw() {
    const w = canvas.width;
    const h = canvas.height;
    const bY = boundaryYRel * h;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw Environment 1 (Sand)
    let sandGrad = ctx.createLinearGradient(0, 0, 0, bY);
    sandGrad.addColorStop(0, '#fde047');
    sandGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, 0, w, bY);

    // Draw Environment 2 (Water)
    let waterGrad = ctx.createLinearGradient(0, bY, 0, h);
    waterGrad.addColorStop(0, '#38bdf8');
    waterGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, bY, w, h - bY);

    // Draw subtle grid/waves
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
    for (let i = 0; i < h; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }

    // Boundary Line
    ctx.beginPath();
    ctx.moveTo(0, bY);
    ctx.lineTo(w, bY);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Convert Rel to Pixels
    const sX = startRel.x * w; const sY = startRel.y * h;
    const eX = endRel.x * w; const eY = endRel.y * h;
    const pX = pointXRel * w;

    // Draw Normal Line
    ctx.beginPath();
    ctx.setLineDash([8, 6]);
    ctx.moveTo(pX, bY - 80);
    ctx.lineTo(pX, bY + 80);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Path
    ctx.beginPath();
    ctx.moveTo(sX, sY);
    ctx.lineTo(pX, bY);
    ctx.lineTo(eX, eY);
    ctx.strokeStyle = '#ef4444'; // Red laser line
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Glow effect for path
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Draw Angles Arc
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f8fafc';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '14px Inter';

    // Theta 1 (Sand)
    ctx.beginPath();
    const d1_p = Math.sqrt(Math.pow(pX - sX, 2) + Math.pow(bY - sY, 2));
    const angle1 = Math.asin((pX - sX) / d1_p);
    ctx.arc(pX, bY, 40, -Math.PI / 2 - angle1, -Math.PI / 2);
    ctx.stroke();
    ctx.fillText('θ₁', pX - 25, bY - 45);

    // Theta 2 (Water)
    ctx.beginPath();
    const d2_p = Math.sqrt(Math.pow(eX - pX, 2) + Math.pow(eY - bY, 2));
    const angle2 = Math.asin((eX - pX) / d2_p);
    ctx.arc(pX, bY, 40, Math.PI / 2 - angle2, Math.PI / 2);
    ctx.stroke();
    ctx.fillText('θ₂', pX + 10, bY + 55);

    // Draw Endpoints
    function drawPoint(x, y, color, label) {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px Inter';
        ctx.fillText(label, x - 12, y - 15);
        ctx.shadowBlur = 0; // reset
    }

    drawPoint(sX, sY, '#10b981', 'A (Cankurtaran)');
    drawPoint(eX, eY, '#10b981', 'B (Hedef)');

    // Draw Draggable Point
    ctx.beginPath();
    ctx.arc(pX, bY, isDragging ? 14 : 10, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (isDragging || !hasInteracted) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fef08a';
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    updateDashboard();
}

function updateDashboard() {
    const dist1 = Math.sqrt(Math.pow(pointXRel - startRel.x, 2) + Math.pow(boundaryYRel - startRel.y, 2)) * distanceScale;
    const dist2 = Math.sqrt(Math.pow(endRel.x - pointXRel, 2) + Math.pow(endRel.y - boundaryYRel, 2)) * distanceScale;

    const time = (dist1 / v1) + (dist2 / v2);

    const minPointXRel = optimizePath(v1, v2);
    const minDist1 = Math.sqrt(Math.pow(minPointXRel - startRel.x, 2) + Math.pow(boundaryYRel - startRel.y, 2)) * distanceScale;
    const minDist2 = Math.sqrt(Math.pow(endRel.x - minPointXRel, 2) + Math.pow(endRel.y - boundaryYRel, 2)) * distanceScale;
    const minTime = (minDist1 / v1) + (minDist2 / v2);

    // Updates
    dist1Display.innerText = dist1.toFixed(1) + ' m';
    dist2Display.innerText = dist2.toFixed(1) + ' m';
    totalTimeDisplay.innerText = time.toFixed(2) + ' s';
    minTimeDisplay.innerText = minTime.toFixed(2) + ' s';

    const maxBarTime = minTime * 1.5;
    let barWidth = (1 - (time - minTime) / (maxBarTime - minTime)) * 100;
    if (barWidth < 5) barWidth = 5;
    if (barWidth > 100) barWidth = 100;
    timeBar.style.width = barWidth + '%';

    const diff = time - minTime;
    let isOptimal = false;
    if (diff < 0.05) {
        timeBar.style.backgroundColor = '#4ade80';
        totalTimeDisplay.style.color = '#4ade80';
        isOptimal = true;
    } else if (diff < 0.5) {
        timeBar.style.backgroundColor = '#facc15';
        totalTimeDisplay.style.color = '#facc15';
    } else {
        timeBar.style.backgroundColor = '#ef4444';
        totalTimeDisplay.style.color = '#ef4444';
    }

    // Snell Law check: sin(theta1) = (px - sx) / d1_rel
    const d1_rel = Math.sqrt(Math.pow(pointXRel - startRel.x, 2) + Math.pow(boundaryYRel - startRel.y, 2));
    const d2_rel = Math.sqrt(Math.pow(endRel.x - pointXRel, 2) + Math.pow(endRel.y - boundaryYRel, 2));

    const sinTheta1 = (pointXRel - startRel.x) / d1_rel;
    const sinTheta2 = (endRel.x - pointXRel) / d2_rel;

    const sRatio = sinTheta1 / sinTheta2;
    const vRatio = v1 / v2;

    sinRatioDisplay.innerText = sRatio.toFixed(3);
    velRatioDisplay.innerText = vRatio.toFixed(3);

    // Match logic
    if (isOptimal) {
        snellMatchIndicator.innerHTML = `Bravo! Optimum rota Snell Yasasını kanıtlıyor: <br><strong style="color: #4ade80;">sin(θ₁)/sin(θ₂) ≈ v₁/v₂</strong>`;
        snellMatchIndicator.className = "snell-indicator match";
    } else {
        snellMatchIndicator.innerText = "Optimum zaman noktasını bulana kadar noktayı kaydırın...";
        snellMatchIndicator.className = "snell-indicator";
    }
}

// Logic events
function handleDown(x, y) {
    const w = canvas.width;
    const h = canvas.height;
    const bY = boundaryYRel * h;
    const pX = pointXRel * w;

    if (Math.abs(x - pX) < 30 && Math.abs(y - bY) < 30) {
        isDragging = true;
        hasInteracted = true;
    }
}

function handleMove(x) {
    if (isDragging) {
        pointXRel = Math.max(0.05, Math.min(0.95, x / canvas.width));
        draw();
    }
}

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    handleDown(e.clientX - rect.left, e.clientY - rect.top);
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    handleMove(e.clientX - rect.left);
});

canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

// Touch Support
canvas.addEventListener('touchstart', (e) => {
    const rect = canvas.getBoundingClientRect();
    handleDown(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    if (isDragging) e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    handleMove(e.touches[0].clientX - rect.left);
    if (isDragging) e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', () => isDragging = false);


// Input Handlers
v1Slider.addEventListener('input', (e) => {
    v1 = parseFloat(e.target.value);
    v1Display.innerText = `v₁ = ${v1.toFixed(1)} m/s`;
    draw();
});

v2Slider.addEventListener('input', (e) => {
    v2 = parseFloat(e.target.value);
    v2Display.innerText = `v₂ = ${v2.toFixed(1)} m/s`;
    draw();
});

// Auto Optimize
optimizeBtn.addEventListener('click', () => {
    const targetRel = optimizePath(v1, v2);
    let step = (targetRel - pointXRel) / 30;
    let count = 0;

    optimizeBtn.disabled = true;
    optimizeBtn.innerText = "Hesaplanıyor...";

    let interval = setInterval(() => {
        pointXRel += step;
        count++;
        hasInteracted = true;
        draw();
        if (count >= 30) {
            pointXRel = targetRel;
            draw();
            clearInterval(interval);
            optimizeBtn.disabled = false;
            optimizeBtn.innerText = "Optimum Rotayı Bul (Snell)";
        }
    }, 16);
});
