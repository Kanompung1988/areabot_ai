"use client";
import { AppointmentStatus } from "@/lib/api";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  รอยืนยัน: {
    label: "รอยืนยัน",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  },
  จองแล้ว: {
    label: "จองแล้ว",
    className: "bg-purple-100 text-purple-700 border border-purple-200",
  },
  ยืนยัน: {
    label: "ยืนยัน",
    className: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  ยืนยันแล้ว: {
    label: "ยืนยันแล้ว",
    className: "bg-green-100 text-green-700 border border-green-200",
  },
  มาแล้ว: {
    label: "มาแล้ว ✓",
    className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  ยกเลิกนัด: {
    label: "ยกเลิกนัด",
    className: "bg-red-100 text-red-600 border border-red-200",
  },
};

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  };
  const sizeClass = size === "sm" ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
}
