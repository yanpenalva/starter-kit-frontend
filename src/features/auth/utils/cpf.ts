/**
 * Validates a Brazilian CPF according to official RFB check digit algorithm.
 * Identical rules as backend App\Rules\Cpf:
 * - Empty / null / undefined is considered valid (CPF is optional).
 * - Must have exactly 11 numeric digits.
 * - Cannot have all 11 digits identical.
 * - Check digits must match.
 */
export function validateCpf(value: string | null | undefined): boolean {
  if (value === null || value === undefined || value.trim() === "") {
    return true;
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  if (!hasValidCheckDigit(digits, 9, 10)) {
    return false;
  }

  if (!hasValidCheckDigit(digits, 10, 11)) {
    return false;
  }

  return true;
}

function hasValidCheckDigit(
  digits: string,
  length: number,
  weightStart: number,
): boolean {
  let sum = 0;
  for (let index = 0; index < length; index += 1) {
    sum += Number.parseInt(digits.charAt(index), 10) * (weightStart - index);
  }

  const remainder = sum % 11;
  const expected = remainder < 2 ? 0 : 11 - remainder;

  return expected === Number.parseInt(digits.charAt(length), 10);
}

/**
 * Normalizes a CPF to digits only or null if empty.
 */
export function normalizeCpf(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits === "" ? null : digits;
}
