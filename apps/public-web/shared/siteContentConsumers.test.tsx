import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Projects from "../client/src/pages/Projects";
import { getSeoMeta } from "../client/src/lib/seo";
import { getPageMeta, injectOgTags } from "../server/ogTags";
import { projectRegistry } from "./siteContentRegistry";
import { getProjectEvidenceBadgeKey } from "./publicProjectContent";
import { build } from "esbuild";
import path from "node:path";

const translations = vi.hoisted(() => ({
  register: vi.fn(),
  language: vi.fn(() => "en"),
}));

vi.mock("@/i18n", () => ({
  registerPageTranslations: translations.register,
  usePageTranslation: () => ({
    t: (key: string) => {
      const dictionary = translations.register.mock.calls[0][1];
      return dictionary[key]?.[translations.language()] ?? key;
    },
  }),
}));
vi.mock("@/components/HeroSlideshow", () => ({ trackSolutionVisit: vi.fn() }));
vi.mock("wouter", () => ({ Link: "a" }));
vi.mock("framer-motion", async () => {
  const { createElement } = await import("react");
  const element = (type: string) => (props: Record<string, unknown>) => {
    const { initial, animate, exit, layout, variants, custom, whileInView,
      viewport, whileHover, whileTap, ...domProps } = props;
    return createElement(type, domProps);
  };
  return {
    motion: { div: element("div"), p: element("p"), button: element("button"), img: element("img") },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

beforeEach(() => translations.language.mockReturnValue("en"));

describe("portfolio evidence seen by visitors", () => {
  it.each([
    ["en", "Verified Live", "Concept / Simulation"],
    ["th", "ผลงานติดตั้งจริง", "ภาพจำลอง / Concept Design"],
  ])("shows distinct %s evidence labels and preserves reviewed assets", (language, real, rendering) => {
    translations.language.mockReturnValue(language);
    const html = renderToStaticMarkup(<Projects />);
    expect(html).toContain(`aria-label="${real}"`);
    expect(html).toContain(`aria-label="${rendering}"`);
    expect(html).toContain("/assets/projects/ruenphae/20260924/1000076001.jpg");
    expect(html).toContain("/assets/projects/ruenphae/20260924/1000076003.jpg");
    expect(html).toContain("/assets/projects/holatel/20260924/1000075878.jpg");
    expect(html).toContain("/assets/projects/holatel/20260924/1000075879.jpg");
    expect(html).not.toContain("/assets/image-unavailable.svg");
    const privateProject = projectRegistry.find(record => record.id === "supalai-private-residential");
    expect(html).not.toContain(privateProject!.id);
  });

  it.each([
    ["holatel-rim-nan", undefined, "badgeVerifiedLive"],
    ["ruenphae-royal-park", undefined, "badgeVerifiedLive"],
    [undefined, "CONCEPT / SIMULATION", "badgeConceptSimulation"],
    ["unknown-project", undefined, "badgePendingEvidence"],
  ])("resolves %s without inventing stronger evidence", (id, status, expected) => {
    const before = JSON.stringify(projectRegistry);
    expect(getProjectEvidenceBadgeKey(id, status as any)).toBe(expected);
    expect(JSON.stringify(projectRegistry)).toBe(before);
  });
});

describe("portfolio metadata through client and crawler interfaces", () => {
  it.each(["/projects", "/projects/", "/projects/?source=fixture#gallery"])("keeps %s metadata consistent", route => {
    const client = getSeoMeta(route);
    const server = getPageMeta(route);
    expect(client.title).toBe(server.title);
    expect(client.description).toBe(server.description);
    expect(client.description).toContain("โรงแรมโฮลาเทล");
    expect(client.description).not.toContain("ระหว่างก่อสร้าง");
    expect(client.description).not.toContain("ตัวเลขผลประหยัดค่าไฟ");
  });

  it("injects the same portfolio copy and canonical URL into crawler HTML", () => {
    const html = '<html><head><title>Fixture</title><meta name="description" content="Fixture" /><link rel="canonical" href="https://example.invalid/" /></head><body></body></html>';
    const result = injectOgTags(html, "/projects/?fixture=1", "https://www.sirinx.co");
    const meta = getSeoMeta("/projects");
    expect(result).toContain(`<title>${meta.title}</title>`);
    expect(result).toContain(`content="${meta.description}"`);
    expect(result).toContain('href="https://www.sirinx.co/projects/"');
  });

  it("keeps unknown project slugs unindexed and private identities out of portfolio metadata", () => {
    expect(getSeoMeta("/projects/not-a-project").noindex).toBe(true);
    const metadata = JSON.stringify(getPageMeta("/projects"));
    const privateProject = projectRegistry.find(record => record.id === "supalai-private-residential");
    expect(metadata).not.toContain(privateProject!.evidence.sourceReference);
    expect(metadata).not.toContain(privateProject!.id);
  });
});


describe("public content bundle boundary", () => {
  it("does not include private registry identity or source fields in the browser module", async () => {
    const result = await build({
      entryPoints: [path.resolve(import.meta.dirname, "publicProjectContent.ts")],
      bundle: true, write: false, platform: "browser", format: "esm",
      metafile: true, logLevel: "silent",
    });
    const privateProject = projectRegistry.find(record => record.id === "supalai-private-residential");
    expect(result.outputFiles[0].text).not.toContain(privateProject!.id);
    expect(result.outputFiles[0].text).not.toContain(privateProject!.evidence.sourceReference);
    expect(Object.keys(result.metafile!.inputs)).not.toContainEqual(expect.stringContaining("siteContentRegistry"));
    expect(getProjectEvidenceBadgeKey(privateProject!.id)).toBe("badgePendingEvidence");
  });
});
