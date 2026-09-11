import { SubjectQuestionPool } from './masterQuestionPool';

// ==========================================
// 1. CLASS 12 PHYSICS (042) MASTER POOL
// ==========================================
export const CLASS12_PHYSICS_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "Two point charges +q and -q are placed at a distance 2a apart. The electric potential at the midpoint of the line joining them is:", opts: ["A) Zero", "B) 2kq/a", "C) kq/a²", "D) Infinity"], ans: "A) Zero", ch: "Electrostatic Potential and Capacitance" },
    { q: "A parallel plate air capacitor has capacitance C. If a dielectric slab of dielectric constant K = 5 is introduced filling the entire space between plates, the new capacitance becomes:", opts: ["A) 5C", "B) C/5", "C) 25C", "D) C"], ans: "A) 5C", ch: "Electrostatic Potential and Capacitance" },
    { q: "The drift velocity of free electrons in a metallic conductor is related to electric field E as:", opts: ["A) v_d ∝ E", "B) v_d ∝ E²", "C) v_d ∝ 1/E", "D) v_d ∝ √E"], ans: "A) v_d ∝ E", ch: "Current Electricity" },
    { q: "A charged particle moves with velocity v perpendicular to a uniform magnetic field B. The work done by magnetic force on the particle is:", opts: ["A) Zero", "B) q(v · B)", "C) qvB", "D) 1/2 m v²"], ans: "A) Zero", ch: "Moving Charges and Magnetism" },
    { q: "The magnetic susceptibility (χ_m) of a diamagnetic material is:", opts: ["A) Small and negative", "B) Small and positive", "C) Very large and positive", "D) Zero"], ans: "A) Small and negative", ch: "Magnetism and Matter" },
    { q: "In an AC circuit containing only a pure inductor of inductance L, the current lags behind the voltage by a phase angle of:", opts: ["A) π/2 (90°)", "B) π (180°)", "C) 0°", "D) π/4 (45°)"], ans: "A) π/2 (90°)", ch: "Alternating Current" },
    { q: "Which electromagnetic wave has the highest penetrating power and shortest wavelength in the EM spectrum?", opts: ["A) Gamma rays", "B) X-rays", "C) Ultraviolet rays", "D) Microwaves"], ans: "A) Gamma rays", ch: "Electromagnetic Waves" },
    { q: "A convex lens of focal length 20 cm in air is immersed in water (μ_w = 4/3). Its focal length in water becomes:", opts: ["A) 80 cm", "B) 40 cm", "C) 20 cm", "D) 10 cm"], ans: "A) 80 cm", ch: "Ray Optics and Optical Instruments" },
    { q: "If the stopping potential in a photoelectric experiment is 1.5 V, the maximum kinetic energy of the emitted photoelectrons is:", opts: ["A) 1.5 eV", "B) 1.5 J", "C) 3.0 eV", "D) 0.75 eV"], ans: "A) 1.5 eV", ch: "Dual Nature of Radiation and Matter" },
    { q: "The ratio of radii of the first three Bohr orbits in a hydrogen atom is:", opts: ["A) 1 : 4 : 9", "B) 1 : 2 : 3", "C) 1 : 8 : 27", "D) 1 : 1 : 1"], ans: "A) 1 : 4 : 9", ch: "Atoms" },
    { q: "In a p-n junction diode under forward bias, the width of the depletion layer and the barrier potential:", opts: ["A) Both decrease", "B) Both increase", "C) Width increases, barrier decreases", "D) Remains unchanged"], ans: "A) Both decrease", ch: "Semiconductor Electronics: Materials, Devices and Simple Circuits" },
    { q: "Assertion (A): Electric field lines never cross each other.\nReason (R): If they intersect, there would be two tangents and two directions of electric field at that single point, which is impossible.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Electric Charges and Fields", type: 'ar' },
    { q: "Assertion (A): The core of a transformer is laminated to minimize eddy current losses.\nReason (R): Laminations increase the electrical resistance across paths where induced eddy currents circulate.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Alternating Current", type: 'ar' }
  ],
  vsas: [
    { q: "State Gauss's Law in Electrostatics. Write its mathematical form.", ans: "Gauss's law states that the total electric flux passing through any closed Gaussian surface in vacuum is equal to 1/ε₀ times the net electric charge enclosed by that surface.\n∮ E · dA = q_enclosed / ε₀.", ch: "Electric Charges and Fields" },
    { q: "Why is a potentiometer preferred over a voltmeter for measuring the accurate EMF of a cell?", ans: "A potentiometer measures EMF at null point (no current drawn from the test cell), so it acts as an ideal infinite resistance meter without internal drop Ir.", ch: "Current Electricity" },
    { q: "State Lenz's Law of electromagnetic induction. Which fundamental conservation law does it obey?", ans: "The direction of induced electromotive force/current is such that it always opposes the very cause (change in magnetic flux) that produces it.\nIt obeys the Law of Conservation of Energy.", ch: "Electromagnetic Induction" },
    { q: "Write two characteristic properties of electromagnetic waves.", ans: "1. EM waves are transverse in nature and do not require any material medium to propagate.\n2. In vacuum, all EM waves travel at the speed of light c = 1/√(μ₀ε₀) = 3 × 10⁸ m/s.", ch: "Electromagnetic Waves" },
    { q: "Define threshold frequency and work function in photoelectric emission.", ans: "Threshold Frequency (ν₀): The minimum frequency of incident radiation below which no photoelectric emission occurs.\nWork Function (Φ₀): The minimum energy required to eject a photoelectron from the metal surface (Φ₀ = hν₀).", ch: "Dual Nature of Radiation and Matter" }
  ],
  sas: [
    { q: "Derive the expression for the torque experienced by an electric dipole of dipole moment p placed in a uniform electric field E.", ans: "Force on +q is F₁ = qE along E; Force on -q is F₂ = -qE opposite to E. Net force = 0.\nTorque τ = Force × perpendicular distance = qE × (2a sinθ) = (q · 2a) E sinθ = p E sinθ.\nIn vector notation: τ = p × E.", ch: "Electric Charges and Fields" },
    { q: "Derive the relation between drift velocity (v_d) of electrons and electric current (I) in a conductor of cross-sectional area A and electron density n.", ans: "In time Δt, charge passing through area A: Δq = n · A · (v_d Δt) · e.\nCurrent I = Δq / Δt = (n A v_d Δt e) / Δt = n e A v_d.\nTherefore, I = n e A v_d.", ch: "Current Electricity" },
    { q: "Derive the expression for the fringe width (β) in Young's Double Slit Experiment.", ans: "Path difference Δx = xd / D.\nFor nth bright fringe: x_n = n λ D / d.\nFringe width β = x_{n+1} - x_n = (n+1)λD/d - nλD/d = λD / d.", ch: "Wave Optics" },
    { q: "Draw the energy band diagrams for an intrinsic, n-type, and p-type semiconductor at room temperature.", ans: "Intrinsic: Pure semiconductor with Fermi level in middle of bandgap (E_g).\nn-type: Donor energy level (E_d) sits just below the conduction band (E_c).\np-type: Acceptor energy level (E_a) sits just above the valence band (E_v).", ch: "Semiconductor Electronics: Materials, Devices and Simple Circuits" }
  ],
  las: [
    { q: "(a) State the principle of a moving coil galvanometer and derive the expression for current sensitivity.\n(b) How is a galvanometer converted into an ammeter of range 0 to I? Derive the formula for required shunt resistance S.", ans: "(a) Principle: A current carrying coil placed in a magnetic field experiences a deflecting torque τ = NIAB. In radial field, restoring torque Cθ = NIAB ⇒ θ = (NAB/C) I. Current sensitivity I_s = θ/I = NAB/C.\n(b) By connecting a small low-value resistance (shunt S) in parallel with galvanometer coil. S = (I_g · G) / (I - I_g).", ch: "Moving Charges and Magnetism" },
    { q: "(a) Derive Lens Maker's Formula: 1/f = (μ - 1)(1/R₁ - 1/R₂) for a thin double convex lens.\n(b) A convex lens has focal length 20 cm in air. Find its focal length when immersed in water (μ_glass = 1.5, μ_water = 4/3).", ans: "(a) Refraction at surface 1: μ₂/v₁ - μ₁/u = (μ₂-μ₁)/R₁. Refraction at surface 2: μ₁/v - μ₂/v₁ = (μ₁-μ₂)/R₂. Adding both equations gives 1/v - 1/u = (μ - 1)(1/R₁ - 1/R₂). Since 1/v - 1/u = 1/f, 1/f = (μ - 1)(1/R₁ - 1/R₂).\n(b) 1/f_air = (1.5 - 1)(1/R₁ - 1/R₂) = 0.5 K = 1/20 ⇒ K = 1/10. In water: 1/f_water = (1.5/(4/3) - 1) K = (9/8 - 1)(1/10) = (1/8)(1/10) = 1/80 ⇒ f_water = 80 cm.", ch: "Ray Optics and Optical Instruments" }
  ],
  cases: [
    {
      passage: "A series LCR circuit contains an inductor L = 0.12 H, capacitor C = 480 nF, and resistor R = 23 Ω connected to a variable frequency 230 V AC supply. Resonance occurs when the inductive reactance equals capacitive reactance (X_L = X_C).",
      q: "Q1. Find the resonant angular frequency (ω₀) of the circuit. (1M)\nQ2. What is the impedance of the circuit at resonance? (1M)\nQ3. Calculate the RMS current and power dissipated in the circuit at resonance. (2M)",
      ans: "Q1. ω₀ = 1/√(LC) = 1/√[0.12 × 480 × 10⁻⁹] = 1/√[57.6 × 10⁻⁹] = 1/(2.4 × 10⁻⁴) = 4166.7 rad/s.\nQ2. At resonance, Z = R = 23 Ω.\nQ3. I_rms = V_rms / Z = 230 / 23 = 10 A. Power P = I_rms² · R = 10² × 23 = 2300 W (2.3 kW).",
      ch: "Alternating Current"
    }
  ]
};

