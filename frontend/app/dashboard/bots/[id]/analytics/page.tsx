"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  MessageSquare,
  User,
  Bot,
  Filter,
  UserCheck,
  UserX,
  Send,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  adminApi,
  botsApi,
  Conversation,
  Message,
  Bot as BotType,
  AnalyticsData,
} from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [bot, setBot] = useState<BotType | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [platform, setPlatform] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [handoffMap, setHandoffMap] = useState<Record<string, boolean>>({});
  const [toggling, setToggling] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      botsApi.get(id),
      adminApi.conversations(id, { limit: 100 }),
      adminApi.analytics(id, 30),
    ])
      .then(([b, c, a]) => {
        setBot(b.data);
        const convs: Conversation[] = c.data;
        setConversations(convs);
        setAnalyticsData(a.data);
        const hm: Record<string, boolean> = {};
        convs.forEach((conv) => {
          hm[conv.id] = conv.is_handoff;
        });
        setHandoffMap(hm);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async (convoId: string) => {
    setSelected(convoId);
    setMsgLoading(true);
    try {
      const res = await adminApi.conversation(convoId);
      setMessages(res.data.messages || []);
    } finally {
      setMsgLoading(false);
    }
  };

  const handleToggleHandoff = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setToggling(convId);
    try {
      const current = handoffMap[convId] ?? false;
      await adminApi.toggleHandoff(convId, !current);
      setHandoffMap((p) => ({ ...p, [convId]: !current }));
      toast.success(
        !current ? "เปิด Human Handoff แล้ว" : "ปิด Human Handoff แล้ว",
      );
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setToggling(null);
    }
  };

  const handleAdminReply = async () => {
    if (!selected || !replyText.trim()) return;
    setReplying(true);
    try {
      await adminApi.adminReply(selected, replyText.trim());
      toast.success("ส่งข้อความแล้ว");
      setReplyText("");
      await loadMessages(selected);
    } catch {
      toast.error("ส่งข้อความไม่สำเร็จ");
    } finally {
      setReplying(false);
    }
  };

  const filtered = platform
    ? conversations.filter((c) => c.platform === platform)
    : conversations;

  // Platform badge — inline Tailwind (no non-existent badge-* variants)
  const platformBadgeClass = (p: string) => {
    const map: Record<string, string> = {
      line: "bg-green-100 text-green-700 border-green-200",
      facebook: "bg-blue-100 text-blue-700 border-blue-200",
      instagram: "bg-pink-100 text-pink-700 border-pink-200",
      api: "bg-gray-100 text-gray-600 border-gray-200",
    };
    return map[p] || "bg-gray-100 text-gray-600 border-gray-200";
  };

  const maxPlatformCount = Math.max(
    1,
    ...Object.values(analyticsData?.messages_by_platform ?? {}).map(Number),
  );
  const maxDailyCount = Math.max(
    1,
    ...(analyticsData?.daily_messages ?? []).map((d) => d.count),
  );

  if (loading)
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/bots/${id}`}
          className="text-gray-400 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics — {bot?.name}
          </h1>
          <p className="text-gray-500 text-sm">
            {conversations.length} บทสนทนาทั้งหมด
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Conversations",
            value: bot?.total_conversations ?? 0,
          },
          { label: "Total Messages", value: bot?.total_messages ?? 0 },
          {
            label: "LINE",
            value: conversations.filter((c) => c.platform === "line").length,
          },
          {
            label: "Facebook",
            value: conversations.filter((c) => c.platform === "facebook")
              .length,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-gray-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      {analyticsData && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Platform Breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">
              Platform Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(analyticsData.messages_by_platform).length ===
              0 ? (
                <p className="text-gray-400 text-sm">ยังไม่มีข้อมูล</p>
              ) : (
                Object.entries(analyticsData.messages_by_platform).map(
                  ([plat, count]) => (
                    <div key={plat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 capitalize">{plat}</span>
                        <span className="text-gray-500">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-800 rounded-full transition-all duration-700"
                          style={{
                            width: `${(Number(count) / maxPlatformCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
          </div>

          {/* Daily Messages Bar Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">
              Messages / Day (30 วัน)
            </h3>
            {analyticsData.daily_messages.length === 0 ? (
              <p className="text-gray-400 text-sm">ยังไม่มีข้อมูล</p>
            ) : (
              <div className="flex items-end gap-0.5 h-20 relative">
                {analyticsData.daily_messages.slice(-20).map((d) => (
                  <div
                    key={d.date}
                    className="flex-1 group relative flex flex-col justify-end h-full"
                  >
                    <div
                      className="bg-gray-300 group-hover:bg-gray-700 rounded-sm transition-colors"
                      style={{
                        height: `${Math.max(4, (d.count / maxDailyCount) * 100)}%`,
                      }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-xs bg-gray-900 text-white px-1.5 py-0.5 rounded text-center opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                      {d.count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Questions */}
          {analyticsData.top_questions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">
                Top Questions (30 วัน)
              </h3>
              <div className="space-y-2">
                {analyticsData.top_questions.slice(0, 5).map((q, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded bg-gray-100 text-gray-700 text-xs flex items-center justify-center font-bold flex-shrink-0 border border-gray-200">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-gray-700 truncate">
                      {q.question}
                    </span>
                    <span className="text-gray-400 text-xs flex-shrink-0">
                      {q.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="input py-1.5 text-sm flex-1"
            >
              <option value="">ทุก Platform</option>
              <option value="line">LINE</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="api">API</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                ยังไม่มีบทสนทนา
              </div>
            ) : (
              filtered.map((conv) => {
                const isHandoff = handoffMap[conv.id] ?? conv.is_handoff;
                return (
                  <button
                    key={conv.id}
                    onClick={() => loadMessages(conv.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selected === conv.id
                        ? "bg-gray-100 border-gray-300"
                        : isHandoff
                          ? "bg-orange-50 border-orange-200 hover:border-orange-300"
                          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 text-xs font-semibold rounded border ${platformBadgeClass(conv.platform)}`}
                        >
                          {conv.platform.toUpperCase()}
                        </span>
                        {isHandoff && (
                          <span className="px-1.5 py-0.5 text-xs font-semibold rounded border bg-orange-100 text-orange-700 border-orange-200">
                            HANDOFF
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 text-xs">
                          {formatDistanceToNow(new Date(conv.last_message_at), {
                            addSuffix: true,
                            locale: th,
                          })}
                        </span>
                        <button
                          onClick={(e) => handleToggleHandoff(conv.id, e)}
                          disabled={toggling === conv.id}
                          title={
                            isHandoff ? "ปิด Handoff" : "เปิด Human Handoff"
                          }
                          className={`p-1 rounded-lg transition-colors flex-shrink-0 ${
                            isHandoff
                              ? "text-orange-500 hover:bg-orange-100"
                              : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {toggling === conv.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : isHandoff ? (
                            <UserCheck size={11} />
                          ) : (
                            <UserX size={11} />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conv.external_user_name ||
                        conv.external_user_id ||
                        "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {conv.message_count} ข้อความ
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message Viewer */}
        <div
          className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl flex flex-col"
          style={{ height: 680 }}
        >
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-center text-gray-400">
              <div>
                <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                <p>เลือกบทสนทนาเพื่อดูข้อความ</p>
              </div>
            </div>
          ) : msgLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-gray-500" />
                  <span className="font-medium text-sm text-gray-700">
                    {messages.length} ข้อความ
                  </span>
                </div>
                {selected && handoffMap[selected] && (
                  <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                    <UserCheck size={10} /> Human Handoff Active
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-3 min-h-0">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                        msg.role === "user"
                          ? "bg-gray-100 text-gray-500 border border-gray-200"
                          : "bg-gray-800 text-white"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User size={12} />
                      ) : (
                        <Bot size={12} />
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] ${msg.role === "assistant" ? "items-end" : ""}`}
                    >
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-gray-100 text-gray-800 rounded-tl-none"
                            : "bg-gray-900 text-white rounded-tr-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <p className="text-gray-400 text-xs mt-1 px-1">
                        {format(new Date(msg.created_at), "HH:mm")}
                        {msg.tokens_used > 0 && (
                          <span className="ml-2">{msg.tokens_used} tokens</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              {/* Admin Reply — shown only when handoff is active */}
              {selected && handoffMap[selected] && (
                <div className="p-3 border-t border-gray-200 flex gap-2 flex-shrink-0">
                  <input
                    type="text"
                    className="input flex-1 text-sm py-2"
                    placeholder="พิมพ์ข้อความตอบกลับลูกค้า..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAdminReply();
                      }
                    }}
                  />
                  <button
                    onClick={handleAdminReply}
                    disabled={replying || !replyText.trim()}
                    className="btn-primary py-2 px-4 flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    {replying ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    ส่ง
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
