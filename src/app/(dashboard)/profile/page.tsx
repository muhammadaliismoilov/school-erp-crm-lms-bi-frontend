"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { ImageIcon, UserCircle2, Check } from "lucide-react";
import {
  useProfile,
  useUpdateProfile,
  type UpdateProfileInput,
} from "@/lib/api/profile";
import { ApiError } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Card, Spinner } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { cn } from "@/lib/utils";

type FormValues = UpdateProfileInput & { login?: string };

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const { data: profile, isLoading, isError } = useProfile();
  const updateProfile = useUpdateProfile();

  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<FormValues>();

  // Seed the form once the profile loads.
  useEffect(() => {
    if (!profile) return;
    reset({
      firstName: profile.firstName,
      firstNameCyrillic: profile.firstNameCyrillic,
      lastName: profile.lastName,
      lastNameCyrillic: profile.lastNameCyrillic,
      middleName: profile.middleName ?? "",
      middleNameCyrillic: profile.middleNameCyrillic ?? "",
      birthDate: profile.birthDate ?? "",
      documentNumber: profile.documentNumber ?? "",
      gender: profile.gender,
      login: profile.login,
    });
    setImageUrl(profile.profileImageUrl);
  }, [profile, reset]);

  const gender = watch("gender");

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSaved(false);

    // PATCH only what actually changed — re-sending untouched seed fields
    // (e.g. a Latin-only Cyrillic value) would trip server-side validation.
    const payload: Record<string, string | null> = {};
    for (const key of Object.keys(dirtyFields) as (keyof FormValues)[]) {
      if (key === "login") continue; // read-only, never editable
      const value = values[key];
      payload[key] = value === "" || value == null ? null : value;
    }
    if (imageUrl !== (profile?.profileImageUrl ?? null)) {
      payload.profileImageUrl = imageUrl || null;
    }

    if (Object.keys(payload).length === 0) {
      setSaved(true);
      return;
    }

    try {
      await updateProfile.mutateAsync(payload as UpdateProfileInput);
      setSaved(true);
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.localized(locale) : t("common.error"),
      );
    }
  }

  if (isLoading) {
    return (
      <div className="grid place-items-center py-32">
        <Spinner />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <p className="rounded-lg border border-negative/30 bg-negative/8 px-4 py-3 text-sm text-negative">
        {t("common.error")}
      </p>
    );
  }

  return (
    <div className="stagger">
      {/* Page heading */}
      <div className="mb-7 flex items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-navy text-paper">
          <UserCircle2 className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            Mening profilim
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Profil ma'lumotlarini boshqaring
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-6 lg:grid-cols-[300px_1fr]"
      >
        {/* Left — profile picture */}
        <Card className="h-fit p-6">
          <h3 className="font-display text-base font-semibold text-ink">
            Profil rasmi
          </h3>
          <p className="mt-0.5 text-sm text-ink-muted">
            Profil rasmini yangilang
          </p>

          <div className="mt-6 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowUrlInput((v) => !v)}
              className={cn(
                "group grid h-40 w-40 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-surface transition-colors",
                "hover:border-accent hover:bg-parchment",
              )}
              title="Profil rasmini o'zgartirish"
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={profile.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-10 w-10 text-ink-muted/60 transition-colors group-hover:text-accent" />
              )}
            </button>

            {showUrlInput && (
              <div className="mt-4 w-full space-y-2">
                <Input
                  placeholder="https://…/rasm.png"
                  defaultValue={imageUrl ?? ""}
                  onChange={(e) => setImageUrl(e.target.value || null)}
                  className="text-xs"
                />
                <p className="text-[11px] text-ink-muted">
                  Rasm uchun to'liq URL manzilini kiriting.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Right — personal information */}
        <Card className="p-6">
          <h3 className="font-display text-base font-semibold text-ink">
            Shaxsiy ma'lumotlar
          </h3>
          <p className="mt-0.5 text-sm text-ink-muted">
            Shaxsiy ma'lumotlaringizni yangilang
          </p>

          <div className="mt-6 space-y-5">
            {/* Latin names */}
            <div className="grid gap-5 sm:grid-cols-3">
              <Field
                label="Ism"
                htmlFor="firstName"
                error={errors.firstName && t("common.error")}
              >
                <Input
                  id="firstName"
                  {...register("firstName", { required: true, maxLength: 80 })}
                />
              </Field>
              <Field
                label="Familiya"
                htmlFor="lastName"
                error={errors.lastName && t("common.error")}
              >
                <Input
                  id="lastName"
                  {...register("lastName", { required: true, maxLength: 80 })}
                />
              </Field>
              <Field label="Otasining ismi" htmlFor="middleName">
                <Input id="middleName" {...register("middleName")} />
              </Field>
            </div>

            {/* Cyrillic names */}
            <div className="grid gap-5 sm:grid-cols-3">
              <Field
                label="Ism (kirill)"
                htmlFor="firstNameCyrillic"
                error={errors.firstNameCyrillic && t("common.error")}
              >
                <Input
                  id="firstNameCyrillic"
                  {...register("firstNameCyrillic")}
                />
              </Field>
              <Field
                label="Familiya (kirill)"
                htmlFor="lastNameCyrillic"
                error={errors.lastNameCyrillic && t("common.error")}
              >
                <Input
                  id="lastNameCyrillic"
                  {...register("lastNameCyrillic")}
                />
              </Field>
              <Field label="Otasining ismi (kirill)" htmlFor="middleNameCyrillic">
                <Input
                  id="middleNameCyrillic"
                  {...register("middleNameCyrillic")}
                />
              </Field>
            </div>

            {/* Birth date + gender */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Tug'ilgan sana" htmlFor="birthDate">
                <Controller
                  control={control}
                  name="birthDate"
                  render={({ field }) => (
                    <DateInput
                      id="birthDate"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
              <Field label="Jins">
                <div className="flex gap-3">
                  <GenderOption
                    label="Erkak"
                    selected={gender === "male"}
                    onClick={() =>
                      setValue("gender", "male", { shouldDirty: true })
                    }
                  />
                  <GenderOption
                    label="Ayol"
                    selected={gender === "female"}
                    onClick={() =>
                      setValue("gender", "female", { shouldDirty: true })
                    }
                  />
                </div>
              </Field>
            </div>

            {/* Document number + login */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Hujjat raqami" htmlFor="documentNumber">
                <Input
                  id="documentNumber"
                  className="font-mono uppercase"
                  {...register("documentNumber")}
                />
              </Field>
              <Field label="Login" htmlFor="login">
                <Input
                  id="login"
                  readOnly
                  className="cursor-not-allowed bg-parchment-deep font-mono text-ink-muted"
                  {...register("login")}
                />
              </Field>
            </div>

            {serverError && (
              <p className="rounded-lg border border-negative/30 bg-negative/8 px-3 py-2 text-sm text-negative">
                {serverError}
              </p>
            )}
            {saved && !isDirty && (
              <p className="rounded-lg border border-positive/30 bg-positive/8 px-3 py-2 text-sm text-positive">
                Profil muvaffaqiyatli saqlandi
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  reset();
                  setImageUrl(profile.profileImageUrl);
                  setServerError(null);
                  setSaved(false);
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" variant="accent" loading={isSubmitting}>
                {isSubmitting ? t("common.saving") : "O'zgarishlarni saqlash"}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}

function GenderOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
        selected
          ? "border-accent bg-accent/10 text-ink"
          : "border-line bg-surface text-ink-soft hover:border-ink-muted",
      )}
    >
      {label}
      {selected && <Check className="h-4 w-4 text-accent" />}
    </button>
  );
}
