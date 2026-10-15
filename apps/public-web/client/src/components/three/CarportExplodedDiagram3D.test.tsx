// @vitest-environment jsdom
/**
 * CarportExplodedDiagram3D — R30-P3, Concept C.
 *
 * The component is mounted for real through react-dom/client against a mocked
 * three.js module, so the assertions are about observed behaviour (frames
 * rendered, resources disposed, DPR handed to the renderer) rather than about
 * the source text. The pure exports (tilt, explode curve, layer table) are
 * checked against independently computed expectations, not against themselves.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import CarportExplodedDiagram3D, {
  CARPORT_LAYERS,
  EXPLODE_CYCLE_SECONDS,
  carportSunGeometry,
  explodeAmountAt,
  layerExplodeOffset,
  seasonalTiltDeg,
} from "./CarportExplodedDiagram3D";
import { getProvinceEnergyFact } from "@shared/provinceEnergyData";
import { getProvinceBySlug } from "@shared/thaiProvinces";
import { solarPosition } from "@shared/sunMath";

const SLUG = "phitsanulok";

const three = vi.hoisted(() => ({
  renderers: [] as any[],
  geometries: [] as any[],
  materials: [] as any[],
  groups: [] as any[],
}));

vi.mock("three", () => {
  class Geometry {
    dispose = vi.fn();
    points: unknown = null;
    setFromPoints(points: unknown[]) {
      this.points = points;
      return this;
    }
  }
  class Material {
    isTexture = false;
    dispose = vi.fn();
  }
  class Object3D {
    position = {
      x: 0,
      y: 0,
      z: 0,
      set(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
      },
    };
    rotation = { x: 0, y: 0, z: 0 };
    userData: Record<string, unknown> = {};
    material: unknown = null;
    geometry: unknown = null;
    children: any[] = [];
    constructor() {
      three.groups.push(this);
    }
    lookAt() {}
    updateProjectionMatrix() {}
    add(x: any) {
      this.children.push(x);
    }
    traverse(fn: (x: any) => void) {
      fn(this);
      this.children.forEach((child: any) => child.traverse(fn));
    }
  }
  class Scene extends Object3D {}
  class Group extends Object3D {}
  class Mesh extends Object3D {
    constructor(geometry: unknown, material: unknown) {
      super();
      this.geometry = geometry;
      this.material = material;
    }
  }
  class Line extends Mesh {}
  class InstancedMesh extends Mesh {
    instanceMatrix = { needsUpdate: false };
    matrices: unknown[] = [];
    count: number;
    constructor(geometry: unknown, material: unknown, count: number) {
      super(geometry, material);
      this.count = count;
    }
    setMatrixAt(i: number, matrix: unknown) {
      this.matrices[i] = matrix;
    }
  }
  class Matrix4 {
    elements: number[] = [];
    makeTranslation(x: number, y: number, z: number) {
      this.elements = [x, y, z];
      return this;
    }
    compose() {
      return this;
    }
  }
  class Vector3 {
    constructor(
      public x = 0,
      public y = 0,
      public z = 0,
    ) {}
    set(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
  }
  class Quaternion {}
  class Fog {}
  class Light extends Object3D {
    intensity = 1;
  }
  const geometryOf = (Base: new (...args: any[]) => any) =>
    class extends Base {
      constructor(...args: any[]) {
        super(...args);
        three.geometries.push(this);
      }
    };
  const materialOf = (Base: new (...args: any[]) => any) =>
    class extends Base {
      constructor(...args: any[]) {
        super(...args);
        three.materials.push(this);
      }
    };
  class WebGLRenderer {
    domElement = document.createElement("canvas");
    setPixelRatio = vi.fn();
    setSize = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
    outputColorSpace = "";
    toneMapping = 0;
    toneMappingExposure = 1;
    constructor() {
      three.renderers.push(this);
    }
  }
  return {
    Scene,
    Group,
    Line,
    Mesh,
    InstancedMesh,
    Matrix4,
    Vector3,
    Quaternion,
    Fog,
    WebGLRenderer,
    PerspectiveCamera: class extends Object3D {
      aspect = 1;
      fov = 50;
      near = 0.1;
      far = 1000;
      constructor(fov?: number, aspect?: number, near?: number, far?: number) {
        super();
        if (fov !== undefined) this.fov = fov;
        if (aspect !== undefined) this.aspect = aspect;
        if (near !== undefined) this.near = near;
        if (far !== undefined) this.far = far;
      }
    },
    BoxGeometry: geometryOf(Geometry),
    CylinderGeometry: geometryOf(Geometry),
    CircleGeometry: geometryOf(Geometry),
    BufferGeometry: geometryOf(Geometry),
    MeshStandardMaterial: materialOf(Material),
    MeshBasicMaterial: materialOf(Material),
    LineBasicMaterial: materialOf(Material),
    HemisphereLight: class extends Light {},
    DirectionalLight: class extends Light {},
    SRGBColorSpace: "srgb",
    ACESFilmicToneMapping: 4,
  };
});

let host: HTMLDivElement;
let root: Root;
let observerCallback: IntersectionObserverCallback | undefined;
let pendingFrames: Map<number, FrameRequestCallback>;
let nextRafId: number;
let cancelled: number[];
let nowMs: number;
let reduceMotionMatches: boolean;

const source = readFileSync(
  "client/src/components/three/CarportExplodedDiagram3D.tsx",
  "utf8",
);

const flush = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
};

/** Mount the diagram and let the dynamic three import settle. */
const mount = async (slug = SLUG) => {
  await act(async () => {
    root.render(createElement(CarportExplodedDiagram3D, { slug }));
  });
  await flush();
  return three.renderers[three.renderers.length - 1];
};

