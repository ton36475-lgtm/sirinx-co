/**
 * system-access.js — Controlled System Access Manager
 * ให้ AI agents เข้าถึงไฟล์ระบบได้ภายใต้ขอบเขตที่กำหนด
 * ทุก action ถูก audit logged ก่อน execute
 *
 * Security model:
 * - allowedPaths:    เข้าถึงได้เต็มที่ (read/write)
 * - restrictedPaths: บล็อกเสมอ ไม่ว่า agent ไหนจะขอ
 * - command execution: whitelist-based, timeout enforced
 */

import { execFile, spawn } from 'child_process';
import { promisify }       from 'util';
import {
  readFileSync, writeFileSync, readdirSync,
  statSync, mkdirSync, existsSync,
} from 'fs';
import { resolve, normalize, join } from 'path';
import { logger }                   from './config.js';

const execFileAsync = promisify(execFile);

// ===== Path Policy =====

const ALLOWED_PATHS = [
  'C:\\Users\\Ton36\\AI-WarRoom',
  'C:\\Travobet_AI',
];

const RESTRICTED_PATHS = [
  'C:\\Windows\\System32',
  'C:\\Windows\\SysWOW64',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  'C:\\Users\\Ton36\\AppData\\Roaming\\Microsoft',
  'C:\\Users\\Ton36\\.ssh',
  'C:\\Users\\Ton36\\.gnupg',
];

// Whitelisted commands — only these can be executed
const ALLOWED_COMMANDS = new Set([
  'node', 'npm', 'npx', 'git', 'python', 'python3',
  'curl', 'ping', 'netstat', 'tasklist',
  'powershell', 'cmd',
]);

// Commands that need extra confirmation even if whitelisted
const HIGH_RISK_ARGS = [
  /--force/i, /\-\-hard/, /rm\s+-rf/i, /format/, /drop\s+table/i,
  /delete.*prod/i, /truncate/i,
];

// ===== SystemAccess Class =====

export class SystemAccess {
  constructor() {
    this._auditLog    = [];
    this._opCounter   = 0;
  }

  // ========== Path Validation ==========

  /**
   * ตรวจสอบว่า path อยู่ใน allowed zone หรือไม่
   */
  _isAllowed(targetPath) {
    const normalized = normalize(resolve(targetPath));

    // ตรวจ restricted ก่อน (hardblock)
    for (const restricted of RESTRICTED_PATHS) {
      if (normalized.toLowerCase().startsWith(normalize(restricted).toLowerCase())) {
        return { allowed: false, reason: `Path is in restricted zone: ${restricted}` };
      }
    }

    // ตรวจ allowed
    for (const allowed of ALLOWED_PATHS) {
      if (normalized.toLowerCase().startsWith(normalize(allowed).toLowerCase())) {
        return { allowed: true };
      }
    }

    return { allowed: false, reason: `Path is outside allowed zones. Allowed: ${ALLOWED_PATHS.join(', ')}` };
  }

  // ========== File Operations ==========

  /**
   * อ่านไฟล์
   * @param {string} filePath
   * @param {string} [encoding='utf-8']
   * @returns {string}
   */
  readFile(filePath, encoding = 'utf-8') {
    const check = this._isAllowed(filePath);
    if (!check.allowed) {
      this._audit('readFile', filePath, 'BLOCKED', check.reason);
      throw new Error(`[system-access] READ BLOCKED: ${check.reason}`);
    }

    try {
      const content = readFileSync(filePath, encoding);
      this._audit('readFile', filePath, 'OK', `${content.length} bytes`);
      return content;
    } catch (err) {
      this._audit('readFile', filePath, 'ERROR', err.message);
      throw err;
    }
  }

  /**
   * เขียนไฟล์
   * @param {string} filePath
   * @param {string} content
   * @param {string} [encoding='utf-8']
   */
  writeFile(filePath, content, encoding = 'utf-8') {
    const check = this._isAllowed(filePath);
    if (!check.allowed) {
      this._audit('writeFile', filePath, 'BLOCKED', check.reason);
      throw new Error(`[system-access] WRITE BLOCKED: ${check.reason}`);
    }

    try {
      // Auto-create directory if needed
      const dir = filePath.replace(/[/\\][^/\\]+$/, '');
      if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });

