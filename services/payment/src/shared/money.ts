const MONEY_PATTERN = /^(0|[1-9]\d{0,15})(?:\.(\d{1,2}))?$/;

export const normalizeMoney = (amount: string): string => {
  const match = MONEY_PATTERN.exec(amount);
  if (!match) throw new Error(`Invalid money amount: ${amount}`);
  const [, whole, fraction = ""] = match;
  return `${whole}.${fraction.padEnd(2, "0")}`;
};
