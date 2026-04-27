<?php
declare(strict_types=1);

/**
 * Simple per-IP rate limiter using a JSONL window file.
 * For shared PHP hosting where APCu/Redis aren't reliably available.
 * Trades a bit of disk I/O for zero dependencies.
 *
 * Returns true if the request is within limits, false if rate-limited.
 */
function rate_limit_ok(string $key, int $max, int $windowSeconds): bool {
    $path = dataDir() . '/ratelimit.jsonl';
    $now = time();
    $cutoff = $now - $windowSeconds;

    // Read current entries (best-effort)
    $entries = [];
    if (file_exists($path)) {
        $raw = @file_get_contents($path);
        if ($raw !== false) {
            foreach (explode("\n", $raw) as $line) {
                $line = trim($line);
                if ($line === '') continue;
                $row = json_decode($line, true);
                if (!is_array($row) || !isset($row['k'], $row['t'])) continue;
                if ($row['t'] < $cutoff) continue;
                $entries[] = $row;
            }
        }
    }

    // Count + decide
    $count = 0;
    foreach ($entries as $row) {
        if ($row['k'] === $key) $count++;
    }
    if ($count >= $max) return false;

    // Append new entry. Compact the file occasionally.
    $entries[] = ['k' => $key, 't' => $now];

    // Keep file from growing forever — rewrite with only live entries.
    $fp = @fopen($path, 'c');
    if (!$fp) return true; // fail-open: don't block requests because of disk issues
    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        rewind($fp);
        foreach ($entries as $row) {
            fwrite($fp, json_encode($row) . "\n");
        }
        fflush($fp);
        flock($fp, LOCK_UN);
    }
    fclose($fp);
    @chmod($path, 0640);
    return true;
}

function client_ip(): string {
    // Cloudflare sets CF-Connecting-IP. Fall back to the chain.
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $h) {
        if (!empty($_SERVER[$h])) {
            $ip = trim(explode(',', (string)$_SERVER[$h])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return '0.0.0.0';
}
