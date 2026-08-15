import { describe, expect, it } from "vitest";
import {
  crudPermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  permissionMatches,
  satisfiesRequirement,
} from "./permissions";

const director = ["hr-branches.read", "hr-branches.create", "hr-branches.update"];
const superAdmin = ["*.*"];

describe("permissionMatches", () => {
  it("aynan mos kodni qabul qiladi", () => {
    expect(permissionMatches("students.read", "students.read")).toBe(true);
  });

  it("modul wildcard'i barcha amallarga yetadi", () => {
    expect(permissionMatches("students.*", "students.delete")).toBe(true);
    expect(permissionMatches("students.*", "finance.delete")).toBe(false);
  });

  it("*.* hammasiga mos keladi", () => {
    expect(permissionMatches("*.*", "hr-payrolls.update")).toBe(true);
  });

  it("boshqa modulning bir xil amalini qabul qilmaydi", () => {
    expect(permissionMatches("students.read", "finance.read")).toBe(false);
  });
});

describe("hasPermission", () => {
  it("shart berilmasa ruxsat beradi", () => {
    expect(hasPermission([], undefined)).toBe(true);
  });

  it("imtiyozlar bo'sh bo'lsa rad etadi", () => {
    expect(hasPermission(undefined, "students.read")).toBe(false);
    expect(hasPermission([], "students.read")).toBe(false);
  });

  it("wildcard orqali ham topadi", () => {
    expect(hasPermission(superAdmin, "hr-branches.delete")).toBe(true);
  });
});

describe("hasAnyPermission / hasAllPermissions", () => {
  it("anyOf — kamida bittasi yetarli", () => {
    expect(hasAnyPermission(director, ["hr-branches.delete", "hr-branches.update"])).toBe(true);
    expect(hasAnyPermission(director, ["hr-branches.delete"])).toBe(false);
  });

  it("allOf — hammasi kerak", () => {
    expect(hasAllPermissions(director, ["hr-branches.read", "hr-branches.update"])).toBe(true);
    expect(hasAllPermissions(director, ["hr-branches.read", "hr-branches.delete"])).toBe(false);
  });

  it("bo'sh ro'yxat = shart yo'q", () => {
    expect(hasAnyPermission([], [])).toBe(true);
    expect(hasAllPermissions([], [])).toBe(true);
  });
});

describe("satisfiesRequirement", () => {
  it("shartsiz talab har doim rost", () => {
    expect(satisfiesRequirement([], {})).toBe(true);
    expect(satisfiesRequirement([], undefined)).toBe(true);
  });

  it("maydonlar VA bilan birlashadi", () => {
    expect(
      satisfiesRequirement(director, {
        permission: "hr-branches.read",
        anyOf: ["hr-branches.create", "hr-branches.delete"],
      }),
    ).toBe(true);

    expect(
      satisfiesRequirement(director, {
        permission: "hr-branches.read",
        allOf: ["hr-branches.create", "hr-branches.delete"],
      }),
    ).toBe(false);
  });
});

describe("crudPermissions", () => {
  it("resurs bo'yicha to'rtta bayroqni hisoblaydi", () => {
    expect(crudPermissions(director, "hr-branches")).toEqual({
      canRead: true,
      canCreate: true,
      canUpdate: true,
      canDelete: false,
      canMutate: true,
    });
  });

  it("faqat o'qish huquqida canMutate yolg'on", () => {
    expect(crudPermissions(["hr-staff.read"], "hr-staff")).toMatchObject({
      canRead: true,
      canMutate: false,
    });
  });

  it("wildcard hammasini yoqadi", () => {
    expect(crudPermissions(superAdmin, "istalgan-resurs")).toEqual({
      canRead: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      canMutate: true,
    });
  });

  it("boshqa resursning kodlari ta'sir qilmaydi", () => {
    expect(crudPermissions(["hr-staff.create"], "hr-branches").canCreate).toBe(false);
  });
});
