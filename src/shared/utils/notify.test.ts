import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
vi.mock("quasar", () => ({ Notify: { create } }));

describe("notify", () => {
  beforeEach(() => create.mockClear());

  it.each([
    ["success", "positive"],
    ["error", "negative"],
    ["warning", "warning"],
    ["info", "info"],
  ] as const)("uses %s toast color", async (kind, color) => {
    const { notify } = await import("./notify");
    notify(kind, "Mensagem");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        color,
        attrs: { role: "status", "aria-live": "polite" },
      }),
    );
  });
});
