"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Megaphone,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  broadcastApi,
  botsApi,
  exportApi,
  BroadcastCampaign,
  BroadcastCreatePayload,
  Bot,
} from "@/lib/api";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export default function BroadcastPage() {
  const { id } = useParams<{ id: string }>();
  const [bot, setBot] = useState<Bot | null>(null);
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "excel" | null>(null);

  const [form, setForm] = useState<BroadcastCreatePayload>({
    name: "",
    message: "",
    platform: "all",
  });

  const load = async () => {
    try {
      const [b, c] = await Promise.all([
        botsApi.get(id),
        broadcastApi.list(id),
      ]);
      setBot(b.data);
      setCampaigns(c.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("กรุณากรอกชื่อแคมเปญและข้อความ");
      return;
    }
    setCreating(true);
    try {
      await broadcastApi.send(id, form);
      toast.success("สร้างแคมเปญแล้ว กำลังส่ง...");
      setShowForm(false);
      setForm({ name: "", message: "", platform: "all" });
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "สร้างแคมเปญไม่สำเร็จ");
    } finally {
      setCreating(false);
    }
  };

  const handleExport = async (type: "csv" | "excel") => {
    setExporting(type);
    try {
      const res =
        type === "csv" ? await exportApi.csv(id) : await exportApi.excel(id);
      const ext = type === "csv" ? "csv" : "xlsx";
      const mime =
        type === "csv"
          ? "text/csv"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const url = URL.createObjectURL(new Blob([res.data], { type: mime }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bot?.name || "conversations"}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Export ${type.toUpperCase()} สำเร็จ`);
    } catch {
      toast.error("Export ไม่สำเร็จ");
    } finally {
      setExporting(null);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "completed")
      return <CheckCircle2 size={15} className="text-emerald-500" />;
    if (status === "sending")
      return <Loader2 size={15} className="text-amber-500 animate-spin" />;
    if (status === "failed")
      return <AlertCircle size={15} className="text-red-500" />;
    return <Clock size={15} className="text-gray-400" />;
  };

  const statusLabel: Record<string, string> = {
    draft: "รอส่ง",
    sending: "กำลังส่ง",
    completed: "ส่งแล้ว",
    failed: "ล้มเหลว",
  };

  const platformLabel: Record<string, string> = {
    all: "ทุก Platform",
    line: "LINE",
    facebook: "Facebook",
  };

  if (loading)
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-10 w-64 bg-gray-100 rounded-xl" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/bots/${id}`}
            className="text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Megaphone size={20} className="text-gray-700" />
              <h1 className="text-2xl font-bold text-gray-900">Broadcast</h1>
            </div>
            <p className="text-gray-500 text-sm">
              {bot?.name} — {campaigns.length} แคมเปญ
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Export buttons */}
          <button
            onClick={() => handleExport("csv")}
            disabled={!!exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all text-xs font-medium disabled:opacity-50"
          >
            {exporting === "csv" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
            Export CSV
          </button>
          <button
            onClick={() => handleExport("excel")}
            disabled={!!exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all text-xs font-medium disabled:opacity-50"
          >
            {exporting === "excel" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
            Export Excel
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-all text-sm font-medium"
          >
            <Plus size={15} /> สร้างแคมเปญ
          </button>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl p-6 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Megaphone size={18} className="text-gray-600" />{" "}
                สร้างแคมเปญใหม่
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  ชื่อแคมเปญ
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น โปรโมชั่นเดือนมีนาคม"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Platform
                </label>
                <select
                  value={form.platform}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      platform: e.target
                        .value as BroadcastCreatePayload["platform"],
                    })
                  }
                  className="input w-full"
                >
                  <option value="all">ทุก Platform (LINE + Facebook)</option>
                  <option value="line">LINE เท่านั้น</option>
                  <option value="facebook">Facebook เท่านั้น</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  ข้อความ
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  placeholder="สวัสดีลูกค้าทุกท่าน! เรามีโปรโมชั่นพิเศษ..."
                  rows={5}
                  className="input w-full resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {form.message.length} ตัวอักษร
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700">
                ข้อความจะถูกส่งถึงผู้ใช้ทุกคนที่เคยสนทนากับ Bot นี้บน Platform
                ที่เลือก
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all text-sm font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.name.trim() || !form.message.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-all text-sm font-medium disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                ส่งแคมเปญ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-gray-600 flex gap-3">
        <Users size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-gray-900 font-medium mb-0.5">Push Broadcast</p>
          <p>
            ส่งข้อความหาผู้ใช้ทุกคนที่เคยสนทนากับ Bot นี้พร้อมกันในคราวเดียว
            นอกจากนี้ยังสามารถ Export บทสนทนาทั้งหมดเป็น CSV หรือ Excel ได้
          </p>
        </div>
      </div>

      {/* Campaign list */}
      {campaigns.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 ring-1 ring-gray-200 flex items-center justify-center mx-auto mb-5">
            <Megaphone size={28} className="text-gray-500" />
          </div>
          <h3 className="font-bold text-lg mb-2 text-gray-900">
            ยังไม่มีแคมเปญ
          </h3>
          <p className="text-gray-500 mb-6 text-sm">
            สร้างแคมเปญแรกเพื่อส่งข้อความหาผู้ใช้ทุกคนพร้อมกัน
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-all text-sm font-semibold"
          >
            <Plus size={15} /> สร้างแคมเปญแรก
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((cam) => (
            <div
              key={cam.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {cam.name}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                      {statusIcon(cam.status)}{" "}
                      {statusLabel[cam.status] || cam.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                    {cam.message}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-500">
                      {platformLabel[cam.platform] || cam.platform}
                    </span>
                    <span>ส่ง {cam.sent_count.toLocaleString()} คน</span>
                    {cam.failed_count > 0 && (
                      <span className="text-red-500">
                        ล้มเหลว {cam.failed_count} คน
                      </span>
                    )}
                    <span>
                      {format(new Date(cam.created_at), "d MMM yy HH:mm", {
                        locale: th,
                      })}
                    </span>
                  </div>
                </div>
                {cam.target_count > 0 && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900">
                      {Math.round((cam.sent_count / cam.target_count) * 100)}%
                    </p>
                    <p className="text-xs text-gray-400">ส่งสำเร็จ</p>
                  </div>
                )}
              </div>
              {cam.target_count > 0 && (
                <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((cam.sent_count / cam.target_count) * 100))}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