// ==========================================
// 2. CLASS 12 CHEMISTRY (043) MASTER POOL
// ==========================================
export const CLASS12_CHEMISTRY_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "The value of van't Hoff factor (i) for complete dissociation of potassium ferricyanide K₃[Fe(CN)₆] in aqueous solution is:", opts: ["A) 4", "B) 3", "C) 5", "D) 1"], ans: "A) 4", ch: "Solutions" },
    { q: "The unit of rate constant (k) for a first-order chemical reaction is:", opts: ["A) s⁻¹", "B) mol L⁻¹ s⁻¹", "C) L mol⁻¹ s⁻¹", "D) mol⁻² L² s⁻¹"], ans: "A) s⁻¹", ch: "Chemical Kinetics" },
    { q: "Which transition metal ion exhibits the maximum spin-only magnetic moment?", opts: ["A) Mn²⁺ (3d⁵)", "B) Fe²⁺ (3d⁶)", "C) Cr³⁺ (3d³)", "D) Cu²⁺ (3d⁹)"], ans: "A) Mn²⁺ (3d⁵)", ch: "The d- and f-Block Elements" },
    { q: "The IUPAC name of the complex [Co(NH₃)₅(CO₃)]Cl is:", opts: ["A) Pentaamminecarbonatocobalt(III) chloride", "B) Pentaamminechlorocobalt(III) carbonate", "C) Carbonatopentaamminecobalt(II) chloride", "D) Cobaltpentaammine carbonate chloride"], ans: "A) Pentaamminecarbonatocobalt(III) chloride", ch: "Coordination Compounds" },
    { q: "Which alkyl halide undergoes SN2 nucleophilic substitution most rapidly?", opts: ["A) CH₃-Cl", "B) (CH₃)₂CH-Cl", "C) (CH₃)₃C-Cl", "D) CH₃-CH₂-CH₂-Cl"], ans: "A) CH₃-Cl", ch: "Haloalkanes and Haloarenes" },
    { q: "Phenol when treated with chloroform (CHCl₃) in the presence of aqueous NaOH at 340 K gives salicylaldehyde. This reaction is known as:", opts: ["A) Reimer-Tiemann reaction", "B) Kolbe's reaction", "C) Williamson synthesis", "D) Friedel-Crafts reaction"], ans: "A) Reimer-Tiemann reaction", ch: "Alcohols, Phenols and Ethers" },
    { q: "Which of the following compounds will undergo Cannizzaro reaction upon heating with concentrated NaOH?", opts: ["A) HCHO (Formaldehyde)", "B) CH₃CHO (Acetaldehyde)", "C) CH₃COCH₃ (Acetone)", "D) CH₃CH₂CHO"], ans: "A) HCHO (Formaldehyde)", ch: "Aldehydes, Ketones and Carboxylic Acids" },
    { q: "The reagent used to distinguish primary, secondary, and tertiary amines is:", opts: ["A) Hinsberg's reagent (Benzenesulphonyl chloride)", "B) Lucas reagent", "C) Tollens' reagent", "D) Fehling's solution"], ans: "A) Hinsberg's reagent (Benzenesulphonyl chloride)", ch: "Amines" },
    { q: "Which vitamin deficiency causes Pernicious Anemia?", opts: ["A) Vitamin B₁₂ (Cobalamin)", "B) Vitamin B₁ (Thiamine)", "C) Vitamin C (Ascorbic acid)", "D) Vitamin D"], ans: "A) Vitamin B₁₂ (Cobalamin)", ch: "Biomolecules" },
    { q: "Assertion (A): Elevation in boiling point is a colligative property.\nReason (R): Elevation in boiling point depends solely on the number of solute particles and not on their chemical nature.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Solutions", type: 'ar' }
  ],
  vsas: [
    { q: "State Raoult's Law for a solution containing volatile solute and solvent.", ans: "Raoult's law states that for a solution of volatile liquids, the partial vapour pressure of each component in the solution is directly proportional to its mole fraction in the solution (P_A = P_A° · x_A).", ch: "Solutions" },
    { q: "State Kohlrausch's Law of independent migration of ions.", ans: "Limiting molar conductivity of an electrolyte can be represented as the sum of the individual contributions of the anion and cation of the electrolyte (Λ°_m = ν₊ λ°₊ + ν₋ λ°₋).", ch: "Electrochemistry" },
    { q: "What is Lanthanoid Contraction? Mention one important consequence of it.", ans: "The steady decrease in the atomic and ionic radii of lanthanoid elements with increasing atomic number due to poor shielding by 4f electrons.\nConsequence: 4d and 5d series elements (like Zr and Hf) have almost identical atomic radii and similar chemical properties.", ch: "The d- and f-Block Elements" },
    { q: "Explain Williamson's Ether Synthesis with a general chemical equation.", ans: "An alkyl halide is reacted with sodium alkoxide to form ether via SN2 mechanism: R-X + R'-O⁻Na⁺ → R-O-R' + NaX. Best yields with primary alkyl halides.", ch: "Alcohols, Phenols and Ethers" }
  ],
  sas: [
    { q: "A first-order reaction is 50% complete in 20 minutes. Calculate the time required for 99.9% completion of the reaction.", ans: "k = 0.693 / t_{1/2} = 0.693 / 20 = 0.03465 min⁻¹.\nFor 99.9% completion: [A] = 100 - 99.9 = 0.1% of [A]₀.\nt = (2.303 / k) log(100 / 0.1) = (2.303 / 0.03465) log(1000) = (2.303 / 0.03465) × 3 = 199.39 ≈ 200 minutes (or ~10 half-lives).", ch: "Chemical Kinetics" },
    { q: "Using Crystal Field Theory (CFT), explain why [CoF₆]³⁻ is paramagnetic and outer orbital, whereas [Co(CN)₆]³⁻ is diamagnetic and inner orbital.", ans: "Co³⁺ has 3d⁶ configuration.\nIn [CoF₆]³⁻, F⁻ is a weak field ligand (Δ_o < P), so pairing does not occur: t_{2g}⁴ e_g² with 4 unpaired electrons (paramagnetic, sp³d² outer orbital).\nIn [Co(CN)₆]³⁻, CN⁻ is a strong field ligand (Δ_o > P), so electrons pair up: t_{2g}⁶ e_g⁰ with 0 unpaired electrons (diamagnetic, d²sp³ inner orbital).", ch: "Coordination Compounds" },
    { q: "Account for the following observations:\n(a) Aniline does not undergo Friedel-Crafts alkylation.\n(b) p-Nitrophenol is more acidic than o-nitrophenol and phenol.", ans: "(a) Aniline forms a complex with the Lewis acid catalyst AlCl₃ (C₆H₅NH₂⁺-AlCl₃⁻), which deactivates the benzene ring strongly.\n(b) Nitro group (-NO₂) is strong electron-withdrawing (-I, -R), stabilizing the phenoxide ion. In o-nitrophenol, intramolecular H-bonding slightly reduces acidity compared to p-nitrophenol.", ch: "Amines" }
  ],
  las: [
    { q: "(a) State Faraday's First and Second Laws of Electrolysis.\n(b) Calculate the EMF and ΔG° for the cell: Mg(s) | Mg²⁺(0.001 M) || Cu²⁺(0.0001 M) | Cu(s) given E°(Mg²⁺/Mg) = -2.37 V, E°(Cu²⁺/Cu) = +0.34 V (1 F = 96500 C/mol).", ans: "(a) 1st Law: Mass of substance deposited m = Z · I · t = Z Q.\n2nd Law: When same quantity of electricity passes through different electrolytes, masses deposited are proportional to their chemical equivalent weights (m₁/E₁ = m₂/E₂).\n(b) E°_cell = E°_cathode - E°_anode = 0.34 - (-2.37) = +2.71 V.\nE_cell = E°_cell - (0.0591/2) log([Mg²⁺]/[Cu²⁺]) = 2.71 - (0.02955) log(10⁻³/10⁻⁴) = 2.71 - 0.02955(1) = 2.68 V.\nΔG° = -n F E°_cell = -2 × 96500 × 2.71 = -523.03 kJ/mol.", ch: "Electrochemistry" }
  ],
  cases: [
    {
      passage: "Aldehydes and ketones contain the polar carbonyl functional group >C=O. Carbonyl compounds with α-hydrogens undergo aldol condensation in presence of dilute alkali. Those without α-hydrogens undergo Cannizzaro disproportionation reaction with concentrated alkali.",
      q: "Q1. Give the IUPAC name and structure of the product obtained when acetone is treated with dilute Ba(OH)₂ followed by heating. (1M)\nQ2. Write the chemical equation for Cannizzaro reaction of Benzaldehyde (C₆H₅CHO). (1M)\nQ3. How can you chemically distinguish between ethanal and propanone using Iodoform test? (2M)",
      ans: "Q1. 4-Methylpent-3-en-2-one (Mesityl oxide).\nQ2. 2 C₆H₅CHO + conc. NaOH → C₆H₅COONa (Sodium benzoate) + C₆H₅CH₂OH (Benzyl alcohol).\nQ3. Both give positive yellow precipitate of iodoform (CHI₃) with I₂/NaOH due to CH₃CO- group. Ethanal reduces Tollens' reagent forming silver mirror, while propanone does not.",
      ch: "Aldehydes, Ketones and Carboxylic Acids"
    }
  ]
};

