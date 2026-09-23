/** Trusted, create-only importer. Dry-run is the default; no backend imports until --apply. */
import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, realpath, rename, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const EXPECTED_IMAGES: Record<string, readonly string[]> = {
  "ruean-phae-royal-park": ["1000076002", "1000076006", "1000076005", "1000076004", "1000076003", "1000076001", "1000076000", "1000075999", "1000075997", "1000075996", "1000075994"],
  holatel: ["1000075878", "1000075912", "1000075911", "1000075870", "1000075821", "1000075818", "1000075808", "1000075806", "1000075805", "1000075803"],
  "suphalai-residence": ["1000075975", "1000075978", "1000075977", "1000075976", "1000075974", "1000075973"],
};

type CatalogProject = {
  id: string; name_th: string; cover_id: string; summary_th: string;
  images: Array<{ id: string; src: string }>;
  videos?: unknown[]; video_excerpts?: unknown[];
};
export type ProjectPayload = {
  title: string; type: string; description: string; image: string;
  galleryImages: string; tag: string; sortOrder: number; published: false;
};
type Upload = { assetId: string; relativePath: string; sha256: string; bytes: number; key: string };
type PlannedProject = { sourceId: string; coverId: string; payload: ProjectPayload; uploads: Upload[]; videos: unknown[] };
export type ImportPlan = {
  schemaVersion: 1; mode: "dry-run"; releaseRoot: string; catalogSha256: string;
  planSha256: string; imageCount: number; projects: PlannedProject[];
  note: string;
};
export type ProjectRow = { id: number; title: string; [key: string]: unknown };
export type Backend = {
  list: () => Promise<ProjectRow[]>;
  upload: (key: string, bytes: Buffer, contentType: string) => Promise<{ key: string; url: string }>;
  create: (payload: ProjectPayload) => Promise<{ id: number }>;
  close?: () => Promise<void>;
};
type Receipt = {
  schemaVersion: 1; planSha256: string; catalogSha256: string; createdAt: string;
  status: "in_progress" | "complete" | "needs_manual_reconciliation";
  before: ProjectRow[];
  idMap: Record<string, number>;
  uploads: Array<{ sourceId: string; assetId: string; key: string; url: string; sha256: string }>;
  created: Array<{ sourceId: string; id: number; payload: ProjectPayload; after: ProjectRow }>;
  pending: null | { kind: "upload" | "create"; sourceId: string; assetId?: string; key?: string; payload?: ProjectPayload };
  rollback: string;
};

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");

async function checkedMediaPath(root: string, relativePath: string): Promise<string> {
  requireCondition(!isAbsolute(relativePath) && !relativePath.includes("\\"), "INVALID_MEDIA_PATH");
  const target = await realpath(resolve(root, relativePath));
  const rel = relative(root, target);
  requireCondition(rel !== ".." && !rel.startsWith("../") && !isAbsolute(rel), "MEDIA_OUTSIDE_RELEASE_ROOT");
  requireCondition((await stat(target)).isFile(), "MEDIA_NOT_A_FILE");
  return target;
}

