import { computed } from "vue";
import { useSessionStore } from "../stores/session";
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
    roles: ["admin"],
  },
  {
    key: "logs",
    label: "Auditoria",
    to: "/logs",
    requiresAuth: true,
    permissions: ["logs.view"],
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
  const isAuthenticated = computed(() => session.isAuthenticated);
  const isLimited = computed(() => session.isLimited);
  const isBlocked = computed(() => session.isBlocked);
  const user = computed(() => session.user);
  const roles = computed(() => session.roles);
  const permissions = computed(() => session.permissions);
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
    if (session.isBlocked) {
      return false;
    }
    if (item.guestOnly && session.isAuthenticated) {
      return false;
    }
    if (item.requiresAuth && !session.isAuthenticated) {
      return false;
    }
    if (session.isAuthenticated && session.isLimited) {
      return Boolean(item.allowLimited || !item.requiresAuth);
    }
    if (session.isAuthenticated && !session.isLimited && item.allowLimited) {
      return false;
    }
    if (item.roles && item.roles.length > 0) {
      if (!hasAnyRole(item.roles)) {
        return false;
      }
    }
    if (item.permissions && item.permissions.length > 0) {
      if (!canAny(item.permissions)) {
        return false;
      }
    }
    return true;
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
