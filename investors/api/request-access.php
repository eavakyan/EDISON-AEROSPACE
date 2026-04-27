<?php
declare(strict_types=1);

require_once __DIR__ . '/_lib/config.php';
require_once __DIR__ . '/_lib/tokens.php';
require_once __DIR__ . '/_lib/email.php';
require_once __DIR__ . '/_lib/disposable.php';
require_once __DIR__ . '/_lib/rate_limit.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

// Rate limit (per-IP)
$ip = client_ip();
if (!rate_limit_ok('ra:' . $ip, 5, 60)) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many requests. Please try again in a minute.']);
    exit;
}

$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > 16 * 1024) {
    http_response_code(413);
    echo json_encode(['error' => 'Payload too large.']);
    exit;
}

$body = json_decode($raw, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request body.']);
    exit;
}

// Honeypot — if the hidden field has any value, accept silently.
if (!empty($body['company_website'])) {
    http_response_code(204);
    exit;
}

function clean_field($v, int $max): string {
    if (!is_string($v)) return '';
    return mb_substr(trim(preg_replace('/\s+/u', ' ', $v) ?? ''), 0, $max);
}

$name    = clean_field($body['name']    ?? '', 120);
$email   = strtolower(clean_field($body['email']  ?? '', 200));
$company = clean_field($body['company'] ?? '', 160);
$role    = clean_field($body['role']    ?? '', 120);

if ($name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Please enter your name.']);
    exit;
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please enter a valid email address.']);
    exit;
}
if (is_disposable_email($email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please use a valid business or personal email address.']);
    exit;
}

$token = create_access_token([
    'email' => $email, 'name' => $name, 'company' => $company, 'role' => $role,
]);
$verifyUrl = config('public_origin') . '/investors/api/verify.php?token=' . urlencode($token);

$result = send_verification_email($email, $name, $verifyUrl);
if (!$result['ok']) {
    error_log('[edison] resend send failed: ' . ($result['error'] ?? 'unknown'));
    http_response_code(500);
    echo json_encode(['error' => 'Could not send verification email. Please try again.']);
    exit;
}

http_response_code(204);
exit;
