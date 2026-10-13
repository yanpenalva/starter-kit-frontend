export const AUDIT_EVENTS = ["cli.bootstrap", "privileged.change"] as const;
export type AuditEvent = (typeof AUDIT_EVENTS)[number];

export const AUDIT_SUBJECT_TYPES = ["user", "role"] as const;
export type AuditSubjectType = (typeof AUDIT_SUBJECT_TYPES)[number];

export const AUDIT_LOG_NAMES = ["cli", "web"] as const;
export type AuditLogName = (typeof AUDIT_LOG_NAMES)[number];

export interface AdminActivity {
  id: number;
  event: AuditEvent;
  log_name: string;
  subject_type: string;
  subject_id: number;
  description: string;
  properties: Record<string, unknown>;
  created_at: string | null;
}

export interface ActivityFilters {
  page?: number;
  per_page?: number;
  search?: string;
  event?: AuditEvent;
  log_name?: string;
  subject_type?: AuditSubjectType;
}

export const AUDIT_EVENT_LABELS: Readonly<Record<AuditEvent, string>> = {
  "cli.bootstrap": "Bootstrap de CLI",
  "privileged.change": "Mudança de privilégio",
};

export const AUDIT_SUBJECT_TYPE_LABELS: Readonly<
  Record<AuditSubjectType, string>
> = {
  user: "Usuário",
  role: "Perfil",
};

export const AUDIT_LOG_NAME_LABELS: Readonly<Record<AuditLogName, string>> = {
  cli: "Linha de comando (CLI)",
  web: "Interface administrativa (web)",
};
