import { Question } from '../types';
import { getMiddleSchoolMasterPool } from './middleSchoolMasterPool';

export interface SubjectQuestionPool {
  mcqs: Array<{ q: string; opts: string[]; ans: string; ch: string; exp?: string; type?: 'mcq' | 'ar' }>;
  vsas: Array<{ q: string; ans: string; ch: string; ms?: string }>;
  sas: Array<{ q: string; ans: string; ch: string; ms?: string }>;
  las: Array<{ q: string; ans: string; ch: string; ms?: string }>;
  cases: Array<{ passage: string; q: string; ans: string; ch: string }>;
}

// ==========================================
// 1. SCIENCE (086) MASTER REPOSITORY
// ==========================================
export const SCIENCE_MASTER_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "Which of the following reaction represents a double displacement and precipitation reaction?", opts: ["A) Na2SO4 (aq) + BaCl2 (aq) → BaSO4 (s)↓ + 2NaCl (aq)", "B) 2Mg (s) + O2 (g) → 2MgO (s)", "C) CaCO3 (s) → CaO (s) + CO2 (g)", "D) Zn (s) + 2HCl (aq) → ZnCl2 (aq) + H2 (g)"], ans: "A) Na2SO4 (aq) + BaCl2 (aq) → BaSO4 (s)↓ + 2NaCl (aq)", ch: "Chemical Reactions and Equations" },
    { q: "When aqueous solutions of potassium iodide and lead nitrate are mixed, a precipitate is formed. What is its color and chemical formula?", opts: ["A) Yellow, PbI2", "B) White, KNO3", "C) Blue, CuI2", "D) Green, FeI2"], ans: "A) Yellow, PbI2", ch: "Chemical Reactions and Equations" },
    { q: "Which chemical compound is known as 'Bleaching Powder'?", opts: ["A) CaOCl2", "B) NaHCO3", "C) Na2CO3·10H2O", "D) CaSO4·2H2O"], ans: "A) CaOCl2", ch: "Acids, Bases and Salts" },
    { q: "A solution turns red litmus paper blue; its pH is likely to be:", opts: ["A) 10", "B) 1", "C) 4", "D) 5"], ans: "A) 10", ch: "Acids, Bases and Salts" },
    { q: "Which non-metal is a liquid at room temperature?", opts: ["A) Bromine", "B) Mercury", "C) Iodine", "D) Chlorine"], ans: "A) Bromine", ch: "Metals and Non-Metals" },
    { q: "Which metal is stored in kerosene oil to prevent accidental fire?", opts: ["A) Sodium", "B) Magnesium", "C) Iron", "D) Copper"], ans: "A) Sodium", ch: "Metals and Non-Metals" },
    { q: "The self-linking ability of carbon atoms through covalent bonds is called:", opts: ["A) Catenation", "B) Saponification", "C) Hydrogenation", "D) Esterification"], ans: "A) Catenation", ch: "Carbon and its Compounds" },
    { q: "What is the IUPAC name and formula of the second member of the alkyne series?", opts: ["A) Propyne, C3H4", "B) Ethyne, C2H2", "C) Butyne, C4H6", "D) Propene, C3H6"], ans: "A) Propyne, C3H4", ch: "Carbon and its Compounds" },
    { q: "The breakdown of pyruvate into carbon dioxide, water, and ATP energy in the presence of oxygen occurs in:", opts: ["A) Mitochondria", "B) Cytoplasm", "C) Chloroplast", "D) Ribosomes"], ans: "A) Mitochondria", ch: "Life Processes" },
    { q: "Which enzyme is present in human saliva that initiates the breakdown of starch into maltose?", opts: ["A) Salivary Amylase", "B) Pepsin", "C) Trypsin", "D) Lipase"], ans: "A) Salivary Amylase", ch: "Life Processes" },
    { q: "Which plant hormone is responsible for the wilting of leaves and stomatal closure?", opts: ["A) Abscisic acid (ABA)", "B) Auxin", "C) Gibberellin", "D) Cytokinin"], ans: "A) Abscisic acid (ABA)", ch: "Control and Coordination" },
    { q: "The gap between two communicating neurons across which impulses jump via neurotransmitters is called:", opts: ["A) Synapse", "B) Axon", "C) Dendrite", "D) Myelin sheath"], ans: "A) Synapse", ch: "Control and Coordination" },
    { q: "Vegetative propagation in Bryophyllum occurs through:", opts: ["A) Leaf notches", "B) Stem cuttings", "C) Root tubers", "D) Spores"], ans: "A) Leaf notches", ch: "How do Organisms Reproduce?" },
    { q: "The female reproductive part of a flowering plant (pistil/carpel) consists of:", opts: ["A) Stigma, Style, and Ovary", "B) Anther and Filament", "C) Petals and Sepals", "D) Pollen and Stamen"], ans: "A) Stigma, Style, and Ovary", ch: "How do Organisms Reproduce?" },
    { q: "In a monohybrid cross between pure tall (TT) and pure dwarf (tt) pea plants, the phenotypic ratio in the F2 generation is:", opts: ["A) 3:1", "B) 1:2:1", "C) 9:3:3:1", "D) 1:1"], ans: "A) 3:1", ch: "Heredity and Evolution" },
    { q: "A child inherits one X chromosome from mother and one Y chromosome from father. The biological sex will be:", opts: ["A) Male", "B) Female", "C) Either male or female", "D) Cannot be predicted"], ans: "A) Male", ch: "Heredity and Evolution" },
    { q: "A spherical mirror with a radius of curvature of 24 cm has a focal length of:", opts: ["A) 12 cm", "B) 24 cm", "C) 48 cm", "D) 6 cm"], ans: "A) 12 cm", ch: "Light - Reflection and Refraction" },
    { q: "When a light ray enters from air into glass slab, its speed decreases and it bends:", opts: ["A) Towards the normal", "B) Away from the normal", "C) Continues straight", "D) Totally reflects back"], ans: "A) Towards the normal", ch: "Light - Reflection and Refraction" },
    { q: "The splitting of white light into its constituent seven spectral colors by a glass prism is known as:", opts: ["A) Dispersion", "B) Total Internal Reflection", "C) Atmospheric Refraction", "D) Scattering"], ans: "A) Dispersion", ch: "The Human Eye and the Colorful World" },
    { q: "The danger signal lights installed at the top of tall buildings and railway towers are red because red light:", opts: ["A) Is scattered the least by smoke and fog", "B) Is scattered the most", "C) Has the lowest wavelength", "D) Is absorbed rapidly by air"], ans: "A) Is scattered the least by smoke and fog", ch: "The Human Eye and the Colorful World" },
    { q: "The commercial unit of electrical energy is kilowatt-hour (kWh). 1 kWh is equal to:", opts: ["A) 3.6 × 10⁶ J", "B) 3.6 × 10⁵ J", "C) 1.0 × 10³ J", "D) 7.2 × 10⁶ J"], ans: "A) 3.6 × 10⁶ J", ch: "Electricity" },
    { q: "Three resistors of 2 Ω, 3 Ω, and 6 Ω are connected in parallel. Their equivalent resistance is:", opts: ["A) 1 Ω", "B) 11 Ω", "C) 6 Ω", "D) 0.5 Ω"], ans: "A) 1 Ω", ch: "Electricity" },
    { q: "The rule used to determine the direction of force experienced by a current-carrying conductor in a magnetic field is:", opts: ["A) Fleming's Left-Hand Rule", "B) Right-Hand Thumb Rule", "C) Fleming's Right-Hand Rule", "D) Maxwell's Corkscrew Rule"], ans: "A) Fleming's Left-Hand Rule", ch: "Magnetic Effects of Electric Current" },
    { q: "The metallic body of high-power electrical appliances is connected to the earth wire to:", opts: ["A) Prevent severe electric shocks during accidental leakage", "B) Increase electrical resistance", "C) Reduce electricity bill", "D) Increase heating efficiency"], ans: "A) Prevent severe electric shocks during accidental leakage", ch: "Magnetic Effects of Electric Current" },
    { q: "In an ecosystem food chain, the percentage of energy transferred from one trophic level to the next trophic level is:", opts: ["A) 10%", "B) 1%", "C) 50%", "D) 100%"], ans: "A) 10%", ch: "Our Environment" },
    { q: "Depletion of the stratospheric ozone layer is primarily caused by synthetic chemicals known as:", opts: ["A) Chlorofluorocarbons (CFCs)", "B) Carbon dioxide", "C) Methane", "D) Sulfur dioxide"], ans: "A) Chlorofluorocarbons (CFCs)", ch: "Our Environment" },
    { q: "Assertion (A): Silver chloride turns grey when exposed to sunlight for a few minutes.\nReason (R): Sunlight causes photochemical decomposition of silver chloride into silver metal and chlorine gas.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Chemical Reactions and Equations", type: 'ar' },
    { q: "Assertion (A): Arteries have thick, elastic muscular walls without valves.\nReason (R): Blood emerges from the heart under high pumping pressure and flows through arteries.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Life Processes", type: 'ar' },
    { q: "Assertion (A): The magnetic field lines inside a long current-carrying solenoid are parallel straight lines.\nReason (R): The magnetic field inside a long solenoid is uniform at all points.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Magnetic Effects of Electric Current", type: 'ar' },
    { q: "Assertion (A): Convex mirrors are universally fitted as rear-view driver mirrors in motor vehicles.\nReason (R): Convex mirrors always produce an erect, diminished virtual image and offer a wider field of view.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Light - Reflection and Refraction", type: 'ar' }
  ],
  vsas: [
    { q: "Why is respiration considered an exothermic reaction? Write the overall balanced chemical equation for cellular respiration.", ans: "Respiration breaks down glucose in the presence of oxygen, releasing ATP thermal energy.\nEquation: C6H12O6 + 6O2 → 6CO2 + 6H2O + Energy (ATP).", ch: "Chemical Reactions and Equations" },
    { q: "Write the chemical formula and common name of the sodium compound used in soda-acid fire extinguishers and as an antacid.", ans: "Name: Sodium Hydrogen Carbonate (Baking Soda).\nFormula: NaHCO3.", ch: "Acids, Bases and Salts" },
    { q: "What is an amphoteric oxide? Give two balanced chemical equations showing aluminum oxide reacting with an acid and a base.", ans: "Amphoteric oxides react with both acids and bases to produce salt and water.\n(i) Al2O3 + 6HCl → 2AlCl3 + 3H2O\n(ii) Al2O3 + 2NaOH → 2NaAlO2 (Sodium Aluminate) + H2O.", ch: "Metals and Non-Metals" },
    { q: "Draw the electron dot structure of: (i) Ethane (C2H6) (ii) Nitrogen gas molecule (N2).", ans: "Ethane shows single covalent C-C and C-H bonds with 7 electron pairs. N2 shows a triple covalent bond sharing 3 electron pairs between two nitrogen atoms (:N≡N:).", ch: "Carbon and its Compounds" },
    { q: "Differentiate between aerobic and anaerobic respiration on the basis of: (i) Location in cell (ii) End products formed.", ans: "(i) Aerobic: Mitochondria & cytoplasm; Anaerobic: Cytoplasm only.\n(ii) Aerobic end products: CO2 + H2O + 36/38 ATP; Anaerobic (in yeast): Ethanol + CO2 + 2 ATP (or Lactic acid in muscles).", ch: "Life Processes" },
    { q: "Name the hormones secreted by: (i) Thyroid gland (ii) Pancreas. State one vital physiological function of each.", ans: "(i) Thyroxine: Regulates carbohydrate, protein, and fat metabolism.\n(ii) Insulin: Regulates and lowers blood glucose levels.", ch: "Control and Coordination" },
    { q: "How does binary fission in Amoeba differ from multiple fission in Plasmodium?", ans: "Binary fission divides one parent cell into two daughter cells under favorable conditions. Multiple fission divides one cell into many daughter cells simultaneously within a protective cyst.", ch: "How do Organisms Reproduce?" },
    { q: "State two differences between acquired traits and inherited traits with one example of each.", ans: "Inherited traits are caused by changes in DNA/germ cells and passed to offspring (e.g., eye color). Acquired traits develop during lifetime and cannot be passed on (e.g., muscle building, scar).", ch: "Heredity and Evolution" },
    { q: "A ray of light traveling in water falls obliquely on a glass plate. Does the light ray bend towards or away from the normal? State reason based on optical density.", ans: "Refractive index of glass (1.5) is greater than water (1.33). As light passes from a rarer to a denser medium, it slows down and bends towards the normal.", ch: "Light - Reflection and Refraction" },
    { q: "Why does the clear sky appear blue during the daytime, but deep dark black to an astronaut in outer space?", ans: "Air molecules scatter shorter blue wavelengths more strongly than red (Rayleigh scattering). In outer space, there is no atmosphere to scatter sunlight, so the sky appears dark.", ch: "The Human Eye and the Colorful World" },
    { q: "A 100 W electric bulb operates for 10 hours daily. Calculate the electrical energy consumed in kWh units over a period of 30 days.", ans: "Energy = Power × Time = (100/1000 kW) × 10 h × 30 days = 0.1 × 300 = 30 kWh (units).", ch: "Electricity" },
    { q: "State two distinct properties of magnetic field lines around a straight bar magnet.", ans: "1. They emerge from the North pole and enter the South pole externally (closed continuous loops).\n2. No two magnetic field lines ever intersect each other.", ch: "Magnetic Effects of Electric Current" },
    { q: "What is biological magnification (biomagnification)? Name the trophic level that accumulates the highest concentration of toxic chemicals.", ans: "The progressive accumulation of non-biodegradable toxic chemicals (like DDT) at successive trophic levels in a food chain. The top consumer (highest trophic level) accumulates the maximum concentration.", ch: "Our Environment" }
  ],
  sas: [
    { q: "(a) What is a decomposition reaction? Why are decomposition reactions called the opposite of combination reactions?\n(b) Write balanced chemical equations for thermal decomposition and electrolytic decomposition.", ans: "(a) A single reactant breaks down into two or more simpler products.\n(b) Thermal: 2FeSO4 (s) → Fe2O3 (s) + SO2 (g) + SO3 (g)\nElectrolytic: 2H2O (l) → 2H2 (g) + O2 (g).", ch: "Chemical Reactions and Equations" },
    { q: "(a) What is the chemical formula of Plaster of Paris (POP)? How is it prepared from Gypsum?\n(b) Why should POP be stored in a completely moisture-proof container? Write the reaction.", ans: "(a) CaSO4·1/2H2O. Prepared by heating Gypsum (CaSO4·2H2O) at 373 K (100°C).\n(b) On contact with water, it rehydrates into a hard solid mass (Gypsum): CaSO4·1/2H2O + 1.5H2O → CaSO4·2H2O.", ch: "Acids, Bases and Salts" },
    { q: "(a) Give reasons why ionic compounds have high melting and boiling points.\n(b) Explain why ionic solids do not conduct electricity in solid state but conduct well in aqueous solution or molten state.", ans: "(a) Strong electrostatic forces of attraction between oppositely charged ions require large thermal energy to break.\n(b) In solid state, ions are locked in rigid crystal lattice. In aqueous/molten state, ions are free to move and conduct charge.", ch: "Metals and Non-Metals" },
    { q: "(a) Differentiate between soaps and detergents on the basis of chemical composition.\n(b) Solve the following problem regarding mechanism of micelle formation during the cleansing action of soap with a labeled diagram.", ans: "(a) Soaps are sodium/potassium salts of long-chain fatty acids; detergents are ammonium/sulphonate salts.\n(b) Hydrophobic hydrocarbon tail embeds in oily dirt; hydrophilic ionic head faces water, forming spherical micelles that get washed away.", ch: "Carbon and its Compounds" },
    { q: "(a) Describe the structure and working of a human Nephron with a schematic sketch.\n(b) Name the three key stages of urine formation in the human kidney.", ans: "(a) Nephron consists of Bowman's capsule with glomerulus and a long convoluted tubule surrounded by capillaries.\n(b) 1. Glomerular Ultrafiltration, 2. Tubular Selective Reabsorption (glucose, amino acids, salts, water), 3. Tubular Secretion.", ch: "Life Processes" },
    { q: "(a) Draw a neat labeled diagram of a reflex arc showing receptor, sensory neuron, spinal cord, motor neuron, and effector organ.\n(b) Why are reflex actions routed through the spinal cord rather than brain processing?", ans: "(a) Receptor (skin) → Sensory Neuron → Relay Neuron in Spinal Cord → Motor Neuron → Effector (muscle contraction).\n(b) Spinal reflexes provide instant, life-saving responses to danger without delay of conscious brain evaluation.", ch: "Control and Coordination" },
    { q: "An object 4 cm tall is placed at a distance of 20 cm in front of a concave mirror of focal length 15 cm. Find the position, nature, and size of the image formed.", ans: "u = -20 cm, f = -15 cm.\n1/v + 1/u = 1/f => 1/v = -1/15 - (-1/20) = -1/60 => v = -60 cm.\nNature: Real, inverted, in front of mirror.\nMagnification m = -v/u = -(-60)/(-20) = -3. Height h' = m × h = -3 × 4 = -12 cm (magnified).", ch: "Light - Reflection and Refraction" },
    { q: "(a) Define Electric Power. Write three different mathematical formulas for electric power in terms of V, I, and R.\n(b) An electric heater of resistance 8 Ω draws 15 A from the service mains for 2 hours. Calculate the rate at which heat is developed in the heater.", ans: "(a) Rate of doing electrical work. P = VI = I²R = V²/R.\n(b) Rate of heat development = Power P = I²R = (15)² × 8 = 225 × 8 = 1800 Joules/second (Watts).", ch: "Electricity" }
  ],
  las: [
    { q: "(a) State Ohm's Law. Write its mathematical expression and specify conditions under which it holds valid.\n(b) Draw a schematic circuit diagram to verify Ohm's law with battery, ammeter, voltmeter, rheostat, and test resistor.\n(c) A wire of resistance 20 Ω is drawn out so that its length is increased to twice its original length. Calculate the new resistance of the wire.", ans: "(a) V ∝ I at constant temperature (V = IR).\n(b) Circuit shows DC source, plug key, rheostat, resistor with voltmeter in parallel and ammeter in series.\n(c) When length doubles (L' = 2L), cross-sectional area halves (A' = A/2) since volume is constant. New Resistance R' = ρ(2L)/(A/2) = 4(ρL/A) = 4 × 20 = 80 Ω.", ch: "Electricity" },
    { q: "(a) What is a homologous series? List three main characteristics of carbon homologous series.\n(b) Give the chemical formula, electron dot structure, and IUPAC name of the 3rd member of the alkane series.\n(c) Explain with balanced chemical equations:\n (i) Esterification reaction\n (ii) Saponification reaction.", ans: "(a) A family of organic compounds with same functional group where successive members differ by -CH2 unit and 14 u mass.\n(b) Propane (C3H8), CH3-CH2-CH3.\n(c) (i) CH3COOH + C2H5OH --(conc. H2SO4)--> CH3COOC2H5 (Ethyl ethanoate) + H2O.\n(ii) CH3COOC2H5 + NaOH → CH3COONa + C2H5OH.", ch: "Carbon and its Compounds" },
    { q: "(a) Describe double circulation in the human heart with a schematic flow diagram.\n(b) Why is double circulation advantageous in birds and mammals?\n(c) Distinguish between arteries and veins based on wall thickness, direction of flow, and internal valves.", ans: "(a) Blood flows through heart twice in one complete cycle: Pulmonary circulation (Heart → Lungs → Heart) and Systemic circulation (Heart → Body tissues → Heart).\n(b) Completely separates oxygenated and deoxygenated blood, providing efficient oxygen delivery needed for high metabolic rates and body temperature regulation.\n(c) Arteries: Thick elastic walls, carry blood away from heart, no valves. Veins: Thin walls, carry blood towards heart, have valves.", ch: "Life Processes" }
  ],
  cases: [
    {
      passage: "A student performs an optics experiment in a laboratory using an optical bench. A luminous object is placed at different positions in front of a convex lens having a focal length of 20 cm. The positions of the object (u) and image (v) are measured accurately and tabulated.",
      q: "Q1. If the object is placed at 40 cm in front of the lens, where will the image be formed? State its magnification. (1M)\nQ2. What will be the nature of the image if the object is shifted to a distance of 15 cm from the lens? (1M)\nQ3. Calculate the power of this convex lens in Dioptres. If it is placed in contact with a concave lens of focal length 50 cm, find the net power of the combination. (2M)",
      ans: "Q1. At 2u = 2f = 40 cm on other side of lens (at 2F2). Magnification m = -1 (same size, real, inverted).\nQ2. Virtual, erect, and magnified on same side as object (since u < f).\nQ3. P1 = 100/20 = +5 D. P2 = 100/(-50) = -2 D. Net Power P = P1 + P2 = +5 - 2 = +3 D.",
      ch: "Light - Reflection and Refraction"
    },
    {
      passage: "A domestic electric circuit is supplied with 220 V alternating current (AC) with a 50 Hz frequency. In an urban household, appliances such as an electric iron (1100 W), a refrigerator (400 W), four LED bulbs (25 W each), and a television (100 W) are connected across a 15 A power line through safety devices including an MCB and earth wire.",
      q: "Q1. Why are domestic electrical appliances connected in parallel combination rather than series? (1M)\nQ2. Calculate the total electric current drawn when all the above appliances operate simultaneously on 220 V. (2M)\nQ3. State the primary safety function of an electric fuse / MCB in a domestic circuit. (1M)",
      ans: "Q1. Parallel combination ensures each appliance receives full 220 V, operates independently with its own switch, and if one appliance fails, others continue working.\nQ2. Total Power P = 1100 + 400 + (4 × 25) + 100 = 1700 W. Total Current I = P/V = 1700 / 220 = 7.73 A.\nQ3. Protects circuit from overloading and short-circuits by breaking the circuit when current exceeds safe rating.",
      ch: "Electricity"
    },
    {
      passage: "Gregor Mendel conducted pioneering hybridization experiments on garden pea plants (Pisum sativum). He crossed a pure-breeding round and yellow-seeded pea plant (RRYY) with a pure-breeding wrinkled and green-seeded pea plant (rryy). In the F1 generation, all offspring had round and yellow seeds. The F1 generation plants were then self-pollinated to produce the F2 generation.",
      q: "Q1. What is the genotype and phenotype of the F1 generation plants? (1M)\nQ2. State Mendel's Law of Independent Assortment demonstrated by this dihybrid cross. (1M)\nQ3. State the phenotypic ratio obtained in the F2 generation. If 1600 plants are obtained in F2, calculate the expected number of plants with round and green seeds. (2M)",
      ans: "Q1. Genotype: RrYy; Phenotype: Round and Yellow seeds.\nQ2. When two pairs of contrasting traits are combined in a hybrid, segregation of one pair of characters is independent of the other pair during gamete formation.\nQ3. Phenotypic ratio is 9:3:3:1 (Round-Yellow : Round-Green : Wrinkled-Yellow : Wrinkled-Green). Expected Round-Green = (3/16) × 1600 = 300 plants.",
      ch: "Heredity and Evolution"
    }
  ]
};

