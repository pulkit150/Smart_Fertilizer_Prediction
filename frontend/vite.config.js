// vite.config.js
// ─────────────────────────────────────────────────────────────────────────────
// Vite is the build tool — it serves your React app in dev mode and bundles
// it for production.
//
// The `proxy` setting is the most important part here for development:
// When the browser makes a request to /api/anything, Vite intercepts it and
// forwards it to http://localhost:5000/api/anything (our Express backend).
//
// Why? Browsers block cross-origin requests by default (CORS).
// Rather than dealing with CORS in dev, we proxy everything through the
// same origin (localhost:5173). In production, you'd configure your
// web server (nginx/Vercel) to do the same thing.
// ─────────────────────────────────────────────────────────────────────────────

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Any fetch/axios call starting with /api goes to Express
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
