"""
Auth router with refresh token, email verification, and password reset.
Covers: #2, #14
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, verify_refresh_token, revoke_refresh_token,
    revoke_all_user_tokens, get_current_user,
)
from app.config import get_settings
from app.services.email_service import (
    send_verification_email, send_password_reset_email, generate_token
)

settings = get_settings()
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.TokenPair, status_code=201)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def register(body: schemas.UserRegister, request: Request, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    verification_token = generate_token()
    user = models.User(
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        email_verification_token=verification_token,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Send verification email (non-blocking, won't fail registration)
    try:
        await send_verification_email(body.email, verification_token)
    except Exception:
        pass

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token(user.id, db)

    return schemas.TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
    )


@router.post("/login", response_model=schemas.TokenPair)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def login(body: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token(user.id, db)

    return schemas.TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
    )


@router.post("/refresh", response_model=schemas.Token)
async def refresh_access_token(body: schemas.RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access token."""
    user = verify_refresh_token(body.refresh_token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    # Rotate: revoke old, issue new
    revoke_refresh_token(body.refresh_token, db)
    new_access = create_access_token({"sub": user.id})
    new_refresh = create_refresh_token(user.id, db)

    return schemas.TokenPair(
        access_token=new_access,
        refresh_token=new_refresh,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
    )


@router.post("/logout")
async def logout(body: schemas.RefreshRequest, db: Session = Depends(get_db)):
    """Revoke the refresh token on logout."""
    revoke_refresh_token(body.refresh_token, db)
    return {"message": "Logged out"}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ── Email Verification (#14) ─────────────────────────
@router.post("/verify-email")
async def verify_email(body: schemas.VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.email_verification_token == body.token
    ).first()
    if not user:
        raise HTTPException(400, "Invalid verification token")

    user.email_verified = True
    user.email_verification_token = None
    db.commit()
    return {"message": "Email verified successfully"}


# ── Password Reset (#14) ─────────────────────────────
@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(body: schemas.ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        # Don't reveal whether email exists
        return {"message": "If the email exists, a reset link has been sent"}

    token = generate_token()
    reset = models.PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    db.add(reset)
    db.commit()

    try:
        await send_password_reset_email(body.email, token)
    except Exception:
        pass

    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/test-email")
@limiter.limit("3/minute")
async def test_email(
    body: schemas.TestEmailRequest,
    request: Request,
    current_user: models.User = Depends(get_current_user),
):
    """Send a test email using custom SMTP credentials provided by the user.

    Security notes:
    - Rate limited to 3/minute to prevent abuse
    - Requires authentication
    - User-controlled SMTP host: this endpoint allows connecting to arbitrary SMTP servers.
      Consider restricting to a whitelist of allowed SMTP hosts in production.
    """
    import aiosmtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{body.from_name} <{body.from_email}>"
    msg["To"] = body.to
    msg["Subject"] = "TobTan — ทดสอบการส่งอีเมล"
    html = f"""
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #181818;">TobTan — ทดสอบอีเมล</h2>
        <p>อีเมลนี้ถูกส่งโดยระบบทดสอบ SMTP ของ <strong>{body.from_name}</strong></p>
        <p style="color: #666; font-size: 12px;">จาก: {body.from_email} | ถึง: {body.to}</p>
    </div>
    """
    msg.attach(MIMEText(html, "html"))
    try:
        await aiosmtplib.send(
            msg,
            hostname=body.smtp_host,
            port=body.smtp_port,
            username=body.smtp_user or None,
            password=body.smtp_password or None,
            start_tls=body.use_tls,
            timeout=10,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SMTP error: {str(e)}")
    return {"message": "Test email sent successfully"}


@router.post("/reset-password")
async def reset_password(body: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    reset = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == body.token,
        models.PasswordResetToken.used == False,
        models.PasswordResetToken.expires_at > datetime.utcnow(),
    ).first()
    if not reset:
        raise HTTPException(400, "Invalid or expired reset token")

    user = db.query(models.User).filter(models.User.id == reset.user_id).first()
    if not user:
        raise HTTPException(400, "User not found")

    user.hashed_password = hash_password(body.new_password)
    reset.used = True

    # Revoke all existing tokens for security
    revoke_all_user_tokens(user.id, db)
    db.commit()

    return {"message": "Password reset successfully"}
