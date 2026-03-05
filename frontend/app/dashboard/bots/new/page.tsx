"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Bot,
  Phone,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { botsApi, BotCreatePayload } from "@/lib/api";

const STEPS = [
  { id: 1, label: "ข้อมูลบริษัท", icon: Building2 },
  { id: 2, label: "สินค้า & บริการ", icon: Bot },
  { id: 3, label: "ช่องทางติดต่อ", icon: Phone },
  { id: 4, label: "ตั้งค่า Bot", icon: MessageSquare },
];

const initialForm: BotCreatePayload = {
  name: "",
  company_name: "",
  business_type: "",
  description: "",
  products_services: "",
  pricing_info: "",
  phone: "",
  email_contact: "",
  website: "",
  address: "",
  facebook_url: "",
  line_id: "",
  instagram_url: "",
  bot_name: "น้องบอท",
  bot_personality: "",
  response_language: "Thai",
  greeting_message: "",
};

export default function NewBotPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BotCreatePayload>(initialForm);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof BotCreatePayload, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await botsApi.create(form);
      toast.success("สร้าง Bot สำเร็จ! Claude กำลังสร้าง System Prompt...");
      router.push(`/dashboard/bots/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (step === 1 && !form.name) return toast.error("กรุณากรอกชื่อ Bot");
    if (step === 1 && !form.company_name)
      return toast.error("กรุณากรอกชื่อบริษัท/แบรนด์");
    setStep((s) => s + 1);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-12">
      {/* Back */}
      <Link
        href="/dashboard/bots"
        className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm mb-8 transition-colors"
      >
        <ChevronLeft size={15} /> กลับ
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-1">
          สร้าง Bot ใหม่
        </h1>
        <p className="text-gray-400 text-sm">
          กรอกข้อมูลบริษัท แล้วให้ Claude AI สร้าง Chatbot ให้คุณ
        </p>
      </div>

      {/* Step indicator */}
      <div className="relative flex items-center justify-between mb-10">
        <div className="absolute inset-x-0 top-4 h-px bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-px bg-gray-900 z-0 transition-all duration-500"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((s) => {
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div
              key={s.id}
              className="relative z-10 flex flex-col items-center gap-2"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  done
                    ? "bg-gray-900 text-white"
                    : active
                      ? "bg-gray-900 text-white ring-4 ring-gray-200"
                      : "bg-white border-2 border-gray-200 text-gray-400"
                }`}
              >
                {done ? "✓" : s.id}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block transition-colors ${
                  active ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Form card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-8 pt-8 pb-6">
          {step === 1 && <Step1 form={form} update={update} />}
          {step === 2 && <Step2 form={form} update={update} />}
          {step === 3 && <Step3 form={form} update={update} />}
          {step === 4 && <Step4 form={form} update={update} />}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <ChevronLeft size={15} /> ย้อนกลับ
          </button>

          {step < 4 ? (
            <button
              onClick={next}
              className="btn btn-black h-9 px-5 text-sm flex items-center gap-1.5"
            >
              ถัดไป <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-black h-9 px-5 text-sm flex items-center gap-1.5 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> กำลังสร้าง...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> สร้าง Bot ด้วย AI
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-6">
      <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
        <Icon size={15} className="text-white" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    </div>
  );
}

function Step1({ form, update }: any) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Building2} title="ข้อมูลบริษัท" />
      <Field label="ชื่อ Bot" required>
        <input
          className="input"
          placeholder="เช่น Bot ร้านกาแฟ"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
      </Field>
      <Field label="ชื่อบริษัท/ร้าน" required>
        <input
          className="input"
          placeholder="เช่น ร้านค้าออนไลน์"
          value={form.company_name}
          onChange={(e) => update("company_name", e.target.value)}
          required
        />
      </Field>
      <Field label="ประเภทธุรกิจ">
        <select
          className="input"
          value={form.business_type}
          onChange={(e) => update("business_type", e.target.value)}
        >
          <option value="">-- เลือกประเภท --</option>
          <option>ร้านอาหาร</option>
          <option>ร้านเสื้อผ้า/แฟชั่น</option>
          <option>ความงาม/สปา</option>
          <option>อสังหาริมทรัพย์</option>
          <option>โรงพยาบาล/คลินิก</option>
          <option>การศึกษา</option>
          <option>ท่องเที่ยว/โรงแรม</option>
          <option>อิเล็กทรอนิกส์</option>
          <option>อื่น ๆ</option>
        </select>
      </Field>
      <Field
        label="รายละเอียดธุรกิจ"
        hint="AI จะนำข้อมูลนี้ไปสร้าง System Prompt ที่เหมาะสม"
      >
        <textarea
          className="input h-28 resize-none"
          placeholder="อธิบายธุรกิจของคุณ เราทำอะไร ขายอะไร..."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </Field>
    </div>
  );
}

