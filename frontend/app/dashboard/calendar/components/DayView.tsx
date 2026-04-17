"use client";
import { Appointment } from "@/lib/api";
import AppointmentCard from "./AppointmentCard";

const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 17; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}
TIME_SLOTS.push("18:00");

const THAI_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

const START_MIN = 8 * 60;
const SLOT_HEIGHT = 56;

interface DayViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onSelectAppointment: (a: Appointment) => void;
}

export default function DayView({ currentDate, appointments, onSelectAppointment }: DayViewProps) {
  const iso = toISO(currentDate);
  const dayAppts = appointments.filter((a) => a.appointment_date === iso);
  const isToday = toISO(new Date()) === iso;

  // Count available slots (slots without appointment)
  const occupiedSlots = new Set<string>();
  dayAppts.forEach((a) => {
    const sm = timeToMinutes(a.start_time);
    const em = timeToMinutes(a.end_time);
    for (let m = sm; m < em; m += 30) {
      occupiedSlots.add(`${Math.floor(m / 60)}:${m % 60 === 0 ? "00" : "30"}`);
    }
  });
  const freeSlots = TIME_SLOTS.length - 1 - occupiedSlots.size;

  return (
    <div className="flex-1 overflow-auto">
      {/* Day header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
            isToday ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          {currentDate.getDate()}
        </div>
        <div>
          <div className="font-semibold text-gray-900">
            {THAI_DAYS[currentDate.getDay()]} · {currentDate.getDate()} {THAI_MONTHS_SHORT[currentDate.getMonth()]}
            {isToday && <span className="ml-2 text-xs text-blue-600 font-normal">(ปัจจุบัน)</span>}
          </div>
          <div className="text-xs text-gray-400">
            {freeSlots} slot ว่าง · {dayAppts.length} นัด
          </div>
        </div>
      </div>

      {/* Time grid */}
      <div className="flex">
        {/* Time labels */}
        <div className="w-16 flex-shrink-0 border-r border-gray-100">
          {TIME_SLOTS.filter((_, i) => i % 2 === 0).map((slot) => (
            <div
              key={slot}
              className="text-right pr-3 text-xs text-gray-400"
              style={{ height: `${SLOT_HEIGHT * 2}px`, paddingTop: "4px" }}
            >
              {slot}
            </div>
          ))}
        </div>

        {/* Day column */}
        <div
          className="flex-1 relative"
          style={{ height: `${SLOT_HEIGHT * TIME_SLOTS.length}px` }}
        >
          {/* Slot dividers */}
          {TIME_SLOTS.map((slot, si) => (
            <div
              key={si}
              className={`absolute w-full border-t ${si % 2 === 0 ? "border-gray-200" : "border-gray-100"}`}
              style={{ top: `${si * SLOT_HEIGHT}px` }}
            />
          ))}

          {/* Appointment blocks */}
          {dayAppts.map((a) => {
            const startMin = timeToMinutes(a.start_time);
            const endMin = timeToMinutes(a.end_time);
            const top = ((startMin - START_MIN) / 30) * SLOT_HEIGHT;
            const height = Math.max(((endMin - startMin) / 30) * SLOT_HEIGHT - 4, SLOT_HEIGHT - 4);
            return (
              <div
                key={a.id}
                className="absolute left-2 right-2 z-10"
                style={{ top: `${top}px`, height: `${height}px` }}
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
      </div>
    </div>
  );
}
