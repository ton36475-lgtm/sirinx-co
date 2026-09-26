import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://owner.invalid/", {
      headers: {
        accept: "text/html",
        "oai-authenticated-user-email": "owner@example.invalid",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the bilingual read-only command-center briefing", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*\blang=["']th["']/i);
  assert.match(html, /<title>GHOSTCLAW · Hermes V3 Command Center<\/title>/i);
  assert.match(html, /OWNER VIEW · READ ONLY/);
  assert.match(html, /มุมมองเจ้าของ · อ่านอย่างเดียว/);
  assert.match(html, /47 Ronin, one gated path/);
  assert.match(html, /Perception/);
  assert.match(html, /Analysis/);
  assert.match(html, /Decision/);
  assert.match(html, /Coordination/);
  assert.match(html, /Research advisory/);
  assert.match(html, /Held safety gates/);
  assert.match(html, /B1 \/ B2 completed/);
  assert.match(html, /Verified locally/);
  assert.match(html, /ตรวจสอบในเครื่องแล้ว/);
  assert.match(html, /18 JUL 2026 · SOURCE VERIFICATION/);
  assert.match(html, /Evidence before status/);
  assert.match(html, /No production writes/);
  assert.match(html, /Human decides last/);
  assert.match(
    html,
    /property=["']og:image["'][^>]+https:\/\/ghostclaw-hermes-command-center\.e-galli\.chatgpt\.site\/og\.png/i,
  );
  assert.match(html, /name=["']twitter:card["'][^>]+summary_large_image/i);
});

test("rendered HTML exposes no operational, network, or sensitive surface", async () => {
  const response = await render();
  const html = await response.text();

  const forbiddenPatterns = [
    /\blocalhost\b/i,
    /\b127\.0\.0\.1\b/,
    /\bURLSearchParams\b/,
    /[?&]api=/i,
    /\bfetch\s*\(/i,
    /<(?:a|button|form|input|textarea|select)\b/i,
    /\b(?:api[_ -]?key|access[_ -]?token|password|private key)\b/i,
    /\b(?:OpenRouter|Qwen|Ollama|Telegram|Supabase|Postgres|NATS|Cloudflare)\b/i,
    /\b(?:D1|R2)\b/,
    /(?:\/Users\/|\.env\b|raw logs?|repository inventory)/i,
    /appgprj_6a5568a3619c8191a82090559ec00b69/i,
    /codex-preview|react-loading-skeleton|_sites-preview/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(html, pattern);
  }

  const absoluteUrls = [...html.matchAll(/https?:\/\/[^\s"'<>]+/gi)].map(
    ([url]) => url.replaceAll("&amp;", "&").replace(/\\+$/, ""),
  );
  assert.ok(absoluteUrls.length >= 2);
  assert.deepEqual(
    new Set(absoluteUrls),
    new Set(["https://ghostclaw-hermes-command-center.e-galli.chatgpt.site/og.png"]),
  );
});

test("worker rejects requests without the Sites-authenticated identity header", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("auth-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("https://owner.invalid/"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("source stays static, system-font-only, and storage-free", async () => {
  const [page, layout, css, packageText, hostingText, socialImage] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../public/og.png", import.meta.url)),
  ]);

  assert.doesNotMatch(page, /["']use client["']/);
  assert.doesNotMatch(page, /\bfetch\s*\(|URLSearchParams|<button\b|<form\b/i);
  assert.doesNotMatch(layout, /next\/font|codex-preview|_sites-preview/i);
  assert.match(layout, /new URL\("\/og\.png", metadataOrigin\)/);
  assert.match(layout, /ghostclaw-hermes-command-center\.e-galli\.chatgpt\.site/);
  assert.doesNotMatch(layout, /next\/headers|x-forwarded-host|x-forwarded-proto/);
  assert.doesNotMatch(css, /@import\s+url|fonts\.googleapis|font-face/i);
  assert.doesNotMatch(packageText, /react-loading-skeleton|drizzle/i);

  const hosting = JSON.parse(hostingText);
  assert.deepEqual(Object.keys(hosting), ["project_id", "d1", "r2"]);
  assert.deepEqual(hosting, {
    project_id: "appgprj_6a5568a3619c8191a82090559ec00b69",
    d1: null,
    r2: null,
  });
  assert.deepEqual([...socialImage.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});

test("dependency manifest and lock pin the audited Next.js 16.3.1 toolchain", async () => {
  const [packageText, lockText] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  ]);
  const packageJson = JSON.parse(packageText);
  const lock = JSON.parse(lockText);

  const expectedDependencies = {
    next: "16.3.1",
    react: "19.2.8",
    "react-dom": "19.2.8",
  };
  const expectedDevDependencies = {
    "@cloudflare/vite-plugin": "1.52.1",
    "@vitejs/plugin-rsc": "0.5.34",
    "eslint-config-next": "16.3.1",
    "react-server-dom-webpack": "19.2.8",
    vinext: "1.0.0-beta.6",
    vite: "8.2.1",
    wrangler: "4.123.0",
  };

  assert.deepEqual(
    Object.fromEntries(Object.keys(expectedDependencies).map((name) => [name, packageJson.dependencies[name]])),
    expectedDependencies,
  );
  assert.deepEqual(
    Object.fromEntries(
      Object.keys(expectedDevDependencies).map((name) => [name, packageJson.devDependencies[name]]),
    ),
    expectedDevDependencies,
  );

  for (const [name, version] of Object.entries({
    ...expectedDependencies,
    ...expectedDevDependencies,
  })) {
    const rootSection = name in expectedDependencies ? "dependencies" : "devDependencies";
    assert.equal(lock.packages[""][rootSection][name], version);
    assert.equal(lock.packages[`node_modules/${name}`].version, version);
  }
});

test("Cloudflare compatibility and local observability defaults stay explicit", async () => {
  const viteConfig = await readFile(new URL("../vite.config.ts", import.meta.url), "utf8");

  assert.match(viteConfig, /process\.env\.X_LOCAL_OBSERVABILITY\s*\?\?=\s*["']false["']/);
  assert.match(viteConfig, /compatibility_date:\s*["']2026-05-15["']/);
});

test("transitive build dependencies stay outside the audited vulnerable ranges", async () => {
  const lock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8"));
  const expectedVersions = {
    "@babel/core": ["7.29.7"],
    "brace-expansion": ["1.1.18", "5.0.9"],
    esbuild: ["0.28.1"],
    "fast-uri": ["3.1.5"],
    "js-yaml": ["4.3.1"],
    miniflare: ["5.20260811.1-alpha"],
    sharp: ["0.35.2", "0.35.3"],
    undici: ["7.29.0"],
    ws: ["8.21.0"],
  };

  for (const [name, versions] of Object.entries(expectedVersions)) {
    const suffix = `/node_modules/${name}`;
    const lockedVersions = Object.entries(lock.packages)
      .filter(([path]) => path === `node_modules/${name}` || path.endsWith(suffix))
      .map(([, metadata]) => metadata.version)
      .sort();

    assert.deepEqual([...new Set(lockedVersions)], versions, `${name} lock versions`);
  }

  assert.equal(lock.packages["node_modules/image-size"], undefined);

  for (const [name, version] of Object.entries({
    react: "19.2.8",
    "react-dom": "19.2.8",
    "react-server-dom-webpack": "19.2.8",
    vinext: "1.0.0-beta.6",
    vite: "8.2.1",
    wrangler: "4.123.0",
  })) {
    const suffix = `/node_modules/${name}`;
    const copies = Object.entries(lock.packages)
      .filter(([path]) => path === `node_modules/${name}` || path.endsWith(suffix))
      .map(([, metadata]) => metadata.version);

    assert.deepEqual(copies, [version], `${name} single-copy closure`);
  }

  assert.deepEqual(lock.packages["node_modules/@cloudflare/vite-plugin"].peerDependencies, {
    vite: "^6.1.0 || ^7.0.0 || ^8.0.0",
    wrangler: "^4.123.0",
  });
  assert.deepEqual(lock.packages["node_modules/vinext"].peerDependencies, {
    "@mdx-js/rollup": "^3.0.0",
    "@vitejs/plugin-react": "^5.1.4 || ^6.0.0",
    "@vitejs/plugin-rsc": "^0.5.34",
    react: "^19.2.6",
    "react-dom": "^19.2.6",
    "react-server-dom-webpack": "^19.2.6",
    vite: "^8.0.0",
  });
});
