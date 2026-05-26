/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172026",
        muted: "#667085",
        panel: "#ffffff",
        line: "#e6e8ec",
        surface: "#f5f7fb",
        discovery: "#2563eb",
        delivery: "#f59e0b",
        rollout: "#10b981",
      },
      boxShadow: {
        soft: "0 12px 28px rgba(23, 32, 38, 0.08)",
      },
    },
  },
  plugins: [],
};
