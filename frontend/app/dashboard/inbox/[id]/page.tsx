"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { ArrowLeft, Bot, User, RefreshCw, Send, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import clsx from "clsx";

interface Message {
  id: string;
  role: string;
  content: string;
  tokens_used: number;
  model_used?: string;
  created_at: string;
}

interface ConvoDetail {
  id: string;
  bot_id: string;
  platform: string;
  external_user_id?: string;
  external_user_name?: string;
  is_handoff: boolean;
  created_at: string;
  last_message_at: string;
  message_count: number;
  messages: Message[];
}

const PLATFORM_COLORS: Record<string, string> = {
  line: "bg-green-500",
  facebook: "bg-blue-600",
  instagram: "bg-pink-600",
};

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [convo, setConvo] = useState<ConvoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setLoading(true);
    adminApi.conversation(id)
      .then((r) => setConvo(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loading, convo?.messages?.length]);

  const sendReply = async () => {
    if (!replyText.trim() || !convo) return;
    setSending(true);
    try {
      await adminApi.adminReply(convo.id, replyText.trim());
      setReplyText("");
      load();
    } catch {
    } finally {
      setSending(false);
    }
  };

  const toggleHandoff = async () => {
    if (!convo) return;
    await adminApi.toggleHandoff(convo.id, !convo.is_handoff);
    load();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">กำลังโหลด...</div>
  );
  if (!convo) return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">ไม่พบบทสนทนา</div>
  );

  const displayName = convo.external_user_name || convo.external_user_id || "ผู้ใช้ไม่ระบุ";

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <ArrowLeft size={16} />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {displayName[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm truncate">{displayName}</span>
              <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize text-white", PLATFORM_COLORS[convo.platform] ?? "bg-gray-400")}>
                {convo.platform}
              </span>
              {convo.is_handoff && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">Handoff</span>
              )}
            </div>
            <p className="text-xs text-gray-400">{convo.message_count} ข้อความ · {convo.external_user_id}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleHandoff} title={convo.is_handoff ? "ปิด Handoff" : "เปิด Handoff"}
              className={clsx("p-1.5 rounded-lg transition-colors text-xs", convo.is_handoff ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "hover:bg-gray-100 text-gray-400")}>
              <UserCheck size={15} />
            </button>
            <button onClick={load} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {convo.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">ยังไม่มีข้อความ</div>
        ) : convo.messages.map((m) => (
          <div key={m.id} className={clsx("flex gap-2", m.role === "user" ? "justify-start" : "justify-end")}>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={13} className="text-gray-500" />
              </div>
            )}
            <div className={clsx(
              "max-w-[72%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              m.role === "user"
                ? "bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100"
                : m.role === "system"
                ? "bg-yellow-50 text-yellow-800 border border-yellow-200 text-xs"
                : "bg-gray-900 text-white rounded-tr-sm"
            )}>
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
              <p className={clsx("text-[10px] mt-1", m.role === "user" ? "text-gray-400" : "text-gray-400")}>
                {format(new Date(m.created_at), "HH:mm · d MMM", { locale: th })}
                {m.tokens_used > 0 && <span className="ml-1">· {m.tokens_used} tokens</span>}
              </p>
            </div>
            {(m.role === "assistant") && (
              <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={13} className="text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply box (only when handoff) */}
      {convo.is_handoff && (
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              placeholder="ตอบกลับในฐานะเจ้าหน้าที่... (Enter เพื่อส่ง)"
              rows={2}
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-gray-300"
            />
            <button
              onClick={sendReply}
              disabled={!replyText.trim() || sending}
              className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
