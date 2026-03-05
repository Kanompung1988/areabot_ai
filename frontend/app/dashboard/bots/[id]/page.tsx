"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  Key,
  Copy,
  Check,
  RefreshCw,
  Save,
  Sparkles,
  ChevronLeft,
  MessageSquare,
  Settings,
  Eye,
  EyeOff,
  Loader2,
  BarChart3,
  BookOpen,
  Megaphone,
  Share2,
  Mail,
  Radio,
} from "lucide-react";
import toast from "react-hot-toast";
import { botsApi, Bot as BotType } from "@/lib/api";

export default function BotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [bot, setBot] = useState<BotType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState(false);
  const [regenKey, setRegenKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [tab, setTab] = useState<"settings" | "integration" | "prompt">(
    "settings",
  );

  const [editData, setEditData] = useState<Partial<BotType>>({});

  // Track unsaved changes
  const hasChanges =
    bot !== null && JSON.stringify(editData) !== JSON.stringify(bot);

  useEffect(() => {
    botsApi
      .get(id)
      .then((r) => {
        setBot(r.data);
        setEditData(r.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const update = (k: string, v: string | boolean) =>
    setEditData((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await botsApi.update(id, editData);
      setBot(res.data);
      toast.success("บันทึกแล้ว");
    } catch {
      toast.error("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenPrompt = async () => {
    setRegenPrompt(true);
    try {
      const res = await botsApi.regeneratePrompt(id);
      setBot(res.data);
      setEditData(res.data);
      toast.success("สร้าง System Prompt ใหม่แล้ว!");
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setRegenPrompt(false);
    }
  };

  const handleRegenKey = async () => {
    if (!confirm("สร้าง API Key ใหม่? Key เดิมจะหยุดทำงานทันที")) return;
    setRegenKey(true);
    try {
      const res = await botsApi.regenerateKey(id);
      setBot(res.data);
      setEditData(res.data);
      toast.success("API Key ใหม่พร้อมแล้ว");
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setRegenKey(false);
    }
  };

  const copyKey = () => {
    if (!bot) return;
    navigator.clipboard.writeText(bot.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("คัดลอก API Key แล้ว");
  };

  if (loading) return <LoadingState />;
  if (!bot)
    return <div className="text-center py-20 text-gray-500">ไม่พบ Bot</div>;

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/bots"
            className="text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{bot.name}</h1>
              <span
                className={`badge ${bot.is_active ? "badge-success" : "badge-warning"}`}
              >
                {bot.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-gray-500 text-sm">{bot.company_name}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/bots/${id}/analytics`}
            className="btn btn-ghost text-sm flex items-center gap-2 py-2 px-3"
          >
            <BarChart3 size={15} /> Analytics
          </Link>
          <Link
            href={`/dashboard/bots/${id}/knowledge`}
            className="btn btn-ghost text-sm flex items-center gap-2 py-2 px-3"
          >
            <BookOpen size={15} /> Knowledge
          </Link>
          <Link
            href={`/dashboard/bots/${id}/channels`}
            className="btn btn-ghost text-sm flex items-center gap-2 py-2 px-3"
          >
            <Radio size={15} /> Channels
          </Link>{" "}
          <Link
            href={`/dashboard/bots/${id}/channels`}
            className="btn btn-ghost text-sm flex items-center gap-2 py-2 px-3"
          >
            <Share2 size={15} /> Channels
          </Link>
          <Link
            href={`/dashboard/bots/${id}/email`}
            className="btn btn-ghost text-sm flex items-center gap-2 py-2 px-3"
          >
            <Mail size={15} /> Email
          </Link>{" "}
          <Link
            href={`/dashboard/bots/${id}/email`}
            className="btn btn-ghost text-sm flex items-center gap-2 py-2 px-3"
          >
            <Mail size={15} /> Email
          </Link>
          <Link
            href={`/dashboard/bots/${id}/broadcast`}
            className="btn btn-ghost text-sm flex items-center gap-2 py-2 px-3"
          >
            <Megaphone size={15} /> Broadcast
          </Link>
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
            {hasChanges && !saving && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* API Key Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2 text-gray-900">
            <Key size={16} className="text-gray-600" /> API Key
          </h3>
          <button
            onClick={handleRegenKey}
            disabled={regenKey}
            className="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors"
          >
            {regenKey ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            สร้างใหม่
          </button>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-mono text-gray-900 truncate">
            {bot.api_key}
          </code>
          <button
            onClick={copyKey}
            className="p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex-shrink-0 transition-all"
          >
            {copied ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Copy size={16} className="text-gray-400" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          ใช้ key นี้เป็น OpenAI API Key: endpoint →{" "}
          <code className="text-gray-700">
            {backendUrl}/v1/chat/completions
          </code>
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Messages" value={bot.total_messages} />
        <StatCard label="Conversations" value={bot.total_conversations} />
        <StatCard label="Language" value={bot.response_language} />
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
          {(["settings", "integration", "prompt"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "settings"
                ? "ตั้งค่า"
                : t === "integration"
                  ? "Integration"
                  : "System Prompt"}
            </button>
          ))}
        </div>

        {tab === "settings" && <SettingsTab data={editData} update={update} />}
        {tab === "integration" && (
          <IntegrationTab
            data={editData}
            update={update}
            botId={bot.id}
            backendUrl={backendUrl}
          />
        )}
        {tab === "prompt" && (
          <PromptTab
            bot={bot}
            showPrompt={showPrompt}
            setShowPrompt={setShowPrompt}
            onRegen={handleRegenPrompt}
            regenPrompt={regenPrompt}
          />
        )}
      </div>

      {/* Sticky save bar — appears when there are unsaved changes */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-amber-200 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span className="text-sm text-amber-700 font-medium">
              มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditData(bot)}
                className="px-3 py-1.5 rounded-xl text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-3 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-700 transition-colors flex items-center gap-1.5 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Save size={12} />
                )}
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-gray-300 hover:shadow-sm transition-all">
      <p className="text-2xl font-bold text-gray-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
    </div>
  );
}

function SettingsTab({ data, update }: { data: any; update: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="ชื่อ Bot">
          <input
            className="input"
            value={data.name || ""}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field label="ชื่อบริษัท">
          <input
            className="input"
            value={data.company_name || ""}
            onChange={(e) => update("company_name", e.target.value)}
          />
        </Field>
      </div>
      <Field label="คำอธิบายธุรกิจ">
        <textarea
          className="input h-24 resize-none"
          value={data.description || ""}
          onChange={(e) => update("description", e.target.value)}
        />
      </Field>
      <Field label="สินค้า/บริการ">
        <textarea
          className="input h-28 resize-none"
          value={data.products_services || ""}
          onChange={(e) => update("products_services", e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="ชื่อ Assistant">
          <input
            className="input"
            value={data.bot_name || ""}
            onChange={(e) => update("bot_name", e.target.value)}
          />
        </Field>
        <Field label="ภาษา">
          <select
            className="input"
            value={data.response_language || "Thai"}
            onChange={(e) => update("response_language", e.target.value)}
          >
            <option value="Thai">ภาษาไทย</option>
            <option value="English">English</option>
            <option value="Thai and English">ไทย + อังกฤษ</option>
          </select>
        </Field>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <label className="relative inline-flex cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={data.is_active ?? true}
            onChange={(e) => update("is_active", e.target.checked)}
          />
          <div className="w-10 h-5 bg-gray-200 peer-checked:bg-gray-800 rounded-full transition-colors border border-gray-300 peer-checked:border-gray-800" />
          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-gray-400 rounded-full transition-transform peer-checked:translate-x-5 peer-checked:bg-white" />
        </label>
        <span className="text-sm text-gray-500">
          {data.is_active ? "Bot Active" : "Bot Inactive"}
        </span>
      </div>
    </div>
  );
}

function IntegrationTab({ data, update, botId, backendUrl }: any) {
  return (
    <div className="space-y-5">
      {/* LINE */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2 text-gray-900">
          <span className="px-2 py-0.5 rounded bg-green-50 text-green-600 text-xs font-bold border border-green-200">
            LINE
          </span>
          LINE Bot Integration
        </h3>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500">
          <p className="font-medium text-gray-700 mb-1">Webhook URL:</p>
          <code className="text-gray-900 break-all">
            {backendUrl}/webhook/line/{botId}
          </code>
        </div>
        <Field label="Channel Secret">
          <input
            className="input font-mono text-sm"
            value={data.line_channel_secret || ""}
            onChange={(e) => update("line_channel_secret", e.target.value)}
            placeholder="จาก LINE Developers Console"
          />
        </Field>
        <Field label="Channel Access Token">
          <textarea
            className="input h-20 resize-none font-mono text-sm"
            value={data.line_channel_access_token || ""}
            onChange={(e) =>
              update("line_channel_access_token", e.target.value)
            }
            placeholder="จาก LINE Developers Console"
          />
        </Field>
      </div>

      {/* Facebook */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2 text-gray-900">
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs font-bold border border-blue-200">
            FB
          </span>
          Facebook Messenger Integration
        </h3>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500">
          <p className="font-medium text-gray-700 mb-1">Webhook URL:</p>
          <code className="text-gray-900 break-all">
            {backendUrl}/webhook/facebook/{botId}
          </code>
        </div>
        <Field label="Page Access Token">
          <textarea
            className="input h-20 resize-none font-mono text-sm"
            value={data.fb_page_token || ""}
            onChange={(e) => update("fb_page_token", e.target.value)}
            placeholder="จาก Meta for Developers"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Verify Token">
            <input
              className="input font-mono text-sm"
              value={data.fb_verify_token || ""}
              onChange={(e) => update("fb_verify_token", e.target.value)}
              placeholder="tobtan"
            />
          </Field>
          <Field label="App Secret">
            <input
              className="input font-mono text-sm"
              value={data.fb_app_secret || ""}
              onChange={(e) => update("fb_app_secret", e.target.value)}
              placeholder="App Secret"
            />
          </Field>
        </div>
      </div>

      {/* Instagram */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2 text-gray-900">
          <span className="px-2 py-0.5 rounded bg-pink-50 text-pink-600 text-xs font-bold border border-pink-200">
            IG
          </span>
          Instagram DM Integration
        </h3>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500">
          <p className="font-medium text-gray-700 mb-1">Webhook URL:</p>
          <code className="text-gray-900 break-all">
            {backendUrl}/webhook/instagram/{botId}
          </code>
          <p className="mt-2 text-gray-400">
            ต้องเชื่อม Instagram Business Account กับ Facebook Page ก่อน
            จึงจะรับ DM ได้
          </p>
        </div>
        <Field label="Instagram Access Token">
          <textarea
            className="input h-20 resize-none font-mono text-sm"
            value={data.instagram_access_token || ""}
            onChange={(e) => update("instagram_access_token", e.target.value)}
            placeholder="จาก Meta for Developers (Instagram Messaging)"
          />
        </Field>
        <Field label="Verify Token">
          <input
            className="input font-mono text-sm"
            value={data.instagram_verify_token || ""}
            onChange={(e) => update("instagram_verify_token", e.target.value)}
            placeholder="tobtan"
          />
        </Field>
      </div>

      {/* OpenAI Compatible */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2 text-gray-900">
          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
            API
          </span>
          OpenAI Compatible Endpoint
        </h3>
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm space-y-2">
          <div className="flex gap-3">
            <span className="text-gray-400 w-28 flex-shrink-0">Base URL:</span>
            <code className="text-gray-900">{backendUrl}</code>
          </div>
          <div className="flex gap-3">
            <span className="text-gray-400 w-28 flex-shrink-0">Endpoint:</span>
            <code className="text-gray-900">/v1/chat/completions</code>
          </div>
          <div className="flex gap-3">
            <span className="text-gray-400 w-28 flex-shrink-0">API Key:</span>
            <code className="text-gray-700 text-xs truncate">
              ใช้ api_key ของ Bot (ab-xxx)
            </code>
          </div>
          <div className="flex gap-3">
            <span className="text-gray-400 w-28 flex-shrink-0">Model:</span>
            <code className="text-gray-700 text-xs">
              {data.model_name || "gpt-4.1-mini"}
            </code>
          </div>
        </div>
        <Field label="OpenAI API Key (per-bot)">
          <input
            className="input font-mono text-sm"
            value={data.openai_api_key || ""}
            onChange={(e) => update("openai_api_key", e.target.value)}
            placeholder="sk-... (ถ้าไม่ใส่จะใช้ Global key จาก .env)"
          />
          <p className="text-xs text-gray-400 mt-1">
            ใส่ key ของลูกค้าเพื่อ track cost แยกต่อ bot
          </p>
        </Field>
        <Field label="AI Model">
          <select
            className="input"
            value={data.model_name || "gpt-4.1-mini"}
            onChange={(e) => update("model_name", e.target.value)}
          >
            <option value="gpt-4.1-mini">GPT-4.1 Mini (แนะนำ)</option>
            <option value="gpt-4.1">GPT-4.1</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </select>
        </Field>
      </div>

      {/* Website Chat Widget */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2 text-gray-900">
          <span className="px-2 py-0.5 rounded bg-violet-50 text-violet-600 text-xs font-bold border border-violet-200">
            WIDGET
          </span>
          Website Chat Widget
        </h3>
        <p className="text-gray-500 text-sm">
          ฝัง Chat Widget ลงบนเว็บไซต์ รองรับทุก framework — วาง script ก่อน{" "}
          <code className="text-gray-700">&lt;/body&gt;</code>
        </p>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">
              Embed Code:
            </p>
            <div className="relative">
              <pre className="bg-gray-50 border border-gray-200 text-gray-700 text-xs p-4 pr-10 rounded-xl overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all">
                {`<script src="${backendUrl}/widget/embed.js?bot_id=${botId}"></script>`}
              </pre>
              <WidgetCopyBtn
                code={`<script src="${backendUrl}/widget/embed.js?bot_id=${botId}"></script>`}
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">
              Chat Page URL (iframe / direct):
            </p>
            <code className="text-gray-700 text-xs break-all">
              {backendUrl}/widget/chat?bot_id={botId}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

function WidgetCopyBtn({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="absolute top-2 right-2 p-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-700 transition-colors"
      title="คัดลอก"
      onClick={() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? (
        <Check size={12} className="text-green-600" />
      ) : (
        <Copy size={12} />
      )}
    </button>
  );
}

function PromptTab({
  bot,
  showPrompt,
  setShowPrompt,
  onRegen,
  regenPrompt,
}: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 text-gray-900">
          <Sparkles size={16} className="text-gray-600" /> System Prompt
          (Generated by Claude)
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="btn btn-ghost py-1.5 px-3 text-sm flex items-center gap-1.5"
          >
            {showPrompt ? <EyeOff size={13} /> : <Eye size={13} />}
            {showPrompt ? "ซ่อน" : "แสดง"}
          </button>
          <button
            onClick={onRegen}
            disabled={regenPrompt}
            className="btn btn-primary py-1.5 px-3 text-sm flex items-center gap-1.5"
          >
            {regenPrompt ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}
            สร้างใหม่
          </button>
        </div>
      </div>
      {showPrompt ? (
        <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed max-h-96 overflow-auto font-mono text-xs">
          {bot.system_prompt || "ยังไม่มี System Prompt"}
        </pre>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-400">
          <Eye size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">กดแสดงเพื่อดู System Prompt</p>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-64 bg-gray-100 rounded-xl" />
      <div className="h-24 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  );
}
