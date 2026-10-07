/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { UserResourceRolesItem } from "./userResourceRolesItem.ts";

export interface UserResource {
  id: number;
  name: string;
  email: string;
  /** @nullable */
  email_verified_at: string | null;
  /** @nullable */
  deactivated_at: string | null;
  roles: UserResourceRolesItem[];
  /** @nullable */
  cpf?: string | null;
}
