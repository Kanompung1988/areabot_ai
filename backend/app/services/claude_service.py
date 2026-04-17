import secrets
import anthropic
from app.config import get_settings

settings = get_settings()

# ── ประเภทธุรกิจที่ต้องการ Thai Clinic Guardrails (สบส./อย. compliance) ──
_CLINIC_KEYWORDS = {
    "คลินิก", "clinic", "ความงาม", "beauty", "aesthetic", "ศัลยกรรม",
    "surgery", "หน้า", "ผิว", "skin", "spa", "สปา", "เลเซอร์", "laser",
}

_CLINIC_GUARDRAILS = """
กฎพิเศษสำหรับธุรกิจคลินิก/ความงาม (บังคับใช้เสมอ):
- คุณคือ "ที่ปรึกษาความงาม (Beauty Consultant)" ไม่ใช่แพทย์
- น้ำเสียง: เป็นมิตร สุภาพ เป็นกันเอง ลงท้ายด้วย "ค่ะ/นะคะ"
- ใช้คำศัพท์วงการความงาม: "งานแก้", "งานผิว", "ฉ่ำโกลว์", "หน้าเรียวชัด"
- ห้ามโอ้อวด: ห้ามใช้ "ดีที่สุด", "เห็นผลทันที", "ปลอดภัย 100%", "การันตีผลลัพธ์", "ราคาถูกที่สุด" (ผิดกฎหมาย สบส.)
- ทุกครั้งที่พูดถึงผลลัพธ์ ต้องแนบ: "ผลลัพธ์ขึ้นอยู่กับดุลยพินิจของแพทย์และสภาพผิวของแต่ละบุคคล"
- จบบทสนทนาด้วยคำถามปลายเปิดหรือทางเลือกเสมอ เช่น "สนใจนัดประเมินกับคุณหมอก่อนไหมคะ?"
- ห้ามวินิจฉัยโรคหรือให้คำแนะนำทางการแพทย์เด็ดขาด"""


def _is_clinic_business(business_type: str) -> bool:
    """ตรวจสอบว่าเป็นธุรกิจคลินิก/ความงามหรือไม่"""
    lower = business_type.lower()
    return any(kw in lower for kw in _CLINIC_KEYWORDS)


def inject_runtime_guardrails(system_prompt: str, business_type: str) -> str:
    """Inject clinic guardrails at request time if not already present.

    Called by webhook/proxy on every request so guardrails are enforced
    even if the stored system_prompt pre-dates this feature.
    For non-clinic bots this is a no-op.
    """
    if not _is_clinic_business(business_type):
        return system_prompt
    # Avoid duplicating guardrails if already embedded (e.g. from bot creation)
    if "สบส." in system_prompt or "Beauty Consultant" in system_prompt:
        return system_prompt
    return system_prompt + _CLINIC_GUARDRAILS


def generate_api_key() -> str:
    """Generate a unique OpenAI-style API key for the bot."""
    return f"ab-{secrets.token_urlsafe(32)}"


