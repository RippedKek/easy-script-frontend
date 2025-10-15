import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light theme: blue/white
        light: {
          bg: "#f8fbff",
          card: "#ffffff",
          primary: "#0ea5e9", // sky-500
          primaryDark: "#0284c7", // sky-600
          text: "#0b132b",
          subtle: "#e2e8f0"
        },
        // Dark theme: black/blue
        dark: {
          bg: "#0b1220",
          card: "#0f172a", // slate-900
          primary: "#38bdf8", // sky-400
          primaryDark: "#0ea5e9",
          text: "#e2e8f0",
          subtle: "#1e293b"
        }
      },
      boxShadow: {
        soft: "0 10px 25px -10px rgba(2,132,199,0.25)",
      },
      borderRadius: {
        '2xl': "1.25rem"
      }
    },
  },
  plugins: [],
};
export default config;
