"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import TobTanIcon from "@/components/TobTanIcon";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* ── Left panel ── */}
      <div className="auth-left">
        <Link
          href="/"
          className="tobtan-logo self-start hover:opacity-80 transition-opacity"
        >
          <div className="tobtan-logo-icon">
            <TobTanIcon size={13} />
          </div>
          tobtan
        </Link>

        <div className="flex-1 flex flex-col justify-center mt-10">
          {sent ? (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ส่งลิงก์รีเซ็ตแล้ว!
              </h1>
              <p className="text-sm text-gray-400 mb-1">
                ตรวจสอบอีเมล{" "}
                <span className="font-semibold text-gray-700">{email}</span>
              </p>
              <p className="text-sm text-gray-400 mb-8">
                และคลิกลิงก์เพื่อตั้งรหัสผ่านใหม่ (หมดอายุใน 1 ชั่วโมง)
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={14} /> กลับหน้า Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
                ลืมรหัสผ่าน?
              </h1>
              <p className="text-sm text-gray-400 mb-8">
                กรอกอีเมลของคุณ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    อีเมล
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-9 w-full"
                      placeholder="you@example.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-black w-full text-sm font-semibold disabled:opacity-40"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> กำลังส่ง...
                    </span>
                  ) : (
                    "ส่งลิงก์รีเซ็ต"
                  )}
                </button>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft size={14} /> กลับหน้า Login
                </Link>
              </form>
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
        className="absolute top-16 right-32 opacity-30"
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
      >
        <path
          d="M40 0L43.5 36.5L80 40L43.5 43.5L40 80L36.5 43.5L0 40L36.5 36.5L40 0Z"
          fill="#aaaaaa"
        />
      </svg>
      <svg
        className="absolute top-1/2 right-16 -translate-y-1/2 opacity-25"
        width="52"
        height="52"
        viewBox="0 0 52 52"
        fill="none"
      >
        <path
          d="M26 0L28.3 23.7L52 26L28.3 28.3L26 52L23.7 28.3L0 26L23.7 23.7L26 0Z"
          fill="#aaaaaa"
        />
      </svg>
      <svg
        className="absolute bottom-20 right-40 opacity-20"
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
      >
        <path
          d="M22 0L24 20L44 22L24 24L22 44L20 24L0 22L20 20L22 0Z"
          fill="#aaaaaa"
        />
      </svg>
      <svg
        className="absolute bottom-32 left-20 opacity-15"
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
      >
        <path
          d="M18 0L19.6 16.4L36 18L19.6 19.6L18 36L16.4 19.6L0 18L16.4 16.4L18 0Z"
          fill="#aaaaaa"
        />
      </svg>
    </>
  );
}