/** Reads local catalog/media only. Unknown capacity, savings, location and date are omitted. */
export async function buildPlan(releaseDirectory: string): Promise<ImportPlan> {
  const releaseRoot = await realpath(resolve(releaseDirectory));
  const catalogBytes = await readFile(join(releaseRoot, "catalog/projects.json"));
  const catalog = JSON.parse(catalogBytes.toString("utf8"));
  requireCondition(Array.isArray(catalog.public_projects) && catalog.public_projects.length === 3, "EXPECTED_THREE_NAMED_PROJECTS");
  const seenProjects = new Set<string>();
  const seenTitles = new Set<string>();
  const projects: PlannedProject[] = [];
  for (const [index, project] of (catalog.public_projects as CatalogProject[]).entries()) {
    const expected = EXPECTED_IMAGES[project.id];
    requireCondition(expected && !seenProjects.has(project.id), "UNKNOWN_OR_DUPLICATE_PROJECT");
    seenProjects.add(project.id);
    requireCondition(typeof project.name_th === "string" && project.name_th.length > 0 && project.name_th.length <= 500, "INVALID_PROJECT_TITLE");
    requireCondition(!seenTitles.has(project.name_th), "DUPLICATE_PROJECT_TITLE");
    seenTitles.add(project.name_th);
    requireCondition(typeof project.summary_th === "string" && project.summary_th.length > 0, "MISSING_PROJECT_SUMMARY");
    requireCondition(Array.isArray(project.images) && project.images.length === expected.length, "UNEXPECTED_IMAGE_COUNT");
    const imageIds = project.images.map(image => image.id);
    requireCondition(new Set(imageIds).size === expected.length && expected.every(id => imageIds.includes(id)), "UNEXPECTED_IMAGE_IDS");
    requireCondition(imageIds.includes(project.cover_id), "COVER_NOT_IN_GALLERY");
    const uploads: Upload[] = [];
    for (const image of project.images) {
      requireCondition(image.src === `media/${project.id}/${image.id}.jpg`, "UNEXPECTED_JPG_PATH");
      const path = await checkedMediaPath(releaseRoot, image.src);
      const bytes = await readFile(path);
      requireCondition(bytes.length > 3 && bytes.length <= 20 * 1024 * 1024 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff, "INVALID_OR_OVERSIZED_JPG");
      const digest = sha256(bytes);
      uploads.push({ assetId: image.id, relativePath: image.src, sha256: digest, bytes: bytes.length,
        key: `sirinx-real-installations/${project.id}/${image.id}-${digest}.jpg` });
    }
    const imageUrls = project.images.map(image => `/assets/real-installations/${project.id}/${image.id}.jpg`);
    projects.push({ sourceId: project.id, coverId: project.cover_id, uploads,
      payload: {
        title: project.name_th,
        type: project.id === "ruean-phae-royal-park" ? "Rooftop Solar / Solar Carport" : "Rooftop Solar",
        description: project.summary_th,
        image: imageUrls[imageIds.indexOf(project.cover_id)],
        galleryImages: JSON.stringify(imageUrls),
        tag: project.id === "ruean-phae-royal-park" ? "carport" : "rooftop",
        sortOrder: 30 - index * 10,
        published: false,
      },
      videos: [...(project.videos ?? []), ...(project.video_excerpts ?? [])],
    });
  }
  const catalogSha256 = sha256(catalogBytes);
  const planSha256 = sha256(JSON.stringify({ catalogSha256, projects }));
  return { schemaVersion: 1, mode: "dry-run", releaseRoot, catalogSha256, planSha256,
    imageCount: projects.reduce((total, project) => total + project.uploads.length, 0), projects,
    note: "Payloads use planned static URLs. --apply uploads 27 JPGs, substitutes verified returned URLs and journals each exact draft payload before creation. Videos are sidecar metadata only; no upload, publication or deployment in dry-run." };
}

async function writeReceipt(path: string, receipt: Receipt) {
  const temporary = `${path}.${process.pid}-${randomUUID()}.tmp`;
  const handle = await open(temporary, "wx", 0o600);
  try { await handle.writeFile(JSON.stringify(receipt, null, 2) + "\n"); await handle.sync(); }
  finally { await handle.close(); }
  await rename(temporary, path);
  // Persist the directory entry where supported. Receipt remains fail-closed on Windows.
  let directory;
  try { directory = await open(dirname(path), "r"); await directory.sync(); }
  catch { /* Directory fsync is not supported on every platform. */ }
  finally { await directory?.close(); }
}

async function completeProjectList(backend: Backend) {
  const rows = await backend.list();
  requireCondition(rows.length < 10001, "PROJECT_LIST_LIMIT_REACHED_ABORTING");
  return rows;
}

