import { describe, expect, it } from "vitest";
import { normalizeCpf, validateCpf } from "./cpf";

describe("CPF utility", () => {
  it("allows empty or undefined values as valid since CPF is optional", () => {
    expect(validateCpf(null)).toBe(true);
    expect(validateCpf(undefined)).toBe(true);
    expect(validateCpf("")).toBe(true);
    expect(validateCpf("   ")).toBe(true);
  });

  it("validates valid CPF strings with or without punctuation", () => {
    expect(validateCpf("52998224725")).toBe(true);
    expect(validateCpf("529.982.247-25")).toBe(true);
    expect(validateCpf("00000000191")).toBe(true);
  });

  it("rejects CPFs with invalid length", () => {
    expect(validateCpf("123")).toBe(false);
    expect(validateCpf("1234567890")).toBe(false);
    expect(validateCpf("123456789012")).toBe(false);
  });

  it("rejects CPFs with all identical digits", () => {
    expect(validateCpf("00000000000")).toBe(false);
    expect(validateCpf("11111111111")).toBe(false);
    expect(validateCpf("99999999999")).toBe(false);
  });

  it("rejects CPFs with invalid check digits", () => {
    expect(validateCpf("52998224726")).toBe(false);
    expect(validateCpf("09489505707")).toBe(false);
    expect(validateCpf("12345678901")).toBe(false);
  });

  it("normalizes CPF to digits only or null", () => {
    expect(normalizeCpf("529.982.247-25")).toBe("52998224725");
    expect(normalizeCpf("")).toBeNull();
    expect(normalizeCpf(null)).toBeNull();
    expect(normalizeCpf("   ")).toBeNull();
  });
});
