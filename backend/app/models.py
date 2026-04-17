import uuid
from datetime import datetime, date, time
from sqlalchemy import (
    Column, String, Text, Boolean, DateTime, Integer, Float,
    ForeignKey, Enum as SAEnum, JSON, Date, Time
)
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base
import enum


def gen_uuid():
    return str(uuid.uuid4())


class PlatformEnum(str, enum.Enum):
    LINE = "line"
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    API = "api"


# ── User ──────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)

    # Email verification (#14)
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    bots = relationship("Bot", back_populates="owner", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False)


# ── Bot ───────────────────────────────────────────────
class Bot(Base):
    __tablename__ = "bots"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Basic info
    name = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    business_type = Column(String(255))
    description = Column(Text)

    # Products/Services
    products_services = Column(Text)
    pricing_info = Column(Text)

    # Contact info
    phone = Column(String(50))
    email_contact = Column(String(255))
    website = Column(String(500))
    address = Column(Text)

    # Social links
    facebook_url = Column(String(500))
    line_id = Column(String(255))
    instagram_url = Column(String(500))

    # Instagram integration (Meta Graph API)
    instagram_access_token = Column(Text, nullable=True)
    instagram_verify_token = Column(String(255), nullable=True)

    # Bot personality
    bot_name = Column(String(100), default="Assistant")
    bot_personality = Column(String(500))
    response_language = Column(String(50), default="Thai")
    greeting_message = Column(Text)

    # Generated system prompt (by Claude)
    system_prompt = Column(Text)

    # API key (OpenAI-compatible)
    api_key = Column(String(100), unique=True, nullable=False, index=True)

    # Multi-model support (#11) — default: gpt-4.1-mini (Chatbot Engine)
    model_name = Column(String(100), default="gpt-4.1-mini")

    # Per-bot OpenAI API key — ถ้าไม่ใส่ จะ fallback ไปใช้ key ใน .env
    openai_api_key = Column(String(255), nullable=True)

    # LINE integration
    line_channel_secret = Column(String(255))
    line_channel_access_token = Column(Text)

    # Facebook integration
    fb_page_token = Column(Text)
    fb_verify_token = Column(String(255))
    fb_app_secret = Column(String(255))

    # Human handoff (#9)
    handoff_enabled = Column(Boolean, default=True)
    handoff_keywords = Column(Text, default="คุยกับเจ้าหน้าที่,ติดต่อพนักงาน,agent,human")

    # Stats
    total_messages = Column(Integer, default=0)
    total_conversations = Column(Integer, default=0)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="bots")
    conversations = relationship("Conversation", back_populates="bot", cascade="all, delete-orphan")
    knowledge_documents = relationship("KnowledgeDocument", back_populates="bot", cascade="all, delete-orphan")
    broadcast_campaigns = relationship("BroadcastCampaign", back_populates="bot", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="bot", cascade="all, delete-orphan")
    catalog_items = relationship("CatalogItem", back_populates="bot", cascade="all, delete-orphan")


# ── Conversation ──────────────────────────────────────
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    bot_id = Column(String(36), ForeignKey("bots.id", ondelete="CASCADE"), nullable=False)
    platform = Column(SAEnum(PlatformEnum), nullable=False, default=PlatformEnum.API)
    external_user_id = Column(String(255))
    external_user_name = Column(String(255))

    # Human handoff state (#9)
    is_handoff = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    last_message_at = Column(DateTime, default=datetime.utcnow)

    bot = relationship("Bot", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="conversation")


# ── Message ───────────────────────────────────────────
class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # user / assistant / system
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer, default=0)
    model_used = Column(String(100))

    # Rich message support (#6)
    message_type = Column(String(20), default="text")  # text / flex / buttons / image
    rich_content = Column(JSON, nullable=True)  # LINE Flex / FB buttons JSON

    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


# ── Knowledge Base / RAG (#5) ─────────────────────────
class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    bot_id = Column(String(36), ForeignKey("bots.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    doc_type = Column(String(20), nullable=False)  # pdf / docx / txt / url / faq
    source_url = Column(String(1000), nullable=True)
    content = Column(Text)
    chunk_count = Column(Integer, default=0)
    status = Column(String(20), default="processing")  # processing / ready / error
    created_at = Column(DateTime, default=datetime.utcnow)

    bot = relationship("Bot", back_populates="knowledge_documents")
    chunks = relationship("KnowledgeChunk", back_populates="document", cascade="all, delete-orphan")


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    document_id = Column(String(36), ForeignKey("knowledge_documents.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, default=0)
    # pgvector 768-dim for Gemini text-embedding-004
    embedding = Column(Vector(768), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("KnowledgeDocument", back_populates="chunks")


# ── Broadcast Campaign (#10) ─────────────────────────
class BroadcastCampaign(Base):
    __tablename__ = "broadcast_campaigns"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    bot_id = Column(String(36), ForeignKey("bots.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    platform = Column(String(20), default="all")  # all / line / facebook
    target_count = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    status = Column(String(20), default="draft")  # draft / sending / completed / failed
    created_at = Column(DateTime, default=datetime.utcnow)

    bot = relationship("Bot", back_populates="broadcast_campaigns")


# ── Subscription / Billing (#13) ─────────────────────
class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    plan = Column(String(50), default="free")  # free / pro / business
    status = Column(String(50), default="active")  # active / cancelled / past_due
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    message_count = Column(Integer, default=0)  # current period usage
    message_limit = Column(Integer, default=100)  # free = 100
    current_period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="subscription")


# ── Appointment / Calendar ───────────────────────────
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    bot_id = Column(String(36), ForeignKey("bots.id", ondelete="CASCADE"), nullable=False)

    # Link to chat conversation (optional — สร้างนัดจาก inbox ได้)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True)

    # Customer info
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(50), nullable=True)

    # Doctor / Staff (string field — ไม่มี Doctor model แยก)
    doctor_name = Column(String(255), nullable=True)

    # Service
    service_type = Column(String(50), nullable=False)   # ความงาม / ผิวหนัง / เลเซอร์ / ทั่วไป
    treatment = Column(String(255), nullable=True)       # โบท็อกซ์, ฟิลเลอร์, เลเซอร์หน้าใส, etc.

    # Schedule
    appointment_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)            # 08:00–18:00
    end_time = Column(Time, nullable=False)

    # Status
    status = Column(String(50), nullable=False, default="รอยืนยัน")
    # รอยืนยัน / ยืนยัน / ยืนยันแล้ว / มาแล้ว / ยกเลิกนัด / จองแล้ว

    # Notes
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    bot = relationship("Bot", back_populates="appointments")
    conversation = relationship("Conversation", back_populates="appointments")


# ── Catalog / Store Management ───────────────────────
class CatalogItem(Base):
    __tablename__ = "catalog_items"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    bot_id = Column(String(36), ForeignKey("bots.id", ondelete="CASCADE"), nullable=False)

    # service | package | promotion
    type = Column(String(20), nullable=False, default="service")

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=True)
    image_url = Column(Text, nullable=True)

    # SKU list as JSON string: '[{"name": "ขนาด S", "price": 1200}]'
    skus = Column(Text, nullable=True)

    # Promotion dates
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    bot = relationship("Bot", back_populates="catalog_items")


# ── Password Reset Token (#14) ───────────────────────
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Refresh Token (#2) ──────────────────────────────
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
