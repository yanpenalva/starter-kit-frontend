import { describe, expect, it } from "vitest";
import { roleDescription } from "./role-descriptions";

describe("roleDescription", () => {
  it("descreve perfis conhecidos em pt-BR", () => {
    expect(roleDescription("admin", [])).toBe(
      "Acesso administrativo ao sistema",
    );
    expect(roleDescription("manager", [])).toBe(
      "Gerencia usuários e operações",
    );
    expect(roleDescription("auditor", [])).toBe(
      "Consulta registros e acompanha atividades",
    );
    expect(roleDescription("support", [])).toBe(
      "Apoia usuários e resolve solicitações",
    );
    expect(roleDescription("user", [])).toBe(
      "Acessa os recursos básicos da conta",
    );
  });

  it("descreve perfis personalizados pela quantidade de permissões", () => {
    expect(roleDescription("custom", ["users.view", "roles.view"])).toBe(
      "Perfil personalizado — 2 permissões",
    );
  });
});
