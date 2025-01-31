/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkTheme: "dark",
  darkMode: ["selector", "[data-theme='dark']"],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#93BBFB",
          "primary-content": "#212638",
          secondary: "#DAE8FF",
          "secondary-content": "#212638",
          accent: "#93BBFB",
          "accent-content": "#212638",
          neutral: "#212638",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#f4f8ff",
          "base-300": "#DAE8FF",
          "base-content": "#212638",
          info: "#93BBFB",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",
          "--rounded-btn": "9999rem",
          ".tooltip": { "--tooltip-tail": "6px" },
          ".link": { textUnderlineOffset: "2px" },
          ".link:hover": { opacity: "80%" },
        },
      },
      {
        dark: {
          primary: "#2A3242", // Slightly cooler dark navy for futuristic base
          "primary-content": "#E2E8F0", // Brighter metallic blue for contrast
          secondary: "#2D3748", // Metallic gray-blue for depth
          "secondary-content": "#81E6D9", // Futuristic teal accent
          accent: "#5B7DB1", // Enhanced metallic blue (more vibrant than previous)
          "accent-content": "#E2E8F0",
          neutral: "#2D3748", // Matching secondary for consistency
          "neutral-content": "#81E6D9", // Teal highlights
          "base-100": "#0F172A", // Deep space blue (darker base)
          "base-200": "#1E293B", // Layered depth
          "base-300": "#2D3748", // Metallic accent layer
          "base-content": "#E2E8F0", // Bright futuristic text

          info: "#5B7DB1", // Matching accent color
          success: "#34EEB6", // Glowing green (keep existing)
          warning: "#FFE08A", // Brighter amber
          error: "#FF6B6B", // More vibrant red
          "--rounded-btn": "9999rem",
          "--border-btn": "1px", // Add definition
          "--btn-focus-scale": "0.95", // Modern interaction
          // Custom futuristic additions
          "--gradient-primary": "linear-gradient(45deg, #5B7DB1 0%, #81E6D9 100%)",
          "--glow-effect": "0 0 8px rgba(129, 230, 217, 0.4)",
          ".tooltip": {
            "--tooltip-tail": "6px",
            "--tooltip-color": "oklch(var(--p))",
            "box-shadow": "var(--glow-effect)",
          },
          ".link": {
            textUnderlineOffset: "2px",
            "text-shadow": "var(--glow-effect)",
          },
          ".link:hover": {
            opacity: "90%",
            color: "#81E6D9", // Teal hover effect
          },
        },
      },
    ],
  },
  theme: {
    extend: {
      boxShadow: { center: "0 0 12px -2px rgb(0 0 0 / 0.05)" },
      animation: { "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite" },
    },
  },
};
