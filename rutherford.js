document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("rutherfordCanvas");
    const ctx = canvas.getContext("2d");

    // UI Elements
    const energySlider = document.getElementById("energy-slider");
    const energyVal = document.getElementById("energy-val");
    const impactSlider = document.getElementById("impact-slider");
    const impactValControl = document.getElementById("impact-val-control");
    const impactDisplay = document.getElementById("impact-display");
    const targetSelect = document.getElementById("target-select");
    const targetZDisplay = document.getElementById("target-z");
    
    const btnFireSingle = document.getElementById("btn-fire-single");
    const btnAutoFire = document.getElementById("btn-auto-fire");
    const btnClearTrails = document.getElementById("btn-clear-trails");
    
    const showTrailsChk = document.getElementById("show-trails");
    const showForceChk = document.getElementById("show-force");

    const alphaCountDisp = document.getElementById("alpha-count");
    const backscatterCountDisp = document.getElementById("backscatter-count");

    // Simulation State
    let particles = [];
    let isAutoFiring = false;
    let autoFireTimer = 0;
    
    let stats = {
        fired: 0,
        backscattered: 0
    };

    // Physics Constants (Pseudo-scaled for visual appeal)
    const K_FORCE = 18.0; 
    const PX_PER_FM = 6.0; // 1 fm = 6 pixels visually

    // Nucleus Position
    const NUC_X = canvas.width / 2 + 100; // Shifted slightly right to give more incoming time
    const NUC_Y = canvas.height / 2;

    class AlphaParticle {
        constructor(x, y, vx, vy) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.path = [[x, y]];
            this.active = true;
            this.scattered = false;
            this.lastAx = 0;
            this.lastAy = 0;
            this.forceMag = 0;
        }

        update(Z, dt) {
            if (!this.active) return;

            // Multiple sub-steps for better integration near nucleus
            const SUBSTEPS = 5;
            const subDt = dt / SUBSTEPS;

            for(let step=0; step<SUBSTEPS; step++) {
                let dx = this.x - NUC_X;
                let dy = this.y - NUC_Y;
                let rSq = dx*dx + dy*dy;
                let r = Math.sqrt(rSq);

                // Prevent infinite force if directly hit (nucleus size ~ 2-3 pixels visually)
                if (r < 3) {
                    this.active = false;
                    this.scattered = true; // hit nucleus directly
                    stats.backscattered++;
                    updateReadouts();
                    return;
                }

                let a = (K_FORCE * Z) / rSq;
                
                this.lastAx = a * (dx / r);
                this.lastAy = a * (dy / r);
                this.forceMag = a;

                this.vx += this.lastAx * subDt;
                this.vy += this.lastAy * subDt;

                this.x += this.vx * subDt;
                this.y += this.vy * subDt;
            }

            // Record path for trail
            // Only add point if moved sufficiently to save memory
            let lastP = this.path[this.path.length-1];
            let distMovedSq = (this.x - lastP[0])**2 + (this.y - lastP[1])**2;
            if (distMovedSq > 4) {
                this.path.push([this.x, this.y]);
                if (this.path.length > 300) this.path.shift();
            }

            // Check bounds (Off-screen)
            if (this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) {
                this.active = false;
                // If it exited left (x < -50) and it came from the left, it was backscattered > 90 deg
                if (this.vx < 0 && this.x < NUC_X) {
                    if (!this.scattered) {
                        this.scattered = true;
                        stats.backscattered++;
                        updateReadouts();
                    }
                }
            }
        }

        draw(ctx, showTrails, showForce) {
            // Trail
            if (showTrails && this.path.length > 1) {
                ctx.beginPath();
                ctx.moveTo(this.path[0][0], this.path[0][1]);
                for (let i = 1; i < this.path.length; i++) {
                    ctx.lineTo(this.path[i][0], this.path[i][1]);
                }
                ctx.strokeStyle = this.scattered ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            if (!this.active) return;

            // Force Vector
            if (showForce && this.forceMag > 0.01) {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                // Scale force vector for visualization
                let fScale = 20; 
                ctx.lineTo(this.x + this.lastAx * fScale, this.y + this.lastAy * fScale);
                ctx.strokeStyle = '#38bdf8'; // light blue
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Particle
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#fca5a5'; // light red
            ctx.fill();
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ef4444';
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }
    }

    // --- Update UI ---
    function updateReadouts() {
        alphaCountDisp.textContent = stats.fired;
        backscatterCountDisp.textContent = stats.backscattered;
    }

    function fireParticle(impactFm) {
        let E = parseFloat(energySlider.value);
        let Z = parseInt(targetSelect.value);

        // Base speed based on Energy. E=5.0 -> speed = 6
        let v0 = 6.0 * Math.sqrt(E / 5.0);
        
        // Start position
        let startX = 0;
        let startY = NUC_Y + (impactFm * PX_PER_FM);

        particles.push(new AlphaParticle(startX, startY, v0, 0));
        stats.fired++;
        updateReadouts();
    }

    // --- Event Listeners ---
    energySlider.addEventListener("input", (e) => {
        energyVal.textContent = parseFloat(e.target.value).toFixed(1) + " MeV";
    });

    impactSlider.addEventListener("input", (e) => {
        let v = parseFloat(e.target.value).toFixed(1);
        impactValControl.textContent = v + " fm";
        impactDisplay.textContent = v + " fm";
    });

    targetSelect.addEventListener("change", (e) => {
        targetZDisplay.textContent = e.target.value;
        // Optionally clear trails when target changes
        // particles = [];
    });

    btnFireSingle.addEventListener("click", () => {
        let b = parseFloat(impactSlider.value);
        fireParticle(b);
    });

    btnAutoFire.addEventListener("click", () => {
        isAutoFiring = !isAutoFiring;
        if (isAutoFiring) {
            btnAutoFire.textContent = "Durdur";
            btnAutoFire.classList.add("active");
            document.getElementById("impact-slider").disabled = true;
        } else {
            btnAutoFire.textContent = "Işın Demeti (Rastgele)";
            btnAutoFire.classList.remove("active");
            document.getElementById("impact-slider").disabled = false;
        }
    });

    btnClearTrails.addEventListener("click", () => {
        particles = particles.filter(p => p.active); // keep only active ones, clear others
        particles.forEach(p => p.path = [[p.x, p.y]]); // reset paths of active ones
        stats.fired = 0;
        stats.backscattered = 0;
        updateReadouts();
    });

    // --- Main Loop ---
    let lastTime = 0;
    function animate(timestamp) {
        let dt = 1.0; // Fixed time step for stability, or use (timestamp - lastTime) / 16.6

        // Auto Firing Logic
        if (isAutoFiring) {
            autoFireTimer += dt;
            if (autoFireTimer > 5) { // Fire every 5 frames
                autoFireTimer = 0;
                // Random impact parameter between -20 and 20
                let randB = (Math.random() - 0.5) * 40; 
                fireParticle(randB);
                
                // Show current random b on display
                impactDisplay.textContent = randB.toFixed(1) + " fm";
            }
        }

        // Clear Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Nucleus
        let Z = parseInt(targetSelect.value);
        let nucRadius = 6 + (Z / 79) * 4; // visual scaling
        
        ctx.beginPath();
        ctx.arc(NUC_X, NUC_Y, nucRadius, 0, Math.PI * 2);
        
        // Gradient for nucleus
        let grad = ctx.createRadialGradient(NUC_X, NUC_Y, 0, NUC_X, NUC_Y, nucRadius);
        grad.addColorStop(0, '#fbbf24'); // gold-ish center
        grad.addColorStop(1, '#d97706'); 
        
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fbbf24';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw + sign on nucleus
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(NUC_X - nucRadius/2, NUC_Y);
        ctx.lineTo(NUC_X + nucRadius/2, NUC_Y);
        ctx.moveTo(NUC_X, NUC_Y - nucRadius/2);
        ctx.lineTo(NUC_X, NUC_Y + nucRadius/2);
        ctx.stroke();

        // Update & Draw Particles
        const showTrails = showTrailsChk.checked;
        const showForce = showForceChk.checked;

        for (let i = 0; i < particles.length; i++) {
            particles[i].update(Z, dt);
            particles[i].draw(ctx, showTrails, showForce);
        }

        // Cleanup inactive particles with no trails or if trails disabled
        if (!showTrails) {
            particles = particles.filter(p => p.active);
        } else {
            // If trails are shown, we keep inactive particles so their trails remain.
            // But if there are too many, we remove oldest inactive ones to prevent lag.
            if (particles.length > 200) {
                let inactiveIndices = [];
                for(let i=0; i<particles.length; i++) {
                    if (!particles[i].active) inactiveIndices.push(i);
                }
                // Remove oldest inactive
                while (inactiveIndices.length > 150) {
                    let idx = inactiveIndices.shift();
                    particles.splice(idx, 1);
                    // adjust indices
                    for(let j=0; j<inactiveIndices.length; j++) inactiveIndices[j]--;
                }
            }
        }

        requestAnimationFrame(animate);
    }

    // Start
    requestAnimationFrame(animate);

});