// ==========================================
// 2. MATHEMATICS STANDARD (041) MASTER REPOSITORY
// ==========================================
export const MATH_MASTER_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "If HCF(306, 657) = 9, then LCM(306, 657) is:", opts: ["A) 22338", "B) 22330", "C) 22838", "D) 20338"], ans: "A) 22338", ch: "Real Numbers" },
    { q: "If α and β are the zeros of the quadratic polynomial p(x) = x² - 7x + 10, then the value of (α² + β²) is:", opts: ["A) 29", "B) 49", "C) 39", "D) 19"], ans: "A) 29", ch: "Polynomials" },
    { q: "The pair of linear equations 3x + 2ky = 2 and 2x + 5y + 1 = 0 are parallel to each other if k is equal to:", opts: ["A) 15/4", "B) 4/15", "C) -15/4", "D) 5/3"], ans: "A) 15/4", ch: "Pair of Linear Equations" },
    { q: "The discriminant of the quadratic equation 3x² - 2x + 1/3 = 0 is:", opts: ["A) 0", "B) 4", "C) -4", "D) 1"], ans: "A) 0", ch: "Quadratic Equations" },
    { q: "Which term of the AP: 21, 18, 15... is equal to -81?", opts: ["A) 35th term", "B) 34th term", "C) 36th term", "D) 30th term"], ans: "A) 35th term", ch: "Arithmetic Progressions" },
    { q: "In △ABC, if DE ∥ BC intersecting AB at D and AC at E such that AD = 2 cm, DB = 3 cm, and AE = 1.6 cm, then EC is:", opts: ["A) 2.4 cm", "B) 3.2 cm", "C) 1.8 cm", "D) 4.0 cm"], ans: "A) 2.4 cm", ch: "Triangles" },
    { q: "The point P which divides the line segment joining A(1, 3) and B(4, 6) internally in the ratio 2:1 has coordinates:", opts: ["A) (3, 5)", "B) (2, 4)", "C) (5, 3)", "D) (4, 5)"], ans: "A) (3, 5)", ch: "Coordinate Geometry" },
    { q: "If tan θ = 4/3, then the value of (sin θ + cos θ) / (sin θ - cos θ) is:", opts: ["A) 7", "B) 1/7", "C) 5", "D) -7"], ans: "A) 7", ch: "Introduction to Trigonometry" },
    { q: "If a 6 m high vertical pole casts a shadow 2√3 m long on the level ground, the sun's elevation angle is:", opts: ["A) 60°", "B) 30°", "C) 45°", "D) 90°"], ans: "A) 60°", ch: "Some Applications of Trigonometry" },
    { q: "From an external point P, tangents PA and PB are drawn to a circle with center O. If ∠APB = 80°, then ∠POA is:", opts: ["A) 50°", "B) 60°", "C) 70°", "D) 80°"], ans: "A) 50°", ch: "Circles" },
    { q: "The area of a sector of a circle of radius 6 cm with central angle 60° is: (Take π = 22/7)", opts: ["A) 132/7 cm²", "B) 66/7 cm²", "C) 154/7 cm²", "D) 88/7 cm²"], ans: "A) 132/7 cm²", ch: "Areas Related to Circles" },
    { q: "If the radius of the base of a cone is 3 cm and its height is 4 cm, its curved surface area is:", opts: ["A) 15π cm²", "B) 12π cm²", "C) 20π cm²", "D) 9π cm²"], ans: "A) 15π cm²", ch: "Surface Areas and Volumes" },
    { q: "For a given grouped frequency distribution, if Mode = 24 and Mean = 30, the Median using empirical relationship is:", opts: ["A) 28", "B) 26", "C) 27", "D) 25"], ans: "A) 28", ch: "Statistics" },
    { q: "Two dice are thrown simultaneously. The probability of getting a doublet (same number on both dice) is:", opts: ["A) 1/6", "B) 1/12", "C) 1/36", "D) 1/2"], ans: "A) 1/6", ch: "Probability" },
    { q: "Assertion (A): The polynomial p(x) = x² + 4x + 5 has no real zeros.\nReason (R): For quadratic equation ax² + bx + c = 0, if discriminant D = b² - 4ac < 0, roots are not real.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Polynomials", type: 'ar' },
    { q: "Assertion (A): The point (0, 4) lies on the y-axis.\nReason (R): The x-coordinate of any point lying on the y-axis is zero.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Coordinate Geometry", type: 'ar' }
  ],
  vsas: [
    { q: "Given that √3 is irrational, prove that (5 + 2√3) is an irrational number.", ans: "Assume 5 + 2√3 = a/b (where a, b are coprime integers, b ≠ 0). 2√3 = a/b - 5 => √3 = (a - 5b)/2b. RHS is rational, which contradicts that √3 is irrational.", ch: "Real Numbers" },
    { q: "Find the zeros of the quadratic polynomial p(x) = 6x² - 3 - 7x and verify the relationship between zeros and coefficients.", ans: "6x² - 7x - 3 = (2x - 3)(3x + 1) = 0 => x = 3/2 or -1/3. Sum α + β = 3/2 - 1/3 = 7/6 = -b/a. Product αβ = (3/2)(-1/3) = -1/2 = c/a.", ch: "Polynomials" },
    { q: "Find the 20th term from the last term of the AP: 3, 8, 13, ..., 253.", ans: "Reversing the AP gives first term A = 253, common difference D = -5.\n20th term = A + 19D = 253 + 19(-5) = 253 - 95 = 158.", ch: "Arithmetic Progressions" },
    { q: "Find the coordinates of a point A, where AB is the diameter of a circle whose center is (2, -3) and B is (1, 4).", ans: "Let A = (x, y). Center is midpoint: (x+1)/2 = 2 => x = 3; (y+4)/2 = -3 => y = -10. Point A is (3, -10).", ch: "Coordinate Geometry" },
    { q: "If sin (A - B) = 1/2 and cos (A + B) = 1/2, where 0° < A + B ≤ 90° and A > B, find values of A and B.", ans: "A - B = 30° and A + B = 60°. Adding both gives 2A = 90° => A = 45°, B = 15°.", ch: "Introduction to Trigonometry" },
    { q: "A card is drawn at random from a well-shuffled pack of 52 playing cards. Find the probability of getting: (i) A black king (ii) A red face card.", ans: "(i) Black kings = 2. P = 2/52 = 1/26.\n(ii) Red face cards (Jack, Queen, King of hearts & diamonds) = 6. P = 6/52 = 3/26.", ch: "Probability" }
  ],
  sas: [
    { q: "Solve the following pair of linear equations for x and y:\n21x + 47y = 110\n47x + 21y = 162", ans: "Adding: 68x + 68y = 272 => x + y = 4 (Eq 1).\nSubtracting: -26x + 26y = -52 => -x + y = -2 => x - y = 2 (Eq 2).\nSolving: x = 3, y = 1.", ch: "Pair of Linear Equations" },
    { q: "Solve for x: 1/(x + 4) - 1/(x - 7) = 11/30 (where x ≠ -4, 7).", ans: "[(x - 7) - (x + 4)] / [(x + 4)(x - 7)] = 11/30 => -11 / (x² - 3x - 28) = 11/30 => x² - 3x - 28 = -30 => x² - 3x + 2 = 0 => (x - 1)(x - 2) = 0 => x = 1 or x = 2.", ch: "Quadratic Equations" },
    { q: "If the sum of the first 7 terms of an AP is 49 and that of first 17 terms is 289, find the sum of first n terms.", ans: "S7 = 7/2[2a + 6d] = 49 => a + 3d = 7.\nS17 = 17/2[2a + 16d] = 289 => a + 8d = 17.\nSubtracting gives 5d = 10 => d = 2, a = 1.\nSn = n/2[2(1) + (n - 1)2] = n/2[2n] = n².", ch: "Arithmetic Progressions" },
    { q: "Prove that the lengths of tangents drawn from an external point to a circle are equal.", ans: "Given circle with center O, external point P, tangents PA and PB. Join OA, OB, OP. In right △OAP and △OBP: OA = OB (radii), OP = OP (common), ∠OAP = ∠OBP = 90°. △OAP ≅ △OBP (RHS). Therefore, PA = PB (CPCT).", ch: "Circles" },
    { q: "Prove the trigonometric identity: (sin θ - 2 sin³ θ) / (2 cos³ θ - cos θ) = tan θ.", ans: "LHS = [sin θ (1 - 2 sin² θ)] / [cos θ (2 cos² θ - 1)].\nSince 1 - 2 sin² θ = cos 2θ and 2 cos² θ - 1 = cos 2θ (or replacing 1 = sin² θ + cos² θ), numerator and denominator brackets cancel out: sin θ / cos θ = tan θ = RHS.", ch: "Introduction to Trigonometry" }
  ],
  las: [
    { q: "(a) State and prove the Basic Proportionality Theorem (Thales' Theorem).\n(b) In △ABC, DE ∥ BC such that AD/DB = 3/5. If AC = 5.6 cm, find AE.", ans: "(a) Statement: If a line is drawn parallel to one side of a triangle intersecting other two sides, it divides them in the same ratio. Proof using area ratios of △ADE, △BDE, △CDE.\n(b) AE/AC = AD/AB = 3/(3+5) = 3/8 => AE = (3/8) × 5.6 = 2.1 cm.", ch: "Triangles" },
    { q: "A motor boat whose speed is 18 km/h in still water takes 1 hour more to go 24 km upstream than to return downstream to the same spot. Find the speed of the stream.", ans: "Let speed of stream = x km/h. Speed upstream = 18 - x, downstream = 18 + x.\n24/(18 - x) - 24/(18 + x) = 1 => 24[18 + x - 18 + x] / (324 - x²) = 1 => 48x = 324 - x² => x² + 48x - 324 = 0 => (x + 54)(x - 6) = 0 => x = 6 km/h (speed cannot be negative).", ch: "Quadratic Equations" },
    { q: "From the top of a 7 m high building, the angle of elevation of the top of a cable tower is 60° and the angle of depression of its foot is 45°. Determine the height of the cable tower. (Take √3 = 1.732)", ans: "Let height of tower = H = CE + ED. Building AB = 7 m => ED = 7 m. In △ABD, tan 45° = AB/BD = 7/BD => BD = 7 m = AE. In △CAE, tan 60° = CE/AE = CE/7 = √3 => CE = 7√3 m. Total height H = 7 + 7√3 = 7(1 + 1.732) = 19.124 m.", ch: "Some Applications of Trigonometry" }
  ],
  cases: [
    {
      passage: "An auditorium has seating formatted in rows according to an Arithmetic Progression. The 1st row has 20 seats, 2nd row has 24 seats, 3rd row has 28 seats, and so on. The auditorium has a total of 30 rows.",
      q: "Q1. Find the number of seats available in the 12th row. (1M)\nQ2. Find the total seating capacity of the entire auditorium. (2M)\nQ3. If all tickets in the first 10 rows are priced at ₹200 and all subsequent rows at ₹300, calculate total revenue when auditorium is houseful. (1M)",
      ans: "Q1. a = 20, d = 4. a12 = 20 + 11(4) = 64 seats.\nQ2. S30 = 30/2 [2(20) + 29(4)] = 15 [40 + 116] = 15 × 156 = 2,340 seats.\nQ3. S10 = 10/2 [40 + 9(4)] = 5 [76] = 380 seats. Remaining seats = 2340 - 380 = 1960. Revenue = (380 × 200) + (1960 × 300) = ₹76,000 + ₹5,88,000 = ₹6,64,000.",
      ch: "Arithmetic Progressions"
    },
    {
      passage: "A drone survey team establishes a Cartesian coordinate grid over a sports field. Player A is at coordinates (2, 5), Player B is at (8, 5), and the ball is located at point P on line segment AB such that AP:PB = 1:2.",
      q: "Q1. Find the coordinates of point P where the ball is located. (1M)\nQ2. Calculate the total distance between Player A and Player B. (1M)\nQ3. If the coach standing at Point C(5, 9) runs directly to the ball at Point P, calculate the distance covered by the coach. (2M)",
      ans: "Q1. Section formula: x = (1×8 + 2×2)/(1+2) = 12/3 = 4; y = (1×5 + 2×5)/3 = 5. P is (4, 5).\nQ2. AB = √[(8-2)² + (5-5)²] = 6 units.\nQ3. Distance CP = √[(4-5)² + (5-9)²] = √[(-1)² + (-4)²] = √(1 + 16) = √17 ≈ 4.12 units.",
      ch: "Coordinate Geometry"
    }
  ]
};

