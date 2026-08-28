"use client";

import { Pencil } from "lucide-react";
import type { School } from "@/lib/api/schools";
import { useI18n } from "@/lib/i18n/provider";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/can";
import { formatMoney } from "@/lib/utils";

const typeTone: Record<string, "neutral" | "positive" | "accent" | "caution"> = {
  general: "neutral",
  private: "accent",
  specialized: "positive",
  international: "caution",
};

function Qator({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-2.5 last:border-0">
      <dt className="shrink-0 text-sm text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-ink">{value || "—"}</dd>
    </div>
  );
}

/**
 * Bitta maktab profili — sirt bitta maktabga qaratilganda «Maktab ma'lumotlari»
 * shu ko'rinishda chiziladi (ro'yxat va «Maktab yaratish» tugmasi o'rniga).
 *
 * NEGA: maktab xodimi uchun bu bo'lim «boshqa maktablar reestri» emas, «mening
 * maktabim» degani. Bitta qatorli jadval yonida «Maktab yaratish» tugmasi va
 * o'chirish belgisi turishi mantiqsiz edi.
 *
 * Tahrirlash tugmasi `settings-school.update` bilan qulflangan — u endi faqat
 * CEO'da, ya'ni maktab xodimiga profil o'qish rejimida ko'rinadi.
 */
export function SchoolProfile({
  school,
  onEdit,
}: {
  school: School;
  onEdit: (school: School) => void;
}) {
  const { t } = useI18n();

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {school.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- maktab logotipi, next/image domen ro'yxati sozlanmagan
            <img src={school.logoUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
          ) : (
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-accent font-display text-xl font-extrabold text-accent-fg">
              {school.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate font-display text-2xl font-bold text-ink">{school.name}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge tone={typeTone[school.schoolType] ?? "neutral"}>
                {t(`schools.type.${school.schoolType}`)}
              </Badge>
              {school.legalName && (
                <span className="text-xs text-ink-muted">{school.legalName}</span>
              )}
            </div>
          </div>
        </div>

        <Can permission="settings-school.update">
          <Button variant="secondary" onClick={() => onEdit(school)}>
            <Pencil className="h-4 w-4" />
            {t("common.edit")}
          </Button>
        </Can>
      </div>

      <div className="mt-6 grid gap-x-10 gap-y-0 md:grid-cols-2">
        <dl>
          <Qator label={t("schools.f.region")} value={school.region} />
          <Qator label={t("schools.f.district")} value={school.district} />
          <Qator label={t("schools.f.address")} value={school.address} />
          <Qator label={t("schools.f.website")} value={school.websiteUrl} />
        </dl>
        <dl>
          <Qator label={t("schools.f.phone")} value={school.phone} />
          <Qator label={t("schools.f.email")} value={school.email} />
          <Qator
            label={t("schools.f.totalCapacity")}
            value={formatMoney(school.capacities.total)}
          />
          <Qator
            label={t("schools.f.monthlyPayment")}
            value={formatMoney(school.payment.monthlyPayment)}
          />
        </dl>
      </div>
    </Card>
  );
}