// ==========================================
// 3. CLASS 12 MATHEMATICS (041) MASTER POOL
// ==========================================
export const CLASS12_MATH_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "The principal value of sin⁻¹(-1/2) is equal to:", opts: ["A) -π/6", "B) 5π/6", "C) 7π/6", "D) π/6"], ans: "A) -π/6", ch: "Inverse Trigonometric Functions" },
    { q: "If A is a square matrix of order 3 and |A| = 5, then the value of |adj(A)| is:", opts: ["A) 25", "B) 125", "C) 5", "D) 1/5"], ans: "A) 25", ch: "Determinants" },
    { q: "The derivative of log(sin x) with respect to x is:", opts: ["A) cot x", "B) tan x", "C) -cot x", "D) cosec x"], ans: "A) cot x", ch: "Continuity and Differentiability" },
    { q: "The value of definite integral ∫_{-π/2}^{π/2} sin⁷(x) dx is:", opts: ["A) 0", "B) 1", "C) 2", "D) π/2"], ans: "A) 0", ch: "Integrals" },
    { q: "The order and degree of the differential equation [1 + (dy/dx)²]^(3/2) = d²y/dx² are respectively:", opts: ["A) Order 2, Degree 2", "B) Order 2, Degree 3", "C) Order 1, Degree 2", "D) Order 3, Degree 2"], ans: "A) Order 2, Degree 2", ch: "Differential Equations" },
    { q: "If vectors a = 2î + 3ĵ - k̂ and b = 4î + 6ĵ + λk̂ are collinear, then the value of λ is:", opts: ["A) -2", "B) 2", "C) 4", "D) -4"], ans: "A) -2", ch: "Vector Algebra" },
    { q: "If P(A) = 0.6, P(B) = 0.5 and P(A ∩ B) = 0.3, then P(A|B) is:", opts: ["A) 0.6", "B) 0.5", "C) 0.3", "D) 0.8"], ans: "A) 0.6", ch: "Probability" },
    { q: "Assertion (A): Every differentiable function is continuous.\nReason (R): If f(x) is differentiable at x=c, then lim_{x→c} [f(x) - f(c)] = f'(c) · 0 = 0.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Continuity and Differentiability", type: 'ar' }
  ],
  vsas: [
    { q: "Let R be a relation on set Z of integers defined by R = {(a, b): 2 divides (a - b)}. Show that R is an equivalence relation.", ans: "1. Reflexive: 2 divides (a - a = 0) for all a ∈ Z.\n2. Symmetric: If 2 divides (a - b), then 2 divides (b - a) = -(a - b).\n3. Transitive: If 2 divides (a - b) and 2 divides (b - c), then 2 divides (a - b + b - c) = (a - c).\nHence, R is an equivalence relation.", ch: "Relations and Functions" },
    { q: "Find the value of x for which the matrix [[x, 2], [3, x-1]] is singular.", ans: "For singular matrix, determinant = 0:\nx(x - 1) - 6 = 0 ⇒ x² - x - 6 = 0 ⇒ (x - 3)(x + 2) = 0 ⇒ x = 3 or x = -2.", ch: "Determinants" },
    { q: "Find the projection of the vector a = 2î + 3ĵ + 2k̂ on the vector b = î + 2ĵ + k̂.", ans: "Projection = (a · b) / |b| = (2(1) + 3(2) + 2(1)) / √(1² + 2² + 1²) = (2 + 6 + 2) / √6 = 10 / √6 = (5√6) / 3.", ch: "Vector Algebra" },
    { q: "Find the general solution of the differential equation dy/dx = (1 + y²) / (1 + x²).", ans: "Separating variables: dy / (1 + y²) = dx / (1 + x²).\nIntegrating: tan⁻¹(y) = tan⁻¹(x) + C.", ch: "Differential Equations" }
  ],
  sas: [
    { q: "If y = (sin x)^x + x^(sin x), find dy/dx.", ans: "Let u = (sin x)^x ⇒ log u = x log(sin x) ⇒ du/dx = (sin x)^x [ log(sin x) + x cot x ].\nLet v = x^(sin x) ⇒ log v = sin x log x ⇒ dv/dx = x^(sin x) [ cos x log x + (sin x)/x ].\ndy/dx = (sin x)^x [ log(sin x) + x cot x ] + x^(sin x) [ cos x log x + (sin x)/x ].", ch: "Continuity and Differentiability" },
    { q: "Evaluate the definite integral: I = ∫_0^{π/2} (√sin x) / (√sin x + √cos x) dx.", ans: "Using King property ∫_0^a f(x)dx = ∫_0^a f(a-x)dx:\nI = ∫_0^{π/2} (√cos x) / (√cos x + √sin x) dx.\nAdding both equations: 2I = ∫_0^{π/2} 1 dx = [x]_0^{π/2} = π/2 ⇒ I = π/4.", ch: "Integrals" },
    { q: "Find the shortest distance between the skew lines:\nr = (î + 2ĵ + 3k̂) + λ(î - 3ĵ + 2k̂) and r = (4î + 5ĵ + 6k̂) + μ(2î + 3ĵ + k̂).", ans: "a₂ - a₁ = 3î + 3ĵ + 3k̂.\nb₁ × b₂ = |î ĵ k̂; 1 -3 2; 2 3 1| = î(-3-6) - ĵ(1-4) + k̂(3+6) = -9î + 3ĵ + 9k̂.\n|b₁ × b₂| = √((-9)² + 3² + 9²) = √(81 + 9 + 81) = √171 = 3√19.\n(a₂ - a₁) · (b₁ × b₂) = 3(-9) + 3(3) + 3(9) = -27 + 9 + 27 = 9.\nShortest distance d = |9 / 3√19| = 3 / √19 units.", ch: "Three-Dimensional Geometry" }
  ],
  las: [
    { q: "(a) Solve the system of linear equations using Matrix Method:\n2x + 3y + 3z = 5\nx - 2y + z = -4\n3x - y - 2z = 3", ans: "AX = B where A = [[2,3,3],[1,-2,1],[3,-1,-2]], X = [x,y,z]ᵀ, B = [5,-4,3]ᵀ.\n|A| = 2(4+1) - 3(-2-3) + 3(-1+6) = 10 + 15 + 15 = 40 ≠ 0.\nCofactors matrix C = [[5, 5, 5], [3, -13, 11], [9, 1, -7]].\nadj(A) = Cᵀ = [[5, 3, 9], [5, -13, 1], [5, 11, -7]].\nX = A⁻¹ B = (1/40) [[5,3,9],[5,-13,1],[5,11,-7]] [5, -4, 3]ᵀ = (1/40) [40, 80, -40]ᵀ = [1, 2, -1]ᵀ.\nSolution: x = 1, y = 2, z = -1.", ch: "Determinants" }
  ],
  cases: [
    {
      passage: "An architect designs an open cylindrical water tank of volume V = 2000π m³. The material cost of the base circular sheet is ₹ 100/m² and for the curved side cylindrical wall is ₹ 50/m².",
      q: "Q1. Express the total cost C as a function of the radius r of the base. (1M)\nQ2. Find the critical radius r that minimizes the total manufacturing cost. (1M)\nQ3. Verify using second derivative test that cost is minimum and find the optimal height h. (2M)",
      ans: "Q1. Volume V = πr²h = 2000π ⇒ h = 2000/r². Cost C = 100(πr²) + 50(2πrh) = 100πr² + 100πr(2000/r²) = 100π (r² + 2000/r).\nQ2. dC/dr = 100π(2r - 2000/r²) = 0 ⇒ 2r³ = 2000 ⇒ r³ = 1000 ⇒ r = 10 m.\nQ3. d²C/dr² = 100π(2 + 4000/r³) = 100π(2 + 4) = 600π > 0 (Local Minima). Height h = 2000 / 10² = 20 m.",
      ch: "Application of Derivatives"
    }
  ]
};