// ==========================================
// 3. SOCIAL SCIENCE (087) MASTER REPOSITORY
// ==========================================
export const SOCIAL_MASTER_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "Who among the following was proclaimed the first German Emperor in 1871 at Versailles?", opts: ["A) Kaiser William I", "B) Otto von Bismarck", "C) Victor Emmanuel II", "D) Napoleon III"], ans: "A) Kaiser William I", ch: "The Rise of Nationalism in Europe" },
    { q: "Which soil is also known as 'Regur Soil' and is ideal for the cultivation of cotton in India?", opts: ["A) Black Soil", "B) Alluvial Soil", "C) Laterite Soil", "D) Red and Yellow Soil"], ans: "A) Black Soil", ch: "Resources and Development" },
    { q: "In which year was the Vernacular Press Act passed in British India to restrict regional press?", opts: ["A) 1878", "B) 1857", "C) 1919", "D) 1935"], ans: "A) 1878", ch: "Print Culture and the Modern World" },
    { q: "Which language was recognized as the sole official language of Sri Lanka under the Act of 1956?", opts: ["A) Sinhala", "B) Tamil", "C) English", "D) Dutch"], ans: "A) Sinhala", ch: "Power Sharing" },
    { q: "Which subject is included in the Concurrent List under the Indian Constitution?", opts: ["A) Education", "B) Defence", "C) Foreign Affairs", "D) Police"], ans: "A) Education", ch: "Federalism" },
    { q: "The economic sector that contributes the highest share to India's Gross Domestic Product (GDP) today is the:", opts: ["A) Tertiary (Service) Sector", "B) Primary (Agriculture) Sector", "C) Secondary (Manufacturing) Sector", "D) Mining Sector"], ans: "A) Tertiary (Service) Sector", ch: "Sectors of the Indian Economy" },
    { q: "Which institution issues currency notes in India on behalf of the Central Government?", opts: ["A) Reserve Bank of India (RBI)", "B) State Bank of India (SBI)", "C) Ministry of Finance", "D) NITI Aayog"], ans: "A) Reserve Bank of India (RBI)", ch: "Money and Credit" },
    { q: "What was the main purpose of the Treaty of Vienna signed in 1815?", opts: ["A) Restore conservative monarchical regimes in Europe", "B) Declare France a democratic republic", "C) Grant universal suffrage to women", "D) Unify Italy into a single nation"], ans: "A) Restore conservative monarchical regimes in Europe", ch: "The Rise of Nationalism in Europe" },
    { q: "At which Congress session was the resolution for 'Purna Swaraj' (Complete Independence) adopted in 1929?", opts: ["A) Lahore Session", "B) Calcutta Session", "C) Nagpur Session", "D) Madras Session"], ans: "A) Lahore Session", ch: "Nationalism in India" },
    { q: "Which of the following is a renewable resource?", opts: ["A) Solar Energy", "B) Coal", "C) Petroleum", "D) Natural Gas"], ans: "A) Solar Energy", ch: "Resources and Development" },
    { q: "Kallar and Khadins are traditional rainwater harvesting structures primarily used in which state?", opts: ["A) Rajasthan", "B) Meghalaya", "C) Kerala", "D) Tamil Nadu"], ans: "A) Rajasthan", ch: "Water Resources" },
    { q: "Rabi crops in India are sown in:", opts: ["A) October to December (Winter)", "B) June to July (Monsoon)", "C) March to April (Summer)", "D) August to September"], ans: "A) October to December (Winter)", ch: "Agriculture" },
    { q: "Assertion (A): Power sharing is the very spirit of democracy.\nReason (R): Power sharing helps to reduce the possibility of conflict between social groups.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Power Sharing", type: 'ar' }
  ],
  vsas: [
    { q: "Solve the following problem regarding concept of 'Resource Planning'. State two key stages involved in resource planning in India.", ans: "Resource Planning is a strategy for judicious and sustainable use of resources.\nStages:\n1. Identification and inventory of resources across the regions.\n2. Evolving a planning structure endowed with appropriate technology, skill, and institutional set-up.", ch: "Resources and Development" },
    { q: "Why was the Rowlatt Act of 1919 termed as an 'unjust law' and opposed vehemently by Indians?", ans: "The Rowlatt Act gave the colonial government enormous powers to repress political activities and permitted detention of political prisoners without trial for up to two years.", ch: "Nationalism in India" },
    { q: "Distinguish between 'Coming Together' and 'Holding Together' federations with one example of each.", ans: "Coming Together: Independent states come together on their own to form a bigger unit to pool sovereignty and retain identity (e.g., USA, Australia).\nHolding Together: A large country divides its power between constituent states and the national government (e.g., India, Spain).", ch: "Federalism" },
    { q: "What is Per Capita Income? Why is it inadequate as a sole indicator of human development?", ans: "Per Capita Income = Total National Income / Total Population. It is inadequate because it hides disparities in income distribution and does not reflect access to health, education, and social equity.", ch: "Development" },
    { q: "State two reasons why the Tertiary Sector has emerged as the largest producing sector in India.", ans: "1. Demand for basic services such as hospitals, schools, defense, and transportation.\n2. Rise in personal incomes leading to higher demand for tourism, shopping, private education, and IT services.", ch: "Sectors of the Indian Economy" }
  ],
  sas: [
    { q: "Solve the following problem regarding three main features of the Civil Code of 1804 (Napoleonic Code) in France.", ans: "1. Abolished all privileges based on birth.\n2. Established equality before the law.\n3. Secured the right to private property and simplified administrative divisions.", ch: "The Rise of Nationalism in Europe" },
    { q: "Analyze the economic impacts of the Non-Cooperation Movement in India between 1921 and 1922.", ans: "1. Foreign goods were boycotted, liquor shops picketed, and foreign cloth burnt in huge bonfires.\n2. The import of foreign cloth halved between 1921 and 1922, its value dropping from ₹102 crore to ₹57 crore.\n3. Production of Indian textile mills and handlooms went up significantly.", ch: "Nationalism in India" },
    { q: "Why is credit considered to have a 'double-edged' impact on borrowers? Explain with contrasting examples.", ans: "Positive impact: Credit enables profitable investment in farming/business, increasing earnings (e.g., Salim expanding shoe production).\nNegative impact (Debt Trap): If crops fail due to natural disasters, repayment becomes impossible, forcing the borrower to sell land (e.g., Swapna's crop failure).", ch: "Money and Credit" },
    { q: "How do Multinational Corporations (MNCs) spread their production across countries? State any three ways.", ans: "1. Setting up joint ventures with local companies.\n2. Buying existing local companies and expanding production (e.g., Cargill Foods buying Parakh Foods).\n3. Placing manufacturing orders with small, dispersed producers globally.", ch: "Globalization and the Indian Economy" }
  ],
  las: [
    { q: "Describe the unification of Germany led by Otto von Bismarck. Highlight the three major wars involved.", ans: "Nationalist feelings were widespread among middle-class Germans who attempted to unite fragmented German confederations in 1848.\n1. Bismarck, the chief minister of Prussia, led the movement utilizing the Prussian army and bureaucracy.\n2. Over seven years, three wars were fought against Denmark, Austria, and France, ending in Prussian victory.\n3. In January 1871, the Prussian King Kaiser William I was proclaimed German Emperor at the Palace of Versailles.", ch: "The Rise of Nationalism in Europe" },
    { q: "Solve the following problem regarding various institutional and technological reforms introduced by the Government of India in the agricultural sector after independence.", ans: "Institutional Reforms:\n1. Collectivization, consolidation of land holdings, and abolition of the Zamindari system.\n2. Provision of crop insurance against drought, flood, cyclone, fire, and diseases.\n3. Establishment of Grameen banks, cooperative societies, and Kisan Credit Card (KCC).\nTechnological Reforms:\n4. Green Revolution using HYV seeds and chemical fertilizers, and White Revolution (Operation Flood).\n5. Special weather bulletins and agricultural programs broadcast over radio and television.", ch: "Agriculture" },
    { q: "'Democracy is seen to be good in principle, but felt to be not so good in its practice.' Critically evaluate this statement.", ans: "In Principle: Democracy promotes equality, enhances individual dignity, improves decision quality, and provides peaceful mechanisms to resolve social conflicts.\nIn Practice: Democracies often appear slow due to deliberative procedures, suffer from corruption, and do not eliminate poverty overnight.\nConclusion: Democracy is an enabling political framework that creates conditions for citizens to achieve goals, making it superior to any alternative regime.", ch: "Outcomes of Democracy" }
  ],
  cases: [
    {
      passage: "Power sharing arrangements can take many forms in modern democracies. In Belgium, the Constitution prescribes that the number of Dutch and French-speaking ministers shall be equal in the Central Government. Many powers of the Central Government have been given to State Governments of the two regions. Brussels has a separate government in which both communities have equal representation. This accommodative model prevented civil strife.",
      q: "Q1. What constitutional provision ensured linguistic equality in the Belgian Central Government? (1M)\nQ2. How did Brussels address the linguistic division between French and Dutch speakers? (1M)\nQ3. Contrast Belgium's model of accommodation with Sri Lanka's policy of Majoritarianism. (2M)",
      ans: "Q1. Equal number of Dutch and French-speaking ministers.\nQ2. Brussels established a separate government with equal community representation.\nQ3. Belgium recognized diversity and shared power equally, whereas Sri Lanka adopted majoritarian policies favoring Sinhala supremacy, which triggered civil war.",
      ch: "Power Sharing"
    },
    {
      passage: "Sustainable development requires balancing economic progress with environmental preservation. Groundwater in India is under serious threat of overuse in many parts of the country. About 300 districts have reported a water level decline of over 4 meters during the past 20 years. Nearly one-third of the country is overusing its groundwater reserves, particularly in agriculturally prosperous regions of Punjab and Western UP.",
      q: "Q1. Identify two regions in India facing severe groundwater overuse. (1M)\nQ2. What percentage of the country is currently overusing its groundwater reserves? (1M)\nQ3. Explain why sustainable development is crucial for future generations with reference to groundwater depletion. (2M)",
      ans: "Q1. Punjab and Western Uttar Pradesh.\nQ2. Nearly one-third (33%) of the country.\nQ3. Groundwater is a renewable resource, but if extraction exceeds natural recharge by rainfall, it leads to irreversible water scarcity, threatening food security and ecosystem survival.",
      ch: "Development"
    }
  ]
};

