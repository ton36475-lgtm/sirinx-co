import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ContentFactoryOptions = {
  repoRoot: string;
  brandRoot?: string;
  outputRoot?: string;
  date?: string;
  count?: number;
  startEpisode?: number;
  mode?: "revenue-sprint" | "education";
};

export type Episode = {
  id: string;
  title: string;
  category: string;
  voiceCore: string;
  labels: string[];
};

export type DraftPost = {
  id: string;
  episodeId: string;
  title: string;
  status: "draft_pending_approval";
  publish: false;
  platform: "facebook";
  caption: string;
  cta: string;
  hashtags: string[];
  riskLevel: "low" | "medium";
  sourceFiles: string[];
};

export type ImagePromptJob = {
  id: string;
  episodeId: string;
  status: "image_prompt_ready";
  providerCall: false;
  aspectRatio: "9:16";
  prompt: string;
  negativePrompt: string;
  expectedOutput: string;
};

export type VideoProductionJob = {
  id: string;
  episodeId: string;
  status: "video_spec_ready";
  providerCall: false;
  render: false;
  durationSeconds: 8;
  sourceImageJobId: string;
  motionStyle: string[];
  expectedOutput: string;
};

export type VideoQcJob = {
  id: string;
  episodeId: string;
  status: "qc_pending";
  requiredPasses: string[];
  blockedIf: string[];
};

export type PublishJob = {
  id: string;
  episodeId: string;
  platform: "facebook";
  status: "blocked_pending_approval";
  publish: false;
  requiredGate: "APPROVE_ADS_ANDROMEDA_FACEBOOK_LIVE_PUBLISH";
  requiredEnv: ["FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_ACCESS_TOKEN"];
  dependsOn: string[];
};

export type ContentFactoryResult = {
  date: string;
  brandRoot: string;
  outputDir: string;
  episodes: Episode[];
  posts: DraftPost[];
  imageJobs: ImagePromptJob[];
  videoJobs: VideoProductionJob[];
  qcJobs: VideoQcJob[];
  publishJobs: PublishJob[];
  files: string[];
};

const SOURCE_FILES = [
  "avatar.md",
  "lore.md",
  "motion-style.md",
  "knowledge-base.md",
  "shorts-library.md",
  "campaign-offers.md",
  "brand.md",
];

const SAFE_HASHTAGS = [
  "#ADSANDROMEDA",
  "#AndromedaMarketingTips",
  "#FacebookAds",
  "#MetaAds",
  "#DigitalMarketing",
];

const DEFAULT_TIMES = ["09:00", "12:00", "15:00", "18:00", "20:30"];

