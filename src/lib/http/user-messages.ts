import { SAFE_MESSAGES } from "./error-constants";
import {
  isHttpError,
  isRateLimitedHttpError,
  isValidationHttpError,
} from "./error-guards";
import type { RateLimitedHttpError, ValidationHttpError } from "./error-types";

export const UNKNOWN_ERROR_MESSAGE =
  "Não foi possível concluir a operação. Tente novamente em alguns instantes.";

export const rateLimitedMessage = (seconds: number): string =>
  `Muitas tentativas em pouco tempo. Aguarde ${seconds} segundos e tente novamente.`;

export const firstValidationMessage = (
  error: ValidationHttpError,
): string | null => {
  const firstField = Object.keys(error.fieldErrors)[0];
  if (firstField === undefined) {
    return null;
  }
  return error.fieldErrors[firstField]?.[0] ?? null;
};

const describeValidation = (error: ValidationHttpError): string =>
  firstValidationMessage(error) ?? SAFE_MESSAGES.validation;

const describeRateLimited = (error: RateLimitedHttpError): string =>
  error.retryAfterSeconds === null
    ? SAFE_MESSAGES.rate_limited
    : rateLimitedMessage(error.retryAfterSeconds);

export const describeHttpError = (error: unknown): string => {
  if (!isHttpError(error)) {
    return UNKNOWN_ERROR_MESSAGE;
  }
  if (isValidationHttpError(error)) {
    return describeValidation(error);
  }
  return isRateLimitedHttpError(error)
    ? describeRateLimited(error)
    : error.message;
};
