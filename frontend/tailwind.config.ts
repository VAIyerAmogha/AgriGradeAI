import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        grade: {
          A: "#16a34a",
          B: "#d97706",
          C: "#ea580c",
          REJECT: "#dc2626",
        },
        agri: {
          dark: "#1a4d2e",
          mid: "#2d6a4f",
          light: "#52b788",
        },
      },
      fontFamily: {
        display: ["var(--font-bitter)", "serif"],
        body: ["var(--font-nunito)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
