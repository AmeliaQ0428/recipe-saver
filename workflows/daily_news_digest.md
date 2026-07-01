# Workflow: Daily Client News Digest

## Objective
Send a daily email summary of news relevant to each audit client and their industry, delivered each morning to the Deloitte auditor's Gmail inbox.

## Clients and coverage

| Client | Industry keywords |
|---|---|
| Serko Limited | Corporate travel technology, SaaS NZ |
| Vitaco | Health supplements, nutraceuticals, vitamins NZ/AU |
| Inchcape | Automotive distribution, vehicle import NZ |
| Whangarei District Council | Local government, Northland NZ |
| St John | Ambulance, emergency services, healthcare NZ |

## Required inputs (stored as GitHub Secrets)

| Secret | Description |
|---|---|
| `GMAIL_FROM` | The Gmail address to send from (e.g. `you@gmail.com`) |
| `GMAIL_APP_PASSWORD` | 16-character Gmail App Password (see setup below) |
| `DIGEST_TO` | Email address to deliver the digest to (can be the same as `GMAIL_FROM`) |

## Tool
`tools/daily_digest.py`
- Fetches Google News RSS (NZ edition) for each client's name and industry keywords
- Deduplicates articles within each section
- Builds a formatted HTML email (client name, industry tag, "Client News" + "Industry News" sub-sections per client)
- Sends via Gmail SMTP (port 587, STARTTLS)

## Schedule
GitHub Actions cron: `0 19 * * *` (UTC) = **7:00 AM NZST** (UTC+12, NZ winter).
Note: shifts to 8:00 AM during NZ Daylight Time (October–April). Adjust cron to `0 18 * * *` in summer if preferred.

## Edge cases and constraints
- **Google News RSS rate limits:** none documented for RSS, but scraping too fast can result in empty results. The script makes ~14 requests sequentially with no delay — has been reliable.
- **No news found:** each section renders "No recent news found." rather than erroring.
- **Gmail App Password required:** Gmail's standard password won't work here; App Passwords bypass two-factor prompts for automated scripts.
- **Quarterly client refresh:** update `CLIENTS` list in `tools/daily_digest.py` when the client portfolio changes.

## Setup steps (one-time)

### 1. Create a Gmail App Password
1. Sign in to the Gmail account at **myaccount.google.com**.
2. Go to **Security** → **2-Step Verification** (enable it if not already on).
3. At the bottom of that page, click **App passwords**.
4. Choose **App: Mail**, **Device: Other** → name it `daily-digest` → click **Generate**.
5. Copy the 16-character password — you'll only see it once.

### 2. Add GitHub Secrets
1. Go to the GitHub repo → **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** for each of the three:
   - `GMAIL_FROM` = your Gmail address
   - `GMAIL_APP_PASSWORD` = the 16-char password from step 1
   - `DIGEST_TO` = the inbox you want the digest sent to (usually same as `GMAIL_FROM`)

### 3. Test manually
Once secrets are saved, go to **Actions** tab in GitHub → **Daily News Digest** → **Run workflow** → **Run workflow** (green button). Check your inbox within ~30 seconds.

## Updating clients
Edit `CLIENTS` list in `tools/daily_digest.py`. Each entry has:
- `name` — the client name (used as the section header)
- `client_queries` — search terms targeting the client specifically
- `industry` — short label shown in the email
- `industry_queries` — search terms for the broader industry

Commit and push; GitHub Actions picks up the change automatically.