// ==========================================
// 4. ENGLISH LANGUAGE & LITERATURE (184) MASTER REPOSITORY
// ==========================================
export const ENGLISH_MASTER_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "In 'A Letter to God', what did Lencho compare the large raindrops to?", opts: ["A) New silver coins", "B) Pearls", "C) Diamonds", "D) Frozen tears"], ans: "A) New silver coins", ch: "First Flight: A Letter to God" },
    { q: "Who accompanied Nelson Mandela on the momentous day of his presidential inauguration?", opts: ["A) His daughter Zenani", "B) Walter Sisulu", "C) Oliver Tambo", "D) F.W. de Klerk"], ans: "A) His daughter Zenani", ch: "First Flight: Nelson Mandela" },
    { q: "In 'Two Stories About Flying', what food did the seagull's mother carry in her beak to tempt him into flying?", opts: ["A) A piece of fish", "B) Bread crumbs", "C) Earthworms", "D) Small insects"], ans: "A) A piece of fish", ch: "First Flight: Two Stories About Flying" },
    { q: "Anne Frank named her intimate diary companion:", opts: ["A) Kitty", "B) Margot", "C) Edith", "D) Peter"], ans: "A) Kitty", ch: "First Flight: From the Diary of Anne Frank" },
    { q: "According to Robert Frost in 'Fire and Ice', what human emotion does 'Ice' symbolize?", opts: ["A) Cold hatred and rigidity", "B) Uncontrolled greed", "C) Passionate love", "D) Fear and panic"], ans: "A) Cold hatred and rigidity", ch: "First Flight: Fire and Ice" },
    { q: "In 'A Tiger in the Zoo', where should the majestic tiger be lurking according to the poet?", opts: ["A) In long grass near the water hole", "B) In a concrete cage", "C) On top of rocky cliffs", "D) Inside a circus ring"], ans: "A) In long grass near the water hole", ch: "First Flight: A Tiger in the Zoo" },
    { q: "In 'The Ball Poem', what profound life lesson does the loss of the ball teach the young boy?", opts: ["A) Epistemology of loss and self-responsibility", "B) How to save money", "C) How to play carefully", "D) How to purchase better balls"], ans: "A) Epistemology of loss and self-responsibility", ch: "First Flight: The Ball Poem" },
    { q: "In 'A Triumph of Surgery', what was the genuine medical ailment troubling Tricki?", opts: ["A) Severe obesity and lethargy caused by overfeeding", "B) Viral bacterial fever", "C) Bone fracture", "D) Eye cataract"], ans: "A) Severe obesity and lethargy caused by overfeeding", ch: "Footprints without Feet: A Triumph of Surgery" },
    { q: "Hari Singh chose a new alias every single month in order to:", opts: ["A) Stay ahead of the police and former employers", "B) Impress Anil", "C) Travel across Indian states", "D) Write articles for magazines"], ans: "A) Stay ahead of the police and former employers", ch: "Footprints without Feet: The Thief's Story" },
    { q: "Griffin, the eccentric scientist, made his physical body invisible by consuming rare chemical formulations that made him as transparent as:", opts: ["A) A sheet of glass", "B) Clear pond water", "C) Clean air", "D) Melted ice"], ans: "A) A sheet of glass", ch: "Footprints without Feet: Footprints without Feet" },
    { q: "Fill in the blank with the correct verb: Neither the captain nor the sailors ______ saved from the shipwreck.", opts: ["A) were", "B) was", "C) is", "D) has been"], ans: "A) were", ch: "Grammar: Subject-Verb Concord" },
    { q: "Identify the error in the sentence: 'She has arrived in New Delhi since last Monday.'", opts: ["A) Replace 'since' with 'on'", "B) Replace 'has arrived' with 'had arrived'", "C) Replace 'in' with 'at'", "D) No error"], ans: "A) Replace 'since' with 'on'", ch: "Grammar: Prepositions & Tenses" },
    { q: "In 'Madam Rides the Bus', what was Valli's deepest and most overwhelming desire?", opts: ["A) To ride on the bus traveling between her village and the nearest town", "B) To visit the temple festival", "C) To buy toys from town", "D) To travel by train"], ans: "A) To ride on the bus traveling between her village and the nearest town", ch: "First Flight: Madam Rides the Bus" },
    { q: "According to Buddha in 'The Sermon at Benares', human life is brief, painful, and combined with:", opts: ["A) Inevitable suffering and mortality", "B) Material wealth", "C) Unbroken happiness", "D) Endless reincarnations"], ans: "A) Inevitable suffering and mortality", ch: "First Flight: The Sermon at Benares" },
    { q: "Choose the correct reported speech: She said, 'I finished my project yesterday.'", opts: ["A) She said that she had finished her project the previous day.", "B) She said that she finished her project yesterday.", "C) She said that she has finished her project yesterday.", "D) She told that she had finished project."], ans: "A) She said that she had finished her project the previous day.", ch: "Grammar: Reported Speech" },
    { q: "Select the correct determiner: 'There were ______ people at the lecture than expected due to heavy rain.'", opts: ["A) fewer", "B) less", "C) lesser", "D) few"], ans: "A) fewer", ch: "Grammar: Determiners" },
    { q: "In 'Bholi', why did Sulekha refuse to marry Bishamber Nath at the wedding altar?", opts: ["A) Because he demanded five thousand rupees dowry after seeing her pockmarks", "B) Because he was illiterate", "C) Because he was from another village", "D) Because her father forced her"], ans: "A) Because he demanded five thousand rupees dowry after seeing her pockmarks", ch: "Footprints without Feet: Bholi" },
    { q: "In 'The Trees' by Adrienne Rich, where are the trees moving from and to?", opts: ["A) From the interior rooms into the empty forest", "B) From the garden into the house", "C) From the mountain to the valley", "D) From the streets to the park"], ans: "A) From the interior rooms into the empty forest", ch: "First Flight Poetry: The Trees" }
  ],
  vsas: [
    { q: "Why did Lencho write a second letter to God? What did he request in it regarding the post office employees?", ans: "Lencho received only 70 pesos instead of 100. He requested God to send the remaining 30 pesos directly, believing post office employees were 'a bunch of crooks' who stole the rest.", ch: "First Flight: A Letter to God" },
    { q: "How did Nelson Mandela's perception of personal freedom transform as he grew from childhood into adulthood?", ans: "In boyhood, freedom meant running in fields; in youth, it meant personal career freedom; as a mature man, it became the collective liberation and human dignity of all oppressed South Africans.", ch: "First Flight: Nelson Mandela" },
    { q: "Why did Anil decide not to hand Hari Singh over to the police despite knowing about the stolen and returned money?", ans: "Anil recognized that Hari had resisted crime to pursue education. Forgiving Hari motivated genuine moral reformation more effectively than punishment.", ch: "Footprints without Feet: The Thief's Story" },
    { q: "Correct the following error and state the grammatical rule: 'Every student in the auditorium have received the examination admission slip.'", ans: "Correction: Replace 'have' with 'has'.\nRule: Distributive indefinite pronouns like 'Every' or 'Each' take a singular verb.", ch: "Grammar: Subject-Verb Agreement" },
    { q: "Read the dialogue and report the response:\nRohan: 'Where did you buy this antique clock?'\nMeera: 'I bought it from a flea market in London.'\nRohan asked Meera where she had bought that antique clock. Meera replied that __________.", ans: "she had bought it from a flea market in London.", ch: "Grammar: Reported Speech" },
    { q: "What was the real reason behind Amanda's yearning to be an orphan in the poem 'Amanda!'?", ans: "Amanda felt constantly nagged, instructed, and controlled by her parents. She fantasized about being an orphan roaming barefoot and enjoying golden silence and sweet, uninterrupted freedom.", ch: "First Flight Poetry: Amanda!" },
    { q: "Why was the twentieth century referred to as the 'Era of the Book' in 'The Book that Saved the Earth'?", ans: "Books were used for everything in those times—they taught people how, when, where, and why. They illustrated, educated, punctuated, and even decorated lives.", ch: "Footprints without Feet: The Book that Saved the Earth" }
  ],
  sas: [
    { q: "'Lencho displayed absolute faith in God, but complete distrust towards human beings.' Justify this statement in light of the story's ending.", ans: "Lencho had unshakable faith that God could never make a mistake or deny him money. However, he suspected the post office employees who selflessly sacrificed their own salaries to help him, illustrating poignant dramatic irony.", ch: "First Flight: A Letter to God" },
    { q: "What does the poet want to convey through the poem 'A Tiger in the Zoo'? Contrast the tiger's life in the wild with his captivity.", ans: "The poet critiques human cruelty in caging wild creatures. In the jungle, the tiger is majestic, lurking near water holes and terrorizing deer naturally; in captivity, he is helpless, ignoring visitors and staring at stars in quiet rage.", ch: "First Flight: A Tiger in the Zoo" },
    { q: "How did Richard Ebright's mother play a pivotal role in shaping him into a celebrated scientist?", ans: "She provided him with microscopes, cameras, and telescopes, took him on educational trips, and gifted him the book 'The Travels of Monarch X' which opened the world of science to him.", ch: "Footprints without Feet: The Making of a Scientist" },
    { q: "How did Valli plan and prepare for her maiden bus journey to the nearest town?", ans: "Valli listened carefully to conversations between neighbors and regular bus travelers. She calculated the fare (sixty paise both ways) and time (forty-five minutes each way), and painstakingly saved every stray coin by resisting temptations to buy peppermint, toys, and balloons.", ch: "First Flight: Madam Rides the Bus" },
    { q: "How does the Buddha make Kisa Gotami understand the inevitability of death in 'The Sermon at Benares'?", ans: "The Buddha asks Kisa Gotami to bring a handful of mustard seeds from a household where no child, husband, parent, or friend has ever died. When she finds no such house, she realizes that grief is universal and death is the common destiny of all mortals.", ch: "First Flight: The Sermon at Benares" },
    { q: "Describe the atmosphere and comic elements during the arguments over 'Oxen Meadows' in Anton Chekhov's play 'The Proposal'.", ans: "Lomov arrives in formal dress to propose to Natalya, but petty ego triggers fierce disputes over trivial property rights over Oxen Meadows and the hunting prowess of their dogs (Guess vs. Squeezer), satirizing the materialistic marriage traditions of 19th-century Russian gentry.", ch: "First Flight: The Proposal" }
  ],
  las: [
    { q: "SECTION B: CREATIVE WRITING SKILLS - FORMAL LETTER TO EDITOR (5 MARKS)\n\nYou are Priya / Prateek, a resident of 45-B, Vasant Kunj, New Delhi. You have observed a severe decline in open green spaces and parks in your residential sector due to illegal commercial parking and construction debris.\n\nWrite a formal Letter to the Editor of 'The Hindustan Times' (100–120 words) expressing your grave concern over diminishing recreational grounds for children and elderly residents. Suggest remedial measures like strict civic penalties, regular municipal inspections, and community tree plantation drives.", ans: "Format: Sender's Address, Date, Receiver's Designation & Address, Subject, Salutation, 3-Paragraph Body, Complimentary Close.\nContent Points:\n- Para 1: Draw attention to illegal encroachment and shrinking green spaces in Vasant Kunj.\n- Para 2: Serious impact on elderly health, childhood outdoor activity, and air quality.\n- Para 3: Actionable recommendations (heavy municipal fines, dedicated parking bays, resident plantation campaigns).", ms: "[1 Mark] Format: Complete standard CBSE layout\n[2 Marks] Content: Cohesive arguments & practical suggestions\n[2 Marks] Expression: Accurate grammar, vocabulary & tone", ch: "Writing Skills: Formal Letter" },
    { q: "SECTION B: CREATIVE WRITING SKILLS - ANALYTICAL PARAGRAPH (5 MARKS)\n\nThe bar graph below shows the preferred modes of secondary study resources used by Class 10 CBSE students in 2025:\n• Interactive AI Mock Tests & Question Banks: 45%\n• Textbooks & NCERT Exemplar Books: 30%\n• Classroom Lectures & Teacher Notes: 15%\n• Peer Study & Group Discussions: 10%\n\nWrite an Analytical Paragraph (100–120 words) analyzing the given data. Compare key trends, highlight significant insights, and state a brief concluding synthesis.", ans: "Structure:\n1. Intro: Introduce the data on preferred secondary study tools among Class 10 students.\n2. Comparison: Digital AI test platforms dominate at 45%, followed closely by foundational NCERT textbooks at 30%. Classroom lectures and peer discussions account for the remaining 25% combined.\n3. Conclusion: A blended model combining AI-driven adaptive practice with NCERT conceptual mastery represents the prevailing modern academic trend.", ms: "[1 Mark] Organization & Introductory Overview\n[2 Marks] Comparative Data Analysis & Trend Interpretation\n[2 Marks] Language Accuracy, Coherence & Conclusion", ch: "Writing Skills: Analytical Paragraph" },
    { q: "What according to Nelson Mandela are the 'twin obligations' every human being owes in life? Why was it impossible for a man of colour to fulfill both in apartheid South Africa?", ans: "Twin Obligations: 1. Duty to family, parents, wife, and children. 2. Duty to people, community, and country. In Apartheid South Africa, any black person trying to fulfill his duty to his community was branded an outlaw, ripped from his home, and forced to live an isolated existence.", ch: "First Flight: Nelson Mandela" },
    { q: "Matilda's excessive vanity and longing for luxury ruined ten precious years of her life. Elaborate with reference to Guy de Maupassant's 'The Necklace'.", ans: "Matilda was never content with her modest lifestyle. To appear wealthy at a ball, she borrowed a necklace, lost it, and spent ten agonizing years doing menial manual labor to repay loans, only to discover the original was cheap imitation jewelry.", ch: "Footprints without Feet: The Necklace" },
    { q: "'Education transformed Bholi from a hesitant, stammering girl into a self-confident, dignified woman.' Analyze the role of Bholi's school teacher in shaping her destiny.", ans: "Bholi was neglected by her family due to her pockmarks and stammer. Her kind school teacher treated her with affectionate patience, encouraging her to speak without fear and inspiring her with knowledge. This education empowered Bholi to reject a greedy, abusive groom with courage and self-respect.", ch: "Footprints without Feet: Bholi" }
  ],
  cases: [
    {
      passage: "Read the unseen passage carefully:\nMindfulness and reading habit among youth have witnessed a profound renaissance in recent times. Neuroscientific research reveals that immersive reading of literary works enhances neural connectivity in the brain's left temporal cortex, which is responsible for language reception and empathy. Unlike superficial scrolling on social feeds, deep reading requires cognitive endurance, expanding vocabulary and reducing cortisol stress hormones by nearly 68%. Educational psychologists emphasize that dedicating just 20 minutes a day to undisturbed reading significantly improves analytical problem-solving and emotional intelligence in adolescents.",
      q: "Q1. Which region of the brain is activated during literary reading and what is its primary function? (1M)\nQ2. According to neuroscientific findings, by what percentage does deep reading reduce stress hormone cortisol? (1M)\nQ3. State two distinct cognitive benefits that adolescents gain from 20 minutes of daily reading practice. (2M)",
      ans: "Q1. The left temporal cortex, responsible for language reception, comprehension, and empathy.\nQ2. By nearly 68%.\nQ3. (i) Expands vocabulary and enhances cognitive endurance. (ii) Improves analytical problem-solving skills and emotional intelligence.",
      ch: "Reading Comprehension: Discursive Passage"
    },
    {
      passage: "Read the case excerpt on Climate Resilient Agriculture:\nRecent agricultural studies indicate that micro-irrigation systems like drip and sprinkler networks increase crop yield by 25–40% while reducing water consumption by almost 50%. In semi-arid regions of Rajasthan and Gujarat, over 1.2 million farming households have transitioned to solar-powered drip pumps, lowering diesel dependency and boosting farm incomes.",
      q: "Q1. By what percentage does micro-irrigation reduce farm water consumption? (1M)\nQ2. State two major benefits experienced by farmers in semi-arid regions. (2M)\nQ3. Find a word from the passage that means 'semi-dry or receiving little rainfall'. (1M)",
      ans: "Q1. Almost 50%.\nQ2. Reduced diesel dependency and boosted farm household incomes.\nQ3. 'Semi-arid'.",
      ch: "Reading Comprehension: Factual Passage"
    }
  ]
};

