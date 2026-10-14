import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(
  resolve(process.cwd(), "src/shared/styles/app.css"),
  "utf8",
);

describe("global interaction cursors", () => {
  it("sets pointer for enabled controls and not-allowed for disabled controls", () => {
    expect(styles).toMatch(
      /button:not\(:disabled\)[\s\S]*?a\[href\][\s\S]*?cursor: pointer/,
    );
    expect(styles).toMatch(/\[role="button"\]:not\(\[aria-disabled="true"\]\)/);
    expect(styles).toMatch(
      /button:disabled,[\s\S]*?a\[href\]\[aria-disabled="true"\][\s\S]*?cursor: not-allowed/,
    );
  });
});
