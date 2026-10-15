/**
 * guards.mjs — pure, network-free safety functions for the media pipeline.
 *
 * Every one of these is importable and testable without a key, without a network, and
 * without spending money. That is deliberate: the properties that must hold before a
 * paid call are exactly the ones nobody can check by reading the happy path.
 *
 * No function here reads a secret. resolveKey() returns the value to the CALLER and the
 * caller must not log it; nothing in this file formats, prints, or hashes a key.
 */

import { createHash } from "node:crypto";
import { resolve, sep } from "node:path";

/** Named gates. Each must be set in the environment to its exact value "1". */
export const GATES = {
  paidImageProviderCall: "APPROVE_PAID_IMAGE_PROVIDER_CALL",
  mediaPromoteToPublic: "APPROVE_MEDIA_PROMOTE_TO_PUBLIC",
};

export class PipelineRefusal extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PipelineRefusal";
    this.code = code;
  }
}

/**
 * A gate is satisfied only when the named variable is present AND exactly "1".
 *
 * A blanket approval is not an approval: any other value, including "true", "yes",
 * "ALL", or "1; rm -rf /", is a refusal. This is the rule from AGENTS.md §3 encoded
 * where it can be tested.
 */
export function isGateSatisfied(env, gateName) {
  return Object.prototype.hasOwnProperty.call(env, gateName) && env[gateName] === "1";
}

export function assertGate(env, gateName) {
  if (!isGateSatisfied(env, gateName)) {
    throw new PipelineRefusal(
      "GATE_MISSING",
      `Refusing to proceed. Required gate not satisfied: ${gateName}\n` +
        `Set ${gateName}=1 in the environment to approve this specific action.\n` +
        `Approving everything is not an approval of this item.`,
    );
  }
}

/**
 * Read a credential at call time. Throws if absent.
 * The returned value is the caller's to use and must never be logged.
 */
export function resolveKey(env, name) {
  const value = env[name];
  if (!value || typeof value !== "string" || value.trim() === "") {
    throw new PipelineRefusal(
      "KEY_MISSING",
      `Credential not present in the environment: ${name}\n` +
        `Nothing was read from disk. Export ${name} in the shell that runs the pipeline.`,
    );
  }
  return value.trim();
}

/** Which env var holds the key for a given model id. */
export function keyNameForModel(model) {
  if (model.startsWith("gpt-image") || model.startsWith("dall-e")) return "OPENAI_API_KEY";
  if (model.startsWith("gemini")) return "GEMINI_API_KEY";
  return null;
}

/**
 * Containment check. A generated file may only be written inside the quarantine.
 *
 * Uses resolve() then a separator-terminated prefix test so that a sibling directory
 * with the quarantine as a string prefix (…/_quarantine_backup) cannot pass.
 */
export function assertInsideQuarantine(candidatePath, quarantineDir) {
  const root = resolve(quarantineDir);
  const target = resolve(candidatePath);
  if (target !== root && !target.startsWith(root + sep)) {
    throw new PipelineRefusal(
      "PATH_ESCAPE",
      `Refusing to write outside the quarantine.\n  target:      ${target}\n  quarantine:  ${root}`,
    );
  }
  return target;
}

/**
 * Per-image cost ceiling, in USD, from published provider prices.
 *
 * Only returns a number for prices read from the provider's own pricing page. Anything
 * not in this table returns null, and the caller must treat null as "unbudgeted" and
 * refuse — an invented price is worse than an absent one.
 *
 * Sources, fetched 2026-09-28:
 *   OpenAI  developers.openai.com/api/docs/pricing  — publishes token rates only, no
 *           per-image figure, so gpt-image-2 is deliberately ABSENT from this table.
 *   Google  ai.google.dev/gemini-api/docs/pricing
 *           gemini-3.1-flash-image output images are $60.00 per 1M image tokens.
 *           1K (1024x1024) consumes 1120 tokens -> $0.0672; 2K consumes 1680 -> $0.1008.
 */
