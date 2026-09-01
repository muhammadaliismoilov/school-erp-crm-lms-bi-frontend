/**
 * Baza sog'lig'i darajasining joriy qiymati — sof holat, React'siz.
 *
 * `apiRequest` har javobdan `X-Db-Health` sarlavhasini shu yerga yozadi,
 * chiroq esa obuna bo'lib o'qiydi. Qo'shimcha so'rov yo'q: foydalanuvchi
 * allaqachon so'rov yuborayotgan bo'lsa, daraja o'sha javob bilan bepul
 * keladi.
 */

/** Backend `db-health.interceptor.ts` dagi nom bilan AYNAN bir xil bo'lishi shart. */
export const DB_HEALTH_HEADER = "X-Db-Health";

export const DB_HEALTH_LEVELS = ["ok", "busy", "critical"] as const;
export type DbHealthLevel = (typeof DB_HEALTH_LEVELS)[number];

export interface DbHealthState {
  level: DbHealthLevel | null;
  /** Oxirgi yangilangan vaqt (ms). Eskirganini aniqlash uchun. */
  updatedAt: number | null;
}

/** Sarlavha qiymatini tekshiradi — noma'lum satr holatni buzmasin. */
export function parseLevel(raw: string | null | undefined): DbHealthLevel | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  return (DB_HEALTH_LEVELS as readonly string[]).includes(value)
    ? (value as DbHealthLevel)
    : null;
}

/**
 * Daraja eskirganmi.
 *
 * Sarlavha faqat so'rov bo'lganda yangilanadi. Foydalanuvchi jim tursa,
 * ko'rsatilgan rang haqiqatdan uzoqlashadi — shundan keyin zaxira poll
 * ishga tushadi.
 */
export function isStale(state: DbHealthState, now: number, maxAgeMs = 60_000): boolean {
  if (state.updatedAt === null) return true;
  return now - state.updatedAt > maxAgeMs;
}

type Listener = (state: DbHealthState) => void;

let state: DbHealthState = { level: null, updatedAt: null };
const listeners = new Set<Listener>();

export function getDbHealth(): DbHealthState {
  return state;
}

/** `apiRequest` va zaxira poll shu orqali yozadi. */
export function setDbHealthLevel(level: DbHealthLevel | null, now: number = Date.now()): void {
  if (level === null) return;
  // Bir xil daraja qayta yozilsa ham `updatedAt` yangilanadi: bu "ma'lumot
  // yangi" degani, va zaxira pollning kerak-kermasligini shu belgilaydi.
  state = { level, updatedAt: now };
  for (const listener of listeners) listener(state);
}

export function subscribeDbHealth(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Sinovlar uchun — modullar orasidagi holat sizib ketmasin. */
export function resetDbHealth(): void {
  state = { level: null, updatedAt: null };
  listeners.clear();
}
