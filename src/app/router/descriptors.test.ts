import { describe, expect, it } from "vitest";
import { routes } from "./index";
import { routeDescriptors, shortcutDescriptors } from "./descriptors";
import { APP_NAV_ITEMS } from "@/features/auth/composables/useAuthorization";

describe("descritores de rota tipados", () => {
  it("mantém name e path únicos entre os descritores", () => {
    const names = routeDescriptors.map((d) => d.name);
    const paths = routeDescriptors.map((d) => d.path);
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("deriva as rotas registradas exclusivamente dos descritores", () => {
    expect(routes.map((r) => r.path)).toEqual(
      routeDescriptors.map((d) => d.path),
    );
    expect(routes.map((r) => r.name)).toEqual(
      routeDescriptors.map((d) => d.name),
    );
  });

  it("deriva os itens de menu dos descritores de navegação", () => {
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
      expect(item.permissions).toEqual(descriptor.meta?.permissions);
      expect(item.roles).toEqual(descriptor.meta?.roles);
    }
  });

  it("protege a página de sessões e a inclui na navegação autenticada", () => {
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

  it("usa a mesma fonte de permissões para rota, menu e atalho", () => {
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

  it("deriva os atalhos do painel dos descritores com rótulo pt-BR", () => {
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

  it("atalhos apontam para rotas existentes com as mesmas permissões", () => {
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
