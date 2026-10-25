// ── Download Job & Process Lifecycle Manager ──────────────────────────────
// Manages the queue of active downloads, streams subprocess stdout/stderr,
// parses percentage/speed/ETA metrics, and initiates progressive stream retries.

import { spawn } from "child_process";
import path from "path";
import { buildYtDlpArgs } from "./argsBuilder.js";

export const jobs = new Map();

export function startDownloadJob({ id, url, resolution, format, folder, filename, videoId, autoStop }) {
  // Prune jobs older than 1 hour
  const oneHourAgo = Date.now() - 3600000;
  for (const [jid, j] of jobs.entries()) {
    if (j.startTime < oneHourAgo && j.status !== "downloading") {
      jobs.delete(jid);
    }
  }

  // Reconnect if this exact job or URL is already downloading
  for (const j of jobs.values()) {
    if (j.status === "downloading" && (j.id === id || j.url === url || (videoId && j.videoId === videoId))) {
      console.log(`[Job ${j.id}] Reconnected to existing running download for ${url}`);
      if (autoStop !== undefined) j.autoStop = !!autoStop;
      return j;
    }
  }

  const jobId = id || `ytdlp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const { args, downloadDir } = buildYtDlpArgs(url, { resolution, format, folder, filename });

  const job = {
    id: jobId,
    url,
    videoId: videoId || id || "",
    autoStop: !!autoStop,
    resolution,
    format,
    folder,
    downloadDir,
    percent: 0,
    speed: "",
    eta: "",
    stage: "Starting yt-dlp...",
    status: "downloading",
    filename: "",
    error: null,
    hasRetried: false,
    startTime: Date.now(),
  };

  jobs.set(jobId, job);
  console.log(`[Job ${jobId}] Starting: yt-dlp ${args.join(" ")}`);

  const attachProcessListeners = (proc) => {
    job.process = proc;

    proc.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

      for (const line of lines) {
        // Check if file was already downloaded previously
        if (line.includes("has already been downloaded")) {
          job.percent = 100;
          job.status = "completed";
          job.stage = `File ready in Downloads/${path.basename(downloadDir)}/!`;
          const match = line.match(/\[download\]\s+(.+?)\s+has already been downloaded/);
          if (match && !job.filename) {
            job.filename = path.basename(match[1]);
          }
          continue;
        }

        // Parse download percentage: [download]  42.5% of ~ 150.00MiB at 12.3MiB/s ETA 00:04
        const progressMatch = line.match(
          /\[download\]\s+([\d.]+)%\s+of\s+(?:~?\s*[\d.]+[A-Za-z]+)(?:\s+at\s+([\d.]+[A-Za-z]+\/s))?(?:\s+ETA\s+([\d:]+))?/
        );
        if (progressMatch) {
          job.percent = Math.min(99, Math.round(parseFloat(progressMatch[1])));
          job.speed = progressMatch[2] || job.speed;
          job.eta = progressMatch[3] || job.eta;
          job.stage = `Downloading: ${job.percent}% at ${job.speed} (ETA ${job.eta})`;
          continue;
        }

        // Parse output filename: [Merger] Merging formats into "C:\...\video.mp4"
        const mergerMatch = line.match(/\[Merger\]\s+Merging formats into ["'](.+?)["']/);
        if (mergerMatch) {
          job.filename = path.basename(mergerMatch[1]);
          job.stage = "Merging audio and video tracks...";
          continue;
        }

        const destMatch = line.match(/\[(?:download|ffmpeg|ExtractAudio)\]\s+Destination:\s+(.+)/);
        if (destMatch && !job.filename) {
          job.filename = path.basename(destMatch[1].replace(/["']/g, ""));
        }
      }
    });

    proc.stderr.on("data", (chunk) => {
      const errText = chunk.toString();
      if (!errText.includes("WARNING:")) {
        console.warn(`[Job ${jobId} stderr]:`, errText.trim());
      }
    });

    proc.on("close", (code) => {
      delete job.process;
      if (code === 0) {
        job.percent = 100;
        job.status = "completed";
        job.stage = `Saved to Downloads/${path.basename(downloadDir)}/!`;
        console.log(`[Job ${jobId}] Completed successfully.`);

        // If auto-stop requested and no other downloads active, shutdown after brief delay
        if (job.autoStop) {
          console.log(`[Job ${jobId}] Auto-shutdown scheduled in 3s...`);
          setTimeout(() => {
            const hasActive = Array.from(jobs.values()).some((j) => j.status === "downloading");
            if (!hasActive) {
              console.log("No active downloads remaining. Companion server auto-shutting down.");
              process.exit(0);
            }
          }, 3000);
        }
      } else if (!job.hasRetried) {
        job.hasRetried = true;
        console.log(`[Job ${jobId}] Initial attempt exited with ${code}. Retrying with progressive fallback format...`);
        job.stage = "Retrying with direct stream...";
        const cleanFile =
          filename && filename.trim() ? filename.replace(/[\\/:*?"<>|]/g, "_").trim() : "%(title)s";
        const fallbackArgs = [
          "--no-playlist",
          "--newline",
          "--retries",
          "10",
          "--fragment-retries",
          "10",
          "-P",
          downloadDir,
          "-f",
          "bestvideo+bestaudio/best",
          "--merge-output-format",
          "mp4",
          "-o",
          `${cleanFile}.%(ext)s`,
          url,
        ];
        const retryProc = spawn("yt-dlp", fallbackArgs, { shell: false, windowsHide: true });
        attachProcessListeners(retryProc);
      } else {
        job.status = "failed";
        job.error = `yt-dlp exited with code ${code}`;
        job.stage = `Error: Exit code ${code}`;
        console.error(`[Job ${jobId}] Failed with exit code ${code}`);
      }
    });

    proc.on("error", (err) => {
      delete job.process;
      job.status = "failed";
      job.error = err.message;
      job.stage = `Error: ${err.message}`;
      console.error(`[Job ${jobId}] Spawn error:`, err);
    });
  };

  const initialProc = spawn("yt-dlp", args, { shell: false, windowsHide: true });
  attachProcessListeners(initialProc);

  return job;
}
