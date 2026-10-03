import { describe, expect, it } from "vitest";
import { pinia } from "./pinia";
import { queryClient } from "./query";

describe("application providers", () => {
  it("creates isolated UI and server-state provider instances", () => {
    expect(pinia).toBeDefined();
    expect(queryClient.getQueryCache().getAll()).toEqual([]);
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
  });
});
