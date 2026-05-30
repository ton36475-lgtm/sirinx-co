#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

ROOT_DEFAULT="/c/Users/Ton36/OneDrive/เอกสาร/Playground/sirinx"
ROOT="${1:-$ROOT_DEFAULT}"
if [ ! -d "$ROOT" ]; then
  ROOT="$(pwd)"
fi
cd "$ROOT"

fail() {
  echo "VALIDATION_FAIL: $*" >&2
  exit 1
}

grep -Fq "Brand: SIRINX" governance/LOCKED_BUSINESS_FACTS.md || fail "locked brand fact missing"
grep -Fq "Slogan: Clean Tech • Smart Future" governance/LOCKED_BUSINESS_FACTS.md || fail "locked slogan fact missing"
grep -Fq "หยุดจ่ายค่าไฟทิ้งทิ้ง... แล้วเปลี่ยนหลังคาให้เป็นสินทรัพย์" governance/LOCKED_BUSINESS_FACTS.md || fail "locked Thai headline missing"
grep -Fq "เปลี่ยนค่าใช้จ่าย ให้เป็นการลงทุนที่สร้างผลตอบแทน" governance/LOCKED_BUSINESS_FACTS.md || fail "locked Thai footer missing"

grep -Fq "START: 125,000 THB + VAT 7% | AIKO 1U+ (5kW+) | Solis 5kW | Premium DC Cable 6 sqmm" governance/LOCKED_BUSINESS_FACTS.md || fail "START package truth drifted"
grep -Fq "PRO: 315,000 THB + VAT 7% | AIKO 1U+ (8kW+) Seamless Black | 6kW Hybrid | GSL ENERGY 16.08kWh" governance/LOCKED_BUSINESS_FACTS.md || fail "PRO package truth drifted"
grep -Fq "ENTERPRISE BESS: 4,990,000 THB + VAT 7% | 175kWp solar array | 125kW 3-Phase | Premium Liquid-Cooled BESS 261kWh" governance/LOCKED_BUSINESS_FACTS.md || fail "ENTERPRISE BESS package truth drifted"

grep -Fq "not package truth" governance/FIELD_VALIDATED_HARDWARE_CONTEXT.md || fail "field context boundary missing"
grep -Fq "validated project scenario and sales modeling target derived from specific assumptions, not a universal guaranteed outcome" governance/FIELD_VALIDATED_HARDWARE_CONTEXT.md || fail "required ROI scenario wording missing"
grep -Fq "no guaranteed ROI claims" docs/design/CLAUDE_DESIGN_WORKFLOW.md || fail "design-lane ROI guardrail missing"
grep -Fq "premium real-world imagery only" docs/design/CLAUDE_DESIGN_WORKFLOW.md || fail "design-lane Track Record media rule missing"
grep -Fq "Reject cartoon, anime, gacha, casino, betting" docs/design/DESIGN_PROTOTYPER_SYSTEM_PROMPT.md || fail "design aesthetic rejection missing"

echo "validate-sirinx-facts: ok"
