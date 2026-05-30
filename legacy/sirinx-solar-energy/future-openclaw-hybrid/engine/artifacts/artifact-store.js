/**
 * artifact-store.js — Structured Artifact Storage
 * จัดการ read/write structured artifacts (JSON) ระหว่าง models
 * Models สื่อสารกันผ่าน artifacts เท่านั้น — ไม่ใช่ free-form chat
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ENGINE, logger } from '../config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class ArtifactStore {
  /**
   * @param {string} [storeDir] — Path สำหรับเก็บ artifacts
   */
  constructor(storeDir = null) {
    this.storeDir = storeDir || ENGINE.artifactDir || resolve(__dirname, '../artifacts/store');
    this._ensureDir(this.storeDir);
  }

  /**
   * บันทึก artifact
   * @param {string} id         — Artifact ID (unique per workflow run)
   * @param {string} type       — Artifact type (task, draft, review, finding, handoff, result)
   * @param {Object} data       — Artifact data
   * @param {Object} [meta]     — Metadata (model, timestamp, etc.)
   * @returns {string}          — File path
   */
  write(id, type, data, meta = {}) {
    const artifact = {
      _meta: {
        id,
        type,
        createdAt:  new Date().toISOString(),
        ...meta,
      },
      ...data,
    };

    const filename = this._filename(id, type);
    const filepath = join(this.storeDir, filename);
    writeFileSync(filepath, JSON.stringify(artifact, null, 2), 'utf-8');
    logger.debug(`[artifacts] write: ${filename}`);
    return filepath;
  }

  /**
   * อ่าน artifact
   * @param {string} id
   * @param {string} [type]    — ถ้าไม่ระบุ จะค้นหาทุก type
   * @returns {Object | null}
   */
  read(id, type = null) {
    if (type) {
      const filepath = join(this.storeDir, this._filename(id, type));
      if (!existsSync(filepath)) return null;
      return JSON.parse(readFileSync(filepath, 'utf-8'));
    }

    // ค้นหาทุก type
    const files = this._listFiles().filter(f => f.startsWith(`${id}_`));
    if (files.length === 0) return null;
    const filepath = join(this.storeDir, files[files.length - 1]);
    return JSON.parse(readFileSync(filepath, 'utf-8'));
  }

  /**
   * ดึง artifacts ทั้งหมดของ workflow run หนึ่ง
   * @param {string} runId
   * @returns {Object[]}
   */
  readAll(runId) {
    const files = this._listFiles().filter(f => f.startsWith(`${runId}_`));
    return files.map(f => {
      try {
        return JSON.parse(readFileSync(join(this.storeDir, f), 'utf-8'));
      } catch { return null; }
    }).filter(Boolean);
  }

  /**
   * สร้าง task artifact — input สำหรับ workflow
   * @param {string} runId
   * @param {string} task
   * @param {Object} params
   * @returns {string} filepath
   */
  writeTask(runId, task, params = {}) {
    return this.write(runId, 'task', {
      task,
      params,
      status: 'pending',
    }, { runId });
  }

  /**
   * สร้าง draft artifact — output จาก drafter model
   * @param {string} runId
   * @param {string} content
   * @param {Object} modelOutput — ModelOutput ดิบ
   * @returns {string} filepath
   */
  writeDraft(runId, content, modelOutput) {
    return this.write(runId, 'draft', {
      content,
      model:     modelOutput.modelId,
      provider:  modelOutput.provider,
      usage:     modelOutput.usage,
      cost:      modelOutput.cost,
      latencyMs: modelOutput.latencyMs,
    }, { runId, round: modelOutput.round || 1 });
  }

  /**
   * สร้าง review artifact — feedback จาก reviewer model
   * @param {string} runId
   * @param {Object} reviewOutput — ReviewOutput
   * @returns {string} filepath
   */
  writeReview(runId, reviewOutput) {
    return this.write(runId, 'review', {
      approved:        reviewOutput.approved,
      score:           reviewOutput.score,
      recommendation:  reviewOutput.recommendation,
      summary:         reviewOutput.summary,
      findings:        reviewOutput.findings,
      strengths:       reviewOutput.strengths,
      requiredChanges: reviewOutput.requiredChanges,
      model:           reviewOutput.raw?.modelId,
      cost:            reviewOutput.raw?.cost,
    }, { runId });
  }

  /**
   * สร้าง final result artifact
   * @param {string} runId
   * @param {Object} result
   * @returns {string} filepath
   */
  writeResult(runId, result) {
    return this.write(runId, 'result', {
      ...result,
      completedAt: new Date().toISOString(),
    }, { runId });
  }

  /**
   * อ่าน context สำหรับส่งไปยัง model (เป็น string)
   * @param {string} runId
   * @returns {string}
   */
  buildContext(runId) {
    const artifacts = this.readAll(runId);
    if (artifacts.length === 0) return '';

    const parts = artifacts.map(a => {
      const type = a._meta?.type || 'unknown';
      if (type === 'task')   return `[Task]\n${a.task}\nParams: ${JSON.stringify(a.params)}`;
      if (type === 'draft')  return `[Previous Draft by ${a.provider}]\n${a.content}`;
      if (type === 'review') return `[Review by ${a.model}]\nScore: ${a.score}/100\nFindings: ${JSON.stringify(a.findings, null, 2)}\nRequired changes: ${JSON.stringify(a.requiredChanges)}`;
      return '';
    }).filter(Boolean);

    return parts.join('\n\n---\n\n');
  }

  /**
   * ลบ artifacts เก่า (cleanup)
   * @param {number} [olderThanMs] — default 24 ชั่วโมง
   */
  cleanup(olderThanMs = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - olderThanMs;
    const files  = this._listFiles();
    let deleted  = 0;

    for (const file of files) {
      const filepath = join(this.storeDir, file);
      const mtime    = statSync(filepath).mtimeMs;
      if (mtime < cutoff) {
        try {
          // ใช้ unlink แทน rmSync เพื่อ compatibility
          import('fs').then(fs => fs.unlinkSync(filepath));
          deleted++;
        } catch {}
      }
    }

    if (deleted > 0) logger.info(`[artifacts] cleanup: deleted ${deleted} old artifacts`);
  }

  /**
   * list ไฟล์ทั้งหมดใน store
   */
  _listFiles() {
    try {
      return readdirSync(this.storeDir)
        .filter(f => f.endsWith('.json'))
        .sort();
    } catch {
      return [];
    }
  }

  /**
   * สร้างชื่อไฟล์
   */
  _filename(id, type) {
    const ts = Date.now();
    return `${id}_${type}_${ts}.json`;
  }

  /**
   * สร้าง directory ถ้ายังไม่มี
   */
  _ensureDir(dir) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      logger.debug(`[artifacts] created store dir: ${dir}`);
    }
  }
}

// Singleton
let _store = null;
export function getArtifactStore() {
  if (!_store) _store = new ArtifactStore();
  return _store;
}

export default ArtifactStore;
