import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "src/chrome/background.js"),
        content: resolve(__dirname, "src/chrome/instagrab/content.js"),
        skiptimer: resolve(__dirname, "src/chrome/skiptimer/content.js"),
        youtube: resolve(__dirname, "src/chrome/youtube/content.js"),
        pinterest: resolve(__dirname, "src/chrome/pinterest/content.js"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (
            chunkInfo.name === "background" ||
            chunkInfo.name === "content" ||
            chunkInfo.name === "skiptimer" ||
            chunkInfo.name === "youtube" ||
            chunkInfo.name === "pinterest"
          ) {
            return "[name].js";
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

