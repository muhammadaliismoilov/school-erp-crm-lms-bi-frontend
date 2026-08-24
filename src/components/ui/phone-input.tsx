"use client";

import { forwardRef } from "react";
import { Input } from "@/components/ui/input";

export const UZ_PHONE_PREFIX = "+998";
const UZ_PHONE_NATIONAL_LENGTH = 9;
export const UZ_PHONE_REGEX = /^\+998\d{9}$/;

const UZ_COUNTRY_CODE = UZ_PHONE_PREFIX.slice(1); // "998"

/** Har qanday kiritilgan matnni "+998" bilan boshlanadigan, 9 xonagacha raqamli shaklga keltiradi. */
export function normalizeUzPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // "+998" prefiksini backspace/delete bilan qisman o'chirishga urinilsa (masalan "+99"
  // yoki "+9" qolib ketsa), qolган 1-3 xonali qoldiq "998"ning bir bo'lagi bo'lib chiqadi —
  // buni haqiqiy milliy raqam boshlanishi deb emas, prefiks qoldig'i deb hisoblab bo'shatamiz.
  const isPrefixLeftover = digits.length <= UZ_COUNTRY_CODE.length && UZ_COUNTRY_CODE.startsWith(digits);
  const national = isPrefixLeftover
    ? ""
    : digits.startsWith(UZ_COUNTRY_CODE)
      ? digits.slice(UZ_COUNTRY_CODE.length)
      : digits;
  return UZ_PHONE_PREFIX + national.slice(0, UZ_PHONE_NATIONAL_LENGTH);
}

/** Foydalanuvchi hali bironta raqam kiritmagan (faqat "+998" prefiksi turibdi yoki bo'sh). */
export function isBlankUzPhone(value: string | null | undefined): boolean {
  return !value || normalizeUzPhone(value) === UZ_PHONE_PREFIX;
}

/** To'liq, haqiqiy formatdagi raqam (+998 va 9 ta raqam). */
export function isCompleteUzPhone(value: string): boolean {
  return UZ_PHONE_REGEX.test(value);
}

/** Ixtiyoriy maydonlar uchun: bo'sh bo'lsa `undefined`, aks holda tozalangan qiymat. */
export function trimmedUzPhone(value: string): string | undefined {
  return isBlankUzPhone(value) ? undefined : value.trim();
}

type PhoneInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> & {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

/**
 * Har doim "+998" bilan boshlanadigan telefon input'i. Prefiks o'chirib bo'lmaydi —
 * har qanday o'zgarishda qiymat qayta normallashtiriladi, foydalanuvchi faqat
 * keyingi 9 ta raqamni tahrirlay oladi.
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      type="tel"
      inputMode="numeric"
      placeholder="+998901234567"
      maxLength={UZ_PHONE_PREFIX.length + UZ_PHONE_NATIONAL_LENGTH}
      value={normalizeUzPhone(value)}
      onChange={(e) => {
        const el = e.target;
        const next = normalizeUzPhone(el.value);
        el.value = next;
        onChange(e);
        requestAnimationFrame(() => el.setSelectionRange(next.length, next.length));
      }}
    />
  ),
);
PhoneInput.displayName = "PhoneInput";
