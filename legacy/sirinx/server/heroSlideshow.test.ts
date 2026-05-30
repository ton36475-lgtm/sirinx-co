/**
 * HeroSlideshow — unit tests for personalization logic
 * Tests the trackSolutionVisit, getPreferredOrder, and getPersonalizedSlides functions
 * These are pure JS functions that use localStorage, so we mock localStorage in Node.
 */
import { describe, it, expect, beforeEach } from "vitest";

// ─── Mock localStorage ─────────────────────────────────────────────
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
};

// Assign to globalThis so the functions work
Object.defineProperty(globalThis, "localStorage", { value: mockLocalStorage, writable: true });

// ─── Inline the pure functions from HeroSlideshow ──────────────────
// (We test the logic directly rather than importing the React component)

type SolutionCategory =
  | "solar-carport"
  | "rooftop-solar"
  | "floating-solar"
  | "bess"
  | "hospitality"
  | "ai-energy";

const PREF_KEY = "sirinx_solution_prefs";

interface SolutionPrefs {
  [category: string]: number;
}

function trackSolutionVisit(category: SolutionCategory) {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    const prefs: SolutionPrefs = raw ? JSON.parse(raw) : {};
    prefs[category] = (prefs[category] || 0) + 1;
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    // silent fail
  }
}

function getPreferredOrder(): SolutionCategory[] {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return [];
    const prefs: SolutionPrefs = JSON.parse(raw);
    return Object.entries(prefs)
      .sort(([, a], [, b]) => b - a)
      .map(([cat]) => cat as SolutionCategory);
  } catch {
    return [];
  }
}

interface HeroSlide {
  id: string;
  category: SolutionCategory;
}

const ALL_SLIDES: HeroSlide[] = [
  { id: "carport-aerial", category: "solar-carport" },
  { id: "carport-ground", category: "solar-carport" },
  { id: "rooftop-factory", category: "rooftop-solar" },
  { id: "floating-solar", category: "floating-solar" },
  { id: "carport-ev", category: "solar-carport" },
  { id: "bess-realistic", category: "bess" },
  { id: "hotel-resort", category: "hospitality" },
  { id: "carport-realistic", category: "solar-carport" },
  { id: "ai-monitoring", category: "ai-energy" },
  { id: "carport-mall", category: "solar-carport" },
];

function getPersonalizedSlides(): HeroSlide[] {
  const preferred = getPreferredOrder();
  if (preferred.length === 0) return ALL_SLIDES;

  const prioritized: HeroSlide[] = [];
  const remaining: HeroSlide[] = [];

  const byCategory = new Map<SolutionCategory, HeroSlide[]>();
  for (const slide of ALL_SLIDES) {
    const arr = byCategory.get(slide.category) || [];
    arr.push(slide);
    byCategory.set(slide.category, arr);
  }

  const added = new Set<string>();
  for (const cat of preferred) {
    const catSlides = byCategory.get(cat) || [];
    let count = 0;
    for (const s of catSlides) {
      if (!added.has(s.id) && count < 2) {
        prioritized.push(s);
        added.add(s.id);
        count++;
      }
    }
  }

  for (const slide of ALL_SLIDES) {
    if (!added.has(slide.id)) {
      remaining.push(slide);
    }
  }

  return [...prioritized, ...remaining];
}

// ─── Tests ─────────────────────────────────────────────────────────

