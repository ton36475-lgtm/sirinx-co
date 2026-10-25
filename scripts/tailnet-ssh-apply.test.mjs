import { test } from "node:test";
import assert from "node:assert/strict";

import { applyRule, buildRule, summarize, DEFAULT_DST, DEFAULT_SRC, DEFAULT_USERS } from "./tailnet-ssh-apply.mjs";

const holdAndDelegate = {
  action: { holdAndDelegate: "https://unused/machine/ssh/action/$SRC_NODE_ID/to/$DST_NODE_ID?local_user=$LOCAL_USER" },
  principals: [{ nodeIP: "100.90.189.112" }, { nodeIP: "100.87.189.34" }],
};

const basePolicy = () => ({
  grants: [{ src: ["autogroup:member"], dst: ["tag:server"], ip: ["*"] }],
  ssh: [structuredClone(holdAndDelegate)],
  tests: [{ src: "autogroup:member", accept: ["tag:server:22"] }],
  autoApprovers: { routes: { "0.0.0.0/0": ["tag:exit"] } },
});

test("buildRule produces the pinned accept rule", () => {
  assert.deepEqual(buildRule(), {
    action: "accept",
    src: DEFAULT_SRC,
    dst: DEFAULT_DST,
    users: DEFAULT_USERS,
  });
});

test("buildRule rejects empty and non-string lists", () => {
  assert.throws(() => buildRule({ users: [] }), /users must be a non-empty list/);
  assert.throws(() => buildRule({ src: "100.90.189.112" }), /src must be a non-empty list/);
});

test("inserts the accept rule above the holdAndDelegate rule", () => {
  const policy = basePolicy();
  const plan = applyRule(policy, buildRule());

  assert.equal(plan.changed, true);
  assert.match(plan.reason, /inserted at the top/);
  assert.equal(plan.policy.ssh.length, 2);
  assert.equal(plan.policy.ssh[0].action, "accept");
  assert.deepEqual(plan.policy.ssh[0].src, DEFAULT_SRC);
  assert.deepEqual(plan.policy.ssh[0].dst, DEFAULT_DST);
  assert.deepEqual(plan.policy.ssh[1], holdAndDelegate);
});

test("creates the ssh array when the policy has none", () => {
  const plan = applyRule({ acls: [] }, buildRule());
  assert.equal(plan.changed, true);
  assert.equal(plan.policy.ssh.length, 1);
  assert.deepEqual(plan.policy.acls, []);
});

test("is idempotent: a second run changes nothing", () => {
  const first = applyRule(basePolicy(), buildRule());
  const second = applyRule(first.policy, buildRule());

  assert.equal(second.changed, false);
  assert.match(second.reason, /already present/);
  assert.deepEqual(second.policy, first.policy);
});

test("widens an existing accept rule for the same pair instead of duplicating it", () => {
  const narrow = applyRule(basePolicy(), buildRule({ users: ["autogroup:nonroot"] }));
  const widened = applyRule(narrow.policy, buildRule({ users: ["root", "autogroup:nonroot"] }));

  assert.equal(widened.changed, true);
  assert.match(widened.reason, /widened users \(\+root\)/);
  assert.equal(widened.policy.ssh.length, 2);
  assert.deepEqual(widened.policy.ssh[0].users, ["autogroup:nonroot", "root"]);
});

test("leaves every other policy key byte-identical", () => {
  const policy = basePolicy();
  const plan = applyRule(policy, buildRule());

  assert.deepEqual(plan.policy.grants, policy.grants);
  assert.deepEqual(plan.policy.tests, policy.tests);
  assert.deepEqual(plan.policy.autoApprovers, policy.autoApprovers);
});

test("does not mutate the input policy", () => {
  const policy = basePolicy();
  const snapshot = structuredClone(policy);
  applyRule(policy, buildRule());
  assert.deepEqual(policy, snapshot);
});

test("a different src/dst pair gets its own rule", () => {
  const plan = applyRule(basePolicy(), buildRule({ src: ["100.64.0.9"], dst: ["100.64.0.10"] }));
  assert.equal(plan.changed, true);
  assert.equal(plan.policy.ssh.length, 2);

  const again = applyRule(plan.policy, buildRule());
  assert.equal(again.changed, true, "the original pair is still missing");
  assert.equal(again.policy.ssh.length, 3);
});

test("rejects a policy that is not an object", () => {
  assert.throws(() => applyRule(null, buildRule()), /policy must be a JSON object/);
  assert.throws(() => applyRule([], buildRule()), /policy must be a JSON object/);
});

test("summarize reports rule shape without dumping principals", () => {
  const plan = applyRule(basePolicy(), buildRule());
  assert.deepEqual(summarize(plan.policy), [
    { action: "accept", src: 1, dst: 1, users: ["root", "autogroup:nonroot"] },
    { action: "holdAndDelegate", principals: 2 },
  ]);
});

test("a policy whose ssh entry is not an array is replaced, not merged", () => {
  const plan = applyRule({ ssh: null }, buildRule());
  assert.equal(plan.changed, true);
  assert.equal(plan.policy.ssh.length, 1);
});
