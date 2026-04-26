# Investor Gate — Deployment Runbook

This guide deploys the investor area: a soft-wall gate at `/investors/access.html`,
a Node service at `/opt/edison-api/`, an Nginx `auth_request` config, and a Resend
email integration sending verification emails from `noreply@edison.aero`.

End-to-end flow:
1. Visitor submits name + email at `/investors/access.html`
2. Node service signs a 30-min token, Resend delivers verification email
3. Visitor clicks the link → `/api/investors/verify?token=...`
4. Service appends `{name,email,company,role,ip,ua,verifiedAt}` to `/var/lib/edison-api/leads.jsonl`, emails Gene the lead, sets `edison_investor` HttpOnly cookie (30-day TTL), redirects to `/investors/`
5. Nginx `auth_request` on `/investors/` calls back to `/api/investors/check`. Cookie valid → deck loads. Cookie missing → 302 to `/investors/access.html`

---

## 1. Resend setup (one-time, ~10 min)

1. Create an account at https://resend.com
2. **Domains → Add Domain → `edison.aero`**
3. Resend will display 3 DNS records to add at your DNS provider (Cloudflare, Route53, etc.):
   - 1× MX record (subdomain like `send.edison.aero`)
   - 1× TXT (SPF: `v=spf1 include:amazonses.com ~all` — Resend uses SES under the hood)
   - 1× TXT (DKIM, long key)
4. Wait for Resend to mark the domain **Verified** (usually 5–15 min)
5. **API Keys → Create API Key** with **Sending Access** to `edison.aero` only. Save the `re_...` key — you'll put it in `/etc/edison-api.env`
6. (Recommended) Add a DMARC record at `_dmarc.edison.aero`:
   ```
   v=DMARC1; p=none; rua=mailto:dmarc-reports@edison.aero
   ```

> The sender will be `Edison Aerospace <noreply@edison.aero>`. The reply-to is `info@edison.aero`.

---

## 2. VPS setup (one-time)

SSH to the VPS as a sudo user.

### 2.1 Install Node.js 20+

If Node isn't already installed:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # should be v20.x or higher
```

### 2.2 Create the service user and data dir

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin edison-api
sudo mkdir -p /var/lib/edison-api
sudo chown edison-api:edison-api /var/lib/edison-api
sudo chmod 750 /var/lib/edison-api
```

### 2.3 Deploy the service code

From your **local machine**:

```bash
# Copy the api/ folder to /opt/edison-api/ on the VPS
rsync -avz --delete \
  --exclude 'node_modules' \
  /Users/gene/Documents/dev/EDISON_AEROSPACE/api/ \
  YOUR_VPS_USER@YOUR_VPS_HOST:/tmp/edison-api/
```

Back on the VPS:

```bash
sudo mv /tmp/edison-api /opt/edison-api
sudo chown -R edison-api:edison-api /opt/edison-api
cd /opt/edison-api
sudo -u edison-api npm install --omit=dev
```

### 2.4 Create the environment file

```bash
sudo cp /opt/edison-api/.env.example /etc/edison-api.env
sudo chmod 600 /etc/edison-api.env
sudo chown root:root /etc/edison-api.env
```

Generate a strong token secret and put it in the env file:

```bash
openssl rand -hex 64
```

Edit `/etc/edison-api.env` and set:
- `TOKEN_SECRET=` ← the hex you just generated
- `RESEND_API_KEY=` ← the `re_...` key from Resend
- `LEAD_NOTIFY_EMAIL=gene@vugaenterprises.com` (already the default)
- `PUBLIC_ORIGIN=https://edison.aero`
- `COOKIE_DOMAIN=.edison.aero`

### 2.5 Install the systemd unit

```bash
sudo cp /opt/edison-api/edison-api.service /etc/systemd/system/edison-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now edison-api
sudo systemctl status edison-api    # should be 'active (running)'
curl http://127.0.0.1:8787/api/investors/health   # → {"ok":true,"ts":...}
```

Logs:
```bash
sudo journalctl -u edison-api -f
```

---

## 3. Nginx — wire up the API and gate

Edit the existing edison.aero server block (likely `/etc/nginx/sites-available/edison-aerospace` or similar). The full snippet to add lives at `/opt/edison-api/nginx-snippet.conf` — paste its contents **inside** the `server { ... }` block that already serves `/var/www/edison-aerospace`.

After editing:
```bash
sudo nginx -t      # config syntax check
sudo systemctl reload nginx
```

---

## 4. End-to-end smoke test

1. Visit `https://edison.aero/investors/` in an incognito window
   - Expected: 302 redirect to `https://edison.aero/investors/access.html`
