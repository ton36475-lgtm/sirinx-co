/**
 * Slide-aware Three.js sculptures for the home hero.
 *
 * Each `SolutionCategory` in `HeroSlideshow` gets its own compact product
 * model instead of one generic core, so the WebGL layer shows what the slide
 * is about (carport / rooftop / floating / BESS / hotel / AI) rather than a
 * second, unrelated image stacked on top of the hero photo. Everything is
 * built from primitives — no external mesh, no loader, no extra request — and
 * the caller owns disposal through `SceneResources`.
 */

type ThreeModule = typeof import("three");
type Vec3 = [number, number, number];
type Material3 = import("three").Material;
type Object3 = import("three").Object3D;
type Mesh3 = import("three").Mesh;

export type HeroSculptureKind =
  | "solar-carport"
  | "rooftop-solar"
  | "floating-solar"
  | "bess"
  | "hospitality"
  | "ai-energy";

export type HeroAccent = "sun" | "cyan";

/** Palette shared by every sculpture so the hero keeps one visual language. */
export interface SculpturePalette {
  panel: Material3;
  frame: Material3;
  accent: Material3;
  accentSoft: Material3;
  water: Material3;
  building: Material3;
}

export interface Sculpture {
  group: import("three").Group;
  /** Meshes that move during the intro/transition timelines. */
  panels: Object3[];
  /** Emissive meshes that pulse while the scene idles. */
  cores: Object3[];
}

function makeBox(T: ThreeModule, size: Vec3, position: Vec3, material: Material3): Mesh3 {
  const mesh = new T.Mesh(new T.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  return mesh;
}

function makeCylinder(
  T: ThreeModule,
  radius: number,
  height: number,
  position: Vec3,
  material: Material3
): Mesh3 {
  const mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, height, 12), material);
  mesh.position.set(position[0], position[1], position[2]);
  return mesh;
}

/** A tilted row of photovoltaic panels. */
function panelRow(
  T: ThreeModule,
  count: number,
  origin: Vec3,
  spacing: number,
  material: Material3,
  panelGeometry: import("three").BufferGeometry
): Mesh3[] {
  const panels: Mesh3[] = [];
  for (let i = 0; i < count; i += 1) {
    const panel = new T.Mesh(panelGeometry, material);
    panel.position.set(origin[0] + i * spacing, origin[1], origin[2]);
    panel.rotation.set(-0.42, 0, 0);
    panels.push(panel);
  }
  return panels;
}

/**
 * Build one sculpture. The caller disposes the returned group, so nothing here
 * allocates GPU resources without an owner.
 */
export function createSculpture(
  T: ThreeModule,
  kind: HeroSculptureKind,
  palette: SculpturePalette
): Sculpture {
  const group = new T.Group();
  const panels: Object3[] = [];
  const cores: Object3[] = [];
  const panelGeometry = new T.BoxGeometry(0.62, 0.045, 0.42);

  const push = (mesh: Object3) => {
    group.add(mesh);
  };

  switch (kind) {
    case "solar-carport": {
      push(makeCylinder(T, 0.055, 1.5, [-1.05, -0.45, 0.35], palette.frame));
      push(makeCylinder(T, 0.055, 1.5, [1.05, -0.45, 0.35], palette.frame));
      panels.push(...panelRow(T, 4, [-0.95, 0.32, 0], 0.64, palette.panel, panelGeometry));
      panels.forEach(push);
      const beam = makeBox(T, [2.5, 0.045, 0.5], [0, 0.24, 0], palette.frame);
      beam.rotation.set(-0.42, 0, 0);
      push(beam);
      const flow = makeBox(T, [1.9, 0.012, 0.06], [0, 0.18, 0.34], palette.accent);
      cores.push(flow);
      push(flow);
      break;
    }

    case "rooftop-solar": {
      const building = makeBox(T, [2.6, 1.1, 1.5], [0, -0.62, 0], palette.building);
      push(building);
      panels.push(...panelRow(T, 4, [-0.95, 0.02, -0.3], 0.64, palette.panel, panelGeometry));
      panels.forEach(push);
      const inverter = makeBox(T, [0.3, 0.42, 0.12], [1.15, -0.5, 0.8], palette.accent);
      cores.push(inverter);
      push(inverter);
      break;
    }

    case "floating-solar": {
      push(makeBox(T, [4.4, 0.02, 2.6], [0, -0.62, 0], palette.water));
      [-0.8, 0, 0.8].forEach((z) => {
        push(makeCylinder(T, 0.09, 2.2, [0, -0.48, z], palette.frame));
      });
      panels.push(...panelRow(T, 3, [-0.7, -0.22, -0.8], 0.7, palette.panel, panelGeometry));
      panels.push(...panelRow(T, 3, [-0.7, -0.22, 0], 0.7, palette.panel, panelGeometry));
      panels.push(...panelRow(T, 3, [-0.7, -0.22, 0.8], 0.7, palette.panel, panelGeometry));
      panels.forEach(push);
      break;
    }

    case "bess": {
      const cabinet = makeBox(T, [1.5, 1.9, 0.9], [0, -0.2, 0], palette.building);
      push(cabinet);
      [-0.5, -0.1, 0.3].forEach((y) => {
        const strip = makeBox(T, [1.2, 0.05, 0.03], [0, y, 0.47], palette.accent);
        cores.push(strip);
        panels.push(strip);
        push(strip);
      });
      const core = new T.Mesh(new T.SphereGeometry(0.24, 16, 16), palette.accentSoft);
      core.position.set(0, 0.85, 0);
      cores.push(core);
      push(core);
      break;
    }

    case "hospitality": {
      push(makeBox(T, [2.1, 1.0, 1.2], [0, -0.68, 0], palette.building));
      push(makeBox(T, [1.2, 0.6, 1.0], [1.35, -0.86, 0.1], palette.building));
      panels.push(...panelRow(T, 3, [-0.7, -0.02, 0.1], 0.62, palette.panel, panelGeometry));
      panels.forEach(push);
      const pool = makeBox(T, [1.1, 0.02, 0.7], [1.3, -0.6, 0.85], palette.water);
      push(pool);
      break;
    }

    case "ai-energy": {
      const grid = new T.Mesh(new T.BoxGeometry(2.2, 1.3, 0.05), palette.panel);
      grid.position.set(0, 0, 0);
      push(grid);
      const ring = new T.Mesh(new T.TorusGeometry(1.15, 0.03, 8, 48), palette.accent);
      ring.position.set(0, 0, 0.35);
      push(ring);
      [-0.7, 0, 0.7].forEach((x, index) => {
        const node = new T.Mesh(new T.SphereGeometry(0.075, 12, 12), palette.accentSoft);
        node.position.set(x, index === 1 ? 0.28 : -0.2, 0.3);
        cores.push(node);
        panels.push(node);
        push(node);
      });
      break;
    }
  }

  group.position.set(1.9, 0.15, 0);
  return { group, panels, cores };
}
