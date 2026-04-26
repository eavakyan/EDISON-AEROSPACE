import { appendFile, readFile } from 'node:fs/promises';
import { leadsPath, consumedPath } from './config.js';

export async function appendLead(lead) {
  const line = JSON.stringify(lead) + '\n';
  await appendFile(leadsPath, line, { encoding: 'utf8', mode: 0o640 });
}

// Track consumed token IDs (jti) so a verification link can only be used once.
// Keep the file small: each entry is ~50 bytes; 30-min TTL means turnover is fast.
// At low volume we don't need a real DB.
export async function markTokenConsumed(jti) {
  const line = JSON.stringify({ jti, t: Date.now() }) + '\n';
  await appendFile(consumedPath, line, { encoding: 'utf8', mode: 0o640 });
}

let consumedCache = null;
let consumedCacheLoadedAt = 0;
const CACHE_TTL_MS = 60_000;

async function loadConsumed() {
  try {
    const raw = await readFile(consumedPath, 'utf8');
    const set = new Set();
    const cutoff = Date.now() - 24 * 3600 * 1000; // keep 24h, drop older entries from in-memory check
    for (const line of raw.split('\n')) {
      if (!line) continue;
      try {
        const { jti, t } = JSON.parse(line);
        if (typeof t === 'number' && t < cutoff) continue;
        if (jti) set.add(jti);
      } catch { /* ignore malformed line */ }
    }
    return set;
  } catch (err) {
    if (err.code === 'ENOENT') return new Set();
    throw err;
  }
}

export async function isTokenConsumed(jti) {
  if (!consumedCache || Date.now() - consumedCacheLoadedAt > CACHE_TTL_MS) {
    consumedCache = await loadConsumed();
    consumedCacheLoadedAt = Date.now();
  }
  if (consumedCache.has(jti)) return true;
  // Fall back to a fresh disk read in case another process appended within the cache window.
  const fresh = await loadConsumed();
  consumedCache = fresh;
  consumedCacheLoadedAt = Date.now();
  return fresh.has(jti);
}
