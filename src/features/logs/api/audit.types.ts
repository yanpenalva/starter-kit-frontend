export const AUDIT_EVENTS = ["cli.bootstrap", "privileged.change"] as const;
export type AuditEvent = (typeof AUDIT_EVENTS)[number];

export const AUDIT_SUBJECT_TYPES = ["user", "role"] as const;
export type AuditSubjectType = (typeof AUDIT_SUBJECT_TYPES)[number];

export interface AdminActivity {
  id: number;
  event: AuditEvent;
  subject_type: string;
  subject_id: number;
  description: string;
  properties: Record<string, unknown>;
  created_at: string | null;
}

export interface ActivityFilters {
  page?: number;
  per_page?: number;
  event?: AuditEvent;
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
  role: "Papel",
};
