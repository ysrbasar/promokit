import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { hashPassword, verifyPassword } = await import("@/lib/auth/password");
const { signSession, verifySession, SESSION_TTL_SECONDS } = await import("@/lib/auth/session");

const SECRET = "x".repeat(40);

describe("yönetici kimlik doğrulaması", () => {
  it("parola hash'i doğrulanır, yanlış parola reddedilir, '$' içermez", async () => {
    const h = await hashPassword("dogru-parola-123");
    expect(h).not.toContain("$");
    expect(await verifyPassword("dogru-parola-123", h)).toBe(true);
    expect(await verifyPassword("yanlis-parola", h)).toBe(false);
    expect(await verifyPassword("dogru-parola-123", undefined)).toBe(false);
    expect(await verifyPassword("dogru-parola-123", "scrypt..")).toBe(false);
  });

  it("oturum imzası: geçerli, sahte, başka anahtarla imzalı ve süresi dolmuş", async () => {
    const t = await signSession(SECRET);
    expect(await verifySession(t, SECRET)).toBe(true);
    expect(await verifySession(t, "y".repeat(40))).toBe(false);
    const [payload] = t.split(".");
    expect(await verifySession(`${payload}.AAAA`, SECRET)).toBe(false);
    expect(await verifySession(t, SECRET, Date.now() + (SESSION_TTL_SECONDS + 5) * 1000)).toBe(false);
    expect(await verifySession(t, null)).toBe(false);
    expect(await verifySession(undefined, SECRET)).toBe(false);
  });
});
