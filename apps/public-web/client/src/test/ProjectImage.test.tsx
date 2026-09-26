// @vitest-environment jsdom

import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import Projects from "../pages/Projects";
import ProjectImage from "../components/ProjectImage";

const translations = vi.hoisted(() => ({ register: vi.fn(), language: vi.fn(() => "en") }));
vi.mock("@/i18n", () => ({
  registerPageTranslations: translations.register,
  usePageTranslation: () => ({ t: (key: string) => translations.register.mock.calls[0][1][key]?.[translations.language()] ?? key }),
}));
vi.mock("@/components/HeroSlideshow", () => ({ trackSolutionVisit: vi.fn() }));
vi.mock("wouter", () => ({ Link: "a" }));
vi.mock("framer-motion", async () => {
  const { createElement } = await import("react");
  const element = (type: string) => (props: Record<string, unknown>) => {
    const { initial, animate, exit, layout, variants, custom, whileInView, viewport, whileHover, whileTap, ...domProps } = props;
    return createElement(type, domProps);
  };
  return { motion: { div: element("div"), p: element("p"), button: element("button"), img: element("img") }, AnimatePresence: ({ children }: { children: ReactNode }) => children };
});

beforeAll(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

function createFixture() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  return { container, root, render: async (node: ReactNode) => { await act(async () => root.render(node)); } };
}
let fixture: ReturnType<typeof createFixture>;
beforeEach(() => { fixture = createFixture(); translations.language.mockReturnValue("en"); });
afterEach(async () => { await act(async () => fixture.root.unmount()); fixture.container.remove(); });
const imageError = async (image: HTMLImageElement) => { await act(async () => { image.dispatchEvent(new Event("error")); }); };

it.each([["en", "Project image unavailable", "Verified Live"], ["th", "ไม่สามารถแสดงภาพโครงการได้", "ผลงานติดตั้งจริง"]])("keeps %s Projects usable when featured/card assets fail", async (language, unavailable, completed) => {
  translations.language.mockReturnValue(language);
  await fixture.render(<Projects />);
  const dictionary = translations.register.mock.calls[0][1];
  const featured = fixture.container.querySelector<HTMLImageElement>('img[src="/assets/projects/ruenphae/20260924/1000076001.jpg"]')!;
  const card = fixture.container.querySelector<HTMLImageElement>('img[src="/assets/projects/holatel/20260924/1000075878.jpg"]')!;
  expect(featured).not.toBeNull(); expect(card).not.toBeNull();
  await imageError(featured); await imageError(card);
  expect(fixture.container.querySelectorAll('[role="img"]').length).toBe(2);
  expect(fixture.container.textContent).toContain(unavailable);
  expect(fixture.container.textContent).toContain(dictionary.featuredTitle[language]);
  expect(fixture.container.querySelector(`[aria-label="${completed}"]`)).not.toBeNull();
  expect(fixture.container.querySelector('a[href^="/contact"]')).not.toBeNull();
  const filter = Array.from(fixture.container.querySelectorAll("button")).find(button => button.textContent?.trim() === "Rooftop Solar")!;
  await act(async () => { filter.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
  const headings = Array.from(fixture.container.querySelectorAll("h3")).map(heading => heading.textContent);
  expect(headings).not.toContain(dictionary.proj2Title[language]);
  expect(fixture.container.querySelector(`[aria-label="${completed}"]`)).not.toBeNull();
});

it("preserves a valid image's identity and responsive/loading attributes", async () => {
  await fixture.render(<ProjectImage src="/synthetic/project.jpg" srcSet="/synthetic/project.jpg 640w" sizes="50vw" alt="Fixture project" fallbackLabel="Unavailable" width={640} height={480} loading="eager" fetchPriority="high" decoding="async" className="w-full h-full object-cover" />);
  const image = fixture.container.querySelector("img")!;
  expect(image.getAttribute("src")).toBe("/synthetic/project.jpg");
  expect(image.getAttribute("srcset")).toBe("/synthetic/project.jpg 640w");
  expect(image.getAttribute("sizes")).toBe("50vw");
  expect(image.alt).toBe("Fixture project");
  expect(image.width).toBe(640); expect(image.height).toBe(480);
  expect(image.getAttribute("loading")).toBe("eager"); expect(image.getAttribute("fetchpriority")).toBe("high");
  expect(image.getAttribute("decoding")).toBe("async"); expect(image.className).toBe("w-full h-full object-cover");
  expect(fixture.container.querySelector('[role="img"]')).toBeNull();
});

it.each([undefined, "", "  "])("uses an accessible placeholder without an image for source %s", async src => {
  await fixture.render(<ProjectImage src={src} alt="Fixture project" fallbackLabel="Unavailable" width={320} height={180} className="w-full h-full" />);
  expect(fixture.container.querySelector("img")).toBeNull();
  const placeholder = fixture.container.querySelector<HTMLElement>('[role="img"]')!;
  expect(placeholder.getAttribute("aria-label")).toBe("Fixture project — Unavailable");
  expect(placeholder.textContent).toBe("Unavailable");
  expect(placeholder.style.width).toBe("320px"); expect(placeholder.style.height).toBe("180px");
  expect(placeholder.className).toContain("w-full h-full");
});

it("an error removes the failed image without requesting a replacement", async () => {
  await fixture.render(<ProjectImage src="/synthetic/missing.jpg" srcSet="/synthetic/missing-large.jpg 960w" alt="Fixture project" fallbackLabel="Unavailable" style={{ minHeight: 180 }} />);
  const failedImage = fixture.container.querySelector("img")!;
  await imageError(failedImage); await imageError(failedImage);
  expect(fixture.container.querySelector("img")).toBeNull();
  expect(fixture.container.querySelectorAll('[role="img"]')).toHaveLength(1);
  expect(fixture.container.querySelector<HTMLElement>('[role="img"]')!.style.minHeight).toBe("180px");
});

it("changing source resets failure, including returning to an earlier source", async () => {
  const renderImage = (src: string) => fixture.render(<ProjectImage src={src} alt="Fixture project" fallbackLabel="Unavailable" />);
  await renderImage("/synthetic/a.jpg"); await imageError(fixture.container.querySelector("img")!);
  await renderImage("/synthetic/b.jpg"); expect(fixture.container.querySelector("img")?.getAttribute("src")).toBe("/synthetic/b.jpg");
  await renderImage("/synthetic/a.jpg"); expect(fixture.container.querySelector("img")?.getAttribute("src")).toBe("/synthetic/a.jpg");
  expect(fixture.container.querySelector('[role="img"]')).toBeNull();
});

it("renders the existing Chinese translation surface for image errors", async () => {
  translations.language.mockReturnValue("cn"); await fixture.render(<Projects />);
  await imageError(fixture.container.querySelector<HTMLImageElement>('img[src="/assets/projects/ruenphae/20260924/1000076001.jpg"]')!);
  expect(fixture.container.textContent).toContain("项目图片暂不可用");
  expect(fixture.container.textContent).not.toContain("imageUnavailable");
});
