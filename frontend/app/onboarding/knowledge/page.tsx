"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Info, Plus, Trash2, Settings2 } from "lucide-react";
import TobTanIcon from "@/components/TobTanIcon";
import clsx from "clsx";

const CATEGORIES = [
  { id: "dental", label: "ดูแลฟัน", children: ["คูดหินปูน", "คูดหินปูน"] },
];

const SERVICES = [
  {
    id: 1,
    name: "Nutritional counseling",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: false,
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #e94560 50%, #0f3460 100%)",
  },
  {
    id: 2,
    name: "Fluoride treatments",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: true,
    gradient:
      "linear-gradient(135deg, #0d47a1 0%, #00bcd4 40%, #ff9800 80%, #f44336 100%)",
  },
  {
    id: 3,
    name: "Digital dental X-rays",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: false,
    gradient: "linear-gradient(135deg, #ff9800 0%, #f57c00 50%, #e65100 100%)",
  },
  {
    id: 4,
    name: "Routine dental exams",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: true,
    gradient: "linear-gradient(135deg, #00bcd4 0%, #4caf50 50%, #2196f3 100%)",
  },
  {
    id: 5,
    name: "Periodic oral evaluation",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: false,
    gradient: "linear-gradient(135deg, #9c27b0 0%, #e91e63 40%, #673ab7 100%)",
  },
  {
    id: 6,
    name: "Dental sealants",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: false,
    gradient: "linear-gradient(135deg, #795548 0%, #ff5722 50%, #ffc107 100%)",
  },
  {
    id: 7,
    name: "Sports mouthguards",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: false,
    gradient: "linear-gradient(135deg, #e91e63 0%, #9c27b0 40%, #ff9800 100%)",
  },
  {
    id: 8,
    name: "Comprehensive oral evaluation",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: false,
    gradient: "linear-gradient(135deg, #29b6f6 0%, #0288d1 40%, #7c4dff 100%)",
  },
];

export default function KnowledgeSetupPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("คูดหินปูน");
  const [services, setServices] = useState(SERVICES);

  const filtered = services.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.desc.includes(search),
  );

  function toggleAdd(id: number) {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, added: !s.added } : s)),
    );
  }

  return (
    <div className="knowledge-layout">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="tobtan-logo self-start hover:opacity-80 transition-opacity"
        >
          <div className="tobtan-logo-icon">
            <TobTanIcon size={13} />
          </div>
          tobtan
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        เลือกบริการที่ทางร้านคุณทำ
      </h1>

      {/* ── Body: sidebar + grid ── */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="knowledge-sidebar">
          {/* Search */}
          <div className="relative mb-3">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="ค้นหาบริการ"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-8 text-sm"
            />
          </div>

          {/* Categories */}
          {CATEGORIES.map((cat) => (
            <div key={cat.id}>
              <div className="knowledge-cat font-semibold text-gray-900 cursor-default">
                {cat.label}
              </div>
              {cat.children.map((child, i) => (
                <button
                  key={`${cat.id}-${i}`}
                  type="button"
                  onClick={() => setActiveCategory(child)}
                  className={clsx(
                    "knowledge-cat w-full text-left",
                    activeCategory === child && "active",
                  )}
                >
                  {child}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Service grid */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-4 gap-4">
            {filtered.map((svc) => (
              <div key={svc.id} className="service-card">
                {/* Thumbnail */}
                <div
                  className="service-card-thumb flex items-start justify-end p-2"
                  style={{ background: svc.gradient }}
                >
                  <button
                    type="button"
                    className="w-6 h-6 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors"
                    title="Info"
                  >
                    <Info size={12} className="text-gray-600" />
                  </button>
                </div>

                {/* Body */}
                <div className="service-card-body">
                  <div className="text-sm font-semibold text-gray-900 leading-tight">
                    {svc.name}
                  </div>
                  <div className="text-xs text-gray-400 leading-snug line-clamp-2">
                    {svc.desc}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-auto pt-2">
                    {svc.added ? (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleAdd(svc.id)}
                          className="flex items-center justify-center gap-1 flex-1 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                          ลบ
                        </button>
                        <button
                          type="button"
                          className="flex items-center justify-center gap-1 flex-1 py-1.5 bg-[#1a1a1a] text-white rounded-lg text-xs font-semibold hover:bg-[#333] transition-colors"
                        >
                          <Settings2 size={12} />
                          จัดการความรู้
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleAdd(svc.id)}
                        className="flex items-center justify-center gap-1 w-full py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Plus size={12} />
                        เพิ่มความรู้
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer nav ── */}
      <div className="flex justify-end items-center gap-3 mt-8 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.push("/onboarding/channel")}
          className="btn btn-white border border-gray-200 text-sm"
        >
          ย้อนกลับ
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="btn btn-black text-sm font-semibold"
        >
          ต่อไป
        </button>
      </div>
    </div>
  );
}
