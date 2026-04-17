"""
Gemini service — Chatbot Engine (Gemini Flash)
ทดแทน OpenAI ทั้งหมด: chat, vision, streaming
"""
import json
import logging
from typing import AsyncGenerator
from google import genai
from google.genai import types
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

DEFAULT_MODEL = "gemini-2.0-flash"

AVAILABLE_MODELS = {
    "gemini-2.0-flash": {
        "provider": "gemini",
        "name": "Gemini 2.0 Flash (แนะนำ)",
        "cost_per_1k_tokens": 0.0001,
        "description": "เร็ว ถูก ภาษาไทยดี Vision รองรับ",
    },
    "gemini-2.5-flash-preview-04-17": {
        "provider": "gemini",
        "name": "Gemini 2.5 Flash Preview",
        "cost_per_1k_tokens": 0.00015,
        "description": "รุ่นล่าสุด — คิดวิเคราะห์ดีกว่า",
    },
    "gemini-1.5-flash": {
        "provider": "gemini",
        "name": "Gemini 1.5 Flash",
        "cost_per_1k_tokens": 0.000075,
        "description": "รุ่นเก่า — ถูกมาก",
    },
    "gemini-1.5-pro": {
        "provider": "gemini",
        "name": "Gemini 1.5 Pro",
        "cost_per_1k_tokens": 0.0035,
        "description": "Pro รุ่นใหญ่ — งาน complex",
    },
}


def _get_client(api_key: str | None = None) -> genai.Client:
    return genai.Client(api_key=api_key or settings.GEMINI_API_KEY)


async def chat_with_openai(
    system_prompt: str,
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    max_tokens: int = 1000,
    temperature: float = 0.7,
    api_key: str | None = None,
) -> tuple[str, int]:
    """
    Gemini chat — same signature as old OpenAI version for drop-in replacement.
    api_key: per-bot Gemini key; ถ้าไม่ระบุใช้ global GEMINI_API_KEY
    """
    client = _get_client(api_key)

    contents = []
    for m in messages:
        role = "user" if m["role"] == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part(text=m["content"])]))

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        max_output_tokens=max_tokens,
        temperature=temperature,
    )

    response = await client.aio.models.generate_content(
        model=model,
        contents=contents,
        config=config,
    )

    text = response.text or ""
    tokens = response.usage_metadata.total_token_count if response.usage_metadata else 0
    return text, tokens


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
    Gemini Vision — อ่านรูปภาพที่ลูกค้าส่งมา
    """
    import base64 as b64lib
    client = _get_client(api_key)

    last_text = (
        messages[-1].get("content", "ช่วยดูรูปนี้ให้หน่อยนะคะ")
        if messages else "ช่วยดูรูปนี้ให้หน่อยนะคะ"
    )

    image_bytes = b64lib.b64decode(image_base64)
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part(inline_data=types.Blob(mime_type=image_mime, data=image_bytes)),
                types.Part(text=last_text),
            ],
        )
    ]

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        max_output_tokens=max_tokens,
        temperature=temperature,
    )

    response = await client.aio.models.generate_content(
        model=model,
        contents=contents,
        config=config,
    )

    text = response.text or ""
    tokens = response.usage_metadata.total_token_count if response.usage_metadata else 0
    return text, tokens


async def chat_with_openai_stream(
    system_prompt: str,
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    max_tokens: int = 1000,
    temperature: float = 0.7,
    api_key: str | None = None,
) -> AsyncGenerator[str, None]:
    """
    Gemini streaming — yields SSE-formatted strings.
    """
    client = _get_client(api_key)

    contents = []
    for m in messages:
        role = "user" if m["role"] == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part(text=m["content"])]))

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        max_output_tokens=max_tokens,
        temperature=temperature,
    )

    async for chunk in client.aio.models.generate_content_stream(
        model=model,
        contents=contents,
        config=config,
    ):
        if chunk.text:
            data = json.dumps({
                "id": "gemini-stream",
                "object": "chat.completion.chunk",
                "choices": [{"index": 0, "delta": {"content": chunk.text}, "finish_reason": None}],
            })
            yield f"data: {data}\n\n"

    yield f"data: {json.dumps({'choices': [{'index': 0, 'delta': {}, 'finish_reason': 'stop'}]})}\n\n"
    yield "data: [DONE]\n\n"
