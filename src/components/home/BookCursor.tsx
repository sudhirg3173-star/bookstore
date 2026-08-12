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
                (targetX.current - currentX.current) * 0.12;

            currentY.current +=
                (targetY.current - currentY.current) * 0.12;

            if (cursorRef.current) {
                cursorRef.current.style.left =
                    `${currentX.current + 12}px`;

                cursorRef.current.style.top =
                    `${currentY.current + 12}px`;
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
                width: "100px",
                height: "55px",
                zIndex: 2147483647,
                pointerEvents: "none",
                userSelect: "none",
                willChange: "left, top",
            }}
        >
            <img
                src="/images/india-wave-cursor.png"
                alt=""
                draggable={false}
                style={{
                    width: "100px",
                    height: "auto",
                    display: "block",
                    animation:
                        "indiaFlagWave 2.2s ease-in-out infinite",
                    filter:
                        "drop-shadow(0 3px 5px rgba(0,0,0,0.18))",
                }}
            />

            <style jsx>{`
                @keyframes indiaFlagWave {
                    0% {
                        transform:
                            rotate(-3deg)
                            scale(1);
                    }

                    25% {
                        transform:
                            rotate(2deg)
                            scale(1.03);
                    }

                    50% {
                        transform:
                            rotate(4deg)
                            scale(1);
                    }

                    75% {
                        transform:
                            rotate(-1deg)
                            scale(1.03);
                    }

                    100% {
                        transform:
                            rotate(-3deg)
                            scale(1);
                    }
                }

                @media (max-width: 768px) {
                    div {
                        display: none;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    img {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}