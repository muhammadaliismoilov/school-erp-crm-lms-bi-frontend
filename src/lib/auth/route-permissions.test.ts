import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { NAV_ITEMS, isGroup } from "../nav";
import { hasPermission } from "./permissions";
import {
  PUBLIC_ROUTES,
  ROUTE_RULES,
  isUnder,
  matchRouteRule,
  normalizePath,
  resolveRouteModule,
  resolveRoutePermission,
} from "./route-permissions";

describe("normalizePath", () => {
  it("yakuniy slashni olib tashlaydi", () => {
    expect(normalizePath("/hr/")).toBe("/hr");
    expect(normalizePath("/hr///")).toBe("/hr");
  });

  it("ildizni o'zgartirmaydi", () => {
    expect(normalizePath("/")).toBe("/");
  });
});

describe("isUnder", () => {
  it("aynan moslikni topadi", () => {
    expect(isUnder("/hr", "/hr")).toBe(true);
  });

  it("ichki marshrutni topadi", () => {
    expect(isUnder("/hr/employees/abc-123", "/hr")).toBe(true);
  });

  it("segment chegarasini hurmat qiladi — bu eng muhim holat", () => {
    // Oddiy startsWith bu yerda noto'g'ri `true` qaytarardi.
    expect(isUnder("/students-rating", "/students")).toBe(false);
    expect(isUnder("/hr-portal", "/hr")).toBe(false);
  });

  it("ildiz faqat ildizga mos keladi", () => {
    expect(isUnder("/", "/")).toBe(true);
    expect(isUnder("/hr", "/")).toBe(false);
  });
});

describe("resolveRoutePermission", () => {
  it("har yaproq o'z GRANULAR imtiyozini e'lon qiladi (meros olish yo'q)", () => {
    // Guruhda darvoza yo'q — yaproq o'zi ochadigan endpointning kodini oladi.
    expect(resolveRoutePermission("/students")).toBe("students.read");
    expect(resolveRoutePermission("/academic/journal")).toBe("lms-gradebook.read");
    expect(resolveRoutePermission("/users")).toBe("users.read");
    expect(resolveRoutePermission("/roles")).toBe("roles.read");
  });

  it("eng uzun prefiks yutadi", () => {
    expect(resolveRoutePermission("/attendance")).toBe("attendance-records.read");
    expect(resolveRoutePermission("/attendance/devices")).toBe(
      "turnstile-devices.read",
    );
    expect(resolveRoutePermission("/attendance/settings")).toBe(
      "attendance-settings.read",
    );
  });

  it("dinamik segmentlar ota marshrut imtiyozini oladi", () => {
    expect(resolveRoutePermission("/students/9f2c-uuid")).toBe("students.read");
    expect(resolveRoutePermission("/hr/employees/9f2c-uuid")).toBe("hr-staff.read");
    expect(resolveRoutePermission("/attendance/history/9f2c-uuid")).toBe(
      "attendance-records.read",
    );
  });

  it("chuqur ichki sahifalar ham qoplanadi", () => {
    expect(resolveRoutePermission("/finance/transactions/create")).toBe(
      "transactions.read",
    );
    expect(resolveRoutePermission("/hr/payroll/settings")).toBe("hr-payrolls.read");
  });

  it("navda yo'q sahifalar qo'lda e'lon qilingan", () => {
    expect(resolveRoutePermission("/academic")).toBe("academic-years.read");
    expect(resolveRoutePermission("/academic/reports")).toBe("reports.read");
    expect(resolveRoutePermission("/explorer")).toBe("settings.read");
  });

  it("ochiq marshrutlar imtiyoz talab qilmaydi", () => {
    for (const open of PUBLIC_ROUTES) {
      expect(resolveRoutePermission(open)).toBeUndefined();
    }
  });

  it("ochiq marshrut prefiks qoidasidan ustun turadi", () => {
    // /academic → academic-years.read, ammo /academic/students ochiq (redirect).
    expect(resolveRoutePermission("/academic")).toBe("academic-years.read");
    expect(resolveRoutePermission("/academic/students")).toBeUndefined();
  });

  it("yakuniy slash natijani o'zgartirmaydi", () => {
    expect(resolveRoutePermission("/hr/employees/")).toBe("hr-staff.read");
    expect(resolveRoutePermission("/profile/")).toBeUndefined();
  });

  it("noma'lum marshrut to'silmaydi (backend baribir himoyalaydi)", () => {
    expect(resolveRoutePermission("/qandaydir-yangi-sahifa")).toBeUndefined();
  });
});

describe("qoidalar to'plami", () => {
  it("uzun prefiksdan qisqasiga saralangan", () => {
    const lengths = ROUTE_RULES.map((r) => r.href.length);
    expect(lengths).toEqual([...lengths].sort((a, b) => b - a));
  });

  it("har qoidada haqiqiy marshrut bor", () => {
    for (const rule of ROUTE_RULES) {
      expect(rule.href.startsWith("/")).toBe(true);
    }
  });
});

/**
 * To'liqlik kafolati: yangi sahifa qo'shilib, u na navga, na `EXTRA_ROUTE_RULES`,
 * na `PUBLIC_ROUTES` ga kirmasa — shu sinov yiqiladi va e'tiborsiz qolmaydi.
 */
