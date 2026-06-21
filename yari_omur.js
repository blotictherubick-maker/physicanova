// DOM Elements
const timeDisplay = document.getElementById('time-display');
const countDisplay = document.getElementById('count-display');
const hardwareStatus = document.getElementById('hardware-status');
const tableBody = document.querySelector('#data-table tbody');
const slopeDisplay = document.getElementById('slope-display');
const halflifeDisplay = document.getElementById('halflife-display');
const chartCanvas = document.getElementById('decayChart');

// Controls
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const btnExport = document.getElementById('btn-export');
const simSpeedInput = document.getElementById('sim-speed');
const simSpeedVal = document.getElementById('sim-speed-val');

// Physics Constants
const HALF_LIFE = 153; // 2.55 minutes in seconds for Ba-137m
const LAMBDA = Math.LN2 / HALF_LIFE;
const INITIAL_ACTIVITY = 1200; // Counts per 30 seconds interval
const BACKGROUND_RATE = 15; // 15 counts per 30 seconds
const INTERVAL = 30; // 30 seconds data collection interval

// Simulation State
let timeElapsed = 0;
let isRunning = false;
let simSpeed = 1;
let animationFrameId;
let lastTimestamp = 0;

// Data Logging
let currentIntervalStart = 0;
let currentIntervalCounts = 0;
let dataPoints = []; // Array of objects: {t, raw, net, ln_net}

// Chart Instance
let chartInstance = null;

// Helper: Poisson-like random number generator (Normal approximation for large mean)
function getPoisson(mean) {
    if (mean <= 0) return 0;
    // Standard deviation is sqrt(mean)
    // Box-Muller transform for normal distribution
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    let result = Math.round(mean + z * Math.sqrt(mean));
    return Math.max(0, result);
}

// Calculate slope using linear regression (Least Squares)
function calculateLinearRegression(data) {
    if (data.length < 2) return null;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = data.length;
    
    data.forEach(p => {
        sumX += p.t;
        sumY += p.ln_net;
        sumXY += p.t * p.ln_net;
        sumXX += p.t * p.t;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
}

function updateDisplays() {
    // Format to 000.0
    let tStr = timeElapsed.toFixed(1);
    timeDisplay.textContent = tStr.padStart(5, '0');
    
    // Format count to 0000
    let cStr = Math.floor(currentIntervalCounts).toString();
    countDisplay.textContent = cStr.padStart(4, '0');
}

function initChart() {
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    chartInstance = new Chart(chartCanvas, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'ln(Net Sayım)',
                    data: [],
                    backgroundColor: '#38bdf8',
                    borderColor: '#38bdf8',
                    showLine: false,
                    pointRadius: 4
                },
                {
                    label: 'Trend Çizgisi (Regresyon)',
                    data: [],
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    showLine: true,
                    pointRadius: 0,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: { display: true, text: 'Zaman (s)', color: '#94a3b8' },
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    min: 0
                },
                y: {
                    title: { display: true, text: 'ln(Net Sayım)', color: '#94a3b8' },
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                }
            },
            plugins: {
                legend: { labels: { color: '#f1f5f9' } }
            }
        }
    });
}

function updateChart() {
    if (!chartInstance) return;
    
    // Update scatter points
    const scatterData = dataPoints.filter(dp => dp.net > 0).map(dp => ({x: dp.t, y: dp.ln_net}));
    chartInstance.data.datasets[0].data = scatterData;
    
    // Calculate regression and trend line
    const slope = calculateLinearRegression(dataPoints.filter(dp => dp.net > 0));
    
    if (slope !== null && scatterData.length >= 2) {
        // Find intercept
        const avgX = scatterData.reduce((sum, p) => sum + p.x, 0) / scatterData.length;
        const avgY = scatterData.reduce((sum, p) => sum + p.y, 0) / scatterData.length;
        const intercept = avgY - slope * avgX;
        
        // Create 2 points for the line (start and end)
        const xStart = 0;
        const yStart = slope * xStart + intercept;
        const xEnd = scatterData[scatterData.length - 1].x + 30;
        const yEnd = slope * xEnd + intercept;
        
        chartInstance.data.datasets[1].data = [
            {x: xStart, y: yStart},
            {x: xEnd, y: yEnd}
        ];
        
        // Update analysis panel
        slopeDisplay.textContent = slope.toFixed(5);
        const expHalfLife = -Math.LN2 / slope;
        halflifeDisplay.textContent = expHalfLife.toFixed(1) + ' saniye';
    }
    
    chartInstance.update();
}

