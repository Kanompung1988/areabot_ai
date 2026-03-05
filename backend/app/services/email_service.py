"""
Email service for verification and password reset emails.
"""
import logging
import secrets
from typing import Optional

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def generate_token() -> str:
    return secrets.token_urlsafe(32)


async def send_email(to: str, subject: str, html_body: str) -> bool:
    """Send email via SMTP. Returns False if SMTP is not configured."""
    if not settings.SMTP_HOST:
        logger.warning(f"SMTP not configured. Would have sent to {to}: {subject}")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            start_tls=True,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False


async def send_verification_email(to: str, token: str):
    url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00e5cc;">AreaBot - ยืนยันอีเมล</h2>
        <p>สวัสดีครับ กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
        <a href="{url}" style="display: inline-block; padding: 12px 24px; background: #00e5cc; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold;">
            ยืนยันอีเมล
        </a>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">
            หรือคัดลอก link นี้: {url}
        </p>
    </div>
    """
    await send_email(to, "AreaBot - ยืนยันอีเมล", html)


async def send_password_reset_email(to: str, token: str):
    url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00e5cc;">AreaBot - รีเซ็ตรหัสผ่าน</h2>
        <p>คลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
        <a href="{url}" style="display: inline-block; padding: 12px 24px; background: #00e5cc; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold;">
            รีเซ็ตรหัสผ่าน
        </a>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">
            Link นี้จะหมดอายุใน 1 ชั่วโมง<br>
            หรือคัดลอก: {url}
        </p>
    </div>
    """
    await send_email(to, "AreaBot - รีเซ็ตรหัสผ่าน", html)
