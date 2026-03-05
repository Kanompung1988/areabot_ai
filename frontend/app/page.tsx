"use client";
import Link from "next/link";
import TobTanIcon from "@/components/TobTanIcon";
import {
  Bot,
  Zap,
  Shield,
  BarChart3,
  MessageSquare,
  ChevronRight,
  Globe,
  Cpu,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const ORBIT_LABELS = [
  { label: "NLP", r: 130, angle: 0 },
  { label: "LLM", r: 165, angle: 72 },
  { label: "RAG", r: 130, angle: 144 },
  { label: "LINE", r: 165, angle: 216 },
  { label: "FB", r: 130, angle: 288 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="tobtan-logo tobtan-logo--icon-only">
              <div className="tobtan-logo-icon">
                <TobTanIcon size={13} />
              </div>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200 font-medium"
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex btn btn-ghost btn-sm font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn btn-primary btn-sm font-semibold"
            >
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-16 bg-white">
        {/* Subtle background accents */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.06), transparent 60%)",
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-16 items-center py-24">
          {/* Left text */}
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "0.05s" }}
          >
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200 text-sm text-gray-600 mb-7 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              AI-Powered Chatbot Platform
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.06] tracking-tight mb-5 text-gray-900">
              We Build
              <br />
              <span className="text-gray-400">LLM Pipelines</span>
            </h1>

            <p className="text-gray-900 font-semibold text-xl mb-3 tracking-wide">
              "All About AI is All About us"
            </p>
            <p className="text-gray-500 text-lg mb-10 max-w-lg leading-relaxed">
              สร้าง AI Chatbot สำหรับ LINE &amp; Facebook ในไม่กี่นาที โดย{" "}
              <strong className="text-gray-900 font-semibold">
                Super AI Engineers
              </strong>{" "}
              ผู้เชี่ยวชาญจากมหาวิทยาลัยชั้นนำ
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4 mb-10">
              <Link href="/register" className="btn btn-primary btn-lg group">
                <Zap size={18} />
                Start a Project
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link href="#features" className="btn btn-ghost btn-lg">
                <Globe size={18} />
                See Our Work
              </Link>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2.5">
              {[
                "LLM Agents",
                "RAG Systems",
                "AI Research",
                "Automation",
                "Fine-Tuning",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-3.5 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-sm text-gray-500 flex items-center gap-1.5 hover:border-gray-400 hover:text-gray-900 transition-all duration-200 cursor-default"
                >
                  <Cpu size={11} className="text-gray-400" /> {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Orbit */}
          <div className="hidden lg:flex justify-center items-center">
            <OrbitDiagram />
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-5 h-8 rounded-full border-2 border-gray-400 flex items-start justify-center pt-1.5">
            <div className="w-1 h-1.5 rounded-full bg-gray-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Features
            </p>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight text-gray-900">
              ทุกอย่างที่คุณต้องการ
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Platform ครบวงจรสำหรับสร้าง จัดการ และติดตาม AI Chatbot ของคุณ
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white border border-gray-200 card-hover cursor-default group"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${f.bg} ring-1 ${f.ring}`}
                >
                  <f.icon size={20} className={f.color} />
                </div>
                <h3 className="font-bold text-base mb-2 text-gray-900">
                  {f.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              How It Works
            </p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900">
              3 ขั้นตอนง่ายๆ
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connecting line (desktop) */}
            <div
              className="hidden md:block absolute h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent top-[52px]"
              style={{ left: "18%", right: "18%" }}
            />

            {STEPS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-14 h-14 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center mx-auto text-lg font-black text-gray-900 relative z-10 transition-all duration-300 hover:border-gray-400 hover:shadow-sm">
                    {i + 1}
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-gray-200 card-hover text-center">
                  <h3 className="font-bold text-lg mb-3 text-gray-900">
                    {s.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="pricing" className="py-28 bg-gray-50">
        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-600 mb-7">
            <Sparkles size={14} className="text-amber-500" />{" "}
            เริ่มต้นได้ฟรีวันนี้
          </div>

          <h2 className="text-4xl sm:text-5xl font-black mb-5 tracking-tight leading-tight text-gray-900">
            พร้อมสร้าง
            <br />
            <span className="text-gray-400">Chatbot ของคุณ?</span>
          </h2>
          <p className="text-gray-500 text-lg mb-10">
            เริ่มต้นฟรี สร้าง bot ได้ทันที ไม่ต้องมีความรู้ด้าน AI
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register" className="btn btn-primary btn-lg group">
              <Zap size={20} />
              เริ่มต้นเลย — ฟรี!
              <ChevronRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link href="/login" className="btn btn-ghost btn-lg">
              มีบัญชีแล้ว? Sign In
            </Link>
          </div>

          {/* Trust pills */}
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            {[
              "No credit card required",
              "Cancel anytime",
              "99.9% Uptime SLA",
            ].map((t) => (
              <span
                key={t}
                className="text-xs text-gray-400 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <Bot size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-black text-base text-gray-900">
              tob<span className="text-gray-400">tan</span>
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2026 tobtan. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a
                key={l}
                href="#"
                className="hover:text-gray-900 transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Orbit Diagram (Light Theme) ──────────────────────────────── */
function OrbitDiagram() {
  return (
    <div
      className="relative w-[380px] h-[380px] flex items-center justify-center animate-float"
      style={{ animationDuration: "9s" }}
    >
      {/* Subtle glow behind */}
      <div
        className="absolute w-72 h-72 rounded-full pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Static rings */}
      <div
        className="absolute rounded-full border border-gray-200"
        style={{
          width: 260,
          height: 260,
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />
      <div
        className="absolute rounded-full border border-gray-100"
        style={{
          width: 330,
          height: 330,
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />

      {/* Rotating rings */}
      <div className="absolute w-64 h-64 rounded-full border border-gray-200 animate-spin-slow" />
      <div className="absolute w-80 h-80 rounded-full border border-gray-100 animate-spin-reverse" />

      {/* Core */}
      <div className="relative z-20 w-24 h-24 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-md animate-pulse-slow">
        <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
          <Bot size={26} className="text-gray-700" strokeWidth={1.8} />
        </div>
      </div>

      {/* Labels */}
      {ORBIT_LABELS.map(({ label, r, angle }) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        const x = Math.cos(rad) * r;
        const y = Math.sin(rad) * r;
        return (
          <div
            key={label}
            className="absolute px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-default"
            style={{
              transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
              top: "50%",
              left: "50%",
            }}
          >
            {label}
          </div>
        );
      })}

      {/* Small orbit dots */}
      {[0, 90, 180, 270].map((a, i) => {
        const rad = ((a - 90) * Math.PI) / 180;
        const x = Math.cos(rad) * 132;
        const y = Math.sin(rad) * 132;
        return (
          <div
            key={i}
            className="absolute rounded-full bg-gray-300 animate-pulse"
            style={{
              width: i % 2 === 0 ? 6 : 4,
              height: i % 2 === 0 ? 6 : 4,
              transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
              top: "50%",
              left: "50%",
              animationDelay: `${i * 0.4}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Data ──────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Bot,
    title: "AI Bot Builder",
    desc: "กรอกข้อมูลบริษัท แล้วให้ Claude AI สร้าง System Prompt ที่ปรับแต่งเฉพาะสำหรับธุรกิจของคุณ",
    bg: "bg-violet-50",
    color: "text-violet-600",
    ring: "ring-violet-100",
  },
  {
    icon: MessageSquare,
    title: "LINE & Facebook Ready",
    desc: "รับ API Key ที่ compatible กับ OpenAI แล้วนำไปต่อกับ LINE Bot และ Facebook Messenger ได้ทันที",
    bg: "bg-blue-50",
    color: "text-blue-500",
    ring: "ring-blue-100",
  },
  {
    icon: BarChart3,
    title: "Admin Dashboard",
    desc: "ดูสถิติการใช้งาน บทสนทนา และการตอบกลับของ bot แต่ละตัวแบบ real-time",
    bg: "bg-sky-50",
    color: "text-sky-500",
    ring: "ring-sky-100",
  },
  {
    icon: Shield,
    title: "Secure Auth",
    desc: "ระบบ JWT authentication ที่ปลอดภัย จัดการ user และ API Key ได้อย่างมืออาชีพ",
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    ring: "ring-emerald-100",
  },
  {
    icon: Zap,
    title: "OpenAI Compatible",
    desc: "Endpoint ที่ compatible กับ OpenAI API ใช้แทนกันได้เลย รองรับทุก SDK ที่มีอยู่",
    bg: "bg-amber-50",
    color: "text-amber-600",
    ring: "ring-amber-100",
  },
  {
    icon: Globe,
    title: "Multi-Platform",
    desc: "จัดการ bot หลายตัวพร้อมกัน แต่ละตัวมี API Key แยก รองรับหลายช่องทางในคราวเดียว",
    bg: "bg-pink-50",
    color: "text-pink-500",
    ring: "ring-pink-100",
  },
];

const STEPS = [
  {
    title: "กรอกข้อมูลบริษัท",
    desc: "ใส่รายละเอียดธุรกิจ สินค้า/บริการ ช่องทางติดต่อ และ Facebook URL ของคุณ",
  },
  {
    title: "รับ API Key",
    desc: "Claude AI จะสร้าง System Prompt ให้อัตโนมัติ พร้อม API Key สำหรับ LINE & Facebook",
  },
  {
    title: "ดูผลลัพธ์ใน Dashboard",
    desc: "ติดตามบทสนทนา สถิติ และการตอบกลับของ bot ผ่าน Admin Dashboard",
  },
];
