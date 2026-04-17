#!/usr/bin/env python3
"""
Simulate LINE and Facebook webhook payloads against the local dev server.

Usage:
    python scripts/test_webhook.py <bot_id> line
    python scripts/test_webhook.py <bot_id> facebook
    python scripts/test_webhook.py <bot_id> all

Requirements:
    pip install httpx

The script intentionally skips signature validation (no channel secret needed)
by NOT sending X-Line-Signature / X-Hub-Signature headers.
To test with real signature validation, set LINE_CHANNEL_SECRET or FB_APP_SECRET
as environment variables and they will be used to sign the payloads.
"""

import base64
import hashlib
import hmac
import json
import os
import sys
import time
import httpx

BASE_URL = os.getenv("API_URL", "http://localhost:8000")


# ─── LINE helpers ────────────────────────────────────────────────────────────

def make_line_payload(user_id: str = "Utest0000000000000000000000000001", text: str = "สวัสดีครับ") -> dict:
    return {
        "destination": "U00000000000000000000000000000000",
        "events": [
            {
                "type": "message",
                "mode": "active",
                "timestamp": int(time.time() * 1000),
                "source": {"type": "user", "userId": user_id},
                "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                "message": {"id": "100001", "type": "text", "text": text},
            }
        ],
    }


def sign_line(body: bytes, secret: str) -> str:
    mac = hmac.new(secret.encode(), body, hashlib.sha256).digest()
    return base64.b64encode(mac).decode()


def test_line(bot_id: str):
    print("\n── LINE Webhook Test ───────────────────────────────────────")
    url = f"{BASE_URL}/webhook/line/{bot_id}"

    messages = [
        "สวัสดีครับ อยากทราบราคา",
        "มีโปรโมชั่นอะไรบ้างคะ",
        "อยากนัดหมอ",
    ]

    secret = os.getenv("LINE_CHANNEL_SECRET", "")
    for msg in messages:
        payload = make_line_payload(text=msg)
        body = json.dumps(payload, ensure_ascii=False).encode()
        headers = {"Content-Type": "application/json"}
        if secret:
            headers["X-Line-Signature"] = sign_line(body, secret)
            print(f"  [signed] {msg[:40]}")
        else:
            print(f"  [no-sig] {msg[:40]}")

        try:
            r = httpx.post(url, content=body, headers=headers, timeout=30)
            status_icon = "✓" if r.status_code == 200 else "✗"
            print(f"    {status_icon} HTTP {r.status_code} — {r.text[:120]}")
        except Exception as e:
            print(f"    ✗ ERROR: {e}")


# ─── Facebook helpers ────────────────────────────────────────────────────────

def make_fb_payload(sender_id: str = "100000000000001", text: str = "Hello") -> dict:
    return {
        "object": "page",
        "entry": [
            {
                "id": "me",
                "time": int(time.time() * 1000),
                "messaging": [
                    {
                        "sender": {"id": sender_id},
                        "recipient": {"id": "page_id"},
                        "timestamp": int(time.time() * 1000),
                        "message": {"mid": "mid.test0001", "text": text},
                    }
                ],
            }
        ],
    }


def sign_fb(body: bytes, secret: str) -> str:
    mac = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return f"sha256={mac}"


def test_facebook(bot_id: str):
    print("\n── Facebook Webhook Test ───────────────────────────────────")
    url = f"{BASE_URL}/webhook/facebook/{bot_id}"

    messages = [
        "Hi! What services do you offer?",
        "ราคาโบท็อกซ์เท่าไหร่คะ",
        "อยากนัดวันพรุ่งนี้ได้ไหม",
    ]

    secret = os.getenv("FB_APP_SECRET", "")
    for msg in messages:
        payload = make_fb_payload(text=msg)
        body = json.dumps(payload, ensure_ascii=False).encode()
        headers = {"Content-Type": "application/json"}
        if secret:
            headers["X-Hub-Signature-256"] = sign_fb(body, secret)
            print(f"  [signed] {msg[:40]}")
        else:
            print(f"  [no-sig] {msg[:40]}")

        try:
            r = httpx.post(url, content=body, headers=headers, timeout=30)
            status_icon = "✓" if r.status_code == 200 else "✗"
            print(f"    {status_icon} HTTP {r.status_code} — {r.text[:120]}")
        except Exception as e:
            print(f"    ✗ ERROR: {e}")


# ─── Facebook GET verification ───────────────────────────────────────────────

def test_fb_verify(bot_id: str):
    print("\n── Facebook Webhook Verification (GET) ─────────────────────")
    verify_token = os.getenv("FB_VERIFY_TOKEN", "tobtan_verify_token")
    url = (
        f"{BASE_URL}/webhook/facebook/{bot_id}"
        f"?hub.mode=subscribe"
        f"&hub.verify_token={verify_token}"
        f"&hub.challenge=CHALLENGE_ACCEPTED"
    )
    try:
        r = httpx.get(url, timeout=10)
        status_icon = "✓" if r.status_code == 200 else "✗"
        print(f"  {status_icon} HTTP {r.status_code} — {r.text[:80]}")
    except Exception as e:
        print(f"  ✗ ERROR: {e}")


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_webhook.py <bot_id> [line|facebook|all]")
        print("  bot_id  : UUID of the bot to test (must exist in DB and be active)")
        print("  platform: line | facebook | all  (default: all)")
        sys.exit(1)

    bot_id = sys.argv[1]
    platform = sys.argv[2].lower() if len(sys.argv) > 2 else "all"

    print(f"Target: {BASE_URL}")
    print(f"Bot ID: {bot_id}")

    if platform in ("line", "all"):
        test_line(bot_id)
    if platform in ("facebook", "all"):
        test_fb_verify(bot_id)
        test_facebook(bot_id)

    print("\nDone.")


if __name__ == "__main__":
    main()
