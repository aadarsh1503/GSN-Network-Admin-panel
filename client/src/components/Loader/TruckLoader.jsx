import React from 'react';
import './TruckLoader.css';

/**
 * TruckLoader — shipping-themed loader for GSN Network.
 * A brand-gold truck drives along the road while data loads.
 */
const TruckLoader = ({ message = 'Loading' }) => (
    <div className="truck-loader" role="status" aria-live="polite" aria-label={message}>
        <svg
            className="truck-loader-svg"
            viewBox="0 0 320 140"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="gsnTruckGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dcc56b" />
                    <stop offset="100%" stopColor="#a98c2f" />
                </linearGradient>
                <linearGradient id="gsnTruckGoldDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c6ad4e" />
                    <stop offset="100%" stopColor="#8c7326" />
                </linearGradient>
            </defs>

            {/* Road */}
            <rect x="0" y="126" width="320" height="6" rx="3" fill="#e7e5e4" />
            <g className="road-dashes">
                {[-40, 0, 40, 80, 120, 160, 200, 240, 280, 320].map((x) => (
                    <rect key={x} x={x} y="128" width="18" height="2" rx="1" fill="#bca142" />
                ))}
            </g>

            {/* Truck shadow */}
            <ellipse className="truck-shadow" cx="160" cy="126" rx="120" ry="5" fill="#000000" />

            {/* Speed streaks */}
            <g fill="#bca142">
                <rect className="speed speed-1" x="10" y="76" width="30" height="3" rx="1.5" />
                <rect className="speed speed-2" x="4" y="90" width="24" height="3" rx="1.5" />
                <rect className="speed speed-3" x="14" y="104" width="26" height="3" rx="1.5" />
            </g>

            <g className="truck-bob">
                {/* Exhaust pipe */}
                <rect x="198" y="58" width="7" height="42" rx="2" fill="#5b5b5b" />

                {/* Exhaust smoke */}
                <g fill="#c8c8c8">
                    <circle className="smoke smoke-1" cx="201" cy="54" r="6" />
                    <circle className="smoke smoke-2" cx="201" cy="54" r="6" />
                    <circle className="smoke smoke-3" cx="201" cy="54" r="6" />
                </g>

                {/* Headlight beam */}
                <polygon className="truck-beam" points="268,84 320,70 320,106 268,96" fill="#fff3bf" />

                {/* Chassis */}
                <rect x="48" y="98" width="224" height="10" rx="4" fill="#2f2f2f" />

                {/* Trailer body */}
                <rect x="50" y="30" width="150" height="68" rx="6" fill="url(#gsnTruckGold)" />
                <rect x="50" y="82" width="150" height="8" fill="#ffffff" opacity="0.35" />
                <text
                    className="truck-logo"
                    x="125"
                    y="73"
                    textAnchor="middle"
                    fontSize="26"
                    fontWeight="800"
                    letterSpacing="4"
                    fill="#ffffff"
                >
                    GSN
                </text>

                {/* Cab */}
                <path d="M204,98 L204,54 Q204,46 212,46 L240,46 L268,72 L268,98 Z" fill="url(#gsnTruckGoldDark)" />
                <path d="M215,54 L240,54 L257,71 L215,71 Z" fill="#cbd5e1" />
                <rect x="260" y="84" width="10" height="11" rx="2" fill="#fff3bf" />
                <rect x="256" y="96" width="18" height="10" rx="2" fill="#4b4b4b" />

                {/* Wheels */}
                <g transform="translate(96 112)">
                    <g className="wheel">
                        <circle r="16" fill="#232323" stroke="#4b4b4b" strokeWidth="3" />
                        <circle r="6" fill="#6b6b6b" />
                        <rect x="-9" y="-2" width="18" height="4" rx="2" fill="#bca142" />
                    </g>
                </g>
                <g transform="translate(168 112)">
                    <g className="wheel">
                        <circle r="16" fill="#232323" stroke="#4b4b4b" strokeWidth="3" />
                        <circle r="6" fill="#6b6b6b" />
                        <rect x="-9" y="-2" width="18" height="4" rx="2" fill="#bca142" />
                    </g>
                </g>
                <g transform="translate(240 112)">
                    <g className="wheel">
                        <circle r="16" fill="#232323" stroke="#4b4b4b" strokeWidth="3" />
                        <circle r="6" fill="#6b6b6b" />
                        <rect x="-9" y="-2" width="18" height="4" rx="2" fill="#bca142" />
                    </g>
                </g>
            </g>
        </svg>

        <p className="truck-loader-text">
            {message}
            <span className="truck-loader-dots"><i /><i /><i /></span>
        </p>
    </div>
);

export default TruckLoader;
