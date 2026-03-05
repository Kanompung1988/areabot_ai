"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import TobTanIcon from "@/components/TobTanIcon";
import { authApi } from "@/lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "pending"
  >("loading");

  useEffect(() => {
    // No token but has email → "check your email" state (no API call needed)
    if (!token && email) {
      setStatus("pending");
      return;
    }
    if (!token) {
      setStatus("error");
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token, email]);

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

        <div className="flex-1 flex flex-col justify-center items-center text-center mt-10">
          {status === "loading" && (
            <>
              <Loader2 size={48} className="text-gray-400 animate-spin mb-6" />
              <p className="text-xl font-bold text-gray-900 mb-1">
                กำลังยืนยันอีเมล...
              </p>
              <p className="text-sm text-gray-400">โปรดรอสักครู่</p>
            </>
          )}

          {status === "pending" && (
            <>
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
                <Mail size={40} className="text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ตรวจสอบอีเมลของคุณ
              </h1>
              <p className="text-sm text-gray-400 mb-2">
                เราส่งลิงก์ยืนยันไปที่
              </p>
              <p className="text-sm font-semibold text-gray-700 mb-6">
                {email}
              </p>
              <p className="text-xs text-gray-400 mb-8">
                คลิกลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชี
                <br />
                ไม่พบอีเมล? ลองตรวจสอบโฟลเดอร์ spam
              </p>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors underline"
              >
                กลับหน้า Login
              </Link>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ยืนยันอีเมลสำเร็จ! 🎉
              </h1>
              <p className="text-sm text-gray-400 mb-8">
                บัญชีของคุณได้รับการยืนยันแล้ว เริ่มใช้งาน tobtan ได้เลย
              </p>
              <Link
                href="/login"
                className="btn btn-black px-8 text-sm font-semibold"
              >
                เข้าสู่ระบบ
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                <XCircle size={40} className="text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ลิงก์ไม่ถูกต้อง
              </h1>
              <p className="text-sm text-gray-400 mb-8">
                ลิงก์ยืนยันอีเมลนี้ไม่ถูกต้องหรือหมดอายุแล้ว
                กรุณาตรวจสอบอีเมลของคุณอีกครั้ง
              </p>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors underline"
              >
                กลับหน้า Login
              </Link>
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
