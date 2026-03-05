"""
OpenAI service — Chatbot Engine (GPT-4.1-mini)
#8  - Streaming support via SSE
#11 - Multi-model support
Vision - อ่านรูปภาพลูกค้าได้ (GPT-4.1-mini vision)
"""
import json
import logging
from typing import AsyncGenerator
from openai import AsyncOpenAI
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Model registry (#11)
# Default: gpt-4.1-mini — Chatbot Engine ตาม spec ใน AI_Chatbot_Summary
AVAILABLE_MODELS = {
    "gpt-4.1-mini": {
        "provider": "openai",
        "name": "GPT-4.1 Mini (แนะนำ)",
        "cost_per_1k_tokens": 0.0004,
        "description": "Chatbot Engine หลัก — ภาษาไทยดีมาก, Vision, latency ~0.5s",
    },
    "gpt-4.1": {
        "provider": "openai",
        "name": "GPT-4.1",
        "cost_per_1k_tokens": 0.002,
        "description": "รุ่นใหญ่กว่า — งาน complex หรือต้องการความแม่นยำสูง",
    },
    "gpt-4o": {
        "provider": "openai",
        "name": "GPT-4o",
        "cost_per_1k_tokens": 0.005,
        "description": "GPT-4o — Multimodal, รุ่น stable",
    },
    "gpt-4o-mini": {
        "provider": "openai",
        "name": "GPT-4o Mini",
        "cost_per_1k_tokens": 0.00015,
        "description": "เร็วและถูก เหมาะกับบทสนทนาง่ายๆ",
    },
    "gpt-3.5-turbo": {
        "provider": "openai",
        "name": "GPT-3.5 Turbo",
        "cost_per_1k_tokens": 0.0005,
        "description": "ราคาถูกที่สุด เหมาะกับ Q&A พื้นฐาน",
    },
}

DEFAULT_MODEL = "gpt-4.1-mini"


def _resolve_key(bot_key: str | None) -> str:
    """ใช้ per-bot key ถ้ามี มิฉะนั้น fallback ไปใช้ global key ใน .env"""
    return bot_key or settings.OPENAI_API_KEY


async def chat_with_openai(
    system_prompt: str,
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    max_tokens: int = 1000,
    temperature: float = 0.7,
    api_key: str | None = None,
) -> tuple[str, int]:
    """
    Call OpenAI API (Chatbot Engine).
    api_key: per-bot OpenAI key; ถ้าไม่ระบุใช้ global key ใน .env
    Returns (response_text, tokens_used).
    """
    client = AsyncOpenAI(api_key=_resolve_key(api_key))
    full_messages = [{"role": "system", "content": system_prompt}] + messages

    response = await client.chat.completions.create(
        model=model,
        messages=full_messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )

    content = response.choices[0].message.content or ""
    tokens = response.usage.total_tokens if response.usage else 0
    return content, tokens


async def chat_with_openai_vision(
    system_prompt: str,
    messages: list[dict],
    image_base64: str,
    image_mime: str = "image/jpeg",
    model: str = DEFAULT_MODEL,
    max_tokens: int = 1000,
    temperature: float = 0.7,
    api_key: str | None = None,
) -> tuple[str, int]:
    """
    Call OpenAI API with Vision — อ่านรูปภาพที่ลูกค้าส่งมา
    image_base64: base64-encoded image string
    image_mime: เช่น "image/jpeg", "image/png"
    api_key: per-bot key; ถ้าไม่ระบุใช้ global key
    """
    client = AsyncOpenAI(api_key=_resolve_key(api_key))

    # ใช้ history ก่อนหน้า + vision message สุดท้าย
    prior_messages = messages[:-1] if len(messages) > 1 else []
    last_user_text = (
        messages[-1].get("content", "ช่วยดูรูปนี้ให้หน่อยนะคะ")
        if messages else "ช่วยดูรูปนี้ให้หน่อยนะคะ"
    )

    vision_message = {
        "role": "user",
        "content": [
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{image_mime};base64,{image_base64}",
                    "detail": "auto",
                },
            },
            {
                "type": "text",
                "text": last_user_text,
            },
        ],
    }

    full_messages = (
        [{"role": "system", "content": system_prompt}]
        + prior_messages
        + [vision_message]
    )

    response = await client.chat.completions.create(
        model=model,
        messages=full_messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )

    content = response.choices[0].message.content or ""
    tokens = response.usage.total_tokens if response.usage else 0
    return content, tokens


async def chat_with_openai_stream(
    system_prompt: str,
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    max_tokens: int = 1000,
    temperature: float = 0.7,
    api_key: str | None = None,
) -> AsyncGenerator[str, None]:
    """
    Stream chat completions using SSE (#8).
    api_key: per-bot key; ถ้าไม่ระบุใช้ global key
    Yields Server-Sent Event formatted strings.
    """
    client = AsyncOpenAI(api_key=_resolve_key(api_key))
    full_messages = [{"role": "system", "content": system_prompt}] + messages

    stream = await client.chat.completions.create(
        model=model,
        messages=full_messages,
        max_tokens=max_tokens,
        temperature=temperature,
        stream=True,
    )

    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            data = json.dumps({
                "id": "chatcmpl-stream",
                "object": "chat.completion.chunk",
                "choices": [{
                    "index": 0,
                    "delta": {"content": content},
                    "finish_reason": None,
                }]
            })
            yield f"data: {data}\n\n"

    yield f"data: {json.dumps({'choices': [{'index': 0, 'delta': {}, 'finish_reason': 'stop'}]})}\n\n"
    yield "data: [DONE]\n\n"
