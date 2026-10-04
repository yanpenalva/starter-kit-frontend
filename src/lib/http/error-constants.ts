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
  unauthorized: "Sua sessão não está autenticada ou expirou.",
  forbidden: "Você não tem permissão para realizar esta ação.",
  not_found: "O recurso solicitado não foi encontrado.",
  conflict: "A requisição conflita com o estado atual do recurso.",
  csrf_mismatch: "Seu token de segurança expirou e a ação não foi concluída.",
  validation: "Alguns campos precisam da sua atenção.",
  rate_limited: "Muitas requisições. Aguarde antes de tentar novamente.",
  server_error:
    "O serviço está temporariamente indisponível. Tente novamente mais tarde.",
  network: "Não foi possível conectar ao serviço. Verifique sua conexão.",
  cancelled: "A requisição foi cancelada.",
  unexpected: "Uma resposta inesperada foi recebida.",
};

export const KNOWN_KINDS_SET: ReadonlySet<string> = new Set(
  Object.keys(SAFE_MESSAGES),
);
