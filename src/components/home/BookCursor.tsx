"use client";

import { useEffect, useRef } from "react";

export default function BookCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);

    const targetX = useRef(0);
    const targetY = useRef(0);

    const currentX = useRef(0);
    const currentY = useRef(0);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            targetX.current = e.clientX;
            targetY.current = e.clientY;
        };

        window.addEventListener("mousemove", moveCursor);

        let animationFrame: number;

        const animate = () => {
            currentX.current +=
                (targetX.current - currentX.current) * 0.15;

            currentY.current +=
                (targetY.current - currentY.current) * 0.15;

            if (cursorRef.current) {
                cursorRef.current.style.left =
                    `${currentX.current + 15}px`;

                cursorRef.current.style.top =
                    `${currentY.current + 15}px`;
            }

            animationFrame =
                requestAnimationFrame(animate);
        };

        animationFrame =
            requestAnimationFrame(animate);

        return () => {
            window.removeEventListener(
                "mousemove",
                moveCursor
            );

            cancelAnimationFrame(animationFrame);
        };
    }, []);

    return (
        <div
            ref={cursorRef}
            aria-hidden="true"
            style={{
                position: "fixed",
                left: "0px",
                top: "0px",
                zIndex: 2147483647,
                pointerEvents: "none",
                width: "48px",
                height: "34px",
                willChange: "left, top",
            }}
        >
            <div className="india-flag-cursor">

                {/* Saffron */}
                <div className="flag-saffron" />

                {/* White + Ashoka Chakra */}
                <div className="flag-white">
                    <div className="ashoka-chakra">
                        {Array.from({ length: 24 }).map(
                            (_, i) => (
                                <span
                                    key={i}
                                    style={{
                                        transform: `rotate(${i * 15}deg)`,
                                    }}
                                />
                            )
                        )}
                    </div>
                </div>

                {/* Green */}
                <div className="flag-green" />

            </div>

            <style jsx>{`
                .india-flag-cursor {
                    width: 48px;
                    height: 32px;
                    position: relative;
                    overflow: hidden;
                    border-radius: 2px;
                    box-shadow:
                        0 3px 8px rgba(0, 0, 0, 0.28);
                    transform-origin: left center;
                    animation: flagWave 1.6s ease-in-out infinite;
                }

                .flag-saffron,
                .flag-white,
                .flag-green {
                    width: 100%;
                    height: 33.333%;
                }

                .flag-saffron {
                    background: #ff9933;
                }

                .flag-white {
                    background: #ffffff;
                    position: relative;
                }

                .flag-green {
                    background: #138808;
                }

                /* Ashoka Chakra */
                .ashoka-chakra {
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    border: 1.5px solid #000080;
                    border-radius: 50%;
                    animation: chakraSpin 5s linear infinite;
                }

                .ashoka-chakra::before {
                    content: "";
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 1px;
                    height: 11px;
                    background: #000080;
                    transform: translate(-50%, -50%);
                }

                .ashoka-chakra::after {
                    content: "";
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 1px;
                    height: 11px;
                    background: #000080;
                    transform: translate(-50%, -50%)
                        rotate(90deg);
                }

                .ashoka-chakra span {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 1px;
                    height: 11px;
                    background: #000080;
                    transform-origin: center;
                }

                @keyframes flagWave {
                    0% {
                        transform:
                            perspective(180px)
                            rotateY(0deg)
                            rotateZ(-4deg);
                    }

                    25% {
                        transform:
                            perspective(180px)
                            rotateY(-12deg)
                            rotateZ(1deg);
                    }

                    50% {
                        transform:
                            perspective(180px)
                            rotateY(0deg)
                            rotateZ(4deg);
                    }

                    75% {
                        transform:
                            perspective(180px)
                            rotateY(12deg)
                            rotateZ(0deg);
                    }

                    100% {
                        transform:
                            perspective(180px)
                            rotateY(0deg)
                            rotateZ(-4deg);
                    }
                }

                @keyframes chakraSpin {
                    from {
                        transform:
                            translate(-50%, -50%)
                            rotate(0deg);
                    }

                    to {
                        transform:
                            translate(-50%, -50%)
                            rotate(360deg);
                    }
                }

                @media (max-width: 768px) {
                    .india-flag-cursor {
                        display: none;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .india-flag-cursor,
                    .ashoka-chakra {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}