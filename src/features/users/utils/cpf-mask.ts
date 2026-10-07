const CPF_LENGTH = 11;
const MASKED_CPF_PREFIX = "***.***.***-";
const MASKED_CPF_FALLBACK = `${MASKED_CPF_PREFIX}**`;

export const cpfDigits = (value: string): string => value.replace(/\D/g, "");

export const formatCpf = (value: string): string | null => {
  const digits = cpfDigits(value);
  if (digits.length !== CPF_LENGTH) {
    return null;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const maskCpf = (value: string | undefined): string | null => {
  const digits = cpfDigits(value ?? "");
  if (digits.length === 0) {
    return null;
  }
  if (digits.length < 2) {
    return MASKED_CPF_FALLBACK;
  }
  return `${MASKED_CPF_PREFIX}${digits.slice(-2)}`;
};
