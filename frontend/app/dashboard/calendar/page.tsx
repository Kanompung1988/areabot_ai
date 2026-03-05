"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const EVENTS: Record<string, { title: string; color: string }[]> = {
  "2026-03-05": [
    { title: "Bot Review Meeting", color: "bg-blue-100 text-blue-700" },
  ],
  "2026-03-10": [
    { title: "ส่ง Sprint #4", color: "bg-green-100 text-green-700" },
  ],
  "2026-03-15": [
    { title: "Demo Day", color: "bg-purple-100 text-purple-700" },
    { title: "Bot Training", color: "bg-orange-100 text-orange-700" },
  ],
  "2026-03-20": [
    { title: "รายงานประจำเดือน", color: "bg-gray-100 text-gray-600" },
  ],
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CalendarPage() {
  const today = new Date(2026, 2, 5); // March 5, 2026
  const [current, setCurrent] = useState({ year: 2026, month: 2 }); // 0-indexed month
  const [selected, setSelected] = useState<string | null>("2026-03-05");

  const { year, month } = current;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prev = () =>
    setCurrent(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    );
  const next = () =>
    setCurrent(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    );

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedEvents = selected ? (EVENTS[selected] ?? []) : [];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-1">
          ปฏิทิน
        </h1>
        <p className="text-gray-400 text-sm">กำหนดการและ Events</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prev}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
            >
              <ChevronLeft size={17} />
            </button>
            <h2 className="font-bold text-gray-900">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={next}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold text-gray-400 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();
              const isSelected = dateKey === selected;
              const hasEvents = !!EVENTS[dateKey];
              return (
                <button
                  key={i}
                  onClick={() => setSelected(dateKey)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-gray-900 text-white"
                      : isToday
                        ? "bg-gray-100 text-gray-900 font-bold"
                        : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {day}
                  {hasEvents && (
                    <span
                      className={`absolute bottom-1 w-1 h-1 rounded-full ${
                        isSelected ? "bg-white" : "bg-gray-400"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Events sidebar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={15} className="text-gray-400" />
            {selected
              ? `${parseInt(selected.split("-")[2])} ${MONTHS[parseInt(selected.split("-")[1]) - 1]}`
              : "เลือกวันที่"}
          </h3>
          {selectedEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedEvents.map((ev, i) => (
                <div
                  key={i}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium ${ev.color}`}
                >
                  {ev.title}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Calendar size={28} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">ไม่มีกำหนดการ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
