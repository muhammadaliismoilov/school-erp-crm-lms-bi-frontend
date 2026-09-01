"use client";

import { useEffect, useMemo, useState } from "react";
import { createDebouncer, toSearchQuery } from "@/lib/search/debounce";

export interface DebouncedSearchOptions {
  /** Oxirgi harfdan keyin qancha kutiladi. */
  delay?: number;
  /** Shu uzunlikdan qisqa matn so'rovga aylanmaydi. */
  minLength?: number;
}

/**
 * Qidiruv matnini so'rovga yaroqli, debouncelangan qiymatga aylantiradi.
 *
 * NEGA KERAK: qidiruv matni React Query kalitida turadi, ya'ni HAR bosilgan
 * harf yangi kalit va yangi so'rov demak. O'lchandi: "Ismoilov" yozish 8 ta
 * HTTP so'rov va 8 ta Seq Scan hosil qilardi, ulardan 7 tasining natijasi
 * hech qachon ko'rilmasdi.
 *
 * Input xom qiymatni ko'rsatishda davom etadi — yozish darhol ko'rinadi,
 * faqat SO'ROV kechikadi.
 *
 * KECHIKISH 400 ms: debounce harflar orasidagi tanaffus shu qiymatdan oshganda
 * ishlaydi, ya'ni yutuq YOZISH TEZLIGIGA bog'liq. 300 ms da o'rtacha tezlikdagi
 * (~40 so'z/daqiqa, harf orasi ~300 ms) foydalanuvchi uchun so'rovlar baribir
 * ketaverardi. 400 ms o'rtacha va sekin yozuvchini ham qamrab oladi; evaziga
 * natija oxirgi harfdan keyin 100 ms kechroq ko'rinadi.
 *
 * `undefined` qaytishi "qidiruv yo'q" degani: `search: searchQuery` deb
 * yozish yetarli, `|| undefined` shart emas.
 */
export function useDebouncedSearch(
  raw: string,
  options: DebouncedSearchOptions = {},
): string | undefined {
  const { delay = 400, minLength = 2 } = options;
  const query = toSearchQuery(raw, minLength);
  const [settled, setSettled] = useState(query);

  // Taymer hook umri davomida bitta bo'lib qoladi: har renderda yangisini
  // yaratish kutilayotgan rejani yo'qotib, debounce'ni ishlamas qilardi.
  const debouncer = useMemo(() => createDebouncer(delay), [delay]);

  useEffect(() => {
    debouncer.schedule(() => setSettled(query));
    // Komponent yo'q qilinganda yoki qiymat o'zgarganda kutilayotgan reja
    // bekor qilinadi — aks holda eski qidiruv keyin "otib" ketardi.
    return () => debouncer.cancel();
  }, [query, debouncer]);

  return settled;
}
