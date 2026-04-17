"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Search, Plus, Pencil, Trash2, X,
  Package, Tag, Megaphone, Calendar, ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";
import { catalogApi, CatalogItem, CatalogItemType, SkuItem } from "@/lib/api";

// ── Types ───────────────────────────────────────────
type Tab = "all" | CatalogItemType;

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "service", label: "Service" },
  { key: "package", label: "Package" },
  { key: "promotion", label: "Promotion" },
];

const TYPE_BADGE: Record<CatalogItemType, string> = {
  service: "bg-violet-100 text-violet-700 border-violet-200",
  package: "bg-blue-100 text-blue-700 border-blue-200",
  promotion: "bg-rose-100 text-rose-700 border-rose-200",
};

const TYPE_LABEL: Record<CatalogItemType, string> = {
  service: "service",
  package: "package",
  promotion: "promotion",
};

function parseSKUs(raw?: string): SkuItem[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function formatDate(d?: string) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
}

// ── Edit Modal ──────────────────────────────────────
interface EditModalProps {
  botId: string;
  item: CatalogItem | null;   // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

function EditModal({ botId, item, onClose, onSaved }: EditModalProps) {
  const isEdit = !!item;
  const [type, setType] = useState<CatalogItemType>(item?.type ?? "service");
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item?.price?.toString() ?? "");
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [skus, setSkus] = useState<SkuItem[]>(parseSKUs(item?.skus));
  const [startDate, setStartDate] = useState(item?.start_date ?? "");
  const [endDate, setEndDate] = useState(item?.end_date ?? "");
  const [saving, setSaving] = useState(false);

