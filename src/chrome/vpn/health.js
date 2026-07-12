// ─── Proxy Health Scoring Module (Service Worker Context) ─────────────────────
// Tracks per-proxy success/failure rates and computes a 0-100 health score.
// Used for intelligent sorting and auto-rotation within country groups.

const HEALTH_KEY = "vpnProxyHealth";

/** Canonical storage key for a proxy */
export function proxyKey(host, port) {
  return `${host}:${port}`;
}

/**
 * Calculate health score (0–100) from stored health record.
 * - Untested proxies start at 50 (neutral).
 * - Score decays over 48 h of inactivity to promote freshly-verified proxies.
 */
export function calculateScore(health) {
  if (!health) return 50;
  const total = (health.successCount || 0) + (health.failureCount || 0);
  if (total === 0) return 50;
  const successRate = health.successCount / total;
  const hoursSince = (Date.now() - (health.lastChecked || 0)) / 3_600_000;
  // Decay to 40 % of base score after 48 h
  const recency = Math.max(0.4, 1 - hoursSince / 48);
  return Math.round(successRate * 100 * recency);
}

/** Load all health data from local storage */
export function loadHealth() {
  return new Promise((resolve) =>
    chrome.storage.local.get([HEALTH_KEY], (d) => resolve(d[HEALTH_KEY] || {}))
  );
}

/** Persist health data */
export function saveHealth(data) {
  return new Promise((resolve) =>
    chrome.storage.local.set({ [HEALTH_KEY]: data }, resolve)
  );
}

/**
 * Record a successful connection for this proxy.
 * Called after 60 s of uptime without proxy errors.
 */
export async function recordSuccess(host, port) {
  const data = await loadHealth();
  const key = proxyKey(host, port);
  const h = data[key] || { successCount: 0, failureCount: 0 };
  h.successCount = (h.successCount || 0) + 1;
  h.lastChecked = Date.now();
  h.lastSuccess = Date.now();
  data[key] = h;
  await saveHealth(data);
  const score = calculateScore(h);
  console.log(`[Health] ✅ ${key} — success recorded. Score: ${score}`);
  return score;
}

/**
 * Record a proxy failure (network error, timeout, etc.).
 * Called automatically by the webRequest error listener.
 */
export async function recordFailure(host, port, reason) {
  const data = await loadHealth();
  const key = proxyKey(host, port);
  const h = data[key] || { successCount: 0, failureCount: 0 };
  h.failureCount = (h.failureCount || 0) + 1;
  h.lastChecked = Date.now();
  h.lastFailure = Date.now();
  h.lastFailureReason = reason || "";
  data[key] = h;
  await saveHealth(data);
  const score = calculateScore(h);
  console.warn(`[Health] ❌ ${key} — failure (${reason}). Score: ${score}`);
  return score;
}

/**
 * Sort a list of proxy objects by health score descending (best first).
 * Attaches a `healthScore` property to each proxy object.
 */
export async function sortByScore(proxies) {
  const data = await loadHealth();
  return [...proxies]
    .map((p) => ({ ...p, healthScore: calculateScore(data[proxyKey(p.host, p.port)]) }))
    .sort((a, b) => b.healthScore - a.healthScore);
}

/** Return the highest-scoring proxy from a list */
export async function getBestProxy(proxies) {
  if (!proxies?.length) return null;
  const sorted = await sortByScore(proxies);
  return sorted[0];
}

/**
 * Return the next best proxy for failover.
 * Excludes the currently active host:port to prevent immediate re-selection.
 */
export async function getNextProxy(proxies, currentHost, currentPort) {
  const others = proxies.filter(
    (p) => !(p.host === currentHost && String(p.port) === String(currentPort))
  );
  return getBestProxy(others);
}

/**
 * Enrich a flat proxy array with computed health scores from stored data.
 * Returns a new sorted array — does not mutate the original.
 */
export async function enrichAndSort(proxies) {
  return sortByScore(proxies);
}
