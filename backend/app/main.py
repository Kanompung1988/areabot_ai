import logging
import structlog

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.database import init_db
from app.config import get_settings
from app.routers import auth, bots, proxy, webhook, admin
from app.routers import knowledge, broadcast, export, widget, billing

settings = get_settings()

# ── Structured Logging (#18) ─────────────────────────
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)
logger = structlog.get_logger()

# ── Sentry (#18) ─────────────────────────────────────
if settings.SENTRY_DSN:
    import sentry_sdk
    sentry_sdk.init(dsn=settings.SENTRY_DSN, traces_sample_rate=0.1)

# ── Rate Limiter (#1) ────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AreaBot API", version="2.0.0")
    init_db()
    yield
    logger.info("Shutting down AreaBot API")


app = FastAPI(
    title="AreaBot API",
    description="Chatbot API platform for LINE & Facebook — powered by AI",
    version="2.0.0",
    lifespan=lifespan,
)

# Attach limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Logging Middleware (#18) ──────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(
        "request_started",
        method=request.method,
        path=request.url.path,
        client=request.client.host if request.client else "unknown",
    )
    try:
        response = await call_next(request)
        logger.info(
            "request_completed",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
        )
        return response
    except Exception as e:
        logger.error("request_failed", path=request.url.path, error=str(e))
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ── Routers ───────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(bots.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(knowledge.router, prefix="/api")
app.include_router(broadcast.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(webhook.router)
app.include_router(proxy.router)
app.include_router(widget.router)


@app.get("/")
def root():
    return {"service": "AreaBot API", "version": "2.0.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}
