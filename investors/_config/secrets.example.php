<?php
/**
 * Edison Aerospace — investor gate secrets.
 *
 * COPY this file to /investors/_config/secrets.php (drop the .example),
 * fill in the real values, and FTP it to the server. Never commit
 * the real secrets.php to git.
 *
 * The .htaccess in this directory denies all web access, but PHP can
 * still read the file via the filesystem.
 */
declare(strict_types=1);

// ---- REQUIRED ----

// HMAC secret used to sign verification + session tokens.
// Generate with: openssl rand -hex 64
define('EDISON_TOKEN_SECRET', 'replace_me_with_64_hex_chars');

// Resend API key. https://resend.com/api-keys
define('EDISON_RESEND_API_KEY', 'replace_me_with_resend_key');

// ---- OPTIONAL OVERRIDES (defaults already match production) ----
// define('EDISON_PUBLIC_ORIGIN',     'https://edison.aero');
// define('EDISON_COOKIE_DOMAIN',     '.edison.aero');
// define('EDISON_COOKIE_NAME',       'edison_investor');
// define('EDISON_COOKIE_TTL_DAYS',   30);
// define('EDISON_TOKEN_TTL_MINUTES', 30);
// define('EDISON_EMAIL_FROM',        'Edison Aerospace <noreply@resend.edison.aero>');
// define('EDISON_EMAIL_REPLY_TO',    'info@edison.aero');
// define('EDISON_LEAD_NOTIFY_EMAIL', 'gene@vugaenterprises.com');
