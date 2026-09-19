import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("../", import.meta.url));
const requiredFiles = [
  "index.html", "contact/index.html", "projects/index.html", "solar-carport/index.html",
  "_headers", "robots.txt", "sitemap.xml",
  ...[640, 960, 1280].flatMap(width => ["avif", "jpg"].flatMap(ext => [
    `assets/optimized/solar-carport-hero-${width}.${ext}`,
    `assets/home-solution/home-solution-drone-hero-${width}.${ext}`,
  ])),
];

export function inspectPagesBuild(directory) {
  const root = path.resolve(directory);
  const errors = [];
  let files = 0;
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    return { ok: false, files, errors: ["Missing static build directory"] };
  }
  for (const relative of requiredFiles) {
    const target = path.join(root, relative);
    if (!fs.existsSync(target) || !fs.lstatSync(target).isFile() || fs.statSync(target).size === 0) {
      errors.push(`Missing or empty: ${relative}`);
    }
  }
  if (fs.existsSync(path.join(root, "404.html"))) {
    errors.push("Top-level 404.html disables the native SPA fallback used by this build");
  }
  const redirectsPath = path.join(root, "_redirects");
  if (fs.existsSync(redirectsPath)) {
    const rules = fs.readFileSync(redirectsPath, "utf8").split(/\r?\n/)
      .map(line => line.trim()).filter(line => line && !line.startsWith("#"));
    if (rules.some(line => /^\/\*\s+\/index\.html\s+200(?:\s|$)/.test(line))) {
      errors.push("Catch-all 200 rewrite can mask assets and generated SEO pages");
    }
  }
  function walk(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const absolute = path.join(folder, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join("/");
      if (entry.isSymbolicLink()) { errors.push(`Symlink not allowed: ${relative}`); continue; }
      if (/^(?:node_modules|server|\.git)$/.test(entry.name)) {
        errors.push(`Non-public directory or file: ${relative}`); continue;
      }
      if (entry.isDirectory()) { walk(absolute); continue; }
      files++;
      if (/^\.env(?:\.|$)|\.(?:map|pem|key)$|^(?:package(?:-lock)?\.json|pnpm-lock\.yaml)$/.test(entry.name) || relative === "index.js") {
        errors.push(`Non-public artifact: ${relative}`);
      }
      if (!entry.name.endsWith(".html")) continue;
      const html = fs.readFileSync(absolute, "utf8");
      // Validate local asset references, including entries in picture/srcset.
      for (const match of html.matchAll(/\/assets\/[^\s,"'<>]+/g)) {
        const asset = match[0].split(/[?#]/)[0];
        const target = path.resolve(root, `.${asset}`);
        if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
          errors.push(`Missing referenced asset in ${relative}: ${asset}`);
        }
      }
    }
  }
  walk(root);
  return { ok: errors.length === 0, files, errors: [...new Set(errors)] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = inspectPagesBuild(process.argv[2] ?? path.join(appRoot, "dist/public"));
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 1;
}