export const PUBLISHED_IMAGE_PRICES_USD = {
  // model, per-image USD, tier label
  "gemini-3.1-flash-image:1K": 0.0672,
  "gemini-3.1-flash-image:2K": 0.1008,
};

/**
 * Determine the price tier for a requested size string.
 * Anything that is not a clean 1K or 2K request returns null (unbudgeted).
 */
export function priceTierFor(model, dimensions) {
  const m = String(dimensions ?? "").match(/^(\d+)x(\d+)$/);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  const long = Math.max(w, h);
  let tier = null;
  if (long >= 1024 && long <= 1024) tier = "1K";
  else if (long >= 1536 && long <= 2048) tier = "2K";
  else return null;
  const key = `${model}:${tier}`;
  return PUBLISHED_IMAGE_PRICES_USD[key] != null ? { key, usd: PUBLISHED_IMAGE_PRICES_USD[key] } : null;
}

/**
 * Compute the projected spend and refuse if it is unknown or over budget.
 * A budget is a ceiling the caller sets; it is never inferred.
 *
 * `manualCaps` lets a caller price a model that publishes no per-image figure, by
 * stating their own ceiling per slot id. This is the ONLY way to spend on a model
 * without a published price, it must be given explicitly per slot, and it is still
 * checked against the overall ceiling. OpenAI publishes token rates and no per-image
 * figure, so gpt-image-2 is unbudgetable without one of these.
 */
export function assertWithinBudget(slots, budgetUsd, manualCaps = {}) {
  const unpriced = [];
  let total = 0;
  for (const slot of slots) {
    const price = priceTierFor(slot.model, slot.dimensions);
    if (price) {
      total += price.usd;
      continue;
    }
    const manual = manualCaps[slot.id];
    if (typeof manual === "number" && Number.isFinite(manual) && manual > 0) {
      total += manual;
      continue;
    }
    unpriced.push(`${slot.id} (${slot.model} ${slot.dimensions})`);
  }
  if (unpriced.length) {
    throw new PipelineRefusal(
      "PRICE_UNKNOWN",
      `Refusing to spend against an unknown price.\n` +
        `No published per-image figure for:\n  ${unpriced.join("\n  ")}\n` +
        `If you accept an unknown price for a slot, state a hard per-image cap for it:\n` +
        `  --unpriced-cap <slot-id>=<usd>\n` +
        `That cap is your ceiling, not a quote, and it is still checked against --budget-usd.`,
    );
  }
  if (!(typeof budgetUsd === "number" && Number.isFinite(budgetUsd))) {
    throw new PipelineRefusal(
      "BUDGET_MISSING",
      `Refusing to spend without an explicit budget ceiling. Pass --budget-usd <number>.`,
    );
  }
  if (total > budgetUsd) {
    throw new PipelineRefusal(
      "BUDGET_EXCEEDED",
      `Projected spend $${total.toFixed(4)} exceeds the ceiling $${budgetUsd.toFixed(4)}. ` +
        `No provider call was made.`,
    );
  }
  return { projectedUsd: total, slotCount: slots.length };
}

/** sha256 of a buffer, hex. Used for the manifest, never for a key. */
export function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * A last-ditch scrub before anything is written or printed.
 * If a credential value ever reaches a string that is about to be logged or persisted,
 * this replaces it. Defence in depth: the pipeline should never put a key in a string
 * at all, and this catches the day somebody adds a debug line.
 */
export function scrub(text, env) {
  let out = String(text);
  for (const name of Object.keys(env ?? {})) {
    if (!/(KEY|TOKEN|SECRET|PASSWORD)$/.test(name)) continue;
    const value = env[name];
    if (typeof value === "string" && value.length >= 8) {
      out = out.split(value).join(`[REDACTED:${name}]`);
    }
  }
  return out;
}
