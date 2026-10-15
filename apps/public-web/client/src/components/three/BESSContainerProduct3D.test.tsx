// @vitest-environment jsdom
/**
 * BESSContainerProduct3D — R30-P3, Concept D.
 *
 * Mounted for real through react-dom/client against a mocked three.js module, so
 * the assertions are about observed behaviour (frames rendered, resources disposed,
 * DPR handed to the renderer) rather than about the source text.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import BESSContainerProduct3D from "./BESSContainerProduct3D";

const three = vi.hoisted(() => ({
  renderers: [] as any[],
  geometries: [] as any[],
  materials: [] as any[],
  groups: [] as any[],
}));

vi.mock("three", () => {
  class Geometry {
    dispose = vi.fn();
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
  class Fog {}
  // Added 2026-09-28 (Lane B, R30-D1). The component constructs
  // `new THREE.PerspectiveCamera(fov, aspect, near, far)` and then calls
  // position.set(...) and updateProjectionMatrix() on every resize.
  class PerspectiveCamera extends Object3D {
    aspect = 1;
    constructor(..._args: unknown[]) {
      super();
    }
  }
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
    Mesh,
    // Exported since 2026-09-28 (Lane B, R30-D1). Both classes were defined in this
    // factory but never listed in the return, so THREE.WebGLRenderer and THREE.Fog were
    // undefined at runtime, the component's own try/catch took the graphicsError path,
    // and no renderer was ever created.
    Fog,
    WebGLRenderer,
    PerspectiveCamera,
    BoxGeometry: geometryOf(Geometry),
    CylinderGeometry: geometryOf(Geometry),
    CircleGeometry: geometryOf(Geometry),
    MeshStandardMaterial: materialOf(Material),
    MeshBasicMaterial: materialOf(Material),
    DoubleSide: 2,
    HemisphereLight: class extends Light {},
    DirectionalLight: class extends Light {},
    SRGBColorSpace: "srgb",
    ACESFilmicToneMapping: 4,
  };
});

vi.mock("three/examples/jsm/controls/OrbitControls.js", () => ({
  OrbitControls: class {
    enableDamping = false;
    enablePan = true;
    minDistance = 0;
    maxDistance = 100;
    maxPolarAngle = Math.PI;
    target = { set() {} };
    autoRotate = false;
    autoRotateSpeed = 0;
    update = vi.fn();
    dispose = vi.fn();
    constructor() {
      three.groups.push(this);
    }
  },
}));

const source = readFileSync(
  "client/src/components/three/BESSContainerProduct3D.tsx",
  "utf8",
);

// ── Mount harness ────────────────────────────────────────────────────────────
// Hoisted to module scope 2026-09-28 (Lane B, R30-D1), same fix as the hologram test.
// The original author put this inside the third describe(), but the first two call
// mount() and a block-scoped `const` is not hoisted. Only the SCOPE changed: the
// harness and all 9 assertions are the original author's.
let host: HTMLDivElement;
let root: Root;
let renderer: any;
let observerCallback: IntersectionObserverCallback | undefined;
let pendingFrames: Map<number, FrameRequestCallback>;
let nextRafId: number;
let cancelled: number[];
let reduceMotionMatches: boolean;

const flush = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
};

const mount = async () => {
  await act(async () => {
    root.render(createElement(BESSContainerProduct3D, { labelTh: "ทดสอบ" }));
  });
  await flush();
  renderer = three.renderers[three.renderers.length - 1];
  return renderer;
};

beforeEach(() => {
  three.renderers.length = 0;
  three.geometries.length = 0;
  three.materials.length = 0;
  three.groups.length = 0;
  pendingFrames = new Map();
  nextRafId = 1;
  cancelled = [];
  reduceMotionMatches = false;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
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
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 1 });
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

describe("bess container product: lazy chunk and data binding", () => {
  it("reaches three.js only through a dynamic import", () => {
    expect(source).not.toMatch(
      /^\\s*import\\s+\\*\\s+as\\s+THREE\\s+from\\s+"three"/m,
    );
    expect(source).not.toMatch(/^\\s*import\\s+\\{[^}]*\\}\\s+from\\s+"three"/m);
    expect(source).toContain('void import("three")');
  });

  it("quotes a real text alternative linked by aria-describedby", async () => {
    await mount();
    const figure = host.querySelector("figure")!;
    const canvasHost = figure.querySelector("[aria-describedby]")!;
    const id = canvasHost.getAttribute("aria-describedby")!;
    const description = document.getElementById(id)!;
    expect(description.textContent).toContain("BESS container unit");
    expect(description.textContent).toContain("or a savings promise");
  });
});

describe("bess container product: structure", () => {
  it("builds a container cab, inverter cabinet, charger, and wheels", async () => {
    await mount();
    expect(three.groups.length).toBeGreaterThanOrEqual(3);
    const meshes = three.groups.filter(
      (g) =>
        g.children?.length > 0 &&
        g.children.some((c: any) => c.geometry !== null),
    );
    expect(meshes.length).toBeGreaterThanOrEqual(2);
    const wheelMeshes = three.groups
      .flatMap((g) => g.children ?? [])
      .filter(
        (mesh: any) =>
          mesh.geometry !== null &&
          mesh.position.z !== undefined &&
          Math.abs(mesh.position.z) === 1.3,
      );
    expect(wheelMeshes).toHaveLength(4);
  });
});

describe("bess container product: WebGL budget", () => {
  it("caps DPR at 2 and re-applies the cap on resize", async () => {
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 3,
    });
    await mount();
    expect(renderer.setPixelRatio).toHaveBeenCalledWith(2);
    window.dispatchEvent(new Event("resize"));
    expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(2);
  });

  it("pauses offscreen and resumes when it scrolls back into view", async () => {
    await mount();
    expect(pendingFrames.size).toBe(1);
    observerCallback?.(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(pendingFrames.size).toBe(0);
    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(pendingFrames.size).toBe(1);
  });

  it("renders exactly one static frame when reduced motion is requested", async () => {
    reduceMotionMatches = true;
    await mount();
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(pendingFrames.size).toBe(0);
  });

  it("shows text while the context is lost and recovers on restore", async () => {
    await mount();
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
    await mount();
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

  it("hides the canvas from assistive tech", async () => {
    await mount();
    expect(renderer.domElement.getAttribute("aria-hidden")).toBe("true");
  });
});
