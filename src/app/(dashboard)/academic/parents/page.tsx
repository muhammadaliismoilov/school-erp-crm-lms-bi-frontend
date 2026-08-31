"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Unlink,
  UserMinus,
  UserRound,
  Users,
} from "lucide-react";
import {
  useDeleteUser,
  useResetPassword,
  useUpdateUser,
  useUsers,
  type User,
  type UserGender,
} from "@/lib/api/users";
import {
  childName,
  generatePassword,
  useParentChildren,
  useParentChildrenMap,
  useUnlinkChild,
} from "@/lib/api/parents";
import { useClassList } from "@/lib/api/classes";
import { Badge, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select, type SelectOption } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/students/stat-card";
import { StudentAvatar } from "@/components/students/student-avatar";
import { UserFormModal } from "@/components/users/user-form-modal";
import { CredentialsModal } from "@/components/users/credentials-modal";
import { useCan } from "@/lib/auth/use-can";
import { useDebouncedSearch } from "@/lib/hooks/use-debounced-search";

const GENDER_TABS: { value: "" | UserGender; label: string }[] = [
  { value: "", label: "Barchasi" },
  { value: "male", label: "Erkak" },
  { value: "female", label: "Ayol" },
];

const GENDER_LABEL: Record<string, string> = { male: "Erkak", female: "Ayol" };

const PAGE_SIZE = 20;

