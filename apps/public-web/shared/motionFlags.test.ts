import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MOTION_HOME_ENABLED } from "./motionFlags";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const element = (tag: string) =>
    ({ children, ...props }: Record<string, unknown>) =>
      React.createElement(
        tag,
        { "data-motion-props": Object.keys(props).sort().join(",") },
        children as React.ReactNode,
      );
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion: {
      div: element("div"),
      img: element("img"),
      button: element("button"),
    },
  };
});

afterEach(() => {
  vi.doUnmock("./motionFlags");
  vi.resetModules();
});

describe("MOTION_HOME_ENABLED", () => {
  it("ships disabled until LCP is measured", () => {
    expect(MOTION_HOME_ENABLED).toBe(false);
  });

  it("strips motion props when disabled, preserving the static DOM", async () => {
    vi.resetModules();
    vi.doMock("./motionFlags", () => ({ MOTION_HOME_ENABLED: false }));
    const { motion } = await import("../client/src/lib/static-motion");
    const html = renderToStaticMarkup(
      createElement(
        motion.div,
        {
          animate: { opacity: 1 },
          initial: { opacity: 0 },
          variants: { hidden: { opacity: 0 } },
          whileInView: { opacity: 1 },
          "data-check": "kept",
        },
        "content",
      ),
    );
    expect(html).toMatch(
      /^<div data-loc="[^\"]+" data-check="kept">content<\/div>$/,
    );
  });

  it("forwards motion props when enabled", async () => {
    vi.resetModules();
    vi.doMock("./motionFlags", () => ({ MOTION_HOME_ENABLED: true }));
    const { motion } = await import("../client/src/lib/static-motion");
    const html = renderToStaticMarkup(
      createElement(
        motion.div,
        {
          animate: { opacity: 1 },
          initial: { opacity: 0 },
          variants: { hidden: { opacity: 0 } },
          whileInView: { opacity: 1 },
          "data-check": "kept",
        },
        "content",
      ),
    );
    expect(html).toContain(
      'data-motion-props="animate,data-check,initial,variants,whileInView"',
    );
  });
});
