import type { MyProfileResource } from "@/lib/api/generated/models";
import type { AdminActivity } from "@/features/logs/api/audit.types";
import type { AdminRole } from "@/features/roles/api/roles.types";
import type { AdminUser } from "@/features/users/api/users.types";
import { CATALOGUE_PERMISSIONS } from "@/shared/types/contract";

export interface MockDatabase {
  readonly profile: MyProfileResource;
  readonly users: AdminUser[];
  readonly roles: AdminRole[];
  readonly activities: AdminActivity[];
}

const FIRST_NAMES = [
  "Alexandra Constantinopolou",
  "Benedito Raimundo",
  "Catarina Elisabete",
  "Damião Osvaldo",
  "Elisângela Aparecida",
  "Francisco das Chagas",
  "Graciliana Teodora",
  "Horácio Benedito",
  "Iracema Guadalupe",
  "Joselito Raimundo Nonato da Silva Sauro",
  "Creuza Maria do Socorro",
  "Lindomar Sebastião",
  "Marinalva Conceição",
  "Nivaldo Teodoro",
  "Ostervaldina das Dores",
  "Petrônio Washington",
] as const;

const LAST_NAMES = [
  "Fitzsimmons Albuquerque",
  "Vasconcelos Cavalcante",
  "Mendonça Figueiredo",
  "Barros Wanderley",
  "Peixoto Lima Verde",
  "Siqueira Campos Sales",
  "Nogueira Bezerra de Menezes Albuquerque Cavalcanti",
  "Queiroz Teles de Menezes",
  "Arruda Câmara Cascudo",
  "Xavier de Albuquerque Júnior",
  "Montenegro Carvalho Filho",
  "Rego Barros Neto",
  "Dantas Rothschild Prado",
  "Moreira Salles Ventura",
  "Prado Júnior Gonçalves",
  "Lacerda Franco Sobrinho",
] as const;

const LIST_ROLES = ["user", "manager", "support", "auditor"] as const;

const padCpf = (seed: number): string => {
  return String(10000000000 + seed * 7919).slice(0, 11);
};

const makeMockUser = (id: number): AdminUser => {
  const first = FIRST_NAMES[(id - 1) % FIRST_NAMES.length] ?? "";
  const last = LAST_NAMES[(id * 5 + 3) % LAST_NAMES.length] ?? "";
  const deactivated = id % 4 === 0;
  return {
    id,
    name: `${first} ${last}`,
    email: `${
      first
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .split(" ")[0] ?? ""
    }.${id}@example.test`,
    email_verified_at:
      id % 7 === 6
        ? null
        : `2026-09-${String((id % 27) + 1).padStart(2, "0")}T10:00:00Z`,
    deactivated_at: deactivated ? "2026-10-01T12:00:00Z" : null,
    roles: [LIST_ROLES[id % LIST_ROLES.length] ?? "user"],
    cpf: padCpf(id),
  };
};

const makeMockRoles = (): AdminRole[] => [
  {
    id: 1,
    name: "admin",
    guard_name: "web",
    permissions: [...CATALOGUE_PERMISSIONS],
  },
  {
    id: 2,
    name: "manager",
    guard_name: "web",
    permissions: [
      "users.view",
      "users.update",
      "users.set-status",
      "users.assign-roles",
      "users.read-cpf",
      "logs.view",
    ],
  },
  {
    id: 3,
    name: "support",
    guard_name: "web",
    permissions: ["users.view", "users.update", "logs.view"],
  },
  {
    id: 4,
    name: "auditor",
    guard_name: "web",
    permissions: ["users.view", "users.read-cpf", "logs.view"],
  },
  {
    id: 5,
    name: "user",
    guard_name: "web",
    permissions: [],
  },
];

const ACTIVITY_DESCRIPTIONS = [
  "Atribuição de perfis alterada para o usuário com justificativa registrada no processo administrativo de revisão periódica de acessos privilegiados do trimestre.",
  "Conta desativada após três tentativas consecutivas de autenticação com credenciais inválidas em janela de quinze minutos a partir de origem desconhecida.",
  "Permissões do perfil atualizadas pela matriz de acessos com remoção de privilégios de escrita e manutenção exclusiva dos privilégios de leitura e auditoria.",
  "Sessão administrativa iniciada pela interface de linha de comando durante a rotina automatizada de verificação de integridade dos registros de auditoria.",
] as const;

const makeMockActivities = (): AdminActivity[] => {
  return Array.from({ length: 48 }, (_, index) => {
    const id = index + 1;
    const event = id % 5 === 0 ? "cli.bootstrap" : "privileged.change";
    const subjectType = id % 3 === 0 ? "role" : "user";
    return {
      id,
      event,
      log_name: id % 7 === 0 ? "cli" : "web",
      subject_type: subjectType,
      subject_id: (id % 32) + 1,
      description: `${ACTIVITY_DESCRIPTIONS[index % ACTIVITY_DESCRIPTIONS.length]} (registro ${id} de 48).`,
      properties: {
        correlation_id: `mock-corr-${String(id).padStart(4, "0")}`,
        actor_type: "user",
        actor_id: 1,
      },
      created_at: `2026-10-${String((id % 9) + 1).padStart(2, "0")}T${String(id % 24).padStart(2, "0")}:30:00Z`,
    };
  });
};

export const createMockDatabase = (): MockDatabase => {
  return {
    profile: {
      id: 1,
      name: "Alice Administradora Fictícia",
      email: "alice.admin@example.test",
      email_verified_at: "2026-09-01T10:00:00Z",
      roles: ["admin"],
      permissions: [...CATALOGUE_PERMISSIONS],
    },
    users: Array.from({ length: 32 }, (_, index) => makeMockUser(index + 1)),
    roles: makeMockRoles(),
    activities: makeMockActivities(),
  };
};