  function addSku() {
    setSkus((prev) => [...prev, { name: "", price: undefined }]);
  }
  function updateSku(i: number, field: keyof SkuItem, val: string) {
    setSkus((prev) => prev.map((s, idx) =>
      idx === i ? { ...s, [field]: field === "price" ? (val ? parseFloat(val) : undefined) : val } : s
    ));
  }
  function removeSku(i: number) {
    setSkus((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      type,
      name: name.trim(),
      description: description || undefined,
      price: price ? parseFloat(price) : undefined,
      image_url: imageUrl || undefined,
      skus: skus.filter((s) => s.name.trim()),
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    };
    try {
      if (isEdit) {
        await catalogApi.update(item!.id, payload);
        toast.success("แก้ไขเรียบร้อย");
      } else {
        await catalogApi.create(botId, payload);
        toast.success("เพิ่มรายการแล้ว");
      }
      onSaved();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm">
            {isEdit ? `แก้ไข — ${item!.name}` : "เพิ่มรายการใหม่"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Type */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">ประเภท</label>
            <div className="flex gap-2">
              {(["service", "package", "promotion"] as CatalogItemType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={clsx(
                    "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize",
                    type === t ? TYPE_BADGE[t] : "text-gray-400 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">ชื่อ *</label>
            <input
              className="input text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อบริการ / แพ็กเกจ / โปรโมชัน"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">คำอธิบาย</label>
            <textarea
              className="input text-sm resize-none h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดสินค้าหรือบริการ..."
            />
          </div>

          {/* Price */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">ราคา (บาท)</label>
            <input
              type="number"
              className="input text-sm"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">URL รูปภาพ</label>
            <input
              className="input text-sm"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Promotion dates */}
          {type === "promotion" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">วันเริ่ม</label>
                <input
                  type="date"
                  className="input text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">วันสิ้นสุด</label>
                <input
                  type="date"
                  className="input text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* SKUs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">SKU / ตัวเลือก</label>
              <button
                type="button"
                onClick={addSku}
                className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"
              >
                <Plus size={11} /> เพิ่ม SKU ใหม่
              </button>
            </div>
            {skus.length === 0 ? (
              <p className="text-xs text-gray-300 text-center py-2">ยังไม่มี SKU</p>
            ) : (
              <div className="space-y-2">
                {skus.map((sku, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      className="input text-sm flex-1"
                      value={sku.name}
                      onChange={(e) => updateSku(i, "name", e.target.value)}
                      placeholder="ชื่อ SKU"
                    />
                    <input
                      type="number"
                      className="input text-sm w-28"
                      value={sku.price ?? ""}
                      onChange={(e) => updateSku(i, "price", e.target.value)}
                      placeholder="ราคา"
                      min="0"
                    />
                    <button
                      type="button"
                      onClick={() => removeSku(i)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn btn-white border border-gray-200 text-sm">
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={saving || !name.trim()}
            className="btn btn-black text-sm disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────
export default function CatalogPage() {
  const { id: botId } = useParams<{ id: string }>();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<CatalogItem | null | "new">(null);

  const load = useCallback(() => {
    setLoading(true);
    catalogApi
      .list(botId, { type: tab === "all" ? undefined : tab })
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [botId, tab]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(item: CatalogItem) {
    if (!confirm(`ลบ "${item.name}"?`)) return;
    try {
      await catalogApi.delete(item.id);
      toast.success("ลบแล้ว");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {
      toast.error("ลบไม่สำเร็จ");
    }
  }

  const filtered = items.filter((item) =>
    !search || item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group: promotions (have image) render as cards, services/packages as rows
  const services = filtered.filter((i) => i.type !== "promotion");
  const promotions = filtered.filter((i) => i.type === "promotion");
  const showAll = tab === "all";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/bots/${botId}`} className="text-gray-400 hover:text-gray-900 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-xl font-black text-gray-900">จัดการร้านค้า</h1>
        </div>
        <button
          onClick={() => setEditingItem("new")}
          className="btn btn-black text-sm flex items-center gap-2"
        >
          <Plus size={14} />
          เพิ่มรายการ
        </button>
      </div>

      {/* Search + Tabs */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาบริการ"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-300"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-100">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t.key
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-16 border border-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package size={40} className="text-gray-200 mb-3" />
          <p className="font-semibold text-gray-500">
            {search ? `ไม่พบ "${search}"` : "ยังไม่มีรายการ"}
          </p>
          <p className="text-sm text-gray-400 mt-1">เพิ่มบริการ แพ็กเกจ หรือโปรโมชันให้ bot รู้จัก</p>
          <button
            onClick={() => setEditingItem("new")}
            className="btn btn-black btn-sm mt-4"
          >
            <Plus size={13} /> เพิ่มรายการแรก
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Service / Package rows */}
          {(showAll ? services : filtered.filter((i) => i.type !== "promotion")).length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {(showAll ? services : filtered.filter((i) => i.type !== "promotion")).map((item, idx, arr) => (
                <div
                  key={item.id}
                  className={clsx(
                    "flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors",
                    idx < arr.length - 1 && "border-b border-gray-50"
                  )}
                >
                  {/* Thumbnail or icon */}
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400">
                        {item.type === "package" ? <Package size={16} /> : <Tag size={16} />}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={clsx(
                        "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                        TYPE_BADGE[item.type]
                      )}>
                        {TYPE_LABEL[item.type]}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 truncate">{item.name}</span>
                    </div>
                    {item.price != null && (
                      <p className="text-xs text-gray-400">
                        ราคา {item.price.toLocaleString()} บาท
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
                    >
                      <Pencil size={11} /> แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Promotion cards */}
          {(showAll ? promotions : tab === "promotion" ? filtered : []).length > 0 && (
            <div>
              {showAll && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Promotions
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(showAll ? promotions : tab === "promotion" ? filtered : []).map((item) => (
                  <div key={item.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden group">
                    {/* Image */}
                    <div className="relative h-36 bg-gray-100">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300">
                          <ImageIcon size={28} />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 bg-white/90 rounded-lg text-gray-600 hover:bg-white shadow-sm"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 bg-white/90 rounded-lg text-red-400 hover:bg-white shadow-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                      {(item.start_date || item.end_date) && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <Calendar size={10} />
                          {formatDate(item.start_date)}
                          {item.end_date && ` – ${formatDate(item.end_date)}`}
                        </p>
                      )}
                      {item.price != null && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.price.toLocaleString()} บาท</p>
                      )}
                      <button
                        onClick={() => setEditingItem(item)}
                        className="mt-2 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        <Pencil size={10} /> แก้ไข
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit / Create Modal */}
      {editingItem !== null && (
        <EditModal
          botId={botId}
          item={editingItem === "new" ? null : editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => { setEditingItem(null); load(); }}
        />
      )}
    </div>
  );
}
