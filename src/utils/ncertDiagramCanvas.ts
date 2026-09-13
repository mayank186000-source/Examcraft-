// Generates authentic CBSE/NCERT textbook diagrams as high-resolution canvas textures
// for 3D holographic background projection in Three.js

export interface DiagramInfo {
  id: string;
  title: string;
  category: 'science' | 'maths' | 'general';
  classLevel: string;
  canvas: HTMLCanvasElement;
}

// Helper to draw clean rounded rectangle
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Draw base blueprint card plate
function initCardCanvas(width = 600, height = 450, isDark = true): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Subtle translucent blueprint panel
  ctx.clearRect(0, 0, width, height);

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  if (isDark) {
    bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.72)');
    bgGrad.addColorStop(1, 'rgba(30, 41, 59, 0.60)');
  } else {
    bgGrad.addColorStop(0, 'rgba(248, 250, 252, 0.82)');
    bgGrad.addColorStop(1, 'rgba(226, 232, 240, 0.70)');
  }

  roundRect(ctx, 6, 6, width - 12, height - 12, 20);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Blueprint border
  ctx.lineWidth = 2;
  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.5)' : 'rgba(37, 99, 235, 0.4)';
  ctx.stroke();

  // Subtle grid lines inside card
  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(37, 99, 235, 0.06)';
  ctx.lineWidth = 1;
  const step = 30;
  for (let x = step; x < width - 12; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 12);
    ctx.lineTo(x, height - 12);
    ctx.stroke();
  }
  for (let y = step; y < height - 12; y += step) {
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.lineTo(width - 12, y);
    ctx.stroke();
  }

  return { canvas, ctx };
}

// Draw title and badge on diagram
function drawHeader(
  ctx: CanvasRenderingContext2D,
  title: string,
  badge: string,
  width: number,
  isDark: boolean
) {
  ctx.save();
  // Badge
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.15)';
  roundRect(ctx, 24, 20, 140, 26, 8);
  ctx.fill();
  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(37, 99, 235, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = isDark ? '#38bdf8' : '#1d4ed8';
  ctx.fillText(badge, 34, 38);

  // Title
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
  ctx.fillText(title, 180, 39);

  // Divider line
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 58);
  ctx.lineTo(width - 24, 58);
  ctx.stroke();

  ctx.restore();
}

