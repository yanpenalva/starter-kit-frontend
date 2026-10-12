import { computed, toRef } from "vue";
import { useSessionStore } from "@/features/auth/stores/session";
import { routeDescriptors } from "@/app/router/descriptors";
import type { NavigationDescriptor } from "@/app/router/descriptors";

export interface NavMenuItem {
  key: string;
  label: string;
  to: string;
  icon?: string;
  requiresAuth?: boolean;
  guestOnly?: boolean;
  allowLimited?: boolean;
  roles?: string[];
  permissions?: string[];
}

const navLabelOverrides: Readonly<Record<string, string>> = {
  home: "Início",
};

type NavDescriptor = NavigationDescriptor & {
  nav: { label: string; allowLimited?: boolean };
};

const hasNav = (
  descriptor: NavigationDescriptor,
): descriptor is NavDescriptor => descriptor.nav !== undefined;

export const APP_NAV_ITEMS: readonly NavMenuItem[] = routeDescriptors
  .filter(hasNav)
  .map((descriptor) => ({
    key: descriptor.name,
    label: navLabelOverrides[descriptor.name] ?? descriptor.nav.label,
    to: descriptor.path,
    requiresAuth: descriptor.meta?.requiresAuth,
    guestOnly: descriptor.meta?.guestOnly,
    allowLimited: descriptor.nav.allowLimited,
    roles: descriptor.meta?.roles,
    permissions: descriptor.meta?.permissions,
  }));
export const useAuthorization = () => {
  const session = useSessionStore();
  const isAuthenticated = toRef(session, "isAuthenticated");
  const isLimited = toRef(session, "isLimited");
  const isBlocked = toRef(session, "isBlocked");
  const user = toRef(session, "user");
  const roles = toRef(session, "roles");
  const permissions = toRef(session, "permissions");
  const can = (permission: string): boolean => {
    if (session.isLimited) {
      return false;
    }
    return session.hasPermission(permission);
  };
  const canAny = (perms: string[]): boolean => {
    if (session.isLimited) {
      return false;
    }
    return session.hasAnyPermission(perms);
  };
  const canAll = (perms: string[]): boolean => {
    if (session.isLimited) {
      return false;
    }
    return perms.every((p) => session.hasPermission(p));
  };
  const hasRole = (role: string): boolean => {
    if (session.isLimited) {
      return false;
    }
    return session.hasRole(role);
  };
  const hasAnyRole = (targetRoles: string[]): boolean => {
    if (session.isLimited) {
      return false;
    }
    return session.hasAnyRole(targetRoles);
  };
  const isAuthorized = (criteria: {
    roles?: string[];
    permissions?: string[];
  }): boolean => {
    if (session.isLimited) {
      return false;
    }
    return session.isAuthorized(criteria);
  };
  const isItemVisible = (item: NavMenuItem): boolean => {
    const authenticated = session.isAuthenticated;
    const limited = authenticated && session.isLimited;
    const sessionAllowsItem =
      !session.isBlocked &&
      !(item.guestOnly && authenticated) &&
      !(item.requiresAuth && !authenticated) &&
      (!limited || Boolean(item.allowLimited || !item.requiresAuth)) &&
      !(authenticated && !session.isLimited && item.allowLimited);
    const authorizationAllowsItem =
      limited ||
      ((!item.roles?.length || hasAnyRole(item.roles)) &&
        (!item.permissions?.length || canAny(item.permissions)));
    return sessionAllowsItem && authorizationAllowsItem;
  };
  const visibleNavItems = computed(() => {
    return APP_NAV_ITEMS.filter((item) => isItemVisible(item));
  });
  return {
    isAuthenticated,
    isLimited,
    isBlocked,
    user,
    roles,
    permissions,
    can,
    canAny,
    canAll,
    hasRole,
    hasAnyRole,
    isAuthorized,
    isItemVisible,
    visibleNavItems,
  };
};
