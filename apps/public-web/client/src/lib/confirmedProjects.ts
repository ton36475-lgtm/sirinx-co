import catalog from "@/data/confirmed-projects.json";

export type ConfirmedProject = (typeof catalog)[number];
export type ConfirmedImage = ConfirmedProject["images"][number];
export const confirmedProjects = catalog;

export type BackendProjectSummary = {
  title: string;
  image?: string | null;
  published: boolean;
  sortOrder?: number | null;
};

/** Only a reviewed local image from the same project may become its cover. */
function knownImagePath(image: string): string | null {
  if (image.startsWith("/assets/real-installations/")) return image;
  try {
    const url = new URL(image);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "www.sirinx.co" ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    return url.pathname;
  } catch {
    return null;
  }
}

/** The CMS selects a reviewed cover/order; copy and all media stay bounded by the confirmed catalog. */
export function resolveConfirmedProjects(
  backendRows?: readonly BackendProjectSummary[],
  publishedOnly = false,
): ConfirmedProject[] {
  if (!backendRows?.length) return publishedOnly ? [] : catalog;
  return catalog
    .filter(
      (project) =>
        !publishedOnly ||
        backendRows.some(
          (row) => row.published && row.title.trim() === project.title,
        ),
    )
    .map((project, originalOrder) => {
      const row = backendRows.find(
        (item) => item.published && item.title.trim() === project.title,
      );
      const requestedPath = row?.image ? knownImagePath(row.image) : null;
      const cover = project.images.find(
        (image) =>
          image.src === requestedPath ||
          image.srcSet
            .split(", ")
            .some((variant) => variant.split(" ")[0] === requestedPath),
      );
      return {
        project: cover ? { ...project, coverId: cover.id } : project,
        order:
          row && Number.isFinite(row.sortOrder)
            ? row.sortOrder!
            : catalog.length - originalOrder,
        originalOrder,
      };
    })
    .sort((a, b) => b.order - a.order || a.originalOrder - b.originalOrder)
    .map((item) => item.project);
}

/** CMS mode fails closed: an empty published list is authoritative. */
export function selectPortfolioState(input: {
  source: "static" | "backend";
  queryStatus: "pending" | "error" | "success";
  rows?: readonly BackendProjectSummary[];
}): { status: "ready" | "loading" | "error"; projects: ConfirmedProject[] } {
  if (input.source === "static") return { status: "ready", projects: catalog };
  if (input.queryStatus === "pending")
    return { status: "loading", projects: [] };
  if (input.queryStatus === "error") return { status: "error", projects: [] };
  return {
    status: "ready",
    projects: resolveConfirmedProjects(input.rows, true),
  };
}