// ==========================================
// 1. CLASS 10 SCIENCE: HUMAN EYE RAY DIAGRAM
// ==========================================
export function createHumanEyeDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, 'NCERT Human Eye Anatomy & Ray Focus', 'CLASS 10 • CH 11', 600, isDark);

  ctx.save();
  const cx = 330;
  const cy = 250;
  const r = 120;

  // Eyeball outline
  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI * 0.75, Math.PI * 0.75);
  ctx.stroke();

  // Cornea bulge
  ctx.beginPath();
  ctx.arc(cx - r + 30, cy, 55, Math.PI * 0.6, -Math.PI * 0.6, true);
  ctx.strokeStyle = isDark ? '#34d399' : '#059669';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Convex Lens
  ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.15)';
  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(cx - 50, cy, 18, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ciliary muscles
  ctx.fillStyle = isDark ? '#f59e0b' : '#d97706';
  roundRect(ctx, cx - 62, cy - 80, 24, 25, 6);
  ctx.fill();
  roundRect(ctx, cx - 62, cy + 55, 24, 25, 6);
  ctx.fill();

  // Retina surface (glowing inner arc)
  ctx.strokeStyle = isDark ? '#fb7185' : '#e11d48';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, -Math.PI * 0.35, Math.PI * 0.35);
  ctx.stroke();

  // Optic nerve tunnel
  ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(241, 245, 249, 0.95)';
  ctx.beginPath();
  ctx.moveTo(cx + r - 15, cy - 15);
  ctx.lineTo(cx + r + 35, cy - 22);
  ctx.lineTo(cx + r + 35, cy + 22);
  ctx.lineTo(cx + r - 15, cy + 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Optical axis & Light rays converging on retina
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.4)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(50, cy);
  ctx.lineTo(cx + r, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Incident parallel light rays
  ctx.strokeStyle = '#eab308'; // Golden ray
  ctx.lineWidth = 2;
  const focalPointX = cx + r - 10;
  const focalPointY = cy;

  // Ray 1 (Top)
  ctx.beginPath();
  ctx.moveTo(60, cy - 40);
  ctx.lineTo(cx - 50, cy - 35);
  ctx.lineTo(focalPointX, focalPointY);
  ctx.stroke();

  // Ray 2 (Bottom)
  ctx.beginPath();
  ctx.moveTo(60, cy + 40);
  ctx.lineTo(cx - 50, cy + 35);
  ctx.lineTo(focalPointX, focalPointY);
  ctx.stroke();

  // Focal point dot on retina
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(focalPointX, focalPointY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Annotations & Labels
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#94a3b8' : '#334155';
  ctx.fillText('Cornea', cx - 120, cy - 70);
  ctx.fillText('Crystalline Lens', cx - 40, cy - 90);
  ctx.fillText('Retina (Screen)', cx + 45, cy - 105);
  ctx.fillText('Optic Nerve', cx + 75, cy + 35);
  ctx.fillText('Sharp Image Formation (f)', focalPointX - 140, cy + 35);

  ctx.restore();
  return canvas;
}

// =======================================================
// 2. CLASS 10 SCIENCE: PRISM LIGHT DISPERSION (VIBGYOR)
// =======================================================
export function createPrismDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, 'Dispersion of White Light by Glass Prism', 'CLASS 10 • CH 11', 600, isDark);

  ctx.save();
  // Prism vertices
  const pA = { x: 260, y: 120 };
  const pB = { x: 140, y: 340 };
  const pC = { x: 380, y: 340 };

  // Glass Prism Fill & Outline
  const prismGrad = ctx.createLinearGradient(pA.x, pA.y, pC.x, pC.y);
  prismGrad.addColorStop(0, isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(59, 130, 246, 0.15)');
  prismGrad.addColorStop(1, isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(147, 51, 234, 0.15)');

  ctx.fillStyle = prismGrad;
  ctx.strokeStyle = isDark ? '#38bdf8' : '#2563eb';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pA.x, pA.y);
  ctx.lineTo(pB.x, pB.y);
  ctx.lineTo(pC.x, pC.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // White Light Ray entering
  ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(40, 270);
  const entryPt = { x: 195, y: 240 };
  ctx.lineTo(entryPt.x, entryPt.y);
  ctx.stroke();

  // Label White Light
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.fillText('White Light Beam', 50, 255);

  // Rainbow VIBGYOR Spectrum colors & exit paths
  const colors = [
    { name: 'Red', hex: '#ef4444', exitY: 220, endY: 170 },
    { name: 'Orange', hex: '#f97316', exitY: 230, endY: 195 },
    { name: 'Yellow', hex: '#eab308', exitY: 240, endY: 220 },
    { name: 'Green', hex: '#10b981', exitY: 250, endY: 245 },
    { name: 'Blue', hex: '#06b6d4', exitY: 260, endY: 270 },
    { name: 'Indigo', hex: '#6366f1', exitY: 270, endY: 295 },
    { name: 'Violet', hex: '#a855f7', exitY: 280, endY: 320 }
  ];

  const exitX = 325;
  const screenX = 520;

  colors.forEach((col) => {
    // Inside ray from entry to right surface
    ctx.strokeStyle = col.hex;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(entryPt.x, entryPt.y);
    ctx.lineTo(exitX, col.exitY);
    ctx.stroke();

    // Dispersed ray exiting onto spectrum screen
    ctx.beginPath();
    ctx.moveTo(exitX, col.exitY);
    ctx.lineTo(screenX, col.endY);
    ctx.stroke();

    // Color tag
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillStyle = col.hex;
    ctx.fillText(col.name, screenX + 10, col.endY + 4);
  });

  // Screen line
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(screenX + 5, 150);
  ctx.lineTo(screenX + 5, 340);
  ctx.stroke();

  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#38bdf8' : '#1d4ed8';
  ctx.fillText('Spectrum (VIBGYOR)', 420, 365);
  ctx.fillText('Glass Prism (Refractive Index n)', 170, 375);

  ctx.restore();
  return canvas;
}

// ==========================================================
// 3. CLASS 10 SCIENCE: CONVEX LENS RAY FORMATION (NCERT CH 10)
// ==========================================================
export function createLensRayDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, 'Convex Lens Image Formation (Beyond 2F1)', 'CLASS 10 • CH 10', 600, isDark);

  ctx.save();
  const cy = 240;
  const cx = 300;

  // Principal Axis
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, cy);
  ctx.lineTo(560, cy);
  ctx.stroke();

  // Convex Lens
  ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.15)';
  ctx.strokeStyle = isDark ? '#38bdf8' : '#2563eb';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 14, 110, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Focal points & labels
  const f = 75;
  const points = [
    { label: '2F1', x: cx - 2 * f },
    { label: 'F1', x: cx - f },
    { label: 'O', x: cx },
    { label: 'F2', x: cx + f },
    { label: '2F2', x: cx + 2 * f }
  ];

  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
  points.forEach((pt) => {
    // Dot
    ctx.beginPath();
    ctx.arc(pt.x, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(pt.label, pt.x - 10, cy + 20);
  });

  // Object AB beyond 2F1
  const objX = cx - 2 * f - 45;
  const objHeight = 70;
  ctx.strokeStyle = '#10b981'; // Emerald object
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(objX, cy);
  ctx.lineTo(objX, cy - objHeight);
  ctx.stroke();

  // Arrow head on object
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.moveTo(objX, cy - objHeight);
  ctx.lineTo(objX - 6, cy - objHeight + 10);
  ctx.lineTo(objX + 6, cy - objHeight + 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillText('Object (AB)', objX - 30, cy - objHeight - 8);

  // Ray 1: Parallel to Principal Axis -> Passes through F2
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(objX, cy - objHeight);
  ctx.lineTo(cx, cy - objHeight);
  ctx.lineTo(cx + 2 * f + 20, cy + 50);
  ctx.stroke();

  // Ray 2: Passes through Optical Center O undeflected
  ctx.strokeStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(objX, cy - objHeight);
  ctx.lineTo(cx + 2 * f + 20, cy + 50);
  ctx.stroke();

  // Intersection: Real & Inverted Image A'B' between F2 and 2F2
  const imgX = cx + f + 35;
  const imgHeight = 46;
  ctx.strokeStyle = '#ef4444'; // Red image
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(imgX, cy);
  ctx.lineTo(imgX, cy + imgHeight);
  ctx.stroke();

  // Arrow head for inverted image
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(imgX, cy + imgHeight);
  ctx.lineTo(imgX - 6, cy + imgHeight - 10);
  ctx.lineTo(imgX + 6, cy + imgHeight - 10);
  ctx.closePath();
  ctx.fill();

  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#f87171' : '#b91c1c';
  ctx.fillText("Real, Inverted Image (A'B')", imgX - 40, cy + imgHeight + 22);

  ctx.restore();
  return canvas;
}

// ========================================================
// 4. CLASS 10 MATHS: CIRCLE WITH TANGENTS FROM EXT POINT (CH 10)
// ========================================================
export function createCircleTangentsDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, 'Tangents from External Point are Equal (PA = PB)', 'CLASS 10 MATHS • CH 10', 600, isDark);

  ctx.save();
  const ox = 380;
  const oy = 240;
  const r = 90;

  // Circle
  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(ox, oy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Center O
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.beginPath();
  ctx.arc(ox, oy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('O (Center)', ox + 8, oy + 5);

  // External point P
  const px = 100;
  const py = 240;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText('P (External)', px - 85, py + 5);

  // Tangency points A and B
  // Distance d = ox - px = 280. sin(theta) = r / d = 90 / 280 ~ 0.3214 -> theta ~ 18.7 deg
  const d = Math.sqrt((ox - px) ** 2 + (oy - py) ** 2);
  const alpha = Math.asin(r / d);
  const tangentLen = Math.sqrt(d * d - r * r);

  // Tangent point A (Top)
  const ax = ox - r * Math.sin(alpha);
  const ay = oy - r * Math.cos(alpha);

  // Tangent point B (Bottom)
  const bx = ox - r * Math.sin(alpha);
  const by = oy + r * Math.cos(alpha);

  // Tangent lines PA and PB
  ctx.strokeStyle = '#10b981'; // Emerald tangent lines
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(ax, ay);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(bx, by);
  ctx.stroke();

  // Radii OA and OB (Perpendicular to tangents)
  ctx.strokeStyle = isDark ? '#fb7185' : '#e11d48';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ax, ay);
  ctx.moveTo(ox, oy);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.setLineDash([]);

  // Right angle markers at A and B (90 deg theorem)
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = '#ef4444';
  ctx.fillText('90°', ax + 4, ay + 15);
  ctx.fillText('90°', bx + 4, by - 5);

  // Point A and B dots & labels
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.beginPath();
  ctx.arc(ax, ay, 4, 0, Math.PI * 2);
  ctx.arc(bx, by, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText('A (Point of Contact)', ax - 45, ay - 12);
  ctx.fillText('B (Point of Contact)', bx - 45, by + 22);

  // Line OP (Line joining center to point)
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(ox, oy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Result Badge
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#38bdf8' : '#1d4ed8';
  ctx.fillText('Theorem 10.2: Length of Tangents PA = PB', 130, 390);

  ctx.restore();
  return canvas;
}

// ========================================================
// 5. CLASS 10 MATHS: TRIGONOMETRY RIGHT TRIANGLE RATIOS
// ========================================================
export function createTrigonometryDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, 'Trigonometric Ratios & Right Triangle', 'CLASS 10 MATHS • CH 8', 600, isDark);

  ctx.save();
  const ax = 120;
  const ay = 330;
  const bx = 380;
  const by = 330;
  const cx = 380;
  const cy = 130;

  // Triangle Fill
  ctx.fillStyle = isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)';
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();

  // Triangle Strokes
  ctx.strokeStyle = isDark ? '#818cf8' : '#4f46e5';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Right Angle Box at B
  ctx.strokeStyle = isDark ? '#f43f5e' : '#e11d48';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx - 22, by);
  ctx.lineTo(bx - 22, by - 22);
  ctx.lineTo(bx, by - 22);
  ctx.stroke();

  // Angle theta arc at A
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(ax, ay, 45, -Math.atan2(ay - cy, bx - ax), 0);
  ctx.stroke();

  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('θ', ax + 55, ay - 12);

  // Vertex Labels
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.fillText('A', ax - 20, ay + 10);
  ctx.fillText('B (90°)', bx + 10, by + 10);
  ctx.fillText('C', cx + 10, cy - 5);

  // Side Labels
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.fillText('Base (Adjacent) = b', 200, by + 24);

  ctx.fillStyle = isDark ? '#34d399' : '#059669';
  ctx.fillText('Perpendicular (Opposite) = p', cx + 15, 235);

  ctx.fillStyle = isDark ? '#f43f5e' : '#e11d48';
  ctx.fillText('Hypotenuse (h) = √(b² + p²)', 160, 205);

  // Trigonometric Formulas Table
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = isDark ? '#cbd5e1' : '#1e293b';
  ctx.fillText('sin θ = p / h', 430, 170);
  ctx.fillText('cos θ = b / h', 430, 200);
  ctx.fillText('tan θ = p / b', 430, 230);
  ctx.fillText('cosec θ = h / p', 430, 260);
  ctx.fillText('sec θ = h / b', 430, 290);
  ctx.fillText('cot θ = b / p', 430, 320);

  // Identity
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillStyle = '#10b981';
  ctx.fillText('sin²θ + cos²θ = 1   •   1 + tan²θ = sec²θ', 120, 395);

  ctx.restore();
  return canvas;
}

