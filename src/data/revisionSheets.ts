export interface QuickFormulaItem {
  name: string;
  formulaOrRule: string;
  notes: string;
  examImportance: 'High' | 'Very High' | 'Guaranteed';
}

export interface ChapterRevisionSheet {
  id: string;
  classLevel: '9' | '10' | '12';
  subjectId: string;
  subjectName: string;
  chapterNumber: number;
  chapterName: string;
  unit: string;
  marksWeightage: string;
  keyConcepts: string[];
  formulasAndReactions: QuickFormulaItem[];
  commonMistakes: string[];
  topperTips: string;
}

export const REVISION_SHEETS: ChapterRevisionSheet[] = [
  // ========================================================
  // CLASS 12 REVISION SHEETS
  // ========================================================
  // 1. CLASS 12 PHYSICS
  {
    id: 'c12-phy-ch1',
    classLevel: '12',
    subjectId: 'class12-physics-042',
    subjectName: 'Physics (042)',
    chapterNumber: 1,
    chapterName: 'Electric Charges & Fields',
    unit: 'Electrostatics',
    marksWeightage: '6-8 Marks',
    keyConcepts: [
      'Coulomb’s Law in vector form and Principle of Superposition',
      'Electric Field due to an Electric Dipole (Axial & Equatorial positions)',
      'Gauss’s Law & Applications (Infinitely long straight wire, Infinite plane sheet, Thin spherical shell)'
    ],
    formulasAndReactions: [
      {
        name: 'Coulomb’s Law in Vector Form',
        formulaOrRule: 'F = (1 / 4πε₀) · (|q₁q₂| / r²) r̂, where 1/4πε₀ = 9 × 10⁹ N·m²/C²',
        notes: 'In a medium of dielectric constant K, F_med = F_vac / K.',
        examImportance: 'Very High'
      },
      {
        name: 'Electric Field of Dipole (Axial vs Equatorial)',
        formulaOrRule: 'E_axial = (2kp) / r³ ; E_equatorial = (-kp) / r³ => E_axial = 2 · E_equatorial (for r >> a)',
        notes: 'Dipole moment vector p = q · (2a) directed from -q to +q.',
        examImportance: 'Guaranteed'
      },
      {
        name: 'Gauss’s Law Integral Form',
        formulaOrRule: '∮ E · dA = q_enclosed / ε₀',
        notes: 'Field due to infinite plane sheet E = σ / (2ε₀) independent of distance r.',
        examImportance: 'Guaranteed'
      }
    ],
    commonMistakes: [
      'Forgetting that electric field on axial line is parallel to dipole moment vector, while on equatorial line it is antiparallel.',
      'Assuming field inside a charged thin spherical shell is non-zero (E_inside = 0, V_inside = constant = V_surface).'
    ],
    topperTips: 'Always draw Gaussian surfaces clearly showing direction vectors of E and dA with shaded charges.'
  },
  {
    id: 'c12-phy-ch3',
    classLevel: '12',
    subjectId: 'class12-physics-042',
    subjectName: 'Physics (042)',
    chapterNumber: 3,
    chapterName: 'Current Electricity',
    unit: 'Current Electricity',
    marksWeightage: '7-8 Marks',
    keyConcepts: [
      'Drift velocity, mobility and relation with current (I = n·e·A·v_d)',
      'Temperature dependence of resistance & resistivity (R_t = R₀(1 + αΔT))',
      'Kirchhoff’s Laws (KCL & KVL) and Wheatstone Bridge balanced condition'
    ],
    formulasAndReactions: [
      {
        name: 'Drift Velocity & Ohm’s Law Microscopic Form',
        formulaOrRule: 'v_d = -(eEτ / m) ; J = σE = n·e·v_d ; ρ = m / (n·e²·τ)',
        notes: 'τ = relaxation time. In metals, as temperature increases, τ decreases and ρ increases.',
        examImportance: 'Guaranteed'
      },
      {
        name: 'Wheatstone Bridge Balance Condition',
        formulaOrRule: 'P / Q = R / S  (Current through galvanometer I_g = 0)',
        notes: 'Sensitivity of Wheatstone bridge is highest when all four arm resistances are nearly equal.',
        examImportance: 'Very High'
      },
      {
        name: 'Cell EMF, Internal Resistance and Terminal Voltage',
        formulaOrRule: 'V = E - I·r (Discharging) ; V = E + I·r (Charging) ; r = R[(E/V) - 1]',
        notes: 'Maximum power delivered to external load occurs when R = r (P_max = E² / 4r).',
        examImportance: 'High'
      }
    ],
    commonMistakes: [
      'Incorrect sign convention in Kirchhoff loop rule.',
      'Confusing EMF with terminal potential difference during charging vs discharging.'
    ],
    topperTips: 'State Kirchhoff’s junction rule as conservation of charge and loop rule as conservation of energy for full step marks.'
  },

  // 2. CLASS 12 CHEMISTRY
  {
    id: 'c12-chem-ch2',
    classLevel: '12',
    subjectId: 'class12-chemistry-043',
    subjectName: 'Chemistry (043)',
    chapterNumber: 2,
    chapterName: 'Electrochemistry',
    unit: 'Physical Chemistry',
    marksWeightage: '7-9 Marks',
    keyConcepts: [
      'Nernst equation and calculation of cell EMF under non-standard conditions',
      'Kohlrausch’s Law of Independent Migration of Ions and molar conductivity',
      'Faraday’s laws of electrolysis and battery chemistry'
    ],
    formulasAndReactions: [
      {
        name: 'Nernst Equation at 298 K',
        formulaOrRule: 'E_cell = E°_cell - (0.0591 / n) log₁₀ Q  ;  ΔG° = -n F E°_cell',
        notes: 'At equilibrium: E_cell = 0 => E°_cell = (0.0591 / n) log₁₀ K_c.',
        examImportance: 'Guaranteed'
      },
      {
        name: 'Kohlrausch’s Law',
        formulaOrRule: 'Λ°_m(electrolyte) = ν₊λ°₊ + ν₋λ°₋  ;  α = Λ_m / Λ°_m',
        notes: 'Allows calculation of limiting molar conductivity of weak electrolytes like CH3COOH.',
        examImportance: 'Guaranteed'
      }
    ],
    commonMistakes: [
      'Missing stoichiometric exponents in the reaction quotient Q.',
      'Using oxidation potentials instead of reduction potentials in E°_cell = E°_cathode - E°_anode.'
    ],
    topperTips: 'Always write balanced cell half-reactions and the number of transferred electrons (n) explicitly before applying Nernst equation.'
  },

  // 3. CLASS 12 MATHEMATICS
  {
    id: 'c12-math-ch3',
    classLevel: '12',
    subjectId: 'class12-maths-041',
    subjectName: 'Mathematics (041)',
    chapterNumber: 3,
    chapterName: 'Matrices & Determinants',
    unit: 'Algebra',
    marksWeightage: '10-12 Marks',
    keyConcepts: [
      'Properties of Transpose, Symmetric & Skew-Symmetric matrices',
      'Adjoint, Inverse of a matrix (A⁻¹ = adj(A)/|A|), and properties (|adj A| = |A|ⁿ⁻¹)',
      'Matrix Method for solving system of linear equations AX = B'
    ],
    formulasAndReactions: [
      {
        name: 'Adjoint and Determinant Identities',
        formulaOrRule: 'A · (adj A) = (adj A) · A = |A| · Iₙ  ;  |adj A| = |A|ⁿ⁻¹  ;  |k·A| = kⁿ · |A|',
        notes: 'For a non-singular matrix A of order 3, |adj A| = |A|² and |adj(adj A)| = |A|⁴.',
        examImportance: 'Guaranteed'
      },
      {
        name: 'System of Linear Equations (Matrix Method)',
        formulaOrRule: 'AX = B => X = A⁻¹ B = (adj A · B) / |A| (If |A| ≠ 0, unique solution)',
        notes: 'If |A| = 0 and (adj A)·B ≠ O, then system has No Solution (Inconsistent).',
        examImportance: 'Guaranteed'
      }
    ],
    commonMistakes: [
      'Applying scalar multiplication on determinants like matrices.',
      'Calculation error in cofactor signs: C_ij = (-1)ⁱ⁺ʲ M_ij.'
    ],
    topperTips: 'Check inverse calculation by quick mental dot product: verify that A · A⁻¹ equals the identity matrix I.'
  },

  // ========================================================
  // CLASS 9 REVISION SHEETS
  // ========================================================
  {
    id: 'c9-sci-ch7',
    classLevel: '9',
    subjectId: 'class9-science-086',
    subjectName: 'Science (086)',
    chapterNumber: 7,
    chapterName: 'Motion',
    unit: 'Moving Things, People and Ideas',
    marksWeightage: '6-8 Marks',
    keyConcepts: [
      'Distance vs Displacement, Speed vs Velocity, Uniform vs Non-Uniform Acceleration',
      'Three Equations of Motion (v = u + at, s = ut + 1/2at², v² - u² = 2as)',
      'Distance-Time and Velocity-Time graphs'
    ],
    formulasAndReactions: [
      {
        name: 'Equations of Uniformly Accelerated Motion',
        formulaOrRule: '1. v = u + at\n2. s = ut + 1/2 a t²\n3. v² - u² = 2as',
        notes: 'For objects dropped from rest: u = 0, a = +g = 9.8 m/s². For objects thrown up: v = 0 at peak, a = -g.',
        examImportance: 'Guaranteed'
      },
      {
        name: 'Uniform Circular Motion',
        formulaOrRule: 'v = (2πr) / t',
        notes: 'Direction changes continuously, so velocity is variable and motion is accelerated even if speed is constant.',
        examImportance: 'Very High'
      }
    ],
    commonMistakes: [
      'Confusing km/h with m/s (Multiply km/h by 5/18 to convert to m/s; multiply m/s by 18/5 for km/h).',
      'Forgetting that displacement can be zero even if total distance travelled is positive.'
    ],
    topperTips: 'State all given variables (u, v, a, s, t) with correct SI units before choosing the appropriate equation of motion.'
  },
  {
    id: 'c9-sci-ch8',
    classLevel: '9',
    subjectId: 'class9-science-086',
    subjectName: 'Science (086)',
    chapterNumber: 8,
    chapterName: 'Force & Laws of Motion',
    unit: 'Moving Things, People and Ideas',
    marksWeightage: '6-7 Marks',
    keyConcepts: [
      'Newton’s 1st Law (Inertia of rest, motion, and direction; Inertia proportional to mass)',
      'Newton’s 2nd Law (Rate of change of momentum is proportional to applied force: F = ma)',
      'Newton’s 3rd Law (Action and Reaction forces are equal and opposite, acting on different bodies)',
      'Law of Conservation of Linear Momentum'
    ],
    formulasAndReactions: [
      {
        name: 'Mathematical Formulation of 2nd Law',
        formulaOrRule: 'p = mv (Momentum in kg·m/s) ; F = Δp / Δt = m(v - u) / t = ma (Force in Newtons)',
        notes: '1 Newton is the force that produces an acceleration of 1 m/s² on a body of mass 1 kg.',
        examImportance: 'Guaranteed'
      },
      {
        name: 'Recoil Velocity of Gun (Momentum Conservation)',
        formulaOrRule: 'v_gun = - (m_bullet · v_bullet) / m_gun',
        notes: 'Negative sign indicates recoil direction is opposite to bullet motion.',
        examImportance: 'Very High'
      }
    ],
    commonMistakes: [
      'Claiming action and reaction cancel each other (They act on TWO DIFFERENT BODIES).',
      'Missing SI units in numerical final answers.'
    ],
    topperTips: 'Explain qualitative questions using impulse: increasing collision time decreases impact force.'
  },
  {
    id: 'c9-math-ch1',
    classLevel: '9',
    subjectId: 'class9-maths-041',
    subjectName: 'Mathematics (041)',
    chapterNumber: 1,
    chapterName: 'Number Systems',
    unit: 'Number Systems',
    marksWeightage: '6-8 Marks',
    keyConcepts: [
      'Rational and Irrational numbers, Real numbers representation on number line',
      'Expressing recurring decimals in p/q form (0.333... = 1/3, 0.23535... = 233/990)',
      'Rationalisation of denominator with surds (1 / (a + √b)) and Laws of Exponents'
    ],
    formulasAndReactions: [
      {
        name: 'Rationalisation Identity',
        formulaOrRule: '1 / (√a + √b) = (√a - √b) / [ (√a + √b)(√a - √b) ] = (√a - √b) / (a - b)',
        notes: 'Multiply both numerator and denominator by conjugate of denominator.',
        examImportance: 'Guaranteed'
      },
      {
        name: 'Laws of Exponents for Real Numbers',
        formulaOrRule: 'aᵐ · aⁿ = aᵐ⁺ⁿ  ;  (aᵐ)ⁿ = aᵐⁿ  ;  aᵐ / aⁿ = aᵐ⁻ⁿ  ;  a⁻ⁿ = 1/aⁿ  ;  a^(m/n) = ⁿ√(aᵐ)',
        notes: 'For positive real number a and rational numbers m, n.',
        examImportance: 'Very High'
      }
    ],
    commonMistakes: [
      'Writing √2 + √3 = √5.',
      'Forgetting that non-terminating non-recurring decimals are irrational numbers.'
    ],
    topperTips: 'In recurring decimal conversion, multiply by 10ⁿ where n is the number of repeating digits.'
  },

  // ========================================================
  // CLASS 10 REVISION SHEETS
  // ========================================================
  {
    id: 'sci-ch1',
    classLevel: '10',
    subjectId: 'science-086',
    subjectName: 'Science (086)',
    chapterNumber: 1,
    chapterName: 'Chemical Reactions & Equations',
    unit: 'Chemical Substances - Nature & Behaviour',
    marksWeightage: '4-5 Marks',
    keyConcepts: [
      'Combination, Decomposition, Displacement, Double Displacement, Redox reactions',
      'Exothermic vs Endothermic reactions',
      'Corrosion and Rancidity prevention methods'
    ],
    formulasAndReactions: [
      {
        name: 'Quick Lime to Slaked Lime (Exothermic)',
        formulaOrRule: 'CaO(s) + H2O(l) → Ca(OH)2(aq) + Heat',
        notes: 'Slaked lime used for whitewashing gives lustrous CaCO3 with CO2.',
        examImportance: 'Very High'
      },
      {
        name: 'Thermal Decomposition of Ferrous Sulphate',
        formulaOrRule: '2FeSO4(s) [Heat] → Fe2O3(s) + SO2(g) + SO3(g)',
        notes: 'Green crystals turn reddish-brown with burning sulphur smell.',
        examImportance: 'Guaranteed'
      },
      {
        name: 'Lead Nitrate Decomposition',
        formulaOrRule: '2Pb(NO3)2(s) [Heat] → 2PbO(s) + 4NO2(g) + O2(g)',
        notes: 'Brown fumes of Nitrogen dioxide gas evolved; yellow residue of PbO.',
        examImportance: 'Guaranteed'
      }
    ],
    commonMistakes: [
      'Forgetting physical state symbols (s, l, g, aq) in chemical reactions.',
      'Confusing oxidizing agent with substance oxidized (Substance reduced = Oxidizing agent).'
    ],
    topperTips: 'Always balance the chemical equation and state color change with gas test observations.'
  },
  {
    id: 'sci-ch10',
    classLevel: '10',
    subjectId: 'science-086',
    subjectName: 'Science (086)',
    chapterNumber: 10,
    chapterName: 'Light - Reflection & Refraction',
    unit: 'Natural Phenomena',
    marksWeightage: '7-8 Marks',
    keyConcepts: [
      'Mirror Formula & Magnification (Concave & Convex mirrors)',
      'Snell’s Law of Refraction (n = sin i / sin r = c / v)',
      'Lens Formula & Power of Lens (P = 1/f in meters, Dioptre)'
    ],
    formulasAndReactions: [
      {
        name: 'Mirror Formula & Magnification',
        formulaOrRule: '1/f = 1/v + 1/u  ;  m = -v/u = h_i / h_o',
        notes: 'Focal length of concave mirror is negative; convex mirror is positive.',
        examImportance: 'Guaranteed'
      },
      {
        name: 'Lens Formula & Power',
        formulaOrRule: '1/f = 1/v - 1/u  ;  m = +v/u = h_i / h_o  ;  P = 1/f (m) [Dioptre D]',
        notes: 'Convex lens power is positive; Concave lens power is negative.',
        examImportance: 'Guaranteed'
      }
    ],
    commonMistakes: [
      'Confusing the negative sign in mirror magnification (m = -v/u) with lens magnification (m = +v/u).',
      'Forgetting to convert focal length from cm to meters before calculating Power (P = 100 / f_in_cm).'
    ],
    topperTips: 'Draw ray diagrams with pencil, sharp arrows showing light direction, and clear principal axis labeling.'
  },
  {
    id: 'sci-ch12',
    classLevel: '10',
    subjectId: 'science-086',
    subjectName: 'Science (086)',
    chapterNumber: 12,
    chapterName: 'Electricity',
    unit: 'Effects of Current',
    marksWeightage: '7-9 Marks',
    keyConcepts: [
      'Ohm’s Law & Factors affecting resistance (R = ρL/A)',
      'Series & Parallel combinations of resistors',
      'Joule’s Law of Heating (H = I²Rt) & Electric Power (P = VI = I²R = V²/R)'
    ],
    formulasAndReactions: [
      {
        name: 'Resistivity & Dimensions Relation',
        formulaOrRule: 'R = ρ · (L / A) = ρ · (L / πr²)',
        notes: 'If wire is stretched to double length (L\' = 2L), area becomes A/2 => New Resistance R\' = 4R.',
        examImportance: 'Guaranteed'
      },
      {
        name: 'Equivalent Resistance Combinations',
        formulaOrRule: 'Series: R_s = R₁ + R₂ + R₃\nParallel: 1/R_p = 1/R₁ + 1/R₂ + 1/R₃',
        notes: 'In series current is same; in parallel potential difference V is same.',
        examImportance: 'Guaranteed'
      },
      {
        name: 'Electric Energy & Commercial Unit',
        formulaOrRule: 'E = P · t  ;  1 kWh (Unit) = 3.6 × 10⁶ Joules',
        notes: 'Cost calculation = Total kWh consumed × Rate per unit.',
        examImportance: 'Very High'
      }
    ],
    commonMistakes: [
      'Adding parallel resistances directly instead of reciprocating (1/Req).',
      'Not converting time from minutes/hours to seconds for heat calculations (H = I²Rt).'
    ],
    topperTips: 'Memorize the conversion: 1 commercial unit of energy = 1 kWh = 3.6 × 10^6 J.'
  },
  {
    id: 'math-ch1',
    classLevel: '10',
    subjectId: 'maths-041',
    subjectName: 'Mathematics (041)',
    chapterNumber: 1,
    chapterName: 'Real Numbers',
    unit: 'Number Systems',
    marksWeightage: '6 Marks',
    keyConcepts: [
      'Fundamental Theorem of Arithmetic (Unique prime factorisation)',
      'Proof of irrationality (√2, √3, √5, 3+2√5)',
      'Relationship: HCF(a, b) × LCM(a, b) = a × b'
    ],
    formulasAndReactions: [
      {
        name: 'HCF & LCM Product Property',
        formulaOrRule: 'HCF(a, b) × LCM(a, b) = a × b',
        notes: 'Valid ONLY for two numbers, NOT for three numbers.',
        examImportance: 'Guaranteed'
      },
      {
        name: 'Proof of Irrationality Contradiction Steps',
        formulaOrRule: 'Assume √p = a/b (co-prime) => p = a²/b² => a² is divisible by p => a = pk => b² = pk² => contradiction.',
        notes: 'Standard 3-mark question guaranteed in Board Exam.',
        examImportance: 'Guaranteed'
      }
    ],
    commonMistakes: [
      'Applying HCF × LCM = a × b × c for 3 numbers.',
      'Forgetting to mention that integers a and b are co-prime (HCF(a,b)=1) in contradiction proofs.'
    ],
    topperTips: 'Express numbers as product of prime powers clearly: HCF takes lowest powers; LCM takes highest powers.'
  },
  {
    id: 'math-ch4',
    classLevel: '10',
    subjectId: 'maths-041',
    subjectName: 'Mathematics (041)',
    chapterNumber: 4,
    chapterName: 'Quadratic Equations',
    unit: 'Algebra',
    marksWeightage: '5-6 Marks',
    keyConcepts: [
      'Standard form ax² + bx + c = 0 (a ≠ 0)',
      'Quadratic Formula: x = [-b ± √(b² - 4ac)] / 2a',
      'Nature of Roots via Discriminant D = b² - 4ac'
    ],
    formulasAndReactions: [
      {
        name: 'Discriminant & Nature of Roots',
        formulaOrRule: 'D > 0: Two distinct real roots\nD = 0: Two equal real roots (x = -b/2a)\nD < 0: No real roots',
        notes: 'If roots are real and equal, set D = b² - 4ac = 0 to find unknown parameter k.',
        examImportance: 'Guaranteed'
      }
    ],
    commonMistakes: [
      'Dividing by only 2 instead of 2a in the quadratic formula denominator.',
      'Discarding negative solutions in speed/time problems without giving reason (speed cannot be negative).'
    ],
    topperTips: 'Always check if your quadratic simplifies by dividing common numerical factors before applying formula.'
  },
  {
    id: 'math-ch8',
    classLevel: '10',
    subjectId: 'maths-041',
    subjectName: 'Mathematics (041)',
    chapterNumber: 8,
    chapterName: 'Introduction to Trigonometry',
    unit: 'Trigonometry',
    marksWeightage: '7-8 Marks',
    keyConcepts: [
      'Trigonometric Ratios (sin, cos, tan, cot, sec, cosec)',
      'Values of Trigonometric Ratios at 0°, 30°, 45°, 60°, 90°',
      'Fundamental Trigonometric Identities (sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ, 1 + cot²θ = cosec²θ)'
    ],
    formulasAndReactions: [
      {
        name: 'Three Core Trigonometric Identities',
        formulaOrRule: '1. sin²θ + cos²θ = 1\n2. 1 + tan²θ = sec²θ  =>  sec²θ - tan²θ = 1\n3. 1 + cot²θ = cosec²θ => cosec²θ - cot²θ = 1',
        notes: '(sec θ - tan θ) = 1 / (sec θ + tan θ). Extremely helpful in quick algebra manipulations.',
        examImportance: 'Guaranteed'
      },
      {
        name: 'Standard Angle Values (Quick Memory)',
        formulaOrRule: 'sin 0°=0, 30°=1/2, 45°=1/√2, 60°=√3/2, 90°=1',
        notes: 'cos values are sin values in reverse order.',
        examImportance: 'Guaranteed'
      }
    ],
    commonMistakes: [
      'Writing sin²θ + cos²θ = 1 with different angles like sin²A + cos²B = 1 (Angle must be identical).',
      'Confusing Opposite (Perpendicular) and Adjacent (Base) when reference angle switches from A to C.'
    ],
    topperTips: 'In proving identities, convert all complex terms into sin and cos if no direct identity is visible.'
  },
  {
    id: 'sst-his-ch1',
    classLevel: '10',
    subjectId: 'social-087',
    subjectName: 'Social Science (087)',
    chapterNumber: 1,
    chapterName: 'The Rise of Nationalism in Europe',
    unit: 'History - India and the Contemporary World II',
    marksWeightage: '5-6 Marks',
    keyConcepts: [
      'Frederic Sorrieu’s Utopian Vision (1848)',
      'Napoleonic Code of 1804 (Civil Code)',
      'Unification of Italy (Mazzini, Cavour, Garibaldi) and Germany (Otto von Bismarck)',
      'Balkan crisis and ethnic nationalism leading to WWI'
    ],
    formulasAndReactions: [
      {
        name: 'Napoleonic Code (1804) 4 Pillars',
        formulaOrRule: '1. Removed privileges by birth  2. Equality before law  3. Secured property rights  4. Abolished feudal system & serfdom',
        notes: 'Adopted in Dutch Republic, Switzerland, Italy, and Germany.',
        examImportance: 'Guaranteed'
      },
      {
        name: 'Treaty of Vienna (1815) Key Clauses',
        formulaOrRule: 'Restoration of Bourbon Dynasty, Prussia got Saxony, Austria controlled Northern Italy, German Confederation of 39 states untouched.',
        notes: 'Hosted by Austrian Chancellor Duke Metternich.',
        examImportance: 'Very High'
      }
    ],
    commonMistakes: [
      'Confusing the roles of Count Cavour (diplomat) with Giuseppe Garibaldi (Red Shirts army leader).',
      'Writing long essays without bullet points or chronological years.'
    ],
    topperTips: 'Always structure long answer history questions with 4-5 bold headings and bullet points.'
  }
];