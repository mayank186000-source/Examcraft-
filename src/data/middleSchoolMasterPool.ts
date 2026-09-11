import { Question } from '../types';

export interface SubjectQuestionPool {
  mcqs: Array<{ q: string; opts: string[]; ans: string; ch: string; exp?: string; type?: 'mcq' | 'ar' }>;
  vsas: Array<{ q: string; ans: string; ch: string; ms?: string }>;
  sas: Array<{ q: string; ans: string; ch: string; ms?: string }>;
  las: Array<{ q: string; ans: string; ch: string; ms?: string }>;
  cases: Array<{ passage: string; q: string; ans: string; ch: string }>;
}

// ==========================================
// 1. CLASS 8 SCIENCE MASTER POOL
// ==========================================
export const CLASS_8_SCIENCE_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "Which of the following is a Kharif crop sown during the monsoon season (June to September)?", opts: ["A) Paddy (Rice)", "B) Wheat", "C) Gram", "D) Mustard"], ans: "A) Paddy (Rice)", ch: "Crop Production and Management" },
    { q: "Which bacterium present in root nodules of leguminous plants helps in biological nitrogen fixation?", opts: ["A) Rhizobium", "B) Lactobacillus", "C) Penicillium", "D) Salmonella"], ans: "A) Rhizobium", ch: "Microorganisms: Friend and Foe" },
    { q: "The process of conversion of dead vegetation into coal over millions of years under high pressure and temperature is called:", opts: ["A) Carbonisation", "B) Distillation", "C) Pasteurization", "D) Fermentation"], ans: "A) Carbonisation", ch: "Coal and Petroleum" },
    { q: "The lowest temperature at which a substance catches fire and burns is called its:", opts: ["A) Ignition temperature", "B) Boiling point", "C) Melting point", "D) Critical temperature"], ans: "A) Ignition temperature", ch: "Combustion and Flame" },
    { q: "Red Data Book is a international source book maintained to keep record of all:", opts: ["A) Endangered species", "B) Extinct species", "C) Exotic species", "D) Domestic species"], ans: "A) Endangered species", ch: "Conservation of Plants and Animals" },
    { q: "Which gland in the human body secretes the hormone 'Insulin' to regulate blood sugar level?", opts: ["A) Pancreas", "B) Thyroid", "C) Pituitary", "D) Adrenal"], ans: "A) Pancreas", ch: "Reaching the Age of Adolescence" },
    { q: "Pressure is defined as force per unit area. What is the SI unit of pressure?", opts: ["A) Pascal (Pa)", "B) Newton (N)", "C) Joule (J)", "D) Watt (W)"], ans: "A) Pascal (Pa)", ch: "Force and Pressure" },
    { q: "Rolling friction is always smaller than:", opts: ["A) Both static and sliding friction", "B) Only static friction", "C) Only sliding friction", "D) Fluid friction only"], ans: "A) Both static and sliding friction", ch: "Friction" },
    { q: "The human ear can hear sound frequencies in the range of:", opts: ["A) 20 Hz to 20,000 Hz", "B) Below 20 Hz", "C) Above 20,000 Hz", "D) 1 Hz to 100 Hz"], ans: "A) 20 Hz to 20,000 Hz", ch: "Sound" },
    { q: "Which metal is coated on iron cans used for storing food to prevent corrosion and rusting?", opts: ["A) Tin", "B) Zinc", "C) Copper", "D) Gold"], ans: "A) Tin", ch: "Chemical Effects of Electric Current" },
    { q: "Assertion (A): Yeast is used in bakery industry for making bread and cakes.\nReason (R): Yeast reproduces rapidly and produces carbon dioxide gas during respiration, causing dough to rise.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Microorganisms: Friend and Foe", type: 'ar' },
    { q: "Assertion (A): Smooth surfaces offer less friction than rough surfaces.\nReason (R): Friction is caused by the interlocking of microscopic irregularities on two contacting surfaces.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Friction", type: 'ar' }
  ],
  vsas: [
    { q: "Explain why drip irrigation is considered the most efficient modern method of irrigation in water-scarce regions.", ans: "Drip irrigation delivers water drop by drop directly near the plant roots, minimizing water loss due to evaporation and run-off.", ch: "Crop Production and Management" },
    { q: "What is pasteurization? How did Louis Pasteur discover this food preservation technique?", ans: "Heating milk to about 70°C for 15 to 30 seconds and then suddenly chilling and storing it to prevent micro-organism growth.", ch: "Microorganisms: Friend and Foe" },
    { q: "Calculate the pressure exerted by a force of 200 N acting perpendicularly on an area of 4 m².", ans: "Pressure = Force / Area = 200 N / 4 m² = 50 Pascal (Pa or N/m²).", ch: "Force and Pressure" },
    { q: "State two distinct differences between static friction and rolling friction.", ans: "Static friction acts when an object is at rest on a surface and opposes initiation of motion. Rolling friction comes into play when one body rolls over another and is much smaller than static friction.", ch: "Friction" },
    { q: "Define time period and frequency of a vibrating object. How are they mathematically related?", ans: "Time period (T) is the time taken for one complete oscillation. Frequency (f) is the number of oscillations per second (Hz). Relation: f = 1 / T.", ch: "Sound" }
  ],
  sas: [
    { q: "(a) What is electroplating? Draw a schematic setup for electroplating a copper layer onto an iron spoon.\n(b) Mention two practical applications of electroplating in daily life.", ans: "(a) The process of depositing a thin layer of desired metal on another metal using electric current. Iron spoon connected to negative terminal (cathode), copper plate at positive terminal (anode) in CuSO4 electrolyte.\n(b) Chromium plating on car bumpers/taps for shine, gold/silver plating on artificial jewelry.", ch: "Chemical Effects of Electric Current" },
    { q: "(a) Explain the three zones of a candle flame with their relative temperatures.\n(b) Why is CO2 considered the best fire extinguisher for electrical fires?", ans: "(a) 1. Innermost dark zone (unburnt wax vapor, least hot). 2. Middle luminous yellow zone (partial combustion, moderately hot). 3. Outermost non-luminous blue zone (complete combustion, hottest).\n(b) CO2 is heavier than oxygen, smothers the flame like a blanket, and does not conduct electricity or damage sensitive electronics.", ch: "Combustion and Flame" }
  ],
  las: [
    { q: "(a) Describe the structure of the human eye with the help of a labeled diagram.\n(b) Explain the function of: (i) Pupil (ii) Retina (iii) Optic Nerve.\n(c) What is the Braille system?", ans: "(a) Eye consists of cornea, iris, pupil, lens, retina, and optic nerve.\n(b) (i) Pupil controls amount of light entering. (ii) Retina acts as screen containing rods and cones. (iii) Optic nerve carries electrical impulses to brain.\n(c) A tactile writing and reading system for visually impaired persons developed by Louis Braille using raised dots.", ch: "Light" }
  ],
  cases: [
    {
      passage: "Rohan conducted an experiment in his school physics lab. He suspended a metallic pendulum bob from a rigid stand using a light thread of length 1 meter. He set the pendulum oscillating and recorded the time taken for 20 complete oscillations using a digital stopwatch. The measured time was 40 seconds.",
      q: "Q1. Calculate the time period of the pendulum in seconds. (1M)\nQ2. Calculate the frequency of oscillation of the pendulum in Hertz (Hz). (1M)\nQ3. If Rohan increases the mass of the bob keeping thread length same, will the time period change? Explain. (2M)",
      ans: "Q1. Time Period T = Total Time / Number of Oscillations = 40 / 20 = 2 seconds.\nQ2. Frequency f = 1 / T = 1 / 2 = 0.5 Hz.\nQ3. No. The time period of a simple pendulum depends only on the length of the string and acceleration due to gravity, independent of the mass or material of the bob.",
      ch: "Sound"
    }
  ]
};

