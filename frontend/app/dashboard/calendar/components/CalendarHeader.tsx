"use client";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Filter, X } from "lucide-react";
import { AppointmentStats, AppointmentStatus, ServiceType } from "@/lib/api";
import SummaryStats from "./SummaryStats";

export type CalendarView = "วัน" | "สัปดาห์" | "เดือน";

export interface CalendarFilters {
  serviceType: ServiceType | null;
  status: AppointmentStatus | null;
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const SERVICE_TYPES: ServiceType[] = ["ความงาม", "ผิวหนัง", "เลเซอร์", "ทั่วไป"];
const ALL_STATUSES: AppointmentStatus[] = [
  "รอยืนยัน", "จองแล้ว", "ยืนยัน", "ยืนยันแล้ว", "มาแล้ว", "ยกเลิกนัด",
];

const SERVICE_COLORS: Record<ServiceType, string> = {
  ความงาม: "text-pink-700 bg-pink-50 border-pink-200",
  ผิวหนัง: "text-orange-700 bg-orange-50 border-orange-200",
  เลเซอร์: "text-purple-700 bg-purple-50 border-purple-200",
  ทั่วไป: "text-blue-700 bg-blue-50 border-blue-200",
};

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  stats: AppointmentStats | null;
  filters: CalendarFilters;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (v: CalendarView) => void;
  onNewAppointment: () => void;
  onFilterChange: (f: CalendarFilters) => void;
}

export default function CalendarHeader({
  currentDate,
  view,
  stats,
  filters,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  onNewAppointment,
  onFilterChange,
}: CalendarHeaderProps) {
  const buddhistYear = currentDate.getFullYear() + 543;
  const monthLabel = THAI_MONTHS[currentDate.getMonth()];
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const activeCount = (filters.serviceType ? 1 : 0) + (filters.status ? 1 : 0);

  function clearFilters() {
    onFilterChange({ serviceType: null, status: null });
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white gap-3 flex-wrap">
      {/* Left: navigation + month label */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          วันนี้
        </button>
        <button
          onClick={onPrev}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={onNext}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
        <h2 className="text-base font-semibold text-gray-900 ml-1">
          {view === "วัน"
            ? formatThaiDate(currentDate)
            : `${monthLabel} ${buddhistYear}`}
        </h2>
      </div>

      {/* Center: summary stats */}
      {stats && (
        <div className="hidden md:block">
          <SummaryStats stats={stats} />
        </div>
      )}

      {/* Right: view switcher + filter + new appt */}
      <div className="flex items-center gap-2">
        {/* View switcher */}
        <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-sm">
          {(["วัน", "สัปดาห์", "เดือน"] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1.5 transition-colors ${
                view === v
                  ? "bg-gray-900 text-white font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Filter button + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className={`flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 transition-colors ${
              activeCount > 0
                ? "bg-gray-900 text-white border-gray-900"
                : "text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Filter size={13} />
            ตัวกรอง
            {activeCount > 0 && (
              <span className="ml-0.5 bg-white text-gray-900 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-30 p-4 space-y-4">
              {/* Service type */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">ประเภทบริการ</p>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_TYPES.map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        onFilterChange({
                          ...filters,
                          serviceType: filters.serviceType === s ? null : s,
                        })
                      }
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                        filters.serviceType === s
                          ? SERVICE_COLORS[s]
                          : "text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">สถานะ</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        onFilterChange({
                          ...filters,
                          status: filters.status === s ? null : s,
                        })
                      }
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                        filters.status === s
                          ? "bg-gray-900 text-white border-gray-900"
                          : "text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear */}
              {activeCount > 0 && (
                <button
                  onClick={() => { clearFilters(); setOpen(false); }}
                  className="w-full text-xs text-gray-400 hover:text-gray-700 flex items-center justify-center gap-1 pt-1"
                >
                  <X size={11} />
                  ล้างตัวกรอง
                </button>
              )}
            </div>
          )}
        </div>

        {/* New appointment */}
        <button
          onClick={onNewAppointment}
          className="flex items-center gap-1.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg px-3 py-1.5 transition-colors"
        >
          <Plus size={14} />
          นัดใหม่
        </button>
      </div>
    </div>
  );
}

function formatThaiDate(d: Date) {
  const THAI_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];
  const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${THAI_DAYS[d.getDay()]} ${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]}`;
}
