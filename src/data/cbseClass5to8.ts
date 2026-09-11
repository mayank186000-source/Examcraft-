import { Subject, Question } from '../types';

// ==========================================
// CBSE CLASS 8 SUBJECTS & CHAPTER CURRICULUM
// ==========================================
export const CBSE_CLASS_8_SUBJECTS: Subject[] = [
  {
    id: 'class8-science',
    name: 'Class 8 Science',
    code: '088-SCI',
    category: 'Science',
    color: '#0284c7',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300',
    icon: 'FlaskConical',
    totalChapters: 13,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c8-sci-ch1', number: 1, title: 'Crop Production and Management', unitName: 'Food Production', unitWeightageMarks: 8, topics: ['Agricultural Practices', 'Sowing & Irrigation', 'Manures & Fertilizers', 'Harvesting & Storage'], keyFormulasOrConcepts: ['Kharif vs Rabi crops', 'Drip & Sprinkler Irrigation', 'NPK fertilizers'] },
      { id: 'c8-sci-ch2', number: 2, title: 'Microorganisms: Friend and Foe', unitName: 'Living World', unitWeightageMarks: 8, topics: ['Bacteria, Fungi, Protozoa, Algae, Viruses', 'Fermentation & Pasteurization', 'Nitrogen Cycle', 'Disease Causing Microbes'], keyFormulasOrConcepts: ['Louis Pasteur - Fermentation', 'Rhizobium nitrogen fixation', 'Vaccines & Antibodies'] },
      { id: 'c8-sci-ch3', number: 3, title: 'Coal and Petroleum', unitName: 'Natural Resources', unitWeightageMarks: 6, topics: ['Fossils Fuels', 'Coke, Coal Tar & Coal Gas', 'Petroleum Refining & Fractional Distillation', 'CNG & LPG'], keyFormulasOrConcepts: ['Exhaustible vs Inexhaustible resources', 'Fractional distillation of crude oil'] },
      { id: 'c8-sci-ch4', number: 4, title: 'Combustion and Flame', unitName: 'Chemical Effects', unitWeightageMarks: 7, topics: ['Ignition Temperature', 'Inflammable Substances', 'Structure of a Flame', 'Fuel Efficiency & Calorific Value'], keyFormulasOrConcepts: ['Calorific value (kJ/kg)', 'Non-luminous vs Luminous zone', 'CO2 Fire Extinguishers'] },
      { id: 'c8-sci-ch5', number: 5, title: 'Conservation of Plants and Animals', unitName: 'Environment', unitWeightageMarks: 6, topics: ['Deforestation & Consequences', 'Biosphere Reserves & National Parks', 'Endemic Species & Red Data Book', 'Reforestation'], keyFormulasOrConcepts: ['Flora & Fauna', 'Red Data Book (IUCN)', 'Project Tiger'] },
      { id: 'c8-sci-ch6', number: 6, title: 'Reproduction in Animals', unitName: 'Biology', unitWeightageMarks: 8, topics: ['Modes of Reproduction', 'Male & Female Reproductive Organs', 'Internal & External Fertilization', 'Metamorphosis & Viviparous/Oviparous'], keyFormulasOrConcepts: ['Zygote → Embryo → Foetus', 'In Vitro Fertilization (IVF)', 'Budding & Binary Fission'] },
      { id: 'c8-sci-ch7', number: 7, title: 'Reaching the Age of Adolescence', unitName: 'Human Physiology', unitWeightageMarks: 7, topics: ['Puberty Changes', 'Endocrine Glands & Hormones', 'Secondary Sexual Characters', 'Reproductive Health & Balanced Diet'], keyFormulasOrConcepts: ['Pituitary, Thyroid, Adrenal & Pancreas', 'Chromosome XX (Female) & XY (Male)'] },
      { id: 'c8-sci-ch8', number: 8, title: 'Force and Pressure', unitName: 'Physics', unitWeightageMarks: 8, topics: ['Contact & Non-contact Forces', 'Pressure = Force / Area', 'Atmospheric & Liquid Pressure'], keyFormulasOrConcepts: ['Pressure P = F/A (Pascal/N/m²)', 'Barometer', 'Electrostatic & Gravitational Force'] },
      { id: 'c8-sci-ch9', number: 9, title: 'Friction', unitName: 'Physics', unitWeightageMarks: 6, topics: ['Factors Affecting Friction', 'Static, Sliding & Rolling Friction', 'Friction: Necessary Evil', 'Fluid Friction & Streamlining'], keyFormulasOrConcepts: ['Static > Sliding > Rolling friction', 'Lubricants & Ball Bearings', 'Drag reduction'] },
      { id: 'c8-sci-ch10', number: 10, title: 'Sound', unitName: 'Physics', unitWeightageMarks: 7, topics: ['Production of Sound', 'Human Voice Box (Larynx)', 'Amplitude, Time Period & Frequency', 'Audible & Inaudible Range', 'Noise Pollution'], keyFormulasOrConcepts: ['Pitch depends on Frequency (Hz)', 'Loudness ∝ (Amplitude)²', 'Audible range: 20 Hz to 20,000 Hz'] },
      { id: 'c8-sci-ch11', number: 11, title: 'Chemical Effects of Electric Current', unitName: 'Electricity', unitWeightageMarks: 6, topics: ['Conductors & Insulators in Liquids', 'Electroplating & Applications', 'LED & Chemical Reactions of Current'], keyFormulasOrConcepts: ['Electroplating copper/chrome', 'Electrolytes & Electrodes', 'LED polarity'] },
      { id: 'c8-sci-ch12', number: 12, title: 'Some Natural Phenomena', unitName: 'Earth Science', unitWeightageMarks: 6, topics: ['Charging by Rubbing', 'Lightning & Electroscope', 'Earthquakes & Richter Scale', 'Seismograph & Safety Measures'], keyFormulasOrConcepts: ['Gold-leaf electroscope', 'Fault zones & Seismic waves', 'Richter scale logarithmic nature'] },
      { id: 'c8-sci-ch13', number: 13, title: 'Light', unitName: 'Optics', unitWeightageMarks: 7, topics: ['Laws of Reflection', 'Regular & Diffused Reflection', 'Multiple Images & Kaleidoscope', 'Structure of Human Eye & Care', 'Braille System'], keyFormulasOrConcepts: ['Angle of Incidence = Angle of Reflection', 'Number of images N = (360/θ) - 1', 'Rods (light sensitivity) & Cones (color)'] }
    ]
  },
  {
    id: 'class8-maths',
    name: 'Class 8 Mathematics',
    code: '088-MTH',
    category: 'Mathematics',
    color: '#16a34a',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: 'Calculator',
    totalChapters: 12,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c8-mth-ch1', number: 1, title: 'Rational Numbers', unitName: 'Number Systems', unitWeightageMarks: 8, topics: ['Closure, Commutative & Associative Properties', 'Additive & Multiplicative Inverse', 'Rational Numbers on Number Line', 'Finding Rational Numbers Between Two Numbers'], keyFormulasOrConcepts: ['Additive Inverse of a/b is -a/b', 'Multiplicative Inverse is b/a', 'Density property'] },
      { id: 'c8-mth-ch2', number: 2, title: 'Linear Equations in One Variable', unitName: 'Algebra', unitWeightageMarks: 8, topics: ['Solving Equations with Variable on One & Both Sides', 'Word Problems on Ages, Numbers, Currency & Geometry'], keyFormulasOrConcepts: ['Transposition method', 'Cross-multiplication: (ax+b)/(cx+d) = k'] },
      { id: 'c8-mth-ch3', number: 3, title: 'Understanding Quadrilaterals', unitName: 'Geometry', unitWeightageMarks: 8, topics: ['Polygons & Convex/Concave', 'Sum of Interior Angles = (n-2) × 180°', 'Sum of Exterior Angles = 360°', 'Parallelogram, Rhombus, Rectangle, Square & Kite Properties'], keyFormulasOrConcepts: ['Angle sum of n-gon = (n-2)180°', 'Diagonals of rhombus bisect at 90°'] },
      { id: 'c8-mth-ch4', number: 4, title: 'Data Handling', unitName: 'Statistics', unitWeightageMarks: 6, topics: ['Grouped Frequency Distribution', 'Bar Graphs & Double Bar Graphs', 'Pie Charts (Circle Graphs)', 'Probability & Random Experiments'], keyFormulasOrConcepts: ['Central angle of sector = (Value / Total) × 360°', 'Probability P(E) = Favorable / Total'] },
      { id: 'c8-mth-ch5', number: 5, title: 'Squares and Square Roots', unitName: 'Number Systems', unitWeightageMarks: 8, topics: ['Properties of Square Numbers', 'Pythagorean Triplets (2m, m²-1, m²+1)', 'Square Root by Prime Factorization & Long Division Method'], keyFormulasOrConcepts: ['Square of odd is odd, even is even', 'Long Division Method for decimals & integers'] },
      { id: 'c8-mth-ch6', number: 6, title: 'Cubes and Cube Roots', unitName: 'Number Systems', unitWeightageMarks: 6, topics: ['Properties of Cubes', 'Hardy-Ramanujan Numbers (1729)', 'Cube Root by Prime Factorization Method'], keyFormulasOrConcepts: ['Cube root of negative is negative', 'Prime factor triplet grouping'] },
      { id: 'c8-mth-ch7', number: 7, title: 'Comparing Quantities', unitName: 'Arithmetic', unitWeightageMarks: 8, topics: ['Ratios and Percentages', 'Discount, MP, CP, SP, Profit & Loss', 'Sales Tax, VAT & GST', 'Compound Interest Formula A = P(1 + r/100)^n'], keyFormulasOrConcepts: ['Profit% = (Profit/CP) × 100', 'Discount = MP - SP', 'CI = A - P'] },
      { id: 'c8-mth-ch8', number: 8, title: 'Algebraic Expressions and Identities', unitName: 'Algebra', unitWeightageMarks: 8, topics: ['Monomials, Binomials & Polynomials', 'Addition, Subtraction & Multiplication', 'Standard Identities: (a+b)², (a-b)², (a+b)(a-b)'], keyFormulasOrConcepts: ['(a+b)² = a² + 2ab + b²', '(a-b)² = a² - 2ab + b²', '(x+a)(x+b) = x² + (a+b)x + ab'] },
      { id: 'c8-mth-ch9', number: 9, title: 'Mensuration', unitName: 'Mensuration', unitWeightageMarks: 8, topics: ['Area of Trapezium, General Quadrilateral & Rhombus', 'Surface Area of Cube, Cuboid & Cylinder', 'Volume of Cube, Cuboid & Cylinder'], keyFormulasOrConcepts: ['Area of Trapezium = 1/2 (a+b)h', 'Area of Rhombus = 1/2 d1 d2', 'Cylinder TSA = 2πr(r+h), Vol = πr²h'] },
      { id: 'c8-mth-ch10', number: 10, title: 'Exponents and Powers', unitName: 'Number Systems', unitWeightageMarks: 6, topics: ['Powers with Negative Exponents', 'Laws of Exponents: a^m × a^n = a^(m+n)', 'Expressing Numbers in Standard Form (Scientific Notation)'], keyFormulasOrConcepts: ['a^(-m) = 1/a^m', '(a^m)^n = a^(m n)', 'a^0 = 1'] },
      { id: 'c8-mth-ch11', number: 11, title: 'Direct and Inverse Proportions', unitName: 'Arithmetic', unitWeightageMarks: 6, topics: ['Direct Proportion x/y = k', 'Inverse Proportion x × y = k', 'Word Problems on Speed, Work & Men'], keyFormulasOrConcepts: ['x1/y1 = x2/y2 (Direct)', 'x1 y1 = x2 y2 (Inverse)'] },
      { id: 'c8-mth-ch12', number: 12, title: 'Factorisation', unitName: 'Algebra', unitWeightageMarks: 6, topics: ['Factorisation by Common Factor', 'Factorisation by Regrouping', 'Factorisation using Identities', 'Division of Polynomials'], keyFormulasOrConcepts: ['Splitting middle term: ax² + bx + c', 'Identity based factoring'] }
    ]
  },
  {
    id: 'class8-social',
    name: 'Class 8 Social Science',
    code: '088-SST',
    category: 'Social Science',
    color: '#d97706',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300',
    icon: 'Globe',
    totalChapters: 10,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c8-sst-ch1', number: 1, title: 'How, When and Where', unitName: 'History', unitWeightageMarks: 8, topics: ['Importance of Dates & Periodisation by James Mill', 'Colonial Rule & Official Records', 'Surveys in India'], keyFormulasOrConcepts: ['A History of British India (1817)', 'National Archives of India'] },
      { id: 'c8-sst-ch2', number: 2, title: 'From Trade to Territory', unitName: 'History', unitWeightageMarks: 9, topics: ['East India Company Comes East', 'Battle of Plassey (1757) & Buxar (1764)', 'Doctrine of Lapse & Subsidiary Alliance', 'Setting up a New Administration'], keyFormulasOrConcepts: ['Robert Clive & Nawab Sirajuddaulah', 'Lord Dalhousie - Doctrine of Lapse'] },
      { id: 'c8-sst-ch3', number: 3, title: 'Ruling the Countryside', unitName: 'History', unitWeightageMarks: 8, topics: ['Permanent Settlement (1793)', 'Mahalwari & Ryotwari Systems', 'Indigo Cultivation & Blue Rebellion (1859)'], keyFormulasOrConcepts: ['Nij & Ryoti cultivation of Indigo', 'Thomas Munro - Ryotwari System'] },
      { id: 'c8-sst-ch4', number: 4, title: 'When People Rebel 1857 and After', unitName: 'History', unitWeightageMarks: 9, topics: ['Causes of Revolt of 1857', 'Bahadur Shah Zafar & Major Leaders', 'Suppression of Revolt', 'Government of India Act 1858'], keyFormulasOrConcepts: ['Mangal Pandey at Barrackpore', 'Rani Lakshmibai, Nana Saheb & Tatya Tope'] },
      { id: 'c8-sst-ch5', number: 5, title: 'Resources', unitName: 'Geography', unitWeightageMarks: 8, topics: ['Natural, Human-Made & Human Resources', 'Renewable vs Non-Renewable Resources', 'Sustainable Development Principles'], keyFormulasOrConcepts: ['Resource Conservation', 'Utility & Value'] },
      { id: 'c8-sst-ch6', number: 6, title: 'Land, Soil, Water & Wildlife', unitName: 'Geography', unitWeightageMarks: 8, topics: ['Soil Profile & Weathering', 'Soil Erosion & Conservation (Mulching, Contour Barriers, Terrace Farming)', 'Water Conservation & Rainwater Harvesting'], keyFormulasOrConcepts: ['CITES Treaty', 'Shelterbelts & Check Dams'] },
      { id: 'c8-sst-ch7', number: 7, title: 'Agriculture', unitName: 'Geography', unitWeightageMarks: 8, topics: ['Primary, Secondary & Tertiary Economic Activities', 'Subsistence & Commercial Farming', 'Major Food & Fiber Crops (Rice, Wheat, Cotton, Jute, Tea)'], keyFormulasOrConcepts: ['Nomadic Herding & Shifting Cultivation', 'Green Revolution'] },
      { id: 'c8-sst-ch8', number: 8, title: 'The Indian Constitution', unitName: 'Civics', unitWeightageMarks: 8, topics: ['Why Does a Country Need a Constitution?', 'Key Features: Federalism, Parliamentary Form, Separation of Powers, Fundamental Rights, Secularism'], keyFormulasOrConcepts: ['Dr. B.R. Ambedkar - Father of Constitution', 'Right to Equality & Right to Freedom'] },
      { id: 'c8-sst-ch9', number: 9, title: 'Understanding Secularism', unitName: 'Civics', unitWeightageMarks: 7, topics: ['What is Secularism?', 'Indian Secularism vs USA Secularism', 'Principled Distance of State from Religion'], keyFormulasOrConcepts: ['Separation of Religion from State', 'Freedom to practice religion'] },
      { id: 'c8-sst-ch10', number: 10, title: 'Parliament and Judiciary', unitName: 'Civics', unitWeightageMarks: 7, topics: ['Role of Parliament (Lok Sabha & Rajya Sabha)', 'Making Laws & Controlling Executive', 'Independent Judiciary, Supreme Court & PIL'], keyFormulasOrConcepts: ['Public Interest Litigation (PIL)', 'Structure of Courts: District → High Court → Supreme Court'] }
    ]
  },
  {
    id: 'class8-english',
    name: 'Class 8 English',
    code: '088-ENG',
    category: 'Languages',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300',
    icon: 'BookOpen',
    totalChapters: 8,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c8-eng-sec-a', number: 1, title: 'Reading Comprehension (Unseen Passages)', unitName: 'Section A - Reading', unitWeightageMarks: 20, topics: ['Discursive Passage', 'Case-Based Factual Passage'], keyFormulasOrConcepts: ['Inference, Vocabulary in context'] },
      { id: 'c8-eng-sec-b', number: 2, title: 'Grammar & Writing Skills', unitName: 'Section B - Grammar & Writing', unitWeightageMarks: 20, topics: ['Formal Letter, Notice, Story Writing, Paragraph', 'Active/Passive Voice, Direct/Indirect Speech, Tenses, Modals'], keyFormulasOrConcepts: ['Format of Notice & Formal Letter', 'Reported speech rules'] },
      { id: 'c8-eng-ch1', number: 3, title: 'Honeydew: The Best Christmas Present in the World', unitName: 'Section C - Literature', unitWeightageMarks: 10, topics: ['World War I Christmas Truce 1914', 'Jim Macpherson & Connie', 'Message of Peace & Goodwill'], keyFormulasOrConcepts: ['Human compassion amidst war'] },
      { id: 'c8-eng-ch2', number: 4, title: 'Honeydew: The Tsunami', unitName: 'Section C - Literature', unitWeightageMarks: 10, topics: ['2004 Indian Ocean Tsunami Courageous Stories', 'Tilly Smith in Thailand', 'Animal instincts before natural disaster'], keyFormulasOrConcepts: ['Resilience, Presence of Mind'] },
      { id: 'c8-eng-ch3', number: 5, title: 'Honeydew: Glimpses of the Past', unitName: 'Section C - Literature', unitWeightageMarks: 10, topics: ['1757 to 1857 Indian History Pictorial Map', 'East India Company oppression & Reformers like Raja Ram Mohan Roy'], keyFormulasOrConcepts: ['Freedom struggle origin'] },
      { id: 'c8-eng-ch4', number: 6, title: 'Honeydew: Bepin Choudhury\'s Lapse of Memory', unitName: 'Section C - Literature', unitWeightageMarks: 10, topics: ['Chunilal\'s prank on Bepin Babu', 'Ranchi trip illusion'], keyFormulasOrConcepts: ['Friendship retaliation & irony'] },
      { id: 'c8-eng-ch5', number: 7, title: 'Honeydew Poems: The Ant and the Cricket & Geography Lesson', unitName: 'Section C - Literature Poetry', unitWeightageMarks: 10, topics: ['Fable lesson on hard work & saving', 'View of earth from jet plane'], keyFormulasOrConcepts: ['Work ethic & Perspective'] },
      { id: 'c8-eng-ch6', number: 8, title: 'It So Happened: How the Camel Got His Hump & Children at Work', unitName: 'Section C - Literature Supplementary', unitWeightageMarks: 10, topics: ['Djinn punishing lazy camel with "Humph"', 'Velu and Jaya - Ragpickers of Chennai station'], keyFormulasOrConcepts: ['Dignity of labor & Child rights'] }
    ]
  },
  {
    id: 'class8-hindi',
    name: 'Class 8 Hindi (हिंदी)',
    code: '088-HIN',
    category: 'Languages',
    color: '#e11d48',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300',
    icon: 'BookOpen',
    totalChapters: 7,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c8-hin-sec-a', number: 1, title: 'खंड ‘क’ - अपठित बोध (गद्यांश व काव्यांश)', unitName: 'खंड क - अपठित बोध', unitWeightageMarks: 15, topics: ['अपठित गद्यांश बोध', 'अपठित काव्यांश भावार्थ'], keyFormulasOrConcepts: ['शीर्षक चयन व केंद्रीय भाव'] },
      { id: 'c8-hin-sec-b', number: 2, title: 'खंड ‘ख’ - व्यावहारिक व्याकरण', unitName: 'खंड ख - व्याकरण', unitWeightageMarks: 20, topics: ['वर्ण विचार, संधि (स्वर संधि)', 'समास, उपसर्ग व प्रत्यय', 'पर्यायवाची, विलोम, मुहावरे, कारक व काल'], keyFormulasOrConcepts: ['व्याकरणिक नियम व वाक्य प्रयोग'] },
      { id: 'c8-hin-ch1', number: 3, title: 'बसंत: ध्वनि (सूर्यकांत त्रिपाठी ‘निराला’)', unitName: 'खंड ग - पाठ्यपुस्तक बसंत', unitWeightageMarks: 9, topics: ['युवाओं में नया उत्साह भरने का संदेश', 'प्रकृति का सौंदर्य व जीवंतता'], keyFormulasOrConcepts: ['आशावादिता व असीम उत्साह'] },
      { id: 'c8-hin-ch2', number: 4, title: 'बसंत: लाख की चूड़ियाँ (कामतानाथ)', unitName: 'खंड ग - पाठ्यपुस्तक बसंत', unitWeightageMarks: 9, topics: ['बदलू मनिहार का हस्तशिल्प', 'मशीनी युग के कारण कुटीर उद्योगों का पतन'], keyFormulasOrConcepts: ['मशीनीकरण की त्रासदी व कारीगरों का दर्द'] },
      { id: 'c8-hin-ch3', number: 5, title: 'बसंत: बस की यात्रा (हरिशंकर परसाई)', unitName: 'खंड ग - पाठ्यपुस्तक बसंत', unitWeightageMarks: 9, topics: ['खटारा बस की हास्यास्पद यात्रा', 'परिवहन निगम और बस मालिकों की लापरवाही पर व्यंग्य'], keyFormulasOrConcepts: ['व्यंग्यात्मक शैली व सामाजिक सरोकार'] },
      { id: 'c8-hin-ch4', number: 6, title: 'बसंत: दीवानों की हस्ती (भगवतीचरण वर्मा) व भगवान के डाकिए (रामधारी सिंह ‘दिनकर’)', unitName: 'खंड ग - पाठ्यपुस्तक बसंत', unitWeightageMarks: 9, topics: ['देशभक्तों की असीम मस्ती व सर्वस्व अर्पण', 'पेड़-पौधे, बादल और नदियाँ विश्व-बंधुत्व के संदेशवाहक'], keyFormulasOrConcepts: ['सद्भाव, प्रेम व विश्व-बंधुत्व'] },
      { id: 'c8-hin-sec-d', number: 7, title: 'खंड ‘घ’ - रचनात्मक लेखन (अनुच्छेद, पत्र व संवाद)', unitName: 'खंड घ - रचनात्मक लेखन', unitWeightageMarks: 18, topics: ['अनुच्छेद लेखन (100 शब्द)', 'औपचारिक व अनौपचारिक पत्र लेखन', 'संवाद लेखन व चित्र वर्णन'], keyFormulasOrConcepts: ['प्रारूप की शुद्धता व भाषा प्रवाह'] }
    ]
  }
];

