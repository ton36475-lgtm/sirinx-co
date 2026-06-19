import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { runContentFactory } from "../src/index";

const repoRoot = path.resolve(import.meta.dirname, "../../..");
const tempRoots: string[] = [];

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "sirinx-content-factory-"));
  tempRoots.push(root);
  return root;
}

async function makeBrandFixture(root: string): Promise<string> {
  const brandRoot = path.join(root, "brand");
  const sourceFiles = [
    "avatar.md",
    "lore.md",
    "motion-style.md",
    "knowledge-base.md",
    "campaign-offers.md",
    "brand.md",
  ];

  await mkdir(brandRoot, { recursive: true });
  await Promise.all(sourceFiles.map((file) => writeFile(path.join(brandRoot, file), `${file}\n`, "utf8")));
  await writeFile(
    path.join(brandRoot, "shorts-library.md"),
    [
      "| ID | Title | Category | Voice Core | Labels |",
      "| --- | --- | --- | --- | --- |",
      "| EP001 | First useful tip | Knowledge | Pick stable systems before scaling. | Quality, Stability, Support |",
      "| EP002 | Second useful tip | Knowledge | Measure before spending more budget. | Metrics, Cost, Review |",
      "",
    ].join("\n"),
    "utf8",
  );

  return brandRoot;
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("runContentFactory validation", () => {
  it("rejects dates that would write outside the configured output root", async () => {
    const tempRoot = await makeTempRoot();
    const brandRoot = await makeBrandFixture(tempRoot);
    const outputRoot = path.join(tempRoot, "out");

    await expect(
      runContentFactory({
        repoRoot,
        brandRoot,
        outputRoot,
        date: "../../escape",
        count: 1,
        startEpisode: 1,
      }),
    ).rejects.toThrow(/date|output/i);

    await expect(exists(path.join(tempRoot, "escape"))).resolves.toBe(false);
  });

  it("rejects invalid numeric limits before selecting episodes", async () => {
    const tempRoot = await makeTempRoot();
    const brandRoot = await makeBrandFixture(tempRoot);

    await expect(
      runContentFactory({
        repoRoot,
        brandRoot,
        outputRoot: path.join(tempRoot, "out"),
        date: "2026-06-19",
        count: Number.NaN,
        startEpisode: 1,
      }),
    ).rejects.toThrow(/count/i);

    await expect(
      runContentFactory({
        repoRoot,
        brandRoot,
        outputRoot: path.join(tempRoot, "out"),
        date: "2026-06-19",
        count: 1,
        startEpisode: Number.NaN,
      }),
    ).rejects.toThrow(/startEpisode/i);
  });

  it("keeps a valid local draft run publish-blocked", async () => {
    const tempRoot = await makeTempRoot();
    const brandRoot = await makeBrandFixture(tempRoot);
    const outputRoot = path.join(tempRoot, "out");

    const result = await runContentFactory({
      repoRoot,
      brandRoot,
      outputRoot,
      date: "2026-06-19",
      count: 2,
      startEpisode: 1,
    });

    expect(result.outputDir.startsWith(`${path.resolve(outputRoot)}${path.sep}`)).toBe(true);
    expect(result.posts).toHaveLength(2);
    expect(result.posts.every((post) => post.publish === false)).toBe(true);
    expect(result.publishJobs.every((job) => job.publish === false)).toBe(true);
    expect(result.files).toHaveLength(16);
  });
});
