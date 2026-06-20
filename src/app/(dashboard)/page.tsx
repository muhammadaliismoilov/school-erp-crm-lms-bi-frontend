"use client";

import { Users, UserPlus, FileText, TrendingUp } from "lucide-react";
import { useStudents } from "@/lib/api/students";
import { useResourceList, useResourceArray } from "@/lib/api/resource";
import { API_TOTAL_ENDPOINTS } from "@/lib/api/manifest";
import { useAuthStore } from "@/lib/auth/store";
import { Card, Spinner } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  loading?: boolean;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/12 text-amber">
          <Icon className="h-5 w-5" />
        </span>
        {hint && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-positive">
            <TrendingUp className="h-3.5 w-3.5" /> {hint}
          </span>
        )}
      </div>
      <p className="label mt-4">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">
        {loading ? <Spinner className="h-6 w-6" /> : value}
      </p>
    </Card>
  );
}

export default function DashboardPage() {
  const can = useAuthStore((s) => s.can);

  const students = useStudents({ page: 1, limit: 1 });
  const leads = useResourceList("leads", "/crm", { page: 1, limit: 1 }, can("crm.read"));
  const contracts = useResourceArray(
    "contracts",
    "/finance/contracts",
    undefined,
    can("finance.read"),
  );

  return (
    <div className="stagger space-y-8">
      <div>
        <p className="label">Yuton School · Boshqaruv</p>
        <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
          Xush kelibsiz
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="O‘quvchilar"
          value={students.data?.meta.total ?? 0}
          loading={students.isLoading}
        />
        {can("crm.read") && (
          <StatCard
            icon={UserPlus}
            label="Lidlar (qabul)"
            value={leads.data?.meta.total ?? 0}
            loading={leads.isLoading}
          />
        )}
        {can("finance.read") && (
          <StatCard
            icon={FileText}
            label="Shartnomalar"
            value={contracts.data?.length ?? 0}
            loading={contracts.isLoading}
          />
        )}
        <StatCard icon={TrendingUp} label="Filiallar" value={2} hint="Gurlan + Yangibozor" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-display text-lg font-semibold text-ink">
            Tezkor harakatlar
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            Eng ko‘p ishlatiladigan bo‘limlarga o‘ting.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["O‘quvchi qo‘shish", "/students", "students.manage"],
              ["O‘quvchilar ro‘yxati", "/students", "students.read"],
              ["Qabul / Lidlar", "/crm", "crm.read"],
              ["Moliya / Shartnomalar", "/finance", "finance.read"],
            ]
              .filter(([, , perm]) => can(perm))
              .map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-lg border border-line px-4 py-3 text-sm font-medium text-ink-soft",
                    "transition-colors hover:border-amber hover:text-ink",
                  )}
                >
                  {label}
                </a>
              ))}
          </div>
        </Card>

        <Card className="bg-navy-texture p-6 text-paper">
          <h3 className="font-display text-lg font-bold">Tizim holati</h3>
          <p className="mt-1 text-sm text-paper/55">
            Backend bilan real vaqt integratsiyasi.
          </p>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              ["API", "/api/v1"],
              ["Autentifikatsiya", "JWT + refresh"],
              ["Tillar", "UZ · RU · EN"],
              ["Endpointlar", `${API_TOTAL_ENDPOINTS} ta`],
            ].map(([k, v]) => (
              <li key={k} className="flex items-center justify-between">
                <span className="text-paper/55">{k}</span>
                <span className="font-mono font-medium text-accent">{v}</span>
              </li>
            ))}
          </ul>
          <a
            href="/explorer"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-fg transition hover:brightness-105"
          >
            API Explorer ochish →
          </a>
        </Card>
      </div>
    </div>
  );
}