// ==========================================
// CBSE CLASS 7 SUBJECTS & CHAPTER CURRICULUM
// ==========================================
export const CBSE_CLASS_7_SUBJECTS: Subject[] = [
  {
    id: 'class7-science',
    name: 'Class 7 Science',
    code: '087-SCI',
    category: 'Science',
    color: '#0284c7',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300',
    icon: 'FlaskConical',
    totalChapters: 10,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c7-sci-ch1', number: 1, title: 'Nutrition in Plants', unitName: 'Biology', unitWeightageMarks: 8, topics: ['Autotrophic & Heterotrophic Nutrition', 'Photosynthesis Equation & Stomata', 'Insectivorous Plants (Pitcher Plant)', 'Saprotrophs & Symbiosis (Lichens)'], keyFormulasOrConcepts: ['6CO2 + 6H2O + Sunlight/Chlorophyll → C6H12O6 + 6O2', 'Rhizobium and Leguminous plants'] },
      { id: 'c7-sci-ch2', number: 2, title: 'Nutrition in Animals', unitName: 'Biology', unitWeightageMarks: 8, topics: ['Human Digestive System Steps (Ingestion, Digestion, Absorption, Assimilation, Egestion)', 'Alimentary Canal Parts', 'Digestion in Grass-eating Animals (Ruminants)', 'Feeding in Amoeba'], keyFormulasOrConcepts: ['Villi in small intestine', 'Rumen & cud chewing', 'Pseudopodia in Amoeba'] },
      { id: 'c7-sci-ch3', number: 3, title: 'Heat', unitName: 'Physics', unitWeightageMarks: 8, topics: ['Clinical vs Laboratory Thermometer', 'Conduction, Convection & Radiation', 'Sea Breeze & Land Breeze', 'Dark vs Light Clothing'], keyFormulasOrConcepts: ['Clinical thermometer range 35°C-42°C', 'Convection currents in fluids'] },
      { id: 'c7-sci-ch4', number: 4, title: 'Acids, Bases and Salts', unitName: 'Chemistry', unitWeightageMarks: 8, topics: ['Natural Indicators (Litmus, Turmeric, China Rose)', 'Properties of Acids & Bases', 'Neutralization Reaction in Daily Life'], keyFormulasOrConcepts: ['Acid + Base → Salt + Water + Heat', 'Antacid milk of magnesia for indigestion'] },
      { id: 'c7-sci-ch5', number: 5, title: 'Physical and Chemical Changes', unitName: 'Chemistry', unitWeightageMarks: 8, topics: ['Physical vs Chemical Changes', 'Rusting of Iron & Prevention (Galvanization)', 'Crystallization of Copper Sulfate'], keyFormulasOrConcepts: ['Chemical change yields new substance', 'Galvanization zinc coating'] },
      { id: 'c7-sci-ch6', number: 6, title: 'Respiration in Organisms', unitName: 'Biology', unitWeightageMarks: 8, topics: ['Aerobic vs Anaerobic Respiration', 'Breathing Rate & Mechanism', 'Respiration in Insects (Spiracles/Tracheae), Earthworm (Skin) & Fish (Gills)'], keyFormulasOrConcepts: ['Lactic acid accumulation causes muscle cramps', 'Inhalation vs Exhalation diaphragm movement'] },
      { id: 'c7-sci-ch7', number: 7, title: 'Transportation in Animals and Plants', unitName: 'Biology', unitWeightageMarks: 8, topics: ['Circulatory System (Heart, Blood Vessels: Arteries, Veins, Capillaries)', 'Excretory System in Humans (Kidneys, Ureter, Bladder, Urethra)', 'Transport of Water & Minerals in Plants (Xylem & Phloem)'], keyFormulasOrConcepts: ['Heart chambers (Atria & Ventricles)', 'Transpiration pull'] },
      { id: 'c7-sci-ch8', number: 8, title: 'Reproduction in Plants', unitName: 'Biology', unitWeightageMarks: 8, topics: ['Asexual Modes: Vegetative Propagation, Budding, Fragmentation, Spore Formation', 'Sexual Reproduction: Stamen & Pistil', 'Pollination (Self & Cross) & Fertilization', 'Seed Dispersal'], keyFormulasOrConcepts: ['Budding in Yeast, Fragmentation in Spirogyra', 'Dispersal by wind, water, animals'] },
      { id: 'c7-sci-ch9', number: 9, title: 'Motion and Time', unitName: 'Physics', unitWeightageMarks: 8, topics: ['Slow or Fast Motion', 'Speed = Distance / Time', 'Simple Pendulum & Time Period', 'Distance-Time Graph'], keyFormulasOrConcepts: ['Speed = D / T (m/s or km/h)', 'Time Period T = Time for 1 oscillation'] },
      { id: 'c7-sci-ch10', number: 10, title: 'Electric Current and Its Effects', unitName: 'Physics', unitWeightageMarks: 8, topics: ['Symbols of Electric Components', 'Heating Effect of Current & Fuse', 'Magnetic Effect of Current & Electromagnet', 'Electric Bell Working'], keyFormulasOrConcepts: ['Joule heating effect', 'Nichrome wire in heater', 'Electromagnet soft iron core'] }
    ]
  },
  {
    id: 'class7-maths',
    name: 'Class 7 Mathematics',
    code: '087-MTH',
    category: 'Mathematics',
    color: '#16a34a',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: 'Calculator',
    totalChapters: 10,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c7-mth-ch1', number: 1, title: 'Integers', unitName: 'Number Systems', unitWeightageMarks: 8, topics: ['Properties of Addition & Subtraction of Integers', 'Multiplication & Division of Integers', 'Word Problems'], keyFormulasOrConcepts: ['(-a) × (-b) = ab', 'Division by zero is undefined', 'Distributive property'] },
      { id: 'c7-mth-ch2', number: 2, title: 'Fractions and Decimals', unitName: 'Number Systems', unitWeightageMarks: 8, topics: ['Proper, Improper & Mixed Fractions', 'Multiplication & Division of Fractions', 'Multiplication & Division of Decimals'], keyFormulasOrConcepts: ['Reciprocal of fraction', 'Decimal shifting on × or ÷ by 10, 100, 1000'] },
      { id: 'c7-mth-ch3', number: 3, title: 'Data Handling', unitName: 'Statistics', unitWeightageMarks: 8, topics: ['Arithmetic Mean = Sum / Total', 'Mode = Most Frequent Value', 'Median = Middle Value when arranged', 'Bar Graphs & Double Bar Graphs'], keyFormulasOrConcepts: ['Range = Max Value - Min Value', 'Mean, Mode & Median calculation'] },
      { id: 'c7-mth-ch4', number: 4, title: 'Simple Equations', unitName: 'Algebra', unitWeightageMarks: 8, topics: ['Setting up Equations', 'Solving Equations by Balancing & Transposition', 'Application to Real Life Problems'], keyFormulasOrConcepts: ['Transposition sign change', 'Solving ax + b = c'] },
      { id: 'c7-mth-ch5', number: 5, title: 'Lines and Angles', unitName: 'Geometry', unitWeightageMarks: 8, topics: ['Complementary (sum 90°) & Supplementary (sum 180°)', 'Adjacent Angles & Linear Pair', 'Vertically Opposite Angles', 'Angles made by Transversal with Parallel Lines'], keyFormulasOrConcepts: ['Corresponding angles are equal', 'Alternate interior angles are equal', 'Co-interior angles sum = 180°'] },
      { id: 'c7-mth-ch6', number: 6, title: 'The Triangle and Its Properties', unitName: 'Geometry', unitWeightageMarks: 8, topics: ['Medians and Altitudes of a Triangle', 'Exterior Angle Property = Sum of Interior Opposite Angles', 'Angle Sum Property = 180°', 'Pythagoras Property for Right Angled Triangle'], keyFormulasOrConcepts: ['Exterior Angle = Int Opp Angle 1 + Int Opp Angle 2', 'Hypotenuse² = Base² + Altitude²'] },
      { id: 'c7-mth-ch7', number: 7, title: 'Comparing Quantities', unitName: 'Arithmetic', unitWeightageMarks: 8, topics: ['Equivalent Ratios', 'Percentage to Fraction/Decimal', 'Profit & Loss Percentage', 'Simple Interest Formula SI = P × R × T / 100'], keyFormulasOrConcepts: ['SI = (P·R·T)/100', 'Amount A = P + SI', 'Profit% = (Profit/CP) × 100'] },
      { id: 'c7-mth-ch8', number: 8, title: 'Rational Numbers', unitName: 'Number Systems', unitWeightageMarks: 8, topics: ['Positive & Negative Rational Numbers', 'Standard Form of Rational Numbers', 'Comparison & Operations (+, -, ×, ÷) on Rational Numbers'], keyFormulasOrConcepts: ['p/q form where q ≠ 0', 'Equivalent rational numbers'] },
      { id: 'c7-mth-ch9', number: 9, title: 'Perimeter and Area', unitName: 'Mensuration', unitWeightageMarks: 8, topics: ['Area of Parallelogram = Base × Height', 'Area of Triangle = 1/2 × Base × Height', 'Circumference = 2πr & Area of Circle = πr²'], keyFormulasOrConcepts: ['Area of Parallelogram = b × h', 'Area of Circle = πr²', 'Circumference = 2πr'] },
      { id: 'c7-mth-ch10', number: 10, title: 'Exponents and Powers & Algebraic Expressions', unitName: 'Algebra', unitWeightageMarks: 8, topics: ['Exponents Laws', 'Standard Form Scientific Notation', 'Terms, Factors, Coefficients', 'Like and Unlike Terms, Addition/Subtraction'], keyFormulasOrConcepts: ['a^m × a^n = a^(m+n)', 'a^m ÷ a^n = a^(m-n)', 'Value of expression at x = k'] }
    ]
  },
  {
    id: 'class7-social',
    name: 'Class 7 Social Science',
    code: '087-SST',
    category: 'Social Science',
    color: '#d97706',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300',
    icon: 'Globe',
    totalChapters: 8,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c7-sst-ch1', number: 1, title: 'Tracing Changes & New Kingdoms', unitName: 'History', unitWeightageMarks: 10, topics: ['700 to 1750 CE Terminology & Cartography', 'Cholas, Rashtrakutas, Gurjara-Pratiharas', 'Tripartite Struggle for Kanauj'], keyFormulasOrConcepts: ['Al-Idrisi map 1154 CE', 'Brihadeshwara Temple Tanjavur'] },
      { id: 'c7-sst-ch2', number: 2, title: 'Delhi Sultans & Mughal Empire', unitName: 'History', unitWeightageMarks: 10, topics: ['Raziya Sultan, Alauddin Khalji & Muhammad Tughluq', 'Babur to Aurangzeb', 'Mansabdari & Jagirdari System', 'Akbar\'s Sulh-i Kul Policy'], keyFormulasOrConcepts: ['Iqtadar & Iqta system', 'Ain-i Akbari by Abul Fazl'] },
      { id: 'c7-sst-ch3', number: 3, title: 'Environment & Inside Our Earth', unitName: 'Geography', unitWeightageMarks: 10, topics: ['Biotic & Abiotic Components', 'Crust, Mantle & Core Layers', 'Igneous, Sedimentary & Metamorphic Rocks & Rock Cycle'], keyFormulasOrConcepts: ['Core NIFE (Nickel + Iron)', 'Basalt & Granite'] },
      { id: 'c7-sst-ch4', number: 4, title: 'Our Changing Earth & Air', unitName: 'Geography', unitWeightageMarks: 10, topics: ['Lithospheric Plates & Volcanoes/Earthquakes', 'Endogenic & Exogenic Forces', 'Atmosphere Layers (Troposphere to Exosphere)', 'Weather vs Climate'], keyFormulasOrConcepts: ['Seismograph & Epicentre', 'Greenhouse effect CO2'] },
      { id: 'c7-sst-ch5', number: 5, title: 'Water', unitName: 'Geography', unitWeightageMarks: 10, topics: ['Water Cycle (Evaporation, Condensation, Precipitation)', 'Ocean Circulation: Waves, Tsunami, Tides & Ocean Currents', 'Spring Tides & Neap Tides'], keyFormulasOrConcepts: ['High tide fishing utility', 'Warm Gulf Stream vs Cold Labrador current'] },
      { id: 'c7-sst-ch6', number: 6, title: 'On Equality', unitName: 'Civics', unitWeightageMarks: 10, topics: ['Universal Adult Suffrage', 'Kanta\'s Story & Omprakash Valmiki\'s Joothan', 'Article 15 of Indian Constitution', 'Midday Meal Scheme'], keyFormulasOrConcepts: ['Equality before Law', 'Civil Rights Movement USA 1964'] },
      { id: 'c7-sst-ch7', number: 7, title: 'Role of Government in Health & State Government', unitName: 'Civics', unitWeightageMarks: 10, topics: ['Public vs Private Healthcare Systems', 'Hakim Sheikh Case & Kerala Experience', 'Legislative Assembly (MLA), Governor & Chief Minister'], keyFormulasOrConcepts: ['Public health funded by taxes', 'Unicameral vs Bicameral state legislature'] },
      { id: 'c7-sst-ch8', number: 8, title: 'Markets Around Us & Shirt in the Market', unitName: 'Civics', unitWeightageMarks: 10, topics: ['Weekly Markets, Neighborhood Shops, Shopping Complexes', 'Wholesale vs Retail', 'Chain of Markets: Cotton Farmer → Weaver → Garment Exporter → Supermarket'], keyFormulasOrConcepts: ['Eroded Weaver Cooperative', 'Value Addition at each stage'] }
    ]
  },
  {
    id: 'class7-english',
    name: 'Class 7 English',
    code: '087-ENG',
    category: 'Languages',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300',
    icon: 'BookOpen',
    totalChapters: 6,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c7-eng-sec-a', number: 1, title: 'Reading Comprehension', unitName: 'Section A - Reading', unitWeightageMarks: 20, topics: ['Unseen Factual & Discursive Passages'], keyFormulasOrConcepts: ['Inference & Vocabulary'] },
      { id: 'c7-eng-sec-b', number: 2, title: 'Writing & Grammar', unitName: 'Section B - Writing & Grammar', unitWeightageMarks: 20, topics: ['Notice Writing, Informal Letter, Story Writing', 'Tenses, Prepositions, Conjunctions, Subject-Verb Agreement'], keyFormulasOrConcepts: ['Format & Grammar accuracy'] },
      { id: 'c7-eng-ch1', number: 3, title: 'Honeycomb: Three Questions & The Squirrel', unitName: 'Section C - Literature', unitWeightageMarks: 10, topics: ['King seeking answers to 3 questions from Hermit', 'Humorous description of squirrel'], keyFormulasOrConcepts: ['Present moment importance & Helping others'] },
      { id: 'c7-eng-ch2', number: 4, title: 'Honeycomb: A Gift of Chappals & Gopal and the Hilsa Fish', unitName: 'Section C - Literature', unitWeightageMarks: 10, topics: ['Mridu, Ravi, Meena giving chappals to beggar', 'Gopal\'s challenge to buy Hilsa without anyone talking about it'], keyFormulasOrConcepts: ['Generosity & Wit/Intelligence'] },
      { id: 'c7-eng-ch3', number: 5, title: 'Honeycomb: Quality & The Ashes That Made Trees Bloom', unitName: 'Section C - Literature', unitWeightageMarks: 10, topics: ['Mr. Gessler\'s bootmaking devotion', 'Kind Japanese couple & their faithful dog Muko'], keyFormulasOrConcepts: ['Craftsmanship & Goodness rewarded'] },
      { id: 'c7-eng-ch4', number: 6, title: 'An Alien Hand: The Tiny Teacher & Bringing Up Kari', unitName: 'Section C - Literature Supplementary', unitWeightageMarks: 10, topics: ['Ants\' hard work, discipline & harmony', 'Kari the elephant\'s intelligence & saving a boy'], keyFormulasOrConcepts: ['Nature\'s discipline & Animal bonding'] }
    ]
  },
  {
    id: 'class7-hindi',
    name: 'Class 7 Hindi (हिंदी)',
    code: '087-HIN',
    category: 'Languages',
    color: '#e11d48',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300',
    icon: 'BookOpen',
    totalChapters: 6,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c7-hin-sec-a', number: 1, title: 'खंड ‘क’ - अपठित बोध', unitName: 'खंड क - अपठित बोध', unitWeightageMarks: 15, topics: ['अपठित गद्यांश व काव्यांश प्रश्नोत्तर'], keyFormulasOrConcepts: ['भावार्थ व शीर्षक'] },
      { id: 'c7-hin-sec-b', number: 2, title: 'खंड ‘ख’ - व्याकरण', unitName: 'खंड ख - व्याकरण', unitWeightageMarks: 20, topics: ['संज्ञा, सर्वनाम, विशेषण, क्रिया', 'लिंग, वचन, कारक, मुहावरे व विलोम शब्द'], keyFormulasOrConcepts: ['व्याकरणिक नियम'] },
      { id: 'c7-hin-ch1', number: 3, title: 'बसंत: हम पंछी उन्मुक्त गगन के (शिवमंगल सिंह ‘सुमन’)', unitName: 'खंड ग - बसंत', unitWeightageMarks: 15, topics: ['पक्षियों की स्वतंत्रता की चाह', 'पराधीनता का दुख'], keyFormulasOrConcepts: ['स्वतंत्रता का अमूल्य मूल्य'] },
      { id: 'c7-hin-ch2', number: 4, title: 'बसंत: दादी माँ (शिवप्रसाद सिंह) व हिमालय की बेटियाँ (नागार्जुन)', unitName: 'खंड ग - बसंत', unitWeightageMarks: 15, topics: ['दादी माँ का वात्सल्य व ममता', 'नदियों का लोकमाता व बाल रूप'], keyFormulasOrConcepts: ['पारिवारिक स्नेह व प्रकृति वर्णन'] },
      { id: 'c7-hin-sec-d', number: 5, title: 'खंड ‘घ’ - रचनात्मक लेखन', unitName: 'खंड घ - रचनात्मक लेखन', unitWeightageMarks: 15, topics: ['अनुच्छेद लेखन, पत्र लेखन व संवाद लेखन'], keyFormulasOrConcepts: ['रचनात्मक अभिव्यक्ति'] }
    ]
  }
];

