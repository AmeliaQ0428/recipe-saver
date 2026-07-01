#!/usr/bin/env python3
"""Daily Deloitte client news digest — fetches Google News RSS and emails a formatted summary."""

import feedparser
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import parsedate_to_datetime
from datetime import datetime
import os
import html
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

GMAIL_FROM = os.environ["GMAIL_FROM"]
GMAIL_APP_PASSWORD = os.environ["GMAIL_APP_PASSWORD"]
DIGEST_TO = os.environ.get("DIGEST_TO", GMAIL_FROM)

NZ_LOCALE = "hl=en-NZ&gl=NZ&ceid=NZ:en"
MAX_PER_QUERY = 3

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


def fetch_news(query: str, max_items: int = MAX_PER_QUERY) -> list[dict]:
    url = f"https://news.google.com/rss/search?q={quote_plus(query)}&{NZ_LOCALE}"
    feed = feedparser.parse(url)
    items = []
    for entry in feed.entries[:max_items]:
        items.append(
            {
                "title": entry.get("title", "").strip(),
                "link": entry.get("link", ""),
                "source": entry.get("source", {}).get("title", ""),
                "published": entry.get("published", ""),
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
    return f"""
          <tr>
            <td style="padding:8px 0 8px 14px; border-left:3px solid #dbeafe;">
              <a href="{item['link']}" style="color:#1d4ed8; font-size:14px; font-weight:600;
                 text-decoration:none; line-height:1.4;">{title}</a><br>
              <span style="color:#6b7280; font-size:12px;">{meta}</span>
            </td>
          </tr>"""


def subsection(label: str, items: list[dict]) -> str:
    rows = (
        "\n".join(article_row(i) for i in items)
        if items
        else """
          <tr><td style="padding:8px 0 8px 14px; border-left:3px solid #e5e7eb;
            color:#9ca3af; font-size:13px; font-style:italic;">No recent news found.</td></tr>"""
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
        <table width="620" cellpadding="0" cellspacing="0"
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
              <p style="margin:6px 0 0; color:#bfdbfe; font-size:13px;">{html.escape(date_str)}</p>
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
                Sent automatically via GitHub Actions · Source: Google News (NZ edition)
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


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


def main() -> None:
    now = datetime.now()
    date_str = f"{now.day} {now.strftime('%B %Y')}"
    print(f"Building digest for {date_str} ...")

    sections = []
    for client in CLIENTS:
        print(f"  Fetching: {client['name']}")

        client_raw: list[dict] = []
        for q in client["client_queries"]:
            client_raw.extend(fetch_news(q))

        industry_raw: list[dict] = []
        for q in client["industry_queries"]:
            industry_raw.extend(fetch_news(q))

        sections.append(
            {
                "name": client["name"],
                "industry": client["industry"],
                "client_items": dedupe(client_raw)[:5],
                "industry_items": dedupe(industry_raw)[:4],
            }
        )

    html_body = build_html(date_str, sections)
    subject = f"Client News Digest — {date_str}"
    send_email(subject, html_body)
    print(f"Sent to {DIGEST_TO}")


if __name__ == "__main__":
    main()