// ==========================================
// 4. CLASS 12 BIOLOGY (044) MASTER POOL
// ==========================================
export const CLASS12_BIOLOGY_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "In angiosperms, double fertilization refers to the fusion of:", opts: ["A) One sperm with egg (Syngamy) and second sperm with secondary nucleus (Triple Fusion)", "B) Two sperms with one egg", "C) Pollen tube with synergids", "D) Antipodal cells with egg"], ans: "A) One sperm with egg (Syngamy) and second sperm with secondary nucleus (Triple Fusion)", ch: "Sexual Reproduction in Flowering Plants" },
    { q: "The primary structural component of the middle layer of pollen grain exine is:", opts: ["A) Sporopollenin", "B) Cellulose", "C) Pectin", "D) Chitin"], ans: "A) Sporopollenin", ch: "Sexual Reproduction in Flowering Plants" },
    { q: "Which hormone surge triggers ovulation on approximately day 14 of the human menstrual cycle?", opts: ["A) Luteinizing Hormone (LH)", "B) Progesterone", "C) Estrogen", "D) Prolactin"], ans: "A) Luteinizing Hormone (LH)", ch: "Human Reproduction" },
    { q: "Sickle-cell anemia is caused by a point mutation resulting in substitution of:", opts: ["A) Glutamic acid by Valine at 6th position of β-globin chain", "B) Valine by Glutamic acid at 6th position", "C) Lysine by Valine", "D) Glycine by Alanine"], ans: "A) Glutamic acid by Valine at 6th position of β-globin chain", ch: "Principles of Inheritance and Variation" },
    { q: "The DNA fragment restriction enzyme EcoRI produces sticky ends with the recognition sequence:", opts: ["A) 5'-GAATTC-3'", "B) 5'-GGATCC-3'", "C) 5'-AAGCTT-3'", "D) 5'-CTGCAG-3'"], ans: "A) 5'-GAATTC-3'", ch: "Biotechnology: Principles and Processes" },
    { q: "According to 10% law of energy transfer in an ecosystem, if producers trap 10,000 J of energy, the energy available to tertiary consumers is:", opts: ["A) 10 J", "B) 100 J", "C) 1000 J", "D) 1 J"], ans: "A) 10 J", ch: "Ecosystem" },
    { q: "Assertion (A): In a human pedigree, Hemophilia is a sex-linked recessive disorder.\nReason (R): The gene for hemophilia is located on the X-chromosome and males with a single affected X chromosome suffer from the disease.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Principles of Inheritance and Variation", type: 'ar' }
  ],
  vsas: [
    { q: "What is triple fusion in angiosperms? What does it develop into?", ans: "Triple fusion is the fusion of one haploid male gamete with the diploid secondary nucleus (two polar nuclei) in the central cell to form a triploid Primary Endosperm Nucleus (PEN, 3n), which develops into nutritive endosperm tissue.", ch: "Sexual Reproduction in Flowering Plants" },
    { q: "Differentiate between Menarche and Menopause in human females.", ans: "Menarche: The very first occurrence of menstruation at puberty (around 11-13 years).\nMenopause: The permanent cessation of menstrual cycle and reproductive capability in females (around 45-50 years).", ch: "Human Reproduction" },
    { q: "State Chargaff's rule for double-stranded DNA structure.", ans: "In any double-stranded DNA, the amount of Adenine is always equal to Thymine (A = T), and Guanine equals Cytosine (G = C). Therefore, Purines = Pyrimidines (A + G = T + C).", ch: "Molecular Basis of Inheritance" },
    { q: "Mention two major causes for the loss of biodiversity ('The Evil Quartet').", ans: "1. Habitat loss and fragmentation (e.g., tropical rainforest clearance).\n2. Introduction of alien invasive species (e.g., Water hyacinth/Eichhornia, Nile perch).", ch: "Biodiversity and Conservation" }
  ],
  sas: [
    { q: "Solve the following problem regarding semi-conservative mode of DNA replication with reference to the Meselson and Stahl experiment.", ans: "Meselson and Stahl grew E. coli in ¹⁵NH₄Cl medium for generations, then transferred them to ¹⁴NH₄Cl medium.\nGeneration 1 (20 min) yielded hybrid DNA (¹⁴N-¹⁵N) of intermediate density in CsCl gradient.\nGeneration 2 (40 min) yielded equal amounts of light (¹⁴N-¹⁴N) and hybrid DNA, proving each daughter DNA molecule conserves one parental strand and synthesizes one new strand.", ch: "Molecular Basis of Inheritance" },
    { q: "Describe the lac operon model in Escherichia coli in the presence and absence of lactose.", ans: "In absence of lactose (switch OFF): Lac repressor protein synthesized by i-gene binds to the operator (o) region, preventing RNA polymerase from transcribing structural genes (z, y, a).\nIn presence of lactose (inducer, switch ON): Lactose binds repressor protein, inactivating it. RNA polymerase transcribes lac z (β-galactosidase), lac y (permease), and lac a (transacetylase).", ch: "Molecular Basis of Inheritance" },
    { q: "Solve the following problem regarding steps involved in Polymerase Chain Reaction (PCR) with suitable temperatures.", ans: "1. Denaturation (94-96 °C): Double-stranded target DNA separates into two single strands.\n2. Annealing (50-60 °C): Two sets of oligonucleotide primers bind to complementary regions.\n3. Extension (72 °C): Thermostable Taq polymerase synthesizes new DNA strands using dNTPs.", ch: "Biotechnology: Principles and Processes" }
  ],
  las: [
    { q: "(a) Describe the structure of human female embryo sac (megagametophyte) with a neat labelled diagram.\n(b) Solve the following problem regarding outbreeding devices developed by flowering plants to prevent self-pollination.", ans: "(a) Mature embryo sac is 7-celled and 8-nucleate: 3 antipodal cells at chalazal end, 1 central cell with 2 polar nuclei, and egg apparatus at micropylar end (1 egg cell + 2 synergids with filiform apparatus).\n(b) Outbreeding devices: 1. Dichogamy (pollen release and stigma receptivity not synchronized), 2. Heterostyly/Herkogamy (anther and stigma placed at different positions), 3. Self-incompatibility (genetic prevention of self-pollen germination), 4. Dioecy (unisexual male and female plants).", ch: "Sexual Reproduction in Flowering Plants" }
  ],
  cases: [
    {
      passage: "Recombinant DNA technology allows the transfer of desired genes into host cells. Genetically engineered insulin (Humulin) was developed by Eli Lilly in 1983 using two separate DNA sequences coding for insulin chains A and B in E. coli.",
      q: "Q1. How is pro-insulin structurally different from mature functional human insulin? (1M)\nQ2. Which chemical bonds link peptide chain A and chain B in mature insulin? (1M)\nQ3. Why was insulin extracted from slaughtered cattle/pigs problematic for some diabetic patients? (2M)",
      ans: "Q1. Pro-insulin contains an extra stretch called the C-peptide, which is excised during maturation to form active insulin.\nQ2. Disulfide bridges (-S-S- bonds).\nQ3. Animal-sourced insulin caused immune allergic reactions and inflammatory foreign-protein responses in human patients.",
      ch: "Biotechnology and its Applications"
    }
  ]
};

