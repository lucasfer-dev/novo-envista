export function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return [
      digits.slice(0, 3),
      digits.length > 3 ? "." + digits.slice(3, 6) : "",
      digits.length > 6 ? "." + digits.slice(6, 9) : "",
      digits.length > 9 ? "-" + digits.slice(9, 11) : "",
    ].join("");
  }
  return [
    digits.slice(0, 2),
    "." + digits.slice(2, 5),
    "." + digits.slice(5, 8),
    "/" + digits.slice(8, 12),
    digits.length > 12 ? "-" + digits.slice(12, 14) : "",
  ].join("");
}

export function caretAfterDigits(formattedValue: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < formattedValue.length; index += 1) {
    if (/\d/.test(formattedValue[index])) seen += 1;
    if (seen === digitCount) return index + 1;
  }
  return formattedValue.length;
}
