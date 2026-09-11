import { SubjectQuestionPool } from './masterQuestionPool';

// ==========================================
// 1. CLASS 9 SCIENCE (086) MASTER POOL
// ==========================================
export const CLASS9_SCIENCE_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "Which state of matter has maximum intermolecular force of attraction and minimum kinetic energy of particles?", opts: ["A) Solid", "B) Liquid", "C) Gas", "D) Plasma"], ans: "A) Solid", ch: "Matter in Our Surroundings" },
    { q: "During summer days, water kept in an earthen pot (matka) becomes cool due to the phenomenon of:", opts: ["A) Evaporation", "B) Transpiration", "C) Osmosis", "D) Diffusion"], ans: "A) Evaporation", ch: "Matter in Our Surroundings" },
    { q: "Which of the following is a true chemical change?", opts: ["A) Rusting of iron", "B) Melting of ice", "C) Dissolving salt in water", "D) Sublimation of camphor"], ans: "A) Rusting of iron", ch: "Is Matter Around Us Pure" },
    { q: "The scattering of a beam of light by colloidal particles is known as:", opts: ["A) Tyndall Effect", "B) Doppler Effect", "C) Raman Effect", "D) Greenhouse Effect"], ans: "A) Tyndall Effect", ch: "Is Matter Around Us Pure" },
    { q: "The atomic number of an element is 11 and its mass number is 23. The number of neutrons in its nucleus is:", opts: ["A) 12", "B) 11", "C) 23", "D) 34"], ans: "A) 12", ch: "Structure of the Atom" },
    { q: "Which cell organelle is known as the 'Powerhouse of the Cell'?", opts: ["A) Mitochondria", "B) Golgi apparatus", "C) Ribosome", "D) Endoplasmic reticulum"], ans: "A) Mitochondria", ch: "The Fundamental Unit of Life" },
    { q: "Which plant tissue is responsible for the upward conduction of water and dissolved minerals from roots to leaves?", opts: ["A) Xylem", "B) Phloem", "C) Collenchyma", "D) Sclerenchyma"], ans: "A) Xylem", ch: "Tissues" },
    { q: "A body moves in a circular path of radius R. When it completes half a circle, its displacement is:", opts: ["A) 2R", "B) πR", "C) 2πR", "D) Zero"], ans: "A) 2R", ch: "Motion" },
    { q: "The physical quantity defined as the rate of change of momentum is called:", opts: ["A) Force", "B) Acceleration", "C) Work", "D) Power"], ans: "A) Force", ch: "Force and Laws of Motion" },
    { q: "The value of acceleration due to gravity (g) at the center of the Earth is:", opts: ["A) Zero", "B) 9.8 m/s²", "C) Infinity", "D) 4.9 m/s²"], ans: "A) Zero", ch: "Gravitation" },
    { q: "When a force of 10 N displaces a body by 2 m in the direction of force, the work done is:", opts: ["A) 20 Joules", "B) 5 Joules", "C) 12 Joules", "D) Zero"], ans: "A) 20 Joules", ch: "Work and Energy" },
    { q: "Sound waves in air are characterized as:", opts: ["A) Longitudinal mechanical waves", "B) Transverse electromagnetic waves", "C) Stationary waves", "D) Radio waves"], ans: "A) Longitudinal mechanical waves", ch: "Sound" },
    { q: "Assertion (A): Lysosomes are called 'suicide bags' of a cell.\nReason (R): When cell gets damaged, lysosomes burst and digestive enzymes digest the own cell.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "The Fundamental Unit of Life", type: 'ar' },
    { q: "Assertion (A): Newton's first law of motion is also known as the law of inertia.\nReason (R): An object remains in state of rest or uniform motion unless acted upon by an external unbalanced force.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Force and Laws of Motion", type: 'ar' }
  ],
  vsas: [
    { q: "Convert the following temperatures to Celsius scale: (a) 293 K (b) 373 K.", ans: "(a) 293 - 273 = 20 °C\n(b) 373 - 273 = 100 °C.", ch: "Matter in Our Surroundings" },
    { q: "Differentiate between a Sol, a Solution, and a Suspension based on particle size and stability.", ans: "Solution: Particle size < 1 nm, completely stable, homogeneous.\nSol (Colloid): 1 nm - 1000 nm, quite stable, shows Tyndall effect.\nSuspension: > 1000 nm, unstable, particles settle down.", ch: "Is Matter Around Us Pure" },
    { q: "Define valency. Write the chemical formula of: (a) Aluminium chloride (b) Magnesium oxide.", ans: "Valency is the combining capacity of an element.\n(a) Al³⁺ and Cl⁻ => AlCl3\n(b) Mg²⁺ and O²⁻ => MgO.", ch: "Atoms and Molecules" },
    { q: "State two distinct differences between plant cell and animal cell.", ans: "1. Plant cells possess a rigid cellulose cell wall and plastids (chloroplasts); animal cells lack them.\n2. Plant cells have large central vacuoles, whereas animal cells have small temporary vacuoles.", ch: "The Fundamental Unit of Life" },
    { q: "State Newton's Third Law of Motion with one daily life example.", ans: "To every action, there is an equal and opposite reaction.\nExample: While walking, feet push the ground backwards and ground pushes feet forwards.", ch: "Force and Laws of Motion" },
    { q: "What is reverberation? How can reverberation in an auditorium or cinema hall be reduced?", ans: "Reverberation is the persistence of sound in an enclosed hall due to repeated multiple reflections.\nReduction: Covering walls/ceilings with sound-absorbing materials like compressed fibreboard, rough plaster, and heavy curtains.", ch: "Sound" }
  ],
  sas: [
    { q: "Explain how evaporation causes cooling. List three factors that increase the rate of evaporation.", ans: "During evaporation, particles absorb latent heat of vaporization from the surroundings, resulting in a cooling sensation.\nFactors:\n1. Increase in surface area.\n2. Increase in temperature.\n3. Increase in wind speed (or decrease in humidity).", ch: "Matter in Our Surroundings" },
    { q: "State the postulates of Bohr's model of an atom. Draw Bohr's atomic structure of Sodium (Na, Z=11).", ans: "1. Electrons revolve in discrete circular orbits called energy levels or shells (K, L, M, N).\n2. While revolving in discrete orbits, electrons do not radiate energy.\nElectronic configuration of Na (11): K=2, L=8, M=1.", ch: "Structure of the Atom" },
    { q: "Derive the second equation of motion s = ut + 1/2 at² graphically using a velocity-time graph.", ans: "Area under v-t graph = Area of rectangle (OADC) + Area of triangle (ABD)\nArea = (u × t) + 1/2 × t × (v - u)\nSince v - u = at, Area s = ut + 1/2 at².", ch: "Motion" },
    { q: "State the Universal Law of Gravitation. If the distance between two objects is doubled, how does the gravitational force change?", ans: "F = G (m1 · m2) / r².\nIf r is doubled (r' = 2r), F' = G (m1 · m2) / (2r)² = F / 4.\nThe gravitational force becomes one-fourth (1/4th) of its initial value.", ch: "Gravitation" }
  ],
  las: [
    { q: "(a) Define Kinetic Energy and derive the formula KE = 1/2 mv² for an object of mass m moving with velocity v.\n(b) An electric heater of 1500 W is used for 4 hours every day. Calculate the energy units consumed in 30 days.", ans: "(a) Work done W = F · s = (ma) · s. From v² - u² = 2as with u=0, s = v²/(2a). Therefore W = ma · (v²/(2a)) = 1/2 mv² = KE.\n(b) Energy = Power × Time = 1.5 kW × (4 h × 30) = 1.5 × 120 = 180 kWh (units).", ch: "Work and Energy" },
    { q: "(a) Describe the structure of a neuron with a neat labelled diagram.\n(b) Name the three types of muscle tissues and write one structural difference between voluntary and involuntary muscles.", ans: "(a) A neuron consists of: (1) Cyton/Cell body with nucleus, (2) Dendrites receiving impulses, (3) Axon transmitting electrical impulse, and (4) Nerve endings.\n(b) Muscle tissues: Striated (skeletal), Smooth (unstriated), and Cardiac. Striated muscles are voluntary and multinucleated; smooth muscles are involuntary and spindle-shaped.", ch: "Tissues" }
  ],
  cases: [
    {
      passage: "A car starts from rest at t = 0 and accelerates uniformly at 2 m/s² for 10 seconds along a straight road. It then moves with a constant velocity for 20 seconds, and finally brings to a stop in 5 seconds by applying uniform brakes.",
      q: "Q1. What is the maximum velocity acquired by the car? (1M)\nQ2. Calculate the distance covered by the car during the acceleration phase. (1M)\nQ3. Find the total distance travelled by the car during the entire motion. (2M)",
      ans: "Q1. v = u + at = 0 + 2(10) = 20 m/s.\nQ2. s1 = ut + 1/2 at² = 0 + 1/2(2)(10)² = 100 m.\nQ3. s2 (uniform) = 20 m/s × 20 s = 400 m. s3 (retardation) = (u + v)/2 × t = (20 + 0)/2 × 5 = 50 m. Total distance = 100 + 400 + 50 = 550 m.",
      ch: "Motion"
    }
  ]
};

