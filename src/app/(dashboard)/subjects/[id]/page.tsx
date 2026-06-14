"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, GraduationCap, TrendingUp, Users } from "lucide-react";
import { useSubjectOverview, useSubjectSchedule } from "@/lib/api/subjects";
import { useI18n } from "@/lib/i18n/provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SubjectScheduleGrid } from "@/components/academic/subject-schedule-grid";

function StatCard({
  icon,
  label,
  value,
  tone = "accent",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "accent" | "positive" | "warning";
}) {
  const tones = {
    accent: "bg-accent/12 text-accent",
    positive: "bg-positive/12 text-positive",
    warning: "bg-amber/12 text-amber-600",
  };
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>{icon}</div>
      <div>
        <p className="text-sm text-ink-muted">{label}</p>
        <p className="font-display text-2xl font-semibold text-ink tnum">{value}</p>
      </div>
    </Card>
  );
}

export default function SubjectDetailPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? null;

  const { data, isLoading } = useSubjectOverview(id);
  const [teacherId, setTeacherId] = useState("");
  const schedule = useSubjectSchedule(id, teacherId || undefined);

  const subject = data?.subject;
  const teacherOptions = [
    { value: "", label: t("subjects.detail.allTeachers") },
    ...(data?.teachers ?? []).map((teacher) => ({ value: teacher.id, label: teacher.fullName })),
  ];

  return (
    <div className="stagger">
      <div className="mb-5 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/subjects")} aria-label={t("common.cancel")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span
          className="grid h-12 w-12 place-items-center rounded-xl text-paper"
          style={{ backgroundColor: subject?.color ?? "#2563EB" }}
        >
          <BookOpen className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">{subject?.name ?? "—"}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">{t("subjects.detail.subtitle")}</p>
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          tone="positive"
          label={t("subjects.detail.avgMastery")}
          value={`${(data?.stats.averageMastery ?? 0).toFixed(1)} / 5`}
        />
        <StatCard
          icon={<GraduationCap className="h-5 w-5" />}
          label={t("subjects.detail.classCount")}
          value={data?.stats.classCount ?? 0}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          tone="warning"
          label={t("subjects.detail.teacherCount")}
          value={data?.stats.teacherCount ?? 0}
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label={t("subjects.detail.lessonCount")}
          value={data?.stats.lessonCount ?? 0}
        />
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-display text-lg font-semibold text-ink">{t("subjects.detail.classes")}</h3>
          {isLoading ? (
            <p className="text-sm text-ink-muted">{t("common.loading")}</p>
          ) : (data?.classes.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">{t("common.empty")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data?.classes.map((c) => (
                <span key={c.id} className="rounded-lg bg-parchment/60 px-2.5 py-1 text-sm text-ink-soft">
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-display text-lg font-semibold text-ink">{t("subjects.detail.teachers")}</h3>
          {isLoading ? (
            <p className="text-sm text-ink-muted">{t("common.loading")}</p>
          ) : (data?.teachers.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">{t("common.empty")}</p>
          ) : (
            <ul className="space-y-2">
              {data?.teachers.map((teacher) => (
                <li key={teacher.id} className="text-sm text-ink-soft">
                  {teacher.fullName}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-ink">{t("subjects.detail.schedule")}</h3>
        <div className="w-56">
          <Select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            options={teacherOptions}
          />
        </div>
      </div>

      <SubjectScheduleGrid lessons={schedule.data ?? []} subjectName={subject?.name ?? ""} />
    </div>
  );
}