/** No retries, updates, deletes or publication. A receipt is an exclusive execution journal. */
export async function applyPlan(plan: ImportPlan, receiptFile: string, backend: Backend) {
  const receiptPath = resolve(receiptFile);
  await mkdir(dirname(receiptPath), { recursive: true });
  // Claim before any external operation. Existing, partial or complete receipts all block writes.
  const claim = await open(receiptPath, "wx", 0o600);
  await claim.writeFile('{"status":"claimed_not_started"}\n');
  await claim.sync();
  await claim.close();
  const receipt: Receipt = {
    schemaVersion: 1, planSha256: plan.planSha256, catalogSha256: plan.catalogSha256,
    createdAt: new Date().toISOString(), status: "in_progress", before: [], idMap: {}, uploads: [], created: [], pending: null,
    rollback: "No existing rows are modified. Keep created rows unpublished. Review idMap and after snapshots; no automatic deletion or storage cleanup. A pending create requires manual database reconciliation before any retry.",
  };
  await writeReceipt(receiptPath, receipt);
  try {
    // Rebuild before any upload to catch changed catalog or image bytes after the dry-run.
    requireCondition((await buildPlan(plan.releaseRoot)).planSha256 === plan.planSha256, "RELEASE_CHANGED_SINCE_PLAN");
    receipt.before = await completeProjectList(backend);
    for (const project of plan.projects) {
      requireCondition(!receipt.before.some(row => row.title === project.payload.title), "EXISTING_PROJECT_TITLE_REQUIRES_EXPLICIT_RECONCILIATION");
    }
    await writeReceipt(receiptPath, receipt);
    for (const project of plan.projects) {
      const urls = new Map<string, string>();
      for (const upload of project.uploads) {
        const bytes = await readFile(await checkedMediaPath(plan.releaseRoot, upload.relativePath));
        requireCondition(sha256(bytes) === upload.sha256, "MEDIA_CHANGED_AFTER_PREFLIGHT");
        receipt.pending = { kind: "upload", sourceId: project.sourceId, assetId: upload.assetId, key: upload.key };
        await writeReceipt(receiptPath, receipt);
        const stored = await backend.upload(upload.key, bytes, "image/jpeg");
        const url = new URL(stored.url);
        requireCondition(stored.key === upload.key && url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash, "STORAGE_MUST_RETURN_STABLE_PUBLIC_HTTPS_URL");
        urls.set(upload.assetId, stored.url);
        receipt.uploads.push({ sourceId: project.sourceId, assetId: upload.assetId, key: stored.key, url: stored.url, sha256: upload.sha256 });
        receipt.pending = null;
        await writeReceipt(receiptPath, receipt);
      }
      const payload: ProjectPayload = { ...project.payload,
        image: urls.get(project.coverId)!, galleryImages: JSON.stringify(project.uploads.map(upload => urls.get(upload.assetId))), published: false };
      // Recheck title immediately before insert. The schema has no unique import key: single writer required.
      requireCondition(!(await completeProjectList(backend)).some(row => row.title === payload.title), "PROJECT_APPEARED_DURING_IMPORT_ABORTING");
      receipt.pending = { kind: "create", sourceId: project.sourceId, payload };
      await writeReceipt(receiptPath, receipt);
      const result = await backend.create(payload);
      requireCondition(Number.isSafeInteger(result.id) && result.id > 0, "CREATE_RETURNED_INVALID_ID");
      receipt.idMap[project.sourceId] = result.id;
      // Persist the returned ID before the read-back in case inspection itself fails.
      await writeReceipt(receiptPath, receipt);
      const after = (await completeProjectList(backend)).find(row => row.id === result.id);
      requireCondition(after && Object.entries(payload).every(([key, value]) => after[key] === value), "CREATED_PROJECT_READBACK_MISMATCH");
      receipt.created.push({ sourceId: project.sourceId, id: result.id, payload, after });
      receipt.pending = null;
      await writeReceipt(receiptPath, receipt);
    }
    receipt.status = "complete";
    await writeReceipt(receiptPath, receipt);
    return receipt;
  } catch {
    receipt.status = "needs_manual_reconciliation";
    await writeReceipt(receiptPath, receipt);
    throw new Error("IMPORT_STOPPED_CHECK_RECEIPT_NO_AUTOMATIC_RETRY");
  }
}

