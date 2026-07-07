import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { injectOgTags } from "../ogTags";

function getBaseUrl(req: express.Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "sirinx.co";
  return `${proto}://${host}`;
}

function resolveStaticDistPath(): string {
  const candidates = [
    path.resolve(import.meta.dirname, "../..", "dist", "public"),
    path.resolve(import.meta.dirname, "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "apps", "web-sirinx", "dist", "public"),
  ];

  return (
    candidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html"))) ??
    candidates[0]
  );
}

export async function setupVite(app: Express, server: Server) {
  const viteModuleName = "vite";
  const viteConfigModule = "../../vite.config";
  const [{ createServer: createViteServer }, { default: viteConfig }] =
    await Promise.all([import(viteModuleName), import(viteConfigModule)]);

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      // Inject route-specific OG tags for social media crawlers
      const baseUrl = getBaseUrl(req);
      template = injectOgTags(template, url, baseUrl);

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = resolveStaticDistPath();
  if (!fs.existsSync(path.join(distPath, "index.html"))) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath, { redirect: false }));

  // fall through to index.html if the file doesn't exist
  // Also inject OG tags for production mode
  app.use("*", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      res.status(500).send("Build output is missing. Run the client build before starting production.");
      return;
    }
    let html = fs.readFileSync(indexPath, "utf-8");
    const baseUrl = getBaseUrl(req);
    html = injectOgTags(html, req.originalUrl, baseUrl);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  });
}
