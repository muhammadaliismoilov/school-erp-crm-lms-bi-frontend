/**
 * Qidiruv uchun sof mantiq — React'siz, shuning uchun to'g'ridan-to'g'ri test
 * qilinadi (loyihada `environment: "node"`, komponent render qiluvchi test
 * infratuzilmasi yo'q).
 */

/**
 * Qidiruv matnini so'rovga yaroqli holatga keltiradi.
 *
 * `undefined` — "qidiruv yo'q", ya'ni so'rovga umuman qo'shilmaydi. Shu sabab
 * chaqiruv joyida `search: search || undefined` yozish shart emas.
 *
 * MINIMAL UZUNLIK NEGA KERAK: backend DTO'larining bir qismi
 * `@Length(2, ...)` talab qiladi va bitta belgili qidiruvni 400 bilan rad
 * etadi. Foydalanuvchi bitta harf yozib to'xtasa ekranda sababi
 * ko'rsatilmagan "Xatolik yuz berdi" chiqardi. Chegara shu yerda — so'rov
 * yuborilishidan OLDIN — ushlanadi.
 *
 * Chegara standart 2, lekin chaqiruv joyida pasaytirilishi mumkin: backend
 * `@Length(1, ...)` ruxsat bergan va qisqa qiymat mazmunli bo'lgan joylarda
 * (xona raqami, sinf nomi) bitta belgi haqiqiy qidiruv bo'lishi mumkin.
 */
export function toSearchQuery(raw: string, minLength = 2): string | undefined {
  const trimmed = raw.trim();
  return trimmed.length >= minLength ? trimmed : undefined;
}

/** Rejalashtirilgan chaqiruvni bekor qiluvchi. */
export interface Debouncer {
  /** Oldingi rejani bekor qilib, yangisini `delay` ms keyinga qo'yadi. */
  schedule(callback: () => void): void;
  /** Kutilayotgan chaqiruvni bekor qiladi (komponent yo'q qilinganda). */
  cancel(): void;
}

/**
 * Oxirgi chaqiruvni kutadigan taymer ("trailing edge" debounce).
 *
 * Har `schedule()` oldingi rejani BEKOR QILADI — ketma-ket 8 ta harf uchun
 * callback bir marta, oxirgisidan keyin ishlaydi.
 */
export function createDebouncer(delay: number): Debouncer {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return {
    schedule(callback) {
      cancel();
      timer = setTimeout(() => {
        timer = null;
        callback();
      }, delay);
    },
    cancel,
  };
}
