import { describe, expect, it } from "vitest";
import { routes } from "./index";
import { routeDescriptors, shortcutDescriptors } from "./descriptors";
import { APP_NAV_ITEMS } from "@/features/auth/composables/useAuthorization";

describe("typed route descriptors", () => {
  it("keeps name and path unique across descriptors", () => {
    const names = routeDescriptors.map((d) => d.name);
    const paths = routeDescriptors.map((d) => d.path);
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("derives registered routes exclusively from descriptors", () => {
    expect(routes.map((r) => r.path)).toEqual(
      routeDescriptors.map((d) => d.path),
    );
    expect(routes.map((r) => r.name)).toEqual(
      routeDescriptors.map((d) => d.name),
    );
  });

  it("protects the Minha Conta route", () => {
    const profile = routeDescriptors.find(
      (descriptor) => descriptor.name === "profile",
    );

    expect(profile?.path).toBe("/profile");
    expect(profile?.meta?.requiresAuth).toBe(true);
    expect(profile?.nav?.label).toBe("Minha Conta");
  });

  it("presents role administration as Perfis without changing the route", () => {
    const descriptor = routeDescriptors.find((item) => item.name === "roles");
    const navigationItem = APP_NAV_ITEMS.find((item) => item.key === "roles");
    const shortcut = shortcutDescriptors.find((item) => item.name === "roles");

    expect(descriptor?.path).toBe("/roles");
    expect(descriptor?.nav?.label).toBe("Perfis");
    expect(navigationItem?.label).toBe("Perfis");
    expect(shortcut?.label).toBe("Gerenciar Perfis");
  });

  it("uses the dashboard as the single Início destination and keeps / compatible", () => {
    const home = routeDescriptors.find(
      (descriptor) => descriptor.name === "home",
    );
    const dashboard = routeDescriptors.find(
      (descriptor) => descriptor.name === "dashboard",
    );

    expect(home?.path).toBe("/");
    expect(home?.redirect).toEqual({ name: "dashboard" });
    expect(home?.nav).toBeUndefined();
    expect(dashboard?.path).toBe("/dashboard");
    expect(dashboard?.nav?.label).toBe("Início");
    expect(
      APP_NAV_ITEMS.filter((item) => item.label === "Início"),
    ).toHaveLength(1);
  });

  it("shows Manual in the limited session menu and protects Minha Conta", () => {
    const manual = routeDescriptors.find(
      (descriptor) => descriptor.name === "manual",
    );
    const manualMenuItem = APP_NAV_ITEMS.find((item) => item.key === "manual");
    const profile = routeDescriptors.find(
      (descriptor) => descriptor.name === "profile",
    );

    expect(manual?.meta).toMatchObject({
      requiresAuth: true,
      allowLimited: true,
    });
    expect(manualMenuItem?.allowLimited).toBe(true);
    expect(
      APP_NAV_ITEMS.find((item) => item.key === "limited")?.limitedOnly,
    ).toBe(true);
    expect(profile?.meta).toEqual({ requiresAuth: true });
  });

  it("marks the MFA challenge as guest-only and pending-MFA-only", () => {
    const challenge = routeDescriptors.find(
      (descriptor) => descriptor.name === "mfa-challenge",
    );

    expect(challenge?.path).toBe("/mfa-challenge");
    expect(challenge?.meta).toEqual({
      guestOnly: true,
      requiresMfa: true,
    });
  });

  it("derives menu items from navigation descriptors", () => {
    const navDescriptors = routeDescriptors.filter((d) => d.nav);
    expect(APP_NAV_ITEMS.map((item) => item.key)).toEqual(
      navDescriptors.map((d) => d.name),
    );
    for (const [index, item] of APP_NAV_ITEMS.entries()) {
      const descriptor = navDescriptors[index];
      expect(
        descriptor,
        `item ${item.key} sem descritor de navegação`,
      ).toBeDefined();
      if (!descriptor) continue;
      expect(item.label).toBe(descriptor.nav?.label);
      expect(item.to).toBe(descriptor.path);
      expect(item.requiresAuth).toBe(descriptor.meta?.requiresAuth);
      expect(item.guestOnly).toBe(descriptor.meta?.guestOnly);
      expect(item.allowLimited).toBe(descriptor.nav?.allowLimited);
      expect(item.limitedOnly).toBe(descriptor.nav?.limitedOnly);
      expect(item.permissions).toEqual(descriptor.meta?.permissions);
      expect(item.roles).toEqual(descriptor.meta?.roles);
    }
  });

  it("protects the sessions page and includes it in authenticated navigation", () => {
    const descriptor = routeDescriptors.find(
      (item) => item.name === "sessions",
    );
    const route = routes.find((item) => item.name === "sessions");
    const navigationItem = APP_NAV_ITEMS.find(
      (item) => item.key === "sessions",
    );

    expect(descriptor?.path).toBe("/sessions");
    expect(descriptor?.meta).toEqual({ requiresAuth: true });
    expect(route?.meta?.requiresAuth).toBe(true);
    expect(navigationItem).toMatchObject({
      label: "Sessões",
      to: "/sessions",
      requiresAuth: true,
    });
    expect(navigationItem?.permissions).toBeUndefined();
  });

  it("uses the same permission source for route, menu, and shortcut", () => {
    for (const descriptor of routeDescriptors) {
      const metaPermissions = descriptor.meta?.permissions;
      const route = routes.find((r) => r.name === descriptor.name);
      expect(route?.meta?.permissions).toEqual(metaPermissions);
      if (descriptor.nav) {
        const item = APP_NAV_ITEMS.find((i) => i.key === descriptor.name);
        expect(item?.permissions).toEqual(metaPermissions);
      }
    }
  });

  it("derives dashboard shortcuts from descriptors with pt-BR labels", () => {
    const paths = new Set(routeDescriptors.map((d) => d.path));
    expect(shortcutDescriptors.length).toBeGreaterThan(0);
    for (const shortcut of shortcutDescriptors) {
      expect(paths.has(shortcut.path)).toBe(true);
      expect(shortcut.label.length).toBeGreaterThan(0);
      expect(shortcut.permissions?.length ?? 0).toBeGreaterThan(0);
    }
    expect(shortcutDescriptors.map((s) => s.path)).toEqual([
      "/users",
      "/roles",
      "/logs",
    ]);
  });

  it("points shortcuts to existing routes with the same permissions", () => {
    expect(shortcutDescriptors.length).toBeGreaterThan(0);
    expect(shortcutDescriptors.map((s) => s.path)).toEqual([
      "/users",
      "/roles",
      "/logs",
    ]);
    for (const shortcut of shortcutDescriptors) {
      const descriptor = routeDescriptors.find((d) => d.path === shortcut.path);
      expect(descriptor, `atalho ${shortcut.name} sem rota`).toBeDefined();
      expect(descriptor?.name).toBe(shortcut.name);
      expect(descriptor?.meta?.permissions).toEqual(shortcut.permissions);
    }
  });
});
