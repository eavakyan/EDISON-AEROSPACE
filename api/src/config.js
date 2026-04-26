import { existsSync, mkdirSync } from 'node:fs';

function required(name) {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

function optional(name, fallback) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : fallback;
}

function intEnv(name, fallback) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: intEnv('PORT', 8787),
  host: optional('HOST', '127.0.0.1'),
  nodeEnv: optional('NODE_ENV', 'production'),

  publicOrigin: required('PUBLIC_ORIGIN').replace(/\/$/, ''),
  cookieDomain: optional('COOKIE_DOMAIN', undefined),

  tokenSecret: required('TOKEN_SECRET'),

  resendApiKey: required('RESEND_API_KEY'),
  emailFrom: required('EMAIL_FROM'),
  emailReplyTo: optional('EMAIL_REPLY_TO', undefined),
  leadNotifyEmail: required('LEAD_NOTIFY_EMAIL'),

  dataDir: optional('DATA_DIR', '/var/lib/edison-api'),

  cookieName: optional('COOKIE_NAME', 'edison_investor'),
  cookieTtlDays: intEnv('COOKIE_TTL_DAYS', 30),
  tokenTtlMinutes: intEnv('TOKEN_TTL_MINUTES', 30),
};

if (!existsSync(config.dataDir)) {
  mkdirSync(config.dataDir, { recursive: true });
}

export const leadsPath = `${config.dataDir}/leads.jsonl`;
export const consumedPath = `${config.dataDir}/consumed-tokens.jsonl`;