2. Submit the form with your real email
   - Expected: page swaps to "Check your inbox"
   - Expected: email arrives at `noreply@edison.aero`-sent address within seconds
3. Click the link in the email
   - Expected: lands on `https://edison.aero/investors/` and the deck loads
   - Expected: `gene@vugaenterprises.com` receives a "New investor lead" email
4. Open a new incognito window and go straight to `/investors/` — should still 302 to access page (no cookie in this browser)
5. In your original tab, refresh `/investors/` — should still load (cookie persists 30 days)

### Verify the lead was logged

```bash
sudo cat /var/lib/edison-api/leads.jsonl | tail -1 | jq
```

### Failure paths to test
- Reuse the same email link a second time → redirect to `/investors/access.html?error=already_used`
- Wait 31 minutes, then click the link → `?error=expired`
- Tamper with the token query param → `?error=bad_signature`

---

## 5. Site deploy (static)

The static site (HTML/CSS/JS, including `/investors/access.html` and the deck under `/investors/`) deploys via the existing GitHub Actions workflow on push to `main`. The workflow excludes `api/` and `docs/`, so backend changes don't propagate via that path.

```bash
git add -A
git commit -m "Add investor gate and deck"
git push origin main
```

---

## 6. Updating the backend later

Backend updates are **not** in CI — they go via rsync from your laptop:

```bash
rsync -avz --delete \
  --exclude 'node_modules' \
  /Users/gene/Documents/dev/EDISON_AEROSPACE/api/ \
  YOUR_VPS_USER@YOUR_VPS_HOST:/tmp/edison-api-new/

# On the VPS:
sudo rsync -avz --delete --exclude 'node_modules' /tmp/edison-api-new/ /opt/edison-api/
sudo chown -R edison-api:edison-api /opt/edison-api
cd /opt/edison-api && sudo -u edison-api npm install --omit=dev
sudo systemctl restart edison-api
```

---

## 7. Retrieving leads

```bash
# All leads
sudo cat /var/lib/edison-api/leads.jsonl | jq

# Just emails
sudo jq -r '.email' /var/lib/edison-api/leads.jsonl | sort -u

# Last 10
sudo tail -n 10 /var/lib/edison-api/leads.jsonl | jq

# Export to CSV
sudo jq -r '[.verifiedAt,.name,.email,.company,.role,.ip] | @csv' /var/lib/edison-api/leads.jsonl > leads.csv
```

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Form submits but no email arrives | Resend not verified, or wrong API key | Check Resend dashboard → Domains, regenerate API key, update `/etc/edison-api.env`, `systemctl restart edison-api` |
| `502 Bad Gateway` on `/api/*` | Node service down | `sudo systemctl status edison-api` then `journalctl -u edison-api -n 100` |
| Click email link → loops back to access page | Cookie not being set (domain mismatch) | Verify `COOKIE_DOMAIN=.edison.aero` and that Nginx is sending HTTPS (cookie has `Secure` flag) |
| Lead notifications not arriving at gene@vugaenterprises.com | Going to spam, or Resend rejecting destination | Check Resend logs in dashboard; check spam folder; verify `LEAD_NOTIFY_EMAIL` in env |
| `nginx -t` fails after pasting the snippet | Snippet pasted outside the `server {}` block, or duplicate `location /api/` | Open `/etc/nginx/sites-available/edison-aerospace`, ensure snippet is inside the HTTPS server block, no duplicates |

---

## 9. File reference

| Path | Purpose |
|------|---------|
| `investors/index.html` | The deck (gated) |
| `investors/access.html` | The gate form (public) |
| `investors/edison-deck.css`, `deck-stage.js`, `*.png/jpg` | Deck assets |
| `css/investors.css` | Gate-page styling (extends global.css) |
| `js/investors-gate.js` | Gate-page form logic |
| `api/src/server.js` | Fastify server entry point |
| `api/src/tokens.js` | HMAC-signed token create/verify |
| `api/src/email.js` | Resend integration |
| `api/src/storage.js` | JSONL append + consumed-token tracking |
| `api/src/disposable-domains.js` | Throwaway-email blocklist |
| `api/edison-api.service` | systemd unit |
| `api/nginx-snippet.conf` | Nginx config to paste into the edison.aero server block |
| `api/.env.example` | Template for `/etc/edison-api.env` |
| `/var/lib/edison-api/leads.jsonl` | Verified-investor leads (on the VPS) |
| `/var/lib/edison-api/consumed-tokens.jsonl` | Single-use token tracking |