// ========================================================
// 6. CLASS 9 SCIENCE: BOHR ATOMIC MODEL WITH ELECTRON SHELLS
// ========================================================
export function createBohrAtomDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, "Bohr's Model of Atom (K, L, M Shells)", 'CLASS 9 SCIENCE • CH 4', 600, isDark);

  ctx.save();
  const cx = 300;
  const cy = 250;

  // Concentric Electron Shells
  const shells = [
    { name: 'K Shell (n=1, 2e⁻)', r: 50, electrons: 2, color: '#38bdf8' },
    { name: 'L Shell (n=2, 8e⁻)', r: 90, electrons: 8, color: '#10b981' },
    { name: 'M Shell (n=3, 18e⁻)', r: 130, electrons: 8, color: '#a855f7' }
  ];

  // Draw Nucleus
  const nucGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
  nucGrad.addColorStop(0, '#f43f5e');
  nucGrad.addColorStop(1, '#be123c');
  ctx.fillStyle = nucGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('+ Nucleus', cx - 26, cy + 4);

  // Orbit Rings
  shells.forEach((sh) => {
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, sh.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Electrons along orbit
    for (let e = 0; e < sh.electrons; e++) {
      const angle = (e / sh.electrons) * Math.PI * 2;
      const ex = cx + sh.r * Math.cos(angle);
      const ey = cy + sh.r * Math.sin(angle);

      ctx.fillStyle = sh.color;
      ctx.beginPath();
      ctx.arc(ex, ey, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // e- symbol
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('e⁻', ex - 4, ey + 3);
    }
  });

  // Legend
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.fillText('K Shell (n=1)', 40, 360);
  ctx.fillStyle = isDark ? '#10b981' : '#059669';
  ctx.fillText('L Shell (n=2)', 180, 360);
  ctx.fillStyle = isDark ? '#a855f7' : '#7e22ce';
  ctx.fillText('M Shell (n=3)', 320, 360);

  ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
  ctx.fillText('Max Electrons = 2n² (Bohr-Bury Rule)', 40, 395);

  ctx.restore();
  return canvas;
}

