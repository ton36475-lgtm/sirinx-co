import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import obfuscatorPlugin from "vite-plugin-javascript-obfuscator";
import path from "node:path";
import { defineConfig } from "vite";

const isProduction = process.env.NODE_ENV === "production";
const enableProductionObfuscation =
  isProduction && process.env.VITE_ENABLE_JS_OBFUSCATION === "true";

const plugins = [
  react(),
  tailwindcss(),
  ...(enableProductionObfuscation
    ? [
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
            domainLockRedirectUrl: "about:blank",
          },
        }),
      ]
    : []),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false, // Anti-Copy: Never expose source maps in production
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/wouter/") ||
            id.includes("/react-helmet-async/")
          ) {
            return "vendor-react";
          }
          if (
            id.includes("/@tanstack/") ||
            id.includes("/@trpc/") ||
            id.includes("/superjson/")
          ) {
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
          return undefined;
        },
      },
    },
  },
  server: {
    host: true,
    fs: {
      strict: true,
      allow: [".."],
    },
  },
});
