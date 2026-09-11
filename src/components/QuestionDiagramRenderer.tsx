import React from 'react';
import { Question } from '../types';
import { Eye, Zap, Activity, BarChart2, Compass, Layers, GitCommit, FileText } from 'lucide-react';

interface QuestionDiagramRendererProps {
  question: Question;
  subjectName?: string;
  languageMode?: 'en' | 'hi' | 'bilingual';
}

export const QuestionDiagramRenderer: React.FC<QuestionDiagramRendererProps> = ({
  question,
  subjectName = '',
  languageMode = 'en'
}) => {
  const imageUrl = question.assetUrl || question.diagramUrl || (question as any).imageUrl || (question as any).image;
  
  const subLower = (subjectName + ' ' + (question.subjectId || '')).toLowerCase();
  const isScience = subLower.includes('science') || subLower.includes('physics') || subLower.includes('chem') || subLower.includes('bio') || subLower.includes('086') || subLower.includes('042') || subLower.includes('043') || subLower.includes('044');
  const isMath = subLower.includes('math') || subLower.includes('041');
  const isSocial = subLower.includes('social') || subLower.includes('sst') || subLower.includes('087') || subLower.includes('geo') || subLower.includes('pol') || subLower.includes('his');

  const textLower = ((question.questionText || '') + ' ' + (question.diagramDescription || '')).toLowerCase();
  
  // Explicit figure / diagram / graph text triggers
  const explicitlyRequestsDiagram = 
    Boolean(question.hasDiagram) || 
    Boolean(question.diagramDescription && question.diagramDescription.trim().length > 0) ||
    Boolean(imageUrl) ||
    textLower.includes('ray diagram') || 
    textLower.includes('circuit diagram') || 
    textLower.includes('experimental setup') || 
    textLower.includes('given figure') || 
    textLower.includes('given diagram') || 
    textLower.includes('shown in the figure') || 
    textLower.includes('bar graph below') || 
    textLower.includes('given graph') || 
    textLower.includes('drawn diagram');

  if (!explicitlyRequestsDiagram && !imageUrl) {
    return null;
  }

  // Topic detection strictly bounded by subject domain
  const isLensOrOptics = isScience && (textLower.includes('lens') || textLower.includes('ray diagram') || textLower.includes('refraction through lens') || textLower.includes('convex lens'));
  const isPrism = isScience && (textLower.includes('prism') || textLower.includes('dispersion') || textLower.includes('spectrum'));
  const isElectricity = isScience && (textLower.includes('circuit') || textLower.includes('resistor') || textLower.includes('ammeter') || textLower.includes('voltmeter'));
  const isChemistryApparatus = isScience && (textLower.includes('beaker') || textLower.includes('test tube') || textLower.includes('precipitate') || textLower.includes('experimental setup'));
  const isMendelGenetics = isScience && (textLower.includes('mendel') || textLower.includes('dihybrid') || textLower.includes('monohybrid') || textLower.includes('cross'));
  const isTrigonometry = isMath && (textLower.includes('triangle') || textLower.includes('sin') || textLower.includes('cos') || textLower.includes('tan') || textLower.includes('angle of elevation'));
  const isPowerSharing = isSocial && (textLower.includes('belgium') || textLower.includes('power sharing organogram'));
  const isGroundwater = isSocial && (textLower.includes('groundwater') || textLower.includes('bar graph'));

  return (
    <div className="my-3 p-3 sm:p-4 bg-stone-900 text-stone-100 rounded-xl border border-stone-700 shadow-md print:bg-stone-100 print:text-stone-900 print:border-stone-400 font-sans">
      <div className="flex items-center justify-between border-b border-stone-700 print:border-stone-400 pb-2 mb-3">
        <div className="flex items-center gap-2 text-amber-400 print:text-amber-900 font-bold text-xs uppercase tracking-wider">
          <Eye className="w-4 h-4 text-amber-400 print:text-amber-800" />
          <span>{languageMode === 'hi' ? 'प्रश्न चित्र / आरेख (QUESTION DIAGRAM)' : 'QUESTION DIAGRAM & VISUAL'}</span>
        </div>
        <span className="text-[10px] bg-stone-800 print:bg-stone-300 print:text-stone-800 text-stone-300 font-mono px-2 py-0.5 rounded font-bold">
          CBSE Board Figure
        </span>
      </div>

      {/* Render actual image URL if provided */}
      {imageUrl ? (
        <div className="flex justify-center p-2 bg-white rounded-lg border border-stone-300">
          <img src={imageUrl} alt={question.diagramDescription || "Question Diagram"} className="max-h-64 object-contain rounded" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-2 bg-stone-950/80 print:bg-white rounded-lg border border-stone-800 print:border-stone-300 overflow-x-auto">

        {/* 1. Convex Lens Ray Diagram */}
        {isLensOrOptics && !isPrism && (
          <svg viewBox="0 0 500 160" className="w-full max-w-lg h-auto text-amber-400">
            {/* Optical Axis */}
            <line x1="20" y1="80" x2="480" y2="80" stroke="#78716c" strokeWidth="1.5" strokeDasharray="4,4" />
            
            {/* Convex Lens */}
            <path d="M 250 15 Q 275 80 250 145 Q 225 80 250 15 Z" fill="#38bdf8" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2.5" />
            
            {/* Focal points */}
            <circle cx="150" cy="80" r="3.5" fill="#f59e0b" />
            <text x="145" y="98" fill="#e7e5e4" fontSize="11" fontWeight="bold">2F₁</text>
            <circle cx="200" cy="80" r="3.5" fill="#f59e0b" />
            <text x="196" y="98" fill="#e7e5e4" fontSize="11" fontWeight="bold">F₁</text>
            <circle cx="300" cy="80" r="3.5" fill="#f59e0b" />
            <text x="297" y="98" fill="#e7e5e4" fontSize="11" fontWeight="bold">F₂</text>
            <circle cx="350" cy="80" r="3.5" fill="#f59e0b" />
            <text x="345" y="98" fill="#e7e5e4" fontSize="11" fontWeight="bold">2F₂</text>

            {/* Object Arrow at 2F1 */}
            <line x1="150" y1="80" x2="150" y2="35" stroke="#ef4444" strokeWidth="3" />
            <polygon points="150,28 144,38 156,38" fill="#ef4444" />
            <text x="135" y="25" fill="#ef4444" fontSize="11" fontWeight="bold">Object (A)</text>

            {/* Incident parallel ray */}
            <line x1="150" y1="35" x2="250" y2="35" stroke="#fbbf24" strokeWidth="2" />
            {/* Refracted ray through F2 */}
            <line x1="250" y1="35" x2="350" y2="125" stroke="#fbbf24" strokeWidth="2" />

            {/* Central ray through Optical Center (O) */}
            <line x1="150" y1="35" x2="350" y2="125" stroke="#34d399" strokeWidth="2" strokeDasharray="3,3" />

            {/* Inverted Image Arrow at 2F2 */}
            <line x1="350" y1="80" x2="350" y2="125" stroke="#10b981" strokeWidth="3" />
            <polygon points="350,132 344,122 356,122" fill="#10b981" />
            <text x="330" y="146" fill="#10b981" fontSize="11" fontWeight="bold">Image (A')</text>
            
            <text x="242" y="158" fill="#a8a29e" fontSize="10" textAnchor="middle">Convex Lens Optical Setup (f = 20 cm)</text>
          </svg>
        )}

        {/* 2. Glass Prism Light Dispersion */}
        {isPrism && (
          <svg viewBox="0 0 460 160" className="w-full max-w-lg h-auto">
            {/* Prism triangle */}
            <polygon points="200,20 100,140 300,140" fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="3" />
            <text x="200" y="15" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">Prism Angle (A)</text>

            {/* Incident white light */}
            <line x1="20" y1="100" x2="140" y2="85" stroke="#ffffff" strokeWidth="3.5" />
            <text x="25" y="90" fill="#ffffff" fontSize="11" fontWeight="bold">White Light Ray</text>

            {/* Spectrum inside prism */}
            <line x1="140" y1="85" x2="240" y2="80" stroke="#ef4444" strokeWidth="1.5" />
            <line x1="140" y1="85" x2="242" y2="105" stroke="#8b5cf6" strokeWidth="1.5" />

            {/* Refracted Spectrum output */}
            <line x1="240" y1="80" x2="420" y2="60" stroke="#ef4444" strokeWidth="2.5" />
            <text x="425" y="64" fill="#ef4444" fontSize="11" fontWeight="bold">Red (Least bent)</text>

            <line x1="241" y1="88" x2="420" y2="80" stroke="#f59e0b" strokeWidth="2" />
            <line x1="241" y1="95" x2="420" y2="100" stroke="#10b981" strokeWidth="2" />
            <line x1="242" y1="105" x2="420" y2="125" stroke="#8b5cf6" strokeWidth="2.5" />
            <text x="425" y="130" fill="#8b5cf6" fontSize="11" fontWeight="bold">Violet (Most bent)</text>

            <text x="230" y="155" fill="#a8a29e" fontSize="10" textAnchor="middle">Refraction & Dispersion Spectrum (VIBGYOR)</text>
          </svg>
        )}

        {/* 3. Electric Circuit / Resistors Schematic */}
        {isElectricity && (
          <svg viewBox="0 0 480 150" className="w-full max-w-lg h-auto">
            {/* Circuit outer loop */}
            <rect x="50" y="20" width="380" height="100" fill="none" stroke="#f59e0b" strokeWidth="2.5" rx="8" />

            {/* Battery on bottom wire */}
            <rect x="200" y="110" width="80" height="20" fill="#1c1917" stroke="#78716c" />
            <line x1="225" y1="112" x2="225" y2="128" stroke="#ef4444" strokeWidth="3" />
            <line x1="235" y1="116" x2="235" y2="124" stroke="#e7e5e4" strokeWidth="2" />
            <line x1="245" y1="112" x2="245" y2="128" stroke="#ef4444" strokeWidth="3" />
            <line x1="255" y1="116" x2="255" y2="124" stroke="#e7e5e4" strokeWidth="2" />
            <text x="210" y="142" fill="#ef4444" fontSize="11" fontWeight="bold">+ 220V AC / Battery -</text>

            {/* Key Switch */}
            <circle cx="340" cy="120" r="4" fill="#10b981" />
            <circle cx="355" cy="120" r="4" fill="#10b981" />
            <line x1="340" y1="120" x2="353" y2="114" stroke="#10b981" strokeWidth="2.5" />
            <text x="338" y="140" fill="#10b981" fontSize="10" fontWeight="bold">Switch (Key ON)</text>

            {/* Ammeter on left vertical wire */}
            <circle cx="50" cy="70" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <text x="50" y="74" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">A</text>
            <text x="18" y="74" fill="#38bdf8" fontSize="10" fontWeight="bold">Ammeter</text>

            {/* Resistors on top wire */}
            {/* R1 Zigzag */}
            <path d="M 120 20 L 125 10 L 135 30 L 145 10 L 155 30 L 165 10 L 170 20" fill="none" stroke="#ef4444" strokeWidth="2.5" />
            <text x="145" y="44" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">R₁ (2Ω)</text>

            {/* R2 Zigzag */}
            <path d="M 210 20 L 215 10 L 225 30 L 235 10 L 245 30 L 255 10 L 260 20" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
            <text x="235" y="44" fill="#3b82f6" fontSize="10" fontWeight="bold" textAnchor="middle">R₂ (3Ω)</text>

            {/* R3 Zigzag */}
            <path d="M 300 20 L 305 10 L 315 30 L 325 10 L 335 30 L 345 10 L 350 20" fill="none" stroke="#10b981" strokeWidth="2.5" />
            <text x="325" y="44" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">R₃ (6Ω)</text>

            {/* Voltmeter in parallel across resistors */}
            <line x1="100" y1="20" x2="100" y2="70" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />
            <line x1="370" y1="20" x2="370" y2="70" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />
            <line x1="100" y1="70" x2="370" y2="70" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />
            <circle cx="235" cy="70" r="13" fill="#0f172a" stroke="#a855f7" strokeWidth="2" />
            <text x="235" y="74" fill="#a855f7" fontSize="12" fontWeight="bold" textAnchor="middle">V</text>

            <text x="435" y="74" fill="#a855f7" fontSize="10" fontWeight="bold">Voltmeter</text>
          </svg>
        )}

        {/* 4. Chemical Apparatus / Precipitation Setup */}
        {isChemistryApparatus && (
          <svg viewBox="0 0 440 150" className="w-full max-w-lg h-auto">
            {/* Tripod Stand & Burner */}
            <path d="M 120 140 L 150 90 L 210 90 L 240 140" fill="none" stroke="#78716c" strokeWidth="3" />
            {/* Bunsen Burner flame */}
            <path d="M 175 140 L 175 110 Q 180 95 180 110 Z" fill="#f59e0b" stroke="#ef4444" strokeWidth="1.5" />

            {/* Beaker */}
            <rect x="140" y="30" width="80" height="60" fill="#38bdf8" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="2.5" rx="3" />
            {/* Liquid level */}
            <rect x="142" y="50" width="76" height="38" fill="#eab308" fillOpacity="0.6" />
            {/* Precipitate at bottom */}
            <rect x="142" y="80" width="76" height="8" fill="#fef08a" />
            <text x="180" y="70" fill="#78350f" fontSize="10" fontWeight="bold" textAnchor="middle">Aqueous Solution</text>
            <text x="180" y="87" fill="#854d0e" fontSize="9" fontWeight="extrabold" textAnchor="middle">Yellow Precipitate (PbI₂ ↓)</text>

            {/* Test Tube pouring */}
            <g transform="translate(260, 20) rotate(35)">
              <rect x="0" y="0" width="20" height="70" fill="#38bdf8" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="2" rx="10" />
              <rect x="2" y="35" width="16" height="33" fill="#a855f7" fillOpacity="0.7" rx="8" />
            </g>
            <text x="320" y="35" fill="#a855f7" fontSize="11" fontWeight="bold">Reactant (KI aq)</text>
            <text x="180" y="20" fill="#e7e5e4" fontSize="11" fontWeight="bold" textAnchor="middle">Precipitation & Displacement Reaction Setup</text>
          </svg>
        )}

        {/* 5. Mendel Dihybrid Pea Plant Cross (Genetics) */}
        {isMendelGenetics && (
          <svg viewBox="0 0 460 150" className="w-full max-w-lg h-auto">
            {/* Parent Cross */}
            <rect x="20" y="15" width="180" height="40" fill="#14532d" stroke="#22c55e" strokeWidth="2" rx="6" />
            <text x="110" y="32" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">Parent (P₁): RRYY  ×  rryy</text>
            <text x="110" y="47" fill="#86efac" fontSize="9" textAnchor="middle">Round Yellow  ×  Wrinkled Green</text>

            {/* Arrow to F1 */}
            <line x1="200" y1="35" x2="250" y2="35" stroke="#f59e0b" strokeWidth="2" />
            <polygon points="255,35 245,30 245,40" fill="#f59e0b" />

            {/* F1 Generation */}
            <rect x="260" y="15" width="180" height="40" fill="#15803d" stroke="#4ade80" strokeWidth="2" rx="6" />
            <text x="350" y="32" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">F₁ Offspring: RrYy (100%)</text>
            <text x="350" y="47" fill="#bbf7d0" fontSize="9" textAnchor="middle">All Round & Yellow Seeds</text>

            {/* F2 Phenotypic Grid Summary */}
            <rect x="20" y="70" width="420" height="70" fill="#1c1917" stroke="#78716c" strokeWidth="1.5" rx="6" />
            <text x="230" y="88" fill="#fbbf24" fontSize="11" fontWeight="bold" textAnchor="middle">F₂ Generation Phenotypic Ratio (9 : 3 : 3 : 1)</text>

            <text x="60" y="115" fill="#4ade80" fontSize="10" fontWeight="bold">● 9 Round Yellow</text>
            <text x="175" y="115" fill="#facc15" fontSize="10" fontWeight="bold">● 3 Round Green</text>
            <text x="280" y="115" fill="#fb923c" fontSize="10" fontWeight="bold">● 3 Wrinkled Yellow</text>
            <text x="390" y="115" fill="#94a3b8" fontSize="10" fontWeight="bold">● 1 Wrinkled Green</text>

            <text x="230" y="132" fill="#a8a29e" fontSize="9" textAnchor="middle">Law of Independent Assortment (1600 Total Seeds = 300 Round Green)</text>
          </svg>
        )}

        {/* 6. Right-Angled Triangle (Trigonometry / Geometry) */}
        {isTrigonometry && (
          <svg viewBox="0 0 420 150" className="w-full max-w-lg h-auto">
            {/* Triangle ABC */}
            <polygon points="60,120 320,120 320,30" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
            
            {/* Right angle symbol at B (320, 120) */}
            <rect x="305" y="105" width="15" height="15" fill="none" stroke="#ef4444" strokeWidth="2" />

            {/* Vertices Labels */}
            <text x="45" y="130" fill="#38bdf8" fontSize="13" fontWeight="bold">A</text>
            <text x="330" y="130" fill="#ef4444" fontSize="13" fontWeight="bold">B (90°)</text>
            <text x="330" y="25" fill="#38bdf8" fontSize="13" fontWeight="bold">C</text>

            {/* Angle Theta at A */}
            <path d="M 100 120 A 40 40 0 0 0 92 106" fill="none" stroke="#f59e0b" strokeWidth="2" />
            <text x="110" y="112" fill="#f59e0b" fontSize="12" fontWeight="bold">θ</text>

            {/* Sides Labels */}
            <text x="180" y="140" fill="#e7e5e4" fontSize="11" fontWeight="bold" textAnchor="middle">Adjacent / Base (b)</text>
            <text x="365" y="75" fill="#ef4444" fontSize="11" fontWeight="bold">Perpendicular (p)</text>
            <text x="180" y="65" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">Hypotenuse (h = √(p² + b²))</text>
          </svg>
        )}

        {/* 7. Belgian Power Sharing Organogram (Civics) */}
        {isPowerSharing && (
          <svg viewBox="0 0 460 150" className="w-full max-w-lg h-auto">
            {/* Central Govt */}
            <rect x="150" y="10" width="160" height="35" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" rx="6" />
            <text x="230" y="27" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">1. Central Government</text>
            <text x="230" y="39" fill="#93c5fd" fontSize="9" textAnchor="middle">50% Dutch & 50% French Ministers</text>

            {/* Connecting lines */}
            <line x1="230" y1="45" x2="230" y2="70" stroke="#94a3b8" strokeWidth="2" />
            <line x1="80" y1="70" x2="380" y2="70" stroke="#94a3b8" strokeWidth="2" />
            <line x1="80" y1="70" x2="80" y2="90" stroke="#94a3b8" strokeWidth="2" />
            <line x1="230" y1="70" x2="230" y2="90" stroke="#94a3b8" strokeWidth="2" />
            <line x1="380" y1="70" x2="380" y2="90" stroke="#94a3b8" strokeWidth="2" />

            {/* State / Regional Govt */}
            <rect x="15" y="90" width="130" height="45" fill="#065f46" stroke="#34d399" strokeWidth="2" rx="6" />
            <text x="80" y="110" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">2. Regional Govts</text>
            <text x="80" y="124" fill="#a7f3d0" fontSize="8.5" textAnchor="middle">Flemish & Wallonia</text>

            {/* Brussels Capital Govt */}
            <rect x="165" y="90" width="130" height="45" fill="#701a75" stroke="#e879f9" strokeWidth="2" rx="6" />
            <text x="230" y="110" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">3. Brussels Capital</text>
            <text x="230" y="124" fill="#f5d0fe" fontSize="8.5" textAnchor="middle">Equal Representation</text>

            {/* Community Govt */}
            <rect x="315" y="90" width="130" height="45" fill="#854d0e" stroke="#facc15" strokeWidth="2" rx="6" />
            <text x="380" y="110" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">4. Community Govt</text>
            <text x="380" y="124" fill="#fef08a" fontSize="8.5" textAnchor="middle">Language & Culture</text>
          </svg>
        )}

        {/* 8. Groundwater Depletion Bar Chart (Geography / Economics) */}
        {isGroundwater && (
          <svg viewBox="0 0 450 150" className="w-full max-w-lg h-auto">
            <line x1="50" y1="120" x2="420" y2="120" stroke="#78716c" strokeWidth="2" />
            <line x1="50" y1="20" x2="50" y2="120" stroke="#78716c" strokeWidth="2" />

            {/* Y axis markings */}
            <text x="40" y="30" fill="#a8a29e" fontSize="9" textAnchor="end">8m</text>
            <text x="40" y="70" fill="#a8a29e" fontSize="9" textAnchor="end">4m</text>
            <text x="40" y="115" fill="#a8a29e" fontSize="9" textAnchor="end">0m</text>

            {/* Bar 1: Safe Level */}
            <rect x="80" y="80" width="55" height="40" fill="#10b981" rx="3" />
            <text x="107" y="75" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">Normal</text>
            <text x="107" y="135" fill="#e7e5e4" fontSize="9.5" textAnchor="middle">Central India</text>

            {/* Bar 2: Punjab (-4m) */}
            <rect x="180" y="35" width="55" height="85" fill="#ef4444" rx="3" />
            <text x="207" y="30" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">-4.2 m</text>
            <text x="207" y="135" fill="#e7e5e4" fontSize="9.5" font-weight="bold" textAnchor="middle">Punjab</text>

            {/* Bar 3: Western UP (-4m) */}
            <rect x="280" y="42" width="55" height="78" fill="#f97316" rx="3" />
            <text x="307" y="37" fill="#f97316" fontSize="10" fontWeight="bold" textAnchor="middle">-3.8 m</text>
            <text x="307" y="135" fill="#e7e5e4" fontSize="9.5" font-weight="bold" textAnchor="middle">Western UP</text>

            <text x="235" y="15" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">20-Year Groundwater Level Decline (Over 300 Districts)</text>
          </svg>
        )}

        {/* 9. Generic Custom Diagram Box - ONLY if diagramDescription is explicitly provided */}
        {!isLensOrOptics && !isPrism && !isElectricity && !isChemistryApparatus && !isMendelGenetics && !isTrigonometry && !isPowerSharing && !isGroundwater && Boolean(question.diagramDescription && question.diagramDescription.trim().length > 0) && (
          <div className="w-full py-4 px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold mb-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>{question.chapterName || 'CBSE Visual Diagram'}</span>
            </div>
            <p className="text-xs text-stone-300 font-serif italic max-w-md mx-auto leading-relaxed">
              "{question.diagramDescription}"
            </p>
          </div>
        )}
      </div>
      )}

      <p className="text-[10px] text-stone-400 print:text-stone-600 italic text-center mt-2 font-mono">
        Figure: Standard official CBSE examination diagram representation.
      </p>
    </div>
  );
};