// ========================================================
// 7. CLASS 9 MATHS: SQUARE ROOT SPIRAL (CH 1 NUMBER SYSTEMS)
// ========================================================
export function createSquareRootSpiralDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, 'Square Root Spiral (Irrational Numbers √2, √3...)', 'CLASS 9 MATHS • CH 1', 600, isDark);

  ctx.save();
  const ox = 250;
  const oy = 260;
  const unit = 65;

  // Base segment (0 to 1)
  let currentX = ox + unit;
  let currentY = oy;

  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(currentX, currentY);
  ctx.stroke();

  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.fillText('O', ox - 18, oy + 5);
  ctx.fillText('1', ox + unit / 2 - 4, oy + 18);

  const colors = ['#f59e0b', '#10b981', '#a855f7', '#ec4899', '#06b6d4', '#e11d48'];
  const labels = ['√2', '√3', '√4=2', '√5', '√6', '√7'];

  let angle = 0;

  for (let step = 0; step < 6; step++) {
    const hypLen = unit * Math.sqrt(step + 2);
    // Perpendicular angle
    const perpAngle = angle + Math.PI / 2;
    const nextAngle = angle + Math.atan(1 / Math.sqrt(step + 1));

    const nextX = ox + hypLen * Math.cos(nextAngle);
    const nextY = oy - hypLen * Math.sin(nextAngle);

    // Draw unit perpendicular
    ctx.strokeStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(currentX, currentY);
    ctx.lineTo(nextX, nextY);
    ctx.stroke();

    // Draw Hypotenuse from O
    ctx.strokeStyle = colors[step % colors.length];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(nextX, nextY);
    ctx.stroke();

    // Label
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillStyle = colors[step % colors.length];
    ctx.fillText(labels[step], (ox + nextX) / 2 + 6, (oy + nextY) / 2);

    currentX = nextX;
    currentY = nextY;
    angle = nextAngle;
  }

  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#38bdf8' : '#1d4ed8';
  ctx.fillText('Pythagoras Theorem: Hypotenuse = √(Base² + 1²)', 100, 395);

  ctx.restore();
  return canvas;
}

