/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                nordic: {
                    bg: '#020617', // Slate 950
                    surface: '#0f172a', // Slate 900
                    highlight: '#1e293b', // Slate 800
                    text: '#f8fafc', // Slate 50
                    muted: '#94a3b8', // Slate 400
                    accent: '#6366f1', // Indigo 500
                    accentHover: '#818cf8', // Indigo 400
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
