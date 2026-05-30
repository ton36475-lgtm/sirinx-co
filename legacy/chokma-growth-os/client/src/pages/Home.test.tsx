import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
  }),
}));

vi.mock("@/const", () => ({
  getLoginUrl: () => "/login",
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    leads: {
      submit: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import Home from "./Home";

describe("Home landing page", () => {
  it("renders the primary CTA and generated CHOKMA visuals", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("สมัครทันที");
    expect(html).toContain("https://xn--42cl4e4cwd.net/auth/registration?af=u2vZe3xLLiJ7");
    expect(html).toContain("chokma-hero-poster-XsmNSXNMpQZEnQfEdjKbGS.webp");
    expect(html).toContain("chokma-lottery-strip-LdrAKnifFc43xoUZ9rS3Dr.webp");
    expect(html).toContain("chokma-affiliate-offer-cCNyExkL4DdC9UwREw8YAa.webp");
  });

  it("keeps the generated asset manifest aligned with the landing page visuals", () => {
    const manifest = readFileSync("/home/ubuntu/chokma-growth-os/chokma_generated_assets.md", "utf8");

    expect(manifest).toContain("chokma-hero-poster-XsmNSXNMpQZEnQfEdjKbGS.webp");
    expect(manifest).toContain("chokma-lottery-strip-LdrAKnifFc43xoUZ9rS3Dr.webp");
    expect(manifest).toContain("chokma-affiliate-offer-cCNyExkL4DdC9UwREw8YAa.webp");
    expect(manifest).toContain("node build-chokma-landing-assets.mjs");
  });
});