// ==============================================================
// 8. CLASS 11/12 PHYSICS & MATHS: 3D VECTORS & FIELD LINES
// ==============================================================
export function create3DVectorsDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, '3D Spatial Coordinate System (î, ĵ, k̂)', 'CLASS 11/12 • VECTORS', 600, isDark);

  ctx.save();
  const ox = 280;
  const oy = 260;

  // X axis (angled down-left)
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox - 140, oy + 90);
  ctx.stroke();
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillStyle = '#ef4444';
  ctx.fillText('X (î)', ox - 165, oy + 105);

  // Y axis (horizontal right)
  ctx.strokeStyle = '#10b981';
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + 200, oy);
  ctx.stroke();
  ctx.fillStyle = '#10b981';
  ctx.fillText('Y (ĵ)', ox + 210, oy + 5);

  // Z axis (vertical up)
  ctx.strokeStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox, oy - 150);
  ctx.stroke();
  ctx.fillStyle = '#3b82f6';
  ctx.fillText('Z (k̂)', ox - 10, oy - 160);

  // Position vector r = xi + yj + zk
  const px = ox + 110;
  const py = oy - 80;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(px, py);
  ctx.stroke();

  // Vector Arrow
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(px, py, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('P(x, y, z) • r⃗ = xî + yĵ + zk̂', px + 12, py - 4);

  // Magnitude Formula
  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = isDark ? '#38bdf8' : '#1d4ed8';
  ctx.fillText('|r⃗| = √(x² + y² + z²)', 170, 395);

  ctx.restore();
  return canvas;
}

// ==============================================================
// 9. CLASS 11/12 CHEMISTRY: BENZENE RESONANCE & ORBITALS
// ==============================================================
export function createBenzeneResonanceDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, 'Benzene Resonance Hybrid (C6H6 - sp² Hybridization)', 'CHEMISTRY • CH 12', 600, isDark);

  ctx.save();
  const drawHex = (cx: number, cy: number, r: number, withCircle = false) => {
    ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 6;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    if (withCircle) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  drawHex(160, 240, 65, false);
  // Alternating double bonds
  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(160, 240, 52, 0, Math.PI / 3);
  ctx.stroke();

  // Double-headed resonance arrow
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillStyle = '#a855f7';
  ctx.fillText('⟷', 270, 248);

  // Resonance hybrid
  drawHex(420, 240, 65, true);

  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
  ctx.fillText('Kekulé Structure I', 110, 335);
  ctx.fillText('Resonance Hybrid (Delocalized π-Cloud)', 300, 335);

  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#34d399' : '#059669';
  ctx.fillText('Planar Ring • C-C Bond Length 139 pm • All Angles 120°', 110, 395);

  ctx.restore();
  return canvas;
}

