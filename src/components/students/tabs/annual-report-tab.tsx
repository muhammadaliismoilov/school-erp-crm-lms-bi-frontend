"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Sparkles, Target, Trash2 } from "lucide-react";
import {
  useSmartGoals,
  useUpsertSmartGoals,
  type SmartGoalItem,
} from "@/lib/api/student-report";
import { Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NOTE_FIELDS = [
  { key: "characterNote", label: "Sajiya-xulq", hint: "Xulq-atvori va shaxsiy fazilatlari" },
  { key: "developmentNote", label: "Rivojlanish", hint: "Yil davomidagi rivojlanish" },
  { key: "workNote", label: "Mehnat harakatlari", hint: "Mehnatsevarlik va harakatchanligi" },
] as const;

export function AnnualReportTab({ studentId, canManage }: { studentId: string; canManage: boolean }) {
  const { data, isLoading } = useSmartGoals(studentId);
  const upsert = useUpsertSmartGoals(studentId);

  const [notes, setNotes] = useState({ characterNote: "", developmentNote: "", workNote: "" });
  const [goals, setGoals] = useState<SmartGoalItem[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setNotes({
        characterNote: data.characterNote ?? "",
        developmentNote: data.developmentNote ?? "",
        workNote: data.workNote ?? "",
      });
      setGoals(data.smartGoals ?? []);
    }
  }, [data]);

  function addGoal() {
    setGoals((g) => [...g, { title: "", deadline: "", result: "" }]);
  }
  function updateGoal(i: number, patch: Partial<SmartGoalItem>) {
    setGoals((g) => g.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }
  function removeGoal(i: number) {
    setGoals((g) => g.filter((_, idx) => idx !== i));
  }

  async function save() {
    await upsert.mutateAsync({
      ...notes,
      smartGoals: goals.filter((g) => g.title.trim()),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Kelajak rejasi — matnlar */}
      <Card className="p-5">
        <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-ink">
          <Sparkles className="h-4 w-4 text-accent" />
          Kelajak rejasi
        </h3>
        <div className="grid gap-4 lg:grid-cols-3">
          {NOTE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-sm font-medium text-ink">{f.label}</label>
              <p className="mb-1.5 text-xs text-ink-muted">{f.hint}</p>
              <textarea
                value={notes[f.key]}
                disabled={!canManage}
                onChange={(e) => setNotes((n) => ({ ...n, [f.key]: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-amber focus-visible:focus-ring disabled:opacity-70"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* SMART maqsadlar */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            <Target className="h-4 w-4 text-accent" />
            SMART maqsadlar
          </h3>
          {canManage && (
            <Button variant="secondary" size="sm" onClick={addGoal}>
              <Plus className="h-4 w-4" /> Qator qo‘shish
            </Button>
          )}
        </div>

        {goals.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            SMART maqsadlar qo‘shilmagan
          </p>
        ) : (
          <div className="space-y-2">
            <div className="hidden grid-cols-[1fr_160px_1fr_40px] gap-2 px-1 sm:grid">
              <span className="label">Maqsad</span>
              <span className="label">Muddat</span>
              <span className="label">Natija</span>
              <span />
            </div>
            {goals.map((g, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px_1fr_40px]">
                <Input
                  value={g.title}
                  disabled={!canManage}
                  onChange={(e) => updateGoal(i, { title: e.target.value })}
                  placeholder="Maqsad..."
                />
                <Input
                  type="date"
                  value={g.deadline ?? ""}
                  disabled={!canManage}
                  onChange={(e) => updateGoal(i, { deadline: e.target.value })}
                />
                <Input
                  value={g.result ?? ""}
                  disabled={!canManage}
                  onChange={(e) => updateGoal(i, { result: e.target.value })}
                  placeholder="Natija..."
                />
                {canManage && (
                  <button
                    onClick={() => removeGoal(i)}
                    className="grid place-items-center rounded-lg text-ink-muted hover:text-negative"
                    aria-label="O‘chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {canManage && (
        <div className="flex items-center gap-3">
          <Button onClick={save} loading={upsert.isPending}>
            <Save className="h-4 w-4" /> Saqlash
          </Button>
          {saved && <span className="text-sm text-positive">Saqlandi ✓</span>}
        </div>
      )}
    </div>
  );
}