// ==========================================
// 5. CLASS 12 COMPUTER SCIENCE (083) MASTER POOL
// ==========================================
export const CLASS12_CS_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "Which of the following is an immutable data type in Python?", opts: ["A) Tuple", "B) List", "C) Dictionary", "D) Set"], ans: "A) Tuple", ch: "Python Revision & Functions" },
    { q: "Which Python module is used for object serialization and deserialization in binary files?", opts: ["A) pickle", "B) csv", "C) math", "D) sys"], ans: "A) pickle", ch: "File Handling in Python" },
    { q: "The operation of adding an element at the top of a Stack data structure is termed as:", opts: ["A) PUSH", "B) POP", "C) PEEK", "D) ENQUEUE"], ans: "A) PUSH", ch: "Data Structure: Stacks using Lists" },
    { q: "In a relational database, the number of attributes (columns) in a table is called its:", opts: ["A) Degree", "B) Cardinality", "C) Domain", "D) Tuple"], ans: "A) Degree", ch: "Database Concepts & Relational Data Model" },
    { q: "Which SQL clause is used to filter groups formed by the GROUP BY clause?", opts: ["A) HAVING", "B) WHERE", "C) ORDER BY", "D) DISTINCT"], ans: "A) HAVING", ch: "Structured Query Language (SQL)" },
    { q: "Which network transmission medium provides the highest data transfer bandwidth and immunity to electromagnetic interference?", opts: ["A) Optical Fiber cable", "B) Twisted Pair cable", "C) Coaxial cable", "D) Radio waves"], ans: "A) Optical Fiber cable", ch: "Computer Networks: Fundamentals & Devices" }
  ],
  vsas: [
    { q: "Differentiate between r+ and w+ file opening modes in Python.", ans: "r+: Opens an existing file for both reading and writing without truncating; file pointer is at the beginning. Errors if file does not exist.\nw+: Opens a file for reading and writing, truncates existing content to 0 bytes or creates new file if it doesn't exist.", ch: "File Handling in Python" },
    { q: "Define Primary Key and Candidate Key in a Relational Database.", ans: "Candidate Key: Any attribute or minimal set of attributes capable of uniquely identifying every tuple in a table.\nPrimary Key: The specific candidate key chosen by the database designer to uniquely identify tuples in the table.", ch: "Database Concepts & Relational Data Model" },
    { q: "What is the purpose of the commit() method in Python MySQL database connectivity?", ans: "commit() saves and finalizes all pending database changes (INSERT, UPDATE, DELETE transactions) permanently into the SQL database.", ch: "Interface Python with SQL Database" }
  ],
  sas: [
    { q: "Write a Python function Push(stack, item) and Pop(stack) to implement a Stack of employee records [EmpNo, Name].", ans: "def Push(stack, item):\n    stack.append(item)\n\ndef Pop(stack):\n    if len(stack) == 0:\n        print('Underflow: Stack is empty')\n        return None\n    else:\n        return stack.pop()", ch: "Data Structure: Stacks using Lists" },
    { q: "Write a Python function count_words() to count and display the number of words starting with vowels ('A','E','I','O','U') in a text file 'story.txt'.", ans: "def count_words():\n    count = 0\n    with open('story.txt', 'r') as f:\n        data = f.read()\n        words = data.split()\n        for w in words:\n            if w[0].upper() in 'AEIOU':\n                count += 1\n    print('Total vowel words:', count)", ch: "File Handling in Python" }
  ],
  las: [
    { q: "Consider table STUDENT(AdmNo, Name, Class, Marks, Stream).\nWrite SQL queries for:\n(a) Display Name and Marks of Science stream students with Marks > 85.\n(b) Count number of students in each Stream.\n(c) Increase Marks by 5 for all students in Class 12.\n(d) Display highest and lowest marks scored in each Stream having more than 2 students.", ans: "(a) SELECT Name, Marks FROM STUDENT WHERE Stream = 'Science' AND Marks > 85;\n(b) SELECT Stream, COUNT(*) FROM STUDENT GROUP BY Stream;\n(c) UPDATE STUDENT SET Marks = Marks + 5 WHERE Class = 12;\n(d) SELECT Stream, MAX(Marks), MIN(Marks) FROM STUDENT GROUP BY Stream HAVING COUNT(*) > 2;", ch: "Structured Query Language (SQL)" }
  ],
  cases: [
    {
      passage: "A software firm 'TechVision Ltd' in Bengaluru has 4 blocks: HR (30 computers), Admin (60 computers), Development (120 computers), and Accounts (25 computers). Distance between Development and Admin is 50m, Development to HR is 120m, Development to Accounts is 80m.",
      q: "Q1. Suggest the most suitable block to install the central Server with justification. (1M)\nQ2. Suggest the best cable layout topology connecting all blocks economically. (1M)\nQ3. Which hardware device should be installed in each block to connect all computers within that block? (2M)",
      ans: "Q1. Development block, because it hosts the maximum number of computers (120 computers - 80-20 rule to minimize network traffic).\nQ2. Star Topology with Development block at the center (or Bus topology along shortest cable path).\nQ3. Switch / Hub in each block to connect local computers, and Repeaters where distance exceeds 100 meters.",
      ch: "Computer Networks: Fundamentals & Devices"
    }
  ]
};