// ==========================================
// 2. CLASS 8 MATHEMATICS MASTER POOL
// ==========================================
export const CLASS_8_MATHS_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "What is the additive inverse of -7/19?", opts: ["A) 7/19", "B) -19/7", "C) 19/7", "D) 0"], ans: "A) 7/19", ch: "Rational Numbers" },
    { q: "Solve the linear equation: 3x - 5 = 16. The value of x is:", opts: ["A) 7", "B) 5", "C) 8", "D) 3"], ans: "A) 7", ch: "Linear Equations in One Variable" },
    { q: "The sum of interior angles of a convex polygon with 6 sides (Hexagon) is:", opts: ["A) 720°", "B) 540°", "C) 360°", "D) 900°"], ans: "A) 720°", ch: "Understanding Quadrilaterals" },
    { q: "Find the square root of 625 using prime factorisation or division method:", opts: ["A) 25", "B) 15", "C) 35", "D) 45"], ans: "A) 25", ch: "Squares and Square Roots" },
    { q: "Which of the following is the Hardy-Ramanujan smallest number expressible as sum of two cubes in two different ways?", opts: ["A) 1729", "B) 1000", "C) 125", "D) 216"], ans: "A) 1729", ch: "Cubes and Cube Roots" },
    { q: "An item marked at ₹800 is sold for ₹680. Find the discount percentage offered:", opts: ["A) 15%", "B) 12%", "C) 20%", "D) 10%"], ans: "A) 15%", ch: "Comparing Quantities" },
    { q: "According to algebraic identity, (a + b)² is equal to:", opts: ["A) a² + 2ab + b²", "B) a² - 2ab + b²", "C) a² - b²", "D) a² + b²"], ans: "A) a² + 2ab + b²", ch: "Algebraic Expressions and Identities" },
    { q: "Find the area of a trapezium whose parallel sides are 10 cm and 12 cm, and height is 6 cm:", opts: ["A) 66 cm²", "B) 132 cm²", "C) 60 cm²", "D) 72 cm²"], ans: "A) 66 cm²", ch: "Mensuration" },
    { q: "According to laws of exponents, (2³)⁻² is equal to:", opts: ["A) 1/64", "B) 64", "C) -12", "D) 1/32"], ans: "A) 1/64", ch: "Exponents and Powers" },
    { q: "If 15 workers can build a wall in 48 hours, how many workers will build it in 30 hours under inverse proportion?", opts: ["A) 24 workers", "B) 20 workers", "C) 18 workers", "D) 30 workers"], ans: "A) 24 workers", ch: "Direct and Inverse Proportions" }
  ],
  vsas: [
    { q: "Find three rational numbers between 1/4 and 1/2.", ans: "Convert to common denominator 12: 1/4 = 3/12 and 1/2 = 6/12. Multiply by 2: 6/24 and 12/24. Rational numbers: 7/24, 8/24 (1/3), 9/24 (3/8).", ch: "Rational Numbers" },
    { q: "The ratio of two numbers is 5:3. If they differ by 18, find the two numbers.", ans: "Let numbers be 5x and 3x. 5x - 3x = 18 => 2x = 18 => x = 9. Numbers are 45 and 27.", ch: "Linear Equations in One Variable" },
    { q: "A right-angled triangle has legs 6 cm and 8 cm. Find its hypotenuse using Pythagorean theorem.", ans: "Hypotenuse h = √(6² + 8²) = √(36 + 64) = √100 = 10 cm.", ch: "Squares and Square Roots" },
    { q: "Calculate Compound Interest on ₹10,000 for 2 years at 10% per annum compounded annually.", ans: "Amount A = 10000(1 + 10/100)² = 10000 × (1.1)² = ₹12,100. CI = A - P = 12100 - 10000 = ₹2,100.", ch: "Comparing Quantities" }
  ],
  sas: [
    { q: "(a) Factorise completely: 49x² - 36y².\n(b) Factorise: x² + 7x + 12 by splitting the middle term.", ans: "(a) Using identity a² - b² = (a - b)(a + b): (7x)² - (6y)² = (7x - 6y)(7x + 6y).\n(b) x² + 3x + 4x + 12 = x(x + 3) + 4(x + 3) = (x + 3)(x + 4).", ch: "Factorisation" },
    { q: "The internal dimensions of a closed rectangular box (cuboid) are length 80 cm, breadth 40 cm, and height 30 cm. Find:\n(i) Total Surface Area of the box.\n(ii) Volume of the box in cubic meters.", ans: "(i) TSA = 2(lb + bh + hl) = 2(80×40 + 40×30 + 30×80) = 2(3200 + 1200 + 2400) = 2(6800) = 13,600 cm².\n(ii) Volume = l × b × h = 80 × 40 × 30 = 96,000 cm³ = 0.096 m³.", ch: "Mensuration" }
  ],
  las: [
    { q: "(a) Simplify using laws of exponents: (25 × t⁻⁴) / (5⁻³ × 10 × t⁻⁸) where t ≠ 0.\n(b) Express 0.0000000000035 in standard scientific notation.", ans: "(a) 25 = 5². (5² × 5³ × t⁻⁴⁺⁸) / (10) = (5⁵ × t⁴) / (2 × 5) = (5⁴ × t⁴) / 2 = (625 t⁴) / 2 = 312.5 t⁴.\n(b) 3.5 × 10⁻¹².", ch: "Exponents and Powers" }
  ],
  cases: [
    {
      passage: "A mathematics teacher asked Class 8 students to conduct a statistical survey on the favorite sports of 60 students in their school. The data collected was: Cricket: 25 students, Football: 15 students, Badminton: 12 students, Chess: 8 students.",
      q: "Q1. Find the central angle of the sector representing 'Cricket' in a Pie Chart. (1M)\nQ2. Find the central angle of the sector representing 'Football'. (1M)\nQ3. Calculate the probability that a student chosen at random prefers Badminton or Chess. (2M)",
      ans: "Q1. Central angle for Cricket = (25 / 60) × 360° = 150°.\nQ2. Central angle for Football = (15 / 60) × 360° = 90°.\nQ3. Favorable students = 12 (Badminton) + 8 (Chess) = 20. Total = 60. Probability P = 20 / 60 = 1/3.",
      ch: "Data Handling"
    }
  ]
};

