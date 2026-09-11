import { PYQPaper, GeneratedPaper, Question, PaperSection, CustomBranding } from '../types';
import { PRELOADED_QUESTIONS } from '../data/cbseData';
import { getMasterPool } from '../data/masterQuestionPool';
import { getStoredVault, isSubjectAndClassMatch, hashQuestionText } from './questionVault';
import {
  MATH_MCQ_BANK,
  SCIENCE_MCQ_BANK,
  SOCIAL_MCQ_BANK,
  ENGLISH_MCQ_BANK,
  HINDI_A_MCQ_BANK,
  HINDI_B_MCQ_BANK
} from '../data/textbookQuestions';
import {
  CLASS12_PHYSICS_POOL,
  CLASS12_CHEMISTRY_POOL,
  CLASS12_MATHS_POOL,
  CLASS12_BIOLOGY_POOL,
  CLASS12_CS_POOL,
  CLASS12_ENGLISH_POOL
} from '../data/class12MasterPool';
import {
  CLASS9_SCIENCE_POOL,
  CLASS9_MATHS_POOL,
  CLASS9_SST_POOL,
  CLASS9_ENGLISH_POOL,
  CLASS9_HINDI_POOL,
  CLASS9_IT_POOL
} from '../data/class9MasterPool';

// Helper to extract official subject code
export function getSubjectCode(subjectId: string, subjectName: string): string {
  const s = (subjectId + ' ' + subjectName).toLowerCase();
  if (s.includes('science') || s.includes('086')) return '086';
  if (s.includes('math') || s.includes('041')) return '041';
  if (s.includes('social') || s.includes('sst') || s.includes('087')) return '087';
  if (s.includes('english') && s.includes('301')) return '301';
  if (s.includes('english') || s.includes('184')) return '184';
  if (s.includes('hindi') && (s.includes('002') || s.includes('course a'))) return '002';
  if (s.includes('hindi') && (s.includes('085') || s.includes('course b'))) return '085';
  if (s.includes('it') || s.includes('402')) return '402';
  if (s.includes('physics') || s.includes('042')) return '042';
  if (s.includes('chemistry') || s.includes('043')) return '043';
  if (s.includes('biology') || s.includes('044')) return '044';
  if (s.includes('computer') || s.includes('083')) return '083';
  return '041';
}

