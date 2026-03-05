"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import TobTanIcon from "@/components/TobTanIcon";
import clsx from "clsx";

type Channel = "instagram" | "facebook" | "tiktok";
type Step = "select" | "connect" | "accounts";

const CHANNELS = [
  {
    id: "instagram" as Channel,
    name: "Instagram",
    desc: "Supercharge your social media marketing with Instagram automation",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <defs>
          <radialGradient id="ig-grad" cx="30%" cy="107%" r="130%">
            <stop offset="0%" stopColor="#ffd87a" />
            <stop offset="25%" stopColor="#f7904e" />
            <stop offset="50%" stopColor="#e2437c" />
            <stop offset="75%" stopColor="#a03faa" />
            <stop offset="100%" stopColor="#4c68d7" />
          </radialGradient>
        </defs>
        <rect width="36" height="36" rx="9" fill="url(#ig-grad)" />
        <rect
          x="10"
          y="10"
          width="16"
          height="16"
          rx="4.5"
          stroke="white"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx="18"
          cy="18"
          r="4"
          stroke="white"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="24.5" cy="11.5" r="1.5" fill="white" />
      </svg>
    ),
  },
  {
    id: "facebook" as Channel,
    name: "Facebook Messager",
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="9" fill="#1877F2" />
        <path
          d="M22.5 11H20c-1.7 0-3.5.8-3.5 3v1.5H15v3h1.5V26h3.5v-7.5H22l.5-3H20V14.5c0-.9.4-1.5 1.5-1.5H22.5V11z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: "tiktok" as Channel,
    name: "Tiktok",
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="9" fill="#010101" />
        <path
          d="M24 13.5c-1 0-1.9-.4-2.5-1V20a5 5 0 1 1-5-5v2.5a2.5 2.5 0 1 0 2.5 2.5V9H22c.2 1.4 1.1 2.6 2 3.1V13.5z"
          fill="white"
        />
        <path
          d="M24 13.5c-1 0-1.9-.4-2.5-1V20a5 5 0 1 1-5-5v2.5a2.5 2.5 0 1 0 2.5 2.5V9H22c.2 1.4 1.1 2.6 2 3.1V13.5z"
          fill="#69C9D0"
          opacity="0.5"
        />
      </svg>
    ),
  },
];

const MOCK_ACCOUNTS = [
  { id: "1", name: "Mel DJ Club", avatar: "M" },
  { id: "2", name: "Ball Mukbang", avatar: "B" },
];

export default function ChannelSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<Channel | null>(null);

  const selectedChannel = CHANNELS.find((c) => c.id === selected);

  function handleNext() {
    if (!selected) return;
    setStep("connect");
  }

  function handleBack() {
    if (step === "connect") setStep("select");
    else if (step === "accounts") setStep("connect");
  }

  function handleConnectViaMeta() {
    setStep("accounts");
  }

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
          {(["select", "connect", "accounts"] as Step[]).map((s) => (
            <div
              key={s}
              className={clsx(
                "h-0.5 w-8 rounded-full transition-colors",
                step === s ||
                  (step === "connect" && s === "select") ||
                  (step === "accounts" && (s === "select" || s === "connect"))
                  ? "bg-gray-900"
                  : "bg-gray-200",
              )}
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col justify-center mt-10">
          {/* ── Step 1: Channel selection ── */}
          {step === "select" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 -ml-1 transition-colors"
                >
                  <ChevronLeft size={16} />
                  ข้ามขั้นตอนนี้
                </Link>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
                Where would you like to start?
              </h1>
              <p className="text-sm text-gray-400 mb-8">
                Don&apos;t worry, you can connect other channel later.
              </p>

              <div className="flex flex-col gap-3 mb-8">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelected(ch.id)}
                    className={clsx(
                      "channel-card text-left",
                      selected === ch.id && "selected",
                    )}
                  >
                    <div className="flex-shrink-0">{ch.icon}</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {ch.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-snug">
                        {ch.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!selected}
                  onClick={handleNext}
                  className="btn btn-black px-6 text-sm font-semibold disabled:opacity-40"
                >
                  ต่อไป
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: Connect channel ── */}
          {step === "connect" && selectedChannel && (
            <>
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6 -ml-1 transition-colors"
              >
                <ChevronLeft size={16} />
                ย้อนกลับ
              </button>

              <div className="mb-4">{selectedChannel.icon}</div>

              <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
                Connect{" "}
                {selectedChannel.id === "instagram"
                  ? "Instagram"
                  : selectedChannel.id === "facebook"
                    ? "Facebook"
                    : "TikTok"}
              </h1>
              <p className="text-sm text-gray-400 mb-8">
                Don&apos;t worry, you can connect other channel later.
              </p>

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  A few steps in
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et
                  massa mi. Aliquam in hendrerit urna. Pellentesque
                </p>
              </div>

              <button
                type="button"
                onClick={handleConnectViaMeta}
                className="btn-meta"
              >
                Connect Via Meta
              </button>
            </>
          )}

          {/* ── Step 3: Account selection ── */}
          {step === "accounts" && selectedChannel && (
            <>
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6 -ml-1 transition-colors"
              >
                <ChevronLeft size={16} />
                ย้อนกลับ
              </button>

              <div className="mb-4">{selectedChannel.icon}</div>

              <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
                Connect Instagram
              </h1>
              <p className="text-sm text-gray-400 mb-6">
                Don&apos;t worry, you can connect other channel later.
              </p>

              <p className="text-sm text-gray-700 mb-4">
                We found {MOCK_ACCOUNTS.length} instagram account managed by you
              </p>

              <div className="flex flex-col gap-3">
                {MOCK_ACCOUNTS.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0">
                      {acc.avatar}
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-900">
                      {acc.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push("/onboarding/knowledge")}
                      className="px-4 py-1.5 bg-[#1a1a1a] text-white text-sm font-semibold rounded-full hover:bg-[#333] transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                ))}
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
