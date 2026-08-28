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
describe("isLeafVisible", () => {
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
