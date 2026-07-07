import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import LightMarkdown from "@/components/LightMarkdown";

describe("LightMarkdown", () => {
  it("renders common chat markdown without requiring a heavy renderer bundle", () => {
    const html = renderToStaticMarkup(
      <LightMarkdown>{`# SIRINX Summary

- **Ready** for governed handoff
- Use \`SERVER-READY HOLD MODE\`
- Review [contact path](/contact)`}</LightMarkdown>,
    );

    expect(html).toContain("<h3");
    expect(html).toContain("<strong>Ready</strong>");
    expect(html).toContain("SERVER-READY HOLD MODE");
    expect(html).toContain('href="/contact"');
  });

  it("escapes raw HTML and drops unsafe link protocols", () => {
    const html = renderToStaticMarkup(
      <LightMarkdown>{`<script>alert("x")</script>

[unsafe](javascript:alert(1))`}</LightMarkdown>,
    );

    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<a ");
    expect(html).toContain("unsafe");
  });
});
