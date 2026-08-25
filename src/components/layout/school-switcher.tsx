"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth/store";
import { useSchoolOptions } from "@/lib/api/hr-branches";
import { getActiveSchool, setActiveSchool } from "@/lib/api/client";
import { isAdminHostname, isTenantBypassHostname } from "@/lib/tenant/hostname";

/**
 * Global (super-admin) foydalanuvchi uchun maktab tanlagich. Tanlaganda barcha
 * so'rovlarga `X-School-Id` yuboriladi va cache tozalanadi — faqat shu maktab
 * ma'lumoti chiqadi. Maktabga bog'langan oddiy user uchun ko'rinmaydi (backend
 * baribir o'z maktabiga qadaydi). Real maktab subdomenida (masalan
 * elegantschool.crm.uz) superadmin ham ko'ra olmaydi — u yerda hisob shu
 * maktabga qulflangan; faqat `admin.*` va hozirgi Vercel manzilida chiqadi.
 */
export function SchoolSwitcher() {
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const isGlobal = roles.includes("super-admin");
  const qc = useQueryClient();
  const options = useSchoolOptions();
  const [value, setValue] = useState<string>(() => getActiveSchool() ?? "");
  const [allowedHost, setAllowedHost] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    setAllowedHost(isAdminHostname(hostname) || isTenantBypassHostname(hostname));
  }, []);

  if (!isGlobal || !allowedHost) return null;

  function onChange(next: string) {
    setValue(next);
    setActiveSchool(next || null);
    // `qc.clear()` + `qc.refetchQueries()` band-band chaqirilsa poyga holati
    // yuzaga keladi: `clear()` barcha query'larni cache'dan butunlay o'chiradi,
    // shundan keyin `refetchQueries({type:"active"})` esa endi bo'sh qolgan
    // cache'ni qidirib hech narsa topmaydi — ekrandagi ma'lumot yangilanmay
    // qoladi (foydalanuvchi qo'lda refresh qilmaguncha). `resetQueries()` esa
    // bitta atomik amal: har bir query'ni (cache'dan o'chirmasdan) boshlang'ich
    // holatga qaytaradi va o'sha zahoti hozir ekranda ochiq turgan (active)
    // query'larni qayta so'raydi — eski maktabning keshi ko'rinmay qoladi,
    // yangisi esa avtomatik yuklanadi.
    void qc.resetQueries();
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