function logDataPoint() {
    const t = currentIntervalStart + INTERVAL;
    const raw = currentIntervalCounts;
    const net = Math.max(0, raw - BACKGROUND_RATE);
    let ln_net = 0;
    let ln_net_str = "-";
    
    if (net > 0) {
        ln_net = Math.log(net);
        ln_net_str = ln_net.toFixed(3);
    }
    
    dataPoints.push({ t, raw, net, ln_net });
    
    // Add to table
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${t}</td>
        <td>${raw}</td>
        <td>${net}</td>
        <td>${ln_net_str}</td>
    `;
    tableBody.appendChild(row);
    
    // Scroll table to bottom
    const tableContainer = document.querySelector('.table-container');
    tableContainer.scrollTop = tableContainer.scrollHeight;
    
    updateChart();
    
    // Reset for next interval
    currentIntervalStart = t;
    currentIntervalCounts = 0;
}

function simulateStep(dt) {
    const simDt = (dt / 1000) * simSpeed;
    
    // Calculate how much counts to add in this very small dt
    // Rate at current time: Activity = A0 * e^(-lambda * t) + Background_Rate / INTERVAL
    // We expect Activity counts per 30 seconds. So per second it's Activity / 30.
    const currentActivity = INITIAL_ACTIVITY * Math.exp(-LAMBDA * timeElapsed);
    const expectedCountsInDt = (currentActivity + BACKGROUND_RATE) * (simDt / INTERVAL);
    
    // Add stochastic noise: Poisson approximation for small interval
    // Actually, for very small dt, it's better to just use a random check
    if (Math.random() < expectedCountsInDt) {
        // If simSpeed is very high, expectedCountsInDt > 1, so we need to add the full amount
        currentIntervalCounts += expectedCountsInDt; 
    } else if (expectedCountsInDt > 1) {
        currentIntervalCounts += getPoisson(expectedCountsInDt);
    } else {
        // If random < expected, add 1, else 0 (standard poisson for small lambda)
        if (Math.random() < expectedCountsInDt) {
             currentIntervalCounts++;
        }
    }

    timeElapsed += simDt;
    
    if (timeElapsed >= currentIntervalStart + INTERVAL) {
        // We crossed a 30s boundary
        // We might need to adjust counts to be perfectly realistic for the exact 30s
        // But doing it dynamically over dt looks better on the digital display
        
        // Snap to perfect Poisson for the 30s interval to fix rounding errors of micro-steps
        const exactMean = INITIAL_ACTIVITY * Math.exp(-LAMBDA * currentIntervalStart) * ((1 - Math.exp(-LAMBDA * INTERVAL)) / (LAMBDA * INTERVAL)) + BACKGROUND_RATE;
        // The above is exact integral, but simple A(t) at start is close enough
        // Override with perfect poisson to ensure statistical accuracy in the table
        currentIntervalCounts = getPoisson(INITIAL_ACTIVITY * Math.exp(-LAMBDA * currentIntervalStart) + BACKGROUND_RATE);
        
        logDataPoint();
    }

    updateDisplays();
}

function loop(timestamp) {
    if (!isRunning) return;
    if (!lastTimestamp) lastTimestamp = timestamp;
    
    const dt = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    // Prevent huge jumps if tab was inactive
    if (dt < 100) {
        simulateStep(dt);
    }
    
    animationFrameId = requestAnimationFrame(loop);
}

// Controls
btnStart.addEventListener('click', () => {
    isRunning = true;
    lastTimestamp = 0;
    btnStart.disabled = true;
    btnPause.disabled = false;
    hardwareStatus.textContent = "ÖLÇÜM SÜRÜYOR";
    hardwareStatus.style.backgroundColor = "#7f1d1d";
    hardwareStatus.style.color = "#fca5a5";
    hardwareStatus.style.borderColor = "#ef4444";
    animationFrameId = requestAnimationFrame(loop);
});

btnPause.addEventListener('click', () => {
    isRunning = false;
    btnStart.disabled = false;
    btnPause.disabled = true;
    hardwareStatus.textContent = "DURAKLATILDI";
    hardwareStatus.style.backgroundColor = "#78350f";
    hardwareStatus.style.color = "#fcd34d";
    hardwareStatus.style.borderColor = "#f59e0b";
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
});

btnReset.addEventListener('click', () => {
    isRunning = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    timeElapsed = 0;
    currentIntervalStart = 0;
    currentIntervalCounts = 0;
    dataPoints = [];
    tableBody.innerHTML = '';
    slopeDisplay.textContent = 'Bekleniyor...';
    halflifeDisplay.textContent = 'Bekleniyor...';
    
    btnStart.disabled = false;
    btnPause.disabled = true;
    
    hardwareStatus.textContent = "HAZIR";
    hardwareStatus.style.backgroundColor = "#064e3b";
    hardwareStatus.style.color = "#34d399";
    hardwareStatus.style.borderColor = "#059669";
    
    updateDisplays();
    initChart();
});

simSpeedInput.addEventListener('input', (e) => {
    simSpeed = parseFloat(e.target.value);
    simSpeedVal.textContent = simSpeed + 'x';
});

btnExport.addEventListener('click', () => {
    if (dataPoints.length === 0) {
        alert("Dışa aktarılacak veri yok!");
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "T(sn),RawCounts,NetCounts,ln_NetCounts\n";
    
    dataPoints.forEach(dp => {
        let ln_str = dp.net > 0 ? dp.ln_net.toFixed(3) : "NaN";
        csvContent += `${dp.t},${dp.raw},${dp.net},${ln_str}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "baryum137m_veri.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Initialization
updateDisplays();
initChart();
