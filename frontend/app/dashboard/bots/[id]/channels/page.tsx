"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Save,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Info,
  Globe,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { botsApi, Bot } from "@/lib/api";

/* ── helper: copy button ──────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
      title="คัดลอก"
    >
      {copied ? (
        <Check size={13} className="text-green-600" />
      ) : (
        <Copy size={13} />
      )}
    </button>
  );
}

/* ── webhook url row ──────────────────────────────────── */
function WebhookRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
      <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs text-gray-800 break-all">{url}</code>
        <CopyBtn text={url} />
      </div>
    </div>
  );
}

/* ── section card ─────────────────────────────────────── */
function ChannelCard({
  badge,
  badgeClass,
  title,
  docsUrl,
  children,
}: {
  badge: string;
  badgeClass: string;
  title: string;
  docsUrl?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 text-gray-900">
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold border ${badgeClass}`}
          >
            {badge}
          </span>
          {title}
        </h3>
        {docsUrl && (
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            <ExternalLink size={12} /> คู่มือ
          </a>
        )}
      </div>
      {children}
    </div>
  );
}

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

/* ── main page ────────────────────────────────────────── */
export default function ChannelsPage() {
  const { id } = useParams<{ id: string }>();
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState({
    line_channel_secret: "",
    line_channel_access_token: "",
    fb_page_token: "",
    fb_verify_token: "",
    fb_app_secret: "",
    instagram_access_token: "",
    instagram_verify_token: "",
  });

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    botsApi
      .get(id)
      .then((r) => {
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
      })
      .finally(() => setLoading(false));
  }, [id]);

  const update = (k: keyof typeof data, v: string) =>
    setData((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await botsApi.update(id, data);
      toast.success("บันทึกการตั้งค่า Channel แล้ว");
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  /* ── connected status ── */
  const lineConnected = !!(
    data.line_channel_secret && data.line_channel_access_token
  );
  const fbConnected = !!(data.fb_page_token && data.fb_verify_token);
  const igConnected = !!(
    data.instagram_access_token && data.instagram_verify_token
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!bot)
    return <div className="text-center py-20 text-gray-500">ไม่พบ Bot</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
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
            <h1 className="text-2xl font-bold text-gray-900">Channel Setup</h1>
            <p className="text-gray-500 text-sm">
              {bot.name} · {bot.company_name}
            </p>
          </div>
        </div>
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

      {/* Connected summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "LINE", connected: lineConnected, color: "green" },
          { label: "Facebook", connected: fbConnected, color: "blue" },
          { label: "Instagram", connected: igConnected, color: "pink" },
        ].map(({ label, connected, color }) => (
          <div
            key={label}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${
              connected
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-gray-50 border-gray-200 text-gray-400"
            }`}
          >
            <CheckCircle2
              size={14}
              className={connected ? "text-green-500" : "text-gray-300"}
            />
            {label}
            <span className="ml-auto text-xs font-normal">
              {connected ? "เชื่อมต่อแล้ว" : "ยังไม่ได้ตั้งค่า"}
            </span>
          </div>
        ))}
      </div>

      {/* ── LINE ─────────────────────────────────────────── */}
      <ChannelCard
        badge="LINE"
        badgeClass="bg-green-50 text-green-600 border-green-200"
        title="LINE Official Account"
        docsUrl="https://developers.line.biz/console/"
      >
        <WebhookRow
          label="Webhook URL"
          url={`${backendUrl}/webhook/line/${id}`}
        />
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex gap-2 text-xs text-blue-700">
          <Info size={13} className="flex-shrink-0 mt-0.5" />
          <span>
            ไปที่ LINE Developers → เลือก Channel → Messaging API → เปิด "Use
            webhooks" แล้ววาง Webhook URL ด้านบน
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Field
            label="Channel Secret"
            hint="จาก LINE Developers Console → Messaging API → Channel secret"
          >
            <input
              className="input font-mono text-sm"
              value={data.line_channel_secret}
              onChange={(e) => update("line_channel_secret", e.target.value)}
              placeholder="abc123..."
            />
          </Field>
          <Field
            label="Channel Access Token"
            hint="กด Issue ที่ LINE Developers Console → Messaging API → Channel access token (long-lived)"
          >
            <textarea
              className="input h-20 resize-none font-mono text-sm"
              value={data.line_channel_access_token}
              onChange={(e) =>
                update("line_channel_access_token", e.target.value)
              }
              placeholder="eyJhbGci..."
            />
          </Field>
        </div>
      </ChannelCard>

      {/* ── Facebook ─────────────────────────────────────── */}
      <ChannelCard
        badge="FB"
        badgeClass="bg-blue-50 text-blue-600 border-blue-200"
        title="Facebook Messenger"
        docsUrl="https://developers.facebook.com/"
      >
        <WebhookRow
          label="Webhook URL"
          url={`${backendUrl}/webhook/facebook/${id}`}
        />
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex gap-2 text-xs text-blue-700">
          <Info size={13} className="flex-shrink-0 mt-0.5" />
          <span>
            Meta for Developers → App → Webhooks → ใส่ Webhook URL + Verify
            Token แล้ว Subscribe events: messages, messaging_postbacks
          </span>
        </div>
        <Field
          label="Page Access Token"
          hint="จาก Meta for Developers → your App → Messenger → Settings → Access Tokens"
        >
          <textarea
            className="input h-20 resize-none font-mono text-sm"
            value={data.fb_page_token}
            onChange={(e) => update("fb_page_token", e.target.value)}
            placeholder="EAAxxxx..."
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Verify Token" hint="ตั้งเองได้ — ใช้ verify กับ Meta">
            <input
              className="input font-mono text-sm"
              value={data.fb_verify_token}
              onChange={(e) => update("fb_verify_token", e.target.value)}
              placeholder="tobtan_verify"
            />
          </Field>
          <Field
            label="App Secret"
            hint="จาก Meta App → Settings → Basic → App secret"
          >
            <input
              className="input font-mono text-sm"
              value={data.fb_app_secret}
              onChange={(e) => update("fb_app_secret", e.target.value)}
              placeholder="App Secret"
            />
          </Field>
        </div>
      </ChannelCard>

      {/* ── Instagram ────────────────────────────────────── */}
      <ChannelCard
        badge="IG"
        badgeClass="bg-pink-50 text-pink-600 border-pink-200"
        title="Instagram DM"
        docsUrl="https://developers.facebook.com/docs/instagram-api/"
      >
        <WebhookRow
          label="Webhook URL"
          url={`${backendUrl}/webhook/instagram/${id}`}
        />
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex gap-2 text-xs text-amber-700">
          <Info size={13} className="flex-shrink-0 mt-0.5" />
          <span>
            ต้องเชื่อม Instagram Business Account กับ Facebook Page ก่อน
            จึงจะรับ DM ได้ผ่าน Meta Graph API
          </span>
        </div>
        <Field
          label="Instagram Access Token"
          hint="จาก Meta for Developers → Instagram Messaging Platform Access Token"
        >
          <textarea
            className="input h-20 resize-none font-mono text-sm"
            value={data.instagram_access_token}
            onChange={(e) => update("instagram_access_token", e.target.value)}
            placeholder="EAAxxxx..."
          />
        </Field>
        <Field
          label="Verify Token"
          hint="ตั้งเองได้ — ใช้ verify Webhook กับ Meta"
        >
          <input
            className="input font-mono text-sm"
            value={data.instagram_verify_token}
            onChange={(e) => update("instagram_verify_token", e.target.value)}
            placeholder="tobtan_ig_verify"
          />
        </Field>
      </ChannelCard>

      {/* ── Website Widget ───────────────────────────────── */}
      <ChannelCard
        badge="WIDGET"
        badgeClass="bg-violet-50 text-violet-600 border-violet-200"
        title="Website Chat Widget"
      >
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex gap-2 text-xs text-gray-600">
          <Globe size={13} className="flex-shrink-0 mt-0.5 text-gray-400" />
          <span>
            วาง script ก่อน <code className="text-gray-800">&lt;/body&gt;</code>{" "}
            ของเว็บไซต์ รองรับทุก framework
          </span>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">Embed Code</p>
          <div className="relative">
            <pre className="bg-gray-50 border border-gray-200 text-gray-700 text-xs p-4 pr-10 rounded-xl overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all">
              {`<script src="${backendUrl}/widget/embed.js?bot_id=${id}"></script>`}
            </pre>
            <div className="absolute top-2 right-2">
              <CopyBtn
                text={`<script src="${backendUrl}/widget/embed.js?bot_id=${id}"></script>`}
              />
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">
            Chat Page URL
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl break-all">
              {backendUrl}/widget/chat?bot_id={id}
            </code>
            <CopyBtn text={`${backendUrl}/widget/chat?bot_id=${id}`} />
          </div>
        </div>
      </ChannelCard>

      {/* bottom save */}
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
          บันทึกทั้งหมด
        </button>
      </div>
    </div>
  );
}