// ==========================================
// 5. INFORMATION TECHNOLOGY (402) MASTER REPOSITORY
// ==========================================
export const IT_MASTER_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "In LibreOffice Calc, which analysis tool calculates the single input value required to achieve a desired target formula result?", opts: ["A) Goal Seek", "B) Scenarios", "C) Solver", "D) Subtotal"], ans: "A) Goal Seek", ch: "Electronic Spreadsheet (Advanced)" },
    { q: "In RDBMS, a column or set of columns that uniquely identifies each tuple (record) in a relation is called a:", opts: ["A) Primary Key", "B) Foreign Key", "C) Alternate Key", "D) Composite Key"], ans: "A) Primary Key", ch: "Database Management System" },
    { q: "Which key opens the 'Styles and Formatting' sidebar in LibreOffice Writer?", opts: ["A) F11", "B) F5", "C) F7", "D) F12"], ans: "A) F11", ch: "Digital Documentation (Advanced)" },
    { q: "Which tool in LibreOffice Calc is used to combine and summarize numerical figures from multiple individual sheets into a master worksheet?", opts: ["A) Consolidate", "B) Scenario Manager", "C) Data Pilot", "D) Group & Outline"], ans: "A) Consolidate", ch: "Electronic Spreadsheet (Advanced)" },
    { q: "Which SQL command is used to fetch and display records matching specified criteria from a database table?", opts: ["A) SELECT", "B) DISPLAY", "C) GET", "D) EXTRACT"], ans: "A) SELECT", ch: "Database Management System" },
    { q: "Which SQL clause is used to filter records based on a specific condition?", opts: ["A) WHERE", "B) ORDER BY", "C) GROUP BY", "D) HAVING"], ans: "A) WHERE", ch: "Database Management System" },
    { q: "Which of the following is an example of an ergonomics hazard in computer workplaces?", opts: ["A) Poor chair posture causing lower back strain", "B) High electrical voltage", "C) Slippery wet floors", "D) Loud factory sirens"], ans: "A) Poor chair posture causing lower back strain", ch: "Maintain Workplace Health and Safety" },
    { q: "In LibreOffice Calc, a formula with an absolute cell reference is represented as:", opts: ["A) $A$1", "B) A1", "C) #A#1", "D) &A&1"], ans: "A) $A$1", ch: "Electronic Spreadsheet (Advanced)" }
  ],
  vsas: [
    { q: "Solve the following problem regarding difference between Primary Key and Foreign Key with an example table.", ans: "Primary Key uniquely identifies rows in a table (e.g., Student_ID). Foreign Key references the Primary Key of another table (e.g., Dept_ID in Employee table) to create a relational link.", ch: "Database Management System" },
    { q: "What is Goal Seek in spreadsheets? Give one practical business scenario where Goal Seek is useful.", ans: "Goal Seek finds the unknown input value required to achieve a specific target formula output. Scenario: Calculating the sales volume needed to achieve a target monthly profit of ₹50,000.", ch: "Electronic Spreadsheet (Advanced)" },
    { q: "State two advantages of using Styles in LibreOffice Writer.", ans: "1. Maintains consistent typography and layout formatting throughout long documents.\n2. Enables automated generation and updates of the Table of Contents.", ch: "Digital Documentation (Advanced)" }
  ],
  sas: [
    { q: "Solve the following problem regarding concept of 'Scenarios' and 'Solver' in LibreOffice Calc. How does Solver differ from Goal Seek?", ans: "Scenarios save and compare different sets of what-if variables. Goal Seek works with only one variable, whereas Solver can optimize formulas involving multiple independent variables and constraints.", ch: "Electronic Spreadsheet (Advanced)" },
    { q: "Write SQL statements for the following operations on table 'STUDENT' (RollNo, Name, Marks, Stream):\n(i) Display details of students scoring more than 85 marks.\n(ii) Display all students belonging to the 'Science' stream sorted alphabetically by Name.", ans: "(i) SELECT * FROM STUDENT WHERE Marks > 85;\n(ii) SELECT * FROM STUDENT WHERE Stream = 'Science' ORDER BY Name ASC;", ch: "Database Management System" }
  ],
  las: [
    { q: "Consider table 'EMPLOYEE' with fields: EmpId, EmpName, Department, Salary, City.\n(a) Identify the field most suitable to be designated as Primary Key and state reason.\n(b) Write SQL query to display all employees whose Salary is between ₹40,000 and ₹75,000.\n(c) Write SQL query to count the number of employees in each Department.\n(d) Write SQL query to list unique cities where employees reside.", ans: "(a) EmpId because it guarantees unique values for every employee.\n(b) SELECT * FROM EMPLOYEE WHERE Salary BETWEEN 40000 AND 75000;\n(c) SELECT Department, COUNT(*) FROM EMPLOYEE GROUP BY Department;\n(d) SELECT DISTINCT City FROM EMPLOYEE;", ch: "Database Management System" }
  ],
  cases: [
    {
      passage: "A cyber café operates 15 workstations connected over an Ethernet local area network. The network administrator configures firewalls, sets up user access permissions, and instructs staff to follow ergonomic guidelines.",
      q: "Q1. State two security measures to safeguard user data in a shared network. (2M)\nQ2. What ergonomic adjustment helps prevent eye fatigue during screen work? (2M)",
      ans: "Q1. Install updated antivirus firewalls and mandate secure logout/passwords.\nQ2. Maintain a 20-inch viewing distance, position monitor slightly below eye level, and take 20-second breaks every 20 minutes.",
      ch: "Web Applications and Security"
    }
  ]
};

