import secrets
import anthropic
from app.config import get_settings

settings = get_settings()


def generate_api_key() -> str:
    """Generate a unique OpenAI-style API key for the bot."""
    return f"ab-{secrets.token_urlsafe(32)}"


async def generate_system_prompt(bot_data: dict) -> str:
    """
    Use Claude Sonnet 4.6 (Code Writer) to generate a persona-based system prompt.
    Runs once at bot creation time — expensive model, called once only.
    """
    if not settings.ANTHROPIC_API_KEY:
        return _fallback_system_prompt(bot_data)

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    lang = bot_data.get('response_language', 'ไทย')
    bot_name = bot_data.get('bot_name', 'น้องบอท')
    personality = bot_data.get('bot_personality', 'ร่าเริง ใจดี พูดจาเป็นกันเอง')

    prompt = f"""คุณคือ AI Prompt Engineer ผู้เชี่ยวชาญสร้าง System Prompt สำหรับ AI Chatbot ภาษาไทย

สร้าง System Prompt สำหรับ chatbot ธุรกิจต่อไปนี้:

ข้อมูลธุรกิจ:
- ชื่อบริษัท: {bot_data.get('company_name', '')}
- ประเภทธุรกิจ: {bot_data.get('business_type', '')}
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

ส่ง System Prompt เท่านั้น ไม่ต้องอธิบายเพิ่มเติม"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text


def _fallback_system_prompt(bot_data: dict) -> str:
    """Fallback prompt if Claude API is not configured."""
    lang = bot_data.get('response_language', 'ไทย')
    bot_name = bot_data.get('bot_name', 'น้องบอท')
    company = bot_data.get('company_name', 'บริษัท')
    personality = bot_data.get('bot_personality', 'ร่าเริง ใจดี')

    return f"""คุณคือ {bot_name} แอดมินอายุ 25 ปี {personality} ทำงานที่ {company}

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
