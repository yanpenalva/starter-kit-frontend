/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

export interface MyProfileResource {
  id: number;
  name: string;
  email: string;
  /** @nullable */
  email_verified_at: string | null;
  roles: string[];
  permissions: string[];
}
