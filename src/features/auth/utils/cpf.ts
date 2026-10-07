export const validateCpf = (value: string | null | undefined): boolean => {
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
};
const hasValidCheckDigit = (
  digits: string,
  length: number,
  weightStart: number,
): boolean => {
  let sum = 0;
  for (let index = 0; index < length; index += 1) {
    sum += Number.parseInt(digits.charAt(index), 10) * (weightStart - index);
  }
  const remainder = sum % 11;
  const expected = remainder < 2 ? 0 : 11 - remainder;
  return expected === Number.parseInt(digits.charAt(length), 10);
};
export const normalizeCpf = (
  value: string | null | undefined,
): string | null => {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits === "" ? null : digits;
};