// ==========================================
// 2. CLASS 9 MATHEMATICS (041) MASTER POOL
// ==========================================
export const CLASS9_MATH_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "Which of the following is an irrational number?", opts: ["A) √7", "B) √9", "C) 0.375", "D) 22/7"], ans: "A) √7", ch: "Number Systems" },
    { q: "The value of (256)^0.16 × (256)^0.09 is equal to:", opts: ["A) 4", "B) 16", "C) 64", "D) 256.25"], ans: "A) 4", ch: "Number Systems" },
    { q: "If x + 1 is a factor of the polynomial 2x² + kx, then the value of k is:", opts: ["A) 2", "B) -2", "C) 1", "D) -1"], ans: "A) 2", ch: "Polynomials" },
    { q: "The point (-3, 4) lies in which quadrant of the Cartesian plane?", opts: ["A) Quadrant II", "B) Quadrant I", "C) Quadrant III", "D) Quadrant IV"], ans: "A) Quadrant II", ch: "Coordinate Geometry" },
    { q: "The linear equation 2x + 3y = 6 cuts the y-axis at the point:", opts: ["A) (0, 2)", "B) (3, 0)", "C) (0, 3)", "D) (2, 0)"], ans: "A) (0, 2)", ch: "Linear Equations in Two Variables" },
    { q: "In △ABC, if ∠A = 40° and ∠B = 60°, then the longest side of the triangle is:", opts: ["A) AB", "B) BC", "C) AC", "D) Cannot be determined"], ans: "A) AB", ch: "Triangles" },
    { q: "The diagonals of a rhombus are 16 cm and 12 cm. The length of each side of the rhombus is:", opts: ["A) 10 cm", "B) 14 cm", "C) 8 cm", "D) 20 cm"], ans: "A) 10 cm", ch: "Quadrilaterals" },
    { q: "The semi-perimeter of a triangle with sides 13 cm, 14 cm, and 15 cm is:", opts: ["A) 21 cm", "B) 42 cm", "C) 28 cm", "D) 18 cm"], ans: "A) 21 cm", ch: "Heron's Formula" },
    { q: "The total surface area of a hemisphere of radius 7 cm (using π = 22/7) is:", opts: ["A) 462 cm²", "B) 308 cm²", "C) 616 cm²", "D) 154 cm²"], ans: "A) 462 cm²", ch: "Surface Areas and Volumes" },
    { q: "Assertion (A): The degree of a non-zero constant polynomial is zero.\nReason (R): Any non-zero constant 'c' can be written as c · x⁰.", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "Polynomials", type: 'ar' }
  ],
  vsas: [
    { q: "Express 0.2353535... (0.235 with bar on 35) in the p/q rational form.", ans: "Let x = 0.23535... => 10x = 2.3535... and 1000x = 235.3535...\n1000x - 10x = 233 => 990x = 233 => x = 233 / 990.", ch: "Number Systems" },
    { q: "Evaluate 105 × 106 without direct multiplication using suitable algebraic identity.", ans: "(100 + 5)(100 + 6) = 100² + (5 + 6)100 + (5 × 6) = 10000 + 1100 + 30 = 11130.", ch: "Polynomials" },
    { q: "Find the value of k if (x = 2, y = 1) is a solution of the equation 2x + 3y = k.", ans: "2(2) + 3(1) = 4 + 3 = 7. Thus k = 7.", ch: "Linear Equations in Two Variables" },
    { q: "In △ABC, AB = AC and ∠B = 70°. Find the measure of ∠A.", ans: "Since AB = AC, ∠C = ∠B = 70°.\n∠A = 180° - (70° + 70°) = 180° - 140° = 40°.", ch: "Triangles" }
  ],
  sas: [
    { q: "Factorize completely: x³ - 23x² + 142x - 120.", ans: "Let P(1) = 1 - 23 + 142 - 120 = 0 => (x - 1) is a factor.\nDividing P(x) by (x - 1) gives x² - 22x + 120 = (x - 10)(x - 12).\nFactors: (x - 1)(x - 10)(x - 12).", ch: "Polynomials" },
    { q: "State and prove Mid-point Theorem for a triangle.", ans: "Statement: The line segment joining the midpoints of any two sides of a triangle is parallel to the third side and equal to half of it.\nProof by constructing parallelogram through midpoint extension.", ch: "Quadrilaterals" },
    { q: "Find the area of a triangular plot whose sides are in the ratio 3 : 5 : 7 and its perimeter is 300 m.", ans: "3x + 5x + 7x = 300 => 15x = 300 => x = 20.\nSides are 60 m, 100 m, 140 m. Semi-perimeter s = 150 m.\nArea = √[150(150-60)(150-100)(150-140)] = √[150 × 90 × 50 × 10] = 1500√3 m².", ch: "Heron's Formula" }
  ],
  las: [
    { q: "(a) If x + y + z = 0, prove that x³ + y³ + z³ = 3xyz.\n(b) Without actually calculating the cubes, find the value of (-12)³ + (7)³ + (5)³.", ans: "(a) Using identity x³+y³+z³-3xyz = (x+y+z)(x²+y²+z²-xy-yz-zx). When x+y+z=0, RHS=0 => x³+y³+z³ = 3xyz.\n(b) Here (-12) + 7 + 5 = 0, so (-12)³ + 7³ + 5³ = 3(-12)(7)(5) = -1260.", ch: "Polynomials" },
    { q: "A conical tent is 10 m high and the radius of its base is 24 m.\n(a) Find the slant height of the tent.\n(b) Find the cost of canvas required to make the tent at ₹ 70 per m² (π = 22/7).", ans: "(a) Slant height l = √(r² + h²) = √(24² + 10²) = √(576 + 100) = √676 = 26 m.\n(b) Canvas area = CSA = πrl = (22/7) × 24 × 26 = 13728/7 m².\nCost = (13728/7) × 70 = ₹ 1,37,280.", ch: "Surface Areas and Volumes" }
  ],
  cases: [
    {
      passage: "A residential society park is in the shape of a quadrilateral ABCD. The residents decided to create a flowering zone in △ABD and a children play zone in △BCD. Coordinates are A(0,0), B(4,0), C(4,3), and D(0,3).",
      q: "Q1. Name the specific quadrilateral formed by ABCD. (1M)\nQ2. Find the perimeter of the entire park ABCD. (1M)\nQ3. Find the length of diagonal BD and the area of the park. (2M)",
      ans: "Q1. Rectangle (opposite sides equal and parallel, angles 90°).\nQ2. AB = 4, BC = 3, CD = 4, DA = 3. Perimeter = 2(4 + 3) = 14 units.\nQ3. BD = √(4² + 3²) = √25 = 5 units. Area = Length × Breadth = 4 × 3 = 12 sq units.",
      ch: "Coordinate Geometry"
    }
  ]
};

