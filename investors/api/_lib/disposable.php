<?php
declare(strict_types=1);

const DISPOSABLE_DOMAINS = [
    '0-mail.com', '10minutemail.com', '20minutemail.com',
    'discard.email', 'dispostable.com', 'fakeinbox.com',
    'getairmail.com', 'getnada.com',
    'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com',
    'mailinator.com', 'mailinator.net', 'maildrop.cc', 'mailnesia.com',
    'mintemail.com', 'mohmal.com', 'sharklasers.com', 'spamgourmet.com',
    'temp-mail.org', 'tempmail.com', 'tempmail.net', 'tempmailo.com',
    'tempr.email', 'throwawaymail.com', 'trashmail.com', 'yopmail.com',
];

function is_disposable_email(string $email): bool {
    $at = strrpos($email, '@');
    if ($at === false) return false;
    $domain = strtolower(substr($email, $at + 1));
    return in_array($domain, DISPOSABLE_DOMAINS, true);
}
