import { describe, expect, it } from "vitest";
import fs from "node:fs";

/**
 * Static claim guard for the public homepage. These values require an
 * evidence record and owner approval before they may return to public copy.
 */
describe("homepage evidence-gated claims", () => {
  it("does not reintroduce unverified numeric marketing claims", () => {
    const source = fs.readFileSync(
      new URL("../i18n/pages/home.ts", import.meta.url),
      "utf8"
    );

    for (const pattern of [
      /30\s*[-–]\s*100\s*%/i,
      /3\s*[-–]\s*5\s*ปี/i,
      /25\s*\+\s*ปี/i,
      /24\s*[-–]\s*48/i,
      /50\s*\+/i,
      /50\s*:\s*50/i,
      /150\s*%/i,
    ]) {
      expect(source).not.toMatch(pattern);
    }
  });
});
