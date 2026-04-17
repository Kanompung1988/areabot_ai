"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import TobTanIcon from "@/components/TobTanIcon";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (!token) {
      toast.error("ลิงก์ไม่ถูกต้อง กรุณาขอรีเซ็ตใหม่");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "ลิงก์หมดอายุหรือไม่ถูกต้อง");
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
          {done ? (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                รีเซ็ตรหัสผ่านสำเร็จ!
              </h1>
              <p className="text-sm text-gray-400 mb-8">
                กำลังพาคุณไปหน้า Login อัตโนมัติ...
              </p>
              <Link
                href="/login"
                className="btn btn-black px-8 text-sm font-semibold"
              >
                เข้าสู่ระบบเลย
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/forgot-password"
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6 -ml-0.5"
              >
                <ArrowLeft size={15} /> กลับ
              </Link>

              <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
                ตั้งรหัสผ่านใหม่
              </h1>
              <p className="text-sm text-gray-400 mb-8">
                กรอกรหัสผ่านใหม่ที่ต้องการ
              </p>

              {!token && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-3 text-red-500 text-sm">
                  ลิงก์ไม่ถูกต้อง กรุณา{" "}
                  <Link
                    href="/forgot-password"
                    className="underline font-medium"
                  >
                    ขอรีเซ็ตรหัสผ่านใหม่
                  </Link>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    รหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pl-9 pr-11 w-full"
                      placeholder="อย่างน้อย 8 ตัวอักษร"
                      minLength={8}
                      required
                      disabled={!token}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ยืนยันรหัสผ่าน
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showPass ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={`input pl-9 w-full ${
                        confirm && confirm !== password
                          ? "border-red-300 focus:border-red-400"
                          : ""
                      }`}
                      placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                      required
                      disabled={!token}
                    />
                  </div>
                  {confirm && confirm !== password && (
                    <p className="text-red-400 text-xs mt-1">
                      รหัสผ่านไม่ตรงกัน
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !token || password !== confirm}
                  className="btn btn-black w-full text-sm font-semibold disabled:opacity-40"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                    </span>
                  ) : (
                    "ตั้งรหัสผ่านใหม่"
                  )}
                </button>
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