// ==========================================
// 3. CLASS 9 SOCIAL SCIENCE (087) MASTER POOL
// ==========================================
export const CLASS9_SOCIAL_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "On 14th July 1789, the fortress-prison stormed by the people of Paris was:", opts: ["A) Bastille", "B) Versailles", "C) Tuileries", "D) Louvre"], ans: "A) Bastille", ch: "The French Revolution" },
    { q: "Who wrote the famous philosophical book 'The Social Contract'?", opts: ["A) Jean-Jacques Rousseau", "B) Montesquieu", "C) John Locke", "D) Voltaire"], ans: "A) Jean-Jacques Rousseau", ch: "The French Revolution" },
    { q: "The Bolshevik party in Russia during the 1917 revolution was led by:", opts: ["A) Vladimir Lenin", "B) Joseph Stalin", "C) Leon Trotsky", "D) Tsar Nicholas II"], ans: "A) Vladimir Lenin", ch: "Socialism in Europe and the Russian Revolution" },
    { q: "The Standard Meridian of India passes through which city in Uttar Pradesh?", opts: ["A) Mirzapur (82°30' E)", "B) Allahabad (80° E)", "C) Varanasi (83° E)", "D) Lucknow (81° E)"], ans: "A) Mirzapur (82°30' E)", ch: "India - Size and Location" },
    { q: "The highest mountain peak in India (in Karakoram range) is:", opts: ["A) K2 (Mount Godwin-Austen)", "B) Kanchenjunga", "C) Nanda Devi", "D) Anamudi"], ans: "A) K2 (Mount Godwin-Austen)", ch: "Physical Features of India" },
    { q: "Which river is known as 'Dakshin Ganga' due to its large length and basin area?", opts: ["A) Godavari", "B) Krishna", "C) Mahanadi", "D) Kaveri"], ans: "A) Godavari", ch: "Drainage" },
    { q: "What is the minimum voting age for citizens in India according to Universal Adult Franchise?", opts: ["A) 18 years", "B) 21 years", "C) 25 years", "D) 16 years"], ans: "A) 18 years", ch: "Electoral Politics" },
    { q: "MGNREGA 2005 guarantees how many days of wage employment in a financial year to rural households?", opts: ["A) 100 days", "B) 150 days", "C) 200 days", "D) 365 days"], ans: "A) 100 days", ch: "Poverty as a Challenge" }
  ],
  vsas: [
    { q: "State two major causes of the French Revolution of 1789.", ans: "1. Financial bankruptcy due to continuous wars and lavish lifestyle of King Louis XVI.\n2. Unjust division of French society where only the Third Estate paid all taxes.", ch: "The French Revolution" },
    { q: "What is a 'Water Divide'? Give one prominent example in India.", ans: "Any elevated area (such as a mountain or upland) that separates two drainage basins is called a water divide. Example: The ridge between Indus and Ganga river systems near Ambala.", ch: "Drainage" },
    { q: "What is disguised unemployment? In which sector is it most commonly observed in India?", ans: "Disguised unemployment occurs when more people are working on a job than actually required. It is predominantly observed in the rural agricultural sector.", ch: "People as Resource" }
  ],
  sas: [
    { q: "Explain the main features of the Constitution of 1791 framed by the National Assembly in France.", ans: "1. Vested law-making power in the National Assembly, making France a Constitutional Monarchy.\n2. Divided citizens into Active Citizens (men over 25 paying taxes = 3 days wages) and Passive Citizens.\n3. Began with the Declaration of the Rights of Man and Citizen.", ch: "The French Revolution" },
    { q: "Why is the Indian Monsoon considered a unifying bond for the entire subcontinent?", ans: "1. The entire agricultural cycle depends upon timely monsoon arrival.\n2. The seasonal alteration of the wind system and weather phenomena unites all regions.\n3. Indian festivals, cultural landscape, and flora/fauna revolve around the monsoon arrival.", ch: "Climate" },
    { q: "State three key arguments in favour of Democracy.", ans: "1. Democratic government is more accountable and responsible to the people.\n2. Improves the quality of decision-making through consultation and discussion.\n3. Provides a peaceful method to resolve conflicts and enhances the dignity of citizens.", ch: "What is Democracy? Why Democracy?" }
  ],
  las: [
    { q: "Explain the circumstances that led to the rise of Adolf Hitler and the Nazi dictatorship in Germany.", ans: "1. Humiliating Treaty of Versailles (loss of territories, war guilt, heavy reparations).\n2. The Great Economic Depression of 1929 (collapse of German banking, unemployment exceeding 6 million).\n3. Weakness of the Weimar Republic and Article 48 emergency powers.\n4. Hitler powerful oratory, propaganda promising employment and restoration of national pride.\n5. Destruction of democracy via the Reichstag fire and Enabling Act of 1933.", ch: "Nazism and the Rise of Hitler" },
    { q: "Explain the major dimensions of Food Security in India and the role played by the Public Distribution System (PDS).", ans: "Food Security dimensions:\n1. Availability: Total food production in country plus imports and opening buffer stocks.\n2. Accessibility: Food is within reach of every citizen without discrimination.\n3. Affordability: Individual has enough money to buy nutritious food.\nPDS Role: Distributes subsidized foodgrains to poor households via Fair Price Shops (Ration Shops), maintaining food price stability.", ch: "Food Security in India" }
  ],
  cases: [
    {
      passage: "The Indian Constitution was drawn up under very difficult circumstances. The country was born through a partition on religious basis. The makers of the Constitution had to ensure that diversity was respected while national unity was preserved.",
      q: "Q1. When was the Indian Constitution adopted and when did it come into full effect? (1M)\nQ2. Who was the Chairman of the Drafting Committee of the Constituent Assembly? (1M)\nQ3. State any two core values enshrined in the Preamble of the Indian Constitution. (2M)",
      ans: "Q1. Adopted on 26 November 1949; Came into effect on 26 January 1950 (Republic Day).\nQ2. Dr. B.R. Ambedkar.\nQ3. Sovereign, Socialist, Secular, Democratic, Republic, Justice, Liberty, Equality, Fraternity.",
      ch: "Constitutional Design"
    }
  ]
};

