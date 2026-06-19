"use client";

import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/card";
import { loc } from "@/lib/utils";
import { useStudentProgress } from "@/lib/api/gradebook";

interface Props {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  quarterId?: string;
}

export function StudentDetailModal({ open, onClose, studentId, studentName, quarterId }: Props) {
  const { data, isLoading } = useStudentProgress(open ? studentId : null, quarterId);

  return (
    <Modal open={open} onClose={onClose} title={studentName} subtitle="O‘quvchi progressi">
      {isLoading || !data ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="GPA" value={data.gpa != null ? data.gpa.toFixed(1) : "—"} />
            <Stat label="Joriy GPA" value={data.currentGpa != null ? data.currentGpa.toFixed(1) : "—"} />
            <Stat label="Progress" value={`${data.progress}%`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Pill label="Eng yaxshi fan" value={data.bestSubject ? loc(data.bestSubject.name) : "—"} tone="positive" />
            <Pill label="Qiyin fan" value={data.worstSubject ? loc(data.worstSubject.name) : "—"} tone="negative" />
          </div>

          <div className="rounded-lg border border-line">
            <p className="border-b border-line px-3 py-2 text-xs font-medium text-ink-muted">Fanlar bo‘yicha</p>
            <ul className="divide-y divide-line">
              {data.subjects.map((s) => (
                <li key={s.subjectId} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="text-ink">{loc(s.name)}</span>
                  <span className="flex items-center gap-4 text-ink-muted">
                    <span>Baho: <b className="text-ink">{s.average != null ? s.average.toFixed(2) : "—"}</b></span>
                    <span>Davomat: <b className="text-ink">{s.attendancePct}%</b></span>
                  </span>
                </li>
              ))}
              {data.subjects.length === 0 && (
                <li className="px-3 py-4 text-center text-sm text-ink-muted">Ma’lumot yo‘q.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3 text-center">
      <p className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function Pill({ label, value, tone }: { label: string; value: string; tone: "positive" | "negative" }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={tone === "positive" ? "mt-1 font-medium text-positive" : "mt-1 font-medium text-negative"}>{value}</p>
    </div>
  );
}
