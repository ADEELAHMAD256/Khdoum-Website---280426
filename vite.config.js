import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // ⬅️ THIS IS THE KEY
    allowedHosts: ["athermanous-zoey-bluish.ngrok-free.dev"],
  },
});
