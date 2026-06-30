"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  ClipboardList,
  CalendarCheck,
  Plane,
  MessagesSquare,
  Megaphone,
  UserSearch,
  FileQuestion,
  Building2,
  Network,
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  FolderKanban,
  Banknote,
  Gauge,
  Sprout,
  BarChart3,
  GraduationCap,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

interface HrCard {
  label: string;
  href: string;
  icon: LucideIcon;
  ready?: boolean;
}

const CARDS: HrCard[] = [
  { label: "Xodimlar", href: "/hr/employees", icon: Users, ready: true },
  { label: "O'qituvchilar", href: "/hr/teachers", icon: GraduationCap, ready: true },
  { label: "Vazifalar", href: "/hr/tasks", icon: ClipboardList, ready: true },
  { label: "Davomat", href: "/hr/attendance", icon: CalendarCheck, ready: true },
  { label: "Ta'tillar", href: "/hr/leaves", icon: Plane, ready: true },
  { label: "Muloqotlar", href: "/hr/communications", icon: MessagesSquare },
  { label: "Vakansiyalar", href: "/hr/vacancies", icon: Megaphone },
  { label: "Nomzodlar", href: "/hr/candidates", icon: UserSearch },
  { label: "So'rovnomalar", href: "/hr/surveys", icon: FileQuestion },
  { label: "Filiallar", href: "/hr/branches", icon: Building2, ready: true },
  { label: "Bo'limlar", href: "/hr/departments", icon: Network, ready: true },
  { label: "Lavozimlar", href: "/hr/positions", icon: BriefcaseBusiness, ready: true },
  { label: "Jadvallar", href: "/hr/schedules", icon: CalendarDays },
  { label: "Ish vaqti hisoboti", href: "/hr/time-tracking", icon: Clock },
  { label: "Loyhalar", href: "/hr/projects", icon: FolderKanban },
  { label: "To'lovlar", href: "/hr/payments", icon: Banknote },
  { label: "Samaradorlik baholash", href: "/hr/performance", icon: Gauge },
  { label: "Adaptatsiya", href: "/hr/onboarding", icon: Sprout },
  { label: "Statistika", href: "/hr/statistics", icon: BarChart3 },
];

export default function HrDashboardPage() {
  return (
    <div className="stagger">
      <PageHeader
        title="HR Boshqaruv"
        subtitle="Xodimlar, vazifalar, davomat va boshqalarni boshqarish"
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group relative flex items-center justify-between rounded-xl border border-line bg-surface p-5 transition-colors hover:border-amber hover:bg-parchment/40"
            >
              <span className="font-medium text-ink">{c.label}</span>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-parchment text-ink-soft transition-colors group-hover:bg-amber/15 group-hover:text-amber">
                <Icon className="h-5 w-5" />
              </span>
              {!c.ready && (
                <span className="absolute right-2 top-2 rounded bg-ink/5 px-1.5 py-0.5 text-[10px] text-ink-muted">
                  Tez orada
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
