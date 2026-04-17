"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, Bot, RefreshCw } from "lucide-react";
import TobTanIcon from "@/components/TobTanIcon";
import { botsApi, Bot as BotType } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export default function PersonalityPage() {
  const router = useRouter();
  const [bot, setBot] = useState<BotType | null>(null);
  const [loadingBot, setLoadingBot] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Load first bot + seed greeting */
  useEffect(() => {
    botsApi
      .list()
      .then((r) => {
        if (r.data.length > 0) {
          const b: BotType = r.data[0];
          setBot(b);
          const greeting =
            b.greeting_message ||
            `สวัสดีครับ ผมชื่อ${b.bot_name || b.name}ครับ มีอะไรให้ช่วยไหมครับ?`;
          setMessages([{ role: "assistant", content: greeting }]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBot(false));
  }, []);

  /* Auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Reset chat */
  function resetChat() {
    if (!bot) return;
    const greeting =
      bot.greeting_message ||
      `สวัสดีครับ ผมชื่อ${bot.bot_name || bot.name}ครับ มีอะไรให้ช่วยไหมครับ?`;
    setMessages([{ role: "assistant", content: greeting }]);
    setInput("");
    inputRef.current?.focus();
  }

  /* Send message with SSE streaming */
  async function sendMessage() {
    if (!input.trim() || !bot || sending) return;

    const userText = input.trim();
    setInput("");
    setSending(true);

    const history: ChatMessage[] = [
      ...messages,
      { role: "user", content: userText },
    ];
    setMessages(history);

    // Placeholder for streaming reply
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", streaming: true },
    ]);

    try {
      const resp = await fetch(`${API_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${bot.api_key}`,
          "X-Platform": "api",
          "X-User-Id": "onboarding-preview",
        },
        body: JSON.stringify({
          model: bot.model_name || "gpt-4.1-mini",
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("stream error");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break outer;
          try {
            const parsed = JSON.parse(raw);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: accumulated,
                  streaming: true,
                };
                return copy;
              });
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      // Finalise (remove streaming flag)
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: accumulated || "ขออภัยครับ ไม่ได้รับคำตอบ",
        };
        return copy;
      });
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "ขออภัยครับ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        };
        return copy;
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white px-8 py-6 max-w-5xl mx-auto w-full">
      {/* Logo */}
      <Link
        href="/"
        className="tobtan-logo self-start hover:opacity-80 transition-opacity mb-6"
      >
        <div className="tobtan-logo-icon">
          <TobTanIcon size={13} />
        </div>
        tobtan
      </Link>

      {/* Title row */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          ปรับนิสัย chatbot ของคุณ
        </h1>
        {!loadingBot && bot && (
          <button
            type="button"
            onClick={resetChat}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw size={13} />
            รีเซ็ตการสนทนา
          </button>
        )}
      </div>

      {/* Chat container */}
      <div className="flex-1 min-h-0 border border-gray-200 rounded-2xl flex flex-col overflow-hidden bg-white shadow-sm">
        {loadingBot ? (
          /* Loading skeleton */
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-300">
              <Bot size={36} />
              <p className="text-sm">กำลังโหลด bot…</p>
            </div>
          </div>
        ) : !bot ? (
          /* No bot state */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <Bot size={40} className="text-gray-200" />
            <p className="font-semibold text-gray-500">ยังไม่มี Bot</p>
            <p className="text-sm text-gray-400">
              กรุณาสร้าง Bot ก่อนเพื่อทดสอบบทสนทนา
            </p>
            <Link
              href="/dashboard/bots/new"
              className="btn btn-black btn-sm mt-1"
            >
              สร้าง Bot
            </Link>
          </div>
        ) : (
          /* Messages */
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[68%] text-sm px-4 py-2.5 leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gray-900 text-white rounded-2xl rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm"
                  }`}
                >
                  {msg.content ? (
                    msg.content
                  ) : msg.streaming ? (
                    <span className="inline-flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="mt-3">
        <div className="flex items-center gap-2 border border-gray-200 rounded-2xl px-4 bg-white shadow-sm focus-within:border-gray-300 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type something..."
            disabled={sending || !bot}
            className="flex-1 py-3.5 text-sm bg-transparent focus:outline-none disabled:opacity-50 placeholder-gray-400"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || sending || !bot}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex justify-end items-center gap-3 mt-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.push("/onboarding/knowledge")}
          className="btn btn-white border border-gray-200 text-sm"
        >
          ย้อนกลับ
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="btn btn-black text-sm font-semibold"
        >
          ต่อไป
        </button>
      </div>
    </div>
  );
}
