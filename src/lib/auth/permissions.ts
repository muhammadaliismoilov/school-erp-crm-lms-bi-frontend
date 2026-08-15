/**
 * Imtiyoz moslashtirish backend semantikasini takrorlaydi:
 * `*.*` hammasiga, `students.*` esa istalgan `students.<amal>` ga mos keladi.
 *
 * MUHIM: bu qatlam — QULAYLIK. Ro'yxat localStorage'dagi profildan o'qiladi,
 * demak ishonchsiz. Haqiqiy himoya backend'da (`PermissionsGuard`); bu yerda
 * faqat foydalanuvchiga ishlamaydigan tugmani ko'rsatmaslik uchun tekshiramiz.
 */
export function permissionMatches(granted: string, required: string): boolean {
  if (granted === required) return true;
  const [grantedModule, grantedAction] = granted.split(".");
  const [requiredModule, requiredAction] = required.split(".");
  const moduleOk = grantedModule === "*" || grantedModule === requiredModule;
  const actionOk = grantedAction === "*" || grantedAction === requiredAction;
  return moduleOk && actionOk;
}

export function hasPermission(
  granted: string[] | undefined,
  required: string | undefined,
): boolean {
  if (!required) return true;
  if (!granted || granted.length === 0) return false;
  return granted.some((g) => permissionMatches(g, required));
}

/** Ro'yxatdagi kamida bittasi bo'lsa — rost. Bo'sh/berilmagan ro'yxat = shart yo'q. */
export function hasAnyPermission(
  granted: string[] | undefined,
  required: readonly string[] | undefined,
): boolean {
  if (!required || required.length === 0) return true;
  return required.some((code) => hasPermission(granted, code));
}

/** Ro'yxatdagi hammasi bo'lsa — rost. Bo'sh/berilmagan ro'yxat = shart yo'q. */
export function hasAllPermissions(
  granted: string[] | undefined,
  required: readonly string[] | undefined,
): boolean {
  if (!required || required.length === 0) return true;
  return required.every((code) => hasPermission(granted, code));
}

/**
 * Bir joyda ifodalangan imtiyoz sharti.
 *
 * Uchala maydon ham ixtiyoriy va ular VA (AND) bilan birlashadi:
 * `permission` — aynan shu kod; `anyOf` — kamida bittasi; `allOf` — hammasi.
 * Hech biri berilmasa (yoki massivlar bo'sh bo'lsa) — shart yo'q, ruxsat bor.
 */
export interface PermissionRequirement {
  permission?: string;
  anyOf?: readonly string[];
  allOf?: readonly string[];
}

export function satisfiesRequirement(
  granted: string[] | undefined,
  requirement: PermissionRequirement | undefined,
): boolean {
  if (!requirement) return true;
  return (
    hasPermission(granted, requirement.permission) &&
    hasAnyPermission(granted, requirement.anyOf) &&
    hasAllPermissions(granted, requirement.allOf)
  );
}

/**
 * Bitta resurs uchun CRUD bayroqlari.
 *
 * Granular rollout'dan keyin backendda har resurs `<resurs>.create|read|update|
 * delete` kodlariga ega (`hr-branches.create` kabi). Sahifalar shu to'rtlikni
 * qayta-qayta yozmasligi uchun bitta joydan olinadi.
 */
export interface CrudPermissions {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  /** create | update | delete — biror o'zgartirish mumkinmi (amal ustuni uchun). */
  canMutate: boolean;
}

export function crudPermissions(
  granted: string[] | undefined,
  resource: string,
): CrudPermissions {
  const canCreate = hasPermission(granted, `${resource}.create`);
  const canUpdate = hasPermission(granted, `${resource}.update`);
  const canDelete = hasPermission(granted, `${resource}.delete`);
  return {
    canRead: hasPermission(granted, `${resource}.read`),
    canCreate,
    canUpdate,
    canDelete,
    canMutate: canCreate || canUpdate || canDelete,
  };
}
