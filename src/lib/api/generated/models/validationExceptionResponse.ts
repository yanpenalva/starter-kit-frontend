/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { ValidationExceptionResponseErrors } from "./validationExceptionResponseErrors.ts";

export type ValidationExceptionResponse = {
  /** Errors overview. */
  message: string;
  /** A detailed description of each field that failed validation. */
  errors: ValidationExceptionResponseErrors;
};
