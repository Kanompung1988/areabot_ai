"""
Intent Classifier — Hybrid rule-based + Gemini LLM fallback
Returns "RETRIEVE" (ต้องค้นหาจาก Knowledge Base) หรือ "DIRECT" (ตอบได้เลย)
"""
import re
import logging
from google import genai
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Rule-based fast-path ────────────────────────────────────────────────────

_DIRECT_RE = re.compile(
    r"^("
    r"สวัสดี|หวัดดี|ดีจ้า|ดีครับ|ดีค่ะ|hello|hi\b|hey\b|"          # greetings
    r"ขอบคุณ|ขอบใจ|ขอบคุณมาก|thank\s*you|thanks|"                    # thanks
    r"บาย|ลาก่อน|ลาแล้ว|แล้วเจอกัน|goodbye|bye\b|"                   # farewells
    r"โอเค|โอเคค่ะ|โอเคครับ|okay|ok\b|"                              # acknowledgements
    r"ใช่|ใช่ค่ะ|ใช่ครับ|ได้เลย|เข้าใจแล้ว"                         # simple confirms
    r")$",
    re.IGNORECASE,
)

_SMALLTALK_RE = re.compile(
    r"^(วันนี้|เมื่อวาน|พรุ่งนี้).{0,30}"
    r"(อากาศ|หนาว|ร้อน|ฝน|แดด|เที่ยว|กิน|นอน|เหนื่อย)",
    re.IGNORECASE,
)

# คำศัพท์ที่บ่งชี้ว่าต้องการค้นหาข้อมูล (ขยายได้ตามธุรกิจ)
_INFO_KW_RE = re.compile(
    r"ราคา|บาท|แพ็กเกจ|โปรโมชั่น|บริการ|รักษา|ฉีด|เลเซอร์|ฟิลเลอร์|"
    r"botox|โบท็อกซ์|เสริม|ดูด|ไขมัน|เปิด|ปิด|นัด|เวลา|ที่อยู่|สาขา|"
    r"เจ็บ|ดูแล|หลังทำ|ก่อนทำ|ผล|price|cost|prp|hifu|laser|"
    r"สินค้า|product|รายละเอียด|วิธี|ขั้นตอน|เงื่อนไข|นโยบาย|"
    r"ส่งนาน|ส่งฟรี|การรับประกัน|warranty|guarantee",
    re.IGNORECASE,
)


def _rule_based_intent(user_message: str) -> str | None:
    """Returns 'DIRECT', 'RETRIEVE', or None (ambiguous — needs LLM)."""
    msg = user_message.strip()
    if _DIRECT_RE.match(msg):
        return "DIRECT"
    if _SMALLTALK_RE.match(msg) and not _INFO_KW_RE.search(msg):
        return "DIRECT"
    if _INFO_KW_RE.search(msg):
        return "RETRIEVE"
    return None


_CLASSIFY_SYSTEM = (
    "คุณเป็น classifier ที่ตอบได้เพียง RETRIEVE หรือ DIRECT เท่านั้น ห้ามตอบอื่น"
)

_CLASSIFY_PROMPT = """\
จำแนกข้อความต่อไปนี้ว่าต้องการค้นหาข้อมูลจากฐานข้อมูลธุรกิจหรือไม่

ตอบ "DIRECT" ถ้าข้อความเป็น:
- ทักทาย เช่น สวัสดี, หวัดดี, hello, hi
- ลาจาก เช่น บาย, ลาก่อน, goodbye
- ขอบคุณ เช่น ขอบคุณ, ขอบใจ, thank you
- สนทนาทั่วไปที่ไม่เกี่ยวกับสินค้า/บริการ
- คำถามที่ตอบได้โดยไม่ต้องใช้ข้อมูลราคาหรือบริการเฉพาะ

ตอบ "RETRIEVE" ถ้าข้อความถามเกี่ยวกับ:
- ราคา / ค่าใช้จ่าย / แพ็กเกจ / โปรโมชั่น
- รายละเอียดสินค้า / บริการ / ขั้นตอน
- เวลาทำการ / ที่ตั้ง / การนัดหมาย / วิธีติดต่อ
- นโยบาย / เงื่อนไข / การรับประกัน

ตัวอย่าง DIRECT: สวัสดีค่ะ | ขอบคุณมาก | บาย | วันนี้อากาศดีจัง
ตัวอย่าง RETRIEVE: ราคาเท่าไหร่ | มีโปรโมชั่นไหม | เปิดกี่โมง | มีบริการอะไรบ้าง

ข้อความ: {user_message}

ตอบเพียง RETRIEVE หรือ DIRECT"""


async def classify_intent(user_message: str) -> str:
    """
    Classify user message as 'RETRIEVE' or 'DIRECT'.

    Fast-path uses regex to skip API calls for obvious cases.
    Falls back to Typhoon LLM (or OpenAI if Typhoon not configured) for ambiguous cases.
    Defaults to RETRIEVE on error to never miss important information.
    """
    rule_result = _rule_based_intent(user_message)
    if rule_result is not None:
        return rule_result

    # Gemini LLM fallback for ambiguous messages
    try:
        from google.genai import types
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = await client.aio.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[_CLASSIFY_PROMPT.format(user_message=user_message)],
            config=types.GenerateContentConfig(
                system_instruction=_CLASSIFY_SYSTEM,
                temperature=0,
                max_output_tokens=5,
            ),
        )
        result = (response.text or "").strip().upper()
        return "RETRIEVE" if "RETRIEVE" in result else "DIRECT"
    except Exception as e:
        logger.warning(f"Intent classifier LLM call failed, defaulting to RETRIEVE: {e}")
        return "RETRIEVE"
