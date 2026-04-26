import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';

import { config } from './config.js';
import { createAccessToken, verifyAccessToken, createSessionToken, verifySessionToken } from './tokens.js';
import { sendVerificationEmail, sendLeadNotification } from './email.js';
import { appendLead, markTokenConsumed, isTokenConsumed } from './storage.js';
import { isDisposableEmail } from './disposable-domains.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 120;
const EMAIL_MAX = 200;
const COMPANY_MAX = 160;
const ROLE_MAX = 120;

const app = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    transport: config.nodeEnv === 'production' ? undefined : { target: 'pino-pretty' },
  },
  trustProxy: true,
  bodyLimit: 16 * 1024,
});

await app.register(cookie);
await app.register(rateLimit, {
  global: false,
  // Per-IP defaults; per-route overrides below.
  max: 60,
  timeWindow: '1 minute',
});

function isStr(v) { return typeof v === 'string'; }
function clean(v, max) {
  if (!isStr(v)) return '';
  return v.replace(/\s+/g, ' ').trim().slice(0, max);
}

function validateRequestBody(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body.' };
  }

  // Honeypot — if filled, silently accept but do nothing.
  if (isStr(body.company_website) && body.company_website.trim() !== '') {
    return { ok: false, silentDrop: true };
  }

  const name = clean(body.name, NAME_MAX);
  const email = clean(body.email, EMAIL_MAX).toLowerCase();
  const company = clean(body.company, COMPANY_MAX);
  const role = clean(body.role, ROLE_MAX);

  if (!name || name.length < 1) {
    return { ok: false, error: 'Please enter your name.' };
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (isDisposableEmail(email)) {
    return { ok: false, error: 'Please use a valid business or personal email address.' };
  }

  return { ok: true, data: { name, email, company, role } };
}

// -------------------- ROUTES --------------------

app.post('/api/investors/request-access', {
  config: {
    rateLimit: { max: 5, timeWindow: '1 minute' },
  },
}, async (request, reply) => {
  const v = validateRequestBody(request.body);

  if (!v.ok && v.silentDrop) {
    // Honeypot tripped — pretend success so bots don't probe.
    return reply.code(204).send();
  }
  if (!v.ok) {
    return reply.code(400).send({ error: v.error });
  }

  const { name, email, company, role } = v.data;

  // Issue token, send email.
  const token = createAccessToken({ name, email, company, role });
  const verifyUrl = `${config.publicOrigin}/api/investors/verify?token=${encodeURIComponent(token)}`;

  try {
    await sendVerificationEmail({ to: email, name, verifyUrl });
  } catch (err) {
    request.log.error({ err }, 'Failed to send verification email');
    return reply.code(500).send({ error: 'Could not send verification email. Please try again.' });
  }

  request.log.info({ email, company }, 'Verification email sent');
  return reply.code(204).send();
});

app.get('/api/investors/verify', {
  config: {
    rateLimit: { max: 30, timeWindow: '1 minute' },
  },
}, async (request, reply) => {
  const token = request.query?.token;
  const result = verifyAccessToken(token);

  if (!result.ok) {
    request.log.warn({ reason: result.reason }, 'Verification failed');
    return reply.redirect(`${config.publicOrigin}/investors/access.html?error=${encodeURIComponent(result.reason || 'invalid')}`);
  }

  const { e: email, n: name, c: company, r: role, jti } = result.payload;

  // Single-use enforcement.
  if (await isTokenConsumed(jti)) {
    return reply.redirect(`${config.publicOrigin}/investors/access.html?error=already_used`);
  }

  const lead = {
    name,
    email,
    company: company || '',
    role: role || '',
    ip: request.ip,
    userAgent: request.headers['user-agent'] || '',
    verifiedAt: new Date().toISOString(),
    jti,
  };

  // Append to lead log (best-effort: log error but proceed so the user isn't blocked).
  try {
    await appendLead(lead);
  } catch (err) {
    request.log.error({ err }, 'Failed to append lead to disk');
  }

  try {
    await markTokenConsumed(jti);
  } catch (err) {
    request.log.error({ err }, 'Failed to mark token consumed');
  }

  // Notification email — best effort, don't block redirect on failure.
  sendLeadNotification({ lead }).catch((err) => {
    request.log.error({ err }, 'Failed to send lead notification email');
  });

  // Set session cookie.
  const session = createSessionToken({ email, name });
  reply.setCookie(config.cookieName, session, {
    domain: config.cookieDomain,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: config.cookieTtlDays * 86400,
  });

  return reply.redirect(`${config.publicOrigin}/investors/`);
});

// Used by Nginx auth_request: returns 200 if cookie is valid, 401 otherwise.
// Nginx will redirect to /investors/access.html on 401.
app.get('/api/investors/check', async (request, reply) => {
  const token = request.cookies[config.cookieName];
  if (!token) return reply.code(401).send();
  const result = verifySessionToken(token);
  if (!result.ok) return reply.code(401).send();
  // Don't expose any info — auth_request only cares about the status.
  return reply.code(200).send();
});

app.get('/api/investors/health', async () => ({ ok: true, ts: Date.now() }));

// -------------------- START --------------------

try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`edison-api listening on ${config.host}:${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