describe("qamrov", () => {
  const dashboardDir = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../app/(dashboard)",
  );

  /** app/(dashboard) ichidagi barcha page.tsx dan marshrut ro'yxatini yig'adi. */
  function collectRoutes(dir: string, prefix = ""): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        // (guruh) papkalari URL'ga qo'shilmaydi; [id] namuna qiymat bilan almashadi
        const segment = entry.name.startsWith("(")
          ? ""
          : `/${entry.name.replace(/^\[.*\]$/, "namuna-id")}`;
        out.push(...collectRoutes(join(dir, entry.name), prefix + segment));
      } else if (entry.name === "page.tsx") {
        out.push(prefix === "" ? "/" : prefix);
      }
    }
    return out;
  }

  const routes = collectRoutes(dashboardDir);

  it("dashboard sahifalari topildi", () => {
    expect(routes.length).toBeGreaterThan(50);
  });

  it("har bir sahifa yo qoidaga, yo ochiq ro'yxatga tegishli", () => {
    const unclassified = routes.filter((route) => {
      const isPublic = PUBLIC_ROUTES.some(
        (open) => normalizePath(open) === normalizePath(route),
      );
      return !isPublic && !matchRouteRule(route);
    });
    expect(unclassified).toEqual([]);
  });
});

/**
 * Foydalanuvchi ssenariysi: o'qituvchi dars ishlarini qiladi, ammo xodim
 * qo'sha olmaydi. Imtiyozlar ro'yxati DB'dagi `teacher` rolidan olingan.
 */
describe("o'qituvchi roli", () => {
  // `identity-seed` dagi `teacher` ta'rifidan: students.read + READ_BUNDLES
  // (students / academic / attendance / lms) + WRITE_BUNDLES (attendance / lms).
  const TEACHER = [
    "students.read",
    "student-parents.read",
    "student-documents.read",
    "parent-communications.read",
    "academic-years.read",
    "academic-quarters.read",
    "academic-lesson-periods.read",
    "academic-subjects.read",
    "academic-courses.read",
    "academic-classes.read",
    "attendance-records.read",
    "attendance-records.create",
    "turnstile-devices.read",
    "class-sessions.read",
    "session-attendance.read",
    "attendance-settings.read",
    "lms.read",
    "lms-gradebook.read",
    "lms-journal.read",
    "lms-journal.update",
    "lms-exam-results.read",
    "lms-exams.read",
    "lms-lessons.read",
    "homework-assignments.read",
    "homework-assignments.create",
    "homework-submissions.read",
    "grade-requests.read",
  ];

  const canOpen = (route: string) =>
    hasPermission(TEACHER, resolveRoutePermission(route));

  it("dars bilan bog'liq bo'limlarni ochadi", () => {
    expect(canOpen("/academic/journal")).toBe(true);
    expect(canOpen("/students")).toBe(true);
    expect(canOpen("/students/uuid")).toBe(true);
    expect(canOpen("/attendance")).toBe(true);
    expect(canOpen("/attendance/teacher")).toBe(true);
  });

  it("HR bo'limlariga kira olmaydi", () => {
    expect(canOpen("/hr")).toBe(false);
    expect(canOpen("/hr/employees")).toBe(false);
    expect(canOpen("/hr/employees/uuid")).toBe(false);
    expect(canOpen("/hr/teachers")).toBe(false);
  });

  it("moliya, rollar va API konsoliga kira olmaydi", () => {
    expect(canOpen("/finance/salaries")).toBe(false);
    expect(canOpen("/roles")).toBe(false);
    expect(canOpen("/users")).toBe(false);
    expect(canOpen("/explorer")).toBe(false);
  });

  it("o'z profili va asosiy panel ochiq", () => {
    expect(canOpen("/")).toBe(true);
    expect(canOpen("/profile")).toBe(true);
    expect(canOpen("/profile/payslips")).toBe(true);
  });
});

describe("super-admin", () => {
  it("wildcard hamma marshrutni ochadi", () => {
    const routes = ["/hr/employees", "/roles", "/explorer", "/finance/salaries"];
    for (const route of routes) {
      expect(hasPermission(["*.*"], resolveRoutePermission(route))).toBe(true);
    }
  });
});

describe("modul bayrog'i marshrutga ham tushadi", () => {
  it("nav yaprog'idagi HAR bir `module` marshrut qoidasida ham bor", () => {
    // Yon panel bayroqli bo'limni yashiradi, lekin manzilni QO'LDA yozib
    // kirishni bu to'smaydi. Marshrut qoidasi bayroqni ko'rmasa, sahifa
    // ochilib ichidagi so'rovlar 403 qaytarardi — foydalanuvchi umumiy xato
    // ekranini ko'rardi va sababini bilmasdi.
    const gatedLeaves = NAV_ITEMS.flatMap((entry) =>
      (isGroup(entry) ? entry.children : [entry]).filter((leaf) => leaf.module),
    );
    expect(gatedLeaves.length).toBeGreaterThan(0);

    const missing = gatedLeaves
      .filter((leaf) => resolveRouteModule(leaf.href) !== leaf.module)
      .map((leaf) => `${leaf.href}: nav "${leaf.module}", marshrut "${resolveRouteModule(leaf.href)}"`);
    expect(missing).toEqual([]);
  });

  it("bayroqsiz marshrutga modul talab qilinmaydi", () => {
    expect(resolveRouteModule("/users")).toBeUndefined();
  });
});