// ==========================================
// 4. CLASS 9 ENGLISH (184) MASTER POOL
// ==========================================
export const CLASS9_ENGLISH_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "In 'The Fun They Had', where did Tommy find the real old book printed on paper?", opts: ["A) In the attic of his house", "B) In the school library", "C) In a museum", "D) On a computer screen"], ans: "A) In the attic of his house", ch: "Beehive: The Fun They Had" },
    { q: "Who encouraged and trained Evelyn Glennie to sense percussion music with her body?", opts: ["A) Ron Forbes", "B) Her mother Isabel", "C) Bismillah Khan", "D) Her headmistress"], ans: "A) Ron Forbes", ch: "Beehive: The Sound of Music" },
    { q: "In Robert Frost's poem 'The Road Not Taken', what does the diverged road symbolize?", opts: ["A) The choices and decisions made in life", "B) A forest path", "C) Physical travel", "D) Career changes"], ans: "A) The choices and decisions made in life", ch: "Beehive: The Road Not Taken" },
    { q: "Why was Kezia afraid of her father in 'The Little Girl'?", opts: ["A) He was strict, stern, and gave her commands without warmth", "B) He never talked to her", "C) He punished her daily", "D) He was an officer"], ans: "A) He was strict, stern, and gave her commands without warmth", ch: "Beehive: The Little Girl" },
    { q: "Complete the reported speech: The doctor said to the patient, 'Take this medicine twice daily.'", opts: ["A) The doctor advised the patient to take that medicine twice daily.", "B) The doctor said the patient take medicine.", "C) The doctor told taking medicine twice.", "D) The doctor asked that take medicine."], ans: "A) The doctor advised the patient to take that medicine twice daily.", ch: "Grammar: Reported Speech" },
    { q: "Choose the correct modal: You ______ follow the traffic signals to avoid accidents.", opts: ["A) must", "B) might", "C) can", "D) may"], ans: "A) must", ch: "Grammar: Modals" },
    { q: "In 'A Truly Beautiful Mind', what did Albert Einstein call his desk drawer at the patent office in Bern?", opts: ["A) Bureau of theoretical physics", "B) Invention chamber", "C) Secret lab", "D) Innovation safe"], ans: "A) Bureau of theoretical physics", ch: "Beehive: A Truly Beautiful Mind" },
    { q: "In 'The Snake and the Mirror', what made the doctor feel that God had punished his vain pride?", opts: ["A) A cobra landed on his shoulder while he was admiring himself in the mirror", "B) His room caught fire", "C) A thief stole all his clothes", "D) He failed his medical exam"], ans: "A) A cobra landed on his shoulder while he was admiring himself in the mirror", ch: "Beehive: The Snake and the Mirror" },
    { q: "In 'The Happy Prince', what were the two most precious things in the city chosen by the angel?", opts: ["A) The leaden heart of the Prince and the dead Swallow", "B) The ruby sword and sapphire eyes", "C) Gold leaves and silver coins", "D) The marble statue and diamond crown"], ans: "A) The leaden heart of the Prince and the dead Swallow", ch: "Moments: The Happy Prince" },
    { q: "Fill in the blank with correct subject-verb concord: 'Bread and butter ______ his favourite breakfast.'", opts: ["A) is", "B) are", "C) were", "D) have been"], ans: "A) is", ch: "Grammar: Subject-Verb Agreement" }
  ],
  vsas: [
    { q: "What kind of teachers did Margie and Tommy have in the story 'The Fun They Had'?", ans: "They had mechanical computerized robotic teachers with large black screens installed in their study rooms at home, which gave lessons and evaluated tests instantly.", ch: "Beehive: The Fun They Had" },
    { q: "How does Evelyn Glennie hear music despite profound deafness?", ans: "She senses sound vibrations through various parts of her body—higher notes from the waist up and lower notes from the waist down, removing shoes on wooden platforms.", ch: "Beehive: The Sound of Music" },
    { q: "Why did Bismillah Khan refuse to start a Shehnai school in the United States?", ans: "He was deeply in love with Banaras, River Ganga, and Dumraon. He stated that the student could recreate the temples but could never transport the holy River Ganga to America.", ch: "Beehive: The Sound of Music" },
    { q: "Correct the sentence: 'Neither of the two candidates have passed the physical screening test.'", ans: "Correction: Replace 'have' with 'has'.\nRule: 'Neither of' followed by a plural noun takes a singular verb.", ch: "Grammar: Subject-Verb Concord" },
    { q: "Why did Grandfather decide to sell Toto the monkey back to the tonga-driver?", ans: "Toto was extremely mischievous and destructive, tearing curtains, clothes, and breaking dishes which the middle-class family could not afford on a regular basis.", ch: "Moments: The Adventures of Toto" }
  ],
  sas: [
    { q: "How did Kezia's perception of her father change towards the end of the story?", ans: "When Kezia had a nightmare while her mother was hospitalized, her father carried her lovingly to his bedroom, tucked her in, and comforted her. She realized he had a big, loving heart beneath his strict exterior.", ch: "Beehive: The Little Girl" },
    { q: "What message does Subramania Bharati convey in the poem 'Wind'?", ans: "The poem conveys that wind (symbolizing life hardships) breaks weak structures but makes strong fires roar. We must build strong bodies, steadfast hearts, and resilient minds to befriend adversity.", ch: "Beehive: Wind" },
    { q: "Why did Albert Einstein write a letter to American President Franklin D. Roosevelt in 1939?", ans: "Einstein warned President Roosevelt about the potential development of atomic bombs by Nazi Germany after the discovery of nuclear fission, urging the US to initiate atomic research.", ch: "Beehive: A Truly Beautiful Mind" },
    { q: "What made the poet W.B. Yeats yearn for 'The Lake Isle of Innisfree' while standing on grey city pavements?", ans: "The poet longed for peace, natural tranquility, and simple rustic living in a small clay wattle cabin with honeybees and cricket songs, escaping noisy urban life.", ch: "Beehive: The Lake Isle of Innisfree" }
  ],
  las: [
    { q: "SECTION B: WRITING SKILLS - DESCRIPTIVE PARAGRAPH (5 MARKS)\n\nWrite a Descriptive Paragraph (100–120 words) describing an inspirational teacher who made a profound impact on your academic journey. Mention their personality traits, teaching methodology, and how they motivated students to conquer self-doubt.", ans: "Structure:\n1. Introduction: Introduce the teacher (name, subject, appearance).\n2. Core Body: Highlight unique pedagogy (interactive discussions, encouraging patience, relatable real-world examples).\n3. Conclusion: Reflect on enduring moral values, self-belief, and gratitude.", ms: "[1 Mark] Format & Title\n[2 Marks] Content & Descriptive Attributes\n[2 Marks] Vocabulary, Coherence & Sentence Construction", ch: "Writing Skills: Descriptive Paragraph" },
    { q: "SECTION B: WRITING SKILLS - DIARY ENTRY (5 MARKS)\n\nYou participated in an inter-school plantation drive on World Environment Day and planted fifty saplings in a degraded community park. Write a Diary Entry (100–120 words) recording your feelings of joy, teamwork, and environmental commitment.", ans: "Format: Day, Date, Time, Salutation (Dear Diary), Body, Signature.\nContent: Excitement of gathering with classmates, physical labor of digging soil, pride in planting 50 native saplings, and commitment to nurture them.", ms: "[1 Mark] Format\n[2 Marks] Personal Emotional Expression & Description\n[2 Marks] Fluency & Grammatical Accuracy", ch: "Writing Skills: Diary Entry" },
    { q: "In 'The Lost Child', describe the emotional turmoil of the child when he realizes he has been separated from his parents at the village fair.", ans: "The child was captivated by toys, sweets, balloons, and the roundabout. But the moment he turned and found his parents missing, panic struck. Tears rolled down his cheeks and he ran hysterically through the crowd, crying 'Mother, Father!'. All material attractions instantly lost meaning without his parents.", ch: "Moments: The Lost Child" },
    { q: "In 'The Kingdom of Fools', how did the wise Guru use his intelligence to save his disciple from the execution stake?", ans: "The Guru concocted a clever tale that the newly made stake was the stake of the God of Justice, and whoever died on it first would be reborn as the King in the next incarnation. The greedy foolish king and minister eagerly jumped at the chance to die first to retain royalty, freeing the innocent disciple.", ch: "Moments: In the Kingdom of Fools" }
  ],
  cases: [
    {
      passage: "Margie went into the schoolroom. It was right next to her bedroom, and the mechanical teacher was on and waiting for her. It was always on at the same time every day except Saturday and Sunday, because her mother said little girls learned better if they learned at regular hours.",
      q: "Q1. Where was Margie's schoolroom located? (1M)\nQ2. On which two days was the mechanical teacher not active? (1M)\nQ3. Why did Margie's mother insist on studying at regular hours? (2M)",
      ans: "Q1. Right next to her bedroom in her home.\nQ2. Saturday and Sunday.\nQ3. Her mother believed young children learn much more effectively and consistently when they follow a disciplined daily routine.",
      ch: "Beehive: The Fun They Had"
    },
    {
      passage: "Read the excerpt on Environmental Conservation and Biodiversity:\nForests are the green lungs of our planet, covering approximately 31% of the global land area. They harbor more than 80% of all terrestrial species of animals, plants, and insects. Afforestation and community-led tree plantation drives act as primary carbon sinks, absorbing billions of metric tons of greenhouse gas emissions annually. Maintaining local ecosystem balance prevents soil erosion, preserves underground aquifers, and mitigates climate extremes.",
      q: "Q1. What percentage of global land area is covered by forests? (1M)\nQ2. State two crucial ecological functions served by community afforestation drives. (2M)\nQ3. Find a word from the passage that means 'alleviates or makes less severe'. (1M)",
      ans: "Q1. Approximately 31%.\nQ2. (i) Acts as vital carbon sinks absorbing greenhouse gases. (ii) Prevents soil erosion and preserves groundwater aquifers.\nQ3. 'Mitigates'.",
      ch: "Reading Comprehension: Factual Passage"
    }
  ]
};

