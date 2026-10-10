import { ref } from "vue";
import { defineStore } from "pinia";
import { authLogin, authLogout, authMyProfile } from "@/lib/api/generated";
import type {
  LoginRequest,
  MyProfileResource,
} from "@/lib/api/generated/models";
import {
  confirmEmailVerification,
  registerUser,
  requestPasswordReset as forgotPassword,
  resetPassword as resetPasswordApi,
  sendVerificationNotification,
} from "@/features/auth/api/auth.api";
import { isHttpError, onSessionExpired } from "@/lib/http";
import { queryClient } from "@/app/providers/query";
import { createSessionBootstrap } from "./session-bootstrap";
import {
  createSessionAuthorization,
  createSessionState,
  type SessionStatus,
} from "./session-model";
export type { SessionStatus } from "./session-model";

export const useSessionStore = defineStore("session", () => {
  const user = ref<MyProfileResource | null>(null);
  const status = ref<SessionStatus>("idle");
  const isInitialized = ref(false);
  const errorMessage = ref<string | null>(null);
  const {
    isAuthenticated,
    isLimited,
    isBlocked,
    roles,
    permissions,
    authenticatedStatus,
  } = createSessionState(user, status);
  const {
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    can,
    isAuthorized,
  } = createSessionAuthorization(roles, permissions);
  let invalidateBootstrap = (): void => undefined;
  const clearSession = (): void => {
    invalidateBootstrap();
    user.value = null;
    status.value = "unauthenticated";
    errorMessage.value = null;
    isInitialized.value = true;
    queryClient.clear();
  };
  const bootstrapCoordinator = createSessionBootstrap({
    user,
    status,
    isInitialized,
    errorMessage,
    authenticatedStatus,
    clearSession,
  });
  invalidateBootstrap = bootstrapCoordinator.invalidate;
  const bootstrap = bootstrapCoordinator.bootstrap;
  const login = async (
    credentials: LoginRequest,
  ): Promise<MyProfileResource> => {
    bootstrapCoordinator.invalidate();
    status.value = "loading";
    errorMessage.value = null;
    try {
      await authLogin(credentials);
      const response = await authMyProfile();
      user.value = response.data;
      status.value = authenticatedStatus(response.data);
      isInitialized.value = true;
      return response.data;
    } catch (error: unknown) {
      user.value = null;
      isInitialized.value = true;
      status.value = "unauthenticated";
      if (isHttpError(error) && error.kind === "forbidden") {
        status.value = "blocked";
      }
      if (isHttpError(error)) {
        errorMessage.value = error.message;
      }
      throw error;
    }
  };
  const logout = async (): Promise<void> => {
    bootstrapCoordinator.invalidate();
    status.value = "loading";
    let failure: unknown;
    let failed = false;
    try {
      await authLogout();
    } catch (error: unknown) {
      failure = error;
      failed = true;
    } finally {
      clearSession();
    }
    if (!failed) {
      return;
    }
    errorMessage.value = isHttpError(failure)
      ? failure.message
      : "Não foi possível concluir a solicitação de saída.";
    throw failure;
  };
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
    register: registerUser,
    resendVerification: sendVerificationNotification,
    confirmEmail: confirmEmailVerification,
    forgotPassword,
    resetPassword: resetPasswordApi,
    clearSession,
  };
});
