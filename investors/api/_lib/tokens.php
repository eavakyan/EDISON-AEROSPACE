<?php
declare(strict_types=1);

/**
 * Compact HMAC-signed tokens. Format: base64url(payload).base64url(sig)
 * Mirrors the Node implementation byte-for-byte so a future migration
 * to the VPS Node service stays compatible.
 */

function b64url_encode(string $bin): string {
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}

function b64url_decode(string $s): string {
    $b64 = strtr($s, '-_', '+/');
    $pad = strlen($b64) % 4;
    if ($pad) $b64 .= str_repeat('=', 4 - $pad);
    return base64_decode($b64, true) ?: '';
}

function create_access_token(array $payload): string {
    $exp = time() + (config('token_ttl_minutes') * 60);
    $jti = bin2hex(random_bytes(12));
    $data = [
        'e'   => $payload['email']   ?? '',
        'n'   => $payload['name']    ?? '',
        'c'   => $payload['company'] ?? '',
        'r'   => $payload['role']    ?? '',
        'exp' => $exp,
        'jti' => $jti,
    ];
    $json = json_encode($data, JSON_UNESCAPED_SLASHES);
    $sig  = hash_hmac('sha256', $json, tokenSecret(), true);
    return b64url_encode($json) . '.' . b64url_encode($sig);
}

function create_session_token(array $payload): string {
    $exp = time() + (config('cookie_ttl_days') * 86400);
    $data = [
        'e'   => $payload['email'] ?? '',
        'n'   => $payload['name']  ?? '',
        'exp' => $exp,
    ];
    $json = json_encode($data, JSON_UNESCAPED_SLASHES);
    $sig  = hash_hmac('sha256', $json, tokenSecret(), true);
    return b64url_encode($json) . '.' . b64url_encode($sig);
}

function verify_token(string $token): array {
    if ($token === '' || strpos($token, '.') === false) {
        return ['ok' => false, 'reason' => 'malformed'];
    }
    [$encPayload, $encSig] = explode('.', $token, 2);
    $json = b64url_decode($encPayload);
    $sig  = b64url_decode($encSig);
    if ($json === '' || $sig === '') {
        return ['ok' => false, 'reason' => 'malformed'];
    }
    $expected = hash_hmac('sha256', $json, tokenSecret(), true);
    if (!hash_equals($expected, $sig)) {
        return ['ok' => false, 'reason' => 'bad_signature'];
    }
    $data = json_decode($json, true);
    if (!is_array($data) || !isset($data['exp']) || !is_int($data['exp'])) {
        return ['ok' => false, 'reason' => 'malformed'];
    }
    if ($data['exp'] < time()) {
        return ['ok' => false, 'reason' => 'expired'];
    }
    return ['ok' => true, 'payload' => $data];
}
