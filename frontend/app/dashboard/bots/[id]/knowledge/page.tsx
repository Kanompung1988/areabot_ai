"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  BookOpen,
  Upload,
  Globe,
  Trash2,
  FileText,
  Link2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { knowledgeApi, botsApi, KnowledgeDocument, Bot } from "@/lib/api";

export default function KnowledgePage() {
  const { id } = useParams<{ id: string }>();
  const [bot, setBot] = useState<Bot | null>(null);
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showCrawl, setShowCrawl] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const [b, d] = await Promise.all([
        botsApi.get(id),
        knowledgeApi.list(id),
      ]);
      setBot(b.data);
      setDocs(d.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await knowledgeApi.upload(id, file);
      toast.success(`อัปโหลด "${file.name}" แล้ว กำลังประมวลผล...`);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleCrawl = async () => {
    if (!urlInput.trim()) return;
    setCrawling(true);
    try {
      await knowledgeApi.crawl(id, urlInput.trim());
      toast.success("Crawl URL แล้ว กำลังประมวลผล...");
      setUrlInput("");
      setShowCrawl(false);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Crawl ไม่สำเร็จ");
    } finally {
      setCrawling(false);
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    if (!confirm(`ลบ "${title}" ออกจาก Knowledge Base?`)) return;
    try {
      await knowledgeApi.delete(docId);
      toast.success("ลบแล้ว");
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      toast.error("ลบไม่สำเร็จ");
    }
  };

  const statusIcon = (status: string) => {
    if (status === "ready")
      return <CheckCircle2 size={15} className="text-emerald-500" />;
    if (status === "processing")
      return <Loader2 size={15} className="text-amber-500 animate-spin" />;
    return <AlertCircle size={15} className="text-red-500" />;
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      ready: "พร้อมใช้งาน",
      processing: "กำลังประมวลผล",
      error: "ผิดพลาด",
    };
    return map[status] || status;
  };

  const docIcon = (type: string) => {
    if (type === "url") return <Link2 size={16} className="text-blue-500" />;
    return <FileText size={16} className="text-violet-500" />;
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
              <BookOpen size={20} className="text-gray-700" />
              <h1 className="text-2xl font-bold text-gray-900">
                Knowledge Base
              </h1>
            </div>
            <p className="text-gray-500 text-sm">
              {bot?.name} — {docs.length} เอกสาร
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCrawl(!showCrawl)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all text-sm font-medium"
          >
            <Globe size={15} /> Crawl URL
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-all text-sm font-medium disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Upload size={15} />
            )}
            อัปโหลดไฟล์
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* Crawl URL form */}
      {showCrawl && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-fade-in shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Globe size={16} className="text-blue-500" /> Crawl จาก URL
          </h3>
          <div className="flex gap-3">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/about"
              className="input flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleCrawl()}
            />
            <button
              onClick={handleCrawl}
              disabled={crawling || !urlInput.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-all text-sm font-medium disabled:opacity-50"
            >
              {crawling ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              เพิ่ม
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            ระบบจะดึงเนื้อหาจาก URL และแปลงเป็น knowledge สำหรับ Bot
          </p>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-gray-600 flex gap-3">
        <BookOpen size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-gray-900 font-medium mb-0.5">
            RAG (Retrieval-Augmented Generation)
          </p>
          <p>
            เอกสารที่อัปโหลดจะถูกแปลงเป็น vector embeddings และนำมาใช้เป็น
            context ก่อนส่งให้ AI ตอบ รองรับไฟล์ PDF, DOCX, TXT และ URL
          </p>
        </div>
      </div>

      {/* Documents list */}
      {docs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 ring-1 ring-gray-200 flex items-center justify-center mx-auto mb-5">
            <BookOpen size={28} className="text-gray-500" />
          </div>
          <h3 className="font-bold text-lg mb-2 text-gray-900">
            ยังไม่มีเอกสาร
          </h3>
          <p className="text-gray-500 mb-6 text-sm">
            อัปโหลดไฟล์หรือ Crawl URL เพื่อให้ Bot มีข้อมูลตอบคำถาม
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-all text-sm font-semibold"
          >
            <Upload size={15} /> อัปโหลดเอกสารแรก
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                {docIcon(doc.doc_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {doc.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-500 uppercase">
                    {doc.doc_type}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    {statusIcon(doc.status)} {statusLabel(doc.status)}
                  </span>
                  {doc.chunk_count > 0 && (
                    <span className="text-xs text-gray-400">
                      {doc.chunk_count} chunks
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc.id, doc.title)}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