// ==============================================================
// 10. SOCIAL SCIENCE (SST): GLOBE GRID LINES & LATITUDE/LONGITUDE
// ==============================================================
export function createGlobeGridDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, 'Globe Grid System (Latitudes & Longitudes)', 'GEOGRAPHY • CLASS 6-10', 600, isDark);

  ctx.save();
  const cx = 300;
  const cy = 240;
  const radius = 120;

  // Globe sphere outer outline
  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Glow fill
  const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
  glow.addColorStop(0, isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fill();

  // Equator 0° (Highlighted)
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Tropics (23.5° N & S)
  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(2, 132, 199, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  // Tropic of Cancer
  ctx.beginPath();
  ctx.ellipse(cx, cy - 50, radius * 0.9, radius * 0.25, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Tropic of Capricorn
  ctx.beginPath();
  ctx.ellipse(cx, cy + 50, radius * 0.9, radius * 0.25, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Prime Meridian 0°
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius * 0.4, radius, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Axis Line N-S
  ctx.strokeStyle = isDark ? '#e2e8f0' : '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 20);
  ctx.lineTo(cx, cy + radius + 20);
  ctx.stroke();

  // Poles Labels
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
  ctx.fillText('N. Pole (90°N)', cx - 35, cy - radius - 25);
  ctx.fillText('S. Pole (90°S)', cx - 35, cy + radius + 35);

  // Axis Labels
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('Equator (0°)', cx + radius + 10, cy + 4);

  ctx.fillStyle = '#10b981';
  ctx.fillText('Prime Meridian (0°)', cx - 120, cy - radius - 5);

  ctx.fillStyle = isDark ? '#34d399' : '#059669';
  ctx.fillText('Tropic of Cancer (23.5° N)', cx + radius - 20, cy - 50);
  ctx.fillText('Tropic of Capricorn (23.5° S)', cx + radius - 20, cy + 55);

  ctx.restore();
  return canvas;
}

// ==============================================================
// 11. SOCIAL SCIENCE (SST): HISTORICAL MONUMENTS & TIMELINE
// ==============================================================
export function createHistoricalMonumentsDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, 'Indian Heritage & Monument Wireframe', 'HISTORY • CLASS 6-12', 600, isDark);

  ctx.save();
  const cx = 300;
  const baseY = 320;

  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 2;

  // Base Pedestal
  ctx.strokeRect(cx - 160, baseY, 320, 16);
  ctx.strokeRect(cx - 140, baseY - 16, 280, 16);

  // Pillars left & right
  ctx.strokeRect(cx - 120, baseY - 150, 35, 134);
  ctx.strokeRect(cx + 85, baseY - 150, 35, 134);

  // Central Arch (India Gate / Ancient Gateway wireframe)
  ctx.beginPath();
  ctx.moveTo(cx - 85, baseY - 16);
  ctx.lineTo(cx - 85, baseY - 120);
  ctx.arc(cx, baseY - 120, 85, Math.PI, 0, false);
  ctx.lineTo(cx + 85, baseY - 16);
  ctx.stroke();

  // Arch Inner Line
  ctx.beginPath();
  ctx.moveTo(cx - 65, baseY - 16);
  ctx.lineTo(cx - 65, baseY - 110);
  ctx.arc(cx, baseY - 110, 65, Math.PI, 0, false);
  ctx.lineTo(cx + 65, baseY - 16);
  ctx.stroke();

  // Upper Entablature & Dome / Roof
  ctx.strokeRect(cx - 150, baseY - 180, 300, 30);
  ctx.beginPath();
  ctx.arc(cx, baseY - 180, 90, Math.PI, 0);
  ctx.stroke();

  // Top Finial
  ctx.beginPath();
  ctx.moveTo(cx, baseY - 270);
  ctx.lineTo(cx, baseY - 290);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, baseY - 295, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();

  // Timeline markers below
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(71, 85, 105, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 385);
  ctx.lineTo(540, 385);
  ctx.stroke();

  const eras = [
    { year: '2500 BCE', label: 'Indus Valley' },
    { year: '250 BCE', label: 'Mauryan Era' },
    { year: '1500 CE', label: 'Mughal Architecture' },
    { year: '1931 CE', label: 'Modern Heritage' },
  ];

  eras.forEach((item, idx) => {
    const x = 90 + idx * 140;
    ctx.beginPath();
    ctx.arc(x, 385, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();

    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.fillText(item.year, x - 24, 402);
    ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
    ctx.fillText(item.label, x - 30, 416);
  });

  ctx.restore();
  return canvas;
}

// ==============================================================
// 12. SOCIAL SCIENCE (SST): CONSTITUTION ASHOK CHAKRA MOTIF
// ==============================================================
export function createAshokChakraDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, 'Ashoka Chakra (24-Spoke Wheel of Law)', 'CIVICS & CONSTITUTION', 600, isDark);

  ctx.save();
  const cx = 300;
  const cy = 230;
  const outerR = 115;
  const innerR = 18;

  // Navy Blue Chakra Theme
  const chakraColor = '#1d4ed8'; // Deep Navy Royal Blue

  // Outer Circle
  ctx.strokeStyle = chakraColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.stroke();

  // Inner Circle
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.stroke();

  // Center Hub Point
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = chakraColor;
  ctx.fill();

  // 24 Spokes
  for (let i = 0; i < 24; i++) {
    const angle = (i * Math.PI * 2) / 24;
    const x1 = cx + innerR * Math.cos(angle);
    const y1 = cy + innerR * Math.sin(angle);
    const x2 = cx + outerR * Math.cos(angle);
    const y2 = cy + outerR * Math.sin(angle);

    ctx.strokeStyle = chakraColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Spoke triangular accent
    const halfAngle = angle + (Math.PI / 24) * 0.4;
    const xMid = cx + (outerR * 0.55) * Math.cos(halfAngle);
    const yMid = cy + (outerR * 0.55) * Math.sin(halfAngle);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(xMid, yMid);
    ctx.lineTo(x2, y2);
    ctx.fillStyle = isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(29, 78, 216, 0.25)';
    ctx.fill();
  }

  // Outer decorative dots (24 dots)
  for (let i = 0; i < 24; i++) {
    const angle = (i * Math.PI * 2) / 24 + Math.PI / 24;
    const x = cx + (outerR + 10) * Math.cos(angle);
    const y = cy + (outerR + 10) * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
  }

  // Footer Legend
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#38bdf8' : '#1d4ed8';
  ctx.fillText('24 Spokes: Constant Progress & Duty • Dharma Chakra', 130, 395);

  ctx.restore();
  return canvas;
}

