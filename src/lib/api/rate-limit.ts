// Best-effort in-memory rate limit for the public inquiry endpoint.
//
// Known limitation: this state is per server instance/process. On a
// serverless platform (Vercel etc.) with multiple concurrent instances, each
// instance tracks its own counters, so the effective limit is
// `limit * instanceCount`, and a cold start resets it. It stops naive
// single-instance spam scripts, but a determined abuser distributed across
// instances is not fully blocked. If abuse shows up in production data,
// upgrade this to a shared store (e.g. Upstash Redis) — flagged as a
// follow-up rather than added speculatively now.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 3;

const hits = new Map<string, number[]>();

// Lazy per-key cleanup (in isRateLimited) only prunes stale timestamps for
// IPs that come back. An IP that hits once and never returns leaves its
// entry in `hits` forever. Sweep the whole map periodically to bound growth
// even for one-off callers. `unref()` so this timer doesn't keep a
// short-lived process (build, tests) alive.
const SWEEP_INTERVAL_MS = WINDOW_MS * 5;
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of hits) {
    const fresh = timestamps.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) {
      hits.delete(key);
    } else {
      hits.set(key, fresh);
    }
  }
}, SWEEP_INTERVAL_MS).unref?.();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return false;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
