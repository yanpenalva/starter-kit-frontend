import { describe, expect, it } from "vitest";
import { CATALOGUE_PERMISSIONS, cataloguePermissionLabel } from "./contract";

describe("CATALOGUE_PERMISSIONS", () => {
  it("contains the 10 catalogue permissions", () => {
    expect(CATALOGUE_PERMISSIONS).toEqual([
      "users.view",
      "users.update",
      "users.set-status",
      "users.assign-roles",
      "users.manage",
      "users.read-cpf",
      "roles.view",
      "roles.update-permissions",
      "roles.manage",
      "logs.view",
    ]);
    expect(CATALOGUE_PERMISSIONS).toHaveLength(10);
  });
});

describe("cataloguePermissionLabel", () => {
  it("returns Portuguese labels for known permission slugs", () => {
    expect(cataloguePermissionLabel("users.view")).toBe("Ver usuários");
  });

  it("preserves unknown permission slugs", () => {
    expect(cataloguePermissionLabel("future.read")).toBe("future.read");
  });
});