/** Read-only ID reconciliation. It never resumes an interrupted import. */
export async function inspectReceipt(receiptFile: string, backend: Backend) {
  const receipt: Receipt = JSON.parse(await readFile(receiptFile, "utf8"));
  requireCondition(receipt.schemaVersion === 1 && receipt.idMap && Array.isArray(receipt.created), "INVALID_OR_INCOMPLETE_RECEIPT_REQUIRES_MANUAL_RECONCILIATION");
  const rows = await completeProjectList(backend);
  return { status: receipt.status, planSha256: receipt.planSha256, pending: receipt.pending,
    ids: Object.entries(receipt.idMap).map(([sourceId, id]) => {
      const row = rows.find(project => project.id === id);
      const expected = receipt.created.find(project => project.id === id)?.payload;
      return { sourceId, id, exists: Boolean(row), unchanged: Boolean(row && expected && Object.entries(expected).every(([key, value]) => row[key] === value)) };
    }), note: "Read-only inspection; no retries, uploads, updates or publication." };
}

async function loadBackend(needsStorage: boolean): Promise<Backend> {
  await import("dotenv/config");
  const required = ["DATABASE_URL", ...(needsStorage ? ["BUILT_IN_FORGE_API_URL", "BUILT_IN_FORGE_API_KEY"] : [])];
  const missing = required.filter(key => !process.env[key]);
  requireCondition(missing.length === 0, `MISSING_ENV_NAMES_ONLY: ${missing.join(", ")}`);
  const db = await import("../server/db.ts");
  const storage = needsStorage ? await import("../server/storage.ts") : null;
  return {
    list: async () => await db.getProjects({ limit: 10001 }),
    create: payload => db.createProject(payload),
    upload: (key, bytes, contentType) => {
      requireCondition(storage, "STORAGE_DISABLED_FOR_INSPECTION");
      return storage.storagePut(key, bytes, contentType);
    },
    close: async () => { const connection = await db.getDb(); if (connection) await connection.$client.end(); },
  };
}

async function main(args: string[]) {
  let releaseRoot: string | undefined;
  let receipt: string | undefined;
  let apply = false;
  let inspect = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--release-root") releaseRoot = args[++index];
    else if (arg === "--receipt") receipt = args[++index];
    else if (arg === "--apply") apply = true;
    else if (arg === "--inspect-receipt") inspect = true;
    else if (arg !== "--dry-run") throw new Error("UNKNOWN_ARGUMENT");
  }
  requireCondition(!(apply && inspect), "CHOOSE_APPLY_OR_INSPECT");
  requireCondition(!(apply && args.includes("--dry-run")), "CHOOSE_APPLY_OR_DRY_RUN");
  requireCondition(!apply && !inspect || receipt, "EXPLICIT_RECEIPT_PATH_REQUIRED");
  if (inspect) {
    const backend = await loadBackend(false);
    try { console.log(JSON.stringify(await inspectReceipt(receipt!, backend), null, 2)); }
    finally { await backend.close?.(); }
    return;
  }
  requireCondition(releaseRoot, "REQUIRED: --release-root /absolute/path/to/release");
  const plan = await buildPlan(releaseRoot);
  if (!apply) { console.log(JSON.stringify(plan, null, 2)); return; }
  const backend = await loadBackend(true);
  try {
    const result = await applyPlan(plan, receipt!, backend);
    console.log(JSON.stringify({ status: result.status, idMap: result.idMap, published: false, receipt: resolve(receipt!) }, null, 2));
  } finally { await backend.close?.(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    // Never echo provider errors, connection strings, API keys, cookies or signed URLs.
    const message = error instanceof Error && /^[A-Z][A-Z_ :,/a-z.-]*$/.test(error.message) ? error.message : "IMPORT_FAILED_CHECK_INPUTS_AND_RECEIPT";
    console.error(message);
    process.exitCode = 1;
  });
}