// ==========================================
// 6. HINDI COURSE A (002) MASTER REPOSITORY
// ==========================================
export const HINDI_A_MASTER_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "‘जो व्यक्ति परिश्रमी होता है, वह सदा सफल होता है।’ रचना के आधार पर वाक्य का भेद है:", opts: ["A) मिश्र वाक्य", "B) सरल वाक्य", "C) संयुक्त वाक्य", "D) विधिवाचक वाक्य"], ans: "A) मिश्र वाक्य", ch: "व्यावहारिक व्याकरण: वाक्य भेद" },
    { q: "‘हालदार साहब द्वारा चश्मेवाले को देखा गया।’ इस वाक्य का वाच्य भेद है:", opts: ["A) कर्मवाच्य", "B) कर्तृवाच्य", "C) भाववाच्य", "D) करणवाच्य"], ans: "A) कर्मवाच्य", ch: "व्यावहारिक व्याकरण: वाच्य" },
    { q: "‘चरण कमल बंदौ हरिराई’ में कौन-सा अलंकार है?", opts: ["A) रूपक अलंकार", "B) उपमा अलंकार", "C) उत्प्रेक्षा अलंकार", "D) अतिशयोक्ति अलंकार"], ans: "A) रूपक अलंकार", ch: "व्यावहारिक व्याकरण: अलंकार" },
    { q: "‘नेताजी का चश्मा’ पाठ में कैप्टन कौन था?", opts: ["A) एक देशभक्त चश्मेवाला फेरीवाला", "B) नगरपालिका अध्यक्ष", "C) पानवाला", "D) मास्टर मोतीलाल"], ans: "A) एक देशभक्त चश्मेवाला फेरीवाला", ch: "क्षितिज: नेताजी का चश्मा" },
    { q: "बालगोबिन भगत किसे ‘साहब’ मानते थे और उन्हीं के पदों का गायन करते थे?", opts: ["A) कबीरदास को", "B) सूरदास को", "C) तुलसीदास को", "D) रैदास को"], ans: "A) कबीरदास को", ch: "क्षितिज: बालगोबिन भगत" },
    { q: "गोपियों ने उद्धव के योग संदेश की तुलना किससे की है?", opts: ["A) कड़वी ककड़ी और व्याधि (बीमारी) से", "B) मीठे फल से", "C) अमृत से", "D) चंदन से"], ans: "A) कड़वी ककड़ी और व्याधि (बीमारी) से", ch: "क्षितिज: सूरदास के पद" },
    { q: "‘माता का अँचल’ पाठ में भोलानाथ का वास्तविक नाम क्या था?", opts: ["A) तारकेश्वरनाथ", "B) विश्वनाथ", "C) अमरनाथ", "D) केदारनाथ"], ans: "A) तारकेश्वरनाथ", ch: "कृतिका: माता का अँचल" }
  ],
  vsas: [
    { q: "‘सेनानी न होते हुए भी चश्मेवाले को लोग कैप्टन क्यों कहते थे?’ पाठ के आधार पर स्पष्ट कीजिए।", ans: "कैप्टन के हृदय में स्वतंत्रता सेनानियों व देश के शहीदों के प्रति अगाध श्रद्धा थी। नेताजी की बिना चश्मे वाली मूर्ति देखकर उसे आहत होता था, इसलिए लोग उसे आदर से कैप्टन कहते थे।", ch: "क्षितिज: नेताजी का चश्मा" },
    { q: "गोपियों के अनुसार सच्चा राजधर्म क्या होना चाहिए? सूरदास के पद के आधार पर लिखिए।", ans: "सच्चा राजधर्म वही है जिसमें प्रजा को किसी प्रकार का कष्ट न हो और प्रजा के सुख-चैन तथा कल्याण की सदैव रक्षा की जाए।", ch: "क्षितिज: सूरदास के पद" },
    { q: "बालगोबिन भगत के गायन की दो प्रमुख विशेषताएँ अपने शब्दों में लिखिए।", ans: "1. उनके गायन में भक्ति की अपूर्व तन्मयता और जादुई मिठास थी। 2. उनका स्वर खेतों में काम करने वाले किसानों और बच्चों में स्फूर्ति भर देता था।", ch: "क्षितिज: बालगोबिन भगत" }
  ],
  sas: [
    { q: "‘लक्ष्मण-परशुराम संवाद’ प्रसंग में लक्ष्मण के वाक-चातुर्य और व्यंग्योक्तियों की सोदाहरण समीक्षा कीजिए।", ans: "लक्ष्मण ने निर्भीकता और हास्य-व्यंग्य के साथ परशुराम के क्रोध व आत्मप्रशंसा का प्रत्युत्तर दिया। उन्होंने धनुष को साधारण धनुही बताकर और कुठार पर कटाक्ष कर परशुराम की अतिशयोक्ति को उजागर किया।", ch: "क्षितिज: राम-लक्ष्मण-परशुराम संवाद" },
    { q: "‘माता का अँचल’ शीर्षक की सार्थकता पाठ की प्रमुख घटनाओं के आलोक में सिद्ध कीजिए।", ans: "विपत्ति और भय के समय भोलानाथ को पिता के लाड़-प्यार की अपेक्षा माँ के आँचल में ही परम सुरक्षा, वात्सल्य और मानसिक शांति की अनुभूति होती है, जो शीर्षक को पूर्णतः सार्थक बनाता है।", ch: "कृतिका: माता का अँचल" }
  ],
  las: [
    { q: "‘बालगोबिन भगत’ पाठ के आधार पर सिद्ध कीजिए कि बालगोबिन भगत का व्यक्तित्व एक सच्चे गृहस्थ और विरक्त संन्यासी का अनूठा समन्वय था।", ans: "भगत जी खेती-बारी करते हुए परिवार सहित रहते थे परंतु मन से कबीर के आदर्शों पर चलकर अनासक्त जीवन जीते थे। वे कभी झूठ नहीं बोलते थे, किसी की वस्तु बिना पूछे नहीं छूते थे और सामाजिक कुरीतियों का साहसपूर्वक विरोध करते हुए पुत्र की मृत्यु पर रोने के बजाय उत्सव मनाते थे।", ch: "क्षितिज: बालगोबिन भगत" }
  ],
  cases: [
    {
      passage: "‘मूर्ति संगमरमर की थी। टोपी की नोक से कोट के दूसरे बटन तक कोई दो फुट ऊँची। जिसे कहते हैं बस्ट; और सुंदर थी। नेताजी सुंदर लग रहे थे। कुछ-कुछ मासूम और कमसिन। फौजी वर्दी में। मूर्ति को देखते ही ‘दिल्ली चलो’ और ‘तुम मुझे खून दो...’ वगैरह याद आने लगते थे। केवल एक चीज़ की कसर थी—नेताजी की आँखों पर चश्मा नहीं था।’",
      q: "Q1. नेताजी की मूर्ति किस प्रकार की थी और उसका आकार क्या था? (1M)\nQ2. मूर्ति को देखकर कौन-से प्रसिद्ध राष्ट्रीय नारे याद आते थे? (1M)\nQ3. मूर्ति में किस मुख्य बात की कमी थी और उसे कौन पूरा करता था? (2M)",
      ans: "Q1. मूर्ति संगमरमर की लगभग दो फुट ऊँची (बस्ट) थी।\nQ2. ‘दिल्ली चलो’ और ‘तुम मुझे खून दो, मैं तुम्हें आज़ादी दूंगा’।\nQ3. मूर्ति पर संगमरमर का चश्मा नहीं था, जिसे देशभक्त कैप्टन चश्मेवाला सचमुच का चश्मा पहनाकर पूरा करता था।",
      ch: "क्षितिज: नेताजी का चश्मा"
    }
  ]
};

