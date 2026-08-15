"use client";

/**
 * `<Can>` — imtiyozga bog'liq UI uchun yagona naqsh.
 *
 * Har sahifada `const canCreate = can("x.create")` yozib, keyin uni `&&` bilan
 * tarqatish o'rniga:
 *
 * ```tsx
 * <Can permission="hr-branches.create">
 *   <Button onClick={openCreate}>Qo'shish</Button>
 * </Can>
 *
 * <Can anyOf={["finance-contracts.create", "finance-payments.create"]} mode="disable">
 *   <Button type="submit">Saqlash</Button>
 * </Can>
 * ```
 *
 * Rejimlar:
 * - `hide` (birlamchi) — ruxsat bo'lmasa `fallback` (yoki hech nima) chiziladi.
 * - `disable` — bola element joyida qoladi, ammo `disabled` + tushuntirish
 *   tooltip'i bilan. Forma tugmalari uchun qulay: sahifa "buzilib" ketmaydi.
 *
 * Bola funksiya ham bo'lishi mumkin: `{(allowed) => ...}` — masalan matnni
 * o'zgartirish kerak bo'lganda.
 *
 * Eslatma: yashirish — himoya emas. Backend `PermissionsGuard` baribir 403
 * qaytaradi; bu komponent ishlamaydigan tugmani ko'rsatmaslik uchun.
 */

import {
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import type { PermissionRequirement } from "@/lib/auth/permissions";
import { useAllowed } from "@/lib/auth/use-can";
import { useI18n } from "@/lib/i18n/provider";

export interface CanProps extends PermissionRequirement {
  children: ReactNode | ((allowed: boolean) => ReactNode);
  /** Ruxsat bo'lmaganda ko'rsatiladigan muqobil (`hide` rejimida). */
  fallback?: ReactNode;
  mode?: "hide" | "disable";
  /** `disable` rejimidagi tooltip; berilmasa — "Ruxsat yo'q" tarjimasi. */
  deniedTitle?: string;
}

/** `disable` rejimida bolaga qo'shiladigan xossalar. */
interface DisableableProps {
  disabled?: boolean;
  title?: string;
  "aria-disabled"?: boolean;
}

export function Can({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
  mode = "hide",
  deniedTitle,
}: CanProps) {
  const { t } = useI18n();
  const allowed = useAllowed({ permission, anyOf, allOf });

  if (typeof children === "function") return <>{children(allowed)}</>;
  if (allowed) return <>{children}</>;

  // Fragment `disabled` ni qabul qilmaydi — bunday bolani yashirgan ma'qul,
  // aks holda React ogohlantirish beradi va tugma baribir bosiladigan qoladi.
  if (mode === "disable" && isValidElement(children) && children.type !== Fragment) {
    const element = children as ReactElement<DisableableProps>;
    return cloneElement(element, {
      disabled: true,
      "aria-disabled": true,
      title: deniedTitle ?? t("common.noPermission"),
    });
  }

  return <>{fallback}</>;
}
