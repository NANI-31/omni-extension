import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { execSync } from "child_process";

function injectedBundlerPlugin() {
  return {
    name: "injected-bundler-watch",
    buildStart() {
      try {
        execSync("node scripts/bundle-injected.js", { stdio: "inherit" });
      } catch (_) {}
    },
    handleHotUpdate({ file }) {
      if (file.includes("src/chrome/youtube/injected") || file.includes("src\\chrome\\youtube\\injected")) {
        try {
          execSync("node scripts/bundle-injected.js", { stdio: "inherit" });
        } catch (_) {}
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), injectedBundlerPlugin()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        popup: resolve(import.meta.dirname, "index.html"),
        background: resolve(import.meta.dirname, "src/chrome/background.js"),
        content: resolve(import.meta.dirname, "src/chrome/instagrab/content.js"),
        skiptimer: resolve(import.meta.dirname, "src/chrome/skiptimer/content.js"),
        youtube: resolve(import.meta.dirname, "src/chrome/youtube/content.js"),
        pinterest: resolve(import.meta.dirname, "src/chrome/pinterest/content.js"),
        videograb: resolve(import.meta.dirname, "src/chrome/videograb/content.js"),
        adblock: resolve(import.meta.dirname, "src/chrome/adblock/content.js"),
        adblockMain: resolve(import.meta.dirname, "src/chrome/adblock/mainWorldShield.js"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (
            chunkInfo.name === "background" ||
            chunkInfo.name === "content" ||
            chunkInfo.name === "skiptimer" ||
            chunkInfo.name === "youtube" ||
            chunkInfo.name === "pinterest" ||
            chunkInfo.name === "videograb" ||
            chunkInfo.name === "adblock"
          ) {
            return "[name].js";
          }
          if (chunkInfo.name === "adblockMain") {
            return "adblock-main.js";
          }
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react/") || id.includes("scheduler")) {
              return "vendor-react";
            }
            if (id.includes("framer-motion")) {
              return "vendor-framer";
            }
            if (id.includes("@reduxjs") || id.includes("react-redux")) {
              return "vendor-redux";
            }
            return "vendor-utils";
          }
        },
      },
    },
  },
});

