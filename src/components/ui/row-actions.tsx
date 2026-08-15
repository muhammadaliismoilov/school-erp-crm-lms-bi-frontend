"use client";

/**
 * Jadval "Amallar" ustuni uchun umumiy naqsh.
 *
 * Har sahifada `{canManage && (<><Button .../><Button .../></>)}` yozish o'rniga
 * amallar ma'lumot sifatida tavsiflanadi, ruxsat esa har amalda alohida:
 *
 * ```tsx
 * const actions = useRowActionsColumn<Branch>({
 *   actions: [
 *     { key: "edit", label: t("common.edit"), icon: Pencil,
 *       permission: "hr-branches.update", onSelect: openEdit },
 *     { key: "delete", label: t("common.delete"), icon: Trash2, tone: "danger",
 *       permission: "hr-branches.delete", onSelect: setDeleting },
 *   ],
 * });
 *
 * const columns: Column<Branch>[] = [...boshqalar, ...actions];
 * ```
 *
 * Nima yutuq beradi:
 * - bitta amalga ham ruxsat bo'lmasa — USTUN butunlay chizilmaydi (bo'sh
 *   "Amallar" ustuni qolib ketmaydi);
 * - har amal o'z imtiyoziga ega — `update` bor, `delete` yo'q holati to'g'ri
 *   ishlaydi;
 * - `hidden`/`disabled` qatorga qarab hisoblanadi (masalan yopilgan yozuvni
 *   tahrirlab bo'lmaydi).
 */

import type { LucideIcon } from "lucide-react";
import type { Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  satisfiesRequirement,
  type PermissionRequirement,
} from "@/lib/auth/permissions";
import { usePermissions } from "@/lib/auth/use-can";
import { useI18n } from "@/lib/i18n/provider";

export interface RowAction<T> extends PermissionRequirement {
  /** React kaliti + test uchun barqaror identifikator. */
  key: string;
  /** `aria-label` va tooltip matni (tarjima qilingan holda beriladi). */
  label: string;
  icon: LucideIcon;
  onSelect: (row: T) => void;
  tone?: "default" | "positive" | "danger";
  /** Qatorga qarab amalni butunlay yashirish. */
  hidden?: (row: T) => boolean;
  /** Qatorga qarab amalni o'chirib qo'yish (ko'rinadi, lekin bosilmaydi). */
  disabled?: (row: T) => boolean;
  /** Amal shu qator uchun bajarilyaptimi — tugmada spinner chiqadi. */
  loading?: (row: T) => boolean;
}

/**
 * Imtiyoz bo'yicha filtr — sof funksiya, sinovdan o'tkazish uchun ajratilgan.
 * Qatorga bog'liq `hidden` bu yerda tekshirilmaydi (ustun ko'rinishi butun
 * jadvalga tegishli, bitta qatorga emas).
 */
export function allowedRowActions<T>(
  actions: readonly RowAction<T>[],
  granted: string[] | undefined,
): RowAction<T>[] {
  return actions.filter((action) => satisfiesRequirement(granted, action));
}

/** Bitta qator uchun ko'rinadigan amallar (imtiyoz + qatorga bog'liq `hidden`). */
export function visibleRowActions<T>(
  actions: readonly RowAction<T>[],
  row: T,
  granted: string[] | undefined,
): RowAction<T>[] {
  return allowedRowActions(actions, granted).filter((action) => !action.hidden?.(row));
}

export function RowActions<T>({
  row,
  actions,
}: {
  row: T;
  actions: readonly RowAction<T>[];
}) {
  const granted = usePermissions();
  const visible = visibleRowActions(actions, row, granted);
  if (visible.length === 0) return <span className="text-ink-muted">—</span>;

  return (
    <div className="flex items-center justify-end gap-1">
      {visible.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.key}
            variant="ghost"
            size="sm"
            type="button"
            aria-label={action.label}
            title={action.label}
            disabled={action.disabled?.(row)}
            loading={action.loading?.(row)}
            onClick={() => action.onSelect(row)}
            className={cn(
              action.tone === "danger" && "text-negative",
              action.tone === "positive" && "text-positive",
            )}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}

/**
 * Kamida bitta amalga ruxsat bormi.
 *
 * Qo'lda yozilgan `<table>` larda (HR bo'limi shunday) "Amallar" ustunining
 * sarlavhasini va kataklarini shu bayroq bilan chizamiz — aks holda ruxsatsiz
 * foydalanuvchida bo'sh ustun osilib qoladi.
 */
export function useAnyRowAction<T>(actions: readonly RowAction<T>[]): boolean {
  const granted = usePermissions();
  return allowedRowActions(actions, granted).length > 0;
}

export interface RowActionsColumnConfig<T> {
  actions: readonly RowAction<T>[];
  /** Ustun sarlavhasi; berilmasa — `common.actions`. */
  header?: string;
  /** Ustun kaliti; berilmasa — `actions`. */
  key?: string;
}

/**
 * Amallar ustunini qaytaradi. Ruxsat berilgan amal qolmasa — BO'SH massiv,
 * shuning uchun `...` bilan yoyilganda ustun umuman qo'shilmaydi.
 */
export function useRowActionsColumn<T>({
  actions,
  header,
  key = "actions",
}: RowActionsColumnConfig<T>): Column<T>[] {
  const { t } = useI18n();
  const granted = usePermissions();

  if (allowedRowActions(actions, granted).length === 0) return [];

  return [
    {
      key,
      header: header ?? t("common.actions"),
      align: "right",
      render: (row) => <RowActions row={row} actions={actions} />,
    },
  ];
}
