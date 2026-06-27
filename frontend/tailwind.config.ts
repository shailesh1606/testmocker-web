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
        primaryBg: "#FFFFFF",
        pageBg: "#F7F8FA",
        primaryAccent: "#4F46E5",
        accentHover: "#4338CA",
        sidebarDark: "#1E1B4B",
        sidebarText: "#C7D2FE",
        textPrimary: "#111827",
        textSecondary: "#6B7280",
        borderLight: "#E5E7EB",
        success: "#22C55E",
        danger: "#EF4444",
        warning: "#F59E0B",
        review: "#8B5CF6",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
      },
      container: {
        center: true,
      }
    },
  },
  plugins: [],
};
export default config;
