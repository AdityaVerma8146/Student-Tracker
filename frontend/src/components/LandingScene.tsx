import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function readAccentColors() {
  const styles = getComputedStyle(document.documentElement)
  const hex = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback
  return {
    accent500: hex('--accent-500', '#3b82f6'),
    accent400: hex('--accent-400', '#60a5fa'),
    accent300: hex('--accent-300', '#93c5fd'),
  }
}

export default function LandingScene() {
  const mountRef = useRef<HTMLDivElement>(null)
  const mouseTarget = useRef({ x: 0, y: 0 })
  const mouseCurrent = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const { accent500, accent400, accent300 } = readAccentColors()

    let width = mount.clientWidth || window.innerWidth
    let height = mount.clientHeight || window.innerHeight

    // Scene & Fog
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x030712, 0.035)

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0.5, 9)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    mount.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8)
    scene.add(ambientLight)

    const mainLight = new THREE.PointLight(new THREE.Color(accent500), 8, 30)
    mainLight.position.set(-3.5, 3.5, 6)
    scene.add(mainLight)

    const purpleLight = new THREE.PointLight(0x8b5cf6, 6, 25)
    purpleLight.position.set(4, -2.5, 4)
    scene.add(purpleLight)

    const cyanLight = new THREE.PointLight(0x06b6d4, 4, 20)
    cyanLight.position.set(0, 4, -2)
    scene.add(cyanLight)

    // 1. Central AI Core Orb (Icosahedron + Wireframe glow)
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 2)
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x081026,
      emissive: new THREE.Color(accent500),
      emissiveIntensity: 0.65,
      metalness: 0.8,
      roughness: 0.15,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      flatShading: true,
    })
    const coreMesh = new THREE.Mesh(coreGeo, coreMat)
    scene.add(coreMesh)

    const wireGeo = new THREE.IcosahedronGeometry(1.26, 2)
    const wireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accent400),
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    })
    const wireMesh = new THREE.Mesh(wireGeo, wireMat)
    scene.add(wireMesh)

    // 2. Multi-orbital rings (representing Planning & Scheduling loops)
    const rings: THREE.Mesh[] = []
    const ringColors = [accent500, '#8b5cf6', '#06b6d4']
    ringColors.forEach((color, idx) => {
      const ringGeo = new THREE.TorusGeometry(1.8 + idx * 0.45, 0.012, 12, 100)
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.35 - idx * 0.05,
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = Math.PI / 2 + idx * 0.4
      ringMesh.rotation.y = idx * 0.35
      scene.add(ringMesh)
      rings.push(ringMesh)
    })

    // 3. Floating 3D Academic "Task & Subject Cards"
    // Distinct rectangular rounded boxes floating gracefully in 3D space
    const cards: THREE.Group[] = []
    const cardDefs = [
      { pos: [-3.4, 1.4, -0.5], color: accent500, rotZ: 0.08, label: 'Data Structures' },
      { pos: [3.3, 1.8, -1.0], color: '#8b5cf6', rotZ: -0.1, label: 'Calculus III' },
      { pos: [-2.8, -1.6, 0.5], color: '#10b981', rotZ: -0.06, label: 'Algorithms' },
      { pos: [2.9, -1.8, -0.2], color: '#f59e0b', rotZ: 0.12, label: 'Database Systems' },
    ]

    const cardBoxGeo = new THREE.BoxGeometry(1.4, 0.85, 0.05)
    const edgeGeo = new THREE.EdgesGeometry(cardBoxGeo)
    const barGeo = new THREE.BoxGeometry(0.9, 0.06, 0.06)

    cardDefs.forEach((def, i) => {
      const cardGroup = new THREE.Group()
      cardGroup.position.set(def.pos[0], def.pos[1], def.pos[2])
      cardGroup.rotation.z = def.rotZ

      const cardMat = new THREE.MeshPhysicalMaterial({
        color: 0x0b1329,
        emissive: new THREE.Color(def.color),
        emissiveIntensity: 0.25,
        roughness: 0.2,
        metalness: 0.6,
        transparent: true,
        opacity: 0.85,
      })
      const cardMesh = new THREE.Mesh(cardBoxGeo, cardMat)
      cardGroup.add(cardMesh)

      // Glowing border frame
      const edgeMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(def.color),
        transparent: true,
        opacity: 0.6,
      })
      const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat)
      cardGroup.add(edgeLine)

      // Inner progress bar representation
      const barMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(def.color) })
      const barMesh = new THREE.Mesh(barGeo, barMat)
      barMesh.position.set(-0.1, -0.2, 0.04)
      cardGroup.add(barMesh)

      cardGroup.userData = {
        baseY: def.pos[1],
        speed: 0.7 + i * 0.2,
        rotSpeed: 0.15 + i * 0.05,
        phase: i * 1.5,
      }

      scene.add(cardGroup)
      cards.push(cardGroup)
    })

    // 4. Connected Roadmap Nodes Line
    const nodePositions = [
      new THREE.Vector3(-4.5, -2.5, -2),
      new THREE.Vector3(-2.2, -0.5, -1),
      new THREE.Vector3(0, 1.2, 0),
      new THREE.Vector3(2.5, -0.2, -1),
      new THREE.Vector3(4.8, 1.5, -2.5),
    ]

    const curve = new THREE.CatmullRomCurve3(nodePositions)
    const points = curve.getPoints(60)
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
    const lineMat = new THREE.LineDashedMaterial({
      color: new THREE.Color(accent400),
      dashSize: 0.3,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.45,
    })
    const roadmapLine = new THREE.Line(lineGeo, lineMat)
    roadmapLine.computeLineDistances()
    scene.add(roadmapLine)

    // Add glowing spheres at each node
    const nodeSphereGeo = new THREE.SphereGeometry(0.12, 16, 16)
    nodePositions.forEach((pos, idx) => {
      const nodeMat = new THREE.MeshStandardMaterial({
        color: idx === 2 ? 0xffffff : new THREE.Color(accent500),
        emissive: new THREE.Color(accent500),
        emissiveIntensity: 0.8,
        metalness: 0.4,
        roughness: 0.2,
      })
      const nodeSphere = new THREE.Mesh(nodeSphereGeo, nodeMat)
      nodeSphere.position.copy(pos)
      scene.add(nodeSphere)
    })

    // 5. Constellation Ambient Particle Field
    const particleCount = 280
    const particlePositions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 22
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 14
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color(accent300),
      size: 0.028,
      transparent: true,
      opacity: 0.45,
    })
    const particleField = new THREE.Points(particleGeo, particleMat)
    scene.add(particleField)

    // Pointer Interaction
    const handlePointerMove = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect()
      mouseTarget.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseTarget.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    }

    const handlePointerLeave = () => {
      mouseTarget.current.x = 0
      mouseTarget.current.y = 0
    }

    if (!reduceMotion) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerleave', handlePointerLeave)
    }

    // Animation Loop
    let animationFrameId: number
    const clock = new THREE.Clock()

    const animate = () => {
      const elapsed = clock.getElapsedTime()

      // Smooth mouse damping
      mouseCurrent.current.x += (mouseTarget.current.x - mouseCurrent.current.x) * 0.05
      mouseCurrent.current.y += (mouseTarget.current.y - mouseCurrent.current.y) * 0.05
      const mx = mouseCurrent.current.x
      const my = mouseCurrent.current.y

      // Core rotation
      coreMesh.rotation.y = elapsed * 0.15 + mx * 0.35
      coreMesh.rotation.x = Math.sin(elapsed * 0.2) * 0.1 + my * 0.25
      wireMesh.rotation.y = coreMesh.rotation.y
      wireMesh.rotation.x = coreMesh.rotation.x

      // Core subtle breathing pulse
      const pulse = 1 + Math.sin(elapsed * 1.5) * 0.03
      coreMesh.scale.set(pulse, pulse, pulse)

      // Ring rotations
      rings.forEach((ring, idx) => {
        ring.rotation.z = elapsed * (0.1 + idx * 0.06) * (idx % 2 === 0 ? 1 : -1)
      })

      // Floating Cards bobbing and gentle rotation
      cards.forEach((card) => {
        const d = card.userData
        card.position.y = d.baseY + Math.sin(elapsed * d.speed + d.phase) * 0.18
        card.rotation.x = Math.sin(elapsed * 0.5 + d.phase) * 0.08 + my * 0.15
        card.rotation.y = Math.cos(elapsed * 0.5 + d.phase) * 0.08 + mx * 0.2
      })

      // Particles slow drift
      particleField.rotation.y = elapsed * 0.02 + mx * 0.05

      // Camera parallax
      camera.position.x = mx * 0.9
      camera.position.y = 0.5 + my * 0.6
      camera.lookAt(0, 0.2, 0)

      renderer.render(scene, camera)
      if (!reduceMotion) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    if (reduceMotion) {
      renderer.render(scene, camera)
    } else {
      animate()
    }

    // Resize Handler
    const handleResize = () => {
      if (!mount) return
      width = mount.clientWidth
      height = mount.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      if (!reduceMotion) {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerleave', handlePointerLeave)
      }
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }

      // Clean disposal
      coreGeo.dispose()
      coreMat.dispose()
      wireGeo.dispose()
      wireMat.dispose()
      cardBoxGeo.dispose()
      edgeGeo.dispose()
      lineGeo.dispose()
      lineMat.dispose()
      nodeSphereGeo.dispose()
      particleGeo.dispose()
      particleMat.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  )
}