      writeFileSync(filePath, content, encoding);
      this._audit('writeFile', filePath, 'OK', `${content.length} bytes written`);
    } catch (err) {
      this._audit('writeFile', filePath, 'ERROR', err.message);
      throw err;
    }
  }

  /**
   * แสดงรายการไฟล์ในไดเรกทอรี
   * @param {string} dirPath
   * @returns {Array<{name: string, type: 'file'|'dir', size: number, mtime: Date}>}
   */
  listDir(dirPath) {
    const check = this._isAllowed(dirPath);
    if (!check.allowed) {
      this._audit('listDir', dirPath, 'BLOCKED', check.reason);
      throw new Error(`[system-access] LIST BLOCKED: ${check.reason}`);
    }

    try {
      const entries = readdirSync(dirPath);
      const result  = entries.map(name => {
        const fullPath = join(dirPath, name);
        try {
          const stat = statSync(fullPath);
          return { name, type: stat.isDirectory() ? 'dir' : 'file', size: stat.size, mtime: stat.mtime };
        } catch {
          return { name, type: 'unknown', size: 0, mtime: null };
        }
      });

      this._audit('listDir', dirPath, 'OK', `${result.length} entries`);
      return result;
    } catch (err) {
      this._audit('listDir', dirPath, 'ERROR', err.message);
      throw err;
    }
  }

  // ========== Command Execution ==========

  /**
   * Execute shell command (whitelist-based)
   * @param {string}   cmd          — Command name (must be in ALLOWED_COMMANDS)
   * @param {string[]} args         — Arguments
   * @param {Object}   [options]
   * @param {string}   [options.cwd]        — Working directory
   * @param {number}   [options.timeoutMs=30000]
   * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
   */
  async runCommand(cmd, args = [], options = {}) {
    const { cwd = process.cwd(), timeoutMs = 30_000 } = options;

    // Whitelist check
    const baseCmd = cmd.toLowerCase().replace(/\.exe$/i, '');
    if (!ALLOWED_COMMANDS.has(baseCmd)) {
      this._audit('runCommand', cmd, 'BLOCKED', `Command "${cmd}" not in whitelist`);
      throw new Error(`[system-access] COMMAND BLOCKED: "${cmd}" is not whitelisted`);
    }

    // Working directory check
    const cwdCheck = this._isAllowed(cwd);
    if (!cwdCheck.allowed) {
      this._audit('runCommand', cmd, 'BLOCKED', `cwd "${cwd}" not allowed`);
      throw new Error(`[system-access] CWD BLOCKED: ${cwdCheck.reason}`);
    }

    // High-risk arg check
    const fullCmd = [cmd, ...args].join(' ');
    for (const pattern of HIGH_RISK_ARGS) {
      if (pattern.test(fullCmd)) {
        this._audit('runCommand', cmd, 'BLOCKED', `High-risk argument pattern detected: ${pattern}`);
        throw new Error(`[system-access] HIGH-RISK ARGS detected in: "${fullCmd}"`);
      }
    }

    this._audit('runCommand', cmd, 'STARTING', `args: ${args.slice(0, 5).join(' ')}`);
    logger.info(`[system-access] ▶ ${cmd} ${args.slice(0, 5).join(' ')}`);

    try {
      const { stdout, stderr } = await execFileAsync(cmd, args, {
        cwd,
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,  // 10 MB
      });

      this._audit('runCommand', cmd, 'OK', `exit 0`);
      return { stdout: stdout || '', stderr: stderr || '', exitCode: 0 };
    } catch (err) {
      const exitCode = err.code || 1;
      this._audit('runCommand', cmd, 'ERROR', `exit ${exitCode}: ${err.message.slice(0, 120)}`);
      return {
        stdout:   err.stdout || '',
        stderr:   err.stderr || err.message,
        exitCode: typeof exitCode === 'number' ? exitCode : 1,
      };
    }
  }

  /**
   * Stream long-running command (returns process handle)
   * @param {string}   cmd
   * @param {string[]} args
   * @param {Object}   options
   * @returns {ChildProcess}
   */
  spawnProcess(cmd, args = [], options = {}) {
    const baseCmd = cmd.toLowerCase().replace(/\.exe$/i, '');
    if (!ALLOWED_COMMANDS.has(baseCmd)) {
      throw new Error(`[system-access] SPAWN BLOCKED: "${cmd}" not whitelisted`);
    }

    this._audit('spawnProcess', cmd, 'SPAWN', args.slice(0, 3).join(' '));
    return spawn(cmd, args, { ...options, shell: false });
  }

  // ========== Process Management ==========

  /**
   * รายชื่อ processes ที่กำลังทำงาน (Windows)
   * @returns {Promise<Array<{pid: number, name: string, mem: string}>>}
   */
  async listProcesses() {
    this._audit('listProcesses', 'system', 'OK', '');
    const { stdout } = await this.runCommand('tasklist', ['/FO', 'CSV', '/NH'], { timeoutMs: 10_000 });
    const lines = stdout.trim().split('\n').filter(Boolean);

    return lines.map(line => {
      const parts = line.replace(/"/g, '').split(',');
      return {
        name: parts[0] || '',
        pid:  parseInt(parts[1]) || 0,
        mem:  parts[4]?.trim() || '',
      };
    }).filter(p => p.pid > 0);
  }

  // ========== Audit Log ==========

  _audit(operation, target, status, detail) {
    const entry = {
      ts:        new Date().toISOString(),
      opId:      ++this._opCounter,
      operation,
      target:    String(target).slice(0, 200),
      status,
      detail:    String(detail).slice(0, 200),
    };

    this._auditLog.push(entry);
    if (this._auditLog.length > 1000) this._auditLog.shift();

    if (status === 'BLOCKED' || status === 'ERROR') {
      logger.warn(`[system-access] ${status} | ${operation} | ${String(target).slice(0, 60)} | ${detail}`);
    } else {
      logger.debug(`[system-access] ${status} | ${operation} | ${String(target).slice(0, 60)}`);
    }
  }

  getAuditLog(limit = 50) {
    return this._auditLog.slice(-limit);
  }

  getAllowedPaths() {
    return [...ALLOWED_PATHS];
  }
}

// Singleton
let _instance = null;
export function getSystemAccess() {
  if (!_instance) _instance = new SystemAccess();
  return _instance;
}

export default SystemAccess;
