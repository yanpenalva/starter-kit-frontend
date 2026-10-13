/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { RoleIndex200Links } from "./roleIndex200Links.ts";
import type { RoleIndex200Meta } from "./roleIndex200Meta.ts";
import type { RoleResource } from "./roleResource.ts";

export type RoleIndex200 = {
  data: RoleResource[];
  links?: RoleIndex200Links;
  meta?: RoleIndex200Meta;
};