// ==========================================
// 3. CLASS 7 SCIENCE MASTER POOL
// ==========================================
export const CLASS_7_SCIENCE_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "Pitcher plant traps insects because it grows in soil deficient in:", opts: ["A) Nitrogen", "B) Carbon", "C) Water", "D) Potassium"], ans: "A) Nitrogen", ch: "Nutrition in Plants" },
    { q: "The finger-like outgrowths present on the inner wall of the small intestine that absorb digested food are called:", opts: ["A) Villi", "B) Cilia", "C) Pseudopodia", "D) Flagella"], ans: "A) Villi", ch: "Nutrition in Animals" },
    { q: "The normal body temperature of a healthy human being measured on the Celsius scale is:", opts: ["A) 37 °C", "B) 98.6 °C", "C) 32 °C", "D) 42 °C"], ans: "A) 37 °C", ch: "Heat" },
    { q: "When a drop of phenolphthalein indicator is added to a basic solution like sodium hydroxide, its color turns:", opts: ["A) Pink", "B) Colorless", "C) Red", "D) Yellow"], ans: "A) Pink", ch: "Acids, Bases and Salts" },
    { q: "Which of the following is a chemical change?", opts: ["A) Rusting of iron", "B) Melting of ice", "C) Boiling of water", "D) Tearing of paper"], ans: "A) Rusting of iron", ch: "Physical and Chemical Changes" },
    { q: "Accumulation of which chemical compound in human muscles during heavy exercise causes muscle cramps?", opts: ["A) Lactic acid", "B) Pyruvic acid", "C) Carbonic acid", "D) Alcohol"], ans: "A) Lactic acid", ch: "Respiration in Organisms" },
    { q: "The vascular tissue responsible for transport of water and dissolved minerals from roots to leaves in plants is:", opts: ["A) Xylem", "B) Phloem", "C) Cambium", "D) Stomata"], ans: "A) Xylem", ch: "Transportation in Animals and Plants" },
    { q: "Yeast reproduces asexually by forming small bulb-like projections called:", opts: ["A) Buds", "B) Spores", "C) Fragments", "D) Seeds"], ans: "A) Buds", ch: "Reproduction in Plants" },
    { q: "A vehicle covers a distance of 150 km in 3 hours. Calculate its average speed:", opts: ["A) 50 km/h", "B) 45 km/h", "C) 60 km/h", "D) 30 km/h"], ans: "A) 50 km/h", ch: "Motion and Time" },
    { q: "Which safety device in domestic electrical circuits melts and breaks the circuit when excessive current flows?", opts: ["A) Electric Fuse", "B) Electromagnet", "C) Switch", "D) Rheostat"], ans: "A) Electric Fuse", ch: "Electric Current and Its Effects" }
  ],
  vsas: [
    { q: "Write the balanced chemical equation for photosynthesis in plants.", ans: "6CO2 + 6H2O --(Sunlight / Chlorophyll)--> C6H12O6 (Glucose) + 6O2.", ch: "Nutrition in Plants" },
    { q: "Explain how sea breeze occurs in coastal areas during daytime.", ans: "Daytime land heats faster than sea water. Hot air above land rises up, creating low pressure. Cooler air from sea rushes towards land to take its place, forming a sea breeze.", ch: "Heat" },
    { q: "What is neutralization? Give one example of neutralization reaction from daily life.", ans: "Reaction between an acid and a base producing salt and water. Example: Taking antacid tablets (Mg(OH)2) to neutralize excess stomach HCl.", ch: "Acids, Bases and Salts" },
    { q: "Distinguish between self-pollination and cross-pollination in flowering plants.", ans: "Self-pollination transfers pollen grains from anther to stigma of same flower or another flower on same plant. Cross-pollination transfers pollen to stigma of a flower on a different plant of same species.", ch: "Reproduction in Plants" }
  ],
  sas: [
    { q: "(a) Draw a schematic block diagram of the human heart showing four chambers.\n(b) Why is double circulation important in warm-blooded animals like birds and mammals?", ans: "(a) Diagram showing Right Atrium, Right Ventricle, Left Atrium, Left Ventricle.\n(b) Completely separates oxygenated and deoxygenated blood, ensuring high oxygen supply required to maintain constant body temperature.", ch: "Transportation in Animals and Plants" }
  ],
  las: [
    { q: "(a) Define speed. What is its SI unit?\n(b) A simple pendulum takes 32 seconds to complete 20 oscillations. Find its time period.\n(c) Plot a distance-time graph for a car moving with uniform speed.", ans: "(a) Distance traveled per unit time. SI unit is meters per second (m/s).\n(b) Time period T = 32 / 20 = 1.6 seconds.\n(c) Straight line sloping upwards from origin indicating uniform speed.", ch: "Motion and Time" }
  ],
  cases: [
    {
      passage: "An ecology student studied plant nutrition in a garden. She noticed lichens growing on tree bark, pitcher plants growing in nitrogen-deficient soil, and dodder (Cuscuta) growing as a yellow wire-like climber on a green shrub.",
      q: "Q1. What type of nutrition relationship is exhibited by Lichens? Name its two partners. (1M)\nQ2. Name the parasitic plant in the above passage. (1M)\nQ3. Explain how Pitcher Plant captures and digests insects. (2M)",
      ans: "Q1. Symbiotic relationship. Partners are Algae (provides food) and Fungus (provides shelter and minerals).\nQ2. Cuscuta (Dodder).\nQ3. Pitcher plant leaf is modified into a pitcher with a lid. Inside pitcher, hair directed downwards trap insects. Digestive juices secreted in pitcher digest the insect.",
      ch: "Nutrition in Plants"
    }
  ]
};

