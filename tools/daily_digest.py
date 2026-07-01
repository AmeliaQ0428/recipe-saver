#!/usr/bin/env python3
"""Daily Deloitte client news digest — Google News RSS, last 24 h, with article summaries."""

import feedparser
import requests
import smtplib
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone, timedelta
import os
import html
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

GMAIL_FROM = os.environ["GMAIL_FROM"]
GMAIL_APP_PASSWORD = os.environ["GMAIL_APP_PASSWORD"]
DIGEST_TO = os.environ.get("DIGEST_TO", GMAIL_FROM)

NZ_LOCALE = "hl=en-NZ&gl=NZ&ceid=NZ:en"
MAX_PER_QUERY = 5   # fetch more, then trim after 24-h filter
MAX_CLIENT_ITEMS = 5
MAX_INDUSTRY_ITEMS = 4
FETCH_WORKERS = 10  # parallel article fetches
FETCH_TIMEOUT = 8   # seconds per article

CUTOFF = datetime.now(timezone.utc) - timedelta(hours=24)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-NZ,en;q=0.9",
}

CLIENTS = [
    {
        "name": "Serko Limited",
        "client_queries": ["Serko Limited", "Serko travel tech"],
        "industry": "Corporate Travel Technology",
        "industry_queries": [
            "corporate travel technology",
            "travel management software New Zealand",
        ],
    },
    {
        "name": "Vitaco",
        "client_queries": ["Vitaco Health", "Vitaco New Zealand"],
        "industry": "Health & Wellness / Supplements",
        "industry_queries": [
            "health supplements New Zealand",
            "nutraceuticals vitamins industry NZ",
        ],
    },
    {
        "name": "Inchcape",
        "client_queries": ["Inchcape New Zealand", "Inchcape NZ"],
        "industry": "Automotive Distribution",
        "industry_queries": [
            "automotive distribution New Zealand",
            "vehicle import dealership NZ",
        ],
    },
    {
        "name": "Whangarei District Council",
        "client_queries": ["Whangarei District Council"],
        "industry": "Local Government / Public Sector",
        "industry_queries": [
            "local government New Zealand",
            "Northland council NZ",
        ],
    },
    {
        "name": "St John",
        "client_queries": ["St John New Zealand ambulance", "St John NZ"],
        "industry": "Emergency Services / Healthcare",
        "industry_queries": [
            "ambulance service New Zealand",
            "emergency health services NZ",
        ],
    },
]


# ── News fetching ──────────────────────────────────────────────────────────────

