const MONEY_PATTERN = /^(0|[1-9]\d{0,15})(?:\.(\d{1,2}))?$/;

export const toMinorUnits = (amount: string): bigint => {
  const match = MONEY_PATTERN.exec(amount);
  if (!match) {
    throw new Error(`Invalid money amount: ${amount}`);
  }

  const [, whole, fraction = ""] = match;
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
};

export const fromMinorUnits = (amount: bigint): string => {
  if (amount < 0n) {
    throw new Error("Money amount cannot be negative");
  }

  const whole = amount / 100n;
  const fraction = (amount % 100n).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
};

export const normalizeMoney = (amount: string): string =>
  fromMinorUnits(toMinorUnits(amount));
