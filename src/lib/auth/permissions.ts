/**
 * Permission matching mirrors the backend wildcard semantics:
 * `*.*` matches everything, `students.*` matches any `students.<action>`.
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
