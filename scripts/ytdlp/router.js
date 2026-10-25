// ── HTTP Endpoint Router & Request Handler ──────────────────────────────
// Serves REST API endpoints for extension health checks, triggering downloads,
// progress polling, job listings, Explorer folder opening, and shutdown commands.

import { spawn } from "child_process";
import { PORT, getDownloadDirectory, getYtDlpVersion } from "./config.js";
import { jobs, startDownloadJob } from "./jobManager.js";

export async function handleRequest(req, res, server) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);

  // Health check endpoint
  if (parsedUrl.pathname === "/health" || parsedUrl.pathname === "/ping") {
    const version = await getYtDlpVersion();
    const defaultDir = getDownloadDirectory();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: !!version,
        installed: !!version,
        version: version || "Not found on PATH",
        downloadDir: defaultDir,
      })
    );
    return;
  }

  // Trigger download endpoint
  if (parsedUrl.pathname === "/download" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        if (!payload.url) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing required 'url' parameter" }));
          return;
        }

        const job = startDownloadJob(payload);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            jobId: job.id,
            status: job.status,
            stage: job.stage,
            downloadDir: job.downloadDir,
          })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Check progress endpoint
  if (parsedUrl.pathname === "/progress" && req.method === "GET") {
    const id = parsedUrl.searchParams.get("id");
    const job = jobs.get(id);

    if (!job) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Job not found" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        id: job.id,
        percent: job.percent,
        stage: job.stage,
        speed: job.speed,
        eta: job.eta,
        status: job.status,
        filename: job.filename,
        error: job.error,
      })
    );
    return;
  }

  // List all recent/active jobs endpoint
  if (parsedUrl.pathname === "/jobs" && req.method === "GET") {
    const list = Array.from(jobs.values()).map((j) => ({
      id: j.id,
      url: j.url,
      videoId: j.videoId,
      percent: j.percent,
      stage: j.stage,
      status: j.status,
      speed: j.speed,
      eta: j.eta,
      filename: j.filename,
      startTime: j.startTime,
    }));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ jobs: list }));
    return;
  }

  // Open download folder in Explorer
  if (parsedUrl.pathname === "/open-folder") {
    const folder = parsedUrl.searchParams.get("folder") || "OmniVideos";
    const dir = getDownloadDirectory(folder);
    spawn("explorer.exe", [dir], { detached: true, stdio: "ignore" }).unref();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, path: dir }));
    return;
  }

  // Shutdown companion server endpoint (called automatically after download finishes if requested)
  if (parsedUrl.pathname === "/shutdown" && (req.method === "POST" || req.method === "GET")) {
    const force = parsedUrl.searchParams.get("force") === "true";
    const activeJobs = Array.from(jobs.values()).filter((j) => j.status === "downloading");

    if (activeJobs.length > 0 && !force) {
      res.writeHead(409, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Cannot shut down: downloads are currently in progress",
          activeJobs: activeJobs.length,
        })
      );
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        message: "Omni companion server shutting down gracefully...",
      })
    );
    console.log(`\n🛑 [Companion Server] Shutdown requested from Omni Extension. Terminating process...`);
    setTimeout(() => {
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 800);
    }, 300);
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Endpoint not found" }));
}