export async function runContentFactory(options: ContentFactoryOptions): Promise<ContentFactoryResult> {
  const repoRoot = path.resolve(options.repoRoot);
  const brandRoot = path.resolve(options.brandRoot ?? path.join(repoRoot, "brands/ads-andromeda"));
  const outputRoot = path.resolve(options.outputRoot ?? path.join(repoRoot, "outputs/content-factory/ads-andromeda"));
  const date = normalizeOutputDate(options.date);
  const outputDir = resolveChildOutputDir(outputRoot, date);
  const count = Math.min(normalizePositiveInteger(options.count, "count", 5), 10);
  const startEpisode = normalizePositiveInteger(options.startEpisode, "startEpisode", 1);
  const mode = options.mode ?? "revenue-sprint";

  await mkdir(outputDir, { recursive: true });

  const sourceTexts = await readSources(brandRoot);
  const episodes = parseShortsLibrary(sourceTexts.get("shorts-library.md") ?? "");
  if (episodes.length === 0) {
    throw new Error(`No episodes found in ${path.join(brandRoot, "shorts-library.md")}`);
  }

  const selected = episodes
    .filter((episode) => Number(episode.id.slice(2)) >= startEpisode)
    .slice(0, count);
  if (selected.length === 0) {
    throw new Error(`No episodes selected from startEpisode=${startEpisode}`);
  }

  const posts = selected.map((episode, index) => buildFacebookDraft(episode, index, mode));
  const imageJobs = selected.map(buildImagePromptJob);
  const videoJobs = selected.map((episode) => buildVideoProductionJob(episode));
  const qcJobs = selected.map(buildVideoQcJob);
  const publishJobs = selected.map((episode) => buildPublishJob(episode));
  const schedule = buildSchedule(date, posts);
  const pipelineManifest = buildPipelineManifest(date, selected, imageJobs, videoJobs, qcJobs, posts, publishJobs);

  const files: string[] = [];
  files.push(await writeJson(path.join(outputDir, "pipeline-manifest.json"), pipelineManifest));
  files.push(await writeText(path.join(outputDir, "pipeline-board.md"), renderPipelineBoard(date, selected, outputDir)));
  files.push(await writeJson(path.join(outputDir, "image-prompts.json"), { date, providerCall: false, jobs: imageJobs }));
  files.push(await writeText(path.join(outputDir, "image-prompts.md"), renderImagePromptsMarkdown(date, imageJobs)));
  files.push(await writeJson(path.join(outputDir, "video-production-queue.json"), { date, providerCall: false, render: false, jobs: videoJobs }));
  files.push(await writeText(path.join(outputDir, "video-production-queue.md"), renderVideoQueueMarkdown(date, videoJobs)));
  files.push(await writeJson(path.join(outputDir, "video-qc-checklist.json"), { date, jobs: qcJobs }));
  files.push(await writeText(path.join(outputDir, "video-qc-checklist.md"), renderQcMarkdown(date, qcJobs)));
  files.push(await writeJson(path.join(outputDir, "facebook-posts.json"), { date, mode, posts }));
  files.push(await writeJson(path.join(outputDir, "schedule-queue.json"), { date, platform: "facebook", publish: false, schedule }));
  files.push(await writeJson(path.join(outputDir, "publisher-dry-run.json"), buildPublisherDryRun(date, posts)));
  files.push(await writeJson(path.join(outputDir, "facebook-live-publish-contract.json"), { date, jobs: publishJobs, livePublishEnabled: false }));
  files.push(await writeText(path.join(outputDir, "facebook-posts.md"), renderFacebookPostsMarkdown(date, posts)));
  files.push(await writeText(path.join(outputDir, "approval-packet.md"), renderApprovalPacket(date, posts)));
  files.push(await writeText(path.join(outputDir, "daily-money-plan.md"), renderDailyMoneyPlan(date, posts)));
  files.push(await writeText(path.join(outputDir, "telegram-work-report.md"), renderTelegramReport(date, posts, outputDir)));

  return {
    date,
    brandRoot,
    outputDir,
    episodes: selected,
    posts,
    imageJobs,
    videoJobs,
    qcJobs,
    publishJobs,
    files,
  };
}

