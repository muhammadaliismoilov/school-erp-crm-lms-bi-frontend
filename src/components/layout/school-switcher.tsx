"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth/store";
import { useSchoolOptions } from "@/lib/api/hr-branches";
import { getActiveSchool, setActiveSchool } from "@/lib/api/client";

/**
 * Global (super-admin) foydalanuvchi uchun maktab tanlagich. Tanlaganda barcha
 * so'rovlarga `X-School-Id` yuboriladi va cache tozalanadi — faqat shu maktab
 * ma'lumoti chiqadi. Maktabга bog'langan oddiy user uchun ko'rinmaydi (backend
 * baribir o'z maktabiga qadaydi).
 */
export function SchoolSwitcher() {
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isGlobal = roles.includes("super-admin");
  const qc = useQueryClient();
  const options = useSchoolOptions();
  const [value, setValue] = useState<string>(() => getActiveSchool() ?? "");

  if (!isGlobal) return null;

  function onChange(next: string) {
    setValue(next);
    setActiveSchool(next || null);
    // Yangi maktab bo'yicha hamma narsa qayta yuklansin.
    qc.clear();
  }

  return (
    <div className="hidden items-center gap-2 sm:flex" title="Maktab bo‘yicha filtr">
      <Building2 className="h-4 w-4 text-ink-muted" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink transition-colors hover:border-accent focus-visible:focus-ring"
        aria-label="Maktab tanlash"
      >
        <option value="">Barcha maktablar</option>
        {(options.data ?? []).map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
