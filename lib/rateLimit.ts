// Fixed-window, in-memory, per-process rate limiter.
// See CLAUDE.md: no database in this project — state lives in a Map,
// same pattern as lib/store.ts.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

interface Window {
  count: number;
  windowStart: number;
}

const windows = new Map<string, Window>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, now: number = Date.now()): RateLimitResult {
  const existing = windows.get(key);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    windows.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count < MAX_REQUESTS) {
    existing.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return { allowed: false, retryAfterSeconds: WINDOW_MS / 1000 };
}

// Prevents unbounded growth of the map across the life of the process.
export function pruneExpired(now: number = Date.now()): void {
  for (const [key, win] of windows) {
    if (now - win.windowStart >= WINDOW_MS) {
      windows.delete(key);
    }
  }
}

export function _resetForTests(): void {
  windows.clear();
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "unknown";
}