// ==========================================
// CBSE CLASS 6 SUBJECTS & CHAPTER CURRICULUM
// ==========================================
export const CBSE_CLASS_6_SUBJECTS: Subject[] = [
  {
    id: 'class6-science',
    name: 'Class 6 Science',
    code: '086-SCI',
    category: 'Science',
    color: '#0284c7',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300',
    icon: 'FlaskConical',
    totalChapters: 9,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c6-sci-ch1', number: 1, title: 'Components of Food', unitName: 'Biology', unitWeightageMarks: 10, topics: ['Carbohydrates, Proteins, Fats, Vitamins & Minerals', 'Balanced Diet', 'Deficiency Diseases (Scurvy, Beriberi, Rickets, Goitre, Anaemia)'], keyFormulasOrConcepts: ['Iodine test for Starch', 'Copper Sulfate + Caustic Soda for Protein', 'Vitamin C deficiency Scurvy'] },
      { id: 'c6-sci-ch2', number: 2, title: 'Sorting Materials into Groups', unitName: 'Chemistry', unitWeightageMarks: 8, topics: ['Appearance & Hardness', 'Solubility in Water (Soluble vs Insoluble)', 'Transparency (Transparent, Translucent, Opaque)'], keyFormulasOrConcepts: ['Density floating/sinking', 'Luster in metals'] },
      { id: 'c6-sci-ch3', number: 3, title: 'Separation of Substances', unitName: 'Chemistry', unitWeightageMarks: 9, topics: ['Handpicking, Threshing, Winnowing, Sieving', 'Sedimentation, Decantation, Filtration', 'Evaporation & Condensation'], keyFormulasOrConcepts: ['Saturated solution', 'Winnowing uses wind to separate husk from grain'] },
      { id: 'c6-sci-ch4', number: 4, title: 'Getting to Know Plants', unitName: 'Biology', unitWeightageMarks: 9, topics: ['Herbs, Shrubs, Trees, Climbers & Creepers', 'Stem & Leaf Venation (Reticulate vs Parallel)', 'Root Types (Tap Root vs Fibrous)', 'Parts of Flower (Petals, Sepals, Stamen, Pistil)'], keyFormulasOrConcepts: ['Reticulate venation = Tap root', 'Parallel venation = Fibrous root'] },
      { id: 'c6-sci-ch5', number: 5, title: 'Body Movements', unitName: 'Biology', unitWeightageMarks: 8, topics: ['Human Skeleton & Skull', 'Joints: Ball & Socket, Hinge, Pivotal, Fixed Joints', 'Gait of Animals (Earthworm, Snail, Cockroach, Birds, Fish, Snake)'], keyFormulasOrConcepts: ['Streamlined body shape of fish', 'Muscles work in pairs (contraction & relaxation)'] },
      { id: 'c6-sci-ch6', number: 6, title: 'Living Organisms — Characteristics & Habitats', unitName: 'Biology', unitWeightageMarks: 9, topics: ['Terrestrial & Aquatic Habitats', 'Adaptations in Desert (Cactus, Camel), Mountain (Yak, Snow Leopard) & Oceans (Fish, Dolphin)', 'Characteristics of Living Beings'], keyFormulasOrConcepts: ['Respiration, Excretion, Stimuli Response', 'Acclimatization vs Adaptation'] },
      { id: 'c6-sci-ch7', number: 7, title: 'Motion and Measurement of Distances', unitName: 'Physics', unitWeightageMarks: 9, topics: ['Standard Units of Measurement (SI Unit: Meter)', 'Types of Motion: Rectilinear, Circular, Periodic'], keyFormulasOrConcepts: ['1 m = 100 cm = 1000 mm', '1 km = 1000 m', 'Motion of clock hands (Circular & Periodic)'] },
      { id: 'c6-sci-ch8', number: 8, title: 'Light, Shadows and Reflections', unitName: 'Physics', unitWeightageMarks: 9, topics: ['Transparent, Translucent, Opaque', 'Shadow Formation Requirements (Source, Object, Screen)', 'Pinhole Camera', 'Mirrors & Reflection'], keyFormulasOrConcepts: ['Light travels in straight line (Rectilinear propagation)', 'Inverted image in pinhole camera'] },
      { id: 'c6-sci-ch9', number: 9, title: 'Electricity & Circuits and Fun with Magnets', unitName: 'Physics', unitWeightageMarks: 9, topics: ['Electric Cell & Bulb Filament', 'Closed vs Open Circuit & Switch', 'Electric Conductors & Insulators', 'Magnetic & Non-Magnetic Materials', 'Poles of Magnet & Compass'], keyFormulasOrConcepts: ['Current flows positive to negative terminal', 'Like poles repel, unlike poles attract', 'Magnetic compass aligns N-S'] }
    ]
  },
  {
    id: 'class6-maths',
    name: 'Class 6 Mathematics',
    code: '086-MTH',
    category: 'Mathematics',
    color: '#16a34a',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: 'Calculator',
    totalChapters: 8,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c6-mth-ch1', number: 1, title: 'Knowing Our Numbers', unitName: 'Number Systems', unitWeightageMarks: 10, topics: ['Indian & International Place Value System', 'Large Numbers Addition/Subtraction', 'Estimation & Rounding Off', 'Use of Brackets & Roman Numerals'], keyFormulasOrConcepts: ['1 Million = 10 Lakhs, 1 Crore = 10 Millions', 'Roman Numerals: I, V, X, L, C, D, M'] },
      { id: 'c6-mth-ch2', number: 2, title: 'Whole Numbers & Playing with Numbers', unitName: 'Number Systems', unitWeightageMarks: 10, topics: ['Predecessor & Successor', 'Number Line Operations', 'Factors & Multiples, Prime & Composite Numbers', 'Divisibility Rules (2,3,4,5,6,8,9,10,11)', 'HCF & LCM'], keyFormulasOrConcepts: ['HCF × LCM = Product of two numbers', 'Whole numbers start from 0'] },
      { id: 'c6-mth-ch3', number: 3, title: 'Basic Geometrical Ideas & Elementary Shapes', unitName: 'Geometry', unitWeightageMarks: 10, topics: ['Point, Line Segment, Ray, Line', 'Polygons, Curves, Angles & Triangles', 'Angles: Acute, Right, Obtuse, Straight, Reflex', 'Classification of Triangles & Quadrilaterals'], keyFormulasOrConcepts: ['Right angle = 90°', 'Straight angle = 180°', 'Complete angle = 360°'] },
      { id: 'c6-mth-ch4', number: 4, title: 'Integers', unitName: 'Number Systems', unitWeightageMarks: 10, topics: ['Representation of Integers on Number Line', 'Ordering of Integers', 'Addition & Subtraction of Integers using Number Line'], keyFormulasOrConcepts: ['Moving right increases value', 'Moving left decreases value'] },
      { id: 'c6-mth-ch5', number: 5, title: 'Fractions and Decimals', unitName: 'Number Systems', unitWeightageMarks: 10, topics: ['Fraction on Number Line', 'Proper, Improper & Mixed Fractions', 'Equivalent Fractions', 'Decimals Place Value (Tenths, Hundredths, Thousandths)', 'Operations on Decimals'], keyFormulasOrConcepts: ['Simplest form of fraction', 'Converting fractions to decimals'] },
      { id: 'c6-mth-ch6', number: 6, title: 'Data Handling', unitName: 'Statistics', unitWeightageMarks: 10, topics: ['Recording & Organizing Data', 'Tally Marks Table', 'Pictographs & Bar Graphs'], keyFormulasOrConcepts: ['1 symbol = N units in Pictograph', 'Equal width bars in Bar Graph'] },
      { id: 'c6-mth-ch7', number: 7, title: 'Mensuration', unitName: 'Mensuration', unitWeightageMarks: 10, topics: ['Perimeter of Rectangle = 2(L+B)', 'Perimeter of Square = 4 × Side', 'Perimeter of Equilateral Triangle = 3 × Side', 'Area of Rectangle = L × B', 'Area of Square = Side × Side'], keyFormulasOrConcepts: ['Perimeter = Distance around boundary', 'Area = Region enclosed within closed figure'] },
      { id: 'c6-mth-ch8', number: 8, title: 'Algebra & Ratio and Proportion', unitName: 'Algebra & Arithmetic', unitWeightageMarks: 10, topics: ['Matchstick Patterns & Variables', 'Algebraic Expressions', 'Ratio Comparison x:y', 'Proportion a:b :: c:d', 'Unitary Method'], keyFormulasOrConcepts: ['Product of Extremes = Product of Means (ad = bc)', 'Unitary Method: Find value of 1 unit first'] }
    ]
  },
  {
    id: 'class6-social',
    name: 'Class 6 Social Science',
    code: '086-SST',
    category: 'Social Science',
    color: '#d97706',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300',
    icon: 'Globe',
    totalChapters: 6,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c6-sst-ch1', number: 1, title: 'What, Where, How and When? & Earliest Cities', unitName: 'History', unitWeightageMarks: 15, topics: ['Manuscripts & Inscriptions', 'Archaeological Sources', 'Harappan Civilization (Indus Valley)', 'Great Bath, Citadel & Town Planning'], keyFormulasOrConcepts: ['Manuscripts written on palm leaves', 'Mohenjodaro Great Bath'] },
      { id: 'c6-sst-ch2', number: 2, title: 'Kingdoms, Kings & Early Republic', unitName: 'History', unitWeightageMarks: 15, topics: ['Janapadas & Mahajanapadas', 'Varna System', 'Magadha & Vajji (Gana/Sangha)', 'Ashoka the Emperor Who Gave Up War'], keyFormulasOrConcepts: ['Tax system Bhaga (1/6th of produce)', 'Kalinga War 261 BCE'] },
      { id: 'c6-sst-ch3', number: 3, title: 'The Earth in the Solar System & Globe', unitName: 'Geography', unitWeightageMarks: 15, topics: ['Celestial Bodies, Stars & Constellations', 'Planets of Solar System & Earth as Blue Planet', 'Latitudes (Equator, Tropics, Poles) & Longitudes (Prime Meridian & IST)'], keyFormulasOrConcepts: ['82°30\' E Prime Meridian IST', 'Tropic of Cancer 23°30\' N'] },
      { id: 'c6-sst-ch4', number: 4, title: 'Motions of the Earth & Maps', unitName: 'Geography', unitWeightageMarks: 15, topics: ['Rotation (Day/Night) & Revolution (Seasons)', 'Orbital Plane & Leap Year', 'Summer Solstice (June 21) & Winter Solstice (Dec 22)', 'Map Components: Distance, Direction & Symbols'], keyFormulasOrConcepts: ['23.5° axial tilt', 'Equinox March 21 & Sept 23'] },
      { id: 'c6-sst-ch5', number: 5, title: 'Understanding Diversity & Government', unitName: 'Civics', unitWeightageMarks: 10, topics: ['Diversity in India (Ladakh & Kerala comparison)', 'Unity in Diversity phrase by Nehru', 'Levels of Government: Local, State, National', 'Democracy vs Monarchy'], keyFormulasOrConcepts: ['Suffrage Movement', 'Rule of Law'] },
      { id: 'c6-sst-ch6', number: 6, title: 'Local Government & Livelihoods', unitName: 'Civics', unitWeightageMarks: 10, topics: ['Panchayati Raj (Gram Sabha, Gram Panchayat, Zila Parishad)', 'Urban Administration (Municipal Corporation)', 'Rural & Urban Livelihoods'], keyFormulasOrConcepts: ['Gram Panchayat elected body', 'Municipal Councillor'] }
    ]
  },
  {
    id: 'class6-english',
    name: 'Class 6 English',
    code: '086-ENG',
    category: 'Languages',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300',
    icon: 'BookOpen',
    totalChapters: 5,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c6-eng-sec-a', number: 1, title: 'Reading Comprehension', unitName: 'Section A - Reading', unitWeightageMarks: 20, topics: ['Unseen Stories & Factual Passages'], keyFormulasOrConcepts: ['Answering factual & vocabulary questions'] },
      { id: 'c6-eng-sec-b', number: 2, title: 'Writing & Grammar', unitName: 'Section B - Writing & Grammar', unitWeightageMarks: 20, topics: ['Paragraph Writing, Notice Writing, Letter', 'Nouns, Pronouns, Verbs, Adjectives, Adverbs, Articles'], keyFormulasOrConcepts: ['Correct grammar usage'] },
      { id: 'c6-eng-ch1', number: 3, title: 'Honeysuckle: Who Did Patrick\'s Homework? & A House, A Home', unitName: 'Section C - Literature', unitWeightageMarks: 15, topics: ['Patrick doing his own homework with Elf', 'Difference between House (structure) and Home (loving family)'], keyFormulasOrConcepts: ['Self-help & Family warmth'] },
      { id: 'c6-eng-ch2', number: 4, title: 'Honeysuckle: How the Dog Found Himself a New Master! & Taro\'s Reward', unitName: 'Section C - Literature', unitWeightageMarks: 15, topics: ['Dog serving Man as strongest master', 'Taro\'s filial piety rewarded with Sake waterfall'], keyFormulasOrConcepts: ['Loyalty & Respect for parents'] },
      { id: 'c6-eng-ch3', number: 5, title: 'A Pact with the Sun: A Tale of Two Birds & Friendly Mongoose', unitName: 'Section C - Literature Supplementary', unitWeightageMarks: 10, topics: ['Company influences character (Rishi vs Robber cave)', 'Farmer\'s wife hasty action killing mongoose'], keyFormulasOrConcepts: ['Good company & Avoiding hasty anger'] }
    ]
  },
  {
    id: 'class6-hindi',
    name: 'Class 6 Hindi (हिंदी)',
    code: '086-HIN',
    category: 'Languages',
    color: '#e11d48',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300',
    icon: 'BookOpen',
    totalChapters: 5,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'c6-hin-sec-a', number: 1, title: 'खंड ‘क’ - अपठित बोध', unitName: 'खंड क - अपठित बोध', unitWeightageMarks: 15, topics: ['अपठित गद्यांश व काव्यांश'], keyFormulasOrConcepts: ['प्रश्नोत्तर बोध'] },
      { id: 'c6-hin-sec-b', number: 2, title: 'खंड ‘ख’ - व्याकरण', unitName: 'खंड ख - व्याकरण', unitWeightageMarks: 20, topics: ['संज्ञा, सर्वनाम, विशेषण, वचन, लिंग, विलोम शब्द, मुहावरे'], keyFormulasOrConcepts: ['व्याकरण नियम'] },
      { id: 'c6-hin-ch1', number: 3, title: 'बसंत: वह चिड़िया जो (केदारनाथ अग्रवाल)', unitName: 'खंड ग - बसंत', unitWeightageMarks: 15, topics: ['छोटी चिड़िया का संतोषी स्वभाव व स्वतंत्रता प्रेम'], keyFormulasOrConcepts: ['आत्मसंतोष व स्वाभिमान'] },
      { id: 'c6-hin-ch2', number: 4, title: 'बसंत: बचपन (कृष्णा सोबती) व नादान दोस्त (प्रेमचंद)', unitName: 'खंड ग - बसंत', unitWeightageMarks: 15, topics: ['लेखिका की खट्टी-मीठी संस्मरण यादें', 'केशव और श्यामा की बाल-सुलभ नादानी'], keyFormulasOrConcepts: ['बाल मनोविज्ञान'] },
      { id: 'c6-hin-sec-d', number: 5, title: 'खंड ‘घ’ - रचनात्मक लेखन', unitName: 'खंड घ - रचनात्मक लेखन', unitWeightageMarks: 15, topics: ['अनुच्छेद, पत्र व चित्र वर्णन'], keyFormulasOrConcepts: ['रचनात्मकता'] }
    ]
  }
];

