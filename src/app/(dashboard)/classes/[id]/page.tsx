"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  DoorClosed,
  GraduationCap,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";
import { useClass, type ClassStudentRow } from "@/lib/api/classes";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ClassSmsModal } from "@/components/academic/class-sms-modal";
import { ClassTransferModal } from "@/components/academic/class-transfer-modal";
import { useCrudPermissions } from "@/lib/auth/use-can";

const LANGUAGE_NAME: Record<string, string> = {
  uz: "O‘zbekcha",
  ru: "Ruscha",
  en: "Inglizcha",
};

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

export default function ClassDetailPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? null;
  // O'quvchi ko'chirish va SMS yuborish — ikkalasi ham sinfni yangilash amali.
  const { canUpdate } = useCrudPermissions("academic-classes");

  const { data, isLoading, isError, refetch } = useClass(id);
  const [smsOpen, setSmsOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const students = useMemo(() => data?.students ?? [], [data]);

  const columns: Column<ClassStudentRow>[] = [
    {
      key: "index",
      header: "№",
      render: (s) => <span className="text-ink-muted tnum">{students.indexOf(s) + 1}</span>,
    },
    {
      key: "fullName",
      header: t("classes.detail.col.fullName"),
      render: (s) => <span className="text-sm font-medium text-ink">{s.fullName}</span>,
    },
    {
      key: "mastery",
      header: t("classes.detail.col.mastery"),
      render: (s) => <span className="text-sm text-ink-soft tnum">{s.mastery.toFixed(1)}</span>,
    },
    {
      key: "attendance",
      header: t("classes.detail.col.attendance"),
      render: (s) => (
        <span className="text-sm text-ink-soft tnum">{s.attendance.toFixed(1)}%</span>
      ),
    },
    {
      key: "gender",
      header: t("classes.detail.col.gender"),
      align: "right" as const,
      render: (s) =>
        s.gender ? (
          <Badge tone={s.gender === "female" ? "accent" : "neutral"}>
            {s.gender === "female" ? t("classes.gender.female") : t("classes.gender.male")}
          </Badge>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
  ];

  return (
    <div className="stagger">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/classes")} aria-label={t("common.cancel")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-navy text-paper">
            <GraduationCap className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              {data?.name ?? "—"}
            </h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
              <span>{data ? LANGUAGE_NAME[data.language] ?? data.language : ""}</span>
              {data?.curator.fullName && <span>· {data.curator.fullName}</span>}
              {data?.room.label && (
                <span className="inline-flex items-center gap-1">
                  · <DoorClosed className="h-3.5 w-3.5" /> {data.room.label}
                </span>
              )}
            </p>
          </div>
        </div>
        {canUpdate && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setTransferOpen(true)}>
              <ArrowLeftRight className="h-4 w-4" />
              {t("classes.detail.transfer")}
            </Button>
            <Button onClick={() => setSmsOpen(true)}>
              <MessageSquare className="h-4 w-4" />
              {t("classes.detail.sendSms")}
            </Button>
          </div>
        )}
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label={t("classes.detail.students")}
          value={
            <span>
              {data?.stats.studentCount ?? 0}
              <span className="ml-2 text-sm font-normal text-ink-muted">
                {t("classes.detail.male")} {data?.stats.maleCount ?? 0} · {t("classes.detail.female")}{" "}
                {data?.stats.femaleCount ?? 0}
              </span>
            </span>
          }
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          tone="positive"
          label={t("classes.detail.avgMastery")}
          value={`${(data?.stats.averageMastery ?? 0).toFixed(1)} / 5`}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="warning"
          label={t("classes.detail.avgAttendance")}
          value={`${(data?.stats.averageAttendance ?? 0).toFixed(1)} %`}
        />
      </div>

      <DataTable
        columns={columns}
        rows={isLoading ? undefined : students}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        page={1}
        pageCount={1}
        total={students.length}
        onPageChange={() => {}}
        rowKey={(s) => s.id}
      />

      <ClassSmsModal
        open={smsOpen}
        classId={id}
        studentCount={data?.stats.studentCount ?? 0}
        onClose={() => setSmsOpen(false)}
      />

      <ClassTransferModal
        open={transferOpen}
        source={data ?? null}
        onClose={() => setTransferOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
