// Omni Extension — Injected Script Modular Assembler
// Compiles modular components in src/chrome/youtube/injected/ into public/youtube-injected.js
// preserving 100% logic, variable scope, comments, and browser execution semantics.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const injectedSrcDir = path.resolve(rootDir, "src/chrome/youtube/injected");
const publicOutFile = path.resolve(rootDir, "public/youtube-injected.js");
const distOutFile = path.resolve(rootDir, "dist/youtube-injected.js");

const MODULE_FILES = [
  "youtubeAdShield.js",
  "hotstarAdShield.js",
  "hudStyles.js",
  "videoFilters.js",
  "playerAdapter.js",
  "videoControls.js",
];

function cleanModuleContent(content) {
  // Strip import statements
  let cleaned = content.replace(/^\s*import\s+[^;]+;\s*$/gm, "");
  // Replace export function / export const with plain declarations
  cleaned = cleaned.replace(/^\s*export\s+function\s+/gm, "function ");
  cleaned = cleaned.replace(/^\s*export\s+const\s+/gm, "const ");
  cleaned = cleaned.replace(/^\s*export\s+let\s+/gm, "let ");
  return cleaned.trim();
}

function bundle() {
  console.log("Bundling modular injected scripts into public/youtube-injected.js...");

  let output = `// General Video Tools Injected Script (Main World Context)\n`;
  output += `// Auto-generated from src/chrome/youtube/injected/ modules. Do not edit directly.\n`;
  output += `(function () {\n\n`;

  for (const file of MODULE_FILES) {
    const filePath = path.join(injectedSrcDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: Module file not found: ${filePath}`);
      process.exit(1);
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const cleaned = cleanModuleContent(raw);
    output += `  // ── [Module: ${file}] ───────────────────────────────\n`;
    output += cleaned
      .split("\n")
      .map((line) => (line.length > 0 ? `  ${line}` : ""))
      .join("\n");
    output += `\n\n`;
  }

  // Execution bootstrap
  output += `  // ── Modular Engine Execution Bootstrap ────────────────────────────────\n`;
  output += `  const host = typeof window !== "undefined" && window.location && window.location.hostname ? window.location.hostname.toLowerCase() : "";\n`;
  output += `  const EXCLUDED_HOSTS = ["claude.ai", "anthropic.com", "chatgpt.com", "openai.com", "instagram.com"];\n`;
  output += `  if (EXCLUDED_HOSTS.some((h) => host.includes(h))) return;\n\n`;
  output += `  initYouTubeAdShield();\n`;
  output += `  initHotstarAdShield();\n`;
  output += `  initVideoFilters();\n`;
  output += `  initVideoControls();\n`;
  output += `})();\n`;

  fs.writeFileSync(publicOutFile, output, "utf-8");
  console.log(`  ✓ Successfully wrote ${publicOutFile} (${output.length} bytes)`);

  if (fs.existsSync(path.dirname(distOutFile))) {
    fs.writeFileSync(distOutFile, output, "utf-8");
    console.log(`  ✓ Successfully synchronized ${distOutFile}`);
  }
}

bundle();
