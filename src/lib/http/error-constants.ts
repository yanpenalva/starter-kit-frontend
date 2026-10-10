import type { HttpErrorKind, MappedStatusKind } from "./error-types";

export const HTTP_STATUS_UNPROCESSABLE_ENTITY = 422;
export const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
export const HTTP_STATUS_MIN = 100;
export const HTTP_STATUS_MAX = 599;
export const HTTP_STATUS_SERVER_ERROR_MIN = 500;
export const HTTP_STATUS_SERVER_ERROR_MAX = 599;
export const MAX_RETRY_AFTER_SECONDS = 31_536_000;

export const STATUS_BY_KIND: Readonly<Record<MappedStatusKind, number>> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  csrf_mismatch: 419,
  server_error: 500,
};

export const STATUS_TO_KIND: Readonly<Record<number, HttpErrorKind>> = {
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  419: "csrf_mismatch",
  422: "validation",
  429: "rate_limited",
  500: "server_error",
};

export const SAFE_MESSAGES: Readonly<Record<HttpErrorKind, string>> = {
  unauthorized:
    "Sua sessão expirou ou não está autenticada. Entre novamente para continuar.",
  forbidden:
    "Sua conta não tem permissão para esta ação. Solicite acesso a um administrador.",
  not_found:
    "Não encontramos o recurso solicitado. Atualize a página e tente novamente.",
  conflict:
    "A ação conflita com o estado atual do registro. Recarregue os dados e tente novamente.",
  csrf_mismatch:
    "Sua sessão de segurança expirou e a ação não foi concluída. Recarregue a página e repita a operação.",
  validation:
    "Alguns campos precisam de correção. Revise os itens indicados e envie novamente.",
  rate_limited:
    "Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.",
  server_error:
    "O serviço está temporariamente indisponível. Tente novamente em alguns instantes.",
  network:
    "Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.",
  cancelled: "A solicitação foi cancelada antes de ser concluída.",
  unexpected:
    "Recebemos uma resposta inesperada do serviço. Atualize a página e tente novamente.",
};

export const KNOWN_KINDS_SET: ReadonlySet<string> = new Set(
  Object.keys(SAFE_MESSAGES),
);

export const BLOCKED_ACCOUNT_REASONS: ReadonlySet<string> = new Set([
  "pending_approval",
  "suspended",
]);
