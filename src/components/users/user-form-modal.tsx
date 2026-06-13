"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, KeyRound, Loader2, X } from "lucide-react";
import {
  USER_GENDERS,
  USER_ROLES,
  useCreateUser,
  useUpdateUser,
  type User,
  type UserGender,
  type UserInput,
  type UserRole,
} from "@/lib/api/users";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE,
  useUploadFile,
} from "@/lib/api/files";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Modal } from "@/components/ui/modal";
import { Select, type SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FormState {
  firstName: string;
  firstNameCyrillic: string;
  lastName: string;
  lastNameCyrillic: string;
  middleName: string;
  middleNameCyrillic: string;
  birthDate: string;
  documentNumber: string;
  gender: UserGender;
  phone: string;
  role: UserRole;
  pinfl: string;
  profileImageUrl: string | null;
  profileImageFileId: string | null;
}

const emptyForm: FormState = {
  firstName: "",
  firstNameCyrillic: "",
  lastName: "",
  lastNameCyrillic: "",
  middleName: "",
  middleNameCyrillic: "",
  birthDate: "",
  documentNumber: "",
  gender: "male",
  phone: "",
  role: "STUDENT",
  pinfl: "",
  profileImageUrl: null,
  profileImageFileId: null,
};

function roleOf(user: User): UserRole {
  const candidate = (user.role ?? user.roles[0]?.name ?? "").toUpperCase();
  return (USER_ROLES as readonly string[]).includes(candidate)
    ? (candidate as UserRole)
    : "STUDENT";
}

function fromUser(user: User): FormState {
  return {
    firstName: user.firstName ?? "",
    firstNameCyrillic: user.firstNameCyrillic ?? "",
    lastName: user.lastName ?? "",
    lastNameCyrillic: user.lastNameCyrillic ?? "",
    middleName: user.middleName ?? "",
    middleNameCyrillic: user.middleNameCyrillic ?? "",
    birthDate: user.birthDate ?? "",
    documentNumber: user.documentNumber ?? "",
    gender: user.gender ?? "male",
    phone: user.phone ?? "",
    role: roleOf(user),
    pinfl: user.pinfl ?? "",
    profileImageUrl: user.profileImageUrl ?? null,
    profileImageFileId: user.profileImageFileId ?? null,
  };
}

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the modal edits this user; otherwise it creates a new one. */
  user?: User | null;
}

