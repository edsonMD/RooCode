import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import useStore from '../store/useStore'

// Chromatic Aberration Shader
const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.0015 },
    angle: { value: 0.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform float angle;
    varying vec2 vUv;

    void main() {
      vec2 offset = amount * vec2(cos(angle), sin(angle));
      vec4 cr = texture2D(tDiffuse, vUv + offset);
      vec4 cga = texture2D(tDiffuse, vUv);
      vec4 cb = texture2D(tDiffuse, vUv - offset);
      gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
    }
  `
}

export default function Background3D() {
  const containerRef = useRef(null)
  const theme = useStore((s) => s.theme)

  useEffect(() => {
    if (!containerRef.current) return

    // Colors based on theme
    const bgDark = new THREE.Color(0x050508)
    const bgLight = new THREE.Color(0xf1f5f9)
    const bgColor = theme === 'dark' ? bgDark : bgLight
    
    // Core accent colors
    const colorPrimary = new THREE.Color(theme === 'dark' ? 0x2dd4bf : 0x0f766e) // Teal/Cyan
    const colorSecondary = new THREE.Color(theme === 'dark' ? 0x8b5cf6 : 0x4f46e5) // Violet/Indigo

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = bgColor
    
    // Smooth cinematic fog
    scene.fog = new THREE.FogExp2(bgColor, 0.04)

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 10
    
    const renderer = new THREE.WebGLRenderer({ 
      alpha: false, // Solid background for better post-processing
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: true
    })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    // Cap pixel ratio to 2 for performance, 1 on mobile if needed
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // Cinematic tonemapping
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    
    containerRef.current.appendChild(renderer.domElement)

    // --- POST PROCESSING ---
    const composer = new EffectComposer(renderer)
    
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    // Bloom (Neon Glow)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,  // strength
      0.4,  // radius
      0.85  // threshold
    )
    // Dynamic bloom based on theme
    bloomPass.strength = theme === 'dark' ? 1.5 : 0.4
    bloomPass.threshold = theme === 'dark' ? 0.2 : 0.5
    composer.addPass(bloomPass)

    // Chromatic Aberration
    const caPass = new ShaderPass(ChromaticAberrationShader)
    composer.addPass(caPass)


    // --- LIGHTING SYSTEM (Cinematic 3-Point) ---
    const ambientLight = new THREE.AmbientLight(
      theme === 'dark' ? 0x1e1b4b : 0xffffff,
      theme === 'dark' ? 0.8 : 0.6
    )
    scene.add(ambientLight)

    // Key Light (Warm/Primary)
    const keyLight = new THREE.DirectionalLight(colorPrimary, theme === 'dark' ? 4 : 2)
    keyLight.position.set(5, 5, 5)
    scene.add(keyLight)

    // Fill Light (Cool/Secondary)
    const fillLight = new THREE.DirectionalLight(colorSecondary, theme === 'dark' ? 3 : 1.5)
    fillLight.position.set(-5, -2, 5)
    scene.add(fillLight)

    // Rim Light (Backlight for separation)
    const rimLight = new THREE.SpotLight(0xffffff, 4)
    rimLight.position.set(0, 5, -8)
    rimLight.angle = Math.PI / 4
    rimLight.penumbra = 0.5
    scene.add(rimLight)


    // --- HERO OBJECT (Organic Shape with Subsurface/Fresnel feel) ---
    // Using a TorusKnot to show off PBR and reflections better
    const geometry = new THREE.TorusKnotGeometry(2.5, 0.8, 256, 64)
    
    // Premium PBR Material
    const material = new THREE.MeshPhysicalMaterial({
      color: theme === 'dark' ? 0x050508 : 0xffffff,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: 0.9, // Glass-like subsurface scattering feel
      thickness: 2.5,
      ior: 1.5,
      emissive: colorPrimary,
      emissiveIntensity: theme === 'dark' ? 0.2 : 0.05,
      transparent: true,
      opacity: 1
    })
    
    const heroMesh = new THREE.Mesh(geometry, material)
    scene.add(heroMesh)

    // Floating secondary geometries
    const floatingGeometries = []
    const floatingCount = 5
    for(let i=0; i<floatingCount; i++) {
        const geo = new THREE.IcosahedronGeometry(0.3 + Math.random() * 0.5, 1)
        const mat = new THREE.MeshPhysicalMaterial({
            color: colorSecondary,
            metalness: 0.9,
            roughness: 0.1,
            emissive: colorSecondary,
            emissiveIntensity: 0.5
        })
        const mesh = new THREE.Mesh(geo, mat)
        
        // Random starting positions
        mesh.position.set(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 5 - 2
        )
        
        // Custom data for animation
        mesh.userData = {
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            phase: Math.random() * Math.PI * 2
        }
        
        scene.add(mesh)
        floatingGeometries.push(mesh)
    }


    // --- GPU INSTANCED PARTICLES ---
    const particlesCount = 1500
    const particlesGeometry = new THREE.BufferGeometry()
    
    const posArray = new Float32Array(particlesCount * 3)
    const scaleArray = new Float32Array(particlesCount)
    const phaseArray = new Float32Array(particlesCount)

    for(let i = 0; i < particlesCount; i++) {
        // Fill a large volume
        posArray[i * 3] = (Math.random() - 0.5) * 30
        posArray[i * 3 + 1] = (Math.random() - 0.5) * 30
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 20

        scaleArray[i] = Math.random()
        phaseArray[i] = Math.random() * Math.PI * 2
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    particlesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))
    particlesGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phaseArray, 1))

    const particleShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: colorPrimary },
        uMouseX: { value: 0 },
        uMouseY: { value: 0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uMouseX;
        uniform float uMouseY;
        attribute float aScale;
        attribute float aPhase;
        varying float vAlpha;
        
        // Simplex noise function placeholder (using sin/cos combo for performance)
        float noise(vec3 p) {
            return sin(p.x) * cos(p.y) * sin(p.z);
        }

        void main() {
          vec3 pos = position;
          
          // Complex organic fluid movement
          float time = uTime * 0.2;
          pos.x += sin(time + pos.y * 0.5 + aPhase) * 1.5;
          pos.y += cos(time + pos.x * 0.5 + aPhase) * 1.5;
          pos.z += sin(time + pos.z * 0.5 + aPhase) * 1.5;
          
          // Force field interaction with mouse
          vec3 mousePos = vec3(uMouseX * 15.0, uMouseY * 15.0, 0.0);
          float dist = distance(pos.xy, mousePos.xy);
          if (dist < 6.0) {
            vec2 dir = normalize(pos.xy - mousePos.xy);
            pos.xy += dir * smoothstep(6.0, 0.0, dist) * 2.0;
          }
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          // Perspective scale
          gl_PointSize = (20.0 * aScale) * (1.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          
          // Depth fading
          vAlpha = smoothstep(-20.0, 5.0, pos.z) * 0.6 * (0.4 + 0.6 * sin(uTime * 2.0 + aPhase));
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Glowing soft edge
          float alpha = (1.0 - smoothstep(0.1, 0.5, dist)) * vAlpha;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    
    const particlesMesh = new THREE.Points(particlesGeometry, particleShaderMaterial)
    scene.add(particlesMesh)


    // --- INTERACTION & PHYSICS ---
    let targetMouseX = 0
    let targetMouseY = 0
    let mouseX = 0
    let mouseY = 0

    const onDocumentMouseMove = (event) => {
        // Easing interpolation values target
        targetMouseX = (event.clientX / window.innerWidth) * 2 - 1
        targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1
    }
    
    // Add touch support for mobile fluidity
    const onDocumentTouchMove = (event) => {
        if(event.touches.length > 0) {
            targetMouseX = (event.touches[0].clientX / window.innerWidth) * 2 - 1
            targetMouseY = -(event.touches[0].clientY / window.innerHeight) * 2 + 1
        }
    }

    document.addEventListener('mousemove', onDocumentMouseMove, { passive: true })
    document.addEventListener('touchmove', onDocumentTouchMove, { passive: true })

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock()
    let prevTime = 0

    const animate = () => {
      requestAnimationFrame(animate)

      const time = clock.getElapsedTime()
      const delta = time - prevTime
      prevTime = time

      // Spring physics easing for mouse (slower damping for cinematic feel)
      mouseX += (targetMouseX - mouseX) * 0.03
      mouseY += (targetMouseY - mouseY) * 0.03

      // Update shaders
      particleShaderMaterial.uniforms.uTime.value = time
      particleShaderMaterial.uniforms.uMouseX.value = mouseX
      particleShaderMaterial.uniforms.uMouseY.value = mouseY
      
      // Dynamic Chromatic Aberration based on mouse movement speed
      const mouseSpeed = Math.abs(targetMouseX - mouseX) + Math.abs(targetMouseY - mouseY)
      caPass.uniforms.amount.value = THREE.MathUtils.lerp(
          caPass.uniforms.amount.value, 
          0.0015 + mouseSpeed * 0.01, 
          0.1
      )

      // Dynamic Bloom pulse
      bloomPass.strength = (theme === 'dark' ? 1.5 : 0.4) + Math.sin(time * 0.5) * 0.3

      // Hero: multi-axis rotation + figure-8 sway
      heroMesh.rotation.x = Math.sin(time * 0.3) * 0.8 + mouseY * 0.6
      heroMesh.rotation.y = Math.cos(time * 0.25) * 0.6 + mouseX * 0.6
      heroMesh.rotation.z = Math.sin(time * 0.15) * 0.4
      
      // Breathing scale
      const breathe = 1 + Math.sin(time * 0.8) * 0.07
      heroMesh.scale.setScalar(breathe)
      
      // Position float
      heroMesh.position.y = Math.sin(time * 0.4) * 0.5
      heroMesh.position.x = Math.cos(time * 0.3) * 0.3

      // Floating geometries: orbital motion
      floatingGeometries.forEach((mesh, idx) => {
          const phase = mesh.userData.phase
          const speed = 0.35 + idx * 0.15
          mesh.position.x = Math.sin(time * speed + phase) * (6 + idx * 1.5)
          mesh.position.y = Math.cos(time * (speed * 0.7) + phase) * (4 + idx * 0.8)
          mesh.position.z = Math.sin(time * (speed * 1.3) + phase) * 3
          mesh.rotation.x += delta * (0.4 + Math.sin(time + phase) * 0.4)
          mesh.rotation.y += delta * (0.25 + Math.cos(time + phase) * 0.25)
          const s = 1 + Math.sin(time * 3 + phase * 2) * 0.15
          mesh.scale.setScalar(s)
      })

      // Inertia Camera Parallax
      camera.position.x += (mouseX * 2 - camera.position.x) * 0.04
      camera.position.y += (mouseY * 2 - camera.position.y) * 0.04
      camera.position.z = 10 + Math.sin(time * 0.2) * 1.5
      camera.lookAt(scene.position)

      // Render via Composer, not standard renderer
      composer.render(delta)
    }

    animate()

    // --- RESIZE HANDLER ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      composer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // --- CLEANUP ---
    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('mousemove', onDocumentMouseMove)
      document.removeEventListener('touchmove', onDocumentTouchMove)
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      
      geometry.dispose()
      material.dispose()
      particlesGeometry.dispose()
      particleShaderMaterial.dispose()
      floatingGeometries.forEach(mesh => {
          mesh.geometry.dispose()
          mesh.material.dispose()
      })
      composer.dispose()
      renderer.dispose()
    }
  }, [theme])

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none -z-10 transition-opacity duration-1000"
      style={{ opacity: 1 }}
    />
  )
}
