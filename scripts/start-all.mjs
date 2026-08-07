import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

console.log("🚀 Starting CareBridge One Full Stack Environment...");
console.log("🌐 Frontend Dev Server: http://localhost:5173 (Host: 0.0.0.0)");
console.log("⚡ Backend Auth API:   http://localhost:8787");
console.log("----------------------------------------------------\n");

const serverProc = spawn("node", [resolve(rootDir, "server/index.mjs")], {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
});

const vitePath = resolve(rootDir, "node_modules/vite/bin/vite.js");
const viteProc = spawn("node", [vitePath, "--host", "0.0.0.0"], {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
});

function cleanup() {
  console.log("\nShutting down CareBridge processes...");
  try { serverProc.kill(); } catch {}
  try { viteProc.kill(); } catch {}
}

process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});

process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});
