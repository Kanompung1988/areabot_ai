"use client";
import { useState } from "react";
import { Inbox, Bot, CheckCheck, Circle, Clock, Search } from "lucide-react";

interface Message {
  id: string;
  botName: string;
  sender: string;
  preview: string;
  time: string;
  read: boolean;
  tag?: string;
}

const INBOX: Message[] = [
  {
    id: "1",
    botName: "Bot ร้านกาแฟ",
    sender: "ลูกค้า #1042",
    preview: "สวัสดีครับ อยากทราบว่าร้านเปิดกี่โมงครับ",
    time: "5 นาทีที่แล้ว",
    read: false,
    tag: "คำถามทั่วไป",
  },
  {
    id: "2",
    botName: "Bot VIP",
    sender: "คุณสมชาย",
    preview: "ขอบคุณมากครับ บอทตอบได้ดีมาก",
    time: "23 นาทีที่แล้ว",
    read: false,
    tag: "ความคิดเห็น",
  },
  {
    id: "3",
    botName: "Bot ร้านกาแฟ",
    sender: "ลูกค้า #987",
    preview: "มีเมนูอะไรบ้างคะ ราคาเท่าไหร่",
    time: "1 ชั่วโมงที่แล้ว",
    read: true,
    tag: "สินค้า",
  },
  {
    id: "4",
    botName: "Bot ร้านกาแฟ",
    sender: "ลูกค้า #1100",
    preview: "ส่งได้ไหมครับ ถึง ลาดพร้าว 71",
    time: "2 ชั่วโมงที่แล้ว",
    read: true,
    tag: "การจัดส่ง",
  },
  {
    id: "5",
    botName: "Bot VIP",
    sender: "คุณนิดา",
    preview: "อยากสั่งซื้อสินค้า 3 ชิ้น มีโปรไหมคะ",
    time: "3 ชั่วโมงที่แล้ว",
    read: true,
  },
  {
    id: "6",
    botName: "Bot ร้านกาแฟ",
    sender: "ลูกค้า #755",
    preview: "ชำระเงินด้วย QR Code ได้ไหมคะ",
    time: "เมื่อวาน",
    read: true,
    tag: "การชำระเงิน",
  },
];

const TAG_COLORS: Record<string, string> = {
  คำถามทั่วไป: "bg-blue-50 text-blue-600",
  ความคิดเห็น: "bg-green-50 text-green-600",
  สินค้า: "bg-purple-50 text-purple-600",
  การจัดส่ง: "bg-orange-50 text-orange-600",
  การชำระเงิน: "bg-yellow-50 text-yellow-700",
};

export default function InboxPage() {
  const [messages, setMessages] = useState(INBOX);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Message | null>(null);

  const unread = messages.filter((m) => !m.read).length;

  const filtered = messages.filter(
    (m) =>
      m.sender.toLowerCase().includes(search.toLowerCase()) ||
      m.preview.toLowerCase().includes(search.toLowerCase()) ||
      m.botName.toLowerCase().includes(search.toLowerCase()),
  );

  const markRead = (id: string) =>
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, read: true } : m)),
    );

  const markAllRead = () =>
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-0.5">
            Inbox
          </h1>
          <p className="text-gray-400 text-sm">
            {unread > 0 ? `${unread} ข้อความยังไม่ได้อ่าน` : "อ่านทั้งหมดแล้ว"}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-50"
          >
            <CheckCheck size={14} /> อ่านทั้งหมด
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Message list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="ค้นหา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-8 h-9 text-sm w-full"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Inbox size={28} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">ไม่พบข้อความ</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => {
                    setSelected(msg);
                    markRead(msg.id);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    selected?.id === msg.id
                      ? "border-gray-300 bg-gray-50 shadow-sm"
                      : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {!msg.read && (
                        <Circle
                          size={7}
                          className="fill-blue-500 text-blue-500 flex-shrink-0"
                        />
                      )}
                      <span
                        className={`text-sm truncate ${msg.read ? "text-gray-600" : "font-bold text-gray-900"}`}
                      >
                        {msg.sender}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                      <Clock size={10} /> {msg.time}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mb-1.5">
                    {msg.preview}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Bot size={10} /> {msg.botName}
                    </span>
                    {msg.tag && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${TAG_COLORS[msg.tag] ?? "bg-gray-100 text-gray-500"}`}
                      >
                        {msg.tag}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {selected ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-bold text-gray-900">{selected.sender}</p>
                  <span className="text-xs text-gray-400">{selected.time}</span>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Bot size={11} /> {selected.botName}
                </p>
              </div>

              {/* Chat bubble */}
              <div className="flex-1 p-5 space-y-3 overflow-y-auto">
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm text-gray-800">{selected.preview}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-gray-900 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm text-white">
                      สวัสดีครับ ยินดีช่วยเหลือ! 😊
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 text-right">
                      Bot
                    </p>
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="px-5 py-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    placeholder="พิมพ์ข้อความ..."
                    className="input flex-1 h-9 text-sm"
                    disabled
                  />
                  <button
                    disabled
                    className="btn btn-black h-9 px-4 text-sm opacity-40 cursor-not-allowed"
                  >
                    ส่ง
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  การตอบกลับด้วยตนเองจะเปิดใช้งานเร็วๆ นี้
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-24 text-center text-gray-400">
              <Inbox size={36} className="mb-3 text-gray-200" />
              <p className="font-medium text-gray-500 mb-1">เลือกข้อความ</p>
              <p className="text-sm">คลิกที่ข้อความทางซ้ายเพื่อดูรายละเอียด</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
