"use client";
import { Appointment, ServiceType } from "@/lib/api";

// Color coding ตาม Figma
export const SERVICE_COLORS: Record<ServiceType, { bg: string; text: string; dot: string }> = {
  ความงาม: { bg: "bg-pink-50 border-pink-200",   text: "text-pink-800",   dot: "bg-pink-400" },
  ผิวหนัง: { bg: "bg-orange-50 border-orange-200", text: "text-orange-800", dot: "bg-orange-400" },
  เลเซอร์:  { bg: "bg-purple-50 border-purple-200", text: "text-purple-800", dot: "bg-purple-400" },
  ทั่วไป:   { bg: "bg-blue-50 border-blue-200",   text: "text-blue-800",   dot: "bg-blue-400" },
};

const DEFAULT_COLOR = { bg: "bg-gray-50 border-gray-200", text: "text-gray-700", dot: "bg-gray-400" };

function formatTime(t: string) {
  // "09:00:00" → "09:00"
  return t.slice(0, 5);
}

function abbreviateName(name?: string) {
  if (!name) return "";
  const parts = name.replace(/^(นพ\.|พญ\.|ดร\.)\s*/g, "").trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1]?.[0] ?? ""}.`;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: () => void;
  compact?: boolean; // for month view chips
}

export default function AppointmentCard({ appointment, onClick, compact = false }: AppointmentCardProps) {
  const colors = SERVICE_COLORS[appointment.service_type as ServiceType] ?? DEFAULT_COLOR;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left px-1.5 py-0.5 rounded text-xs border truncate ${colors.bg} ${colors.text} hover:opacity-80 transition-opacity`}
      >
        <span className="font-medium">{formatTime(appointment.start_time)}</span>
        {appointment.doctor_name && (
          <span className="ml-1 opacity-75">{abbreviateName(appointment.doctor_name)}</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2 rounded-lg border ${colors.bg} ${colors.text} hover:opacity-90 transition-opacity`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
        <span className="font-semibold text-xs">{formatTime(appointment.start_time)}</span>
        {appointment.doctor_name && (
          <span className="text-xs opacity-75 truncate">{abbreviateName(appointment.doctor_name)}</span>
        )}
      </div>
      <div className="mt-0.5 text-xs font-medium truncate">
        {appointment.treatment ?? appointment.service_type}
      </div>
      <div className="text-xs opacity-60 truncate">{appointment.customer_name}</div>
    </button>
  );
}
