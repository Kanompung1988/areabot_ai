"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { authApi } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";
import TobTanIcon from "@/components/TobTanIcon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const { access_token, refresh_token, full_name } = res.data;
      Cookies.set("access_token", access_token, { expires: 1 });
      Cookies.set("refresh_token", refresh_token, { expires: 7 });
      if (full_name) Cookies.set("user_name", full_name, { expires: 7 });
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
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

        <div className="flex-1 flex flex-col justify-center mt-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
            ยินดีต้อนรับกลับ
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            เข้าสู่ระบบเพื่อจัดการ bot ของคุณ
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="input pr-10"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn btn-black w-full text-sm font-semibold"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>

            <p className="text-center text-xs text-gray-400 leading-relaxed">
              เมื่อดำเนินการต่อ แสดงว่าคุณยอมรับ{" "}
              <Link href="/terms" className="text-blue-500 hover:underline">
                ข้อกำหนดในการให้บริการ
              </Link>{" "}
              และ
              <br />
              <Link href="/privacy" className="text-blue-500 hover:underline">
                นโยบายความเป็นส่วนตัว
              </Link>
            </p>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">หรือ</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div title="เร็วๆ นี้">
            <button
              disabled
              className="btn btn-white w-full text-sm gap-2 border border-gray-200 opacity-50 cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              เข้าสู่ระบบด้วย Google
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/register"
              className="text-gray-900 font-semibold hover:underline"
            >
              สมัครสมาชิกฟรี
            </Link>
          </p>
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
      {/* Top-right large sparkle */}
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
      {/* Middle-right small sparkle */}
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
      {/* Bottom-right sparkle */}
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
      {/* Bottom-left sparkle */}
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
