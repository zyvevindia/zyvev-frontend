import { execSync } from "node:child_process";
import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";
import { catalogV3AcquireDevPlugin } from "./scripts/lib/catalogV3AcquireDevPlugin.js";

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

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    ...(command === "serve" ? [catalogV3AcquireDevPlugin()] : []),
  ],

  define: {
    __EVSAVARI_BUILD_COMMIT__: JSON.stringify(BUILD_COMMIT),
    __EVSAVARI_BUILD_TIME__: JSON.stringify(BUILD_TIME),
    __EVSAVARI_RELEASE_VERSION__: JSON.stringify(RELEASE_VERSION),
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
    open: true,
  },

  preview: {
    host: "0.0.0.0",
    port: 4173,
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("react-router-dom")) {
            return "router";
          }
          if (id.includes("react")) {
            return "react";
          }
        },
      },
    },
  },

  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },

  css: {
    devSourcemap: true,
  },
}));
