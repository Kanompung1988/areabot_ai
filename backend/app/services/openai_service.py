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

# Map legacy OpenAI model names → Gemini equivalents
_MODEL_ALIAS: dict[str, str] = {
    "gpt-4.1-mini":     "gemini-2.0-flash",
    "gpt-4.1":          "gemini-2.0-flash",
    "gpt-4o":           "gemini-2.0-flash",
    "gpt-4o-mini":      "gemini-2.0-flash",
    "gpt-4-turbo":      "gemini-1.5-pro",
    "gpt-4":            "gemini-1.5-pro",
    "gpt-3.5-turbo":    "gemini-2.0-flash",
}


def _resolve_model(model: str) -> str:
    """Convert any OpenAI model name to a valid Gemini model name."""
    if model in AVAILABLE_MODELS:
        return model
    resolved = _MODEL_ALIAS.get(model, DEFAULT_MODEL)
    logger.info(f"Model '{model}' remapped to '{resolved}'")
    return resolved


def _get_client(api_key: str | None = None) -> genai.Client:
    key = api_key or settings.GEMINI_API_KEY
    if not key:
        raise ValueError("GEMINI_API_KEY is not set. Please add it to Railway environment variables.")
    return genai.Client(api_key=key)


def _build_contents(messages: list[dict]) -> list[types.Content]:
    """
    Convert message list to Gemini Contents, ensuring:
    - Only 'user'/'model' roles (admin/assistant/system → model)
    - Conversation starts with a 'user' turn
    - No two consecutive turns with the same role (merge them)
    """
    contents: list[types.Content] = []
    for m in messages:
        role = "user" if m["role"] == "user" else "model"
        text = m.get("content") or ""
        if not text.strip():
            continue
        if contents and contents[-1].role == role:
            # Merge with previous same-role turn
            contents[-1].parts.append(types.Part(text=text))
        else:
            contents.append(types.Content(role=role, parts=[types.Part(text=text)]))
    # Gemini requires first turn to be 'user'
    while contents and contents[0].role != "user":
        contents.pop(0)
    return contents


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
    model = _resolve_model(model)
    client = _get_client(api_key)
    contents = _build_contents(messages)

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
    model = _resolve_model(model)
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
    model = _resolve_model(model)
    client = _get_client(api_key)
    contents = _build_contents(messages)

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
