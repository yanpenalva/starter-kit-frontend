import { computed, type ComputedRef, type Ref } from "vue";
import type { MyProfileResource } from "@/lib/api/generated/models";

export type SessionStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "mfa_required"
  | "limited"
  | "blocked";

export interface AuthorizationCriteria {
  roles?: string[];
  permissions?: string[];
}

export const createSessionState = (
  user: Ref<MyProfileResource | null>,
  status: Ref<SessionStatus>,
) => {
  const isAuthenticated = computed(
    () =>
      (status.value === "authenticated" || status.value === "limited") &&
      user.value !== null,
  );
  const isLimited = computed(
    () =>
      status.value === "limited" ||
      (user.value !== null && user.value.email_verified_at === null),
  );
  const isBlocked = computed(() => status.value === "blocked");
  const roles = computed<string[]>(() => user.value?.roles ?? []);
  const permissions = computed<string[]>(() => user.value?.permissions ?? []);
  const authenticatedStatus = (profile: MyProfileResource): SessionStatus =>
    profile.email_verified_at === null ? "limited" : "authenticated";
  return {
    isAuthenticated,
    isLimited,
    isBlocked,
    roles,
    permissions,
    authenticatedStatus,
  };
};

export const createSessionAuthorization = (
  roles: ComputedRef<string[]>,
  permissions: ComputedRef<string[]>,
) => {
  const hasRole = (role: string): boolean => roles.value.includes(role);
  const hasAnyRole = (rolesToCheck: string[]): boolean =>
    rolesToCheck.some((role) => roles.value.includes(role));
  const hasPermission = (permission: string): boolean =>
    permissions.value.includes(permission);
  const hasAnyPermission = (permissionsToCheck: string[]): boolean =>
    permissionsToCheck.some((permission) =>
      permissions.value.includes(permission),
    );
  const isAuthorized = (criteria: AuthorizationCriteria): boolean => {
    if (criteria.roles?.length && !hasAnyRole(criteria.roles)) {
      return false;
    }
    if (
      criteria.permissions?.length &&
      !hasAnyPermission(criteria.permissions)
    ) {
      return false;
    }
    return true;
  };
  return {
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    can: hasPermission,
    isAuthorized,
  };
};
