<?php
declare(strict_types=1);

require_once __DIR__ . '/api/_lib/config.php';
require_once __DIR__ . '/api/_lib/tokens.php';

$cookieName = config('cookie_name');
$cookie = $_COOKIE[$cookieName] ?? '';

$ok = false;
if (is_string($cookie) && $cookie !== '') {
    $r = verify_token($cookie);
    if ($r['ok']) $ok = true;
}

if (!$ok) {
    header('Location: /investors/access.html', true, 302);
    exit;
}

// Authenticated — serve the deck. The deck markup lives in _protected/
// (web-blocked via .htaccess) and is included here so the URL stays /investors/.
header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');
readfile(__DIR__ . '/_protected/deck.html');
exit;
