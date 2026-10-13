/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */
import type { UserIndex200MetaLinksItem } from "./userIndex200MetaLinksItem.ts";

export type UserIndex200Meta = {
  current_page: number;
  /** @nullable */
  from: number | null;
  last_page: number;
  links: UserIndex200MetaLinksItem[];
  path: string;
  per_page: number;
  /** @nullable */
  to: number | null;
  total: number;
};
