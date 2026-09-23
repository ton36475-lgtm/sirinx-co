import { describe, expect, it } from "vitest";
import {
  confirmedProjects,
  resolveConfirmedProjects,
  selectPortfolioState,
} from "./confirmedProjects";

describe("confirmed public portfolio boundary", () => {
  it("retains all three confirmed projects when the backend is unavailable or empty", () => {
    for (const rows of [undefined, []]) {
      const projects = resolveConfirmedProjects(rows);
      expect(projects).toHaveLength(3);
      expect(projects.reduce((n, p) => n + p.images.length, 0)).toBe(27);
      expect(projects.reduce((n, p) => n + p.videos.length, 0)).toBe(1);
    }
  });
  it("rejects unrelated CMS rows, unsafe URLs, and covers from another project", () => {
    const project = confirmedProjects[0];
    const unrelated = confirmedProjects[1];
    for (const image of [
      "javascript:alert(1)",
      "https://example.com/unreviewed.jpg",
      unrelated.images[0].src,
    ]) {
      const result = resolveConfirmedProjects([
        { title: project.title, image, published: true },
      ]);
      expect(result.find((p) => p.id === project.id)?.coverId).toBe(
        project.coverId,
      );
    }
    expect(
      resolveConfirmedProjects([
        {
          title: "Unconfirmed project",
          image: project.images[0].src,
          published: true,
        },
      ]),
    ).toEqual(confirmedProjects);
  });
  it("allows the CMS to select a reviewed cover without replacing confirmed copy or media", () => {
    const project = confirmedProjects[0];
    const image = project.images[1];
    const result = resolveConfirmedProjects([
      {
        title: project.title,
        image: `https://www.sirinx.co${image.src}`,
        published: true,
      },
    ]);
    expect(result.find((p) => p.id === project.id)).toEqual({
      ...project,
      coverId: image.id,
    });
  });
  it("honors the backend descending display order", () => {
    const result = resolveConfirmedProjects(
      confirmedProjects.map((p, index) => ({
        title: p.title,
        image: p.images[0].src,
        published: true,
        sortOrder: (index + 1) * 10,
      })),
    );
    expect(result.map((p) => p.id)).toEqual(
      confirmedProjects.map((p) => p.id).reverse(),
    );
  });
  it("keeps static delivery independent of an unavailable backend", () => {
    for (const queryStatus of ["pending", "error", "success"] as const) {
      expect(
        selectPortfolioState({ source: "static", queryStatus, rows: [] }),
      ).toEqual({ status: "ready", projects: confirmedProjects });
    }
  });
  it("does not flash static content while CMS mode loads or fails", () => {
    expect(
      selectPortfolioState({ source: "backend", queryStatus: "pending" }),
    ).toEqual({ status: "loading", projects: [] });
    expect(
      selectPortfolioState({ source: "backend", queryStatus: "error" }),
    ).toEqual({ status: "error", projects: [] });
  });
  it("honors an empty published CMS list, including unpublishing the last project", () => {
    expect(
      selectPortfolioState({
        source: "backend",
        queryStatus: "success",
        rows: [],
      }),
    ).toEqual({ status: "ready", projects: [] });
  });
  it("shows only recognized and published projects in CMS mode", () => {
    const rows = [
      { title: confirmedProjects[0].title, published: false },
      { title: confirmedProjects[1].title, published: true },
      { title: "Unreviewed example project", published: true },
    ];
    const result = selectPortfolioState({
      source: "backend",
      queryStatus: "success",
      rows,
    });
    expect(result.projects.map((p) => p.id)).toEqual([confirmedProjects[1].id]);
  });
});
