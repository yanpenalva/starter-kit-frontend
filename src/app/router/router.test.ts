import { describe, expect, it } from "vitest";
import { routes } from "./index";

describe("public route foundation", () => {
  it("exposes exactly the placeholder public route", () => {
    expect(routes.map((route) => route.path)).toEqual(["/"]);
    expect(routes[0]?.name).toBe("public-home");
  });
});