def is_recent(published_str: str) -> bool:
    """Return True if the article was published in the past 24 hours."""
    if not published_str:
        return True  # no date → include rather than silently drop
    try:
        dt = parsedate_to_datetime(published_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt >= CUTOFF
    except Exception:
        return True


def fetch_news(query: str, max_items: int = MAX_PER_QUERY) -> list[dict]:
    """Fetch recent articles from Google News RSS for the given query."""
    url = f"https://news.google.com/rss/search?q={quote_plus(query)}&{NZ_LOCALE}"
    feed = feedparser.parse(url)
    items = []
    for entry in feed.entries[:max_items]:
        if not is_recent(entry.get("published", "")):
            continue
        items.append(
            {
                "title": entry.get("title", "").strip(),
                "link": entry.get("link", ""),
                "source": entry.get("source", {}).get("title", ""),
                "published": entry.get("published", ""),
                "summary": "",  # filled in later
            }
        )
    return items


def dedupe(items: list[dict]) -> list[dict]:
    seen: set[str] = set()
    unique = []
    for item in items:
        key = item["title"].lower()
        if key and key not in seen:
            seen.add(key)
            unique.append(item)
    return unique


# ── Article summaries ──────────────────────────────────────────────────────────

def scrape_summary(url: str, max_chars: int = 500) -> str:
    """
    Fetch the article page and return the first substantial paragraph.
    Follows Google News redirect automatically. Returns "" on any failure.
    """
    try:
        resp = requests.get(
            url, headers=HEADERS, timeout=FETCH_TIMEOUT, allow_redirects=True
        )
        if resp.status_code != 200:
            return ""
        soup = BeautifulSoup(resp.text, "html.parser")

        # Remove nav, footer, aside, script, style noise
        for tag in soup(["script", "style", "nav", "footer", "aside", "header"]):
            tag.decompose()

        for p in soup.find_all("p"):
            text = p.get_text(" ", strip=True)
            # Skip very short paragraphs (captions, labels, cookie notices)
            if len(text) < 80:
                continue
            # Skip paragraphs that look like navigation or metadata
            if any(skip in text.lower() for skip in ["cookie", "subscribe", "sign in", "log in", "privacy policy"]):
                continue
            return text[:max_chars] + ("…" if len(text) > max_chars else "")
        return ""
    except Exception:
        return ""


def attach_summaries(all_items: list[dict]) -> None:
    """Fetch summaries for all items in parallel and attach in-place."""
    if not all_items:
        return
    with ThreadPoolExecutor(max_workers=FETCH_WORKERS) as executor:
        future_to_item = {
            executor.submit(scrape_summary, item["link"]): item
            for item in all_items
        }
        for future in as_completed(future_to_item):
            item = future_to_item[future]
            try:
                item["summary"] = future.result()
            except Exception:
                item["summary"] = ""


# ── Email HTML ─────────────────────────────────────────────────────────────────

def fmt_date(date_str: str) -> str:
    if not date_str:
        return ""
    try:
        dt = parsedate_to_datetime(date_str)
        return f"{dt.day} {dt.strftime('%b %Y')}"
    except Exception:
        return date_str[:10]


def article_row(item: dict) -> str:
    title = html.escape(item["title"])
    source = html.escape(item["source"])
    date = html.escape(fmt_date(item["published"]))
    meta = f"{source}  ·  {date}" if source and date else source or date
    summary = html.escape(item.get("summary", ""))

    summary_html = (
        f'<p style="margin:7px 0 0; color:#374151; font-size:13px; line-height:1.6;">'
        f"{summary}</p>"
        if summary
        else ""
    )

    return f"""
          <tr>
            <td style="padding:10px 0 10px 14px; border-left:3px solid #dbeafe;">
              <a href="{item['link']}" style="color:#1d4ed8; font-size:14px; font-weight:600;
                 text-decoration:none; line-height:1.4;">{title}</a><br>
              <span style="color:#6b7280; font-size:12px;">{meta}</span>
              {summary_html}
            </td>
          </tr>"""


def subsection(label: str, items: list[dict]) -> str:
    rows = (
        "\n".join(article_row(i) for i in items)
        if items
        else """
          <tr><td style="padding:8px 0 8px 14px; border-left:3px solid #e5e7eb;
            color:#9ca3af; font-size:13px; font-style:italic;">No news today.</td></tr>"""
    )
    return f"""
        <p style="margin:14px 0 6px; color:#374151; font-size:11px; font-weight:700;
           text-transform:uppercase; letter-spacing:0.08em;">{label}</p>
        <table width="100%" cellpadding="0" cellspacing="0">{rows}
        </table>"""


def client_block(section: dict) -> str:
    name = html.escape(section["name"])
    industry = html.escape(section["industry"])
    return f"""
      <tr>
        <td style="padding-top:28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#1e3a5f; border-radius:6px; padding:10px 16px;">
                <span style="color:#ffffff; font-size:15px; font-weight:700;">{name}</span>
                <span style="color:#93c5fd; font-size:12px; margin-left:10px;">{industry}</span>
              </td>
            </tr>
          </table>
          {subsection("Client News", section["client_items"])}
          {subsection("Industry News", section["industry_items"])}
        </td>
      </tr>"""


def build_html(date_str: str, sections: list[dict]) -> str:
    blocks = "\n".join(client_block(s) for s in sections)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#f3f4f6;
             font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#f3f4f6; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0"
               style="background:#ffffff; border-radius:8px; overflow:hidden;
                      box-shadow:0 1px 4px rgba(0,0,0,0.12);">
          <!-- Header -->
          <tr>
            <td style="background:#1e3a5f; padding:24px 32px;">
              <p style="margin:0; color:#93c5fd; font-size:11px;
                 text-transform:uppercase; letter-spacing:0.1em; font-weight:700;">
                Deloitte Audit · Client Intelligence
              </p>
              <h1 style="margin:6px 0 0; color:#ffffff; font-size:22px; font-weight:700;">
                Daily News Digest
              </h1>
              <p style="margin:6px 0 0; color:#bfdbfe; font-size:13px;">{html.escape(date_str)} · Past 24 hours</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 32px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                {blocks}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; border-top:1px solid #e5e7eb; padding:14px 32px;">
              <p style="margin:0; color:#9ca3af; font-size:11px;">
                Sent automatically via GitHub Actions · Source: Google News (NZ edition) · Past 24 hours only
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


# ── Email sending ──────────────────────────────────────────────────────────────

def send_email(subject: str, html_body: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = GMAIL_FROM
    msg["To"] = DIGEST_TO
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.ehlo()
        server.starttls()
        server.login(GMAIL_FROM, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_FROM, DIGEST_TO, msg.as_string())


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    now = datetime.now()
    date_str = f"{now.day} {now.strftime('%B %Y')}"
    print(f"Building digest for {date_str} (past 24 h) ...")

    sections = []
    all_items: list[dict] = []  # collected for parallel summary fetching

    for client in CLIENTS:
        print(f"  Fetching: {client['name']}")

        client_raw: list[dict] = []
        for q in client["client_queries"]:
            client_raw.extend(fetch_news(q))

        industry_raw: list[dict] = []
        for q in client["industry_queries"]:
            industry_raw.extend(fetch_news(q))

        client_items = dedupe(client_raw)[:MAX_CLIENT_ITEMS]
        industry_items = dedupe(industry_raw)[:MAX_INDUSTRY_ITEMS]

        sections.append(
            {
                "name": client["name"],
                "industry": client["industry"],
                "client_items": client_items,
                "industry_items": industry_items,
            }
        )
        all_items.extend(client_items)
        all_items.extend(industry_items)

    print(f"  Fetching summaries for {len(all_items)} articles ...")
    attach_summaries(all_items)

    html_body = build_html(date_str, sections)
    subject = f"Client News Digest — {date_str}"
    send_email(subject, html_body)
    print(f"Sent to {DIGEST_TO}")


if __name__ == "__main__":
    main()
