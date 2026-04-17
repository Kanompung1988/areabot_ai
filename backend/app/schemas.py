from datetime import datetime, date, time
from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr, Field, model_validator


# ── Auth ──────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    full_name: str
    email: str


class TokenPair(Token):
    refresh_token: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    is_admin: bool
    email_verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


# ── Email Verification & Password Reset (#14) ────────
class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class TestEmailRequest(BaseModel):
    to: EmailStr
    smtp_host: str
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    from_email: EmailStr
    from_name: str = "TobTan"
    use_tls: bool = True


# ── Bot ──────────────────────────────────────────────
class BotCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    company_name: str = Field(min_length=1, max_length=255)
    business_type: Optional[str] = None
    description: Optional[str] = None
    products_services: Optional[str] = None
    pricing_info: Optional[str] = None
    phone: Optional[str] = None
    email_contact: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    facebook_url: Optional[str] = None
    line_id: Optional[str] = None
    instagram_url: Optional[str] = None
    bot_name: str = "Assistant"
    bot_personality: Optional[str] = None
    response_language: str = "Thai"
    greeting_message: Optional[str] = None
    model_name: str = "gpt-4.1-mini"
    openai_api_key: Optional[str] = None  # per-bot key; ถ้าไม่ใส่ใช้ key ใน .env


class BotUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    business_type: Optional[str] = None
    description: Optional[str] = None
    products_services: Optional[str] = None
    pricing_info: Optional[str] = None
    phone: Optional[str] = None
    email_contact: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    facebook_url: Optional[str] = None
    line_id: Optional[str] = None
    instagram_url: Optional[str] = None
    bot_name: Optional[str] = None
    bot_personality: Optional[str] = None
    response_language: Optional[str] = None
    greeting_message: Optional[str] = None
    model_name: Optional[str] = None
    openai_api_key: Optional[str] = None  # per-bot key
    line_channel_secret: Optional[str] = None
    line_channel_access_token: Optional[str] = None
    fb_page_token: Optional[str] = None
    fb_verify_token: Optional[str] = None
    fb_app_secret: Optional[str] = None
    instagram_access_token: Optional[str] = None
    instagram_verify_token: Optional[str] = None
    is_active: Optional[bool] = None
    handoff_enabled: Optional[bool] = None
    handoff_keywords: Optional[str] = None


class BotOut(BaseModel):
    id: str
    name: str
    company_name: str
    business_type: Optional[str]
    description: Optional[str]
    products_services: Optional[str]
    pricing_info: Optional[str]
    phone: Optional[str]
    email_contact: Optional[str]
    website: Optional[str]
    address: Optional[str]
    facebook_url: Optional[str]
    line_id: Optional[str]
    instagram_url: Optional[str]
    bot_name: str
    bot_personality: Optional[str]
    response_language: str
    greeting_message: Optional[str]
    system_prompt: Optional[str]
    api_key: str
    model_name: str = "gpt-4.1-mini"
    openai_api_key: Optional[str]  # masked ใน response — แสดงแค่ว่ามี key หรือเปล่า
    line_channel_secret: Optional[str]
    line_channel_access_token: Optional[str]
    fb_page_token: Optional[str]
    fb_verify_token: Optional[str]
    instagram_access_token: Optional[str]
    instagram_verify_token: Optional[str]
    handoff_enabled: bool = True
    total_messages: int
    total_conversations: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="after")
    def mask_sensitive_keys(self) -> "BotOut":
        """Mask sensitive keys — return only last 4 chars with *** prefix."""
        if self.openai_api_key:
            self.openai_api_key = f"***{self.openai_api_key[-4:]}"
        if self.line_channel_secret:
            self.line_channel_secret = f"***{self.line_channel_secret[-4:]}"
        if self.line_channel_access_token:
            self.line_channel_access_token = f"***{self.line_channel_access_token[-4:]}"
        if self.fb_page_token:
            self.fb_page_token = f"***{self.fb_page_token[-4:]}"
        if self.instagram_access_token:
            self.instagram_access_token = f"***{self.instagram_access_token[-4:]}"
        return self

    class Config:
        from_attributes = True


