import { describe, expect, it } from "vitest";
import { cpfDigits, formatCpf, maskCpf } from "./cpf-mask";

describe("cpf display helpers", () => {
  it("keeps only the digits so formatted and raw values behave the same", () => {
    expect(cpfDigits("529.982.247-25")).toBe("52998224725");
    expect(cpfDigits("52998224725")).toBe("52998224725");
    expect(cpfDigits("")).toBe("");
  });

  it("formats a complete CPF for reading", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
    expect(formatCpf("529.982.247-25")).toBe("529.982.247-25");
  });

  it("refuses to format an incomplete CPF instead of guessing digits", () => {
    expect(formatCpf("529982247")).toBeNull();
    expect(formatCpf("")).toBeNull();
  });

  it("masks every digit but the last two", () => {
    expect(maskCpf("52998224725")).toBe("***.***.***-25");
    expect(maskCpf("529.982.247-25")).toBe("***.***.***-25");
  });

  it("returns null when the account has no CPF to show", () => {
    expect(maskCpf(undefined)).toBeNull();
    expect(maskCpf("")).toBeNull();
  });

  it("never reveals digits when the stored value is too short to mask safely", () => {
    expect(maskCpf("5")).toBe("***.***.***-**");
  });
});
