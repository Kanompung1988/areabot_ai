"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Save, Loader2, Copy, Check, ExternalLink,
  Globe, CheckCircle2, XCircle, Wifi, WifiOff, ChevronDown,
  ChevronUp, AlertCircle, Zap, Code2,
} from "lucide-react";
import toast from "react-hot-toast";
import { botsApi, Bot } from "@/lib/api";

/* ─── helpers ──────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
      title="คัดลอก"
    >
      {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
    </button>
  );
}

function WebhookBox({ url }: { url: string }) {
  return (
    <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
      <p className="text-[10px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Webhook URL</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs text-emerald-400 break-all font-mono">{url}</code>
        <CopyBtn text={url} />
      </div>
    </div>
  );
}

type TestState = "idle" | "loading" | "success" | "error";

function TestBtn({
  state, onClick, label,
}: { state: TestState; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={state === "loading"}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
        state === "success"
          ? "bg-green-50 border-green-200 text-green-700"
          : state === "error"
          ? "bg-red-50 border-red-200 text-red-600"
          : "bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
      }`}
    >
      {state === "loading" ? (
        <Loader2 size={12} className="animate-spin" />
      ) : state === "success" ? (
        <CheckCircle2 size={12} />
      ) : state === "error" ? (
        <XCircle size={12} />
      ) : (
        <Wifi size={12} />
      )}
      {state === "success" ? "เชื่อมต่อสำเร็จ" : state === "error" ? "เชื่อมต่อไม่ได้" : label}
    </button>
  );
}

type StepProps = { num: number; title: string; children: React.ReactNode };
function Step({ num, title, children }: StepProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
        {num}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 mb-1">{title}</p>
        <div className="text-xs text-gray-500 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

type PlatformCardProps = {
  badge: string;
  badgeClass: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  connected: boolean;
  docsUrl: string;
  testState: TestState;
  onTest: () => void;
  testLabel: string;
  children: React.ReactNode;
  steps: React.ReactNode;
};

function PlatformCard({
  badge, badgeClass, icon, title, subtitle, connected,
  docsUrl, testState, onTest, testLabel, children, steps,
}: PlatformCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all ${
      connected ? "border-green-200 shadow-sm shadow-green-50" : "border-gray-200"
    }`}>
      {/* Header */}
      <div className="p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${badgeClass}`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
              {connected ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full">
                  <CheckCircle2 size={9} /> เชื่อมต่อแล้ว
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full">
                  <WifiOff size={9} /> ยังไม่ได้ตั้งค่า
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {connected && <TestBtn state={testState} onClick={onTest} label={testLabel} />}
          <a href={docsUrl} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="คู่มือ"
          >
            <ExternalLink size={14} />
          </a>
          <button onClick={() => setOpen(!open)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expandable body */}
      {(open || !connected) && (
        <div className="border-t border-gray-100 p-5 space-y-5">
          {/* Steps guide */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={11} /> วิธีเชื่อมต่อ
            </p>
            <div className="space-y-3">{steps}</div>
          </div>

          {/* Fields */}
          <div className="space-y-4">{children}</div>

          {/* Test button (always show) */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">กดทดสอบเพื่อตรวจสอบการเชื่อมต่อ (บันทึกอัตโนมัติ)</p>
            <TestBtn state={testState} onClick={onTest} label={testLabel} />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

/* ─── main page ─────────────────────────────────────────── */
export default function ChannelsPage() {
  const { id } = useParams<{ id: string }>();
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testLine, setTestLine] = useState<TestState>("idle");
  const [testFb, setTestFb] = useState<TestState>("idle");
  const [testIg, setTestIg] = useState<TestState>("idle");

  const [data, setData] = useState({
    line_channel_secret: "",
    line_channel_access_token: "",
    fb_page_token: "",
    fb_verify_token: "",
    fb_app_secret: "",
    instagram_access_token: "",
    instagram_verify_token: "",
  });

  const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").trim();

  useEffect(() => {
    botsApi.get(id).then((r) => {
      setBot(r.data);
      setData({
        line_channel_secret: r.data.line_channel_secret || "",
        line_channel_access_token: r.data.line_channel_access_token || "",
        fb_page_token: r.data.fb_page_token || "",
        fb_verify_token: r.data.fb_verify_token || "",
        fb_app_secret: r.data.fb_app_secret || "",
        instagram_access_token: r.data.instagram_access_token || "",
        instagram_verify_token: r.data.instagram_verify_token || "",
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const upd = (k: keyof typeof data, v: string) => setData((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await botsApi.update(id, data);
      toast.success("บันทึกการตั้งค่าแล้ว");
    } catch {
      toast.error("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const runTest = async (
    fn: () => Promise<any>,
    set: (s: TestState) => void,
    successMsg: (r: any) => string,
  ) => {
    // Auto-save before testing
    setSaving(true);
    try {
      await botsApi.update(id, data);
    } catch {
      toast.error("บันทึกไม่สำเร็จ ไม่สามารถทดสอบได้");
      setSaving(false);
      return;
    } finally {
      setSaving(false);
    }
    set("loading");
    try {
      const r = await fn();
      set("success");
      toast.success(successMsg(r.data));
    } catch (e: any) {
      set("error");
      toast.error(e.response?.data?.detail || "เชื่อมต่อไม่ได้ ตรวจสอบ Token อีกครั้ง");
    }
    setTimeout(() => set("idle"), 5000);
  };

  const lineConnected = !!(data.line_channel_secret && data.line_channel_access_token);
  const fbConnected = !!(data.fb_page_token && data.fb_verify_token);
  const igConnected = !!(data.instagram_access_token && data.instagram_verify_token);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
      </div>
    );
  }

  if (!bot) return <div className="text-center py-20 text-gray-500">ไม่พบ Bot</div>;

  const platforms = [
    { label: "LINE", connected: lineConnected },
    { label: "Facebook", connected: fbConnected },
    { label: "Instagram", connected: igConnected },
    { label: "Widget", connected: true },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/bots/${id}`} className="text-gray-400 hover:text-gray-900 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">เชื่อมต่อช่องทาง</h1>
            <p className="text-gray-400 text-sm">{bot.bot_name} · {bot.company_name}</p>
          </div>
        </div>
        <button onClick={save} disabled={saving}
          className="btn btn-black text-sm flex items-center gap-2 py-2 px-5"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          บันทึก
        </button>
      </div>

      {/* Status bar */}
      <div className="grid grid-cols-4 gap-2">
        {platforms.map(({ label, connected }) => (
          <div key={label} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium ${
            connected ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-400"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-gray-300"}`} />
            <span className="flex-1">{label}</span>
            {connected && <CheckCircle2 size={11} className="text-green-500" />}
          </div>
        ))}
      </div>

      {/* ── LINE ─────────────────────────────────────── */}
      <PlatformCard
        badge="LINE" badgeClass="bg-green-50 text-green-600"
        icon={<span className="text-lg font-black text-green-600">L</span>}
        title="LINE Official Account"
        subtitle="รับ-ส่งข้อความผ่าน LINE Messaging API"
        connected={lineConnected}
        docsUrl="https://developers.line.biz/console/"
        testState={testLine}
        testLabel="ทดสอบ LINE"
        onTest={() => runTest(() => botsApi.testLine(id), setTestLine, (r) => `✓ ${r.bot_name}`)}
        steps={
          <>
            <Step num={1} title="เปิด LINE Developers Console">
              ไปที่{" "}
              <a href="https://developers.line.biz/console/" target="_blank" className="text-blue-600 underline font-medium">
                developers.line.biz/console
              </a>{" "}
              → Login ด้วย LINE Account → เลือก Provider → สร้าง Messaging API Channel
            </Step>
            <Step num={2} title="เปิดใช้งาน Webhook">
              ใน Channel ที่สร้าง → ไปที่ <strong>Messaging API</strong> → เปิด{" "}
              <strong>"Use webhooks"</strong> → วาง Webhook URL ด้านล่างแล้วกด Verify
            </Step>
            <Step num={3} title="Copy Credentials">
              <ul className="space-y-1 mt-1">
                <li>• <strong>Channel Secret</strong> → tab Basic Settings → Channel secret</li>
                <li>• <strong>Channel Access Token</strong> → tab Messaging API → กด Issue (Long-lived)</li>
              </ul>
            </Step>
          </>
        }
      >
        <WebhookBox url={`${backendUrl}/webhook/line/${id}`} />
        <Field label="Channel Secret" hint="Basic Settings → Channel secret">
          <input className="input font-mono text-sm" value={data.line_channel_secret}
            onChange={(e) => upd("line_channel_secret", e.target.value)} placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
        </Field>
        <Field label="Channel Access Token" hint="Messaging API → Channel access token (long-lived) → Issue">
          <textarea className="input h-20 resize-none font-mono text-sm" value={data.line_channel_access_token}
            onChange={(e) => upd("line_channel_access_token", e.target.value)} placeholder="eyJhbGci..." />
        </Field>
      </PlatformCard>

      {/* ── Facebook ─────────────────────────────────── */}
      <PlatformCard
        badge="FB" badgeClass="bg-blue-50 text-blue-600"
        icon={<span className="text-lg font-black text-blue-600">f</span>}
        title="Facebook Messenger"
        subtitle="รับ-ส่งข้อความผ่าน Facebook Page"
        connected={fbConnected}
        docsUrl="https://developers.facebook.com/"
        testState={testFb}
        testLabel="ทดสอบ Facebook"
        onTest={() => runTest(() => botsApi.testFacebook(id), setTestFb, (r) => `✓ Page: ${r.page_name}`)}
        steps={
          <>
            <Step num={1} title="สร้าง Meta App">
              ไปที่{" "}
              <a href="https://developers.facebook.com/apps/" target="_blank" className="text-blue-600 underline font-medium">
                developers.facebook.com/apps
              </a>{" "}
              → Create App → เลือก "Business" → ตั้งชื่อ App
            </Step>
            <Step num={2} title="เพิ่ม Messenger Product">
              ใน App Dashboard → Add Product → เลือก <strong>Messenger</strong> → Setup
            </Step>
            <Step num={3} title="ตั้งค่า Webhook">
              Messenger Settings → Webhooks → Add Callback URL → วาง Webhook URL ด้านล่าง + ใส่ Verify Token ที่ตั้งเอง →
              Subscribe: <code className="bg-gray-100 px-1 rounded">messages</code>,{" "}
              <code className="bg-gray-100 px-1 rounded">messaging_postbacks</code>
            </Step>
            <Step num={4} title="Copy Credentials">
              <ul className="space-y-1 mt-1">
                <li>• <strong>Page Access Token</strong> → Messenger Settings → แต่ละ Page → Generate Token</li>
                <li>• <strong>Verify Token</strong> → ตั้งเองได้ เช่น <code className="bg-gray-100 px-1 rounded">tobtan_verify_2026</code></li>
                <li>• <strong>App Secret</strong> → App Settings → Basic → App Secret</li>
              </ul>
            </Step>
          </>
        }
      >
        <WebhookBox url={`${backendUrl}/webhook/facebook/${id}`} />
        <Field label="Page Access Token" hint="Messenger Settings → เลือก Page → Generate Token">
          <textarea className="input h-20 resize-none font-mono text-sm" value={data.fb_page_token}
            onChange={(e) => upd("fb_page_token", e.target.value)} placeholder="EAAxxxx..." />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Verify Token" hint="ตั้งเองได้ — ใส่ค่าเดียวกันใน Meta">
            <input className="input font-mono text-sm" value={data.fb_verify_token}
              onChange={(e) => upd("fb_verify_token", e.target.value)} placeholder="tobtan_verify" />
          </Field>
          <Field label="App Secret" hint="App Settings → Basic → App Secret">
            <input className="input font-mono text-sm" value={data.fb_app_secret}
              onChange={(e) => upd("fb_app_secret", e.target.value)} placeholder="App Secret" />
          </Field>
        </div>
      </PlatformCard>

      {/* ── Instagram ────────────────────────────────── */}
      <PlatformCard
        badge="IG" badgeClass="bg-pink-50 text-pink-500"
        icon={<span className="text-lg font-black text-pink-500">IG</span>}
        title="Instagram DM"
        subtitle="รับ-ส่ง Direct Message ผ่าน Instagram Business"
        connected={igConnected}
        docsUrl="https://developers.facebook.com/docs/messenger-platform/instagram"
        testState={testIg}
        testLabel="ทดสอบ Instagram"
        onTest={() => runTest(() => botsApi.testInstagram(id), setTestIg, (r) => `✓ ${r.account_name}`)}
        steps={
          <>
            <Step num={1} title="เตรียม Instagram Business Account">
              ต้องมี <strong>Instagram Professional Account</strong> และเชื่อมกับ Facebook Page แล้ว
              (Settings → Account → Switch to Professional Account)
            </Step>
            <Step num={2} title="เพิ่ม Instagram ใน Meta App">
              ใน Meta App เดิม → Add Product → <strong>Instagram</strong> Messaging Platform →
              เชื่อม Instagram Account กับ App
            </Step>
            <Step num={3} title="ตั้งค่า Webhook">
              Webhooks → Instagram → Subscribe → วาง Webhook URL ด้านล่าง + Verify Token →
              Subscribe: <code className="bg-gray-100 px-1 rounded">messages</code>
            </Step>
            <Step num={4} title="Copy Token">
              <ul className="space-y-1 mt-1">
                <li>• <strong>Access Token</strong> → Instagram Messaging Platform → Access Tokens → Generate</li>
                <li>• <strong>Verify Token</strong> → ตั้งเองได้ เช่น <code className="bg-gray-100 px-1 rounded">tobtan_ig_2026</code></li>
              </ul>
            </Step>
            <div className="flex gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-[11px]">
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
              ต้องมี App Secret (จาก Facebook App) เพื่อ verify Instagram webhook ด้วย — ใส่ใน Facebook card ด้านบน
            </div>
          </>
        }
      >
        <WebhookBox url={`${backendUrl}/webhook/instagram/${id}`} />
        <Field label="Instagram Access Token" hint="Instagram Messaging Platform → Access Tokens → Generate">
          <textarea className="input h-20 resize-none font-mono text-sm" value={data.instagram_access_token}
            onChange={(e) => upd("instagram_access_token", e.target.value)} placeholder="EAAxxxx..." />
        </Field>
        <Field label="Verify Token" hint="ค่าเดียวกันกับที่ใส่ใน Meta Webhook setup">
          <input className="input font-mono text-sm" value={data.instagram_verify_token}
            onChange={(e) => upd("instagram_verify_token", e.target.value)} placeholder="tobtan_ig_verify" />
        </Field>
      </PlatformCard>

      {/* ── Website Widget ───────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Globe size={18} className="text-violet-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm">Website Chat Widget</h3>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-full">
                  <CheckCircle2 size={9} /> พร้อมใช้งาน
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">ฝัง Chatbot บนเว็บไซต์ของคุณ</p>
            </div>
          </div>
          <Code2 size={16} className="text-gray-300" />
        </div>
        <div className="border-t border-gray-100 p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={11} /> วิธีติดตั้ง
            </p>
            <Step num={1} title="Copy Embed Code ด้านล่าง">
              วาง <code className="bg-gray-100 px-1 rounded">&lt;script&gt;</code> ก่อน <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> ของทุกหน้าในเว็บไซต์
            </Step>
            <Step num={2} title="Chatbot พร้อมใช้งานทันที">
              จะมีปุ่มแชทลอยมุมขวาล่างของเว็บ — ใช้ได้ทุก framework (React, Vue, WordPress ฯลฯ)
            </Step>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Embed Code</p>
            <div className="relative">
              <pre className="bg-gray-950 text-emerald-400 text-xs p-4 pr-10 rounded-xl overflow-x-auto font-mono leading-relaxed">
                {`<script src="${backendUrl}/widget/embed.js?bot_id=${id}"></script>`}
              </pre>
              <div className="absolute top-2.5 right-2.5">
                <CopyBtn text={`<script src="${backendUrl}/widget/embed.js?bot_id=${id}"></script>`} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Chat Page URL (standalone)</p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
              <code className="flex-1 text-xs text-gray-700 break-all">
                {backendUrl}/widget/chat?bot_id={id}
              </code>
              <CopyBtn text={`${backendUrl}/widget/chat?bot_id=${id}`} />
              <a href={`${backendUrl}/widget/chat?bot_id=${id}`} target="_blank" rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-700 transition-colors">
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom save */}
      <div className="flex justify-end pb-8">
        <button onClick={save} disabled={saving}
          className="btn btn-black text-sm flex items-center gap-2 py-2.5 px-7"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          บันทึกทั้งหมด
        </button>
      </div>
    </div>
  );
}