function normalizeOutputDate(date?: string): string {
  const value = date ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid output date: ${value}. Expected YYYY-MM-DD.`);
  }
  return value;
}

function resolveChildOutputDir(outputRoot: string, childName: string): string {
  const outputDir = path.resolve(outputRoot, childName);
  const rootWithSeparator = outputRoot.endsWith(path.sep) ? outputRoot : `${outputRoot}${path.sep}`;
  if (!outputDir.startsWith(rootWithSeparator)) {
    throw new Error(`Resolved output directory is outside output root: ${outputDir}`);
  }
  return outputDir;
}

function normalizePositiveInteger(value: number | undefined, fieldName: string, defaultValue: number): number {
  const resolved = value ?? defaultValue;
  if (!Number.isInteger(resolved) || resolved < 1) {
    throw new Error(`Invalid ${fieldName}: expected a positive integer.`);
  }
  return resolved;
}

async function readSources(brandRoot: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const file of SOURCE_FILES) {
    out.set(file, await readFile(path.join(brandRoot, file), "utf8"));
  }
  return out;
}

export function parseShortsLibrary(markdown: string): Episode[] {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\| EP\d{3} \|/.test(line))
    .map((line) => {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);
      const [id, title, category, voiceCore, labels] = cells;
      return {
        id,
        title,
        category,
        voiceCore,
        labels: labels.split(",").map((label) => label.trim()),
      };
    });
}

function buildFacebookDraft(episode: Episode, index: number, mode: "revenue-sprint" | "education"): DraftPost {
  const isOfferBridge = mode === "revenue-sprint" && [0, 2, 4].includes(index);
  const cta = isOfferBridge
    ? "ถ้าต้องการเลือกเพจหรือ BM ให้เหมาะกับเป้าหมาย ทักมาขอเช็กลิสต์ก่อนตัดสินใจได้เลย"
    : "บันทึกโพสต์นี้ไว้เป็นเช็กลิสต์ก่อนเริ่มยิงแอด";

  const labelLine = episode.labels.map((label) => `- ${label}`).join("\n");
  const caption = [
    `${episode.id} | ${episode.title}`,
    "",
    episode.voiceCore,
    "",
    "จำง่าย ๆ ให้ดู 3 จุดนี้:",
    labelLine,
    "",
    "Andromeda แนะนำให้เข้าใจระบบก่อนใช้งานจริง เพราะบัญชี เพจ และ BM ที่เหมาะกับเป้าหมาย จะช่วยให้ทีมทำงานเป็นระบบขึ้น",
    "",
    cta,
    "",
    "หมายเหตุ: ข้อมูลนี้เป็นความรู้ด้านโครงสร้างการตลาด ไม่ใช่การการันตีผลลัพธ์หรือสถานะแพลตฟอร์ม",
  ].join("\n");

  return {
    id: `ads-andromeda-fb-${episode.id.toLowerCase()}`,
    episodeId: episode.id,
    title: episode.title,
    status: "draft_pending_approval",
    publish: false,
    platform: "facebook",
    caption,
    cta,
    hashtags: SAFE_HASHTAGS,
    riskLevel: isOfferBridge ? "medium" : "low",
    sourceFiles: SOURCE_FILES,
  };
}

function buildImagePromptJob(episode: Episode): ImagePromptJob {
  const labels = episode.labels.join(", ");
  return {
    id: `ads-andromeda-image-${episode.id.toLowerCase()}`,
    episodeId: episode.id,
    status: "image_prompt_ready",
    providerCall: false,
    aspectRatio: "9:16",
    prompt: [
      "Create one vertical 9:16 key visual for ADS ANDROMEDA.",
      "Character: Andromeda, adult Thai female AI Marketing Commander, black long ponytail, dark brown eyes, black cyber-luxury executive suit.",
      "Environment: purple-blue galaxy advertising command center with holographic panels.",
      `Episode: ${episode.id} - ${episode.title}.`,
      `Visual labels: ${labels}.`,
      "Style: premium enterprise, luxury cyberpunk, clean, readable on mobile.",
      "Use icons and short English labels only. Thai meaning will be in voiceover/caption.",
    ].join(" "),
    negativePrompt: [
      "No long Thai text overlays.",
      "No official Meta/Facebook partnership claim.",
      "No guaranteed approval or ban-proof claim.",
      "No credentials, account IDs, tokens, customer data, backend screenshots, or cluttered UI.",
      "No childish mascot, aggressive seller pose, cheap neon rainbow, or unreadable small text.",
    ].join(" "),
    expectedOutput: `assets/${episode.id.toLowerCase()}-key-visual.png`,
  };
}

function buildVideoProductionJob(episode: Episode): VideoProductionJob {
  return {
    id: `ads-andromeda-video-${episode.id.toLowerCase()}`,
    episodeId: episode.id,
    status: "video_spec_ready",
    providerCall: false,
    render: false,
    durationSeconds: 8,
    sourceImageJobId: `ads-andromeda-image-${episode.id.toLowerCase()}`,
    motionStyle: [
      "0-2s: Andromeda appears beside hologram topic",
      "2-5s: 2-3 icons reveal with hologram dissolve",
      "5-8s: Andromeda faces camera, soft ADS ANDROMEDA logo cue",
      "Camera: slow cinematic push, stable hero lock, no fast glitch cuts",
    ],
    expectedOutput: `video/${episode.id.toLowerCase()}-andromeda-tip.mp4`,
  };
}

function buildVideoQcJob(episode: Episode): VideoQcJob {
  return {
    id: `ads-andromeda-qc-${episode.id.toLowerCase()}`,
    episodeId: episode.id,
    status: "qc_pending",
    requiredPasses: [
      "Duration is 6-8 seconds.",
      "Aspect ratio is 9:16.",
      "Andromeda avatar matches avatar.md.",
      "Visual style matches motion-style.md.",
      "Caption and voice are educational first.",
      "No long Thai text overlay.",
      "No unsupported guarantee or platform partnership claim.",
      "No private account, customer, credential, or token visible.",
      "CTA is soft and review-safe.",
    ],
    blockedIf: [
      "Claims guaranteed ad approval.",
      "Claims ban-proof or platform immunity.",
      "Shows real private account data.",
      "Uses official Meta/Facebook partnership language.",
      "Video is unreadable on mobile.",
    ],
  };
}

function buildPublishJob(episode: Episode): PublishJob {
  return {
    id: `ads-andromeda-publish-${episode.id.toLowerCase()}`,
    episodeId: episode.id,
    platform: "facebook",
    status: "blocked_pending_approval",
    publish: false,
    requiredGate: "APPROVE_ADS_ANDROMEDA_FACEBOOK_LIVE_PUBLISH",
    requiredEnv: ["FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_ACCESS_TOKEN"],
    dependsOn: [
      `ads-andromeda-image-${episode.id.toLowerCase()}`,
      `ads-andromeda-video-${episode.id.toLowerCase()}`,
      `ads-andromeda-qc-${episode.id.toLowerCase()}`,
      `ads-andromeda-fb-${episode.id.toLowerCase()}`,
    ],
  };
}

function buildSchedule(date: string, posts: DraftPost[]) {
  return posts.map((post, index) => ({
    id: post.id,
    platform: "facebook",
    scheduledLocalTime: `${date}T${DEFAULT_TIMES[index % DEFAULT_TIMES.length]}:00+07:00`,
    status: "draft_pending_approval",
    publish: false,
    approvalRequired: true,
    episodeId: post.episodeId,
  }));
}

function buildPipelineManifest(
  date: string,
  episodes: Episode[],
  imageJobs: ImagePromptJob[],
  videoJobs: VideoProductionJob[],
  qcJobs: VideoQcJob[],
  posts: DraftPost[],
  publishJobs: PublishJob[],
) {
  return {
    date,
    brand: "ADS ANDROMEDA",
    workflow: "image_prompt -> video_spec -> video_qc -> caption -> approval -> facebook_publish",
    mode: "local_draft_until_live_gate",
    livePublishEnabled: false,
    stages: [
      { id: "image", status: "prompt_ready", providerCall: false, jobs: imageJobs.length },
      { id: "video", status: "spec_ready", providerCall: false, render: false, jobs: videoJobs.length },
      { id: "qc", status: "pending_human_or_agent_review", jobs: qcJobs.length },
      { id: "caption", status: "draft_pending_approval", jobs: posts.length },
      { id: "publish", status: "blocked_pending_approval", publish: false, jobs: publishJobs.length },
    ],
    episodes: episodes.map((episode) => episode.id),
    requiredLiveGate: "APPROVE_ADS_ANDROMEDA_FACEBOOK_LIVE_PUBLISH",
  };
}

function buildPublisherDryRun(date: string, posts: DraftPost[]) {
  return {
    date,
    platform: "facebook",
    livePublishEnabled: false,
    reason: "Human approval, Facebook Page credential, and explicit live publish gate are required.",
    requiredGate: "APPROVE_ADS_ANDROMEDA_FACEBOOK_LIVE_PUBLISH",
    requiredEnv: ["FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_ACCESS_TOKEN"],
    blockedActions: ["post_to_facebook", "schedule_on_facebook", "boost_post", "auto_reply_to_customers"],
    draftCount: posts.length,
  };
}

async function writeJson(filePath: string, data: unknown): Promise<string> {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return filePath;
}

async function writeText(filePath: string, text: string): Promise<string> {
  await writeFile(filePath, text, "utf8");
  return filePath;
}

function renderFacebookPostsMarkdown(date: string, posts: DraftPost[]): string {
  const body = posts
    .map((post, index) => {
      return [
        `## Post ${index + 1}: ${post.episodeId} - ${post.title}`,
        "",
        `Status: ${post.status}`,
        `Risk: ${post.riskLevel}`,
        "",
        "```text",
        post.caption,
        "",
        post.hashtags.join(" "),
        "```",
      ].join("\n");
    })
    .join("\n\n");

  return [
    `# ADS ANDROMEDA Facebook Drafts - ${date}`,
    "",
    "Mode: draft-only, approval required",
    "Live publish: false",
    "",
    body,
    "",
  ].join("\n");
}

