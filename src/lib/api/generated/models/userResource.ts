/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { UserResourceRoleDisplayNames } from "./userResourceRoleDisplayNames.ts";

export interface UserResource {
  id: number;
  name: string;
  email: string;
  /** @nullable */
  email_verified_at: string | null;
  /** @nullable */
  deactivated_at: string | null;
  roles: string[];
  role_display_names?: UserResourceRoleDisplayNames;
  /** @nullable */
  cpf?: string | null;
}