// ==========================================
// 5. CLASS 9 HINDI (002) MASTER POOL
// ==========================================
export const CLASS9_HINDI_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "‘दो बैलों की कथा’ में दोनों बैलों के क्या नाम थे?", opts: ["A) हीरा और मोती", "B) सोना और रूपा", "C) लाली और कालू", "D) चंचल और धीर"], ans: "A) हीरा और मोती", ch: "क्षितिज: दो बैलों की कथा" },
    { q: "‘ल्हासा की ओर’ पाठ में लेखक किस वेश में तिब्बत की यात्रा पर गए थे?", opts: ["A) भिखमंगे के छद्म वेश में", "B) बौद्ध भिक्षु के वेश में", "C) व्यापारी के वेश में", "D) सैनिक के वेश में"], ans: "A) भिखमंगे के छद्म वेश में", ch: "क्षितिज: ल्हासा की ओर" },
    { q: "‘सालिम अली’ किस प्रसिद्ध पक्षी विज्ञानी के रूप में जाने जाते हैं?", opts: ["A) बर्ड वॉचर (पक्षी प्रेमी)", "B) शिकारी", "C) लेखक", "D) चित्रकार"], ans: "A) बर्ड वॉचर (पक्षी प्रेमी)", ch: "क्षितिज: साँवले सपनों की याद" },
    { q: "‘प्रतिदिन’ शब्द में कौन-सा समास है?", opts: ["A) अव्ययीभाव समास", "B) तत्पुरुष समास", "C) कर्मधारय समास", "D) द्विगु समास"], ans: "A) अव्ययीभाव समास", ch: "व्यावहारिक व्याकरण: समास" },
    { q: "‘चारु चंद्र की चंचल किरणें खेल रही हैं जल-थल में’ पंक्ति में कौन-सा अलंकार है?", opts: ["A) अनुप्रास अलंकार", "B) यमक अलंकार", "C) उपमा अलंकार", "D) रूपक अलंकार"], ans: "A) अनुप्रास अलंकार", ch: "व्यावहारिक व्याकरण: अलंकार" },
    { q: "‘दो बैलों की कथा’ पाठ के लेखक का नाम क्या है?", opts: ["A) प्रेमचंद", "B) राहुल सांकृत्यायन", "C) जाबिर हुसैन", "D) श्यामाचरण दुबे"], ans: "A) प्रेमचंद", ch: "क्षितिज: दो बैलों की कथा" },
    { q: "हीरा और मोती किस जाति के बैल थे?", opts: ["A) पछाईं जाति", "B) सिंधी जाति", "C) कश्मीरी जाति", "D) हरियाणवी जाति"], ans: "A) पछाईं जाति", ch: "क्षितिज: दो बैलों की कथा" },
    { q: "ल्हासा की ओर पाठ के लेखक राहुल सांकृत्यायन ने तिब्बत यात्रा किस वर्ष की थी?", opts: ["A) सन 1929-30 के लगभग", "B) सन 1947 में", "C) सन 1950 में", "D) सन 1920 में"], ans: "A) सन 1929-30 के लगभग", ch: "क्षितिज: ल्हासा की ओर" },
    { q: "तिब्बत में सबसे सुरक्षित स्थान किसे माना जाता था?", opts: ["A) डांडे", "B) बौद्ध विहार", "C) तिब्बती टेंट", "D) गाँव के बाहर"], ans: "B) बौद्ध विहार", ch: "क्षितिज: ल्हासा की ओर" },
    { q: "‘उपभोक्तावाद की संस्कृति’ पाठ के लेखक कौन हैं?", opts: ["A) श्यामाचरण दुबे", "B) जाबिर हुसैन", "C) प्रेमचंद", "D) महादेवी वर्मा"], ans: "A) श्यामाचरण दुबे", ch: "क्षितिज: उपभोक्तावाद की संस्कृति" },
    { q: "साँवले सपनों की याद पाठ किस प्रसिद्ध व्यक्तित्व पर केंद्रित है?", opts: ["A) सालिम अली", "B) जवाहरलाल नेहरू", "C) महात्मा गांधी", "D) भगत सिंह"], ans: "A) सालिम अली", ch: "क्षितिज: साँवले सपनों की याद" },
    { q: "कबीर की रचनाओं के संकलन को क्या कहा जाता है?", opts: ["A) बीजक", "B) रामायणी", "C) सबद", "D) साखी"], ans: "A) बीजक", ch: "क्षितिज: साखियाँ एवं सबद" },
    { q: "‘रसखान’ कवि की भक्ति किस भाव की थी?", opts: ["A) अनन्य कृष्ण भक्ति", "B) राम भक्ति", "C) शिव भक्ति", "D) निर्गुण भक्ति"], ans: "A) अनन्य कृष्ण भक्ति", ch: "क्षितिज: सवैये" },
    { q: "‘इस जल प्रलय में’ पाठ के लेखक फणीश्वरनाथ रेणु का संबंध किस क्षेत्र से है?", opts: ["A) आँचलिक कथाकार", "B) ऐतिहासिक उपन्यासकार", "C) नाटककार", "D) छायावादी कवि"], ans: "A) आँचलिक कथाकार", ch: "कृतिका: इस जल प्रलय में" },
    { q: "‘रसोईघर’ शब्द में कौन-सा समास है?", opts: ["A) तत्पुरुष समास", "B) बहुव्रीहि समास", "C) द्वंद्व समास", "D) कर्मधारय समास"], ans: "A) तत्पुरुष समास", ch: "व्यावहारिक व्याकरण: समास" },
    { q: "‘अनुमान’ शब्द में कौन-सा उपसर्ग है?", opts: ["A) अनु", "B) अन", "C) आ", "D) अति"], ans: "A) अनु", ch: "व्यावहारिक व्याकरण: उपसर्ग" },
    { q: "‘सुंदरता’ शब्द में कौन-सा प्रत्यय है?", opts: ["A) ता", "B) दर", "C) आ", "D) इता"], ans: "A) ता", ch: "व्यावहारिक व्याकरण: प्रत्यय" },
    { q: "अर्थ की दृष्टि से वाक्य के कुल कितने भेद होते हैं?", opts: ["A) आठ", "B) छह", "C) चार", "D) दस"], ans: "A) आठ", ch: "व्यावहारिक व्याकरण: वाक्य भेद" },
    { q: "‘पीतंबर’ (पीला है वस्त्र जिसका अर्थात् श्रीकृष्ण) में कौन-सा समास है?", opts: ["A) बहुव्रीहि समास", "B) कर्मधारय समास", "C) द्विगु समास", "D) अव्ययीभाव समास"], ans: "A) बहुव्रीहि समास", ch: "व्यावहारिक व्याकरण: समास" },
    { q: "‘मेरे संग की औरतें’ पाठ की लेखिका का नाम क्या है?", opts: ["A) मृदुला गर्ग", "B) महादेवी वर्मा", "C) सुभद्रा कुमारी चौहान", "D) शिवानी"], ans: "A) मृदुला गर्ग", ch: "कृतिका: मेरे संग की औरतें" },
    { q: "लेखिका मृदुला गर्ग की नानी के मन में किसकी आज़ादी के प्रति जुनून था?", opts: ["A) देश की आज़ादी", "B) महिलाओं की आज़ादी", "C) अपनी आज़ादी", "D) बच्चों की आज़ादी"], ans: "A) देश की आज़ादी", ch: "कृतिका: मेरे संग की औरतें" },
    { q: "‘माटी वाली’ किस विधा की रचना है?", opts: ["A) कहानी", "B) कविता", "C) निबंध", "D) संस्मरण"], ans: "A) कहानी", ch: "कृतिका: माटी वाली" },
    { q: "माटी वाली बुढ़िया कहाँ से माटी लाती थी?", opts: ["A) माताखान से", "B) खेत से", "C) नदी से", "D) पहाड़ से"], ans: "A) माताखान से", ch: "कृतिका: माटी वाली" },
    { q: "‘रीढ़ की हड्डी’ एकांकी का मुख्य विषय क्या है?", opts: ["A) नारी शिक्षा और समाज का दृष्टिकोण", "B) भ्रष्टाचार", "C) बेरोजगारी", "D) स्वास्थ्य"], ans: "A) नारी शिक्षा और समाज का दृष्टिकोण", ch: "कृतिका: रीढ़ की हड्डी" },
    { q: "Assertion (A): हीरा और मोती गया के घर से दो बार भागे थे क्योंकि उन्हें वहाँ भरपेट भोजन और स्नेह नहीं मिला।\nReason (R): गया ने बैलों के साथ अपमानजनक और क्रूर व्यवहार किया था जिससे वे आहत हुए।", opts: ["A) Both A and R are true and R is the correct explanation of A", "B) Both A and R are true but R is not the correct explanation", "C) A is true but R is false", "D) A is false but R is true"], ans: "A) Both A and R are true and R is the correct explanation of A", ch: "क्षितिज: दो बैलों की कथा", type: 'ar' },
    { q: "प्रेमचंद का जन्म कहाँ हुआ था?", opts: ["A) लमही", "B) काशी", "C) इलाहाबाद", "D) लखनऊ"], ans: "A) लमही", ch: "क्षितिज: दो बैलों की कथा" }
  ],
  vsas: [
    { q: "कांजीहौस में कैद पशुओं की हाजिरी क्यों ली जाती थी?", ans: "कांजीहौस में लावारिस और आवारा पशुओं की संख्या गिनने और यह सुनिश्चित करने के लिए हाजिरी ली जाती थी कि कोई पशु भाग या मर तो नहीं गया।", ch: "क्षितिज: दो बैलों की कथा" },
    { q: "कबीरदास जी के अनुसार सच्चा संत कौन है?", ans: "जो पक्ष-विपक्ष और जाति-पांति के विवादों से मुक्त होकर निष्पक्ष भाव से ईश्वर का स्मरण करता है, वही सच्चा संत है।", ch: "क्षितिज: साखियाँ एवं सबद" },
    { q: "लेखक राहुल सह्कृत्यायन ने तिब्बत यात्रा के दौरान अपने साथियों से बिछड़ जाने का क्या कारण बताया?", ans: "लेखक का घोड़ा बहुत सुस्त और धीमा चल रहा था जिसके कारण वे अपने दल से पिछड़ गए और गलत रास्ते पर आगे निकल गए।", ch: "क्षितिज: ल्हासा की ओर" },
    { q: "‘उपभोक्तावाद की संस्कृति’ पाठ के अनुसार आज हमारी उपभोग की प्रवृत्ति का हमारे समाज पर क्या असर पड़ रहा है?", ans: "हम विज्ञापनों के चकाचौंध में फंसकर तात्कालिक सुख और दिखावे को प्राथमिकता दे रहे हैं जिससे हमारे मौलिक सांस्कृतिक मूल्य और आपसी भाईचारा कमजोर हो रहे हैं।", ch: "क्षितिज: उपभोक्तावाद की संस्कृति" },
    { q: "‘समास’ और ‘संधि’ में एक मुख्य अंतर लिखिए।", ans: "संधि वर्णों (ध्वनियों) का मेल है, जबकि समास शब्दों (पदों) का मेल है।", ch: "व्यावहारिक व्याकरण: समास" },
    { q: "अर्थ की दृष्टि से वाक्य भेद पहचानिए: ‘शायद आज वर्षा हो।’", ans: "संदेहवाचक वाक्य (जिस वाक्य में कार्य के होने में संदेह या संभावना का बोध हो)।", ch: "व्यावहारिक व्याकरण: वाक्य भेद" },
    { q: "सुमित्रानंदन पंत को किस उपनाम से जाना जाता है?", ans: "प्रकृति के सुकुमार कवि के नाम से।", ch: "क्षितिज: ग्राम श्री" },
    { q: "ग्राम श्री कविता में किस ऋतु का वर्णन है?", ans: "वसंत और शीत ऋतु के संक्रमण काल और ग्रामीण सौंदर्य का।", ch: "क्षितिज: ग्राम श्री" },
    { q: "रीढ़ की हड्डी एकांकी में उमा की क्या विशेषता बताई गई है?", ans: "उमा एक पढ़ी-लिखी, स्वाभिमानी और स्पष्टवादिनी लड़की है जो समाज की दकियानूसी सोच का विरोध करती है।", ch: "कृतिका: रीढ़ की हड्डी" },
    { q: "माटी वाली का स्वभाव कैसा था?", ans: "माटी वाली अत्यंत परिश्रमी, सहनशील और अपने कार्य के प्रति समर्पित वृद्ध महिला थी।", ch: "कृतिका: माटी वाली" }
  ],
  sas: [
    { q: "‘उपभोक्तावाद की संस्कृति’ पाठ के आधार पर स्पष्ट कीजिए कि दिखावे की संस्कृति से समाज को क्या नुकसान हो रहा है?", ans: "दिखावे की संस्कृति से समाज में दिखावा, ईर्ष्या, तनाव और नैतिक मूल्यों का पतन हो रहा है। सामाजिक संबंध कमजोर हो रहे हैं और व्यक्ति विज्ञापनों का मानसिक गुलाम बनता जा रहा है।", ch: "क्षितिज: उपभोक्तावाद की संस्कृति" },
    { q: "सालिम अली प्रकृति और पक्षियों की रक्षा के प्रति किस प्रकार आजीवन समर्पित रहे?", ans: "सालिम अली ने अपनी संपूर्ण जिंदगी पक्षियों के सर्वेक्षण, उनके प्राकृतिक आवास संरक्षण और पर्यावरण संतुलन के लिए समर्पित कर दी। उन्होंने ‘फॉल ऑफ अ स्पैरो’ जैसी आत्मकथा के जरिए प्रकृति की रक्षा का संदेश दिया।", ch: "क्षितिज: साँवले सपनों की याद" },
    { q: "कबीर की साखियों में ईश्वर प्राप्ति के लिए किन आडंबरों और पाखंडों का खंडन किया गया है?", ans: "कबीर ने माला फेरने, बाह्य पूजा-पाठ, तीर्थाटन, मस्जिद में अजान देने और योग-साधना जैसे बाहरी दिखावों का कड़ा विरोध किया है। उनके अनुसार ईश्वर कण-कण में अंतर्निहित है और शुद्ध आंतरिक प्रेम से ही प्राप्त होता है।", ch: "क्षितिज: साखियाँ एवं सबद" },
    { q: "रसखान के सवैयों में ब्रजभूमि के प्रति उनका अगाध प्रेम किस प्रकार प्रकट हुआ है?", ans: "रसखान जी का ब्रजभूमि के प्रति अटूट प्रेम है। वे अगले जन्म में मनुष्य, पशु, पक्षी या पत्थर—हर योनि में ब्रज में ही जन्म लेना चाहते हैं ताकि वे कृष्ण की लीलास्थली (गोकुल, यमुना, कदंब की छांव) का सान्निध्य पा सकें।", ch: "क्षितिज: सवैये" },
    { q: "रचनात्मक लेखन: आपके क्षेत्र में जलभराव की समस्या के संबंध में नगर निगम अधिकारी को एक शिकायती पत्र लिखिए।", ans: "औपचारिक पत्र का प्रारूप (प्रेषक, दिनांक, सेवा में, विषय, महोदय, समस्या का विवरण, और भवदीय)।", ch: "लेखन: औपचारिक पत्र" },
    { q: "रचनात्मक लेखन: 'पर्यावरण संरक्षण' विषय पर लगभग 100 शब्दों में एक सारगर्भित अनुच्छेद लिखिए।", ans: "अनुच्छेद लेखन (प्रस्तावना, कारण, प्रभाव, बचाव और निष्कर्ष)।", ch: "लेखन: अनुच्छेद लेखन" },
    { q: "रचनात्मक लेखन: विद्यालय के वार्षिक उत्सव की जानकारी देते हुए एक आकर्षक सूचना तैयार कीजिए।", ans: "सूचना लेखन का प्रारूप (संस्था का नाम, सूचना, विषय, दिनांक, समय, स्थान, विवरण)।", ch: "लेखन: सूचना लेखन" },
    { q: "रचनात्मक लेखन: दो मित्रों के बीच 'परीक्षा की तैयारी' विषय पर संवाद लिखिए।", ans: "संवाद लेखन (स्वाभाविक और विषय केंद्रित बातचीत)।", ch: "लेखन: संवाद लेखन" },
    { q: "रचनात्मक लेखन: 'बालश्रम' पर एक लघु कथा लिखिए।", ans: "कथा लेखन (पात्र, समस्या, संघर्ष, और उचित सकारात्मक अंत)।", ch: "लेखन: लघु कथा" },
    { q: "रचनात्मक लेखन: अपने विद्यालय के खेल कप्तान को खेलों के उपकरण मँगवाने हेतु पत्र लिखिए।", ans: "औपचारिक पत्र लेखन के नियमानुसार।", ch: "लेखन: औपचारिक पत्र" }
  ],
  las: [
    { q: "‘दो बैलों की कथा’ के माध्यम से प्रेमचंद ने स्वतंत्रता और स्वाभिमान के संबंध में क्या संदेश दिया है? सविस्तार लिखिए।", ans: "प्रेमचंद ने दर्शाया है कि स्वतंत्रता सहज रूप से नहीं मिलती, उसके लिए निरंतर संघर्ष और बलिदान देना पड़ता है। हीरा और मोती ने हर अत्याचार का डटकर मुकाबला किया और अंततः अपने स्वाभिमान व आजादी को प्राप्त किया।", ch: "क्षितिज: दो बैलों की कथा" },
    { q: "‘इस जल प्रलय में’ पाठ के आधार पर बाढ़ आने से पूर्व शहरवासियों की तैयारियों और बाढ़ के आक्रमण का सजीव वर्णन कीजिए।", ans: "बाढ़ की खबर मिलते ही लोग दुकानों से सामान सुरक्षित स्थानों पर पहुँचाने लगे, स्टोव, केरोसिन, मोमबत्ती और पीने का पानी जमा करने लगे। जब पानी गोलंबर तक पहुँचा तो लोग छतों और ऊँचे स्थानों पर शरण लेने लगे, जहाँ महिलाओं, बच्चों और मवेशियों की चीख-पुकार व मानवीय आपदा का हृदयविदारक दृश्य था।", ch: "कृतिका: इस जल प्रलय में" },
    { q: "रूस और भारत के संदर्भ में पर्यावरण संरक्षण के प्रति जन-जागरूकता क्यों आवश्यक है? ‘साँवले सपनों की याद’ पाठ के आलोक में उत्तर लिखिए।", ans: "बढ़ते शहरीकरण, औद्योगिकीकरण और अंधाधुंध वनों की कटाई के कारण प्राकृतिक संतुलन बिगड़ गया है। सालिम अली जैसे प्रकृति प्रेमियों की प्रेरणा से हमें यह समझना होगा कि यदि पक्षी और पर्यावरण सुरक्षित नहीं रहेंगे, तो मानव अस्तित्व भी संकट में पड़ जाएगा।", ch: "क्षितिज: साँवले सपनों की याद" },
    { q: "माटी वाली के सामने विस्थापन की क्या समस्या थी? वर्तमान संदर्भ में विस्थापन की समस्या पर प्रकाश डालिए।", ans: "टिहरी बाँध बनने से माटी वाली के सामने आजीविका और आवास दोनों का संकट आ गया। विकास के नाम पर गरीबों को विस्थापित किया जाता है जिसका दंश सबसे ज्यादा उन्हें ही झेलना पड़ता है।", ch: "कृतिका: माटी वाली" },
    { q: "रीढ़ की हड्डी एकांकी समाज की किस कुरीति पर प्रहार करती है? सविस्तार स्पष्ट करें।", ans: "यह एकांकी समाज की उस दोहरी मानसिकता पर प्रहार करती है जहाँ लड़कों की गलतियों को नजरअंदाज किया जाता है और लड़कियों से अत्यधिक उम्मीदें रखी जाती हैं।", ch: "कृतिका: रीढ़ की हड्डी" }
  ],
  cases: [
    {
      passage: "‘झूरी काछी के दोनों बैलों के नाम थे—हीरा और मोती। दोनों पछाईं जाति के थे—देखने में सुंदर, काम में चौकस, डील में ऊँचे। बहुत दिनों साथ रहते-रहते दोनों में भाईचारा हो गया था। दोनों आमने-सामने या साथ बैठे हुए एक-दूसरे से मूक भाषा में विचार-विनिमय करते थे।’",
      q: "Q1. बैलों के नाम और उनकी जाति क्या थी? (1M)\nQ2. दोनों बैल आपस में किस भाषा में बातचीत करते थे? (1M)\nQ3. हीरा और मोती के आपसी स्नेह की मुख्य विशेषता क्या थी? (2M)",
      ans: "Q1. हीरा और मोती, पछाईं जाति.\nQ2. मूक (मौन) भाषा में।\nQ3. दोनों एक-दूसरे की मन की बात बिना बोले समझ लेते थे और साथ रहकर उनमें गहरा भ्रातृभाव विकसित हो गया था।",
      ch: "क्षितिज: दो बैलों की कथा"
    },
    {
      passage: "Read the passage carefully and answer the questions:\n‘ल्हासा की ओर’ पाठ में राहुल सांकृत्यायन ने तिब्बत के समाज का जीवंत चित्रण किया है। वहाँ जाति-पांति, छुआछूत का कोई बंधन नहीं था और पर्दा प्रथा जैसी कुप्रथाएँ भी नहीं थीं। सामान्यतः चोर-डकैतों का भय होने के बावजूद यात्रियों के लिए ठहरने की उचित व्यवस्था और अतिथि सत्कार की अद्भुत परंपरा देखने को मिलती थी।",
      q: "Q1. तिब्बत समाज में किस प्रकार की सामाजिक कुप्रथाएँ नहीं थीं? (1M)\nQ2. तिब्बत यात्रा के दौरान यात्रियों को मुख्य रूप से किस प्रकार के भय का सामना करना पड़ता था? (1M)\nQ3. तिब्बती समाज की अतिथि सत्कार और स्वतंत्रता से जुड़ी दो विशेषताएँ लिखिए। (2M)",
      ans: "Q1. जाति-पांति, छुआछूत और पर्दा प्रथा नहीं थीं।\nQ2. डाकू-चोरों का भय।\nQ3. (i) महिलाएं अपरिचितों को भी चाय बनाकर देती थीं। (ii) समाज में भेदभाव रहित स्वतंत्र वातावरण था।",
      ch: "क्षितिज: ल्हासा की ओर"
    },
    {
      passage: "सुजान भगत सीधे-सादे किसान थे। उन्हें अपने खेती-बारी और मवेशियों से बड़ा लगाव था। जब उनके बेटे ने उनसे घर का सारा हिसाब-किताब छीन लिया, तो वे भीतर ही भीतर घुटने लगे। उन्हें लगा कि अब घर में उनका कोई सम्मान नहीं रह गया है।",
      q: "Q1. सुजान भगत कैसे व्यक्ति थे? (1M)\nQ2. सुजान भगत को किस चीज़ से लगाव था? (1M)\nQ3. सुजान भगत के मन में पीड़ा का क्या कारण था? (2M)",
      ans: "Q1. सीधे-सादे किसान।\nQ2. खेती-बारी और मवेशियों से।\nQ3. बेटे द्वारा अधिकार छीन लिए जाने से उन्हें लगा कि घर में उनका सम्मान खत्म हो गया है, इसी वजह से वे दुखी थे।",
      ch: "अपठित गद्यांश"
    },
    {
      passage: "कबीर की साखियों में ईश्वर को सर्वव्यापी बताया गया है। मोको कहाँ ढूँढे रे बंदे, मैं तो तेरे पास में। ना मैं देवल, ना मैं मसजिद, ना काबे कैलास में।",
      q: "Q1. कबीर के अनुसार ईश्वर कहाँ निवास करता है? (1M)\nQ2. मनुष्य ईश्वर को कहाँ-कहाँ ढूँढता है? (1M)\nQ3. इस पद का मूल भाव क्या है? (2M)",
      ans: "Q1. ईश्वर मनुष्य के हृदय में निवास करता है।\nQ2. देवल, मस्जिद, काबा, और कैलास में।\nQ3. ईश्वर सर्वव्यापी है और उसे प्राप्त करने के लिए बाहरी आडंबरों की नहीं बल्कि सच्चे मन की आवश्यकता है।",
      ch: "क्षितिज: साखियाँ एवं सबद"
    }
  ]
};

