"use client";

import { useState } from "react";
import { Blocks } from "lucide-react";
import {
  useSchoolModules,
  useSetSchoolModule,
  type GatedModule,
} from "@/lib/api/schools";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Can } from "@/components/auth/can";

/** Bayroqli modullar — backend `GATED_MODULES` bilan bir xil ro'yxat. */
const MODULES: { key: GatedModule; labelKey: string; hintKey: string }[] = [
  { key: "integrations", labelKey: "nav.integrations", hintKey: "modules.integrations.hint" },
  { key: "branches", labelKey: "nav.hr.branches", hintKey: "modules.branches.hint" },
];

/**
 * Maktab modullari — faqat CEO ko'radi (`settings-school.update`).
 *
 * NEGA ALOHIDA: bayroq maktab darajasida, ruxsat esa rol darajasida ishlaydi.
 * `director` GLOBAL rol bo'lgani uchun "faqat Elegant direktoriga integratsiya
 * berish" ruxsat orqali imkonsiz — u hamma maktab direktoriga tarqalardi.
 */
export function SchoolModulesCard({ schoolId }: { schoolId: string }) {
  const { t, locale } = useI18n();
  const { data, isLoading } = useSchoolModules(schoolId);
  const setModule = useSetSchoolModule(schoolId);
  const [error, setError] = useState<string | null>(null);

  async function toggle(module: GatedModule, enabled: boolean) {
    setError(null);
    try {
      await setModule.mutateAsync({ module, enabled });
    } catch (err) {
      setError(err instanceof ApiError ? err.localized(locale) : t("common.error"));
    }
  }

  return (
    <Can permission="settings-school.update">
      <Card className="mt-5 p-6">
        <div className="flex items-center gap-2.5">
          <Blocks className="h-4 w-4 text-ink-muted" />
          <h3 className="font-display text-lg font-bold text-ink">{t("modules.title")}</h3>
        </div>
        <p className="mt-1 text-sm text-ink-muted">{t("modules.subtitle")}</p>

        <div className="mt-4 divide-y divide-line">
          {MODULES.map((m) => (
            <div key={m.key} className="flex items-center justify-between gap-6 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{t(m.labelKey)}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{t(m.hintKey)}</p>
              </div>
              <Switch
                checked={data?.[m.key] ?? false}
                onCheckedChange={(v) => void toggle(m.key, v)}
                disabled={isLoading || setModule.isPending}
              />
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-negative">{error}</p>}
      </Card>
    </Can>
  );
}
