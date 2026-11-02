/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#111827",
          50: "#EEF6EF",
          100: "#DCEBDD",
          400: "#64748B",
          600: "#334155",
          900: "#063B24",
        },
        canvas: {
          DEFAULT: "#F7FAF7",
          soft: "#EEF6EF",
        },
        amber: {
          DEFAULT: "#8EDB1F",
          dark: "#087A3D",
          light: "#E4F6C5",
        },
        denim: {
          DEFAULT: "#087A3D",
          dark: "#063B24",
        },
        moss: {
          DEFAULT: "#3FAE45",
          light: "#E1F3E2",
        },
        rust: {
          DEFAULT: "#DC2626",
          light: "#FEE2E2",
        },
        brand: {
          dark: "#063B24",
          DEFAULT: "#087A3D",
          light: "#8EDB1F",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Work Sans'", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};
