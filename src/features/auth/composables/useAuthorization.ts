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

export function useAuthorization() {
  const session = useSessionStore();

  const isAuthenticated = computed(() => session.isAuthenticated);
  const isLimited = computed(() => session.isLimited);
  const isBlocked = computed(() => session.isBlocked);
  const user = computed(() => session.user);
  const roles = computed(() => session.roles);
  const permissions = computed(() => session.permissions);

  function can(permission: string): boolean {
    if (session.isLimited) {
      return false;
    }
    return session.hasPermission(permission);
  }

  function canAny(perms: string[]): boolean {
    if (session.isLimited) {
      return false;
    }
    return session.hasAnyPermission(perms);
  }

  function canAll(perms: string[]): boolean {
    if (session.isLimited) {
      return false;
    }
    return perms.every((p) => session.hasPermission(p));
  }

  function hasRole(role: string): boolean {
    if (session.isLimited) {
      return false;
    }
    return session.hasRole(role);
  }

  function hasAnyRole(targetRoles: string[]): boolean {
    if (session.isLimited) {
      return false;
    }
    return session.hasAnyRole(targetRoles);
  }

  function isAuthorized(criteria: {
    roles?: string[];
    permissions?: string[];
  }): boolean {
    if (session.isLimited) {
      return false;
    }
    return session.isAuthorized(criteria);
  }

  function isItemVisible(item: NavMenuItem): boolean {
    // 1. Blocked accounts have no navigation
    if (session.isBlocked) {
      return false;
    }

    // 2. Guest-only items hidden for authenticated users
    if (item.guestOnly && session.isAuthenticated) {
      return false;
    }

    // 3. Items requiring auth hidden for unauthenticated users
    if (item.requiresAuth && !session.isAuthenticated) {
      return false;
    }

    // 4. Limited session handling
    if (session.isAuthenticated && session.isLimited) {
      // In limited state, only items explicitly allowing limited state (e.g. verification guidance) or public items are visible
      return Boolean(item.allowLimited || !item.requiresAuth);
    }

    // If verified, hide the "limited/verification" item
    if (session.isAuthenticated && !session.isLimited && item.allowLimited) {
      return false;
    }

    // 5. Check role restrictions
    if (item.roles && item.roles.length > 0) {
      if (!hasAnyRole(item.roles)) {
        return false;
      }
    }

    // 6. Check permission restrictions
    if (item.permissions && item.permissions.length > 0) {
      if (!canAny(item.permissions)) {
        return false;
      }
    }

    return true;
  }

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
}