// ==========================================
// 7. HINDI COURSE B (085) MASTER REPOSITORY
// ==========================================
export const HINDI_B_MASTER_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "‘दशरथ सुत श्रीराम ने रावण का वध किया।’ रेखांकित पद ‘दशरथ सुत श्रीराम’ में पदबंध है:", opts: ["A) संज्ञा पदबंध", "B) विशेषण पदबंध", "C) क्रिया पदबंध", "D) सर्वनाम पदबंध"], ans: "A) संज्ञा पदबंध", ch: "व्यावहारिक व्याकरण: पदबंध" },
    { q: "‘बड़े भाई साहब’ कहानी में लेखक ने किस विसंगति पर मुख्य व्यंग्य किया है?", opts: ["A) रटंत शिक्षा प्रणाली और परीक्षा पद्धति पर", "B) खेलकूद पर", "C) पारिवारिक झगड़ों पर", "D) निर्धनता पर"], ans: "A) रटंत शिक्षा प्रणाली और परीक्षा पद्धति पर", ch: "स्पर्श: बड़े भाई साहब" },
    { q: "‘नीलकमल’ शब्द में कौन-सा समास है?", opts: ["A) कर्मधारय समास", "B) तत्पुरुष समास", "C) द्विगु समास", "D) द्वंद्व समास"], ans: "A) कर्मधारय समास", ch: "व्यावहारिक व्याकरण: समास" },
    { q: "‘कस्तूरी कुंडल बसै, मृग ढूँढै बन माहिं।’ साखी में कबीरदास जी क्या संदेश देते हैं?", opts: ["A) ईश्वर मनुष्य के अंतःकरण (घट-घट) में वास करते हैं", "B) मृग कस्तूरी ढूंढता है", "C) वन में भटकना चाहिए", "D) तीर्थ यात्रा आवश्यक है"], ans: "A) ईश्वर मनुष्य के अंतःकरण (घट-घट) में वास करते हैं", ch: "स्पर्श: कबीर की साखी" },
    { q: "‘हरिहर काका’ की कितनी बीघे जमीन पर उनके भाइयों और महंत की लालची नजर थी?", opts: ["A) 15 बीघे", "B) 20 बीघे", "C) 10 बीघे", "D) 25 बीघे"], ans: "A) 15 बीघे", ch: "संचयन: हरिहर काका" },
    { q: "सुभाष चंद्र बोस की मूर्ति पर चश्मा कौन बदलता था?", opts: ["A) कैप्टन चश्मेवाला", "B) पानवाला", "C) हलवाई", "D) मूर्तिकार मोतीलाल"], ans: "A) कैप्टन चश्मेवाला", ch: "स्पर्श: नेताजी का चश्मा" },
    { q: "‘मीरा के पद’ में मीराबाई किसके दर्शन करने को आतुर हैं?", opts: ["A) श्री कृष्ण के", "B) अर्जुन के", "C) उद्धव के", "D) सूरदास के"], ans: "A) श्री कृष्ण के", ch: "स्पर्श: मीरा के पद" },
    { q: "‘तीसरे कसम के शिल्पकार शैलेंद्र’ पाठ के अनुसार शैलेंद्र ने किस प्रसिद्ध फिल्म का निर्देशन किया था?", opts: ["A) तीसरी कसम", "B) आवारा", "C) श्री 420", "D) गाइड"], ans: "A) तीसरी कसम", ch: "स्पर्श: तीसरी कसम के शिल्पकार शैलेंद्र" },
    { q: "‘गिरगिट’ कहानी में अंत में पुलिस अधीक्षक ओचुमेलॉव किसकी बात पर हँसता है?", opts: ["A) ख्र्यूकिन पर", "B) जनरल के बावर्ची पर", "C) कुत्ते पर", "D) भीड़ पर"], ans: "A) ख्र्यूकिन पर", ch: "स्पर्श: गिरगिट" },
    { q: "‘पतझर में सह-डिप्रेसिव’ पाठ में किस समस्या पर प्रहार किया गया है?", opts: ["A) पर्यावरण असंतुलन और अंधाधुंध शहरीकरण", "B) पढ़ाई का तनाव", "C) खेलकूद की कमी", "D) पारिवारिक कलह"], ans: "A) पर्यावरण असंतुलन और अंधाधुंध शहरीकरण", ch: "स्पर्श: पतझर में सह-डिप्रेसिव" },
    { q: "रचना के आधार पर वाक्य के कितने भेद होते हैं?", opts: ["A) तीन", "B) दो", "C) चार", "D) पाँच"], ans: "A) तीन", ch: "व्यावहारिक व्याकरण: वाक्य रूपांतरण" },
    { q: "‘जो परिश्रम करेगा, वह सफलता पाएगा।’ यह किस प्रकार का वाक्य है?", opts: ["A) मिश्र वाक्य", "B) सरल वाक्य", "C) संयुक्त वाक्य", "D) निषेधवाचक वाक्य"], ans: "A) मिश्र वाक्य", ch: "व्यावहारिक व्याकरण: रचना के आधार पर वाक्य भेद" },
    { q: "‘सूर्योदय हुआ और कोहरा छंट गया।’ इस वाक्य को सरल वाक्य में बदल्ने पर सही रूप होगा:", opts: ["A) सूर्योदय होने पर कोहरा छंट गया", "B) सूर्योदय हुआ इसलिए कोहरा छंट गया", "C) जब सूर्योदय हुआ तब कोहरा छटा", "D) कोहरा छंट गया क्योंकि सूर्योदय हुआ"], ans: "A) सूर्योदय होने पर कोहरा छंट गया", ch: "व्यावहारिक व्याकरण: वाक्य रूपांतरण" },
    { q: "समास के कितने मुख्य भेद माने जाते हैं?", opts: ["A) छः", "B) चार", "C) पाँच", "D) सात"], ans: "A) छः", ch: "व्यावहारिक व्याकरण: समास" },
    { q: "‘चतुर्नाम’ या ‘चतुरानन’ में कौन-सा समास है?", opts: ["A) बहुव्रीहि समास", "B) अव्ययीभाव समास", "C) द्वंद्व समास", "D) कर्मधारय समास"], ans: "A) बहुव्रीहि समास", ch: "व्यावहारिक व्याकरण: समास" },
    { q: "‘मुँहतोड़’ शब्द में कौन-सा समास विग्रह और भेद है?", opts: ["A) मुँह को तोड़ने वाला - तत्पुरुष समास", "B) मुँह और तोड़ - द्वंद्व समास", "C) मुँह से थोड़ा - कर्मधारय समास", "D) मुँह के लिए तोड़ - अव्ययीभाव समास"], ans: "A) मुँह को तोड़ने वाला - तत्पुरुष समास", ch: "व्यावहारिक व्याकरण: समास" },
    { q: "पद-परिचय देते समय इनमें से किस बात का उल्लेख नहीं किया जाता?", opts: ["A) लेखक का नाम", "B) पद का भेद", "C) लिंग और वचन", "D) कारक और संबंध"], ans: "A) लेखक का नाम", ch: "व्यावहारिक व्याकरण: पद-परिचय" },
    { q: "‘गीता ने सुंदर पुस्तक पढ़ी।’ रेखांकित शब्द ‘सुंदर’ का पद-परिचय होगा:", opts: ["A) गुणवाचक विशेषण, स्त्रीलिंग, एकवचन, ‘पुस्तक’ संज्ञा की विशेषता", "B) संज्ञा, एकवचन", "C) क्रिया-विशेषण", "D) सर्वनाम"], ans: "A) गुणवाचक विशेषण, स्त्रीलिंग, एकवचन, ‘पुस्तक’ संज्ञा की विशेषता", ch: "व्यावहारिक व्याकरण: पद-परिचय" },
    { q: "मुहावरे ‘आँखों का तारा होना’ का सही अर्थ है:", opts: ["A) अत्यधिक प्रिय होना", "B) आँख में दर्द होना", "C) तारा देखना", "D) नाराज होना"], ans: "A) अत्यधिक प्रिय होना", ch: "व्यावहारिक व्याकरण: मुहावरे" },
    { q: "‘अंगा-बैंगा खेलना’ या ‘अँगूठा दिखाना’ मुहावरे का सही अर्थ है:", opts: ["A) समय पर सहायता करने से इनकार करना", "B) अंगूठा चूसना", "C) खेल खेलना", "D) प्रशंसा करना"], ans: "A) समय पर सहायता करने से इनकार करना", ch: "व्यावहारिक व्याकरण: मुहावरे" },
    { q: "‘ततारा-वामीरो कथा’ किस द्वीप की लोककथा पर आधारित है?", opts: ["A) अंडमान और निकोबार द्वीप समूह", "B) लक्षद्वीप", "C) श्रीलंका", "D) जावा द्वीप"], ans: "A) अंडमान और निकोबार द्वीप समूह", ch: "स्पर्श: ततारा-वामीरो कथा" },
    { q: "‘कारतूस’ एकांकी के मुख्य पात्र वजीर अली का संबंध किस ऐतिहासिक व्यक्तित्व से था?", opts: ["A) नवाब वजीर अली खान (अवध के नवाब)", "B) टीपू सुल्तान", "C) झांसी की रानी", "D) नाना साहब"], ans: "A) नवाब वजीर अली खान (अवध के नवाब)", ch: "स्पर्श: कारतूस" },
    { q: "कबीर की भाषा को क्या कहा जाता है?", opts: ["A) सधुक्कड़ी या पंचमेल खिचड़ी", "B) अवधी", "C) ब्रजभाषा", "D) मैथिली"], ans: "A) सधुक्कड़ी या पंचमेल खिचड़ी", ch: "स्पर्श: कबीर की साखी" },
    { q: "‘डायरी का एक पन्ना’ पाठ में किस ऐतिहासिक तिथि का वर्णन है?", opts: ["A) 26 जनवरी 1931", "B) 15 अगस्त 1947", "C) 26 जनवरी 1950", "D) 2 अक्टूबर 1869"], ans: "A) 26 जनवरी 1931", ch: "स्पर्श: डायरी का एक पन्ना" },
    { q: "‘हरिहर काका’ कहानी में लेखक और हरिहर काका के बीच क्या संबंध था?", opts: ["A) पड़ोसी और पारिवारिक स्नेह का", "B) भाई-भाइयों का", "C) शिक्षक-छात्र का", "D) जमींदार और किसान का"], ans: "A) पड़ोसी और पारिवारिक स्नेह का", ch: "संचयन: हरिहर काका" }
  ],
  vsas: [
    { q: "‘बड़े भाई साहब’ पाठ में छोटे भाई ने बड़े भाई साहब के नरम व्यवहार का क्या अनुचित लाभ उठाया?", ans: "छोटा भाई स्वच्छंद होकर पढ़ाई-लिखाई छोड़कर ज्यादातर समय कनकौए उड़ाने और खेलने-कूदने में बिताने लगा।", ch: "स्पर्श: बड़े भाई साहब" },
    { q: "‘मीठी वाणी बोलने से औरों को सुख और अपने तन को शीतलता कैसे प्राप्त होती है?’ कबीर की साखी के आधार पर लिखिए।", ans: "मीठी वाणी से दूसरों के मन का तनाव और कटुता समाप्त होती है तथा अपने मन का अहंकार मिटकर आत्मिक शीतलता और आनंद मिलता है।", ch: "स्पर्श: कबीर की साखी" },
    { q: "‘ततारा-वामीरो कथा’ में ततारा की तलवार के बारे में लोगों का क्या विश्वास था?", ans: "लोगों का विश्वास था कि ततारा की लकड़ी की तलवार में कोई अद्भुत और विलक्षण दैवीय शक्ति है, जिससे वह असाधारण कार्य कर लेता है।", ch: "स्पर्श: ततारा-वामीरो कथा" },
    { q: "‘तीसरी कसम’ फिल्म के निर्माता के रूप में शैलेंद्र को किन कठिनाइयों का सामना करना पड़ा?", ans: "शैलेंद्र को फिल्म व्यवसाय की स्वार्थपरकता और व्यावहारिकता का ज्ञान नहीं था। वितरकों ने फिल्म की कलात्मकता के कारण उसे खरीदने से मना कर दिया था।", ch: "स्पर्श: तीसरी कसम के शिल्पकार शैलेंद्र" },
    { q: "‘गिरगिट’ कहानी में ओचुमेलॉव अपने निर्णय बार-बार क्यों बदलता है?", ans: "ओचुमेलॉव एक चापलूस और अवसरवादी पुलिस इंस्पेक्टर है। वह कुत्ते के मालिक (जनरल साहब या साधारण व्यक्ति) के अनुसार अपना निर्णय और व्यवहार बदलता है।", ch: "स्पर्श: गिरगिट" },
    { q: "‘अब कहाँ दूसरे के दुख से दुखी होने वाले’ पाठ में सुलेमान की क्या विशेषता बताई गई है?", ans: "सुलेमान केवल मानव जाति के ही नहीं, बल्कि सभी पशु-पक्षियों और चींटियों की भाषा भी समझते थे और वे उनके भी रक्षक और हमदर्द थे।", ch: "स्पर्श: अब कहाँ दूसरे के दुख से दुखी होने वाले" },
    { q: "‘पतझर में टूटी पत्तियाँ’ में जापानी लोग ‘टी-सेरेमनी’ (चा-नो-यू) क्यों करते हैं?", ans: "वे मानसिक शांति और तनाव से मुक्ति पाने के लिए टी-सेरेमनी करते हैं, जहाँ अत्यधिक शांतिपूर्ण वातावरण में चाय पीते हुए वे वर्तमान क्षण में जीते हैं।", ch: "स्पर्श: पतझर में टूटी पत्तियाँ" },
    { q: "कर्नल कालिंज का खेमा जंगल में क्यों लगा हुआ था?", ans: "कर्नल कालिंज का खेमा वजीर अली को गिरफ्तार करने के लिए लगा हुआ था, जो अपने कुछ साथियों के साथ जंगल में छिपा हुआ था।", ch: "स्पर्श: कारतूस" }
  ],
  sas: [
    { q: "‘बड़े भाई साहब’ की डाँट-फटकार अगर न मिलती, तो क्या छोटा भाई कक्षा में प्रथम आता? अपने विचार लिखिए।", ans: "नहीं, बड़े भाई साहब की सतत निगरानी, अनुशासन और समय-समय पर दी गई नसीहतों के डर से ही छोटा भाई अनुशासित रहकर एकाग्रता से पढ़ सका और प्रथम आया।", ch: "स्पर्श: बड़े भाई साहब" },
    { q: "‘डायरी का एक पन्ना’ के माध्यम से स्पष्ट कीजिए कि स्वतंत्रता आंदोलन में कलकत्ता वासियों का क्या अभूतपूर्व योगदान था?", ans: "26 जनवरी 1931 को पुलिस की लाठियों और दमन के बावजूद स्त्रियों, पुरुषों और छात्रों ने विराट जुलूस निकालकर मॉन्युमेंट पर झंडा फहराकर अभूतपूर्व साहस दिखाया।", ch: "स्पर्श: डायरी का एक पन्ना" },
    { q: "वामीरो से मिलने के बाद ततारा के स्वभाव में क्या परिवर्तन आया?", ans: "वामीरो से मिलने के बाद ततारा बेचैन और खोया-खोया रहने लगा। उसे अपनी सुध-बुध नहीं रही और वह हर शाम समुद्र के किनारे वामीरो के आने की प्रतीक्षा करने लगा।", ch: "स्पर्श: ततारा-वामीरो कथा" },
    { q: "‘मनुष्यता’ कविता के आधार पर बताइए कि सच्चा मनुष्य कौन है?", ans: "सच्चा मनुष्य वही है जो केवल अपने स्वार्थ के लिए नहीं जीता, बल्कि दूसरों के कल्याण के लिए अपना सर्वस्व न्योछावर कर देता है। उसमें सहानुभूति, परोपकार और विश्वबंधुत्व की भावना होती है।", ch: "स्पर्श: मनुष्यता" },
    { q: "‘पर्वत प्रदेश में पावस’ कविता में तालाब की तुलना किससे की गई है और क्यों?", ans: "तालाब की तुलना एक विशाल और स्वच्छ दर्पण से की गई है क्योंकि उसका जल इतना पारदर्शी है कि उसमें विशाल पर्वत अपने फूलों रूपी आँखों से अपना भव्य आकार निहार रहा है।", ch: "स्पर्श: पर्वत प्रदेश में पावस" },
    { q: "‘कर चले हम फ़िदा’ गीत के आधार पर बताइए कि सैनिकों ने देशवासियों से क्या अपेक्षाएँ की हैं?", ans: "सैनिक देशवासियों से अपेक्षा करते हैं कि उनके बलिदान के बाद वे देश की रक्षा का भार संभालें, देश के सम्मान (सीता के दामन) पर कोई आँच न आने दें और मातृभूमि के लिए अपना खून बहाने को तत्पर रहें।", ch: "स्पर्श: कर चले हम फ़िदा" }
  ],
  las: [
    { q: "‘हरिहर काका’ कहानी आधुनिक पारिवारिक संबंधों में बढ़ते स्वार्थ और अमानवीयता का यथार्थ चित्रण करती है। सोदाहरण टिप्पणी कीजिए।", ans: "कहानी में दिखाया गया है कि कैसे सगे भाई और धर्म के ठेकेदार (महंत) केवल 15 बीघे जमीन हड़पने के लिए वृद्ध हरिहर काका पर अमानवीय अत्याचार करते हैं, जिससे पारिवारिक मूल्यों और मानवीय संवेदनाओं का ह्रास उजागर होता है।", ch: "संचयन: हरिहर काका" },
    { q: "‘सपनों के-से दिन’ पाठ के आधार पर पी.टी. सर (प्रीतमचंद) के कठोर और कोमल व्यक्तित्व का विश्लेषण कीजिए।", ans: "पी.टी. सर बाहर से अत्यंत कठोर अनुशासनप्रिय थे जो छात्रों को बेरहमी से पीटते थे, परंतु उनके भीतर एक कोमल हृदय भी था जो उनके द्वारा तोतों को प्यार से बादाम खिलाने की घटना से स्पष्ट होता है।", ch: "संचयन: सपनों के-से दिन" },
    { q: "टोपी शुक्ला और इफ़्फ़न की दादी के बीच के आत्मीय संबंधों पर प्रकाश डालिए।", ans: "टोपी शुक्ला एक हिंदू परिवार का था और इफ़्फ़न मुस्लिम, फिर भी टोपी को इफ़्फ़न की दादी की पूर्वी बोली और उनका प्यार अपनी माँ और दादी से अधिक आत्मीय लगता था। उनका रिश्ता धर्म की दीवारों से परे एक पवित्र मानवीय स्नेह का प्रतीक था।", ch: "संचयन: टोपी शुक्ला" },
    { q: "अपने क्षेत्र में पार्क के विकास और रखरखाव के लिए नगर निगम अधिकारी को एक पत्र लिखिए।", ans: "औपचारिक पत्र: प्रारूप के अनुसार - प्रेषक का पता, दिनांक, सेवा में (अधिकारी का पद और पता), विषय, महोदय, पार्क की दुर्दशा का वर्णन, सुधार के सुझाव, और अंत में भवदीय।", ch: "रचनात्मक लेखन: पत्र लेखन" },
    { q: "‘ऑनलाइन शिक्षा: लाभ और चुनौतियाँ’ विषय पर लगभग 120 शब्दों में एक सारगर्भित अनुच्छेद लिखिए।", ans: "अनुच्छेद लेखन: भूमिका (ऑनलाइन शिक्षा का बढ़ता प्रचलन), लाभ (समय की बचत, सुलभता, वैश्विक ज्ञान), चुनौतियाँ (आँखों पर प्रभाव, स्क्रीन टाइम, नेटवर्क समस्या), और निष्कर्ष।", ch: "रचनात्मक लेखन: अनुच्छेद लेखन" },
    { q: "आपके विद्यालय में आयोजित होने वाले ‘स्वच्छता अभियान’ में छात्रों की भागीदारी हेतु एक आकर्षक सूचना (लगभग 50 शब्दों में) तैयार कीजिए।", ans: "सूचना लेखन: विद्यालय का नाम, 'सूचना', विषय (स्वच्छता अभियान), दिनांक, अभियान का विवरण (समय, स्थान), छात्रों से सहयोग की अपील, और हस्ताक्षर।", ch: "रचनात्मक लेखन: सूचना लेखन" },
    { q: "एक नई पर्यावरण-अनुकूल (Eco-friendly) पानी की बोतल का विज्ञापन 50 शब्दों में तैयार कीजिए।", ans: "विज्ञापन लेखन: आकर्षक नारा (कैची स्लोगन), उत्पाद की विशेषताएँ (प्लास्टिक मुक्त, टिकाऊ, सस्ता), आकर्षक चित्र (बॉक्स में), संपर्क सूत्र या पता।", ch: "रचनात्मक लेखन: विज्ञापन लेखन" },
    { q: "एक दिन अचानक आप किसी पुराने मित्र से मिले जिसे आपने वर्षों से नहीं देखा था। इस विषय पर 100-120 शब्दों में एक लघुकथा लिखिए।", ans: "लघुकथा लेखन: आरंभ (अचानक मुलाकात का दृश्य), मध्य (पुरानी यादें, भावुकता), और अंत (सकारात्मक संदेश)।", ch: "रचनात्मक लेखन: लघुकथा लेखन" }
  ],
  cases: [
    {
      passage: "‘मेरे भाई साहब मुझसे पाँच साल बड़े थे, लेकिन केवल तीन दरजे आगे। उन्होंने भी उसी उम्र में पढ़ना शुरू किया था जब मैंने शुरू किया; लेकिन तालीम जैसे महत्तव के मामले में वह जल्दबाज़ी से काम लेना पसंद न करते थे। इस भवन की बुनियाद खूब मज़बूत डालना चाहते थे, जिस पर एक आलीशान महल बन सके।’",
      q: "Q1. बड़े भाई साहब लेखक से कितने साल बड़े और कितने दरजे आगे थे? (1M)\nQ2. बड़े भाई साहब पढ़ाई के मामले में जल्दबाज़ी क्यों नहीं करते थे? (1M)\nQ3. लेखक ने बड़े भाई साहब के किस दृष्टिकोण पर चुटीला व्यंग्य किया है? (2M)",
      ans: "Q1. पाँच साल बड़े और तीन दरजे आगे थे।\nQ2. वे तालीम की बुनियाद को मजबूत बनाना चाहते थे ताकि उस पर टिकाऊ ज्ञान का महल बन सके।\nQ3. लेखक ने रटंत विद्या और बिना समझे बार-बार कक्षा में अटकने की मनोवृत्ति पर व्यंग्य किया है।",
      ch: "स्पर्श: बड़े भाई साहब"
    },
    {
      passage: "कस्तूरी कुंडल बसै, मृग ढूँढै बन माहिं।\nऐसे घटि-घटि राम हैं, दुनिया देखै नाहिं।।",
      q: "Q1. कस्तूरी कहाँ बसती है और मृग उसे कहाँ ढूँढता है? (1M)\nQ2. 'घटि-घटि' का क्या अर्थ है? (1M)\nQ3. साखी के माध्यम से कबीर क्या संदेश देना चाहते हैं? (2M)",
      ans: "Q1. कस्तूरी मृग की अपनी नाभि (कुंडल) में बसती है, पर वह उसे अज्ञानतावश वन में ढूँढता है।\nQ2. 'घटि-घटि' का अर्थ है कण-कण में या प्रत्येक हृदय में।\nQ3. कबीर संदेश देते हैं कि ईश्वर मनुष्य के अंतःकरण में ही निवास करता है, उसे बाहर मंदिरों-मस्जिदों में ढूँढना व्यर्थ है।",
      ch: "स्पर्श: कबीर की साखी"
    },
    {
      passage: "हरिहर काका के यहाँ से मैं अभी-अभी लौटा हूँ। कल भी उनके यहाँ गया था, लेकिन न तो वह कल ही कुछ कह सके और न आज ही। दोनों दिन उनके पास मैं देर तक बैठा रहा, लेकिन उन्होंने कोई बातचीत नहीं की। उनकी आँखें मुझे बहुत कुछ कहती लगीं, लेकिन मुँह से उन्होंने एक भी शब्द नहीं निकाला।",
      q: "Q1. लेखक हरिहर काका के पास कितनी बार और कब गया? (1M)\nQ2. हरिहर काका का व्यवहार कैसा था? (1M)\nQ3. हरिहर काका की खामोशी के पीछे क्या कारण था? (2M)",
      ans: "Q1. लेखक लगातार दो दिन हरिहर काका के पास गया।\nQ2. काका एकदम मौन थे, वे कुछ भी नहीं बोले, केवल उनकी आँखें ही बहुत कुछ कह रही थीं।\nQ3. काका अपने सगे भाइयों और महंत के लालची और क्रूर व्यवहार से इतने आहत और निराश थे कि उन्होंने समाज से विश्वास खो दिया था और गूंगेपन की स्थिति में आ गए थे।",
      ch: "संचयन: हरिहर काका"
    }
  ]
};

