/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        urgent: "#ef4444",
        obsidian: "#0f172a",
        charcoal: "#1e293b",
        slate: {
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          400: "#94a3b8",
          100: "#f1f5f9",
        }
      }
    },
  },
  plugins: [],
}
