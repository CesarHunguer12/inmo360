import { Money } from './money';

describe('Money', () => {
  it('calculates a configured commission to two decimal places', () => {
    expect(Money.commission('125000.00', '5.00').toDecimalString()).toBe('6250.00');
    expect(Money.commission('0.05', '50.00').toDecimalString()).toBe('0.03');
  });

  it('rejects invalid monetary values and rates', () => {
    expect(() => Money.fromDecimal('-1.00')).toThrow(RangeError);
    expect(() => Money.commission('100.00', '100.01')).toThrow(RangeError);
  });
});
