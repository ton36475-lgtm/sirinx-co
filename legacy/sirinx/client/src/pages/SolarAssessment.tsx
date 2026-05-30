import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useMemo, useCallback } from "react";
import { Link } from "wouter";
import {
  ArrowRight, ArrowLeft, Zap, Calculator, CheckCircle2, AlertTriangle,
  Sun, Battery, BarChart3, Building2, Factory, Hotel, GraduationCap,
  Warehouse, Landmark, Leaf, TrendingDown, TrendingUp, Info, RotateCcw,
  ChevronDown, ChevronUp, MapPin, Ruler, Thermometer, Clock, DollarSign,
  Shield, BatteryCharging, Gauge, Lightbulb, Download, Phone, FileText,
  RefreshCw, Eye, Layers, Target, PieChart, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { usePageTranslation } from "@/i18n";
import { cfImage, cfImageSrcSet } from "@/lib/cfImage";
import "../i18n/pages/solarAssessment";

/* ================================================================
   SIRINX Solar + BESS Engineering Calculator v3.0
   ================================================================
   - Advanced engineering-grade sizing with Thailand-specific data
   - 25-year cash flow projection with degradation model
   - BESS sizing for night coverage, backup, and peak shaving
   - Production profile visualization (hourly & monthly)
   - Real-time validation and feasibility checks
   - CTA integration with Contact form (prefill from results)
   ================================================================ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const slideIn = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.3 } },
};

// ── Thailand Solar Engineering Constants ──────────────────────────
const REGIONS: Record<string, { name: string; psh: number; ghi: number; tempCoeff: number }> = {
  central: { name: "ภาคกลาง (กรุงเทพฯ, ปริมณฑล)", psh: 4.3, ghi: 1750, tempCoeff: -0.004 },
  east: { name: "ภาคตะวันออก (ชลบุรี, ระยอง)", psh: 4.5, ghi: 1800, tempCoeff: -0.004 },
  northeast: { name: "ภาคตะวันออกเฉียงเหนือ (อีสาน)", psh: 4.8, ghi: 1900, tempCoeff: -0.0038 },
  north: { name: "ภาคเหนือ (เชียงใหม่, ลำปาง)", psh: 4.6, ghi: 1850, tempCoeff: -0.0035 },
  west: { name: "ภาคตะวันตก (กาญจนบุรี, ราชบุรี)", psh: 4.5, ghi: 1800, tempCoeff: -0.004 },
  south: { name: "ภาคใต้ (สุราษฎร์ฯ, ภูเก็ต)", psh: 4.2, ghi: 1700, tempCoeff: -0.0042 },
};

const ROOF_TYPES: Record<string, { name: string; usableRatio: number; loadCapacity: string; suitability: string; weightPerPanel: number }> = {
  metal_sheet: { name: "เมทัลชีท", usableRatio: 0.70, loadCapacity: "15-20 kg/m²", suitability: "เหมาะมาก", weightPerPanel: 12 },
  concrete: { name: "คอนกรีต (ดาดฟ้า)", usableRatio: 0.65, loadCapacity: "30-50 kg/m²", suitability: "เหมาะมาก", weightPerPanel: 15 },
  tile: { name: "กระเบื้อง", usableRatio: 0.55, loadCapacity: "10-15 kg/m²", suitability: "เหมาะปานกลาง", weightPerPanel: 12 },
  corrugated: { name: "สังกะสี/ลอนคู่", usableRatio: 0.60, loadCapacity: "10-15 kg/m²", suitability: "ต้องตรวจสอบ", weightPerPanel: 12 },
};

const ORIENTATIONS: Record<string, { name: string; factor: number; note: string }> = {
  south: { name: "ทิศใต้", factor: 1.0, note: "ดีที่สุด — รับแสงเต็มที่ตลอดวัน" },
  southeast: { name: "ทิศตะวันออกเฉียงใต้", factor: 0.95, note: "ดีมาก — รับแสงเช้าได้ดี" },
  southwest: { name: "ทิศตะวันตกเฉียงใต้", factor: 0.95, note: "ดีมาก — รับแสงบ่ายได้ดี" },
  east: { name: "ทิศตะวันออก", factor: 0.88, note: "ดี — เน้นผลิตช่วงเช้า" },
  west: { name: "ทิศตะวันตก", factor: 0.88, note: "ดี — เน้นผลิตช่วงบ่าย" },
  north: { name: "ทิศเหนือ", factor: 0.75, note: "ไม่แนะนำ — ผลผลิตต่ำ" },
  flat: { name: "หลังคาแบน (0°)", factor: 0.92, note: "ดี — ติดตั้งบนขาตั้งปรับมุม" },
};

interface BusinessProfile {
  nameKey: string;
  icon: React.ReactNode;
  daytimeRatio: number;
  avgRate: number;
  peakRate: number;
  offPeakRate: number;
  costPerKwp: number;
  typicalBill: string;
  operatingHoursKey: string;
  peakDemandHours: string;
  nightUsageRatio: number;
  demandCharge: number; // THB/kW
  monthlyHourlyProfile: number[]; // 24-hour normalized load profile
}

// Hourly profiles (normalized, sum = 1.0 over 24 hours)
const FACTORY_PROFILE = [0.02,0.02,0.02,0.02,0.02,0.03,0.05,0.06,0.07,0.07,0.07,0.06,0.06,0.07,0.07,0.07,0.06,0.05,0.04,0.03,0.02,0.02,0.02,0.02];
const OFFICE_PROFILE = [0.01,0.01,0.01,0.01,0.01,0.01,0.02,0.05,0.08,0.09,0.09,0.09,0.08,0.09,0.09,0.09,0.08,0.05,0.02,0.01,0.01,0.01,0.01,0.01];
const HOTEL_PROFILE = [0.03,0.03,0.02,0.02,0.02,0.03,0.04,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.04,0.04,0.03];

// Solar production profile (normalized, Thailand typical)
const SOLAR_HOURLY_PROFILE = [0,0,0,0,0,0,0.02,0.06,0.10,0.14,0.16,0.17,0.16,0.14,0.10,0.06,0.02,0,0,0,0,0,0,0];

const BUSINESS_TYPES: Record<string, BusinessProfile> = {
  factory: {
    nameKey: "sa.biz.factory",
    icon: <Factory className="w-5 h-5" />,
    daytimeRatio: 0.70, avgRate: 4.2, peakRate: 5.3, offPeakRate: 2.6,
    costPerKwp: 28000, typicalBill: "200,000 - 5,000,000+",
    operatingHoursKey: "sa.biz.hours.8_24", peakDemandHours: "09:00-22:00",
    nightUsageRatio: 0.30, demandCharge: 132.93,
    monthlyHourlyProfile: FACTORY_PROFILE,
  },
  commercial: {
    nameKey: "sa.biz.commercial",
    icon: <Building2 className="w-5 h-5" />,
    daytimeRatio: 0.65, avgRate: 4.5, peakRate: 5.5, offPeakRate: 2.8,
    costPerKwp: 30000, typicalBill: "50,000 - 500,000",
    operatingHoursKey: "sa.biz.hours.8_12", peakDemandHours: "08:00-18:00",
    nightUsageRatio: 0.15, demandCharge: 210.00,
    monthlyHourlyProfile: OFFICE_PROFILE,
  },
  warehouse: {
    nameKey: "sa.biz.warehouse",
    icon: <Warehouse className="w-5 h-5" />,
    daytimeRatio: 0.60, avgRate: 4.3, peakRate: 5.2, offPeakRate: 2.7,
    costPerKwp: 28000, typicalBill: "100,000 - 2,000,000",
    operatingHoursKey: "sa.biz.hours.10_18", peakDemandHours: "10:00-21:00",
    nightUsageRatio: 0.25, demandCharge: 132.93,
    monthlyHourlyProfile: FACTORY_PROFILE,
  },
  hotel: {
    nameKey: "sa.biz.hotel",
    icon: <Hotel className="w-5 h-5" />,
    daytimeRatio: 0.50, avgRate: 4.3, peakRate: 5.3, offPeakRate: 2.7,
    costPerKwp: 32000, typicalBill: "100,000 - 1,000,000",
    operatingHoursKey: "sa.biz.hours.24", peakDemandHours: "06:00-23:00",
    nightUsageRatio: 0.40, demandCharge: 210.00,
    monthlyHourlyProfile: HOTEL_PROFILE,
  },
  education: {
    nameKey: "sa.biz.education",
    icon: <GraduationCap className="w-5 h-5" />,
    daytimeRatio: 0.75, avgRate: 4.0, peakRate: 5.0, offPeakRate: 2.5,
    costPerKwp: 30000, typicalBill: "30,000 - 300,000",
    operatingHoursKey: "sa.biz.hours.8_10", peakDemandHours: "07:00-17:00",
    nightUsageRatio: 0.10, demandCharge: 132.93,
    monthlyHourlyProfile: OFFICE_PROFILE,
  },
  agriculture: {
    nameKey: "sa.biz.agriculture",
    icon: <Leaf className="w-5 h-5" />,
    daytimeRatio: 0.80, avgRate: 3.8, peakRate: 4.8, offPeakRate: 2.4,
    costPerKwp: 28000, typicalBill: "20,000 - 200,000",
    operatingHoursKey: "sa.biz.hours.8_14", peakDemandHours: "06:00-18:00",
    nightUsageRatio: 0.15, demandCharge: 0,
    monthlyHourlyProfile: FACTORY_PROFILE,
  },
  government: {
    nameKey: "sa.biz.government",
    icon: <Landmark className="w-5 h-5" />,
    daytimeRatio: 0.70, avgRate: 4.0, peakRate: 5.0, offPeakRate: 2.5,
    costPerKwp: 30000, typicalBill: "50,000 - 500,000",
    operatingHoursKey: "sa.biz.hours.8_10", peakDemandHours: "08:00-17:00",
    nightUsageRatio: 0.10, demandCharge: 132.93,
    monthlyHourlyProfile: OFFICE_PROFILE,
  },
};

// ── BESS Constants ──────────────────────────
const BESS_COST_PER_KWH = 12000; // THB per kWh (LFP battery 2025-2026)
const BESS_ROUND_TRIP_EFF = 0.92;
const BESS_DOD = 0.90;
const BESS_CYCLE_LIFE = 6000;
const BESS_DEGRADATION_YEAR = 0.025;

// ── Panel Constants ──────────────────────────
const PANEL_WATT = 580;
const PANEL_EFFICIENCY = 0.215;
const AREA_PER_KWP = 4.8;
const PERFORMANCE_RATIO = 0.82;
const YEAR1_DEGRADATION = 0.02;
const ANNUAL_DEGRADATION = 0.005;
const SYSTEM_LIFETIME = 25;
const INVERTER_REPLACEMENT_YEAR = 12;
const INVERTER_COST_RATIO = 0.15;
const MAINTENANCE_COST_PER_KWP = 500; // THB/kWp/year
const INSURANCE_RATE = 0.003; // 0.3% of system cost/year
const ELECTRICITY_ESCALATION = 0.03; // 3% annual increase

// ── Monthly Solar Production Factors (Thailand) ──
const MONTHLY_PRODUCTION_FACTORS = [0.95, 1.00, 1.05, 1.08, 0.98, 0.90, 0.88, 0.85, 0.88, 0.95, 1.00, 0.98];
const MONTH_NAMES = ["sa.month.jan", "sa.month.feb", "sa.month.mar", "sa.month.apr", "sa.month.may", "sa.month.jun", "sa.month.jul", "sa.month.aug", "sa.month.sep", "sa.month.oct", "sa.month.nov", "sa.month.dec"];

// ── Calculation Engine ──────────────────────────
export interface CalcInput {
  businessType: string;
  monthlyBill: number;
  monthlyKwh: number; // optional direct kWh input
  inputMode: "bill" | "kwh";
  roofArea: number;
  roofType: string;
  orientation: string;
  region: string;
  desiredKwp: number;
  wantBess: boolean;
  bessMode: "night" | "backup" | "peak_shaving" | "hybrid";
  backupHours: number;
  nightCoverage: number;
  tiltAngle: number;
  shading: number; // 0-30% shading loss
  gridExportAllowed: boolean;
}

interface YearlyProjection {
  year: number;
  production: number;
  savings: number;
  cumulativeSavings: number;
  netCashFlow: number;
  cumulativeNetCashFlow: number;
  maintenanceCost: number;
  electricityRate: number;
}

export interface SolarResult {
  monthlyConsumption: number;
  annualConsumption: number;
  daytimeConsumption: number;
  recommendedKwp: number;
  maxKwpFromRoof: number;
  actualKwp: number;
  numberOfPanels: number;
  requiredRoofArea: number;
  usableRoofArea: number;
  totalWeight: number;
  annualProduction: number;
  monthlyProduction: number;
  dailyProduction: number;
  selfConsumptionRatio: number;
  specificYield: number; // kWh/kWp/year
  capacityFactor: number; // %
  monthlyProductionProfile: number[];
  hourlyProductionProfile: number[];
  hourlyConsumptionProfile: number[];
  systemCost: number;
  annualSavings: number;
  monthlySavings: number;
  simplePayback: number;
  roi25Year: number;
  lifetimeSavings: number;
  co2Reduction: number;
  treesEquivalent: number;
  lcoe: number; // THB/kWh
  irr: number; // Internal Rate of Return %
  yearlyProjection: YearlyProjection[];
  bessCapacityKwh: number;
  bessCapacityKw: number;
  bessCost: number;
  bessAnnualSavings: number;
  bessPayback: number;
  bessDemandSavings: number;
  totalCost: number;
  totalAnnualSavings: number;
  totalPayback: number;
  totalRoi25Year: number;
  warnings: string[];
  recommendations: string[];
  sizeVerdict: "optimal" | "undersized" | "oversized" | "roof_limited" | "unreasonable";
}

export function calculateSolar(input: CalcInput): SolarResult {
  const biz = BUSINESS_TYPES[input.businessType] || BUSINESS_TYPES.factory;
  const region = REGIONS[input.region] || REGIONS.central;
  const roof = ROOF_TYPES[input.roofType] || ROOF_TYPES.metal_sheet;
  const orient = ORIENTATIONS[input.orientation] || ORIENTATIONS.south;

  // ── Step 1: Consumption Analysis ──
  const monthlyConsumption = input.inputMode === "kwh" && input.monthlyKwh > 0
    ? input.monthlyKwh
    : input.monthlyBill / biz.avgRate;
  const annualConsumption = monthlyConsumption * 12;
  const daytimeConsumption = annualConsumption * biz.daytimeRatio;
  const nightConsumption = annualConsumption * biz.nightUsageRatio;

  // ── Step 2: Recommended Solar Size ──
  const tiltFactor = input.tiltAngle >= 10 && input.tiltAngle <= 20 ? 1.0 :
    input.tiltAngle < 10 ? 0.95 : input.tiltAngle <= 30 ? 0.98 : 0.93;
  const shadingFactor = 1 - (input.shading / 100);
  const effectivePSH = region.psh * orient.factor * tiltFactor * shadingFactor;
  const recommendedKwp = Math.round(daytimeConsumption / (effectivePSH * 365 * PERFORMANCE_RATIO) * 10) / 10;

  // ── Step 3: Roof Capacity ──
  const usableRoofArea = input.roofArea * roof.usableRatio;
  const maxKwpFromRoof = Math.round(usableRoofArea / AREA_PER_KWP * 10) / 10;

  // ── Step 4: Actual Size ──
  const desiredKwp = input.desiredKwp > 0 ? input.desiredKwp : recommendedKwp;
  const actualKwp = Math.min(desiredKwp, maxKwpFromRoof);
  const hasInstallableCapacity = actualKwp > 0;
  const numberOfPanels = hasInstallableCapacity ? Math.ceil(actualKwp * 1000 / PANEL_WATT) : 0;
  const requiredRoofArea = Math.round(actualKwp * AREA_PER_KWP);
  const totalWeight = numberOfPanels * roof.weightPerPanel;

  // ── Step 5: Production Estimate ──
  const annualProductionYear1 = hasInstallableCapacity ? actualKwp * effectivePSH * 365 * PERFORMANCE_RATIO : 0;
  const annualProduction = annualProductionYear1 * (1 - YEAR1_DEGRADATION);
  const monthlyProduction = annualProduction / 12;
  const dailyProduction = annualProduction / 365;
  const specificYield = hasInstallableCapacity ? Math.round(annualProduction / actualKwp) : 0;
  const capacityFactor = hasInstallableCapacity ? Math.round(annualProduction / (actualKwp * 8760) * 1000) / 10 : 0;

  // Monthly production profile
  const avgMonthlyProd = annualProduction / 12;
  const monthlyProductionProfile = MONTHLY_PRODUCTION_FACTORS.map(f => Math.round(avgMonthlyProd * f));

  // Hourly profiles (daily average kWh per hour)
  const dailyProd = annualProduction / 365;
  const dailyCons = annualConsumption / 365;
  const hourlyProductionProfile = SOLAR_HOURLY_PROFILE.map(f => Math.round(dailyProd * f * 10) / 10);
  const hourlyConsumptionProfile = biz.monthlyHourlyProfile.map(f => Math.round(dailyCons * f * 10) / 10);

  // Self-consumption ratio
  const solarVsDaytime = annualProduction / daytimeConsumption;
  const selfConsumptionRatio = input.gridExportAllowed
    ? (solarVsDaytime <= 1 ? 0.85 : solarVsDaytime <= 1.3 ? 0.75 : 0.60)
    : (solarVsDaytime <= 1 ? 0.92 + solarVsDaytime * 0.03 : solarVsDaytime <= 1.3 ? 0.85 : solarVsDaytime <= 1.5 ? 0.75 : 0.65);

  // ── Step 6: Financial — Solar Only ──
  const systemCost = actualKwp * biz.costPerKwp;
  const effectiveSavingsRate = biz.avgRate * 0.85 + biz.peakRate * 0.15;
  const annualSavings = annualProduction * selfConsumptionRatio * effectiveSavingsRate;
  const monthlySavings = annualSavings / 12;
  const simplePayback = annualSavings > 0 ? systemCost / annualSavings : 0;

  // 25-year projection with degradation, maintenance, insurance, electricity escalation
  const yearlyProjection: YearlyProjection[] = [];
  let lifetimeSavings = 0;
  let yearProduction = annualProductionYear1;
  let cumulativeSavings = 0;
  let cumulativeNetCashFlow = -systemCost;

  for (let y = 1; y <= SYSTEM_LIFETIME; y++) {
    if (y === 1) yearProduction *= (1 - YEAR1_DEGRADATION);
    else yearProduction *= (1 - ANNUAL_DEGRADATION);

    const escRate = effectiveSavingsRate * Math.pow(1 + ELECTRICITY_ESCALATION, y - 1);
    const yearSavings = yearProduction * selfConsumptionRatio * escRate;
    const maintenanceCost = actualKwp * MAINTENANCE_COST_PER_KWP + systemCost * INSURANCE_RATE;
    const inverterReplacement = y === INVERTER_REPLACEMENT_YEAR ? systemCost * INVERTER_COST_RATIO : 0;
    const netCashFlow = yearSavings - maintenanceCost - inverterReplacement;

    lifetimeSavings += yearSavings;
    cumulativeSavings += yearSavings;
    cumulativeNetCashFlow += netCashFlow;

    yearlyProjection.push({
      year: y,
      production: Math.round(yearProduction),
      savings: Math.round(yearSavings),
      cumulativeSavings: Math.round(cumulativeSavings),
      netCashFlow: Math.round(netCashFlow),
      cumulativeNetCashFlow: Math.round(cumulativeNetCashFlow),
      maintenanceCost: Math.round(maintenanceCost + inverterReplacement),
      electricityRate: Math.round(escRate * 100) / 100,
    });
  }

  const totalMaintenance = yearlyProjection.reduce((s, y) => s + y.maintenanceCost, 0);
  const roi25Year = systemCost > 0
    ? ((lifetimeSavings - systemCost - totalMaintenance) / systemCost) * 100
    : 0;

  // LCOE (Levelized Cost of Energy)
  const totalLifetimeProduction = yearlyProjection.reduce((s, y) => s + y.production, 0);
  const lcoe = totalLifetimeProduction > 0
    ? Math.round((systemCost + totalMaintenance) / totalLifetimeProduction * 100) / 100
    : 0;

  // Simplified IRR calculation
  const cashFlows = [-systemCost, ...yearlyProjection.map(y => y.netCashFlow)];
  const irr = systemCost > 0 ? calculateIRR(cashFlows) : 0;

  // CO2 reduction
  const co2Reduction = (annualProduction / 1000) * 0.4999;
  const treesEquivalent = Math.round(co2Reduction * 1000 / 21.77); // 21.77 kg CO2/tree/year

  // ── Step 7: BESS Calculation ──
  let bessCapacityKwh = 0;
  let bessCapacityKw = 0;
  let bessCost = 0;
  let bessAnnualSavings = 0;
  let bessPayback = 0;
  let bessDemandSavings = 0;

  if (input.wantBess) {
    const nightDailyKwh = (nightConsumption / 365) * (input.nightCoverage / 100);
    const avgHourlyLoad = monthlyConsumption / (30 * 24);
    const backupKwh = avgHourlyLoad * input.backupHours;
    const excessSolar = Math.max(0, dailyProduction - (daytimeConsumption / 365));

    let rawCapacity = 0;
    switch (input.bessMode) {
      case "night":
        rawCapacity = nightDailyKwh;
        break;
      case "backup":
        rawCapacity = backupKwh;
        break;
      case "peak_shaving":
        rawCapacity = excessSolar * 0.8;
        break;
      case "hybrid":
      default:
        rawCapacity = Math.max(nightDailyKwh, backupKwh, excessSolar * 0.8);
        break;
    }

    bessCapacityKwh = Math.round(rawCapacity / (BESS_DOD * BESS_ROUND_TRIP_EFF) * 10) / 10;
    bessCapacityKw = Math.round(bessCapacityKwh / Math.max(input.backupHours, 2) * 10) / 10;
    bessCost = Math.round(bessCapacityKwh * BESS_COST_PER_KWH);

    const nightSavings = nightDailyKwh * 365 * biz.offPeakRate * BESS_ROUND_TRIP_EFF;
    const peakShavingSavings = excessSolar * 0.7 * 365 * (biz.peakRate - biz.avgRate);
    bessDemandSavings = biz.demandCharge > 0 ? bessCapacityKw * biz.demandCharge * 12 * 0.5 : 0;
    bessAnnualSavings = nightSavings + peakShavingSavings + bessDemandSavings;
    bessPayback = bessCost > 0 && bessAnnualSavings > 0 ? bessCost / bessAnnualSavings : 0;
  }

  // ── Step 8: Combined ──
  const totalCost = systemCost + bessCost;
  const totalAnnualSavings = annualSavings + bessAnnualSavings;
  const totalPayback = totalAnnualSavings > 0 ? totalCost / totalAnnualSavings : 0;
  const totalRoi25Year = roi25Year + (bessAnnualSavings > 0 && bessCost > 0 ? ((bessAnnualSavings * 15 - bessCost) / bessCost) * 100 : 0);

  // ── Step 9: Validation ──
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let sizeVerdict: SolarResult["sizeVerdict"] = "optimal";

  if (maxKwpFromRoof <= 0 || !hasInstallableCapacity) {
    warnings.push("พื้นที่ติดตั้งน้อยเกินไปสำหรับระบบ Solar PV — กรุณาเพิ่มพื้นที่หลังคา/ลานจอด หรือให้ทีมวิศวกรสำรวจหน้างานจริง");
    sizeVerdict = "roof_limited";
  }
  if (input.desiredKwp > 0 && input.desiredKwp > maxKwpFromRoof) {
    warnings.push(`ขนาดที่ต้องการ (${input.desiredKwp} kWp) เกินกว่าพื้นที่หลังคารองรับได้ (สูงสุด ${maxKwpFromRoof} kWp) — ระบบปรับลดเป็น ${actualKwp} kWp`);
    sizeVerdict = "roof_limited";
  }
  if (input.desiredKwp > 0 && input.desiredKwp > recommendedKwp * 1.5) {
    warnings.push(`ขนาดที่ต้องการ (${input.desiredKwp} kWp) ใหญ่กว่าขนาดแนะนำ ${Math.round((input.desiredKwp / recommendedKwp - 1) * 100)}% — ผลิตไฟเกินความต้องการ อาจไม่คุ้มค่าหากไม่มี net metering`);
    if (sizeVerdict === "optimal") sizeVerdict = "oversized";
  }
  if (hasInstallableCapacity && input.desiredKwp > 0 && input.desiredKwp < recommendedKwp * 0.3) {
    warnings.push(`ขนาดที่ต้องการ (${input.desiredKwp} kWp) เล็กกว่าขนาดแนะนำมาก — ประหยัดค่าไฟได้น้อย อาจไม่คุ้มค่าการลงทุน`);
    sizeVerdict = "undersized";
  }
  if (simplePayback > 8) {
    warnings.push(`ระยะคืนทุน ${simplePayback.toFixed(1)} ปี ค่อนข้างนาน — ควรพิจารณาปรับขนาดหรือรูปแบบการลงทุน`);
  }
  if (orient.factor < 0.8) {
    warnings.push(`ทิศทางหลังคา (${orient.name}) ไม่เหมาะสม — ผลผลิตลดลง ${Math.round((1 - orient.factor) * 100)}%`);
  }
  if (totalWeight > 0 && input.roofType === "tile") {
    warnings.push(`น้ำหนักรวมระบบ ${totalWeight.toLocaleString()} kg — หลังคากระเบื้องต้องตรวจสอบโครงสร้างรับน้ำหนัก`);
  }
  if (input.shading > 15) {
    warnings.push(`เงาบัง ${input.shading}% — ส่งผลกระทบต่อผลผลิตอย่างมีนัยสำคัญ ควรพิจารณาตัดต้นไม้หรือปรับตำแหน่งติดตั้ง`);
  }
  if (input.desiredKwp > 0 && input.desiredKwp > recommendedKwp * 2) {
    sizeVerdict = "unreasonable";
  }

  // Recommendations
  if (hasInstallableCapacity && (sizeVerdict === "optimal" || sizeVerdict === "roof_limited")) {
    recommendations.push("ขนาดระบบเหมาะสมกับการใช้งาน — แนะนำให้ดำเนินการสำรวจหน้างานจริง");
  }
  if (!input.wantBess && biz.nightUsageRatio > 0.25) {
    recommendations.push("ธุรกิจของคุณใช้ไฟกลางคืนสูง — แนะนำพิจารณาเพิ่มระบบ BESS เพื่อเพิ่มการประหยัด");
  }
  if (actualKwp >= 100) {
    recommendations.push("ระบบขนาดใหญ่ (100+ kWp) — แนะนำพิจารณารูปแบบ PPA หรือ Co-investment เพื่อลดภาระเงินลงทุนเริ่มต้น");
  }
  if (lcoe < biz.avgRate * 0.5) {
    recommendations.push(`LCOE ${lcoe} บาท/kWh ต่ำกว่าค่าไฟปัจจุบัน ${Math.round((1 - lcoe / biz.avgRate) * 100)}% — การลงทุนคุ้มค่ามาก`);
  }
  if (irr > 15) {
    recommendations.push(`IRR ${irr}% สูงกว่าผลตอบแทนพันธบัตรรัฐบาล — เป็นการลงทุนที่น่าสนใจ`);
  }
  if (biz.demandCharge > 0 && !input.wantBess) {
    recommendations.push(`ธุรกิจของคุณมี demand charge ${biz.demandCharge} บาท/kW — BESS สามารถช่วยลด peak demand ได้`);
  }

  return {
    monthlyConsumption: Math.round(monthlyConsumption),
    annualConsumption: Math.round(annualConsumption),
    daytimeConsumption: Math.round(daytimeConsumption),
    recommendedKwp, maxKwpFromRoof, actualKwp, numberOfPanels,
    requiredRoofArea, usableRoofArea: Math.round(usableRoofArea), totalWeight,
    annualProduction: Math.round(annualProduction),
    monthlyProduction: Math.round(monthlyProduction),
    dailyProduction: Math.round(dailyProduction * 10) / 10,
    selfConsumptionRatio: Math.round(selfConsumptionRatio * 100),
    specificYield, capacityFactor,
    monthlyProductionProfile, hourlyProductionProfile, hourlyConsumptionProfile,
    systemCost: Math.round(systemCost),
    annualSavings: Math.round(annualSavings),
    monthlySavings: Math.round(monthlySavings),
    simplePayback: Math.round(simplePayback * 10) / 10,
    roi25Year: Math.round(roi25Year),
    lifetimeSavings: Math.round(lifetimeSavings),
    co2Reduction: Math.round(co2Reduction * 10) / 10,
    treesEquivalent,
    lcoe, irr,
    yearlyProjection,
    bessCapacityKwh, bessCapacityKw, bessCost,
    bessAnnualSavings: Math.round(bessAnnualSavings),
    bessPayback: Math.round(bessPayback * 10) / 10,
    bessDemandSavings: Math.round(bessDemandSavings),
    totalCost: Math.round(totalCost),
    totalAnnualSavings: Math.round(totalAnnualSavings),
    totalPayback: Math.round(totalPayback * 10) / 10,
    totalRoi25Year: Math.round(totalRoi25Year),
    warnings, recommendations, sizeVerdict,
  };
}

// Simple IRR calculation using Newton's method
export function calculateIRR(cashFlows: number[]): number {
  let rate = 0.1;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0;
    let dnpv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + rate, i);
      dnpv -= i * cashFlows[i] / Math.pow(1 + rate, i + 1);
    }
    if (Math.abs(dnpv) < 1e-10) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-6) break;
    rate = newRate;
  }
  return Math.round(rate * 1000) / 10;
}

// ── Site Photos — real installation + realistic project images ──
const SITE_PHOTOS = [
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/carport-wide-1_30e3af4c.jpeg",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/carport-structure-1_c0c17293.jpeg",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/floating-solar-reservoir-BHro9zmCAKLtycFVXgfe9G.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/resort-rooftop-solar-Q4vG7VqDnaYmRWdsyKtp7H.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/warehouse-rooftop-solar-eGvaQedufCt28G4VBAahMs.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/farm-solar-bess-VwUa48BekdDzTkGLwkeJJX.webp",
];

// ── Steps ──
const STEPS = [
  { label: "ประเภทธุรกิจ", icon: Building2 },
  { label: "ข้อมูลพลังงาน", icon: Zap },
  { label: "พื้นที่ & ทำเล", icon: MapPin },
  { label: "ขนาดระบบ", icon: Ruler },
  { label: "แบตเตอรี่ (BESS)", icon: Battery },
  { label: "ผลวิเคราะห์", icon: BarChart3 },
];

// ── Helper Components ──
function InputField({ label, unit, value, onChange, placeholder, helpText, type = "number", min, max, step }: {
  label: string; unit?: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; helpText?: string; type?: string; min?: number; max?: number; step?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          min={min} max={max} step={step}
          className="w-full px-4 py-3 rounded-lg border border-border-subtle bg-background text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors"
          placeholder={placeholder}
        />
        {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">{unit}</span>}
      </div>
      {helpText && <p className="text-xs text-text-muted mt-1">{helpText}</p>}
    </div>
  );
}

function MetricCard({ label, value, unit, icon: Icon, accent, subtext }: {
  label: string; value: string | number; unit?: string; icon?: React.ElementType; accent?: boolean; subtext?: string;
}) {
  return (
    <div className={`p-4 rounded-xl border transition-colors ${accent ? "border-accent-primary/40 bg-accent-glow" : "border-border-subtle bg-surface-elevated"}`}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={`w-4 h-4 ${accent ? "text-accent-primary" : "text-text-muted"}`} />}
        <span className="text-xs text-text-muted">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-display text-2xl font-bold ${accent ? "text-accent-primary" : "text-foreground"}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm text-text-muted">{unit}</span>}
      </div>
      {subtext && <p className="text-xs text-text-muted mt-1">{subtext}</p>}
    </div>
  );
}

function WarningBox({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="p-4 rounded-xl border border-accent-secondary/30 bg-accent-secondary/10">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-accent-secondary" />
        <span className="font-display font-semibold text-foreground text-sm">คำเตือน</span>
      </div>
      <ul className="space-y-1.5">
        {warnings.map((w, i) => (
          <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
            <span className="text-accent-secondary mt-0.5 shrink-0">•</span>
            <span>{w}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Simple bar chart component
function MiniBarChart({ data, labels, maxVal, color = "accent-primary", height = 120 }: {
  data: number[]; labels: string[]; maxVal?: number; color?: string; height?: number;
}) {
  const max = Math.max(maxVal ?? Math.max(...data), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full rounded-t-sm bg-${color} transition-all`}
            style={{
              height: `${Math.max((v / max) * 100, 2)}%`,
              backgroundColor: `var(--${color})`,
              opacity: 0.8,
            }}
          />
          <span className="text-[9px] text-text-muted leading-none">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

// Hourly overlay chart (solar vs consumption)
function HourlyOverlayChart({ solar, consumption }: { solar: number[]; consumption: number[] }) {
  const max = Math.max(...solar, ...consumption, 1) * 1.1;
  return (
    <div className="relative">
      <div className="flex items-end gap-0.5" style={{ height: 140 }}>
        {solar.map((s, i) => {
          const c = consumption[i] || 0;
          const sH = (s / max) * 100;
          const cH = (c / max) * 100;
          return (
            <div key={i} className="flex-1 relative" style={{ height: "100%" }}>
              {/* Consumption bar (behind) */}
              <div className="absolute bottom-0 left-0 right-0 rounded-t-sm opacity-30"
                style={{ height: `${cH}%`, backgroundColor: "var(--foreground)" }} />
              {/* Solar bar (front) */}
              <div className="absolute bottom-0 left-[15%] right-[15%] rounded-t-sm"
                style={{ height: `${sH}%`, backgroundColor: "var(--accent-primary)", opacity: 0.85 }} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-0.5 mt-1">
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[8px] text-text-muted">{i % 3 === 0 ? `${i}` : ""}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: "var(--accent-primary)", opacity: 0.85 }} />
          <span className="text-text-muted">ผลิตไฟ (Solar)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm opacity-30" style={{ backgroundColor: "var(--foreground)" }} />
          <span className="text-text-muted">ใช้ไฟ (Load)</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function SolarAssessment() {
  const { t } = usePageTranslation("solarAssessment");
  const [step, setStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showProjection, setShowProjection] = useState(false);
  const [showHourly, setShowHourly] = useState(false);
  const [resultTab, setResultTab] = useState<"overview" | "financial" | "technical" | "projection">("overview");
  const [input, setInput] = useState<CalcInput>({
    businessType: "",
    monthlyBill: 0,
    monthlyKwh: 0,
    inputMode: "bill",
    roofArea: 0,
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
  });

  const updateInput = useCallback((key: keyof CalcInput, value: string | number | boolean) => {
    setInput(prev => ({ ...prev, [key]: value }));
  }, []);

  const result = useMemo(() => {
    if (step < 5 || !input.businessType || (input.inputMode === "bill" ? input.monthlyBill <= 0 : input.monthlyKwh <= 0)) return null;
    return calculateSolar(input);
  }, [step, input]);

  const canProceed = useMemo(() => {
    switch (step) {
      case 0: return !!input.businessType;
      case 1: return input.inputMode === "bill" ? input.monthlyBill > 0 : input.monthlyKwh > 0;
      case 2: return input.roofArea > 0 && !!input.region;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  }, [step, input]);

  const nextStep = () => { if (step < 5 && canProceed) setStep(step + 1); };
  const prevStep = () => { if (step > 0) setStep(step - 1); };
  const resetCalc = () => {
    setStep(0);
    setInput({
      businessType: "", monthlyBill: 0, monthlyKwh: 0, inputMode: "bill",
      roofArea: 0, roofType: "metal_sheet", orientation: "south", region: "central",
      desiredKwp: 0, wantBess: false, bessMode: "hybrid",
      backupHours: 4, nightCoverage: 50, tiltAngle: 15, shading: 5, gridExportAllowed: false,
    });
    setResultTab("overview");
  };

  const selectedBiz = BUSINESS_TYPES[input.businessType];

  // Generate summary text for CTA
  const getResultSummary = () => {
    if (!result) return "";
    return `ระบบ Solar ${result.actualKwp} kWp${result.bessCapacityKwh > 0 ? ` + BESS ${result.bessCapacityKwh} kWh` : ""} | ค่าไฟ ${input.monthlyBill.toLocaleString()} บาท/เดือน | ${t("sa.summary.savings")} ${result.monthlySavings.toLocaleString()} ${t("sa.summary.perMonth")} | คืนทุน ${result.simplePayback} ปี | พื้นที่ ${input.roofArea} ตร.ม. | ${selectedBiz ? t(selectedBiz.nameKey) : ""}`;
  };

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative py-20 lg:py-28 bg-background overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-accent-primary blur-[120px]" />
          <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-accent-secondary blur-[100px]" />
        </div>
        <div className="container relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent-glow border border-border-accent">
                <Calculator className="w-5 h-5 text-accent-primary" />
              </div>
              <span className="text-xs font-medium text-accent-primary tracking-widest uppercase">{t("sa.hero.badge")}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
              คำนวณระบบโซลาร์เซลล์<br />
              <span className="text-gradient-accent">{t("sa.hero.title2")}</span>
            </h1>
            <p className="text-base lg:text-lg text-text-secondary max-w-2xl mb-6">
              เครื่องมือวิเคราะห์ระดับวิศวกรรม — คำนวณขนาดระบบ Solar PV + BESS ที่เหมาะสมกับธุรกิจของคุณ
              พร้อมประมาณการ 25 ปี, IRR, LCOE, และตรวจสอบความสมเหตุสมผลของขนาดเทียบกับกำลังการผลิตจริง
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-text-muted">
              {[
                { icon: Target, text: "ข้อมูล Solar Irradiance ประเทศไทย" },
                { icon: Layers, text: "รองรับ 7 ประเภทธุรกิจ" },
                { icon: PieChart, text: "วิเคราะห์ ROI + IRR + LCOE" },
                { icon: Calendar, text: "ประมาณการ 25 ปี" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-subtle bg-surface-elevated">
                  <item.icon className="w-3.5 h-3.5 text-accent-primary" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Site photos strip */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="mt-10 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
	            {SITE_PHOTOS.map((src, i) => (
	              <img
	                key={i}
	                src={cfImage(src, 320)}
	                srcSet={cfImageSrcSet(src, [180, 240, 320])}
	                sizes="(min-width: 1024px) 160px, 128px"
	                alt={`SIRINX installation ${i + 1}`}
	                className="w-32 h-24 lg:w-40 lg:h-28 object-cover rounded-lg border border-border-subtle flex-shrink-0 hover:scale-105 transition-transform"
	                loading="lazy"
	                decoding="async"
	              />
	            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Calculator ── */}
      <section className="py-12 lg:py-20 section-alt">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                {STEPS.map((s, i) => {
                  const StepIcon = s.icon;
                  return (
	                    <button
	                      key={i}
	                      onClick={() => i < step && setStep(i)}
	                      aria-label={`ขั้นตอนที่ ${i + 1}: ${s.label}`}
	                      className={`flex items-center gap-1.5 transition-colors ${i <= step ? "text-accent-primary" : "text-text-muted"} ${i < step ? "cursor-pointer hover:text-accent-secondary" : ""}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        i < step ? "bg-accent-primary text-text-inverse" :
                        i === step ? "bg-accent-glow border-2 border-accent-primary text-accent-primary" :
                        "bg-surface-elevated border border-border-subtle text-text-muted"
                      }`}>
                        {i < step ? <CheckCircle2 className="w-4 h-4" /> : <StepIcon className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs hidden lg:block font-medium">{s.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full"
                  animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} transition={{ duration: 0.4 }} />
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6 lg:p-8 rounded-2xl border border-border-subtle bg-surface-elevated shadow-sm">
              <AnimatePresence mode="wait">
                {/* ── Step 0: Business Type ── */}
                {step === 0 && (
                  <motion.div key="step0" variants={slideIn} initial="hidden" animate="visible" exit="exit">
                    <h2 className="font-display text-xl font-bold text-foreground mb-2">{t("sa.s0.title")}</h2>
                    <p className="text-sm text-text-muted mb-6">{t("sa.s0.desc")}</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(BUSINESS_TYPES).map(([key, biz]) => (
                        <button key={key} onClick={() => updateInput("businessType", key)}
                          className={`p-4 rounded-xl border text-left transition-all group ${
                            input.businessType === key
                              ? "border-accent-primary bg-accent-glow ring-1 ring-accent-primary/30"
                              : "border-border-subtle hover:border-border-accent hover:bg-surface-overlay"
                          }`}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${input.businessType === key ? "bg-accent-primary/20 text-accent-primary" : "bg-surface-elevated text-text-muted group-hover:text-accent-primary"}`}>
                              {biz.icon}
                            </div>
                            <span className="font-display font-semibold text-sm text-foreground">{t(biz.nameKey)}</span>
                          </div>
                          <div className="text-xs text-text-muted space-y-0.5">
                            <div>ค่าไฟทั่วไป: {biz.typicalBill} บาท/เดือน</div>
                            <div>เปิดทำการ: {t(biz.operatingHoursKey)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedBiz && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 rounded-xl bg-accent-glow/50 border border-border-accent">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-accent-primary" />
                          <span className="text-sm font-semibold text-foreground">โปรไฟล์การใช้ไฟ: {t(selectedBiz.nameKey)}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div><span className="text-text-muted">ใช้ไฟกลางวัน:</span> <span className="text-foreground font-semibold">{selectedBiz.daytimeRatio * 100}%</span></div>
                          <div><span className="text-text-muted">ใช้ไฟกลางคืน:</span> <span className="text-foreground font-semibold">{selectedBiz.nightUsageRatio * 100}%</span></div>
                          <div><span className="text-text-muted">อัตราเฉลี่ย:</span> <span className="text-foreground font-semibold">{selectedBiz.avgRate} บาท/kWh</span></div>
                          <div><span className="text-text-muted">Demand Charge:</span> <span className="text-foreground font-semibold">{selectedBiz.demandCharge} บาท/kW</span></div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ── Step 1: Energy Data ── */}
                {step === 1 && (
                  <motion.div key="step1" variants={slideIn} initial="hidden" animate="visible" exit="exit">
                    <h2 className="font-display text-xl font-bold text-foreground mb-2">{t("sa.s1.title")}</h2>
                    <p className="text-sm text-text-muted mb-4">{t("sa.s1.desc")}</p>

                    {/* Input mode toggle */}
                    <div className="flex gap-2 mb-6">
                      <button onClick={() => updateInput("inputMode", "bill")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${input.inputMode === "bill" ? "bg-accent-primary text-text-inverse" : "bg-surface-overlay text-text-muted border border-border-subtle"}`}>
                        กรอกค่าไฟ (บาท)
                      </button>
                      <button onClick={() => updateInput("inputMode", "kwh")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${input.inputMode === "kwh" ? "bg-accent-primary text-text-inverse" : "bg-surface-overlay text-text-muted border border-border-subtle"}`}>
                        กรอก kWh โดยตรง
                      </button>
                    </div>

                    <div className="space-y-5">
                      {input.inputMode === "bill" ? (
                        <InputField label="ค่าไฟฟ้าเฉลี่ยต่อเดือน *" unit="บาท" value={input.monthlyBill || ""}
                          onChange={(v) => updateInput("monthlyBill", parseFloat(v) || 0)}
                          placeholder={t("sa.s1.placeholderBill")} helpText={selectedBiz ? `ค่าไฟทั่วไปสำหรับ${t(selectedBiz.nameKey)}: ${selectedBiz.typicalBill} บาท/เดือน` : undefined} />
                      ) : (
                        <InputField label="ปริมาณการใช้ไฟฟ้าเฉลี่ยต่อเดือน *" unit="kWh" value={input.monthlyKwh || ""}
                          onChange={(v) => updateInput("monthlyKwh", parseFloat(v) || 0)}
                          placeholder={t("sa.s1.placeholderKwh")} helpText="ดูจากใบแจ้งค่าไฟ หรือ smart meter" />
                      )}

                      {((input.inputMode === "bill" && input.monthlyBill > 0) || (input.inputMode === "kwh" && input.monthlyKwh > 0)) && selectedBiz && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="p-4 rounded-xl bg-surface-overlay border border-border-subtle">
                          <h3 className="text-xs font-semibold text-foreground mb-3">{t("sa.s1.loadProfile")}</h3>
                          <div className="grid sm:grid-cols-4 gap-3 text-center mb-4">
                            {(() => {
                              const mc = input.inputMode === "kwh" ? input.monthlyKwh : input.monthlyBill / selectedBiz.avgRate;
                              return (
                                <>
                                  <div>
                                    <div className="text-xs text-text-muted mb-1">{t("sa.s1.totalUsage")}</div>
                                    <div className="font-display text-lg font-bold text-foreground">{Math.round(mc).toLocaleString()}</div>
                                    <div className="text-xs text-text-muted">{t("sa.s1.kwhMonth")}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-text-muted mb-1">{t("sa.s1.daytimeUsage")}</div>
                                    <div className="font-display text-lg font-bold text-accent-primary">{Math.round(mc * selectedBiz.daytimeRatio).toLocaleString()}</div>
                                    <div className="text-xs text-text-muted">{t("sa.s1.kwhMonth")}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-text-muted mb-1">{t("sa.s1.nightUsage")}</div>
                                    <div className="font-display text-lg font-bold text-accent-secondary">{Math.round(mc * selectedBiz.nightUsageRatio).toLocaleString()}</div>
                                    <div className="text-xs text-text-muted">{t("sa.s1.kwhMonth")}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-text-muted mb-1">{t("sa.s1.peakDemand")}</div>
                                    <div className="font-display text-lg font-bold text-foreground">{Math.round(mc / (30 * 8))}</div>
                                    <div className="text-xs text-text-muted">kW</div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          {/* Hourly profile preview */}
                          <button onClick={() => setShowHourly(!showHourly)}
                            className="flex items-center gap-1 text-xs text-accent-primary hover:underline mb-2">
                            <Eye className="w-3 h-3" /> {showHourly ? "ซ่อน" : "ดู"} Load Profile รายชั่วโมง
                          </button>
                          {showHourly && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <MiniBarChart
                                data={selectedBiz.monthlyHourlyProfile.map(f => f * 100)}
                                labels={Array.from({ length: 24 }, (_, i) => i % 3 === 0 ? `${i}` : "")}
                                height={80}
                              />
                              <p className="text-[10px] text-text-muted mt-1 text-center">{t("sa.s1.hourlyPattern")} {t(selectedBiz.nameKey)})</p>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: Location & Roof ── */}
                {step === 2 && (
                  <motion.div key="step2" variants={slideIn} initial="hidden" animate="visible" exit="exit">
                    <h2 className="font-display text-xl font-bold text-foreground mb-2">{t("sa.s2.title")}</h2>
                    <p className="text-sm text-text-muted mb-6">{t("sa.s2.desc")}</p>
                    <div className="space-y-5">
                      <InputField label="พื้นที่หลังคาทั้งหมด *" unit="ตร.ม." value={input.roofArea || ""}
                        onChange={(v) => updateInput("roofArea", parseFloat(v) || 0)}
                        placeholder={t("sa.s2.roofAreaPlaceholder")} helpText="วัดพื้นที่หลังคาทั้งหมด (ระบบจะคำนวณพื้นที่ใช้งานได้จริงตามประเภทหลังคา)" />

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{t("sa.s2.region")}</label>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {Object.entries(REGIONS).map(([key, r]) => (
                            <button key={key} onClick={() => updateInput("region", key)}
                              className={`p-3 rounded-lg border text-left text-sm transition-all ${
                                input.region === key ? "border-accent-primary bg-accent-glow" : "border-border-subtle hover:border-border-accent"
                              }`}>
                              <div className="flex justify-between items-center">
                                <span className="text-foreground font-medium">{r.name}</span>
                                <span className={`text-xs ${input.region === key ? "text-accent-primary" : "text-text-muted"}`}>
                                  PSH {r.psh} | GHI {r.ghi}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{t("sa.s2.roofType")}</label>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {Object.entries(ROOF_TYPES).map(([key, r]) => (
                            <button key={key} onClick={() => updateInput("roofType", key)}
                              className={`p-3 rounded-lg border text-left text-sm transition-all ${
                                input.roofType === key ? "border-accent-primary bg-accent-glow" : "border-border-subtle hover:border-border-accent"
                              }`}>
                              <div className="font-medium text-foreground">{r.name}</div>
                              <div className="text-xs text-text-muted mt-0.5">
                                ใช้ได้ {Math.round(r.usableRatio * 100)}% | รับน้ำหนัก {r.loadCapacity} | {r.suitability}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{t("sa.s2.orientation")}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {Object.entries(ORIENTATIONS).map(([key, o]) => (
                            <button key={key} onClick={() => updateInput("orientation", key)}
                              className={`p-3 rounded-lg border text-left text-xs transition-all ${
                                input.orientation === key ? "border-accent-primary bg-accent-glow" : "border-border-subtle hover:border-border-accent"
                              }`}>
                              <div className="font-medium text-foreground text-sm">{o.name}</div>
                              <div className="text-text-muted mt-0.5">{o.note}</div>
                              <div className={`mt-1 font-semibold ${o.factor >= 0.9 ? "text-green-500" : o.factor >= 0.8 ? "text-accent-secondary" : "text-red-400"}`}>
                                ประสิทธิภาพ {Math.round(o.factor * 100)}%
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Shading input */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          เงาบัง (ต้นไม้, อาคารข้างเคียง): <span className="text-accent-primary font-bold">{input.shading}%</span>
                        </label>
                        <input type="range" min={0} max={30} step={5} value={input.shading}
                          onChange={(e) => updateInput("shading", parseInt(e.target.value))}
                          className="w-full accent-[var(--accent-primary)]" />
                        <div className="flex justify-between text-xs text-text-muted mt-1">
                          <span>{t("sa.s2.shadingNone")}</span>
                          <span>15%</span>
                          <span>{t("sa.s2.shadingHigh")}</span>
                        </div>
                      </div>

                      {/* Roof summary */}
                      {input.roofArea > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="p-4 rounded-xl bg-surface-overlay border border-border-subtle">
                          <div className="grid grid-cols-3 gap-3 text-center text-xs">
                            <div>
                              <div className="text-text-muted mb-1">{t("sa.s2.totalArea")}</div>
                              <div className="font-display text-lg font-bold text-foreground">{input.roofArea.toLocaleString()}</div>
                              <div className="text-text-muted">{t("sa.s2.roofAreaUnit")}</div>
                            </div>
                            <div>
                              <div className="text-text-muted mb-1">{t("sa.s2.usableArea")}</div>
                              <div className="font-display text-lg font-bold text-accent-primary">
                                {Math.round(input.roofArea * (ROOF_TYPES[input.roofType]?.usableRatio || 0.65)).toLocaleString()}
                              </div>
                              <div className="text-text-muted">{t("sa.s2.roofAreaUnit")}</div>
                            </div>
                            <div>
                              <div className="text-text-muted mb-1">{t("sa.s2.maxInstall")}</div>
                              <div className="font-display text-lg font-bold text-accent-secondary">
                                {Math.round(input.roofArea * (ROOF_TYPES[input.roofType]?.usableRatio || 0.65) / AREA_PER_KWP * 10) / 10}
                              </div>
                              <div className="text-text-muted">kWp</div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── Step 3: System Sizing ── */}
                {step === 3 && (
                  <motion.div key="step3" variants={slideIn} initial="hidden" animate="visible" exit="exit">
                    <h2 className="font-display text-xl font-bold text-foreground mb-2">{t("sa.s3.title")}</h2>
                    <p className="text-sm text-text-muted mb-6">
                      ระบบแนะนำขนาดที่เหมาะสม — คุณสามารถปรับขนาดเองได้ ระบบจะตรวจสอบความสมเหตุสมผลให้
                    </p>

                    {/* Recommended size info */}
                    {((input.inputMode === "bill" && input.monthlyBill > 0) || (input.inputMode === "kwh" && input.monthlyKwh > 0)) && selectedBiz && (
                      <div className="mb-6 p-4 rounded-xl bg-accent-glow/50 border border-border-accent">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="w-5 h-5 text-accent-primary" />
                          <span className="font-display font-semibold text-foreground">{t("sa.s3.recommended")}</span>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-4 text-center">
                          {(() => {
                            const region = REGIONS[input.region] || REGIONS.central;
                            const orient = ORIENTATIONS[input.orientation] || ORIENTATIONS.south;
                            const tiltF = input.tiltAngle >= 10 && input.tiltAngle <= 20 ? 1.0 : input.tiltAngle < 10 ? 0.95 : 0.98;
                            const shadF = 1 - (input.shading / 100);
                            const psh = region.psh * orient.factor * tiltF * shadF;
                            const mc = input.inputMode === "kwh" ? input.monthlyKwh : input.monthlyBill / selectedBiz.avgRate;
                            const consumption = mc * 12 * selectedBiz.daytimeRatio;
                            const rec = Math.round(consumption / (psh * 365 * PERFORMANCE_RATIO) * 10) / 10;
                            return (
                              <>
                                <div>
                                  <div className="text-xs text-text-muted mb-1">{t("sa.s3.recSize")}</div>
                                  <div className="font-display text-2xl font-bold text-accent-primary">{rec}</div>
                                  <div className="text-xs text-text-muted">kWp</div>
                                </div>
                                <div>
                                  <div className="text-xs text-text-muted mb-1">{t("sa.s3.maxRoof")}</div>
                                  <div className="font-display text-2xl font-bold text-foreground">
                                    {Math.round(input.roofArea * (ROOF_TYPES[input.roofType]?.usableRatio || 0.65) / AREA_PER_KWP * 10) / 10}
                                  </div>
                                  <div className="text-xs text-text-muted">kWp</div>
                                </div>
                                <div>
                                  <div className="text-xs text-text-muted mb-1">จำนวนแผง ({PANEL_WATT}W)</div>
                                  <div className="font-display text-2xl font-bold text-foreground">
                                    {Math.ceil(rec * 1000 / PANEL_WATT)}
                                  </div>
                                  <div className="text-xs text-text-muted">แผง</div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    <div className="space-y-5">
                      <InputField label="ขนาดระบบที่ต้องการ (เว้นว่างเพื่อใช้ค่าแนะนำ)" unit="kWp"
                        value={input.desiredKwp || ""}
                        onChange={(v) => updateInput("desiredKwp", parseFloat(v) || 0)}
                        placeholder={t("sa.s3.desiredPlaceholder")} helpText="ใส่ 0 หรือเว้นว่าง = ใช้ขนาดแนะนำจากระบบ" />

                      {/* Grid export toggle */}
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle">
                        <button onClick={() => updateInput("gridExportAllowed", !input.gridExportAllowed)}
                          className={`w-10 h-5 rounded-full transition-colors ${input.gridExportAllowed ? "bg-accent-primary" : "bg-surface-elevated border border-border-subtle"}`}>
                          <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${input.gridExportAllowed ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                        <div>
                          <span className="text-sm font-medium text-foreground">{t("sa.s3.netMetering")}</span>
                          <p className="text-xs text-text-muted">{t("sa.s3.netMeteringHelp")}</p>
                        </div>
                      </div>

                      {/* Advanced settings */}
                      <button onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm text-accent-primary hover:text-accent-secondary transition-colors">
                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        ตั้งค่าขั้นสูง (มุมเอียง, ประสิทธิภาพ)
                      </button>

                      {showAdvanced && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          className="space-y-4 p-4 rounded-xl bg-surface-overlay border border-border-subtle">
                          <InputField label="มุมเอียงแผงโซลาร์" unit="องศา" value={input.tiltAngle}
                            onChange={(v) => updateInput("tiltAngle", parseFloat(v) || 15)}
                            min={0} max={45} step={1}
                            helpText="10-20° เหมาะสมที่สุดสำหรับประเทศไทย (ละติจูด 5-20°N)" />
                          <div className="grid sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle">
                              <span className="text-text-muted">{t("sa.s3.panelEff")}</span>
                              <span className="text-foreground font-semibold ml-2">{PANEL_EFFICIENCY * 100}% (TOPCon {PANEL_WATT}W)</span>
                            </div>
                            <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle">
                              <span className="text-text-muted">{t("sa.s3.perfRatio")}</span>
                              <span className="text-foreground font-semibold ml-2">{PERFORMANCE_RATIO * 100}%</span>
                            </div>
                            <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle">
                              <span className="text-text-muted">{t("sa.s3.areaPerKwp")}</span>
                              <span className="text-foreground font-semibold ml-2">{AREA_PER_KWP} ตร.ม. (รวมระยะห่าง)</span>
                            </div>
                            <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle">
                              <span className="text-text-muted">{t("sa.s3.degradation")}</span>
                              <span className="text-foreground font-semibold ml-2">ปีแรก {YEAR1_DEGRADATION * 100}%, หลังจากนั้น {ANNUAL_DEGRADATION * 100}%/ปี</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Size validation preview */}
                      {input.desiredKwp > 0 && selectedBiz && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="p-4 rounded-xl border border-border-subtle bg-surface-overlay">
                          <h3 className="font-display font-semibold text-sm text-foreground mb-3">{t("sa.s3.sizeCheck")}</h3>
                          {(() => {
                            const maxKwp = Math.round(input.roofArea * (ROOF_TYPES[input.roofType]?.usableRatio || 0.65) / AREA_PER_KWP * 10) / 10;
                            const region = REGIONS[input.region] || REGIONS.central;
                            const orient = ORIENTATIONS[input.orientation] || ORIENTATIONS.south;
                            const tiltF = input.tiltAngle >= 10 && input.tiltAngle <= 20 ? 1.0 : input.tiltAngle < 10 ? 0.95 : 0.98;
                            const shadF = 1 - (input.shading / 100);
                            const psh = region.psh * orient.factor * tiltF * shadF;
                            const mc = input.inputMode === "kwh" ? input.monthlyKwh : input.monthlyBill / selectedBiz.avgRate;
                            const consumption = mc * 12 * selectedBiz.daytimeRatio;
                            const recKwp = Math.round(consumption / (psh * 365 * PERFORMANCE_RATIO) * 10) / 10;
                            const ratio = input.desiredKwp / recKwp;
                            const fitsRoof = input.desiredKwp <= maxKwp;

                            return (
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-text-muted">{t("sa.s3.desiredVsRec")}</span>
                                  <span className={`font-semibold ${ratio >= 0.7 && ratio <= 1.3 ? "text-green-500" : ratio > 1.5 ? "text-red-400" : "text-accent-secondary"}`}>
                                    {input.desiredKwp} / {recKwp} kWp ({Math.round(ratio * 100)}%)
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-text-muted">{t("sa.s3.roofCapacity")}</span>
                                  <span className={`font-semibold ${fitsRoof ? "text-green-500" : "text-red-400"}`}>
                                    {fitsRoof ? "เพียงพอ" : `${t("sa.s3.insufficient")} ${maxKwp} kWp)`}
                                  </span>
                                </div>
                                <div className="h-2 bg-surface-elevated rounded-full overflow-hidden mt-2">
                                  <div className="h-full rounded-full transition-all" style={{
                                    width: `${Math.min(ratio * 100, 200) / 2}%`,
                                    background: ratio >= 0.7 && ratio <= 1.3 ? "var(--accent-primary)" : ratio > 1.5 ? "#ef4444" : "var(--accent-secondary)",
                                  }} />
                                </div>
                                <div className="flex justify-between text-xs text-text-muted">
                                  <span>0%</span>
                                  <span>{t("sa.s3.recommended100")}</span>
                                  <span>200%</span>
                                </div>
                              </div>
                            );
                          })()}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── Step 4: BESS ── */}
                {step === 4 && (
                  <motion.div key="step4" variants={slideIn} initial="hidden" animate="visible" exit="exit">
                    <h2 className="font-display text-xl font-bold text-foreground mb-2">{t("sa.s4.title")}</h2>
                    <p className="text-sm text-text-muted mb-6">
                      เพิ่มแบตเตอรี่เพื่อเก็บพลังงานส่วนเกินใช้ตอนกลางคืน, สำรองไฟฉุกเฉิน, และลด demand charge
                    </p>

                    {/* BESS toggle */}
                    <div className="mb-6">
                      <button onClick={() => updateInput("wantBess", !input.wantBess)}
                        className={`w-full p-5 rounded-xl border text-left transition-all ${
                          input.wantBess ? "border-accent-primary bg-accent-glow ring-1 ring-accent-primary/30" : "border-border-subtle hover:border-border-accent"
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <BatteryCharging className={`w-6 h-6 ${input.wantBess ? "text-accent-primary" : "text-text-muted"}`} />
                            <div>
                              <div className="font-display font-semibold text-foreground">{t("sa.s4.addBess")}</div>
                              <div className="text-xs text-text-muted mt-0.5">Battery Energy Storage System — LFP {BESS_CYCLE_LIFE} cycles</div>
                            </div>
                          </div>
                          <div className={`w-12 h-6 rounded-full transition-colors ${input.wantBess ? "bg-accent-primary" : "bg-surface-elevated border border-border-subtle"}`}>
                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${input.wantBess ? "translate-x-6" : "translate-x-0.5"}`} />
                          </div>
                        </div>
                      </button>
                    </div>

                    {input.wantBess && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-5">
                        {/* BESS Mode Selection */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">{t("sa.s4.modeLabel")}</label>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {[
                              { key: "hybrid", icon: Layers, title: "Hybrid (แนะนำ)", desc: "รวมทุกโหมด — ระบบเลือกขนาดที่เหมาะสมที่สุด" },
                              { key: "night", icon: Sun, title: "Night Coverage", desc: "เก็บไฟส่วนเกินจากโซลาร์ใช้ตอนกลางคืน" },
                              { key: "backup", icon: Shield, title: "Backup Power", desc: "สำรองไฟฉุกเฉินเมื่อไฟฟ้าหลักดับ" },
                              { key: "peak_shaving", icon: TrendingDown, title: "Peak Shaving", desc: "ลด demand charge ช่วงพีค" },
                            ].map((mode) => (
                              <button key={mode.key} onClick={() => updateInput("bessMode", mode.key)}
                                className={`p-3 rounded-lg border text-left text-sm transition-all ${
                                  input.bessMode === mode.key ? "border-accent-primary bg-accent-glow" : "border-border-subtle hover:border-border-accent"
                                }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <mode.icon className={`w-4 h-4 ${input.bessMode === mode.key ? "text-accent-primary" : "text-text-muted"}`} />
                                  <span className="font-medium text-foreground">{mode.title}</span>
                                </div>
                                <div className="text-xs text-text-muted">{mode.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <InputField label="ชั่วโมงสำรองไฟที่ต้องการ" unit="ชั่วโมง" value={input.backupHours}
                          onChange={(v) => updateInput("backupHours", parseFloat(v) || 4)}
                          min={1} max={24} step={1}
                          helpText="จำนวนชั่วโมงที่ต้องการให้ระบบทำงานได้เมื่อไฟฟ้าหลักดับ" />

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            สัดส่วนการใช้ไฟกลางคืนที่ต้องการ cover: <span className="text-accent-primary font-bold">{input.nightCoverage}%</span>
                          </label>
                          <input type="range" min={0} max={100} step={10} value={input.nightCoverage}
                            onChange={(e) => updateInput("nightCoverage", parseInt(e.target.value))}
                            className="w-full accent-[var(--accent-primary)]" />
                          <div className="flex justify-between text-xs text-text-muted mt-1">
                            <span>{t("sa.s4.nightNone")}</span>
                            <span>50%</span>
                            <span>{t("sa.s4.nightFull")}</span>
                          </div>
                        </div>

                        {/* BESS preview */}
                        {selectedBiz && ((input.inputMode === "bill" && input.monthlyBill > 0) || (input.inputMode === "kwh" && input.monthlyKwh > 0)) && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="p-4 rounded-xl bg-surface-overlay border border-border-subtle">
                            <h3 className="font-display font-semibold text-sm text-foreground mb-3">{t("sa.s4.preview")}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                              {(() => {
                                const mc = input.inputMode === "kwh" ? input.monthlyKwh : input.monthlyBill / selectedBiz.avgRate;
                                const nightDaily = (mc * selectedBiz.nightUsageRatio * 12 / 365) * (input.nightCoverage / 100);
                                const avgHourly = mc / (30 * 24);
                                const backupKwh = avgHourly * input.backupHours;
                                const rawCap = Math.max(nightDaily, backupKwh);
                                const cap = Math.round(rawCap / (BESS_DOD * BESS_ROUND_TRIP_EFF) * 10) / 10;
                                const cost = Math.round(cap * BESS_COST_PER_KWH);
                                return (
                                  <>
                                    <div>
                                      <div className="text-text-muted mb-1">{t("sa.s4.recCapacity")}</div>
                                      <div className="font-display text-lg font-bold text-accent-primary">{cap}</div>
                                      <div className="text-text-muted">kWh</div>
                                    </div>
                                    <div>
                                      <div className="text-text-muted mb-1">{t("sa.s4.power")}</div>
                                      <div className="font-display text-lg font-bold text-foreground">{Math.round(cap / input.backupHours * 10) / 10}</div>
                                      <div className="text-text-muted">kW</div>
                                    </div>
                                    <div>
                                      <div className="text-text-muted mb-1">{t("sa.s4.estCost")}</div>
                                      <div className="font-display text-lg font-bold text-foreground">{(cost / 1000000).toFixed(2)}</div>
                                      <div className="text-text-muted">ล้านบาท</div>
                                    </div>
                                    <div>
                                      <div className="text-text-muted mb-1">{t("sa.s4.lifetime")}</div>
                                      <div className="font-display text-lg font-bold text-accent-secondary">{BESS_CYCLE_LIFE}</div>
                                      <div className="text-text-muted">รอบ (~15 ปี)</div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </motion.div>
                        )}

                        {/* BESS specs */}
                        <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle">
                          <div className="text-xs text-text-muted space-y-1">
                            <div className="flex justify-between"><span>{t("sa.s4.technology")}</span><span className="text-foreground">LFP (Lithium Iron Phosphate)</span></div>
                            <div className="flex justify-between"><span>{t("sa.s4.roundTrip")}</span><span className="text-foreground">{BESS_ROUND_TRIP_EFF * 100}%</span></div>
                            <div className="flex justify-between"><span>{t("sa.s4.dod")}</span><span className="text-foreground">{BESS_DOD * 100}%</span></div>
                            <div className="flex justify-between"><span>{t("sa.s4.cycleLife")}</span><span className="text-foreground">{BESS_CYCLE_LIFE.toLocaleString()} cycles</span></div>
                            <div className="flex justify-between"><span>{t("sa.s3.degradation")}</span><span className="text-foreground">{BESS_DEGRADATION_YEAR * 100}%/ปี</span></div>
                            <div className="flex justify-between"><span>{t("sa.s4.refCost")}</span><span className="text-foreground">{BESS_COST_PER_KWH.toLocaleString()} บาท/kWh</span></div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {!input.wantBess && (
                      <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle text-center">
                        <Battery className="w-8 h-8 text-text-muted mx-auto mb-2" />
                        <p className="text-sm text-text-muted">{t("sa.s4.skip")}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Step 5: Results ── */}
                {step === 5 && result && (
                  <motion.div key="step5" variants={slideIn} initial="hidden" animate="visible" exit="exit">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent-glow border border-border-accent">
                          <BarChart3 className="w-5 h-5 text-accent-primary" />
                        </div>
                        <div>
                          <h2 className="font-display text-xl font-bold text-foreground">{t("sa.r.title")}</h2>
                          <p className="text-xs text-text-muted">Solar {result.actualKwp} kWp{result.bessCapacityKwh > 0 ? ` + BESS ${result.bessCapacityKwh} kWh` : ""}</p>
                        </div>
                      </div>
                      <button onClick={resetCalc} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent-primary transition-colors">
                        <RotateCcw className="w-4 h-4" /> คำนวณใหม่
                      </button>
                    </div>

                    {/* Verdict Badge */}
                    <div className={`mb-4 p-4 rounded-xl border ${
                      result.sizeVerdict === "optimal" ? "border-green-500/30 bg-green-500/10" :
                      result.sizeVerdict === "roof_limited" ? "border-accent-secondary/30 bg-accent-secondary/10" :
                      result.sizeVerdict === "undersized" ? "border-blue-400/30 bg-blue-400/10" :
                      "border-red-400/30 bg-red-400/10"
                    }`}>
                      <div className="flex items-center gap-2">
                        {result.sizeVerdict === "optimal" ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                         result.sizeVerdict === "roof_limited" ? <AlertTriangle className="w-5 h-5 text-accent-secondary" /> :
                         <AlertTriangle className="w-5 h-5 text-red-400" />}
                        <span className="font-display font-semibold text-foreground">
                          {result.sizeVerdict === "optimal" ? t("sa.r.optimal") :
                           result.sizeVerdict === "roof_limited" ? t("sa.r.roofLimited") :
                           result.sizeVerdict === "undersized" ? t("sa.r.undersized") :
                           result.sizeVerdict === "oversized" ? t("sa.r.oversized") : t("sa.r.unreasonable")}
                        </span>
                      </div>
                    </div>

                    {/* Result Tabs */}
                    <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
                      {[
                        { key: "overview" as const, label: "ภาพรวม", icon: Eye },
                        { key: "financial" as const, label: "การเงิน", icon: DollarSign },
                        { key: "technical" as const, label: "เทคนิค", icon: Gauge },
                        { key: "projection" as const, label: "ประมาณการ 25 ปี", icon: TrendingUp },
                      ].map((tab) => (
	                        <button
	                          key={tab.key}
	                          onClick={() => setResultTab(tab.key)}
	                          aria-label={`แสดงผลลัพธ์แท็บ${tab.label}`}
	                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                            resultTab === tab.key ? "bg-accent-primary text-text-inverse" : "text-text-muted hover:text-foreground hover:bg-surface-overlay"
                          }`}>
                          <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* ── Tab: Overview ── */}
                    {resultTab === "overview" && (
                      <div className="space-y-6">
                        {/* Size Comparison Table */}
                        <div className="overflow-x-auto">
                          <h3 className="font-display font-semibold text-sm text-foreground mb-3">{t("sa.r.sizeComparison")}</h3>
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="border-b border-border-subtle">
                                <th className="text-left py-2 px-3 text-text-muted font-medium">{t("sa.r.item")}</th>
                                <th className="text-right py-2 px-3 text-text-muted font-medium">{t("sa.s3.recSize")}</th>
                                <th className="text-right py-2 px-3 text-text-muted font-medium">{t("sa.r.selectedSize")}</th>
                                <th className="text-right py-2 px-3 text-text-muted font-medium">{t("sa.r.maxRoof")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const scaleProduction = (kwp: number) => result.actualKwp > 0
                                  ? Math.round((kwp / result.actualKwp) * result.annualProduction)
                                  : 0;
                                return [
                                  ["กำลังผลิต (kWp)", result.recommendedKwp, result.actualKwp, result.maxKwpFromRoof],
                                  ["จำนวนแผง", Math.ceil(result.recommendedKwp * 1000 / PANEL_WATT), result.numberOfPanels, Math.ceil(result.maxKwpFromRoof * 1000 / PANEL_WATT)],
                                  ["พื้นที่ใช้ (ตร.ม.)", Math.round(result.recommendedKwp * AREA_PER_KWP), result.requiredRoofArea, result.usableRoofArea],
                                  ["ผลิตไฟ/ปี (kWh)", scaleProduction(result.recommendedKwp), result.annualProduction, scaleProduction(result.maxKwpFromRoof)],
                                ];
                              })().map(([label, rec, actual, max], i) => (
                                <tr key={i} className="border-b border-border-subtle/50">
                                  <td className="py-2 px-3 text-foreground">{label}</td>
                                  <td className="py-2 px-3 text-right text-accent-primary font-semibold">{typeof rec === "number" ? rec.toLocaleString() : rec}</td>
                                  <td className="py-2 px-3 text-right text-foreground font-semibold">{typeof actual === "number" ? actual.toLocaleString() : actual}</td>
                                  <td className="py-2 px-3 text-right text-text-muted">{typeof max === "number" ? max.toLocaleString() : max}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <WarningBox warnings={result.warnings} />

                        {/* Key Metrics Grid */}
                        <div>
                          <h3 className="font-display font-semibold text-sm text-foreground mb-3">{t("sa.r.keyMetrics")}</h3>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <MetricCard label="ประหยัดต่อเดือน" value={result.monthlySavings.toLocaleString()} unit="บาท" icon={DollarSign} accent />
                            <MetricCard label="คืนทุน" value={result.simplePayback} unit="ปี" icon={Clock} accent
                              subtext={result.simplePayback <= 5 ? "คืนทุนเร็วมาก" : result.simplePayback <= 7 ? "คืนทุนดี" : "ค่อนข้างนาน"} />
                            <MetricCard label="เงินลงทุน" value={(result.systemCost / 1000000).toFixed(2)} unit="ล้านบาท" icon={Gauge} />
                            <MetricCard label="ลด CO₂" value={result.co2Reduction} unit="ตัน/ปี" icon={Leaf}
                              subtext={`เทียบเท่าปลูกต้นไม้ ${result.treesEquivalent.toLocaleString()} ต้น`} />
                          </div>
                        </div>

                        {/* BESS Results */}
                        {result.bessCapacityKwh > 0 && (
                          <div>
                            <h3 className="font-display font-semibold text-sm text-foreground mb-3">{t("sa.r.bessTitle")}</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                              <MetricCard label="ความจุ BESS" value={result.bessCapacityKwh} unit="kWh" icon={Battery} accent />
                              <MetricCard label="กำลังจ่าย" value={result.bessCapacityKw} unit="kW" icon={BatteryCharging} />
                              <MetricCard label="ต้นทุน BESS" value={(result.bessCost / 1000000).toFixed(2)} unit="ล้านบาท" icon={DollarSign} />
                              <MetricCard label="คืนทุน BESS" value={result.bessPayback || "N/A"} unit={result.bessPayback ? "ปี" : ""} icon={Clock} />
                            </div>
                            {result.bessDemandSavings > 0 && (
                              <p className="text-xs text-text-muted mt-2">
                                * รวมการประหยัด demand charge ประมาณ {result.bessDemandSavings.toLocaleString()} บาท/ปี
                              </p>
                            )}
                          </div>
                        )}

                        {/* Combined Summary */}
                        <div className="p-5 rounded-xl bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-border-accent">
                          <h3 className="font-display font-semibold text-foreground mb-4">
                            สรุปรวม{result.bessCapacityKwh > 0 ? " (Solar + BESS)" : " (Solar PV)"}
                          </h3>
                          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-center">
                            {[
                              { label: "เงินลงทุนรวม", value: (result.totalCost / 1000000).toFixed(2), unit: "ล้านบาท" },
                              { label: "ประหยัดต่อปี", value: result.totalAnnualSavings.toLocaleString(), unit: "บาท" },
                              { label: "คืนทุนรวม", value: result.totalPayback.toString(), unit: "ปี" },
                              { label: "ประหยัด 25 ปี", value: (result.lifetimeSavings / 1000000).toFixed(1), unit: "ล้านบาท" },
                              { label: "ลด CO₂ ต่อปี", value: result.co2Reduction.toString(), unit: "ตัน" },
                            ].map((item, i) => (
                              <div key={i}>
                                <div className="text-xs text-text-muted mb-1">{item.label}</div>
                                <div className={`font-display text-xl font-bold ${i === 1 ? "text-accent-primary" : i === 2 ? "text-accent-secondary" : i === 4 ? "text-green-500" : "text-foreground"}`}>
                                  {item.value}
                                </div>
                                <div className="text-xs text-text-muted">{item.unit}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Tab: Financial ── */}
                    {resultTab === "financial" && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                          <MetricCard label="LCOE" value={result.lcoe} unit="บาท/kWh" icon={Target} accent
                            subtext={`ค่าไฟปัจจุบัน ${selectedBiz?.avgRate || 4.2} บาท/kWh`} />
                          <MetricCard label="IRR" value={`${result.irr}%`} icon={TrendingUp} accent
                            subtext={result.irr > 15 ? "ผลตอบแทนดีมาก" : result.irr > 10 ? "ผลตอบแทนดี" : "ผลตอบแทนปานกลาง"} />
                          <MetricCard label="ROI 25 ปี" value={`${result.roi25Year}%`} icon={PieChart}
                            subtext="หลังหักค่าบำรุงรักษาและเปลี่ยนอินเวอร์เตอร์" />
                          <MetricCard label="Specific Yield" value={result.specificYield} unit="kWh/kWp/ปี" icon={Sun} />
                          <MetricCard label="Capacity Factor" value={`${result.capacityFactor}%`} icon={Gauge} />
                          <MetricCard label="Self-consumption" value={`${result.selfConsumptionRatio}%`} icon={RefreshCw} />
                        </div>

                        {/* Cost Breakdown */}
                        <div className="p-4 rounded-xl border border-border-subtle bg-surface-overlay">
                          <h3 className="font-display font-semibold text-sm text-foreground mb-3">{t("sa.r.costBreakdown")}</h3>
                          <table className="w-full text-sm">
                            <tbody>
                              {[
                                ["ค่าระบบ Solar PV", `${(result.systemCost / 1000000).toFixed(2)} ล้านบาท`, `${selectedBiz?.costPerKwp.toLocaleString()} บาท/kWp`],
                                ...(result.bessCost > 0 ? [["ค่าระบบ BESS", `${(result.bessCost / 1000000).toFixed(2)} ล้านบาท`, `${BESS_COST_PER_KWH.toLocaleString()} บาท/kWh`]] : []),
                                ["ค่าบำรุงรักษา/ปี", `${(result.actualKwp * MAINTENANCE_COST_PER_KWP + result.systemCost * INSURANCE_RATE).toLocaleString()} บาท`, `${MAINTENANCE_COST_PER_KWP} บาท/kWp + ประกัน`],
                                ["เปลี่ยนอินเวอร์เตอร์ (ปีที่ 12)", `${(result.systemCost * INVERTER_COST_RATIO / 1000000).toFixed(2)} ล้านบาท`, `${INVERTER_COST_RATIO * 100}% ของค่าระบบ`],
                              ].map(([label, value, note], i) => (
                                <tr key={i} className="border-b border-border-subtle/30">
                                  <td className="py-2 text-foreground">{label}</td>
                                  <td className="py-2 text-right font-semibold text-foreground">{value}</td>
                                  <td className="py-2 text-right text-xs text-text-muted">{note}</td>
                                </tr>
                              ))}
                              <tr className="font-semibold">
                                <td className="py-2 text-accent-primary">{t("sa.r.totalInvestmentLabel")}</td>
                                <td className="py-2 text-right text-accent-primary">{(result.totalCost / 1000000).toFixed(2)} ล้านบาท</td>
                                <td></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Savings Breakdown */}
                        <div className="p-4 rounded-xl border border-border-subtle bg-surface-overlay">
                          <h3 className="font-display font-semibold text-sm text-foreground mb-3">{t("sa.r.savingsBreakdown")}</h3>
                          <table className="w-full text-sm">
                            <tbody>
                              <tr className="border-b border-border-subtle/30">
                                <td className="py-2 text-foreground">{t("sa.r.solarSavings")}</td>
                                <td className="py-2 text-right font-semibold text-accent-primary">{result.annualSavings.toLocaleString()} บาท/ปี</td>
                              </tr>
                              {result.bessAnnualSavings > 0 && (
                                <tr className="border-b border-border-subtle/30">
                                  <td className="py-2 text-foreground">{t("sa.r.bessSavings")}</td>
                                  <td className="py-2 text-right font-semibold text-accent-secondary">{result.bessAnnualSavings.toLocaleString()} บาท/ปี</td>
                                </tr>
                              )}
                              <tr className="font-semibold">
                                <td className="py-2 text-accent-primary">{t("sa.r.totalSavingsYear")}</td>
                                <td className="py-2 text-right text-accent-primary">{result.totalAnnualSavings.toLocaleString()} บาท/ปี</td>
                              </tr>
                            </tbody>
                          </table>
                          <p className="text-xs text-text-muted mt-2">
                            * คำนวณรวมค่าไฟที่เพิ่มขึ้น {ELECTRICITY_ESCALATION * 100}%/ปี ตลอดอายุโครงการ 25 ปี
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── Tab: Technical ── */}
                    {resultTab === "technical" && (
                      <div className="space-y-6">
                        {/* Production Details */}
                        <div className="overflow-x-auto">
                          <h3 className="font-display font-semibold text-sm text-foreground mb-3">{t("sa.r.prodDetails")}</h3>
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="border-b border-border-subtle">
                                <th className="text-left py-2 px-3 text-text-muted font-medium">{t("sa.r.parameter")}</th>
                                <th className="text-right py-2 px-3 text-text-muted font-medium">{t("sa.r.value")}</th>
                                <th className="text-left py-2 px-3 text-text-muted font-medium">{t("sa.r.note")}</th>
                              </tr>
                            </thead>
                            <tbody className="text-foreground">
                              {[
                                ["ผลิตไฟต่อวัน", `${result.dailyProduction.toLocaleString()} kWh`, "เฉลี่ยตลอดปี"],
                                ["ผลิตไฟต่อเดือน", `${result.monthlyProduction.toLocaleString()} kWh`, "เฉลี่ยตลอดปี"],
                                ["ผลิตไฟต่อปี", `${result.annualProduction.toLocaleString()} kWh`, "ปีที่ 2 (หลัง initial degradation)"],
                                ["Specific Yield", `${result.specificYield} kWh/kWp/ปี`, "ผลผลิตต่อกำลังติดตั้ง"],
                                ["Capacity Factor", `${result.capacityFactor}%`, "อัตราการใช้กำลังผลิต"],
                                ["Self-consumption", `${result.selfConsumptionRatio}%`, "สัดส่วนที่ใช้เองได้จริง"],
                                ["ใช้ไฟทั้งหมด/ปี", `${result.annualConsumption.toLocaleString()} kWh`, "จากข้อมูลที่กรอก"],
                                ["Solar Fraction", `${Math.round(result.annualProduction / result.annualConsumption * 100)}%`, "สัดส่วนโซลาร์ต่อการใช้ไฟ"],
                                ["น้ำหนักรวมระบบ", `${result.totalWeight.toLocaleString()} kg`, `${result.numberOfPanels} แผง`],
                              ].map(([param, val, note], i) => (
                                <tr key={i} className="border-b border-border-subtle/50">
                                  <td className="py-2 px-3">{param}</td>
                                  <td className="py-2 px-3 text-right font-semibold text-accent-primary">{val}</td>
                                  <td className="py-2 px-3 text-xs text-text-muted">{note}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Monthly Production Chart */}
                        <div>
                          <h3 className="font-display font-semibold text-sm text-foreground mb-3">{t("sa.r.monthlyProdChart")}</h3>
                          <MiniBarChart
                            data={result.monthlyProductionProfile}
                            labels={MONTH_NAMES.map(t)}
                            height={120}
                          />
                        </div>

                        {/* Hourly Production vs Consumption */}
                        <div>
                          <h3 className="font-display font-semibold text-sm text-foreground mb-3">{t("sa.r.hourlyComparison")}</h3>
                          <HourlyOverlayChart solar={result.hourlyProductionProfile} consumption={result.hourlyConsumptionProfile} />
                          <p className="text-xs text-text-muted mt-2">{t("sa.r.hourlyNote")}</p>
                        </div>

                        {/* Recommendations */}
                        {result.recommendations.length > 0 && (
                          <div className="p-4 rounded-xl bg-accent-glow/50 border border-border-accent">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="w-5 h-5 text-accent-primary" />
                              <span className="font-display font-semibold text-foreground text-sm">{t("sa.r.recommendations")}</span>
                            </div>
                            <ul className="space-y-1.5">
                              {result.recommendations.map((r, i) => (
                                <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-accent-primary mt-0.5 shrink-0" />
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Tab: Projection ── */}
                    {resultTab === "projection" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-display font-semibold text-sm text-foreground">{t("sa.hero.feat4")}</h3>
                          <button onClick={() => setShowProjection(!showProjection)}
                            className="text-xs text-accent-primary hover:underline flex items-center gap-1">
                            {showProjection ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {showProjection ? "ซ่อนตาราง" : "แสดงตารางรายปี"}
                          </button>
                        </div>

                        {/* Cumulative Cash Flow Chart */}
                        <div>
                          <h4 className="text-xs text-text-muted mb-2">{t("sa.r.cashFlowChart")}</h4>
                          <div className="flex items-end gap-0.5" style={{ height: 140 }}>
                            {result.yearlyProjection.map((y, i) => {
                              const maxAbs = Math.max(
                                Math.abs(Math.min(...result.yearlyProjection.map(p => p.cumulativeNetCashFlow))),
                                Math.abs(Math.max(...result.yearlyProjection.map(p => p.cumulativeNetCashFlow))),
                                1
                              );
                              const h = Math.abs(y.cumulativeNetCashFlow) / maxAbs * 50;
                              const isPositive = y.cumulativeNetCashFlow >= 0;
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end relative" style={{ height: "100%" }}>
                                  <div className="absolute bottom-[50%] left-0 right-0 flex justify-center">
                                    {isPositive && (
                                      <div className="w-full rounded-t-sm" style={{
                                        height: `${h}%`,
                                        backgroundColor: "var(--accent-primary)",
                                        opacity: 0.8,
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                      }} />
                                    )}
                                  </div>
                                  <div className="absolute top-[50%] left-0 right-0 flex justify-center">
                                    {!isPositive && (
                                      <div className="w-full rounded-b-sm" style={{
                                        height: `${h}%`,
                                        backgroundColor: "#ef4444",
                                        opacity: 0.6,
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                      }} />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="h-px bg-border-subtle my-0.5" />
                          <div className="flex gap-0.5">
                            {result.yearlyProjection.map((_, i) => (
                              <div key={i} className="flex-1 text-center">
                                <span className="text-[8px] text-text-muted">{(i + 1) % 5 === 0 ? i + 1 : ""}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-text-muted mt-1 text-center">ปีที่ — สีเขียว = กำไรสะสม, สีแดง = ยังไม่คืนทุน</p>
                        </div>

                        {/* Key milestones */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {(() => {
                            const breakeven = result.yearlyProjection.findIndex(y => y.cumulativeNetCashFlow >= 0) + 1;
                            const year10 = result.yearlyProjection[9];
                            const year15 = result.yearlyProjection[14];
                            const year25 = result.yearlyProjection[24];
                            return (
                              <>
                                <MetricCard label="จุดคุ้มทุน" value={breakeven > 0 ? `ปีที่ ${breakeven}` : "N/A"} icon={Target} accent />
                                <MetricCard label="กำไรสะสม ปี 10" value={(year10?.cumulativeNetCashFlow / 1000000).toFixed(1)} unit="ล้านบาท" icon={TrendingUp} />
                                <MetricCard label="กำไรสะสม ปี 15" value={(year15?.cumulativeNetCashFlow / 1000000).toFixed(1)} unit="ล้านบาท" icon={TrendingUp} />
                                <MetricCard label="กำไรสะสม ปี 25" value={(year25?.cumulativeNetCashFlow / 1000000).toFixed(1)} unit="ล้านบาท" icon={TrendingUp} accent />
                              </>
                            );
                          })()}
                        </div>

                        {/* Yearly Table */}
                        {showProjection && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-border-subtle">
                                  <th className="py-2 px-2 text-left text-text-muted">{t("sa.r.tblYear")}</th>
                                  <th className="py-2 px-2 text-right text-text-muted">{t("sa.r.tblProd")}</th>
                                  <th className="py-2 px-2 text-right text-text-muted">{t("sa.r.tblRate")}</th>
                                  <th className="py-2 px-2 text-right text-text-muted">{t("sa.r.tblSavings")}</th>
                                  <th className="py-2 px-2 text-right text-text-muted">{t("sa.r.tblMaint")}</th>
                                  <th className="py-2 px-2 text-right text-text-muted">{t("sa.r.tblNetProfit")}</th>
                                  <th className="py-2 px-2 text-right text-text-muted">{t("sa.r.tblCumulative")}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.yearlyProjection.map((y) => (
                                  <tr key={y.year} className={`border-b border-border-subtle/30 ${y.cumulativeNetCashFlow >= 0 ? "" : "opacity-70"}`}>
                                    <td className="py-1.5 px-2 text-foreground font-medium">{y.year}</td>
                                    <td className="py-1.5 px-2 text-right text-foreground">{y.production.toLocaleString()}</td>
                                    <td className="py-1.5 px-2 text-right text-foreground">{y.electricityRate}</td>
                                    <td className="py-1.5 px-2 text-right text-accent-primary">{y.savings.toLocaleString()}</td>
                                    <td className="py-1.5 px-2 text-right text-red-400">{y.maintenanceCost.toLocaleString()}</td>
                                    <td className="py-1.5 px-2 text-right text-foreground">{y.netCashFlow.toLocaleString()}</td>
                                    <td className={`py-1.5 px-2 text-right font-semibold ${y.cumulativeNetCashFlow >= 0 ? "text-accent-primary" : "text-red-400"}`}>
                                      {y.cumulativeNetCashFlow.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </motion.div>
                        )}

                        <p className="text-xs text-text-muted">
                          * สมมติฐาน: ค่าไฟเพิ่ม {ELECTRICITY_ESCALATION * 100}%/ปี, degradation ปีแรก {YEAR1_DEGRADATION * 100}% หลังจากนั้น {ANNUAL_DEGRADATION * 100}%/ปี,
                          เปลี่ยนอินเวอร์เตอร์ปีที่ {INVERTER_REPLACEMENT_YEAR}, ค่าบำรุง {MAINTENANCE_COST_PER_KWP} บาท/kWp/ปี + ประกัน {INSURANCE_RATE * 100}%/ปี
                        </p>
                      </div>
                    )}

                    {/* ── CTA Section ── */}
                    <div className="mt-8 pt-6 border-t border-border-subtle">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Link href={`/contact?system=${result.actualKwp}kWp${result.bessCapacityKwh > 0 ? `+BESS${result.bessCapacityKwh}kWh` : ""}&type=${input.businessType}&bill=${input.monthlyBill}`}
                          className="flex items-center justify-center gap-2 btn-accent px-6 py-4 rounded-xl text-base font-semibold">
                          <Phone className="w-5 h-5" />
                          ขอใบเสนอราคาจริง
                        </Link>
                        <button onClick={() => {
                          const text = getResultSummary();
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(text);
                            toast.success(t("sa.cta.copied"));
                          }
                        }}
                          className="flex items-center justify-center gap-2 btn-accent-outline px-6 py-4 rounded-xl text-base font-semibold">
                          <FileText className="w-5 h-5" />
                          คัดลอกผลวิเคราะห์
                        </button>
                      </div>
                      <p className="text-xs text-text-muted text-center mt-4">
                        ผลคำนวณเป็นการประมาณการเบื้องต้น — ตัวเลขจริงอาจแตกต่างตามสภาพหน้างาน
                        ทีมวิศวกร SIRINX จะสำรวจหน้างานจริงเพื่อออกแบบระบบที่แม่นยำที่สุด
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              {step < 5 && (
                <div className="flex justify-between mt-8 pt-4 border-t border-border-subtle">
                  <button onClick={prevStep} disabled={step === 0}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      step === 0 ? "opacity-30 cursor-not-allowed text-text-muted" : "text-text-secondary hover:text-foreground hover:bg-surface-overlay"
                    }`}>
                    <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
                  </button>
                  <button onClick={nextStep} disabled={!canProceed}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      canProceed ? "btn-accent" : "opacity-30 cursor-not-allowed bg-surface-elevated text-text-muted"
                    }`}>
                    {step === 4 ? "ดูผลวิเคราะห์" : "ถัดไป"} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <section className="py-12 bg-background">
        <div className="container">
          <div className="max-w-3xl mx-auto p-6 rounded-xl border border-border-subtle bg-surface-elevated">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-text-muted mt-0.5 shrink-0" />
              <div className="text-xs text-text-muted space-y-2">
                <p className="font-semibold text-foreground text-sm">{t("sa.disclaimer.title")}</p>
                <p>{t("sa.disclaimer.p1")}</p>
                <p>{t("sa.disclaimer.p2")}</p>
                <p>{t("sa.disclaimer.p3")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10">
        <div className="container text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4">
            พร้อมเริ่มต้นโครงการโซลาร์เซลล์?
          </h2>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            {t("sa.final.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-accent px-8 py-4 rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" /> นัดสำรวจหน้างานฟรี
            </Link>
            <Link href="/partner" className="btn-accent-outline px-8 py-4 rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2">
              สนใจเป็นพันธมิตร <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
