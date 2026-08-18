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

            animationFrame = requestAnimationFrame(animate);
        };

        animationFrame = requestAnimationFrame(animate);

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
                width: "60px",
                height: "60px",
                zIndex: 2147483647,
                pointerEvents: "none",
                userSelect: "none",
                willChange: "left, top",
            }}
        >
            <span
                style={{
                    display: "block",
                    fontSize: "42px",
                    lineHeight: "1",
                    animation:
                        "bookFloat 2.2s ease-in-out infinite",
                    filter:
                        "drop-shadow(0 3px 5px rgba(0,0,0,0.22))",
                }}
            >
                📖
            </span>

            <style jsx>{`
                @keyframes bookFloat {
                    0% {
                        transform:
                            rotate(-8deg)
                            translateY(0)
                            scale(1);
                    }

                    25% {
                        transform:
                            rotate(3deg)
                            translateY(-3px)
                            scale(1.08);
                    }

                    50% {
                        transform:
                            rotate(8deg)
                            translateY(-5px)
                            scale(1);
                    }

                    75% {
                        transform:
                            rotate(-3deg)
                            translateY(-2px)
                            scale(1.08);
                    }

                    100% {
                        transform:
                            rotate(-8deg)
                            translateY(0)
                            scale(1);
                    }
                }

                @media (max-width: 768px) {
                    div {
                        display: none;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    span {
                        animation: none !important;
                    }
                }
            `}</style>
        </div>
    );
}