"use client";
import { useState, useRef, useCallback } from "react";
import { Appointment } from "@/lib/api";
import AppointmentCard from "./AppointmentCard";

const THAI_DAYS_SHORT = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

// Time slots: 08:00 – 18:00 in 30-min intervals
const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 17; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}
TIME_SLOTS.push("18:00");

function getWeekDates(currentDate: Date): Date[] {
  const d = new Date(currentDate);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d);
    dd.setDate(d.getDate() + i);
    return dd;
  });
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function slotIndexToTime(idx: number) {
  // idx 0 = 08:00, idx 1 = 08:30, ...
  const totalMinutes = 8 * 60 + idx * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

interface DragState {
  dateIdx: number;
  slotStart: number;
  slotEnd: number;
}

interface WeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onSelectAppointment: (a: Appointment) => void;
  onCreateSlot?: (date: string, startTime: string, endTime: string) => void;
}

export default function WeekView({
  currentDate,
  appointments,
  onSelectAppointment,
  onCreateSlot,
}: WeekViewProps) {
  const today = new Date();
  const weekDates = getWeekDates(currentDate);

  const [drag, setDrag] = useState<DragState | null>(null);
  const isDragging = useRef(false);

  const byDate: Record<string, Appointment[]> = {};
  for (const a of appointments) {
    byDate[a.appointment_date] = [...(byDate[a.appointment_date] ?? []), a];
  }

  const START_MIN = 8 * 60;
  const SLOT_HEIGHT = 48;

  function isToday(d: Date) {
    return toISO(d) === toISO(today);
  }

  const getSlotFromY = useCallback((y: number, containerTop: number) => {
    const relY = y - containerTop;
    return Math.max(0, Math.min(TIME_SLOTS.length - 2, Math.floor(relY / SLOT_HEIGHT)));
  }, []);

  function handleMouseDown(dateIdx: number, e: React.MouseEvent<HTMLDivElement>) {
    if (!onCreateSlot) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const slot = getSlotFromY(e.clientY, rect.top);
    isDragging.current = true;
    setDrag({ dateIdx, slotStart: slot, slotEnd: slot });
  }

  function handleMouseMove(dateIdx: number, e: React.MouseEvent<HTMLDivElement>) {
    if (!isDragging.current || !drag || drag.dateIdx !== dateIdx) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const slot = getSlotFromY(e.clientY, rect.top);
    setDrag((prev) => prev ? { ...prev, slotEnd: slot } : null);
  }

  function handleMouseUp(dateIdx: number) {
    if (!isDragging.current || !drag || !onCreateSlot) {
      isDragging.current = false;
      setDrag(null);
      return;
    }
    isDragging.current = false;
    const minSlot = Math.min(drag.slotStart, drag.slotEnd);
    const maxSlot = Math.max(drag.slotStart, drag.slotEnd);
    const startTime = slotIndexToTime(minSlot);
    // End time = next slot after maxSlot (at least 30-min duration)
    const endTime = slotIndexToTime(maxSlot + 1);
    const date = toISO(weekDates[dateIdx]);
    setDrag(null);
    onCreateSlot(date, startTime, endTime);
  }

  return (
    <div
      className="flex-1 overflow-auto select-none"
      onMouseLeave={() => { isDragging.current = false; setDrag(null); }}
    >
      {/* Day headers */}
      <div className="flex border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="w-14 flex-shrink-0" />
        {weekDates.map((d, i) => (
          <div
            key={i}
            className={`flex-1 py-2 text-center text-xs border-l border-gray-100 ${
              isToday(d) ? "bg-blue-50" : ""
            }`}
          >
            <div className="text-gray-400">{THAI_DAYS_SHORT[i]}</div>
            <div
              className={`mt-0.5 w-7 h-7 rounded-full mx-auto flex items-center justify-center font-semibold text-sm ${
                isToday(d) ? "bg-blue-600 text-white" : "text-gray-700"
              }`}
            >
              {d.getDate()}
            </div>
            <div className="text-gray-400 text-xs">{THAI_MONTHS_SHORT[d.getMonth()]}</div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex">
        {/* Time labels */}
        <div className="w-14 flex-shrink-0">
          {TIME_SLOTS.filter((_, i) => i % 2 === 0).map((slot) => (
            <div
              key={slot}
              className="text-right pr-2 text-xs text-gray-400"
              style={{ height: `${SLOT_HEIGHT * 2}px`, paddingTop: "2px" }}
            >
              {slot}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDates.map((d, di) => {
          const iso = toISO(d);
          const dayAppts = byDate[iso] ?? [];
          const isDragCol = drag?.dateIdx === di;
          const dragMin = drag ? Math.min(drag.slotStart, drag.slotEnd) : -1;
          const dragMax = drag ? Math.max(drag.slotStart, drag.slotEnd) : -1;

          return (
            <div
              key={di}
              className={`flex-1 border-l border-gray-100 relative cursor-cell ${
                isToday(d) ? "bg-blue-50/30" : ""
              }`}
              style={{ height: `${SLOT_HEIGHT * TIME_SLOTS.length}px` }}
              onMouseDown={(e) => handleMouseDown(di, e)}
              onMouseMove={(e) => handleMouseMove(di, e)}
              onMouseUp={() => handleMouseUp(di)}
            >
              {/* 30-min slot dividers */}
              {TIME_SLOTS.map((_, si) => (
                <div
                  key={si}
                  className={`absolute w-full border-t ${
                    si % 2 === 0 ? "border-gray-100" : "border-gray-50"
                  }`}
                  style={{ top: `${si * SLOT_HEIGHT}px` }}
                />
              ))}

              {/* Drag selection highlight */}
              {isDragCol && drag && dragMin >= 0 && (
                <div
                  className="absolute left-0.5 right-0.5 bg-blue-200/60 border border-blue-400 rounded-md z-20 pointer-events-none"
                  style={{
                    top: `${dragMin * SLOT_HEIGHT + 1}px`,
                    height: `${(dragMax - dragMin + 1) * SLOT_HEIGHT - 2}px`,
                  }}
                >
                  <span className="text-[10px] text-blue-700 font-medium px-1 pt-0.5 block">
                    {slotIndexToTime(dragMin).slice(0, 5)} – {slotIndexToTime(dragMax + 1).slice(0, 5)}
                  </span>
                </div>
              )}

              {/* Appointment blocks */}
              {dayAppts.map((a) => {
                const startMin = timeToMinutes(a.start_time);
                const endMin = timeToMinutes(a.end_time);
                const top = ((startMin - START_MIN) / 30) * SLOT_HEIGHT;
                const height = Math.max(((endMin - startMin) / 30) * SLOT_HEIGHT - 2, SLOT_HEIGHT - 2);
                return (
                  <div
                    key={a.id}
                    className="absolute left-0.5 right-0.5 z-10"
                    style={{ top: `${top}px`, height: `${height}px` }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <AppointmentCard
                      appointment={a}
                      onClick={() => onSelectAppointment(a)}
                      compact={false}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
