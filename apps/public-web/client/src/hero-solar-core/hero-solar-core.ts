/**
 * hero-solar-core — SIRINX interactive hero module.
 *
 * Self-contained Three.js + GLSL scene: a distorted icosahedral "solar core"
 * wrapped in a downward particle flow. No dependency outside the bare `three`
 * specifier, so it can be dropped into any Vite component without touching
 * build config.
 */

import * as THREE from 'three'

/** Brand palette. */
export const SOLAR_COLORS = {
  bg: 0x080c14,
  primary: 0x00f2fe,
  secondary: 0x10b981,
  accent: 0xff9f43,
} as const

const PARTICLE_COUNT = 1200
/** Particles wrap from below this y back to the top. */
const PARTICLE_WRAP_MIN = -7
const PARTICLE_WRAP_MAX = 7
const MAX_PIXEL_RATIO = 2

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;

  varying vec3 vPosition;
  varying vec3 vViewNormal;
  varying vec3 vViewDir;

  void main() {
    vPosition = position;

    // uTime-driven distortion wave: sin/cos lobes riding the surface normal.
    float wave =
      sin(position.x * 2.0 + uTime * 1.20) *
      cos(position.y * 2.0 + uTime * 0.90) *
      cos(position.z * 2.0 - uTime * 1.10);

    float secondary =
      sin(position.y * 3.7 - uTime * 1.65) * 0.35;

    vec3 displaced = position + normal * (wave + secondary) * 0.18;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);

    gl_Position = projectionMatrix * mvPosition;
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorPrimary;
  uniform vec3 uColorSecondary;

  varying vec3 vPosition;
  varying vec3 vViewNormal;
  varying vec3 vViewDir;

  void main() {
    // Fresnel rim glow.
    float facing = clamp(dot(normalize(vViewNormal), normalize(vViewDir)), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 2.2);

    // Vertical gradient primary -> secondary, breathing on uTime.
    float band = smoothstep(-2.0, 2.0, vPosition.y + sin(uTime * 0.6) * 0.5);
    vec3 base = mix(uColorPrimary, uColorSecondary, band);

    vec3 color = base + uColorPrimary * fresnel * 1.6;
    float alpha = 0.28 + fresnel * 0.72;

    gl_FragColor = vec4(color, alpha);
  }
