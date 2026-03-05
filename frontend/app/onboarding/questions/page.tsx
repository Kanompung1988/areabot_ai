"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check } from "lucide-react";
import TobTanIcon from "@/components/TobTanIcon";
import clsx from "clsx";

/* ── Q1 options ─────────────────────────────────────── */
const SOURCE_OPTIONS = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "google", label: "Google" },
  { id: "generative_ai", label: "Generative AI" },
  { id: "other_short", label: "อื่นๆ" },
  { id: "other_specify", label: "อื่น (โปรดระบุ)" },
];

/* ── Q2 options ─────────────────────────────────────── */
const GOAL_OPTIONS = [
  {
    id: "social_media",
    label: "ด้าน social media",
    desc: "จัดการ DM, comment และ engagement อัตโนมัติ",
  },
  {
    id: "sales",
    label: "เพิ่มยอดขายในธุรกิจ",
    desc: "ตอบคำถามลูกค้า แนะนำสินค้า และปิดการขาย",
  },
  {
    id: "customer_support",
    label: "ลดงาน customer support",
    desc: "ตอบอัตโนมัติ ลดภาระทีม support",
  },
  {
    id: "other",
    label: "อื่นๆ",
    desc: "ใช้งานในรูปแบบอื่น",
  },
];

export default function OnboardingQuestionsPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  /* Q1 state */
  const [source, setSource] = useState<string | null>(null);
  const [sourceOther, setSourceOther] = useState("");

  /* Q2 state — multi-select */
  const [goals, setGoals] = useState<Set<string>>(new Set());

  const toggleGoal = (id: string) => {
    setGoals((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleQ1Next = () => {
    if (!source) return;
    setStep(2);
  };

  const handleQ2Next = () => {
    // save preferences if needed, then continue
    router.push("/onboarding/channel");
  };

  return (
    <div className="auth-layout">
      {/* ── Left panel ── */}
      <div className="auth-left">
        {/* Logo */}
        <Link
          href="/"
          className="tobtan-logo self-start hover:opacity-80 transition-opacity"
        >
          <div className="tobtan-logo-icon">
            <TobTanIcon size={13} />
          </div>
          tobtan
        </Link>

        {/* Step progress bar */}
        <div className="flex gap-1.5 mt-5 mb-2">
          <div className="h-0.5 w-8 rounded-full bg-gray-900" />
          <div
            className={clsx(
              "h-0.5 w-8 rounded-full transition-colors",
              step === 2 ? "bg-gray-900" : "bg-gray-200",
            )}
          />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {/* ── Q1 ── */}
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6 -ml-1 transition-colors"
              >
                <ChevronLeft size={16} />
                ย้อนกลับ
              </button>

              <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
                คุณเจอเราจากช่องทางไหน
              </h1>
              <p className="text-sm text-gray-400 mb-7">
                บอกเราเพื่อปรับปรุงบริการให้ดีขึ้น
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {SOURCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSource(opt.id)}
                    className={clsx(
                      "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                      source === opt.id
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {source === "other_specify" && (
                <input
                  className="input mb-6"
                  placeholder="โปรดระบุ..."
                  value={sourceOther}
                  onChange={(e) => setSourceOther(e.target.value)}
                  autoFocus
                />
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => router.push("/onboarding/channel")}
                  className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  ข้ามขั้นตอน
                </button>
                <button
                  type="button"
                  disabled={!source}
                  onClick={handleQ1Next}
                  className="btn btn-black px-6 text-sm font-semibold disabled:opacity-40"
                >
                  ต่อไป
                </button>
              </div>
            </>
          )}

          {/* ── Q2 ── */}
          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6 -ml-1 transition-colors"
              >
                <ChevronLeft size={16} />
                ย้อนกลับ
              </button>

              <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
                คุณคาดหวังอะไรจาก tamtan
              </h1>
              <p className="text-sm text-gray-400 mb-7">
                เลือกได้มากกว่า 1 ข้อ
              </p>

              <div className="flex flex-col gap-3 mb-8">
                {GOAL_OPTIONS.map((opt) => {
                  const checked = goals.has(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleGoal(opt.id)}
                      className={clsx(
                        "flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all",
                        checked
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300 bg-white",
                      )}
                    >
                      <div
                        className={clsx(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                          checked
                            ? "bg-gray-900 border-gray-900"
                            : "border-gray-300",
                        )}
                      >
                        {checked && (
                          <Check
                            size={11}
                            className="text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => router.push("/onboarding/channel")}
                  className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  ข้ามขั้นตอน
                </button>
                <button
                  type="button"
                  onClick={handleQ2Next}
                  className="btn btn-black px-6 text-sm font-semibold"
                >
                  ต่อไป
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-gray-400 flex items-center gap-1 mt-4">
          <span>🍪</span> นโยบายคุกกี้
        </p>
      </div>

      {/* ── Right panel — decorative sparkles ── */}
      <div className="auth-right">
        <SparkleDecor />
      </div>
    </div>
  );
}

function SparkleDecor() {
  return (
    <>
      <svg
        className="absolute top-16 right-32 opacity-20"
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
      >
        <path
          d="M40 0 Q43 37 80 40 Q43 43 40 80 Q37 43 0 40 Q37 37 40 0Z"
          fill="#1a1a1a"
        />
      </svg>
      <svg
        className="absolute bottom-32 right-16 opacity-10"
        width="120"
        height="120"
        viewBox="0 0 80 80"
        fill="none"
      >
        <path
          d="M40 0 Q43 37 80 40 Q43 43 40 80 Q37 43 0 40 Q37 37 40 0Z"
          fill="#1a1a1a"
        />
      </svg>
      <svg
        className="absolute top-1/2 right-48 opacity-15 -translate-y-1/2"
        width="50"
        height="50"
        viewBox="0 0 80 80"
        fill="none"
      >
        <path
          d="M40 0 Q43 37 80 40 Q43 43 40 80 Q37 43 0 40 Q37 37 40 0Z"
          fill="#1a1a1a"
        />
      </svg>
    </>
  );
}
