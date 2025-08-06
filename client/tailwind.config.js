/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F7F5F2",
        ink: "#1C1C1C",
        muted: "#6B6B6B",
        stroke: "#EAE7E2",
        accent: {
          DEFAULT: "#8F8C7B",
          90: "#7E7B6C",
          70: "#B1AE9E",
        },
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