# ── Conversations ─────────────────────────────────────
class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    tokens_used: int
    model_used: Optional[str]
    message_type: str = "text"
    rich_content: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: str
    bot_id: str
    platform: str
    external_user_id: Optional[str]
    external_user_name: Optional[str]
    is_handoff: bool = False
    created_at: datetime
    last_message_at: datetime
    message_count: Optional[int] = 0

    class Config:
        from_attributes = True


class ConversationDetail(ConversationOut):
    messages: List[MessageOut] = []


# ── OpenAI Proxy ──────────────────────────────────────
class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class AdminReplyBody(BaseModel):
    content: str = Field(min_length=1)


class ChatCompletionRequest(BaseModel):
    model: str = "gpt-4.1-mini"
    messages: List[ChatMessage]
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = False


# ── Stats / Analytics (#12) ──────────────────────────
class BotStats(BaseModel):
    bot_id: str
    bot_name: str
    total_messages: int
    total_conversations: int
    messages_by_platform: dict
    recent_conversations: List[ConversationOut]


class DailyMessageStat(BaseModel):
    date: str
    count: int


class AnalyticsResponse(BaseModel):
    total_messages: int
    total_conversations: int
    messages_by_platform: dict
    daily_messages: List[DailyMessageStat]
    avg_response_time_ms: Optional[float] = None
    top_questions: List[dict] = []


# ── Knowledge Base (#5) ──────────────────────────────
class KnowledgeDocumentOut(BaseModel):
    id: str
    bot_id: str
    title: str
    doc_type: str
    source_url: Optional[str]
    chunk_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class CrawlURLRequest(BaseModel):
    url: str = Field(min_length=1)


# ── Broadcast (#10) ──────────────────────────────────
class BroadcastCreate(BaseModel):
    name: str = Field(min_length=1)
    message: str = Field(min_length=1)
    platform: str = "all"  # all / line / facebook


class BroadcastCampaignOut(BaseModel):
    id: str
    bot_id: str
    name: str
    message: str
    platform: str
    target_count: int
    sent_count: int
    failed_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Billing (#13) ────────────────────────────────────
class CheckoutRequest(BaseModel):
    plan: str = Field(pattern="^(pro|business)$")


# ── Available Models (#11) ───────────────────────────
class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    cost_per_1k_tokens: float
    description: str


# ── Appointments / Calendar ───────────────────────────
class AppointmentCreate(BaseModel):
    bot_id: str
    conversation_id: Optional[str] = None
    customer_name: str = Field(min_length=1, max_length=255)
    customer_phone: Optional[str] = None
    doctor_name: Optional[str] = None
    service_type: str = Field(min_length=1, max_length=50)
    treatment: Optional[str] = None
    appointment_date: date
    start_time: time
    end_time: time
    status: str = "รอยืนยัน"
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    doctor_name: Optional[str] = None
    service_type: Optional[str] = None
    treatment: Optional[str] = None
    appointment_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    conversation_id: Optional[str] = None


class AppointmentOut(BaseModel):
    id: str
    bot_id: str
    conversation_id: Optional[str]
    customer_name: str
    customer_phone: Optional[str]
    doctor_name: Optional[str]
    service_type: str
    treatment: Optional[str]
    appointment_date: date
    start_time: time
    end_time: time
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AppointmentStats(BaseModel):
    total: int
    confirmed: int       # ยืนยัน + ยืนยันแล้ว + มาแล้ว
    consult: int         # รอยืนยัน + จองแล้ว
    pending: int         # กำลังนัด (รอยืนยัน)
    cancelled: int       # ยกเลิกนัด


# ── Catalog / Store Management ───────────────────────
class SkuItem(BaseModel):
    name: str
    price: Optional[float] = None


class CatalogItemCreate(BaseModel):
    type: str = "service"  # service | package | promotion
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    skus: Optional[List[SkuItem]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool = True


class CatalogItemUpdate(BaseModel):
    type: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    skus: Optional[List[SkuItem]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None


class CatalogItemOut(BaseModel):
    id: str
    bot_id: str
    type: str
    name: str
    description: Optional[str]
    price: Optional[float]
    image_url: Optional[str]
    skus: Optional[str]   # JSON string — parse on frontend
    start_date: Optional[date]
    end_date: Optional[date]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
