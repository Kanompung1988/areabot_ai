"use client";
import { Appointment } from "@/lib/api";
import AppointmentCard from "./AppointmentCard";

const THAI_DAY_HEADERS = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

interface MonthViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onSelectAppointment: (a: Appointment) => void;
  onSelectDate: (d: Date) => void;
}

export default function MonthView({
  currentDate,
  appointments,
  onSelectAppointment,
  onSelectDate,
}: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  // Build calendar grid — start from Monday
  const firstDay = new Date(year, month, 1);
  // getDay(): 0=Sun,1=Mon,...,6=Sat → convert to Mon-first: Mon=0,...Sun=6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push(null);
    } else {
      cells.push(new Date(year, month, dayNum));
    }
  }

  // Group appointments by date string "YYYY-MM-DD"
  const byDate: Record<string, Appointment[]> = {};
  for (const a of appointments) {
    byDate[a.appointment_date] = [...(byDate[a.appointment_date] ?? []), a];
  }

  function isToday(d: Date) {
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }

  function toISO(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {THAI_DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="divide-y divide-gray-100">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-gray-100 min-h-[120px]">
            {week.map((day, di) => {
              if (!day) {
                return <div key={di} className="bg-gray-50/50 p-2" />;
              }
              const iso = toISO(day);
              const dayAppts = byDate[iso] ?? [];
              const visibleAppts = dayAppts.slice(0, 3);
              const overflow = dayAppts.length - 3;
              const todayStyle = isToday(day)
                ? "bg-blue-50"
                : "bg-white hover:bg-gray-50/60";

              return (
                <div
                  key={di}
                  className={`p-2 transition-colors ${todayStyle}`}
                >
                  {/* Date number */}
                  <button
                    onClick={() => onSelectDate(day)}
                    className={`w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full mb-1 transition-colors ${
                      isToday(day)
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {day.getDate()}
                  </button>

                  {/* Appointment chips */}
                  <div className="space-y-0.5">
                    {visibleAppts.map((a) => (
                      <AppointmentCard
                        key={a.id}
                        appointment={a}
                        onClick={() => onSelectAppointment(a)}
                        compact
                      />
                    ))}
                    {overflow > 0 && (
                      <button
                        onClick={() => onSelectDate(day)}
                        className="text-xs text-blue-500 hover:text-blue-700 pl-1"
                      >
                        +{overflow} อื่นๆ
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