`

export type SolarEnergyCoreOptions = {
  /** Per-frame particle fall speed. Default 0.45. */
  particleSpeed?: number
  /** Core auto-rotation speed. Default 0.15. */
  rotationSpeed?: number
}

/**
 * Renders the SIRINX solar hero scene into a container element.
 *
 * Lifecycle: construct -> `start()` -> (optional `dispose()`). `dispose()` is
 * idempotent and fully tears down the renderer, GPU resources, resize listener
 * and animation loop, so a second call is a no-op.
 */
export class SolarEnergyCore {
  private readonly container: HTMLElement
  private readonly particleSpeed: number
  private readonly rotationSpeed: number

  private renderer: THREE.WebGLRenderer | null = null
  private scene: THREE.Scene | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private core: THREE.Mesh<
    THREE.IcosahedronGeometry,
    THREE.ShaderMaterial
  > | null = null
  private particles: THREE.Points<
    THREE.BufferGeometry,
    THREE.PointsMaterial
  > | null = null
  private particlePositions: Float32Array | null = null
  private lights: THREE.Light[] = []

  private frameId = 0
  private clock: THREE.Clock | null = null
  private running = false
  private disposed = false

  private readonly onResize = (): void => {
    this.resize()
  }

  private readonly onVisibilityChange = (): void => {
    if (this.disposed) return
    if (document.hidden) {
      this.stopLoop()
    } else {
      this.startLoop()
    }
  }

  constructor(
    container: HTMLElement,
    options: SolarEnergyCoreOptions = {},
  ) {
    this.container = container
    this.particleSpeed = options.particleSpeed ?? 0.45
    this.rotationSpeed = options.rotationSpeed ?? 0.15
  }

  /** Builds the scene, mounts the canvas and begins the render loop. */
  start(): void {
    if (this.disposed || this.running) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    camera.position.z = 6

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor(SOLAR_COLORS.bg, 1)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    this.container.appendChild(renderer.domElement)

    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.clock = new THREE.Clock()

    this.buildCore()
    this.buildParticles()
    this.buildLights()

    this.resize()
    window.addEventListener('resize', this.onResize)
    document.addEventListener('visibilitychange', this.onVisibilityChange)

    this.running = true
    this.startLoop()
  }

  private buildCore(): void {
    const scene = this.scene
    if (!scene) return

    const geometry = new THREE.IcosahedronGeometry(2, 64)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorPrimary: { value: new THREE.Color(SOLAR_COLORS.primary) },
        uColorSecondary: { value: new THREE.Color(SOLAR_COLORS.secondary) },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      wireframe: true,
      transparent: true,
    })

    const core = new THREE.Mesh(geometry, material)
    scene.add(core)
    this.core = core
  }

  private buildParticles(): void {
    const scene = this.scene
    if (!scene) return

    const positions = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 14
      positions[i * 3 + 1] = PARTICLE_WRAP_MIN + Math.random() * (PARTICLE_WRAP_MAX - PARTICLE_WRAP_MIN)
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: SOLAR_COLORS.primary,
      size: 0.035,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    this.particles = particles
    this.particlePositions = positions
  }

  private buildLights(): void {
    const scene = this.scene
    if (!scene) return

    const directional = new THREE.DirectionalLight(SOLAR_COLORS.primary, 1.6)
    directional.position.set(4, 6, 5)

    const ambient = new THREE.AmbientLight(SOLAR_COLORS.secondary, 0.35)

    const hemisphere = new THREE.HemisphereLight(
      SOLAR_COLORS.primary,
      SOLAR_COLORS.bg,
      0.5,
    )

    scene.add(directional, ambient, hemisphere)
    this.lights = [directional, ambient, hemisphere]
  }

  private resize(): void {
    const renderer = this.renderer
    const camera = this.camera
    if (!renderer || !camera || this.disposed) return

    const width = this.container.clientWidth || 1
    const height = this.container.clientHeight || 1

    camera.aspect = width / height
    camera.updateProjectionMatrix()

    // Hard cap: never exceed 2x device pixel ratio.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
    renderer.setSize(width, height, false)
  }

  private startLoop(): void {
    if (this.disposed || this.frameId !== 0) return
    this.frameId = window.requestAnimationFrame(this.tick)
  }

  private stopLoop(): void {
    if (this.frameId !== 0) {
      window.cancelAnimationFrame(this.frameId)
      this.frameId = 0
    }
  }

  private readonly tick = (): void => {
    this.frameId = 0
    if (this.disposed || !this.running) return

    const elapsed = this.clock ? this.clock.getElapsedTime() : 0

    if (this.core) {
      this.core.rotation.y = elapsed * this.rotationSpeed
      this.core.rotation.x = elapsed * this.rotationSpeed * 0.6
      this.core.material.uniforms.uTime.value = elapsed
    }

    this.advanceParticles()

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera)
    }

    if (!document.hidden) {
      this.startLoop()
    }
  }

  private advanceParticles(): void {
    const positions = this.particlePositions
    if (!positions) return

    const span = PARTICLE_WRAP_MAX - PARTICLE_WRAP_MIN
    for (let i = 1; i < positions.length; i += 3) {
      let y = positions[i] - this.particleSpeed * 0.016
      if (y < PARTICLE_WRAP_MIN) {
        y += span
      }
      positions[i] = y
    }

    const attribute = this.particles?.geometry.getAttribute('position')
    if (attribute) {
      attribute.needsUpdate = true
    }
  }

  /**
   * Idempotent teardown: cancels the rAF loop, removes listeners, disposes
   * every geometry, material and the renderer, and detaches the canvas.
   * Safe to call any number of times.
   */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.running = false

    this.stopLoop()

    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)

    for (const light of this.lights) {
      light.dispose()
    }
    this.lights = []

    if (this.particles) {
      this.scene?.remove(this.particles)
      this.particles.geometry.dispose()
      this.particles.material.dispose()
      this.particles = null
    }
    this.particlePositions = null

    if (this.core) {
      this.scene?.remove(this.core)
      this.core.geometry.dispose()
      this.core.material.dispose()
      this.core = null
    }

    if (this.renderer) {
      this.renderer.dispose()
      const canvas = this.renderer.domElement
      canvas.parentNode?.removeChild(canvas)
      this.renderer = null
    }

    this.scene = null
    this.camera = null
    this.clock = null
  }
}

export default SolarEnergyCore