function renderPipelineBoard(date: string, episodes: Episode[], outputDir: string): string {
  const rows = episodes.map((episode) => {
    return `| ${episode.id} | image_prompt_ready | video_spec_ready | qc_pending | draft_pending_approval | blocked_pending_approval |`;
  });
  return [
    `# ADS ANDROMEDA Automation Pipeline Board - ${date}`,
    "",
    "Mode: local draft until live approval",
    `Output: \`${outputDir}\``,
    "",
    "## Flow",
    "",
    "```mermaid",
    "flowchart LR",
    "  A[Topic from shorts-library] --> B[Image Prompt Queue]",
    "  B --> C[Video Production Queue]",
    "  C --> D[Video QC]",
    "  D --> E[Caption Queue]",
    "  E --> F[Approval Packet]",
    "  F --> G{Live Gate}",
    "  G -->|Blocked by default| H[Do Not Publish]",
    "  G -->|Approved + env present| I[Facebook Publisher]",
    "```",
    "",
    "## Board",
    "",
    "| Episode | Image | Video | QC | Caption | Publish |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

function renderImagePromptsMarkdown(date: string, jobs: ImagePromptJob[]): string {
  return [
    `# ADS ANDROMEDA Image Prompt Queue - ${date}`,
    "",
    "Provider call: false",
    "",
    ...jobs.map((job, index) => [
      `## Image ${index + 1}: ${job.episodeId}`,
      "",
      `Status: ${job.status}`,
      `Expected output: \`${job.expectedOutput}\``,
      "",
      "### Prompt",
      "",
      "```text",
      job.prompt,
      "```",
      "",
      "### Negative Prompt",
      "",
      "```text",
      job.negativePrompt,
      "```",
      "",
    ].join("\n")),
  ].join("\n");
}

function renderVideoQueueMarkdown(date: string, jobs: VideoProductionJob[]): string {
  return [
    `# ADS ANDROMEDA Video Production Queue - ${date}`,
    "",
    "Render: false",
    "Provider call: false",
    "",
    ...jobs.map((job, index) => [
      `## Video ${index + 1}: ${job.episodeId}`,
      "",
      `Status: ${job.status}`,
      `Duration: ${job.durationSeconds}s`,
      `Source image job: \`${job.sourceImageJobId}\``,
      `Expected output: \`${job.expectedOutput}\``,
      "",
      "### Motion",
      "",
      ...job.motionStyle.map((line) => `- ${line}`),
      "",
    ].join("\n")),
  ].join("\n");
}

function renderQcMarkdown(date: string, jobs: VideoQcJob[]): string {
  return [
    `# ADS ANDROMEDA Video QC Checklist - ${date}`,
    "",
    "Every video must pass QC before captions can be approved for live posting.",
    "",
    ...jobs.map((job, index) => [
      `## QC ${index + 1}: ${job.episodeId}`,
      "",
      `Status: ${job.status}`,
      "",
      "### Required Passes",
      "",
      ...job.requiredPasses.map((gate) => `- [ ] ${gate}`),
      "",
      "### Blocked If",
      "",
      ...job.blockedIf.map((gate) => `- ${gate}`),
      "",
    ].join("\n")),
  ].join("\n");
}

function renderApprovalPacket(date: string, posts: DraftPost[]): string {
  return [
    `# ADS ANDROMEDA Facebook Approval Packet - ${date}`,
    "",
    "Status: READY_FOR_HUMAN_REVIEW",
    "Publish: BLOCKED",
    "",
    "## Scope",
    "",
    `- Draft posts: ${posts.length}`,
    "- Image prompts: generated locally.",
    "- Video production queue: generated locally.",
    "- Video QC checklist: pending.",
    "- Platform target: Facebook",
    "- Objective: generate educational demand and soft inbound leads",
    "- Source: ADS ANDROMEDA brand/content system",
    "",
    "## Safety Gates",
    "",
    "- No guaranteed ad approval.",
    "- No ban-proof or platform immunity claim.",
    "- No official Meta/Facebook partnership claim.",
    "- No private account IDs, credentials, customer data, or backend screenshots.",
    "- No live publish until `APPROVE_ADS_ANDROMEDA_FACEBOOK_LIVE_PUBLISH`.",
    "",
    "## Required Before Live Publish",
    "",
    "```text",
    "FACEBOOK_PAGE_ID=<approved page id>",
    "FACEBOOK_PAGE_ACCESS_TOKEN=<approved page token>",
    "APPROVE_ADS_ANDROMEDA_FACEBOOK_LIVE_PUBLISH",
    "```",
    "",
  ].join("\n");
}

function renderDailyMoneyPlan(date: string, posts: DraftPost[]): string {
  return [
    `# ADS ANDROMEDA Daily Money Plan - ${date}`,
    "",
    "Goal: create inbound demand before external automation is enabled.",
    "",
    "## Daily Workflow",
    "",
    "1. Review generated Facebook drafts.",
    "2. Pick 3 posts that are safest and clearest.",
    "3. Manually publish or approve live automation later.",
    "4. Track replies, comments, and DMs manually.",
    "5. Record questions into the next episode batch.",
    "",
    "## Lead Capture CTA",
    "",
    "```text",
    "ทักมาขอเช็กลิสต์ก่อนเลือกเพจหรือ BM ได้เลย",
    "```",
    "",
    "## Draft Queue",
    "",
    ...posts.map((post) => [`- ${post.episodeId}: ${post.title} (${post.riskLevel})`].join("")),
    "",
  ].join("\n");
}

function renderTelegramReport(date: string, posts: DraftPost[], outputDir: string): string {
  return [
    `ADS ANDROMEDA content factory completed - ${date}`,
    "",
    `drafts: ${posts.length}`,
    "platform: Facebook",
    "publish: false",
    "status: draft_pending_approval",
    `output: ${outputDir}`,
    "",
    "Safety:",
    "- no provider call",
    "- no Facebook API call",
    "- no live post",
    "- no paid boost",
    "- no customer message",
    "",
  ].join("\n");
}