// ==============================================================
// 13. LANGUAGES (ENGLISH/HINDI): FLOATING ALPHABETS MATRIX
// ==============================================================
export function createFloatingAlphabetsDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, 'Linguistic Matrix (Devanagari & Roman Alphabets)', 'LANGUAGES • ENG / HINDI', 600, isDark);

  ctx.save();
  // Grid of glowing alphabets with decorative vectors
  const alphabets = [
    { text: 'A', x: 120, y: 170, size: 54, color: '#38bdf8' },
    { text: 'अ', x: 230, y: 180, size: 62, color: '#f59e0b' },
    { text: 'B', x: 340, y: 160, size: 48, color: '#10b981' },
    { text: 'आ', x: 460, y: 185, size: 58, color: '#ec4899' },
    { text: 'इ', x: 150, y: 290, size: 56, color: '#a855f7' },
    { text: 'C', x: 260, y: 310, size: 50, color: '#06b6d4' },
    { text: 'क', x: 370, y: 295, size: 60, color: '#f97316' },
    { text: 'ख', x: 470, y: 305, size: 52, color: '#8b5cf6' },
  ];

  alphabets.forEach((item) => {
    // Aura glow ring
    ctx.beginPath();
    ctx.arc(item.x + item.size * 0.2, item.y - item.size * 0.3, item.size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)';
    ctx.fill();
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text
    ctx.font = `bold ${item.size}px "Plus Jakarta Sans", "Noto Sans Devangari", Georgia, serif`;
    ctx.fillStyle = item.color;
    ctx.shadowColor = item.color;
    ctx.shadowBlur = isDark ? 12 : 6;
    ctx.fillText(item.text, item.x, item.y);
    ctx.shadowBlur = 0;
  });

  // Phonetic Soundwave at bottom
  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 380);
  for (let x = 80; x <= 520; x += 10) {
    const y = 380 + Math.sin((x - 80) * 0.08) * 12 * Math.cos((x - 80) * 0.02);
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
  ctx.fillText('Vowels, Consonants, Phonetics & Grammar Synthesis', 135, 415);

  ctx.restore();
  return canvas;
}

