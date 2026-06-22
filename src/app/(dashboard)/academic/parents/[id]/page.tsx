"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, GraduationCap, Pencil, Phone, User as UserIcon } from "lucide-react";
import { useUser } from "@/lib/api/users";
import { childClassLabel, childName, useParentChildren } from "@/lib/api/parents";
import { useAuthStore } from "@/lib/auth/store";
import { Badge, Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentAvatar } from "@/components/students/student-avatar";
import { UserFormModal } from "@/components/users/user-form-modal";

const GENDER_LABEL: Record<string, string> = { male: "Erkak", female: "Ayol" };
const LANG_LABEL: Record<string, string> = { uz: "O‘zbek", ru: "Rus", en: "Ingliz" };

type TabKey = "info" | "children";

export default function ParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const can = useAuthStore((s) => s.can);
  const canManage = can("users.manage");

  const [tab, setTab] = useState<TabKey>("info");
  const [editOpen, setEditOpen] = useState(false);

  const { data: user, isLoading } = useUser(id);
  const { data: kids } = useParentChildren(id);

  if (isLoading || !user) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "info", label: "Ma'lumotlar" },
    { key: "children", label: `Farzandlari${kids?.length ? ` (${kids.length})` : ""}` },
  ];

  return (
    <div className="stagger space-y-5">
      <button
        onClick={() => router.push("/academic/parents")}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Ota-onalar ro‘yxati
      </button>

      {/* Sarlavha kartasi */}
      <Card className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <StudentAvatar name={user.fullName} seed={user.id} photoUrl={user.profileImageUrl} size="lg" />
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">{user.fullName}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              {user.gender && <Badge tone="neutral">{GENDER_LABEL[user.gender] ?? user.gender}</Badge>}
              <Badge tone="positive">Ota-ona</Badge>
              {user.phone && (
                <a href={`tel:${user.phone}`} className="inline-flex items-center gap-1 text-ink-soft hover:text-accent">
                  <Phone className="h-3.5 w-3.5" /> {user.phone}
                </a>
              )}
            </div>
          </div>
        </div>
        {canManage && (
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Tahrirlash
          </Button>
        )}
      </Card>

      {/* Tablar */}
      <div className="flex gap-1 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-ink">
              <UserIcon className="h-4 w-4 text-accent" /> Shaxsiy ma'lumotlar
            </h3>
            <dl className="grid gap-y-3">
              {[
                { label: "F.I.SH", value: user.fullName },
                { label: "Ismi (kirillcha)", value: [user.lastNameCyrillic, user.firstNameCyrillic].filter(Boolean).join(" ") || "—" },
                { label: "Jinsi", value: user.gender ? GENDER_LABEL[user.gender] ?? user.gender : "—" },
                { label: "Telefon", value: user.phone || "—" },
                { label: "Email", value: user.email || "—" },
                { label: "JSHSHIR", value: user.pinfl || "—" },
                { label: "Hujjat raqami", value: user.documentNumber || "—" },
                { label: "Ish joyi", value: user.workplace || "—" },
                { label: "Login", value: user.login },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-3 border-b border-line/50 pb-2">
                  <dt className="text-sm text-ink-muted">{row.label}</dt>
                  <dd className="text-right text-sm font-medium text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      )}

      {tab === "children" && (
        <div>
          {!kids || kids.length === 0 ? (
            <Card className="grid place-items-center gap-2 py-16 text-center">
              <GraduationCap className="h-10 w-10 text-ink-muted/50" />
              <p className="font-medium text-ink">Biriktirilgan farzand yo‘q</p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {kids.map((c) => (
                <Card
                  key={c.id}
                  className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-parchment/50"
                  onClick={() => router.push(`/students/${c.id}`)}
                >
                  <StudentAvatar name={childName(c)} seed={c.id} photoUrl={c.photoUrl} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{childName(c)}</p>
                    <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                      {childClassLabel(c.currentClass) && <span>{childClassLabel(c.currentClass)}</span>}
                      {c.preferredLanguage && <span>· {LANG_LABEL[c.preferredLanguage] ?? c.preferredLanguage}</span>}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <UserFormModal open={editOpen} onClose={() => setEditOpen(false)} user={user} defaultRoleName="parent" lockRole />
    </div>
  );
}
