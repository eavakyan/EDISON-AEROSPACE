<?php
declare(strict_types=1);

function append_lead(array $lead): bool {
    $path = dataDir() . '/leads.jsonl';
    $line = json_encode($lead, JSON_UNESCAPED_SLASHES) . "\n";
    return append_with_lock($path, $line);
}

function mark_token_consumed(string $jti): bool {
    $path = dataDir() . '/consumed-tokens.jsonl';
    $line = json_encode(['jti' => $jti, 't' => time()]) . "\n";
    return append_with_lock($path, $line);
}

function is_token_consumed(string $jti): bool {
    $path = dataDir() . '/consumed-tokens.jsonl';
    if (!file_exists($path)) return false;
    $fp = @fopen($path, 'r');
    if (!$fp) return false;
    $cutoff = time() - 86400; // forget entries older than 24h for the in-memory check
    $found = false;
    while (($line = fgets($fp)) !== false) {
        $data = json_decode(trim($line), true);
        if (!is_array($data) || empty($data['jti'])) continue;
        if (isset($data['t']) && $data['t'] < $cutoff) continue;
        if ($data['jti'] === $jti) { $found = true; break; }
    }
    fclose($fp);
    return $found;
}

function append_with_lock(string $path, string $line): bool {
    $fp = @fopen($path, 'a');
    if (!$fp) return false;
    $ok = false;
    try {
        if (flock($fp, LOCK_EX)) {
            $written = fwrite($fp, $line);
            fflush($fp);
            flock($fp, LOCK_UN);
            $ok = ($written !== false);
        }
    } finally {
        fclose($fp);
    }
    @chmod($path, 0640);
    return $ok;
}