// ==========================================
// CBSE CLASS 5 SUBJECTS & CHAPTER CURRICULUM
// ==========================================
export const CBSE_CLASS_5_SUBJECTS: Subject[] = [
  {
    id: 'class5-science-evs',
    name: 'Class 5 Environmental Studies (EVS / Science)',
    code: '085-EVS',
    category: 'Science',
    color: '#0284c7',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300',
    icon: 'FlaskConical',
    totalChapters: 8,
    standardMarks: 80,
    standardTime: 150,
    chapters: [
      { id: 'c5-evs-ch1', number: 1, title: 'Super Senses & Snake Charmer\'s Story', unitName: 'Animals & Nature', unitWeightageMarks: 10, topics: ['Animals\' Acute Senses (Ants, Dogs, Tiger, Birds)', 'Sleeping Time of Animals', 'Poisonous Snakes in India (Cobra, Krait, Russell\'s Viper, Saw-scaled Viper)', 'Kalbeliyas Community'], keyFormulasOrConcepts: ['4 Poisonous Snakes of India', 'Poisonous teeth (Fangs) and antivenom'] },
      { id: 'c5-evs-ch2', number: 2, title: 'From Tasting to Digesting & Seeds and Seeds', unitName: 'Food & Health', unitWeightageMarks: 10, topics: ['Tongue Taste Buds (Sweet, Salty, Sour, Bitter)', 'Stomach Digesting Experiment by Dr. Beaumont', 'Glucose Drip for Energy', 'Seed Germination & Dispersal Ways'], keyFormulasOrConcepts: ['Dr. Beaumont\'s Alexis St. Martin experiment', 'Pitcher plant (Nepenthes) eats insects'] },
      { id: 'c5-evs-ch3', number: 3, title: 'Every Drop Counts & Experiments with Water', unitName: 'Water & Environment', unitWeightageMarks: 10, topics: ['Ghadsisar Lake Jaisalmer & Johads', 'Stepwells (Bawris)', 'Floating vs Sinking Items', 'Dead Sea High Salt Density (300g salt/L)'], keyFormulasOrConcepts: ['Dead Sea extreme salt density allows floating without swimming', 'Evaporation for salt making'] },
      { id: 'c5-evs-ch4', number: 4, title: 'A Treat for Mosquitoes & Up You Go!', unitName: 'Health & Adventure', unitWeightageMarks: 10, topics: ['Malaria Symptoms & Anopheles Mosquito Transmission', 'Ronald Ross Nobel Discovery', 'Anaemia & Haemoglobin/Iron Foods', 'Mountaineering Camp Skills'], keyFormulasOrConcepts: ['Normal Haemoglobin: 12 to 16 g/dL', 'Jaggery, Amla, Green Leafy Vegetables for Iron'] },
      { id: 'c5-evs-ch5', number: 5, title: 'Walls Tell Stories & Sunita in Space', unitName: 'Heritage & Astronomy', unitWeightageMarks: 10, topics: ['Golconda Fort Architecture & Bastions', 'Cannons & Water Systems', 'Sunita Williams Space Experience', 'Earth\'s Gravity & Globe'], keyFormulasOrConcepts: ['Gravity keeps objects grounded', 'Sunita Williams stayed 6 months in space'] },
      { id: 'c5-evs-ch6', number: 6, title: 'What if it Finishes...? & Shelter for All!', unitName: 'Energy & Shelters', unitWeightageMarks: 10, topics: ['Petroleum Products (Petrol, Diesel, Kerosene, Wax, LPG)', 'Air & Noise Pollution on Roads', 'Changpa Tribe in Leh-Ladakh & Rebo Tents', 'Pashmina Shawls'], keyFormulasOrConcepts: ['Pashmina goat wool 6 times warmer than sweater', 'CNG clean fuel'] },
      { id: 'c5-evs-ch7', number: 7, title: 'When the Earth Shook! & Like Father, Like Daughter', unitName: 'Disasters & Genetics', unitWeightageMarks: 10, topics: ['2001 Bhuj Earthquake Experience', 'Disaster Relief & First Aid', 'Inherited Traits vs Habits', 'Polio & Gregor Mendel Pea Experiments'], keyFormulasOrConcepts: ['Drop, Cover, and Hold during Earthquake', 'Traits passed from parents'] },
      { id: 'c5-evs-ch8', number: 8, title: 'Whose Forests? & Farmer\'s Story', unitName: 'Ecology & Agriculture', unitWeightageMarks: 10, topics: ['Kuduk Community & Suryamani\'s Torang', 'Right to Forest Act 2007', 'Traditional Farming vs Chemical Farming', 'Earthworms as Farmer\'s Friends'], keyFormulasOrConcepts: ['Right to Forest Act 2007 gives 25+ year forest dwellers land rights', 'Composting with earthworms'] }
    ]
  },
  {
    id: 'class5-maths',
    name: 'Class 5 Mathematics',
    code: '085-MTH',
    category: 'Mathematics',
    color: '#16a34a',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: 'Calculator',
    totalChapters: 7,
    standardMarks: 80,
    standardTime: 150,
    chapters: [
      { id: 'c5-mth-ch1', number: 1, title: 'The Fish Tale & Shapes and Angles', unitName: 'Numbers & Geometry', unitWeightageMarks: 12, topics: ['Speed, Distance & Time Word Problems', 'Lakhs and Crores Place Value', 'Right Angle (L-Shape), Acute & Obtuse Angles', 'Angles in Clock Hands'], keyFormulasOrConcepts: ['Distance = Speed × Time', 'Angle degree measure using Protractor'] },
      { id: 'c5-mth-ch2', number: 2, title: 'How Many Squares? & Parts and Wholes', unitName: 'Geometry & Fractions', unitWeightageMarks: 12, topics: ['Area using 1 cm Grid Squares', 'Perimeter = Total Boundary Length', 'Fractional Parts (1/2, 1/4, 3/4)', 'Equivalent Fractions & Flag Designs'], keyFormulasOrConcepts: ['Area of rectangle = L × B', 'Numerator / Denominator'] },
      { id: 'c5-mth-ch3', number: 3, title: 'Does It Look the Same? & Multiples and Factors', unitName: 'Symmetry & Numbers', unitWeightageMarks: 12, topics: ['Mirror Symmetry & Line of Symmetry', '1/2 Turn, 1/4 Turn & 1/6 Turn Rotations', 'Multiples & Common Multiples', 'Factors & Factor Trees'], keyFormulasOrConcepts: ['Common Multiples & Smallest Common Multiple', 'HCF prime factorization'] },
      { id: 'c5-mth-ch4', number: 4, title: 'Can You See the Pattern? & Mapping Your Way', unitName: 'Patterns & Maps', unitWeightageMarks: 10, topics: ['Number Patterns & Magic Squares', 'Secret Codes & Letter Shifting', 'Reading Maps & Scale Scale 1 cm = 10 km', 'Enlarging & Reducing Shapes on Grid'], keyFormulasOrConcepts: ['Magic square row/col sum equal', 'Map scale calculation'] },
      { id: 'c5-mth-ch5', number: 5, title: 'Boxes and Sketches & Tenths and Hundredths', unitName: '3D Geometry & Decimals', unitWeightageMarks: 12, topics: ['3D Cubes, Cuboids & Net Diagrams', 'Decimal Fractions (0.1, 0.01)', 'Money Conversions (Paise to Rupees)', 'Measuring Lengths in cm and mm'], keyFormulasOrConcepts: ['1 Rupee = 100 Paise', '1 cm = 10 mm'] },
      { id: 'c5-mth-ch6', number: 6, title: 'Area and Its Boundary & Smart Charts', unitName: 'Mensuration & Data', unitWeightageMarks: 11, topics: ['Perimeter & Area Comparison', 'Tally Marks Count Tables', 'Bar Charts & Family Tree Diagrams'], keyFormulasOrConcepts: ['Area = Space covered inside', 'Perimeter = Length of border'] },
      { id: 'c5-mth-ch7', number: 7, title: 'Ways to Multiply and Divide & How Big? How Heavy?', unitName: 'Arithmetic Operations', unitWeightageMarks: 11, topics: ['Multiplication Strategies (Box Method & Standard)', 'Division Word Problems & Remainder', 'Volume using 1 cm Cubes', 'Weight Conversions (g to kg)'], keyFormulasOrConcepts: ['Dividend = (Divisor × Quotient) + Remainder', '1 kg = 1000 g'] }
    ]
  },
  {
    id: 'class5-english',
    name: 'Class 5 English',
    code: '085-ENG',
    category: 'Languages',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300',
    icon: 'BookOpen',
    totalChapters: 5,
    standardMarks: 80,
    standardTime: 150,
    chapters: [
      { id: 'c5-eng-sec-a', number: 1, title: 'Reading Comprehension', unitName: 'Section A - Reading', unitWeightageMarks: 20, topics: ['Short Story & Poem Comprehension'], keyFormulasOrConcepts: ['Direct & Inferential Answers'] },
      { id: 'c5-eng-sec-b', number: 2, title: 'Writing & Grammar', unitName: 'Section B - Writing & Grammar', unitWeightageMarks: 20, topics: ['Paragraph Writing, Informal Letter, Story Completion', 'Nouns, Verbs, Adjectives, Opposites, Punctuation'], keyFormulasOrConcepts: ['Capitalization & Full Stops'] },
      { id: 'c5-eng-ch1', number: 3, title: 'Marigold: Wonderful Waste! & Ice-Cream Man', unitName: 'Section C - Literature', unitWeightageMarks: 15, topics: ['Maharaja of Travancore Avial recipe from vegetable scraps', 'Joy of Ice-Cream man in summer'], keyFormulasOrConcepts: ['Creativity from waste & Joy of sharing'] },
      { id: 'c5-eng-ch2', number: 4, title: 'Marigold: Flying Together & Teamwork', unitName: 'Section C - Literature', unitWeightageMarks: 15, topics: ['Flock of geese escaping hunter by acting dead', 'Power of teamwork to achieve goals'], keyFormulasOrConcepts: ['Listening to elders & Cooperation'] },
      { id: 'c5-eng-ch3', number: 5, title: 'Marigold: My Shadow & Robinson Crusoe', unitName: 'Section C - Literature', unitWeightageMarks: 10, topics: ['Playful shadow behavior poem', 'Robinson Crusoe finding footprint on island'], keyFormulasOrConcepts: ['Curiosity & Observation'] }
    ]
  },
  {
    id: 'class5-hindi',
    name: 'Class 5 Hindi (हिंदी)',
    code: '085-HIN',
    category: 'Languages',
    color: '#e11d48',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300',
    icon: 'BookOpen',
    totalChapters: 5,
    standardMarks: 80,
    standardTime: 150,
    chapters: [
      { id: 'c5-hin-sec-a', number: 1, title: 'खंड ‘क’ - अपठित बोध', unitName: 'खंड क - अपठित बोध', unitWeightageMarks: 20, topics: ['अपठित गद्यांश बोध'], keyFormulasOrConcepts: ['सरल प्रश्नोत्तर'] },
      { id: 'c5-hin-sec-b', number: 2, title: 'खंड ‘ख’ - व्याकरण', unitName: 'खंड ख - व्याकरण', unitWeightageMarks: 20, topics: ['संज्ञा, सर्वनाम, विशेषण, क्रिया, लिंग, वचन, विलोम शब्द, पर्यायवाची'], keyFormulasOrConcepts: ['शुद्ध वर्तनी व प्रयोग'] },
      { id: 'c5-hin-ch1', number: 3, title: 'रिमझिम: राख की रस्सी व फसलों के त्योहार', unitName: 'खंड ग - रिमझिम', unitWeightageMarks: 15, topics: ['तिब्बत के मंत्री लोनपो गार के बेटे व बुद्धिमान लड़की की कथा', 'भारत के विभिन्न राज्यों के फसल त्यौहार (मकर संक्रांति, पोंगल, बिहू)'], keyFormulasOrConcepts: ['सूझ-बूझ व सांस्कृतिक धरोहर'] },
      { id: 'c5-hin-ch2', number: 4, title: 'रिमझिम: खिलौनेवाला (सुभद्रा कुमारी चौहान) व नन्हा फनकार', unitName: 'खंड ग - रिमझिम', unitWeightageMarks: 15, topics: ['खिलौनेवाले की कविता व राम-कथा संदर्भ', 'दस साल के शिल्पकार केशव का हुनर व बादशाह अकबर'], keyFormulasOrConcepts: ['हस्तकला व बाल प्रतिभा'] },
      { id: 'c5-hin-sec-d', number: 5, title: 'खंड ‘घ’ - रचनात्मक लेखन', unitName: 'खंड घ - रचनात्मक लेखन', unitWeightageMarks: 10, topics: ['अनुच्छेद लेखन, पत्र व चित्र वर्णन'], keyFormulasOrConcepts: ['मौलिक लेखन'] }
    ]
  }
];

