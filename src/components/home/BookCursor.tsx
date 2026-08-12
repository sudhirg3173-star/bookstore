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
                    `${currentX.current + 16}px`;

                cursorRef.current.style.top =
                    `${currentY.current + 16}px`;
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
                width: "46px",
                height: "32px",
                willChange: "left, top",
            }}
        >
            <div className="india-flag-cursor">
                <div className="flag-saffron"></div>

                <div className="flag-white">
                    <div className="ashoka-chakra">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>

                <div className="flag-green"></div>
            </div>

            <style jsx>{`
                .india-flag-cursor {
                    width: 46px;
                    height: 31px;
                    position: relative;
                    overflow: hidden;
                    border-radius: 2px;
                    box-shadow:
                        0 3px 8px rgba(0, 0, 0, 0.25);
                    transform-origin: left center;
                    animation: flagWave 1.8s ease-in-out infinite;
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

                .ashoka-chakra {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    border: 1.5px solid #000080;
                    border-radius: 50%;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    animation: chakraSpin 5s linear infinite;
                }

                .ashoka-chakra::before,
                .ashoka-chakra::after {
                    content: "";
                    position: absolute;
                    left: 50%;
                    top: -1px;
                    width: 1px;
                    height: 10px;
                    background: #000080;
                    transform-origin: center;
                }

                .ashoka-chakra::after {
                    transform: rotate(90deg);
                }

                .ashoka-chakra span {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 1px;
                    height: 10px;
                    background: #000080;
                    transform-origin: center;
                }

                .ashoka-chakra span:nth-child(1) {
                    transform: translate(-50%, -50%) rotate(15deg);
                }

                .ashoka-chakra span:nth-child(2) {
                    transform: translate(-50%, -50%) rotate(30deg);
                }

                .ashoka-chakra span:nth-child(3) {
                    transform: translate(-50%, -50%) rotate(45deg);
                }

                .ashoka-chakra span:nth-child(4) {
                    transform: translate(-50%, -50%) rotate(60deg);
                }

                .ashoka-chakra span:nth-child(5) {
                    transform: translate(-50%, -50%) rotate(75deg);
                }

                .ashoka-chakra span:nth-child(6) {
                    transform: translate(-50%, -50%) rotate(105deg);
                }

                .ashoka-chakra span:nth-child(7) {
                    transform: translate(-50%, -50%) rotate(120deg);
                }

                .ashoka-chakra span:nth-child(8) {
                    transform: translate(-50%, -50%) rotate(135deg);
                }

                .ashoka-chakra span:nth-child(9) {
                    transform: translate(-50%, -50%) rotate(150deg);
                }

                .ashoka-chakra span:nth-child(10) {
                    transform: translate(-50%, -50%) rotate(165deg);
                }

                .ashoka-chakra span:nth-child(11) {
                    transform: translate(-50%, -50%) rotate(180deg);
                }

                .ashoka-chakra span:nth-child(12) {
                    transform: translate(-50%, -50%) rotate(195deg);
                }

                @keyframes flagWave {
                    0% {
                        transform: perspective(150px)
                            rotateY(0deg)
                            rotateZ(-5deg);
                    }

                    25% {
                        transform: perspective(150px)
                            rotateY(-12deg)
                            rotateZ(2deg);
                    }

                    50% {
                        transform: perspective(150px)
                            rotateY(0deg)
                            rotateZ(5deg);
                    }

                    75% {
                        transform: perspective(150px)
                            rotateY(12deg)
                            rotateZ(0deg);
                    }

                    100% {
                        transform: perspective(150px)
                            rotateY(0deg)
                            rotateZ(-5deg);
                    }
                }

                @keyframes chakraSpin {
                    from {
                        transform: translate(-50%, -50%)
                            rotate(0deg);
                    }

                    to {
                        transform: translate(-50%, -50%)
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