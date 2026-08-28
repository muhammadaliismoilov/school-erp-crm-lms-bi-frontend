"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Globe, Minus, Search, ShieldCheck } from "lucide-react";
import {
  usePermissionCatalog,
  useCreateRole,
  useUpdateRole,
  type CatalogCategory,
  type DataScope,
  type LocalizedLabel,
  type PermissionCatalog,
  type Role,
  type RoleInput,
} from "@/lib/api/roles";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/card";
import { useSchoolOptions } from "@/lib/api/hr-branches";
import { affectedSchoolCount, requiresGlobalWarning } from "@/lib/roles/global-role";
import { cn } from "@/lib/utils";

type TriState = "all" | "some" | "none";

function loc(label: LocalizedLabel, locale: Locale): string {
  return label[locale] || label.uz;
}

/**
 * Derive a machine-safe role `name` (latin/digits/dashes) from the human display
 * text, so Uzbek/Cyrillic/apostrophe names pass the backend name regex.
 */
function slugifyRoleName(display: string): string {
  const slug = display
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’‘ʻ`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length >= 2 ? slug.slice(0, 80) : `role-${Date.now().toString(36)}`;
}

function codesInCategory(category: CatalogCategory): string[] {
  return category.resources.flatMap((r) => r.permissions.map((p) => p.code));
}

function triState(codes: string[], selected: Set<string>): TriState {
  if (codes.length === 0) return "none";
  let count = 0;
  for (const code of codes) if (selected.has(code)) count += 1;
  if (count === 0) return "none";
  return count === codes.length ? "all" : "some";
}

/** Filters the catalog to entries matching the query (code, action, resource, category labels). */
function filterCatalog(
  catalog: PermissionCatalog,
  query: string,
  locale: Locale,
): CatalogCategory[] {
  const q = query.trim().toLowerCase();
  if (!q) return catalog.categories;
  return catalog.categories
    .map((category) => {
      const categoryHit = loc(category.label, locale).toLowerCase().includes(q);
      const resources = category.resources
        .map((resource) => {
          const resourceHit = loc(resource.label, locale).toLowerCase().includes(q);
          const permissions =
            categoryHit || resourceHit
              ? resource.permissions
              : resource.permissions.filter(
                  (p) =>
                    p.code.toLowerCase().includes(q) ||
                    loc(p.label, locale).toLowerCase().includes(q),
                );
          return { ...resource, permissions };
        })
        .filter((resource) => resource.permissions.length > 0);
      return { ...category, resources };
    })
    .filter((category) => category.resources.length > 0);
}

function CheckBox({ state, className }: { state: TriState; className?: string }) {
  return (
    <span
      className={cn(
        "grid h-[18px] w-[18px] shrink-0 place-items-center rounded border transition-colors",
        state === "none"
          ? "border-line bg-surface text-transparent"
          : "border-accent bg-accent text-accent-fg",
        className,
      )}
    >
      {state === "all" && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {state === "some" && <Minus className="h-3.5 w-3.5" strokeWidth={3} />}
    </span>
  );
}

interface RoleFormModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the modal edits this role; otherwise it creates a new one. */
  role?: Role | null;
}

export function RoleFormModal({ open, onClose, role }: RoleFormModalProps) {
  const { t, locale } = useI18n();
  const isEdit = Boolean(role);
  const create = useCreateRole();
  const update = useUpdateRole();
  const pending = create.isPending || update.isPending;

  const catalogQuery = usePermissionCatalog(open);
  const catalog = catalogQuery.data;

  const [name, setName] = useState("");
  const [dataScope, setDataScope] = useState<DataScope>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  /**
   * Global rolni saqlashdan oldingi tasdiq bosqichi — bunday rol barcha
   * maktablarga tegishli, shuning uchun "Saqlash" darhol yozmaydi.
   */
  const [confirmingGlobal, setConfirmingGlobal] = useState(false);

  const schools = useSchoolOptions();
  const maktabSoni = affectedSchoolCount(schools.data);
  const globalOgohlantirish = requiresGlobalWarning(role, "update");

  useEffect(() => {
    if (open) {
      setName(role ? role.displayName : "");
      setDataScope(role?.dataScope ?? "all");
      setSelected(new Set(role ? role.permissions.map((p) => p.code) : []));
      setExpanded(new Set(catalog?.categories[0] ? [catalog.categories[0].key] : []));
      setSearch("");
      setError(null);
      setConfirmingGlobal(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role]);

  const totalPermissions = catalog?.totalPermissions ?? 0;

  const visibleCategories = useMemo(
    () => (catalog ? filterCatalog(catalog, search, locale) : []),
    [catalog, search, locale],
  );

  const toggleCode = (code: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const setMany = (codes: string[], shouldSelect: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const code of codes) {
        if (shouldSelect) next.add(code);
        else next.delete(code);
      }
      return next;
    });

  const toggleExpanded = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t("roles.err.nameRequired"));
      return;
    }
    if (selected.size === 0) {
      setError(t("roles.err.permissionRequired"));
      return;
    }

    // Global rol — saqlashdan oldin tasdiq. Ikkinchi bosqichda
    // `confirmingGlobal` allaqachon true bo'ladi va to'g'ridan-to'g'ri yoziladi.
    if (globalOgohlantirish && !confirmingGlobal) {
      setConfirmingGlobal(true);
      return;
    }

    await saqlash();
  }

  async function saqlash() {
    const permissionCodes = Array.from(selected);
    const display = name.trim();
    try {
      if (role) {
        const payload: Partial<RoleInput> = { permissionCodes, dataScope };
        // System role names are locked; only the display title/permissions change.
        if (!role.isSystem && display !== role.displayName) {
          payload.name = slugifyRoleName(display);
          payload.title = { uz: display };
        }
        await update.mutateAsync({ id: role.id, input: payload });
      } else {
        // The backend `name` is a machine code (latin/digits/dashes only), so the
        // human (Uzbek/Cyrillic/apostrophe) text is sent as the localized title.
        const payload: RoleInput = {
          name: slugifyRoleName(display),
          title: { uz: display },
          permissionCodes,
          dataScope,
        };
        await create.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setConfirmingGlobal(false);
      setError(err instanceof ApiError ? err.detailedMessage(locale) : t("common.error"));
    }
  }

  const globalMatn =
    maktabSoni === null
      ? t("roles.global.warnBody")
      : t("roles.global.warnBodyCount").replace("{count}", String(maktabSoni));

  return (
    <>
      {/* Tasdiq paytida forma oynasi YASHIRILADI, ichma-ich ochilmaydi: ikkita
          Modal bir vaqtda ochiq bo'lsa Escape ikkalasini ham yopib, tahrirlarni
          yo'qotardi. Holat komponentda turgani uchun forma qaytganda saqlanadi. */}
      <Modal
        open={open && !confirmingGlobal}
        onClose={onClose}
        title={isEdit ? t("roles.edit") : t("roles.new")}
        subtitle={isEdit ? role?.displayName : t("roles.subtitle")}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="role-form" loading={pending}>
              {isEdit ? t("common.save") : t("roles.create")}
            </Button>
          </>
        }
      >
      <form id="role-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Global rol — o'zgarish barcha maktablarga tegadi. Banner saqlashdan
            OLDIN ogohlantiradi, tasdiq oynasi tasodifiy bosishni ushlaydi. */}
        {globalOgohlantirish && (
          <div className="flex gap-2.5 rounded-lg bg-caution/14 p-3">
            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-caution" aria-hidden />
            <div className="text-sm">
              <p className="font-medium text-ink">{t("roles.global.warnTitle")}</p>
              <p className="mt-0.5 text-ink-soft">{globalMatn}</p>
            </div>
          </div>
        )}

        {/* 1. Nomi */}
        <section className="space-y-2">
          <h4 className="label">1. {t("roles.f.name")}</h4>
          <Field label="" htmlFor="role-name">
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("roles.f.namePlaceholder")}
              disabled={Boolean(role?.isSystem)}
              maxLength={80}
              required
            />
          </Field>
          {role?.isSystem && <p className="text-xs text-ink-muted">{t("roles.systemNameLocked")}</p>}
        </section>

        {/* 2. Ma'lumot doirasi */}
        <section className="space-y-2">
          <h4 className="label">2. {t("roles.f.dataScope")}</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["all", "own"] as const).map((scope) => (
              <button
                key={scope}
                type="button"
                onClick={() => setDataScope(scope)}
                aria-pressed={dataScope === scope}
                className={cn(
                  "rounded-lg border px-3.5 py-2.5 text-left transition-colors",
                  dataScope === scope
                    ? "border-accent bg-accent/8"
                    : "border-line hover:border-ink-muted",
                )}
              >
                <span className="block text-sm font-medium text-ink">
                  {t(`roles.scope.${scope}`)}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  {t(`roles.scope.${scope}.hint`)}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-muted">{t("roles.scope.note")}</p>
        </section>

        {/* 3. Imtiyozlar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="label">3. {t("roles.f.permissions")}</h4>
            <span className="rounded-full bg-accent/12 px-2.5 py-0.5 text-xs font-medium text-accent tnum">
              {selected.size} / {totalPermissions}
            </span>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("roles.searchPermissions")}
              className="pl-9"
            />
          </div>

          {catalogQuery.isLoading && (
            <div className="grid place-items-center py-10">
              <Spinner />
            </div>
          )}
          {catalogQuery.isError && (
            <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">
              {t("common.error")}
            </p>
          )}

          <div className="space-y-2.5">
            {visibleCategories.map((category) => {
              const codes = codesInCategory(category);
              const state = triState(codes, selected);
              const selectedCount = codes.filter((c) => selected.has(c)).length;
              const isOpen = Boolean(expanded.has(category.key) || search.trim());
              return (
                <div key={category.key} className="overflow-hidden rounded-xl border border-line">
                  <div className="flex items-center gap-3 bg-parchment/40 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setMany(codes, state !== "all")}
                      className="flex items-center gap-2.5 focus-visible:focus-ring rounded"
                      aria-label={loc(category.label, locale)}
                    >
                      <CheckBox state={state} />
                      <span className="font-medium text-ink">{loc(category.label, locale)}</span>
                    </button>
                    <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink-muted tnum">
                      {selectedCount}/{codes.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(category.key)}
                      className="ml-auto rounded p-1 text-ink-muted hover:text-ink focus-visible:focus-ring"
                      aria-expanded={isOpen}
                      aria-label={loc(category.label, locale)}
                    >
                      <ChevronDown
                        className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                      />
                    </button>
                  </div>

                  {isOpen && (
                    <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
                      {category.resources.map((resource) => {
                        const resCodes = resource.permissions.map((p) => p.code);
                        const resState = triState(resCodes, selected);
                        return (
                          <div
                            key={resource.module}
                            className="rounded-lg border border-line bg-surface p-3"
                          >
                            <button
                              type="button"
                              onClick={() => setMany(resCodes, resState !== "all")}
                              className="mb-2 flex w-full items-center gap-2 focus-visible:focus-ring rounded"
                            >
                              <CheckBox state={resState} />
                              <span className="truncate text-sm font-medium text-ink">
                                {loc(resource.label, locale)}
                              </span>
                            </button>
                            <ul className="space-y-1.5">
                              {resource.permissions.map((permission) => {
                                const checked = selected.has(permission.code);
                                return (
                                  <li key={permission.code}>
                                    <button
                                      type="button"
                                      onClick={() => toggleCode(permission.code)}
                                      className="flex w-full items-center gap-2 rounded py-0.5 text-left focus-visible:focus-ring"
                                    >
                                      <CheckBox state={checked ? "all" : "none"} />
                                      <span className="text-sm text-ink-soft">
                                        {loc(permission.label, locale)}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {catalog && visibleCategories.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-muted">{t("common.empty")}</p>
            )}
          </div>
        </section>

        {error && (
          <p className="flex items-center gap-2 rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">
            <ShieldCheck className="h-4 w-4" />
            {error}
          </p>
        )}
      </form>
      </Modal>

      {/* Tasdiq bosqichi: "Saqlash" bosilgach global rol uchun shu oyna chiqadi
          va faqat shundan keyin yoziladi (sahifadagi o'chirish tasdig'i naqshi). */}
      <Modal
        open={confirmingGlobal}
        onClose={() => setConfirmingGlobal(false)}
        size="md"
        title={t("roles.global.warnTitle")}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmingGlobal(false)}
              disabled={pending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={saqlash} loading={pending}>
              {t("roles.global.confirm")}
            </Button>
          </>
        }
      >
        <div className="flex gap-2.5">
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-caution" aria-hidden />
          <div className="text-sm">
            <p className="text-ink-soft">{globalMatn}</p>
            <p className="mt-2 font-medium text-ink">{role?.displayName}</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
