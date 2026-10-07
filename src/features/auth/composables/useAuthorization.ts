import { computed, toRef } from "vue";
import { useSessionStore } from "@/features/auth/stores/session";
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
export const APP_NAV_ITEMS: readonly NavMenuItem[] = [
  {
    key: "home",
    label: "Início",
    to: "/",
  },
  {
    key: "dashboard",
    label: "Painel",
    to: "/dashboard",
    requiresAuth: true,
  },
  {
    key: "users",
    label: "Usuários",
    to: "/users",
    requiresAuth: true,
    permissions: ["users.view"],
  },
  {
    key: "roles",
    label: "Papéis",
    to: "/roles",
    requiresAuth: true,
    permissions: ["roles.view"],
  },
  {
    key: "logs",
    label: "Auditoria",
    to: "/logs",
    requiresAuth: true,
    permissions: ["logs.view"],
  },
  {
    key: "manual",
    label: "Manual",
    to: "/manual",
    requiresAuth: true,
  },
  {
    key: "limited",
    label: "Verificação",
    to: "/limited",
    requiresAuth: true,
    allowLimited: true,
  },
];
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
