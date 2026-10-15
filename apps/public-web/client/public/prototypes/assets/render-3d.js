import * as THREE from 'three';
import { animate } from 'animejs/animation';

export async function mount({ container }) {
  if (!container) throw new Error('Scene container not found');
  const probe = document.createElement('canvas');
  const context = probe.getContext('webgl2') || probe.getContext('webgl');
  if (!context) throw new Error('WebGL is unavailable in this browser');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch (error) {
    throw new Error(`WebGL renderer unavailable: ${error?.message || 'unsupported'}`);
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.setClearColor(0xefe9dc, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.tabIndex = -1;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xefe9dc);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(9.2, 7.1, 10.2);
  camera.lookAt(0, 1.1, 0);
  scene.add(new THREE.HemisphereLight(0xfff4df, 0x5e6965, 2.15));
  const keyLight = new THREE.DirectionalLight(0xffead1, 2.2);
  keyLight.position.set(-5, 10, 7);
  scene.add(keyLight);

  const rig = new THREE.Group();
  scene.add(rig);
  const mats = {
    ground: new THREE.MeshStandardMaterial({ color: 0xcabda9, roughness: 1 }),
    slab: new THREE.MeshStandardMaterial({ color: 0xd8ccb7, roughness: 0.98 }),
    post: new THREE.MeshStandardMaterial({ color: 0xba7455, roughness: 0.82 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x3a7880, roughness: 0.69, metalness: 0.08 }),
    panel: new THREE.MeshStandardMaterial({ color: 0x376a78, roughness: 0.58, metalness: 0.16 }),
    frame: new THREE.MeshStandardMaterial({ color: 0xd9c9ad, roughness: 0.72, metalness: 0.06 }),
    car: new THREE.MeshStandardMaterial({ color: 0xe4d3b8, roughness: 0.57, metalness: 0.04 }),
    window: new THREE.MeshStandardMaterial({ color: 0x6c9695, roughness: 0.36, metalness: 0.12 }),
    tire: new THREE.MeshStandardMaterial({ color: 0x252b2d, roughness: 0.94 }),
    hub: new THREE.MeshStandardMaterial({ color: 0xd7c7ad, roughness: 0.58, metalness: 0.12 }),
    charger: new THREE.MeshStandardMaterial({ color: 0x466d6a, roughness: 0.68 }),
    glow: new THREE.MeshStandardMaterial({ color: 0x70d6c2, emissive: 0x194a44, roughness: 0.4 })
  };

  const addBox = (parent, w, h, d, material, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const addCylinder = (parent, radiusTop, radiusBottom, height, material, x, y, z, segments = 12) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  // Ground and stylized parking slab.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(18, 13), mats.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.11;
  rig.add(ground);
  addBox(rig, 7.3, 0.18, 4.5, mats.slab, 0, 0.02, 0);

  // Four structural posts and a conceptual frame. These dimensions are illustrative only.
  const postXs = [-2.65, 2.65];
  const postZs = [-1.48, 1.48];
  for (const x of postXs) {
    for (const z of postZs) {
      addBox(rig, 0.2, 2.85, 0.2, mats.post, x, 1.51, z);
      addBox(rig, 0.48, 0.12, 0.48, mats.frame, x, 0.16, z);
    }
  }
  const roofGroup = new THREE.Group();
  roofGroup.position.set(0, 3.0, 0);
  roofGroup.rotation.z = -0.075;
  rig.add(roofGroup);
  addBox(roofGroup, 6.3, 0.17, 3.8, mats.frame, 0, 0, 0);
  addBox(roofGroup, 6.1, 0.08, 3.62, mats.roof, 0, 0.13, 0);
  for (let ix = 0; ix < 5; ix += 1) {
    for (let iz = 0; iz < 3; iz += 1) {
      const x = (ix - 2) * 1.17;
      const z = (iz - 1) * 1.12;
      addBox(roofGroup, 1.08, 0.045, 1.02, mats.panel, x, 0.205, z);
    }
  }
  // Sparse bright divider lines make the panel grid visible without heavy geometry.
  for (let ix = 0; ix < 6; ix += 1) {
    const x = (ix - 2.5) * 1.17;
    addBox(roofGroup, 0.028, 0.02, 3.38, mats.frame, x, 0.236, 0);
  }
  for (let iz = 0; iz < 4; iz += 1) {
    const z = (iz - 1.5) * 1.12;
    addBox(roofGroup, 5.95, 0.02, 0.028, mats.frame, 0, 0.236, z);
  }

  // Original clay-like vehicle blockout; not a real vehicle model.
  const carRig = new THREE.Group();
  carRig.position.set(0.15, 0, 0.08);
  rig.add(carRig);
  addBox(carRig, 2.2, 0.47, 1.28, mats.car, 0, 0.7, 0);
  addBox(carRig, 1.22, 0.44, 1.02, mats.car, -0.08, 1.12, 0);
  addBox(carRig, 1.05, 0.24, 0.96, mats.window, -0.08, 1.15, 0);
  for (const x of [-0.76, 0.76]) {
    for (const z of [-0.68, 0.68]) {
      const tire = addCylinder(carRig, 0.29, 0.29, 0.18, mats.tire, x, 0.42, z, 18);
      tire.rotation.x = Math.PI / 2;
      const hub = addCylinder(carRig, 0.12, 0.12, 0.19, mats.hub, x, 0.42, z, 14);
      hub.rotation.x = Math.PI / 2;
    }
  }

  // A generic charger block marks a possible component, not a product claim.
  addBox(rig, 0.42, 0.95, 0.28, mats.charger, 3.15, 0.58, 1.65);
  addBox(rig, 0.27, 0.18, 0.035, mats.glow, 3.15, 0.79, 1.5);

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight || 300);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  };
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  observer?.observe(container);
  if (!observer) window.addEventListener('resize', resize);

  let motion = null;
  let animationFrame = 0;
  let disposed = false;
  const render = () => { if (!disposed) renderer.render(scene, camera); };
  const pauseMotion = () => {
    motion?.pause();
    motion = null;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    render();
  };
  const onVisibilityChange = () => {
    if (document.hidden) pauseMotion();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  resize();
  return {
    render,
    setAngle(degrees) {
      rig.rotation.y = (Number(degrees) || 0) * Math.PI / 180;
      render();
    },
    startMotion() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      pauseMotion();
      motion = animate(rig.rotation, { y: rig.rotation.y + Math.PI * 2, duration: 18000, ease: 'linear', loop: true });
      const tick = () => {
        if (disposed || !motion) return;
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(tick);
      };
      tick();
      return true;
    },
    pauseMotion,
    dispose() {
      pauseMotion();
      disposed = true;
      observer?.disconnect();
      if (!observer) window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      renderer.dispose();
      container.replaceChildren();
    }
  };
}
