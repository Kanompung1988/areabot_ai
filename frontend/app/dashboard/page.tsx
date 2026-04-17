"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronDown, RefreshCw, Search, Paperclip, Sparkles, Send,
  StickyNote, Bot, Loader2, MessageCircleMore, Star, Users, Tag,
  Pencil, Phone, Calendar, FileText, Wand2, X, Check,
  Pin, Trash2, MoreHorizontal, Copy,
  Radio, Clock,
} from "lucide-react";
import clsx from "clsx";
import {
  botsApi, adminApi, appointmentApi,
  Bot as BotType, Conversation, Message, Appointment as AppointmentType,
} from "@/lib/api";
import { format, formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import toast from "react-hot-toast";

/* ─── Static data ────────────────────────────────────────────────── */
const STAGE_LABELS = [
  { id: "มาใหม่",    color: "#6366f1" },
  { id: "กำลังคุย",  color: "#f59e0b" },
  { id: "รอนัด",     color: "#3b82f6" },
  { id: "นัดแล้ว",   color: "#10b981" },
  { id: "ติดตามผล",  color: "#8b5cf6" },
];

const TEAM_MEMBERS = [
  "Dr.วิชัย", "กนกวรรณ ศ.", "กรวิชญ์ ป.",
  "ชยพล ว.", "ธนพล ส.", "นภัสสร ก.", "วริษา พ.",
];

const SERVICE_OPTIONS = ["ความงาม", "ผิวหนัง", "เลเซอร์", "ทั่วไป", "อื่นๆ"];
const STATUS_OPTIONS  = ["มาใหม่", "กำลังคุย", "รอนัด", "นัดแล้ว", "ติดตามผล"];

/* ส่งหนาย templates */
const TEMPLATES = [
  {
    category: "ทักทาย",
    items: [
      { label: "สวัสดีลูกค้าใหม่", body: "สวัสดีค่ะ ยินดีต้อนรับสู่คลินิกของเรา 😊 มีอะไรให้ช่วยเหลือไหมคะ?" },
      { label: "ขอบคุณที่ติดต่อ", body: "ขอบคุณที่ติดต่อเข้ามานะคะ ทางคลินิกยินดีให้บริการเสมอค่ะ 🌟" },
    ],
  },
  {
    category: "นัดหมาย",
    items: [
      { label: "ยืนยันนัด", body: "ยืนยันนัดของคุณแล้วค่ะ วันที่ __วันที่__ เวลา __เวลา__ กรุณามาก่อน 10 นาทีค่ะ 📅" },
      { label: "เตือนนัดล่วงหน้า", body: "เตือนความจำค่ะ พรุ่งนี้มีนัดที่คลินิกเวลา __เวลา__ นะคะ หากมีการเปลี่ยนแปลงโปรดแจ้งล่วงหน้าค่ะ 🔔" },
      { label: "ขอเลื่อนนัด", body: "ขออภัยด้วยนะคะ ต้องขอเลื่อนนัดออกไปก่อน สะดวกวันไหนใหม่ได้เลยค่ะ 🙏" },
    ],
  },
  {
    category: "ติดตามผล",
    items: [
      { label: "ติดตามหลังรักษา", body: "สวัสดีค่ะ ติดตามผลการรักษาของคุณนะคะ หลังทำแล้วเป็นยังไงบ้างคะ? มีอาการไม่พึงประสงค์ไหม? 💊" },
      { label: "แนะนำดูแลตัวเอง", body: "อย่าลืมดูแลตัวเองหลังทำนะคะ หลีกเลี่ยงแดดจัด ทาครีมกันแดดทุกวัน และดื่มน้ำให้เพียงพอค่ะ ☀️" },
    ],
  },
  {
    category: "โปรโมชั่น",
    items: [
      { label: "แจ้งโปรโมชั่น", body: "🎉 มีโปรโมชั่นพิเศษสำหรับคุณค่ะ! ลด __X%__ สำหรับ __บริการ__ ถึงวันที่ __วันหมดอายุ__ สนใจทักมาได้เลยนะคะ" },
      { label: "สมาชิกพิเศษ", body: "ขอบคุณที่เป็นลูกค้าประจำนะคะ 💕 คุณได้รับสิทธิ์พิเศษสำหรับสมาชิก ติดต่อสอบถามได้เลยค่ะ" },
    ],
  },
];

/* ─── Helpers ────────────────────────────────────────────────────── */
function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function relativeTime(ts: string) {
  try { return formatDistanceToNow(new Date(ts), { locale: th, addSuffix: false }); }
  catch { return "-"; }
}

function getStageColor(stage: string) {
  return STAGE_LABELS.find((s) => s.id === stage)?.color ?? "#9ca3af";
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function InboxPage() {
  /* Bot */
  const [bots, setBots]               = useState<BotType[]>([]);
  const [selectedBotId, setSelectedBotId] = useState("");
  const [loadingBots, setLoadingBots] = useState(true);

  /* Conversations */
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");

  /* Active */
  const [activeConvoId, setActiveConvoId] = useState("");
  const [activeConvo, setActiveConvo]     = useState<Conversation | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);

  /* Panel 1 nav */
  const [msgTab, setMsgTab]                       = useState<"all" | "direct" | "unread">("all");
  const [activeInbox, setActiveInbox]             = useState<"all" | "favorite">("all");
  const [activeStageFilter, setActiveStageFilter] = useState<string | null>(null);
  const [activeTeamMember, setActiveTeamMember]   = useState<string | null>(null);
  const [teamExpanded, setTeamExpanded]           = useState(true);
  const [labelsExpanded, setLabelsExpanded]       = useState(true);
  const [channelExpanded, setChannelExpanded]     = useState(true);
  const [activeChannel, setActiveChannel]         = useState<string | null>(null);

  /* Chat input */
  const [msgInput, setMsgInput]   = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [inputMode, setInputMode] = useState<"reply" | "note">("reply");
  const [sending, setSending]     = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* Message hover actions */
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [pinnedMsgIds, setPinnedMsgIds] = useState<Set<string>>(new Set());

  /* AI dropdown */
  const [aiDropdownOpen, setAiDropdownOpen] = useState(false);
  const aiDropdownRef = useRef<HTMLDivElement>(null);

  /* Template modal */
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  /* Appointments */
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);

  /* Search dropdown */
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  /* Detail panel */
  const [convoStage, setConvoStage]     = useState("มาใหม่");
  const [convoPhone, setConvoPhone]     = useState("");
  const [convoAge, setConvoAge]         = useState("");
  const [convoService, setConvoService] = useState("ความงาม");
  const [convoPlatform, setConvoPlatform] = useState("LINE");
  const [aiSummary, setAiSummary]       = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [noteText, setNoteText]         = useState("");
  const [editingNote, setEditingNote]   = useState(false);

  /* Social media */
  const [convoLineId, setConvoLineId]   = useState("");
  const [convoFbUrl, setConvoFbUrl]     = useState("");
  const [convoIgUrl, setConvoIgUrl]     = useState("");

  /* ── Init ── */
  useEffect(() => {
    botsApi.list()
      .then((r) => { setBots(r.data); if (r.data.length > 0) setSelectedBotId(r.data[0].id); })
      .catch(() => {})
      .finally(() => setLoadingBots(false));
  }, []);

  useEffect(() => {
    if (!selectedBotId) return;
    setLoadingConvos(true);
    setConversations([]); setActiveConvoId(""); setActiveConvo(null); setMessages([]);
    adminApi.conversations(selectedBotId, { limit: 100 })
      .then((r) => { setConversations(r.data); if (r.data.length > 0) setActiveConvoId(r.data[0].id); })
      .catch(() => {})
      .finally(() => setLoadingConvos(false));
  }, [selectedBotId]);

  useEffect(() => {
    if (!activeConvoId) return;
    setLoadingMsgs(true);
    adminApi.conversation(activeConvoId)
      .then((r) => {
        const data = r.data;
        const convo: Conversation = data.conversation ?? data;
        setActiveConvo(convo);
        setMessages(data.messages ?? []);
        setConvoPlatform(convo.platform ?? "LINE");
        setAiSummary(null);
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [activeConvoId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  /* Fetch appointments */
  useEffect(() => {
    if (!selectedBotId) return;
    appointmentApi.list(selectedBotId)
      .then((r) => setAppointments(r.data ?? []))
      .catch(() => setAppointments([]));
  }, [selectedBotId]);

  /* Close AI dropdown + search dropdown on outside click */
  useEffect(() => {
    function h(e: MouseEvent) {
      if (aiDropdownRef.current && !aiDropdownRef.current.contains(e.target as Node))
        setAiDropdownOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node))
        setSearchFocused(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const refreshConvos = useCallback(() => {
    if (!selectedBotId) return;
    adminApi.conversations(selectedBotId, { limit: 100 })
      .then((r) => setConversations(r.data)).catch(() => {});
  }, [selectedBotId]);

  /* Filter */
  const filteredConvos = conversations.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(c.external_user_name ?? c.external_user_id ?? "").toLowerCase().includes(q)) return false;
    }
    if (activeChannel) {
      if (c.platform?.toLowerCase() !== activeChannel.toLowerCase()) return false;
    }
    if (msgTab === "direct") {
      const p = c.platform?.toLowerCase();
      if (!["line", "facebook", "instagram"].includes(p ?? "")) return false;
    }
    if (msgTab === "unread") {
      if (!c.is_handoff) return false;
    }
    return true;
  });

  /* Search dropdown suggestions */
  const searchSuggestions = searchQuery.trim().length > 0
    ? conversations.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (c.external_user_name ?? c.external_user_id ?? "").toLowerCase().includes(q);
      }).slice(0, 6)
    : [];

  /* Send */
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
    } finally { setSending(false); }
  };

  const handleToggleHandoff = async () => {
    if (!activeConvo) return;
    await adminApi.toggleHandoff(activeConvoId, !activeConvo.is_handoff);
    const r = await adminApi.conversation(activeConvoId);
    const data = r.data;
    setActiveConvo(data.conversation ?? data);
  };

  /* Pin message */
  const togglePin = (id: string) => {
    setPinnedMsgIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast.success("ยกเลิก Pin แล้ว"); }
      else { next.add(id); toast.success("Pin ข้อความแล้ว"); }
      return next;
    });
  };

  /* Copy message */
  const copyMsg = (content: string) => {
    navigator.clipboard.writeText(content).then(() => toast.success("คัดลอกแล้ว"));
  };

  /* Use template */
  const applyTemplate = (body: string) => {
    setMsgInput(body);
    setShowTemplateModal(false);
    setInputMode("reply");
  };

  return (
    <div className="flex h-full overflow-hidden bg-white">

      {/* ══ Panel 1 — Inbox Nav ══════════════════════════════════════ */}
      <div className="inbox-panel flex-shrink-0">
        {/* Bot selector */}
        <div className="px-3 py-2.5 border-b border-gray-100">
          {loadingBots ? (
            <div className="h-7 bg-gray-100 rounded-lg animate-pulse" />
          ) : bots.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-1">ยังไม่มี Bot</p>
          ) : (
            <select
              value={selectedBotId}
              onChange={(e) => setSelectedBotId(e.target.value)}
              className="w-full text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-gray-300 cursor-pointer"
            >
              {bots.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>

        {/* All Chat / Favorite */}
        <div className="px-3 py-2 border-b border-gray-100 space-y-0.5">
          <button
            onClick={() => { setActiveInbox("all"); setActiveStageFilter(null); setActiveTeamMember(null); }}
            className={clsx("inbox-item w-full text-left", activeInbox === "all" && !activeStageFilter && !activeTeamMember && "active")}
          >
            <MessageCircleMore size={14} className="text-gray-400 flex-shrink-0" />
            <span className="flex-1">All Chat</span>
            <span className="text-xs text-gray-400">{conversations.length}</span>
          </button>
          <button
            onClick={() => { setActiveInbox("favorite"); setActiveStageFilter(null); setActiveTeamMember(null); }}
            className={clsx("inbox-item w-full text-left", activeInbox === "favorite" && "active")}
          >
            <Star size={14} className="text-gray-400 flex-shrink-0" />
            <span className="flex-1">Favorite</span>
            <span className="text-xs text-gray-400">0</span>
          </button>
        </div>

        {/* TEAM */}
        <div className="px-3 py-2 border-b border-gray-100">
          <button
            onClick={() => setTeamExpanded(!teamExpanded)}
            className="flex items-center justify-between w-full mb-1.5"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Users size={11} /> TEAM
            </span>
            <ChevronDown size={12} className={clsx("text-gray-400 transition-transform", !teamExpanded && "-rotate-90")} />
          </button>
          {teamExpanded && (
            <div className="space-y-0.5">
              {TEAM_MEMBERS.map((m) => (
                <button
                  key={m}
                  onClick={() => { setActiveTeamMember(m === activeTeamMember ? null : m); setActiveStageFilter(null); }}
                  className={clsx("inbox-item w-full text-left", activeTeamMember === m && "active")}
                >
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600 flex-shrink-0">
                    {m[0]}
                  </div>
                  <span className="flex-1 truncate">{m}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LABELS */}
        <div className="px-3 py-2 border-b border-gray-100">
          <button
            onClick={() => setLabelsExpanded(!labelsExpanded)}
            className="flex items-center justify-between w-full mb-1.5"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Tag size={11} /> LABELS
            </span>
            <ChevronDown size={12} className={clsx("text-gray-400 transition-transform", !labelsExpanded && "-rotate-90")} />
          </button>
          {labelsExpanded && (
            <div className="space-y-0.5">
              {STAGE_LABELS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveStageFilter(s.id === activeStageFilter ? null : s.id); setActiveTeamMember(null); }}
                  className={clsx("inbox-item w-full text-left", activeStageFilter === s.id && "active")}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="flex-1">{s.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CHANNEL */}
        <div className="px-3 py-2">
          <button
            onClick={() => setChannelExpanded(!channelExpanded)}
            className="flex items-center justify-between w-full mb-1.5"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Radio size={11} /> CHANNEL
            </span>
            <ChevronDown size={12} className={clsx("text-gray-400 transition-transform", !channelExpanded && "-rotate-90")} />
          </button>
          {channelExpanded && (
            <div className="space-y-0.5">
              {[
                { id: "line",      label: "LINE",      color: "#06c755" },
                { id: "facebook",  label: "Facebook",  color: "#1877f2" },
                { id: "instagram", label: "Instagram", color: "#e1306c" },
              ].map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id === activeChannel ? null : ch.id)}
                  className={clsx("inbox-item w-full text-left", activeChannel === ch.id && "active")}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ch.color }} />
                  <span className="flex-1">{ch.label}</span>
                  <span className="text-xs text-gray-400">
                    {conversations.filter((c) => c.platform?.toLowerCase() === ch.id).length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ Panel 2 — Message List ══════════════════════════════════ */}
      <div className="msg-panel flex-shrink-0 flex flex-col">
        <div className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-gray-900">Messages</h3>
            <button onClick={refreshConvos} className="icon-sidebar-btn" title="รีเฟรช">
              <RefreshCw size={13} />
            </button>
          </div>
          <div className="flex border-b border-gray-100 -mx-3 px-3 mb-2">
            {([
              { id: "all",    label: "All",    count: conversations.length },
              { id: "direct", label: "Direct", count: conversations.filter((c) => ["line","facebook","instagram"].includes(c.platform?.toLowerCase() ?? "")).length },
              { id: "unread", label: "Unread", count: conversations.filter((c) => c.is_handoff).length },
            ] as const).map((t) => (
              <button key={t.id} onClick={() => setMsgTab(t.id)}
                className={clsx("tab-item flex items-center gap-1 text-xs", msgTab === t.id && "active")}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={clsx(
                    "text-[10px] px-1 rounded-full font-medium",
                    msgTab === t.id ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"
                  )}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
          <div className="relative" ref={searchContainerRef}>
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input
              type="text" value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchFocused(true); }}
              onFocus={() => setSearchFocused(true)}
              placeholder="ค้นหาชื่อ, tag..."
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:border-gray-300"
            />
            {searchFocused && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {searchSuggestions.map((c) => (
                  <button
                    key={c.id}
                    onMouseDown={() => { setActiveConvoId(c.id); setSearchFocused(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-[10px] font-bold text-white">
                        {getInitials(c.external_user_name)}
                      </div>
                      <div className={clsx(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                        c.platform === "line" ? "bg-green-500" :
                        c.platform === "facebook" ? "bg-blue-600" :
                        c.platform === "instagram" ? "bg-pink-600" : "bg-gray-400"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {c.external_user_name || c.external_user_id || "ผู้ใช้ไม่ระบุ"}
                      </p>
                      <p className="text-[10px] text-gray-400">{c.platform} · {c.message_count} ข้อความ</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {loadingConvos ? (
            <div className="p-3 space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <MessageCircleMore size={28} className="mb-2" />
              <p className="text-xs">ยังไม่มีบทสนทนา</p>
            </div>
          ) : (
            filteredConvos.map((c) => {
              const stageColor = getStageColor("มาใหม่");
              return (
                <div key={c.id} onClick={() => setActiveConvoId(c.id)}
                  className={clsx("convo-item", activeConvoId === c.id && "active")}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-xs font-bold text-white">
                        {getInitials(c.external_user_name)}
                      </div>
                      <div className={clsx(
                        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                        c.platform === "line" ? "bg-green-500" :
                        c.platform === "facebook" ? "bg-blue-600" :
                        c.platform === "instagram" ? "bg-pink-600" : "bg-gray-400"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {c.external_user_name || c.external_user_id || "ผู้ใช้ไม่ระบุ"}
                        </span>
                        <span className="text-[11px] text-gray-400 flex-shrink-0 ml-1">{relativeTime(c.last_message_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-1">{c.message_count} ข้อความ</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: stageColor + "20", color: stageColor }}>มาใหม่</span>
                        <span className={clsx("tag text-[10px]",
                          c.platform === "line" ? "tag-green" :
                          c.platform === "facebook" ? "tag-blue" :
                          c.platform === "instagram" ? "tag-red" : "tag-gray"
                        )}>{c.platform}</span>
                        {c.is_handoff && <span className="tag tag-yellow text-[10px]">Handoff</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ══ Panel 3 — Chat ══════════════════════════════════════════ */}
      <div className="chat-panel flex flex-col">
        {activeConvo ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-xs font-bold text-white">
                  {getInitials(activeConvo.external_user_name)}
                </div>
                <span className="font-bold text-sm text-gray-900">
                  {activeConvo.external_user_name || activeConvo.external_user_id || "ผู้ใช้"}
                </span>
                <span className={clsx("tag text-xs",
                  activeConvo.platform === "line" ? "tag-green" :
                  activeConvo.platform === "facebook" ? "tag-blue" :
                  activeConvo.platform === "instagram" ? "tag-red" : "tag-gray"
                )}>{activeConvo.platform}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2.5 py-1 rounded-lg transition-colors border border-gray-200">
                  <FileText size={12} /> ข้อมูลลูกค้า
                </button>
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2.5 py-1 rounded-lg transition-colors border border-gray-200">
                  <Calendar size={12} /> นัดหมาย
                </button>
                <button onClick={handleToggleHandoff}
                  className={clsx("text-xs px-2.5 py-1 rounded-lg font-medium transition-colors border",
                    activeConvo.is_handoff
                      ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  {activeConvo.is_handoff ? "🔵 Handoff" : "Handoff"}
                </button>
              </div>
            </div>

            {/* Note banner */}
            {noteText && (
              <div className="mx-4 mt-2 flex-shrink-0 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
                <StickyNote size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 flex-1">{noteText}</p>
                <button onClick={() => setNoteText("")} className="text-amber-400 hover:text-amber-600"><X size={12} /></button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {loadingMsgs ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 size={22} className="animate-spin text-gray-300" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <p className="text-xs">ยังไม่มีข้อความ</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isFromUser = m.role === "user";
                  const isPinned = pinnedMsgIds.has(m.id);
                  return (
                    <div
                      key={m.id}
                      className={clsx("flex items-end gap-2 group py-1", isFromUser ? "justify-start" : "justify-end")}
                      onMouseEnter={() => setHoveredMsgId(m.id)}
                      onMouseLeave={() => setHoveredMsgId(null)}
                    >
                      {isFromUser && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                          {getInitials(activeConvo.external_user_name)}
                        </div>
                      )}

                      <div className={clsx("flex items-end gap-1.5", isFromUser ? "flex-row" : "flex-row-reverse")}>
                        {/* Hover action toolbar */}
                        <div className={clsx(
                          "flex items-center gap-0.5 transition-opacity",
                          hoveredMsgId === m.id ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}>
                          <button onClick={() => togglePin(m.id)}
                            title="Pin"
                            className={clsx("w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                              isPinned ? "bg-amber-100 text-amber-600" : "hover:bg-gray-100 text-gray-400"
                            )}
                          >
                            <Pin size={11} />
                          </button>
                          <button onClick={() => copyMsg(m.content)}
                            title="คัดลอก"
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100 text-gray-400 transition-colors"
                          >
                            <Copy size={11} />
                          </button>
                          {!isFromUser && (
                            <button
                              title="แก้ไข"
                              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100 text-gray-400 transition-colors"
                            >
                              <Pencil size={11} />
                            </button>
                          )}
                          <button
                            title="ลบ"
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={11} />
                          </button>
                          <button
                            title="เพิ่มเติม"
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100 text-gray-400 transition-colors"
                          >
                            <MoreHorizontal size={11} />
                          </button>
                        </div>

                        {/* Bubble */}
                        <div className="max-w-[72%]">
                          {isPinned && (
                            <div className={clsx("flex items-center gap-1 mb-0.5 text-[10px] text-amber-500", !isFromUser && "justify-end")}>
                              <Pin size={9} /> Pinned
                            </div>
                          )}
                          <div className={clsx(isFromUser ? "bubble-in" : "bubble-out", isPinned && "ring-1 ring-amber-300")}>
                            {m.content}
                          </div>
                          <p className={clsx("text-[10px] text-gray-400 mt-0.5", !isFromUser && "text-right")}>
                            {format(new Date(m.created_at), "HH:mm", { locale: th })}
                            {!isFromUser && <span className="ml-1 text-gray-300">· {m.role === "admin" ? "Admin" : "AI"}</span>}
                          </p>
                        </div>
                      </div>

                      {!isFromUser && (
                        <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                          m.role === "admin" ? "bg-blue-600" : "bg-gray-800"
                        )}>
                          {m.role === "admin"
                            ? <span className="text-[9px] font-bold text-white">A</span>
                            : <Bot size={10} className="text-white" />}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input toolbar */}
            <div className="border-t border-gray-100 px-4 pt-2 pb-3 flex-shrink-0">
              {/* Action row */}
              <div className="flex items-center gap-1 mb-2">
                <button
                  onClick={() => setInputMode(inputMode === "note" ? "reply" : "note")}
                  className={clsx(
                    "flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors",
                    inputMode === "note"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "text-gray-500 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <StickyNote size={12} /> Note
                </button>

                {/* ส่งหนาย button */}
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors font-medium"
                >
                  <Send size={12} /> ส่งหนาย
                </button>

                {/* AI ตอบแทน dropdown */}
                <div className="relative" ref={aiDropdownRef}>
                  <button
                    onClick={() => setAiDropdownOpen(!aiDropdownOpen)}
                    className={clsx(
                      "flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors",
                      activeConvo.is_handoff
                        ? "text-gray-400 border-gray-200 hover:bg-gray-50"
                        : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                    )}
                  >
                    <Sparkles size={12} />
                    AI ตอบแทน
                    <ChevronDown size={11} className={clsx("transition-transform", aiDropdownOpen && "rotate-180")} />
                  </button>
                  {aiDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30">
                      <button
                        onClick={() => { if (activeConvo.is_handoff) handleToggleHandoff(); setAiDropdownOpen(false); }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center">
                          <Sparkles size={9} className="text-purple-600" />
                        </span>
                        เปิด AI ตอบแทน
                        {!activeConvo.is_handoff && <span className="ml-auto text-[10px] text-green-600 font-semibold">● ON</span>}
                      </button>
                      <button
                        onClick={() => { if (!activeConvo.is_handoff) handleToggleHandoff(); setAiDropdownOpen(false); }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <X size={9} className="text-gray-500" />
                        </span>
                        ปิด AI ตอบแทน (Handoff)
                        {activeConvo.is_handoff && <span className="ml-auto text-[10px] text-blue-600 font-semibold">● ON</span>}
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => setAiDropdownOpen(false)}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <Wand2 size={9} className="text-gray-400" />
                        </span>
                        ตั้งค่า AI
                      </button>
                    </div>
                  )}
                </div>

                <button className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors font-medium">
                  <Wand2 size={12} /> AI แก้ไขคำ
                </button>
                <div className="flex-1" />
                <button className="icon-sidebar-btn"><Paperclip size={14} /></button>
              </div>

              {/* Input */}
              {inputMode === "note" ? (
                <div>
                  <textarea
                    rows={2} value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="เพิ่ม Note ภายใน..."
                    className="w-full text-sm bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 resize-none placeholder:text-amber-400 text-amber-900"
                  />
                  <div className="flex justify-end gap-2 mt-1">
                    <button onClick={() => { setInputMode("reply"); setNoteInput(""); }}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">ยกเลิก</button>
                    <button
                      onClick={() => { if (noteInput.trim()) { setNoteText(noteInput.trim()); setNoteInput(""); setInputMode("reply"); } }}
                      className="text-xs bg-amber-500 text-white px-3 py-1 rounded-lg hover:bg-amber-600 font-medium"
                    >บันทึก Note</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <textarea
                    rows={2} value={msgInput} onChange={(e) => setMsgInput(e.target.value)}
                    disabled={!activeConvo.is_handoff}
                    placeholder={activeConvo.is_handoff ? "พิมพ์ข้อความ..." : "เปิด Handoff ก่อนส่งข้อความ"}
                    className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400 resize-none disabled:opacity-50"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!msgInput.trim() || sending || !activeConvo.is_handoff}
                    className="btn btn-black btn-sm gap-1.5 self-end disabled:opacity-40"
                  >
                    {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Sent
                  </button>
                </div>
              )}
              {!activeConvo.is_handoff && inputMode === "reply" && (
                <p className="text-xs text-amber-600 mt-1">💡 เปิด Handoff เพื่อตอบด้วยตัวเอง</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircleMore size={40} className="mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">เลือกบทสนทนา</p>
            <p className="text-xs mt-1 text-gray-400">เลือกจากรายการทางซ้าย</p>
          </div>
        )}
      </div>

      {/* ══ Panel 4 — Detail ════════════════════════════════════════ */}
      <div className="detail-panel flex flex-col">
        {activeConvo ? (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-sm font-bold text-white">
                  {getInitials(activeConvo.external_user_name)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">
                    {activeConvo.external_user_name || activeConvo.external_user_id || "ผู้ใช้"}
                  </p>
                  <p className="text-xs text-gray-400">
                    เริ่ม {format(new Date(activeConvo.created_at), "d MMM yy", { locale: th })}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <PropField label="สถานะ">
                  <select value={convoStage} onChange={(e) => setConvoStage(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
                    style={{ color: getStageColor(convoStage) }}
                  >
                    {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </PropField>
                <PropField label="เบอร์โทรศัพท์">
                  <div className="flex items-center gap-1">
                    <Phone size={11} className="text-gray-400 flex-shrink-0" />
                    <input type="tel" value={convoPhone} onChange={(e) => setConvoPhone(e.target.value)}
                      placeholder="08x-xxx-xxxx"
                      className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" />
                  </div>
                </PropField>
                <PropField label="อายุ">
                  <input type="number" value={convoAge} onChange={(e) => setConvoAge(e.target.value)}
                    placeholder="อายุ (ปี)"
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" />
                </PropField>
                <PropField label="บริการ">
                  <select value={convoService} onChange={(e) => setConvoService(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                    {SERVICE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </PropField>
                <PropField label="Platform">
                  <select value={convoPlatform} onChange={(e) => setConvoPlatform(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                    {["LINE", "Facebook", "Instagram", "Web"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </PropField>
                <PropField label="LINE ID">
                  <div className="flex items-center gap-1">
                    <span className="text-green-500 text-xs font-bold flex-shrink-0">L</span>
                    <input type="text" value={convoLineId} onChange={(e) => setConvoLineId(e.target.value)}
                      placeholder="@lineusername"
                      className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" />
                  </div>
                </PropField>
                <PropField label="Facebook">
                  <div className="flex items-center gap-1">
                    <span className="text-blue-600 text-xs font-bold flex-shrink-0">f</span>
                    <input type="text" value={convoFbUrl} onChange={(e) => setConvoFbUrl(e.target.value)}
                      placeholder="facebook.com/..."
                      className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" />
                  </div>
                </PropField>
                <PropField label="Instagram">
                  <div className="flex items-center gap-1">
                    <span className="text-pink-500 text-xs font-bold flex-shrink-0">@</span>
                    <input type="text" value={convoIgUrl} onChange={(e) => setConvoIgUrl(e.target.value)}
                      placeholder="@instagram"
                      className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" />
                  </div>
                </PropField>
              </div>
            </div>

            {/* AI Summary */}
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <Sparkles size={12} className="text-purple-500" /> AI Summary
                </span>
                <button
                  onClick={() => {
                    setLoadingSummary(true);
                    setTimeout(() => {
                      setAiSummary(`ลูกค้าสนใจบริการ${convoService} มีการสอบถามข้อมูลและราคา บทสนทนา ${activeConvo.message_count} ข้อความ`);
                      setLoadingSummary(false);
                    }, 1200);
                  }}
                  className="text-xs btn btn-black btn-sm gap-1 py-1 px-2.5"
                >
                  {loadingSummary ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} สรุป
                </button>
              </div>
              {aiSummary
                ? <p className="text-xs text-gray-600 leading-relaxed bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">{aiSummary}</p>
                : <p className="text-xs text-gray-400 italic">กด "สรุป" เพื่อให้ AI วิเคราะห์บทสนทนา</p>}
            </div>

            {/* Note */}
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <StickyNote size={12} className="text-amber-500" /> Note
                </span>
                <button onClick={() => setEditingNote(!editingNote)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  <Pencil size={11} />{editingNote ? "เสร็จ" : "แก้ไข"}
                </button>
              </div>
              {editingNote ? (
                <div>
                  <textarea rows={3} value={noteText} onChange={(e) => setNoteText(e.target.value)}
                    placeholder="เพิ่ม Note..."
                    className="w-full text-xs bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none resize-none placeholder:text-amber-400" />
                  <div className="flex justify-end mt-1">
                    <button onClick={() => setEditingNote(false)}
                      className="text-xs bg-gray-900 text-white px-3 py-1 rounded-lg hover:bg-gray-700 font-medium flex items-center gap-1">
                      <Check size={11} /> บันทึก
                    </button>
                  </div>
                </div>
              ) : noteText
                ? <p className="text-xs text-gray-600 leading-relaxed">{noteText}</p>
                : <p className="text-xs text-gray-400 italic">ยังไม่มี Note</p>}
            </div>

            {/* Appointment History */}
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <Calendar size={12} className="text-blue-500" /> ประวัตินัดหมาย
                </span>
                {appointments.length > 3 && (
                  <span className="text-[10px] text-gray-400">{appointments.length} รายการ</span>
                )}
              </div>
              {appointments.length === 0 ? (
                <p className="text-xs text-gray-400 italic">ยังไม่มีประวัตินัดหมาย</p>
              ) : (
                <div className="space-y-1.5">
                  {appointments.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        <Clock size={11} className="text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-medium text-gray-800 truncate">{apt.treatment || apt.service_type}</p>
                          <span className={clsx(
                            "text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0",
                            apt.status === "ยืนยันแล้ว" || apt.status === "มาแล้ว"
                              ? "bg-green-100 text-green-700"
                              : apt.status === "ยกเลิกนัด"
                              ? "bg-red-100 text-red-600"
                              : apt.status === "ยืนยัน"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          )}>{apt.status}</span>
                        </div>
                        <p className="text-[10px] text-gray-400">
                          {apt.appointment_date} · {apt.start_time.slice(0, 5)}
                          {apt.doctor_name && ` · ${apt.doctor_name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity */}
            <div className="px-4 py-3 flex-1 overflow-y-auto">
              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-2">
                <FileText size={12} /> Activity
              </span>
              <div className="space-y-2">
                <ActivityItem label={`บทสนทนาเริ่มต้น · ${activeConvo.message_count} ข้อความ`}
                  time={format(new Date(activeConvo.created_at), "d MMM yy HH:mm", { locale: th })} />
                {activeConvo.is_handoff && <ActivityItem label="เปิด Handoff" time="ล่าสุด" accent />}
                <ActivityItem
                  label={`ข้อความล่าสุด · ${relativeTime(activeConvo.last_message_at)} ที่แล้ว`}
                  time={format(new Date(activeConvo.last_message_at), "HH:mm", { locale: th })} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-xs">เลือกบทสนทนา</p>
          </div>
        )}
      </div>

      {/* ══ Template Modal ══════════════════════════════════════════ */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-semibold text-gray-900">ส่งหนาย</h2>
                <p className="text-xs text-gray-400 mt-0.5">เลือก template เพื่อส่งให้ลูกค้า</p>
              </div>
              <button onClick={() => setShowTemplateModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Template list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {TEMPLATES.map((group) => (
                <div key={group.category}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group.category}</p>
                  <div className="space-y-2">
                    {group.items.map((tpl) => (
                      <button
                        key={tpl.label}
                        onClick={() => applyTemplate(tpl.body)}
                        className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800">{tpl.label}</span>
                          <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">ใช้ →</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{tpl.body}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function PropField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-400 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function ActivityItem({ label, time, accent = false }: { label: string; time: string; accent?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <div className={clsx("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", accent ? "bg-blue-500" : "bg-gray-300")} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-600 leading-relaxed">{label}</p>
        <p className="text-[10px] text-gray-400">{time}</p>
      </div>
    </div>
  );
}
