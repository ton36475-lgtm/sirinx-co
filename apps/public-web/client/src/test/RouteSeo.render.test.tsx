import React from "react";
import { renderToString } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import RouteSeo from "@/components/RouteSeo";
import HomeSolution from "@/pages/HomeSolution";

describe("route metadata ownership", () => {
  it("does not render React-owned metadata that the route effect would remove", () => {
    const html = renderToString(
      <HelmetProvider>
        <Router ssrPath="/projects">
          <RouteSeo />
        </Router>
      </HelmetProvider>,
    );
    expect(html).toBe("");
  });

  it("keeps Home Solution structured data without creating a second canonical owner", () => {
    const html = renderToString(
      <HelmetProvider>
        <Router ssrPath="/home-solution">
          <RouteSeo />
          <HomeSolution />
        </Router>
      </HelmetProvider>,
    );
    expect(html).toContain('type="application/ld+json"');
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain("<title>");
  });
});
