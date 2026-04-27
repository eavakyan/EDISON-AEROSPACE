# Investor Gate — Deployment Runbook (Hostinger / FTP / PHP)

This site lives on **Hostinger shared PHP hosting**. There is no SSH, no
systemd, no custom Nginx. Deploy is FTP, backend logic is PHP 8.3.

End-to-end flow:
1. Visitor submits name + email at `/investors/access.html`
2. PHP signs a 30-min HMAC token, Resend delivers verification email
3. Visitor clicks link → `/investors/api/verify.php?token=...`
4. PHP verifies, appends `{name,email,company,role,ip,ua,verifiedAt}` to `investors/_data/leads.jsonl`, emails Gene the lead, sets HttpOnly `edison_investor` cookie (30-day TTL), 302 → `/investors/`
5. `/investors/index.php` checks the cookie. Valid → `readfile('_protected/deck.html')`. Invalid/missing → 302 → `/investors/access.html`

---

## ⚠️ Critical: deploy path

Hostinger's FTP user `u661589486.edison.aero` lands in the **home directory**
on login, **not** the document root. The document root is `/public_html/`.
**All deploy paths in this runbook target `/public_html/...`** — never the
bare `/`. Files placed at `/` are not web-served and just waste space.

There is also a Hostinger-managed `/public_html/.private/` directory; the
`mirror` command excludes it via `--exclude "^\.private/"`. Don't remove that
exclusion or you'll trash the host's cert/config files.

## Prerequisites (one-time)

- **FTP host:** `ftp://147.93.42.51`
- **FTP user:** `u661589486.edison.aero`
- **FTP password:** from your Hostinger hPanel → Hosting → Files → FTP Accounts
- **lftp** installed locally: `brew install lftp`
- **Resend account** with `resend.edison.aero` subdomain verified (already done) and an API key

---

## 1. First-time server setup (one-time)

### 1.1 Back up the existing WordPress site (if you want to keep it)

The current site at edison.aero is WordPress on LiteSpeed. The static replica
will replace it. If you want a backup first, use Hostinger's hPanel →
Files → File Manager → download a zip of `public_html/`, or use the
hPanel "Backups" tool.

### 1.2 Wipe the WordPress files

