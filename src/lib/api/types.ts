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

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    locale?: string;
    message: string;
    messages?: LocalizedMessages;
    details?: unknown;
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
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: "Bearer";
  user: AuthenticatedUser;
}

export type Locale = "uz" | "ru" | "en";

/** Thrown by the API client; carries the backend's localized messages. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly messages?: LocalizedMessages,
  ) {
    super(message);
    this.name = "ApiError";
  }

  localized(locale: Locale): string {
    return this.messages?.[locale] ?? this.message;
  }
}
