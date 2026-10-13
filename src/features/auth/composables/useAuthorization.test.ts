import { beforeEach, describe, expect, it } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSessionStore } from "@/features/auth/stores/session";
import { useAuthorization } from "./useAuthorization";
import type { MyProfileResource } from "@/lib/api/generated/models";

const adminUser: MyProfileResource = {
  id: 1,
  name: "Admin User",
  email: "admin@example.com",
  email_verified_at: "2026-10-01T00:00:00Z",
  roles: ["admin"],
  permissions: ["users.view", "roles.view", "logs.view"],
};

const standardUser: MyProfileResource = {
  id: 2,
  name: "Standard User",
  email: "user@example.com",
  email_verified_at: "2026-10-01T00:00:00Z",
  roles: ["member"],
  permissions: [],
};

const limitedUser: MyProfileResource = {
  id: 3,
  name: "Limited User",
  email: "unverified@example.com",
  email_verified_at: null,
  roles: ["admin"],
  permissions: ["users.view"],
};

describe("useAuthorization", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("filters menu items for unauthenticated guest", () => {
    const session = useSessionStore();
    session.status = "unauthenticated";
    session.user = null;

    const auth = useAuthorization();
    expect(auth.isAuthenticated.value).toBe(false);

    const visibleKeys = auth.visibleNavItems.value.map((i) => i.key);
    expect(visibleKeys).toEqual([]);
  });

  it("filters menu items for limited (unverified) user", () => {
    const session = useSessionStore();
    session.status = "limited";
    session.user = limitedUser;

    const auth = useAuthorization();
    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.isLimited.value).toBe(true);

    const visibleKeys = auth.visibleNavItems.value.map((i) => i.key);
    expect(visibleKeys).toEqual(["manual", "limited"]);

    expect(auth.can("users.view")).toBe(false);
    expect(auth.hasRole("admin")).toBe(false);
  });

  it("filters menu items according to roles and permissions for admin", () => {
    const session = useSessionStore();
    session.status = "authenticated";
    session.user = adminUser;

    const auth = useAuthorization();
    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.isLimited.value).toBe(false);

    const visibleKeys = auth.visibleNavItems.value.map((i) => i.key);
    expect(visibleKeys).toEqual([
      "dashboard",
      "sessions",
      "profile",
      "users",
      "roles",
      "logs",
      "manual",
    ]);

    expect(auth.can("users.view")).toBe(true);
    expect(auth.can("logs.view")).toBe(true);
    expect(auth.can("billing.view")).toBe(false);
    expect(auth.hasRole("admin")).toBe(true);
  });

  it("filters menu items for member without special permissions", () => {
    const session = useSessionStore();
    session.status = "authenticated";
    session.user = standardUser;

    const auth = useAuthorization();

    const visibleKeys = auth.visibleNavItems.value.map((i) => i.key);
    expect(visibleKeys).toEqual(["dashboard", "sessions", "profile", "manual"]);
    expect(auth.can("users.view")).toBe(false);
    expect(auth.hasRole("admin")).toBe(false);
    expect(auth.hasRole("member")).toBe(true);
  });

  it("keeps the manual reachable for an authenticated account without permissions", () => {
    const session = useSessionStore();
    session.status = "authenticated";
    session.user = standardUser;

    const auth = useAuthorization();
    const manual = auth.visibleNavItems.value.find((i) => i.key === "manual");

    expect(manual?.to).toBe("/manual");
    expect(manual?.label).toBe("Manual");
    expect(auth.permissions.value).toEqual([]);
  });

  it("shows the same welcome destination to verified users without permissions", () => {
    const session = useSessionStore();
    session.status = "authenticated";
    session.user = standardUser;

    const auth = useAuthorization();

    expect(
      auth.visibleNavItems.value.map(({ key, label, to }) => ({
        key,
        label,
        to,
      })),
    ).toEqual([
      { key: "dashboard", label: "Início", to: "/dashboard" },
      { key: "sessions", label: "Sessões", to: "/sessions" },
      { key: "profile", label: "Minha Conta", to: "/profile" },
      { key: "manual", label: "Manual", to: "/manual" },
    ]);
  });

  it("does not show application navigation while an MFA challenge is pending", () => {
    const session = useSessionStore();
    session.status = "mfa_required";
    session.user = null;

    expect(useAuthorization().visibleNavItems.value).toEqual([]);
  });

  it("hides all navigation items when session is blocked (403)", () => {
    const session = useSessionStore();
    session.status = "blocked";
    session.user = null;

    const auth = useAuthorization();
    expect(auth.isBlocked.value).toBe(true);
    expect(auth.visibleNavItems.value).toHaveLength(0);
  });
});
