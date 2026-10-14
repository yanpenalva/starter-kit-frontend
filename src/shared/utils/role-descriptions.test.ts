import { describe, expect, it } from "vitest";
import { roleDescription } from "./role-descriptions";

describe("roleDescription", () => {
  it("describes known roles in pt-BR", () => {
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

  it("describes custom roles by permission count", () => {
    expect(roleDescription("custom", ["users.view", "roles.view"])).toBe(
      "Perfil personalizado — 2 permissões",
    );
  });
});
