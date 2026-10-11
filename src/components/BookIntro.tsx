import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Volume2, VolumeX, FastForward, BookOpen, Sparkles } from 'lucide-react';
import { LiquidChromeLogo } from './LiquidChromeLogo';

interface BookIntroProps {
  onComplete: () => void;
  brandTitle?: string;
  brandSub?: string;
}

export const BookIntro: React.FC<BookIntroProps> = ({
  onComplete,
  brandTitle = "EXAMCRAFT CBSE",
  brandSub = "TEST GENERATOR 2026"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  
  const [isInteractive, setIsInteractive] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [videoUrl, setVideoUrl] = useState<string | null>('/book_intro.mp4');
  const [useVideoMode, setUseVideoMode] = useState<boolean>(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load custom video from IndexedDB on mount if available
  useEffect(() => {
    loadVideoBlobFromIDB().then((storedUrl) => {
      if (storedUrl) {
        setVideoUrl(storedUrl);
      }
    });
  }, []);

  // References for cleanup
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameId = useRef<number | null>(null);
  const gsapTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const bookGroupRef = useRef<THREE.Group | null>(null);
  const frontCoverPivotRef = useRef<THREE.Group | null>(null);
  const pagePivotsRef = useRef<THREE.Group[]>([]);
  const popButtonsRef = useRef<THREE.Mesh[]>([]);
  const particleMatRef = useRef<THREE.PointsMaterial | null>(null);
  const magicGroupRef = useRef<THREE.Group | null>(null);
  const electronMeshesRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    // Check prefers-reduced-motion accessibility preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      triggerWebsiteRevealDirectly();
      return;
    }

    // Lock document scroll while intro is playing
    document.body.style.overflow = 'hidden';

    if (!containerRef.current || !canvasRef.current) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // Check WebGL availability safely
    const canvas = canvasRef.current;
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      gl = (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | WebGL2RenderingContext | null;
    } catch {
      gl = null;
    }

    if (!gl) {
      console.warn('WebGL context unavailable, bypassing 3D intro.');
      triggerWebsiteRevealDirectly();
      return;
    }

    // WebGL Renderer creation
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: gl,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (err) {
      console.warn('WebGL Renderer failed, bypassing 3D intro:', err);
      triggerWebsiteRevealDirectly();
      return;
    }

    if (!renderer || !renderer.capabilities) {
      triggerWebsiteRevealDirectly();
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 7.5);
    camera.lookAt(0, 0, 0);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 3.2);
    dirLight.position.set(5, 12, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.8);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    // Spotlight beam shining from above onto the table (matching video lighting)
    const spotLight = new THREE.SpotLight(0xfef08a, 4.5, 20, Math.PI / 4, 0.5, 1);
    spotLight.position.set(0, 10, 2);
    spotLight.target.position.set(0, -1, 0);
    spotLight.castShadow = true;
    scene.add(spotLight);
    scene.add(spotLight.target);

    // Rustic Dark Wooden Table Surface (matching video background table)
    const tableTex = createWoodTableTexture();
    const tableGeo = new THREE.BoxGeometry(18, 0.4, 12);
    const tableMat = new THREE.MeshStandardMaterial({
      map: tableTex,
      roughness: 0.55,
      metalness: 0.1
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.position.set(0, -1.3, 0);
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);

    // Create Procedural Textures
    const coverTexture = createCoverTexture(brandTitle, brandSub);
    const innerPageLeftTexture = createLeftPageTexture();
    const innerPageRightTexture = createRightPageTexture();

    // Materials - Ancient Leather Tome Finish
    const coverMat = new THREE.MeshStandardMaterial({
      map: coverTexture,
      roughness: 0.4,
      metalness: 0.15
    });

    const spineMat = new THREE.MeshStandardMaterial({
      color: 0x221108,
      roughness: 0.45,
      metalness: 0.25
    });

    const pageEdgeTexture = createPageEdgeTexture();
    const pageEdgeMat = new THREE.MeshStandardMaterial({
      map: pageEdgeTexture,
      roughness: 0.88,
      metalness: 0.05
    });

    const innerPageLeftMat = new THREE.MeshStandardMaterial({
      map: innerPageLeftTexture,
      roughness: 0.7
    });

    const innerPageRightMat = new THREE.MeshStandardMaterial({
      map: innerPageRightTexture,
      roughness: 0.7
    });

    // Warm Golden Magical Spellbook Light (Shines onto open pages)
    const bookMagicLight = new THREE.PointLight(0xfbbf24, 0, 8);
    bookMagicLight.position.set(0, 0.5, 0.5);
    scene.add(bookMagicLight);

    // Glowing Magical Embers & Sparks Particle System (Rising floating magic sparks from open tome like screenshot)
    const particleCount = 350;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      particlePositions[p * 3] = (Math.random() - 0.5) * 4.2;     // X spread across open pages
      particlePositions[p * 3 + 1] = Math.random() * 3.2 - 0.2;   // Y height above book
      particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 3.0; // Z depth

      particleSpeeds[p * 3] = (Math.random() - 0.5) * 0.008;
      particleSpeeds[p * 3 + 1] = 0.010 + Math.random() * 0.018; // Upward rising flames/embers
      particleSpeeds[p * 3 + 2] = (Math.random() - 0.5) * 0.008;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Canvas particle texture for smooth round glowing ember sparks
    const emberCanvas = document.createElement('canvas');
    emberCanvas.width = 64;
    emberCanvas.height = 64;
    const eCtx = emberCanvas.getContext('2d')!;
    const eGrad = eCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    eGrad.addColorStop(0, 'rgba(255, 235, 170, 1)');
    eGrad.addColorStop(0.3, 'rgba(251, 191, 36, 0.9)');
    eGrad.addColorStop(0.7, 'rgba(217, 119, 6, 0.4)');
    eGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    eCtx.fillStyle = eGrad;
    eCtx.fillRect(0, 0, 64, 64);

    const emberTex = new THREE.CanvasTexture(emberCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      map: emberTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0 // Hidden until book opens
    });
    particleMatRef.current = particleMat;

    const magicEmbers = new THREE.Points(particleGeo, particleMat);
    magicEmbers.position.set(0, 0.2, 0);
    scene.add(magicEmbers);

    // -------------------------------------------------------------
    // HOLOGRAM & MAGIC SCIENCE ELEMENTS GROUP (Matching Video Scene)
    // -------------------------------------------------------------
    const magicGroup = new THREE.Group();
    magicGroup.position.set(0, 0.8, 0);
    magicGroup.scale.set(0, 0, 0); // Spawns when book opens flat
    scene.add(magicGroup);
    magicGroupRef.current = magicGroup;

    // 1. 3D Glass Prism with Light Refraction Spectrum Beam
    const prismGroup = new THREE.Group();
    prismGroup.position.set(-1.1, 1.3, 0.4);
    prismGroup.rotation.set(0.3, 0.5, -0.2);

    const prismGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.0, 3);
    const prismMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.52,
      thickness: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    const prismMesh = new THREE.Mesh(prismGeo, prismMat);
    prismGroup.add(prismMesh);

    // Incoming White Light Ray
    const rayGeo = new THREE.CylinderGeometry(0.015, 0.03, 1.8);
    rayGeo.rotateZ(Math.PI / 2);
    const rayMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
    const rayMesh = new THREE.Mesh(rayGeo, rayMat);
    rayMesh.position.set(-1.1, 0, 0);
    prismGroup.add(rayMesh);

    // Outgoing Rainbow Spectrum Beam Fan
    const spectrumTex = createRainbowSpectrumTexture();
    const spectrumGeo = new THREE.PlaneGeometry(2.0, 1.2);
    const spectrumMat = new THREE.MeshBasicMaterial({
      map: spectrumTex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const spectrumMesh = new THREE.Mesh(spectrumGeo, spectrumMat);
    spectrumMesh.position.set(1.1, 0, 0);
    spectrumMesh.rotation.y = 0.2;
    prismGroup.add(spectrumMesh);

    magicGroup.add(prismGroup);

    // 2. 3D Atomic Structure Model
    const atomGroup = new THREE.Group();
    atomGroup.position.set(1.2, 1.4, 0.3);

    // Glowing Central Nucleus
    const nucleusGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    atomGroup.add(nucleusMesh);

    // 3 Tilted Electron Orbit Rings
    const orbitAngles = [
      { rx: 0.2, ry: 0, rz: 0.3 },
      { rx: 1.1, ry: 0.4, rz: -0.5 },
      { rx: -0.9, ry: 0.8, rz: 0.8 }
    ];
    const electronMeshes: THREE.Mesh[] = [];

    orbitAngles.forEach((ang) => {
      const ringGroup = new THREE.Group();
      ringGroup.rotation.set(ang.rx, ang.ry, ang.rz);

      const ringGeo = new THREE.TorusGeometry(0.7, 0.012, 12, 48);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringGroup.add(ringMesh);

      // Glowing Electron Sphere
      const elecGeo = new THREE.SphereGeometry(0.05, 12, 12);
      const elecMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
      const elecMesh = new THREE.Mesh(elecGeo, elecMat);
      ringGroup.add(elecMesh);
      electronMeshes.push(elecMesh);

      atomGroup.add(ringGroup);
    });
    electronMeshesRef.current = electronMeshes;

    magicGroup.add(atomGroup);

    // 3. Floating 3D Scientific & Mathematical Formulas
    const formulasData = [
      { text: "E = mc²", sub: "Mass-Energy Equivalence", x: -0.9, y: 2.2, z: -0.2, rotY: 0.2 },
      { text: "sin²θ + cos²θ = 1", sub: "Trigonometry Identity", x: 1.0, y: 2.3, z: -0.1, rotY: -0.25 },
      { text: "a² + b² = c²", sub: "Pythagorean Theorem", x: -1.3, y: 0.6, z: 0.6, rotY: 0.35 },
      { text: "H = - (ℏ²/2m)∇²", sub: "Schrödinger Equation", x: 1.2, y: 0.6, z: 0.5, rotY: -0.3 },
      { text: "⚡ R₁ + R₂ = R_eq", sub: "Physics Circuit Schema", x: 0.0, y: 2.6, z: -0.6, rotY: 0 }
    ];

    formulasData.forEach((f) => {
      const tex = createFormulaTexture(f.text, f.sub);
      const geo = new THREE.PlaneGeometry(1.6, 0.8);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(f.x, f.y, f.z);
      mesh.rotation.y = f.rotY;
      magicGroup.add(mesh);
    });

    // 4. Swirling Golden Energy Vortex Ribbons
    const ribbonGeo = new THREE.TorusGeometry(1.2, 0.02, 12, 64);
    const ribbonMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const ribbonMesh1 = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonMesh1.rotation.x = Math.PI / 2.2;
    ribbonMesh1.position.set(0, 1.2, 0);
    magicGroup.add(ribbonMesh1);

    const ribbonMesh2 = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonMesh2.rotation.x = -Math.PI / 2.5;
    ribbonMesh2.position.set(0, 1.8, 0);
    magicGroup.add(ribbonMesh2);

    // 5. ExamCraft Glowing Logo Burst Emblem
    const logoBurstTex = createExamCraftBurstTexture();
    const logoBurstGeo = new THREE.PlaneGeometry(3.2, 1.2);
    const logoBurstMat = new THREE.MeshBasicMaterial({
      map: logoBurstTex,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const logoBurstMesh = new THREE.Mesh(logoBurstGeo, logoBurstMat);
    logoBurstMesh.position.set(0, 3.1, 0.1);
    magicGroup.add(logoBurstMesh);

    // 3D Hardcover Book Geometry
    const bookWidth = 3.2;
    const bookHeight = 4.4;
    const bookThickness = 0.55;
    const coverThickness = 0.08;
    const pageBlockWidth = bookWidth - 0.15;
    const pageBlockHeight = bookHeight - 0.2;
    const pageBlockThickness = bookThickness - (coverThickness * 2);

    const mainBookGroup = new THREE.Group();
    // Start position high above top of screen with dynamic pitch and spin for realistic drop
    mainBookGroup.position.set(0, 11, 0);
    mainBookGroup.rotation.set(0.75, -0.4, 0.28);
    scene.add(mainBookGroup);
    bookGroupRef.current = mainBookGroup;

    // A. Back Cover
    const backCoverGeo = new THREE.BoxGeometry(bookWidth, coverThickness, bookHeight);
    const backCoverMesh = new THREE.Mesh(backCoverGeo, coverMat);
    backCoverMesh.position.set(0, -pageBlockThickness / 2 - coverThickness / 2, 0);
    backCoverMesh.castShadow = true;
    backCoverMesh.receiveShadow = true;
    mainBookGroup.add(backCoverMesh);

    // B. Page Block (Main stack of paper)
    const pageBlockGeo = new THREE.BoxGeometry(pageBlockWidth, pageBlockThickness, pageBlockHeight);
    const pageBlockMesh = new THREE.Mesh(pageBlockGeo, [
      pageEdgeMat, // Right
      pageEdgeMat, // Left (spine side)
      pageEdgeMat, // Top
      pageEdgeMat, // Bottom
      innerPageRightMat, // Right page face
      innerPageLeftMat   // Left page face
    ]);
    pageBlockMesh.position.set(0.06, 0, 0);
    pageBlockMesh.castShadow = true;
    pageBlockMesh.receiveShadow = true;
    mainBookGroup.add(pageBlockMesh);

    // C. Book Spine (Spine Hinge Edge)
    const spineGeo = new THREE.CylinderGeometry(bookThickness / 2 + 0.02, bookThickness / 2 + 0.02, bookHeight, 16, 1, false, Math.PI / 2, Math.PI);
    const spineMesh = new THREE.Mesh(spineGeo, spineMat);
    spineMesh.rotation.z = Math.PI / 2;
    spineMesh.rotation.y = Math.PI / 2;
    spineMesh.position.set(-bookWidth / 2, 0, 0);
    spineMesh.castShadow = true;
    mainBookGroup.add(spineMesh);

    // D. Front Cover Hinge (Pivot set strictly at x = -bookWidth / 2)
    const frontCoverPivot = new THREE.Group();
    frontCoverPivot.position.set(-bookWidth / 2, pageBlockThickness / 2 + coverThickness / 2, 0);
    mainBookGroup.add(frontCoverPivot);
    frontCoverPivotRef.current = frontCoverPivot;

    const frontCoverMeshGeo = new THREE.BoxGeometry(bookWidth, coverThickness, bookHeight);
    // Offset geometry so left edge aligns exactly with pivot origin (0,0,0)
    frontCoverMeshGeo.translate(bookWidth / 2, 0, 0);

    const frontCoverMaterials = [
      coverMat, // Right
      spineMat, // Left
      coverMat, // Top
      coverMat, // Bottom
      coverMat, // Front Face (Top)
      innerPageLeftMat // Inner Cover Face (Bottom)
    ];

    const frontCoverMesh = new THREE.Mesh(frontCoverMeshGeo, frontCoverMaterials);
    frontCoverMesh.castShadow = true;
    frontCoverMesh.receiveShadow = true;
    frontCoverPivot.add(frontCoverMesh);

    // E. Turning Individual Pages (Multi-face texture mapped)
    const turningPages: THREE.Group[] = [];
    const numPages = 3;
    const pageThickness = 0.008;

    for (let i = 0; i < numPages; i++) {
      const pagePivot = new THREE.Group();
      pagePivot.position.set(-bookWidth / 2 + 0.08, pageBlockThickness / 2 + (i + 1) * 0.012, 0);
      mainBookGroup.add(pagePivot);

      const pageGeo = new THREE.BoxGeometry(pageBlockWidth - 0.05, pageThickness, pageBlockHeight - 0.05);
      pageGeo.translate((pageBlockWidth - 0.05) / 2, 0, 0);

      const frontTex = createTurningPageTexture(i, true);
      const backTex = createTurningPageTexture(i, false);

      const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.75 });
      const backMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.75 });

      const pageMaterials = [
        pageEdgeMat, // Right (+x)
        pageEdgeMat, // Left (-x)
        frontMat,    // Top (+y, Front page face)
        backMat,     // Bottom (-y, Back page face)
        pageEdgeMat, // Front (+z)
        pageEdgeMat  // Back (-z)
      ];

      const pageMesh = new THREE.Mesh(pageGeo, pageMaterials);
      pageMesh.castShadow = true;
      pageMesh.receiveShadow = true;
      pagePivot.add(pageMesh);
      turningPages.push(pagePivot);
    }
    pagePivotsRef.current = turningPages;

    // F. 3D Pop-out Buttons Group (Buttons emerging from opened book pages)
    const popButtonsGroup = new THREE.Group();
    mainBookGroup.add(popButtonsGroup);

    const popButtons: THREE.Mesh[] = [];

    const popBtnData = [
      { text: "✨ GENERATE QUESTION PAPER", icon: "", bg: ["#059669", "#047857"], stroke: "#34d399", posX: 0.75, posY: 0.85, w: 2.2, h: 0.45 },
      { text: "🔬 SCIENCE ASSESSMENTS", icon: "", bg: ["#0284c7", "#0369a1"], stroke: "#38bdf8", posX: -0.75, posY: 0.9, w: 2.0, h: 0.4 },
      { text: "📐 MATHEMATICS BLUEPRINT", icon: "", bg: ["#4338ca", "#3730a3"], stroke: "#818cf8", posX: -0.75, posY: 0.35, w: 2.0, h: 0.4 },
      { text: "⚡ QUICK BLUEPRINT", icon: "", bg: ["#0284c7", "#0f172a"], stroke: "#38bdf8", posX: 0.4, posY: 0.25, w: 1.5, h: 0.38 },
      { text: "📂 SAVED PAPERS VAULT", icon: "", bg: ["#6b21a8", "#3b0764"], stroke: "#c084fc", posX: 1.15, posY: -0.25, w: 1.5, h: 0.38 }
    ];

    popBtnData.forEach((btn) => {
      const tex = createPopButtonTexture(btn.text, btn.icon, btn.bg as [string, string], btn.stroke);
      const geo = new THREE.PlaneGeometry(btn.w, btn.h);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(btn.posX, btn.posY, 0.05);
      mesh.scale.set(0, 0, 0); // Initially hidden flat on paper
      mesh.visible = false;
      popButtonsGroup.add(mesh);
      popButtons.push(mesh);
    });
    popButtonsRef.current = popButtons;

    // Scale book proportionally for mobile / ultra-wide viewports
    const scaleFactor = Math.min(width / 620, 1.2);
    mainBookGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Entrance Fall Physics (GSAP Gravity Drop with Realistic Impact & Bounce)
    const entranceTl = gsap.timeline({
      onComplete: () => {
        setIsInteractive(true);
        // Floating gentle bobbing motion while waiting for user tap
        gsap.to(mainBookGroup.position, {
          y: -0.15,
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        gsap.to(mainBookGroup.rotation, {
          y: -0.05,
          duration: 3.0,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
    });
    gsapTimelineRef.current = entranceTl;

    // Gravity drop downwards
    entranceTl.to(mainBookGroup.position, {
      y: -0.2,
      duration: 1.55,
      ease: "bounce.out"
    });

    // Natural rotation alignment while falling
    entranceTl.to(mainBookGroup.rotation, {
      x: 0.38, // Tilted towards camera for perspective
      y: 0,
      z: 0,
      duration: 1.55,
      ease: "power2.out"
    }, 0);

    // Subtle impact squash for physical realism upon landing
    entranceTl.to(mainBookGroup.scale, {
      y: scaleFactor * 0.94,
      x: scaleFactor * 1.03,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power1.inOut"
    }, 1.4);

    // Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      if (!rendererRef.current || !sceneRef.current) return;
      const elapsedTime = clock.getElapsedTime();

      // Subtle light oscillation for metallic gold sheen
      dirLight.position.x = 5 + Math.sin(elapsedTime * 0.9) * 1.5;

      // Animate Floating Golden Particle Embers (Sparks rising upwards from book)
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let p = 0; p < particleCount; p++) {
        // Y rise
        positions[p * 3 + 1] += particleSpeeds[p * 3 + 1];
        // Organic horizontal drift
        positions[p * 3] += Math.sin(elapsedTime * 1.5 + p) * 0.002;
        positions[p * 3 + 2] += Math.cos(elapsedTime * 1.2 + p) * 0.002;

        // Reset particle to bottom when it floats too high
        if (positions[p * 3 + 1] > 2.8) {
          positions[p * 3 + 1] = -0.4;
          positions[p * 3] = (Math.random() - 0.5) * 3.0;
          positions[p * 3 + 2] = (Math.random() - 0.5) * 2.2;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Animate 3D Hologram Magic Group (Spins gently above book like in video)
      if (magicGroupRef.current) {
        magicGroupRef.current.rotation.y = elapsedTime * 0.22;
      }

      // Animate Electrons orbiting along atomic rings
      if (electronMeshesRef.current) {
        electronMeshesRef.current.forEach((elec, idx) => {
          const speed = elapsedTime * (2.5 + idx * 0.5);
          elec.position.x = Math.cos(speed) * 0.7;
          elec.position.y = Math.sin(speed) * 0.7;
        });
      }

      try {
        rendererRef.current.render(scene, camera);
      } catch (err) {
        console.warn("Render frame failed:", err);
      }
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      const newScale = Math.min(w / 620, 1.2);
      if (bookGroupRef.current) {
        bookGroupRef.current.scale.set(newScale, newScale, newScale);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanupThreeResources();
    };
  }, []);

  // Open Book Action triggered on click
  const handleOpenBook = () => {
    if (isOpened) return;
    setIsOpened(true);
    setIsInteractive(false);

    if (soundEnabled) {
      playBookFlipSound();
    }

    // Kill any active idle floating/bobbing tweens on the main book group
    if (bookGroupRef.current) {
      gsap.killTweensOf(bookGroupRef.current.position);
      gsap.killTweensOf(bookGroupRef.current.rotation);
    }

    const openTl = gsap.timeline({
      onComplete: () => {
        triggerWebsiteRevealSequence();
      }
    });

    if (bookGroupRef.current) {
      // Lock book rotation strictly to front view pitch (x: 0.72, y: 0, z: 0) without wobble
      openTl.to(bookGroupRef.current.rotation, {
        x: 0.72,
        y: 0,
        z: 0,
        duration: 2.0,
        ease: "power2.inOut"
      }, 0);

      openTl.to(bookGroupRef.current.position, {
        x: 0,
        y: -0.45,
        z: 1.1,
        duration: 2.0,
        ease: "power2.inOut"
      }, 0);
    }

    // Pure Spine Hinge Rotation for Front Cover (0 to ~171° around Z-axis)
    if (frontCoverPivotRef.current) {
      frontCoverPivotRef.current.rotation.set(0, 0, 0);

      openTl.to(frontCoverPivotRef.current.rotation, {
        z: Math.PI * 0.95,
        x: 0,
        y: 0,
        duration: 2.2,
        ease: "power2.inOut"
      }, 0.1);
    }

    // Fade in glowing magic particle sparks when book opens
    if (particleMatRef.current) {
      openTl.to(particleMatRef.current, {
        opacity: 0.85,
        duration: 1.4,
        ease: "power2.out"
      }, 0.3);
    }

    // Emergence of 3D Holographic Science & Math Formulas (Matching video)
    if (magicGroupRef.current) {
      openTl.to(magicGroupRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.8,
        ease: "back.out(1.7)"
      }, 0.4);
    }

    // Pure Sequential Spine Hinge Page Flipping (Slightly relaxed, smoother page turn rate)
    pagePivotsRef.current.forEach((pagePivot, idx) => {
      const startTime = 0.35 + idx * 0.24;
      pagePivot.rotation.set(0, 0, 0);

      // 1. Pure Z-axis Hinge Rotation around spine
      openTl.to(pagePivot.rotation, {
        z: Math.PI * (0.90 - idx * 0.04),
        x: 0,
        y: 0,
        duration: 1.9,
        ease: "power2.inOut"
      }, startTime);

      // 2. Smooth Leaf Inward/Outward Stack Offset
      const origY = pagePivot.position.y;
      openTl.to(pagePivot.position, {
        y: origY + 0.22 - idx * 0.02,
        duration: 0.95,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      }, startTime);
    });

    // 3D Pop-out Buttons Emergence (Buttons rise up off the printed pages into 3D space!)
    popButtonsRef.current.forEach((btnMesh, idx) => {
      btnMesh.visible = true;
      openTl.to(btnMesh.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 0.75,
        ease: "back.out(2.2)"
      }, 0.5 + idx * 0.08);

      openTl.to(btnMesh.position, {
        z: 0.65 + idx * 0.05,
        duration: 0.75,
        ease: "power2.out"
      }, 0.5 + idx * 0.08);

      // Floating hover motion after popping out
      gsap.to(btnMesh.position, {
        z: "+=0.08",
        duration: 1.5 + idx * 0.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.2 + idx * 0.1
      });
    });
  };

  const triggerWebsiteRevealSequence = () => {
    sessionStorage.setItem('examcraft_book_intro_seen', 'true');

    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        onComplete: () => {
          document.body.style.overflow = '';
          cleanupThreeResources();
          onComplete();
          animateWebsiteElementsIn();
        }
      });
    } else {
      document.body.style.overflow = '';
      onComplete();
      animateWebsiteElementsIn();
    }
  };

  const handleSkipIntro = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sessionStorage.setItem('examcraft_book_intro_seen', 'true');
    document.body.style.overflow = '';

    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        scale: 1.03,
        duration: 0.35,
        ease: "power2.out",
        onComplete: () => {
          cleanupThreeResources();
          onComplete();
          animateWebsiteElementsIn();
        }
      });
    } else {
      cleanupThreeResources();
      onComplete();
      animateWebsiteElementsIn();
    }
  };

  const triggerWebsiteRevealDirectly = () => {
    sessionStorage.setItem('examcraft_book_intro_seen', 'true');
    document.body.style.overflow = '';
    onComplete();
    setTimeout(() => {
      animateWebsiteElementsIn();
    }, 50);
  };

  const cleanupThreeResources = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (gsapTimelineRef.current) {
      gsapTimelineRef.current.kill();
    }
    if (popButtonsRef.current) {
      popButtonsRef.current.forEach(mesh => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      popButtonsRef.current = [];
    }
    if (rendererRef.current) {
      try {
        rendererRef.current.dispose();
      } catch (err) {
        console.warn("Error disposing renderer:", err);
      }
      rendererRef.current = null;
    }
    if (sceneRef.current) {
      try {
        sceneRef.current.clear();
      } catch (err) {
        console.warn("Error clearing scene:", err);
      }
      sceneRef.current = null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 select-none touch-none overflow-hidden transition-opacity"
    >
      {/* Video Background Mode or 3D Canvas Fallback */}
      {useVideoMode && videoUrl ? (
        <div 
          onClick={handleOpenBook}
          className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 select-none"
        >
          {/* Ambient Video Blur Backdrop */}
          <video
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 pointer-events-none"
          />

          {/* Central Frame Wrapper - tight vertical fitting */}
          <div className="relative z-20 flex flex-col items-center justify-center max-w-6xl w-full sm:w-[98vw] gap-1 my-auto">
            
            {/* 135% Scaled Video Container (Transparent) */}
            <div className="relative w-full flex items-center justify-center overflow-hidden bg-transparent border-none shadow-none p-0">
              <video
                ref={videoRef}
                src={videoUrl}
                autoPlay
                muted={!soundEnabled}
                playsInline
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onEnded={handleOpenBook}
                className="w-full max-h-[74vh] sm:max-h-[78vh] object-contain scale-[1.35] transform transition-transform duration-300"
                onError={() => {
                  console.warn("Video source unavailable, switching to 3D Canvas Mode.");
                  setUseVideoMode(false);
                }}
              />
            </div>

          </div>
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            onClick={handleOpenBook}
            className="w-full h-full absolute inset-0 cursor-pointer"
          />

          {/* Liquid Chrome Title Banner for 3D mode */}
          <div className="absolute top-5 left-4 sm:top-6 sm:left-6 z-30 pointer-events-none flex flex-col items-start bg-transparent p-0 border-none shadow-none">
            <LiquidChromeLogo text="EXAMCRAFT" subText="CBSE Test Generator" fontSize={26} />
          </div>

          {/* Floating Call To Action for 3D mode (Transparent) */}
          {!isOpened && (
            <div
              ref={promptRef}
              onClick={handleOpenBook}
              className="absolute bottom-8 sm:bottom-12 z-30 flex flex-col items-center gap-2 cursor-pointer animate-bounce pointer-events-auto bg-transparent"
            >
              <div className="px-3 py-1 bg-transparent text-emerald-400 font-extrabold text-xs sm:text-sm tracking-widest flex items-center gap-2 drop-shadow-[0_2px_12px_rgba(16,185,129,0.9)]">
                <BookOpen className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>CLICK TO ENTER EXAMCRAFT</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <span className="text-[11px] text-slate-200 font-bold tracking-wider bg-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                Tap anywhere to reveal website
              </span>
            </div>
          )}
        </>
      )}

      {/* Opening state */}
      {isOpened && (
        <div className="absolute bottom-10 z-30 text-emerald-400 font-mono text-xs tracking-widest uppercase animate-pulse flex items-center gap-2 bg-slate-900/90 px-4 py-2 rounded-full border border-emerald-500/30">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Opening CBSE Blueprint & Revealing Website...</span>
        </div>
      )}
    </div>
  );
};

