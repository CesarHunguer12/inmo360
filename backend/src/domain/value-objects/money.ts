export class Money {
  private constructor(private readonly cents: bigint) {}

  static fromDecimal(value: string): Money {
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);
    if (!match) throw new RangeError('Money value must be a non-negative decimal with at most two fraction digits.');
    const fraction = (match[2] ?? '').padEnd(2, '0');
    return new Money(BigInt(match[1]) * 100n + BigInt(fraction || '0'));
  }

  static commission(amount: string, ratePercent: string): Money {
    const base = Money.fromDecimal(amount).cents;
    const rateMatch = /^(100(?:\.0{1,2})?|(?:\d{1,2})(?:\.\d{1,2})?)$/.exec(ratePercent);
    if (!rateMatch) throw new RangeError('Commission rate must be between 0 and 100 percent.');
    const [whole = '0', fraction = ''] = ratePercent.split('.');
    const basisPoints = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0') || '0');
    const roundedCents = (base * basisPoints + 5000n) / 10000n;
    return new Money(roundedCents);
  }

  toDecimalString(): string {
    const whole = this.cents / 100n;
    const fraction = (this.cents % 100n).toString().padStart(2, '0');
    return `${whole}.${fraction}`;
  }
}
