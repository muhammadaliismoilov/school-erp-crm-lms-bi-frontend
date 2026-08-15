"use client";

/**
 * Imtiyoz hook'lari — sahifalar uchun yagona kirish nuqtasi.
 *
 * Nega store'dagi `can` emas? `useAuthStore((s) => s.can)` barqaror funksiya
 * qaytaradi: komponent imtiyozlar RO'YXATIGA obuna bo'lmaydi, shuning uchun
 * profil yangilangach (2FA, refresh, rol o'zgarishi) tugmalar qayta chizilmaydi.
 * Bu yerdagi hook'lar `user.permissions` ga obuna bo'ladi va qayta render qiladi.
 *
 * Eslatma: bu qatlam faqat UX uchun — haqiqiy tekshiruv backend'da.
 */

import { useMemo } from "react";
import {
  crudPermissions,
  hasPermission,
  satisfiesRequirement,
  type CrudPermissions,
  type PermissionRequirement,
} from "./permissions";
import { useAuthStore } from "./store";

/** Bo'sh ro'yxat uchun barqaror havola — har renderda yangi massiv yaratmaslik. */
const EMPTY: string[] = [];

/** Joriy foydalanuvchining imtiyoz kodlari (kirmagan bo'lsa — bo'sh). */
export function usePermissions(): string[] {
  return useAuthStore((s) => s.user?.permissions ?? EMPTY);
}

/**
 * Reaktiv `can` — `useAuthStore((s) => s.can)` ning to'g'ridan-to'g'ri o'rnini
 * bosadi, lekin imtiyozlar o'zgarsa komponent qayta chiziladi.
 */
export function useCan(): (permission?: string) => boolean {
  const granted = usePermissions();
  return useMemo(
    () => (permission?: string) => hasPermission(granted, permission),
    [granted],
  );
}

/** `{ permission, anyOf, allOf }` shartini baholaydi (`<Can>` bilan bir xil). */
export function useAllowed(requirement: PermissionRequirement | undefined): boolean {
  const granted = usePermissions();
  return satisfiesRequirement(granted, requirement);
}

/**
 * Bitta resursning CRUD bayroqlari:
 *
 * ```ts
 * const { canCreate, canUpdate, canDelete, canMutate } = useCrudPermissions("hr-branches");
 * ```
 */
export function useCrudPermissions(resource: string): CrudPermissions {
  const granted = usePermissions();
  return useMemo(() => crudPermissions(granted, resource), [granted, resource]);
}
