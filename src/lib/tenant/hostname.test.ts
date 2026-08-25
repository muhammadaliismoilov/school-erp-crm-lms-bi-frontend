import { describe, expect, it } from "vitest";
import {
  isAdminHostname,
  isRootHostname,
  isTenantBypassHostname,
  stripPort,
} from "./hostname";

describe("stripPort", () => {
  it("removes the port and lowercases the hostname", () => {
    expect(stripPort("Elegantschool.CRM.uz:3000")).toBe("elegantschool.crm.uz");
  });

  it("leaves a port-less hostname untouched (besides casing)", () => {
    expect(stripPort("admin.crm.uz")).toBe("admin.crm.uz");
  });
});

describe("isTenantBypassHostname", () => {
  it("matches the production Vercel alias", () => {
    expect(isTenantBypassHostname("school-erp-uz.vercel.app")).toBe(true);
  });

  it("matches Vercel preview deployments", () => {
    expect(isTenantBypassHostname("yuton-frontend-git-feature-x.vercel.app")).toBe(true);
  });

  it("does not match a real school subdomain", () => {
    expect(isTenantBypassHostname("elegantschool.crm.uz")).toBe(false);
  });
});

describe("isAdminHostname", () => {
  it("matches admin.crm.uz", () => {
    expect(isAdminHostname("admin.crm.uz")).toBe(true);
  });

  it("matches admin.localhost regardless of port", () => {
    expect(isAdminHostname("admin.localhost:3000")).toBe(true);
  });

  it("does not match a school subdomain", () => {
    expect(isAdminHostname("elegantschool.crm.uz")).toBe(false);
  });
});

describe("isRootHostname", () => {
  it("matches the bare apex domain", () => {
    expect(isRootHostname("crm.uz")).toBe(true);
  });

  it("matches bare localhost with a port", () => {
    expect(isRootHostname("localhost:3000")).toBe(true);
  });

  it("does not match a subdomain", () => {
    expect(isRootHostname("elegantschool.crm.uz")).toBe(false);
    expect(isRootHostname("admin.crm.uz")).toBe(false);
  });
});