Easiest via Hostinger File Manager: select all files in `public_html/`
(except `.well-known/` if it has Let's Encrypt files, but Hostinger
manages SSL automatically so that's typically empty), and delete.
Alternatively, via lftp:

```bash
lftp -u u661589486.edison.aero ftp://147.93.42.51 \
  -e "mrm -r /public_html/*; bye"
```

### 1.3 Upload secrets.php (once, never again)

The secrets file lives **on the server only**. It is gitignored locally.
Create it once with your real values and FTP it in.

```bash
# Generate a strong token secret locally
openssl rand -hex 64
```

Create `/tmp/edison-secrets.php` on your laptop:

```php
<?php
declare(strict_types=1);
define('EDISON_TOKEN_SECRET',   'PASTE_THE_64_HEX_FROM_OPENSSL_HERE');
define('EDISON_RESEND_API_KEY', 'PASTE_YOUR_re_xxx_KEY_HERE');
```

Upload it:

```bash
lftp -u u661589486.edison.aero ftp://147.93.42.51 -e "
  mkdir -p public_html/investors/_config
  put /tmp/edison-secrets.php -o /public_html/investors/_config/secrets.php
  bye
"
rm /tmp/edison-secrets.php
```

### 1.4 First full deploy

From the repo root:

```bash
cd /Users/gene/Documents/dev/EDISON_AEROSPACE
export FTP_PASSWORD='your-ftp-password-here'

lftp -u "u661589486.edison.aero,$FTP_PASSWORD" ftp://147.93.42.51 -e "
  set ftp:ssl-allow yes
  set ssl:verify-certificate no
  mirror -R --delete --verbose \
    --exclude-glob .git/ \
    --exclude-glob .gitignore \
    --exclude-glob claude_docs/ \
    --exclude-glob docs/ \
    --exclude-glob CLAUDE.md \
    --exclude-glob .DS_Store \
    --exclude-glob investors/_data/*.jsonl \
    --exclude-glob investors/_config/secrets.php \
    . /public_html
  bye
"
unset FTP_PASSWORD
```

> **What's excluded:** `.git/`, `claude_docs/`, `docs/`, `CLAUDE.md`,
> `.DS_Store`, runtime data files, and the secrets file (already
> uploaded once and managed independently).

---

## 2. Subsequent deploys

After step 1.4, every future deploy is just the same `lftp mirror` command.
Run it after each meaningful change. `--delete` keeps the server in lockstep
with the repo (minus the excludes).

If you only changed one file and want to skip the full mirror:

```bash
lftp -u "u661589486.edison.aero,$FTP_PASSWORD" ftp://147.93.42.51 -e "
  put -O /public_html/investors/api/ investors/api/request-access.php
  bye
"
```

---

## 3. End-to-end smoke test

After deploy:

1. Open `https://edison.aero/investors/` in an incognito window
   - Expected: redirects to `/investors/access.html`
2. Submit the form with your real email
   - Expected: page swaps to "Check your inbox"
   - Expected: email arrives within seconds, sender `noreply@resend.edison.aero`
3. Click the link in the email
   - Expected: lands on `https://edison.aero/investors/`, deck renders
   - Expected: `gene@vugaenterprises.com` receives a "New investor lead" email
4. Confirm cookie persistence: close the tab, reopen `https://edison.aero/investors/`
   - Expected: deck loads (no second auth)
5. Negative tests:
   - Click the same email link a second time → redirects to `/investors/access.html?error=already_used`
   - Wait 31 minutes after sending, then click → `?error=expired`
   - Tamper with `?token=` → `?error=bad_signature` or `malformed`

---

## 4. Retrieving leads

`leads.jsonl` lives at `public_html/investors/_data/leads.jsonl` on the server,
**denied to web access** by `_data/.htaccess`. Pull it via FTP whenever you
want a fresh export.

```bash
# Pull the leads file
lftp -u "u661589486.edison.aero,$FTP_PASSWORD" ftp://147.93.42.51 -e "
  get /public_html/investors/_data/leads.jsonl -o ~/edison-leads.jsonl
  bye
"

# Inspect
jq . ~/edison-leads.jsonl

# Just emails
jq -r '.email' ~/edison-leads.jsonl | sort -u

# Export to CSV
jq -r '[.verifiedAt,.name,.email,.company,.role,.ip] | @csv' \
  ~/edison-leads.jsonl > ~/edison-leads.csv
```

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Server misconfiguration.` text on the gate page | `secrets.php` missing or has placeholder values | Re-upload `secrets.php` per §1.3 |
| Form submits but no email arrives | Resend domain not verified / wrong key | Check Resend dashboard → Domains → `resend.edison.aero` is **Verified**. Regenerate API key, update `secrets.php`, re-upload |
| Click email link → loops back to access page | Cookie not being set (Cloudflare cache, domain mismatch) | Verify Cloudflare isn't caching `/investors/api/verify.php` (it shouldn't, but you can add a Cloudflare Rule: `Cache Level: Bypass` for `/investors/api/*`). Verify `EDISON_COOKIE_DOMAIN` is set to `.edison.aero` (or unset to use default) |
| 500 on PHP endpoints | PHP error — check Hostinger error log under hPanel → Files → File Manager → `error_log` in the directory | Read the log line, fix the code, redeploy |
| Cloudflare caches the deck/access page | LiteSpeed sets `Cache-Control: private, no-store` on `/investors/index.php`, but Cloudflare may override | Add a Cloudflare Page Rule: `https://edison.aero/investors/*` → `Cache Level: Bypass` |
| Leads not arriving at gene@vugaenterprises.com | Going to spam, or Resend rejecting destination | Check Resend logs in dashboard; check spam folder |

### Reading the PHP error log on Hostinger

The PHP error log on Hostinger lives at `error_log` in each directory
where errors occurred (e.g. `public_html/investors/error_log`). Pull it
the same way as `leads.jsonl`:

```bash
lftp -u "u661589486.edison.aero,$FTP_PASSWORD" ftp://147.93.42.51 -e "
  get /public_html/investors/api/error_log -o ~/edison-php-errors.log
  bye
"
```

---

## 6. File reference

| Path on server (all under `/public_html/`) | Purpose |
|---------------------------------------|---------|
| `index.html` ... `seawatch.html` | Static marketing pages |
| `css/global.css`, `css/investors.css` | Site styles |
| `js/main.js` ... `js/investors-gate.js` | Site scripts |
| `assets/...` | Images, video, fonts |
| `investors/access.html` | Gate form (public) |
| `investors/index.php` | Front controller — checks cookie, serves deck |
| `investors/_protected/deck.html` | The deck markup (web-blocked, read by PHP) |
| `investors/edison-deck.css`, `deck-stage.js`, `*.png/jpg` | Deck assets |
| `investors/api/request-access.php` | POST endpoint — validates form, sends email |
| `investors/api/verify.php` | GET endpoint — validates token, sets cookie |
| `investors/api/_lib/*.php` | Shared PHP libs (web-blocked) |
| `investors/_config/secrets.php` | Token + Resend secrets (web-blocked, off-repo) |
| `investors/_data/leads.jsonl` | Verified-investor leads (web-blocked) |
| `investors/_data/consumed-tokens.jsonl` | Single-use token tracking |
| `investors/_data/ratelimit.jsonl` | Per-IP rate-limit window |
