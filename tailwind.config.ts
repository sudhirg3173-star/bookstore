import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#e04f51",
                    dark: "#c0393b",
                    light: "#f87172",
                },
                brand: "#1a1c2e",
            },
            fontFamily: {
                sans: ["var(--font-inter)", "system-ui", "sans-serif"],
            },
            keyframes: {
                slideDown: {
                    from: { opacity: "0", transform: "translateY(-8px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                fadeIn: {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
            },
            animation: {
                "slide-down": "slideDown 0.2s ease-out",
                "fade-in": "fadeIn 0.3s ease-out",
            },
        },
    },
    plugins: [],
};

export default config;
