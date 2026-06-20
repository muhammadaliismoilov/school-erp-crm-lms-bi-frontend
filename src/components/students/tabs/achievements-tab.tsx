"use client";

import { useState } from "react";
import { Award, Crown, Medal, Plus, Star, Trash2, Trophy } from "lucide-react";
import {
  useAchievements,
  useAchievementStats,
  useCreateAchievement,
  useDeleteAchievement,
  type AchievementCategory,
  type AchievementIcon,
  type AchievementInput,
  type AchievementRank,
} from "@/lib/api/student-achievements";
import { Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/students/stat-card";
import { formatDate } from "@/lib/utils";

const CATEGORIES: { value: "" | AchievementCategory; label: string }[] = [
  { value: "", label: "Hammasi" },
  { value: "academic", label: "Akademik" },
  { value: "olympiad", label: "Olimpiada" },
  { value: "sport", label: "Sport" },
  { value: "art", label: "San'at" },
  { value: "community", label: "Jamiyat" },
  { value: "participation", label: "Ishtirok" },
];

const CATEGORY_LABEL: Record<AchievementCategory, string> = {
  academic: "Akademik",
  olympiad: "Olimpiada",
  sport: "Sport",
  art: "San'at",
  community: "Jamiyat",
  participation: "Ishtirok",
};

const RANKS: { value: AchievementRank; label: string }[] = [
  { value: "first", label: "1-o‘rin" },
  { value: "second", label: "2-o‘rin" },
  { value: "third", label: "3-o‘rin" },
  { value: "fourth", label: "4-o‘rin" },
  { value: "fifth", label: "5-o‘rin" },
  { value: "participation", label: "Ishtirok" },
];

const RANK_LABEL: Record<AchievementRank, string> = {
  first: "1-o‘rin",
  second: "2-o‘rin",
  third: "3-o‘rin",
  fourth: "4-o‘rin",
  fifth: "5-o‘rin",
  participation: "Ishtirok",
};

const ICONS: { value: AchievementIcon; label: string }[] = [
  { value: "trophy", label: "Kubok" },
  { value: "medal", label: "Medal" },
  { value: "award", label: "Mukofot" },
  { value: "star", label: "Yulduzcha" },
  { value: "certificate", label: "Sertifikat" },
  { value: "crown", label: "Toj" },
];

function IconFor({ icon, className }: { icon: AchievementIcon; className?: string }) {
  const map = { trophy: Trophy, medal: Medal, award: Award, star: Star, certificate: Award, crown: Crown };
  const C = map[icon] ?? Trophy;
  return <C className={className} />;
}

const EMPTY: AchievementInput = {
  title: "",
  category: "olympiad",
  rank: "first",
  icon: "trophy",
  achievedAt: "",
  organization: "",
  description: "",
  certificateUrl: "",
};

export function AchievementsTab({ studentId, canManage }: { studentId: string; canManage: boolean }) {
  const [cat, setCat] = useState<"" | AchievementCategory>("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AchievementInput>(EMPTY);

  const { data: items, isLoading } = useAchievements(studentId, cat || undefined);
  const { data: stats } = useAchievementStats(studentId);
  const createAch = useCreateAchievement(studentId);
  const deleteAch = useDeleteAchievement(studentId);

  function set<K extends keyof AchievementInput>(key: K, value: AchievementInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!form.title.trim()) return;
    await createAch.mutateAsync({
      ...form,
      title: form.title.trim(),
      achievedAt: form.achievedAt || undefined,
      organization: form.organization || undefined,
      description: form.description || undefined,
      certificateUrl: form.certificateUrl || undefined,
    });
    setForm(EMPTY);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      {/* Kategoriya tablari + qo'shish */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCat(c.value)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                cat === c.value ? "bg-accent text-accent-fg" : "bg-surface text-ink-muted hover:text-ink"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {canManage && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Yutuq qo‘shish
          </Button>
        )}
      </div>

      {/* Stat kartalar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jami yutuqlar" value={stats?.total ?? "—"} icon={<Award className="h-5 w-5" />} tone="accent" />
        <StatCard label="1-o‘rin / G‘olib" value={stats?.first ?? "—"} icon={<Trophy className="h-5 w-5" />} tone="amber" />
        <StatCard label="2-o‘rin" value={stats?.second ?? "—"} icon={<Medal className="h-5 w-5" />} tone="sky" />
        <StatCard label="3-o‘rin" value={stats?.third ?? "—"} icon={<Medal className="h-5 w-5" />} tone="rose" />
      </div>

      {/* Ro'yxat */}
      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : !items || items.length === 0 ? (
        <div className="card grid place-items-center gap-2 py-20 text-center">
          <Trophy className="h-10 w-10 text-ink-muted/50" />
          <p className="font-medium text-ink">Hozircha yutuqlar mavjud emas</p>
          <p className="max-w-md text-sm text-ink-muted">
            O‘quvchi yutuq qo‘lga kiritganda — “Yutuq qo‘shish” tugmasi orqali kiritishingiz mumkin
          </p>
          {canManage && (
            <Button className="mt-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Birinchi yutuqni qo‘shish
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Card key={a.id} className="flex items-start gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500/12 text-amber-600">
                <IconFor icon={a.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink">{a.title}</p>
                  {canManage && (
                    <button
                      onClick={() => deleteAch.mutate(a.id)}
                      className="shrink-0 text-ink-muted hover:text-negative"
                      aria-label="O‘chirish"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent">
                    {CATEGORY_LABEL[a.category]}
                  </span>
                  <span className="rounded-full bg-amber-500/12 px-2 py-0.5 font-medium text-amber-600">
                    {RANK_LABEL[a.rank]}
                  </span>
                </div>
                {a.organization && <p className="mt-1.5 text-xs text-ink-muted">{a.organization}</p>}
                {a.achievedAt && <p className="text-xs text-ink-muted/70 tnum">{formatDate(a.achievedAt)}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Qo'shish modali */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Yangi yutuq qo‘shish"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Bekor qilish
            </Button>
            <Button loading={createAch.isPending} onClick={submit}>
              <Trophy className="h-4 w-4" /> Yutuqni saqlash
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Yutuq nomi" htmlFor="ach-title">
            <Input
              id="ach-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Masalan: Matematika olimpiadasi"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategoriya" htmlFor="ach-cat">
              <Select
                id="ach-cat"
                value={form.category}
                onChange={(e) => set("category", e.target.value as AchievementCategory)}
                options={CATEGORIES.filter((c) => c.value).map((c) => ({ value: c.value, label: c.label }))}
              />
            </Field>
            <Field label="O‘rin / daraja" htmlFor="ach-rank">
              <Select
                id="ach-rank"
                value={form.rank}
                onChange={(e) => set("rank", e.target.value as AchievementRank)}
                options={RANKS}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ikonka" htmlFor="ach-icon">
              <Select
                id="ach-icon"
                value={form.icon}
                onChange={(e) => set("icon", e.target.value as AchievementIcon)}
                options={ICONS}
              />
            </Field>
            <Field label="Sana" htmlFor="ach-date">
              <Input id="ach-date" type="date" value={form.achievedAt} onChange={(e) => set("achievedAt", e.target.value)} />
            </Field>
          </div>
          <Field label="Tashkilot / homiy" htmlFor="ach-org">
            <Input id="ach-org" value={form.organization} onChange={(e) => set("organization", e.target.value)} placeholder="Masalan: Maktab - 1-sinflar" />
          </Field>
          <Field label="Tavsif" htmlFor="ach-desc">
            <textarea
              id="ach-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-amber focus-visible:focus-ring"
              placeholder="Yutuq haqida qisqacha ma'lumot..."
            />
          </Field>
          <Field label="Sertifikat URL (ixtiyoriy)" htmlFor="ach-cert">
            <Input id="ach-cert" value={form.certificateUrl} onChange={(e) => set("certificateUrl", e.target.value)} placeholder="https://..." />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