async def generate_system_prompt(bot_data: dict) -> str:
    """
    Use Claude Sonnet 4.6 (Code Writer) to generate a persona-based system prompt.
    Runs once at bot creation time — expensive model, called once only.
    For clinic/beauty businesses, adds Thai สบส./อย. compliance guardrails.
    """
    if not settings.ANTHROPIC_API_KEY:
        return _fallback_system_prompt(bot_data)

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    lang = bot_data.get('response_language', 'ไทย')
    bot_name = bot_data.get('bot_name', 'น้องบอท')
    personality = bot_data.get('bot_personality', 'ร่าเริง ใจดี พูดจาเป็นกันเอง')
    business_type = bot_data.get('business_type', '')
    is_clinic = _is_clinic_business(business_type)

    clinic_section = ""
    if is_clinic:
        clinic_section = """
5. CLINIC COMPLIANCE (บังคับสำหรับธุรกิจคลินิก/ความงาม) — เพิ่มกฎเหล่านี้ในระบบ:
   - บทบาทคือ "ที่ปรึกษาความงาม" ไม่ใช่แพทย์ ห้ามวินิจฉัยโรค
   - ห้ามใช้คำโอ้อวดตามกฎหมาย สบส.: "ดีที่สุด", "เห็นผลทันที", "ปลอดภัย 100%", "การันตีผลลัพธ์"
   - ทุกครั้งที่พูดถึงผลลัพธ์ต้องระบุ: "ผลลัพธ์ขึ้นอยู่กับดุลยพินิจของแพทย์และสภาพผิวของแต่ละบุคคล"
   - ใช้ภาษาวงการความงาม: "งานผิว", "ฉ่ำโกลว์", "หน้าเรียวชัด", "งานแก้"
   - จบด้วยคำถามปิดการขาย: "สะดวกนัดประเมินผิวกับคุณหมอก่อนไหมคะ?"
"""

    prompt = f"""คุณคือ AI Prompt Engineer ผู้เชี่ยวชาญสร้าง System Prompt สำหรับ AI Chatbot ภาษาไทย

สร้าง System Prompt สำหรับ chatbot ธุรกิจต่อไปนี้:

ข้อมูลธุรกิจ:
- ชื่อบริษัท: {bot_data.get('company_name', '')}
- ประเภทธุรกิจ: {business_type}
- รายละเอียด: {bot_data.get('description', '')}
- สินค้า/บริการ: {bot_data.get('products_services', '')}
- ราคา: {bot_data.get('pricing_info', '')}
- โทร: {bot_data.get('phone', '')}
- อีเมล: {bot_data.get('email_contact', '')}
- เว็บไซต์: {bot_data.get('website', '')}
- ที่อยู่: {bot_data.get('address', '')}
- Facebook: {bot_data.get('facebook_url', '')}
- LINE ID: {bot_data.get('line_id', '')}
- ชื่อ Bot: {bot_name}
- บุคลิก: {personality}
- ภาษาหลัก: {lang}
- ข้อความต้อนรับ: {bot_data.get('greeting_message', '')}

System Prompt ที่ต้องสร้างต้องมีครบทุกส่วนต่อไปนี้ (เขียนให้ flow เป็นธรรมชาติ ไม่ต้องใส่หัวข้อ):

1. PERSONA — กำหนดตัวตน: ชื่อ อายุ บุคลิก สถานที่ทำงาน
   ตัวอย่าง: "คุณคือ {bot_name} แอดมินสาวอายุ 25 ปี {personality} ทำงานที่ {bot_data.get('company_name', 'บริษัท')}"

2. ROLE & KNOWLEDGE — หน้าที่และความรู้ธุรกิจ ข้อมูลสินค้า/บริการ ราคา ช่องทางติดต่อ

3. RESPONSE RULES — กฎเหล็กในการตอบ:
   - ตอบสั้น 1-3 ประโยคเท่านั้น เหมือนแชทจริงๆ
   - ห้ามตอบเป็นข้อๆ หรือ bullet points เด็ดขาด
   - ห้ามใช้ประโยคแบบ AI: "ขอบคุณสำหรับคำถาม", "ในฐานะที่ฉันเป็น AI", "แน่นอนเลยครับ/ค่ะ!"
   - ใช้ภาษา{lang}เป็นหลัก คำลงท้ายเป็นธรรมชาติตามบุคลิก
   - ถ้าไม่รู้คำตอบให้แนะนำติดต่อโดยตรง อย่าเดา

4. FEW-SHOT EXAMPLES — บทสนทนาตัวอย่าง 4-5 คู่ที่เป็นธรรมชาติ เหมาะกับธุรกิจนี้
   รูปแบบ:
   User: [คำถามลูกค้า]
   Assistant: [การตอบแบบสั้น เป็นธรรมชาติ]
{clinic_section}
ส่ง System Prompt เท่านั้น ไม่ต้องอธิบายเพิ่มเติม"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    result = message.content[0].text

    # Append runtime guardrails for clinic bots (enforced at every response, not just generation)
    if is_clinic:
        result += _CLINIC_GUARDRAILS

    return result


def _fallback_system_prompt(bot_data: dict) -> str:
    """Fallback prompt if Claude API is not configured."""
    lang = bot_data.get('response_language', 'ไทย')
    bot_name = bot_data.get('bot_name', 'น้องบอท')
    company = bot_data.get('company_name', 'บริษัท')
    personality = bot_data.get('bot_personality', 'ร่าเริง ใจดี')
    business_type = bot_data.get('business_type', '')

    base = f"""คุณคือ {bot_name} แอดมินอายุ 25 ปี {personality} ทำงานที่ {company}

หน้าที่: ตอบคำถามลูกค้าเกี่ยวกับ{bot_data.get('description', 'สินค้าและบริการ')}

สินค้า/บริการ: {bot_data.get('products_services', '')}
ราคา: {bot_data.get('pricing_info', '')}
ติดต่อ: {bot_data.get('phone', '')} | {bot_data.get('email_contact', '')}
เว็บไซต์: {bot_data.get('website', '')}

กฎการตอบ (ห้ามละเลย):
- ตอบสั้น 1-3 ประโยค เหมือนแชทจริง
- ห้ามตอบเป็นข้อๆ
- ห้ามใช้ประโยคแบบ AI เช่น "ขอบคุณสำหรับคำถาม"
- ใช้ภาษา{lang}เป็นหลัก
- ถ้าไม่รู้คำตอบ แนะนำให้ติดต่อโดยตรง

ตัวอย่างการตอบ:
User: มีบริการอะไรบ้าง
Assistant: มีหลายอย่างเลยค่ะ {(bot_data.get('products_services') or '')[:80]} อยากรู้เรื่องไหนเพิ่มเติมคะ?

User: ราคาเท่าไหร่
Assistant: {(bot_data.get('pricing_info') or 'ราคาขึ้นอยู่กับแพ็กเกจที่เลือกนะคะ')[:80]} ให้ช่วยอธิบายเพิ่มได้เลยนะคะ"""

    if _is_clinic_business(business_type):
        base += _CLINIC_GUARDRAILS

    return base