// Canvas texture generation functions
function createCoverTexture(title: string, sub: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d')!;

  // Aged Ancient Mahogany Leather Background with Deep Burnished Edges
  const grad = ctx.createRadialGradient(512, 700, 80, 512, 700, 950);
  grad.addColorStop(0, '#4a2211');
  grad.addColorStop(0.4, '#2d1308');
  grad.addColorStop(0.75, '#190a03');
  grad.addColorStop(1, '#080301');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1400);

  // Leather Grain & Antiqued Cracks Texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  for (let i = 0; i < 50000; i++) {
    ctx.fillRect(Math.random() * 1024, Math.random() * 1400, 1.5, 1.5);
  }
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1;
  for (let c = 0; c < 35; c++) {
    const cx = Math.random() * 1024;
    const cy = Math.random() * 1400;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (Math.random() - 0.5) * 140, cy + (Math.random() - 0.5) * 140);
    ctx.stroke();
  }

  // Outer Gilded Filigree Border & Bevels
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 22;
  ctx.strokeRect(40, 40, 1024 - 80, 1400 - 80);

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 8;
  ctx.strokeRect(58, 58, 1024 - 116, 1400 - 116);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(76, 76, 1024 - 152, 1400 - 152);

  // Ornate Brass Filigree Corners
  const corners = [
    { x: 78, y: 78, dx: 1, dy: 1 },
    { x: 946, y: 78, dx: -1, dy: 1 },
    { x: 78, y: 1322, dx: 1, dy: -1 },
    { x: 946, y: 1322, dx: -1, dy: -1 }
  ];

  corners.forEach(c => {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + c.dx * 125, c.y);
    ctx.lineTo(c.x + c.dx * 80, c.y + c.dy * 35);
    ctx.lineTo(c.x + c.dx * 35, c.y + c.dy * 80);
    ctx.lineTo(c.x, c.y + c.dy * 125);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(c.x + c.dx * 50, c.y + c.dy * 50, 9, 0, Math.PI * 2);
    ctx.fill();
  });

  // Central Celestial Mystical Emblem / Astrolabe Seal
  ctx.save();
  ctx.translate(512, 420);

  // Outer Runes Ring
  ctx.beginPath();
  ctx.arc(0, 0, 160, 0, Math.PI * 2);
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 145, 0, Math.PI * 2);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 8-Point Star Sigil
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
  ctx.lineWidth = 2.5;
  for (let s = 0; s < 4; s++) {
    const angle = (s * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 145, Math.sin(angle) * 145);
    ctx.lineTo(-Math.cos(angle) * 145, -Math.sin(angle) * 145);
    ctx.stroke();
  }

  // Inner Circle Seal
  ctx.beginPath();
  ctx.arc(0, 0, 105, 0, Math.PI * 2);
  ctx.fillStyle = '#170702';
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Gilded CBSE Emblem Text
  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 58px "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CBSE', 0, -6);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('2026 TOME', 0, 46);

  ctx.restore();

  // Title in Embossed Gold Leaf
  const titleGrad = ctx.createLinearGradient(0, 640, 0, 780);
  titleGrad.addColorStop(0, '#fffbeb');
  titleGrad.addColorStop(0.3, '#fef08a');
  titleGrad.addColorStop(0.7, '#f59e0b');
  titleGrad.addColorStop(1, '#92400e');

  ctx.fillStyle = titleGrad;
  ctx.font = '900 64px "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 512, 690);

  // Subtitle
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(sub, 512, 775);

  // Gold Divider Line with Diamond Center
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(250, 835);
  ctx.lineTo(774, 835);
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(512, 835, 8, 0, Math.PI * 2);
  ctx.fill();

  // Bottom Text
  ctx.fillStyle = '#d97706';
  ctx.font = '600 22px sans-serif';
  ctx.fillText('CLASS 9 • CLASS 10 • CLASS 12', 512, 1180);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('ANCIENT QUESTION PAPER VAULT & ASSESSMENT ENGINE', 512, 1220);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createPageEdgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#bd9e6a');
  grad.addColorStop(0.1, '#e3cf9e');
  grad.addColorStop(0.5, '#ecdca8');
  grad.addColorStop(0.9, '#e3cf9e');
  grad.addColorStop(1, '#a67d48');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 512);

  for (let y = 0; y < 512; y += 2) {
    const alpha = 0.08 + Math.random() * 0.18;
    ctx.fillStyle = `rgba(70, 45, 18, ${alpha})`;
    ctx.fillRect(0, y, 64, 1);
  }

  const topGrad = ctx.createLinearGradient(0, 0, 0, 40);
  topGrad.addColorStop(0, 'rgba(60, 35, 12, 0.45)');
  topGrad.addColorStop(1, 'rgba(60, 35, 12, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, 64, 40);

  const botGrad = ctx.createLinearGradient(0, 512, 0, 472);
  botGrad.addColorStop(0, 'rgba(60, 35, 12, 0.45)');
  botGrad.addColorStop(1, 'rgba(60, 35, 12, 0)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, 472, 64, 40);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  texture.needsUpdate = true;
  return texture;
}

function applyVintagePaperEffects(ctx: CanvasRenderingContext2D, width: number, height: number, isRightPage: boolean = false) {
  // 1. Aged Vintage Parchment Background Gradient (Deep Aged Golden Parchment like screenshot)
  const bgGrad = ctx.createRadialGradient(
    width * (isRightPage ? 0.35 : 0.65), height * 0.5, 100,
    width * 0.5, height * 0.5, width * 0.88
  );
  bgGrad.addColorStop(0, '#fdf7e7');
  bgGrad.addColorStop(0.5, '#f4e6c3');
  bgGrad.addColorStop(0.82, '#e6d3a3');
  bgGrad.addColorStop(1, '#cca76d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Heavy Outer Edge Oxidation & Burnt Vignette (Burnished Ancient Book Edges)
  const edgeGradient = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.32,
    width / 2, height / 2, Math.max(width, height) * 0.70
  );
  edgeGradient.addColorStop(0, 'rgba(160, 110, 50, 0)');
  edgeGradient.addColorStop(0.65, 'rgba(140, 90, 35, 0.12)');
  edgeGradient.addColorStop(0.88, 'rgba(105, 60, 20, 0.32)');
  edgeGradient.addColorStop(1, 'rgba(65, 32, 8, 0.55)');
  ctx.fillStyle = edgeGradient;
  ctx.fillRect(0, 0, width, height);

  // Spine Crease Deep Shadow Stain
  const spineShadowX = isRightPage ? 0 : width;
  const spineGrad = ctx.createLinearGradient(spineShadowX, 0, isRightPage ? 140 : width - 140, 0);
  spineGrad.addColorStop(0, 'rgba(40, 20, 5, 0.55)');
  spineGrad.addColorStop(0.3, 'rgba(75, 40, 12, 0.22)');
  spineGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. Deckled Edge Wear & Rough Paper Border
  const inset = 10;
  ctx.strokeStyle = 'rgba(90, 55, 20, 0.32)';
  ctx.lineWidth = 3;
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  // 4. Procedural Cellulose Fibers & Ancient Paper Grain
  ctx.lineWidth = 1.2;
  for (let f = 0; f < 1000; f++) {
    const fx = Math.random() * width;
    const fy = Math.random() * height;
    const len = 4 + Math.random() * 20;
    const angle = Math.random() * Math.PI * 2;
    const curve = (Math.random() - 0.5) * 14;

    const isDarkFiber = Math.random() < 0.7;
    ctx.strokeStyle = isDarkFiber
      ? `rgba(80, 50, 20, ${0.05 + Math.random() * 0.10})`
      : `rgba(255, 250, 230, ${0.12 + Math.random() * 0.18})`;

    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.quadraticCurveTo(
      fx + Math.cos(angle) * (len / 2) + curve,
      fy + Math.sin(angle) * (len / 2) + curve,
      fx + Math.cos(angle) * len,
      fy + Math.sin(angle) * len
    );
    ctx.stroke();
  }

  // Paper Speckles & Micro-Imperfections
  ctx.fillStyle = 'rgba(50, 30, 10, 0.035)';
  for (let i = 0; i < 26000; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    ctx.fillRect(rx, ry, Math.random() < 0.3 ? 2.5 : 1.2, Math.random() < 0.3 ? 2.5 : 1.2);
  }

  // Ancient Mystical Astrolabe Diagram (Matching glowing manuscript in screenshot)
  ctx.strokeStyle = 'rgba(100, 60, 20, 0.12)';
  ctx.lineWidth = 1.8;
  const diagX = isRightPage ? width * 0.72 : width * 0.28;
  const diagY = height * 0.48;

  // Concentric Rings & Magic Circles
  [210, 160, 110, 60].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(diagX, diagY, radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Rays & Trigonometric Sigils
  for (let a = 0; a < 8; a++) {
    const rad = (a * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(diagX + Math.cos(rad) * 30, diagY + Math.sin(rad) * 30);
    ctx.lineTo(diagX + Math.cos(rad) * 210, diagY + Math.sin(rad) * 210);
    ctx.stroke();
  }

  // Golden Magic Rune Glow Accent
  const runeGlow = ctx.createRadialGradient(diagX, diagY, 10, diagX, diagY, 180);
  runeGlow.addColorStop(0, 'rgba(251, 191, 36, 0.15)');
  runeGlow.addColorStop(0.5, 'rgba(217, 119, 6, 0.06)');
  runeGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = runeGlow;
  ctx.beginPath();
  ctx.arc(diagX, diagY, 180, 0, Math.PI * 2);
  ctx.fill();

  // Ancient Handwritten Cursive Script Lines
  ctx.fillStyle = 'rgba(75, 45, 15, 0.09)';
  ctx.font = 'italic 17px serif';
  const textX = isRightPage ? 110 : 80;
  for (let lineY = 160; lineY < height - 140; lineY += 50) {
    if (Math.abs(lineY - diagY) < 140 && Math.random() < 0.65) continue;
    ctx.fillText('⚡ ☤ ⚖ 🜂 🜄 🝔  —  ExamCraft CBSE Competency Blueprint Paper & Formula Sheet', textX, lineY);
  }
}

function drawPaperButton(ctx: CanvasRenderingContext2D, y: number, title: string, code: string, color1: string, color2: string, stroke: string) {
  const x = 70;
  const w = 884;
  const h = 110;
  const r = 18;

  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, x + 35, y + 64);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(code, x + w - 35, y + 64);
}

function createTurningPageTexture(pageNum: number, isFront: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d')!;

  applyVintagePaperEffects(ctx, 1024, 1400, !isFront);

  // Page Header Line
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(70, 110);
  ctx.lineTo(954, 110);
  ctx.stroke();

  ctx.fillStyle = '#047857';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';

  if (pageNum === 0) {
    if (isFront) {
      ctx.fillText('SECTION 1: SCIENCE & NCERT BLUEPRINT', 70, 88);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px serif';
      ctx.fillText('UNIT 086: SCIENCE ASSESSMENT ENGINE', 70, 180);

      drawPaperButton(ctx, 230, '🔬 SCIENCE ASSESSMENTS', 'CODE 086', '#0284c7', '#0369a1', '#38bdf8');

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('CHAPTER BREAKDOWN:', 70, 390);

      const items = [
        "• Physics: Light Reflection, Electricity, Magnetic Effects",
        "• Chemistry: Chemical Reactions, Acids Bases, Carbon Compounds",
        "• Biology: Life Processes, Control & Coordination, Heredity",
        "• Practical Skills & NCERT Diagram Vault"
      ];
      let y = 440;
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#475569';
      items.forEach(it => { ctx.fillText(it, 70, y); y += 45; });

      drawPaperButton(ctx, 680, '⚡ QUICK BLUEPRINT GENERATOR', 'AUTO SCRIPT', '#0f172a', '#1e293b', '#38bdf8');
    } else {
      ctx.fillText('NCERT SCIENCE FORMULA & SCHEMATIC SHEET', 70, 88);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px serif';
      ctx.fillText('COMPETENCY FORMULA REFERENCE', 70, 180);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(70, 230, 884, 1000);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(72, 232, 880, 996);

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('• Snell\'s Law: n = sin(i) / sin(r)', 100, 300);
      ctx.fillText('• Lens Formula: 1/f = 1/v - 1/u', 100, 360);
      ctx.fillText('• Ohm\'s Law: V = I × R', 100, 420);
      ctx.fillText('• Electric Power: P = V × I = I²R', 100, 480);
      ctx.fillText('• Respiration: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + Energy', 100, 540);
    }
  } else if (pageNum === 1) {
    if (isFront) {
      ctx.fillText('SECTION 2: MATHEMATICS & CALCULUS ENGINE', 70, 88);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px serif';
      ctx.fillText('UNIT 041: MATHEMATICAL BLUEPRINT', 70, 180);

      drawPaperButton(ctx, 230, '📐 MATHEMATICS BLUEPRINT', 'CODE 041', '#4338ca', '#3730a3', '#818cf8');

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('MATHEMATICS MARKS DISTRIBUTION:', 70, 390);

      const items = [
        "• Algebra (20 Marks): Polynomials, Quadratic Eq, AP",
        "• Geometry (15 Marks): Triangles, Circles, Tangents",
        "• Trigonometry (12 Marks): Identities, Heights & Distances",
        "• Statistics & Probability (11 Marks)"
      ];
      let y = 440;
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#475569';
      items.forEach(it => { ctx.fillText(it, 70, y); y += 45; });

      drawPaperButton(ctx, 680, '🎓 CBSE MARKING SCHEME', 'SOLUTIONS', '#b45309', '#78350f', '#fbbf24');
    } else {
      ctx.fillText('GEOMETRY & CALCULUS MATRIX SHEET', 70, 88);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px serif';
      ctx.fillText('THEOREM & IDENTITY SUMMARY', 70, 180);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(70, 230, 884, 1000);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(72, 232, 880, 996);

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('• Pythagoras Theorem: AB² + BC² = AC²', 100, 300);
      ctx.fillText('• Quadratic Formula: x = (-b ± √(b²-4ac)) / (2a)', 100, 360);
      ctx.fillText('• Trig Identity: sin²θ + cos²θ = 1', 100, 420);
      ctx.fillText('• Distance Formula: d = √((x₂-x₁)² + (y₂-y₁)²)', 100, 480);
    }
  } else {
    if (isFront) {
      ctx.fillText('SECTION 3: SMART PAPER GENERATOR', 70, 88);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px serif';
      ctx.fillText('MAIN QUESTION PAPER VAULT', 70, 180);

      drawPaperButton(ctx, 230, '✨ GENERATE QUESTION PAPER', '2026 EDITION', '#059669', '#047857', '#34d399');

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('EXAMCRAFT FEATURES:', 70, 390);

      const items = [
        "• Instant PDF Export with Official CBSE Header",
        "• Complete Marking Scheme & Step-by-step Answers",
        "• Chapter-wise Competency Question Selection",
        "• Saved Papers Vault for instant revision"
      ];
      let y = 440;
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#475569';
      items.forEach(it => { ctx.fillText(it, 70, y); y += 45; });

      drawPaperButton(ctx, 680, '📂 SAVED PAPERS VAULT', 'ARCHIVE', '#6b21a8', '#581c87', '#c084fc');
    } else {
      ctx.fillText('EXAMCRAFT CBSE 2026 OFFICIAL SUMMARY', 70, 88);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px serif';
      ctx.fillText('CBSE BOARD EXAMINATION MANUAL', 70, 180);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('READY TO START?', 70, 260);

      ctx.fillStyle = '#475569';
      ctx.font = '22px sans-serif';
      ctx.fillText('Tap anywhere on screen to enter ExamCraft Web App!', 70, 310);
    }
  }

  // Footer
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 1310);
  ctx.lineTo(954, 1310);
  ctx.stroke();

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`EXAMCRAFT 2026 - PAGE ${pageNum + 1} (${isFront ? 'FRONT' : 'BACK'})`, 954, 1340);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createLeftPageTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d')!;

  applyVintagePaperEffects(ctx, 1024, 1400, false);

  ctx.beginPath();
  ctx.arc(512, 700, 260, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
  ctx.lineWidth = 12;
  ctx.stroke();

  ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
  ctx.font = 'bold 90px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CBSE 2026', 512, 700);

  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(70, 110);
  ctx.lineTo(954, 110);
  ctx.stroke();

  ctx.fillStyle = '#047857';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('EXAMCRAFT CBSE 2026 OFFICIAL BLUEPRINT', 70, 90);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px serif';
  ctx.fillText('SELECT SUBJECT & CLASS', 70, 180);

  const drawPaperButton = (y: number, title: string, code: string, color1: string, color2: string, stroke: string) => {
    const x = 70;
    const w = 884;
    const h = 100;
    const r = 16;

    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 30, y + 58);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(code, x + w - 30, y + 58);
  };

  drawPaperButton(230, '🔬 Science Assessment Vault', 'CODE 086', '#0284c7', '#0369a1', '#38bdf8');
  drawPaperButton(350, '📐 Mathematics Blueprint Engine', 'CODE 041', '#4338ca', '#3730a3', '#818cf8');
  drawPaperButton(470, '⚡ Social Science Unit Builder', 'CODE 087', '#b45309', '#92400e', '#fbbf24');
  drawPaperButton(590, '📖 English Communicative & Literature', 'CODE 184', '#6b21a8', '#581c87', '#c084fc');

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 26px serif';
  ctx.textAlign = 'left';
  ctx.fillText('CLASS SELECTION MATRIX:', 70, 740);

  const classes = ['CLASS 9', 'CLASS 10', 'CLASS 11', 'CLASS 12'];
  classes.forEach((cls, i) => {
    const bx = 70 + i * 225;
    const by = 770;
    const bw = 210;
    const bh = 70;

    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 12);
    ctx.fillStyle = i === 1 ? '#10b981' : '#f1f5f9';
    ctx.fill();
    ctx.strokeStyle = i === 1 ? '#059669' : '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = i === 1 ? '#ffffff' : '#334155';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cls, bx + bw / 2, by + 42);
  });

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(70, 870, 884, 400, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('OFFICIAL QUESTION WEIGHTAGE SCHEME', 100, 920);

  const specs = [
    "• Section A: 20 Objective & MCQ Questions (1 Mark Each)",
    "• Section B: 6 Short Answer Questions (2 Marks Each)",
    "• Section C: 7 Short Answer Questions (3 Marks Each)",
    "• Section D: 3 Long Answer Questions (5 Marks Each)",
    "• Section E: 3 Case Study & Integrated Units (4 Marks Each)",
    "• Competency & Real-World Application Weightage: 50% Minimum"
  ];

  let sy = 970;
  ctx.fillStyle = '#475569';
  ctx.font = '20px sans-serif';
  specs.forEach(s => {
    ctx.fillText(s, 100, sy);
    sy += 42;
  });

  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 1310);
  ctx.lineTo(954, 1310);
  ctx.stroke();

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('EXAMCRAFT CBSE 2026 - OFFICIAL MANUAL [PAGE 1]', 954, 1340);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createRightPageTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d')!;

  applyVintagePaperEffects(ctx, 1024, 1400, true);

  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(70, 110);
  ctx.lineTo(954, 110);
  ctx.stroke();

  ctx.fillStyle = '#047857';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SMART QUESTION PAPER GENERATOR ENGINE', 70, 90);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px serif';
  ctx.fillText('MAIN ACTION CONTROLS', 70, 180);

  const drawMainButton = (y: number, title: string, subtitle: string, color1: string, color2: string, stroke: string) => {
    const x = 70;
    const w = 884;
    const h = 130;
    const r = 20;

    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + w / 2, y + 55);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = '20px sans-serif';
    ctx.fillText(subtitle, x + w / 2, y + 95);
  };

  drawMainButton(230, '✨ GENERATE QUESTION PAPER (2026)', 'Instant AI Blueprint & Answer Key Generation', '#059669', '#047857', '#34d399');

  const drawControlBox = (x: number, y: number, w: number, h: number, title: string, sub: string, strokeColor: string) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + w / 2, y + 50);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.fillText(sub, x + w / 2, y + 85);
  };

  drawControlBox(70, 390, 426, 120, '⚡ Quick Blueprint Preview', 'View Unit Weightage', '#38bdf8');
  drawControlBox(528, 390, 426, 120, '📂 Saved Papers Vault', 'Access Previous Tests', '#c084fc');

  drawControlBox(70, 530, 426, 120, '🎓 CBSE Marking Scheme', 'Official Solutions Key', '#fbbf24');
  drawControlBox(528, 530, 426, 120, '📋 Chapter Weightage', 'Topic-wise Marks', '#34d399');

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(70, 680, 884, 590);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(72, 682, 880, 586);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 26px serif';
  ctx.textAlign = 'center';
  ctx.fillText('LIVE SAMPLE QUESTION SCHEMATIC', 512, 730);

  ctx.fillStyle = '#334155';
  ctx.font = '20px monospace';
  ctx.textAlign = 'left';

  const qLines = [
    "Q1. [Competency] A circuit contains a resistor R and an inductor L.",
    "    Calculate the phase angle when frequency is doubled.",
    "    (a) tan⁻¹(2)     (b) tan⁻¹(1/2)     (c) π/4     (d) 0",
    "",
    "Q2. [Case Study] Read the following passage on CBSE 2026 Reforms:",
    "    'Competency-based questions evaluate critical thinking...'",
    "    Sub-question (i): State the percentage allocation for Class 10.",
    "",
    "Q3. [Assertion-Reason] Assertion (A): Real image is formed by convex lens.",
    "    Reason (R): Light rays actually intersect after refraction."
  ];

  let qy = 780;
  qLines.forEach(q => {
    ctx.fillText(q, 100, qy);
    qy += 40;
  });

  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 1310);
  ctx.lineTo(954, 1310);
  ctx.stroke();

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('EXAMCRAFT CBSE 2026 - OFFICIAL MANUAL [PAGE 2]', 954, 1340);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createPopButtonTexture(text: string, iconSymbol: string, bgColors: [string, string], strokeColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 120;
  const ctx = canvas.getContext('2d')!;

  const r = 20;
  const x = 10;
  const y = 10;
  const w = 512 - 20;
  const h = 120 - 20;

  const grad = ctx.createLinearGradient(0, 0, 512, 120);
  grad.addColorStop(0, bgColors[0]);
  grad.addColorStop(1, bgColors[1]);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${iconSymbol} ${text}`, 256, 60);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function playBookFlipSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

function animateWebsiteElementsIn() {
  const targets = [
    '[data-book-reveal="background"]',
    '[data-book-reveal="logo"]',
    '[data-book-reveal="navbar"]',
    '[data-book-reveal="nav"]',
    '[data-book-reveal="heading"]',
    '[data-book-reveal="text"]',
    '[data-book-reveal="primary"]',
    '[data-book-reveal="secondary"]',
    '[data-book-reveal="content"]'
  ];

  const elements = document.querySelectorAll(targets.join(','));

  if (elements.length > 0) {
    gsap.fromTo(elements, {
      opacity: 0,
      y: 20,
      scale: 0.98
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      stagger: 0.08,
      ease: "power2.out",
      clearProps: "all"
    });
  }
}

function createWoodTableTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, '#21120b');
  grad.addColorStop(0.3, '#3a2014');
  grad.addColorStop(0.6, '#1a0d07');
  grad.addColorStop(1, '#0e0603');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Planks and wood grain lines
  for (let i = 0; i < 350; i++) {
    ctx.strokeStyle = Math.random() < 0.5 ? 'rgba(10, 5, 2, 0.3)' : 'rgba(80, 45, 25, 0.15)';
    ctx.lineWidth = 1 + Math.random() * 5;
    ctx.beginPath();
    const y = Math.random() * 1024;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(340, y + (Math.random() - 0.5) * 35, 680, y + (Math.random() - 0.5) * 35, 1024, y);
    ctx.stroke();
  }

  // Wood knots
  for (let k = 0; k < 5; k++) {
    const kx = Math.random() * 1024;
    const ky = Math.random() * 1024;
    for (let r = 8; r < 65; r += 7) {
      ctx.beginPath();
      ctx.ellipse(kx, ky, r * 1.7, r, Math.PI / 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(10, 5, 2, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function createRainbowSpectrumTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.15, 'rgba(239, 68, 68, 0.85)');   // Red
  grad.addColorStop(0.32, 'rgba(249, 115, 22, 0.85)');  // Orange
  grad.addColorStop(0.48, 'rgba(234, 179, 8, 0.85)');   // Yellow
  grad.addColorStop(0.65, 'rgba(34, 197, 94, 0.85)');   // Green
  grad.addColorStop(0.82, 'rgba(59, 130, 246, 0.85)');  // Blue
  grad.addColorStop(1.0, 'rgba(168, 85, 247, 0.85)');   // Violet

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 128);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createFormulaTexture(text: string, subText: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const glow = ctx.createRadialGradient(256, 128, 10, 256, 128, 220);
  glow.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
  glow.addColorStop(0.6, 'rgba(217, 119, 6, 0.12)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 256);

  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 18;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 110);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(subText, 256, 175);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createExamCraftBurstTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  const radial = ctx.createRadialGradient(512, 192, 20, 512, 192, 400);
  radial.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  radial.addColorStop(0.2, 'rgba(251, 191, 36, 0.8)');
  radial.addColorStop(0.5, 'rgba(217, 119, 6, 0.3)');
  radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, 1024, 384);

  // Radiant Light Rays
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.25)';
  ctx.lineWidth = 3;
  for (let a = 0; a < 24; a++) {
    const angle = (a * Math.PI) / 12;
    ctx.beginPath();
    ctx.moveTo(512, 192);
    ctx.lineTo(512 + Math.cos(angle) * 450, 192 + Math.sin(angle) * 200);
    ctx.stroke();
  }

  // EXAMCRAFT Title Text
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 84px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXAMCRAFT', 512, 170);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('CBSE BOARD VAULT 2026', 512, 250);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// IndexedDB storage helpers for large video blobs (bypasses 5MB localStorage limit)
function saveVideoBlobToIDB(blob: Blob): Promise<void> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('ExamCraftMediaDB', 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('videos')) {
          db.createObjectStore('videos');
        }
      };
      request.onsuccess = (e: any) => {
        try {
          const db = e.target.result;
          const tx = db.transaction('videos', 'readwrite');
          const store = tx.objectStore('videos');
          store.put(blob, 'intro_video');
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      };
      request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function loadVideoBlobFromIDB(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('ExamCraftMediaDB', 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('videos')) {
          db.createObjectStore('videos');
        }
      };
      request.onsuccess = (e: any) => {
        try {
          const db = e.target.result;
          const tx = db.transaction('videos', 'readonly');
          const store = tx.objectStore('videos');
          const getReq = store.get('intro_video');
          getReq.onsuccess = () => {
            if (getReq.result instanceof Blob) {
              resolve(URL.createObjectURL(getReq.result));
            } else {
              resolve(null);
            }
          };
          getReq.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