// ==========================================
// 4. CLASS 6 SCIENCE MASTER POOL
// ==========================================
export const CLASS_6_SCIENCE_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "Which vitamin deficiency causes Scurvy characterized by bleeding gums?", opts: ["A) Vitamin C", "B) Vitamin A", "C) Vitamin B1", "D) Vitamin D"], ans: "A) Vitamin C", ch: "Components of Food" },
    { q: "Which chemical solution turns blue-black in the presence of starch?", opts: ["A) Iodine solution", "B) Copper sulfate solution", "C) Caustic soda", "D) Alcohol"], ans: "A) Iodine solution", ch: "Components of Food" },
    { q: "The process of separating lighter husk particles from heavier grain seeds using wind is called:", opts: ["A) Winnowing", "B) Threshing", "C) Handpicking", "D) Sieving"], ans: "A) Winnowing", ch: "Separation of Substances" },
    { q: "Plants with weak stems that take support of neighboring structures and climb up are called:", opts: ["A) Climbers", "B) Creepers", "C) Herbs", "D) Shrubs"], ans: "A) Climbers", ch: "Getting to Know Plants" },
    { q: "The joint present in our elbow and knee that allows movement in only one plane is:", opts: ["A) Hinge joint", "B) Ball and socket joint", "C) Pivot joint", "D) Fixed joint"], ans: "A) Hinge joint", ch: "Body Movements" },
    { q: "The SI unit of length in the International System of Units is:", opts: ["A) Meter (m)", "B) Centimeter (cm)", "C) Kilometer (km)", "D) Foot"], ans: "A) Meter (m)", ch: "Motion and Measurement of Distances" },
    { q: "Shadows are formed when light is blocked by an object that is:", opts: ["A) Opaque", "B) Transparent", "C) Translucent", "D) Luminous"], ans: "A) Opaque", ch: "Light, Shadows and Reflections" },
    { q: "A freely suspended bar magnet always aligns itself in which geographic direction?", opts: ["A) North - South", "B) East - West", "C) North - East", "D) South - West"], ans: "A) North - South", ch: "Electricity & Circuits and Fun with Magnets" }
  ],
  vsas: [
    { q: "State two differences between transparent and opaque materials with one example of each.", ans: "Transparent materials allow light to pass through completely (e.g. glass/water). Opaque materials do not allow light to pass at all (e.g. wood/metal).", ch: "Light, Shadows and Reflections" },
    { q: "Why is an electric cell labeled with positive (+) and negative (-) terminals?", ans: "Electric current flows from positive terminal to negative terminal through an electric circuit.", ch: "Electricity & Circuits and Fun with Magnets" }
  ],
  sas: [
    { q: "(a) Differentiate between Tap Root and Fibrous Root.\n(b) How is leaf venation related to root type in plants?", ans: "(a) Tap root has one main thick root with smaller lateral roots (e.g. mustard/bean). Fibrous root has a cluster of similar sized roots arising from stem base (e.g. wheat/grass).\n(b) Plants with reticulate venation have tap roots; plants with parallel venation have fibrous roots.", ch: "Getting to Know Plants" }
  ],
  las: [
    { q: "(a) Define balanced diet. List the major nutrients required by our body.\n(b) Describe simple tests for detecting proteins and fats in a given food sample.", ans: "(a) A diet containing all essential nutrients (carbohydrates, proteins, fats, vitamins, minerals, roughage, water) in correct proportions.\n(b) Fat test: Rub food item on clean paper; translucent oily patch confirms fat. Protein test: Food paste + 2 drops CuSO4 + 10 drops Caustic Soda -> Violet color confirms protein.", ch: "Components of Food" }
  ],
  cases: [
    {
      passage: "Rahul accompanied his grandfather to their agricultural farm. He observed workers threshing harvested wheat stalks, separating husk from wheat grains in breeze, and filtering water through sand beds.",
      q: "Q1. Name the method used to separate wheat grains from harvested stalks. (1M)\nQ2. Name the separation technique utilizing wind currents. (1M)\nQ3. Explain the difference between sedimentation and decantation. (2M)",
      ans: "Q1. Threshing.\nQ2. Winnowing.\nQ3. Sedimentation is settling down of heavier insoluble particles at the bottom of liquid. Decantation is pouring out clear top liquid without disturbing sediment.",
      ch: "Separation of Substances"
    }
  ]
};

