"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Spinner } from "@/components/ui/card";
import {
  useConfirmSession,
  useCorrectAttendance,
  useSessionRoster,
  type AttendanceStatus,
  type SessionStatus,
} from "@/lib/api/attendance-sessions";
import { STATUS_LABEL, STATUS_TONE, StatusPicker } from "./status-picker";

interface Edit {
  status: AttendanceStatus;
  minutesLate: number | null;
}

interface SessionPanelProps {
  sessionId: string;
  initialStatus: SessionStatus;
  header: {
    subjectName: string;
    className: string;
    startTime: string;
    endTime: string;
    isCourse: boolean;
  };
  onNotify: (message: string) => void;
}

const ORDER: AttendanceStatus[] = ["present", "late", "absent", "left_early", "excused"];

export function SessionPanel({ sessionId, initialStatus, header, onNotify }: SessionPanelProps) {
  const roster = useSessionRoster(sessionId);
  const confirmMutation = useConfirmSession();
  const correctMutation = useCorrectAttendance();

  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [confirmed, setConfirmed] = useState(initialStatus === "confirmed");
  const initedRef = useRef<string | null>(null);

  // Sessiya almashganda holatni tiklaymiz.
  useEffect(() => {
    initedRef.current = null;
    setConfirmed(initialStatus === "confirmed");
  }, [sessionId, initialStatus]);

  // Roster kelganda lokal tahrir nusxasini bir marta to'ldiramiz.
  useEffect(() => {
    if (!roster.data || initedRef.current === sessionId) return;
    initedRef.current = sessionId;
    setEdits(
      Object.fromEntries(
        roster.data.map((r) => [r.studentId, { status: r.status, minutesLate: r.minutesLate }]),
      ),
    );
  }, [roster.data, sessionId]);

  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = {
      present: 0,
      late: 0,
      absent: 0,
      left_early: 0,
      excused: 0,
    };
    for (const e of Object.values(edits)) c[e.status] += 1;
    return c;
  }, [edits]);

  const dirtyCount = useMemo(() => {
    if (!roster.data) return 0;
    return roster.data.filter((r) => {
      const e = edits[r.studentId];
      return e && (e.status !== r.status || (e.minutesLate ?? null) !== (r.minutesLate ?? null));
    }).length;
  }, [roster.data, edits]);

  function applyStatus(studentId: string, status: AttendanceStatus) {
    const prev = edits[studentId];
    const minutesLate = status === "late" ? prev?.minutesLate ?? 5 : null;
    setEdits((s) => ({ ...s, [studentId]: { status, minutesLate } }));
    if (confirmed) pushCorrection(studentId, status, minutesLate);
  }

  function applyMinutes(studentId: string, minutes: number) {
    setEdits((s) => ({ ...s, [studentId]: { ...s[studentId], minutesLate: minutes } }));
    if (confirmed) pushCorrection(studentId, "late", minutes);
  }

  function pushCorrection(studentId: string, status: AttendanceStatus, minutesLate: number | null) {
    correctMutation.mutate(
      {
        sessionId,
        studentId,
        input: {
          status,
          minutesLate: status === "late" ? minutesLate ?? 0 : undefined,
          reason: "Tuzatish",
        },
      },
      { onSuccess: () => onNotify("Tuzatildi") },
    );
  }

  function markAllPresent() {
    if (!roster.data) return;
    setEdits((s) => {
      const next = { ...s };
      for (const r of roster.data!) next[r.studentId] = { status: "present", minutesLate: null };
      return next;
    });
  }

  function confirm() {
    if (!roster.data) return;
    const entries = roster.data
      .filter((r) => {
        const e = edits[r.studentId];
        return e && (e.status !== r.status || (e.minutesLate ?? null) !== (r.minutesLate ?? null));
      })
      .map((r) => ({
        studentId: r.studentId,
        status: edits[r.studentId].status,
        minutesLate:
          edits[r.studentId].status === "late" ? edits[r.studentId].minutesLate ?? 0 : undefined,
      }));
    confirmMutation.mutate(
      { sessionId, entries },
      {
        onSuccess: () => {
          setConfirmed(true);
          onNotify("Davomat tasdiqlandi ✓");
        },
      },
    );
  }

  if (roster.isLoading) {
    return (
      <div className="card flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }
  if (roster.isError || !roster.data) {
    return (
      <div className="card py-16 text-center text-sm text-ink-muted">
        Roster yuklanmadi.{" "}
        <button className="text-accent underline" onClick={() => roster.refetch()}>
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Sarlavha */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-ink">{header.subjectName}</h3>
            <Badge tone={header.isCourse ? "accent" : "neutral"}>
              {header.isCourse ? "Kurs" : "Dars"}
            </Badge>
            {confirmed && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-positive">
                <ShieldCheck className="h-3.5 w-3.5" /> Tasdiqlangan
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-ink-muted">
            {header.className} · {header.startTime.slice(0, 5)}–{header.endTime.slice(0, 5)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!confirmed && (
            <Button variant="secondary" size="sm" onClick={markAllPresent}>
              <CheckCircle2 className="h-4 w-4" /> Hammasi keldi
            </Button>
          )}
          {!confirmed ? (
            <Button size="sm" onClick={confirm} loading={confirmMutation.isPending}>
              Tasdiqlash{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              {correctMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Tuzatish rejimi
            </span>
          )}
        </div>
      </div>

      {/* Hisob-kitob chiziqchasi */}
      <div className="flex flex-wrap gap-2 border-b border-line bg-parchment px-5 py-3">
        {ORDER.map((st) => (
          <span
            key={st}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs"
          >
            <Badge tone={STATUS_TONE[st]}>{counts[st]}</Badge>
            <span className="text-ink-soft">{STATUS_LABEL[st]}</span>
          </span>
        ))}
        <span className="ml-auto self-center text-xs text-ink-muted">
          Jami: {roster.data.length}
        </span>
      </div>

      {/* O'quvchilar */}
      <ul className="divide-y divide-line">
        {roster.data.map((r, idx) => {
          const edit = edits[r.studentId] ?? { status: r.status, minutesLate: r.minutesLate };
          return (
            <li
              key={r.studentId}
              className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-parchment/60"
            >
              <span className="w-6 text-right text-xs tabular-nums text-ink-muted">{idx + 1}</span>
              <span className="min-w-[10rem] flex-1 text-sm font-medium text-ink">
                {r.studentName}
                {r.source === "auto" && !confirmed && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-muted">
                    avto
                  </span>
                )}
              </span>

              {edit.status === "late" && (
                <label className="inline-flex items-center gap-1 text-xs text-ink-soft">
                  <Clock className="h-3.5 w-3.5" />
                  <input
                    type="number"
                    min={0}
                    max={600}
                    value={edit.minutesLate ?? 0}
                    onChange={(e) => applyMinutes(r.studentId, Number(e.target.value))}
                    className="h-7 w-14 rounded-md border border-line bg-surface px-2 text-center text-xs tabular-nums focus-visible:focus-ring"
                  />
                  daq.
                </label>
              )}

              <StatusPicker
                value={edit.status}
                onChange={(status) => applyStatus(r.studentId, status)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
