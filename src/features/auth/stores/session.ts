import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { authLogout, authMyProfile } from "@/lib/api/generated";
import type {
  LoginRequest,
  MyProfileResource,
} from "@/lib/api/generated/models";
import {
  confirmEmailVerification,
  completeMfaChallenge,
  loginUser,
  registerUser,
  requestPasswordReset as forgotPassword,
  resetPassword as resetPasswordApi,
  sendVerificationNotification,
} from "@/features/auth/api/auth.api";
import type { MfaChallengeRequest } from "@/features/auth/api/auth.api";
import { isHttpError, onSessionExpired } from "@/lib/http";
import type { BlockedAccountReason } from "@/lib/http";
import { queryClient } from "@/app/providers/query";
import { createSessionUser } from "./session-profile";
import {
  blockedDetailsFromError,
  createSessionBootstrap,
} from "./session-bootstrap";
import {
  createSessionAuthorization,
  createSessionState,
  type SessionStatus,
} from "./session-model";
export type { SessionStatus } from "./session-model";

export const useSessionStore = defineStore("session", () => {
  const user = createSessionUser();
  const status = ref<SessionStatus>("idle");
  const isInitialized = ref(false);
  const errorMessage = ref<string | null>(null);
  const blockedReason = ref<BlockedAccountReason | null>(null);
  const blockedEmailVerifiedAt = ref<string | null>(null);
  const {
    isAuthenticated,
    isLimited,
    isBlocked,
    roles,
    permissions,
    authenticatedStatus,
  } = createSessionState(user, status);
  const isPendingApproval = computed(
    () =>
      status.value === "blocked" && blockedReason.value === "pending_approval",
  );
  const isSuspended = computed(
    () => status.value === "blocked" && blockedReason.value === "suspended",
  );
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
    blockedReason.value = null;
    blockedEmailVerifiedAt.value = null;
    isInitialized.value = true;
    queryClient.clear();
  };
  const bootstrapCoordinator = createSessionBootstrap({
    user,
    status,
    isInitialized,
    errorMessage,
    blockedReason,
    blockedEmailVerifiedAt,
    authenticatedStatus,
    clearSession,
  });
  invalidateBootstrap = bootstrapCoordinator.invalidate;
  const bootstrap = bootstrapCoordinator.bootstrap;
  const handleAuthenticationFailure = (error: unknown): void => {
    user.value = null;
    isInitialized.value = true;
    status.value = "unauthenticated";
    blockedReason.value = null;
    blockedEmailVerifiedAt.value = null;
    if (isHttpError(error) && error.kind === "forbidden") {
      status.value = "blocked";
      const blocked = blockedDetailsFromError(error);
      blockedReason.value = blocked.reason;
      blockedEmailVerifiedAt.value = blocked.emailVerifiedAt;
    }
    if (isHttpError(error)) {
      errorMessage.value = error.message;
    }
  };
  const login = async (
    credentials: LoginRequest,
  ): Promise<MyProfileResource | null> => {
    bootstrapCoordinator.invalidate();
    status.value = "loading";
    errorMessage.value = null;
    try {
      const loginResponse = await loginUser(credentials);
      if (loginResponse.requires_mfa) {
        queryClient.clear();
        user.value = null;
        status.value = "mfa_required";
        blockedReason.value = null;
        blockedEmailVerifiedAt.value = null;
        isInitialized.value = true;
        return null;
      }
      const response = await authMyProfile();
      user.value = response.data;
      status.value = authenticatedStatus(response.data);
      blockedReason.value = null;
      blockedEmailVerifiedAt.value = null;
      isInitialized.value = true;
      return response.data;
    } catch (error: unknown) {
      handleAuthenticationFailure(error);
      throw error;
    }
  };
  const completeChallenge = async (
    payload: MfaChallengeRequest,
  ): Promise<MyProfileResource> => {
    errorMessage.value = null;
    try {
      await completeMfaChallenge(payload);
      const response = await authMyProfile();
      user.value = response.data;
      status.value = authenticatedStatus(response.data);
      blockedReason.value = null;
      blockedEmailVerifiedAt.value = null;
      isInitialized.value = true;
      return response.data;
    } catch (error: unknown) {
      if (isHttpError(error) && error.kind === "validation") {
        errorMessage.value = error.message;
        throw error;
      }
      handleAuthenticationFailure(error);
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
    blockedReason,
    blockedEmailVerifiedAt,
    isPendingApproval,
    isSuspended,
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
    completeChallenge,
    logout,
    register: registerUser,
    resendVerification: sendVerificationNotification,
    confirmEmail: confirmEmailVerification,
    forgotPassword,
    resetPassword: resetPasswordApi,
    clearSession,
  };
});
