import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyPlan, buildPlan, EXPECTED_IMAGES, inspectReceipt } from "./import-real-installations.ts";
import type { Backend, ProjectRow } from "./import-real-installations.ts";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "sirinx-real-import-"));
  const projects = [];
  for (const [id, images] of Object.entries(EXPECTED_IMAGES)) {
    await mkdir(join(root, "media", id), { recursive: true });
    for (const assetId of images) await writeFile(join(root, "media", id, `${assetId}.jpg`), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
    projects.push({ id, name_th: id, summary_th: "User-verified project summary", cover_id: images[0],
      images: images.map(assetId => ({ id: assetId, src: `media/${id}/${assetId}.jpg` })),
      videos: [{ src: "sidecar-only.mp4" }], capacity_kwp: null, savings_thb: null, installation_date: null });
  }
  await mkdir(join(root, "catalog"));
  await writeFile(join(root, "catalog/projects.json"), JSON.stringify({ public_projects: projects }));
  return root;
}

function fakeBackend() {
  const rows: ProjectRow[] = [];
  let uploadCalls = 0;
  let createCalls = 0;
  const backend: Backend = {
    list: async () => structuredClone(rows),
    upload: async key => { uploadCalls++; return { key, url: `https://media.example.test/${key}` }; },
    create: async payload => { createCalls++; const id = rows.length + 1; rows.push({ id, ...payload }); return { id }; },
  };
  return { backend, rows, calls: () => ({ uploadCalls, createCalls }) };
}

test("dry plan has exactly 27 draft images, safe payload fields, separate videos", async () => {
  const root = await fixture();
  try {
    const plan = await buildPlan(root);
    assert.equal(plan.imageCount, 27);
    assert.equal(plan.projects.length, 3);
    for (const project of plan.projects) {
      assert.equal(project.payload.published, false);
      for (const field of ["capacity", "saving", "year", "location", "videos"]) assert.ok(!(field in project.payload));
      assert.equal(project.videos.length, 1);
      assert.ok(project.payload.image.startsWith("/assets/real-installations/"));
      assert.equal(JSON.parse(project.payload.galleryImages).length, project.uploads.length);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("completed receipt blocks reapply; read-only ID inspection detects later changes", async () => {
  const root = await fixture();
  try {
    const plan = await buildPlan(root);
    const fake = fakeBackend();
    const receipt = join(root, "receipt.json");
    const result = await applyPlan(plan, receipt, fake.backend);
    assert.equal(result.status, "complete");
    assert.deepEqual(fake.calls(), { uploadCalls: 27, createCalls: 3 });
    assert.equal(result.created.every(project => project.after.published === false), true);
    await assert.rejects(applyPlan(plan, receipt, fake.backend), { code: "EEXIST" });
    assert.deepEqual(fake.calls(), { uploadCalls: 27, createCalls: 3 });
    assert.equal((await inspectReceipt(receipt, fake.backend)).ids.every(item => item.unchanged), true);
    fake.rows[0].title = "changed externally";
    assert.equal((await inspectReceipt(receipt, fake.backend)).ids[0].unchanged, false);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("ambiguous insert journals pending create and never retries; new receipt detects existing title", async () => {
  const root = await fixture();
  try {
    const fake = fakeBackend();
    const plan = await buildPlan(root);
    const originalCreate = fake.backend.create;
    fake.backend.create = async payload => { await originalCreate(payload); throw new Error("simulated lost response"); };
    const receipt = join(root, "receipt.json");
    await assert.rejects(applyPlan(plan, receipt, fake.backend), /NO_AUTOMATIC_RETRY/);
    const journal = JSON.parse(await readFile(receipt, "utf8"));
    assert.equal(journal.status, "needs_manual_reconciliation");
    assert.equal(journal.pending.kind, "create");
    assert.equal(fake.rows.length, 1);
    const calls = fake.calls();
    await assert.rejects(applyPlan(plan, receipt, fake.backend), { code: "EEXIST" });
    await assert.rejects(applyPlan(plan, join(root, "second-receipt.json"), fake.backend), /NO_AUTOMATIC_RETRY/);
    assert.deepEqual(fake.calls(), calls);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("changed derivative aborts before upload and symlink escape is rejected", async () => {
  const root = await fixture();
  const outside = await mkdtemp(join(tmpdir(), "sirinx-outside-"));
  try {
    const plan = await buildPlan(root);
    const fake = fakeBackend();
    const first = join(root, plan.projects[0].uploads[0].relativePath);
    await writeFile(first, Buffer.from([0xff, 0xd8, 0xff, 0x01, 0xd9]));
    await assert.rejects(applyPlan(plan, join(root, "receipt.json"), fake.backend), /NO_AUTOMATIC_RETRY/);
    assert.deepEqual(fake.calls(), { uploadCalls: 0, createCalls: 0 });
    const other = join(outside, "image.jpg");
    await writeFile(other, Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
    await rm(first);
    await symlink(other, first);
    await assert.rejects(buildPlan(root), /OUTSIDE_RELEASE_ROOT/);
  } finally { await rm(root, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true }); }
});
