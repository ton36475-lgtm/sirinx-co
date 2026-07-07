import { describe, expect, it } from "vitest";
import {
  installAnalyticsScript,
  normalizeAnalyticsEndpoint,
} from "../lib/analytics-loader";

type FakeScript = {
  dataset: Record<string, string>;
  defer?: boolean;
  src?: string;
};

const createFakeDocument = () => {
  const nodes: FakeScript[] = [];

  return {
    doc: {
      body: {
        appendChild: (node: FakeScript) => {
          nodes.push(node);
        },
      },
      createElement: () => ({
        dataset: {},
      }),
      querySelector: (selector: string) => {
        if (selector !== "script[data-sirinx-analytics='umami']") return null;
        return nodes.find(node => node.dataset.sirinxAnalytics === "umami") ?? null;
      },
    },
    nodes,
  };
};

describe("analytics loader", () => {
  it("normalizes trailing slashes before building the script url", () => {
    expect(normalizeAnalyticsEndpoint("https://analytics.example.com///")).toBe(
      "https://analytics.example.com"
    );
  });

  it("does nothing when analytics env is missing", () => {
    const { doc, nodes } = createFakeDocument();

    expect(installAnalyticsScript(doc as unknown as Document, {})).toBe(false);
    expect(nodes).toHaveLength(0);
  });

  it("installs the analytics script once when fully configured", () => {
    const { doc, nodes } = createFakeDocument();

    expect(
      installAnalyticsScript(doc as unknown as Document, {
        endpoint: "https://analytics.example.com/",
        websiteId: "site-123",
      })
    ).toBe(true);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].src).toBe("https://analytics.example.com/umami");
    expect(nodes[0].dataset.websiteId).toBe("site-123");
    expect(nodes[0].dataset.sirinxAnalytics).toBe("umami");
    expect(nodes[0].defer).toBe(true);
  });

  it("does not install a duplicate script", () => {
    const { doc, nodes } = createFakeDocument();

    installAnalyticsScript(doc as unknown as Document, {
      endpoint: "https://analytics.example.com",
      websiteId: "site-123",
    });

    expect(
      installAnalyticsScript(doc as unknown as Document, {
        endpoint: "https://analytics.example.com",
        websiteId: "site-123",
      })
    ).toBe(false);
    expect(nodes).toHaveLength(1);
  });
});
