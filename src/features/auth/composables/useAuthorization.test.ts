import { beforeEach, describe, expect, it } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSessionStore } from "../stores/session";
import { useAuthorization } from "./useAuthorization";
import type { MyProfileResource } from "@/lib/api/generated/models";

const adminUser: MyProfileResource = {
  id: 1,
  name: "Admin User",
  email: "admin@example.com",
  email_verified_at: "2026-10-01T00:00:00Z",
  roles: ["admin"],
  permissions: ["users.view", "logs.view"],
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
  roles: ["admin"], // Even if roles were hypothetically present, limited state must deny business actions
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
    expect(visibleKeys).toEqual(["home"]);
  });

  it("filters menu items for limited (unverified) user", () => {
    const session = useSessionStore();
    session.status = "limited";
    session.user = limitedUser;

    const auth = useAuthorization();
    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.isLimited.value).toBe(true);

    // Limited user can only see public home and limited verification guidance
    const visibleKeys = auth.visibleNavItems.value.map((i) => i.key);
    expect(visibleKeys).toEqual(["home", "limited"]);

    // Business actions/permissions are denied when limited
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
    // Admin has: role "admin", perms "users.view", "logs.view"
    expect(visibleKeys).toEqual([
      "home",
      "dashboard",
      "users",
      "roles",
      "logs",
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
    // Standard user has no admin role and no users.view/logs.view permission
    expect(visibleKeys).toEqual(["home", "dashboard"]);
    expect(auth.can("users.view")).toBe(false);
    expect(auth.hasRole("admin")).toBe(false);
    expect(auth.hasRole("member")).toBe(true);
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
