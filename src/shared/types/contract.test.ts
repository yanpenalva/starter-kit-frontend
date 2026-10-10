import { describe, expect, it } from "vitest";
import { CATALOGUE_PERMISSIONS } from "./contract";

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
