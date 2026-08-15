"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import { useCan } from "@/lib/auth/use-can";
import { isUnder, resolveRoutePermission } from "@/lib/auth/route-permissions";
import { useI18n } from "@/lib/i18n/provider";
import { NAV_LEAVES } from "@/lib/nav";
import { Spinner } from "@/components/ui/card";
import { ForbiddenNotice } from "./forbidden-notice";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const can = useCan();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  // Eng uzun mos prefiks: /academic/journal /academic dan ustun keladi.
  const current =
    [...NAV_LEAVES]
      .filter((leaf) => isUnder(pathname, leaf.href))
      .sort((a, b) => b.href.length - a.href.length)[0] ?? NAV_LEAVES[0];

  // Yon panel ruxsatsiz bo'limlarni yashiradi; bu esa manzilni qo'lda yozib
  // kirishni to'sadi. Backend baribir 403 qaytaradi — bu qatlam UX uchun.
  const required = resolveRoutePermission(pathname);
  const allowed = can(required);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={t(current.labelKey)} />
        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
          {allowed ? children : <ForbiddenNotice permission={required} />}
        </main>
      </div>
    </div>
  );
}
