import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "src/chrome/background.js"),
        content: resolve(__dirname, "src/chrome/instagrab/content.js"),
        skiptimer: resolve(__dirname, "src/chrome/skiptimer/content.js"),
        youtube: resolve(__dirname, "src/chrome/youtube/content.js"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (
            chunkInfo.name === "background" ||
            chunkInfo.name === "content" ||
            chunkInfo.name === "skiptimer" ||
            chunkInfo.name === "youtube"
          ) {
            return "[name].js";
          }
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
