#!/usr/bin/env node
import { runContentFactory } from "./index.js";

type Args = {
  repoRoot: string;
  date?: string;
  count?: number;
  startEpisode?: number;
  mode?: "revenue-sprint" | "education";
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    repoRoot: process.cwd(),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--repo-root" && next) {
      args.repoRoot = next;
      i += 1;
    } else if (arg === "--date" && next) {
      args.date = next;
      i += 1;
    } else if (arg === "--count" && next) {
      args.count = parsePositiveIntegerArg("--count", next);
      i += 1;
    } else if (arg === "--start-episode" && next) {
      args.startEpisode = parsePositiveIntegerArg("--start-episode", next);
      i += 1;
    } else if (arg === "--mode" && next) {
      if (next !== "revenue-sprint" && next !== "education") {
        throw new Error(`Unsupported mode: ${next}`);
      }
      args.mode = next;
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function parsePositiveIntegerArg(name: string, value: string): number {
  if (!/^\d+$/.test(value)) {
    throw new Error(`Invalid ${name}: expected a positive integer.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid ${name}: expected a positive integer.`);
  }
  return parsed;
}

function printHelp(): void {
  console.log(`sirinx-content-factory

Generate ADS ANDROMEDA Facebook draft posts, approval packet, and schedule queue.

Options:
  --repo-root <path>       Repo root. Defaults to cwd.
  --date <YYYY-MM-DD>     Output date. Defaults to today.
  --count <n>             Number of posts to draft. Defaults to 5.
  --start-episode <n>     First episode number. Defaults to 1.
  --mode <mode>           revenue-sprint | education. Defaults to revenue-sprint.
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const result = await runContentFactory(args);
  console.log(
    JSON.stringify(
      {
        ok: true,
        date: result.date,
        outputDir: result.outputDir,
        posts: result.posts.length,
        imageJobs: result.imageJobs.length,
        videoJobs: result.videoJobs.length,
        qcJobs: result.qcJobs.length,
        publishJobs: result.publishJobs.length,
        episodes: result.episodes.map((episode) => episode.id),
        publish: false,
        approvalRequired: true,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
