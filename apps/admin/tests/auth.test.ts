import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  cookiesMock,
  headersMock,
  redirectMock,
  verifyIdTokenMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  headersMock: vi.fn(),
  redirectMock: vi.fn(),
  verifyIdTokenMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
  headers: headersMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminAuth: () => ({
    verifyIdToken: verifyIdTokenMock,
  }),
}));

import {
  getAdminFromSessionCookie,
  requireAdminApiToken,
  requireAdminPageSession,
  verifyAdminIdToken,
} from "../src/lib/auth";

describe("admin auth helpers", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    headersMock.mockReset();
    redirectMock.mockReset();
    verifyIdTokenMock.mockReset();
  });

  it("returns null when session cookie is missing", async () => {
    cookiesMock.mockResolvedValue({
      get: () => undefined,
    });

    await expect(getAdminFromSessionCookie()).resolves.toBeNull();
  });

  it("returns null when decoded token does not include admin claim", async () => {
    cookiesMock.mockResolvedValue({
      get: () => ({ value: "session-token" }),
    });
    verifyIdTokenMock.mockResolvedValue({
      admin: false,
    });

    await expect(getAdminFromSessionCookie()).resolves.toBeNull();
  });

  it("returns admin identity when session cookie is valid", async () => {
    cookiesMock.mockResolvedValue({
      get: () => ({ value: "session-token" }),
    });
    verifyIdTokenMock.mockResolvedValue({
      admin: true,
      uid: "admin-1",
      email: "admin@example.com",
    });

    await expect(getAdminFromSessionCookie()).resolves.toEqual({
      uid: "admin-1",
      email: "admin@example.com",
    });
  });

  it("throws when verifying a token without admin claim", async () => {
    verifyIdTokenMock.mockResolvedValue({ admin: false });

    await expect(verifyAdminIdToken("token-1")).rejects.toThrow(
      "Admin claim required"
    );
  });

  it("uses bearer token from authorization header first", async () => {
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "authorization" ? "Bearer header-token" : null),
    });
    verifyIdTokenMock.mockResolvedValue({ admin: true, uid: "header-admin" });

    await expect(requireAdminApiToken()).resolves.toEqual({
      admin: true,
      uid: "header-admin",
    });
    expect(verifyIdTokenMock).toHaveBeenCalledWith("header-token", true);
  });

  it("falls back to session cookie token when authorization header is absent", async () => {
    headersMock.mockResolvedValue({
      get: () => null,
    });
    cookiesMock.mockResolvedValue({
      get: () => ({ value: "cookie-token" }),
    });
    verifyIdTokenMock.mockResolvedValue({ admin: true, uid: "cookie-admin" });

    await expect(requireAdminApiToken()).resolves.toEqual({
      admin: true,
      uid: "cookie-admin",
    });
    expect(verifyIdTokenMock).toHaveBeenCalledWith("cookie-token", true);
  });

  it("throws when no authorization header or session cookie is present", async () => {
    headersMock.mockResolvedValue({
      get: () => null,
    });
    cookiesMock.mockResolvedValue({
      get: () => undefined,
    });

    await expect(requireAdminApiToken()).rejects.toThrow("Missing admin session");
  });

  it("redirects unauthenticated page requests to login", async () => {
    cookiesMock.mockResolvedValue({
      get: () => undefined,
    });

    await requireAdminPageSession();
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
