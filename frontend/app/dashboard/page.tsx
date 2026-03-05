"use client";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Plus,
  Paperclip,
  Sparkles,
  Send,
  StickyNote,
  Bot,
  Loader2,
  RefreshCw,
  MessageCircleMore,
} from "lucide-react";
import clsx from "clsx";
import {
  botsApi,
  adminApi,
  Bot as BotType,
  Conversation,
  Message,
} from "@/lib/api";
import { format, formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

/* ─── Static UI data ─────────────────────────────────────── */
const STAGES = [
  { id: "all", label: "ทั้งหมด", color: "#9ca3af" },
  { id: "handoff", label: "Handoff", color: "#3b82f6" },
  { id: "line", label: "LINE", color: "#22c55e" },
  { id: "facebook", label: "Facebook", color: "#3b82f6" },
  { id: "instagram", label: "Instagram", color: "#e1306c" },
];

const LEAD_STATUSES = [
  "สดใหม่",
  "สนใจ",
  "กำลังถัด",
  "ปิดแล้ว",
  "ใช้บริการ",
  "ใช้บริการซ้ำ",
];

/* ─── Helper ─────────────────────────────────────────────── */
function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function relativeTime(ts: string) {
  try {
    return formatDistanceToNow(new Date(ts), { locale: th, addSuffix: false });
  } catch {
    return "-";
  }
}

/* ─── Page ───────────────────────────────────────────────── */
export default function InboxPage() {
  /* Bot selection */
  const [bots, setBots] = useState<BotType[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>("");
  const [loadingBots, setLoadingBots] = useState(true);

  /* Conversations */
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(false);

  /* Active conversation + messages */
  const [activeConvoId, setActiveConvoId] = useState<string>("");
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  /* UI state */
  const [msgTab, setMsgTab] = useState("all");
  const [stageExpanded, setStageExpanded] = useState(true);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeLeadStatus, setActiveLeadStatus] = useState("สดใหม่");
  const [activeStage, setActiveStage] = useState("all");
  const [activeInbox, setActiveInbox] = useState("all-chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* Load bots on mount */
  useEffect(() => {
    botsApi
      .list()
      .then((r) => {
        setBots(r.data);
        if (r.data.length > 0) setSelectedBotId(r.data[0].id);
      })
      .finally(() => setLoadingBots(false));
  }, []);

  /* Load conversations when bot changes */
  useEffect(() => {
    if (!selectedBotId) return;
    setLoadingConvos(true);
    setConversations([]);
    setActiveConvoId("");
    setActiveConvo(null);
    setMessages([]);
    adminApi
      .conversations(selectedBotId, { limit: 100 })
      .then((r) => {
        setConversations(r.data);
        if (r.data.length > 0) setActiveConvoId(r.data[0].id);
      })
      .finally(() => setLoadingConvos(false));
  }, [selectedBotId]);

  /* Load messages when conversation selected */
  useEffect(() => {
    if (!activeConvoId) return;
    setLoadingMsgs(true);
    adminApi
      .conversation(activeConvoId)
      .then((r) => {
        /* Handle both { conversation, messages } and flat { ...convo, messages } */
        const data = r.data;
        const convo: Conversation = data.conversation ?? data;
        const msgs: Message[] = data.messages ?? [];
        setActiveConvo(convo);
        setMessages(msgs);
      })
      .finally(() => setLoadingMsgs(false));
  }, [activeConvoId]);

  /* Auto-scroll to latest message */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Refresh conversations */
  const refreshConvos = () => {
    if (!selectedBotId) return;
    adminApi
      .conversations(selectedBotId, { limit: 100 })
      .then((r) => setConversations(r.data));
  };

  /* Filter conversations */
  const filteredConvos = conversations.filter((c) => {
    if (activeInbox === "your-inbox") return c.is_handoff;
    if (activeStage === "handoff") return c.is_handoff;
    if (activeStage !== "all") return c.platform === activeStage;
    return true;
  });

  /* Send admin reply */
  const handleSend = async () => {
    if (!msgInput.trim() || !activeConvoId) return;
    setSending(true);
    try {
      await adminApi.adminReply(activeConvoId, msgInput.trim());
      setMsgInput("");
      const r = await adminApi.conversation(activeConvoId);
      const data = r.data;
      setActiveConvo(data.conversation ?? data);
      setMessages(data.messages ?? []);
    } finally {
      setSending(false);
    }
  };

  /* Toggle handoff */
  const handleToggleHandoff = async () => {
    if (!activeConvo) return;
    await adminApi.toggleHandoff(activeConvoId, !activeConvo.is_handoff);
    const r = await adminApi.conversation(activeConvoId);
    const data = r.data;
    setActiveConvo(data.conversation ?? data);
  };

  /* Dynamic counts */
  const INBOX_CATEGORIES = [
    {
      id: "your-inbox",
      label: "Handoff",
      count: conversations.filter((c) => c.is_handoff).length,
      icon: "📋",
    },
    {
      id: "all-chat",
      label: "All Chat",
      count: conversations.length,
      icon: "💬",
    },
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {/* ══ Panel 1 — Inbox nav ══ */}
      <div className="inbox-panel">
        {/* Bot selector */}
        <div className="p-3 border-b border-gray-100">
          {loadingBots ? (
            <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
          ) : bots.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-1">ยังไม่มี Bot</p>
          ) : (
            <select
              value={selectedBotId}
              onChange={(e) => setSelectedBotId(e.target.value)}
              className="w-full text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-gray-300 cursor-pointer"
            >
              {bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="p-3 border-b border-gray-100">
          <h2 className="font-bold text-base text-gray-900 mb-2">Inbox</h2>
          {INBOX_CATEGORIES.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveInbox(item.id)}
              className={clsx(
                "inbox-item w-full text-left justify-between mb-0.5",
                activeInbox === item.id && "active",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Stage filter */}
        <div className="p-3">
          <button
            onClick={() => setStageExpanded(!stageExpanded)}
            className="flex items-center justify-between w-full mb-1"
          >
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Platform
            </span>
            <ChevronDown
              size={13}
              className={clsx(
                "text-gray-400 transition-transform",
                !stageExpanded && "-rotate-90",
              )}
            />
          </button>
          {stageExpanded &&
            STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStage(s.id)}
                className={clsx(
                  "inbox-item w-full text-left justify-between mb-0.5",
                  activeStage === s.id && "active",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: s.color }}
                  />
                  {s.label}
                </span>
                <span className="text-xs text-gray-400">
                  {s.id === "all"
                    ? conversations.length
                    : s.id === "handoff"
                      ? conversations.filter((c) => c.is_handoff).length
                      : conversations.filter((c) => c.platform === s.id)
                          .length}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* ══ Panel 2 — Message list ══ */}
      <div className="msg-panel">
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base text-gray-900">Messages</h3>
            <button
              onClick={refreshConvos}
              className="icon-sidebar-btn"
              title="รีเฟรช"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="flex border-b border-gray-100 -mx-3 px-3">
            {["all", "direct", "unread"].map((t) => (
              <button
                key={t}
                onClick={() => setMsgTab(t)}
                className={clsx("tab-item capitalize", msgTab === t && "active")}
              >
                {t === "all" ? "All" : t === "direct" ? "Direct" : "Unread"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {loadingConvos ? (
            <div className="p-3 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-50 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <MessageCircleMore size={28} className="mb-2" />
              <p className="text-xs">ยังไม่มีบทสนทนา</p>
            </div>
          ) : (
            filteredConvos.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveConvoId(c.id)}
                className={clsx(
                  "convo-item",
                  activeConvoId === c.id && "active",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                    {getInitials(c.external_user_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {c.external_user_name ||
                          c.external_user_id ||
                          "ผู้ใช้ไม่ระบุ"}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                        {relativeTime(c.last_message_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {c.message_count} ข้อความ
                    </p>
                    <div className="flex gap-1 mt-1.5">
                      <span
                        className="tag tag-gray text-xs"
                        style={{ textTransform: "capitalize" }}
                      >
                        {c.platform}
                      </span>
                      {c.is_handoff && (
                        <span className="tag tag-red text-xs">Handoff</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ══ Panel 3 — Chat ══ */}
      <div className="chat-panel">
        {activeConvo ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {getInitials(activeConvo.external_user_name)}
                </div>
                <span className="font-bold text-base text-gray-900">
                  {activeConvo.external_user_name ||
                    activeConvo.external_user_id ||
                    "ผู้ใช้"}
                </span>
                <span
                  className="tag tag-gray text-xs"
                  style={{ textTransform: "capitalize" }}
                >
                  {activeConvo.platform}
                </span>
              </div>
              <button
                onClick={handleToggleHandoff}
                className={clsx(
                  "text-xs px-2.5 py-1 rounded-lg font-medium transition-colors border",
                  activeConvo.is_handoff
                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
                )}
              >
                {activeConvo.is_handoff ? "🔵 Handoff ON" : "Handoff OFF"}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 size={24} className="animate-spin text-gray-300" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <p className="text-xs">ยังไม่มีข้อความ</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isFromUser = m.role === "user";
                  return (
                    <div
                      key={m.id}
                      className={clsx(
                        "flex items-end gap-2",
                        isFromUser ? "justify-start" : "justify-end",
                      )}
                    >
                      {isFromUser && (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                          {getInitials(activeConvo.external_user_name)}
                        </div>
                      )}
                      <div className="max-w-[75%]">
                        <div
                          className={isFromUser ? "bubble-in" : "bubble-out"}
                        >
                          {m.content}
                        </div>
                        <p
                          className={clsx(
                            "text-xs text-gray-400 mt-1",
                            !isFromUser && "text-right",
                          )}
                        >
                          {format(new Date(m.created_at), "HH:mm", {
                            locale: th,
                          })}
                        </p>
                      </div>
                      {!isFromUser && (
                        <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                          {m.role === "admin" ? (
                            <span className="text-[9px] font-bold text-white">
                              A
                            </span>
                          ) : (
                            <Bot size={10} className="text-white" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  className="input pr-36"
                  placeholder={
                    activeConvo.is_handoff
                      ? "พิมพ์ข้อความ..."
                      : "เปิด Handoff ก่อนส่งข้อความ"
                  }
                  value={msgInput}
                  disabled={!activeConvo.is_handoff}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSend()
                  }
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button className="icon-sidebar-btn text-gray-400">
                    <Paperclip size={15} />
                  </button>
                  <button className="icon-sidebar-btn text-gray-400">
                    <StickyNote size={15} />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={
                      !msgInput.trim() || sending || !activeConvo.is_handoff
                    }
                    className="btn btn-black btn-sm gap-1.5 ml-1 disabled:opacity-40"
                  >
                    {sending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}{" "}
                    ส่ง
                  </button>
                </div>
              </div>
              {!activeConvo.is_handoff && (
                <p className="text-xs text-amber-600 mt-1.5">
                  💡 เปิด Handoff เพื่อตอบด้วยตัวเอง
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircleMore size={40} className="mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">เลือกบทสนทนา</p>
            <p className="text-xs mt-1">เลือกจากรายการทางซ้าย</p>
          </div>
        )}
      </div>

      {/* ══ Panel 4 — Detail / AI Summary ══ */}
      <div className="detail-panel">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h4 className="font-bold text-sm text-gray-900">AI Summary</h4>
          <button className="btn btn-black btn-sm gap-1.5 text-xs">
            <Sparkles size={12} /> สรุป AI
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {activeConvo ? (
            <>
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                <span className="tag tag-gray" style={{ textTransform: "capitalize" }}>
                  {activeConvo.platform}
                </span>
                {activeConvo.is_handoff && (
                  <span className="tag tag-red">Handoff</span>
                )}
                <span className="tag tag-gray">
                  {activeConvo.message_count} msg
                </span>
              </div>

              {/* Summary */}
              <div className="space-y-2 text-xs text-gray-600">
                <div>
                  <p className="text-gray-400 font-medium mb-0.5">
                    + ข้อมูลลูกค้า
                  </p>
                  <p className="leading-relaxed">
                    {activeConvo.external_user_name ||
                      activeConvo.external_user_id ||
                      "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium mb-0.5">
                    + เริ่มสนทนา
                  </p>
                  <p className="leading-relaxed">
                    {format(
                      new Date(activeConvo.created_at),
                      "d MMM yy HH:mm",
                      { locale: th },
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium mb-0.5">
                    + ข้อความล่าสุด
                  </p>
                  <p className="leading-relaxed">
                    {relativeTime(activeConvo.last_message_at)} ที่แล้ว
                  </p>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Detail */}
              <div>
                <h5 className="font-semibold text-sm text-gray-900 mb-2">
                  Detail
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Customer</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {getInitials(activeConvo.external_user_name)?.[0]}
                      </div>
                      <span className="font-medium text-gray-800 truncate max-w-[90px]">
                        {activeConvo.external_user_name || "-"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Platform</span>
                    <span
                      className="tag tag-gray text-xs"
                      style={{ textTransform: "capitalize" }}
                    >
                      {activeConvo.platform}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Messages</span>
                    <span className="font-medium text-gray-800">
                      {activeConvo.message_count}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Handoff</span>
                    <span
                      className={clsx(
                        "tag text-xs",
                        activeConvo.is_handoff ? "tag-red" : "tag-gray",
                      )}
                    >
                      {activeConvo.is_handoff ? "ON" : "OFF"}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Lead status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-sm text-gray-900">
                    Lead Status
                  </h5>
                </div>
                <div className="flex flex-wrap gap-1">
                  {LEAD_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setActiveLeadStatus(s)}
                      className={clsx(
                        "tag text-xs cursor-pointer",
                        activeLeadStatus === s ? "tag-black" : "tag-gray",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <p className="text-xs">เลือกบทสนทนา</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
