import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

type QueueContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

type QueueResult = {
  id: string;
  path: string;
};

const MAX_STRING_LENGTH = 2000;

function getQueueFile(): string {
  const queueDir = process.env.SIRINX_LOCAL_QUEUE_DIR
    ? path.resolve(process.env.SIRINX_LOCAL_QUEUE_DIR)
    : path.resolve(process.cwd(), "runtime-output", "local-recovery-inbox");

  return path.join(queueDir, "leads.jsonl");
}

function normalizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.slice(0, MAX_STRING_LENGTH);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        normalizeValue(nestedValue),
      ])
    );
  }

  return value;
}

export function isDatabaseUnavailableError(error: unknown): boolean {
  return error instanceof Error && /database not available/i.test(error.message);
}

export async function queueLocalLeadSubmission(
  data: Record<string, unknown>,
  context: QueueContext = {}
): Promise<QueueResult> {
  const queueFile = getQueueFile();
  await fs.mkdir(path.dirname(queueFile), { recursive: true });

  const id = crypto.randomUUID();
  const record = {
    id,
    queuedAt: new Date().toISOString(),
    reason: "DATABASE_URL not configured or database unavailable",
    data: normalizeValue(data),
    context: normalizeValue(context),
  };

  await fs.appendFile(queueFile, `${JSON.stringify(record)}\n`, "utf-8");

  return {
    id,
    path: path.relative(process.cwd(), queueFile).replace(/\\/g, "/"),
  };
}
