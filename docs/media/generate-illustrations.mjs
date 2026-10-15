#!/usr/bin/env node
/**
 * generate-illustrations.mjs — Media generation pipeline
 *
 * Modes:
 *   (default)          DRY-RUN. Prints the plan, writes dry-run-plan.json.
 *                      Zero network, zero cost, no credential read.
 *   --execute          Calls the provider. Requires ALL of:
 *                        APPROVE_PAID_IMAGE_PROVIDER_CALL=1   named gate
 *                        --budget-usd <number>                hard ceiling
 *                        OPENAI_API_KEY and/or GEMINI_API_KEY in the environment
 *                      and every selected slot to have a published per-image price.
 *
 * Rules:
 * - Fails closed. Every guard in lib/guards.mjs runs before any network call.
 * - Reads credentials from the environment at call time only, and never logs them.
 * - Writes exclusively into .media-staging/_quarantine/, with containment asserted.
 * - Writes a sha256 manifest pairing every file with prompt, model, dimensions,
 *   price tier, byte count, digest and timestamp.
 *
 * HISTORY — 2026-09-28, R30. The previous version of this file ended --execute with an
 * unconditional `process.exit(1)` and contained no `process.env` reference anywhere. It
 * looked like a working safety gate; it was an unimplemented feature wearing a gate's
 * clothes. Approving APPROVE_PAID_IMAGE_PROVIDER_CALL would have produced the identical
 * refusal and zero images. The executor below is real, and the guards in front of it are
 * tested by lib/selftest.mjs.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  GATES,
  PipelineRefusal,
  assertGate,
  resolveKey,
  keyNameForModel,
  assertInsideQuarantine,
  assertWithinBudget,
  priceTierFor,
  sha256,
  scrub,
} from "./lib/guards.mjs";
import { generateImage } from "./lib/providers.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, "../..");
const QUARANTINE_DIR = resolve(REPO_ROOT, ".media-staging/_quarantine");

// Every line printed passes through scrub(), so a credential can never reach stdout
// even if a future edit puts one into a string.
const say = (line) => console.log(scrub(line, process.env));
const warn = (line) => console.error(scrub(line, process.env));

// ── Slot selection ────────────────────────────────────────────────────────────
// The selection is read from the catalog-approved slots in the bound prompt file, so
// the pipeline can never disagree with the justification that authorises the spend.
// One source of truth; drift is a load-time error.
const BOUND_PROMPTS_PATH = resolve(REPO_ROOT, "docs/media/prompts/prompts-bound-20260928.json");

// Exactly the three slots justified in IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md §2c.
// Do not add a slot here without adding its justification there first.
const APPROVED_SLOT_IDS = [
  "engineering-exploded-structure", // /solar-carport — no photo or 3D equivalent exists
  "national-yield-telemetry-hologram", // /strategy    — renders the real 77-province dataset
  "bess-industrial-storage", // /solutions  — no site photo of a BESS container
];

function loadApprovedPrompts() {
  if (!existsSync(BOUND_PROMPTS_PATH)) {
    throw new PipelineRefusal(
      "PROMPTS_MISSING",
      `Bound prompt file not found: ${BOUND_PROMPTS_PATH}\n` +
        `The pipeline will not fall back to an unvetted prompt list.`,
    );
  }
  const raw = JSON.parse(readFileSync(BOUND_PROMPTS_PATH, "utf8"));
  const items = Array.isArray(raw) ? raw : (raw.prompts ?? raw.items ?? Object.values(raw)[0]);

  const missing = APPROVED_SLOT_IDS.filter(
    (id) => !Array.isArray(items) || !items.some((p) => p && p.id === id),
  );
  if (missing.length) {
    throw new PipelineRefusal(
      "SLOT_MISSING",
      `Catalog-approved slots are absent from the bound prompt file: ${missing.join(", ")}\n` +
        `Refusing to generate a substitute. Re-run docs/media/prompts/build-from-real-data.mjs.`,
    );
  }

  return APPROVED_SLOT_IDS.map((id) => {
    const p = items.find((x) => x.id === id);
    return {
      id: p.id,
      route: String(p.route ?? "").split("(")[0].trim(),
      model: p.model,
      dimensions: p.dimensions,
      prompt: p.prompt,
      disclaimer: p.disclaimer,
    };
  });
}

function parseArgs(argv) {
  const out = { execute: false, budgetUsd: undefined, only: [], caps: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--execute") out.execute = true;
    else if (a === "--budget-usd") out.budgetUsd = Number(argv[++i]);
    else if (a === "--slot") out.only.push(argv[++i]);
    else if (a === "--dry-run") out.execute = false;
    else if (a === "--unpriced-cap") {
      // --unpriced-cap <slot-id>=<usd>
      const [slotId, usd] = String(argv[++i] ?? "").split("=");
      const value = Number(usd);
      if (!slotId || !Number.isFinite(value) || value <= 0) {
        throw new PipelineRefusal(
          "CAP_MALFORMED",
          `--unpriced-cap expects <slot-id>=<usd>, e.g. engineering-exploded-structure=1.00`,
        );
      }
      out.caps[slotId] = value;
    }
  }
  return out;
}

function banner(mode) {
  say("════════════════════════════════════════════════════════════════════");
  say(`  SIRINX MEDIA GENERATION PIPELINE  [${mode}]`);
  say("════════════════════════════════════════════════════════════════════");
}

function writePlan(manifest, extra) {
  if (!existsSync(QUARANTINE_DIR)) mkdirSync(QUARANTINE_DIR, { recursive: true });
  const planPath = assertInsideQuarantine(join(QUARANTINE_DIR, "dry-run-plan.json"), QUARANTINE_DIR);
  writeFileSync(
    planPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        mode: "DRY_RUN",
        safetyGateRequiredToExecute: GATES.paidImageProviderCall,
        ...extra,
        manifest,
      },
      null,
      2,
    ),
  );
  say(`[PASS] Dry-run plan written to ${planPath}`);
}

async function execute(slots, budgetUsd, caps) {
  // 1. Named gate. Exact string "1", nothing else counts.
  assertGate(process.env, GATES.paidImageProviderCall);

  // 2. Budget, computed and checked BEFORE any credential is read or any call made.
  const plan = assertWithinBudget(slots, budgetUsd, caps);
  say(`Budget check passed: $${plan.projectedUsd.toFixed(4)} projected across ${plan.slotCount} slot(s), ceiling $${budgetUsd}.`);

  if (!existsSync(QUARANTINE_DIR)) mkdirSync(QUARANTINE_DIR, { recursive: true });

  const results = [];
  let spent = 0;

  for (const slot of slots) {
    const keyName = keyNameForModel(slot.model);
    if (!keyName) {
      throw new PipelineRefusal("MODEL_UNSUPPORTED", `No client for model id: ${slot.model}`);
    }
    const apiKey = resolveKey(process.env, keyName); // never logged
    const tier = priceTierFor(slot.model, slot.dimensions);
    const charged = tier?.usd ?? caps[slot.id] ?? 0;

    say(`→ ${slot.id}  (${slot.model} ${slot.dimensions}, ceiling $${charged.toFixed(4)})`);

    const { bytes, revisedPrompt, mimeType } = await generateImage({
      apiKey,
      model: slot.model,
      prompt: slot.prompt,
      size: slot.dimensions,
    });

    const ext = (mimeType ?? "").includes("jpeg") ? "jpg" : "png";
    const filename = `${slot.id}.${ext}`;
    const target = assertInsideQuarantine(join(QUARANTINE_DIR, filename), QUARANTINE_DIR);
    writeFileSync(target, bytes);

    const digest = sha256(bytes);
    spent += charged;
    say(`   wrote ${filename}  ${bytes.length} B  sha256:${digest.slice(0, 16)}…`);

    results.push({
      id: slot.id,
      route: slot.route,
      model: slot.model,
      dimensions: slot.dimensions,
      file: filename,
      bytes: bytes.length,
      sha256: digest,
      mimeType: mimeType ?? "image/png",
      priceTier: tier?.key ?? `manual-cap:${caps[slot.id]}`,
      costUsdCeiling: charged,
      revisedPrompt: revisedPrompt ?? null,
      prompt: slot.prompt,
      disclaimer: slot.disclaimer,
      generatedAt: new Date().toISOString(),
    });
  }

  const manifestPath = assertInsideQuarantine(
    join(QUARANTINE_DIR, "generated-manifest.json"),
    QUARANTINE_DIR,
  );
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        budgetCeilingUsd: budgetUsd,
        projectedUsd: plan.projectedUsd,
        gate: GATES.paidImageProviderCall,
        files: results,
      },
      null,
      2,
    ),
  );

  say("");
  say(`[DONE] ${results.length} image(s) into ${QUARANTINE_DIR}`);
  say(`Spent at most $${spent.toFixed(4)} of a $${budgetUsd} ceiling.`);
  say(`Manifest: ${manifestPath}`);
  say("");
  say("These files are QUARANTINED. They are not on the site.");
  say(`Promoting them into client/public/ is a separate gate: ${GATES.mediaPromoteToPublic}`);
}

function main() {
  let args;
  let manifest;
  try {
    // parseArgs can refuse (a malformed --unpriced-cap), so it belongs inside the
    // same handler. Leaving it outside meant a typo in a flag produced an unhandled
    // rejection instead of the clean ⛔ [CODE] the operator expects.
    args = parseArgs(process.argv.slice(2));
    const approved = loadApprovedPrompts();
    manifest = args.only.length
      ? approved.filter((p) => args.only.includes(p.id))
      : approved;
    if (args.only.length && manifest.length !== args.only.length) {
      throw new PipelineRefusal(
        "SLOT_UNKNOWN",
        `Unknown slot id. Approved slots: ${APPROVED_SLOT_IDS.join(", ")}`,
      );
    }
  } catch (err) {
    if (err instanceof PipelineRefusal) {
      warn(`⛔ [${err.code}]`);
      warn(err.message);
      process.exit(1);
    }
    throw err;
  }

  if (!args.execute) {
    banner("DRY-RUN");
    say("Zero provider calls will be dispatched. No cost incurred.");
    say(`Planned staging directory: ${QUARANTINE_DIR}\n`);
    say(`Found ${manifest.length} prompt package(s) scheduled:`);
    manifest.forEach((p, i) => {
      const tier = priceTierFor(p.model, p.dimensions);
      const price = tier ? `~$${tier.usd.toFixed(4)} (${tier.key})` : "NO PUBLISHED PRICE — unbudgetable";
      say(`  ${i + 1}. [${p.id}] -> ${p.route}`);
      say(`     model: ${p.model} ${p.dimensions}   price: ${price}`);
      say(`     disclaimer: "${p.disclaimer}"`);
      say(`     prompt: ${p.prompt.slice(0, 110)}...\n`);
    });
    writePlan(manifest, { totalPrompts: manifest.length });
    say(`To execute, set ${GATES.paidImageProviderCall}=1 and pass --budget-usd <number>.`);
    return;
  }

  banner("EXECUTE");
  execute(manifest, args.budgetUsd, args.caps).catch((err) => {
    if (err instanceof PipelineRefusal) {
      warn(`⛔ [${err.code}]`);
      warn(err.message);
      process.exit(1);
    }
    warn(`Provider call failed: ${err?.message ?? err}`);
    warn("No manifest was written for this run. Check the partial files in the quarantine before retrying.");
    process.exit(1);
  });
}

main();
