// ── Inactivity Auto-Shutdown Timer ────────────────────────────────────────
// Automatically terminates the background companion process after 10 minutes
// of complete inactivity when no active downloads are running, preserving RAM.

import { jobs } from "./jobManager.js";

let idleTimer = null;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

export function resetIdleTimer(server) {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    const active = Array.from(jobs.values()).some((j) => j.status === "downloading");
    if (!active) {
      console.log(`\n💤 [Companion Server] Inactive for 10 minutes. Auto-shutting down to save memory...`);
      if (server) {
        server.close(() => process.exit(0));
      }
      setTimeout(() => process.exit(0), 1000);
    } else {
      resetIdleTimer(server);
    }
  }, IDLE_TIMEOUT_MS);
}
