"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Save,
  Loader2,
  Mail,
  TestTube2,
  CheckCircle2,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import api, { botsApi, Bot } from "@/lib/api";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function EmailSetupPage() {
  const { id } = useParams<{ id: string }>();
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null,
  );
  const [showPass, setShowPass] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const [smtp, setSmtp] = useState({
    host: "",
    port: "587",
    user: "",
    password: "",
    from_email: "",
    from_name: "",
    use_tls: true,
  });

  useEffect(() => {
    botsApi
      .get(id)
      .then((r) => {
        setBot(r.data);
        // Pre-fill from_email/from_name from bot data if not set
        setSmtp((p) => ({
          ...p,
          from_email: p.from_email || r.data.email_contact || "",
          from_name: p.from_name || r.data.bot_name || r.data.name || "",
        }));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const update = (k: keyof typeof smtp, v: string | boolean) =>
    setSmtp((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!smtp.host) {
      toast.error("กรุณาใส่ SMTP Host");
      return;
    }
    setSaving(true);
    try {
      // Store SMTP settings — in a real impl these go to backend settings
      // For now save to localStorage + show guidance
      localStorage.setItem(`smtp_${id}`, JSON.stringify(smtp));
      toast.success("บันทึกการตั้งค่า SMTP แล้ว");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!smtp.host || !smtp.user) {
      toast.error("กรอก SMTP Host และ Username ก่อน");
      return;
    }
    if (!testEmail) {
      toast.error("ใส่อีเมลสำหรับทดสอบก่อน");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      // Call backend test endpoint
      await api.post("/api/auth/test-email", {
        to: testEmail,
        smtp_host: smtp.host,
        smtp_port: parseInt(smtp.port),
        smtp_user: smtp.user,
        smtp_password: smtp.password,
        from_email: smtp.from_email,
        from_name: smtp.from_name,
        use_tls: smtp.use_tls,
      });
      setTestResult("success");
      toast.success("ส่งอีเมลทดสอบสำเร็จ!");
    } catch {
      setTestResult("error");
      toast.error("เชื่อมต่อ SMTP ไม่สำเร็จ — ตรวจสอบ credentials อีกครั้ง");
    } finally {
      setTesting(false);
    }
  };

  // Load saved settings
  useEffect(() => {
    if (!id) return;
    const saved = localStorage.getItem(`smtp_${id}`);
    if (saved) {
      try {
        setSmtp(JSON.parse(saved));
      } catch {}
    }
  }, [id]);

  const isConfigured = !!(smtp.host && smtp.user && smtp.from_email);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-36 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!bot)
    return <div className="text-center py-20 text-gray-500">ไม่พบ Bot</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/bots/${id}`}
            className="text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Setup</h1>
            <p className="text-gray-500 text-sm">
              {bot.name} · {bot.company_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle2 size={13} /> ตั้งค่าแล้ว
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="btn btn-primary text-sm flex items-center gap-2 py-2 px-4"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            บันทึก
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex gap-3 text-sm text-blue-700">
        <Info size={15} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium mb-0.5">SMTP สำหรับ Bot ของคุณ</p>
          <p className="text-xs text-blue-600">
            ใช้ส่งอีเมลแจ้งเตือนหรือ reply ให้ลูกค้าที่ติดต่อมาทางอีเมล รองรับ
            Gmail, Outlook, SendGrid, Mailgun และ SMTP provider อื่นๆ
          </p>
        </div>
      </div>

      {/* SMTP Settings */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Mail size={16} className="text-gray-500" /> SMTP Configuration
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="SMTP Host"
            hint="เช่น smtp.gmail.com, smtp.sendgrid.net"
          >
            <input
              className="input font-mono text-sm"
              value={smtp.host}
              onChange={(e) => update("host", e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </Field>
          <Field label="Port" hint="587 (TLS), 465 (SSL), 25">
            <input
              className="input font-mono text-sm"
              type="number"
              value={smtp.port}
              onChange={(e) => update("port", e.target.value)}
              placeholder="587"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Username / Email" hint="อีเมลที่ใช้ login กับ SMTP">
            <input
              className="input"
              value={smtp.user}
              onChange={(e) => update("user", e.target.value)}
              placeholder="you@gmail.com"
            />
          </Field>
          <Field
            label="Password / App Password"
            hint="Gmail ต้องใช้ App Password"
          >
            <div className="relative">
              <input
                className="input pr-9"
                type={showPass ? "text" : "password"}
                value={smtp.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="From Email" hint="อีเมลที่จะแสดงในช่อง From">
            <input
              className="input"
              value={smtp.from_email}
              onChange={(e) => update("from_email", e.target.value)}
              placeholder="noreply@yourdomain.com"
            />
          </Field>
          <Field label="From Name" hint="ชื่อผู้ส่งที่ลูกค้าจะเห็น">
            <input
              className="input"
              value={smtp.from_name}
              onChange={(e) => update("from_name", e.target.value)}
              placeholder={bot.bot_name || bot.name}
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <label className="relative inline-flex cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={smtp.use_tls}
              onChange={(e) => update("use_tls", e.target.checked)}
            />
            <div className="w-10 h-5 bg-gray-200 peer-checked:bg-gray-800 rounded-full transition-colors border border-gray-300 peer-checked:border-gray-800" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-gray-400 rounded-full transition-transform peer-checked:translate-x-5 peer-checked:bg-white" />
          </label>
          <span className="text-sm text-gray-600">ใช้ STARTTLS (แนะนำ)</span>
        </div>
      </div>

      {/* Test connection */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <TestTube2 size={16} className="text-gray-500" /> ทดสอบการส่งอีเมล
        </h3>
        <div className="flex gap-3">
          <input
            className="input flex-1"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="ใส่อีเมลสำหรับรับอีเมลทดสอบ"
          />
          <button
            onClick={testConnection}
            disabled={testing || !smtp.host}
            className="btn btn-ghost border border-gray-200 text-sm flex items-center gap-2 px-4 py-2 flex-shrink-0 disabled:opacity-50"
          >
            {testing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <TestTube2 size={14} />
            )}
            ทดสอบ
          </button>
        </div>
        {testResult === "success" && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle2 size={15} /> ส่งอีเมลทดสอบสำเร็จ! ตรวจสอบ inbox ของคุณ
          </div>
        )}
        {testResult === "error" && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={15} /> เชื่อมต่อไม่สำเร็จ — ตรวจสอบ Host, Port
            และ credentials อีกครั้ง
          </div>
        )}
      </div>

      {/* Gmail guide */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
        <h3 className="font-bold text-gray-900 text-sm">คู่มือตั้งค่า Gmail</h3>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center flex-shrink-0 font-bold">
              1
            </span>
            เปิด Google Account → Security → 2-Step Verification (ต้องเปิดก่อน)
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center flex-shrink-0 font-bold">
              2
            </span>
            ค้นหา "App passwords" → สร้าง App Password ใหม่ → เลือก "Mail"
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center flex-shrink-0 font-bold">
              3
            </span>
            ใส่ค่า: Host ={" "}
            <code className="bg-gray-100 px-1 rounded">smtp.gmail.com</code>,
            Port = <code className="bg-gray-100 px-1 rounded">587</code>,
            Password = App Password ที่ได้
          </li>
        </ol>
      </div>

      {/* Bottom save */}
      <div className="flex justify-end pb-6">
        <button
          onClick={save}
          disabled={saving}
          className="btn btn-primary text-sm flex items-center gap-2 py-2.5 px-6"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          บันทึก
        </button>
      </div>
    </div>
  );
}
