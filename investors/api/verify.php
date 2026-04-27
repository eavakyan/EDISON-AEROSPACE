<?php
declare(strict_types=1);

require_once __DIR__ . '/_lib/config.php';
require_once __DIR__ . '/_lib/tokens.php';
require_once __DIR__ . '/_lib/email.php';
require_once __DIR__ . '/_lib/storage.php';
require_once __DIR__ . '/_lib/rate_limit.php';

// Rate limit (per-IP) — verify is fairly lightweight but worth bounding.
$ip = client_ip();
if (!rate_limit_ok('vr:' . $ip, 30, 60)) {
    http_response_code(429);
    header('Content-Type: text/plain');
    exit('Too many requests.');
}

$token = $_GET['token'] ?? '';
if (!is_string($token) || $token === '') {
    redirect_to_access('invalid');
}

$result = verify_token($token);
if (!$result['ok']) {
    error_log('[edison] verify failed: ' . ($result['reason'] ?? 'unknown'));
    redirect_to_access($result['reason'] ?? 'invalid');
}
$payload = $result['payload'];
$jti = $payload['jti'] ?? '';
if ($jti === '') redirect_to_access('malformed');

if (is_token_consumed($jti)) {
    redirect_to_access('already_used');
}

$lead = [
    'name'       => (string)($payload['n'] ?? ''),
    'email'      => (string)($payload['e'] ?? ''),
    'company'    => (string)($payload['c'] ?? ''),
    'role'       => (string)($payload['r'] ?? ''),
    'ip'         => $ip,
    'userAgent'  => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500),
    'verifiedAt' => gmdate('c'),
    'jti'        => $jti,
];

// Append to leads log + mark token consumed (best-effort; do not block redirect on disk error).
if (!append_lead($lead)) {
    error_log('[edison] failed to append lead');
}
if (!mark_token_consumed($jti)) {
    error_log('[edison] failed to mark token consumed');
}

// Notification email — best-effort, fire-and-forget. Errors logged, not surfaced.
$notifyResult = send_lead_notification($lead);
if (!$notifyResult['ok']) {
    error_log('[edison] lead notification failed: ' . ($notifyResult['error'] ?? 'unknown'));
}

// Set the session cookie. Must happen before any output.
$session = create_session_token(['email' => $lead['email'], 'name' => $lead['name']]);

$cookieOpts = [
    'expires'  => time() + (config('cookie_ttl_days') * 86400),
    'path'     => '/',
    'domain'   => config('cookie_domain'),
    'secure'   => true,
    'httponly' => true,
    'samesite' => 'Lax',
];
setcookie(config('cookie_name'), $session, $cookieOpts);

// Redirect to the deck.
header('Location: ' . config('public_origin') . '/investors/', true, 302);
exit;

function redirect_to_access(string $reason): void {
    header('Location: ' . config('public_origin') . '/investors/access.html?error=' . urlencode($reason), true, 302);
    exit;
}
