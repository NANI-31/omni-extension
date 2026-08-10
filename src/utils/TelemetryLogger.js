/**
 * TelemetryLogger
 * Privacy-focused client-side error boundary & logging pipeline.
 * Captures UI render crashes, unhandled promise rejections, and uncaught errors
 * into an in-memory circular debug buffer (max 100 entries).
 */

class TelemetryLogger {
  constructor() {
    this.buffer = [];
    this.maxLogs = 100;
    this._initGlobalHandlers();
  }

  /** Sanitize error message to prevent leaking credentials or tokens */
  _sanitize(text) {
    if (!text) return "";
    return String(text)
      .replace(/access_token=[^&]+/gi, "access_token=[REDACTED]")
      .replace(/bearer\s+[a-z0-9\-\._~\+\/]+=*/gi, "Bearer [REDACTED]");
  }

  /** Global window error & rejection listeners */
  _initGlobalHandlers() {
    if (typeof window === "undefined") return;

    window.addEventListener("error", (event) => {
      this.logError(event.error || event.message, {
        source: "window.onerror",
        filename: event.filename,
        lineno: event.lineno,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.logError(event.reason, {
        source: "unhandledrejection",
      });
    });
  }

  /** Record error entry */
  logError(error, context = {}) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: "ERROR",
      message: this._sanitize(error?.message || String(error)),
      stack: this._sanitize(error?.stack || ""),
      context,
    };

    this.buffer.unshift(entry);
    if (this.buffer.length > this.maxLogs) {
      this.buffer.pop();
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("[TelemetryLogger]", entry.message, context);
    }
  }

  /** Record warning entry */
  logWarning(message, context = {}) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: "WARN",
      message: this._sanitize(message),
      context,
    };

    this.buffer.unshift(entry);
    if (this.buffer.length > this.maxLogs) {
      this.buffer.pop();
    }
  }

  /** Retrieve log buffer */
  getLogs() {
    return [...this.buffer];
  }

  /** Clear buffer */
  clearLogs() {
    this.buffer = [];
  }

  /** Export logs as JSON blob string */
  exportLogs() {
    return JSON.stringify(this.buffer, null, 2);
  }
}

export const telemetryLogger = new TelemetryLogger();