"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ClipboardCheck } from "lucide-react";
import { AgendaCard } from "@/components/attendance/agenda-card";
import { SessionPanel } from "@/components/attendance/session-panel";
import { Spinner } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { PageHeader } from "@/components/ui/page-header";
import { useCan } from "@/lib/auth/use-can";
import { useAgenda, useOpenSession, type AgendaItem } from "@/lib/api/attendance-sessions";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Selection {
  sessionId: string;
  status: "scheduled" | "open" | "confirmed" | "cancelled";
  header: {
    subjectName: string;
    className: string;
    startTime: string;
    endTime: string;
    isCourse: boolean;
  };
}

export default function TeacherAttendancePage() {
  const [date, setDate] = useState(today());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [openingSlot, setOpeningSlot] = useState<string | null>(null);
  const can = useCan();
  const canOpenSession = can("class-sessions.create");
  const [toast, setToast] = useState<string | null>(null);

  const agenda = useAgenda(date);
  const openSession = useOpenSession();

  // Sana o'zgarsa tanlovni tozalaymiz.
  useEffect(() => setSelection(null), [date]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  function headerOf(item: AgendaItem) {
    return {
      subjectName: item.subjectName,
      className: item.className,
      startTime: item.startTime,
      endTime: item.endTime,
      isCourse: item.sessionType === "course",
    };
  }

  function handleSelect(item: AgendaItem) {
    // Sessiya ochish — yangi yozuv yaratadi; huquqsiz foydalanuvchi faqat
    // allaqachon ochilgan sessiyani ko'ra oladi.
    if (!item.sessionId && !canOpenSession) {
      setToast("Sessiya ochish uchun ruxsatingiz yo‘q");
      return;
    }
    if (item.sessionId) {
      setSelection({ sessionId: item.sessionId, status: item.status, header: headerOf(item) });
      return;
    }
    setOpeningSlot(item.slotId);
    openSession.mutate(
      { slotId: item.slotId, date },
      {
        onSuccess: (res) => {
          setSelection({
            sessionId: res.session.id,
            status: res.session.status,
            header: headerOf(item),
          });
          setOpeningSlot(null);
        },
        onError: () => {
          setToast("Sessiyani ochib bo‘lmadi");
          setOpeningSlot(null);
        },
      },
    );
  }

  return (
    <div>
      <PageHeader
        title="O‘qituvchi davomati"
        subtitle="Kun darslaringizni tanlab, davomatni belgilang va tasdiqlang."
        action={
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-ink-muted" />
            <DateInput value={date} onChange={setDate} />
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(280px,360px)_1fr]">
        {/* Chap: kun agendasi */}
        <div className="space-y-3">
          {agenda.isLoading ? (
            <div className="card flex justify-center py-16">
              <Spinner />
            </div>
          ) : agenda.data && agenda.data.length > 0 ? (
            agenda.data.map((item) => (
              <AgendaCard
                key={item.slotId}
                item={item}
                active={selection?.sessionId === item.sessionId && item.sessionId != null}
                loading={openingSlot === item.slotId}
                onClick={() => handleSelect(item)}
              />
            ))
          ) : (
            <div className="card px-5 py-12 text-center text-sm text-ink-muted">
              Bu sanada darslar topilmadi.
            </div>
          )}
        </div>

        {/* O'ng: davomat paneli */}
        <div>
          {selection ? (
            <SessionPanel
              sessionId={selection.sessionId}
              initialStatus={selection.status}
              header={selection.header}
              onNotify={setToast}
            />
          ) : (
            <div className="card flex flex-col items-center justify-center gap-3 py-24 text-center">
              <ClipboardCheck className="h-10 w-10 text-ink-muted/60" />
              <p className="text-sm text-ink-muted">
                Chapdan darsni tanlang — davomat ro‘yxati shu yerda ochiladi.
              </p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-paper shadow-card">
          {toast}
        </div>
      )}
    </div>
  );
}
