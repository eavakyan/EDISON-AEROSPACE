import { config } from './config.js';

const RESEND_URL = 'https://api.resend.com/emails';

async function sendEmail({ to, subject, html, text, replyTo }) {
  const body = {
    from: config.emailFrom,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  };
  if (replyTo || config.emailReplyTo) {
    body.reply_to = replyTo || config.emailReplyTo;
  }

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Resend API error ${res.status}: ${errText}`);
  }
  return res.json();
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendVerificationEmail({ to, name, verifyUrl }) {
  const safeName = escapeHtml((name || '').split(' ')[0] || 'there');
  const subject = 'Verify your email — Edison Aerospace Investor Deck';

  const text = [
    `Hi ${safeName.replace(/&#39;/g, "'")},`,
    '',
    'You requested access to the Edison Aerospace Series A investor deck.',
    'Click the link below to verify your email and view the materials:',
    '',
    verifyUrl,
    '',
    'This link expires in 30 minutes. If you didn\'t request this, you can ignore this email.',
    '',
    '— Edison Aerospace',
    'https://edison.aero',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#0A1628;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A1628;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0F1E36;border:1px solid rgba(255,255,255,0.08);border-radius:6px;">
        <tr><td style="padding:40px 40px 24px 40px;">
          <p style="margin:0 0 8px;color:#E31E24;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">Edison Aerospace</p>
          <h1 style="margin:0 0 16px;color:#FFFFFF;font-size:24px;font-weight:700;line-height:1.3;">Verify your email</h1>
          <p style="margin:0 0 16px;color:#C9DCEE;font-size:15px;line-height:1.6;">Hi ${safeName},</p>
          <p style="margin:0 0 16px;color:#C9DCEE;font-size:15px;line-height:1.6;">You requested access to the Edison Aerospace Series A investor deck. Click below to verify your email and view the materials.</p>
          <p style="margin:32px 0;text-align:center;">
            <a href="${escapeHtml(verifyUrl)}" style="display:inline-block;padding:14px 32px;background:#E31E24;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase;border-radius:3px;">View Investor Deck</a>
          </p>
          <p style="margin:0 0 8px;color:#7C89A0;font-size:13px;line-height:1.6;">Or copy and paste this link into your browser:</p>
          <p style="margin:0 0 24px;color:#4481fc;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${escapeHtml(verifyUrl)}" style="color:#4481fc;text-decoration:underline;">${escapeHtml(verifyUrl)}</a></p>
          <p style="margin:0;color:#7C89A0;font-size:12px;line-height:1.6;">This link expires in 30 minutes. If you didn&rsquo;t request this, you can ignore this email.</p>
        </td></tr>
        <tr><td style="padding:16px 40px 32px 40px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0;color:#4B5566;font-size:11px;line-height:1.5;">&copy; 2025 Edison Aerospace, Inc. &mdash; <a href="https://edison.aero" style="color:#4B5566;text-decoration:underline;">edison.aero</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({ to, subject, html, text });
}

export async function sendLeadNotification({ lead }) {
  const subject = `New investor lead: ${lead.name} (${lead.email})`;
  const lines = [
    `Name:    ${lead.name}`,
    `Email:   ${lead.email}`,
    `Company: ${lead.company || '—'}`,
    `Role:    ${lead.role || '—'}`,
    `IP:      ${lead.ip || '—'}`,
    `UA:      ${lead.userAgent || '—'}`,
    `When:    ${lead.verifiedAt}`,
  ];
  const text = lines.join('\n');
  const html = `<pre style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.6;background:#f6f6f6;padding:16px;border-radius:4px;">${escapeHtml(text)}</pre>`;

  return sendEmail({
    to: config.leadNotifyEmail,
    subject,
    html,
    text,
    replyTo: lead.email,
  });
}
