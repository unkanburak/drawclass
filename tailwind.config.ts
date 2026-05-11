import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        kid: ["'Comic Neue'", "'Comic Sans MS'", "system-ui", "sans-serif"]
      },
      colors: {
        crayon: {
          blue: "#3b82f6",
          red: "#ef4444",
          green: "#22c55e",
          purple: "#a855f7",
          yellow: "#f59e0b"
        }
      },
      animation: {
        wiggle: "wiggle 0.6s ease-in-out infinite"
      },
      keyframes: {
        wiggle: {
          "0%,100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" }
        }
      }
    }
  },
  plugins: []
};
export default config;
