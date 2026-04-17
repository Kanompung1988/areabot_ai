from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────
    DATABASE_URL: str = "postgresql://areabot:areabot_pass@localhost:5432/areabot_db"

    # ── Auth ──────────────────────────────────────────────
    SECRET_KEY: str = "change-this-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # short-lived access token
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── AI APIs ───────────────────────────────────────────
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # ── Typhoon AI (Thai-optimized LLM — OpenAI-compatible) ──
    TYPHOON_API_KEY: str = ""
    TYPHOON_BASE_URL: str = "https://api.opentyphoon.ai/v1"
    TYPHOON_MODEL: str = "typhoon-v2.5-30b-a3b-instruct"

    # ── Redis ─────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Email (SMTP) ─────────────────────────────────────
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@areabot.ai"
    SMTP_FROM_NAME: str = "AreaBot"

    # ── Stripe ────────────────────────────────────────────
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_PRO: str = ""
    STRIPE_PRICE_BUSINESS: str = ""

    # ── Sentry ────────────────────────────────────────────
    SENTRY_DSN: str = ""

    # ── Rate Limiting ─────────────────────────────────────
    RATE_LIMIT_DEFAULT: str = "60/minute"
    RATE_LIMIT_WEBHOOK: str = "120/minute"
    RATE_LIMIT_AUTH: str = "10/minute"

    # ── App ───────────────────────────────────────────────
    APP_NAME: str = "AreaBot"
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
