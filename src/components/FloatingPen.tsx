import React, { useEffect, useState, useRef } from 'react';

interface InkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  color: string;
}

export const FloatingPen: React.FC = () => {
  const [pos, setPos] = useState<{ x: number; y: number; rot: number; scale: number }>({
    x: typeof window !== 'undefined' ? window.innerWidth * 0.75 : 800,
    y: typeof window !== 'undefined' ? window.innerHeight * 0.15 : 150,
    rot: -12,
    scale: 0.9,
  });

  const [opacity, setOpacity] = useState<number>(1);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSnapped, setIsSnapped] = useState<boolean>(false);
  const [snapLabel, setSnapLabel] = useState<string | null>(null);

  // Refs for physics loop and state keeping
  const isDraggingRef = useRef<boolean>(false);
  const isPhysicsActiveRef = useRef<boolean>(false);
  const isBookmarkSnappedRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  // Canvas & Ink Trail Particles Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<InkParticle[]>([]);
  const lastTipPosRef = useRef<{ x: number; y: number } | null>(null);
  const canvasAnimFrameRef = useRef<number | null>(null);

  // Audio Context & Synthesizer Refs for tactile scribble sound
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const wasSnappedRef = useRef<boolean>(false);

  // Initialize Web Audio procedural scribble noise synth
  const initAudio = () => {
    if (typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        // Create 1-second white noise buffer for crisp paper/ink drag texture
        const bufferSize = ctx.sampleRate * 1;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 2600;
        bandpass.Q.value = 1.6;

        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 1200;

        const gain = ctx.createGain();
        gain.gain.value = 0;

        whiteNoise.connect(bandpass);
        bandpass.connect(highpass);
        highpass.connect(gain);
        gain.connect(ctx.destination);

        whiteNoise.start();

        gainNodeRef.current = gain;
        filterNodeRef.current = bandpass;
      }

      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch {
      // Graceful fallback if audio autoplay restricted
    }
  };

  // Play crisp snap chime sound on bookmark docking
  const playSnapSound = () => {
    if (typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1350, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {
      // Ignore audio catch
    }
  };

  // Stop ink scribble sound softly
  const stopScribbleSound = () => {
    if (gainNodeRef.current && audioCtxRef.current) {
      try {
        gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.06);
      } catch {
        // Ignore audio catch
      }
    }
  };

  // Calculate global Nib Tip coordinate in window space
  const calculateNibTip = (pX: number, pY: number, pRot: number, pScale: number) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const baseW = isMobile ? 90 : 120;
    const w = baseW * pScale;
    const h = w * 4; // aspect ratio 100x400

    const cx = pX + w / 2;
    const cy = pY + h / 2;

    const offX = 0;
    const offY = h * 0.46; // nib tip offset relative to center

    const rad = (pRot * Math.PI) / 180;
    const rotX = offX * Math.cos(rad) - offY * Math.sin(rad);
    const rotY = offX * Math.sin(rad) + offY * Math.cos(rad);

    return {
      x: cx + rotX,
      y: cy + rotY,
    };
  };

  // Spawn ink particle trail between previous and current nib tip positions
  const emitInkTrail = (pX: number, pY: number, pRot: number, pScale: number) => {
    const currentTip = calculateNibTip(pX, pY, pRot, pScale);

    if (!lastTipPosRef.current) {
      lastTipPosRef.current = currentTip;
      return;
    }

    const dx = currentTip.x - lastTipPosRef.current.x;
    const dy = currentTip.y - lastTipPosRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1.2) {
      const steps = Math.min(12, Math.ceil(dist / 2.5));
      const inkColors = ['#1e3a8a', '#2563eb', '#1d4ed8', '#0f172a', '#3b82f6'];

      for (let i = 0; i < steps; i++) {
        const interpX = lastTipPosRef.current.x + dx * (i / steps);
        const interpY = lastTipPosRef.current.y + dy * (i / steps);

        const particleCount = 1 + Math.floor(Math.random() * 2);

        for (let j = 0; j < particleCount; j++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.15 + Math.random() * 0.9;

          particlesRef.current.push({
            x: interpX + (Math.random() - 0.5) * 2.5,
            y: interpY + (Math.random() - 0.5) * 2.5,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 1.2 + Math.random() * 2.4,
            alpha: 0.8 + Math.random() * 0.2,
            maxLife: 30 + Math.floor(Math.random() * 35),
            life: 0,
            color: inkColors[Math.floor(Math.random() * inkColors.length)],
          });
        }
      }

      // Keep max particles array capped for 60fps performance
      if (particlesRef.current.length > 250) {
        particlesRef.current = particlesRef.current.slice(-250);
      }

      lastTipPosRef.current = currentTip;
    }
  };

  // React effect to emit ink particles whenever pen position updates
  useEffect(() => {
    if (isVisible) {
      emitInkTrail(pos.x, pos.y, pos.rot, pos.scale);
    }
  }, [pos, isVisible]);

  // Canvas render loop for fading ink particle trail
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const renderCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;

        const progress = p.life / p.maxLife;
        const currentAlpha = Math.max(0, p.alpha * (1 - progress));
        const currentSize = Math.max(0.3, p.size * (1 - progress * 0.35));

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife || currentAlpha <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      canvasAnimFrameRef.current = requestAnimationFrame(renderCanvas);
    };

    canvasAnimFrameRef.current = requestAnimationFrame(renderCanvas);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvasAnimFrameRef.current) cancelAnimationFrame(canvasAnimFrameRef.current);
    };
  }, []);

  const physicsState = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rot: -12,
    angularVel: 0,
    scale: 0.9,
  });

  const dragOffset = useRef({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0, time: 0 });

  // Helper to find nearby magnetic snap targets (screen edges or UI buttons/hotspots)
  const findSnapTarget = (currentX: number, currentY: number) => {
    const penWidth = 100;
    const penHeight = 150;
    const centerX = currentX + penWidth / 2;
    const centerY = currentY + penHeight / 3;

    const SNAP_DISTANCE = 85;

    // 1. Check UI Hotspots (Buttons, Key Action elements)
    if (typeof document !== 'undefined') {
      const hotspots = document.querySelectorAll(
        'button, a, [role="button"], input[type="submit"], .bookmark-hotspot'
      );

      for (let i = 0; i < hotspots.length; i++) {
        const el = hotspots[i] as HTMLElement;
        // Ignore pen itself or hidden elements
        if (el.closest('.fixed.top-0.left-0') || el.offsetWidth === 0) continue;

        const rect = el.getBoundingClientRect();
        // Check if hotspot is within visible viewport
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

        const hotspotX = rect.left + rect.width / 2;
        const hotspotY = rect.top + rect.height / 2;

        const dist = Math.hypot(centerX - hotspotX, centerY - hotspotY);

        if (dist < SNAP_DISTANCE) {
          // Bookmark snap near UI button
          const targetX = rect.right - 25;
          const targetY = rect.top - 35;
          const label = el.innerText?.slice(0, 18) || 'Action Button';
          return {
            x: targetX,
            y: targetY,
            rot: -22,
            scale: 0.85,
            label: `Bookmark: ${label.trim()}`,
            type: 'ui',
          };
        }
      }
    }

    // 2. Check Screen Edges
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // Left edge
    if (currentX < 50) {
      return {
        x: -25,
        y: Math.max(20, Math.min(screenH - penHeight - 20, currentY)),
        rot: 0,
        scale: 0.85,
        label: 'Left Edge Bookmark',
        type: 'edge',
      };
    }

    // Right edge
    if (currentX > screenW - penWidth - 30) {
      return {
        x: screenW - penWidth + 25,
        y: Math.max(20, Math.min(screenH - penHeight - 20, currentY)),
        rot: 0,
        scale: 0.85,
        label: 'Right Edge Bookmark',
        type: 'edge',
      };
    }

    // Top edge
    if (currentY < 35) {
      return {
        x: Math.max(20, Math.min(screenW - penWidth - 20, currentX)),
        y: -30,
        rot: 90,
        scale: 0.85,
        label: 'Header Bookmark',
        type: 'edge',
      };
    }

    return null;
  };

  // Update physicsState ref whenever pos updates initially from scroll
  useEffect(() => {
    if (!isDraggingRef.current && !isPhysicsActiveRef.current && !isBookmarkSnappedRef.current) {
      physicsState.current.x = pos.x;
      physicsState.current.y = pos.y;
      physicsState.current.rot = pos.rot;
      physicsState.current.scale = pos.scale;
    }
  }, [pos]);

  // Scroll listener when not dragging or trapped in physics/bookmark
  useEffect(() => {
    const stops = [
      { scrollRatio: 0.00, xRatio: 0.78, yRatio: 0.15, rot: -12, scale: 0.9, opacity: 1 },
      { scrollRatio: 0.20, xRatio: 0.82, yRatio: 0.35, rot: 15,  scale: 0.85, opacity: 1 },
      { scrollRatio: 0.45, xRatio: 0.15, yRatio: 0.50, rot: -35, scale: 1.0, opacity: 1 },
      { scrollRatio: 0.70, xRatio: 0.80, yRatio: 0.70, rot: 45,  scale: 0.75, opacity: 1 },
      { scrollRatio: 0.88, xRatio: 0.50, yRatio: 0.88, rot: 120, scale: 0.5, opacity: 0.6 },
      { scrollRatio: 1.00, xRatio: 0.50, yRatio: 0.95, rot: 180, scale: 0,   opacity: 0 }
    ];

    const updateTraveler = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setIsVisible(false);
        return;
      }

      // If user is currently dragging, falling or bookmarked, don't let scroll override
      if (isDraggingRef.current || isPhysicsActiveRef.current || isBookmarkSnappedRef.current) return;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const progress = Math.min(Math.max(currentScroll / (maxScroll || 1), 0), 1);

      let i = 0;
      while (i < stops.length - 1 && stops[i + 1].scrollRatio <= progress) {
        i++;
      }

      const start = stops[i];
      const end = stops[i >= stops.length - 1 ? stops.length - 1 : i + 1];

      let targetX = start.xRatio * window.innerWidth;
      let targetY = start.yRatio * window.innerHeight;
      let targetRot = start.rot;
      let targetScale = start.scale;
      let targetOpacity = start.opacity;

      if (i < stops.length - 1) {
        const segProgress = (progress - start.scrollRatio) / (end.scrollRatio - start.scrollRatio);
        targetX = (start.xRatio + (end.xRatio - start.xRatio) * segProgress) * window.innerWidth;
        targetY = (start.yRatio + (end.yRatio - start.yRatio) * segProgress) * window.innerHeight;
        targetRot = start.rot + (end.rot - start.rot) * segProgress;
        targetScale = start.scale + (end.scale - start.scale) * segProgress;
        targetOpacity = start.opacity + (end.opacity - start.opacity) * segProgress;
      }

      setPos({ x: targetX, y: targetY, rot: targetRot, scale: targetScale });
      setOpacity(targetOpacity);
      setIsVisible(targetOpacity > 0);
    };

    window.addEventListener('scroll', updateTraveler, { passive: true });
    window.addEventListener('resize', updateTraveler, { passive: true });
    updateTraveler();

    return () => {
      window.removeEventListener('scroll', updateTraveler);
      window.removeEventListener('resize', updateTraveler);
    };
  }, []);

  // Physics loop handler for natural fall & bounce after release
  const startGravityPhysics = (initialVx: number, initialVy: number) => {
    isPhysicsActiveRef.current = true;
    
    // Clamp initial launch velocities to reasonable values
    physicsState.current.vx = Math.max(-28, Math.min(28, initialVx));
    physicsState.current.vy = Math.max(-28, Math.min(28, initialVy));
    physicsState.current.angularVel = Math.max(-15, Math.min(15, initialVx * 0.8));

    // Calculate initial momentum magnitude from the drag release speed
    const initialSpeed = Math.hypot(initialVx, initialVy);
    let momentum = Math.min(1.0, initialSpeed / 12.0); // Momentum scalar between 0.0 and 1.0

    const gravity = 0.65; // Base gravity acceleration (px / frame^2)
    const bounce = 0.45;   // Elasticity / bounciness
    const friction = 0.985; // Air friction

    const step = () => {
      if (!isPhysicsActiveRef.current) return;

      const penWidth = 100;
      const penHeight = 160;
      const floorY = window.innerHeight - penHeight - 10;
      const maxX = window.innerWidth - penWidth - 10;

      // Momentum decreases gradually over time based on drag velocity air resistance
      momentum = Math.max(0, momentum * 0.95 - 0.008);

      // Gravity effect builds up smoothly as momentum decays, allowing an initial drift period
      const effectiveGravity = gravity * (1.0 - momentum * 0.6);

      // Apply velocity, momentum drift and gravity
      physicsState.current.vy += effectiveGravity;
      physicsState.current.vx *= (friction + momentum * 0.01); // Less drag during high momentum drift
      physicsState.current.x += physicsState.current.vx;
      physicsState.current.y += physicsState.current.vy;
      physicsState.current.rot += physicsState.current.angularVel;
      physicsState.current.angularVel *= 0.97;

      // Wall bounce checks
      if (physicsState.current.x < 10) {
        physicsState.current.x = 10;
        physicsState.current.vx = -physicsState.current.vx * bounce;
        momentum *= 0.5; // Wall impact absorbs momentum
      } else if (physicsState.current.x > maxX) {
        physicsState.current.x = maxX;
        physicsState.current.vx = -physicsState.current.vx * bounce;
        momentum *= 0.5; // Wall impact absorbs momentum
      }

      // Floor collision & bounce
      if (physicsState.current.y >= floorY) {
        physicsState.current.y = floorY;
        physicsState.current.vy = -physicsState.current.vy * bounce;
        physicsState.current.vx *= 0.7; // Friction on ground
        physicsState.current.angularVel *= 0.6;
        momentum = 0; // Ground impact depletes remaining drift momentum

        // If kinetic energy is very low, come to rest and hand control back to scroll
        if (Math.abs(physicsState.current.vy) < 0.8 && Math.abs(physicsState.current.vx) < 0.5) {
          isPhysicsActiveRef.current = false;
          physicsState.current.vy = 0;
          physicsState.current.vx = 0;
          setPos({
            x: physicsState.current.x,
            y: physicsState.current.y,
            rot: physicsState.current.rot,
            scale: physicsState.current.scale
          });
          return;
        }
      }

      setPos({
        x: physicsState.current.x,
        y: physicsState.current.y,
        rot: physicsState.current.rot,
        scale: physicsState.current.scale
      });

      animFrameRef.current = requestAnimationFrame(step);
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(step);
  };

  // Smooth spring snap animation into bookmark position
  const smoothSnapTo = (targetX: number, targetY: number, targetRot: number, targetScale: number) => {
    isPhysicsActiveRef.current = false;

    let stepCount = 0;
    const maxSteps = 14;

    const animateSnap = () => {
      stepCount++;
      const factor = 0.35; // Soft spring ease factor

      physicsState.current.x += (targetX - physicsState.current.x) * factor;
      physicsState.current.y += (targetY - physicsState.current.y) * factor;
      physicsState.current.rot += (targetRot - physicsState.current.rot) * factor;
      physicsState.current.scale += (targetScale - physicsState.current.scale) * factor;

      setPos({
        x: physicsState.current.x,
        y: physicsState.current.y,
        rot: physicsState.current.rot,
        scale: physicsState.current.scale,
      });

      if (stepCount < maxSteps) {
        animFrameRef.current = requestAnimationFrame(animateSnap);
      } else {
        physicsState.current.x = targetX;
        physicsState.current.y = targetY;
        physicsState.current.rot = targetRot;
        physicsState.current.scale = targetScale;
        setPos({ x: targetX, y: targetY, rot: targetRot, scale: targetScale });
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animateSnap);
  };

  // Drag start (Mouse / Touch)
  const handleDragStart = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    initAudio();

    // If previously snapped as a bookmark, un-snap on user drag pull
    isBookmarkSnappedRef.current = false;
    setIsSnapped(false);
    setSnapLabel(null);

    // Stop any ongoing physics animation frame
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    isPhysicsActiveRef.current = false;

    dragOffset.current = {
      x: clientX - physicsState.current.x,
      y: clientY - physicsState.current.y,
    };

    lastMousePos.current = {
      x: clientX,
      y: clientY,
      time: performance.now(),
    };
  };

  // Drag move (Mouse / Touch)
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;

    const now = performance.now();
    const dt = Math.max(1, now - lastMousePos.current.time);

    const rawX = clientX - dragOffset.current.x;
    const rawY = clientY - dragOffset.current.y;

    // Calculate velocity based on movement delta over time delta
    const vx = ((clientX - lastMousePos.current.x) / dt) * 16.6;
    const vy = ((clientY - lastMousePos.current.y) / dt) * 16.6;

    const speed = Math.hypot(vx, vy);

    // Audio feedback: Modulate procedural paper/ink scribble volume & pitch based on drag speed
    if (gainNodeRef.current && audioCtxRef.current) {
      const targetGain = Math.min(0.24, Math.max(0, (speed - 0.4) * 0.014));
      const currentTime = audioCtxRef.current.currentTime;
      gainNodeRef.current.gain.setTargetAtTime(targetGain, currentTime, 0.03);

      if (filterNodeRef.current) {
        const targetFreq = 2200 + Math.min(2800, speed * 120);
        filterNodeRef.current.frequency.setTargetAtTime(targetFreq, currentTime, 0.03);
      }
    }

    // Check for nearby magnetic snap hotspot or screen edge
    const snap = findSnapTarget(rawX, rawY);

    let renderX = rawX;
    let renderY = rawY;
    let renderRot = Math.max(-45, Math.min(45, vx * 1.5));
    let renderScale = 1.05;

    if (snap) {
      // Soft magnetic pull attraction towards the bookmark target
      renderX = rawX + (snap.x - rawX) * 0.45;
      renderY = rawY + (snap.y - rawY) * 0.45;
      renderRot = snap.rot;
      renderScale = 0.95;
      setIsSnapped(true);
      setSnapLabel(snap.label);

      if (!wasSnappedRef.current) {
        playSnapSound();
        wasSnappedRef.current = true;
      }
    } else {
      setIsSnapped(false);
      setSnapLabel(null);
      wasSnappedRef.current = false;
    }

    physicsState.current.vx = vx;
    physicsState.current.vy = vy;
    physicsState.current.x = renderX;
    physicsState.current.y = renderY;
    physicsState.current.rot = renderRot;
    physicsState.current.scale = renderScale;

    lastMousePos.current = { x: clientX, y: clientY, time: now };

    setPos({
      x: renderX,
      y: renderY,
      rot: renderRot,
      scale: renderScale,
    });
  };

  // Drag end -> Trigger Magnetic Bookmark Snap OR Gravity Physics
  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    // Fade out scribble audio smoothly
    stopScribbleSound();

    const snap = findSnapTarget(physicsState.current.x, physicsState.current.y);

    if (snap) {
      // Bookmark snap detected: softly snap into place and dock as bookmark
      isBookmarkSnappedRef.current = true;
      setIsSnapped(true);
      setSnapLabel(snap.label);
      playSnapSound();
      smoothSnapTo(snap.x, snap.y, snap.rot, snap.scale);
    } else {
      isBookmarkSnappedRef.current = false;
      setIsSnapped(false);
      setSnapLabel(null);
      // Launch into gravity physics with thrown velocity
      startGravityPhysics(physicsState.current.vx, physicsState.current.vy);
    }
  };

  // Setup global event listeners for mouse and touch drag move/up
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onMouseUp = () => handleDragEnd();

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handleDragEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* High-Performance Canvas for Fading Ink Particle Trail */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[9998] print:hidden"
      />

      {/* Floating Pen Element */}
      <div
        className={`fixed top-0 left-0 w-[90px] md:w-[120px] h-auto pointer-events-auto z-[9999] print:hidden select-none transition-shadow ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${pos.rot}deg) scale(${pos.scale})`,
        opacity: opacity,
        filter: isSnapped
          ? 'drop-shadow(0px 0px 14px rgba(245, 158, 11, 0.6)) drop-shadow(0px 18px 26px rgba(15, 23, 42, 0.45))'
          : isDragging
          ? 'drop-shadow(0px 22px 28px rgba(15, 23, 42, 0.45))'
          : 'drop-shadow(0px 14px 20px rgba(15, 23, 42, 0.35))',
        willChange: 'transform, opacity',
        touchAction: 'none',
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        handleDragStart(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      aria-hidden="true"
      title={isSnapped ? (snapLabel || 'Bookmarked!') : 'Drag and throw the pen!'}
    >
      {/* Magnetic Bookmark Snap Tooltip Badge */}
      {isSnapped && snapLabel && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500 text-stone-950 font-semibold text-[10px] px-2 py-0.5 rounded-full shadow-lg border border-amber-300 pointer-events-none animate-bounce">
          📌 {snapLabel}
        </div>
      )}

      <svg viewBox="0 0 100 400" className="w-full h-auto drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="penBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="nibGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* Main Pen Body / Barrel */}
        <path d="M42,20 L58,20 L57,300 L50,345 L43,300 Z" fill="url(#penBodyGrad)" stroke="#0f172a" strokeWidth="1" />
        
        {/* Cap Top & Clip */}
        <rect x="40" y="20" width="20" height="70" rx="3" fill="url(#penBodyGrad)" />
        <rect x="48" y="25" width="4" height="60" rx="2" fill="url(#goldGrad)" />
        <circle cx="50" cy="85" r="4" fill="url(#goldGrad)" />
        
        {/* Gold Band Rings */}
        <rect x="40" y="90" width="20" height="6" fill="url(#goldGrad)" />
        <rect x="42" y="295" width="16" height="5" fill="url(#goldGrad)" />

        {/* Fountain Pen Metallic Grip & Nib */}
        <path d="M44,300 L56,300 L54,345 L46,345 Z" fill="#334155" />
        <path d="M46,345 L54,345 L50,385 Z" fill="url(#nibGrad)" stroke="#1e293b" strokeWidth="0.5" />
        <path d="M48,345 L52,345 L50,378 Z" fill="url(#goldGrad)" />
        <line x1="50" y1="345" x2="50" y2="375" stroke="#0f172a" strokeWidth="1" />
        <circle cx="50" cy="362" r="1.5" fill="#0f172a" />
      </svg>
    </div>
  </>
);
};

