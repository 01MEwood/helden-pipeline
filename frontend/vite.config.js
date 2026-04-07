import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite Config für helden-pipeline
// host 0.0.0.0 = nötig für Docker / WSL Dev
// build → dist/ wird vom nginx-Image serviert
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
