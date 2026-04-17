"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Inbox, RefreshCw, Search, Circle, Bot,
  MessageCircleMore, Clock, ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { botsApi, adminApi, Bot as BotType, Conversation } from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";

function relativeTime(ts: string) {
  try { return formatDistanceToNow(new Date(ts), { locale: th, addSuffix: false }); }
  catch { return "-"; }
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const PLATFORM_COLORS: Record<string, string> = {
  line: "bg-green-500",
  facebook: "bg-blue-600",
  instagram: "bg-pink-600",
};

export default function InboxPage() {
  const [bots, setBots]                     = useState<BotType[]>([]);
  const [selectedBotId, setSelectedBotId]   = useState("");
  const [loadingBots, setLoadingBots]       = useState(true);
  const [conversations, setConversations]   = useState<Conversation[]>([]);
  const [loadingConvos, setLoadingConvos]   = useState(false);
  const [search, setSearch]                 = useState("");
  const [filterHandoff, setFilterHandoff]   = useState(false);

  /* Load bots */
  useEffect(() => {
    botsApi.list()
      .then((r) => {
        setBots(r.data);
        if (r.data.length > 0) setSelectedBotId(r.data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingBots(false));
  }, []);

  /* Load conversations */
  const loadConvos = useCallback(() => {
    if (!selectedBotId) return;
    setLoadingConvos(true);
    adminApi.conversations(selectedBotId, { limit: 200 })
      .then((r) => setConversations(r.data))
      .catch(() => {})
      .finally(() => setLoadingConvos(false));
  }, [selectedBotId]);

  useEffect(() => { loadConvos(); }, [loadConvos]);

  /* Filter */
  const filtered = conversations.filter((c) => {
    if (filterHandoff && !c.is_handoff) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(c.external_user_name ?? c.external_user_id ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const unread = conversations.filter((c) => c.is_handoff).length;

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">Inbox</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {unread > 0
                ? `${unread} บทสนทนา Handoff รอตอบ`
                : conversations.length > 0
                  ? `${conversations.length} บทสนทนาทั้งหมด`
                  : "ยังไม่มีบทสนทนา"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Bot selector */}
            {!loadingBots && bots.length > 0 && (
              <select
                value={selectedBotId}
                onChange={(e) => setSelectedBotId(e.target.value)}
                className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-300 cursor-pointer"
              >
                {bots.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <button
              onClick={loadConvos}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500"
            >
              <RefreshCw size={14} className={loadingConvos ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-2 mt-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อลูกค้า..."
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-gray-300"
            />
          </div>
          <button
            onClick={() => setFilterHandoff(!filterHandoff)}
            className={clsx(
              "text-xs px-3 py-2 rounded-xl border font-medium transition-colors whitespace-nowrap",
              filterHandoff
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "text-gray-500 border-gray-200 hover:bg-gray-50"
            )}
          >
            🔵 Handoff เท่านั้น
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loadingBots || loadingConvos ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-2.5 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Bot size={40} className="text-gray-200 mb-3" />
            <p className="font-semibold text-gray-500 mb-1">ยังไม่มี Bot</p>
            <p className="text-sm text-gray-400 mb-4">สร้าง Bot ก่อนเพื่อเริ่มรับบทสนทนา</p>
            <Link href="/dashboard/bots/new" className="btn btn-black btn-sm">
              + สร้าง Bot
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Inbox size={36} className="text-gray-200 mb-3" />
            <p className="font-semibold text-gray-500">
              {search || filterHandoff ? "ไม่พบบทสนทนา" : "ยังไม่มีบทสนทนา"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? `ไม่พบ "${search}"` : filterHandoff ? "ไม่มีบทสนทนาที่รอ Handoff" : "รอลูกค้าเริ่มต้นการสนทนา"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href="/dashboard"
                className="block bg-white rounded-2xl p-4 border border-transparent hover:border-gray-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-sm font-bold text-white">
                      {getInitials(c.external_user_name)}
                    </div>
                    {/* Platform dot */}
                    <div className={clsx(
                      "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                      PLATFORM_COLORS[c.platform] ?? "bg-gray-400"
                    )} />
                    {/* Unread dot */}
                    {c.is_handoff && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={clsx(
                        "text-sm truncate",
                        c.is_handoff ? "font-bold text-gray-900" : "font-semibold text-gray-700"
                      )}>
                        {c.external_user_name || c.external_user_id || "ผู้ใช้ไม่ระบุ"}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                        <Clock size={10} />
                        {relativeTime(c.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <MessageCircleMore size={11} />
                        {c.message_count} ข้อความ
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={clsx(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize",
                          c.platform === "line" ? "bg-green-50 text-green-700" :
                          c.platform === "facebook" ? "bg-blue-50 text-blue-700" :
                          c.platform === "instagram" ? "bg-pink-50 text-pink-700" :
                          "bg-gray-100 text-gray-500"
                        )}>
                          {c.platform}
                        </span>
                        {c.is_handoff && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                            Handoff
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Last message date */}
                    <p className="text-[10px] text-gray-300 mt-0.5">
                      {format(new Date(c.last_message_at), "d MMM yy · HH:mm", { locale: th })}
                    </p>
                  </div>

                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0 group-hover:text-gray-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
