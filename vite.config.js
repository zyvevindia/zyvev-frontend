import { execSync } from "node:child_process";
import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

function resolveBuildCommit() {
  try {
    return execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

const BUILD_COMMIT = resolveBuildCommit();
const BUILD_TIME = new Date().toISOString();
const RELEASE_VERSION = process.env.npm_package_version || "0.0.0";

/* =========================================================
   ====================== VITE CONFIG ======================
   ========================================================= */

export default defineConfig({
  plugins: [react()],

  define: {
    __EVSAVARI_BUILD_COMMIT__: JSON.stringify(BUILD_COMMIT),
    __EVSAVARI_BUILD_TIME__: JSON.stringify(BUILD_TIME),
    __EVSAVARI_RELEASE_VERSION__: JSON.stringify(RELEASE_VERSION),
  },

  /* =======================================================
     ======================== SERVER ========================
     ======================================================= */

  server: {
    host: "0.0.0.0",
    port: 5173,
    open: true,
  },

  /* =======================================================
     ======================== PREVIEW =======================
     ======================================================= */

  preview: {
    host: "0.0.0.0",
    port: 4173,
  },

  /* =======================================================
     ========================= BUILD ========================
     ======================================================= */

  build: {
    outDir: "dist",

    sourcemap: false,

    minify: "esbuild",

    cssCodeSplit: true,

    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("react-router-dom")
          ) {
            return "router";
          }

          if (
            id.includes("react")
          ) {
            return "react";
          }
        },
      },
    },
  },

  /* =======================================================
     ========================= OPTIMIZE =====================
     ======================================================= */

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
    ],
  },

  /* =======================================================
     ========================== CSS =========================
     ======================================================= */

  css: {
    devSourcemap: true,
  },
});