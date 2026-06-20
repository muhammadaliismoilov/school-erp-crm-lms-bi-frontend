"use client";

import { useEffect, useState } from "react";
import { Brain, GraduationCap, Save } from "lucide-react";
import {
  useConclusion,
  useUpsertConclusion,
} from "@/lib/api/student-report";
import { Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TUTOR_METRICS: { key: string; label: string }[] = [
  { key: "discipline", label: "Intizom" },
  { key: "responsibility", label: "Mas'uliyat" },
  { key: "activity", label: "Faollik" },
  { key: "teamwork", label: "Jamoaviylik" },
];

const PSYCH_METRICS: { key: string; label: string }[] = [
  { key: "emotional", label: "Emotsional" },
  { key: "social", label: "Ijtimoiy" },
  { key: "motivation", label: "Motivatsiya" },
  { key: "focus", label: "Diqqat" },
];

export function ConclusionsTab({ studentId, canManage }: { studentId: string; canManage: boolean }) {
  const { data, isLoading } = useConclusion(studentId);
  const upsert = useUpsertConclusion(studentId);

  const [tutorNote, setTutorNote] = useState("");
  const [tutorMetrics, setTutorMetrics] = useState<Record<string, number>>({});
  const [psychNote, setPsychNote] = useState("");
  const [psychMetrics, setPsychMetrics] = useState<Record<string, number>>({});
  const [savedCard, setSavedCard] = useState<"tutor" | "psych" | null>(null);

  useEffect(() => {
    if (data) {
      setTutorNote(data.tutorNote ?? "");
      setTutorMetrics(data.tutorMetrics ?? {});
      setPsychNote(data.psychologistNote ?? "");
      setPsychMetrics(data.psychMetrics ?? {});
    }
  }, [data]);

  async function saveTutor() {
    await upsert.mutateAsync({ tutorNote, tutorMetrics });
    setSavedCard("tutor");
    setTimeout(() => setSavedCard(null), 2000);
  }
  async function savePsych() {
    await upsert.mutateAsync({ psychologistNote: psychNote, psychMetrics });
    setSavedCard("psych");
    setTimeout(() => setSavedCard(null), 2000);
  }

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ConclusionCard
        icon={<GraduationCap className="h-4 w-4 text-accent" />}
        title="Tutor xulosasi"
        note={tutorNote}
        onNote={setTutorNote}
        metrics={TUTOR_METRICS}
        values={tutorMetrics}
        onMetric={(k, v) => setTutorMetrics((m) => ({ ...m, [k]: v }))}
        canManage={canManage}
        onSave={saveTutor}
        saving={upsert.isPending}
        saved={savedCard === "tutor"}
      />
      <ConclusionCard
        icon={<Brain className="h-4 w-4 text-violet-500" />}
        title="Psixolog xulosasi"
        note={psychNote}
        onNote={setPsychNote}
        metrics={PSYCH_METRICS}
        values={psychMetrics}
        onMetric={(k, v) => setPsychMetrics((m) => ({ ...m, [k]: v }))}
        canManage={canManage}
        onSave={savePsych}
        saving={upsert.isPending}
        saved={savedCard === "psych"}
      />
    </div>
  );
}

interface CardProps {
  icon: React.ReactNode;
  title: string;
  note: string;
  onNote: (v: string) => void;
  metrics: { key: string; label: string }[];
  values: Record<string, number>;
  onMetric: (key: string, value: number) => void;
  canManage: boolean;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

function ConclusionCard({
  icon,
  title,
  note,
  onNote,
  metrics,
  values,
  onMetric,
  canManage,
  onSave,
  saving,
  saved,
}: CardProps) {
  return (
    <Card className="flex flex-col p-5">
      <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
        {icon}
        {title}
      </h3>

      <textarea
        value={note}
        onChange={(e) => onNote(e.target.value)}
        disabled={!canManage}
        rows={4}
        placeholder="Xulosa matnini kiriting..."
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-amber focus-visible:focus-ring disabled:opacity-70"
      />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.key}>
            <label className="mb-1 block text-xs text-ink-muted">{m.label}</label>
            <input
              type="number"
              min={0}
              max={10}
              value={values[m.key] ?? 0}
              disabled={!canManage}
              onChange={(e) => onMetric(m.key, Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-center text-sm text-ink tnum focus:border-amber focus-visible:focus-ring disabled:opacity-70"
            />
          </div>
        ))}
      </div>

      {canManage && (
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={onSave} loading={saving}>
            <Save className="h-4 w-4" /> Saqlash
          </Button>
          {saved && <span className="text-sm text-positive">Saqlandi ✓</span>}
        </div>
      )}
    </Card>
  );
}
