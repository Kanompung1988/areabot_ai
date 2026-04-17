"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Appointment, AppointmentCreatePayload, AppointmentStatus, ServiceType } from "@/lib/api";

const SERVICE_TYPES: ServiceType[] = ["ความงาม", "ผิวหนัง", "เลเซอร์", "ทั่วไป"];

const TREATMENTS: Record<ServiceType, string[]> = {
  ความงาม: ["โบท็อกซ์", "ฟิลเลอร์ปาก", "ร้อยไหม", "ฉีดวิตามิน", "ดูดไขมัน"],
  ผิวหนัง: ["เลเซอร์หน้าใส", "เลเซอร์ขน", "ฝ้า/กระ", "รักษาสิว"],
  เลเซอร์: ["เลเซอร์หน้าใส", "เลเซอร์ขน", "Pico Laser", "Ulthera"],
  ทั่วไป: ["ตรวจสุขภาพ", "ลดน้ำหนัก", "Consult ฟรี", "ติดตามผล", "ขูดหินปูน"],
};

const DURATIONS = ["30", "60", "90", "120"];

// Time slots 08:00–18:00, 30 min intervals
const TIME_OPTIONS: string[] = [];
for (let h = 8; h <= 17; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}
TIME_OPTIONS.push("18:00");

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMin = h * 60 + m + minutes;
  return `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
}

function durationFromTimes(start: string, end: string): string {
  const [sh, sm] = start.slice(0, 5).split(":").map(Number);
  const [eh, em] = end.slice(0, 5).split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  const valid = ["30", "60", "90", "120"];
  return valid.includes(String(diff)) ? String(diff) : "60";
}

interface NewAppointmentModalProps {
  botId: string;
  defaultDate?: string; // "YYYY-MM-DD"
  defaultStartTime?: string; // "HH:MM:SS" from drag
  defaultEndTime?: string;   // "HH:MM:SS" from drag
  conversationId?: string;
  /** When provided the modal operates in edit mode */
  appointment?: Appointment;
  onClose: () => void;
  onSubmit: (data: AppointmentCreatePayload) => Promise<void>;
  onUpdate?: (id: string, data: Partial<AppointmentCreatePayload>) => Promise<void>;
}

export default function NewAppointmentModal({
  botId,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  conversationId,
  appointment,
  onClose,
  onSubmit,
  onUpdate,
}: NewAppointmentModalProps) {
  const isEdit = !!appointment;
  const today = new Date().toISOString().slice(0, 10);

  // Derive drag duration
  const dragDuration = (() => {
    if (!defaultStartTime || !defaultEndTime) return null;
    const [sh, sm] = defaultStartTime.slice(0, 5).split(":").map(Number);
    const [eh, em] = defaultEndTime.slice(0, 5).split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return ["30", "60", "90", "120"].includes(String(diff)) ? String(diff) : "60";
  })();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_name: appointment?.customer_name ?? "",
    customer_phone: appointment?.customer_phone ?? "",
    doctor_name: appointment?.doctor_name ?? "",
    service_type: (appointment?.service_type as ServiceType) ?? ("ความงาม" as ServiceType),
    treatment: appointment?.treatment ?? "",
    appointment_date: appointment?.appointment_date ?? defaultDate ?? today,
    start_time: appointment
      ? appointment.start_time.slice(0, 5)
      : (defaultStartTime?.slice(0, 5) ?? "09:00"),
    duration: appointment
      ? durationFromTimes(appointment.start_time, appointment.end_time)
      : (dragDuration ?? "60"),
    status: (appointment?.status as AppointmentStatus) ?? ("รอยืนยัน" as AppointmentStatus),
    notes: appointment?.notes ?? "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer_name.trim()) return;
    setLoading(true);
    try {
      const end_time = addMinutes(form.start_time, parseInt(form.duration));
      const payload: AppointmentCreatePayload = {
        bot_id: botId,
        conversation_id: conversationId,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone || undefined,
        doctor_name: form.doctor_name || undefined,
        service_type: form.service_type,
        treatment: form.treatment || undefined,
        appointment_date: form.appointment_date,
        start_time: form.start_time + ":00",
        end_time: end_time + ":00",
        status: form.status,
        notes: form.notes || undefined,
      };
      if (isEdit && appointment && onUpdate) {
        await onUpdate(appointment.id, payload);
      } else {
        await onSubmit(payload);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isEdit ? "แก้ไขนัด" : "+ นัดใหม่"}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Customer name */}
          <Field label="ชื่อลูกค้า *">
            <input
              required
              type="text"
              value={form.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
              placeholder="ชื่อ-นามสกุล"
              className="input w-full"
            />
          </Field>

          {/* Phone */}
          <Field label="เบอร์โทร">
            <input
              type="tel"
              value={form.customer_phone}
              onChange={(e) => set("customer_phone", e.target.value)}
              placeholder="08x-xxx-xxxx"
              className="input w-full"
            />
          </Field>

          {/* Doctor */}
          <Field label="แพทย์ผู้ดูแล">
            <input
              type="text"
              value={form.doctor_name}
              onChange={(e) => set("doctor_name", e.target.value)}
              placeholder="ชื่อแพทย์"
              className="input w-full"
            />
          </Field>

          {/* Service type + treatment */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="ประเภทบริการ *">
              <select
                required
                value={form.service_type}
                onChange={(e) => {
                  set("service_type", e.target.value);
                  set("treatment", "");
                }}
                className="input w-full"
              >
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="การรักษา">
              <select
                value={form.treatment}
                onChange={(e) => set("treatment", e.target.value)}
                className="input w-full"
              >
                <option value="">-- เลือก --</option>
                {TREATMENTS[form.service_type].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Date + time + duration */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="วันที่ *">
              <input
                required
                type="date"
                value={form.appointment_date}
                onChange={(e) => set("appointment_date", e.target.value)}
                className="input w-full"
              />
            </Field>
            <Field label="เวลาเริ่ม *">
              <select
                required
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
                className="input w-full"
              >
                {TIME_OPTIONS.slice(0, -1).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="ระยะเวลา">
              <select
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                className="input w-full"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} นาที</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Status */}
          <Field label="สถานะ">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as AppointmentStatus)}
              className="input w-full"
            >
              <option value="รอยืนยัน">รอยืนยัน</option>
              <option value="จองแล้ว">จองแล้ว</option>
              <option value="ยืนยัน">ยืนยัน</option>
              <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
              <option value="มาแล้ว">มาแล้ว</option>
              <option value="ยกเลิกนัด">ยกเลิกนัด</option>
            </select>
          </Field>

          {/* Notes */}
          <Field label="หมายเหตุ">
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="แพ้ยา, ขอรูป before, ฯลฯ"
              className="input w-full resize-none"
            />
          </Field>

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
              {loading ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "บันทึกนัด"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}
