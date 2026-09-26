import { describe, expect, it } from "vitest";
import { getSeoMeta } from "../lib/seo";

describe("project detail SEO gate", () => {
  it("returns a noindex detail meta object while evidence review is pending", () => {
    const meta = getSeoMeta("/projects/ruenphae-royal-park/");

    expect(meta.path).toBe("/projects/ruenphae-royal-park");
    expect(meta.title).toContain("โรงแรมเรือนแพ รอยัลปาร์ค");
    expect(meta.description).toContain("หลักฐาน");
    expect(meta.noindex).toBe(true);
  });

  it("does not expose withheld project metadata", () => {
    const meta = getSeoMeta("/projects/supalai-private-residential");

    expect(meta.noindex).toBe(true);
    expect(meta.title).not.toContain("ศุภาลัย");
    expect(meta.description).not.toContain("หมู่บ้านศุภาลัย");
  });
});
