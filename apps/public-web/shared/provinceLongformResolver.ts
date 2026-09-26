/**
 * Resolves the longform for a province.
 *
 * A hand-written entry always wins. Provinces that only have a generated entry
 * fall back to the generator output. Provinces with neither return null, so the
 * page renders nothing rather than an empty shell.
 *
 * The block types produced here are exactly the ones ProvinceLongform.tsx renders:
 * "h3", "list", and a default text block.
 */
import {
  provinceLongform,
  type ProvinceLongform,
} from "./provinceLongform";
import { getGeneratedProvinceLongform } from "./provinceLongformGenerated";
import { thaiProvinces } from "./thaiProvinces";

export type ResolvedLongform = ProvinceLongform;

/**
 * Up to six provinces from the same region, used for the crawlable
 * "จังหวัดอื่นในระบบเดียวกัน" links. Without them a province page is a link
 * island: the audit measured one <a> per page and 0/77 province pages
 * reachable from the homepage by crawling, because the site nav is a
 * client-rendered React component and never reaches the static HTML.
 *
 * Kept out of getProvinceLongformEntry on purpose: that function returns the
 * stored entry by reference (a test pins the hand-written-wins contract), and
 * links are derived, not content.
 */
const siblingsBySlug = (() => {
  const byRegion = new Map<string, typeof thaiProvinces>();
  for (const province of thaiProvinces) {
    const list = byRegion.get(province.region) ?? [];
    list.push(province);
    byRegion.set(province.region, list);
  }
  const map = new Map<string, Array<{ slug: string; nameTh: string }>>();
  for (const province of thaiProvinces) {
    map.set(
      province.slug,
      (byRegion.get(province.region) ?? [])
        .filter((other) => other.slug !== province.slug)
        .slice(0, 6)
        .map((other) => ({ slug: other.slug, nameTh: other.nameTh })),
    );
  }
  return map;
})();

export function getProvinceSiblings(
  slug: string
): Array<{ slug: string; nameTh: string }> {
  return siblingsBySlug.get(slug) ?? [];
}

export function getProvinceLongformEntry(
  slug: string
): ResolvedLongform | null {
  const handWritten = provinceLongform[slug];
  if (handWritten) return handWritten as ResolvedLongform;
  const generated = getGeneratedProvinceLongform(slug);
  if (generated) return generated as unknown as ResolvedLongform;
  return null;
}

export function getProvinceLongformSource(
  slug: string
): "hand-written" | "generated" | "none" {
  if (provinceLongform[slug]) return "hand-written";
  if (getGeneratedProvinceLongform(slug)) return "generated";
  return "none";
}
