/**
 * Minimal static server for dist/public, matching how a static host resolves a
 * directory to its index.html. Used to verify a build over HTTP the way a
 * crawler sees it, not by reading files off disk.
 */
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve } from "node:path";

const ROOT = resolve(process.argv[2] || "dist/public");
const PORT = Number(process.argv[3] || 18790);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
      let filePath = join(ROOT, decodeURIComponent(url.pathname));
      if (!filePath.startsWith(ROOT)) {
        res.writeHead(403).end("forbidden");
        return;
      }
      const info = await stat(filePath).catch(() => null);
      if (info?.isDirectory()) filePath = join(filePath, "index.html");
      const body = await readFile(filePath);
      res.writeHead(200, { "content-type": TYPES[extname(filePath)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      res.end("<h1>404</h1>");
    }
  })
  .listen(PORT, "127.0.0.1", () => {
    console.log(`serving ${ROOT} at http://127.0.0.1:${PORT}`);
  });
