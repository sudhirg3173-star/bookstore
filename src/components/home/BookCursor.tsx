"use client";

import { useEffect, useRef, useState } from "react";

export default function BookCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);

    const mouse = useRef({ x: 0, y: 0 });
    const position = useRef({ x: 0, y: 0 });
    const animationFrame = useRef<number | null>(null);

    const [visible, setVisible] = useState(false);
    const [hovering, setHovering] = useState(false);

    useEffect(() => {
        // Don't show custom cursor on touch/mobile devices
        if (
            window.matchMedia("(hover: none), (pointer: coarse)").matches
        ) {
            return;
        }

        const handleMouseMove = (e: MouseEvent) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;

            setVisible(true);
        };

        const handleMouseLeave = () => {
            setVisible(false);
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (
                target.closest(
                    "a, button, input, textarea, select, [role='button'], .book-card, .product-card"
                )
            ) {
                setHovering(true);
            } else {
                setHovering(false);
            }
        };

        const animate = () => {
            // Smooth following effect
            position.current.x +=
                (mouse.current.x - position.current.x) * 0.14;

            position.current.y +=
                (mouse.current.y - position.current.y) * 0.14;

            if (cursorRef.current) {
                cursorRef.current.style.transform = `
                    translate3d(
                        ${position.current.x + 14}px,
                        ${position.current.y + 14}px,
                        0
                    )
                    rotate(${hovering ? "-8deg" : "-4deg"})
                    scale(${hovering ? 1.25 : 1})
                `;
            }

            animationFrame.current =
                requestAnimationFrame(animate);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseout", handleMouseLeave);
        window.addEventListener("mouseover", handleMouseOver);

        animationFrame.current =
            requestAnimationFrame(animate);

        return () => {
            window.removeEventListener(
                "mousemove",
                handleMouseMove
            );

            window.removeEventListener(
                "mouseout",
                handleMouseLeave
            );

            window.removeEventListener(
                "mouseover",
                handleMouseOver
            );

            if (animationFrame.current) {
                cancelAnimationFrame(
                    animationFrame.current
                );
            }
        };
    }, [hovering]);

    if (!visible) {
        return null;
    }

    return (
        <div
            ref={cursorRef}
            aria-hidden="true"
            className="fixed left-0 top-0 z-[99999] pointer-events-none select-none"
            style={{
                width: hovering ? "42px" : "34px",
                height: hovering ? "42px" : "34px",
                transition:
                    "width 180ms ease, height 180ms ease, transform 120ms ease-out",
                transformOrigin: "center center",
                willChange: "transform",
            }}
        >
            {/* Book */}
            <div
                className="flex items-center justify-center w-full h-full"
                style={{
                    filter: hovering
                        ? "drop-shadow(0 5px 8px rgba(0,0,0,0.25))"
                        : "drop-shadow(0 3px 5px rgba(0,0,0,0.18))",
                }}
            >
                <span
                    style={{
                        fontSize: hovering
                            ? "32px"
                            : "27px",
                        lineHeight: 1,
                        display: "block",
                    }}
                >
                    📖
                </span>
            </div>
        </div>
    );
}