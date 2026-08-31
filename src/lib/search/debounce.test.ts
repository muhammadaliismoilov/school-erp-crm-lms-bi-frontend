import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDebouncer, toSearchQuery } from "./debounce";

describe("toSearchQuery", () => {
  it("chegaradan qisqa matn so'rovga aylanmaydi", () => {
    // Backend DTO'larining bir qismi `@Length(2, ...)` talab qiladi: bitta
    // belgili qidiruv 400 qaytarardi va ekranda sababsiz "Xatolik yuz berdi"
    // chiqardi. Chegara so'rov yuborilishidan OLDIN ushlanadi.
    expect(toSearchQuery("K")).toBeUndefined();
    expect(toSearchQuery("Ka")).toBe("Ka");
  });

  it("bo'sh va faqat probellardan iborat matn — qidiruv emas", () => {
    expect(toSearchQuery("")).toBeUndefined();
    expect(toSearchQuery("   ")).toBeUndefined();
  });

  it("chetdagi probellarni olib tashlaydi", () => {
    // Probel bilan yuborilsa so'rov kaliti ham boshqacha bo'lardi va bir xil
    // qidiruv uchun kesh ikkiga bo'linib ketardi.
    expect(toSearchQuery("  Ali  ")).toBe("Ali");
  });

  it("uzunlik probellarsiz o'lchanadi", () => {
    expect(toSearchQuery(" K ")).toBeUndefined();
  });

  it("chegarani pasaytirish mumkin", () => {
    // Backend `@Length(1, ...)` ruxsat bergan joyda (xona, sinf) bitta belgi
    // haqiqiy qidiruv bo'lishi mumkin.
    expect(toSearchQuery("5", 1)).toBe("5");
  });
});

describe("createDebouncer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("kutish tugagach chaqiradi", () => {
    const spy = vi.fn();
    createDebouncer(300).schedule(spy);

    vi.advanceTimersByTime(299);
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("ketma-ket chaqiruvlardan FAQAT oxirgisi ishlaydi", () => {
    // Aynan shu narsa 8 harfli qidiruvni 8 ta so'rovdan 1 taga tushiradi.
    const debouncer = createDebouncer(300);
    const calls: string[] = [];

    for (const value of ["I", "Is", "Ism", "Ismoilov"]) {
      vi.advanceTimersByTime(50);
      debouncer.schedule(() => calls.push(value));
    }
    vi.advanceTimersByTime(300);

    expect(calls).toEqual(["Ismoilov"]);
  });

  it("to'xtash kutish taymerini qaytadan boshlaydi", () => {
    const debouncer = createDebouncer(300);
    const spy = vi.fn();

    debouncer.schedule(spy);
    vi.advanceTimersByTime(250);
    debouncer.schedule(spy);
    vi.advanceTimersByTime(250);
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("bekor qilingan chaqiruv umuman ishlamaydi", () => {
    // Komponent yo'q qilingandan keyin holat yangilanishi kerak emas.
    const debouncer = createDebouncer(300);
    const spy = vi.fn();

    debouncer.schedule(spy);
    debouncer.cancel();
    vi.advanceTimersByTime(1000);

    expect(spy).not.toHaveBeenCalled();
  });
});