// ==============================================================
// 14. LANGUAGES (ENGLISH/HINDI): QUILL & FOUNTAIN PEN NIB
// ==============================================================
export function createQuillFountainPenDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, 'Calligraphy Nib & Quill Ink Flow', 'LITERATURE & WRITING', 600, isDark);

  ctx.save();
  const cx = 300;
  const cy = 200;

  // Golden Fountain Pen Nib
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.fillStyle = isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.1)';

  ctx.beginPath();
  ctx.moveTo(cx, cy - 100); // Tip
  ctx.lineTo(cx - 35, cy - 20);
  ctx.lineTo(cx - 30, cy + 50);
  ctx.lineTo(cx + 30, cy + 50);
  ctx.lineTo(cx + 35, cy - 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Nib Slit
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 100);
  ctx.lineTo(cx, cy - 25);
  ctx.stroke();

  // Breather Hole
  ctx.beginPath();
  ctx.arc(cx, cy - 25, 6, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
  ctx.fill();
  ctx.stroke();

  // Ink Swirl Wave from tip
  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 100);
  ctx.bezierCurveTo(cx + 60, cy - 140, cx + 120, cy - 80, cx + 180, cy - 130);
  ctx.stroke();

  // Calligraphic Verse Lines
  ctx.strokeStyle = isDark ? 'rgba(203, 213, 225, 0.4)' : 'rgba(51, 65, 85, 0.4)';
  ctx.lineWidth = 2;
  const lineY = [280, 310, 340, 370];
  const widths = [380, 420, 340, 400];

  lineY.forEach((y, i) => {
    ctx.beginPath();
    ctx.moveTo(cx - widths[i] / 2, y);
    ctx.lineTo(cx + widths[i] / 2, y);
    ctx.stroke();
  });

  ctx.font = 'italic bold 13px Georgia, serif';
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.fillText('"The pen is the tongue of the mind..."', 170, 410);

  ctx.restore();
  return canvas;
}

// ==============================================================
// 15. LANGUAGES (ENGLISH/HINDI): OPEN BOOK AURA
// ==============================================================
export function createOpenBookAuraDiagram(isDark = true): HTMLCanvasElement {
  const { canvas, ctx } = initCardCanvas(600, 450, isDark);
  drawHeader(ctx, 'Open Book Aura & Literary Knowledge', 'READING & COMPREHENSION', 600, isDark);

  ctx.save();
  const cx = 300;
  const cy = 250;

  // Book Pages Left & Right
  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 3;
  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.9)';

  // Left Page
  ctx.beginPath();
  ctx.moveTo(cx, cy + 40);
  ctx.quadraticCurveTo(cx - 80, cy + 60, cx - 180, cy + 30);
  ctx.lineTo(cx - 180, cy - 70);
  ctx.quadraticCurveTo(cx - 80, cy - 40, cx, cy - 50);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Page
  ctx.beginPath();
  ctx.moveTo(cx, cy + 40);
  ctx.quadraticCurveTo(cx + 80, cy + 60, cx + 180, cy + 30);
  ctx.lineTo(cx + 180, cy - 70);
  ctx.quadraticCurveTo(cx + 80, cy - 40, cx, cy - 50);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Book Spine & Ribbon Bookmark
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 50);
  ctx.lineTo(cx, cy + 85);
  ctx.stroke();

  // Rays of Knowledge rising from book
  for (let i = -4; i <= 4; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 16;
    const rx = cx + 130 * Math.cos(angle);
    const ry = cy - 50 + 130 * Math.sin(angle);

    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(37, 99, 235, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - 50);
    ctx.lineTo(rx, ry);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Page Text Lines
  ctx.strokeStyle = isDark ? 'rgba(203, 213, 225, 0.5)' : 'rgba(71, 85, 105, 0.5)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    // Left text lines
    ctx.beginPath();
    ctx.moveTo(cx - 150, cy - 20 + i * 14);
    ctx.lineTo(cx - 30, cy - 12 + i * 14);
    ctx.stroke();
    // Right text lines
    ctx.beginPath();
    ctx.moveTo(cx + 30, cy - 12 + i * 14);
    ctx.lineTo(cx + 150, cy - 20 + i * 14);
    ctx.stroke();
  }

  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = '#10b981';
  ctx.fillText('CBSE Literature, Unseen Passages, Grammar & Prose', 130, 395);

  ctx.restore();
  return canvas;
}
