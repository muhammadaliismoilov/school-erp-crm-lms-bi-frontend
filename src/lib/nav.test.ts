import { describe, it, expect } from "vitest";
import { Blocks } from "lucide-react";
import { isGroupVisible, isLeafVisible, type NavGroup, type NavLeaf } from "./nav";

const hamma = () => true;
const hech = () => false;

const oddiy: NavLeaf = { href: "/users", labelKey: "u", icon: Blocks, permission: "users.read" };
const bayroqli: NavLeaf = {
  href: "/integrations",
  labelKey: "i",
  icon: Blocks,
  permission: "integrations.read",
  module: "integrations",
};

/**
 * Bo'lim ko'rinishi IKKI qatlamdan iborat: ruxsat (rol darajasi) VA maktab
 * moduli (maktab darajasi). Ikkinchisi kerak, chunki `director` — GLOBAL rol:
 * bitta maktabga integratsiya berishni ruxsat orqali qilib bo'lmaydi.
 */
const muqobil: NavLeaf = {
  href: "/appeals",
  labelKey: "a",
  icon: Blocks,
  anyOf: ["appeals.read", "appeals.read-assigned"],
};

describe("isLeafVisible", () => {
  it("muqobilli darvozada kodlardan BITTASI yetarli", () => {
    // `/appeals` ni ikki xil qamrovdagi foydalanuvchi ochadi: rahbariyat
    // `appeals.read` bilan hammasini, biriktirilgan xodim
    // `appeals.read-assigned` bilan faqat o'zinikini. Bitta kodli darvoza
    // ikkinchisini butunlay to'sib qo'yardi — u murojaatni ko'ra oladi, lekin
    // menyuda bo'lim yo'q edi.
    // Dublyor haqiqiy `hasPermission` shartnomasini takrorlaydi: BERILMAGAN
    // kod — shart yo'q, ya'ni rost. Aks holda `permission`siz yaproq test
    // ichida hech qachon ko'rinmasdi va sinov noto'g'ri sababdan yiqilardi.
    const faqat = (code: string) => (p?: string) => p === undefined || p === code;
    const faqatBiriktirilgan = faqat("appeals.read-assigned");
    const faqatRahbariyat = faqat("appeals.read");

    expect(isLeafVisible(muqobil, faqatBiriktirilgan)).toBe(true);
    expect(isLeafVisible(muqobil, faqatRahbariyat)).toBe(true);
  });

  it("muqobillarning HECH BIRI bo'lmasa ko'rinmaydi", () => {
    const faqatUsers = (p?: string) => p === undefined || p === "users.read";
    expect(isLeafVisible(muqobil, faqatUsers)).toBe(false);
  });

  it("bayroqsiz bo'lim faqat ruxsatga qaraydi", () => {
    expect(isLeafVisible(oddiy, hamma)).toBe(true);
    expect(isLeafVisible(oddiy, hech)).toBe(false);
  });

  it("bayroqli bo'lim modul YOQILGANDA ko'rinadi", () => {
    expect(isLeafVisible(bayroqli, hamma, { integrations: true })).toBe(true);
  });

  it("modul o'chiq bo'lsa — ruxsat bo'lsa ham ko'rinmaydi", () => {
    expect(isLeafVisible(bayroqli, hamma, { integrations: false })).toBe(false);
  });

  it("modullar hali kelmagan bo'lsa YASHIRIN — ko'rsatib olib qo'yishdan yaxshiroq", () => {
    expect(isLeafVisible(bayroqli, hamma, undefined)).toBe(false);
  });

  it("modul yoqilgan bo'lsa ham ruxsatsiz ko'rinmaydi", () => {
    expect(isLeafVisible(bayroqli, hech, { integrations: true })).toBe(false);
  });
});

describe("isGroupVisible", () => {
  const guruh: NavGroup = {
    id: "boshqaruv",
    labelKey: "g",
    icon: Blocks,
    children: [bayroqli],
  };

  it("yagona farzandi bayroqli va o'chiq bo'lsa — guruh ham yashirin", () => {
    expect(isGroupVisible(guruh, hamma, { integrations: false })).toBe(false);
  });

  it("modul yoqilsa guruh ochiladi", () => {
    expect(isGroupVisible(guruh, hamma, { integrations: true })).toBe(true);
  });

  it("bayroqsiz farzand bo'lsa guruh baribir ko'rinadi", () => {
    expect(isGroupVisible({ ...guruh, children: [oddiy, bayroqli] }, hamma, {})).toBe(true);
  });
});
