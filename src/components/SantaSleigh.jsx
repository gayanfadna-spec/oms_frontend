import { useState, useEffect } from 'react';
import { getChristmasSnowState } from './SnowEffect';

const SantaSleigh = () => {
    const [active, setActive] = useState(getChristmasSnowState);
    const [flying, setFlying] = useState(true);

    useEffect(() => {
        const handleSnowChange = () => {
            setActive(getChristmasSnowState());
        };
        window.addEventListener('christmas-snow-change', handleSnowChange);
        return () => window.removeEventListener('christmas-snow-change', handleSnowChange);
    }, []);

    // Periodic flight at constant uniform speed (faster pace)
    const FLIGHT_DURATION = 25; // seconds across the screen (fast constant speed)
    const REST_DURATION = 15;   // seconds break before next flight

    useEffect(() => {
        if (!active) return;

        let timeoutId;
        const triggerFlightCycle = () => {
            setFlying(true);
            timeoutId = setTimeout(() => {
                setFlying(false);
                timeoutId = setTimeout(() => {
                    triggerFlightCycle();
                }, REST_DURATION * 1000);
            }, FLIGHT_DURATION * 1000);
        };

        triggerFlightCycle();

        return () => clearTimeout(timeoutId);
    }, [active]);

    if (!active || !flying) return null;

    return (
        <div
            className="santa-flight-wrapper no-print"
            style={{
                position: 'fixed',
                top: '65px', // Fly just below the top header
                left: '-380px',
                zIndex: 99998,
                pointerEvents: 'none',
                userSelect: 'none',
                animation: `santaFlyAcross ${FLIGHT_DURATION}s linear forwards`
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                animation: 'santaBobbing 1.1s ease-in-out infinite alternate',
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.35))'
            }}>
                {/* Magic Star Trail */}
                <div style={{
                    display: 'flex',
                    gap: '6px',
                    marginRight: '-10px',
                    opacity: 0.85,
                    animation: 'magicSparkle 1.2s ease-in-out infinite alternate'
                }}>
                    <span style={{ fontSize: '14px', filter: 'blur(0.5px)' }}>✨</span>
                    <span style={{ fontSize: '18px', color: '#facc15' }}>⭐</span>
                    <span style={{ fontSize: '12px', color: '#60a5fa' }}>❄️</span>
                    <span style={{ fontSize: '16px', color: '#f43f5e' }}>✨</span>
                </div>

                {/* Santa Sleigh SVG with Reindeer */}
                <svg
                    width="320"
                    height="90"
                    viewBox="0 0 320 90"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ overflow: 'visible' }}
                >
                    {/* Reins / Harness line */}
                    <path
                        d="M 68 52 C 110 46, 170 48, 225 44"
                        stroke="#f59e0b"
                        strokeWidth="1.8"
                        strokeDasharray="4 2"
                        fill="none"
                    />
                    <path
                        d="M 68 56 C 140 50, 200 48, 290 46"
                        stroke="#d97706"
                        strokeWidth="1.5"
                        fill="none"
                    />

                    {/* ===================== SLEIGH & SANTA (Left Side) ===================== */}
                    <g transform="translate(10, 18)">
                        {/* Presents in the back */}
                        <g id="presents">
                            {/* Sack */}
                            <path d="M 12 36 C 6 24, 22 16, 32 26 C 36 20, 48 24, 46 36 Z" fill="#b91c1c" />
                            {/* Gift boxes */}
                            <rect x="18" y="16" width="12" height="12" rx="2" fill="#10b981" />
                            <line x1="24" y1="16" x2="24" y2="28" stroke="#facc15" strokeWidth="2" />
                            <line x1="18" y1="22" x2="30" y2="22" stroke="#facc15" strokeWidth="2" />

                            <rect x="30" y="20" width="10" height="10" rx="1.5" fill="#3b82f6" />
                            <line x1="35" y1="20" x2="35" y2="30" stroke="#fbbf24" strokeWidth="1.5" />
                        </g>

                        {/* Santa Claus */}
                        <g id="santa" transform="translate(32, 8)">
                            {/* Santa Body / Red Coat */}
                            <path d="M 10 24 C 6 16, 26 16, 22 24 C 26 28, 24 38, 8 38 C 4 36, 6 28, 10 24 Z" fill="#dc2626" />
                            {/* White Fur Trim */}
                            <ellipse cx="16" cy="36" rx="10" ry="3" fill="#ffffff" />
                            {/* Black Belt */}
                            <rect x="8" y="27" width="16" height="4" rx="1" fill="#1f2937" />
                            {/* Gold Buckle */}
                            <rect x="14" y="26" width="4" height="6" rx="1" fill="#facc15" />

                            {/* Head & Face */}
                            <circle cx="16" cy="14" r="7" fill="#fbcfe8" />
                            {/* Rosy Cheek */}
                            <circle cx="18" cy="15" r="1.5" fill="#f43f5e" />
                            {/* Eyes */}
                            <circle cx="19" cy="12" r="1" fill="#1e293b" />

                            {/* Big White Beard */}
                            <path d="M 13 14 C 11 20, 14 26, 18 26 C 22 26, 24 20, 22 14 C 20 17, 15 17, 13 14 Z" fill="#ffffff" />
                            {/* White Mustache */}
                            <path d="M 15 15 C 17 17, 21 17, 22 15 C 20 14, 18 14, 15 15 Z" fill="#f8fafc" />

                            {/* Santa Hat */}
                            <path d="M 11 11 C 12 4, 23 2, 25 8 C 22 9, 14 10, 11 11 Z" fill="#dc2626" />
                            {/* White Hat Trim */}
                            <ellipse cx="17" cy="10" rx="7" ry="2.2" fill="#ffffff" />
                            {/* Hat Pom-pom */}
                            <circle cx="26" cy="9" r="2.5" fill="#ffffff" />

                            {/* Waving Arm & Mitten */}
                            <path d="M 22 20 C 26 16, 28 12, 30 10" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
                            <circle cx="31" cy="9" r="3" fill="#ffffff" />
                        </g>

                        {/* Sleigh Body */}
                        <path
                            d="M 6 36 C 4 48, 14 54, 30 54 L 62 54 C 74 54, 82 46, 80 38 C 76 34, 68 40, 56 42 L 20 42 C 14 42, 8 38, 6 36 Z"
                            fill="#b91c1c"
                            stroke="#7f1d1d"
                            strokeWidth="1.5"
                        />
                        {/* Gold Trim along top edge */}
                        <path
                            d="M 6 36 C 14 40, 24 43, 60 43 C 72 43, 80 37, 80 38"
                            stroke="#facc15"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            fill="none"
                        />

                        {/* Golden Runner (Skis) */}
                        <path
                            d="M 2 58 L 74 58 C 84 58, 88 52, 86 48"
                            stroke="#d97706"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                            fill="none"
                        />
                        {/* Runner Struts */}
                        <line x1="20" y1="53" x2="20" y2="58" stroke="#b45309" strokeWidth="2" />
                        <line x1="42" y1="53" x2="42" y2="58" stroke="#b45309" strokeWidth="2" />
                        <line x1="64" y1="53" x2="64" y2="58" stroke="#b45309" strokeWidth="2" />
                    </g>

                    {/* ===================== REINDEER 1 (Middle) ===================== */}
                    <g id="reindeer1" transform="translate(145, 20)">
                        {/* Body */}
                        <ellipse cx="32" cy="30" rx="16" ry="10" fill="#92400e" />
                        {/* Chest / Neck */}
                        <path d="M 40 26 C 44 20, 48 14, 52 10 L 58 14 C 54 22, 48 30, 42 34 Z" fill="#92400e" />
                        {/* Head */}
                        <ellipse cx="58" cy="11" rx="8" ry="5.5" transform="rotate(-15 58 11)" fill="#92400e" />
                        {/* Ears */}
                        <ellipse cx="53" cy="6" rx="3" ry="1.5" transform="rotate(-40 53 6)" fill="#78350f" />
                        {/* Antlers */}
                        <path d="M 54 7 L 50 -2 M 52 2 L 47 0 M 51 -1 L 53 -4" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M 56 6 L 56 -3 M 56 1 L 60 -1" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
                        {/* Eye */}
                        <circle cx="60" cy="10" r="1" fill="#1e293b" />
                        {/* Red Collar / Bell */}
                        <path d="M 46 22 L 53 25" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="50" cy="25" r="2" fill="#facc15" />

                        {/* Animated Running Legs */}
                        <g className="deer-legs-back">
                            {/* Back legs */}
                            <path d="M 22 36 L 16 46 L 12 50" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round" />
                            <path d="M 26 36 L 28 46 L 34 49" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />
                            {/* Front legs */}
                            <path d="M 40 36 L 46 45 L 52 48" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round" />
                            <path d="M 44 35 L 50 42 L 46 48" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />
                        </g>

                        {/* Tail */}
                        <path d="M 16 28 C 12 26, 12 22, 16 24 Z" fill="#fef3c7" />
                    </g>

                    {/* ===================== REINDEER 2 (Lead - Rudolph! 🔴) ===================== */}
                    <g id="rudolph" transform="translate(225, 14)">
                        {/* Body */}
                        <ellipse cx="32" cy="30" rx="16" ry="10" fill="#92400e" />
                        {/* Chest / Neck */}
                        <path d="M 40 26 C 44 20, 48 14, 52 10 L 58 14 C 54 22, 48 30, 42 34 Z" fill="#92400e" />
                        {/* Head */}
                        <ellipse cx="58" cy="11" rx="8" ry="5.5" transform="rotate(-15 58 11)" fill="#92400e" />
                        {/* Ears */}
                        <ellipse cx="53" cy="6" rx="3" ry="1.5" transform="rotate(-40 53 6)" fill="#78350f" />
                        {/* Antlers */}
                        <path d="M 54 7 L 50 -2 M 52 2 L 47 0 M 51 -1 L 53 -4" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M 56 6 L 56 -3 M 56 1 L 60 -1" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
                        {/* Eye */}
                        <circle cx="60" cy="10" r="1" fill="#1e293b" />

                        {/* Rudolph's GLOWING RED NOSE */}
                        <circle cx="66" cy="12" r="2.6" fill="#ef4444" />
                        <circle cx="66" cy="12" r="5" fill="#ef4444" opacity="0.4" className="rudolph-glow" />

                        {/* Red Collar & Golden Jingle Bell */}
                        <path d="M 46 22 L 53 25" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="50" cy="25" r="2" fill="#facc15" />

                        {/* Animated Running Legs */}
                        <g className="deer-legs-front">
                            {/* Back legs */}
                            <path d="M 22 36 L 14 44 L 18 51" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round" />
                            <path d="M 26 36 L 30 47 L 26 52" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />
                            {/* Front legs leaping forward */}
                            <path d="M 40 36 L 48 44 L 56 46" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round" />
                            <path d="M 44 35 L 54 41 L 62 43" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />
                        </g>

                        {/* Tail */}
                        <path d="M 16 28 C 12 26, 12 22, 16 24 Z" fill="#fef3c7" />
                    </g>
                </svg>

                {/* Speech bubble "Ho Ho Ho!" */}
                <div style={{
                    marginLeft: '-40px',
                    marginBottom: '45px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: '#dc2626',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    whiteSpace: 'nowrap',
                    animation: 'santaSpeech 1.5s ease-in-out infinite alternate',
                    border: '1px solid #fecdd3'
                }}>
                    🎅 Ho Ho Ho!
                </div>
            </div>
        </div>
    );
};

export default SantaSleigh;

