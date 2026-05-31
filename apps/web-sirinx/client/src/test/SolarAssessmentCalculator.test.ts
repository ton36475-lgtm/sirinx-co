import { describe, expect, it } from "vitest";
import { calculateIRR, calculateSolar, type CalcInput } from "../pages/SolarAssessment";

const baseInput: CalcInput = {
  businessType: "factory",
  monthlyBill: 200000,
  monthlyKwh: 0,
  inputMode: "bill",
  roofArea: 3000,
  roofType: "metal_sheet",
  orientation: "south",
  region: "central",
  desiredKwp: 0,
  wantBess: false,
  bessMode: "hybrid",
  backupHours: 4,
  nightCoverage: 50,
  tiltAngle: 15,
  shading: 5,
  gridExportAllowed: false,
};

function collectNumbers(value: unknown, path = "result"): Array<[string, number]> {
  if (typeof value === "number") return [[path, value]];
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectNumbers(item, `${path}[${index}]`));
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
    collectNumbers(item, `${path}.${key}`),
  );
}

function expectFiniteNumbers(value: unknown) {
  const invalid = collectNumbers(value).filter(([, number]) => !Number.isFinite(number));
  expect(invalid).toEqual([]);
}

describe("SolarAssessment calculator", () => {
  it("calculates a normal factory solar sizing scenario", () => {
    const result = calculateSolar(baseInput);

    expect(result.actualKwp).toBeGreaterThan(0);
    expect(result.numberOfPanels).toBeGreaterThan(0);
    expect(result.annualProduction).toBeGreaterThan(0);
    expect(result.monthlySavings).toBeGreaterThan(0);
    expect(result.simplePayback).toBeGreaterThan(0);
    expect(result.yearlyProjection).toHaveLength(25);
    expect(result.sizeVerdict).toBe("optimal");
    expectFiniteNumbers(result);
  });

  it("handles BESS sizing without producing invalid financial values", () => {
    const result = calculateSolar({
      ...baseInput,
      businessType: "hotel",
      monthlyBill: 350000,
      roofArea: 5000,
      wantBess: true,
      bessMode: "hybrid",
      backupHours: 4,
      nightCoverage: 60,
    });

    expect(result.bessCapacityKwh).toBeGreaterThan(0);
    expect(result.bessCost).toBeGreaterThan(0);
    expect(result.totalCost).toBeGreaterThan(result.systemCost);
    expect(result.totalAnnualSavings).toBeGreaterThan(result.annualSavings);
    expectFiniteNumbers(result);
  });

  it("keeps edge-case tiny roof results finite and roof-limited", () => {
    const result = calculateSolar({
      ...baseInput,
      roofArea: 0.1,
      desiredKwp: 50,
    });

    expect(result.actualKwp).toBe(0);
    expect(result.numberOfPanels).toBe(0);
    expect(result.annualProduction).toBe(0);
    expect(result.simplePayback).toBe(0);
    expect(result.lcoe).toBe(0);
    expect(result.irr).toBe(0);
    expect(result.sizeVerdict).toBe("roof_limited");
    expect(result.warnings.some((warning) => warning.includes("Solar PV"))).toBe(true);
    expectFiniteNumbers(result);
  });

  it("returns a finite positive IRR for a simple profitable cash flow", () => {
    expect(calculateIRR([-1000, 600, 600])).toBeGreaterThan(0);
    expect(Number.isFinite(calculateIRR([-1000, 600, 600]))).toBe(true);
  });
});
