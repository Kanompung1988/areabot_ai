"""
PII Masking service — PDPA / HIPAA compliance.
ported from Tobtan-Clinic-AI.

ซ่อนข้อมูลส่วนบุคคลก่อนส่งให้ LLM ภายนอก:
- เบอร์โทรศัพท์ไทย
- อีเมล
"""
import re

# Thai mobile: 08x-xxx-xxxx, 09x-xxx-xxxx, 06x-xxx-xxxx (with/without dashes)
_PHONE_RE = re.compile(r"0[6-9]\d{1,2}-?\d{3}-?\d{4}")
_EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")


def mask_pii(text: str) -> str:
    """Replace Thai phone numbers and email addresses with safe placeholders."""
    if not text:
        return text
    text = _PHONE_RE.sub("[PHONE_MASKED]", text)
    text = _EMAIL_RE.sub("[EMAIL_MASKED]", text)
    return text
