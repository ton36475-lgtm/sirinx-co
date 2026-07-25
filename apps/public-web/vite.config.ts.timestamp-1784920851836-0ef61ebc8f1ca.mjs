// vite.config.ts
import { jsxLocPlugin } from "file:///sessions/wizardly-optimistic-planck/mnt/SIRINXDev/sirinx-agent-native-os/node_modules/.pnpm/@builder.io+vite-plugin-jsx-loc@0.1.1_vite@7.3.6_@types+node@24.13.3_jiti@2.7.0_lightningcss@1.32.0_tsx@4.23.1_/node_modules/@builder.io/vite-plugin-jsx-loc/dist/index.js";
import tailwindcss from "file:///sessions/wizardly-optimistic-planck/mnt/SIRINXDev/sirinx-agent-native-os/node_modules/.pnpm/@tailwindcss+vite@4.3.3_vite@7.3.6_@types+node@24.13.3_jiti@2.7.0_lightningcss@1.32.0_tsx@4.23.1_/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///sessions/wizardly-optimistic-planck/mnt/SIRINXDev/sirinx-agent-native-os/node_modules/.pnpm/@vitejs+plugin-react@5.2.0_vite@7.3.6_@types+node@24.13.3_jiti@2.7.0_lightningcss@1.32.0_tsx@4.23.1_/node_modules/@vitejs/plugin-react/dist/index.js";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "file:///sessions/wizardly-optimistic-planck/mnt/SIRINXDev/sirinx-agent-native-os/node_modules/.pnpm/vite@7.3.6_@types+node@24.13.3_jiti@2.7.0_lightningcss@1.32.0_tsx@4.23.1/node_modules/vite/dist/node/index.js";
import { vitePluginManusRuntime } from "file:///sessions/wizardly-optimistic-planck/mnt/SIRINXDev/sirinx-agent-native-os/node_modules/.pnpm/vite-plugin-manus-runtime@0.0.57/node_modules/vite-plugin-manus-runtime/dist/index.js";
import obfuscatorPlugin from "file:///sessions/wizardly-optimistic-planck/mnt/SIRINXDev/sirinx-agent-native-os/node_modules/.pnpm/vite-plugin-javascript-obfuscator@3.1.0/node_modules/vite-plugin-javascript-obfuscator/dist/index.cjs.js";
var __vite_injected_original_dirname = "/sessions/wizardly-optimistic-planck/mnt/SIRINXDev/sirinx-agent-native-os/apps/public-web";
var PROJECT_ROOT = __vite_injected_original_dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var isProduction = process.env.NODE_ENV === "production";
var enableProductionObfuscation = isProduction && process.env.VITE_ENABLE_JS_OBFUSCATION === "true";
var plugins = [
  react(),
  tailwindcss(),
  ...!isProduction ? [
    jsxLocPlugin(),
    vitePluginManusRuntime(),
    vitePluginManusDebugCollector()
  ] : [],
  // Anti-Copy: keep heavy JS obfuscation opt-in for production handoff builds.
  ...enableProductionObfuscation ? [
    obfuscatorPlugin({
      options: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.2,
        debugProtection: false,
        disableConsoleOutput: false,
        identifierNamesGenerator: "hexadecimal",
        renameGlobals: false,
        selfDefending: true,
        stringArray: true,
        stringArrayEncoding: ["base64"],
        stringArrayThreshold: 0.75,
        domainLock: [],
        domainLockRedirectUrl: "about:blank"
      }
    })
  ] : []
];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "client", "src"),
      "@shared": path.resolve(__vite_injected_original_dirname, "shared"),
      "@assets": path.resolve(__vite_injected_original_dirname, "attached_assets")
    }
  },
  envDir: path.resolve(__vite_injected_original_dirname),
  root: path.resolve(__vite_injected_original_dirname, "client"),
  publicDir: path.resolve(__vite_injected_original_dirname, "client", "public"),
  build: {
    outDir: path.resolve(__vite_injected_original_dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    // Anti-Copy: Never expose source maps in production
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/wouter/") || id.includes("/react-helmet-async/")) {
            return "vendor-react";
          }
          if (id.includes("/@tanstack/") || id.includes("/@trpc/") || id.includes("/superjson/")) {
            return "vendor-data";
          }
          if (id.includes("/@radix-ui/") || id.includes("/cmdk/") || id.includes("/vaul/")) {
            return "vendor-ui";
          }
          if (id.includes("/framer-motion/")) {
            return "vendor-motion";
          }
          if (id.includes("/recharts/") || id.includes("/d3-")) {
            return "vendor-charts";
          }
          if (id.includes("/streamdown/") || id.includes("/shiki/") || id.includes("/mermaid/") || id.includes("/katex/") || id.includes("/micromark") || id.includes("/remark") || id.includes("/rehype") || id.includes("/hast") || id.includes("/unist")) {
            return "vendor-markdown";
          }
          return void 0;
        }
      }
    }
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvd2l6YXJkbHktb3B0aW1pc3RpYy1wbGFuY2svbW50L1NJUklOWERldi9zaXJpbngtYWdlbnQtbmF0aXZlLW9zL2FwcHMvcHVibGljLXdlYlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL3dpemFyZGx5LW9wdGltaXN0aWMtcGxhbmNrL21udC9TSVJJTlhEZXYvc2lyaW54LWFnZW50LW5hdGl2ZS1vcy9hcHBzL3B1YmxpYy13ZWIvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL3dpemFyZGx5LW9wdGltaXN0aWMtcGxhbmNrL21udC9TSVJJTlhEZXYvc2lyaW54LWFnZW50LW5hdGl2ZS1vcy9hcHBzL3B1YmxpYy13ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBqc3hMb2NQbHVnaW4gfSBmcm9tIFwiQGJ1aWxkZXIuaW8vdml0ZS1wbHVnaW4tanN4LWxvY1wiO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IGZzIGZyb20gXCJub2RlOmZzXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIHR5cGUgUGx1Z2luLCB0eXBlIFZpdGVEZXZTZXJ2ZXIgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgdml0ZVBsdWdpbk1hbnVzUnVudGltZSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1tYW51cy1ydW50aW1lXCI7XG5pbXBvcnQgb2JmdXNjYXRvclBsdWdpbiBmcm9tIFwidml0ZS1wbHVnaW4tamF2YXNjcmlwdC1vYmZ1c2NhdG9yXCI7XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBNYW51cyBEZWJ1ZyBDb2xsZWN0b3IgLSBWaXRlIFBsdWdpblxuLy8gV3JpdGVzIGJyb3dzZXIgbG9ncyBkaXJlY3RseSB0byBmaWxlcywgdHJpbW1lZCB3aGVuIGV4Y2VlZGluZyBzaXplIGxpbWl0XG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5jb25zdCBQUk9KRUNUX1JPT1QgPSBpbXBvcnQubWV0YS5kaXJuYW1lO1xuY29uc3QgTE9HX0RJUiA9IHBhdGguam9pbihQUk9KRUNUX1JPT1QsIFwiLm1hbnVzLWxvZ3NcIik7XG5jb25zdCBNQVhfTE9HX1NJWkVfQllURVMgPSAxICogMTAyNCAqIDEwMjQ7IC8vIDFNQiBwZXIgbG9nIGZpbGVcbmNvbnN0IFRSSU1fVEFSR0VUX0JZVEVTID0gTWF0aC5mbG9vcihNQVhfTE9HX1NJWkVfQllURVMgKiAwLjYpOyAvLyBUcmltIHRvIDYwJSB0byBhdm9pZCBjb25zdGFudCByZS10cmltbWluZ1xuXG50eXBlIExvZ1NvdXJjZSA9IFwiYnJvd3NlckNvbnNvbGVcIiB8IFwibmV0d29ya1JlcXVlc3RzXCIgfCBcInNlc3Npb25SZXBsYXlcIjtcblxuZnVuY3Rpb24gZW5zdXJlTG9nRGlyKCkge1xuICBpZiAoIWZzLmV4aXN0c1N5bmMoTE9HX0RJUikpIHtcbiAgICBmcy5ta2RpclN5bmMoTE9HX0RJUiwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJpbUxvZ0ZpbGUobG9nUGF0aDogc3RyaW5nLCBtYXhTaXplOiBudW1iZXIpIHtcbiAgdHJ5IHtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMobG9nUGF0aCkgfHwgZnMuc3RhdFN5bmMobG9nUGF0aCkuc2l6ZSA8PSBtYXhTaXplKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGluZXMgPSBmcy5yZWFkRmlsZVN5bmMobG9nUGF0aCwgXCJ1dGYtOFwiKS5zcGxpdChcIlxcblwiKTtcbiAgICBjb25zdCBrZXB0TGluZXM6IHN0cmluZ1tdID0gW107XG4gICAgbGV0IGtlcHRCeXRlcyA9IDA7XG5cbiAgICAvLyBLZWVwIG5ld2VzdCBsaW5lcyAoZnJvbSBlbmQpIHRoYXQgZml0IHdpdGhpbiA2MCUgb2YgbWF4U2l6ZVxuICAgIGNvbnN0IHRhcmdldFNpemUgPSBUUklNX1RBUkdFVF9CWVRFUztcbiAgICBmb3IgKGxldCBpID0gbGluZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGNvbnN0IGxpbmVCeXRlcyA9IEJ1ZmZlci5ieXRlTGVuZ3RoKGAke2xpbmVzW2ldfVxcbmAsIFwidXRmLThcIik7XG4gICAgICBpZiAoa2VwdEJ5dGVzICsgbGluZUJ5dGVzID4gdGFyZ2V0U2l6ZSkgYnJlYWs7XG4gICAgICBrZXB0TGluZXMudW5zaGlmdChsaW5lc1tpXSk7XG4gICAgICBrZXB0Qnl0ZXMgKz0gbGluZUJ5dGVzO1xuICAgIH1cblxuICAgIGZzLndyaXRlRmlsZVN5bmMobG9nUGF0aCwga2VwdExpbmVzLmpvaW4oXCJcXG5cIiksIFwidXRmLThcIik7XG4gIH0gY2F0Y2gge1xuICAgIC8qIGlnbm9yZSB0cmltIGVycm9ycyAqL1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyaXRlVG9Mb2dGaWxlKHNvdXJjZTogTG9nU291cmNlLCBlbnRyaWVzOiB1bmtub3duW10pIHtcbiAgaWYgKGVudHJpZXMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgZW5zdXJlTG9nRGlyKCk7XG4gIGNvbnN0IGxvZ1BhdGggPSBwYXRoLmpvaW4oTE9HX0RJUiwgYCR7c291cmNlfS5sb2dgKTtcblxuICAvLyBGb3JtYXQgZW50cmllcyB3aXRoIHRpbWVzdGFtcHNcbiAgY29uc3QgbGluZXMgPSBlbnRyaWVzLm1hcCgoZW50cnkpID0+IHtcbiAgICBjb25zdCB0cyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICByZXR1cm4gYFske3RzfV0gJHtKU09OLnN0cmluZ2lmeShlbnRyeSl9YDtcbiAgfSk7XG5cbiAgLy8gQXBwZW5kIHRvIGxvZyBmaWxlXG4gIGZzLmFwcGVuZEZpbGVTeW5jKGxvZ1BhdGgsIGAke2xpbmVzLmpvaW4oXCJcXG5cIil9XFxuYCwgXCJ1dGYtOFwiKTtcblxuICAvLyBUcmltIGlmIGV4Y2VlZHMgbWF4IHNpemVcbiAgdHJpbUxvZ0ZpbGUobG9nUGF0aCwgTUFYX0xPR19TSVpFX0JZVEVTKTtcbn1cblxuLyoqXG4gKiBWaXRlIHBsdWdpbiB0byBjb2xsZWN0IGJyb3dzZXIgZGVidWcgbG9nc1xuICogLSBQT1NUIC9fX21hbnVzX18vbG9nczogQnJvd3NlciBzZW5kcyBsb2dzLCB3cml0dGVuIGRpcmVjdGx5IHRvIGZpbGVzXG4gKiAtIEZpbGVzOiBicm93c2VyQ29uc29sZS5sb2csIG5ldHdvcmtSZXF1ZXN0cy5sb2csIHNlc3Npb25SZXBsYXkubG9nXG4gKiAtIEF1dG8tdHJpbW1lZCB3aGVuIGV4Y2VlZGluZyAxTUIgKGtlZXBzIG5ld2VzdCBlbnRyaWVzKVxuICovXG5mdW5jdGlvbiB2aXRlUGx1Z2luTWFudXNEZWJ1Z0NvbGxlY3RvcigpOiBQbHVnaW4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6IFwibWFudXMtZGVidWctY29sbGVjdG9yXCIsXG5cbiAgICB0cmFuc2Zvcm1JbmRleEh0bWwoaHRtbCkge1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcInByb2R1Y3Rpb25cIikge1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGh0bWwsXG4gICAgICAgIHRhZ3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0YWc6IFwic2NyaXB0XCIsXG4gICAgICAgICAgICBhdHRyczoge1xuICAgICAgICAgICAgICBzcmM6IFwiL19fbWFudXNfXy9kZWJ1Zy1jb2xsZWN0b3IuanNcIixcbiAgICAgICAgICAgICAgZGVmZXI6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5qZWN0VG86IFwiaGVhZFwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyOiBWaXRlRGV2U2VydmVyKSB7XG4gICAgICAvLyBQT1NUIC9fX21hbnVzX18vbG9nczogQnJvd3NlciBzZW5kcyBsb2dzICh3cml0dGVuIGRpcmVjdGx5IHRvIGZpbGVzKVxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShcIi9fX21hbnVzX18vbG9nc1wiLCAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09IFwiUE9TVFwiKSB7XG4gICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhhbmRsZVBheWxvYWQgPSAocGF5bG9hZDogYW55KSA9PiB7XG4gICAgICAgICAgLy8gV3JpdGUgbG9ncyBkaXJlY3RseSB0byBmaWxlc1xuICAgICAgICAgIGlmIChwYXlsb2FkLmNvbnNvbGVMb2dzPy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB3cml0ZVRvTG9nRmlsZShcImJyb3dzZXJDb25zb2xlXCIsIHBheWxvYWQuY29uc29sZUxvZ3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocGF5bG9hZC5uZXR3b3JrUmVxdWVzdHM/Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHdyaXRlVG9Mb2dGaWxlKFwibmV0d29ya1JlcXVlc3RzXCIsIHBheWxvYWQubmV0d29ya1JlcXVlc3RzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHBheWxvYWQuc2Vzc2lvbkV2ZW50cz8ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgd3JpdGVUb0xvZ0ZpbGUoXCJzZXNzaW9uUmVwbGF5XCIsIHBheWxvYWQuc2Vzc2lvbkV2ZW50cyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUgfSkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlcUJvZHkgPSAocmVxIGFzIHsgYm9keT86IHVua25vd24gfSkuYm9keTtcbiAgICAgICAgaWYgKHJlcUJvZHkgJiYgdHlwZW9mIHJlcUJvZHkgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaGFuZGxlUGF5bG9hZChyZXFCb2R5KTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IFN0cmluZyhlKSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBib2R5ID0gXCJcIjtcbiAgICAgICAgcmVxLm9uKFwiZGF0YVwiLCAoY2h1bmspID0+IHtcbiAgICAgICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlcS5vbihcImVuZFwiLCAoKSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBheWxvYWQgPSBKU09OLnBhcnNlKGJvZHkpO1xuICAgICAgICAgICAgaGFuZGxlUGF5bG9hZChwYXlsb2FkKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IFN0cmluZyhlKSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH07XG59XG5cbmNvbnN0IGlzUHJvZHVjdGlvbiA9IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcInByb2R1Y3Rpb25cIjtcbmNvbnN0IGVuYWJsZVByb2R1Y3Rpb25PYmZ1c2NhdGlvbiA9XG4gIGlzUHJvZHVjdGlvbiAmJiBwcm9jZXNzLmVudi5WSVRFX0VOQUJMRV9KU19PQkZVU0NBVElPTiA9PT0gXCJ0cnVlXCI7XG5cbmNvbnN0IHBsdWdpbnMgPSBbXG4gIHJlYWN0KCksXG4gIHRhaWx3aW5kY3NzKCksXG4gIC4uLighaXNQcm9kdWN0aW9uXG4gICAgPyBbXG4gICAgICAgIGpzeExvY1BsdWdpbigpLFxuICAgICAgICB2aXRlUGx1Z2luTWFudXNSdW50aW1lKCksXG4gICAgICAgIHZpdGVQbHVnaW5NYW51c0RlYnVnQ29sbGVjdG9yKCksXG4gICAgICBdXG4gICAgOiBbXSksXG4gIC8vIEFudGktQ29weToga2VlcCBoZWF2eSBKUyBvYmZ1c2NhdGlvbiBvcHQtaW4gZm9yIHByb2R1Y3Rpb24gaGFuZG9mZiBidWlsZHMuXG4gIC4uLihlbmFibGVQcm9kdWN0aW9uT2JmdXNjYXRpb25cbiAgICA/IFtcbiAgICAgICAgb2JmdXNjYXRvclBsdWdpbih7XG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgY29tcGFjdDogdHJ1ZSxcbiAgICAgICAgICAgIGNvbnRyb2xGbG93RmxhdHRlbmluZzogdHJ1ZSxcbiAgICAgICAgICAgIGNvbnRyb2xGbG93RmxhdHRlbmluZ1RocmVzaG9sZDogMC41LFxuICAgICAgICAgICAgZGVhZENvZGVJbmplY3Rpb246IHRydWUsXG4gICAgICAgICAgICBkZWFkQ29kZUluamVjdGlvblRocmVzaG9sZDogMC4yLFxuICAgICAgICAgICAgZGVidWdQcm90ZWN0aW9uOiBmYWxzZSxcbiAgICAgICAgICAgIGRpc2FibGVDb25zb2xlT3V0cHV0OiBmYWxzZSxcbiAgICAgICAgICAgIGlkZW50aWZpZXJOYW1lc0dlbmVyYXRvcjogXCJoZXhhZGVjaW1hbFwiLFxuICAgICAgICAgICAgcmVuYW1lR2xvYmFsczogZmFsc2UsXG4gICAgICAgICAgICBzZWxmRGVmZW5kaW5nOiB0cnVlLFxuICAgICAgICAgICAgc3RyaW5nQXJyYXk6IHRydWUsXG4gICAgICAgICAgICBzdHJpbmdBcnJheUVuY29kaW5nOiBbXCJiYXNlNjRcIl0sXG4gICAgICAgICAgICBzdHJpbmdBcnJheVRocmVzaG9sZDogMC43NSxcbiAgICAgICAgICAgIGRvbWFpbkxvY2s6IFtdLFxuICAgICAgICAgICAgZG9tYWluTG9ja1JlZGlyZWN0VXJsOiBcImFib3V0OmJsYW5rXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgOiBbXSksXG5dO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJjbGllbnRcIiwgXCJzcmNcIiksXG4gICAgICBcIkBzaGFyZWRcIjogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUsIFwic2hhcmVkXCIpLFxuICAgICAgXCJAYXNzZXRzXCI6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCBcImF0dGFjaGVkX2Fzc2V0c1wiKSxcbiAgICB9LFxuICB9LFxuICBlbnZEaXI6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lKSxcbiAgcm9vdDogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUsIFwiY2xpZW50XCIpLFxuICBwdWJsaWNEaXI6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCBcImNsaWVudFwiLCBcInB1YmxpY1wiKSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCBcImRpc3QvcHVibGljXCIpLFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgIHNvdXJjZW1hcDogZmFsc2UsIC8vIEFudGktQ29weTogTmV2ZXIgZXhwb3NlIHNvdXJjZSBtYXBzIGluIHByb2R1Y3Rpb25cbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XG4gICAgICAgICAgaWYgKCFpZC5pbmNsdWRlcyhcIm5vZGVfbW9kdWxlc1wiKSkgcmV0dXJuO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKFwiL3JlYWN0L1wiKSB8fFxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoXCIvcmVhY3QtZG9tL1wiKSB8fFxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoXCIvd291dGVyL1wiKSB8fFxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoXCIvcmVhY3QtaGVsbWV0LWFzeW5jL1wiKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIFwidmVuZG9yLXJlYWN0XCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKFwiL0B0YW5zdGFjay9cIikgfHxcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKFwiL0B0cnBjL1wiKSB8fFxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoXCIvc3VwZXJqc29uL1wiKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIFwidmVuZG9yLWRhdGFcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwiL0ByYWRpeC11aS9cIikgfHwgaWQuaW5jbHVkZXMoXCIvY21kay9cIikgfHwgaWQuaW5jbHVkZXMoXCIvdmF1bC9cIikpIHtcbiAgICAgICAgICAgIHJldHVybiBcInZlbmRvci11aVwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCIvZnJhbWVyLW1vdGlvbi9cIikpIHtcbiAgICAgICAgICAgIHJldHVybiBcInZlbmRvci1tb3Rpb25cIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwiL3JlY2hhcnRzL1wiKSB8fCBpZC5pbmNsdWRlcyhcIi9kMy1cIikpIHtcbiAgICAgICAgICAgIHJldHVybiBcInZlbmRvci1jaGFydHNcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoXCIvc3RyZWFtZG93bi9cIikgfHxcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKFwiL3NoaWtpL1wiKSB8fFxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoXCIvbWVybWFpZC9cIikgfHxcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKFwiL2thdGV4L1wiKSB8fFxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoXCIvbWljcm9tYXJrXCIpIHx8XG4gICAgICAgICAgICBpZC5pbmNsdWRlcyhcIi9yZW1hcmtcIikgfHxcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKFwiL3JlaHlwZVwiKSB8fFxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoXCIvaGFzdFwiKSB8fFxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoXCIvdW5pc3RcIilcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiBcInZlbmRvci1tYXJrZG93blwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiB0cnVlLFxuICAgIGFsbG93ZWRIb3N0czogW1xuICAgICAgXCIubWFudXNwcmUuY29tcHV0ZXJcIixcbiAgICAgIFwiLm1hbnVzLmNvbXB1dGVyXCIsXG4gICAgICBcIi5tYW51cy1hc2lhLmNvbXB1dGVyXCIsXG4gICAgICBcIi5tYW51c2NvbXB1dGVyLmFpXCIsXG4gICAgICBcIi5tYW51c3ZtLmNvbXB1dGVyXCIsXG4gICAgICBcImxvY2FsaG9zdFwiLFxuICAgICAgXCIxMjcuMC4wLjFcIixcbiAgICBdLFxuICAgIGZzOiB7XG4gICAgICBzdHJpY3Q6IHRydWUsXG4gICAgICBkZW55OiBbXCIqKi8uKlwiXSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZiLFNBQVMsb0JBQW9CO0FBQzFkLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sV0FBVztBQUNsQixPQUFPLFFBQVE7QUFDZixPQUFPLFVBQVU7QUFDakIsU0FBUyxvQkFBcUQ7QUFDOUQsU0FBUyw4QkFBOEI7QUFDdkMsT0FBTyxzQkFBc0I7QUFQN0IsSUFBTSxtQ0FBbUM7QUFjekMsSUFBTSxlQUFlO0FBQ3JCLElBQU0sVUFBVSxLQUFLLEtBQUssY0FBYyxhQUFhO0FBQ3JELElBQU0scUJBQXFCLElBQUksT0FBTztBQUN0QyxJQUFNLG9CQUFvQixLQUFLLE1BQU0scUJBQXFCLEdBQUc7QUFJN0QsU0FBUyxlQUFlO0FBQ3RCLE1BQUksQ0FBQyxHQUFHLFdBQVcsT0FBTyxHQUFHO0FBQzNCLE9BQUcsVUFBVSxTQUFTLEVBQUUsV0FBVyxLQUFLLENBQUM7QUFBQSxFQUMzQztBQUNGO0FBRUEsU0FBUyxZQUFZLFNBQWlCLFNBQWlCO0FBQ3JELE1BQUk7QUFDRixRQUFJLENBQUMsR0FBRyxXQUFXLE9BQU8sS0FBSyxHQUFHLFNBQVMsT0FBTyxFQUFFLFFBQVEsU0FBUztBQUNuRTtBQUFBLElBQ0Y7QUFFQSxVQUFNLFFBQVEsR0FBRyxhQUFhLFNBQVMsT0FBTyxFQUFFLE1BQU0sSUFBSTtBQUMxRCxV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