import {
  CLASS9_SCIENCE_POOL,
  CLASS9_MATH_POOL,
  CLASS9_SOCIAL_POOL,
  CLASS9_ENGLISH_POOL,
  CLASS9_HINDI_POOL,
  CLASS9_IT_POOL
} from './class9MasterPool';

import {
  CLASS12_PHYSICS_POOL,
  CLASS12_CHEMISTRY_POOL,
  CLASS12_MATH_POOL,
  CLASS12_BIOLOGY_POOL,
  CLASS12_CS_POOL,
  CLASS12_ENGLISH_POOL
} from './class12MasterPool';

import {
  COMMERCE_ACCOUNTANCY_POOL,
  COMMERCE_BUSINESS_STUDIES_POOL,
  COMMERCE_ECONOMICS_POOL,
  ARTS_HISTORY_POOL,
  ARTS_POLITICAL_SCIENCE_POOL,
  ARTS_GEOGRAPHY_POOL,
  ARTS_SOCIOLOGY_POOL,
  HINDI_CORE_POOL
} from './seniorSecondaryPools';

// ==========================================
// MASTER POOL RETRIEVER
// ==========================================
export function getMasterPool(subjectId: string): SubjectQuestionPool {
  const msPool = getMiddleSchoolMasterPool(subjectId);
  if (msPool) return msPool;

  switch (subjectId) {
    // Class 9 Subjects
    case 'class9-science-086':
      return CLASS9_SCIENCE_POOL;
    case 'class9-maths-041':
      return CLASS9_MATH_POOL;
    case 'class9-social-087':
      return CLASS9_SOCIAL_POOL;
    case 'class9-english-184':
      return CLASS9_ENGLISH_POOL;
    case 'class9-hindi-002':
    case 'class9-hindi-085':
      return CLASS9_HINDI_POOL;
    case 'class9-it-402':
      return CLASS9_IT_POOL;

    // Class 12 Science & English Subjects
    case 'class12-physics-042':
    case 'physics-042':
      return CLASS12_PHYSICS_POOL;
    case 'class12-chemistry-043':
    case 'chemistry-043':
      return CLASS12_CHEMISTRY_POOL;
    case 'class12-maths-041':
    case 'maths-041-11':
      return CLASS12_MATH_POOL;
    case 'class12-biology-044':
    case 'biology-044-11':
      return CLASS12_BIOLOGY_POOL;
    case 'class12-computer-083':
    case 'cs-083-11':
      return CLASS12_CS_POOL;
    case 'class12-english-301':
    case 'english-301':
      return CLASS12_ENGLISH_POOL;

    // Class 11 & 12 Commerce & Humanities Subjects
    case 'class12-accountancy-055':
    case 'accountancy-055-11':
      return COMMERCE_ACCOUNTANCY_POOL;
    case 'class12-bst-054':
    case 'bst-054-11':
      return COMMERCE_BUSINESS_STUDIES_POOL;
    case 'class12-eco-030':
    case 'eco-030-11':
      return COMMERCE_ECONOMICS_POOL;
    case 'class12-history-027':
    case 'history-027-11':
      return ARTS_HISTORY_POOL;
    case 'class12-polsci-028':
    case 'polsci-028-11':
      return ARTS_POLITICAL_SCIENCE_POOL;
    case 'class12-geography-029':
    case 'geography-029-11':
      return ARTS_GEOGRAPHY_POOL;
    case 'class12-sociology-039':
    case 'sociology-039-11':
      return ARTS_SOCIOLOGY_POOL;
    case 'class12-hindi-302':
    case 'hindi-302-11':
      return HINDI_CORE_POOL;

    // Class 10 Subjects
    case 'science-086':
      return SCIENCE_MASTER_POOL;
    case 'maths-041':
      return MATH_MASTER_POOL;
    case 'social-087':
      return SOCIAL_MASTER_POOL;
    case 'english-184':
      return ENGLISH_MASTER_POOL;
    case 'it-402':
      return IT_MASTER_POOL;
    case 'hindi-002':
      return HINDI_A_MASTER_POOL;
    case 'hindi-085':
      return HINDI_B_MASTER_POOL;
    default: {
      const lower = (subjectId || '').toLowerCase();
      // Class 9 specific checks
      if (lower.includes('class9') || lower.includes('cbse9') || lower.includes('class-9') || lower.includes('9th')) {
        if (lower.includes('math')) return CLASS9_MATH_POOL;
        if (lower.includes('sci')) return CLASS9_SCIENCE_POOL;
        if (lower.includes('soc') || lower.includes('sst')) return CLASS9_SOCIAL_POOL;
        if (lower.includes('eng')) return CLASS9_ENGLISH_POOL;
        if (lower.includes('hin')) return CLASS9_HINDI_POOL;
        if (lower.includes('it') || lower.includes('402')) return CLASS9_IT_POOL;
      }

      // Class 11 / 12 Senior Secondary specific checks
      if (lower.includes('class12') || lower.includes('class11') || lower.includes('cbse12') || lower.includes('cbse11') || lower.includes('-11') || lower.includes('-12')) {
        if (lower.includes('phy') || lower.includes('042')) return CLASS12_PHYSICS_POOL;
        if (lower.includes('chem') || lower.includes('043')) return CLASS12_CHEMISTRY_POOL;
        if (lower.includes('bio') || lower.includes('044')) return CLASS12_BIOLOGY_POOL;
        if (lower.includes('cs') || lower.includes('comp') || lower.includes('083')) return CLASS12_CS_POOL;
        if (lower.includes('eng') || lower.includes('301')) return CLASS12_ENGLISH_POOL;
        if (lower.includes('hin') || lower.includes('302')) return HINDI_CORE_POOL;
        if (lower.includes('math') || lower.includes('041')) return CLASS12_MATH_POOL;
        if (lower.includes('account') || lower.includes('055')) return COMMERCE_ACCOUNTANCY_POOL;
        if (lower.includes('bst') || lower.includes('business') || lower.includes('054')) return COMMERCE_BUSINESS_STUDIES_POOL;
        if (lower.includes('eco') || lower.includes('030')) return COMMERCE_ECONOMICS_POOL;
        if (lower.includes('hist') || lower.includes('027')) return ARTS_HISTORY_POOL;
        if (lower.includes('pol') || lower.includes('028')) return ARTS_POLITICAL_SCIENCE_POOL;
        if (lower.includes('geo') || lower.includes('029')) return ARTS_GEOGRAPHY_POOL;
        if (lower.includes('soc') || lower.includes('039')) return ARTS_SOCIOLOGY_POOL;
      }

      // General fallback by subject keywords
      if (lower.includes('account') || lower.includes('055')) return COMMERCE_ACCOUNTANCY_POOL;
      if (lower.includes('bst') || lower.includes('business') || lower.includes('054')) return COMMERCE_BUSINESS_STUDIES_POOL;
      if (lower.includes('eco') || lower.includes('030')) return COMMERCE_ECONOMICS_POOL;
      if (lower.includes('hist') || lower.includes('027')) return ARTS_HISTORY_POOL;
      if (lower.includes('pol') || lower.includes('028')) return ARTS_POLITICAL_SCIENCE_POOL;
      if (lower.includes('geo') || lower.includes('029')) return ARTS_GEOGRAPHY_POOL;
      if (lower.includes('soc') || lower.includes('039')) return ARTS_SOCIOLOGY_POOL;
      if (lower.includes('phy') || lower.includes('042')) return CLASS12_PHYSICS_POOL;
      if (lower.includes('chem') || lower.includes('043')) return CLASS12_CHEMISTRY_POOL;
      if (lower.includes('bio') || lower.includes('044')) return CLASS12_BIOLOGY_POOL;
      if (lower.includes('cs') || lower.includes('comp') || lower.includes('083')) return CLASS12_CS_POOL;
      if (lower.includes('math') || lower.includes('041')) return MATH_MASTER_POOL;
      if (lower.includes('eng') || lower.includes('184') || lower.includes('301')) return ENGLISH_MASTER_POOL;
      if (lower.includes('hin') || lower.includes('002') || lower.includes('085') || lower.includes('302')) return HINDI_A_MASTER_POOL;
      if (lower.includes('sci') || lower.includes('086')) return SCIENCE_MASTER_POOL;
      if (lower.includes('soc') || lower.includes('sst') || lower.includes('087')) return SOCIAL_MASTER_POOL;
      if (lower.includes('it') || lower.includes('402')) return IT_MASTER_POOL;

      return { mcqs: [], vsas: [], sas: [], las: [], cases: [] };
    }
  }
}

