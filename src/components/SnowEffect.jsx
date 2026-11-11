import { useState, useEffect, useRef } from 'react';

export const toggleChristmasSnow = () => {
    const current = localStorage.getItem('christmasSnow') !== 'false';
    const next = !current;
    localStorage.setItem('christmasSnow', String(next));
    window.dispatchEvent(new Event('christmas-snow-change'));
    return next;
};

export const getChristmasSnowState = () => {
    return localStorage.getItem('christmasSnow') !== 'false';
};

const SnowEffect = () => {
    const [active, setActive] = useState(getChristmasSnowState);
    const canvasRef = useRef(null);

    useEffect(() => {
        const handleSnowChange = () => {
            setActive(getChristmasSnowState());
        };
        window.addEventListener('christmas-snow-change', handleSnowChange);
        return () => window.removeEventListener('christmas-snow-change', handleSnowChange);
    }, []);

    useEffect(() => {
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        // Flake count scales with screen size (45 - 85 flakes)
        const flakeCount = Math.floor(Math.min(90, Math.max(45, (width * height) / 18000)));

        const flakes = [];
        for (let i = 0; i < flakeCount; i++) {
            flakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2.8 + 1.2,
                speed: Math.random() * 1.1 + 0.5,
                wind: Math.random() * 0.6 - 0.3,
                angle: Math.random() * Math.PI * 2,
                swaySpeed: Math.random() * 0.02 + 0.008,
                opacity: Math.random() * 0.55 + 0.35,
                isCrystal: i % 8 === 0 // 1 in 8 is a tiny crystal snowflake
            });
        }

        // Draw a miniature 6-point snowflake crystal
        const drawCrystal = (x, y, size, opacity, isDark) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.strokeStyle = isDark
                ? `rgba(220, 240, 255, ${opacity})`
                : `rgba(140, 185, 230, ${opacity * 0.95})`;
            ctx.lineWidth = 1.2;
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -size);
                ctx.stroke();

                // Branchlets
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.5);
                ctx.lineTo(-size * 0.3, -size * 0.7);
                ctx.moveTo(0, -size * 0.5);
                ctx.lineTo(size * 0.3, -size * 0.7);
                ctx.stroke();
                ctx.rotate(Math.PI / 3);
            }
            ctx.restore();
        };

        let lastTime = performance.now();

        const render = (time) => {
            const dt = Math.min((time - lastTime) / 1000, 0.1);
            lastTime = time;

            ctx.clearRect(0, 0, width, height);

            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

            for (let i = 0; i < flakes.length; i++) {
                const flake = flakes[i];

                flake.angle += flake.swaySpeed;
                flake.y += flake.speed * 60 * dt;
                flake.x += (Math.sin(flake.angle) * 0.8 + flake.wind) * 60 * dt;

                // Wrap around edges
                if (flake.y > height + 10) {
                    flake.y = -10;
                    flake.x = Math.random() * width;
                }
                if (flake.x > width + 10) {
                    flake.x = -10;
                } else if (flake.x < -10) {
                    flake.x = width + 10;
                }

                if (flake.isCrystal) {
                    drawCrystal(flake.x, flake.y, flake.radius * 2.4, flake.opacity, isDark);
                } else {
                    ctx.beginPath();
                    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);

                    if (isDark) {
                        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
                        ctx.shadowBlur = 6;
                        ctx.shadowColor = 'rgba(180, 230, 255, 0.7)';
                    } else {
                        // Light theme: soft frosty pastel blue with subtle blur
                        ctx.fillStyle = `rgba(165, 205, 245, ${flake.opacity * 0.95})`;
                        ctx.shadowBlur = 4;
                        ctx.shadowColor = 'rgba(100, 140, 200, 0.35)';
                    }
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [active]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            className="no-print"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 99999,
                userSelect: 'none'
            }}
        />
    );
};

export default SnowEffect;
