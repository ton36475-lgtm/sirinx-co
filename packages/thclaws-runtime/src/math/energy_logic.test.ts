import { describe, it, expect } from 'vitest';
import { calculateKellyCriterion, OPAL_SOLAR_PRICE_PER_UNIT } from './energy_logic.js';

describe('thClaws Energy Logic Tests', () => {
  it('should export the standard Opal energy unit price constant', () => {
    expect(OPAL_SOLAR_PRICE_PER_UNIT).toBe(4.5);
  });

  it('should calculate the correct optimal fraction using the Kelly Criterion', () => {
    // b = 2.0, p = 0.65, q = 0.35
    // f* = (2.0 * 0.65 - 0.35) / 2.0 = (1.30 - 0.35) / 2.0 = 0.95 / 2.0 = 0.475 (47.5%)
    const fraction = calculateKellyCriterion(2.0, 0.65);
    expect(fraction).toBeCloseTo(0.475, 4);
  });

  it('should return 0 if the Kelly fraction resolves to a negative value', () => {
    // If the edge is negative (odds * prob < q), the bet should be 0 (no bet)
    // b = 1.0, p = 0.30, q = 0.70
    // f* = (1.0 * 0.30 - 0.70) / 1.0 = -0.40 -> should bound to 0
    const fraction = calculateKellyCriterion(1.0, 0.3);
    expect(fraction).toBe(0);
  });

  it('should throw an error for invalid odds (b <= 0)', () => {
    expect(() => calculateKellyCriterion(0, 0.5)).toThrow('Net odds (b) must be greater than 0.');
    expect(() => calculateKellyCriterion(-1.5, 0.5)).toThrow('Net odds (b) must be greater than 0.');
  });

  it('should throw an error for invalid probability ranges (p < 0 or p > 1)', () => {
    expect(() => calculateKellyCriterion(2.0, -0.1)).toThrow('Probability of winning (p) must be between 0 and 1.');
    expect(() => calculateKellyCriterion(2.0, 1.05)).toThrow('Probability of winning (p) must be between 0 and 1.');
  });
});
