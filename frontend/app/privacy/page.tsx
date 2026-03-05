import Link from "next/link";
import TobTanIcon from "@/components/TobTanIcon";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <TobTanIcon size={14} invert />
            </div>
            <span className="font-black text-gray-900">tobtan</span>
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">
              นโยบายความเป็นส่วนตัว
            </h1>
            <p className="text-gray-400 text-sm">อัปเดตล่าสุด: 5 มีนาคม 2569</p>
          </div>

          <Section title="1. ข้อมูลที่เราเก็บรวบรวม">
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>
                <strong>ข้อมูลบัญชี:</strong> ชื่อ, อีเมล, รหัสผ่าน (เข้ารหัส)
              </li>
              <li>
                <strong>ข้อมูลการใช้งาน:</strong> บทสนทนา, สถิติ Bot, การตั้งค่า
              </li>
              <li>
                <strong>ข้อมูลทางเทคนิค:</strong> IP address, ประเภทเบราว์เซอร์,
                เวลาเข้าใช้งาน
              </li>
            </ul>
          </Section>

          <Section title="2. วัตถุประสงค์การใช้ข้อมูล">
            เราใช้ข้อมูลของคุณเพื่อ: ให้บริการแพลตฟอร์ม tobtan,
            ปรับปรุงประสิทธิภาพระบบ, ส่งการแจ้งเตือนที่จำเป็น
            และป้องกันการใช้งานที่ไม่เหมาะสม
          </Section>

          <Section title="3. การแชร์ข้อมูล">
            เราไม่ขายหรือให้เช่าข้อมูลส่วนตัวของคุณแก่บุคคลที่สาม ยกเว้นในกรณี:
            <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2">
              <li>ได้รับความยินยอมจากคุณ</li>
              <li>จำเป็นตามกฎหมายหรือคำสั่งศาล</li>
              <li>ให้กับผู้ให้บริการที่ผูกพันด้วยสัญญาการรักษาความลับ</li>
            </ul>
          </Section>

          <Section title="4. บริการ AI และ Third-Party">
            tobtan ใช้ Claude API (Anthropic) และ OpenAI API
            เพื่อประมวลผลบทสนทนา ข้อมูลจะถูกส่งไปยัง API
            เหล่านี้ตามนโยบายความเป็นส่วนตัวของแต่ละผู้ให้บริการ
          </Section>

          <Section title="5. ความปลอดภัย">
            เราใช้มาตรการรักษาความปลอดภัยมาตรฐานอุตสาหกรรม ได้แก่ HTTPS,
            การเข้ารหัส AES-256 สำหรับข้อมูลสำคัญ และ JWT สำหรับการยืนยันตัวตน
          </Section>

          <Section title="6. การเก็บรักษาข้อมูล">
            เราเก็บข้อมูลตลอดอายุบัญชี เมื่อลบบัญชี ข้อมูลจะถูกลบภายใน 30 วัน
            ยกเว้นข้อมูลที่จำเป็นต้องเก็บตามกฎหมาย
          </Section>

          <Section title="7. สิทธิ์ของคุณ">
            คุณมีสิทธิ์: เข้าถึงข้อมูลของตนเอง, แก้ไขข้อมูล, ขอลบข้อมูล และ
            ขอสำเนาข้อมูลในรูปแบบที่อ่านได้ โดยติดต่อผ่านทางอีเมล
          </Section>

          <Section title="8. คุกกี้">
            เราใช้คุกกี้เพื่อจัดการ Session การเข้าสู่ระบบเท่านั้น
            ไม่มีการติดตามพฤติกรรมหรือ ส่งข้อมูลให้บุคคลที่สามผ่านคุกกี้
          </Section>

          <Section title="9. ติดต่อเรา">
            หากต้องการใช้สิทธิ์หรือมีข้อสงสัย กรุณาติดต่อ{" "}
            <a
              href="mailto:privacy@tobtan.com"
              className="text-blue-500 hover:underline"
            >
              privacy@tobtan.com
            </a>
          </Section>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← กลับสู่หน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
      <div className="text-gray-600 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