// ==========================================
// CBSE CLASS 4 SUBJECTS & CHAPTER CURRICULUM
// ==========================================
export const CBSE_CLASS_4_SUBJECTS: Subject[] = [
  {
    id: 'class4-science-evs',
    name: 'Class 4 Environmental Studies (EVS / आस-पास)',
    code: '084-EVS',
    category: 'Science',
    color: '#0284c7',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300',
    icon: 'FlaskConical',
    totalChapters: 10,
    standardMarks: 80,
    standardTime: 120,
    chapters: [
      { id: 'c4-evs-ch1', number: 1, title: 'Going to School (स्कूल चलें हम)', unitName: 'Transport & Commute', unitWeightageMarks: 8, topics: ['Bamboo and Rope Bridges', 'Trolley and Cement Bridge', 'Vallam (Wooden Boat) in Kerala', 'Camel Cart in Rajasthan & Bullock Carts'], keyFormulasOrConcepts: ['Modes of transport to school in different terrains', 'Safety on bridges'] },
      { id: 'c4-evs-ch2', number: 2, title: 'Ear to Ear & A Day with Nandu (कान-कान में व नंदू हाथी)', unitName: 'Animal World', unitWeightageMarks: 8, topics: ['Animals with Visible Ears vs Hidden Ears', 'Animals with Hair on Skin (Viviparous)', 'Herd Behavior of Elephants', 'Leader of Elephant Herd (Oldest Female)'], keyFormulasOrConcepts: ['Oldest female elephant leads the herd', 'Animals with skin hair lay eggs or give birth'] },
      { id: 'c4-evs-ch3', number: 3, title: 'The Story of Amrita (अमृता की कहानी)', unitName: 'Environment & Trees', unitWeightageMarks: 8, topics: ['Bishnoi Community of Rajasthan', 'Khejadi Tree Features', 'Protecting Trees & Forest Conservation'], keyFormulasOrConcepts: ['Khejadi tree grows in desert with little water', 'Bishnois protect plants and animals'] },
      { id: 'c4-evs-ch4', number: 4, title: 'Anita and the Honeybees (अनीता की मधुमक्खियाँ)', unitName: 'Insects & Girl Star', unitWeightageMarks: 8, topics: ['Beekeeping (Apiculture) in Bihar', 'Queen Bee, Worker Bees & Male Bees', 'Litchi Flowers for Honeybees', 'Girl Star Anita Khushwaha'], keyFormulasOrConcepts: ['Honeybees lay eggs from October to December', 'Role of worker bees in hive'] },
      { id: 'c4-evs-ch5', number: 5, title: 'Omana\'s Journey & Reaching Grandmother\'s House (ओमाना का सफ़र)', unitName: 'Travel & Geography', unitWeightageMarks: 8, topics: ['Train Journey from Gujarat to Kerala', 'Railway Tickets & Timetables', 'Ferry (Ferry Boat) in Kerala', 'Kottayam & Valsad Station Snacks'], keyFormulasOrConcepts: ['Reading Railway Ticket details (PNR, Date, Seat No, Fare)', 'Ferry transport in backwaters'] },
      { id: 'c4-evs-ch6', number: 6, title: 'Changing Families & Hu Tu Tu (बदलते परिवार व खेल)', unitName: 'Society & Sports', unitWeightageMarks: 8, topics: ['Small & Joint Families', 'Kabaddi Rules & Jwala, Leela, Hira Story', 'Gender Equality in Sports', 'Carnam Malleswari Weightlifter'], keyFormulasOrConcepts: ['Karnam Malleswari won 29 international medals', 'Team spirit and rules in games'] },
      { id: 'c4-evs-ch7', number: 7, title: 'The Valley of Flowers & A River\'s Tale (फूलों की घाटी व नदियाँ)', unitName: 'Plants & Rivers', unitWeightageMarks: 8, topics: ['Valley of Flowers in Uttarakhand', 'Kannauj Perfume (Ittar) from Flowers', 'River Pollution & Water Cycle', 'Soluble vs Insoluble Water Substances'], keyFormulasOrConcepts: ['Kannauj in UP famous for Ittar making', 'Boiling water kills germs'] },
      { id: 'c4-evs-ch8', number: 8, title: 'Basva\'s Farm & From Market to Home (खेत से घर तक)', unitName: 'Agriculture', unitWeightageMarks: 8, topics: ['Onion Farming in Karnataka (Khunti, Illige)', 'Sowing, Weeding & Harvesting Steps', 'Vegetable Sellers Routine & Preservation'], keyFormulasOrConcepts: ['Khunti for digging soil', 'Illige for cutting onion leaves'] },
      { id: 'c4-evs-ch9', number: 9, title: 'Busy Bird & Abdul in the Garden (पक्षी और उनके घोंसले)', unitName: 'Birds & Roots', unitWeightageMarks: 8, topics: ['Bird Nests (Robin, Crow, Weaver bird, Tailor bird)', 'Tap Roots & Fibrous Roots', 'Banyan Tree Hanging Roots', 'Desert Oak Tree in Australia'], keyFormulasOrConcepts: ['Weaver male bird makes beautiful nests', 'Desert Oak roots go deep for groundwater'] },
      { id: 'c4-evs-ch10', number: 10, title: 'Eating Together & Home and Abroad (भोजन और संस्कृतियाँ)', unitName: 'Food & Diversity', unitWeightageMarks: 8, topics: ['Bihu Festival in Assam & Bhela Ghar', 'Mid-Day Meal Right', 'Abu Dhabi Climate, Currency (Dirham) & Date Palms'], keyFormulasOrConcepts: ['Dirham currency of Abu Dhabi', 'Mid-Day meal is right of every child'] }
    ]
  },
  {
    id: 'class4-maths',
    name: 'Class 4 Mathematics (गणित का जादू)',
    code: '084-MTH',
    category: 'Mathematics',
    color: '#16a34a',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: 'Calculator',
    totalChapters: 10,
    standardMarks: 80,
    standardTime: 120,
    chapters: [
      { id: 'c4-mth-ch1', number: 1, title: 'Building with Bricks (ईंटों से बनी इमारत)', unitName: 'Geometry & Numbers', unitWeightageMarks: 8, topics: ['Brick Patterns & Arch Designs', '3D Shape of a Brick (6 Rectangular Faces)', 'Cost Calculations for 1000 Bricks'], keyFormulasOrConcepts: ['1 Cuboid brick has 6 faces, 12 edges, 8 vertices', 'Cost of 1000 bricks calculation'] },
      { id: 'c4-mth-ch2', number: 2, title: 'Long and Short (लंबा और छोटा)', unitName: 'Measurement', unitWeightageMarks: 8, topics: ['Measuring Length in cm, m, km', 'Inter-conversion: 1 m = 100 cm, 1 km = 1000 m', 'Marathon Race Distances (40 km)', 'Height Comparisons'], keyFormulasOrConcepts: ['1 km = 1000 m', '1 m = 100 cm'] },
      { id: 'c4-mth-ch3', number: 3, title: 'A Trip to Bhopal (भोपाल की सैर)', unitName: 'Arithmetic & Travel', unitWeightageMarks: 8, topics: ['Bus Seating & Number of Buses', 'Fuel Cost & Refueling Time', 'Bhimbetka Cave Paintings & Boat Rides', 'Puzzle Word Problems'], keyFormulasOrConcepts: ['Total capacity = Buses × Seats', 'Speed-Time-Distance word problems'] },
      { id: 'c4-mth-ch4', number: 4, title: 'Tick-Tick-Tick (टिक-टिक-टिक - Time & Dates)', unitName: 'Time & Calendar', unitWeightageMarks: 8, topics: ['12-Hour vs 24-Hour Clock Time', 'Reading Analog Clock Hands', 'Calculating Elapsed Time & Duration', 'Manufacturing & Expiry Date Formats'], keyFormulasOrConcepts: ['1 Hour = 60 Minutes', 'Expiry date verification on food items'] },
      { id: 'c4-mth-ch5', number: 5, title: 'The Way The World Looks (दुनिया की झलक)', unitName: 'Spatial Understanding', unitWeightageMarks: 8, topics: ['Top View, Side View & Front View of Objects', 'Die/Cube Opposite Faces Sum = 7', 'Grid Maps & Floor Plans'], keyFormulasOrConcepts: ['Sum of opposite faces on a standard die is 7', 'Perspective views'] },
      { id: 'c4-mth-ch6', number: 6, title: 'The Junk Seller (कबाड़ीवाली - Money & Profit)', unitName: 'Money & Operations', unitWeightageMarks: 8, topics: ['Unit Rate Calculations', 'Rate Lists for Paper, Iron, Brass, Plastic', 'Profit & Loss Concept', 'Loan & Bank Interest Word Problems'], keyFormulasOrConcepts: ['Total Cost = Quantity × Rate per kg', 'Profit = Selling Price - Cost Price'] },
      { id: 'c4-mth-ch7', number: 7, title: 'Jugs and Mugs (जग और मग - Capacity)', unitName: 'Measurement', unitWeightageMarks: 8, topics: ['Capacity Measurement in mL and L', '1 Litre = 1000 Millilitres', 'Adding & Subtracting Capacities', 'Daily Water Usage Estimation'], keyFormulasOrConcepts: ['1 L = 1000 mL', 'Measuring cylinder readings'] },
      { id: 'c4-mth-ch8', number: 8, title: 'Carts and Wheels & Halves and Quarters (पहिए व भिन्न)', unitName: 'Geometry & Fractions', unitWeightageMarks: 8, topics: ['Center, Radius & Diameter of Circle', 'Drawing Circles using Compass', 'Fractions: 1/2 (Half), 1/4 (Quarter), 3/4 (Three-Fourths)', 'Shading Shapes according to Fractions'], keyFormulasOrConcepts: ['Diameter = 2 × Radius', '1 Half = 2 Quarters'] },
      { id: 'c4-mth-ch9', number: 9, title: 'Play with Patterns & Tables and Shares (पैटर्न व भाग)', unitName: 'Patterns & Division', unitWeightageMarks: 8, topics: ['Repeating & Rotating Patterns (1/2, 1/4 turns)', 'Odd and Even Number Patterns', 'Multiplication Tables & Repeated Subtraction', 'Grouping and Equal Distribution (Division)'], keyFormulasOrConcepts: ['Division as equal sharing', 'Odd number + Odd number = Even number'] },
      { id: 'c4-mth-ch10', number: 10, title: 'How Heavy? How Light? & Fields and Fences (वज़न व परिमाप)', unitName: 'Weight & Perimeter', unitWeightageMarks: 8, topics: ['Balancing Weights (g and kg)', '1 kg = 1000 g', 'Perimeter = Total Boundary Length of Field', 'Counting Square Units for Area'], keyFormulasOrConcepts: ['Perimeter = Sum of all outer sides', '1 kg = 1000 g'] }
    ]
  },
  {
    id: 'class4-english',
    name: 'Class 4 English (Santoor / Marigold)',
    code: '084-ENG',
    category: 'Languages',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300',
    icon: 'BookOpen',
    totalChapters: 5,
    standardMarks: 80,
    standardTime: 120,
    chapters: [
      { id: 'c4-eng-sec-a', number: 1, title: 'Section A - Reading Comprehension', unitName: 'Section A - Reading', unitWeightageMarks: 20, topics: ['Unseen Prose Passage Comprehension', 'Unseen Poem Stanza Comprehension'], keyFormulasOrConcepts: ['Answering Direct & Vocabulary Questions'] },
      { id: 'c4-eng-sec-b', number: 2, title: 'Section B - Writing & Grammar', unitName: 'Section B - Writing & Grammar', unitWeightageMarks: 20, topics: ['Paragraph Writing & Picture Description', 'Nouns (Common, Proper, Collective), Pronouns, Verbs, Adjectives, Prepositions (in, on, under, behind)', 'Antonyms, Synonyms & Punctuation'], keyFormulasOrConcepts: ['Correct Sentence Structure & Punctuation'] },
      { id: 'c4-eng-ch1', number: 3, title: 'Marigold Unit 1: Wake Up! & Neha\'s Alarm Clock', unitName: 'Section C - Literature', unitWeightageMarks: 15, topics: ['Morning nature enthusiasm poem', 'Neha wishing clock, birds, and sun would let her sleep', 'Internal clock of body'], keyFormulasOrConcepts: ['Punctuality & Morning routines'] },
      { id: 'c4-eng-ch2', number: 4, title: 'Marigold Unit 2: Noses & The Little Fir Tree', unitName: 'Section C - Literature', unitWeightageMarks: 15, topics: ['Funny nose poem & self-acceptance', 'Fir tree 3 magician wishes (Gold leaves, Glass leaves, Green leaves)', 'Accepting oneself as nature created'], keyFormulasOrConcepts: ['Gratitude & Self-acceptance'] },
      { id: 'c4-eng-ch3', number: 5, title: 'Marigold Unit 3 & 4: Run! & Nasruddin\'s Aim', unitName: 'Section C - Literature', unitWeightageMarks: 10, topics: ['Joy of running in fresh air poem', 'Nasruddin boasting about archery skill & luck vs practice'], keyFormulasOrConcepts: ['Physical fitness & Humorous moral'] }
    ]
  },
  {
    id: 'class4-hindi',
    name: 'Class 4 Hindi (रिमझिम)',
    code: '084-HIN',
    category: 'Languages',
    color: '#e11d48',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300',
    icon: 'BookOpen',
    totalChapters: 5,
    standardMarks: 80,
    standardTime: 120,
    chapters: [
      { id: 'c4-hin-sec-a', number: 1, title: 'खंड ‘क’ - अपठित बोध', unitName: 'खंड क - अपठित बोध', unitWeightageMarks: 20, topics: ['अपठित गद्यांश बोध एवं सरल उत्तर'], keyFormulasOrConcepts: ['प्रश्नोत्तर एवं शब्दार्थ'] },
      { id: 'c4-hin-sec-b', number: 2, title: 'खंड ‘ख’ - व्याकरण', unitName: 'खंड ख - व्याकरण', unitWeightageMarks: 20, topics: ['संज्ञा, सर्वनाम, विशेषण, क्रिया', 'लिंग, वचन, विलोम शब्द, पर्यायवाची शब्द, अशुद्धि शोधन'], keyFormulasOrConcepts: ['शुद्ध वाक्य रचना एवं प्रयोग'] },
      { id: 'c4-hin-ch1', number: 3, title: 'रिमझिम: मन के भोले-भाले बादल व जैसा सवाल वैसा जवाब', unitName: 'खंड ग - रिमझिम', unitWeightageMarks: 15, topics: ['बादलों की विभिन्न आकृतियों की सुंदर कविता', 'अकबर-बीरबल की कथा व ख्वाजा सरा के तीन प्रश्न'], keyFormulasOrConcepts: ['हास्य-विनोद एवं बीरबल की चतुराई'] },
      { id: 'c4-hin-ch2', number: 4, title: 'रिमझिम: किरमिच की गेंद व पापा जब बच्चे थे', unitName: 'खंड ग - रिमझिम', unitWeightageMarks: 15, topics: ['दिनेश की ईमानदारी व किरमिच की लाल गेंद की खोज', 'पापा के विभिन्न व्यवसायों (चौकीदार, आइसक्रीम वाला, कुत्ता, इंसान) के सपने'], keyFormulasOrConcepts: ['ईमानदारी एवं सच्चा इंसान बनने की प्रेरणा'] },
      { id: 'c4-hin-sec-d', number: 5, title: 'खंड ‘घ’ - रचनात्मक लेखन', unitName: 'खंड घ - रचनात्मक लेखन', unitWeightageMarks: 10, topics: ['चित्र वर्णन, अनुच्छेद लेखन (मेरी पसंदीदा पुस्तक / मेरा विद्यालय)'], keyFormulasOrConcepts: ['मौलिक अभिव्यक्ति'] }
    ]
  }
];

