#!/usr/bin/env python3
"""Fetch the latest Instagram posts for the website.

Uses Meta's current Instagram API with Instagram Login flow:
1. Resolve the professional Instagram account with ``/me``.
2. Fetch media from ``/<IG_ID>/media``.

Required environment variable:
    INSTAGRAM_ACCESS_TOKEN

The script never replaces a previously valid posts.json when credentials or the
API fail. It exits non-zero so GitHub Actions reports the real problem.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

OUTPUT_FILE = Path("posts.json")
LIMIT = 5
API_BASE = "https://graph.instagram.com"
API_VERSION = os.environ.get("INSTAGRAM_API_VERSION", "v25.0").strip() or "v25.0"
ACCOUNT_FIELDS = "user_id,username"
MEDIA_FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"


class InstagramAPIError(RuntimeError):
    """Safe API error that never includes the access token or request URL."""


def normalize_token(raw_token: str) -> str:
    """Remove common copy/paste wrappers without logging the secret."""
    token = (raw_token or "").strip()

    if token.upper().startswith("INSTAGRAM_ACCESS_TOKEN="):
        token = token.split("=", 1)[1].strip()
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    if len(token) >= 2 and token[0] == token[-1] and token[0] in {"'", '"'}:
        token = token[1:-1].strip()

    return token


def _request_json(path: str, token: str, **params: Any) -> dict[str, Any]:
    url = f"{API_BASE}/{API_VERSION}/{path.lstrip('/')}"
    query = {**params, "access_token": token}

    try:
        response = requests.get(url, params=query, timeout=20)
    except requests.RequestException as exc:
        raise InstagramAPIError(
            f"Instagram API network failure: {exc.__class__.__name__}"
        ) from None

    try:
        payload = response.json()
    except ValueError:
        payload = {}

    if not response.ok:
        error = payload.get("error", {}) if isinstance(payload, dict) else {}
        message = error.get("message") or "Unknown Instagram API error"
        error_type = error.get("type") or "APIError"
        code = error.get("code", response.status_code)
        raise InstagramAPIError(
            f"Instagram API rejected the request: {error_type} code={code}: {message}"
        )

    if not isinstance(payload, dict):
        raise InstagramAPIError("Instagram API returned an unexpected response format")
    return payload


def get_account(token: str) -> tuple[str, str]:
    payload = _request_json("me", token, fields=ACCOUNT_FIELDS)

    # Meta has returned both a direct object and a one-item data collection in
    # examples/rollouts. Supporting both keeps the integration resilient.
    account = payload
    if isinstance(payload.get("data"), list) and payload["data"]:
        account = payload["data"][0]

    user_id = str(account.get("user_id") or account.get("id") or "").strip()
    username = str(account.get("username") or "").strip()
    if not user_id:
        raise InstagramAPIError(
            "The token is valid but Meta did not return an Instagram user_id. "
            "Verify that it belongs to a Professional (Business or Creator) account."
        )
    return user_id, username


def fetch_posts(token: str) -> tuple[list[dict[str, Any]], str]:
    user_id, username = get_account(token)
    payload = _request_json(
        f"{user_id}/media",
        token,
        fields=MEDIA_FIELDS,
        limit=LIMIT,
    )
    raw_posts = payload.get("data", [])
    if not isinstance(raw_posts, list):
        raise InstagramAPIError("Instagram media response did not contain a data list")

    posts: list[dict[str, Any]] = []
    for post in raw_posts:
        if not isinstance(post, dict):
            continue
        media_url = post.get("media_url") or post.get("thumbnail_url")
        if not post.get("id") or not post.get("permalink") or not media_url:
            continue
        clean_post = {key: post[key] for key in (
            "id", "caption", "media_type", "media_url", "thumbnail_url",
            "permalink", "timestamp"
        ) if key in post}
        posts.append(clean_post)

    if not posts:
        raise InstagramAPIError(
            "Instagram returned no displayable media. Verify account permissions "
            "and that the connected Professional account has published posts."
        )
    return posts[:LIMIT], username


def write_posts(posts: list[dict[str, Any]], username: str) -> None:
    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": "instagram_graph_api",
        "username": username,
        "posts": posts,
    }
    temporary = OUTPUT_FILE.with_suffix(".json.tmp")
    with temporary.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    temporary.replace(OUTPUT_FILE)


def main() -> int:
    token = normalize_token(os.environ.get("INSTAGRAM_ACCESS_TOKEN", ""))
    if not token:
        print(
            "ERROR: INSTAGRAM_ACCESS_TOKEN is missing or empty. "
            "Existing posts.json was preserved.",
            file=sys.stderr,
        )
        return 1

    try:
        posts, username = fetch_posts(token)
        write_posts(posts, username)
    except InstagramAPIError as exc:
        print(f"ERROR: {exc}. Existing posts.json was preserved.", file=sys.stderr)
        return 1

    account_label = f"@{username}" if username else "the connected account"
    print(f"Fetched and saved {len(posts)} posts from {account_label}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
