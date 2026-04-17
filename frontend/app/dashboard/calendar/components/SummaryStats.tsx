"use client";
import { AppointmentStats } from "@/lib/api";

interface SummaryStatsProps {
  stats: AppointmentStats;
}

export default function SummaryStats({ stats }: SummaryStatsProps) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <Stat label="นัด" value={stats.total} color="text-gray-700" />
      <Divider />
      <Stat label="ยืนยัน" value={stats.confirmed} color="text-blue-600" />
      <Divider />
      <Stat label="consult" value={stats.consult} color="text-purple-600" />
      <Divider />
      <Stat label="กำลังนัด" value={stats.pending} color="text-orange-500" />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className={`font-medium ${color}`}>
      {value} <span className="font-normal text-gray-500">{label}</span>
    </span>
  );
}

function Divider() {
  return <span className="text-gray-300 select-none">·</span>;
}
