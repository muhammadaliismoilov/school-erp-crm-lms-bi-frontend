import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { tokenStore } from "@/lib/auth/tokens";
import { apiRequest } from "./client";
import { ApiError } from "./types";

/**
 * 2026-08-26 production hodisasi: eski tokenlar ichida 439 ta ruxsat bo'lgan
 * (15 KB). Bunday `Authorization` sarlavhasi 16 KB limitidan oshadi va Vercel
 * ham, Render ham so'rovni HTTP 431 bilan rad etadi. Backend endi kichik token
 * beradi, lekin BROWSERDA saqlanib qolgan eski token bilan sessiya o'lik
 * bo'lardi — shuning uchun 431 ham 401 kabi token yangilashni ishga tushiradi.
 */
describe("apiRequest — 431 (sarlavha juda katta) tuzalishi", () => {
  function jsonResponse(status: number, payload: unknown): Response {
    return {
      status,
      ok: status >= 200 && status < 300,
      json: async () => payload,
    } as unknown as Response;
  }

  /** Vercel/Render 431 ni HTML bilan qaytaradi — JSON parse yiqiladi. */
  function headerTooLargeResponse(): Response {
    return {
      status: 431,
      ok: false,
      json: async () => {
        throw new Error("not json");
      },
    } as unknown as Response;
  }

  beforeEach(() => {
    tokenStore.set("eski-juda-uzun-token", "refresh-1");
  });

  afterEach(() => {
    tokenStore.clear();
    vi.restoreAllMocks();
  });

  it("431 kelsa token yangilanadi va so‘rov qaytadan yuboriladi", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(headerTooLargeResponse())
      .mockResolvedValueOnce(
        jsonResponse(200, {
          success: true,
          data: { accessToken: "yangi-kichik-token", refreshToken: "refresh-2" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { ok: true } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/analytics/overview")).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/refresh");
    // Qayta urinish yangi, kichik token bilan ketdi.
    const retryHeaders = fetchMock.mock.calls[2][1].headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe("Bearer yangi-kichik-token");
  });

  it("yangilash ham 431 bersa — cheksiz sikl bo‘lmaydi, xato qaytadi", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(headerTooLargeResponse())
      .mockResolvedValueOnce(jsonResponse(401, { success: false }))
      .mockResolvedValue(headerTooLargeResponse());
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/analytics/overview")).rejects.toBeInstanceOf(ApiError);
    // 1-so'rov + 1-yangilash urinishi — qayta urinish yo'q (refresh muvaffaqiyatsiz).
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("auth: false so‘rovda yangilash urinilmaydi", async () => {
    const fetchMock = vi.fn().mockResolvedValue(headerTooLargeResponse());
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/auth/login", { auth: false })).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