export function UserFormModal({ open, onClose, user }: UserFormModalProps) {
  const { t, locale } = useI18n();
  const isEdit = Boolean(user);
  const create = useCreateUser();
  const update = useUpdateUser();
  const uploadAvatar = useUploadFile();
  const pending = create.isPending || update.isPending;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(user ? fromUser(user) : emptyForm);
      setError(null);
      setAvatarError(null);
      setPassword("");
      setPasswordError(null);
      setPasswordSaved(false);
    }
  }, [open, user]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setAvatarError(null);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError(t("users.err.avatarType"));
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      setAvatarError(t("users.err.avatarSize"));
      return;
    }

    try {
      const uploaded = await uploadAvatar.mutateAsync(file);
      setForm((prev) => ({
        ...prev,
        profileImageUrl: uploaded.url ?? prev.profileImageUrl,
        profileImageFileId: uploaded.id,
      }));
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.localized(locale) : t("common.error"));
    }
  }

  function removeAvatar() {
    setAvatarError(null);
    setForm((prev) => ({ ...prev, profileImageUrl: null, profileImageFileId: null }));
  }

  const avatarInitials =
    `${form.firstName[0] ?? ""}${form.lastName[0] ?? ""}`.toUpperCase() || "?";

  const roleOptions: SelectOption[] = useMemo(
    () => USER_ROLES.map((r) => ({ value: r, label: t(`users.role.${r}`) })),
    [t],
  );

  function buildPayload(): UserInput {
    const trimmed = (s: string) => {
      const v = s.trim();
      return v.length ? v : undefined;
    };
    return {
      firstName: form.firstName.trim(),
      firstNameCyrillic: form.firstNameCyrillic.trim(),
      lastName: form.lastName.trim(),
      lastNameCyrillic: form.lastNameCyrillic.trim(),
      middleName: trimmed(form.middleName),
      middleNameCyrillic: trimmed(form.middleNameCyrillic),
      birthDate: trimmed(form.birthDate),
      documentNumber: trimmed(form.documentNumber),
      gender: form.gender,
      phone: trimmed(form.phone),
      role: form.role,
      pinfl: trimmed(form.pinfl),
      profileImageUrl: form.profileImageUrl,
      profileImageFileId: form.profileImageFileId,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !form.firstName.trim() ||
      !form.firstNameCyrillic.trim() ||
      !form.lastName.trim() ||
      !form.lastNameCyrillic.trim()
    ) {
      setError(t("users.err.nameRequired"));
      return;
    }

    const payload = buildPayload();
    try {
      if (user) {
        await update.mutateAsync({ id: user.id, input: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.localized(locale) : t("common.error"));
    }
  }

  async function handlePasswordSave() {
    if (!user) return;
    setPasswordError(null);
    setPasswordSaved(false);
    if (password.trim().length < 8) {
      setPasswordError(t("users.err.passwordLength"));
      return;
    }
    try {
      await update.mutateAsync({ id: user.id, input: { password: password.trim() } });
      setPassword("");
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.localized(locale) : t("common.error"));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("users.edit") : t("users.new")}
      subtitle={isEdit ? user?.fullName : t("users.subtitle")}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="user-form" loading={pending}>
            {isEdit ? t("common.save") : t("users.create")}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-7">
        {/* Profil rasmi */}
        <section className="flex flex-col items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className={cn(
                "group relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-line bg-parchment",
                "transition-colors hover:border-accent focus-visible:focus-ring disabled:cursor-not-allowed",
              )}
              aria-label={t("users.avatar.upload")}
            >
              {form.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.profileImageUrl}
                  alt={t("users.avatar.alt")}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-display text-2xl font-semibold text-ink-muted">
                  {avatarInitials}
                </span>
              )}
              <span
                className={cn(
                  "absolute inset-0 grid place-items-center bg-ink/45 text-paper opacity-0 transition-opacity",
                  "group-hover:opacity-100",
                  uploadAvatar.isPending && "opacity-100",
                )}
              >
                {uploadAvatar.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </span>
            </button>
            {form.profileImageUrl && !uploadAvatar.isPending && (
              <button
                type="button"
                onClick={removeAvatar}
                aria-label={t("users.avatar.remove")}
                className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border border-line bg-surface text-negative shadow-card transition-colors hover:bg-negative hover:text-white focus-visible:focus-ring"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-ink-muted">{t("users.avatar.hint")}</p>
          {avatarError && <p className="text-xs text-negative">{avatarError}</p>}
        </section>

        {/* Shaxsiy ma'lumotlar */}
        <section className="space-y-4">
          <h4 className="label">{t("users.section.personal")}</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t("users.f.firstName")} *`} htmlFor="u-first">
              <Input
                id="u-first"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder={t("users.f.firstName")}
                required
                maxLength={80}
              />
            </Field>
            <Field label={`${t("users.f.firstNameCyrillic")} *`} htmlFor="u-first-cyr">
              <Input
                id="u-first-cyr"
                value={form.firstNameCyrillic}
                onChange={(e) => set("firstNameCyrillic", e.target.value)}
                placeholder={t("users.f.firstNameCyrillic")}
                required
                maxLength={80}
              />
            </Field>
            <Field label={`${t("users.f.lastName")} *`} htmlFor="u-last">
              <Input
                id="u-last"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder={t("users.f.lastName")}
                required
                maxLength={80}
              />
            </Field>
            <Field label={`${t("users.f.lastNameCyrillic")} *`} htmlFor="u-last-cyr">
              <Input
                id="u-last-cyr"
                value={form.lastNameCyrillic}
                onChange={(e) => set("lastNameCyrillic", e.target.value)}
                placeholder={t("users.f.lastNameCyrillic")}
                required
                maxLength={80}
              />
            </Field>
            <Field label={t("users.f.middleName")} htmlFor="u-middle">
              <Input
                id="u-middle"
                value={form.middleName}
                onChange={(e) => set("middleName", e.target.value)}
                placeholder={t("users.f.middleName")}
                maxLength={80}
              />
            </Field>
            <Field label={t("users.f.middleNameCyrillic")} htmlFor="u-middle-cyr">
              <Input
                id="u-middle-cyr"
                value={form.middleNameCyrillic}
                onChange={(e) => set("middleNameCyrillic", e.target.value)}
                placeholder={t("users.f.middleNameCyrillic")}
                maxLength={80}
              />
            </Field>
          </div>
        </section>

        {/* Asosiy ma'lumotlar */}
        <section className="space-y-4">
          <h4 className="label">{t("users.section.main")}</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("users.f.birthDate")} htmlFor="u-birth">
              <DateInput
                id="u-birth"
                value={form.birthDate}
                onChange={(iso) => set("birthDate", iso)}
              />
            </Field>
            <Field label={t("users.f.documentNumber")} htmlFor="u-doc">
              <Input
                id="u-doc"
                value={form.documentNumber}
                onChange={(e) => set("documentNumber", e.target.value)}
                placeholder="AB1234567"
                maxLength={32}
              />
            </Field>
            <Field label={t("users.f.gender")} htmlFor="u-gender">
              <div className="flex h-10 items-center gap-2" role="radiogroup" aria-label={t("users.f.gender")}>
                {USER_GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={form.gender === g}
                    onClick={() => set("gender", g)}
                    className={cn(
                      "h-10 flex-1 rounded-lg border text-sm font-medium transition-colors",
                      form.gender === g
                        ? "border-accent bg-accent/12 text-accent"
                        : "border-line bg-surface text-ink-soft hover:border-ink-muted",
                    )}
                  >
                    {t(`users.gender.${g}`)}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={t("users.f.phone")} htmlFor="u-phone">
              <Input
                id="u-phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+998901234567"
                maxLength={13}
              />
            </Field>
          </div>
        </section>

        {/* Rol & PINFL */}
        <section className="space-y-4">
          <h4 className="label">{t("users.section.role")}</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t("users.f.role")} *`} htmlFor="u-role">
              <Select
                id="u-role"
                value={form.role}
                onChange={(e) => set("role", e.target.value as UserRole)}
                options={roleOptions}
              />
            </Field>
            <Field label={t("users.f.pinfl")} htmlFor="u-pinfl">
              <Input
                id="u-pinfl"
                value={form.pinfl}
                onChange={(e) => set("pinfl", e.target.value.replace(/\D/g, ""))}
                placeholder={t("users.placeholder.pinfl")}
                maxLength={14}
                inputMode="numeric"
              />
            </Field>
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">{error}</p>
        )}
      </form>

      {/* Parolni tahrirlash — faqat tahrirlash rejimida */}
      {isEdit && (
        <section className="mt-7 space-y-4 border-t border-line pt-6">
          <h4 className="label flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            {t("users.section.password")}
          </h4>
          <div className="flex items-end gap-3">
            <Field label={t("users.f.password")} htmlFor="u-password">
              <Input
                id="u-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordSaved(false);
                }}
                placeholder={t("users.placeholder.password")}
                autoComplete="new-password"
              />
            </Field>
            <Button
              type="button"
              variant="accent"
              onClick={handlePasswordSave}
              loading={update.isPending}
              disabled={password.trim().length === 0}
            >
              {t("users.editPassword")}
            </Button>
          </div>
          {passwordError && <p className="text-xs text-negative">{passwordError}</p>}
          {passwordSaved && <p className="text-xs text-positive">{t("users.passwordSaved")}</p>}
        </section>
      )}
    </Modal>
  );
}
