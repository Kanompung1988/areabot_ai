"use client";
import { useState } from "react";
import {
  X, Calendar, Clock, User, Phone, Stethoscope,
  Pencil, ArrowRight, FileText, Bell, History, StickyNote,
} from "lucide-react";
import { Appointment, AppointmentStatus } from "@/lib/api";
import StatusBadge from "./StatusBadge";
import { SERVICE_COLORS } from "./AppointmentCard";

const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const THAI_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];

function formatApptDate(a: Appointment): string {
  const d = new Date(a.appointment_date + "T00:00:00");
  const start = a.start_time.slice(0, 5);
  const end = a.end_time.slice(0, 5);
  const startMin = parseInt(start.split(":")[0]) * 60 + parseInt(start.split(":")[1]);
  const endMin = parseInt(end.split(":")[0]) * 60 + parseInt(end.split(":")[1]);
  const durationMin = endMin - startMin;
  return `${THAI_DAYS[d.getDay()]} ${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} · ${start}–${end} · ${durationMin} นาที`;
}

const ALL_STATUSES: AppointmentStatus[] = [
  "รอยืนยัน", "จองแล้ว", "ยืนยัน", "ยืนยันแล้ว", "มาแล้ว", "ยกเลิกนัด",
];

interface AppointmentDetailProps {
  appointment: Appointment;
  onClose: () => void;
  onUpdate: (id: string, status: AppointmentStatus) => Promise<void>;
  onEdit: (a: Appointment) => void;
  onReschedule: (a: Appointment) => void;
}

export default function AppointmentDetail({
  appointment: a,
  onClose,
  onUpdate,
  onEdit,
  onReschedule,
}: AppointmentDetailProps) {
  const [loading, setLoading] = useState(false);
  const colors = SERVICE_COLORS[a.service_type as keyof typeof SERVICE_COLORS] ?? {
    bg: "bg-gray-50 border-gray-200",
    text: "text-gray-700",
    dot: "bg-gray-400",
  };

  async function handleStatusChange(s: AppointmentStatus) {
    setLoading(true);
    try {
      await onUpdate(a.id, s);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-[340px] flex-shrink-0 border-l border-gray-100 bg-white flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-sm text-gray-900">รายละเอียดนัด</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Service badge + status */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${colors.bg} ${colors.text}`}>
            {a.service_type}
          </span>
          <StatusBadge status={a.status as AppointmentStatus} />
        </div>
        <h3 className="mt-2 font-bold text-gray-900">
          {a.treatment ?? a.service_type}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">{a.customer_name}</p>
      </div>

      {/* Info rows */}
      <div className="px-4 space-y-2.5 py-3 border-t border-gray-50">
        <InfoRow icon={<Calendar size={14} />} label={formatApptDate(a)} />
        {a.doctor_name && (
          <InfoRow icon={<Stethoscope size={14} />} label={a.doctor_name} />
        )}
        {a.customer_phone && (
          <InfoRow icon={<Phone size={14} />} label={a.customer_phone} />
        )}
        {a.notes && (
          <InfoRow icon={<StickyNote size={14} />} label={a.notes} muted />
        )}
      </div>

      {/* Status changer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-2">เปลี่ยนสถานะ</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              disabled={loading || s === a.status}
              onClick={() => handleStatusChange(s)}
              className={`text-xs px-2 py-1 rounded-full border transition-opacity ${
                s === a.status
                  ? "opacity-50 cursor-default"
                  : "hover:opacity-80 cursor-pointer"
              }`}
            >
              <StatusBadge status={s} size="sm" />
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 border-t border-gray-100 space-y-2">
        <ActionBtn icon={<Pencil size={13} />} label="แก้ไขนัด" onClick={() => onEdit(a)} />
        <ActionBtn icon={<ArrowRight size={13} />} label="เลื่อนนัด" onClick={() => onReschedule(a)} />
        <ActionBtn icon={<FileText size={13} />} label="ประวัติเต็ม" onClick={() => {}} />
        <ActionBtn icon={<Bell size={13} />} label="Follow-up" onClick={() => {}} />
        <ActionBtn icon={<History size={13} />} label="ประวัติ" onClick={() => {}} />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, muted = false }: { icon: React.ReactNode; label: string; muted?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <span className={`text-sm ${muted ? "text-gray-400 italic" : "text-gray-700"}`}>{label}</span>
    </div>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </button>
  );
}