/** Run the queued animation frames with the clock advanced by `ms` total. */
const advanceFrame = async (ms: number) => {
  nowMs += ms;
  const snapshot = Array.from(pendingFrames.values());
  pendingFrames.clear();
  await act(async () => {
    snapshot.forEach((cb) => cb(nowMs));
  });
};

/** The seven layer groups, in construction order (foundation first). */
const layerGroups = () =>
  three.groups.filter((g) => typeof g.userData.index === "number");

function rgbOf(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

beforeEach(() => {
  three.renderers.length = 0;
  three.geometries.length = 0;
  three.materials.length = 0;
  three.groups.length = 0;
  pendingFrames = new Map();
  nextRafId = 1;
  cancelled = [];
  nowMs = 1_000_000;
  reduceMotionMatches = false;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  // jsdom 24 has no matchMedia; the component tolerates its absence, and this
  // stub is what lets the reduced-motion path be exercised on purpose.
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduceMotionMatches,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  }));
  // A faithful rAF pair: a cancelled id is really gone from the queue, so
  // "did the component stop asking for frames" is observable.
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((cb: FrameRequestCallback) => {
      const id = nextRafId++;
      pendingFrames.set(id, cb);
      return id;
    }),
  );
  vi.stubGlobal(
    "cancelAnimationFrame",
    vi.fn((id: number) => {
      cancelled.push(id);
      pendingFrames.delete(id);
    }),
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IntersectionObserverCallback) {
        observerCallback = cb;
      }
      observe() {}
      disconnect = vi.fn();
    },
  );
  vi.spyOn(performance, "now").mockImplementation(() => nowMs);
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  Object.defineProperty(window, "devicePixelRatio", {
    configurable: true,
    value: 1,
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  host?.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("carport exploded diagram: lazy chunk and data binding", () => {
  it("reaches three.js only through a dynamic import, and the page only through lazy()", () => {
    expect(source).not.toMatch(
      /^\s*import\s+\*\s+as\s+THREE\s+from\s+"three"/m,
    );
    expect(source).not.toMatch(/^\s*import\s+\{[^}]*\}\s+from\s+"three"/m);
    expect(source).toContain('void import("three")');
    const page = readFileSync("client/src/pages/SolarCarport.tsx", "utf8");
    expect(page).toMatch(
      /const CarportExplodedDiagram3D = lazy\(\s*\(\) =>\s*import\("@\/components\/three\/CarportExplodedDiagram3D"\)\s*\)/,
    );
  });

  it("quotes the province's own PVGIS record and sun geometry, not hand-typed numbers", async () => {
    await mount();
    const fact = getProvinceEnergyFact(SLUG);
    expect(fact).not.toBeNull();
    const text = host.textContent ?? "";
    expect(text).toContain(String(fact!.irradiationDaily));
    expect(text).toContain(String(fact!.specificYield));
    expect(text).toContain(`${fact!.lat}/${fact!.lon}`);
    expect(text).toContain(fact!.source.database);
    expect(text).toContain(String(seasonalTiltDeg(fact!.lat, fact!.lon)));
  });

  it("derives the tilt from the seasonal solar-noon elevation, steeper further north", () => {
    const fact = getProvinceEnergyFact(SLUG)!;
    const tilt = seasonalTiltDeg(fact.lat, fact.lon);
    // Independent expectation: 90° minus the mean of the four daily maxima,
    // recomputed here from solarPosition on a different scan step (5 min).
    const dates = [
      [2, 20],
      [5, 21],
      [8, 22],
      [11, 21],
    ] as const;
    const maxima = dates.map(([m, d]) => {
      let best = -90;
      for (let minute = 0; minute < 1440; minute += 5) {
        const probe = new Date(Date.UTC(2026, m, d, 0, 0, 0));
        probe.setUTCMinutes(probe.getUTCMinutes() + minute);
        best = Math.max(
          best,
          solarPosition(fact.lat, fact.lon, probe).elevationDeg,
        );
      }
      return best;
    });
    const expected = 90 - maxima.reduce((a, b) => a + b, 0) / maxima.length;
    expect(tilt).toBeCloseTo(expected, 1);
    // Further north, higher latitude means a lower mean noon sun, so a steeper
    // panel. Phitsanulok sits at 16.8°N; the northern reference is above it.
    expect(seasonalTiltDeg(20.0, 100.0)).toBeGreaterThan(tilt);
    expect(seasonalTiltDeg(8.0, 98.0)).toBeLessThan(tilt);
  });

  it("keeps the daylight window citable: sunrise before sunset, tilt in range", () => {
    const fact = getProvinceEnergyFact(SLUG)!;
    const sun = carportSunGeometry(fact.lat, fact.lon);
    expect(sun.sunriseHour).not.toBeNull();
    expect(sun.sunsetHour).not.toBeNull();
    expect(sun.sunsetHour!).toBeGreaterThan(sun.sunriseHour!);
    expect(sun.tiltDeg).toBeGreaterThan(0);
    expect(sun.tiltDeg).toBeLessThan(60);
  });

  it("draws nothing at all when the province has no PVGIS record", async () => {
    await mount("nowhere-at-all");
    expect(host.querySelector("canvas")).toBeNull();
    expect(host.querySelector("figure")).toBeNull();
    expect(host.textContent).toContain("ยังไม่มีข้อมูล");
  });
});

describe("carport exploded diagram: structure", () => {
  it("builds one group per named layer, foundation first, modules last", async () => {
    await mount();
    const groups = layerGroups();
    expect(groups).toHaveLength(CARPORT_LAYERS.length);
    expect(groups.map((g) => g.userData.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(CARPORT_LAYERS.map((l) => l.id)).toEqual([
      "modules",
      "rails",
      "beams",
      "inverter",
      "gutter",
      "columns",
      "foundation",
    ]);
    // Every layer carries a part: no empty group in the exploded diagram.
    groups.forEach((g) => expect(g.children.length).toBeGreaterThan(0));
  });

  it("gives every layer a unique explode offset, the foundation staying at zero", () => {
    const offsets = CARPORT_LAYERS.map((_, i) => layerExplodeOffset(i));
    expect(layerExplodeOffset(0)).toBe(0);
    expect(new Set(offsets).size).toBe(offsets.length);
    expect(offsets[offsets.length - 1]).toBeGreaterThan(0);
  });

  it("breathes from assembled to fully exploded and back, never leaving 0..1", () => {
    const samples = Array.from({ length: 240 }, (_, i) =>
      explodeAmountAt((i / 240) * EXPLODE_CYCLE_SECONDS),
    );
    expect(Math.min(...samples)).toBe(0);
    expect(Math.max(...samples)).toBeCloseTo(1, 5);
    samples.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
    expect(explodeAmountAt(EXPLODE_CYCLE_SECONDS)).toBeCloseTo(0, 5);
  });

  it("separates the stack on the clock: the module layer rises, the foundation does not", async () => {
    await mount();
    const groups = layerGroups();
    const foundation = groups[0];
    const modules = groups[groups.length - 1];
    const baseOf = (g: any) => g.userData.baseY as number;
    expect(modules.position.y).toBeCloseTo(baseOf(modules), 5);

    // Each frame advances the clock 100 ms; 45 frames is half a breath, the
    // peak of the curve.
    for (let i = 0; i < 45; i++) await advanceFrame(100);
    const amount = explodeAmountAt(4.5);
    expect(amount).toBeCloseTo(1, 5);
    expect(modules.position.y).toBeCloseTo(
      baseOf(modules) + layerExplodeOffset(6) * amount,
      5,
    );
    expect(foundation.position.y).toBeCloseTo(baseOf(foundation), 5);
  });
});

describe("carport exploded diagram: WebGL budget", () => {
  it("caps DPR at 2 and re-applies the cap on resize", async () => {
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 3,
    });
    const renderer = await mount();
    expect(renderer.setPixelRatio).toHaveBeenCalledWith(2);
    window.dispatchEvent(new Event("resize"));
    expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(2);
  });

  it("stops requesting frames while the document is hidden, and resumes when it returns", async () => {
    const renderer = await mount();
    await advanceFrame(100);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(pendingFrames.size).toBe(1);

    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(cancelled.length).toBeGreaterThan(0);
    expect(pendingFrames.size).toBe(0);

    await advanceFrame(100);
    expect(renderer.render).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(pendingFrames.size).toBe(1);
    await advanceFrame(100);
    expect(renderer.render).toHaveBeenCalledTimes(2);
  });

  it("pauses offscreen and resumes when it scrolls back into view", async () => {
    const renderer = await mount();
    await advanceFrame(100);
    expect(observerCallback).toBeTypeOf("function");
    observerCallback?.(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(pendingFrames.size).toBe(0);
    await advanceFrame(100);
    expect(renderer.render).toHaveBeenCalledTimes(1);

    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(pendingFrames.size).toBe(1);
    await advanceFrame(100);
    expect(renderer.render).toHaveBeenCalledTimes(2);
  });

  it("does not restart from an intersection callback while the tab is in the background", async () => {
    // The combination matters: a backgrounded tab that scrolls a diagram back
    // into view is exactly when a naive scheduler resumes a hidden canvas.
    const renderer = await mount();
    await advanceFrame(100);
    expect(renderer.render).toHaveBeenCalledTimes(1);

    observerCallback?.(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(pendingFrames.size).toBe(0);

    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(pendingFrames.size).toBe(0);
    await advanceFrame(100);
    expect(renderer.render).toHaveBeenCalledTimes(1);
  });

  it("renders exactly one static frame when reduced motion is requested", async () => {
    reduceMotionMatches = true;
    const renderer = await mount();
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(pendingFrames.size).toBe(0);
    // That one frame is the informative one: fully exploded.
    const modules = layerGroups().at(-1)!;
    expect(modules.position.y).toBeCloseTo(
      modules.userData.baseY + layerExplodeOffset(6),
      5,
    );
  });

  it("shows text while the context is lost and recovers on restore", async () => {
    const renderer = await mount();
    const canvas = renderer.domElement;
    await act(async () => {
      canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    });
    await flush();
    expect(host.querySelector('[role="status"]')).not.toBeNull();
    expect(renderer.render).toHaveBeenCalledTimes(0);

    await act(async () => {
      canvas.dispatchEvent(new Event("webglcontextrestored"));
    });
    await flush();
    expect(host.querySelector('[role="status"]')).toBeNull();
    expect(renderer.render.mock.calls.length).toBeGreaterThan(0);
  });

  it("disposes geometry, material and renderer exactly once, even unmounted twice", async () => {
    const renderer = await mount();
    expect(three.geometries.length).toBeGreaterThan(0);
    expect(three.materials.length).toBeGreaterThan(0);
    await act(async () => root.unmount());
    await act(async () => root.unmount());
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    three.geometries.forEach((g) =>
      expect(g.dispose).toHaveBeenCalledTimes(1),
    );
    three.materials.forEach((m) => expect(m.dispose).toHaveBeenCalledTimes(1));
    expect(renderer.domElement.isConnected).toBe(false);
  });

  it("hides the canvas from assistive tech and links a real text alternative", async () => {
    const renderer = await mount();
    expect(renderer.domElement.getAttribute("aria-hidden")).toBe("true");
    const figure = host.querySelector("figure")!;
    const canvasHost = figure.querySelector("[aria-describedby]")!;
    const id = canvasHost.getAttribute("aria-describedby")!;
    const description = document.getElementById(id)!;
    expect(description.textContent).toContain("Exploded 3D technical diagram");
    const fact = getProvinceEnergyFact(SLUG)!;
    expect(description.textContent).toContain(String(fact.specificYield));
    expect(description.textContent).toContain(
      getProvinceBySlug(SLUG)!.nameTh,
    );
    expect(description.textContent).toContain("not a savings promise");
  });

  it("lists every layer in the legend with the colour the geometry uses", async () => {
    await mount();
    const swatches = Array.from(
      host.querySelectorAll("figcaption ol li span[aria-hidden='true']"),
    ) as HTMLElement[];
    expect(swatches).toHaveLength(CARPORT_LAYERS.length);
    swatches.forEach((el, i) => {
      expect(el.style.backgroundColor).not.toBe("");
      expect(el.style.backgroundColor.toLowerCase()).toBe(
        rgbOf(CARPORT_LAYERS[i].color),
      );
    });
  });
});
