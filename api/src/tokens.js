import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { config } from './config.js';

// Compact signed token: base64url(payload).base64url(hmac).
// Payload is JSON: { e: email, n: name, c: company, r: role, exp: unixSec, jti: nonce }.
// HMAC-SHA256 over the payload string (not over the base64url) — keeps it
// dependency-free without a JWT library.

function b64urlEncode(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

function hmac(secret, data) {
  return createHmac('sha256', secret).update(data).digest();
}

export function createAccessToken({ name, email, company, role }) {
  const exp = Math.floor(Date.now() / 1000) + config.tokenTtlMinutes * 60;
  const jti = randomBytes(12).toString('hex');
  const payload = { e: email, n: name, c: company || '', r: role || '', exp, jti };
  const payloadStr = JSON.stringify(payload);
  const sig = hmac(config.tokenSecret, payloadStr);
  return `${b64urlEncode(payloadStr)}.${b64urlEncode(sig)}`;
}

export function verifyAccessToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) {
    return { ok: false, reason: 'malformed' };
  }
  const [encPayload, encSig] = token.split('.');
  if (!encPayload || !encSig) return { ok: false, reason: 'malformed' };

  let payloadStr;
  try {
    payloadStr = b64urlDecode(encPayload).toString('utf8');
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  const expected = hmac(config.tokenSecret, payloadStr);
  let received;
  try { received = b64urlDecode(encSig); } catch { return { ok: false, reason: 'malformed' }; }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { ok: false, reason: 'bad_signature' };
  }

  let payload;
  try { payload = JSON.parse(payloadStr); } catch { return { ok: false, reason: 'malformed' }; }

  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, payload };
}

// Session cookies: same scheme, longer TTL, smaller payload (just email).
export function createSessionToken({ email, name }) {
  const exp = Math.floor(Date.now() / 1000) + config.cookieTtlDays * 86400;
  const payload = { e: email, n: name || '', exp };
  const payloadStr = JSON.stringify(payload);
  const sig = hmac(config.tokenSecret, payloadStr);
  return `${b64urlEncode(payloadStr)}.${b64urlEncode(sig)}`;
}

export function verifySessionToken(token) {
  // Same algorithm — reuse verifyAccessToken logic.
  return verifyAccessToken(token);
}
