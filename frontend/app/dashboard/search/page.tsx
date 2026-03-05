"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Bot,
  MessageSquare,
  FileText,
  Hash,
  ArrowRight,
} from "lucide-react";

const MOCK_RESULTS = [
  {
    type: "bot",
    title: "Bot ร้านกาแฟ",
    subtitle: "ร้านกาแฟดอยช้าง · Active",
    href: "/dashboard/bots/1",
  },
  {
    type: "bot",
    title: "Bot ลูกค้า VIP",
    subtitle: "แบรนด์สินค้าแฟชั่น · Off",
    href: "/dashboard/bots/2",
  },
  {
    type: "message",
    title: "ลูกค้าถามเรื่องราคา",
    subtitle: "Bot ร้านกาแฟ · 2 ชั่วโมงที่แล้ว",
    href: "/dashboard/bots/1/analytics",
  },
  {
    type: "knowledge",
    title: "FAQ สินค้า",
    subtitle: "Bot ร้านกาแฟ · Knowledge Base",
    href: "/dashboard/bots/1/knowledge",
  },
];

const TYPE_ICON: Record<string, React.ReactNode> = {
  bot: <Bot size={15} className="text-gray-500" />,
  message: <MessageSquare size={15} className="text-gray-500" />,
  knowledge: <FileText size={15} className="text-gray-500" />,
};

const SHORTCUTS = [
  { label: "My Bots", icon: Bot, href: "/dashboard/bots" },
  { label: "สร้าง Bot ใหม่", icon: Hash, href: "/dashboard/bots/new" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? MOCK_RESULTS.filter(
        (r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.subtitle.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-1">
          ค้นหา
        </h1>
        <p className="text-gray-400 text-sm">
          ค้นหา Bots, ข้อความ, และ Knowledge Base
        </p>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <Search
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          autoFocus
          placeholder="พิมพ์เพื่อค้นหา..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input pl-11 h-12 text-base w-full rounded-2xl"
        />
      </div>

      {/* Results */}
      {query.trim() ? (
        filtered.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {filtered.map((r, i) => (
              <Link
                key={i}
                href={r.href}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {TYPE_ICON[r.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {r.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{r.subtitle}</p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-gray-300 group-hover:text-gray-600 transition-colors"
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Search size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">
              ไม่พบผลลัพธ์สำหรับ &ldquo;{query}&rdquo;
            </p>
          </div>
        )
      ) : (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            ลิงก์ด่วน
          </p>
          <div className="grid grid-cols-2 gap-3">
            {SHORTCUTS.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <s.icon size={15} className="text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {s.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
