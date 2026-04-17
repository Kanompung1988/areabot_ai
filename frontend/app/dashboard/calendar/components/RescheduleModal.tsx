"use client";
import { useState } from "react";
import { X, Calendar, Clock } from "lucide-react";
import { Appointment } from "@/lib/api";

const TIME_OPTIONS: string[] = [];
for (let h = 8; h <= 17; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}
TIME_OPTIONS.push("18:00");

const DURATIONS = ["30", "60", "90", "120"];

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function durationFromTimes(start: string, end: string): string {
  const [sh, sm] = start.slice(0, 5).split(":").map(Number);
  const [eh, em] = end.slice(0, 5).split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return ["30", "60", "90", "120"].includes(String(diff)) ? String(diff) : "60";
}

const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function formatApptDate(a: Appointment) {
  const d = new Date(a.appointment_date + "T00:00:00");
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} · ${a.start_time.slice(0, 5)}–${a.end_time.slice(0, 5)}`;
}

interface RescheduleModalProps {
  appointment: Appointment;
  onClose: () => void;
  onReschedule: (
    id: string,
    appointment_date: string,
    start_time: string,
    end_time: string
  ) => Promise<void>;
}

export default function RescheduleModal({
  appointment,
  onClose,
  onReschedule,
}: RescheduleModalProps) {
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState(appointment.appointment_date);
  const [newTime, setNewTime] = useState(appointment.start_time.slice(0, 5));
  const [duration, setDuration] = useState(
    durationFromTimes(appointment.start_time, appointment.end_time)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const end_time = addMinutes(newTime, parseInt(duration));
      await onReschedule(
        appointment.id,
        newDate,
        newTime + ":00",
        end_time + ":00"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">เลื่อนนัด</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Current appointment info */}
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-1">
            <p className="text-xs font-medium text-gray-500">นัดเดิม</p>
            <p className="text-sm font-semibold text-gray-900">{appointment.customer_name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar size={11} />
              {formatApptDate(appointment)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New date */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Calendar size={11} />
                วันที่ใหม่ *
              </label>
              <input
                required
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="input w-full"
              />
            </div>

            {/* New time + duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Clock size={11} />
                  เวลาเริ่มใหม่ *
                </label>
                <select
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="input w-full"
                >
                  {TIME_OPTIONS.slice(0, -1).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">ระยะเวลา</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="input w-full"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{d} นาที</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview new time */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700">
              นัดใหม่: {newDate} · {newTime}–{addMinutes(newTime, parseInt(duration))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-ghost"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn btn-black"
              >
                {loading ? "กำลังบันทึก..." : "ยืนยันเลื่อนนัด"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