// ==========================================
// 5. CLASS 5 EVS / SCIENCE MASTER POOL
// ==========================================
export const CLASS_5_EVS_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "How many species of poisonous snakes are found in India?", opts: ["A) 4 (Cobra, Krait, Russell's Viper, Saw-scaled Viper)", "B) 10", "C) 1", "D) 25"], ans: "A) 4 (Cobra, Krait, Russell's Viper, Saw-scaled Viper)", ch: "Super Senses & Snake Charmer's Story" },
    { q: "Which British doctor discovered that Malaria disease is transmitted by female Anopheles mosquitoes?", opts: ["A) Ronald Ross", "B) Louis Pasteur", "C) Edward Jenner", "D) Alexander Fleming"], ans: "A) Ronald Ross", ch: "A Treat for Mosquitoes & Up You Go!" },
    { q: "Why do people float easily on the Dead Sea without swimming?", opts: ["A) It has extremely high salt density (300 g salt per liter of water)", "B) Water temperature is high", "C) It is very shallow", "D) Water contains oil"], ans: "A) It has extremely high salt density (300 g salt per liter of water)", ch: "Every Drop Counts & Experiments with Water" },
    { q: "Pashmina shawls are made from wool of special goats reared in high altitude Ladakh. A Pashmina shawl is as warm as how many normal sweaters?", opts: ["A) 6 sweaters", "B) 2 sweaters", "C) 12 sweaters", "D) 20 sweaters"], ans: "A) 6 sweaters", ch: "What if it Finishes...? & Shelter for All!" },
    { q: "Which law enacted in 2007 protects forest rights of adivasis living in forests for at least 25 years?", opts: ["A) Right to Forest Act 2007", "B) Wildlife Protection Act", "C) Environment Act", "D) Forest Conservation Act"], ans: "A) Right to Forest Act 2007", ch: "Whose Forests? & Farmer's Story" }
  ],
  vsas: [
    { q: "Name three rich dietary sources of iron recommended for treating Anaemia.", ans: "Jaggery (Gur), Amla, and Green Leafy Vegetables (Spinach).", ch: "A Treat for Mosquitoes & Up You Go!" },
    { q: "What safety precautions should be taken immediately during an earthquake?", ans: "If possible go to an open area away from buildings. If indoors, drop down, take cover under a sturdy table, and hold on until shaking stops.", ch: "When the Earth Shook! & Like Father, Like Daughter" }
  ],
  sas: [
    { q: "(a) What is glucose drip and why is it given to weak patients?\n(b) Explain the role of taste buds on human tongue.", ans: "(a) Instant blood sugar supply that gives direct energy to weak patients without waiting for digestion.\n(b) Taste buds detect sweet (front), salty/sour (sides), and bitter (back) tastes.", ch: "From Tasting to Digesting & Seeds and Seeds" }
  ],
  las: [
    { q: "(a) Describe super senses in animals with two examples.\n(b) Why are snakes considered friends of farmers?", ans: "(a) Animals have acute sight (e.g. eagles see 4 times farther), smell (dogs track scents), and hearing (bats/tigers). (b) Snakes eat rats and mice in agricultural fields that would otherwise destroy crops.", ch: "Super Senses & Snake Charmer's Story" }
  ],
  cases: [
    {
      passage: "Suryamani is an activist from Jharkhand belonging to the Kuduk adivasi community. She established 'Torang' center to preserve Kuduk culture, music, medicinal herbs, and forest rights.",
      q: "Q1. What does the Kuduk word 'Torang' mean? (1M)\nQ2. State the key provision of Right to Forest Act 2007. (1M)\nQ3. Why are earthworms called 'Farmer's Best Friends'? (2M)",
      ans: "Q1. 'Torang' means Jungle (Forest) in Kuduk language.\nQ2. People living in forests for at least 25 years have full rights over forest land and produce.\nQ3. Earthworms burrow through soil, making it loose and porous for air/water, and convert organic waste into fertile vermicompost.",
      ch: "Whose Forests? & Farmer's Story"
    }
  ]
};

// Global lookup for Middle School Master Pools
export function getMiddleSchoolMasterPool(subjectId: string): SubjectQuestionPool | null {
  const id = subjectId.toLowerCase();
  if (id.includes('class8-sci') || id.includes('088-sci')) return CLASS_8_SCIENCE_POOL;
  if (id.includes('class8-mth') || id.includes('088-mth')) return CLASS_8_MATHS_POOL;
  if (id.includes('class7-sci') || id.includes('087-sci')) return CLASS_7_SCIENCE_POOL;
  if (id.includes('class6-sci') || id.includes('086-sci')) return CLASS_6_SCIENCE_POOL;
  if (id.includes('class5-evs') || id.includes('085-evs')) return CLASS_5_EVS_POOL;
  return null;
}
