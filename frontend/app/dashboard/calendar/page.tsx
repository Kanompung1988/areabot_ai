"use client";
import { useState, useEffect, useCallback } from "react";
import { Calendar } from "lucide-react";
import toast from "react-hot-toast";

import {
  appointmentApi,
  botsApi,
  Appointment,
  AppointmentStatus,
  AppointmentStats,
  AppointmentCreatePayload,
} from "@/lib/api";
import CalendarHeader, { CalendarView, CalendarFilters } from "./components/CalendarHeader";
import MonthView from "./components/MonthView";
import WeekView from "./components/WeekView";
import DayView from "./components/DayView";
import AppointmentDetail from "./components/AppointmentDetail";
import NewAppointmentModal from "./components/NewAppointmentModal";
import RescheduleModal from "./components/RescheduleModal";

// ── Helpers ─────────────────────────────────────────────────────────
function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthRange(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth();
  return {
    from: `${y}-${String(m + 1).padStart(2, "0")}-01`,
    to: `${y}-${String(m + 1).padStart(2, "0")}-${new Date(y, m + 1, 0).getDate()}`,
  };
}

function getWeekRange(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toISO(monday), to: toISO(sunday) };
}

// ── Page ─────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("เดือน");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [botId, setBotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState<CalendarFilters>({
    serviceType: null,
    status: null,
  });

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [dragPreset, setDragPreset] = useState<{ startTime: string; endTime: string } | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);

  // Load first available bot
  useEffect(() => {
    let cancelled = false;
    botsApi.list()
      .then((res) => {
        if (!cancelled && res.data?.length > 0) setBotId(res.data[0].id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Fetch appointments
  const fetchAppointments = useCallback(() => {
    if (!botId) return;
    setLoading(true);
    const range = view === "สัปดาห์" ? getWeekRange(currentDate) : getMonthRange(currentDate);
    Promise.all([
      appointmentApi.list(botId, { date_from: range.from, date_to: range.to }),
      appointmentApi.stats(botId, range.from, range.to),
    ])
      .then(([apptRes, statsRes]) => {
        setAppointments(apptRes.data);
        setStats(statsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [botId, view, currentDate]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // ── Navigation ──────────────────────────────────────
  function navigate(dir: -1 | 1) {
    const d = new Date(currentDate);
    if (view === "เดือน") d.setMonth(d.getMonth() + dir);
    else if (view === "สัปดาห์") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  }

  // ── Client-side filtering ──────────────────────────
  const filteredAppointments = appointments.filter((a) => {
    if (filters.serviceType && a.service_type !== filters.serviceType) return false;
    if (filters.status && a.status !== filters.status) return false;
    return true;
  });

  // ── CRUD ────────────────────────────────────────────
  async function handleCreate(data: AppointmentCreatePayload) {
    await appointmentApi.create(data);
    toast.success("บันทึกนัดเรียบร้อย");
    setShowNewModal(false);
    fetchAppointments();
  }

  async function handleUpdate(id: string, data: Partial<AppointmentCreatePayload>) {
    await appointmentApi.update(id, data);
    toast.success("แก้ไขนัดเรียบร้อย");
    setEditingAppointment(null);
    setSelected(null);
    fetchAppointments();
  }

  async function handleUpdateStatus(id: string, status: AppointmentStatus) {
    await appointmentApi.update(id, { status });
    toast.success("อัปเดตสถานะแล้ว");
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
  }

  async function handleReschedule(
    id: string,
    appointment_date: string,
    start_time: string,
    end_time: string
  ) {
    await appointmentApi.update(id, { appointment_date, start_time, end_time });
    toast.success("เลื่อนนัดเรียบร้อย");
    setReschedulingAppointment(null);
    setSelected(null);
    fetchAppointments();
  }

  // ── View content ────────────────────────────────────
  function renderView() {
    if (view === "เดือน") {
      return (
        <MonthView
          currentDate={currentDate}
          appointments={filteredAppointments}
          onSelectAppointment={setSelected}
          onSelectDate={(d) => {
            setCurrentDate(d);
            setView("วัน");
          }}
        />
      );
    }
    if (view === "สัปดาห์") {
      return (
        <WeekView
          currentDate={currentDate}
          appointments={filteredAppointments}
          onSelectAppointment={setSelected}
          onCreateSlot={(date, startTime, endTime) => {
            setModalDefaultDate(date);
            setShowNewModal(true);
            // store pre-fill times so modal can receive them
            setDragPreset({ startTime, endTime });
          }}
        />
      );
    }
    return (
      <DayView
        currentDate={currentDate}
        appointments={filteredAppointments}
        onSelectAppointment={setSelected}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        stats={stats}
        filters={filters}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={() => setCurrentDate(new Date())}
        onViewChange={setView}
        onNewAppointment={() => {
          setModalDefaultDate(toISO(currentDate));
          setShowNewModal(true);
        }}
        onFilterChange={setFilters}
      />

      {/* Body */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
        )}

        {/* Main calendar area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {renderView()}
        </div>

        {/* Right detail panel */}
        {selected && (
          <AppointmentDetail
            appointment={selected}
            onClose={() => setSelected(null)}
            onUpdate={handleUpdateStatus}
            onEdit={(a) => {
              setEditingAppointment(a);
              setSelected(null);
            }}
            onReschedule={(a) => {
              setReschedulingAppointment(a);
              setSelected(null);
            }}
          />
        )}
      </div>

      {/* New appointment modal */}
      {showNewModal && (
        botId ? (
          <NewAppointmentModal
            botId={botId}
            defaultDate={modalDefaultDate}
            defaultStartTime={dragPreset?.startTime}
            defaultEndTime={dragPreset?.endTime}
            onClose={() => { setShowNewModal(false); setDragPreset(null); }}
            onSubmit={handleCreate}
          />
        ) : (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-3">
              <Calendar size={36} className="mx-auto text-gray-300" />
              <h3 className="font-semibold text-gray-900">ยังไม่มี Bot</h3>
              <p className="text-sm text-gray-500">กรุณาสร้าง Bot ก่อนเพื่อเริ่มจัดการนัดหมาย</p>
              <div className="flex gap-2 justify-center pt-1">
                <button onClick={() => setShowNewModal(false)} className="btn btn-ghost btn-sm">ปิด</button>
                <a href="/dashboard/bots/new" className="btn btn-black btn-sm">สร้าง Bot</a>
              </div>
            </div>
          </div>
        )
      )}

      {/* Edit appointment modal */}
      {editingAppointment && botId && (
        <NewAppointmentModal
          botId={botId}
          appointment={editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onSubmit={handleCreate}
          onUpdate={handleUpdate}
        />
      )}

      {/* Reschedule modal */}
      {reschedulingAppointment && (
        <RescheduleModal
          appointment={reschedulingAppointment}
          onClose={() => setReschedulingAppointment(null)}
          onReschedule={handleReschedule}
        />
      )}
    </div>
  );
}
