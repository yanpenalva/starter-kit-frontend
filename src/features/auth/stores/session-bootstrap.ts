import type { Ref } from "vue";
import { authMyProfile } from "@/lib/api/generated";
import type { MyProfileResource } from "@/lib/api/generated/models";
import { isHttpError } from "@/lib/http";
import type { SessionStatus } from "./session-model";

interface BootstrapState {
  user: Ref<MyProfileResource | null>;
  status: Ref<SessionStatus>;
  isInitialized: Ref<boolean>;
  errorMessage: Ref<string | null>;
  authenticatedStatus: (profile: MyProfileResource) => SessionStatus;
  clearSession: () => void;
}

export const createSessionBootstrap = (state: BootstrapState) => {
  let pendingRequest: Promise<MyProfileResource | null> | null = null;
  let generation = 0;
  const invalidate = (): void => {
    generation += 1;
    pendingRequest = null;
  };
  const hydrateProfile = (
    profile: MyProfileResource,
    requestGeneration: number,
  ): MyProfileResource | null => {
    if (requestGeneration !== generation) {
      return state.user.value;
    }
    state.user.value = profile;
    state.status.value = state.authenticatedStatus(profile);
    state.isInitialized.value = true;
    return profile;
  };
  const handleBootstrapError = (
    error: unknown,
    requestGeneration: number,
  ): MyProfileResource | null => {
    if (requestGeneration !== generation) {
      return state.user.value;
    }
    const forbidden = isHttpError(error) && error.kind === "forbidden";
    const invalidSession =
      isHttpError(error) &&
      (error.kind === "unauthorized" || error.kind === "csrf_mismatch");
    if (forbidden) {
      state.user.value = null;
      state.status.value = "blocked";
      state.errorMessage.value = isHttpError(error)
        ? error.message
        : "Esta conta está bloqueada.";
      state.isInitialized.value = true;
    }
    if (invalidSession) {
      state.clearSession();
    }
    if (!forbidden && !invalidSession) {
      state.status.value =
        state.user.value === null
          ? "unauthenticated"
          : state.authenticatedStatus(state.user.value);
      state.errorMessage.value = isHttpError(error)
        ? error.message
        : "Não foi possível verificar a sessão.";
      state.isInitialized.value = false;
    }
    return null;
  };
  const bootstrap = (force = false): Promise<MyProfileResource | null> => {
    if (pendingRequest !== null) {
      return pendingRequest;
    }
    if (state.isInitialized.value && !force) {
      return Promise.resolve(state.user.value);
    }
    if (state.user.value === null) {
      state.status.value = "loading";
    }
    state.errorMessage.value = null;
    const requestGeneration = generation;
    const request = authMyProfile()
      .then(({ data }) => hydrateProfile(data, requestGeneration))
      .catch((error: unknown) =>
        handleBootstrapError(error, requestGeneration),
      );
    const sharedRequest = request.finally(() => {
      if (pendingRequest === sharedRequest) {
        pendingRequest = null;
      }
    });
    pendingRequest = sharedRequest;
    return sharedRequest;
  };
  return { bootstrap, invalidate };
};