// ==========================================
// 6. CLASS 12 ENGLISH CORE (301) MASTER POOL
// ==========================================
export const CLASS12_ENGLISH_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "In 'The Last Lesson', what did M. Hamel write in large letters on the blackboard at the end of the class?", opts: ["A) Vive La France!", "B) France Toujours", "C) Liberté, Égalité", "D) Adieu Alsace"], ans: "A) Vive La France!", ch: "Flamingo: The Last Lesson" },
    { q: "In 'Lost Spring', what does Saheb look for in the garbage dumps of Seemapuri?", opts: ["A) Gold (coins and currency notes)", "B) Toys", "C) Food packets", "D) Scrap metal"], ans: "A) Gold (coins and currency notes)", ch: "Flamingo: Lost Spring" },
    { q: "Who said the famous line: 'All we have to fear is fear itself' quoted in 'Deep Water'?", opts: ["A) President Franklin D. Roosevelt", "B) William Douglas", "C) Abraham Lincoln", "D) Winston Churchill"], ans: "A) President Franklin D. Roosevelt", ch: "Flamingo: Deep Water" },
    { q: "What gift did the peddler leave for Edla Willmansson on Christmas Eve?", opts: ["A) A small rattrap with 30 kronor and a letter of gratitude", "B) A gold watch", "C) A warm coat", "D) A silver cross"], ans: "A) A small rattrap with 30 kronor and a letter of gratitude", ch: "Flamingo: The Rattrap" },
    { q: "In the poem 'My Mother at Sixty-Six', what poetic device is used in 'ashen like that of a corpse'?", opts: ["A) Simile", "B) Metaphor", "C) Personification", "D) Hyperbole"], ans: "A) Simile", ch: "Flamingo Poetry: My Mother at Sixty-Six" },
    { q: "In 'The Tiger King', how did the Maharaja of Pratibandapuram meet his ultimate death?", opts: ["A) Infection from a tiny wooden sliver of a toy tiger", "B) Mauled by a ferocious live tiger", "C) Poisoned by astrologers", "D) Snake bite"], ans: "A) Infection from a tiny wooden sliver of a toy tiger", ch: "Vistas: The Tiger King" },
    { q: "In 'Keeping Quiet', what does poet Pablo Neruda mean by 'an exotic moment'?", opts: ["A) A moment of universal stillness and fraternity without rushing engines", "B) A holiday abroad", "C) A celebration", "D) Deep sleep"], ans: "A) A moment of universal stillness and fraternity without rushing engines", ch: "Flamingo Poetry: Keeping Quiet" },
    { q: "In 'On the Face of It', what drew young Derry towards Mr. Lamb's garden?", opts: ["A) Mr. Lamb's open gate and welcoming, non-judgmental attitude", "B) Sweet apples", "C) A place to hide from police", "D) Flowers"], ans: "A) Mr. Lamb's open gate and welcoming, non-judgmental attitude", ch: "Vistas: On the Face of It" },
    { q: "In 'Memories of Childhood', what did Zitkala-Sa feel when her long hair was shingled?", opts: ["A) Loss of her cultural identity and the agony of an extreme indignity", "B) Happiness", "C) Cold", "D) Indifference"], ans: "A) Loss of her cultural identity and the agony of an extreme indignity", ch: "Vistas: Memories of Childhood" },
    { q: "Choose the correct option for Formal Notice Writing: The word count limit for a standard CBSE Notice is:", opts: ["A) 50 words", "B) 100 words", "C) 150 words", "D) 200 words"], ans: "A) 50 words", ch: "Writing Skills: Notice Writing" }
  ],
  vsas: [
    { q: "Why was Franz surprised when he entered his classroom on the day of the last lesson?", ans: "The class was pin-drop quiet, M. Hamel was dressed in his Sunday finest green coat and frilled shirt, and village elders were sitting solemnly on the back benches.", ch: "Flamingo: The Last Lesson" },
    { q: "Why did Dr. Sadao Hoki decide to operate on and shelter the wounded American soldier?", ans: "As a dedicated surgeon bound by the Hippocratic oath, Dr. Sadao could not let a dying human perish before his eyes, putting medical ethics above wartime racial hatred.", ch: "Vistas: The Enemy" },
    { q: "What does John Keats mean by 'a thing of beauty is a joy forever' in his poem 'A Thing of Beauty'?", ans: "A thing of beauty produces perennial joy whose loveliness increases with time and never passes into nothingness, providing solace during dark trials.", ch: "Flamingo Poetry: A Thing of Beauty" },
    { q: "Why did Sophie dream of opening a boutique or becoming an actress despite her family's impoverished reality in 'Going Places'?", ans: "Sophie lived in a world of romantic escapism and teenage fantasy to mentally escape the suffocating gloom of her lower-middle-class domestic existence.", ch: "Flamingo: Going Places" },
    { q: "State the essential components of a formal Invitation Reply (Refusal/Acceptance) in 50 words.", ans: "Acknowledge the invitation politely, express gratitude, state clear acceptance or regret with a concise reason, and maintain formal third-person tone.", ch: "Writing Skills: Formal Invitations" }
  ],
  sas: [
    { q: "How did Edla Willmansson's kindness and unconditional respect transform the peddler in 'The Rattrap'?", ans: "Edla treated the vagabond peddler with royal dignity as if he were a real Captain, even after knowing he was a tramp. This unconditional human warmth awakened the peddler's latent conscience, inspiring him to rise above petty thievery.", ch: "Flamingo: The Rattrap" },
    { q: "What is the central theme and message conveyed in Adrienne Rich's poem 'Aunt Jennifer's Tigers'?", ans: "The poem critiques patriarchal oppression in marriage. While Aunt Jennifer is timid and terrified beneath Uncle's heavy wedding band, her needlework tigers remain fearless, proud, and free, symbolizing art's enduring defiance against subjugation.", ch: "Flamingo Poetry: Aunt Jennifer's Tigers" },
    { q: "How did Douglas overcome his debilitating childhood hydrophobia in 'Deep Water'?", ans: "Douglas hired a professional instructor who taught him piece by piece—breathing underwater, kicking, and swimming strokes. He then swam solo across Lake Wentworth and Warm Lake to banish the last vestige of terror.", ch: "Flamingo: Deep Water" },
    { q: "In 'A Roadside Stand', what is Robert Frost's empathetic plea on behalf of rural folk who set up stalls along the highway?", ans: "Frost laments the callousness of affluent city dwellers who speed past without buying local farm produce, pleading for genuine social and economic equity to lift rural poor from poverty.", ch: "Flamingo Poetry: A Roadside Stand" }
  ],
  las: [
    { q: "SECTION B: ADVANCED WRITING SKILLS - APPLICATION FOR JOB WITH BIO-DATA (5 MARKS)\n\nYou are Anand / Ananya of 15, Mall Road, Shimla. You saw an advertisement in 'The Tribune' for the post of Senior PGT English at St. Xavier's International School, Solan.\n\nDraft a formal Application for the Job along with a comprehensive Bio-data / Curriculum Vitae (120–150 words).", ans: "Format: Covering Letter (Sender's address, Date, Receiver's address, Subject, Salutation, 3-para Body) followed by structured Bio-Data.\nBio-Data Fields: Personal Details, Academic Qualifications (B.A. Eng Hons, M.A. English, B.Ed.), Work Experience (4 years), References, Skills.\nMarking Scheme: 1M Format, 2M Content & Bio-data layout, 2M Expression & Professional Tone.", ch: "Writing Skills: Job Application & Bio-data" },
    { q: "SECTION B: ADVANCED WRITING SKILLS - ARTICLE WRITING (5 MARKS)\n\nDigital detox, balanced lifestyle, and youth mental well-being have become paramount in today's screen-saturated world. Write an Article (120–150 words) for a national daily on 'Fostering Digital Well-being and Real-World Engagement among Teenagers'.", ans: "Format: Heading & Byline.\nContent: Analysis of screen addiction, impact on sleep cycles and social alienation, actionable remedies (tech-free zones, physical sports, mindful hobbies, community interactions).\nMarking Scheme: 1M Title & Byline, 2M Content & Argumentative Coherence, 2M Fluency & Lexical Precision.", ch: "Writing Skills: Article Writing" },
    { q: "In 'Indigo', elucidate Mahatma Gandhi's approach towards solving the problems of the Champaran sharecroppers and how it marked a turning point in India's struggle for independence.", ans: "Gandhi collected factual evidence, united local lawyers, and fearlessly practiced non-violent civil disobedience against British notices. Rather than relying on court litigation, he empowered the illiterate peasants to conquer fear and become self-reliant, making Champaran the cornerstone of India's freedom struggle.", ch: "Flamingo: Indigo" },
    { q: "Contrast the characters of Derry and Mr. Lamb in 'On the Face of It'. How does their meeting alter Derry's outlook towards life and society?", ans: "Derry is bitter, introverted, and consumed by self-pity due to his acid-burned face. In contrast, Mr. Lamb, despite having a tin leg, is cheerful, welcoming, and views weeds as living plants in his garden. Mr. Lamb teaches Derry that physical imperfections do not define human worth, helping Derry break his self-imposed prison.", ch: "Vistas: On the Face of It" }
  ],
  cases: [
    {
      passage: "The man was lying on his back, eyes closed. The sea had washed him ashore wounded with a gunshot. Dr. Sadao examined him and saw a bullet lodged near his kidney. His servant refused to wash the white enemy. Hana assisted Sadao with anaesthetic while Sadao operated.",
      q: "Q1. Who was the wounded man and what was his nationality? (1M)\nQ2. Why did the household servants react with hostility and desert Dr. Sadao's house? (1M)\nQ3. How does Dr. Sadao's action resolve the conflict between patriotism and universal humanity? (2M)",
      ans: "Q1. Tom, an American prisoner of war (US Navy sailor).\nQ2. They viewed sheltering an enemy national during wartime as treason and feared severe punishment from the military authorities.\nQ3. He saves the patient first in accordance with medical ethics, and later helps him escape safely to an uninhabited island, thereby fulfilling both humanitarian duty and resolving the patriotic dilemma safely.",
      ch: "Vistas: The Enemy"
    },
    {
      passage: "Read the excerpt on Digital Literacy and Board Exam Preparation:\nAccording to a national educational survey in secondary schools, 68% of Class 10 and 12 students actively utilize digital question banks, interactive AI feedback, and mock testing software to strengthen core concepts. Educational psychologists observe that immediate error analysis helps students eliminate recurring conceptual missteps. However, experts emphasize that balanced screen time and structured offline writing practice remain indispensable for developing speed and handwriting clarity required in official board examinations.",
      q: "Q1. What percentage of students utilize digital tools for board preparation? (1M)\nQ2. What key cognitive benefit does immediate error analysis offer according to psychologists? (1M)\nQ3. Why do experts recommend maintaining balanced screen time alongside structured offline writing practice? (2M)",
      ans: "Q1. 68% of secondary students.\nQ2. Immediate error analysis helps learners recognize and eliminate recurring conceptual missteps.\nQ3. Because offline writing practice builds indispensable exam speed, stamina, and handwriting clarity needed for subjective board examinations.",
      ch: "Reading Comprehension: Factual Passage"
    }
  ]
};

export const CLASS12_MATHS_POOL = CLASS12_MATH_POOL;