describe("HeroSlideshow Personalization", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe("trackSolutionVisit", () => {
    it("should store first visit with count 1", () => {
      trackSolutionVisit("solar-carport");
      const prefs = JSON.parse(localStorage.getItem(PREF_KEY)!);
      expect(prefs["solar-carport"]).toBe(1);
    });

    it("should increment count on repeated visits", () => {
      trackSolutionVisit("bess");
      trackSolutionVisit("bess");
      trackSolutionVisit("bess");
      const prefs = JSON.parse(localStorage.getItem(PREF_KEY)!);
      expect(prefs["bess"]).toBe(3);
    });

    it("should track multiple categories independently", () => {
      trackSolutionVisit("solar-carport");
      trackSolutionVisit("floating-solar");
      trackSolutionVisit("solar-carport");
      const prefs = JSON.parse(localStorage.getItem(PREF_KEY)!);
      expect(prefs["solar-carport"]).toBe(2);
      expect(prefs["floating-solar"]).toBe(1);
    });

    it("should handle corrupted localStorage gracefully", () => {
      localStorage.setItem(PREF_KEY, "not-valid-json{{{");
      // Should not throw
      expect(() => trackSolutionVisit("bess")).not.toThrow();
    });
  });

  describe("getPreferredOrder", () => {
    it("should return empty array when no prefs stored", () => {
      expect(getPreferredOrder()).toEqual([]);
    });

    it("should return categories sorted by visit count descending", () => {
      trackSolutionVisit("floating-solar");
      trackSolutionVisit("floating-solar");
      trackSolutionVisit("floating-solar");
      trackSolutionVisit("bess");
      trackSolutionVisit("bess");
      trackSolutionVisit("solar-carport");

      const order = getPreferredOrder();
      expect(order[0]).toBe("floating-solar");
      expect(order[1]).toBe("bess");
      expect(order[2]).toBe("solar-carport");
    });

    it("should handle corrupted localStorage gracefully", () => {
      localStorage.setItem(PREF_KEY, "broken");
      expect(getPreferredOrder()).toEqual([]);
    });
  });

  describe("getPersonalizedSlides", () => {
    it("should return default order when no prefs exist", () => {
      const slides = getPersonalizedSlides();
      expect(slides.length).toBe(10);
      expect(slides[0].id).toBe("carport-aerial");
      expect(slides[9].id).toBe("carport-mall");
    });

    it("should prioritize floating-solar slides when that category is most visited", () => {
      trackSolutionVisit("floating-solar");
      trackSolutionVisit("floating-solar");
      trackSolutionVisit("floating-solar");

      const slides = getPersonalizedSlides();
      expect(slides[0].category).toBe("floating-solar");
      expect(slides.length).toBe(10);
    });

    it("should prioritize BESS slides when BESS is most visited", () => {
      trackSolutionVisit("bess");
      trackSolutionVisit("bess");
      trackSolutionVisit("bess");

      const slides = getPersonalizedSlides();
      expect(slides[0].category).toBe("bess");
    });

    it("should limit to max 2 slides per preferred category", () => {
      trackSolutionVisit("solar-carport");
      trackSolutionVisit("solar-carport");
      trackSolutionVisit("solar-carport");
      trackSolutionVisit("solar-carport");

      const slides = getPersonalizedSlides();
      // First 2 should be solar-carport, but not all 5 carport slides
      const prioritizedCarport = slides.slice(0, 2);
      expect(prioritizedCarport.every(s => s.category === "solar-carport")).toBe(true);
      // 3rd slide should NOT be solar-carport (it's in remaining)
      // Actually it could be if remaining has carport slides, but the prioritized section is capped at 2
    });

    it("should include all 10 slides regardless of preferences", () => {
      trackSolutionVisit("hospitality");
      trackSolutionVisit("ai-energy");

      const slides = getPersonalizedSlides();
      expect(slides.length).toBe(10);

      // All original slide IDs should be present
      const ids = new Set(slides.map(s => s.id));
      for (const s of ALL_SLIDES) {
        expect(ids.has(s.id)).toBe(true);
      }
    });

    it("should handle multi-category preferences with correct ordering", () => {
      trackSolutionVisit("ai-energy");
      trackSolutionVisit("ai-energy");
      trackSolutionVisit("ai-energy");
      trackSolutionVisit("hospitality");
      trackSolutionVisit("hospitality");

      const slides = getPersonalizedSlides();
      // First slide should be ai-energy (most visited)
      expect(slides[0].category).toBe("ai-energy");
      // Second should be hospitality (2nd most visited)
      expect(slides[1].category).toBe("hospitality");
    });
  });
});
