import { describe, it, expect, vi, beforeEach } from "vitest";

const apiRequest = vi.fn();
vi.mock("./client", () => ({ apiRequest: (...args: unknown[]) => apiRequest(...args) }));

import { submitPublicReferralLead, validatePublicReferral, REFERRAL_TEMPLATES } from "./referrals";

describe("referrals public api", () => {
  beforeEach(() => apiRequest.mockReset().mockResolvedValue({}));

  it("validates a public referral without auth", async () => {
    await validatePublicReferral("5262804");
    expect(apiRequest).toHaveBeenCalledWith("/public/referral/5262804", { auth: false });
  });

  it("submits a public lead without auth and forwards the honeypot field", async () => {
    await submitPublicReferralLead("5262804", { firstName: "Ali", phone: "+998901234567", website: "" });
    expect(apiRequest).toHaveBeenCalledWith("/public/referral/5262804/leads", {
      method: "POST",
      body: { firstName: "Ali", phone: "+998901234567", website: "" },
      auth: false,
    });
  });

  it("exposes the four landing templates", () => {
    expect(REFERRAL_TEMPLATES).toEqual(["classic", "centered", "split", "fullscreen"]);
  });
});
