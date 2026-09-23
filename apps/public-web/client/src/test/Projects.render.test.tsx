import React from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Projects from "@/pages/Projects";

function renderProjects() {
  // Public routes are not wrapped in a global tRPC/QueryClient provider.
  return renderToString(
    <Router ssrPath="/projects">
      <LanguageProvider>
        <Projects />
      </LanguageProvider>
    </Router>,
  );
}

describe("Projects public route rendering", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", { getItem: () => null });
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("renders the complete static gallery without a data provider or API request", () => {
    vi.stubEnv("VITE_PORTFOLIO_SOURCE", "static");
    const html = renderProjects();
    expect(html).toContain("งานติดตั้งจริง");
    expect(html.match(/class="cp-photo"/g)).toHaveLength(27);
    expect(html.match(/<video\b/g)).toHaveLength(1);
    expect(html).toContain("โรงแรมเรือนแพรอยัลปาร์ค");
    expect(html).toContain("โรงแรมโฮลาเทล");
    expect(html).toContain("บ้านพักอาศัยในหมู่บ้านศุภภาลัย");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("provides both data contexts in backend mode and renders pending without static media", () => {
    vi.stubEnv("VITE_PORTFOLIO_SOURCE", "backend");
    const html = renderProjects();
    expect(html).toContain("กำลังโหลดผลงาน");
    expect(html).not.toContain('class="cp-photo"');
    expect(html).not.toContain("/assets/real-installations/");
    expect(fetch).not.toHaveBeenCalled();
  });
});