function Step2({ form, update }: any) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Bot} title="สินค้า & บริการ" />
      <Field
        label="รายการสินค้า/บริการ"
        hint="ใส่รายการสินค้า พร้อมคำอธิบาย — ยิ่งละเอียด Bot ยิ่งตอบได้แม่นยำ"
      >
        <textarea
          className="input h-36 resize-none font-mono text-sm"
          placeholder={
            "เช่น:\n- กาแฟอาราบิก้า ราคา 60 บาท\n- เค้กโฮมเมด 150 บาท\n- ชาไทย 50 บาท"
          }
          value={form.products_services}
          onChange={(e) => update("products_services", e.target.value)}
        />
      </Field>
      <Field label="ข้อมูลราคา/โปรโมชัน">
        <textarea
          className="input h-24 resize-none"
          placeholder="เช่น: โปรซื้อ 3 แถม 1, ส่งฟรีเมื่อซื้อครบ 500 บาท..."
          value={form.pricing_info}
          onChange={(e) => update("pricing_info", e.target.value)}
        />
      </Field>
    </div>
  );
}

function Step3({ form, update }: any) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Phone} title="ช่องทางติดต่อ" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="เบอร์โทรศัพท์">
          <input
            className="input"
            placeholder="0812345678"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </Field>
        <Field label="อีเมล">
          <input
            className="input"
            placeholder="shop@example.com"
            value={form.email_contact}
            onChange={(e) => update("email_contact", e.target.value)}
          />
        </Field>
      </div>
      <Field label="เว็บไซต์">
        <input
          className="input"
          placeholder="https://yourshop.com"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </Field>
      <Field label="ที่อยู่">
        <textarea
          className="input h-20 resize-none"
          placeholder="ที่อยู่ร้าน..."
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Facebook">
          <input
            className="input"
            placeholder="facebook.com/..."
            value={form.facebook_url}
            onChange={(e) => update("facebook_url", e.target.value)}
          />
        </Field>
        <Field label="LINE ID">
          <input
            className="input"
            placeholder="@yourline"
            value={form.line_id}
            onChange={(e) => update("line_id", e.target.value)}
          />
        </Field>
        <Field label="Instagram">
          <input
            className="input"
            placeholder="@yourinsta"
            value={form.instagram_url}
            onChange={(e) => update("instagram_url", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function Step4({ form, update }: any) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={MessageSquare} title="ตั้งค่า Bot" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="ชื่อ Bot">
          <input
            className="input"
            placeholder="น้องบอท"
            value={form.bot_name}
            onChange={(e) => update("bot_name", e.target.value)}
          />
        </Field>
        <Field label="ภาษาที่ตอบ">
          <select
            className="input"
            value={form.response_language}
            onChange={(e) => update("response_language", e.target.value)}
          >
            <option value="Thai">ภาษาไทย</option>
            <option value="English">English</option>
            <option value="Thai and English">ไทย + อังกฤษ</option>
          </select>
        </Field>
      </div>
      <Field label="บุคลิก Bot" hint="อธิบายว่าต้องการให้ bot มีบุคลิกแบบไหน">
        <input
          className="input"
          placeholder="เช่น: เป็นมิตร สุภาพ ตอบสั้นกระชับ ใช้อีโมจิบ้าง"
          value={form.bot_personality}
          onChange={(e) => update("bot_personality", e.target.value)}
        />
      </Field>
      <Field label="ข้อความทักทาย">
        <textarea
          className="input h-24 resize-none"
          placeholder="เช่น: สวัสดีค่ะ! ยินดีต้อนรับสู่ร้านของเรา มีอะไรให้ช่วยไหมคะ?"
          value={form.greeting_message}
          onChange={(e) => update("greeting_message", e.target.value)}
        />
      </Field>
      <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
        <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
          <Sparkles size={13} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-0.5">
            Claude AI จะสร้าง System Prompt ให้อัตโนมัติ
          </p>
          <p className="text-xs text-gray-400">
            จากข้อมูลทั้งหมดที่คุณกรอก AI จะสร้าง Prompt
            ที่ปรับแต่งเฉพาะสำหรับธุรกิจของคุณ
          </p>
        </div>
      </div>
    </div>
  );
}
