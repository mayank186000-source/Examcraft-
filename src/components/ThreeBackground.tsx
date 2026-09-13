import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
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
  createOpenBookAuraDiagram
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

  // Update current config ref
  useEffect(() => {
    currentConfigRef.current = { classLevel, subjectId, isNight };
  }, [classLevel, subjectId, isNight]);

  useEffect(() => {
    if (!enabled || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 15, 35);
    camera.lookAt(0, 0, 0);

    // 2. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
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
    scene.add(particleSystem);

    // 4b. Deep Space Twinkling Starfield
    const starCount = 350;
    const starPositions = new Float32Array(starCount * 3);
    for (let s = 0; s < starCount; s++) {
      starPositions[s * 3] = (Math.random() - 0.5) * 120;
      starPositions[s * 3 + 1] = (Math.random() - 0.5) * 60;
      starPositions[s * 3 + 2] = (Math.random() - 0.5) * 80 - 15;
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

      const posX = (Math.random() - 0.5) * 60;
      const posY = (Math.random() - 0.5) * 25 + 2;
      const posZ = (Math.random() - 0.5) * 35 - 5;

      mesh.position.set(posX, posY, posZ);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      const scale = 0.8 + Math.random() * 0.7;
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
      const isSST =
        lowerSub.includes('sst') ||
        lowerSub.includes('social') ||
        lowerSub.includes('his') ||
        lowerSub.includes('geo') ||
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

      // Adjust particle wave color and ambient glow based on subject & day/night mode
      if (isNight) {
        // Warmer low-contrast night mode
        particlesMaterial.color.setHex(isCurrentDark ? 0xd97706 : 0xb45309);
        particlesMaterial.opacity = 0.55;
        ambientLight.color.setHex(0xb45309);
        ambientLight.intensity = isCurrentDark ? 1.0 : 0.8;
      } else if (isMaths) {
        particlesMaterial.color.setHex(isCurrentDark ? 0x818cf8 : 0x4f46e5);
        ambientLight.color.setHex(0x6366f1);
      } else if (isChemistry) {
        particlesMaterial.color.setHex(isCurrentDark ? 0xa855f7 : 0x7c3aed);
        ambientLight.color.setHex(0x9333ea);
      } else if (isPhysics) {
        particlesMaterial.color.setHex(isCurrentDark ? 0x38bdf8 : 0x0284c7);
        ambientLight.color.setHex(0x0284c7);
      } else if (isSST) {
        // Social Science (SST): Ancient Bronze / Amber Gold
        particlesMaterial.color.setHex(isCurrentDark ? 0xf59e0b : 0xd97706);
        ambientLight.color.setHex(0xf59e0b);
      } else if (isLanguage) {
        // English / Hindi Literature: Royal Parchment Violet / Rose
        particlesMaterial.color.setHex(isCurrentDark ? 0xc084fc : 0x7c3aed);
        ambientLight.color.setHex(0x9333ea);
      } else {
        // Northern Lights Aurora / Cosmic Deep Space (Default & Science)
        particlesMaterial.color.setHex(isCurrentDark ? 0x22d3ee : 0x0284c7);
        ambientLight.color.setHex(isCurrentDark ? 0x38bdf8 : 0x0284c7);
      }

      // Select diagrams according to Class and Subject
      const canvases: HTMLCanvasElement[] = [];

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
      } else if (isChemistry) {
        canvases.push(
          createBenzeneResonanceDiagram(isCurrentDark),
          createBohrAtomDiagram(isCurrentDark),
          create3DVectorsDiagram(isCurrentDark),
          createPrismDiagram(isCurrentDark)
        );
      } else if (isPhysics) {
        canvases.push(
          create3DVectorsDiagram(isCurrentDark),
          createLensRayDiagram(isCurrentDark),
          createPrismDiagram(isCurrentDark),
          createHumanEyeDiagram(isCurrentDark)
        );
      } else {
        // Science (9th or 10th or general)
        if (cls === '9') {
          canvases.push(
            createBohrAtomDiagram(isCurrentDark),
            createPrismDiagram(isCurrentDark),
            createHumanEyeDiagram(isCurrentDark),
            createLensRayDiagram(isCurrentDark)
          );
        } else {
          // Class 10th Science
          canvases.push(
            createHumanEyeDiagram(isCurrentDark),
            createPrismDiagram(isCurrentDark),
            createLensRayDiagram(isCurrentDark),
            createBohrAtomDiagram(isCurrentDark)
          );
        }
      }

      // Slot positions spread around screen borders so they never block central content
      const slots = [
        { x: -24, y: 8, z: -8, rotY: 0.18, rotX: -0.05 },
        { x: 24, y: 11, z: -10, rotY: -0.2, rotX: -0.04 },
        { x: -22, y: -6, z: -6, rotY: 0.15, rotX: 0.04 },
        { x: 22, y: -4, z: -8, rotY: -0.16, rotX: 0.05 }
      ];

      canvases.slice(0, 4).forEach((cv, idx) => {
        const slot = slots[idx];
        const texture = new THREE.CanvasTexture(cv);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const geom = new THREE.PlaneGeometry(16, 12);
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

    // 7. Interactive Mouse Movement Handler
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.targetX = (event.clientX - window.innerWidth / 2) * 0.015;
      mouseRef.current.targetY = (event.clientY - window.innerHeight / 2) * 0.015;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 8. Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;

      camera.aspect = w / h;
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

      count += 0.03;

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

      // Slowly rotate star system
      starSystem.rotation.y = count * 0.0006;
      starSystem.rotation.x = Math.sin(count * 0.0003) * 0.04;

      // Slowly rotate shapes group
      shapesGroup.rotation.y = count * 0.002;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('examcraft:subject_changed', handleSubjectChange);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      particlesGeometry.dispose();
      particlesMaterial.dispose();
      particleTexture.dispose();

      starGeometry.dispose();
      starMaterial.dispose();
      starTexture.dispose();

      geometries.forEach((g) => g.dispose());

      floatingDiagrams.forEach((d) => {
        d.geometry.dispose();
        d.texture.dispose();
        d.material.dispose();
      });

      renderer.dispose();
    };
  }, [enabled, classLevel, subjectId, isNight]);

  if (!enabled) return null;

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-100 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
};
