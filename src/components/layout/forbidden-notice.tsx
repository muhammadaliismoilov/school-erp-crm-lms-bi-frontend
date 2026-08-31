"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { Card } from "@/components/ui/card";

/**
 * Imtiyozi yetmagan marshrutda sahifa o'rniga chiziladi.
 *
 * Ataylab redirect emas, o'rindagi ekran: yon panel joyida qoladi, foydalanuvchi
 * o'ziga ochiq bo'limga bemalol o'tadi va redirect halqasi yuzaga kelmaydi.
 */
export function ForbiddenNotice({
  permission,
  module,
}: {
  permission?: string;
  /** Bo'lim maktabga yoqilmagan — sabab imtiyozda emas, modul bayrog'ida. */
  module?: string;
}) {
  const { t } = useI18n();

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Card className="flex max-w-md flex-col items-center gap-4 p-8 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-caution/12 text-caution">
          <ShieldAlert className="h-7 w-7" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold text-ink">
            {t("forbidden.title")}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {module ? t("forbidden.moduleBody") : t("forbidden.body")}
          </p>
        </div>
        {!module && permission && (
          <p className="text-xs text-ink-muted">
            {t("forbidden.permission")}:{" "}
            <code className="rounded bg-parchment-deep px-1.5 py-0.5 font-mono text-ink-soft">
              {permission}
            </code>
          </p>
        )}
        <Link
          href="/"
          className="mt-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
        >
          {t("forbidden.home")}
        </Link>
      </Card>
    </div>
  );
}
