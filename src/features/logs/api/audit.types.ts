import {
  ActivityLogIndexAction,
  ActivityLogIndexEvent,
} from "@/lib/api/generated/models";
import type { ActivityResource } from "@/lib/api/generated/models";

export type AuditEvent = Exclude<ActivityLogIndexEvent, null>;
export const AUDIT_EVENTS = Object.values(ActivityLogIndexEvent).filter(
  (event): event is AuditEvent => event !== null,
);

export type AuditAction = Exclude<ActivityLogIndexAction, null>;
export const AUDIT_ACTIONS = Object.values(ActivityLogIndexAction);

export const AUDIT_SUBJECT_TYPES = ["user", "role"] as const;
export type AuditSubjectType = (typeof AUDIT_SUBJECT_TYPES)[number];

export type AdminActivity = ActivityResource;

export interface ActivityFilters {
  page?: number;
  per_page?: number;
  search?: string;
  event?: AuditEvent;
  action?: AuditAction;
  subject_type?: AuditSubjectType;
}

export const AUDIT_EVENT_LABELS: Readonly<Record<AuditEvent, string>> = {
  "cli.bootstrap": "Bootstrap de CLI",
  "privileged.change": "Mudança de privilégio",
};

export const AUDIT_ACTION_LABELS: Readonly<Record<AuditAction, string>> = {
  "user.store": "Criação de usuário",
  "user.update": "Atualização de usuário",
  "user.destroy": "Exclusão de usuário",
  "user.status": "Alteração de status do usuário",
  "user.assign_roles": "Atribuição de perfis",
  "role.store": "Criação de perfil",
  "role.update_permissions": "Alteração de permissões",
  "role.destroy": "Exclusão de perfil",
  "role.rename": "Renomeação de perfil",
  "admin.bootstrap": "Bootstrap administrativo",
};

export const AUDIT_SUBJECT_TYPE_LABELS: Readonly<
  Record<AuditSubjectType, string>
> = {
  user: "Usuário",
  role: "Perfil",
};
