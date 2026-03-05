"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  MessageSquare,
  Trash2,
  Search,
  BarChart3,
  Loader2,
  Zap,
  ChevronRight,
} from "lucide-react";
import { botsApi, Bot as BotType } from "@/lib/api";
import toast from "react-hot-toast";
import TobTanIcon from "@/components/TobTanIcon";

export default function BotsPage() {
  const [bots, setBots] = useState<BotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () =>
    botsApi
      .list()
      .then((r) => setBots(r.data))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    await botsApi.delete(id);
    toast.success("ลบ Bot เรียบร้อย");
    load();
  };

  const filtered = bots.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.company_name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading)
    return (
      <div className="max-w-6xl mx-auto">
        <div className="h-10 w-48 bg-gray-100 rounded-xl mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-52 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            My Bots
          </h1>
          <p className="text-gray-400 mt-0.5 text-sm">
            {bots.length} bot ทั้งหมด
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="ค้นหา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-8 h-9 text-sm w-48"
            />
          </div>
          <Link
            href="/dashboard/bots/new"
            className="btn btn-black h-9 px-4 text-sm flex items-center gap-1.5 flex-shrink-0"
          >
            <Plus size={14} /> สร้าง Bot ใหม่
          </Link>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState hasSearch={search.length > 0} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((bot) => (
            <BotCard key={bot.id} bot={bot} onDelete={handleDelete} />
          ))}
          {/* New bot card */}
          <Link
            href="/dashboard/bots/new"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all p-8 min-h-[200px]"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Plus size={18} className="text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-400 group-hover:text-gray-700 transition-colors">
              สร้าง Bot ใหม่
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}

function BotCard({
  bot,
  onDelete,
}: {
  bot: BotType;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="group relative bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
          <TobTanIcon size={20} invert />
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            bot.is_active
              ? "bg-green-50 text-green-600 border border-green-200"
              : "bg-gray-100 text-gray-400 border border-gray-200"
          }`}
        >
          {bot.is_active ? "Active" : "Off"}
        </span>
      </div>

      {/* Name & company */}
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-0.5">
          {bot.name}
        </h3>
        <p className="text-sm text-gray-400 truncate">{bot.company_name}</p>
      </div>

      {/* Stats */}
      <div className="flex gap-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <MessageSquare size={13} className="text-gray-400" />
          <span className="font-semibold text-gray-700">
            {bot.total_messages?.toLocaleString() ?? 0}
          </span>{" "}
          msgs
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Zap size={13} className="text-gray-400" />
          <span className="font-semibold text-gray-700">
            {bot.total_conversations?.toLocaleString() ?? 0}
          </span>{" "}
          convos
        </div>
        <span className="ml-auto text-xs text-gray-400">
          {bot.response_language}
        </span>
      </div>

      {/* Actions - visible on hover */}
      <div className="flex items-center gap-2 pt-1">
        <Link
          href={`/dashboard/bots/${bot.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors"
        >
          จัดการ <ChevronRight size={13} />
        </Link>
        <Link
          href={`/dashboard/bots/${bot.id}/analytics`}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-700"
          title="Analytics"
        >
          <BarChart3 size={15} />
        </Link>
        {confirmDelete ? (
          <div className="flex items-center gap-1 animate-scale-in">
            <button
              onClick={async () => {
                setDeleting(true);
                await onDelete(bot.id);
              }}
              disabled={deleting}
              className="px-2.5 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors flex items-center gap-1"
            >
              {deleting ? <Loader2 size={11} className="animate-spin" /> : "ลบ"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              ยกเลิก
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors text-gray-400 hover:text-red-500"
            title="ลบ Bot"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-6">
        <TobTanIcon size={36} invert />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {hasSearch ? "ไม่พบ Bot ที่ค้นหา" : "ยังไม่มี Bot"}
      </h3>
      <p className="text-gray-400 text-sm mb-8 max-w-xs">
        {hasSearch
          ? "ลองค้นหาด้วยคำอื่น หรือสร้าง Bot ใหม่"
          : "สร้าง Bot ตัวแรกของคุณ ให้ AI ช่วยตอบคำถามลูกค้าแบบอัตโนมัติ"}
      </p>
      <Link
        href="/dashboard/bots/new"
        className="btn btn-black inline-flex items-center gap-2 px-6"
      >
        <Plus size={15} /> สร้าง Bot แรก
      </Link>
    </div>
  );
}
