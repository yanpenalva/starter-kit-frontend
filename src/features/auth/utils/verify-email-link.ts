import type { LocationQuery } from "vue-router";
import type { VerifyEmailLink } from "@/features/auth/api/auth.api";
import { isHttpError, isRateLimitedHttpError } from "@/lib/http";

const singleParam = (
  value: LocationQuery[string] | undefined,
): string | null => {
  return typeof value === "string" && value !== "" ? value : null;
};

export const signedLinkFromQuery = (
  query: LocationQuery,
): VerifyEmailLink | null => {
  const id = singleParam(query.id);
  const hash = singleParam(query.hash);
  const expires = singleParam(query.expires);
  const signature = singleParam(query.signature);

  if (id === null || hash === null || expires === null || signature === null) {
    return null;
  }

  return { id, hash, expires, signature };
};

export const signedLinkErrorMessage = (error: unknown): string => {
  if (isRateLimitedHttpError(error)) {
    if (error.retryAfterSeconds !== null) {
      return `Muitas tentativas. Tente novamente em ${error.retryAfterSeconds} segundos.`;
    }
    return "Muitas tentativas. Aguarde antes de tentar novamente.";
  }
  if (isHttpError(error) && error.kind === "unauthorized") {
    return "Sua sessão expirou. Entre na sua conta e abra o link de verificação novamente.";
  }
  if (isHttpError(error) && error.kind === "forbidden") {
    return "Este link de verificação é inválido ou expirou. Peça um novo e-mail de verificação.";
  }
  if (isHttpError(error)) {
    return error.message;
  }
  return "Não foi possível conectar ao serviço. Verifique sua conexão.";
};
