// michelson_morley.js

document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM Elements ----
    const setupCanvas = document.getElementById('setupCanvas');
    const ctxSetup = setupCanvas.getContext('2d');

    const patternCanvas = document.getElementById('patternCanvas');
    const ctxPattern = patternCanvas.getContext('2d');

    const etherWindCanvas = document.getElementById('etherWindCanvas');
    const ctxEther = etherWindCanvas.getContext('2d');

    // Controls
    const modelEtherBtn = document.getElementById('modelEther');
    const modelRelativityBtn = document.getElementById('modelRelativity');
    const modelToggleBg = document.getElementById('modelToggleBg');
    const modelDescription = document.getElementById('modelDescription');
    const theoryBadge = document.getElementById('theoryBadge');

    const vSlider = document.getElementById('vSlider');
    const vVal = document.getElementById('vVal');
    const angleSlider = document.getElementById('angleSlider');
    const angleVal = document.getElementById('angleVal');
    const lambdaSlider = document.getElementById('lambdaSlider');
    const lambdaVal = document.getElementById('lambdaVal');

    const fringeShiftVal = document.getElementById('fringeShiftVal');
    const expectedResultStatus = document.getElementById('expectedResultStatus');
    const etherBackground = document.getElementById('etherBackground');

    const resetSimBtn = document.getElementById('resetSimBtn');

    // Modal
    const infoBtn = document.getElementById('infoBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const understandBtn = document.getElementById('understandBtn');
    const infoModal = document.getElementById('infoModal');

    // ---- State ----
    let state = {
        model: 'ether', // 'ether' or 'relativity'
        v: 0.1,         // Ether velocity as fraction of c (0 to 0.5)
        angle: 0,       // Angle of setup relative to ether wind (degrees)
        lambda: 650,    // Wavelength in nm
        color: '#ff2a2a', // Laser color
        time: 0,        // Animation time

        // Physical Constants (scaled for visual purposes)
        c: 100,         // Speed of light visually
        L: 150,         // Length of arms visually
    };

    // ---- Window Resizing ----
    function resizeCanvases() {
        // Use fixed internal resolution for main canvases to prevent zero-size issues and ensure sharpness
        setupCanvas.width = 500;
        setupCanvas.height = 500;

        patternCanvas.width = 400;
        patternCanvas.height = 400;

        const etherRect = etherBackground.getBoundingClientRect();
        etherWindCanvas.width = etherRect.width || window.innerWidth;
        etherWindCanvas.height = etherRect.height || window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvases);

    // ---- Helper: Wavelength to RGB ----
    function nmToRGB(wavelength) {
        let r, g, b;
        if (wavelength >= 380 && wavelength < 440) {
            r = -(wavelength - 440) / (440 - 380);
            g = 0.0;
            b = 1.0;
        } else if (wavelength >= 440 && wavelength < 490) {
            r = 0.0;
            g = (wavelength - 440) / (490 - 440);
            b = 1.0;
        } else if (wavelength >= 490 && wavelength < 510) {
            r = 0.0;
            g = 1.0;
            b = -(wavelength - 510) / (510 - 490);
        } else if (wavelength >= 510 && wavelength < 580) {
            r = (wavelength - 510) / (580 - 510);
            g = 1.0;
            b = 0.0;
        } else if (wavelength >= 580 && wavelength < 645) {
            r = 1.0;
            g = -(wavelength - 645) / (645 - 580);
            b = 0.0;
        } else if (wavelength >= 645 && wavelength <= 780) {
            r = 1.0;
            g = 0.0;
            b = 0.0;
        } else {
            r = 0.0;
            g = 0.0;
            b = 0.0;
        }

        let factor;
        if (wavelength >= 380 && wavelength < 420) {
            factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
        } else if (wavelength >= 420 && wavelength < 701) {
            factor = 1.0;
        } else if (wavelength >= 701 && wavelength <= 780) {
            factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
        } else {
            factor = 0.0;
        }

        const R = Math.round(255 * (r * factor));
        const G = Math.round(255 * (g * factor));
        const B = Math.round(255 * (b * factor));

        return `rgb(${R}, ${G}, ${B})`;
    }

    // ---- Physics Calculation ----
    function calculateFringeShift() {
        // According to Michelson-Morley formula for fringe shift `n`:
        // delta_t = (2L/c) * (v^2/c^2)  (approximate max difference between arms at 0 and 90 deg)
        // Fringe shift count N = delta_t / T = c * delta_t / lambda = (2L v^2) / (lambda * c^2)
        // With rotation angle theta, effective shift is proportional to cos(2*theta)

        if (state.model === 'relativity') {
            return 0; // The crux of special relativity: independent of v and angle
        }

        // For visual flair, we create a scaled formula based on the v fraction
        // V is fraction of c (0 to 0.5)
        const vRatioSq = state.v * state.v;

        // Base max shift at 0 deg. Scale up to make it visually obvious
        const maxVisualShift = (10 * vRatioSq);

        // Angle variation: The phase difference varies with cos(2*theta) 
        // We shift the pattern radially depending on this angle variations
        const rad = state.angle * Math.PI / 180;

        // delta delay proportional to cos(2*angle)
        const currentShift = maxVisualShift * Math.cos(2 * rad);

        // Note: the shift relative to 0 angle is what we observe, but for absolute 
        // display in the UI we'll just show the absolute phase difference variation
        return currentShift;
    }

    // ---- Drawing Setup (Interferometer) ----
    function drawSetup() {
        const w = setupCanvas.width;
        const h = setupCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const L = state.L; // arm length

        ctxSetup.clearRect(0, 0, w, h);

        ctxSetup.save();
        ctxSetup.translate(cx, cy);

        // Rotate the whole setup
        ctxSetup.rotate(state.angle * Math.PI / 180);

        // 1. Draw Laser Source
        ctxSetup.fillStyle = '#222';
        ctxSetup.strokeStyle = '#444';
        ctxSetup.lineWidth = 2;
        ctxSetup.fillRect(-L - 60, -15, 60, 30);
        ctxSetup.strokeRect(-L - 60, -15, 60, 30);

        // Laser eye
        ctxSetup.fillStyle = state.color;
        ctxSetup.beginPath();
        ctxSetup.arc(-L, 0, 4, 0, Math.PI * 2);
        ctxSetup.fill();
        ctxSetup.shadowBlur = 10;
        ctxSetup.shadowColor = state.color;
        ctxSetup.fill();
        ctxSetup.shadowBlur = 0;

        // 2. Draw Beams
        ctxSetup.strokeStyle = state.color;

        // Setup glow
        ctxSetup.shadowBlur = 5;
        ctxSetup.shadowColor = state.color;

        // Beam Source to center (Splitter)
        ctxSetup.lineWidth = 3;
        ctxSetup.beginPath();
        ctxSetup.moveTo(-L, 0);
        ctxSetup.lineTo(0, 0);
        ctxSetup.stroke();

        // Beam Center to Mirror 1 (Horizontal, Right)
        ctxSetup.beginPath();
        ctxSetup.moveTo(0, 0);
        ctxSetup.lineTo(L, 0);
        ctxSetup.stroke();

        // Beam Center to Mirror 2 (Vertical, Up)
        ctxSetup.beginPath();
        ctxSetup.moveTo(0, 0);
        ctxSetup.lineTo(0, -L);
        ctxSetup.stroke();

        // Beams reflecting back and down to detector
        // Downward beam to detector
        ctxSetup.beginPath();
        ctxSetup.moveTo(0, 0);
        ctxSetup.lineTo(0, L);
        ctxSetup.stroke();

        ctxSetup.shadowBlur = 0;

        // Animated Photons / Wave packets (to show "movement")
        // We calculate speed based on model
        let speedX_fwd = state.c, speedX_bwd = state.c;
        let speedY_fwd = state.c, speedY_bwd = state.c;
        let speedSrc = state.c, speedDet = state.c;

        if (state.model === 'ether') {
            // Speed modifications based on angle of the arm relative to the ether wind (which flows left to right internally, 
            // but since we rotate coordinate system, ether flows from angle -theta)
            // Simplified visual speeds
            // Velocity of ether vE = state.v * c (flowing right)
            const vE = state.v * state.c;

            // Actually, calculating exact Galilean times for the moving dots is complex to get perfectly right in rotating frame.
            // For visual flavor, we just vary dot speeds noticeably.
            speedY_fwd = Math.sqrt(state.c * state.c - vE * vE) || 1;
            speedY_bwd = speedY_fwd;

            const effectiveAng = state.angle * Math.PI / 180;
            // Very hacky visual representation to make dots move at different speeds
            speedX_fwd = state.c - vE * Math.cos(effectiveAng);
            speedX_bwd = state.c + vE * Math.cos(effectiveAng);
        }

        const dashLen = 20;
        ctxSetup.strokeStyle = '#fff';
        ctxSetup.lineWidth = 2;
        ctxSetup.lineCap = 'round';
        ctxSetup.setLineDash([dashLen, 40]); // dash, space

        // Animate dashes
        ctxSetup.lineDashOffset = -((state.time * speedSrc) % 60);
        ctxSetup.beginPath(); ctxSetup.moveTo(-L, 0); ctxSetup.lineTo(0, 0); ctxSetup.stroke();

        ctxSetup.lineDashOffset = -((state.time * speedX_fwd) % 60);
        ctxSetup.beginPath(); ctxSetup.moveTo(0, 0); ctxSetup.lineTo(L, 0); ctxSetup.stroke();

        ctxSetup.lineDashOffset = -((state.time * speedY_fwd) % 60);
        ctxSetup.beginPath(); ctxSetup.moveTo(0, 0); ctxSetup.lineTo(0, -L); ctxSetup.stroke();

        // Detector
        ctxSetup.lineDashOffset = -((state.time * speedDet) % 60);
        ctxSetup.beginPath(); ctxSetup.moveTo(0, 0); ctxSetup.lineTo(0, L); ctxSetup.stroke();

        ctxSetup.setLineDash([]); // reset

        // 3. Draw Beam Splitter (Center, 45 degrees)
        ctxSetup.save();
        ctxSetup.rotate(Math.PI / 4); // 45 deg
        ctxSetup.fillStyle = 'rgba(0, 255, 255, 0.4)';
        ctxSetup.strokeStyle = 'cyan';
        ctxSetup.lineWidth = 2;
        ctxSetup.fillRect(-2, -30, 4, 60);
        ctxSetup.strokeRect(-2, -30, 4, 60);
        ctxSetup.restore();

        // 4. Draw Mirrors (Full reflective)
        ctxSetup.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctxSetup.strokeStyle = '#aaa';

        // Mirror 1 (Right)
        ctxSetup.fillRect(L - 5, -20, 10, 40);
        ctxSetup.strokeRect(L - 5, -20, 10, 40);

        // Mirror 2 (Top)
        ctxSetup.fillRect(-20, -L - 5, 40, 10);
        ctxSetup.strokeRect(-20, -L - 5, 40, 10);

        // 5. Draw Detector (Screen)
        ctxSetup.fillStyle = '#333';
        ctxSetup.strokeStyle = '#666';
        ctxSetup.fillRect(-25, L, 50, 10);
        ctxSetup.strokeRect(-25, L, 50, 10);
        // Detector eye
        ctxSetup.fillStyle = '#111';
        ctxSetup.fillRect(-15, L - 2, 30, 4);

        ctxSetup.restore();
    }

    // ---- Draw Observation Pattern ----
    function drawPattern() {
        const w = patternCanvas.width;
        const h = patternCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const maxR = Math.min(w, h) / 2;

        ctxPattern.clearRect(0, 0, w, h);

        // Calculate shift 
        const shiftAmount = calculateFringeShift();

        // Base ring spacing depends on wavelength roughly
        const lambdaFactor = (state.lambda - 400) / 300; // 0 to 1
        const spacing = 15 + (lambdaFactor * 10); // 15px to 25px

        // Color setup
        const colorStr = state.color;
        // Parse rgb to use with opacity
        const rgbMatch = colorStr.match(/\d+/g);
        let r = 255, g = 0, b = 0;
        if (rgbMatch && rgbMatch.length >= 3) {
            r = rgbMatch[0]; g = rgbMatch[1]; b = rgbMatch[2];
        }

        // Draw concentric circular fringes
        // I(r) = cos^2( (r^2 / base) + phase_shift )

        const imageData = ctxPattern.createImageData(w, h);
        const data = imageData.data;

        const phaseShift = shiftAmount * Math.PI; // Phase offset based on delta_t

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const distSq = dx * dx + dy * dy;

                // Optical path difference increases with square of radius for circular fringes
                const phase = (distSq / (spacing * maxR)) - phaseShift;

                // Intensity: cos^2(phase)
                const intensity = Math.pow(Math.cos(phase * Math.PI), 2);

                const index = (y * w + x) * 4;
                data[index] = r * intensity;
                data[index + 1] = g * intensity;
                data[index + 2] = b * intensity;
                data[index + 3] = 255;
            }
        }

        ctxPattern.putImageData(imageData, 0, 0);

        // Update UI Text
        // Show shift relative to 0
        const absShift = calculateFringeShift();

        // Update shift text
        if (state.model === 'relativity') {
            fringeShiftVal.textContent = "0.00";
            fringeShiftVal.className = "text-sm font-bold text-white font-mono";
            expectedResultStatus.textContent = "Sabit - Kayma Yok";
            expectedResultStatus.className = "text-xs font-semibold text-green-400";
        } else {
            fringeShiftVal.textContent = (state.v === 0) ? "0.00" : (absShift > 0 ? "+" : "") + absShift.toFixed(2);
            fringeShiftVal.className = "text-sm font-bold text-ether-blue font-mono";
            expectedResultStatus.textContent = state.v === 0 ? "Eter Rüzgarı Sıfır" : "Sürekli Kayma Gözlemlenmeli";
            expectedResultStatus.className = "text-xs font-semibold text-yellow-500";
        }
    }

    // ---- Draw Ether Particles Background ----
    let etherParticles = [];
    for (let i = 0; i < 100; i++) {
        etherParticles.push({
            x: Math.random(), // 0 to 1
            y: Math.random(), // 0 to 1
            size: Math.random() * 2 + 1,
            speed: (Math.random() * 0.5 + 0.5)
        });
    }

    function drawEtherWind() {
        const w = etherWindCanvas.width;
        const h = etherWindCanvas.height;
        ctxEther.clearRect(0, 0, w, h);

        if (state.model === 'relativity' || state.v === 0) {
            return; // No visible wind
        }

        ctxEther.fillStyle = 'rgba(14, 165, 233, 0.4)'; // ether-blue

        const windPixelsPerSec = state.v * 1000;
        // Direction is always purely rightwards on screen

        etherParticles.forEach(p => {
            // Update
            p.x += (windPixelsPerSec * p.speed * 0.002);
            if (p.x > 1) p.x -= 1;

            // Draw
            ctxEther.beginPath();
            ctxEther.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
            ctxEther.fill();

            // Trail
            ctxEther.beginPath();
            ctxEther.strokeStyle = 'rgba(14, 165, 233, 0.1)';
            ctxEther.lineWidth = p.size;
            ctxEther.moveTo(p.x * w, p.y * h);
            ctxEther.lineTo(p.x * w - 20, p.y * h);
            ctxEther.stroke();
        });
    }

    // ---- Main Animation Loop ----
    function animate() {
        // Reduced laser speed parameter from 0.05 to 0.02
        state.time += 0.02;

        drawSetup();
        drawPattern();
        drawEtherWind();

        requestAnimationFrame(animate);
    }

    // ---- Event Listeners ----
    function updateControls() {
        // Ether Velocity
        state.v = parseFloat(vSlider.value);
        vVal.innerHTML = `${state.v.toFixed(2)} <span class="text-text-secondary text-[10px] font-normal">c</span>`;

        // Angle
        state.angle = parseInt(angleSlider.value);
        angleVal.textContent = `${state.angle}°`;

        // Wavelength
        state.lambda = parseInt(lambdaSlider.value);
        state.color = nmToRGB(state.lambda);
        lambdaVal.textContent = `${state.lambda} nm`;
        lambdaVal.style.color = state.color;
        lambdaVal.style.filter = `drop-shadow(0 0 2px ${state.color})`;

        // Wavelength thumb color update
        lambdaSlider.style.setProperty('--thumb-color', state.color);
        // Custom hack for thumb color since pseudo-elements can't be styled directly via inline styles
        let styleSheet = document.getElementById('thumbStyleHack');
        if (!styleSheet) {
            styleSheet = document.createElement('style');
            styleSheet.id = 'thumbStyleHack';
            document.head.appendChild(styleSheet);
        }
        styleSheet.innerText = `.wavelength-slider::-webkit-slider-thumb { border-color: ${state.color} !important; }`;
    }

    vSlider.addEventListener('input', updateControls);
    angleSlider.addEventListener('input', updateControls);
    lambdaSlider.addEventListener('input', updateControls);

    // Theory Toggle
    modelEtherBtn.addEventListener('click', () => {
        state.model = 'ether';
        modelToggleBg.style.transform = 'translateX(0)';
        modelEtherBtn.className = 'flex-1 text-xs py-1.5 font-semibold text-white z-10 transition-colors';
        modelRelativityBtn.className = 'flex-1 text-xs py-1.5 font-semibold text-text-secondary z-10 hover:text-white transition-colors';
        modelDescription.textContent = "Eter hipotezi: Dünya eter denizi içinde hareket eder, ışığın kollarda seyahat süresi kolları döndürdükçe değişir.";

        theoryBadge.innerHTML = `<div class="w-2 h-2 rounded-full bg-ether-blue animate-pulse-slow indicator-dot"></div><span class="text-xs font-medium text-white badge-text">Eter Hipotezi Aktif</span>`;
        theoryBadge.className = "absolute top-4 right-6 bg-card-dark border border-border-dark px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg transition-all duration-300";

        etherBackground.style.opacity = '0.3';
        vSlider.disabled = false;
        vSlider.parentElement.style.opacity = '1';
    });

    modelRelativityBtn.addEventListener('click', () => {
        state.model = 'relativity';
        modelToggleBg.style.transform = 'translateX(100%)';
        modelRelativityBtn.className = 'flex-1 text-xs py-1.5 font-semibold text-white z-10 transition-colors';
        modelEtherBtn.className = 'flex-1 text-xs py-1.5 font-semibold text-text-secondary z-10 hover:text-white transition-colors';
        modelDescription.textContent = "Özel Görelilik: Işık hızı gözlemcinin veya kaynağın hareketinden bağımsızdır. Eter yoktur, zaman farkı oluşmaz.";

        theoryBadge.innerHTML = `<div class="w-2 h-2 rounded-full bg-green-500 indicator-dot"></div><span class="text-xs font-medium text-white badge-text">Özel Görelilik Aktif</span>`;
        theoryBadge.className = "absolute top-4 right-6 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg transition-all duration-300";

        etherBackground.style.opacity = '0';
        vSlider.disabled = true;
        vSlider.parentElement.style.opacity = '0.3';
    });

    // Reset Simulation
    resetSimBtn.addEventListener('click', () => {
        vSlider.value = 0.1;
        angleSlider.value = 0;
        lambdaSlider.value = 650;
        modelEtherBtn.click();
        updateControls();
    });

    // Modal Control
    function openModal() {
        infoModal.classList.add('modal-open');
    }

    function closeModal() {
        infoModal.classList.remove('modal-open');
    }

    infoBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    understandBtn.addEventListener('click', closeModal);

    // Close modal on outside click
    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) closeModal();
    });

    // ---- Initialization ----
    resizeCanvases();
    updateControls();
    modelEtherBtn.click(); // Init state visually
    animate();
});
