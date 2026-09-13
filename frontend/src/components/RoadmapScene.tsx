import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Reads the live --accent-* CSS variables (set on <html data-accent="...">)
// so the scene can recolor itself when the user switches theme, without a
// full remount.
function readAccentColors() {
  const styles = getComputedStyle(document.documentElement)
  const hex = (name, fallback) => (styles.getPropertyValue(name).trim() || fallback)
  return {
    accent500: hex('--accent-500', '#3d7bff'),
    accent400: hex('--accent-400', '#6fa8ff'),
    accent300: hex('--accent-300', '#8fc3ff'),
  }
}

/* Abstract low-poly 3D visual: a faceted core wrapped in orbiting rings,
   drifting through a particle field, with rim lighting that follows the
   app's current accent color. The scene gently tilts and parallaxes toward
   the mouse position within its container. */
export default function RoadmapScene() {
  const mountRef = useRef<HTMLDivElement>(null)
  const mouseTarget = useRef({ x: 0, y: 0 })
  const mouseCurrent = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const { accent500, accent400 } = readAccentColors()

    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x050814, 0.05)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0.6, 8.5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0x1a2540, 1.1))
    const rimLightA = new THREE.PointLight(new THREE.Color(accent500), 6, 20)
    rimLightA.position.set(-4, 3, 4)
    scene.add(rimLightA)
    const rimLightB = new THREE.PointLight(0xff3b5c, 3.5, 20)
    rimLightB.position.set(4, -1, 3)
    scene.add(rimLightB)

    const coreGeo = new THREE.IcosahedronGeometry(1.1, 0)
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0a1226,
      emissive: new THREE.Color(accent500),
      emissiveIntensity: 0.55,
      metalness: 0.6,
      roughness: 0.25,
      flatShading: true,
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    scene.add(core)

    const coreWireMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(accent400), wireframe: true, transparent: true, opacity: 0.35 })
    const coreWire = new THREE.Mesh(coreGeo, coreWireMat)
    coreWire.scale.setScalar(1.02)
    scene.add(coreWire)

    const rings: THREE.Mesh[] = []
    const ringMats = [
      new THREE.MeshBasicMaterial({ color: new THREE.Color(accent500), transparent: true, opacity: 0.55 }),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(accent400), transparent: true, opacity: 0.55 }),
      new THREE.MeshBasicMaterial({ color: 0xff3b5c, transparent: true, opacity: 0.55 }),
    ]
    ringMats.forEach((mat, i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9 + i * 0.35, 0.015, 8, 64), mat)
      ring.rotation.x = Math.PI / 2 + i * 0.6
      ring.rotation.y = i * 0.4
      scene.add(ring)
      rings.push(ring)
    })

    const particleCount = 240
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({ color: new THREE.Color(accent400), size: 0.03, transparent: true, opacity: 0.55 })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // Re-tint every accent-colored material in place when the theme swatch
    // changes, instead of tearing down and rebuilding the whole scene.
    const applyAccent = () => {
      const { accent500: a500, accent400: a400 } = readAccentColors()
      rimLightA.color.set(a500)
      coreMat.emissive.set(a500)
      coreWireMat.color.set(a400)
      ringMats[0].color.set(a500)
      ringMats[1].color.set(a400)
      particleMat.color.set(a400)
    }
    const accentObserver = new MutationObserver(applyAccent)
    accentObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-accent'] })

    // Mouse tracking, normalized to [-1, 1] within the container. Skipped
    // entirely when the user prefers reduced motion.
    const onPointerMove = (e) => {
      const rect = mount.getBoundingClientRect()
      mouseTarget.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseTarget.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1
    }
    const onPointerLeave = () => {
      mouseTarget.current.x = 0
      mouseTarget.current.y = 0
    }
    if (!reduceMotion) {
      mount.addEventListener('pointermove', onPointerMove)
      mount.addEventListener('pointerleave', onPointerLeave)
    }

    // A gentle scroll-tied sweep: the red rim light's intensity rises as
    // the hero scrolls further up out of view, reading as a light "sweeping"
    // across the core while the page moves.
    let scrollProgress = 0
    const onScroll = () => {
      const rect = mount.getBoundingClientRect()
      const total = rect.height + window.innerHeight
      const raw = 1 - (rect.top + rect.height) / total
      scrollProgress = Math.min(1, Math.max(0, raw))
    }
    if (!reduceMotion) {
      window.addEventListener('scroll', onScroll, { passive: true })
      onScroll()
    }

    let frame
    const clock = new THREE.Clock()
    const renderFrame = () => {
      const t = clock.getElapsedTime()

      mouseCurrent.current.x += (mouseTarget.current.x - mouseCurrent.current.x) * 0.06
      mouseCurrent.current.y += (mouseTarget.current.y - mouseCurrent.current.y) * 0.06
      const mx = mouseCurrent.current.x
      const my = mouseCurrent.current.y

      core.rotation.y = t * 0.2 + mx * 0.6
      core.rotation.x = Math.sin(t * 0.2) * 0.15 - my * 0.4
      coreWire.rotation.y = core.rotation.y
      coreWire.rotation.x = core.rotation.x

      rings.forEach((r, i) => {
        r.rotation.z = t * (0.15 + i * 0.07) * (i % 2 === 0 ? 1 : -1)
      })

      particles.rotation.y = t * 0.02 + mx * 0.05

      camera.position.x = Math.sin(t * 0.08) * 0.6 + mx * 1.4
      camera.position.y = 0.6 + my * -0.8
      camera.lookAt(0, 0.15, 0)

      rimLightA.position.x = -4 + mx * 2.5
      rimLightA.position.y = 3 - my * 1.5
      rimLightB.intensity = 3.5 + scrollProgress * 4

      renderer.render(scene, camera)
      if (!reduceMotion) frame = requestAnimationFrame(renderFrame)
    }

    if (reduceMotion) {
      renderFrame() // draw a single static frame, no animation loop
    } else {
      renderFrame()
    }

    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      accentObserver.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      mount.removeEventListener('pointermove', onPointerMove)
      mount.removeEventListener('pointerleave', onPointerLeave)
      mount.removeChild(renderer.domElement)
      coreGeo.dispose()
      coreMat.dispose()
      coreWireMat.dispose()
      ringMats.forEach((m) => m.dispose())
      particleGeo.dispose()
      particleMat.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0" />
}
