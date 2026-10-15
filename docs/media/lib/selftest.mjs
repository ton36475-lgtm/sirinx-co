/**
 * selftest.mjs — proves the pipeline's safety properties with no key, no network,
 * and no spend. Run: node docs/media/lib/selftest.mjs
 *
 * These are the checks that matter before money moves. A pipeline that only has a
 * happy-path test has not been tested for the thing that would hurt.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import {
  GATES,
  PipelineRefusal,
  isGateSatisfied,
  assertGate,
  resolveKey,
  keyNameForModel,
  assertInsideQuarantine,
  priceTierFor,
  assertWithinBudget,
  sha256,
  scrub,
} from "./guards.mjs";

const GATE = GATES.paidImageProviderCall;

test("a gate is satisfied only by the exact string '1'", () => {
  assert.equal(isGateSatisfied({ [GATE]: "1" }, GATE), true);
  for (const bad of ["true", "yes", "TRUE", "0", "", " all ", "1 1", "on", "approved"]) {
    assert.equal(isGateSatisfied({ [GATE]: bad }, GATE), false, `should refuse ${JSON.stringify(bad)}`);
  }
  assert.equal(isGateSatisfied({}, GATE), false);
});

test("a blanket approval does not satisfy a specific gate", () => {
  const env = { APPROVE_EVERYTHING: "1", APPROVED: "1", ALL: "1" };
  assert.throws(() => assertGate(env, GATE), (e) => e instanceof PipelineRefusal && e.code === "GATE_MISSING");
});

test("a missing credential is a refusal that names the variable, not its value", () => {
  assert.throws(
    () => resolveKey({}, "GEMINI_API_KEY"),
    (e) => e instanceof PipelineRefusal && e.code === "KEY_MISSING" && /GEMINI_API_KEY/.test(e.message),
  );
  assert.throws(() => resolveKey({ GEMINI_API_KEY: "   " }, "GEMINI_API_KEY"), /GEMINI_API_KEY/);
});

test("resolveKey returns the value only when present, and never echoes it", () => {
  const secret = "test-123abc"; // replaced sensitive test secret
  const out = resolveKey({ GEMINI_API_KEY: secret }, "GEMINI_API_KEY");
  assert.equal(out, secret);
  try {
    resolveKey({}, "GEMINI_API_KEY");
  } catch (e) {
    assert.ok(!e.message.includes(secret));
  }
});

test("model ids map to the right credential", () => {
  assert.equal(keyNameForModel("gpt-image-2"), "OPENAI_API_KEY");
  assert.equal(keyNameForModel("gemini-3.1-flash-image"), "GEMINI_API_KEY");
  assert.equal(keyNameForModel("stable-diffusion-9"), null);
});

test("writes are confined to the quarantine, including sibling-prefix attacks", () => {
  const q = "/repo/.media-staging/_quarantine";
  assert.ok(assertInsideQuarantine(resolve(q, "a.png"), q).endsWith("a.png"));
  assert.ok(assertInsideQuarantine(resolve(q, "sub/b.png"), q).endsWith("b.png"));

  for (const escape of [
    "/repo/.media-staging/_quarantine_backup/a.png", // sibling with the same prefix
    "/repo/apps/public-web/client/public/provinces/a.png",
    "/repo/.media-staging/a.png", // parent
    "/etc/passwd",
  ]) {
    assert.throws(
      () => assertInsideQuarantine(escape, q),
      (e) => e instanceof PipelineRefusal && e.code === "PATH_ESCAPE",
      `should refuse ${escape}`,
    );
  }
});

test("only models with a published per-image price are budgetable", () => {
  assert.equal(priceTierFor("gemini-3.1-flash-image", "1024x1024")?.usd, 0.0672);
  assert.equal(priceTierFor("gemini-3.1-flash-image", "1792x1024")?.usd, 0.1008);
  // OpenAI publishes token rates, not a per-image figure. It is unbudgetable, on purpose.
  assert.equal(priceTierFor("gpt-image-2", "1024x1024"), null);
  assert.equal(priceTierFor("gemini-3.1-flash-image", "not-a-size"), null);
});

test("spend is refused when any slot has no published price", () => {
  const slots = [
    { id: "a", model: "gemini-3.1-flash-image", dimensions: "1536x1024" },
    { id: "b", model: "gpt-image-2", dimensions: "1024x1024" },
  ];
  assert.throws(
    () => assertWithinBudget(slots, 10),
    (e) => e instanceof PipelineRefusal && e.code === "PRICE_UNKNOWN",
  );
});

test("spend is refused without an explicit ceiling", () => {
  const slots = [{ id: "a", model: "gemini-3.1-flash-image", dimensions: "1536x1024" }];
  // Assert on the refusal CODE, not the message text. The first version of this test
  // matched the string "BUDGET_MISSING" against the message and failed against correct
  // behaviour, because the code lives in .code and the message is prose.
  for (const bad of [undefined, null, NaN, Infinity, "1"]) {
    assert.throws(
      () => assertWithinBudget(slots, bad),
      (e) => e instanceof PipelineRefusal && e.code === "BUDGET_MISSING",
      `should refuse ${String(bad)} as a missing ceiling`,
    );
  }
  // A ceiling of 0 is a real ceiling, and this projection is above it.
  assert.throws(
    () => assertWithinBudget(slots, 0),
    (e) => e instanceof PipelineRefusal && e.code === "BUDGET_EXCEEDED",
  );
});

test("spend is refused when the projection exceeds the ceiling, before any call", () => {
  const slots = [
    { id: "a", model: "gemini-3.1-flash-image", dimensions: "1536x1024" },
    { id: "b", model: "gemini-3.1-flash-image", dimensions: "1536x1024" },
  ];
  const plan = assertWithinBudget(slots, 0.25);
  assert.equal(plan.slotCount, 2);
  assert.ok(Math.abs(plan.projectedUsd - 0.2016) < 1e-9);
  assert.throws(
    () => assertWithinBudget(slots, 0.1),
    (e) => e instanceof PipelineRefusal && e.code === "BUDGET_EXCEEDED",
  );
});

test("a manual per-slot cap makes an unpriced model budgetable, and only for that slot", () => {
  const slots = [
    { id: "gem", model: "gemini-3.1-flash-image", dimensions: "1536x1024" },
    { id: "oai", model: "gpt-image-2", dimensions: "1024x1024" },
  ];
  // Without a cap, the OpenAI slot makes the whole run unbudgetable.
  assert.throws(() => assertWithinBudget(slots, 10), (e) => e.code === "PRICE_UNKNOWN");

  // A cap for the right slot unblocks it, and the total is published + manual.
  const plan = assertWithinBudget(slots, 10, { oai: 1.0 });
  assert.ok(Math.abs(plan.projectedUsd - (0.1008 + 1.0)) < 1e-9);

  // A cap under the wrong slot id does not help.
  assert.throws(
    () => assertWithinBudget(slots, 10, { somethingElse: 1.0 }),
    (e) => e.code === "PRICE_UNKNOWN",
  );
  // Nonsense caps are not caps.
  for (const bad of [0, -1, NaN, Infinity, "1.00", null]) {
    assert.throws(() => assertWithinBudget(slots, 10, { oai: bad }), (e) => e.code === "PRICE_UNKNOWN");
  }
  // A manual cap is still bound by the overall ceiling.
  assert.throws(
    () => assertWithinBudget(slots, 0.5, { oai: 1.0 }),
    (e) => e.code === "BUDGET_EXCEEDED",
  );
});

test("a credential that reaches a log line is scrubbed", () => {
  const env = { OPENAI_API_KEY: "sk-live-1234567890abcdef" };
  const line = `about to call with key sk-live-1234567890abcdef oops`;
  const out = scrub(line, env);
  assert.ok(!out.includes("sk-live-1234567890abcdef"));
  assert.ok(out.includes("[REDACTED:OPENAI_API_KEY]"));
});

test("scrub does not mangle short or non-credential variables", () => {
  const env = { PATH: "/usr/bin", SHORT: "abc" };
  assert.equal(scrub("PATH=/usr/bin", env), "PATH=/usr/bin");
});

test("sha256 is stable and content-addressed", () => {
  const a = sha256(Buffer.from("sirinx"));
  assert.equal(a, sha256(Buffer.from("sirinx")));
  assert.notEqual(a, sha256(Buffer.from("sirinx ")));
  assert.match(a, /^[0-9a-f]{64}$/);
});
