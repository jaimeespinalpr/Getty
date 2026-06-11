#!/usr/bin/env python3
"""
fetch_posts.py — Fetches the latest 5 Instagram media posts
for @ghettymotorhome and saves them to posts.json.

Requires:
  - Environment variable: INSTAGRAM_ACCESS_TOKEN
    (Instagram Graph API long-lived token)

Setup instructions:
  1. Go to https://developers.facebook.com/
  2. Create an App → "Consumer" type
  3. Add "Instagram Basic Display" product
  4. Connect your @ghettymotorhome account
  5. Generate a long-lived token (valid 60 days)
  6. Add the token to GitHub Secrets as INSTAGRAM_ACCESS_TOKEN
  7. This script + GitHub Action will auto-refresh usage every day
"""

import json
import os
import sys
from datetime import datetime, timezone
import requests

ACCESS_TOKEN = os.environ.get("INSTAGRAM_ACCESS_TOKEN", "")
OUTPUT_FILE  = "posts.json"
LIMIT        = 5
FIELDS       = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"
API_BASE     = "https://graph.instagram.com"


def fetch_posts(token: str) -> list[dict]:
    url = f"{API_BASE}/me/media"
    params = {
        "fields": FIELDS,
        "limit": LIMIT,
        "access_token": token,
    }
    resp = requests.get(url, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    return data.get("data", [])


def refresh_token(token: str) -> str:
    """Long-lived tokens can be refreshed when they have at least 1 day left."""
    url = f"{API_BASE}/refresh_access_token"
    params = {
        "grant_type": "ig_refresh_token",
        "access_token": token,
    }
    resp = requests.get(url, params=params, timeout=15)
    if resp.ok:
        new_token = resp.json().get("access_token", token)
        print(f"✅ Token refreshed successfully.")
        return new_token
    print(f"⚠️  Could not refresh token: {resp.status_code} — {resp.text}")
    return token


def main():
    if not ACCESS_TOKEN:
        print("⚠️  INSTAGRAM_ACCESS_TOKEN not set. Writing empty posts.json.")
        payload = {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "source": "placeholder",
            "posts": [],
        }
        with open(OUTPUT_FILE, "w") as f:
            json.dump(payload, f, indent=2)
        sys.exit(0)

    # Refresh token to keep it alive (runs daily)
    token = refresh_token(ACCESS_TOKEN)

    # Fetch latest posts
    posts = fetch_posts(token)
    print(f"✅ Fetched {len(posts)} posts from Instagram.")

    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": "instagram_graph_api",
        "posts": posts,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"✅ Saved {len(posts)} posts to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
