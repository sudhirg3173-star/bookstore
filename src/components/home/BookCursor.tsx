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
                    `${currentX.current + 18}px`;

                cursorRef.current.style.top =
                    `${currentY.current + 18}px`;
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
                width: "40px",
                height: "40px",
                fontSize: "30px",
                lineHeight: "40px",
                display: "block",
                opacity: 1,
                transform: "rotate(-8deg)",
                willChange: "left, top",
            }}
        >
            📖
        </div>
    );
}