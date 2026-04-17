"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Info, Plus, Trash2, Settings2, X } from "lucide-react";
import TobTanIcon from "@/components/TobTanIcon";
import clsx from "clsx";

// ── Types ──────────────────────────────────────────────
interface Sku {
  id: number;
  name: string;
  price: string;
}

interface Service {
  id: number;
  name: string;
  desc: string;
  added: boolean;
  gradient: string;
  price: string;
  skus: Sku[];
}

// ── Static data ────────────────────────────────────────
const CATEGORIES = [
  { id: "dental", label: "ดูแลฟัน", children: ["คูดหินปูน", "คูดหินปูน"] },
];

const INITIAL_SERVICES: Service[] = [
  {
    id: 1, name: "Nutritional counseling",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: false,
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #e94560 50%, #0f3460 100%)",
    price: "", skus: [],
  },
  {
    id: 2, name: "Fluoride treatments",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: true,
    gradient: "linear-gradient(135deg, #0d47a1 0%, #00bcd4 40%, #ff9800 80%, #f44336 100%)",
    price: "1,200", skus: [{ id: 1, name: "ลูกผสม", price: "1,200" }],
  },
  {
    id: 3, name: "Digital dental X-rays",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: false,
    gradient: "linear-gradient(135deg, #ff9800 0%, #f57c00 50%, #e65100 100%)",
    price: "", skus: [],
  },
  {
    id: 4, name: "Routine dental exams",
    desc: "are preventive check-ups designed to maintain optimal oral health and detect problems early—before they become painful or costly to treat. Most dental professionals recommend scheduling an exam every six months, though frequency may vary based on individual needs.\n\nYour dentist reviews any changes in your health, medications",
    added: true,
    gradient: "linear-gradient(135deg, #00bcd4 0%, #4caf50 50%, #2196f3 100%)",
    price: "1,200", skus: [],
  },
  {
    id: 5, name: "Periodic oral evaluation",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: false,
    gradient: "linear-gradient(135deg, #9c27b0 0%, #e91e63 40%, #673ab7 100%)",
    price: "", skus: [],
  },
  {
    id: 6, name: "Dental sealants",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: false,
    gradient: "linear-gradient(135deg, #795548 0%, #ff5722 50%, #ffc107 100%)",
    price: "", skus: [],
  },
  {
    id: 7, name: "Sports mouthguards",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: false,
    gradient: "linear-gradient(135deg, #e91e63 0%, #9c27b0 40%, #ff9800 100%)",
    price: "", skus: [],
  },
  {
    id: 8, name: "Comprehensive oral evaluation",
    desc: "ปรับพิ้นให้เริ่งตัวสวยอย่างเป็นธรรมชาติ โดยไม่ต้องใช้เหล็กจัดฟัน",
    added: false,
    gradient: "linear-gradient(135deg, #29b6f6 0%, #0288d1 40%, #7c4dff 100%)",
    price: "", skus: [],
  },
];

// ── Edit Service Modal ─────────────────────────────────
interface EditModalProps {
  service: Service;
  onClose: () => void;
  onSave: (updated: Pick<Service, "name" | "desc" | "price" | "skus">) => void;
}

let skuCounter = 100;

function EditServiceModal({ service, onClose, onSave }: EditModalProps) {
  const [name, setName] = useState(service.name);
  const [desc, setDesc] = useState(service.desc);
  const [price, setPrice] = useState(service.price);
  const [skus, setSkus] = useState<Sku[]>(
    service.skus.length > 0 ? service.skus : [{ id: ++skuCounter, name: "", price: "" }]
  );

  function addSku() {
    setSkus((prev) => [...prev, { id: ++skuCounter, name: "", price: "" }]);
  }

  function updateSku(id: number, field: "name" | "price", val: string) {
    setSkus((prev) => prev.map((s) => s.id === id ? { ...s, [field]: val } : s));
  }

  function removeSku(id: number) {
    setSkus((prev) => prev.filter((s) => s.id !== id));
  }

  function handleSave() {
    onSave({
      name: name.trim() || service.name,
      desc,
      price,
      skus: skus.filter((s) => s.name.trim()),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        style={{ maxHeight: "85vh" }}
      >
        {/* Modal header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700 truncate">{service.name}</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0 ml-2"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Service name */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{service.name}</h2>
          </div>

          {/* Description */}
          <div>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              className="w-full text-sm text-gray-600 leading-relaxed bg-transparent border-none resize-none focus:outline-none focus:ring-1 focus:ring-gray-200 rounded-lg px-0"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* SKUs */}
          <div>
            <div className="grid grid-cols-2 gap-x-3 mb-2">
              <p className="text-xs font-medium text-gray-500">ชื่อ SKU</p>
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                ราคา
                <span className="text-gray-300 text-[10px]">☝</span>
              </p>
            </div>

            <div className="space-y-2">
              {skus.map((sku) => (
                <div key={sku.id} className="grid grid-cols-2 gap-x-3 items-center group">
                  <input
                    type="text"
                    value={sku.name}
                    onChange={(e) => updateSku(sku.id, "name", e.target.value)}
                    placeholder="ชื่อ SKU"
                    className="input text-sm py-2"
                  />
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={sku.price}
                        onChange={(e) => updateSku(sku.id, "price", e.target.value)}
                        placeholder="0"
                        className="input text-sm py-2 pr-6"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-300 pointer-events-none">
                        ฿
                      </span>
                    </div>
                    {skus.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSku(sku.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addSku}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 mt-2.5 transition-colors"
            >
              <Plus size={12} />
              เพิ่ม SKU ใหม่
            </button>
          </div>

          {/* Standalone price (if no SKUs with price) */}
          {skus.every((s) => !s.price) && (
            <div>
              <div className="border-t border-gray-100 mb-4" />
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500 w-16 flex-shrink-0">
                  ราคา <span className="text-gray-300">☝</span>
                </label>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="input text-sm py-2 pr-6"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-300 pointer-events-none">
                    ฿
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-white border border-gray-200 text-sm"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-black text-sm font-semibold"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function KnowledgeSetupPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("คูดหินปูน");
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [editingId, setEditingId] = useState<number | null>(null);

  const filtered = services.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.desc.includes(search),
  );

  const editingService = editingId !== null
    ? services.find((s) => s.id === editingId) ?? null
    : null;

  function toggleAdd(id: number) {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, added: !s.added } : s)),
    );
  }

  function handleSaveEdit(updated: Pick<Service, "name" | "desc" | "price" | "skus">) {
    setServices((prev) =>
      prev.map((s) => s.id === editingId ? { ...s, ...updated } : s)
    );
    setEditingId(null);
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
                    onClick={() => setEditingId(svc.id)}
                    className="w-6 h-6 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors"
                    title="รายละเอียด"
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
                  {svc.price && (
                    <div className="text-xs text-gray-500 mt-1 font-medium">
                      ฿ {svc.price}
                    </div>
                  )}

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
                          onClick={() => setEditingId(svc.id)}
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
          onClick={() => router.push("/onboarding/personality")}
          className="btn btn-black text-sm font-semibold"
        >
          ต่อไป
        </button>
      </div>

      {/* ── Edit Service Modal ── */}
      {editingService && (
        <EditServiceModal
          service={editingService}
          onClose={() => setEditingId(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
