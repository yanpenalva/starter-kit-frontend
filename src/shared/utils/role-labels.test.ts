import { describe, expect, it } from "vitest";
import { roleLabel } from "./role-labels";

describe("roleLabel", () => {
  it("translates known roles and preserves custom names", () => {
    expect(roleLabel("admin")).toBe("Administrador");
    expect(roleLabel("manager")).toBe("Gerente");
    expect(roleLabel("auditor")).toBe("Auditor");
    expect(roleLabel("perfil-customizado")).toBe("perfil-customizado");
  });
});
