import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { authLogin, authLogout, authMyProfile } from "@/lib/api/generated";
import type {
  LoginRequest,
  MyProfileResource,
} from "@/lib/api/generated/models";
import { isHttpError, onSessionExpired } from "@/lib/http";
import { queryClient } from "@/app/providers/query";

export type SessionStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "limited"
  | "blocked";

export const useSessionStore = defineStore("session", () => {
  const user = ref<MyProfileResource | null>(null);
  const status = ref<SessionStatus>("idle");
  const isInitialized = ref(false);
  const errorMessage = ref<string | null>(null);

  const isAuthenticated = computed(() => {
    return (
      (status.value === "authenticated" || status.value === "limited") &&
      user.value !== null
    );
  });

  const isLimited = computed(() => {
    return (
      status.value === "limited" ||
      (user.value !== null && user.value.email_verified_at === null)
    );
  });

  const isBlocked = computed(() => status.value === "blocked");

  const roles = computed<string[]>(() => user.value?.roles ?? []);
  const permissions = computed<string[]>(() => user.value?.permissions ?? []);

  function hasRole(role: string): boolean {
    return roles.value.includes(role);
  }

  function hasAnyRole(rolesToCheck: string[]): boolean {
    return rolesToCheck.some((r) => roles.value.includes(r));
  }

  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission);
  }

  function hasAnyPermission(permissionsToCheck: string[]): boolean {
    return permissionsToCheck.some((p) => permissions.value.includes(p));
  }

  function can(permission: string): boolean {
    return hasPermission(permission);
  }

  function isAuthorized(criteria: {
    roles?: string[];
    permissions?: string[];
  }): boolean {
    if (criteria.roles && criteria.roles.length > 0) {
      if (!hasAnyRole(criteria.roles)) {
        return false;
      }
    }
    if (criteria.permissions && criteria.permissions.length > 0) {
      if (!hasAnyPermission(criteria.permissions)) {
        return false;
      }
    }
    return true;
  }

  function clearSession(): void {
    user.value = null;
    status.value = "unauthenticated";
    errorMessage.value = null;
    isInitialized.value = true;
    queryClient.clear();
  }

  async function bootstrap(force = false): Promise<MyProfileResource | null> {
    if (isInitialized.value && !force) {
      return user.value;
    }

    status.value = "loading";
    errorMessage.value = null;

    try {
      const response = await authMyProfile();
      user.value = response.data;
      if (response.data.email_verified_at === null) {
        status.value = "limited";
      } else {
        status.value = "authenticated";
      }
      isInitialized.value = true;
      return response.data;
    } catch (error: unknown) {
      isInitialized.value = true;
      if (isHttpError(error)) {
        if (error.kind === "forbidden") {
          user.value = null;
          status.value = "blocked";
          errorMessage.value = error.message;
          return null;
        }
        if (error.kind === "unauthorized" || error.kind === "csrf_mismatch") {
          clearSession();
          return null;
        }
      }
      clearSession();
      return null;
    }
  }

  async function login(credentials: LoginRequest): Promise<MyProfileResource> {
    status.value = "loading";
    errorMessage.value = null;

    try {
      await authLogin(credentials);
      const response = await authMyProfile();
      user.value = response.data;
      if (response.data.email_verified_at === null) {
        status.value = "limited";
      } else {
        status.value = "authenticated";
      }
      isInitialized.value = true;
      return response.data;
    } catch (error: unknown) {
      user.value = null;
      isInitialized.value = true;
      if (isHttpError(error) && error.kind === "forbidden") {
        status.value = "blocked";
      } else {
        status.value = "unauthenticated";
      }
      if (isHttpError(error)) {
        errorMessage.value = error.message;
      }
      throw error;
    }
  }

  async function logout(): Promise<void> {
    status.value = "loading";
    try {
      await authLogout();
    } finally {
      clearSession();
    }
  }

  // Clear session when 401 or 419 occurs on any request, without mutation replay
  onSessionExpired(() => {
    clearSession();
  });

  return {
    user,
    status,
    isInitialized,
    errorMessage,
    isAuthenticated,
    isLimited,
    isBlocked,
    roles,
    permissions,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    can,
    isAuthorized,
    bootstrap,
    login,
    logout,
    clearSession,
  };
});
