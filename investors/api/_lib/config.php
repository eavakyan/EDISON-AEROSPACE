<?php
/**
 * Loads configuration from the secrets file (kept outside web access)
 * and exposes a small `config()` function. Secrets must live at
 * /investors/_config/secrets.php with at least these constants:
 *   EDISON_TOKEN_SECRET
 *   EDISON_RESEND_API_KEY
 */
declare(strict_types=1);

$secretsFile = __DIR__ . '/../../_config/secrets.php';
if (!file_exists($secretsFile)) {
    http_response_code(500);
    error_log('[edison] missing secrets.php at ' . $secretsFile);
    exit('Server misconfiguration.');
}
require_once $secretsFile;

if (!defined('EDISON_TOKEN_SECRET') || EDISON_TOKEN_SECRET === '' || EDISON_TOKEN_SECRET === 'replace_me') {
    http_response_code(500);
    error_log('[edison] EDISON_TOKEN_SECRET not set in secrets.php');
    exit('Server misconfiguration.');
}
if (!defined('EDISON_RESEND_API_KEY') || EDISON_RESEND_API_KEY === '' || strpos(EDISON_RESEND_API_KEY, 'replace_me') !== false) {
    http_response_code(500);
    error_log('[edison] EDISON_RESEND_API_KEY not set in secrets.php');
    exit('Server misconfiguration.');
}

function config(string $key, $default = null) {
    static $defaults = [
        'public_origin'       => 'https://edison.aero',
        'cookie_domain'       => '.edison.aero',
        'cookie_name'         => 'edison_investor',
        'cookie_ttl_days'     => 30,
        'token_ttl_minutes'   => 30,
        'email_from'          => 'Edison Aerospace <noreply@resend.edison.aero>',
        'email_reply_to'      => 'info@edison.aero',
        'lead_notify_email'   => 'gene@vugaenterprises.com',
    ];
    // Allow secrets.php to override any default by defining EDISON_<UPPER>.
    $constName = 'EDISON_' . strtoupper($key);
    if (defined($constName)) return constant($constName);
    return $defaults[$key] ?? $default;
}

function dataDir(): string {
    $dir = __DIR__ . '/../../_data';
    if (!is_dir($dir)) {
        // The _data dir ships with the bundle and an .htaccess deny-all.
        // If somehow missing, attempt to create it.
        @mkdir($dir, 0750, true);
    }
    return $dir;
}

function tokenSecret(): string { return EDISON_TOKEN_SECRET; }
function resendApiKey(): string { return EDISON_RESEND_API_KEY; }
