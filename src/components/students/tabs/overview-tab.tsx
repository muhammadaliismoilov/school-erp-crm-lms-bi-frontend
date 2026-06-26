"use client";

import {
  Award,
  CalendarCheck,
  Coins,
  GraduationCap,
  Phone,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useStudentOverview } from "@/lib/api/student-profile";
import { Card, Spinner } from "@/components/ui/card";
import { StatCard } from "@/components/students/stat-card";
import { formatDate, formatMoney } from "@/lib/utils";

const genderLabel: Record<string, string> = { male: "Erkak", female: "Ayol", other: "Boshqa" };
const langLabel: Record<string, string> = { uz: "O‘zbek", ru: "Rus", en: "Ingliz" };

export function OverviewTab({ studentId }: { studentId: string }) {
  const { data, isLoading } = useStudentOverview(studentId);

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const p = data.personal;
  const info: { label: string; value: React.ReactNode }[] = [
    { label: "F.I.O", value: p.fullName },
    { label: "Otasining ismi", value: p.middleName || "—" },
    { label: "Tug‘ilgan sana", value: p.birthDate ? formatDate(p.birthDate) : "—" },
    { label: "Jinsi", value: p.gender ? genderLabel[p.gender] : "—" },
    { label: "Ta'lim tili", value: langLabel[p.language] ?? p.language },
    { label: "ID kod", value: <span className="font-mono">{p.studentCode}</span> },
    { label: "Hujjat raqami", value: p.nationalId || "—" },
    { label: "Sinf", value: p.classLabel || "—" },
    { label: "Shartnoma", value: p.contractNumber || "—" },
    { label: "Oylik tarif", value: p.monthlyFee ? formatMoney(p.monthlyFee) : "—" },
    {
      label: "Chegirma",
      value:
        p.discountType === "amount"
          ? formatMoney(p.discountValue ?? 0)
          : `${p.discountValue ?? p.discountPercent ?? 0}%`,
    },
    { label: "Manzil", value: [p.region, p.district, p.address].filter(Boolean).join(", ") || "—" },
    { label: "Telefon", value: p.personalPhone || "—" },
  ];

  return (
    <div className="space-y-5">
      {/* Stat kartalar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="O‘rtacha GPA"
          value={data.gpa != null ? data.gpa.toFixed(2) : "—"}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="accent"
        />
        <StatCard
          label="Davomat"
          value={`${data.attendancePct}%`}
          icon={<CalendarCheck className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Sinf reytingi"
          value={data.rank ? `${data.rank}-o‘rin` : "—"}
          hint={data.classSize ? `${data.classSize} o‘quvchidan` : undefined}
          icon={<Award className="h-5 w-5" />}
          tone="violet"
        />
        <StatCard
          label="Tangalar"
          value={data.coins}
          icon={<Coins className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Shaxsiy ma'lumotlar */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-ink">
            <GraduationCap className="h-4 w-4 text-accent" />
            Shaxsiy ma'lumotlar
          </h3>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {info.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-3 border-b border-line/50 pb-2">
                <dt className="text-sm text-ink-muted">{row.label}</dt>
                <dd className="text-right text-sm font-medium text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>

          {data.interests.length > 0 && (
            <div className="mt-5">
              <h4 className="label mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Qiziqishlar
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.interests.map((tag) => (
                  <span key={tag} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Ota-onalar + o'qituvchilar */}
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
              <Users className="h-4 w-4 text-accent" />
              Ota-onalar
            </h3>
            {data.parents.length === 0 ? (
              <p className="text-sm text-ink-muted">Ma'lumot yo‘q</p>
            ) : (
              <ul className="space-y-3">
                {data.parents.map((parent) => (
                  <li key={parent.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{parent.fullName}</p>
                      <p className="text-xs text-ink-muted">{parent.relation}</p>
                    </div>
                    <a
                      href={`tel:${parent.phone}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/15"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {parent.phone}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
              <GraduationCap className="h-4 w-4 text-accent" />
              O‘qituvchilar
            </h3>
            {data.teachers.length === 0 ? (
              <p className="text-sm text-ink-muted">Ma'lumot yo‘q</p>
            ) : (
              <ul className="space-y-2.5">
                {data.teachers.map((teacher) => (
                  <li key={`${teacher.id}-${teacher.subject}`} className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink">{teacher.fullName}</span>
                    <span className="shrink-0 text-xs text-ink-muted">{teacher.subject}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