export default function ParentsPage() {
  const router = useRouter();
  const can = useCan();
  // Gate each action on the permission its backend endpoint actually requires
  // (there is no broad "users" write permission — that left the menu hidden for
  // every non-superadmin role).
  const canCreate = can("users.create");
  const canUpdate = can("users.update");
  // Ajratish → DELETE students/:id/parents/:parentId → `student-parents.delete`.
  const canUnlink = can("student-parents.delete");
  const canManage = canUpdate || canUnlink;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const searchQuery = useDebouncedSearch(search);
  // Qidiruv o'zgarsa birinchi sahifaga qaytamiz. Reset DEBOUNCELANGAN qiymatga
  // bog'langan: harf bosilganda qaytarsak, kutish tugashidan oldin eski qidiruv
  // bilan ortiqcha so'rov ketardi (foydalanuvchi 1-sahifada bo'lmasa).
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);
  const [gender, setGender] = useState<"" | UserGender>("");
  const [classId, setClassId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [childrenFor, setChildrenFor] = useState<User | null>(null);
  const [resetFor, setResetFor] = useState<User | null>(null);
  const [newCreds, setNewCreds] = useState<{ login: string; password: string } | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useUsers({
    role: "PARENT",
    page,
    limit: 20,
    search: searchQuery,
    gender: gender || undefined,
    childClassId: classId || undefined,
  });

  // Lightweight breakdown — only meta.total is read from each query.
  const totalQ = useUsers({ role: "PARENT", limit: 1 });
  const maleQ = useUsers({ role: "PARENT", gender: "male", limit: 1 });
  const femaleQ = useUsers({ role: "PARENT", gender: "female", limit: 1 });
  const activeQ = useUsers({ role: "PARENT", status: "active", limit: 1 });

  const classesQ = useClassList();
  const classOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "Barcha sinflar" },
      ...(classesQ.data?.items ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [classesQ.data],
  );

  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();
  const resetPasswordMut = useResetPassword();
  const unlinkChild = useUnlinkChild();

  const rows = useMemo(() => data?.items ?? [], [data]);
  const pageCount = data?.meta.pageCount ?? 1;

  const parentIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const { data: childrenMap } = useParentChildrenMap(parentIds);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(user: User) {
    setEditing(user);
    setFormOpen(true);
    setMenuFor(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    await deleteUser.mutateAsync(deleting.id);
    setDeleting(null);
    refetch();
  }

  async function confirmReset() {
    if (!resetFor) return;
    const password = generatePassword();
    // Parol tiklash — alohida endpoint (users.reset-password), T-02.
    await resetPasswordMut.mutateAsync({ id: resetFor.id, password });
    // Surface the new password once via the credentials dialog.
    setNewCreds({ login: resetFor.login, password });
    setResetFor(null);
  }

  function exportCsv() {
    const header = ["F.I.SH", "Telefon", "Jinsi", "Farzandlar", "Ish joyi", "Hujjat raqami"];
    const lines = rows.map((r) =>
      [
        r.fullName,
        r.phone ?? "",
        r.gender ? GENDER_LABEL[r.gender] ?? r.gender : "",
        (childrenMap?.[r.id] ?? []).map(childName).join("; "),
        r.workplace ?? "",
        r.documentNumber ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = "﻿" + [header.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ota-onalar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="stagger" onClick={() => menuFor && setMenuFor(null)}>
      <PageHeader
        title="Ota-onalar ro‘yxati"
        subtitle="PARENT rolidagi foydalanuvchilar"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>
              <Download className="h-4 w-4" /> Excel (CSV)
            </Button>
            {canCreate && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Ota-ona qo‘shish
              </Button>
            )}
          </div>
        }
      />

      {/* Statistika */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jami ota-onalar" value={totalQ.data?.meta.total ?? "—"} icon={<Users className="h-5 w-5" />} tone="accent" />
        <StatCard label="Erkaklar" value={maleQ.data?.meta.total ?? "—"} icon={<UserRound className="h-5 w-5" />} tone="sky" />
        <StatCard label="Ayollar" value={femaleQ.data?.meta.total ?? "—"} icon={<UserRound className="h-5 w-5" />} tone="rose" />
        <StatCard label="Faol" value={activeQ.data?.meta.total ?? "—"} icon={<ShieldCheck className="h-5 w-5" />} tone="violet" />
      </div>

      {/* Filtrlar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, login yoki telefon bo‘yicha qidirish"
            className="pl-9"
          />
        </div>
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
          {GENDER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setGender(tab.value);
                setPage(1);
              }}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                gender === tab.value ? "bg-accent text-accent-fg" : "text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="min-w-[180px]">
          <Select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setPage(1);
            }}
            options={classOptions}
          />
        </div>
      </div>

      {/* Jadval */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-parchment-deep/40">
                <th className="label px-4 py-3 text-left">№</th>
                <th className="label px-4 py-3 text-left">F.I.SH</th>
                <th className="label px-4 py-3 text-left">Jinsi</th>
                <th className="label px-4 py-3 text-left">Farzandlari</th>
                <th className="label px-4 py-3 text-left">Ish joyi</th>
                <th className="label px-4 py-3 text-left">Hujjat raqami</th>
                <th className="label px-4 py-3 text-right" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-16">
                    <div className="grid place-items-center">
                      <Spinner className="h-6 w-6" />
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <p className="mb-3 text-sm text-ink-muted">Ma'lumotni yuklab bo‘lmadi</p>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>
                      Qayta urinish
                    </Button>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-ink-muted">
                    Ota-onalar topilmadi
                  </td>
                </tr>
              )}

              {rows.map((u, i) => {
                const kids = childrenMap?.[u.id] ?? [];
                return (
                  <tr
                    key={u.id}
                    className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-parchment/50"
                    onClick={() => router.push(`/academic/parents/${u.id}`)}
                  >
                    <td className="px-4 py-3 text-ink-muted tnum">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <StudentAvatar name={u.fullName} seed={u.id} photoUrl={u.profileImageUrl} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{u.fullName}</p>
                          <p className="text-xs text-ink-muted tnum">{u.phone ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.gender ? (
                        <Badge tone="neutral">{GENDER_LABEL[u.gender] ?? u.gender}</Badge>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {kids.length === 0 ? (
                        <span className="text-ink-muted">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {kids.slice(0, 2).map((c) => (
                            <Badge key={c.id} tone="neutral">
                              {childName(c)}
                            </Badge>
                          ))}
                          {kids.length > 2 && <Badge tone="neutral">+{kids.length - 2}</Badge>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{u.workplace ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft tnum">{u.documentNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {canManage && (
                        <div className="relative inline-block">
                          <button
                            onClick={() => setMenuFor(menuFor === u.id ? null : u.id)}
                            aria-label="Amallar"
                            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-parchment hover:text-ink"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menuFor === u.id && (
                            <div
                              role="menu"
                              className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg"
                            >
                              <button
                                role="menuitem"
                                onClick={() => {
                                  setMenuFor(null);
                                  router.push(`/academic/parents/${u.id}`);
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink hover:bg-parchment"
                              >
                                <Eye className="h-4 w-4 text-sky-500" /> Tafsilotlar
                              </button>
                              {canUpdate && (
                                <button
                                  role="menuitem"
                                  onClick={() => {
                                    setResetFor(u);
                                    setMenuFor(null);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink hover:bg-parchment"
                                >
                                  <KeyRound className="h-4 w-4 text-amber-500" /> Parolni yangilash
                                </button>
                              )}
                              {canUpdate && (
                                <button
                                  role="menuitem"
                                  onClick={() => openEdit(u)}
                                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink hover:bg-parchment"
                                >
                                  <Pencil className="h-4 w-4 text-indigo-500" /> Tahrirlash
                                </button>
                              )}
                              {(canUnlink || canUpdate) && <div className="my-1 border-t border-line/70" />}
                              {canUnlink && (
                                <button
                                  role="menuitem"
                                  onClick={() => {
                                    setChildrenFor(u);
                                    setMenuFor(null);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-orange-600 hover:bg-orange-500/8"
                                >
                                  <UserMinus className="h-4 w-4" /> O‘quvchini ajratish
                                </button>
                              )}
                              {canUpdate && (
                                <button
                                  role="menuitem"
                                  onClick={() => {
                                    setDeleting(u);
                                    setMenuFor(null);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-negative hover:bg-negative/8"
                                >
                                  <Trash2 className="h-4 w-4" /> O‘chirish
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isLoading && rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
            <span className="text-ink-muted">
              Jami: <span className="tnum text-ink">{data?.meta.total ?? 0}</span>
            </span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Oldingi
              </Button>
              <span className="tnum text-ink-muted">
                {page} / {pageCount}
              </span>
              <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                Keyingi
              </Button>
            </div>
          </div>
        )}
      </div>

      <UserFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          refetch();
        }}
        user={editing}
        defaultRoleName="parent"
        lockRole
      />

      <ChildrenModal parent={childrenFor} onClose={() => setChildrenFor(null)} unlink={unlinkChild} />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Ota-onani o‘chirish"
        subtitle={deleting?.fullName}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Bekor qilish
            </Button>
            <Button variant="danger" loading={deleteUser.isPending} onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" /> O‘chirish
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Ushbu ota-ona hisobi o‘chiriladi (soft-delete). Farzandlar bilan bog‘lanishlar ham bekor bo‘ladi.
        </p>
      </Modal>

      <Modal
        open={Boolean(resetFor)}
        onClose={() => setResetFor(null)}
        title="Parolni yangilash"
        subtitle={resetFor?.fullName}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetFor(null)}>
              Bekor qilish
            </Button>
            <Button variant="accent" loading={updateUser.isPending} onClick={confirmReset}>
              <KeyRound className="h-4 w-4" /> Yangi parol yaratish
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Yangi tasodifiy parol yaratiladi va bir marta ko‘rsatiladi. Eski parol bekor bo‘ladi —
          uni nusxalab, ota-onaga yetkazing.
        </p>
      </Modal>

      <CredentialsModal
        open={Boolean(newCreds)}
        credentials={newCreds}
        onClose={() => setNewCreds(null)}
      />
    </div>
  );
}

function ChildrenModal({
  parent,
  onClose,
  unlink,
}: {
  parent: User | null;
  onClose: () => void;
  unlink: ReturnType<typeof useUnlinkChild>;
}) {
  const { data: kids, isLoading } = useParentChildren(parent?.id ?? null);
  return (
    <Modal open={Boolean(parent)} onClose={onClose} size="md" title="O‘quvchini ajratish" subtitle={parent?.fullName}>
      {isLoading ? (
        <div className="grid place-items-center py-10">
          <Spinner className="h-5 w-5" />
        </div>
      ) : !kids || kids.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">Biriktirilgan farzand yo‘q</p>
      ) : (
        <ul className="divide-y divide-line/60">
          {kids.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm font-medium text-ink">{childName(c)}</span>
              <button
                onClick={() =>
                  parent && unlink.mutate({ studentId: c.id, parentId: parent.id })
                }
                disabled={unlink.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-negative hover:bg-negative/8 disabled:opacity-50"
              >
                <Unlink className="h-3.5 w-3.5" /> Ajratish
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
