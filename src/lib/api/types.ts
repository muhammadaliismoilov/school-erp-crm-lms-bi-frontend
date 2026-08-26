/** Mirrors the backend response envelopes and shared DTOs. */

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface LocalizedMessages {
  uz: string;
  ru: string;
  en: string;
}

/** One field-level validation constraint, localized. */
export interface ValidationConstraint {
  type: string;
  message: LocalizedMessages;
}

/** Per-field validation error as returned by the backend `details` array. */
export interface FieldValidationError {
  field: string;
  messages: ValidationConstraint[];
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    locale?: string;
    message: string;
    messages?: LocalizedMessages;
    details?: FieldValidationError[] | unknown;
  };
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
}

export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email?: string | null;
  roles: string[];
  permissions: string[];
  sessionId?: string;
  /**
   * Foydalanuvchi qaysi maktabga bog'langan. `null` — global hisob (barcha
   * maktablarni ko'radi, `X-School-Id` bilan istalganiga kiradi): super-admin
   * va global CEO shunday. Eski sessiyalarda maydon umuman bo'lmasligi mumkin,
   * shuning uchun `undefined`ni `null` bilan ADASHTIRMANG — `=== null` tekshiring.
   */
  schoolId?: string | null;
  branchId?: string | null;
  dataScope?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: "Bearer";
  user: AuthenticatedUser;
}

export type Locale = "uz" | "ru" | "en";

/** Field labels for the validation summary, by API field name. */
export type FieldLabels = Record<string, string>;

function isFieldValidationErrors(value: unknown): value is FieldValidationError[] {
  return (
    Array.isArray(value) &&
    value.every((item) => item && typeof item === "object" && "field" in item && "messages" in item)
  );
}

/** Thrown by the API client; carries the backend's localized messages + per-field details. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly messages?: LocalizedMessages,
    public readonly details?: FieldValidationError[] | unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  localized(locale: Locale): string {
    return this.messages?.[locale] ?? this.message;
  }

  /** Per-field validation errors, if the backend returned any. */
  fieldErrors(): FieldValidationError[] {
    return isFieldValidationErrors(this.details) ? this.details : [];
  }

  /**
   * Human-readable validation summary, e.g. "Nomi: matn bo'lishi kerak".
   * Falls back to the localized top-level message when there are no field
   * details. `labels` maps API field names to UI labels (optional).
   */
  detailedMessage(locale: Locale, labels: FieldLabels = {}): string {
    const fields = this.fieldErrors();
    if (fields.length === 0) {
      return this.localized(locale);
    }

    return fields
      .map((entry) => {
        const label = labels[entry.field] ?? entry.field;
        const text = entry.messages.map((m) => m.message[locale]).join(", ");
        return `${label}: ${text}`;
      })
      .join("\n");
  }
}
