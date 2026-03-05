import Link from "next/link";
import TobTanIcon from "@/components/TobTanIcon";

export default function TermsPage() {
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
              ข้อกำหนดในการให้บริการ
            </h1>
            <p className="text-gray-400 text-sm">อัปเดตล่าสุด: 5 มีนาคม 2569</p>
          </div>

          <Section title="1. การยอมรับข้อกำหนด">
            การใช้งานแพลตฟอร์ม tobtan
            ถือว่าคุณได้อ่านและยอมรับข้อกำหนดในการให้บริการฉบับนี้ทุกประการ
            หากคุณไม่ยอมรับ กรุณาหยุดใช้งานบริการทันที
          </Section>

          <Section title="2. บริการที่ให้">
            tobtan ให้บริการแพลตฟอร์มสร้าง AI Chatbot สำหรับธุรกิจ
            โดยรองรับการเชื่อมต่อกับ LINE, Facebook Messenger, Instagram และ Web
            Widget เพื่อช่วยตอบคำถามลูกค้าแบบอัตโนมัติ
          </Section>

          <Section title="3. บัญชีผู้ใช้">
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>คุณต้องให้ข้อมูลที่ถูกต้องและเป็นปัจจุบันในการลงทะเบียน</li>
              <li>คุณรับผิดชอบในการรักษาความปลอดภัยของรหัสผ่าน</li>
              <li>ห้ามแชร์บัญชีหรือโอนบัญชีให้บุคคลอื่น</li>
              <li>เราสงวนสิทธิ์ระงับบัญชีที่ละเมิดข้อกำหนด</li>
            </ul>
          </Section>

          <Section title="4. การใช้งานที่ยอมรับได้">
            ห้ามใช้บริการเพื่อ: ส่งสแปม, เผยแพร่เนื้อหาที่ผิดกฎหมาย,
            หลอกลวงผู้ใช้งาน, โจมตีระบบ หรือกระทำการใดที่ละเมิดกฎหมายไทยหรือสากล
          </Section>

          <Section title="5. ทรัพย์สินทางปัญญา">
            เนื้อหาทั้งหมดบนแพลตฟอร์ม tobtan รวมถึงโลโก้, ซอฟต์แวร์ และ UI
            เป็นทรัพย์สินของ tobtan และได้รับการคุ้มครองโดยกฎหมายลิขสิทธิ์
          </Section>

          <Section title="6. ข้อจำกัดความรับผิด">
            tobtan ให้บริการ &ldquo;ตามสภาพ&rdquo;
            โดยไม่รับประกันความพร้อมใช้งานตลอด 24 ชั่วโมง
            และไม่รับผิดชอบต่อความเสียหายที่เกิดจากการหยุดทำงานของบริการ
          </Section>

          <Section title="7. การเปลี่ยนแปลงข้อกำหนด">
            เราอาจปรับปรุงข้อกำหนดนี้ได้ตลอดเวลา
            การแจ้งเตือนจะส่งผ่านทางอีเมลหรือประกาศบนแพลตฟอร์ม
            การใช้งานต่อเนื่องถือว่ายอมรับข้อกำหนดที่เปลี่ยนแปลง
          </Section>

          <Section title="8. ติดต่อเรา">
            หากมีข้อสงสัยเกี่ยวกับข้อกำหนด กรุณาติดต่อ{" "}
            <a
              href="mailto:support@tobtan.com"
              className="text-blue-500 hover:underline"
            >
              support@tobtan.com
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