// ==========================================
// CBSE CLASS 3 SUBJECTS & CHAPTER CURRICULUM
// ==========================================
export const CBSE_CLASS_3_SUBJECTS: Subject[] = [
  {
    id: 'class3-science-evs',
    name: 'Class 3 Environmental Studies (EVS / आस-पास / Our Environment)',
    code: '083-EVS',
    category: 'Science',
    color: '#0284c7',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300',
    icon: 'FlaskConical',
    totalChapters: 10,
    standardMarks: 80,
    standardTime: 120,
    chapters: [
      { id: 'c3-evs-ch1', number: 1, title: 'Poonam\'s Day Out (पूरम का दिन) & The Plant Fairy (पौधों की परी)', unitName: 'Nature & Animals', unitWeightageMarks: 8, topics: ['Animals around us (land, water, air)', 'Animal sounds & movements', 'Types of leaves & trees', 'Leaf rubbings & patterns'], keyFormulasOrConcepts: ['Classifying animals by movement and habitat', 'Leaf variety in shape and color'] },
      { id: 'c3-evs-ch2', number: 2, title: 'Water O\' Water! (पानी रे पानी)', unitName: 'Water & Uses', unitWeightageMarks: 8, topics: ['Sources of water (Pond, River, Well, Tap)', 'Uses of water in daily life', 'Water states & storage', 'Saving water'], keyFormulasOrConcepts: ['Water is essential for life', 'Rain is primary natural source of water'] },
      { id: 'c3-evs-ch3', number: 3, title: 'Our First School & Chhotu\'s House (हमारा पहला स्कूल व घर)', unitName: 'Family & Shelter', unitWeightageMarks: 8, topics: ['Family relationships & learning from elders', 'Types of houses (Kutcha, Pucca, Igloo, Tent)', 'Keeping house clean', 'Uninvited animal guests in home'], keyFormulasOrConcepts: ['Family is our first school', 'Cleanliness and hygiene at home'] },
      { id: 'c3-evs-ch4', number: 4, title: 'Foods We Eat (खाया - पीया)', unitName: 'Food & Health', unitWeightageMarks: 8, topics: ['Food from plants vs animals', 'Regional food diversity (Rice, Wheat, Tapioca, Maize)', 'Food for different age groups (Baby, Youth, Old)'], keyFormulasOrConcepts: ['Balanced eating habits', 'Different foods in different regions'] },
      { id: 'c3-evs-ch5', number: 5, title: 'Saying Without Speaking (बिन बोले बात) & Sense Organs', unitName: 'Body & Communication', unitWeightageMarks: 8, topics: ['Sign language and facial expressions', 'Five sense organs (Eyes, Ears, Nose, Tongue, Skin)', 'Empathy towards specially-abled people'], keyFormulasOrConcepts: ['Expressing feelings through facial gestures', 'Role of 5 sense organs'] },
      { id: 'c3-evs-ch6', number: 6, title: 'Flying High & It\'s Raining (पंख फैलाएँ व बादल आए)', unitName: 'Birds & Seasons', unitWeightageMarks: 8, topics: ['Bird beaks, claws, and feathers', 'Peacock, Crow, Eagle, Woodpecker habits', 'Rain, Clouds, Rainbow and Monsoon season'], keyFormulasOrConcepts: ['Feathers keep birds warm and help in flight', 'Rainbow colors (VIBGYOR)'] },
      { id: 'c3-evs-ch7', number: 7, title: 'What is Cooking? & From Here to There (पकाने की बातें व यातायात)', unitName: 'Cooking & Travel', unitWeightageMarks: 8, topics: ['Raw vs Cooked food', 'Methods of cooking (Boiling, Roasting, Frying, Baking)', 'Fuels (LPG, Kerosene, Solar, Wood)', 'Land, Water and Air Transport'], keyFormulasOrConcepts: ['Healthy cooking methods', 'Vehicle fuels and safety on road'] },
      { id: 'c3-evs-ch8', number: 8, title: 'Work We Do & Making Pots (काम हमारे व बर्तन बनाना)', unitName: 'Occupations & Crafts', unitWeightageMarks: 8, topics: ['Community helpers (Doctor, Teacher, Postman, Potter, Cobbler)', 'Pottery making from clay', 'Drying and firing pots'], keyFormulasOrConcepts: ['Respect for all occupations', 'Clay pot making process'] },
      { id: 'c3-evs-ch9', number: 9, title: 'Left Right (दायाँ-बायाँ) & Map Symbols', unitName: 'Directions & Maps', unitWeightageMarks: 8, topics: ['Left and Right directions', 'Reading simple house/school layout maps', 'Understanding map symbols and legends'], keyFormulasOrConcepts: ['Four cardinal directions (North, South, East, West)', 'Symbols represent landmarks on maps'] },
      { id: 'c3-evs-ch10', number: 10, title: 'Families Can Be Different & Games We Play (परिवार व खेल)', unitName: 'Society & Recreation', unitWeightageMarks: 8, topics: ['Joint and Nuclear family structures', 'Indoor vs Outdoor games (Hopscotch/Sthapoo, Ludo, Cricket)', 'Rules of games and team spirit'], keyFormulasOrConcepts: ['Diversity in family structures', 'Importance of physical games for health'] }
    ]
  },
  {
    id: 'class3-maths',
    name: 'Class 3 Mathematics (गणित का जादू)',
    code: '083-MTH',
    category: 'Mathematics',
    color: '#16a34a',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: 'Calculator',
    totalChapters: 10,
    standardMarks: 80,
    standardTime: 120,
    chapters: [
      { id: 'c3-mth-ch1', number: 1, title: 'Where to Look From? (कहाँ से देखें?)', unitName: 'Shapes & Spatial View', unitWeightageMarks: 8, topics: ['Top view, side view, front view of objects', 'Symmetry & Mirror halves', 'Dotted grid patterns & drawings'], keyFormulasOrConcepts: ['Symmetrical line divides shape into 2 identical halves', 'Perspective drawing'] },
      { id: 'c3-mth-ch2', number: 2, title: 'Fun with Numbers (संख्याओं का खेल)', unitName: 'Numbers & Place Value', unitWeightageMarks: 8, topics: ['3-Digit numbers (100 to 999)', 'Counting in 10s and 50s', 'Expanded form & Place value of hundreds, tens, units', 'Cricket scores & century calculations'], keyFormulasOrConcepts: ['1 Century = 100 runs', 'Expanded Form: 345 = 300 + 40 + 5'] },
      { id: 'c3-mth-ch3', number: 3, title: 'Give and Take (दिए और लिए)', unitName: 'Addition & Subtraction', unitWeightageMarks: 8, topics: ['Addition of 2 and 3 digit numbers with/without regrouping', 'Mental Math jumping on 100-chart', 'Shortcuts for adding 10s and 20s'], keyFormulasOrConcepts: ['Sum = Number 1 + Number 2', 'Jumping forward on 100-chart adds 10'] },
      { id: 'c3-mth-ch4', number: 4, title: 'Long and Short (लंबा और छोटा)', unitName: 'Measurement', unitWeightageMarks: 8, topics: ['Measuring length using ruler in cm', 'Estimating lengths in meters and centimeters', '1 Meter = 100 Centimeters', 'Comparing heights and lengths'], keyFormulasOrConcepts: ['1 m = 100 cm', 'Centimeter is smaller than Meter'] },
      { id: 'c3-mth-ch5', number: 5, title: 'Shapes and Designs (आकृतियाँ और डिजाइन)', unitName: 'Geometry', unitWeightageMarks: 8, topics: ['Edges and Corners of 2D shapes (Triangle, Square, Rectangle, Circle)', 'Straight vs Curved edges', 'Tangram 5-piece and 7-piece puzzles', 'Tessellation tiling patterns'], keyFormulasOrConcepts: ['Circles have 1 curved edge and 0 corners', 'Squares have 4 equal sides & 4 corners'] },
      { id: 'c3-mth-ch6', number: 6, title: 'Fun with Give and Take & Time Goes On (लेन-देन का खेल व समय)', unitName: 'Arithmetic & Time', unitWeightageMarks: 8, topics: ['Subtraction story word problems', 'Checking subtraction with addition', 'Reading hours on analog clock', 'Days of week, Months of year, Calendar dates'], keyFormulasOrConcepts: ['Difference = Bigger Number - Smaller Number', '1 Year = 12 Months = 365 Days'] },
      { id: 'c3-mth-ch7', number: 7, title: 'Who is Heavier? (कौन भारी?)', unitName: 'Weight', unitWeightageMarks: 8, topics: ['Comparing weights using balance scale', 'Gram (g) and Kilogram (kg)', '1 Kilogram = 1000 Grams', 'Estimating light vs heavy objects'], keyFormulasOrConcepts: ['1 kg = 1000 g', 'Heavy objects require Kilograms for measurement'] },
      { id: 'c3-mth-ch8', number: 8, title: 'How Many Times? (कितने गुना?)', unitName: 'Multiplication', unitWeightageMarks: 8, topics: ['Multiplication as repeated addition', 'Multiplication tables from 1 to 10', 'Legs of animals multiplication tricks', 'Grid method of multiplication'], keyFormulasOrConcepts: ['Product = Number × Frequency', 'Example: 4 times 5 = 5 + 5 + 5 + 5 = 20'] },
      { id: 'c3-mth-ch9', number: 9, title: 'Play with Patterns & Jugs and Mugs (पैटर्न व जग-मग)', unitName: 'Patterns & Capacity', unitWeightageMarks: 8, topics: ['Sequence & Number patterns (+2, +5, +10)', 'Capacity measurement in Litres (L) and Millilitres (mL)', 'Pouring and measuring liquid volumes'], keyFormulasOrConcepts: ['1 Litre = 1000 Millilitres', 'Pattern rules'] },
      { id: 'c3-mth-ch10', number: 10, title: 'Can We Share? & Rupees and Paise (बराबर बाँटना व रुपये-पैसे)', unitName: 'Division & Money', unitWeightageMarks: 8, topics: ['Equal grouping and sharing (Division concept)', 'Coins (₹1, ₹2, ₹5, ₹10, ₹20) and Currency Notes', 'Adding prices and making bills', '1 Rupee = 100 Paise'], keyFormulasOrConcepts: ['Division is equal sharing', '₹1 = 100 Paise'] }
    ]
  },
  {
    id: 'class3-english',
    name: 'Class 3 English (Santoor / Marigold)',
    code: '083-ENG',
    category: 'Languages',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300',
    icon: 'BookOpen',
    totalChapters: 5,
    standardMarks: 80,
    standardTime: 120,
    chapters: [
      { id: 'c3-eng-sec-a', number: 1, title: 'Section A - Reading Comprehension', unitName: 'Section A - Reading', unitWeightageMarks: 20, topics: ['Unseen Prose Passage Comprehension', 'Unseen Short Poem Stanza Comprehension'], keyFormulasOrConcepts: ['Answering Simple Direct & Vocabulary Questions'] },
      { id: 'c3-eng-sec-b', number: 2, title: 'Section B - Writing & Grammar', unitName: 'Section B - Writing & Grammar', unitWeightageMarks: 20, topics: ['Short Paragraph Writing & Guided Picture Description', 'Nouns (Naming words), Pronouns (He, She, It, They), Verbs (Doing words), Articles (A, An, The)', 'Opposite words, Plurals (-s/-es), Capitalization & Full Stop'], keyFormulasOrConcepts: ['Simple Sentence Formation & Correct Punctuation'] },
      { id: 'c3-eng-ch1', number: 3, title: 'Marigold Unit 1: Good Morning & The Magic Garden', unitName: 'Section C - Literature', unitWeightageMarks: 15, topics: ['Greeting nature morning poem', 'School garden with talking flowers and fairies', 'Love for nature and birds'], keyFormulasOrConcepts: ['Appreciating flora & fauna'] },
      { id: 'c3-eng-ch2', number: 4, title: 'Marigold Unit 2: Bird Talk & Nina and the Baby Sparrows', unitName: 'Section C - Literature', unitWeightageMarks: 15, topics: ['Robin and Jay bird conversation poem', 'Nina caring for baby sparrows in her room before wedding trip'], keyFormulasOrConcepts: ['Compassion towards birds and small creatures'] },
      { id: 'c3-eng-ch3', number: 5, title: 'Marigold Unit 3 & 4: Little by Little & The Enormous Turnip', unitName: 'Section C - Literature', unitWeightageMarks: 10, topics: ['Acorn growing into giant oak tree poem', 'Old man pulling giant turnip with help of boy, girl, and dog'], keyFormulasOrConcepts: ['Patience, perseverance & strength of teamwork'] }
    ]
  },
  {
    id: 'class3-hindi',
    name: 'Class 3 Hindi (वीणा / रिमझिम)',
    code: '083-HIN',
    category: 'Languages',
    color: '#e11d48',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300',
    icon: 'BookOpen',
    totalChapters: 5,
    standardMarks: 80,
    standardTime: 120,
    chapters: [
      { id: 'c3-hin-sec-a', number: 1, title: 'खंड ‘क’ - अपठित बोध', unitName: 'खंड क - अपठित बोध', unitWeightageMarks: 20, topics: ['अपठित गद्यांश बोध एवं सरल उत्तर लेखन'], keyFormulasOrConcepts: ['सरल प्रश्नोत्तर व शब्दार्थ'] },
      { id: 'c3-hin-sec-b', number: 2, title: 'खंड ‘ख’ - व्याकरण', unitName: 'खंड ख - व्याकरण', unitWeightageMarks: 20, topics: ['संज्ञा (नाम वाले शब्द), सर्वनाम, विशेषण, क्रिया', 'लिंग (पुरुष/स्त्री), वचन (एक/अनेक), विलोम शब्द, पर्यायवाची, वर्तनी सुधार'], keyFormulasOrConcepts: ['शुद्ध वाक्य रचना एवं विराम चिह्न'] },
      { id: 'c3-hin-ch1', number: 3, title: 'रिमझिम: कक्कू (कविता) व शेखीबाज़ मक्खी', unitName: 'खंड ग - रिमझिम', unitWeightageMarks: 15, topics: ['बात-बात में चिढ़ने वाले लड़के कक्कू की मजेदार कविता', 'शेर को तंग करने वाली घमंडी मक्खी व लोमड़ी की बुद्धिमत्ता'], keyFormulasOrConcepts: ['घमंड का परिणाम व विनोदपूर्ण सीख'] },
      { id: 'c3-hin-ch2', number: 4, title: 'रिमझिम: चाँद वाली अम्मा व मन करता है', unitName: 'खंड ग - रिमझिम', unitWeightageMarks: 15, topics: ['झाड़ू लेकर चाँद पर बैठी अम्मा की कल्पना लोक कथा', 'सूरज, चंदा, तितली, पतंग बनने की बालमन की कल्पनाएँ'], keyFormulasOrConcepts: ['कल्पनाशीलता एवं लोक कथा'] },
      { id: 'c3-hin-sec-d', number: 5, title: 'खंड ‘घ’ - रचनात्मक लेखन', unitName: 'खंड घ - रचनात्मक लेखन', unitWeightageMarks: 10, topics: ['चित्र देखकर 4-5 वाक्य लिखना, सरल अनुच्छेद (मेरा प्रिय खिलौना / मेरा पालतू पशु)'], keyFormulasOrConcepts: ['मौलिक अभिव्यक्ति व सुंदर लेखन'] }
    ]
  }
];

// Helper array combining Classes 3, 4, 5, 6, 7, and 8
export const CBSE_MIDDLE_SCHOOL_SUBJECTS: Subject[] = [
  ...CBSE_CLASS_8_SUBJECTS,
  ...CBSE_CLASS_7_SUBJECTS,
  ...CBSE_CLASS_6_SUBJECTS,
  ...CBSE_CLASS_5_SUBJECTS,
  ...CBSE_CLASS_4_SUBJECTS,
  ...CBSE_CLASS_3_SUBJECTS
];
