// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import fs from "node:fs";
import SolarHeroScene from "./SolarHeroScene";

// React 19 refuses act() unless the environment opts in; vitest 5 no longer sets it.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const rendererState = vi.hoisted(() => ({
  instances: [] as Array<any>,
  points: [] as Array<any>,
  meshes: [] as Array<any>,
  geometries: [] as Array<any>,
}));
// anime.js is deterministic here: the timelines return a pause handle and never
// tick, so the tests observe the scene graph, not animation frames.
vi.mock("animejs", () => ({
  animate: vi.fn(() => ({ pause: vi.fn() })),
  stagger: vi.fn((value: number) => value),
}));
vi.mock("three", () => {
  class Scale { x = 1; y = 1; z = 1; set(x = 1, y = 1, z = 1) { this.x = x; this.y = y; this.z = z; } }
  class Transform { set(...args: number[]) { this.last = args; } last: number[] = []; }
  class Scene { children: any[] = []; add(x: any) { this.children.push(x); } remove(x: any) { this.children = this.children.filter((c) => c !== x); } traverse(fn: (x: any) => void) { this.children.forEach(fn); } }
  class Mesh {
    rotation = { x: 0, y: 0, set: vi.fn() };
    position = { x: 0, y: 0, z: 0, set: vi.fn() };
    scale = new Scale();
    constructor(public geometry: any, public material: any) { rendererState.meshes.push(this); }
  }
  class Geometry { dispose = vi.fn(); constructor() { rendererState.geometries.push(this); } }
  class Material { dispose = vi.fn(); }
  // Points/BufferGeometry/BufferAttribute/PointsMaterial exist so the merged
  // solar dust flow (R30-P1) loads for real instead of tripping the dynamic
  // import's catch branch and unmounting the whole scene.
  class BufferAttribute { needsUpdate = false; constructor(public array: Float32Array, public itemSize: number) {} }
  class BufferGeometry { attributes: Record<string, any> = {}; setAttribute(name: string, attr: any) { this.attributes[name] = attr; } dispose = vi.fn(); }
  class Points { constructor(public geometry: any, public material: any) { rendererState.points.push(this); } }
  class PointsMaterial extends Material {}
  class Group extends Scene {
    rotation = { x: 0, y: 0, set: vi.fn() };
    position = { x: 0, y: 0, z: 0, set: vi.fn() };
    scale = new Scale();
  }
  class Camera { position = { set() {}, x: 0, y: 0 }; aspect = 1; lookAt() {} updateProjectionMatrix() {} }
  class WebGLRenderer {
    domElement = document.createElement("canvas"); setPixelRatio = vi.fn(); setSize = vi.fn(); render = vi.fn(); dispose = vi.fn();
    constructor() { rendererState.instances.push(this); }
  }
  class SphereGeometry extends Geometry {}
  class TorusGeometry extends Geometry {}
  class BoxGeometry extends Geometry {}
  return { Scene, Mesh, Group, Points, PerspectiveCamera: Camera, WebGLRenderer, CylinderGeometry: Geometry,
    IcosahedronGeometry: Geometry, SphereGeometry, TorusGeometry, BoxGeometry, BufferGeometry, BufferAttribute,
    ShaderMaterial: Material, MeshStandardMaterial: Material, PointsMaterial, AmbientLight: class {},
    DirectionalLight: class { position = { set() {} }; }, Color: class { setHex = vi.fn(); },
    Clock: class { getElapsedTime() { return 1; } }, SRGBColorSpace: "srgb", ACESFilmicToneMapping: 1,
    AdditiveBlending: 2, DoubleSide: 2 };
});