// Fallback dynamic question generation by subject and type
function generateFallbackQuestion(
  subjectId: string,
  type: 'mcq' | 'ar' | 'vsa' | 'sa' | 'la' | 'case',
  index: number,
  year: number
): Question {
  const s = subjectId.toLowerCase();
  const qId = `pyq-${subjectId}-${year}-${type}-${index}`;

  if (s.includes('math')) {
    if (type === 'mcq') {
      const mcqList = [
        { q: `If α and β are the roots of equation x² - 7x + 12 = 0, then the value of (α² + β²) is:`, opts: ["A) 25", "B) 49", "C) 37", "D) 13"], ans: "A) 25", ch: "Polynomials" },
        { q: `The HCF of 96 and 404 is 4, then their LCM is equal to:`, opts: ["A) 9696", "B) 3888", "C) 4848", "D) 9600"], ans: "A) 9696", ch: "Real Numbers" },
        { q: `If tan θ = 4/3, then value of (sin θ + cos θ) / (sin θ - cos θ) is:`, opts: ["A) 7", "B) 1/7", "C) 7/3", "D) 3/7"], ans: "A) 7", ch: "Introduction to Trigonometry" },
        { q: `The distance between points A(2, 3) and B(10, -3) is:`, opts: ["A) 10 units", "B) 8 units", "C) 12 units", "D) 6 units"], ans: "A) 10 units", ch: "Coordinate Geometry" },
        { q: `The 15th term of the AP: 3, 8, 13, 18... is:`, opts: ["A) 73", "B) 78", "C) 68", "D) 83"], ans: "A) 73", ch: "Arithmetic Progressions" },
        { q: `If two tangents PA and PB from a point P to a circle with centre O are inclined to each other at angle of 80°, then ∠POA is equal to:`, opts: ["A) 50°", "B) 60°", "C) 70°", "D) 80°"], ans: "A) 50°", ch: "Circles" },
        { q: `A box contains 5 red balls, 8 white balls and 4 green balls. One ball is taken out at random. The probability that the ball is NOT green is:`, opts: ["A) 13/17", "B) 4/17", "C) 8/17", "D) 5/17"], ans: "A) 13/17", ch: "Probability" },
        { q: `If the radius of sphere is doubled, then its volume becomes:`, opts: ["A) 8 times", "B) 4 times", "C) 2 times", "D) 16 times"], ans: "A) 8 times", ch: "Surface Areas and Volumes" }
      ];
      const selected = mcqList[index % mcqList.length];
      return {
        id: qId,
        subjectId,
        chapterId: 'math-ch',
        chapterName: selected.ch,
        type: 'mcq',
        marks: 1,
        difficulty: 'medium',
        isCompetency: true,
        questionText: selected.q,
        options: selected.opts,
        correctAnswer: selected.ans,
        markingScheme: `1 Mark for correct option ${selected.ans}`,
        explanation: `Calculated using standard formulas of ${selected.ch}.`,
        pyqYear: year
      };
    } else if (type === 'ar') {
      return {
        id: qId,
        subjectId,
        chapterId: 'math-ar',
        chapterName: 'Real Numbers & Polynomials',
        type: 'ar',
        marks: 1,
        difficulty: 'medium',
        isCompetency: true,
        questionText: `Assertion (A): The product of two consecutive positive integers is always divisible by 2.\nReason (R): Of any two consecutive positive integers, one is always even and the other is odd.`,
        options: [
          "A) Both A and R are true and R is the correct explanation of A",
          "B) Both A and R are true but R is NOT the correct explanation of A",
          "C) A is true but R is false",
          "D) A is false but R is true"
        ],
        correctAnswer: "A) Both A and R are true and R is the correct explanation of A",
        markingScheme: "1 Mark - Correct option selection.",
        pyqYear: year
      };
    } else if (type === 'vsa') {
      return {
        id: qId,
        subjectId,
        chapterId: 'math-vsa',
        chapterName: 'Algebra & Geometry',
        type: 'vsa',
        marks: 2,
        difficulty: 'easy',
        isCompetency: false,
        questionText: `Solve the system of equations for x and y: 2x + 3y = 11 and 2x - 4y = -24.`,
        correctAnswer: `Subtracting equations: 7y = 35 ⇒ y = 5.\nSubstituting y = 5 in first eq: 2x + 15 = 11 ⇒ 2x = -4 ⇒ x = -2.\nSolution: x = -2, y = 5.`,
        markingScheme: `• Correct elimination/substitution step [1 Mark]\n• Final values of x and y [1 Mark]`,
        pyqYear: year
      };
    } else if (type === 'sa') {
      return {
        id: qId,
        subjectId,
        chapterId: 'math-sa',
        chapterName: 'Trigonometry & Coordinate Geometry',
        type: 'sa',
        marks: 3,
        difficulty: 'medium',
        isCompetency: true,
        questionText: `Prove the trigonometric identity: (sin θ - 2 sin³ θ) / (2 cos³ θ - cos θ) = tan θ.`,
        correctAnswer: `LHS = [sin θ (1 - 2 sin² θ)] / [cos θ (2 cos² θ - 1)]\nSince 1 - 2 sin² θ = cos 2θ and 2 cos² θ - 1 = cos 2θ,\nLHS = (sin θ · cos 2θ) / (cos θ · cos 2θ) = sin θ / cos θ = tan θ = RHS. (Proved)`,
        markingScheme: `• Taking common factors sin θ and cos θ [1 Mark]\n• Using cos 2θ identity or converting sin²θ to 1-cos²θ [1 Mark]\n• Simplification to tan θ [1 Mark]`,
        pyqYear: year
      };
    } else if (type === 'la') {
      return {
        id: qId,
        subjectId,
        chapterId: 'math-la',
        chapterName: 'Applications of Trigonometry & Mensuration',
        type: 'la',
        marks: 5,
        difficulty: 'hard',
        isCompetency: true,
        questionText: `A straight highway leads to the foot of a tower. A man standing at the top of the tower observes a car at an angle of depression of 30°, which is approaching the foot of the tower with a uniform speed. Six seconds later, the angle of depression of the car is found to be 60°. Find the time taken by the car to reach the foot of the tower from this point.`,
        correctAnswer: `Let tower height be h. Let D be initial point (30° depression) and C be second point (60° depression).\nIn △ABC: tan 60° = h / BC ⇒ BC = h / √3.\nIn △ABD: tan 30° = h / BD ⇒ BD = h √3.\nDistance CD = BD - BC = h √3 - h / √3 = (2h) / √3.\nTime to cover CD = 6 s ⇒ Speed v = CD / 6 = (2h) / (6 √3) = h / (3 √3).\nTime to cover BC = BC / v = (h / √3) / (h / (3 √3)) = 3 seconds.`,
        markingScheme: `• Diagram and trigonometric relations [2 Marks]\n• Expression for speed v [1.5 Marks]\n• Time calculation for remaining distance [1.5 Marks]`,
        pyqYear: year
      };
    } else {
      return {
        id: qId,
        subjectId,
        chapterId: 'math-case',
        chapterName: 'Case Study - Arithmetic Progressions & Applications',
        type: 'case',
        marks: 4,
        difficulty: 'medium',
        isCompetency: true,
        casePassage: `India is competitive manufacturing location due to low cost of manpower and strong technical capabilities. A laptop manufacturing factory produced 600 laptops in the 3rd year and 700 laptops in the 7th year. Assuming that the production increases uniformly by a fixed number every year, answer the following questions:`,
        questionText: `Q1. Find the initial production in the 1st year (a). (1 Mark)\nQ2. Find the fixed annual increase in production (d). (1 Mark)\nQ3. Find the total production of laptops in the first 10 years (S10). (2 Marks)`,
        correctAnswer: `Given a₃ = a + 2d = 600 and a₇ = a + 6d = 700.\nSubtracting: 4d = 100 ⇒ d = 25.\na = 600 - 2(25) = 550.\nQ1. 1st year production = 550 laptops.\nQ2. Annual increase d = 25 laptops.\nQ3. S₁₀ = (10/2) [2(550) + 9(25)] = 5 [1100 + 225] = 5 × 1325 = 6625 laptops.`,
        markingScheme: `• Value of a = 550 [1 Mark]\n• Value of d = 25 [1 Mark]\n• Calculation of S₁₀ = 6625 [2 Marks]`,
        pyqYear: year
      };
    }
  }

  if (s.includes('science') || s.includes('physics') || s.includes('chemistry') || s.includes('biology')) {
    if (type === 'mcq') {
      const sciMcqs = [
        { q: `Which gas is liberated when dilute hydrochloric acid reacts with active metals like zinc?`, opts: ["A) Hydrogen gas", "B) Oxygen gas", "C) Carbon dioxide", "D) Chlorine gas"], ans: "A) Hydrogen gas", ch: "Acids, Bases and Salts" },
        { q: `The functional group present in propanone is:`, opts: ["A) Ketone (>C=O)", "B) Aldehyde (-CHO)", "C) Alcohol (-OH)", "D) Carboxylic acid (-COOH)"], ans: "A) Ketone (>C=O)", ch: "Carbon and its Compounds" },
        { q: `In human male reproductive system, which gland secretes fluid that nourishes and activates sperm?`, opts: ["A) Prostate gland and seminal vesicles", "B) Thyroid gland", "C) Pituitary gland", "D) Adrenal gland"], ans: "A) Prostate gland and seminal vesicles", ch: "How do Organisms Reproduce?" },
        { q: `A convex lens forms a real, inverted image of same size as the object when placed at:`, opts: ["A) At 2F₁", "B) At F₁", "C) Between F₁ and 2F₁", "D) Beyond 2F₁"], ans: "A) At 2F₁", ch: "Light - Reflection and Refraction" },
        { q: `The resistance of a uniform metallic wire of length L and cross-sectional area A is R. If its length is doubled and radius halved, new resistance becomes:`, opts: ["A) 8 R", "B) 4 R", "C) 2 R", "D) 16 R"], ans: "A) 8 R", ch: "Electricity" },
        { q: `Which component of blood is responsible for blood clotting at the site of an injury?`, opts: ["A) Blood Platelets", "B) Red Blood Cells (RBCs)", "C) White Blood Cells (WBCs)", "D) Blood Plasma"], ans: "A) Blood Platelets", ch: "Life Processes" }
      ];
      const item = sciMcqs[index % sciMcqs.length];
      return {
        id: qId,
        subjectId,
        chapterId: 'sci-ch',
        chapterName: item.ch,
        type: 'mcq',
        marks: 1,
        difficulty: 'medium',
        isCompetency: true,
        questionText: item.q,
        options: item.opts,
        correctAnswer: item.ans,
        markingScheme: `1 Mark for option ${item.ans}`,
        pyqYear: year
      };
    } else if (type === 'ar') {
      return {
        id: qId,
        subjectId,
        chapterId: 'sci-ar',
        chapterName: 'Assertion-Reasoning Unit',
        type: 'ar',
        marks: 1,
        difficulty: 'medium',
        isCompetency: true,
        questionText: `Assertion (A): Blue color of clear sky is due to scattering of light.\nReason (R): Fine particles in atmosphere scatter light of shorter wavelengths (blue) more strongly than longer wavelengths (red).`,
        options: [
          "A) Both A and R are true and R is correct explanation of A",
          "B) Both A and R are true but R is not correct explanation",
          "C) A is true but R is false",
          "D) A is false but R is true"
        ],
        correctAnswer: "A) Both A and R are true and R is correct explanation of A",
        markingScheme: "1 Mark - Correct option A.",
        pyqYear: year
      };
    } else if (type === 'vsa') {
      return {
        id: qId,
        subjectId,
        chapterId: 'sci-vsa',
        chapterName: 'Chemical Reactions & Electricity',
        type: 'vsa',
        marks: 2,
        difficulty: 'easy',
        isCompetency: false,
        questionText: `State Ohm's Law. Draw a circuit diagram to verify Ohm's law in the laboratory.`,
        correctAnswer: `Ohm's Law: The electric current flowing through a metallic conductor is directly proportional to the potential difference across its ends, provided temperature remains constant (V = IR).\nCircuit diagram includes ammeter in series, voltmeter in parallel across resistor, rheostat, battery and key.`,
        markingScheme: `• Correct statement of Ohm's Law [1 Mark]\n• Labeled circuit diagram [1 Mark]`,
        pyqYear: year
      };
    } else if (type === 'sa') {
      return {
        id: qId,
        subjectId,
        chapterId: 'sci-sa',
        chapterName: 'Life Processes & Light',
        type: 'sa',
        marks: 3,
        difficulty: 'medium',
        isCompetency: true,
        questionText: `(a) Write the balanced chemical equation for photosynthesis.\n(b) Mention the three main events that take place during photosynthesis.`,
        correctAnswer: `(a) 6CO₂ + 12H₂O --(Sunlight/Chlorophyll)--> C₆H₁₂O₆ + 6O₂ + 6H₂O.\n(b) 1. Absorption of light energy by chlorophyll.\n2. Conversion of light energy to chemical energy and splitting of water molecules into hydrogen and oxygen.\n3. Reduction of carbon dioxide to carbohydrates.`,
        markingScheme: `• Balanced chemical equation [1 Mark]\n• Three main steps mentioned accurately [2 Marks]`,
        pyqYear: year
      };
    } else if (type === 'la') {
      return {
        id: qId,
        subjectId,
        chapterId: 'sci-la',
        chapterName: 'Metals & Carbon Compounds',
        type: 'la',
        marks: 5,
        difficulty: 'hard',
        isCompetency: true,
        questionText: `(a) Define homologous series of carbon compounds. State any two characteristics.\n(b) Write the molecular formula and structural formula of the 2nd and 3rd members of the homologous series of alkenes.\n(c) How does ethanoic acid react with sodium carbonate? Write the balanced chemical equation.`,
        correctAnswer: `(a) A series of carbon compounds having same functional group and similar chemical properties where successive members differ by -CH₂ unit (14 u mass).\n(b) Ethene (C₂H₄, CH₂=CH₂) and Propene (C₃H₆, CH₃-CH=CH₂).\n(c) 2CH₃COOH + Na₂CO₃ → 2CH₃COONa + H₂O + CO₂↑ (Brisk effervescence of CO₂ gas).`,
        markingScheme: `• Definition & 2 properties [2 Marks]\n• Molecular & structural formulas [1.5 Marks]\n• Reaction equation & observation [1.5 Marks]`,
        pyqYear: year
      };
    } else {
      return {
        id: qId,
        subjectId,
        chapterId: 'sci-case',
        chapterName: 'Case Study - Human Eye & Defect Correction',
        type: 'case',
        marks: 4,
        difficulty: 'medium',
        isCompetency: true,
        casePassage: `A 14-year-old student sitting on the back bench of a classroom faces difficulty in reading the blackboard clearly, but can easily read her textbook. The eye specialist diagnosed a common refractive defect of vision.`,
        questionText: `Q1. Name the defect of vision the student is suffering from. (1 Mark)\nQ2. State two possible causes of this eye defect. (1 Mark)\nQ3. Name the type of lens used to correct this defect and draw a ray diagram showing correction. (2 Marks)`,
        correctAnswer: `Q1. Myopia (Short-sightedness).\nQ2. Causes: (i) Excessive curvature of the eye lens, (ii) Elongation of the eyeball.\nQ3. Concave lens (diverging lens) of suitable focal length is used to diverge incoming rays so that the image forms on the retina.`,
        markingScheme: `• Identification of Myopia [1 Mark]\n• Two causes stated [1 Mark]\n• Concave lens & clear ray diagram [2 Marks]`,
        pyqYear: year
      };
    }
  }

  // Social Science Fallback Sets
  if (s.includes('social') || s.includes('087') || s.includes('sst')) {
    if (type === 'mcq' || type === 'ar') {
      const sstMcqs = [
        { q: "Who among the following was proclaimed the first German Emperor in 1871 at Versailles?", opts: ["A) Kaiser William I", "B) Otto von Bismarck", "C) Victor Emmanuel II", "D) Napoleon III"], ans: "A) Kaiser William I", ch: "Nationalism in Europe" },
        { q: "Which soil is also known as 'Regur Soil' and is ideal for the cultivation of cotton in India?", opts: ["A) Black Soil", "B) Alluvial Soil", "C) Laterite Soil", "D) Red Soil"], ans: "A) Black Soil", ch: "Resources and Development" },
        { q: "In which year was the Vernacular Press Act passed in British India?", opts: ["A) 1878", "B) 1857", "C) 1919", "D) 1935"], ans: "A) 1878", ch: "Print Culture" },
        { q: "Which language was recognized as the sole official language of Sri Lanka under the Act of 1956?", opts: ["A) Sinhala", "B) Tamil", "C) English", "D) Dutch"], ans: "A) Sinhala", ch: "Power Sharing" },
        { q: "Which subject is included in the Concurrent List under the Indian Constitution?", opts: ["A) Education", "B) Defence", "C) Foreign Affairs", "D) Police"], ans: "A) Education", ch: "Federalism" },
        { q: "The sector contributing highest to India's Gross Domestic Product (GDP) today is:", opts: ["A) Tertiary Sector", "B) Primary Sector", "C) Secondary Sector", "D) Mining"], ans: "A) Tertiary Sector", ch: "Sectors of Economy" },
        { q: "Which institution issues currency notes in India on behalf of the Central Government?", opts: ["A) Reserve Bank of India", "B) State Bank of India", "C) Ministry of Finance", "D) NITI Aayog"], ans: "A) Reserve Bank of India", ch: "Money and Credit" },
        { q: "At which Congress session was the resolution for 'Purna Swaraj' adopted in 1929?", opts: ["A) Lahore Session", "B) Calcutta Session", "C) Nagpur Session", "D) Madras Session"], ans: "A) Lahore Session", ch: "Nationalism in India" }
      ];
      const sel = sstMcqs[index % sstMcqs.length];
      return {
        id: qId,
        subjectId,
        chapterId: 'sst-mcq',
        chapterName: sel.ch,
        type: 'mcq',
        marks: 1,
        difficulty: 'medium',
        isCompetency: true,
        questionText: index >= sstMcqs.length ? `${sel.q} (Board Set ${index + 1})` : sel.q,
        options: sel.opts,
        correctAnswer: sel.ans,
        markingScheme: `1 Mark for option ${sel.ans}`,
        pyqYear: year
      };
    } else if (type === 'vsa') {
      const sstVsas = [
        { q: "State two key stages involved in resource planning in India.", ans: "1. Identification and inventory of resources.\n2. Evolving a planning structure endowed with technology, skill, and institutions.", ch: "Resources and Development" },
        { q: "Why was the Rowlatt Act of 1919 opposed vehemently by Indian leaders?", ans: "It gave enormous powers to repress political activities and permitted detention of prisoners without trial for 2 years.", ch: "Nationalism in India" },
        { q: "Distinguish between 'Coming Together' and 'Holding Together' federations.", ans: "Coming Together: Independent states join to form bigger unit (e.g., USA).\nHolding Together: Large country divides power between national govt and states (e.g., India).", ch: "Federalism" },
        { q: "What is Per Capita Income? Mention one limitation of using it as a development indicator.", ans: "Per Capita Income = Total Income / Total Population. Limitation: It hides disparities in income distribution.", ch: "Development" },
        { q: "State two reasons why the Tertiary Sector has grown rapidly in India.", ans: "1. Increasing demand for basic services (health, education, transport).\n2. Rise in income levels boosting tourism, private services, and IT.", ch: "Sectors of Economy" }
      ];
      const sel = sstVsas[index % sstVsas.length];
      return {
        id: qId,
        subjectId,
        chapterId: 'sst-vsa',
        chapterName: sel.ch,
        type: 'vsa',
        marks: 2,
        difficulty: 'medium',
        isCompetency: false,
        questionText: index >= sstVsas.length ? `${sel.q} (Question Variant ${index + 1})` : sel.q,
        correctAnswer: sel.ans,
        markingScheme: "1 Mark for each valid point stated.",
        pyqYear: year
      };
    } else if (type === 'sa') {
      const sstSas = [
        { q: "Explain three main features of the Napoleonic Code (Civil Code of 1804).", ans: "1. Abolished privileges based on birth.\n2. Established equality before the law.\n3. Secured right to property and simplified administrative divisions.", ch: "Nationalism in Europe" },
        { q: "Analyze the economic impacts of the Non-Cooperation Movement (1921-1922) in India.", ans: "1. Foreign cloth boycotted and burnt in bonfires.\n2. Foreign cloth imports halved from ₹102 crore to ₹57 crore.\n3. Production of Indian textile mills and handlooms surged.", ch: "Nationalism in India" },
        { q: "Why is credit considered to have a 'double-edged' impact on borrowers?", ans: "Positive impact: Helps expand business and increase earnings.\nNegative impact (Debt Trap): If crop/business fails, borrower is forced to sell assets to repay.", ch: "Money and Credit" },
        { q: "Explain three ways in which Multinational Corporations (MNCs) set up production in developing nations.", ans: "1. Setting up joint ventures with local companies.\n2. Buying existing local companies.\n3. Placing manufacturing orders with small regional producers.", ch: "Globalization" }
      ];
      const sel = sstSas[index % sstSas.length];
      return {
        id: qId,
        subjectId,
        chapterId: 'sst-sa',
        chapterName: sel.ch,
        type: 'sa',
        marks: 3,
        difficulty: 'medium',
        isCompetency: true,
        questionText: index >= sstSas.length ? `${sel.q} (Board Set ${index + 1})` : sel.q,
        correctAnswer: sel.ans,
        markingScheme: "1 Mark for each detailed explanation point.",
        pyqYear: year
      };
    } else if (type === 'la') {
      const sstLas = [
        { q: "Describe the unification of Germany led by Otto von Bismarck. Highlight the three major wars involved.", ans: "Bismarck led Prussian army through three wars over 7 years against Denmark, Austria, and France, culminating in proclamation of Kaiser William I as German Emperor in 1871.", ch: "Nationalism in Europe" },
        { q: "Detail the institutional and technological reforms introduced in Indian agriculture post-independence.", ans: "Institutional: Land consolidation, abolition of Zamindari, crop insurance, Grameen banks.\nTechnological: HYV seeds, chemical fertilizers, Green & White Revolutions.", ch: "Agriculture" },
        { q: "'Democracy is seen to be good in principle, but felt to be not so good in practice.' Critically evaluate.", ans: "In principle: Promotes equality, dignity, conflict resolution.\nIn practice: Slow decision-making, political corruption, poverty persistence.", ch: "Outcomes of Democracy" }
      ];
      const sel = sstLas[index % sstLas.length];
      return {
        id: qId,
        subjectId,
        chapterId: 'sst-la',
        chapterName: sel.ch,
        type: 'la',
        marks: 5,
        difficulty: 'hard',
        isCompetency: true,
        questionText: index >= sstLas.length ? `${sel.q} (Extended Variant ${index + 1})` : sel.q,
        correctAnswer: sel.ans,
        markingScheme: "Step-wise marking for structured answer points.",
        pyqYear: year
      };
    } else {
      return {
        id: qId,
        subjectId,
        chapterId: 'sst-case',
        chapterName: 'Case Study - Power Sharing & Federal Accommodation',
        type: 'case',
        marks: 4,
        difficulty: 'medium',
        isCompetency: true,
        casePassage: "Power sharing arrangements in Belgium established equal minister representation between Dutch and French speaking communities, preventing civil strife unlike Sri Lanka's majoritarian policies.",
        questionText: `Q1. Mention the main constitutional feature of Belgian accommodation. (1M)\nQ2. How did Brussels handle language equality? (1M)\nQ3. Contrast Belgium's model with Sri Lanka's majoritarianism. (2M)`,
        correctAnswer: "Q1. Equal Dutch and French central ministers.\nQ2. Separate Brussels govt with equal community representation.\nQ3. Belgium accommodated diversity, whereas Sri Lanka imposed Sinhala dominance leading to civil conflict.",
        markingScheme: "Sub-part marking scheme as per CBSE board guidelines.",
        pyqYear: year
      };
    }
  }

  // English Fallback Sets
  if (s.includes('english') || s.includes('184') || s.includes('301')) {
    if (type === 'mcq' || type === 'ar') {
      const engMcqs = [
        { q: "In 'A Letter to God', what did Lencho compare the large raindrops to?", opts: ["A) New silver coins", "B) Pearls", "C) Diamonds", "D) Frozen tears"], ans: "A) New silver coins", ch: "A Letter to God" },
        { q: "Who accompanied Nelson Mandela on his presidential inauguration day?", opts: ["A) His daughter Zenani", "B) Walter Sisulu", "C) Oliver Tambo", "D) F.W. de Klerk"], ans: "A) His daughter Zenani", ch: "Nelson Mandela" },
        { q: "What food did the seagull's mother tempt him with in 'His First Flight'?", opts: ["A) A piece of fish", "B) Bread crumbs", "C) Earthworms", "D) Small insects"], ans: "A) A piece of fish", ch: "Two Stories About Flying" },
        { q: "Anne Frank named her intimate diary companion:", opts: ["A) Kitty", "B) Margot", "C) Edith", "D) Peter"], ans: "A) Kitty", ch: "Diary of Anne Frank" }
      ];
      const sel = engMcqs[index % engMcqs.length];
      return {
        id: qId,
        subjectId,
        chapterId: 'eng-mcq',
        chapterName: sel.ch,
        type: 'mcq',
        marks: 1,
        difficulty: 'medium',
        isCompetency: true,
        questionText: index >= engMcqs.length ? `${sel.q} (Set ${index + 1})` : sel.q,
        options: sel.opts,
        correctAnswer: sel.ans,
        markingScheme: `1 Mark for option ${sel.ans}`,
        pyqYear: year
      };
    } else if (type === 'vsa' || type === 'sa') {
      const engSas = [
        { q: "Why did Lencho write a letter to God and what was the postmaster's reaction upon reading it?", ans: "Lencho wrote to God asking for 100 pesos after hailstorm destroyed his crops. The postmaster was moved by his faith and collected 70 pesos from staff.", ch: "A Letter to God" },
        { q: "What twin obligations does Nelson Mandela mention in his autobiography?", ans: "1. Obligation to family, parents, wife, and children.\n2. Obligation to people, community, and country.", ch: "Nelson Mandela" },
        { q: "How did the young seagull overcome his fear and make his first flight over the sea?", ans: "Maddened by hunger, he dived at the fish in his mother's beak, fell outward, spread his wings instinctively, and soared.", ch: "His First Flight" }
      ];
      const sel = engSas[index % engSas.length];
      return {
        id: qId,
        subjectId,
        chapterId: 'eng-sa',
        chapterName: sel.ch,
        type: type === 'vsa' ? 'vsa' : 'sa',
        marks: type === 'vsa' ? 2 : 3,
        difficulty: 'medium',
        isCompetency: true,
        questionText: index >= engSas.length ? `${sel.q} (Variant ${index + 1})` : sel.q,
        correctAnswer: sel.ans,
        markingScheme: "Appropriate content and expression evaluation.",
        pyqYear: year
      };
    } else {
      return {
        id: qId,
        subjectId,
        chapterId: 'eng-la',
        chapterName: 'Literature Analysis & Character Study',
        type: type === 'case' ? 'case' : 'la',
        marks: type === 'case' ? 4 : 5,
        difficulty: 'hard',
        isCompetency: true,
        questionText: `Analyze how determination and courage enable individuals to overcome daunting obstacles with reference to 'His First Flight' and 'The Making of a Scientist'.`,
        correctAnswer: "The seagull conquered innate fear through instinctive action, while Richard Ebright channeled intense curiosity and perseverance to drive scientific achievements.",
        markingScheme: "CBSE literature evaluation scheme for depth, grammar, and thematic coherence.",
        pyqYear: year
      };
    }
  }

  // General default question with index-based variation to eliminate duplication
  return {
    id: qId,
    subjectId,
    chapterId: 'gen-ch',
    chapterName: 'Curated Board Syllabus Unit',
    type: type === 'mcq' || type === 'ar' ? 'mcq' : type,
    marks: type === 'la' ? 5 : type === 'sa' ? 3 : type === 'vsa' ? 2 : type === 'case' ? 4 : 1,
    difficulty: 'medium',
    isCompetency: true,
    questionText: `Official CBSE ${type.toUpperCase()} Board Exam Question - Unit ${index + 1} (${year} Examination)`,
    options: type === 'mcq' || type === 'ar' ? ["A) Option A", "B) Option B", "C) Option C", "D) Option D"] : undefined,
    correctAnswer: "A) Option A step-by-step answer as per official marking scheme.",
    markingScheme: "Step-wise marking as per CBSE official evaluation scheme.",
    pyqYear: year
  };
}

