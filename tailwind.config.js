/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Quicksand', 'Inter', 'sans-serif'], // Switched to Quicksand for Candyland feel
                body: ['Inter', 'sans-serif'],
            },
            colors: {
                // Candyland Primary: Pink to Purple gradient usually
                primary: {
                    DEFAULT: '#d946ef', // fuchsia-500
                    '50': '#fdf4ff',
                    '100': '#fae8ff',
                    '200': '#f5d0fe',
                    '300': '#f0abfc',
                    '400': '#e879f9',
                    '500': '#d946ef',
                    '600': '#c026d3',
                    '700': '#a21caf',
                },
                secondary: '#8b5cf6', // violet-500
                candy: {
                    pink: '#ec4899', // pink-500
                    purple: '#a855f7', // purple-500
                    mint: '#34d399', // emerald-400
                    yellow: '#fbbf24', // amber-400
                    blue: '#60a5fa', // blue-400
                },
                'light-bg': '#fff1f2', // rose-50
                'dark-bg': '#1e1b4b', // indigo-950
            },
            animation: {
                fadeIn: 'fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                slideUp: 'slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                bounce: 'bounce 1s infinite',
                spin: 'spin 1s linear infinite',
                'pop-in': 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            },
            keyframes: {
                fadeIn: {
                    'from': { opacity: 0, transform: 'translateY(10px) scale(0.98)' },
                    'to': { opacity: 1, transform: 'translateY(0) scale(1)' },
                },
                slideUp: {
                    'from': { opacity: 0, transform: 'translateY(30px)' },
                    'to': { opacity: 1, transform: 'translateY(0)' },
                },
                popIn: {
                    '0%': { opacity: 0, transform: 'scale(0.5)' },
                    '100%': { opacity: 1, transform: 'scale(1)' },
                },
                pulse: {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                },
                spin: {
                    'to': { transform: 'rotate(360deg)' },
                },
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            }
        },
    },
    plugins: [],
}