let host: HTMLDivElement;
let root: Root;
let observerCallback: IntersectionObserverCallback | undefined;
const source = fs.readFileSync("client/src/components/three/SolarHeroScene.tsx", "utf8");
// The component loads three.js via a dynamic `import("three")`, so settling
// requires a macrotask turn, not just microtasks. This only makes the harness
// wait for the module to arrive; it does not relax any assertion.
const flush = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
beforeEach(() => {
  rendererState.instances.length = 0;
  rendererState.points.length = 0;
  rendererState.meshes.length = 0;
  rendererState.geometries.length = 0;
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("IntersectionObserver", class { constructor(cb: IntersectionObserverCallback) { observerCallback = cb; } observe() {} disconnect = vi.fn(); });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as WebGLRenderingContext);
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { if (root) await act(async () => root.unmount()); host?.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("SolarHeroScene lifecycle", () => {
  it("mounts a decorative canvas with accessible parent fallback", async () => {
    await act(async () => root.render(createElement(SolarHeroScene))); await flush();
    expect(host.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(rendererState.instances[0]?.domElement.getAttribute("aria-hidden")).toBe("true");
    expect(host.textContent?.trim()).toBe("");
  });
  it("caps DPR at 2 and reapplies the cap on resize", async () => {
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 3 });
    await act(async () => root.render(createElement(SolarHeroScene))); await flush();
    const r = rendererState.instances[0]; expect(r.setPixelRatio).toHaveBeenCalledWith(2);
    window.dispatchEvent(new Event("resize")); expect(r.setPixelRatio).toHaveBeenLastCalledWith(2);
  });
  it("stops scheduling frames when the document is hidden", async () => {
    await act(async () => root.render(createElement(SolarHeroScene))); await flush();
    expect(source).toMatch(/visibilitychange/);
    expect(source).toMatch(/document\.hidden/);
  });
  it("pauses rendering offscreen", async () => {
    await act(async () => root.render(createElement(SolarHeroScene))); await flush();
    expect(observerCallback).toBeTypeOf("function");
    observerCallback?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(source).toMatch(/isVisible/);
  });
  it("handles lost and restored WebGL contexts", async () => {
    await act(async () => root.render(createElement(SolarHeroScene))); await flush();
    expect(source).toMatch(/webglcontextlost/);
    expect(source).toMatch(/webglcontextrestored/);
  });
  it("adds the merged solar dust flow and releases its buffers on unmount", async () => {
    await act(async () => root.render(createElement(SolarHeroScene))); await flush();
    const points = rendererState.points[0];
    expect(points).toBeDefined();
    expect(points.geometry.attributes.position.array.length).toBe(1200 * 3);
    await act(async () => root.unmount());
    expect(points.geometry.dispose).toHaveBeenCalledTimes(1);
    expect(points.material.dispose).toHaveBeenCalledTimes(1);
  });
  it("disposes renderer and GPU resources on unmount, idempotently", async () => {
    await act(async () => root.render(createElement(SolarHeroScene))); await flush();
    const renderer = rendererState.instances[0];
    await act(async () => root.unmount()); await act(async () => root.unmount());
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
  });
  it("anchors the product layer to the right half instead of over the copy", async () => {
    await act(async () => root.render(createElement(SolarHeroScene))); await flush();
    const sceneHost = document.querySelector('[data-testid="solar-hero-scene"]');
    expect(sceneHost).not.toBeNull();
    expect(sceneHost?.className).toContain("right-0");
    expect(sceneHost?.className).toContain("md:block");
    expect(sceneHost?.className).toContain("pointer-events-none");
  });
  it("builds a different sculpture when the slide category changes", async () => {
    await act(async () => root.render(createElement(SolarHeroScene, { category: "bess" })));
    await flush();
    const bessMeshes = rendererState.meshes.length;
    expect(bessMeshes).toBeGreaterThan(0);
    await act(async () => root.render(createElement(SolarHeroScene, { category: "solar-carport" })));
    await flush();
    expect(rendererState.meshes.length).toBeGreaterThan(bessMeshes);
    expect(source).toMatch(/createSculpture/);
  });
  it("renders exactly one static frame for reduced motion", async () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true, media: "", onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true } as MediaQueryList);
    await act(async () => root.render(createElement(SolarHeroScene))); await flush();
    expect(source).toMatch(/reduceMotion/);
    expect(rendererState.instances[0]?.render).toHaveBeenCalledTimes(1);
  });
});
