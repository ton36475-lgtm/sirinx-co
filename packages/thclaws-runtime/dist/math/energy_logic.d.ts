export declare const OPAL_SOLAR_PRICE_PER_UNIT = 4.5;
/**
 * Calculates the optimal fraction of capital to bet using the Kelly Criterion.
 * Formula: f* = (bp - q) / b
 * Where:
 * b = net odds received (e.g., if you bet $1 and win $2, b=2)
 * p = probability of winning
 * q = probability of losing (1 - p)
 */
export declare function calculateKellyCriterion(b: number, p: number): number;
//# sourceMappingURL=energy_logic.d.ts.map