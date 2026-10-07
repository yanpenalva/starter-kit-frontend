/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { SetUserStatusRequestStatus } from "./setUserStatusRequestStatus.ts";

/**
 * Wave B contract: activate or deactivate an account. The wave owning the
 * route enforces UserPolicy::setStatus (self and last-admin protections)
 * for the resolved target inside a PrivilegeTransaction.
 */
export interface SetUserStatusRequest {
  status: SetUserStatusRequestStatus;
}
