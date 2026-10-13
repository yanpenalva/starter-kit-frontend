/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { UserIndex200Links } from "./userIndex200Links.ts";
import type { UserIndex200Meta } from "./userIndex200Meta.ts";
import type { UserResource } from "./userResource.ts";

export type UserIndex200 = {
  data: UserResource[];
  links?: UserIndex200Links;
  meta?: UserIndex200Meta;
};
