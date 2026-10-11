import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, Eye, EyeOff, Sliders, ChevronDown } from 'lucide-react';
import {
  createHumanEyeDiagram,
  createPrismDiagram,
  createLensRayDiagram,
  createCircleTangentsDiagram,
  createTrigonometryDiagram,
  createBohrAtomDiagram,
  createSquareRootSpiralDiagram,
  create3DVectorsDiagram,
  createBenzeneResonanceDiagram,
  createGlobeGridDiagram,
  createHistoricalMonumentsDiagram,
  createAshokChakraDiagram,
  createFloatingAlphabetsDiagram,
  createQuillFountainPenDiagram,
  createOpenBookAuraDiagram,
  createDnaDoubleHelixDiagram,
  createAiNeuralNetworkDiagram
} from '../utils/ncertDiagramCanvas';

interface ThreeBackgroundProps {
  enabled?: boolean;
  classLevel?: string;
  subjectId?: string;
  isNight?: boolean;
}

export const ThreeBackground: React.FC<ThreeBackgroundProps> = ({
  enabled = true,
  classLevel = '10',
  subjectId = 'science-086',
  isNight = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const currentConfigRef = useRef({ classLevel, subjectId, isNight });
  const subjectSpeedRef = useRef(1.0);

  // Floating Control Panel state for 3D Background Models
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotSpeed, setRotSpeed] = useState(1.0);
  const [modelScale, setModelScale] = useState(1.0);
  const [showLabels, setShowLabels] = useState(true);
  const [manualRotY, setManualRotY] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const controlsRef = useRef({
    autoRotate,
    rotSpeed,
    modelScale,
    showLabels,
    manualRotY
  });

  useEffect(() => {
    controlsRef.current = {
      autoRotate,
      rotSpeed,
      modelScale,
      showLabels,
      manualRotY
    };
  }, [autoRotate, rotSpeed, modelScale, showLabels, manualRotY]);

  // Update current config ref
  useEffect(() => {
    currentConfigRef.current = { classLevel, subjectId, isNight };
  }, [classLevel, subjectId, isNight]);

  useEffect(() => {
    if (!enabled || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera Setup (Responsive FOV & Position for Mobile & Desktop)
    const scene = new THREE.Scene();
    const isMobileInitial = width < 768;
    const initialFov = isMobileInitial ? 70 : 60;
    const initialCamZ = isMobileInitial ? 48 : 35;
    const initialCamY = isMobileInitial ? 12 : 15;

    const camera = new THREE.PerspectiveCamera(initialFov, width / height, 0.1, 1000);
    camera.position.set(0, initialCamY, initialCamZ);
    camera.lookAt(0, 0, 0);

    // 2. Renderer Setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch (err) {
      console.warn("WebGL Renderer creation failed for background:", err);
      return;
    }

    if (!renderer || !renderer.capabilities) {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Detect dark mode
    let isDarkMode = document.documentElement.classList.contains('dark');

    // 3. Ambient & Point Lighting (Northern Lights Aurora & Deep Space Cosmos)
    const ambientLight = new THREE.AmbientLight(
      isDarkMode ? 0x38bdf8 : 0x0284c7,
      isDarkMode ? 1.2 : 0.95
    );
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x06b6d4, 3.8, 110); // Northern Lights Aurora Cyan
    pointLight1.position.set(25, 25, 25);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 3.6, 110); // Deep Space Cosmic Violet
    pointLight2.position.set(-25, -15, -10);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x2dd4bf, 3.2, 95); // Aurora Aquamarine Ribbon
    pointLight3.position.set(0, 30, -15);
    scene.add(pointLight3);

    // 4. Particle Wave Grid
    const SEPARATION = 2.2;
    const AMOUNTX = 45;
    const AMOUNTY = 35;
    const numParticles = AMOUNTX * AMOUNTY;

    const positions = new Float32Array(numParticles * 3);
    const scales = new Float32Array(numParticles);

    let i = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        positions[i] = (ix - AMOUNTX / 2) * SEPARATION; // x
        positions[i + 1] = 0; // y
        positions[i + 2] = (iy - AMOUNTY / 2) * SEPARATION; // z

        scales[i / 3] = 1;
        i += 3;
      }
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle texture canvas creation (Aurora Northern Lights starburst)
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 32;
    particleCanvas.height = 32;
    const pctx = particleCanvas.getContext('2d');
    if (pctx) {
      const grad = pctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.25, 'rgba(56, 189, 248, 0.95)'); // Starlight Cyan
      grad.addColorStop(0.6, 'rgba(45, 212, 191, 0.65)'); // Aurora Teal
      grad.addColorStop(0.85, 'rgba(168, 85, 247, 0.35)'); // Cosmic Violet Glow
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)'); // Fade to deep space
      pctx.fillStyle = grad;
      pctx.beginPath();
      pctx.arc(16, 16, 16, 0, Math.PI * 2);
      pctx.fill();
    }

    const particleTexture = new THREE.CanvasTexture(particleCanvas);

    const particlesMaterial = new THREE.PointsMaterial({
      color: isDarkMode ? 0x22d3ee : 0x0284c7,
      size: 2.5,
      map: particleTexture,
      transparent: true,
      opacity: isDarkMode ? 0.9 : 0.8,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    particleSystem.position.y = -6;
    particleSystem.visible = false; // Disabled animated particle wave mesh to keep background clean & uncluttered
    // scene.add(particleSystem);

    // 4b. Deep Space Twinkling Starfield (Full Screen Top-to-Bottom & Left-to-Right Spread)
    const starCount = 450;
    const starPositions = new Float32Array(starCount * 3);
    for (let s = 0; s < starCount; s++) {
      starPositions[s * 3] = (Math.random() - 0.5) * 160;
      starPositions[s * 3 + 1] = (Math.random() - 0.5) * 110;
      starPositions[s * 3 + 2] = (Math.random() - 0.5) * 90 - 15;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starCanvas = document.createElement('canvas');
    starCanvas.width = 16;
    starCanvas.height = 16;
    const sctx = starCanvas.getContext('2d');
    if (sctx) {
      const sgrad = sctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      sgrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      sgrad.addColorStop(0.35, 'rgba(186, 230, 253, 0.9)');
      sgrad.addColorStop(0.7, 'rgba(192, 132, 252, 0.45)');
      sgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sctx.fillStyle = sgrad;
      sctx.beginPath();
      sctx.arc(8, 8, 8, 0, Math.PI * 2);
      sctx.fill();
    }
    const starTexture = new THREE.CanvasTexture(starCanvas);

    const starMaterial = new THREE.PointsMaterial({
      size: 1.6,
      map: starTexture,
      transparent: true,
      opacity: isDarkMode ? 0.85 : 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const starSystem = new THREE.Points(starGeometry, starMaterial);
    scene.add(starSystem);

    // 5. Floating 3D Geometric Shapes
    const shapesGroup = new THREE.Group();
    scene.add(shapesGroup);

    interface FloatingShape {
      mesh: THREE.Mesh;
      rotSpeedX: number;
      rotSpeedY: number;
      rotSpeedZ: number;
      initialY: number;
      floatSpeed: number;
      floatOffset: number;
    }

    const floatingShapes: FloatingShape[] = [];

    const geometries = [
      new THREE.IcosahedronGeometry(2.6, 0),
      new THREE.TetrahedronGeometry(2.4, 0),
      new THREE.OctahedronGeometry(2.5, 0),
      new THREE.TorusGeometry(2.2, 0.7, 12, 24),
      new THREE.DodecahedronGeometry(2.2, 0),
    ];

    const colors = [0x3b82f6, 0x10b981, 0x8b5cf6, 0xf59e0b, 0xec4899, 0x06b6d4];

    const isMobileViewport = width < 768;
    const shapeSpreadX = isMobileViewport ? 28 : 72;
    const shapeSpreadY = isMobileViewport ? 54 : 44;
    const shapeSpreadZ = isMobileViewport ? 24 : 35;

    for (let k = 0; k < 14; k++) {
      const geom = geometries[k % geometries.length];
      const color = colors[k % colors.length];

      const fillMat = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: isDarkMode ? 0.5 : 0.35,
        transparent: true,
        opacity: isDarkMode ? 0.45 : 0.35,
        shininess: 100,
        wireframe: k % 2 === 0,
      });

      const mesh = new THREE.Mesh(geom, fillMat);

      // Distributed grid placement with natural variance so shapes cover the whole canvas
      const xRatio = ((k / 13) - 0.5); // -0.5 to +0.5 across X
      const yRatio = Math.sin(k * 1.4) * 0.48; // wave distribution across Y
      const posX = xRatio * shapeSpreadX + (Math.random() - 0.5) * 6;
      const posY = yRatio * shapeSpreadY + (Math.random() - 0.5) * 4;
      const posZ = (Math.random() - 0.5) * shapeSpreadZ - (isMobileViewport ? 2 : 5);

      mesh.position.set(posX, posY, posZ);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      const scale = isMobileViewport ? (0.6 + Math.random() * 0.45) : (0.8 + Math.random() * 0.7);
      mesh.scale.set(scale, scale, scale);

      shapesGroup.add(mesh);

      floatingShapes.push({
        mesh,
        rotSpeedX: (Math.random() - 0.5) * 0.01,
        rotSpeedY: (Math.random() - 0.5) * 0.012,
        rotSpeedZ: (Math.random() - 0.5) * 0.006,
        initialY: posY,
        floatSpeed: 0.001 + Math.random() * 0.0012,
        floatOffset: Math.random() * Math.PI * 2,
      });
    }

    // 5b. 3D Rotating DNA Double Helix Structure Group (Positioned Top-Left)
    const dnaMeshGroup = new THREE.Group();
    scene.add(dnaMeshGroup);

    const dnaSphereGeom = new THREE.SphereGeometry(0.38, 12, 12);
    const strand1Mat = new THREE.MeshPhongMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.6, shininess: 80 });
    const strand2Mat = new THREE.MeshPhongMaterial({ color: 0xc084fc, emissive: 0x9333ea, emissiveIntensity: 0.6, shininess: 80 });
    const rungLineMat = new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.75 });

    const dnaPoints = 18;
    const dnaHeight = 22;
    const dnaRadius = 3.2;

    for (let i = 0; i < dnaPoints; i++) {
      const t = (i / dnaPoints) - 0.5;
      const y = t * dnaHeight;
      const angle = t * Math.PI * 4;

      const x1 = Math.sin(angle) * dnaRadius;
      const z1 = Math.cos(angle) * dnaRadius;
      const x2 = -Math.sin(angle) * dnaRadius;
      const z2 = -Math.cos(angle) * dnaRadius;

      const m1 = new THREE.Mesh(dnaSphereGeom, strand1Mat);
      m1.position.set(x1, y, z1);
      dnaMeshGroup.add(m1);

      const m2 = new THREE.Mesh(dnaSphereGeom, strand2Mat);
      m2.position.set(x2, y, z2);
      dnaMeshGroup.add(m2);

      const rungGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, y, z1),
        new THREE.Vector3(x2, y, z2)
      ]);
      const rungLine = new THREE.Line(rungGeom, rungLineMat);
      dnaMeshGroup.add(rungLine);
    }
    // Spread to Top-Left outer region
    dnaMeshGroup.position.set(isMobileViewport ? -10 : -26, isMobileViewport ? 18 : 14, -5);

    // 5c. 3D Rotating AI Artificial Intelligence Neural Core Group (Positioned Bottom-Right)
    const aiMeshGroup = new THREE.Group();
    scene.add(aiMeshGroup);

    const aiNodeGeom = new THREE.SphereGeometry(0.42, 12, 12);
    const aiNodeMat = new THREE.MeshPhongMaterial({ color: 0x22d3ee, emissive: 0x06b6d4, emissiveIntensity: 0.85, shininess: 100 });
    const aiConnMat = new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.5 });

    const aiNodes: THREE.Vector3[] = [
      new THREE.Vector3(-3.5, 4.5, 0),
      new THREE.Vector3(-3.5, -4.5, 0),
      new THREE.Vector3(0, 6.5, 2.5),
      new THREE.Vector3(0, 0, -2.5),
      new THREE.Vector3(0, -6.5, 2.5),
      new THREE.Vector3(3.5, 3.5, 0),
      new THREE.Vector3(3.5, -3.5, 0)
    ];

    aiNodes.forEach((pos) => {
      const nodeMesh = new THREE.Mesh(aiNodeGeom, aiNodeMat);
      nodeMesh.position.copy(pos);
      aiMeshGroup.add(nodeMesh);
    });

    for (let a = 0; a < aiNodes.length; a++) {
      for (let b = a + 1; b < aiNodes.length; b++) {
        if (aiNodes[a].distanceTo(aiNodes[b]) < 8.5) {
          const connGeom = new THREE.BufferGeometry().setFromPoints([aiNodes[a], aiNodes[b]]);
          const connLine = new THREE.Line(connGeom, aiConnMat);
          aiMeshGroup.add(connLine);
        }
      }
    }
    // Spread to Bottom-Right outer region
    aiMeshGroup.position.set(isMobileViewport ? 10 : 28, isMobileViewport ? -18 : -15, -5);

    const labelDisposables: { texture: THREE.CanvasTexture; material: THREE.SpriteMaterial }[] = [];

    const createLabelSprite = (text: string, color = '#38bdf8') => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(4, 4, 248, 56, 12);
        } else {
          ctx.rect(4, 4, 248, 56);
        }
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 32);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(3.0, 0.75, 1);
      labelDisposables.push({ texture, material: spriteMat });
      return sprite;
    };

    // 5e. 3D Mathematics Dynamic Geometric Solids & Theorems Model Group
    const mathMeshGroup = new THREE.Group();
    scene.add(mathMeshGroup);

    const mathIcosaGeom = new THREE.IcosahedronGeometry(3.2, 0);
    const mathIcosaMat = new THREE.MeshPhongMaterial({
      color: 0x818cf8,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.75,
      wireframe: true,
      transparent: true,
      opacity: 0.65
    });
    const mathIcosaMesh = new THREE.Mesh(mathIcosaGeom, mathIcosaMat);
    mathMeshGroup.add(mathIcosaMesh);

    const mathDodecaGeom = new THREE.DodecahedronGeometry(2.1, 0);
    const mathDodecaMat = new THREE.MeshPhongMaterial({
      color: 0x34d399,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });
    const mathDodecaMesh = new THREE.Mesh(mathDodecaGeom, mathDodecaMat);
    mathMeshGroup.add(mathDodecaMesh);

    const mathRingGeom = new THREE.TorusGeometry(4.3, 0.1, 16, 48);
    const mathRingMat = new THREE.MeshPhongMaterial({ color: 0xc084fc, emissive: 0x9333ea, emissiveIntensity: 0.9 });
    const mathRingMesh = new THREE.Mesh(mathRingGeom, mathRingMat);
    mathRingMesh.rotation.x = Math.PI * 0.4;
    mathMeshGroup.add(mathRingMesh);

    const mathLabel = createLabelSprite('3D Geometry & Calculus', '#818cf8');
    mathLabel.position.set(0, 4.2, 0);
    mathMeshGroup.add(mathLabel);

    mathMeshGroup.position.set(isMobileViewport ? -10 : -28, isMobileViewport ? 18 : 14, -5);

    // 5f. 3D Geography Rotating Relief Map & Topography Globe Group
    const geographyMeshGroup = new THREE.Group();
    scene.add(geographyMeshGroup);

    const geoSphereGeom = new THREE.SphereGeometry(3.4, 24, 24);
    const geoSphereMat = new THREE.MeshPhongMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    const geoSphereMesh = new THREE.Mesh(geoSphereGeom, geoSphereMat);
    geographyMeshGroup.add(geoSphereMesh);

    const landCoords = [
      new THREE.Vector3(2.2, 2.0, 1.8),
      new THREE.Vector3(-2.4, 1.5, 2.0),
      new THREE.Vector3(1.2, -2.5, 1.9),
      new THREE.Vector3(-2.0, -1.8, -2.1),
      new THREE.Vector3(0.5, 2.8, -1.5),
      new THREE.Vector3(-1.8, 0.8, -2.6)
    ];
    const landGeom = new THREE.IcosahedronGeometry(0.45, 0);
    const landMat = new THREE.MeshPhongMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8 });

    landCoords.forEach((pos) => {
      const landNode = new THREE.Mesh(landGeom, landMat);
      landNode.position.copy(pos);
      geographyMeshGroup.add(landNode);
    });

    const equatorGeom = new THREE.TorusGeometry(4.2, 0.12, 16, 48);
    const equatorMat = new THREE.MeshPhongMaterial({ color: 0x00ffcc, emissive: 0x059669, emissiveIntensity: 0.9 });
    const equatorMesh = new THREE.Mesh(equatorGeom, equatorMat);
    equatorMesh.rotation.x = Math.PI * 0.45;
    geographyMeshGroup.add(equatorMesh);

    const geoLabel = createLabelSprite('Relief Topography', '#38bdf8');
    geoLabel.position.set(0, 4.2, 0);
    geographyMeshGroup.add(geoLabel);

    geographyMeshGroup.position.set(isMobileViewport ? 10 : 28, isMobileViewport ? -18 : -15, -5);

    // 5g. 3D History Monument Architectural Structure Group
    const historyMeshGroup = new THREE.Group();
    scene.add(historyMeshGroup);

    const base1Geom = new THREE.BoxGeometry(4.8, 0.6, 4.8);
    const baseMat = new THREE.MeshPhongMaterial({ color: 0xd97706, emissive: 0xb45309, emissiveIntensity: 0.7 });
    const base1 = new THREE.Mesh(base1Geom, baseMat);
    base1.position.y = -1.6;
    historyMeshGroup.add(base1);

    const base2Geom = new THREE.BoxGeometry(3.6, 0.6, 3.6);
    const base2 = new THREE.Mesh(base2Geom, baseMat);
    base2.position.y = -1.0;
    historyMeshGroup.add(base2);

    const pillarGeom = new THREE.CylinderGeometry(0.2, 0.25, 2.0, 12);
    const pillarMat = new THREE.MeshPhongMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.8 });
    const pPositions = [
      new THREE.Vector3(-1.4, 0.3, -1.4),
      new THREE.Vector3(1.4, 0.3, -1.4),
      new THREE.Vector3(-1.4, 0.3, 1.4),
      new THREE.Vector3(1.4, 0.3, 1.4)
    ];
    pPositions.forEach((pos) => {
      const pMesh = new THREE.Mesh(pillarGeom, pillarMat);
      pMesh.position.copy(pos);
      historyMeshGroup.add(pMesh);
    });

    const domeGeom = new THREE.SphereGeometry(1.3, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshPhongMaterial({ color: 0xc084fc, emissive: 0x7c3aed, emissiveIntensity: 0.85 });
    const domeMesh = new THREE.Mesh(domeGeom, domeMat);
    domeMesh.position.y = 1.3;
    historyMeshGroup.add(domeMesh);

    const chakraGeom = new THREE.TorusGeometry(3.6, 0.1, 12, 32);
    const chakraMat = new THREE.MeshPhongMaterial({ color: 0xfacc15, emissive: 0xd97706, emissiveIntensity: 0.9 });
    const chakraMesh = new THREE.Mesh(chakraGeom, chakraMat);
    chakraMesh.rotation.x = Math.PI * 0.35;
    historyMeshGroup.add(chakraMesh);

    const historyLabel = createLabelSprite('NCERT Architecture', '#fbbf24');
    historyLabel.position.set(0, 3.6, 0);
    historyMeshGroup.add(historyLabel);

    historyMeshGroup.position.set(isMobileViewport ? -10 : -28, isMobileViewport ? -18 : -15, -5);

    // 6. NCERT Floating Holographic Blueprint Diagram Meshes
    const diagramsGroup = new THREE.Group();
    scene.add(diagramsGroup);

    interface FloatingDiagram {
      mesh: THREE.Mesh;
      initialX: number;
      initialY: number;
      initialZ: number;
      rotSpeedY: number;
      floatSpeed: number;
      floatOffset: number;
      texture: THREE.CanvasTexture;
      geometry: THREE.PlaneGeometry;
      material: THREE.MeshBasicMaterial;
    }

    let floatingDiagrams: FloatingDiagram[] = [];

    // Helper to build authentic diagrams based on class & subject
    const rebuildDiagrams = (cls: string, subId: string) => {
      // Clean up previous diagrams
      floatingDiagrams.forEach((d) => {
        diagramsGroup.remove(d.mesh);
        d.geometry.dispose();
        d.texture.dispose();
        d.material.dispose();
      });
      floatingDiagrams = [];

      const isCurrentDark = document.documentElement.classList.contains('dark');
      const lowerSub = subId.toLowerCase();
      const isMaths = lowerSub.includes('math');
      const isChemistry = lowerSub.includes('chem');
      const isPhysics = lowerSub.includes('phys');
      const isBiology = lowerSub.includes('bio');
      const isHistory = lowerSub.includes('his') || lowerSub.includes('history') || lowerSub.includes('archaeology');
      const isGeography = lowerSub.includes('geo') || lowerSub.includes('geography') || lowerSub.includes('earth') || lowerSub.includes('map');
      const isSST =
        isHistory ||
        isGeography ||
        lowerSub.includes('sst') ||
        lowerSub.includes('social') ||
        lowerSub.includes('pol') ||
        lowerSub.includes('civic') ||
        lowerSub.includes('eco') ||
        lowerSub.includes('087');
      const isLanguage =
        lowerSub.includes('eng') ||
        lowerSub.includes('hin') ||
        lowerSub.includes('lang') ||
        lowerSub.includes('lit') ||
        lowerSub.includes('sansk') ||
        lowerSub.includes('grammar') ||
        lowerSub.includes('184') ||
        lowerSub.includes('002') ||
        lowerSub.includes('085') ||
        lowerSub.includes('301') ||
        lowerSub.includes('302');

      // Dynamic Ambient Particle Theme & Movement Speed Configuration per Subject
      let subjectSpeedMult = 1.0;
      let particleSize = 2.5;

      if (isNight) {
        // Warmer low-contrast night mode
        particlesMaterial.color.setHex(isCurrentDark ? 0xd97706 : 0xb45309);
        particlesMaterial.opacity = 0.55;
        particlesMaterial.size = 2.2;
        ambientLight.color.setHex(0xb45309);
        ambientLight.intensity = isCurrentDark ? 1.0 : 0.8;
        subjectSpeedMult = 0.65;
      } else if (isHistory) {
        // History: Warm Regal Gold & Amber Yellow (Slow majestic drift)
        particlesMaterial.color.setHex(isCurrentDark ? 0xfacc15 : 0xca8a04);
        particlesMaterial.opacity = isCurrentDark ? 0.95 : 0.85;
        particlesMaterial.size = 2.8;
        starMaterial.color.setHex(0xfef08a);
        ambientLight.color.setHex(0xeab308);
        ambientLight.intensity = isCurrentDark ? 1.4 : 1.1;
        pointLight1.color.setHex(0xf59e0b);
        pointLight1.intensity = 1.5;
        subjectSpeedMult = 0.7; // Majestic historical pace
      } else if (isGeography) {
        // Geography: Organic Lush Emerald & Earth Green (Steady natural flow)
        particlesMaterial.color.setHex(isCurrentDark ? 0x10b981 : 0x059669);
        particlesMaterial.opacity = isCurrentDark ? 0.9 : 0.8;
        particlesMaterial.size = 2.6;
        starMaterial.color.setHex(0xa7f3d0);
        ambientLight.color.setHex(0x10b981);
        ambientLight.intensity = isCurrentDark ? 1.3 : 1.0;
        pointLight1.color.setHex(0x34d399);
        pointLight1.intensity = 1.4;
        subjectSpeedMult = 0.9; // Steady organic earth flow
      } else if (isSST) {
        // General SST: Ancient Terracotta & Amber Bronze
        particlesMaterial.color.setHex(isCurrentDark ? 0xf59e0b : 0xd97706);
        particlesMaterial.opacity = isCurrentDark ? 0.85 : 0.75;
        particlesMaterial.size = 2.5;
        ambientLight.color.setHex(0xf59e0b);
        ambientLight.intensity = isCurrentDark ? 1.2 : 0.95;
        pointLight1.color.setHex(0xfbbf24);
        pointLight1.intensity = 1.3;
        subjectSpeedMult = 0.8;
      } else if (isMaths) {
        // Mathematics: Deep Cool Indigo & Electric Violet (Dynamic crisp pulse)
        particlesMaterial.color.setHex(isCurrentDark ? 0x818cf8 : 0x4f46e5);
        particlesMaterial.opacity = isCurrentDark ? 0.95 : 0.85;
        particlesMaterial.size = 2.9;
        starMaterial.color.setHex(0xc7d2fe);
        ambientLight.color.setHex(0x6366f1);
        ambientLight.intensity = isCurrentDark ? 1.45 : 1.15;
        pointLight1.color.setHex(0x818cf8);
        pointLight1.intensity = 1.6;
        subjectSpeedMult = 1.35; // Rapid mathematical calculations pulse
      } else if (isPhysics) {
        // Physics: Deep Electric Blue & Quantum Cyan (High-speed energy pulse)
        particlesMaterial.color.setHex(isCurrentDark ? 0x38bdf8 : 0x0284c7);
        particlesMaterial.opacity = isCurrentDark ? 0.95 : 0.85;
        particlesMaterial.size = 3.0;
        starMaterial.color.setHex(0xbae6fd);
        ambientLight.color.setHex(0x0284c7);
        ambientLight.intensity = isCurrentDark ? 1.5 : 1.2;
        pointLight1.color.setHex(0x38bdf8);
        pointLight1.intensity = 1.7;
        subjectSpeedMult = 1.4; // Quantum high-speed pulse
      } else if (isChemistry) {
        // Chemistry: Vivid Molecular Violet & Neon Magenta
        particlesMaterial.color.setHex(isCurrentDark ? 0xa855f7 : 0x7c3aed);
        particlesMaterial.opacity = isCurrentDark ? 0.9 : 0.8;
        particlesMaterial.size = 2.7;
        starMaterial.color.setHex(0xe9d5ff);
        ambientLight.color.setHex(0x9333ea);
        ambientLight.intensity = isCurrentDark ? 1.35 : 1.05;
        pointLight1.color.setHex(0xc084fc);
        pointLight1.intensity = 1.5;
        subjectSpeedMult = 1.15;
      } else if (isBiology) {
        // Biology: Bio-Teal & Cellular Cyan (Fluid organic wave)
        particlesMaterial.color.setHex(isCurrentDark ? 0x14b8a6 : 0x0d9488);
        particlesMaterial.opacity = isCurrentDark ? 0.9 : 0.8;
        particlesMaterial.size = 2.6;
        starMaterial.color.setHex(0x99f6e4);
        ambientLight.color.setHex(0x0d9488);
        ambientLight.intensity = isCurrentDark ? 1.3 : 1.0;
        pointLight1.color.setHex(0x2dd4bf);
        pointLight1.intensity = 1.4;
        subjectSpeedMult = 1.05;
      } else if (isLanguage) {
        // Languages: Royal Parchment Purple / Soft Lavender
        particlesMaterial.color.setHex(isCurrentDark ? 0xc084fc : 0x7c3aed);
        particlesMaterial.opacity = isCurrentDark ? 0.8 : 0.7;
        particlesMaterial.size = 2.4;
        starMaterial.color.setHex(0xf3e8ff);
        ambientLight.color.setHex(0x9333ea);
        ambientLight.intensity = isCurrentDark ? 1.1 : 0.9;
        pointLight1.color.setHex(0xa855f7);
        pointLight1.intensity = 1.2;
        subjectSpeedMult = 0.85;
      } else {
        // General Science & Default: Northern Lights Electric Cyan & Deep Space Blue
        particlesMaterial.color.setHex(isCurrentDark ? 0x22d3ee : 0x0284c7);
        particlesMaterial.opacity = isCurrentDark ? 0.9 : 0.8;
        particlesMaterial.size = 2.5;
        starMaterial.color.setHex(0xcffafe);
        ambientLight.color.setHex(isCurrentDark ? 0x38bdf8 : 0x0284c7);
        ambientLight.intensity = isCurrentDark ? 1.3 : 1.0;
        pointLight1.color.setHex(0x38bdf8);
        pointLight1.intensity = 1.4;
        subjectSpeedMult = 1.1;
      }

      // Store current subject speed multiplier for animate loop
      subjectSpeedRef.current = subjectSpeedMult;

      // Select diagrams according to Class and Subject
      const canvases: HTMLCanvasElement[] = [];

      // Toggle subject-specific 3D interactive models
      const isScienceOrSub = !isSST && !isLanguage && !isMaths;
      dnaMeshGroup.visible = isScienceOrSub;
      aiMeshGroup.visible = isScienceOrSub;
      mathMeshGroup.visible = isMaths;
      geographyMeshGroup.visible = isSST;
      historyMeshGroup.visible = isSST;

      if (isSST) {
        canvases.push(
          createGlobeGridDiagram(isCurrentDark),
          createAshokChakraDiagram(isCurrentDark),
          createHistoricalMonumentsDiagram(isCurrentDark),
          createGlobeGridDiagram(isCurrentDark)
        );
      } else if (isLanguage) {
        canvases.push(
          createFloatingAlphabetsDiagram(isCurrentDark),
          createQuillFountainPenDiagram(isCurrentDark),
          createOpenBookAuraDiagram(isCurrentDark),
          createFloatingAlphabetsDiagram(isCurrentDark)
        );
      } else if (isChemistry) {
        canvases.push(
          createDnaDoubleHelixDiagram(isCurrentDark),
          createAiNeuralNetworkDiagram(isCurrentDark),
          createBenzeneResonanceDiagram(isCurrentDark),
          createBohrAtomDiagram(isCurrentDark)
        );
      } else if (isPhysics) {
        canvases.push(
          createAiNeuralNetworkDiagram(isCurrentDark),
          createDnaDoubleHelixDiagram(isCurrentDark),
          createLensRayDiagram(isCurrentDark),
          createPrismDiagram(isCurrentDark)
        );
      } else if (isBiology) {
        canvases.push(
          createDnaDoubleHelixDiagram(isCurrentDark),
          createAiNeuralNetworkDiagram(isCurrentDark),
          createBohrAtomDiagram(isCurrentDark),
          createPrismDiagram(isCurrentDark)
        );
      } else if (isMaths) {
        if (cls === '9') {
          canvases.push(
            createSquareRootSpiralDiagram(isCurrentDark),
            createTrigonometryDiagram(isCurrentDark),
            createCircleTangentsDiagram(isCurrentDark),
            create3DVectorsDiagram(isCurrentDark)
          );
        } else if (cls === '10') {
          canvases.push(
            createCircleTangentsDiagram(isCurrentDark),
            createTrigonometryDiagram(isCurrentDark),
            createSquareRootSpiralDiagram(isCurrentDark),
            create3DVectorsDiagram(isCurrentDark)
          );
        } else {
          // 11 or 12 or others
          canvases.push(
            create3DVectorsDiagram(isCurrentDark),
            createTrigonometryDiagram(isCurrentDark),
            createCircleTangentsDiagram(isCurrentDark),
            createSquareRootSpiralDiagram(isCurrentDark)
          );
        }
      } else {
        // Science (9th or 10th or general)
        canvases.push(
          createDnaDoubleHelixDiagram(isCurrentDark),
          createAiNeuralNetworkDiagram(isCurrentDark),
          createHumanEyeDiagram(isCurrentDark),
          createPrismDiagram(isCurrentDark)
        );
      }

      // Non-overlapping Slot coordinates across 4 quadrants + center margins
      const isMobSlots = (container.clientWidth || window.innerWidth) < 768;
      const slots = isMobSlots ? [
        { x: 10, y: 20, z: -4, rotY: -0.15, rotX: -0.04, geomW: 11, geomH: 8.25 },
        { x: 0, y: 23, z: -5, rotY: 0, rotX: -0.05, geomW: 11, geomH: 8.25 },
        { x: -11, y: 0, z: -3, rotY: 0.12, rotX: -0.02, geomW: 10, geomH: 7.5 },
        { x: 11, y: 0, z: -3, rotY: -0.14, rotX: 0.02, geomW: 10, geomH: 7.5 }
      ] : [
        { x: 28, y: 16, z: -10, rotY: -0.2, rotX: -0.04, geomW: 16, geomH: 12 },
        { x: -2, y: 22, z: -12, rotY: 0.04, rotX: -0.05, geomW: 16, geomH: 12 },
        { x: -30, y: 0, z: -10, rotY: 0.16, rotX: -0.03, geomW: 15, geomH: 11.25 },
        { x: 30, y: 0, z: -10, rotY: -0.16, rotX: 0.03, geomW: 15, geomH: 11.25 }
      ];

      canvases.slice(0, 4).forEach((cv, idx) => {
        const slot = slots[idx];
        const texture = new THREE.CanvasTexture(cv);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const geom = new THREE.PlaneGeometry(slot.geomW, slot.geomH);
        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: isCurrentDark ? 0.88 : 0.82,
          side: THREE.DoubleSide,
          depthWrite: false,
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(slot.x, slot.y, slot.z);
        mesh.rotation.set(slot.rotX, slot.rotY, 0);

        diagramsGroup.add(mesh);

        floatingDiagrams.push({
          mesh,
          initialX: slot.x,
          initialY: slot.y,
          initialZ: slot.z,
          rotSpeedY: (idx % 2 === 0 ? 1 : -1) * 0.0008,
          floatSpeed: 0.0012 + idx * 0.0004,
          floatOffset: idx * 1.5,
          texture,
          geometry: geom,
          material: mat,
        });
      });
    };

    // Initial diagrams build
    rebuildDiagrams(classLevel, subjectId);

    // Reactive listener for subject / class change custom event
    const handleSubjectChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ classLevel?: string; subjectId?: string }>;
      if (customEvent.detail) {
        const newClass = customEvent.detail.classLevel || currentConfigRef.current.classLevel;
        const newSubject = customEvent.detail.subjectId || currentConfigRef.current.subjectId;
        currentConfigRef.current = { classLevel: newClass, subjectId: newSubject };
        rebuildDiagrams(newClass, newSubject);
      }
    };

    window.addEventListener('examcraft:subject_changed', handleSubjectChange);

    // 7. Interactive Mouse & Touch Movement Handlers
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.targetX = (event.clientX - window.innerWidth / 2) * 0.015;
      mouseRef.current.targetY = (event.clientY - window.innerHeight / 2) * 0.015;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches && event.touches.length > 0) {
        const touch = event.touches[0];
        mouseRef.current.targetX = (touch.clientX - window.innerWidth / 2) * 0.018;
        mouseRef.current.targetY = (touch.clientY - window.innerHeight / 2) * 0.018;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // 8. Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const isMob = w < 768;

      camera.aspect = w / h;
      camera.fov = isMob ? 70 : 60;
      camera.position.set(0, isMob ? 12 : 15, isMob ? 48 : 35);
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // 9. Animation Loop
    let count = 0;
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const subjectSpeed = subjectSpeedRef.current;
      count += 0.03 * subjectSpeed;

      // Smooth mouse damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Rotate camera gently based on mouse
      camera.position.x = mouseRef.current.x * 2.2;
      camera.position.y = 15 - mouseRef.current.y * 1.6;
      camera.lookAt(0, -2, 0);

      // Animate Particle Wave positions
      const posAttr = particlesGeometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      let idx = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          posArray[idx + 1] =
            Math.sin((ix + count) * 0.3) * 1.8 +
            Math.sin((iy + count) * 0.5) * 1.8 +
            Math.cos((ix + iy + count) * 0.2) * 0.8;

          idx += 3;
        }
      }
      posAttr.needsUpdate = true;

      // Animate Floating 3D Shapes
      floatingShapes.forEach((item) => {
        item.mesh.rotation.x += item.rotSpeedX;
        item.mesh.rotation.y += item.rotSpeedY;
        item.mesh.rotation.z += item.rotSpeedZ;

        item.mesh.position.y =
          item.initialY + Math.sin(count * item.floatSpeed * 20 + item.floatOffset) * 1.2;
      });

      // Animate Floating NCERT Blueprint Diagrams
      floatingDiagrams.forEach((diag) => {
        diag.mesh.rotation.y += diag.rotSpeedY;
        diag.mesh.position.y =
          diag.initialY + Math.sin(count * diag.floatSpeed * 20 + diag.floatOffset) * 1.4;
        diag.mesh.position.x =
          diag.initialX + Math.cos(count * diag.floatSpeed * 15 + diag.floatOffset) * 0.8;
      });

      // Apply controls state from controlsRef
      const {
        autoRotate: isAuto,
        rotSpeed: speedMult,
        modelScale: scaleVal,
        showLabels: labelsOn,
        manualRotY: rotYDeg
      } = controlsRef.current;

      const targetScale = scaleVal;
      const targetRotY = (rotYDeg * Math.PI) / 180;

      // Toggle label sprites visibility
      labelDisposables.forEach((item) => {
        item.material.visible = labelsOn;
      });

      // Apply Scale to all 3D mesh groups & diagrams
      dnaMeshGroup.scale.setScalar(targetScale);
      aiMeshGroup.scale.setScalar(targetScale);
      mathMeshGroup.scale.setScalar(targetScale);
      geographyMeshGroup.scale.setScalar(targetScale);
      historyMeshGroup.scale.setScalar(targetScale);
      diagramsGroup.scale.setScalar(targetScale);

      // Animate 3D Rotating Subject Mesh Groups
      if (dnaMeshGroup.visible) {
        if (isAuto) dnaMeshGroup.rotation.y += 0.012 * speedMult;
        dnaMeshGroup.rotation.x = Math.sin(count * 0.02) * 0.12;
      }
      if (aiMeshGroup.visible) {
        if (isAuto) aiMeshGroup.rotation.y -= 0.009 * speedMult;
        aiMeshGroup.rotation.z = Math.cos(count * 0.015) * 0.1;
      }
      if (mathMeshGroup.visible) {
        if (isAuto) mathMeshGroup.rotation.y += 0.014 * speedMult;
        mathMeshGroup.rotation.x = Math.sin(count * 0.02) * 0.15;
      }
      if (geographyMeshGroup.visible) {
        if (isAuto) geographyMeshGroup.rotation.y += 0.01 * speedMult;
        geographyMeshGroup.rotation.z = Math.cos(count * 0.015) * 0.1;
      }
      if (historyMeshGroup.visible) {
        if (isAuto) historyMeshGroup.rotation.y -= 0.008 * speedMult;
        historyMeshGroup.rotation.x = Math.sin(count * 0.015) * 0.08;
      }

      // Smoothly rotate the whole scene based on manual angle slider
      scene.rotation.y = targetRotY;

      // Slowly rotate star system
      starSystem.rotation.y = count * 0.0006;
      starSystem.rotation.x = Math.sin(count * 0.0003) * 0.04;

      // Slowly rotate shapes group
      shapesGroup.rotation.y = count * 0.002;

      try {
        renderer.render(scene, camera);
      } catch (err) {
        console.warn("Background render frame failed:", err);
      }
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('examcraft:subject_changed', handleSubjectChange);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      particlesGeometry.dispose();
      particlesMaterial.dispose();
      particleTexture.dispose();

      starGeometry.dispose();
      starMaterial.dispose();
      starTexture.dispose();

      geometries.forEach((g) => g.dispose());
      dnaSphereGeom.dispose();
      strand1Mat.dispose();
      strand2Mat.dispose();
      rungLineMat.dispose();
      aiNodeGeom.dispose();
      aiNodeMat.dispose();
      aiConnMat.dispose();

      mathIcosaGeom.dispose();
      mathIcosaMat.dispose();
      mathDodecaGeom.dispose();
      mathDodecaMat.dispose();
      mathRingGeom.dispose();
      mathRingMat.dispose();

      geoSphereGeom.dispose();
      geoSphereMat.dispose();
      landGeom.dispose();
      landMat.dispose();
      equatorGeom.dispose();
      equatorMat.dispose();

      base1Geom.dispose();
      base2Geom.dispose();
      baseMat.dispose();
      pillarGeom.dispose();
      pillarMat.dispose();
      domeGeom.dispose();
      domeMat.dispose();
      chakraGeom.dispose();
      chakraMat.dispose();

      labelDisposables.forEach((item) => {
        item.texture.dispose();
        item.material.dispose();
      });

      floatingDiagrams.forEach((d) => {
        d.geometry.dispose();
        d.texture.dispose();
        d.material.dispose();
      });

      renderer.dispose();
    };
  }, [enabled, classLevel, subjectId, isNight]);

  const handleReset = () => {
    setAutoRotate(true);
    setRotSpeed(1.0);
    setModelScale(1.0);
    setShowLabels(true);
    setManualRotY(0);
  };

  if (!enabled) return null;

  return (
    <>
      <div
        ref={mountRef}
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-100 transition-opacity duration-700"
        aria-hidden="true"
      />

      {/* Floating 3D Interactive Control Panel Overlay */}
      <div className="fixed bottom-4 right-4 z-30 pointer-events-auto flex flex-col items-end gap-2 font-sans select-none">
        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-950/40 hover:bg-slate-800/95 hover:border-cyan-400 transition-all text-xs font-semibold group cursor-pointer"
            title="Open NCERT 3D Model Studio Controls"
          >
            <Sliders className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
            <span>3D Model Studio</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        ) : (
          <div className="w-72 p-4 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-cyan-500/35 text-slate-100 shadow-2xl shadow-cyan-950/60 flex flex-col gap-3.5 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">NCERT 3D Studio</h4>
                  <p className="text-[10px] text-slate-400">Rotate, Scale & Label Controls</p>
                </div>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                title="Collapse Panel"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3 text-xs">
              {/* Play/Pause Auto-Rotate & Labels Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    autoRotate
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {autoRotate ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{autoRotate ? 'Auto-Rotate' : 'Paused'}</span>
                </button>

                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    showLabels
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {showLabels ? <Eye className="w-3.5 h-3.5 text-purple-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{showLabels ? 'Labels On' : 'Labels Off'}</span>
                </button>
              </div>

              {/* Rotation Speed Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">Rotation Speed</span>
                  <span className="text-cyan-400 font-mono font-semibold">{rotSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.5"
                  step="0.1"
                  value={rotSpeed}
                  onChange={(e) => setRotSpeed(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Manual Y Orientation Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">Angle Orientation</span>
                  <span className="text-cyan-400 font-mono font-semibold">{manualRotY}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={manualRotY}
                  onChange={(e) => setManualRotY(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Model Scale Zoom Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">3D Scale / Zoom</span>
                  <span className="text-cyan-400 font-mono font-semibold">{modelScale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.1"
                  value={modelScale}
                  onChange={(e) => setModelScale(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default View</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
