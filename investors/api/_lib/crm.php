<?php
declare(strict_types=1);

/**
 * Forwards a verified investor lead to the VUGA CRM.
 * Fire-and-forget: errors are logged, never propagated to the user flow.
 */

const CRM_ENDPOINT = 'https://crm.vugagroup.com/api/submit';

function send_to_crm(array $lead): array {
    $payload = [
        'site_id'     => 'edison.aero',
        'form_type'   => 'investor_access',
        'name'        => $lead['name']    ?? '',
        'email'       => $lead['email']   ?? '',
        'company'     => $lead['company'] ?? '',
        'role'        => $lead['role']    ?? '',
        'message'     => 'Investor deck access request (email verified)',
        '_timestamp'  => isset($lead['verifiedAt']) ? strtotime($lead['verifiedAt']) * 1000 : (int)(microtime(true) * 1000),
        '_page_url'   => 'https://edison.aero/investors/access.html',
        '_website'    => '',
        '_source_ip'  => $lead['ip']        ?? '',
        '_user_agent' => $lead['userAgent'] ?? '',
    ];

    $ch = curl_init(CRM_ENDPOINT);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT        => 10,
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