export function buildFullPYQBoardPaper(pyq: PYQPaper, branding: CustomBranding): GeneratedPaper {
  const classNum = pyq.subjectName?.match(/Class\s*(\d+)/i)?.[1] ||
                   (pyq.subjectId.includes('12') ? '12' : pyq.subjectId.includes('11') ? '11' : pyq.subjectId.includes('9') ? '9' : '10');

  const subjCode = getSubjectCode(pyq.subjectId, pyq.subjectName);
  const totalMarks = pyq.totalMarks || (subjCode === '042' || subjCode === '043' || subjCode === '044' || subjCode === '083' ? 70 : 80);

  // Target question distribution by total marks
  let targetA = 20; // Sec A MCQs
  let targetB = 6;  // Sec B VSAs
  let targetC = 7;  // Sec C SAs
  let targetD = 3;  // Sec D LAs
  let targetE = 3;  // Sec E Cases

  if (totalMarks === 70) {
    targetA = 16;
    targetB = 5;
    targetC = 7;
    targetD = 2;
    targetE = 3;
  } else if (totalMarks === 50) {
    targetA = 24;
    targetB = 8;
    targetC = 5;
    targetD = 0;
    targetE = 0;
  }

  // Collect pool questions for subject across all sources
  const existingQs = pyq.questions || [];
  const subjectQs = PRELOADED_QUESTIONS.filter(q => q.subjectId === pyq.subjectId);
  const masterPool = getMasterPool(pyq.subjectId);

  let vaultQs: Question[] = [];
  try {
    const vaultMap = getStoredVault();
    vaultQs = Object.values(vaultMap)
      .filter(q => q.subjectId === pyq.subjectId || isSubjectAndClassMatch(pyq.subjectId, pyq.subjectName, q.subjectId, q.questionText))
      .map(q => ({
        id: q.id,
        subjectId: pyq.subjectId,
        chapterId: q.chapterId || 'ch1',
        chapterName: q.chapterName || 'Core Syllabus',
        type: q.type,
        marks: q.marks,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        markingScheme: q.markingScheme,
        explanation: q.explanation,
        difficulty: q.difficulty || 'medium',
        isCompetency: q.isCompetency
      }));
  } catch (e) {
    console.warn('Vault query fallback in PYQ paper builder:', e);
  }

  // Flatten master pool into Question format
  const masterQs: Question[] = ([
    ...(masterPool.mcqs || []),
    ...(masterPool.vsas || []),
    ...(masterPool.sas || []),
    ...(masterPool.las || []),
    ...(masterPool.cases || []).map(c => ({
      id: `m-case-${Math.random().toString(36).substring(2, 6)}`,
      subjectId: pyq.subjectId,
      chapterId: 'case-ch',
      chapterName: c.ch || 'Case Study',
      type: 'case' as const,
      marks: 4,
      difficulty: 'medium' as const,
      isCompetency: true,
      casePassage: c.passage,
      questionText: c.q,
      correctAnswer: c.ans
    }))
  ] as any[]).map((q, idx) => ({
    id: q.id || `mq-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    subjectId: pyq.subjectId,
    chapterId: q.chapterId || 'ch1',
    chapterName: q.chapterName || q.ch || 'Syllabus Chapter',
    type: q.type || (q.opts ? 'mcq' : 'sa'),
    marks: q.marks || (q.opts ? 1 : 3),
    difficulty: q.difficulty || 'medium',
    questionText: q.questionText || q.q || '',
    options: q.options || q.opts,
    correctAnswer: q.correctAnswer || q.ans || '',
    markingScheme: q.markingScheme || q.ms,
    explanation: q.explanation || q.exp,
    isCompetency: Boolean(q.isCompetency)
  }));

  const pool = [...existingQs, ...subjectQs, ...masterQs, ...vaultQs];

  const fillSection = (type: 'mcq' | 'ar' | 'vsa' | 'sa' | 'la' | 'case', requiredCount: number): Question[] => {
    if (requiredCount <= 0) return [];
    
    let filtered = pool.filter(q => {
      if (type === 'mcq') return q.type === 'mcq' || q.type === 'ar';
      return q.type === type;
    }).filter(q => isSubjectAndClassMatch(pyq.subjectId, pyq.subjectName, q.subjectId, q.questionText));

    // Deduplicate strictly by question text hash
    const uniqueMap = new Map<string, Question>();
    filtered.forEach(q => {
      const hash = hashQuestionText(q.questionText || '');
      if (!uniqueMap.has(hash)) {
        uniqueMap.set(hash, q);
      }
    });
    let uniqueList = Array.from(uniqueMap.values());

    while (uniqueList.length < requiredCount) {
      const idx = uniqueList.length + 1;
      const fbQ = generateFallbackQuestion(pyq.subjectId, type, idx, pyq.year);
      const hash = hashQuestionText(fbQ.questionText || '');
      if (!uniqueMap.has(hash)) {
        uniqueMap.set(hash, fbQ);
        uniqueList.push(fbQ);
      } else {
        const varQ = {
          ...fbQ,
          id: `${fbQ.id}-v${idx}`,
          questionText: `${fbQ.questionText} (Question Set ${idx})`
        };
        uniqueList.push(varQ);
      }
    }

    return uniqueList.slice(0, requiredCount).map((q, i) => ({
      ...q,
      id: `pyq-${pyq.subjectId}-${pyq.year}-${type}-${i + 1}`
    }));
  };

  const secA = fillSection('mcq', targetA);
  const secB = fillSection('vsa', targetB);
  const secC = fillSection('sa', targetC);
  const secD = fillSection('la', targetD);
  const secE = fillSection('case', targetE);

  const totalQs = secA.length + secB.length + secC.length + secD.length + secE.length;

  const generalInstructions = [
    `This question paper consists of ${totalQs} questions divided into 5 sections: Section A, Section B, Section C, Section D and Section E.`,
    "All questions are compulsory. However, internal choices are provided in some questions.",
    "Section A consists of Objective Type Questions (MCQs and Assertion-Reasoning) carrying 1 mark each.",
    "Section B consists of Very Short Answer (VSA) type questions carrying 02 marks each. Answers should be in the range of 30 to 50 words.",
    "Section C consists of Short Answer (SA) type questions carrying 03 marks each. Answers should be in the range of 50 to 80 words.",
    "Section D consists of Long Answer (LA) type questions carrying 05 marks each. Answers should be in the range of 80 to 120 words.",
    "Section E consists of Case-Based integrated units of assessment (04 marks each) with sub-parts.",
    "Use of calculators is NOT permitted. Wherever required, draw neat and properly labelled diagrams."
  ];

  const sections: PaperSection[] = [
    {
      sectionName: "SECTION A",
      description: "Multiple Choice Questions & Assertion-Reasoning (1 Mark Each)",
      questions: secA
    },
    {
      sectionName: "SECTION B",
      description: "Very Short Answer Questions (2 Marks Each)",
      questions: secB
    },
    {
      sectionName: "SECTION C",
      description: "Short Answer Questions (3 Marks Each)",
      questions: secC
    },
    ...(secD.length > 0 ? [{
      sectionName: "SECTION D",
      description: "Long Answer Questions (5 Marks Each)",
      questions: secD
    }] : []),
    ...(secE.length > 0 ? [{
      sectionName: "SECTION E",
      description: "Case-Based Integrated Units of Assessment (4 Marks Each)",
      questions: secE
    }] : [])
  ];

  const code = `CBSE${classNum}-PYQ-${pyq.year}-SET-${pyq.setNumber.replace(/[\/\s]/g, '')}`;

  return {
    id: `pyq-paper-${pyq.id}`,
    paperCode: code,
    subjectName: pyq.subjectName,
    subjectCode: subjCode,
    generalInstructions,
    config: {
      subjectId: pyq.subjectId,
      preset: 'board80',
      title: pyq.title,
      schoolName: 'CENTRAL BOARD OF SECONDARY EDUCATION',
      examCode: pyq.setNumber,
      date: `Official Board Exam ${pyq.year}`,
      durationMinutes: pyq.durationMinutes || 180,
      totalMarks: totalMarks,
      selectedChapterIds: [],
      competencyRatio: 50,
      difficultySplit: { easy: 30, medium: 50, hard: 20 },
      watermarkText: 'CBSE OFFICIAL QUESTION PAPER',
      includeSolutions: true,
      useAI: false
    },
    sections,
    createdAt: new Date().toISOString()
  };
}
