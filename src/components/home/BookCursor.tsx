"use client";

import { useEffect, useRef } from "react";

export default function BookCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);

    const mouseX = useRef(0);
    const mouseY = useRef(0);

    const currentX = useRef(0);
    const currentY = useRef(0);

    const animationFrame = useRef<number | null>(null);

    useEffect(() => {
        // Only activate on desktop devices
        const isTouchDevice =
            window.matchMedia("(hover: none), (pointer: coarse)").matches;

        if (isTouchDevice) {
            return;
        }

        const handleMouseMove = (event: MouseEvent) => {
            mouseX.current = event.clientX;
            mouseY.current = event.clientY;
        };

        const animate = () => {
            // Smooth movement
            currentX.current +=
                (mouseX.current - currentX.current) * 0.15;

            currentY.current +=
                (mouseY.current - currentY.current) * 0.15;

            if (cursorRef.current) {
                cursorRef.current.style.transform = `
                    translate3d(
                        ${currentX.current + 16}px,
                        ${currentY.current + 16}px,
                        0
                    )
                `;
            }

            animationFrame.current =
                requestAnimationFrame(animate);
        };

        window.addEventListener("mousemove", handleMouseMove);

        animationFrame.current =
            requestAnimationFrame(animate);

        return () => {
            window.removeEventListener(
                "mousemove",
                handleMouseMove
            );

            if (animationFrame.current !== null) {
                cancelAnimationFrame(
                    animationFrame.current
                );
            }
        };
    }, []);

    return (
        <div
            ref={cursorRef}
            aria-hidden="true"
            className="fixed pointer-events-none select-none z-[999999]"
            style={{
                left: 0,
                top: 0,
                width: "38px",
                height: "38px",
                fontSize: "30px",
                lineHeight: 1,
                willChange: "transform",
                transition: "transform 0.08s linear",
            }}
        >
            📖
        </div>
    );
}