// ==========================================
// 6. CLASS 9 INFORMATION TECHNOLOGY (402) MASTER POOL
// ==========================================
export const CLASS9_IT_POOL: SubjectQuestionPool = {
  mcqs: [
    { q: "Which key combination is used to undo the last action in LibreOffice Writer?", opts: ["A) Ctrl + Z", "B) Ctrl + Y", "C) Ctrl + U", "D) Ctrl + X"], ans: "A) Ctrl + Z", ch: "Digital Documentation" },
    { q: "In a spreadsheet, the intersection of a row and a column is called a:", opts: ["A) Cell", "B) Grid", "C) Range", "D) Table"], ans: "A) Cell", ch: "Electronic Spreadsheet" },
    { q: "Which of the following is a non-verbal method of communication?", opts: ["A) Body Language", "B) Email", "C) Speech", "D) Letter"], ans: "A) Body Language", ch: "Communication Skills" },
    { q: "The default file extension of a LibreOffice Writer document is:", opts: ["A) .odt", "B) .docx", "C) .ods", "D) .odp"], ans: "A) .odt", ch: "Digital Documentation" },
    { q: "Which formula is used to calculate the average of cells A1 through A10 in Calc?", opts: ["A) =AVERAGE(A1:A10)", "B) =AVG(A1:A10)", "C) =MEAN(A1:A10)", "D) =SUM(A1:A10)/10"], ans: "A) =AVERAGE(A1:A10)", ch: "Electronic Spreadsheet" }
  ],
  vsas: [
    { q: "What is touch typing? State one benefit of learning touch typing.", ans: "Touch typing is typing without looking at the keyboard keys, using muscle memory and finger positioning on the home row keys (ASDF JKL;). Benefit: Increases typing speed and reduces errors.", ch: "Data Entry & Keyboarding Skills" },
    { q: "Differentiate between Hardware and Software with one example of each.", ans: "Hardware: Physical components of a computer system that can be seen and touched (e.g., CPU, RAM, Keyboard).\nSoftware: Set of instructions/programs that tell the computer hardware what to do (e.g., Operating System, Calc).", ch: "ICT Skills" }
  ],
  sas: [
    { q: "Explain the three main components of the LibreOffice Impress presentation window.", ans: "1. Slides Pane: Displays thumbnail views of all slides in presentation.\n2. Workspace: The main central editing area for designing the active slide.\n3. Tasks Pane / Sidebar: Provides properties, master slides, animation, and slide transitions.", ch: "Digital Presentation" },
    { q: "What are the 7 Cs of effective communication? List any four of them.", ans: "The 7 Cs ensure effective communication: (1) Clear, (2) Concise, (3) Concrete, (4) Correct, (5) Coherent, (6) Complete, (7) Courteous.", ch: "Communication Skills" }
  ],
  las: [
    { q: "Explain the various formatting options available for text and paragraphs in a word processing document.", ans: "1. Font Formatting: Font family, size, bold, italics, underline, font color, and highlight.\n2. Paragraph Formatting: Text alignments (Left, Center, Right, Justify), line spacing, and paragraph spacing.\n3. Bullets and Numbering: Creating ordered and unordered lists for structured presentation.\n4. Borders and Shading: Applying background color and borders to emphasize important text paragraphs.", ch: "Digital Documentation" }
  ],
  cases: [
    {
      passage: "Rohan is preparing a project report in LibreOffice Writer. He needs to insert a table with 5 columns and 10 rows to compare student scores, apply heading styles, and generate an automated table of contents.",
      q: "Q1. Which menu in Writer is used to insert a table? (1M)\nQ2. What is the shortcut key to insert a table in Writer? (1M)\nQ3. How can Rohan generate an automated Table of Contents (TOC)? (2M)",
      ans: "Q1. Table Menu -> Insert Table.\nQ2. Ctrl + F12.\nQ3. Insert -> Table of Contents and Index -> Table of Contents, Index or Bibliography, provided Heading styles (Heading 1, 2, 3) are used throughout the document.",
      ch: "Digital Documentation"
    }
  ]
};

export const CLASS9_MATHS_POOL = CLASS9_MATH_POOL;
export const CLASS9_SST_POOL = CLASS9_SOCIAL_POOL;
