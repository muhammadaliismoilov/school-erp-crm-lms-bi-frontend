"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import { useAllowed } from "@/lib/auth/use-can";
import {
  isUnder,
  resolveRouteModule,
  resolveRoutePermission,
  resolveRouteRequirement,
} from "@/lib/auth/route-permissions";
import { useEnabledModules, type GatedModule } from "@/lib/api/schools";
import { useI18n } from "@/lib/i18n/provider";
import { NAV_LEAVES } from "@/lib/nav";
import { Spinner } from "@/components/ui/card";
import { ForbiddenNotice } from "./forbidden-notice";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  // Hook erta `return` dan OLDIN chaqiriladi: React hook'lar tartibi har
  // renderda bir xil bo'lishi shart, aks holda autentifikatsiya holati
  // o'zgarganda render zanjiri buziladi.
  //
  // Ko'rsatish uchun bitta kod, tekshiruv uchun to'liq shart: muqobilli
  // marshrutda (`/appeals`) bitta kodni tekshirish ikkinchi qamrovdagi
  // foydalanuvchini sahifadan butunlay to'sib qo'yardi.
  const required = resolveRoutePermission(pathname);
  const allowedByPermission = useAllowed(resolveRouteRequirement(pathname));
  // Ikkinchi, MUSTAQIL qatlam: imtiyoz bor bo'lsa ham bo'lim shu maktabga
  // yoqilmagan bo'lishi mumkin. Bayroqlar hali kelmagan bo'lsa bo'lim YOPIQ
  // deb qaraladi — ko'rsatib keyin olib qo'yishdan ko'ra kechroq ko'rsatish
  // yaxshiroq (yon paneldagi qoida bilan bir xil).
  const requiredModule = resolveRouteModule(pathname);
  const enabledModules = useEnabledModules();
  const moduleAllowed =
    !requiredModule || enabledModules.data?.[requiredModule as GatedModule] === true;
  const allowed = allowedByPermission && moduleAllowed;

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(sessionExpired ? "/login?reason=session_expired" : "/login");
    }
  }, [status, sessionExpired, router]);

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
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={t(current.labelKey)} />
        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
          {allowed ? (
            children
          ) : (
            <ForbiddenNotice
              permission={required}
              module={allowedByPermission ? requiredModule : undefined}
            />
          )}
        </main>
      </div>
    </div>
  );
}
