import assert from "node:assert/strict";
import test from "node:test";

import {
  ALLOWLIST_PATH,
  evaluate,
  extractHosts,
  isPlaceholderHost,
  loadAllowlist,
  runGuard,
  scan,
  validateAllowlist,
} from "./verify-public-web-egress.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function baseAllowlist(hosts) {
  return { schema: "public-web.egress.allowlist.v1", updated: "2026-10-21", hosts };
}

function occurrence(host, file = "apps/public-web/client/src/App.tsx") {
  return { host, file, line: 1, wildcard: false };
}

test("the checked-in allowlist is structurally valid", () => {
  const allowlist = loadAllowlist(repoRoot);
  assert.ok(allowlist.hosts.length > 0);
  assert.ok(allowlist.hosts.every((entry) => entry.reason.length >= 8));
});

test("extractHosts normalises case, wildcards, and keeps loopback", () => {
  const hosts = extractHosts(
    'a https://WWW.Sirinx.CO/x b https://*.sirinx-co.pages.dev/assets c http://localhost:9005 d "no-host"'
  ).map((entry) => entry.host);
  assert.deepEqual(hosts, ["www.sirinx.co", "sirinx-co.pages.dev", "localhost"]);
});

test("reserved hosts are placeholders and their subdomains cannot be waived", () => {
  assert.equal(isPlaceholderHost("cdn.example.com"), true);
  assert.equal(isPlaceholderHost("example.com"), true);
  assert.equal(isPlaceholderHost("your-cdn.com"), true);
  assert.equal(isPlaceholderHost("www.sirinx.co"), false);

  const allowlist = validateAllowlist(
    baseAllowlist([{ host: "cdn.example.com", class: "navigation-link", reason: "attempted waiver" }])
  );
  const result = evaluate({ occurrences: [occurrence("cdn.example.com")], allowlist });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "placeholder_host");
});

test("documentation class is only valid for the bare example.* hosts", () => {
  assert.throws(
    () => validateAllowlist(baseAllowlist([{ host: "cdn.example.com", class: "documentation", reason: "sneaky doc host" }])),
    /documentation class/
  );
  const allowlist = validateAllowlist(baseAllowlist([{ host: "example.com", class: "documentation", reason: "jsdoc only" }]));
  const result = evaluate({ occurrences: [occurrence("example.com")], allowlist });
  assert.equal(result.ok, true);
});

test("placeholder usage inside a scaffold brand is a warning, not an error", () => {
  const allowlist = validateAllowlist(
    baseAllowlist([{ host: "your-cdn.com", class: "template-scaffold", reason: "scaffold brand" }])
  );
  const result = evaluate({
    occurrences: [occurrence("your-cdn.com", "apps/public-web/brands/_template/config.ts")],
    allowlist,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(
    result.warnings.map((warning) => warning.code),
    ["placeholder_host_scaffold"]
  );
});

test("an unknown host fails the guard", () => {
  const allowlist = validateAllowlist(baseAllowlist([{ host: "www.sirinx.co", class: "own-origin", reason: "own site" }]));
  const result = evaluate({ occurrences: [occurrence("evil-cdn.test-host.net")], allowlist });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "unknown_host");
  assert.equal(result.warnings.some((warning) => warning.code === "stale_allowlist_entry"), true);
});

test("a third-party fetch needs a waiver; a waiver only warns", () => {
  const withoutWaiver = validateAllowlist(
    baseAllowlist([{ host: "images.example-cdn.net", class: "third-party-asset", reason: "stock photo host" }])
  );
  const failed = evaluate({ occurrences: [occurrence("images.example-cdn.net")], allowlist: withoutWaiver });
  assert.equal(failed.ok, false);
  assert.equal(failed.errors[0].code, "third_party_without_waiver");

  const withWaiver = validateAllowlist(
    baseAllowlist([
      {
        host: "images.example-cdn.net",
        class: "third-party-asset",
        reason: "stock photo host",
        waiver: { ticket: "C8", until: "2026-11-30" },
      },
    ])
  );
  const passed = evaluate({ occurrences: [occurrence("images.example-cdn.net")], allowlist: withWaiver });
  assert.equal(passed.ok, true);
  assert.equal(passed.warnings[0].code, "waived_third_party");
});

test("subdomains entries cover wildcard and nested hosts", () => {
  const allowlist = validateAllowlist(
    baseAllowlist([{ host: "cloudflareinsights.com", class: "own-infra", reason: "beacon origin", subdomains: true }])
  );
  const result = evaluate({
    occurrences: [occurrence("static.cloudflareinsights.com"), { ...occurrence("cloudflareinsights.com"), wildcard: true }],
    allowlist,
  });
  assert.equal(result.ok, true);
});

test("allowlist validation rejects duplicates, unknown classes, and misplaced waivers", () => {
  assert.throws(
    () =>
      validateAllowlist(
        baseAllowlist([
          { host: "www.sirinx.co", class: "own-origin", reason: "own site" },
          { host: "www.sirinx.co", class: "own-origin", reason: "own site" },
        ])
      ),
    /duplicate host/
  );
  assert.throws(
    () => validateAllowlist(baseAllowlist([{ host: "www.sirinx.co", class: "wild-west", reason: "own site" }])),
    /unknown class/
  );
  assert.throws(
    () => validateAllowlist(baseAllowlist([{ host: "www.sirinx.co", class: "placeholder", reason: "own site" }])),
    /may not use class placeholder/
  );
  assert.throws(
    () =>
      validateAllowlist(
        baseAllowlist([
          {
            host: "line.me",
            class: "navigation-link",
            reason: "chat link",
            waiver: { ticket: "C8", until: "2026-11-30" },
          },
        ])
      ),
    /only meaningful on a fetch class/
  );
  assert.throws(
    () =>
      validateAllowlist(
        baseAllowlist([{ host: "images.example-cdn.net", class: "third-party-asset", reason: "photo host", waiver: { ticket: "" } }])
      ),
    /waiver needs a ticket/
  );
});

test("the real repository is clean on the source surface", () => {
  const result = runGuard({ root: repoRoot });
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.ok(result.occurrences > 0);
  assert.equal(result.surfaces.includes("apps/public-web/client/public"), true);
});

test("--dist widens the scan to the shipped bundle", () => {
  const source = scan(repoRoot);
  const withDist = scan(repoRoot, { includeDist: true });
  assert.ok(withDist.files.length >= source.files.length);
  if (withDist.files.length === source.files.length) return; // no dist built on this host
  assert.ok(withDist.occurrences.length > source.occurrences.length);
  assert.equal(
    withDist.occurrences.some((entry) => entry.file.startsWith("apps/public-web/dist/")),
    true
  );
});

test("allowlist path is the documented one", () => {
  assert.equal(ALLOWLIST_PATH, "config/public-web/egress.allowlist.v1.json");
});
