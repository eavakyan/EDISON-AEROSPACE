<?php
declare(strict_types=1);

const RESEND_URL = 'https://api.resend.com/emails';

function send_email(array $opts): array {
    $body = [
        'from'    => config('email_from'),
        'to'      => is_array($opts['to']) ? $opts['to'] : [$opts['to']],
        'subject' => $opts['subject'],
        'html'    => $opts['html'] ?? null,
        'text'    => $opts['text'] ?? null,
    ];
    $replyTo = $opts['reply_to'] ?? config('email_reply_to');
    if ($replyTo) $body['reply_to'] = $replyTo;

    $ch = curl_init(RESEND_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($body),
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . resendApiKey(),
            'Content-Type: application/json',
        ],
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $resp   = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err    = curl_error($ch);
    curl_close($ch);

    if ($resp === false) {
        return ['ok' => false, 'status' => 0, 'error' => $err];
    }
    if ($status < 200 || $status >= 300) {
        return ['ok' => false, 'status' => $status, 'error' => substr((string)$resp, 0, 500)];
    }
    return ['ok' => true, 'status' => $status, 'body' => $resp];
}

function escape_html(string $s): string {
    return htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function send_verification_email(string $to, string $name, string $verifyUrl): array {
    $first = explode(' ', trim($name))[0] ?: 'there';
    $safeFirst = escape_html($first);
    $subject = 'Verify your email — Edison Aerospace Investor Deck';

    $text = "Hi {$first},\n\n"
          . "You requested access to the Edison Aerospace Series A investor deck.\n"
          . "Click the link below to verify your email and view the materials:\n\n"
          . "{$verifyUrl}\n\n"
          . "This link expires in 30 minutes. If you didn't request this, you can ignore this email.\n\n"
          . "— Edison Aerospace\n"
          . "https://edison.aero";

    $safeUrl = escape_html($verifyUrl);
    $html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' . escape_html($subject) . '</title></head>'
          . '<body style="margin:0;padding:0;background:#0A1628;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;">'
          . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A1628;padding:40px 16px;"><tr><td align="center">'
          . '<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0F1E36;border:1px solid rgba(255,255,255,0.08);border-radius:6px;">'
          . '<tr><td style="padding:40px 40px 24px 40px;">'
          . '<p style="margin:0 0 8px;color:#E31E24;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">Edison Aerospace</p>'
          . '<h1 style="margin:0 0 16px;color:#FFFFFF;font-size:24px;font-weight:700;line-height:1.3;">Verify your email</h1>'
          . '<p style="margin:0 0 16px;color:#C9DCEE;font-size:15px;line-height:1.6;">Hi ' . $safeFirst . ',</p>'
          . '<p style="margin:0 0 16px;color:#C9DCEE;font-size:15px;line-height:1.6;">You requested access to the Edison Aerospace Series A investor deck. Click below to verify your email and view the materials.</p>'
          . '<p style="margin:32px 0;text-align:center;">'
          . '<a href="' . $safeUrl . '" style="display:inline-block;padding:14px 32px;background:#E31E24;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase;border-radius:3px;">View Investor Deck</a>'
          . '</p>'
          . '<p style="margin:0 0 8px;color:#7C89A0;font-size:13px;line-height:1.6;">Or copy and paste this link into your browser:</p>'
          . '<p style="margin:0 0 24px;color:#4481fc;font-size:13px;line-height:1.5;word-break:break-all;"><a href="' . $safeUrl . '" style="color:#4481fc;text-decoration:underline;">' . $safeUrl . '</a></p>'
          . '<p style="margin:0;color:#7C89A0;font-size:12px;line-height:1.6;">This link expires in 30 minutes. If you didn&rsquo;t request this, you can ignore this email.</p>'
          . '</td></tr>'
          . '<tr><td style="padding:16px 40px 32px 40px;border-top:1px solid rgba(255,255,255,0.06);">'
          . '<p style="margin:0;color:#4B5566;font-size:11px;line-height:1.5;">&copy; 2025 Edison Aerospace, Inc. &mdash; <a href="https://edison.aero" style="color:#4B5566;text-decoration:underline;">edison.aero</a></p>'
          . '</td></tr>'
          . '</table>'
          . '</td></tr></table></body></html>';

    return send_email([
        'to'      => $to,
        'subject' => $subject,
        'html'    => $html,
        'text'    => $text,
    ]);
}

function send_lead_notification(array $lead): array {
    $subject = "New investor lead: {$lead['name']} ({$lead['email']})";
    $lines = [
        "Name:    " . $lead['name'],
        "Email:   " . $lead['email'],
        "Company: " . ($lead['company'] !== '' ? $lead['company'] : '—'),
        "Role:    " . ($lead['role']    !== '' ? $lead['role']    : '—'),
        "IP:      " . ($lead['ip']      ?? '—'),
        "UA:      " . ($lead['userAgent'] ?? '—'),
        "When:    " . $lead['verifiedAt'],
    ];
    $text = implode("\n", $lines);
    $html = '<pre style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.6;background:#f6f6f6;padding:16px;border-radius:4px;">'
          . escape_html($text) . '</pre>';

    return send_email([
        'to'       => config('lead_notify_email'),
        'subject'  => $subject,
        'html'     => $html,
        'text'     => $text,
        'reply_to' => $lead['email'],
    ]);
}
