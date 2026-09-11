import { Subject, Question, PYQPaper } from '../types';
import { CBSE_CLASS_3_SUBJECTS, CBSE_CLASS_4_SUBJECTS, CBSE_CLASS_5_SUBJECTS, CBSE_CLASS_6_SUBJECTS, CBSE_CLASS_7_SUBJECTS, CBSE_CLASS_8_SUBJECTS } from './cbseClass5to8';
import { CBSE_CLASS_9_SUBJECTS } from './cbseClass9';
import { CBSE_CLASS_11_SUBJECTS } from './cbseClass11';
import { CBSE_CLASS_12_SUBJECTS } from './cbseClass12';
import {
  CLASS12_PHYSICS_POOL,
  CLASS12_CHEMISTRY_POOL,
  CLASS12_MATHS_POOL,
  CLASS12_BIOLOGY_POOL,
  CLASS12_CS_POOL,
  CLASS12_ENGLISH_POOL
} from './class12MasterPool';
import {
  CLASS9_SCIENCE_POOL,
  CLASS9_MATHS_POOL,
  CLASS9_SST_POOL,
  CLASS9_ENGLISH_POOL,
  CLASS9_HINDI_POOL,
  CLASS9_IT_POOL
} from './class9MasterPool';
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
import { SubjectQuestionPool } from './masterQuestionPool';
import { CLASS_3_QUESTION_BANK, CLASS_4_QUESTION_BANK } from './primaryCurriculum';

function poolToQuestions(pool: SubjectQuestionPool, subjectId: string, basePrefix: string): Question[] {
  const list: Question[] = [];
  pool.mcqs?.forEach((m, idx) => {
    list.push({
      id: `${basePrefix}-mcq-${idx + 1}`,
      subjectId,
      chapterId: `${basePrefix}-ch`,
      chapterName: m.ch || 'Curated Board Concept',
      type: m.type === 'ar' ? 'ar' : 'mcq',
      marks: 1,
      difficulty: 'medium',
      isCompetency: true,
      questionText: m.q,
      options: m.opts,
      correctAnswer: m.ans,
      markingScheme: `1 Mark for correct option (${m.ans})`,
      explanation: `Correct answer is ${m.ans}.`,
      pyqYear: 2024
    });
  });
  pool.vsas?.forEach((v, idx) => {
    list.push({
      id: `${basePrefix}-vsa-${idx + 1}`,
      subjectId,
      chapterId: `${basePrefix}-ch`,
      chapterName: v.ch || 'Curated Board Concept',
      type: 'vsa',
      marks: 2,
      difficulty: 'easy',
      isCompetency: false,
      questionText: v.q,
      correctAnswer: v.ans,
      markingScheme: `[2 Marks] ${v.ans}`,
      pyqYear: 2023
    });
  });
  pool.sas?.forEach((s, idx) => {
    list.push({
      id: `${basePrefix}-sa-${idx + 1}`,
      subjectId,
      chapterId: `${basePrefix}-ch`,
      chapterName: s.ch || 'Curated Board Concept',
      type: 'sa',
      marks: 3,
      difficulty: 'medium',
      isCompetency: true,
      questionText: s.q,
      correctAnswer: s.ans,
      markingScheme: `[3 Marks] ${s.ans}`,
      pyqYear: 2024
    });
  });
  pool.las?.forEach((l, idx) => {
    list.push({
      id: `${basePrefix}-la-${idx + 1}`,
      subjectId,
      chapterId: `${basePrefix}-ch`,
      chapterName: l.ch || 'Curated Board Concept',
      type: 'la',
      marks: 5,
      difficulty: 'hard',
      isCompetency: true,
      questionText: l.q,
      correctAnswer: l.ans,
      markingScheme: `[5 Marks] ${l.ans}`,
      pyqYear: 2024
    });
  });
  pool.cases?.forEach((c, idx) => {
    list.push({
      id: `${basePrefix}-case-${idx + 1}`,
      subjectId,
      chapterId: `${basePrefix}-ch`,
      chapterName: c.ch || 'Case-Based Integrated Question',
      type: 'case',
      marks: 4,
      difficulty: 'medium',
      isCompetency: true,
      casePassage: c.passage,
      questionText: c.q,
      correctAnswer: c.ans,
      markingScheme: `[4 Marks] Case study evaluation scheme:\n${c.ans}`,
      pyqYear: 2025
    });
  });
  return list;
}

export const CBSE_CLASS_10_SUBJECTS: Subject[] = [
  {
    id: 'science-086',
    name: 'Science',
    code: '086',
    category: 'Science',
    color: '#0284c7', // Sky blue
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
    icon: 'FlaskConical',
    totalChapters: 13,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      {
        id: 'sci-ch1',
        number: 1,
        title: 'Chemical Reactions and Equations',
        unitName: 'Chemical Substances - Nature and Behaviour',
        unitWeightageMarks: 25,
        topics: ['Chemical equations', 'Balanced chemical equations', 'Combination reaction', 'Decomposition reaction', 'Displacement & Double displacement', 'Oxidation and Reduction', 'Corrosion and Rancidity'],
        keyFormulasOrConcepts: ['Fe + CuSO4 → FeSO4 + Cu', 'Redox: Gain/loss of electrons', 'Exothermic vs Endothermic']
      },
      {
        id: 'sci-ch2',
        number: 2,
        title: 'Acids, Bases and Salts',
        unitName: 'Chemical Substances - Nature and Behaviour',
        unitWeightageMarks: 25,
        topics: ['Definitions in terms of H+ and OH- ions', 'General properties & reactions with metals', 'pH scale & importance in daily life', 'Preparation of Sodium Hydroxide, Bleaching Powder, Baking Soda, Washing Soda, Plaster of Paris'],
        keyFormulasOrConcepts: ['pH = -log[H+]', 'CaSO4·1/2H2O (Plaster of Paris)', 'Neutralization: Acid + Base → Salt + Water']
      },
      {
        id: 'sci-ch3',
        number: 3,
        title: 'Metals and Non-Metals',
        unitName: 'Chemical Substances - Nature and Behaviour',
        unitWeightageMarks: 25,
        topics: ['Physical & chemical properties of metals and non-metals', 'Reactivity series', 'Formation & properties of ionic compounds', 'Basic metallurgical processes', 'Corrosion and its prevention'],
        keyFormulasOrConcepts: ['Reactivity Series: K > Na > Ca > Mg > Al > Zn > Fe...', 'Ionic bonding via transfer of e-']
      },
      {
        id: 'sci-ch4',
        number: 4,
        title: 'Carbon and its Compounds',
        unitName: 'Chemical Substances - Nature and Behaviour',
        unitWeightageMarks: 25,
        topics: ['Covalent bonding in carbon compounds', 'Versatile nature of carbon', 'Homologous series', 'Nomenclature of carbon compounds', 'Chemical properties of carbon compounds (combustion, oxidation, addition, substitution)', 'Ethanol and Ethanoic acid', 'Soaps and Detergents'],
        keyFormulasOrConcepts: ['Tetravalency & Catenation', 'General formulas: CnH2n+2, CnH2n, CnH2n-2', 'Saponification: Ester + NaOH → Soap + Alcohol']
      },
      {
        id: 'sci-ch5',
        number: 5,
        title: 'Life Processes',
        unitName: 'World of Living',
        unitWeightageMarks: 25,
        topics: ['Autotrophic & Heterotrophic Nutrition', 'Respiration in humans & plants', 'Transportation in human beings & plants (Xylem/Phloem, Heart structure)', 'Excretion in humans (Nephron structure) & plants'],
        keyFormulasOrConcepts: ['Photosynthesis: 6CO2 + 6H2O → C6H12O6 + 6O2', 'Double circulation in human heart', 'Structure of Nephron']
      },
      {
        id: 'sci-ch6',
        number: 6,
        title: 'Control and Coordination',
        unitName: 'World of Living',
        unitWeightageMarks: 25,
        topics: ['Tropic movements in plants', 'Plant hormones (Auxin, Gibberellin, Cytokinin, Abscisic acid)', 'Control and coordination in animals', 'Nervous system: Reflex arc', 'Brain structure & functions', 'Hormones in animals (Thyroxin, Insulin, Adrenaline, Growth hormone)'],
        keyFormulasOrConcepts: ['Reflex arc pathway: Receptor → Sensory Neuron → Spinal Cord → Motor Neuron → Effector', 'Endocrine Glands']
      },
      {
        id: 'sci-ch7',
        number: 7,
        title: 'How do Organisms Reproduce?',
        unitName: 'World of Living',
        unitWeightageMarks: 25,
        topics: ['Modes of asexual reproduction (Fission, Fragmentation, Regeneration, Budding, Vegetative propagation, Spore formation)', 'Sexual reproduction in flowering plants', 'Sexual reproduction in humans', 'Reproductive health & contraception methods'],
        keyFormulasOrConcepts: ['Double Fertilization in angiosperms', 'STDs and Barrier / Chemical methods']
      },
      {
        id: 'sci-ch8',
        number: 8,
        title: 'Heredity and Evolution',
        unitName: 'World of Living',
        unitWeightageMarks: 25,
        topics: ['Heredity and Mendel’s contribution', 'Monohybrid and Dihybrid cross', 'Laws for inheritance of traits', 'Sex determination in human beings (XX and XY mechanism)'],
        keyFormulasOrConcepts: ['Monohybrid ratio: 3:1 (Phenotype), 1:2:1 (Genotype)', 'Dihybrid Phenotypic ratio: 9:3:3:1']
      },
      {
        id: 'sci-ch9',
        number: 9,
        title: 'Light - Reflection and Refraction',
        unitName: 'Natural Phenomena',
        unitWeightageMarks: 12,
        topics: ['Reflection of light at curved surfaces', 'Images formed by spherical mirrors', 'Mirror formula and magnification', 'Refraction of light & Laws of refraction', 'Refractive index', 'Refraction through spherical lenses', 'Lens formula and magnification', 'Power of a lens'],
        keyFormulasOrConcepts: ['1/f = 1/v + 1/u (Mirror)', '1/f = 1/v - 1/u (Lens)', 'Power P = 1/f(in meters) Dioptres']
      },
      {
        id: 'sci-ch10',
        number: 10,
        title: 'The Human Eye and the Colorful World',
        unitName: 'Natural Phenomena',
        unitWeightageMarks: 12,
        topics: ['Structure & functioning of human eye lens', 'Defects of vision (Myopia, Hypermetropia, Presbyopia) & corrections', 'Refraction through a glass prism', 'Dispersion of white light', 'Atmospheric refraction (twinkling of stars)', 'Scattering of light (Tyndall effect, red sky at sunrise/sunset)'],
        keyFormulasOrConcepts: ['Myopia: Concave lens correction', 'Hypermetropia: Convex lens correction', 'VIBGYOR dispersion']
      },
      {
        id: 'sci-ch11',
        number: 11,
        title: 'Electricity',
        unitName: 'Effects of Current',
        unitWeightageMarks: 13,
        topics: ['Electric current and potential difference', 'Ohm’s law and resistance', 'Factors on which resistance depends (Resistivity ρ)', 'Series and Parallel combination of resistors', 'Heating effect of electric current & Joule’s Law', 'Electric power (P = VI = I²R = V²/R)'],
        keyFormulasOrConcepts: ['V = IR', 'R_series = R1 + R2 + R3', '1/R_parallel = 1/R1 + 1/R2 + 1/R3', 'H = I²Rt']
      },
      {
        id: 'sci-ch12',
        number: 12,
        title: 'Magnetic Effects of Electric Current',
        unitName: 'Effects of Current',
        unitWeightageMarks: 13,
        topics: ['Magnetic field and field lines', 'Field due to current carrying conductor, straight wire, circular loop, solenoid', 'Force on current carrying conductor in magnetic field', 'Right hand thumb rule & Fleming’s Left Hand Rule', 'Domestic electric circuits (Live, Neutral, Earth wires, Fuse, Short circuit)'],
        keyFormulasOrConcepts: ['Fleming’s Left Hand Rule (FBI: Force, Field, Current)', 'Solenoid magnetic field pattern']
      },
      {
        id: 'sci-ch13',
        number: 13,
        title: 'Our Environment',
        unitName: 'Natural Resources',
        unitWeightageMarks: 5,
        topics: ['Eco-system and food chains/webs', 'Trophic levels and 10% law', 'Ozone layer depletion and how it is caused', 'Waste management & biodegradable vs non-biodegradable substances'],
        keyFormulasOrConcepts: ['Lindeman’s 10% Energy Transfer Law', 'Ozone: O3 breakdown by CFCs']
      }
    ]
  },
  {
    id: 'maths-041',
    name: 'Mathematics (Standard)',
    code: '041',
    category: 'Mathematics',
    color: '#16a34a', // Green
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: 'Calculator',
    totalChapters: 14,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      {
        id: 'm-ch1',
        number: 1,
        title: 'Real Numbers',
        unitName: 'Number Systems',
        unitWeightageMarks: 6,
        topics: ['Fundamental Theorem of Arithmetic', 'HCF and LCM using prime factorization', 'Proof of irrationality of √2, √3, √5'],
        keyFormulasOrConcepts: ['LCM(a,b) × HCF(a,b) = a × b', 'Prime Factorization']
      },
      {
        id: 'm-ch2',
        number: 2,
        title: 'Polynomials',
        unitName: 'Algebra',
        unitWeightageMarks: 20,
        topics: ['Zeros of a polynomial', 'Relationship between zeros and coefficients of quadratic polynomials'],
        keyFormulasOrConcepts: ['α + β = -b/a', 'αβ = c/a', 'Polynomial = x² - (α+β)x + αβ']
      },
      {
        id: 'm-ch3',
        number: 3,
        title: 'Pair of Linear Equations in Two Variables',
        unitName: 'Algebra',
        unitWeightageMarks: 20,
        topics: ['Pair of linear equations in two variables and graphical method', 'Consistency/Inconsistency conditions (a1/a2 ≠ b1/b2, etc.)', 'Algebraic solutions: Substitution and Elimination methods', 'Word problems on speed, work, digits, age'],
        keyFormulasOrConcepts: ['Unique: a1/a2 ≠ b1/b2', 'Infinitely Many: a1/a2 = b1/b2 = c1/c2', 'Parallel/No Solution: a1/a2 = b1/b2 ≠ c1/c2']
      },
      {
        id: 'm-ch4',
        number: 4,
        title: 'Quadratic Equations',
        unitName: 'Algebra',
        unitWeightageMarks: 20,
        topics: ['Standard form ax² + bx + c = 0', 'Solutions by factorization & Quadratic formula', 'Discriminant D = b² - 4ac and nature of roots'],
        keyFormulasOrConcepts: ['x = (-b ± √(b² - 4ac)) / 2a', 'D > 0: Two distinct real roots', 'D = 0: Two equal real roots', 'D < 0: No real roots']
      },
      {
        id: 'm-ch5',
        number: 5,
        title: 'Arithmetic Progressions',
        unitName: 'Algebra',
        unitWeightageMarks: 20,
        topics: ['Derivation of nth term an = a + (n-1)d', 'Sum of first n terms Sn = n/2 [2a + (n-1)d] = n/2 [a + l]', 'Application in solving daily life problems'],
        keyFormulasOrConcepts: ['an = a + (n-1)d', 'Sn = n/2 (a + l)', 'd = an - an-1']
      },
      {
        id: 'm-ch6',
        number: 6,
        title: 'Triangles',
        unitName: 'Coordinate Geometry & Geometry',
        unitWeightageMarks: 15,
        topics: ['Basic Proportionality Theorem (Thales Theorem) & Converse', 'Criteria for similarity of triangles (AAA, SAS, SSS)', 'Proofs and applications'],
        keyFormulasOrConcepts: ['If DE || BC in △ABC, then AD/DB = AE/EC', 'Ratio of areas of similar triangles = (Ratio of sides)²']
      },
      {
        id: 'm-ch7',
        number: 7,
        title: 'Coordinate Geometry',
        unitName: 'Coordinate Geometry',
        unitWeightageMarks: 6,
        topics: ['Distance formula d = √[(x2-x1)² + (y2-y1)²]', 'Section formula m1x2 + m2x1 / (m1+m2)', 'Midpoint formula'],
        keyFormulasOrConcepts: ['Distance Formula', 'Section Formula', 'Midpoint ((x1+x2)/2, (y1+y2)/2)']
      },
      {
        id: 'm-ch8',
        number: 8,
        title: 'Introduction to Trigonometry',
        unitName: 'Trigonometry',
        unitWeightageMarks: 12,
        topics: ['Trigonometric ratios of an acute angle', 'Values of ratios at 0°, 30°, 45°, 60°, 90°', 'Trigonometric identities (sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ, 1 + cot²θ = cosec²θ)'],
        keyFormulasOrConcepts: ['sin θ = P/H, cos θ = B/H, tan θ = P/B', 'sin²θ + cos²θ = 1']
      },
      {
        id: 'm-ch9',
        number: 9,
        title: 'Some Applications of Trigonometry',
        unitName: 'Trigonometry',
        unitWeightageMarks: 12,
        topics: ['Heights and Distances', 'Angle of elevation and Angle of depression', 'Simple 2D problems with angles 30°, 45°, 60°'],
        keyFormulasOrConcepts: ['tan θ = Height / Distance', 'Line of sight & horizontal line']
      },
      {
        id: 'm-ch10',
        number: 10,
        title: 'Circles',
        unitName: 'Geometry',
        unitWeightageMarks: 15,
        topics: ['Tangent to a circle at any point is perpendicular to radius', 'Lengths of tangents drawn from an external point are equal'],
        keyFormulasOrConcepts: ['OP ⊥ Tangent at P', 'PA = PB from external point P']
      },
      {
        id: 'm-ch11',
        number: 11,
        title: 'Areas Related to Circles',
        unitName: 'Mensuration',
        unitWeightageMarks: 10,
        topics: ['Area of sector and segment of a circle', 'Angle of sector θ = 60°, 90°, 120°'],
        keyFormulasOrConcepts: ['Area of sector = (θ/360°) × πr²', 'Length of arc = (θ/360°) × 2πr']
      },
      {
        id: 'm-ch12',
        number: 12,
        title: 'Surface Areas and Volumes',
        unitName: 'Mensuration',
        unitWeightageMarks: 10,
        topics: ['Surface areas and volumes of combinations of two solids (cubes, cuboids, spheres, hemispheres, right circular cylinders/cones)'],
        keyFormulasOrConcepts: ['Cylinder V = πr²h', 'Cone V = 1/3 πr²h, LSA = πrl', 'Sphere V = 4/3 πr³, TSA = 4πr²']
      },
      {
        id: 'm-ch13',
        number: 13,
        title: 'Statistics',
        unitName: 'Statistics & Probability',
        unitWeightageMarks: 11,
        topics: ['Mean of grouped data (Direct, Assumed Mean Method)', 'Mode of grouped data', 'Median of grouped data'],
        keyFormulasOrConcepts: ['Mean x̄ = Σfi xi / Σfi', 'Mode = l + [(f1-f0)/(2f1-f0-f2)] × h', '3 Median = Mode + 2 Mean']
      },
      {
        id: 'm-ch14',
        number: 14,
        title: 'Probability',
        unitName: 'Statistics & Probability',
        unitWeightageMarks: 11,
        topics: ['Classical definition of probability', 'Simple problems on single event (coins, dice, cards)'],
        keyFormulasOrConcepts: ['P(E) = Number of favorable outcomes / Total outcomes', '0 ≤ P(E) ≤ 1', 'P(E) + P(not E) = 1']
      }
    ]
  },
  {
    id: 'social-087',
    name: 'Social Science',
    code: '087',
    category: 'Social Science',
    color: '#d97706', // Amber/Orange
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: 'Globe',
    totalChapters: 22,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      // POLITICAL SCIENCE - Democratic Politics II (Unit Weightage: 20 Marks)
      {
        id: 'sst-ch1',
        number: 1,
        title: 'Power Sharing',
        unitName: 'Political Science - Democratic Politics II',
        unitWeightageMarks: 20,
        topics: ['Belgian and Sri Lankan Case Studies', 'Majoritarianism in Sri Lanka vs Accommodation in Belgium', 'Why is Power Sharing Desirable? (Prudential vs Moral)', 'Forms of Power Sharing (Horizontal, Vertical, Social groups, Parties/Pressure groups)'],
        keyFormulasOrConcepts: ['Horizontal (Legislature, Executive, Judiciary)', 'Vertical (Central, State, Local)']
      },
      {
        id: 'sst-ch2',
        number: 2,
        title: 'Federalism',
        unitName: 'Political Science - Democratic Politics II',
        unitWeightageMarks: 20,
        topics: ['What is Federalism & Key Features', 'Coming Together vs Holding Together Federations', 'What makes India a Federal Country? (Union, State, Concurrent Lists)', 'Decentralisation in India (73rd & 74th Amendments, Panchayati Raj)'],
        keyFormulasOrConcepts: ['3-tier Governance', 'Union List, State List, Concurrent List, Residuary Subjects']
      },
      {
        id: 'sst-ch3',
        number: 3,
        title: 'Gender, Religion and Caste',
        unitName: 'Political Science - Democratic Politics II',
        unitWeightageMarks: 20,
        topics: ['Gender and Politics: Sexual division of labour, Women’s political representation', 'Religion, Communalism and Politics: Communalism & Secular State', 'Caste and Politics: Caste in politics & Politics in caste'],
        keyFormulasOrConcepts: ['Feminist Movements', 'Secular State under Indian Constitution', 'Caste Hierarchy & Affirmative Action']
      },
      {
        id: 'sst-ch4',
        number: 4,
        title: 'Political Parties',
        unitName: 'Political Science - Democratic Politics II',
        unitWeightageMarks: 20,
        topics: ['Why do we need Political Parties? Functions & Components', 'How many parties should we have? (One-party, Two-party, Multi-party system)', 'National Parties vs State/Regional Parties (Election Commission Criteria)', 'Challenges to Political Parties (Lack of internal democracy, Dynastic succession, Money & Muscle power, Meaningful choice)', 'How can parties be reformed?'],
        keyFormulasOrConcepts: ['National Party Criteria (6% votes in Lok Sabha / 4 states + 4 seats)', 'Anti-Defection Law']
      },
      {
        id: 'sst-ch5',
        number: 5,
        title: 'Outcomes of Democracy',
        unitName: 'Political Science - Democratic Politics II',
        unitWeightageMarks: 20,
        topics: ['How do we assess democracy’s outcomes?', 'Accountable, responsive and legitimate government', 'Economic growth and development', 'Reduction of inequality and poverty', 'Accommodation of social diversity', 'Dignity and freedom of the citizens'],
        keyFormulasOrConcepts: ['Legitimate Government', 'Rule of Law & Deliberation']
      },

      // HISTORY - India and the Contemporary World II (Unit Weightage: 20 Marks)
      {
        id: 'sst-ch6',
        number: 6,
        title: 'The Rise of Nationalism in Europe',
        unitName: 'History - India and the Contemporary World II',
        unitWeightageMarks: 20,
        topics: ['French Revolution & Idea of Nation', 'Making of Nationalism in Europe', 'Age of Revolutions: 1830-1848', 'Unification of Germany and Italy', 'Visualising the Nation & Imperialism'],
        keyFormulasOrConcepts: ['Napoleonic Code 1804', 'Zollverein Customs Union', 'Garibaldi & Bismarck']
      },
      {
        id: 'sst-ch7',
        number: 7,
        title: 'Nationalism in India',
        unitName: 'History - India and the Contemporary World II',
        unitWeightageMarks: 20,
        topics: ['First World War, Khilafat and Non-Cooperation Movement', 'Differing Strands within the Movement', 'Towards Civil Disobedience & Salt March', 'Sense of Collective Belonging'],
        keyFormulasOrConcepts: ['Satyagraha Philosophy', 'Jallianwala Bagh Massacre 1919', 'Poona Pact 1932']
      },
      {
        id: 'sst-ch8',
        number: 8,
        title: 'The Making of a Global World',
        unitName: 'History - India and the Contemporary World II',
        unitWeightageMarks: 20,
        topics: ['Pre-modern World & Silk Routes (Board Exam Scope)', 'Nineteenth Century (1815-1914) & World Economy', 'Interwar Economy & Great Depression (Periodic Test Scope)', 'Rebuilding a World Economy: Post-war Era (Bretton Woods)'],
        keyFormulasOrConcepts: ['Silk Routes Connecting Asia to Europe', 'Rinderpest/Cattle Plague in Africa', 'IMF & World Bank (Bretton Woods Twins)']
      },
      {
        id: 'sst-ch9',
        number: 9,
        title: 'The Age of Industrialisation',
        unitName: 'History - India and the Contemporary World II',
        unitWeightageMarks: 20,
        topics: ['Before the Industrial Revolution (Proto-industrialisation)', 'Hand Labour and Steam Power', 'Industrialisation in the Colonies & Indian Textiles', 'Factories Come Up & Peculiarities of Industrial Growth', 'Market for Goods & Advertisements'],
        keyFormulasOrConcepts: ['Spinning Jenny invention', 'Gomasthas paid servants', 'Jobbers recruiting workers']
      },
      {
        id: 'sst-ch10',
        number: 10,
        title: 'Print Culture and the Modern World',
        unitName: 'History - India and the Contemporary World II',
        unitWeightageMarks: 20,
        topics: ['First Printed Books in East Asia', 'Print comes to Europe & Gutenberg Press', 'Print Revolution and its impact', 'Reading Mania & Print in India'],
        keyFormulasOrConcepts: ['Gutenberg Bible 1455', 'Vernacular Press Act 1878', 'Sambad Kaumudi by Raja Rammohun Roy']
      },

      // GEOGRAPHY - Contemporary India II (Unit Weightage: 20 Marks)
      {
        id: 'sst-ch11',
        number: 11,
        title: 'Resources and Development',
        unitName: 'Geography - Contemporary India II',
        unitWeightageMarks: 20,
        topics: ['Types of Resources & Planning in India', 'Land Resources & Land Use Pattern', 'Land Degradation and Conservation Measures', 'Soil as a Resource & Classification of Soils in India'],
        keyFormulasOrConcepts: ['Sustainable Development', 'Alluvial, Black, Red & Yellow, Laterite, Arid Soils']
      },
      {
        id: 'sst-ch12',
        number: 12,
        title: 'Forest and Wildlife Resources',
        unitName: 'Geography - Contemporary India II',
        unitWeightageMarks: 20,
        topics: ['Flora and Fauna in India & Biodiversity', 'Conservation of Forest and Wildlife in India', 'Project Tiger & Biosphere Reserves', 'Types and Distribution of Forests (Reserved, Protected, Unclassed)', 'Community and Conservation (Chipko Movement, JFM)'],
        keyFormulasOrConcepts: ['Project Tiger 1973', 'Joint Forest Management (JFM)', 'Sacred Groves (Sacred Groves of Bishnois)']
      },
      {
        id: 'sst-ch13',
        number: 13,
        title: 'Water Resources',
        unitName: 'Geography - Contemporary India II',
        unitWeightageMarks: 20,
        topics: ['Water Scarcity and need for conservation', 'Multi-Purpose River Projects & Integrated Watershed Management', 'Rainwater Harvesting (Rooftop, Khadins, Johads, Bamboo Drip)'],
        keyFormulasOrConcepts: ['Dams as Temples of Modern India', 'Rooftop rainwater harvesting in Tamil Nadu']
      },
      {
        id: 'sst-ch14',
        number: 14,
        title: 'Agriculture',
        unitName: 'Geography - Contemporary India II',
        unitWeightageMarks: 20,
        topics: ['Types of Farming: Primitive Subsistence, Intensive Subsistence, Commercial', 'Cropping Pattern: Rabi, Kharif, Zaid', 'Major Crops: Rice, Wheat, Millets, Sugarcane, Tea, Coffee, Cotton, Jute', 'Technological and Institutional Reforms'],
        keyFormulasOrConcepts: ['Bhoodan-Gramdan Movement by Vinoba Bhave', 'Kharif (Monsoon) vs Rabi (Winter)']
      },
      {
        id: 'sst-ch15',
        number: 15,
        title: 'Minerals and Energy Resources',
        unitName: 'Geography - Contemporary India II',
        unitWeightageMarks: 20,
        topics: ['Mode of occurrence of Minerals', 'Ferrous Minerals (Iron Ore, Manganese)', 'Non-Ferrous Minerals (Copper, Bauxite)', 'Non-Metallic Minerals (Mica) & Rock Minerals', 'Conventional Energy (Coal, Petroleum, Natural Gas)', 'Non-Conventional Energy (Solar, Wind, Nuclear, Biogas, Tidal, Geothermal)', 'Conservation of Energy Resources'],
        keyFormulasOrConcepts: ['Kudremukh & Bailadila iron ore mines', 'HBJ Gas Pipeline', 'Bhakra Nangal & Tarapur']
      },
      {
        id: 'sst-ch16',
        number: 16,
        title: 'Manufacturing Industries',
        unitName: 'Geography - Contemporary India II',
        unitWeightageMarks: 20,
        topics: ['Importance of Manufacturing & GDP contribution', 'Industrial Location Factors & Agglomeration Economies', 'Classification of Industries', 'Agro-based Industries (Textile, Sugar)', 'Mineral-based Industries (Iron & Steel, Aluminium, Chemical, Fertilizer, Cement, Automobile, IT & Electronics)', 'Industrial Pollution and Environmental Degradation'],
        keyFormulasOrConcepts: ['Agglomeration Economies', 'Chota Nagpur Plateau steel hub', 'NTPC Sustainable Guidelines']
      },
      {
        id: 'sst-ch17',
        number: 17,
        title: 'Lifelines of National Economy',
        unitName: 'Geography - Contemporary India II',
        unitWeightageMarks: 20,
        topics: ['Transport: Roadways (Golden Quadrilateral, Expressways), Railways, Waterways & Airways', 'Major Sea Ports & Airports of India', 'Communication Networks (Digital India, Postal, Telecom)', 'International Trade & Tourism as a Trade'],
        keyFormulasOrConcepts: ['Golden Quadrilateral (NHAI)', 'National Waterways NW-1 & NW-2', 'Balance of Trade']
      },

      // ECONOMICS - Understanding Economic Development (Unit Weightage: 20 Marks)
      {
        id: 'sst-ch18',
        number: 18,
        title: 'Development',
        unitName: 'Economics - Understanding Economic Development',
        unitWeightageMarks: 20,
        topics: ['What Development Promises - Different People, Different Goals', 'Income and Other Goals', 'National Development & Per Capita Income (World Bank Criterion)', 'Income and Human Development Index (HDI)', 'Sustainability of Development'],
        keyFormulasOrConcepts: ['Per Capita Income = Total Income / Total Population', 'HDI parameters (Life expectancy, Literacy, Per capita GNI)']
      },
      {
        id: 'sst-ch19',
        number: 19,
        title: 'Sectors of the Indian Economy',
        unitName: 'Economics - Understanding Economic Development',
        unitWeightageMarks: 20,
        topics: ['Sectors of Economic Activities: Primary, Secondary, Tertiary', 'Comparing the 3 Sectors & GDP calculation', 'Organised vs Unorganised Sectors', 'Public vs Private Sectors', 'MGNREGA 2005 features'],
        keyFormulasOrConcepts: ['GDP = Value of all final goods & services', 'MGNREGA 100 days guaranteed employment']
      },
      {
        id: 'sst-ch20',
        number: 20,
        title: 'Money and Credit',
        unitName: 'Economics - Understanding Economic Development',
        unitWeightageMarks: 20,
        topics: ['Money as a medium of exchange & Double coincidence of wants', 'Modern forms of money: Currency notes & Demand deposits', 'Loan activities of Banks & Credit arrangements', 'Formal Sector Credit in India vs Informal Sector', 'Self Help Groups (SHGs) for the Poor'],
        keyFormulasOrConcepts: ['Role of RBI in monitoring banks', 'Collateral requirement', 'NABARD & SHGs']
      },
      {
        id: 'sst-ch21',
        number: 21,
        title: 'Globalisation and the Indian Economy',
        unitName: 'Economics - Understanding Economic Development',
        unitWeightageMarks: 20,
        topics: ['Production across countries & Multinational Corporations (MNCs)', 'Interlinking production across countries', 'Foreign Trade and Integration of Markets', 'What is Globalisation? Factors enabling Globalisation (IT, Transportation)', 'World Trade Organisation (WTO) & Impact of Globalisation in India', 'The Struggle for a Fair Globalisation'],
        keyFormulasOrConcepts: ['SEZs (Special Economic Zones)', 'Trade Barriers & Liberalisation 1991', 'WTO Fair Trade']
      },
      {
        id: 'sst-ch22',
        number: 22,
        title: 'Consumer Rights',
        unitName: 'Economics - Understanding Economic Development',
        unitWeightageMarks: 20,
        topics: ['The Consumer in the Marketplace & Need for Protection', 'Consumer Movement in India & COPRA 1986 / Consumer Protection Act 2019', 'Consumer Rights: Right to Safety, Right to Information, Right to Choose, Right to Redressal, Right to Represent', 'Taking the consumer movement forward & Certification Marks (ISI, Agmark, Hallmark)'],
        keyFormulasOrConcepts: ['COPRA 3-tier quasi-judicial machinery (District, State, National Commissions)', 'National Consumer Day Dec 24', 'Hallmark / AGMARK']
      }
    ]
  },
  {
    id: 'english-184',
    name: 'English Language & Literature',
    code: '184',
    category: 'Languages',
    color: '#8b5cf6', // Purple
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: 'BookOpen',
    totalChapters: 30,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      {
        id: 'eng-sec-a',
        number: 1,
        title: 'Reading Skills (Unseen Passages)',
        unitName: 'Section A - Reading Skills',
        unitWeightageMarks: 20,
        topics: ['Discursive Passage (400-450 words) with MCQs and Short Answer questions', 'Case-based Factual Passage (with visual input/data/chart 200-250 words)'],
        keyFormulasOrConcepts: ['Inference, Vocabulary in context, Title identification']
      },
      {
        id: 'eng-sec-b',
        number: 2,
        title: 'Writing Skills & Grammar',
        unitName: 'Section B - Writing Skills & Grammar',
        unitWeightageMarks: 20,
        topics: ['Formal Letter (Letter to Editor, Complaint, Order, Inquiry) - 100-120 words', 'Analytical Paragraph based on given map/chart/graph/cue - 100-120 words', 'Integrated Grammar: Tenses, Modals, Subject-Verb Concord, Reported Speech, Determiners'],
        keyFormulasOrConcepts: ['Format of Formal Letter', 'Analytical Paragraph structure: Intro, Body analysis, Conclusion']
      },

      // FIRST FLIGHT - PROSE
      {
        id: 'eng-ch1',
        number: 3,
        title: 'First Flight: A Letter to God',
        unitName: 'Section C - Literature (First Flight Prose)',
        unitWeightageMarks: 40,
        topics: ['Lencho’s faith in God & hail storm destruction', 'Irony of the postmaster and post office employees'],
        keyFormulasOrConcepts: ['Unshakable Faith, Irony of situation, Human kindness']
      },
      {
        id: 'eng-ch2',
        number: 4,
        title: 'First Flight: Nelson Mandela - Long Walk to Freedom',
        unitName: 'Section C - Literature (First Flight Prose)',
        unitWeightageMarks: 40,
        topics: ['Inauguration ceremony at Union Buildings Amphitheatre', 'Concept of Courage, Freedom, and Anti-Apartheid struggle', 'Twin obligations to family and country'],
        keyFormulasOrConcepts: ['Courage is victory over fear', 'Twin obligations under Apartheid']
      },
      {
        id: 'eng-ch3',
        number: 5,
        title: 'First Flight: Two Stories About Flying',
        unitName: 'Section C - Literature (First Flight Prose)',
        unitWeightageMarks: 40,
        topics: ['[A] His First Flight: Young Seagull overcoming fear of flying with mother’s aid', '[B] Black Aeroplane: Mysterious pilot guiding Dakota through storm clouds'],
        keyFormulasOrConcepts: ['Conquering self-doubt & fear', 'Faith and mysterious aid in crisis']
      },
      {
        id: 'eng-ch4',
        number: 6,
        title: 'First Flight: From the Diary of Anne Frank',
        unitName: 'Section C - Literature (First Flight Prose)',
        unitWeightageMarks: 40,
        topics: ['Life in Secret Annex during Holocaust', 'Anne’s relationship with her diary Kitty', 'Humorous essays assigned by Mr. Keesing ("A Chatterbox")'],
        keyFormulasOrConcepts: ['Paper has more patience than people', 'Wit and humor in adverse times']
      },
      {
        id: 'eng-ch5',
        number: 7,
        title: 'First Flight: Glimpses of India',
        unitName: 'Section C - Literature (First Flight Prose)',
        unitWeightageMarks: 40,
        topics: ['[A] A Baker from Goa: Traditional Pader and furnace baking culture', '[B] Coorg: Martial tradition, coffee plantations, and wildlife', '[C] Tea from Assam: Rajvir & Pranjol discovering legends of tea origin'],
        keyFormulasOrConcepts: ['Cultural heritage of Goa, Coorg & Assam', 'Tradition and local identity']
      },
      {
        id: 'eng-ch6',
        number: 8,
        title: 'First Flight: Mijbil the Otter',
        unitName: 'Section C - Literature (First Flight Prose)',
        unitWeightageMarks: 40,
        topics: ['Gavin Maxwell bringing Mijbil from Basra to London', 'Otter antics, games with ping-pong balls', 'Transporting Mijbil safely in airplane box'],
        keyFormulasOrConcepts: ['Bonding between humans and pets', 'Responsibility of pet ownership']
      },
      {
        id: 'eng-ch7',
        number: 9,
        title: 'First Flight: Madam Rides the Bus',
        unitName: 'Section C - Literature (First Flight Prose)',
        unitWeightageMarks: 40,
        topics: ['8-year-old Valli’s desire and meticulously planned bus ride', 'Self-respect, independence, and observation of life', 'Impact of seeing the dead cow on her voyage back'],
        keyFormulasOrConcepts: ['Maturity, curiosity, and realization of death']
      },
      {
        id: 'eng-ch8',
        number: 10,
        title: 'First Flight: The Sermon at Benares',
        unitName: 'Section C - Literature (First Flight Prose)',
        unitWeightageMarks: 40,
        topics: ['Gautama Buddha’s first sermon at Benares', 'Kisa Gotami’s grief over dead son & search for mustard seed', 'Inevitability and universality of death'],
        keyFormulasOrConcepts: ['Mortality of human life', 'Overcoming grief through wisdom']
      },
      {
        id: 'eng-ch9',
        number: 11,
        title: 'First Flight: The Proposal',
        unitName: 'Section C - Literature (First Flight Prose)',
        unitWeightageMarks: 40,
        topics: ['One-act farce by Anton Chekhov', 'Lomov proposing to Natalya Stepanovna', 'Petty quarrels over Oxen Meadows and hunting dogs (Guess vs Squeezer)'],
        keyFormulasOrConcepts: ['Satire on mercenary marriage proposals', 'Human stubbornness and pride']
      },

      // FIRST FLIGHT - POEMS
      {
        id: 'eng-p1',
        number: 12,
        title: 'Poem: Dust of Snow',
        unitName: 'Section C - Literature (First Flight Poetry)',
        unitWeightageMarks: 40,
        topics: ['Robert Frost’s poem on nature’s uplifting power', 'Crow shaking dust of snow from hemlock tree onto poet', 'Shift in mood from sadness to optimism'],
        keyFormulasOrConcepts: ['Symbolism of Crow and Hemlock Tree', 'Nature healing human despair']
      },
      {
        id: 'eng-p2',
        number: 13,
        title: 'Poem: Fire and Ice',
        unitName: 'Section C - Literature (First Flight Poetry)',
        unitWeightageMarks: 40,
        topics: ['Fire representing uncontrollable desire and greed', 'Ice representing hatred, coldness, and indifference', 'Dual destructive forces capable of ending world'],
        keyFormulasOrConcepts: ['Metaphorical destruction', 'Control over human emotions']
      },
      {
        id: 'eng-p3',
        number: 14,
        title: 'Poem: A Tiger in the Zoo',
        unitName: 'Section C - Literature (First Flight Poetry)',
        unitWeightageMarks: 40,
        topics: ['Contrast between caged tiger in concrete cell vs wild tiger in jungle', 'Suppressed rage and helplessness of captive animals'],
        keyFormulasOrConcepts: ['Animal rights and freedom vs captivity', 'Imagery & personification']
      },
      {
        id: 'eng-p4',
        number: 15,
        title: 'Poem: How to Tell Wild Animals',
        unitName: 'Section C - Literature (First Flight Poetry)',
        unitWeightageMarks: 40,
        topics: ['Humorous descriptions of dangerous beasts: Asian Lion, Bengal Tiger, Leopard, Bear, Crocodile, Hyena, Chameleon'],
        keyFormulasOrConcepts: ['Humorous stanza structure', 'Poetic license and vivid imagery']
      },
      {
        id: 'eng-p5',
        number: 16,
        title: 'Poem: The Ball Poem',
        unitName: 'Section C - Literature (First Flight Poetry)',
        unitWeightageMarks: 40,
        topics: ['Boy losing his ball into the harbor water', 'Epistemology of loss & understanding responsibility', 'Learning to cope with loss in a materialistic world'],
        keyFormulasOrConcepts: ['Loss as an inevitable part of growing up', 'Symbolism of the lost ball']
      },
      {
        id: 'eng-p6',
        number: 17,
        title: 'Poem: Amanda!',
        unitName: 'Section C - Literature (First Flight Poetry)',
        unitWeightageMarks: 40,
        topics: ['Constant nagging of Amanda by her parent', 'Amanda escaping into daydreaming as a Mermaid, Orphan, Rapunzel'],
        keyFormulasOrConcepts: ['Need for creative freedom for children', 'Parental over-control vs child psychology']
      },
      {
        id: 'eng-p7',
        number: 18,
        title: 'Poem: The Trees',
        unitName: 'Section C - Literature (First Flight Poetry)',
        unitWeightageMarks: 40,
        topics: ['Trees breaking out of artificial indoor houses to move back to forest', 'Metaphor for women’s liberation and ecological restoration'],
        keyFormulasOrConcepts: ['Personification of trees', 'Reclaiming natural space and freedom']
      },
      {
        id: 'eng-p8',
        number: 19,
        title: 'Poem: Fog',
        unitName: 'Section C - Literature (First Flight Poetry)',
        unitWeightageMarks: 40,
        topics: ['Carl Sandburg’s minimalist poem describing fog coming on little cat feet', 'Silent arrival, sitting looking over harbor, and moving on'],
        keyFormulasOrConcepts: ['Extended metaphor of cat', 'Imagery in free verse']
      },
      {
        id: 'eng-p9',
        number: 20,
        title: 'Poem: The Tale of Custard the Dragon',
        unitName: 'Section C - Literature (First Flight Poetry)',
        unitWeightageMarks: 40,
        topics: ['Parody ballad of Belinda, Ink (kitten), Blink (mouse), Mustard (dog), and Custard (dragon)', 'Custard crying for safe cage but fearlessly swallowing attacking pirate'],
        keyFormulasOrConcepts: ['True bravery revealed in crisis', 'Ballad rhythm & refrains']
      },
      {
        id: 'eng-p10',
        number: 21,
        title: 'Poem: For Anne Gregory',
        unitName: 'Section C - Literature (First Flight Poetry)',
        unitWeightageMarks: 40,
        topics: ['Dialogue between poet and Anne Gregory', 'Physical attraction to yellow hair vs love for true inner self', 'Only God loves humans unconditionally for themselves alone'],
        keyFormulasOrConcepts: ['External beauty vs internal character', 'Spiritual love']
      },

      // FOOTPRINTS WITHOUT FEET - SUPPLEMENTARY READER
      {
        id: 'eng-fp1',
        number: 22,
        title: 'Footprints: A Triumph of Surgery',
        unitName: 'Section C - Literature (Footprints Without Feet)',
        unitWeightageMarks: 40,
        topics: ['Mrs. Pumphrey’s pampering making Tricki dangerously obese', 'Dr. James Herriot curing Tricki with strict water diet, play, and exercise without medication'],
        keyFormulasOrConcepts: ['Dangers of misplaced affection', 'Practical veterinary wisdom']
      },
      {
        id: 'eng-fp2',
        number: 23,
        title: 'Footprints: The Thief’s Story',
        unitName: 'Section C - Literature (Footprints Without Feet)',
        unitWeightageMarks: 40,
        topics: ['15-year-old thief Hari Singh meeting trusting writer Anil', 'Hari stealing 600 rupees but returning because Anil taught him to read and write'],
        keyFormulasOrConcepts: ['Reformation through trust and education', 'Conscience over greed']
      },
      {
        id: 'eng-fp3',
        number: 24,
        title: 'Footprints: The Midnight Visitor',
        unitName: 'Section C - Literature (Footprints Without Feet)',
        unitWeightageMarks: 40,
        topics: ['Secret agent Ausable appearing sloppy and un-heroic to writer Fowler', 'Ausable outwitting armed rival agent Max with a clever fake story about a balcony'],
        keyFormulasOrConcepts: ['Presence of mind over physical appearance', 'Intelligence in espionage']
      },
      {
        id: 'eng-fp4',
        number: 25,
        title: 'Footprints: A Question of Trust',
        unitName: 'Section C - Literature (Footprints Without Feet)',
        unitWeightageMarks: 40,
        topics: ['Horace Danby stealing once a year to buy rare books', 'Trickery by young lady in red claiming to be owner’s wife', 'Honor among thieves myth broken'],
        keyFormulasOrConcepts: ['Never trust appearances', 'Irony of a thief deceived by another thief']
      },
      {
        id: 'eng-fp5',
        number: 26,
        title: 'Footprints: Footprints Without Feet',
        unitName: 'Section C - Literature (Footprints Without Feet)',
        unitWeightageMarks: 40,
        topics: ['Brilliant scientist Griffin inventing drug to turn human body invisible', 'Misusing science for theft, arson, and terrorizing villagers at Iping inn'],
        keyFormulasOrConcepts: ['Science misused becomes a curse', 'Lawlessness vs social order']
      },
      {
        id: 'eng-fp6',
        number: 27,
        title: 'Footprints: The Making of a Scientist',
        unitName: 'Section C - Literature (Footprints Without Feet)',
        unitWeightageMarks: 40,
        topics: ['Richard Ebright’s journey from collecting butterflies to breakthrough cell research', 'Role of mother, curiosity, perseverance, and Dr. Urquhart’s guidance'],
        keyFormulasOrConcepts: ['Ingredients of a true scientist', 'Scientific curiosity and hard work']
      },
      {
        id: 'eng-fp7',
        number: 28,
        title: 'Footprints: The Necklace',
        unitName: 'Section C - Literature (Footprints Without Feet)',
        unitWeightageMarks: 40,
        topics: ['Matilda Loisel’s discontent with modest middle-class life', 'Borrowing diamond necklace from Mme Forestier, losing it at ball, 10 years of ruinous debt', 'Shocking realization that the original necklace was fake paste'],
        keyFormulasOrConcepts: ['Vanity and false pride lead to ruin', 'Contentment with reality']
      },
      {
        id: 'eng-fp8',
        number: 29,
        title: 'Footprints: Bholi',
        unitName: 'Section C - Literature (Footprints Without Feet)',
        unitWeightageMarks: 40,
        topics: ['Neglected, pock-marked girl Sulekha (Bholi)', 'Teacher’s encouragement transforming Bholi into a confident woman', 'Refusing to marry greedy old groom Bishamber for demanding dowry'],
        keyFormulasOrConcepts: ['Empowerment through female education', 'Standing up against social evils like dowry']
      },
      {
        id: 'eng-fp9',
        number: 30,
        title: 'Footprints: The Book That Saved the Earth',
        unitName: 'Section C - Literature (Footprints Without Feet)',
        unitWeightageMarks: 40,
        topics: ['25th-century Martian invasion force led by arrogant Think-Tank', 'Martians landing in Centerville Public Library', 'Misinterpreting "Mother Goose" nursery rhymes as dangerous Earthling military secrets'],
        keyFormulasOrConcepts: ['Half-baked knowledge is dangerous', 'Humor and satire on arrogance']
      }
    ]
  },
  {
    id: 'it-402',
    name: 'Information Technology',
    code: '402',
    category: 'Other',
    color: '#06b6d4', // Cyan
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: 'Laptop',
    totalChapters: 4,
    standardMarks: 50,
    standardTime: 120,
    chapters: [
      {
        id: 'it-ch1',
        number: 1,
        title: 'Digital Documentation (Advanced)',
        unitName: 'Subject Specific Skills',
        unitWeightageMarks: 12,
        topics: ['Create and Apply Styles in LibreOffice Writer', 'Insert and Use Images', 'Create and Use Template', 'Create and Customize Table of Contents', 'Mail Merge'],
        keyFormulasOrConcepts: ['Styles & Formatting Window (F11)', 'Mail Merge Wizard']
      },
      {
        id: 'it-ch2',
        number: 2,
        title: 'Electronic Spreadsheet (Advanced)',
        unitName: 'Subject Specific Skills',
        unitWeightageMarks: 12,
        topics: ['Analyse data using Scenarios and Goal Seek', 'Link data and worksheets', 'Share and review a spreadsheet', 'Create and use Macros in Spreadsheet'],
        keyFormulasOrConcepts: ['Goal Seek (Tools > Goal Seek)', 'Subtotals & Pivot Tables']
      },
      {
        id: 'it-ch3',
        number: 3,
        title: 'Database Management System (RDBMS)',
        unitName: 'Subject Specific Skills',
        unitWeightageMarks: 12,
        topics: ['Appreciate concepts of Database', 'Create and Edit Tables using Wizard & SQL Commands', 'Perform Operations on Table', 'Create Forms and Reports using Wizard'],
        keyFormulasOrConcepts: ['Primary Key & Foreign Key', 'SQL: SELECT, INSERT, UPDATE, DELETE']
      },
      {
        id: 'it-ch4',
        number: 4,
        title: 'Web Applications and Security',
        unitName: 'Subject Specific Skills',
        unitWeightageMarks: 14,
        topics: ['Working with Accessibility Options', 'Networking Fundamentals (LAN, WAN, Internet, WWW)', 'Introduction to Instant Messaging', 'Online Transactions & E-commerce', 'Internet Security Best Practices & Workplace Safety'],
        keyFormulasOrConcepts: ['Strong Password criteria', 'Firewalls & Antivirus']
      }
    ]
  },
  {
    id: 'hindi-002',
    name: 'Hindi Course A (हिंदी ‘अ’)',
    code: '002',
    category: 'Languages',
    color: '#e11d48', // Rose / Maroon
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: 'BookOpen',
    totalChapters: 8,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      {
        id: 'hin-a-sec-a',
        number: 1,
        title: 'खंड ‘क’ - अपठित बोध (गद्यांश व काव्यांश)',
        unitName: 'खंड ‘क’ - अपठित बोध',
        unitWeightageMarks: 14,
        topics: ['अपठित गद्यांश (चिंतन क्षमता व अभिव्यक्ति आधारित प्रश्न - 7 अंक)', 'अपठित काव्यांश (काव्य सौंदर्य व भावबोध आधारित प्रश्न - 7 अंक)'],
        keyFormulasOrConcepts: ['शीर्षक चयन', 'केंद्रीय भाव', 'शब्दावली एवं भावार्थ']
      },
      {
        id: 'hin-a-sec-b',
        number: 2,
        title: 'खंड ‘ख’ - व्यावहारिक व्याकरण',
        unitName: 'खंड ‘ख’ - व्यावहारिक व्याकरण',
        unitWeightageMarks: 16,
        topics: ['रचना के आधार पर वाक्य भेद (सरल, संयुक्त, मिश्र)', 'वाच्य (कर्तृवाच्य, कर्मवाच्य, भाववाच्य)', 'पद परिचय (संज्ञा, सर्वनाम, विशेषण, क्रिया, अव्यय)', 'अलंकार (शलेष, उत्प्रेक्षा, अतिशयोक्ति, मानवीकरण)'],
        keyFormulasOrConcepts: ['वाक्य रूपांतरण नियम', 'वाच्य परिवर्तन', 'पद परिचय के 5 अनिवार्य अंग', 'अलंकार की पहचान']
      },
      {
        id: 'hin-a-ch1',
        number: 3,
        title: 'क्षितिज गद्य: नेताजी का चश्मा (स्वयं प्रकाश)',
        unitName: 'खंड ‘ग’ - पाठ्यपुस्तक क्षितिज भाग-2 (गद्य)',
        unitWeightageMarks: 17,
        topics: ['हालदार साहब और कैप्टन चश्मेवाले का देशप्रेम', 'मूर्तिकार मास्टर मोतीलाल की भूल और सरकंडे का चश्मा', 'देशभक्ति की सच्ची परिभाषा'],
        keyFormulasOrConcepts: ['कैप्टन का देशप्रेम', 'सरकंडे का चश्मा - नई पीढ़ी की आशा']
      },
      {
        id: 'hin-a-ch2',
        number: 4,
        title: 'क्षितिज गद्य: बालगोबिन भगत (रामवृक्ष बेनीपुरी)',
        unitName: 'खंड ‘ग’ - पाठ्यपुस्तक क्षितिज भाग-2 (गद्य)',
        unitWeightageMarks: 17,
        topics: ['बालगोबिन भगत का कबीरपंथी स्वरूप व गृहस्थ साधु जीवन', 'सामाजिक कुरीतियों का विरोध (पतोहू का पुनर्विवाह)', 'संगीत साधना और प्रभातियाँ'],
        keyFormulasOrConcepts: ['गृहस्थ संन्यासी', 'रूढ़ियों का प्रहार', 'खंजड़ी और कबीर के पद']
      },
      {
        id: 'hin-a-ch3',
        number: 5,
        title: 'क्षितिज पद्य: सूरदास के पद',
        unitName: 'खंड ‘ग’ - पाठ्यपुस्तक क्षितिज भाग-2 (पद्य)',
        unitWeightageMarks: 17,
        topics: ['गोपियों का उद्धव पर व्यंग्य (उधौ, तुम्ह हौ अति बड़भागी)', 'प्रेम मार्ग बनाम योग मार्ग (ज्ञान मार्ग पर प्रेम की विजय)', 'कमल के पत्ते और तेल की गागर का दृष्टांत'],
        keyFormulasOrConcepts: ['भ्रमरगीत परंपरा', 'अनन्य कृष्ण प्रेम', 'दृष्टांत व वक्रोक्ति अलंकार']
      },
      {
        id: 'hin-a-ch4',
        number: 6,
        title: 'क्षितिज पद्य: राम-लक्ष्मण-परशुराम संवाद (तुलसीदास)',
        unitName: 'खंड ‘ग’ - पाठ्यपुस्तक क्षितिज भाग-2 (पद्य)',
        unitWeightageMarks: 17,
        topics: ['धनुष भंग के उपरांत परशुराम का क्रोध', 'लक्ष्मण के व्यंग्य बाण एवं परशुराम का संवाद', 'अवधी भाषा, चौपाई और दोहा छंद सौंदर्य'],
        keyFormulasOrConcepts: ['रौद्र रस व हास्य-व्यंग्य', 'कुम्हड़बतिया का दृष्टांत', 'चौपाई-दोहा छंद']
      },
      {
        id: 'hin-a-ch5',
        number: 7,
        title: 'पूरक पुस्तक कृतिका: माता का अँचल (शिवपूजन सहाय)',
        unitName: 'खंड ‘ग’ - पूरक पुस्तक कृतिका भाग-2',
        unitWeightageMarks: 6,
        topics: ['ग्रामीण अंचल का बाल जीवन, खेल और पिता-पुत्र का स्नेह', 'विपदा के समय माँ के आँचल में शरण', 'तत्कालीन ग्रामीण संस्कृति एवं वात्सल्य रस'],
        keyFormulasOrConcepts: ['शैशव की स्मृतियाँ', 'मातृ स्नेह की पराकाष्ठा', 'भोलानाथ और साथियों के खेल']
      },
      {
        id: 'hin-a-sec-d',
        number: 8,
        title: 'खंड ‘घ’ - रचनात्मक लेखन (अनुच्छेद, पत्र, ई-मेल, विज्ञापन, संदेश)',
        unitName: 'खंड ‘घ’ - रचनात्मक लेखन',
        unitWeightageMarks: 20,
        topics: ['अनुच्छेद लेखन (120 शब्द - 5 अंक)', 'औपचारिक/अनौपचारिक पत्र लेखन (100 शब्द - 5 अंक)', 'ई-मेल अथवा स्ववृत्त लेखन (5 अंक)', 'विज्ञापन लेखन अथवा संदेश लेखन (5 अंक)'],
        keyFormulasOrConcepts: ['प्रारूप (Format) की शुद्धता', 'विषय-वस्तु की सुसंबद्धता', 'प्रभावशाली भाषा शैली']
      }
    ]
  },
  {
    id: 'hindi-085',
    name: 'Hindi Course B (हिंदी ‘ब’)',
    code: '085',
    category: 'Languages',
    color: '#d97706', // Amber / Orange
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: 'BookOpen',
    totalChapters: 7,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      {
        id: 'hin-b-sec-a',
        number: 1,
        title: 'खंड ‘क’ - अपठित गद्यांश बोध',
        unitName: 'खंड ‘क’ - अपठित बोध',
        unitWeightageMarks: 14,
        topics: ['दो अपठित गद्यांश (चिंतन, समझ और विश्लेषण आधारित लघुउत्तरीय व बहुविकल्पीय प्रश्न)'],
        keyFormulasOrConcepts: ['शीर्षक चयन', 'तथ्यात्मक बोध', 'निष्कर्षपरक उत्तर']
      },
      {
        id: 'hin-b-sec-b',
        number: 2,
        title: 'खंड ‘ख’ - व्यावहारिक व्याकरण',
        unitName: 'खंड ‘ख’ - व्यावहारिक व्याकरण',
        unitWeightageMarks: 16,
        topics: ['पदबंध (संज्ञा, सर्वनाम, विशेषण, क्रिया, क्रियाविशेषण पदबंध)', 'रचना के आधार पर वाक्य रूपांतरण (सरल, संयुक्त, मिश्र)', 'समास (तत्पुरुष, कर्मधारय, द्विगु, द्वंद्व, बहुव्रीहि, अव्ययीभाव)', 'मुहावरे (अर्थ व वाक्य प्रयोग)'],
        keyFormulasOrConcepts: ['पदबंध शीर्ष पद पहचान', 'समास विग्रह व भेद', 'मुहावरों का सटीक संदर्भ']
      },
      {
        id: 'hin-b-ch1',
        number: 3,
        title: 'स्पर्श गद्य: बड़े भाई साहब (प्रेमचंद)',
        unitName: 'खंड ‘ग’ - पाठ्यपुस्तक स्पर्श भाग-2 (गद्य)',
        unitWeightageMarks: 17,
        topics: ['शिक्षा प्रणाली पर तीखा व्यंग्य (रटंत विद्या बनाम व्यावहारिक अनुभव)', 'बड़े भाई का बड़प्पन और कर्तव्यबोध', 'अनुभव की महत्ता'],
        keyFormulasOrConcepts: ['रटंत प्रणाली की विसंगति', 'भ्रातृ-प्रेम और त्याग']
      },
      {
        id: 'hin-b-ch2',
        number: 4,
        title: 'स्पर्श गद्य: डायरी का एक पन्ना (सीताराम सेकसरिया)',
        unitName: 'खंड ‘ग’ - पाठ्यपुस्तक स्पर्श भाग-2 (गद्य)',
        unitWeightageMarks: 17,
        topics: ['26 जनवरी 1931 को कलकत्ता में स्वतंत्रता दिवस आयोजन', 'महिलाओं का अप्रतिम योगदान और पुलिसिया दमन', 'आंदोलन की सजीव रिपोर्टिंग'],
        keyFormulasOrConcepts: ['ऐतिहासिक दस्तावेज', 'महिला सशक्तिकरण व जनआंदोलन']
      },
      {
        id: 'hin-b-ch3',
        number: 5,
        title: 'स्पर्श पद्य: कबीर की साखी',
        unitName: 'खंड ‘ग’ - पाठ्यपुस्तक स्पर्श भाग-2 (पद्य)',
        unitWeightageMarks: 17,
        topics: ['मीठी वाणी का प्रभाव (ऐसी बानी बोलिए...)', 'कस्तूरी कुंडल बसै (ईश्वर की घट-घट में व्याप्ति)', 'अहंकार का त्याग और गुरु की महत्ता'],
        keyFormulasOrConcepts: ['सधुक्कड़ी भाषा', 'आडंबरों का विरोध', 'दोहा छंद']
      },
      {
        id: 'hin-b-ch4',
        number: 6,
        title: 'संचयन: हरिहर काका (मिथिलेश्वर)',
        unitName: 'खंड ‘ग’ - पूरक पुस्तक संचयन भाग-2',
        unitWeightageMarks: 6,
        topics: ['पारिवारिक स्वार्थ, रिश्तों की संवेदनहीनता और संपत्ति का लालच', 'धर्मस्थलों (ठाकुरबारी) के महंतों का पाखंड', 'वृद्धों की असहाय स्थिति'],
        keyFormulasOrConcepts: ['सामाजिक यथार्थ', 'धर्म का आडंबर', 'हरिहर काका का मौन']
      },
      {
        id: 'hin-b-sec-d',
        number: 7,
        title: 'खंड ‘घ’ - रचनात्मक लेखन (अनुच्छेद, पत्र, सूचना, विज्ञापन, लघुकथा/ई-मेल)',
        unitName: 'खंड ‘घ’ - रचनात्मक लेखन',
        unitWeightageMarks: 20,
        topics: ['अनुच्छेद लेखन (100 शब्द - 5 अंक)', 'औपचारिक पत्र लेखन (100 शब्द - 5 अंक)', 'सूचना लेखन (50 शब्द - 4 अंक)', 'विज्ञापन लेखन (50 शब्द - 3 अंक)', 'लघुकथा अथवा ई-मेल लेखन (100 शब्द - 3 अंक)'],
        keyFormulasOrConcepts: ['प्रारूप की शुद्धता', 'संक्षिप्तता एवं स्पष्टता', 'रचनात्मक प्रस्तुति']
      }
    ]
  }
];

// Combined list for universal lookups, preserving Class 10 as default
export { 
  CBSE_CLASS_3_SUBJECTS,
  CBSE_CLASS_4_SUBJECTS,
  CBSE_CLASS_5_SUBJECTS, 
  CBSE_CLASS_6_SUBJECTS, 
  CBSE_CLASS_7_SUBJECTS, 
  CBSE_CLASS_8_SUBJECTS, 
  CBSE_CLASS_9_SUBJECTS, 
  CBSE_CLASS_11_SUBJECTS, 
  CBSE_CLASS_12_SUBJECTS 
};
export const CBSE_SUBJECTS: Subject[] = [
  ...CBSE_CLASS_10_SUBJECTS,
  ...CBSE_CLASS_9_SUBJECTS,
  ...CBSE_CLASS_8_SUBJECTS,
  ...CBSE_CLASS_7_SUBJECTS,
  ...CBSE_CLASS_6_SUBJECTS,
  ...CBSE_CLASS_5_SUBJECTS,
  ...CBSE_CLASS_4_SUBJECTS,
  ...CBSE_CLASS_3_SUBJECTS,
  ...CBSE_CLASS_11_SUBJECTS,
  ...CBSE_CLASS_12_SUBJECTS
];

export function getSubjectsByClass(classLevel: '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'all'): Subject[] {
  if (classLevel === '3') return CBSE_CLASS_3_SUBJECTS;
  if (classLevel === '4') return CBSE_CLASS_4_SUBJECTS;
  if (classLevel === '5') return CBSE_CLASS_5_SUBJECTS;
  if (classLevel === '6') return CBSE_CLASS_6_SUBJECTS;
  if (classLevel === '7') return CBSE_CLASS_7_SUBJECTS;
  if (classLevel === '8') return CBSE_CLASS_8_SUBJECTS;
  if (classLevel === '9') return CBSE_CLASS_9_SUBJECTS;
  if (classLevel === '10') return CBSE_CLASS_10_SUBJECTS;
  if (classLevel === '11') return CBSE_CLASS_11_SUBJECTS;
  if (classLevel === '12') return CBSE_CLASS_12_SUBJECTS;
  return CBSE_SUBJECTS;
}

export const PRELOADED_QUESTIONS: Question[] = [
  // Science - Chemical Reactions (ch1)
  {
    id: 'q-sci-1',
    subjectId: 'science-086',
    chapterId: 'sci-ch1',
    chapterName: 'Chemical Reactions and Equations',
    type: 'mcq',
    marks: 1,
    difficulty: 'easy',
    isCompetency: true,
    questionText: 'When aqueous solutions of potassium iodide and lead nitrate are mixed, an insoluble yellow precipitate is formed. What is the chemical formula of the yellow precipitate?',
    options: ['A) KNO3', 'B) PbI2', 'C) Pb(NO3)2', 'D) KI'],
    correctAnswer: 'B) PbI2',
    markingScheme: '1 Mark for correctly identifying PbI2 (Lead Iodide) as the yellow precipitate.',
    explanation: '2KI (aq) + Pb(NO3)2 (aq) → PbI2 (s)↓ (Yellow precipitate) + 2KNO3 (aq).',
    pyqYear: 2024
  },
  {
    id: 'q-sci-2',
    subjectId: 'science-086',
    chapterId: 'sci-ch1',
    chapterName: 'Chemical Reactions and Equations',
    type: 'ar',
    marks: 1,
    difficulty: 'medium',
    isCompetency: true,
    questionText: 'Assertion (A): Decomposition of calcium carbonate into quicklime and carbon dioxide is an endothermic reaction.\nReason (R): Endothermic reactions absorb thermal energy from the surroundings to break chemical bonds.',
    options: [
      'A) Both A and R are true and R is the correct explanation of A.',
      'B) Both A and R are true but R is NOT the correct explanation of A.',
      'C) A is true but R is false.',
      'D) A is false but R is true.'
    ],
    correctAnswer: 'A) Both A and R are true and R is the correct explanation of A.',
    markingScheme: '1 Mark for choosing Option A.',
    explanation: 'Thermal decomposition of CaCO3 requires heat energy (absorbs heat), so it is endothermic.',
    pyqYear: 2023
  },
  {
    id: 'q-sci-3',
    subjectId: 'science-086',
    chapterId: 'sci-ch1',
    chapterName: 'Chemical Reactions and Equations',
    type: 'vsa',
    marks: 2,
    difficulty: 'easy',
    isCompetency: false,
    questionText: 'Write balanced chemical equations for the following reactions:\n(i) Dilute sulfuric acid reacts with zinc granules.\n(ii) Iron nails dipped in copper sulfate solution.',
    correctAnswer: '(i) Zn (s) + H2SO4 (aq) → ZnSO4 (aq) + H2 (g)↑\n(ii) Fe (s) + CuSO4 (aq) → FeSO4 (aq) + Cu (s)',
    markingScheme: '[1 mark] for balanced equation (i)\n[1 mark] for balanced equation (ii)',
    pyqYear: 2022
  },

  // Science - Life Processes (ch5)
  {
    id: 'q-sci-4',
    subjectId: 'science-086',
    chapterId: 'sci-ch5',
    chapterName: 'Life Processes',
    type: 'sa',
    marks: 3,
    difficulty: 'medium',
    isCompetency: true,
    questionText: 'A student sets up an experiment to show that carbon dioxide is essential for photosynthesis using two healthy potted plants (A and B). Plant A is kept under a bell jar with KOH watch glass, while Plant B has no KOH watch glass. After 3 hours in sunlight, starch test is conducted.\n(a) Which plant leaf will show a positive starch test? Why?\n(b) What is the function of Potassium Hydroxide (KOH) in Plant A\'s setup?\n(c) Name the reagent used for testing the presence of starch.',
    correctAnswer: '(a) Plant B leaf will show positive blue-black test because CO2 was available for photosynthesis.\n(b) KOH absorbs carbon dioxide inside the bell jar of Plant A, creating a CO2-free environment.\n(c) Iodine solution.',
    markingScheme: '[1 mark] Plant B with reason\n[1 mark] Function of KOH\n[1 mark] Iodine solution name',
    pyqYear: 2025
  },
  {
    id: 'q-sci-5',
    subjectId: 'science-086',
    chapterId: 'sci-ch11',
    chapterName: 'Electricity',
    type: 'la',
    marks: 5,
    difficulty: 'hard',
    isCompetency: true,
    questionText: 'A circuit consists of three resistors R1 = 5 Ω, R2 = 10 Ω, and R3 = 30 Ω connected in parallel across a 12 V battery.\n(a) Draw the circuit diagram showing a switch, ammeter, and voltmeter.\n(b) Calculate the equivalent resistance of the parallel combination.\n(c) Calculate the total current flowing in the circuit.\n(d) Calculate the current flowing through each individual resistor.',
    correctAnswer: '(b) 1/Rp = 1/5 + 1/10 + 1/30 = (6 + 3 + 1)/30 = 10/30 => Rp = 3 Ω.\n(c) Total Current I = V/Rp = 12 / 3 = 4 A.\n(d) I1 = 12/5 = 2.4 A, I2 = 12/10 = 1.2 A, I3 = 12/30 = 0.4 A.',
    markingScheme: '[1 mark] Correct circuit diagram with proper polarities\n[1.5 marks] Rp calculation with steps\n[1 mark] Total current calculation\n[1.5 marks] Individual currents I1, I2, I3',
    pyqYear: 2024
  },
  {
    id: 'q-sci-6',
    subjectId: 'science-086',
    chapterId: 'sci-ch9',
    chapterName: 'Light - Reflection and Refraction',
    type: 'case',
    marks: 4,
    difficulty: 'hard',
    isCompetency: true,
    casePassage: 'A student performs an optical bench experiment using a convex lens of focal length 15 cm. A lighted candle is placed at a distance of 30 cm in front of the lens. A sharp real inverted image is captured on a white screen placed on the other side.',
    questionText: 'Read the passage above and answer the following questions:\nQ1. At what distance from the lens will the sharp image be formed on the screen? (1M)\nQ2. What is the magnification produced by the convex lens in this case? (1M)\nQ3. If the top half of the convex lens is covered with a black paper, what change will be observed in the image formed on the screen? Give reasons. (2M)',
    correctAnswer: 'Q1. Using lens formula 1/f = 1/v - 1/u => 1/15 = 1/v - 1/(-30) => 1/v = 1/15 - 1/30 = 1/30 => v = +30 cm on the other side.\nQ2. Magnification m = v/u = (+30)/(-30) = -1.\nQ3. A complete image will still be formed, but its intensity (brightness) will be reduced to half because fewer light rays pass through the uncovered half.',
    markingScheme: '[1 Mark] v = 30 cm with formula\n[1 Mark] m = -1 calculation\n[2 Marks] Full image formed with explanation of reduced brightness due to half light intensity',
    pyqYear: 2025
  },
  {
    id: 'q-sci-7',
    subjectId: 'science-086',
    chapterId: 'sci-ch2',
    chapterName: 'Acids, Bases and Salts',
    type: 'mcq',
    marks: 1,
    difficulty: 'easy',
    isCompetency: true,
    questionText: 'Which of the following salts does not contain water of crystallization?',
    options: ['A) Blue Vitriol', 'B) Baking Soda', 'C) Washing Soda', 'D) Gypsum'],
    correctAnswer: 'B) Baking Soda',
    markingScheme: '1 Mark for choosing Baking Soda (NaHCO3).',
    explanation: 'Baking Soda is NaHCO3 (anhydrous salt). Blue vitriol is CuSO4·5H2O, Washing soda is Na2CO3·10H2O, Gypsum is CaSO4·2H2O.',
    pyqYear: 2023
  },
  {
    id: 'q-sci-8',
    subjectId: 'science-086',
    chapterId: 'sci-ch6',
    chapterName: 'Control and Coordination',
    type: 'vsa',
    marks: 2,
    difficulty: 'medium',
    isCompetency: true,
    questionText: 'Name the plant hormones responsible for:\n(i) Elongation of cells and phototropism.\n(ii) Inhibition of growth and wilting of leaves.',
    correctAnswer: '(i) Auxin\n(ii) Abscisic Acid (ABA)',
    markingScheme: '[1 Mark] Auxin\n[1 Mark] Abscisic Acid',
    pyqYear: 2022
  },

  // Maths (Standard 041)
  {
    id: 'q-math-1',
    subjectId: 'maths-041',
    chapterId: 'm-ch1',
    chapterName: 'Real Numbers',
    type: 'mcq',
    marks: 1,
    difficulty: 'easy',
    isCompetency: true,
    questionText: 'If HCF(306, 657) = 9, then LCM(306, 657) is equal to:',
    options: ['A) 22338', 'B) 22330', 'C) 22838', 'D) 20338'],
    correctAnswer: 'A) 22338',
    markingScheme: '1 Mark for applying LCM × HCF = Product of two numbers => LCM = (306 × 657) / 9 = 22338.',
    explanation: 'LCM = (306 × 657)/9 = 22338.',
    pyqYear: 2023
  },
  {
    id: 'q-math-2',
    subjectId: 'maths-041',
    chapterId: 'm-ch2',
    chapterName: 'Polynomials',
    type: 'vsa',
    marks: 2,
    difficulty: 'medium',
    isCompetency: false,
    questionText: 'Find a quadratic polynomial whose zeros are (3 + √5) and (3 - √5).',
    correctAnswer: 'Sum of zeros (S) = (3 + √5) + (3 - √5) = 6.\nProduct of zeros (P) = (3 + √5)(3 - √5) = 3² - (√5)² = 9 - 5 = 4.\nRequired polynomial p(x) = k(x² - Sx + P) = k(x² - 6x + 4).',
    markingScheme: '[0.5 mark] Sum of zeros calculation\n[0.5 mark] Product of zeros calculation\n[1 mark] Final quadratic polynomial x² - 6x + 4',
    pyqYear: 2024
  },
  {
    id: 'q-math-3',
    subjectId: 'maths-041',
    chapterId: 'm-ch5',
    chapterName: 'Arithmetic Progressions',
    type: 'sa',
    marks: 3,
    difficulty: 'medium',
    isCompetency: true,
    questionText: 'The 17th term of an Arithmetic Progression exceeds its 10th term by 7. Find the common difference. Also find the sum of first 20 terms if the first term is 5.',
    correctAnswer: 'Given: a17 - a10 = 7 => (a + 16d) - (a + 9d) = 7 => 7d = 7 => d = 1.\nIf a = 5 and d = 1:\nS20 = (20/2) * [2(5) + (20-1)(1)] = 10 * [10 + 19] = 10 * 29 = 290.',
    markingScheme: '[1 mark] Deriving d = 1\n[1 mark] Writing Sn formula\n[1 mark] Final sum S20 = 290',
    pyqYear: 2024
  },
  {
    id: 'q-math-4',
    subjectId: 'maths-041',
    chapterId: 'm-ch9',
    chapterName: 'Some Applications of Trigonometry',
    type: 'la',
    marks: 5,
    difficulty: 'hard',
    isCompetency: true,
    questionText: 'From the top of a 7 m high building, the angle of elevation of the top of a cable tower is 60° and the angle of depression of its foot is 45°. Determine the height of the cable tower. (Take √3 = 1.732)',
    correctAnswer: 'Let building AB = 7 m and tower CE = h m.\nIn △ABD (where D is foot of tower): tan 45° = AB / BD => 1 = 7 / BD => BD = 7 m.\nTherefore horizontal distance to tower AE = BD = 7 m.\nIn △CAE: tan 60° = CE / AE => √3 = CE / 7 => CE = 7√3 m.\nTotal height of tower = CE + ED = 7√3 + 7 = 7(√3 + 1) = 7(1.732 + 1) = 7 × 2.732 = 19.124 m.',
    markingScheme: '[1 mark] Clear labeled diagram\n[1.5 marks] Finding horizontal distance = 7 m\n[1.5 marks] Finding top height CE = 7√3 m\n[1 mark] Final height calculation = 19.12 m',
    pyqYear: 2025
  },
  {
    id: 'q-math-5',
    subjectId: 'maths-041',
    chapterId: 'm-ch12',
    chapterName: 'Surface Areas and Volumes',
    type: 'case',
    marks: 4,
    difficulty: 'hard',
    isCompetency: true,
    casePassage: 'A decorative block shown in a handicraft museum is made of two solids — a cube and a hemisphere. The base of the block is a cube with edge 5 cm, and the hemisphere fixed on the top has a diameter of 4.2 cm. (Take π = 22/7)',
    questionText: 'Q1. Find the surface area of the hemisphere part alone (CSA). (1M)\nQ2. Find the total surface area of the combined decorative block. (2M)\nQ3. Find the volume of the hemisphere attached at the top. (1M)',
    correctAnswer: 'Q1. Radius r = 4.2/2 = 2.1 cm. CSA of hemisphere = 2πr² = 2 × (22/7) × (2.1)² = 27.72 cm².\nQ2. TSA of block = TSA of cube - Base area of hemisphere + CSA of hemisphere\n= 6a² - πr² + 2πr² = 6(5)² + πr² = 150 + (22/7) × (2.1)² = 150 + 13.86 = 163.86 cm².\nQ3. Volume = (2/3)πr³ = (2/3) × (22/7) × (2.1)³ = 19.404 cm³.',
    markingScheme: '[1 mark] Q1 CSA = 27.72 cm²\n[2 marks] Q2 TSA = 163.86 cm² with step formula\n[1 mark] Q3 Volume = 19.40 cm³',
    pyqYear: 2024
  },
  {
    id: 'q-math-6',
    subjectId: 'maths-041',
    chapterId: 'm-ch4',
    chapterName: 'Quadratic Equations',
    type: 'sa',
    marks: 3,
    difficulty: 'medium',
    isCompetency: true,
    questionText: 'Solve for x: 1/(x + 4) - 1/(x - 7) = 11/30 (where x ≠ -4, 7).',
    correctAnswer: '[(x - 7) - (x + 4)] / [(x + 4)(x - 7)] = 11/30\n-11 / (x² - 3x - 28) = 11/30\n-1 / (x² - 3x - 28) = 1/30\nx² - 3x - 28 = -30 => x² - 3x + 2 = 0\n(x - 1)(x - 2) = 0 => x = 1 or x = 2.',
    markingScheme: '[1 Mark] Simplifying fractions\n[1 Mark] Quadratic form x² - 3x + 2 = 0\n[1 Mark] Roots x = 1, x = 2',
    pyqYear: 2022
  },

  // Social Science
  {
    id: 'q-sst-1',
    subjectId: 'social-087',
    chapterId: 'sst-ch2',
    chapterName: 'Nationalism in India',
    type: 'mcq',
    marks: 1,
    difficulty: 'easy',
    isCompetency: true,
    questionText: 'Who among the following authored the famous book "Hind Swaraj" in 1909 declaring that British rule was established in India with the cooperation of Indians?',
    options: ['A) Jawaharlal Nehru', 'B) Mahatma Gandhi', 'C) Subhas Chandra Bose', 'D) Bal Gangadhar Tilak'],
    correctAnswer: 'B) Mahatma Gandhi',
    markingScheme: '1 Mark for choosing Mahatma Gandhi.',
    pyqYear: 2023
  },
  {
    id: 'q-sst-2',
    subjectId: 'social-087',
    chapterId: 'sst-ch7',
    chapterName: 'Power Sharing',
    type: 'sa',
    marks: 3,
    difficulty: 'medium',
    isCompetency: true,
    questionText: 'Explain the difference between Prudential and Moral reasons for power sharing with suitable examples.',
    correctAnswer: 'Prudential Reasons: Based on careful calculation of gains and losses. Power sharing reduces the possibility of social conflict and ensures political stability (e.g., reserving seats for minority communities in Belgium).\nMoral Reasons: Based on the intrinsic value of democracy. Power sharing is the very spirit of democracy where citizens have a right to be consulted on how they are governed.',
    markingScheme: '[1.5 marks] Prudential reasons definition and example\n[1.5 marks] Moral reasons definition and example',
    pyqYear: 2024
  },
  {
    id: 'q-sst-3',
    subjectId: 'social-087',
    chapterId: 'sst-ch9',
    chapterName: 'Development',
    type: 'case',
    marks: 4,
    difficulty: 'medium',
    isCompetency: true,
    casePassage: 'Suppose a country has four families. The average per capita income of these families is ₹5000. If the income of three families is ₹4000, ₹7000, and ₹3000 respectively, answer the following:',
    questionText: 'Q1. What is the income of the fourth family? (1M)\nQ2. Why is Average Income (Per Capita Income) considered an insufficient measure to compare development between two countries? Give two reasons. (2M)\nQ3. Name the index published by UNDP that provides a comprehensive measure of development beyond mere income. (1M)',
    correctAnswer: 'Q1. Total income = 4 × 5000 = ₹20,000. Fourth family income = 20000 - (4000 + 7000 + 3000) = 20000 - 14000 = ₹6000.\nQ2. Per Capita Income hides disparities. It does not tell us how income is distributed among people, nor does it account for health, education, and gender equality.\nQ3. Human Development Index (HDI).',
    markingScheme: '[1 mark] Q1 Calculation ₹6000\n[2 marks] Q2 Two valid limitations of Per Capita Income\n[1 mark] Q3 Human Development Index (HDI)',
    pyqYear: 2025
  },
  {
    id: 'q-sst-4',
    subjectId: 'social-087',
    chapterId: 'sst-ch8',
    chapterName: 'Federalism',
    type: 'la',
    marks: 5,
    difficulty: 'medium',
    isCompetency: true,
    questionText: 'What is decentralisation? Describe the major steps taken in 1992 towards decentralisation in India through the 73rd and 74th Constitutional Amendments.',
    correctAnswer: 'Decentralisation means taking power away from Central and State governments and giving it to local government.\nMajor Steps in 1992:\n1. Mandatory regular elections to local government bodies.\n2. Reservation of seats for SC, ST, and OBC communities.\n3. At least one-third (33%) of all positions reserved for women.\n4. Creation of an independent State Election Commission in each state.\n5. State governments required to share powers and revenue with local bodies.',
    markingScheme: '[1 Mark] Definition of Decentralisation\n[4 Marks] 4 distinct constitutional provisions post-1992 amendment',
    pyqYear: 2020
  },

  // English
  {
    id: 'q-eng-reading-1',
    subjectId: 'english-184',
    chapterId: 'eng-sec-a',
    chapterName: 'Reading Skills (Unseen Passages)',
    type: 'case',
    marks: 10,
    difficulty: 'medium',
    isCompetency: true,
    casePassage: 'Read the excerpt on Digital Literacy and Board Exam Preparation:\nAccording to a national educational survey in secondary schools, 68% of Class 10 students actively utilize digital question banks, interactive AI feedback, and mock testing software to strengthen core concepts. Educational psychologists observe that immediate error analysis helps students eliminate recurring conceptual missteps. However, experts emphasize that balanced screen time and structured offline writing practice remain indispensable for developing speed and handwriting clarity required in official board examinations.',
    questionText: 'Q1. What percentage of secondary school students utilize digital question banks and AI tools according to the survey? (1M)\nQ2. Based on the passage, state two main advantages of interactive self-testing tools. (2M)\nQ3. What precaution do educational experts advise regarding screen time and board preparation? (2M)\nQ4. Find a word in the passage that means "absolutely necessary or essential". (1M)\nQ5. Complete the sentence: Offline writing practice is indispensable for developing __________ and __________. (2M)\nQ6. Substitute the underlined phrase with one word: "eliminate recurring conceptual missteps". (2M)',
    correctAnswer: 'Q1. 68% of Class 10 students.\nQ2. Immediate error analysis and elimination of recurring conceptual missteps.\nQ3. Experts advise maintaining balanced screen time and engaging in structured offline writing practice to maintain handwriting clarity and speed.\nQ4. "Indispensable".\nQ5. Speed and handwriting clarity.\nQ6. Rectify / Correct errors.',
    markingScheme: '[1 mark] Q1 direct recall\n[2 marks] Q2 two advantages\n[2 marks] Q3 expert advice\n[1 mark] Q4 vocabulary\n[2 marks] Q5 sentence completion\n[2 marks] Q6 phrase substitution',
    pyqYear: 2025
  },
  {
    id: 'q-eng-grammar-1',
    subjectId: 'english-184',
    chapterId: 'eng-sec-b',
    chapterName: 'Writing Skills & Grammar',
    type: 'vsa',
    marks: 5,
    difficulty: 'medium',
    isCompetency: true,
    questionText: 'SECTION B: INTEGRATED GRAMMAR TASKS (5 MARKS)\n\n(a) Fill in the blank by choosing the correct option: Neither the teacher nor the students ______ (was / were) present in the auditorium when the announcement was made.\n(b) Read the conversation between Riya and Rohan and complete the sentence in reported speech:\nRiya: "Are you attending the science exhibition tomorrow?"\nRohan: "I have already registered for it."\nReported Speech: Riya asked Rohan if he was attending the science exhibition the next day. Rohan replied that __________.\n(c) Identify the error in the following sentence and supply the correction:\n"Each of the participating teams have submitted their project report on time."',
    correctAnswer: '(a) were (Subject closer to verb "students" is plural)\n(b) he had already registered for it.\n(c) Error: "have" | Correction: "has" (Subject "Each" requires singular verb "has")',
    markingScheme: '[1 Mark] Correct verb selection "were"\n[2 Marks] Accurately transformed reported speech with correct tense shift\n[2 Marks] Correct error identification and correction',
    pyqYear: 2025
  },
  {
    id: 'q-eng-writing-letter',
    subjectId: 'english-184',
    chapterId: 'eng-sec-b',
    chapterName: 'Writing Skills & Grammar',
    type: 'la',
    marks: 5,
    difficulty: 'hard',
    isCompetency: true,
    questionText: 'SECTION B: CREATIVE WRITING SKILLS - FORMAL LETTER (5 MARKS)\n\nYou are Aarav / Ananya, residing at 45-B, Green Park Extension, New Delhi. You have noticed a sharp rise in reckless driving and lack of traffic discipline near school zones during peak arrival and dismissal hours, creating severe safety hazards for young students.\n\nWrite a formal Letter to the Editor of a national daily (100–120 words) highlighting this growing menace, suggesting strict police patrolling, installation of speed governors, and community awareness drives.',
    correctAnswer: 'Format:\n- Sender\'s Address, Date, Receiver\'s Address (The Editor, National Daily), Subject, Salutation, Body (3 Paragraphs), Sign-off.\nBody Points:\n1. Intro: Express concern over reckless driving near school zones.\n2. Details: Speeding vehicles, lack of zebra crossings, congestion endangering students.\n3. Suggestions: Speed bumps, police traffic wardens, strict fines for underage driving, school transport regulation.',
    markingScheme: '[1 Mark] Format (Sender Address, Date, Receiver, Subject, Salutation, Complementary Close)\n[2 Marks] Content & Relevant Suggestions\n[2 Marks] Expression, Accuracy, Grammar & Vocabulary',
    pyqYear: 2025
  },
  {
    id: 'q-eng-writing-analytical',
    subjectId: 'english-184',
    chapterId: 'eng-sec-b',
    chapterName: 'Writing Skills & Grammar',
    type: 'la',
    marks: 5,
    difficulty: 'hard',
    isCompetency: true,
    questionText: 'SECTION B: CREATIVE WRITING SKILLS - ANALYTICAL PARAGRAPH (5 MARKS)\n\nThe chart below displays the preferred learning resources used by Class 10 students for Board Examination preparation in 2024-2025:\n• Interactive AI Mock Tests & Question Banks: 45%\n• Textbooks & Official Exemplar Solutions: 30%\n• Offline Coaching & Tuition Notes: 15%\n• Peer Study Groups: 10%\n\nWrite an Analytical Paragraph (100–120 words) analyzing the data provided. Compare trends, highlight key findings, and draw a meaningful conclusion.',
    correctAnswer: 'Structure:\n- Introduction (Restate chart topic in own words).\n- Body Paragraph (Compare 45% AI mock tests vs 30% traditional textbooks vs 15% coaching notes and 10% group study).\n- Conclusion (Synthesize that digital self-paced evaluation is leading board prep trends while core textbooks remain fundamental).',
    markingScheme: '[1 Mark] Introductory thesis statement\n[2 Marks] Comparative analysis of statistics and trends\n[2 Marks] Cohesion, clarity, grammatical accuracy and concluding summary',
    pyqYear: 2025
  },
  {
    id: 'q-eng-1',
    subjectId: 'english-184',
    chapterId: 'eng-ch1',
    chapterName: 'First Flight: A Letter to God',
    type: 'sa',
    marks: 3,
    difficulty: 'medium',
    isCompetency: true,
    questionText: '"Lencho showed an unquestioning faith in God, but a complete lack of faith in humanity." Comment on this statement in the light of Lencho calling the post office employees a "bunch of crooks".',
    correctAnswer: 'Lencho had immense, unwavering faith in God, believing God would never let him starve. However, his innocence turned into irony when he suspected the post office employees of stealing 30 pesos, unaware that they were the very kind souls who collected the money out of charity to preserve his faith.',
    markingScheme: '[1 mark] Mention of Lencho\'s absolute faith in God\n[1 mark] Explanation of the irony regarding post office employees\n[1 mark] Clear thematic conclusion on innocence vs cynicism',
    pyqYear: 2024
  },
  {
    id: 'q-eng-2',
    subjectId: 'english-184',
    chapterId: 'eng-ch2',
    chapterName: 'First Flight: Nelson Mandela - Long Walk to Freedom',
    type: 'la',
    marks: 5,
    difficulty: 'hard',
    isCompetency: true,
    questionText: 'What according to Nelson Mandela are the "twin obligations" every man has in life? Why was it impossible for a man of his birth and colour to fulfill both obligations in South Africa under Apartheid?',
    correctAnswer: 'Twin Obligations:\n1. Obligation to family, parents, wife, and children.\n2. Obligation to his people, community, and country.\nUnder Apartheid rule, a person of colour in South Africa who tried to fulfill his duty to his people was inevitably ripped from his family, isolated, and forced to live an existence of secrecy and rebellion as a freedom fighter.',
    markingScheme: '[2 Marks] Clearly stating the two obligations\n[3 Marks] Analyzing the historical constraint under Apartheid policy',
    pyqYear: 2023
  },

  // IT 402
  {
    id: 'q-it-1',
    subjectId: 'it-402',
    chapterId: 'it-ch3',
    chapterName: 'Database Management System (RDBMS)',
    type: 'vsa',
    marks: 2,
    difficulty: 'easy',
    isCompetency: false,
    questionText: 'Differentiate between Primary Key and Foreign Key in RDBMS with a short example.',
    correctAnswer: 'Primary Key: A field that uniquely identifies each record in a table (e.g. Roll_No). It cannot contain NULL values.\nForeign Key: A field in one table that refers to the Primary Key in another table to establish a relationship between them (e.g. Dept_ID in Student table).',
    markingScheme: '[1 mark] Primary Key definition and constraint\n[1 mark] Foreign Key definition and relationship role',
    pyqYear: 2024
  },
  {
    id: 'q-it-2',
    subjectId: 'it-402',
    chapterId: 'it-ch2',
    chapterName: 'Electronic Spreadsheet (Advanced)',
    type: 'sa',
    marks: 3,
    difficulty: 'medium',
    isCompetency: true,
    questionText: 'Explain the purpose of "Goal Seek" and "Scenarios" in LibreOffice Calc spreadsheet software. Give a practical scenario where Goal Seek is used.',
    correctAnswer: 'Goal Seek: Used to find the input value required to achieve a specific target output result (e.g. finding required marks in 5th exam to achieve 85% aggregate).\nScenarios: Tool to save and compare different sets of input values (e.g. Best case, Worst case, Expected budget).',
    markingScheme: '[1.5 Marks] Goal Seek definition & example\n[1.5 Marks] Scenarios tool explanation',
    pyqYear: 2025
  },
  // HINDI COURSE A (002) PRELOADED QUESTIONS
  {
    id: 'q-hin-a-1',
    subjectId: 'hindi-002',
    chapterId: 'hin-a-sec-b',
    chapterName: 'खंड ‘ख’ - व्यावहारिक व्याकरण',
    type: 'mcq',
    marks: 1,
    difficulty: 'medium',
    isCompetency: true,
    questionText: '‘जो व्यक्ति परिश्रमी होते हैं, वे कभी असफल नहीं होते।’ - रचना की दृष्टि से यह किस प्रकार का वाक्य है?',
    options: ['A) मिश्र वाक्य', 'B) सरल वाक्य', 'C) संयुक्त वाक्य', 'D) प्रश्नवाचक वाक्य'],
    correctAnswer: 'A) मिश्र वाक्य',
    markingScheme: '1 अंक - सही विकल्प (A) मिश्र वाक्य की पहचान हेतु।',
    explanation: 'यहाँ ‘जो... वे...’ योजक द्वारा एक प्रधान उपवाक्य और एक आश्रित विशेषण उपवाक्य जुड़ा है, अतः यह मिश्र वाक्य है।',
    pyqYear: 2024
  },
  {
    id: 'q-hin-a-2',
    subjectId: 'hindi-002',
    chapterId: 'hin-a-sec-b',
    chapterName: 'खंड ‘ख’ - व्यावहारिक व्याकरण',
    type: 'mcq',
    marks: 1,
    difficulty: 'easy',
    isCompetency: false,
    questionText: '‘बालगोबिन भगत द्वारा मधुर प्रभातियाँ गाई जाती थीं।’ - इस वाक्य का कर्तृवाच्य रूप क्या होगा?',
    options: [
      'A) बालगोबिन भगत मधुर प्रभातियाँ गाते थे।',
      'B) बालगोबिन भगत से मधुर प्रभातियाँ गाई गईं।',
      'C) बालगोबिन भगत मधुर प्रभातियाँ गा रहे होंगे।',
      'D) बालगोबिन भगत ने प्रभातियाँ गाईं।'
    ],
    correctAnswer: 'A) बालगोबिन भगत मधुर प्रभातियाँ गाते थे।',
    markingScheme: '1 अंक - सही कर्तृवाच्य रूपांतरण हेतु।',
    pyqYear: 2025
  },
  {
    id: 'q-hin-a-3',
    subjectId: 'hindi-002',
    chapterId: 'hin-a-ch1',
    chapterName: 'क्षितिज गद्य: नेताजी का चश्मा',
    type: 'sa',
    marks: 3,
    difficulty: 'medium',
    isCompetency: true,
    questionText: '‘सेनानी न होते हुए भी चश्मेवाले को लोग कैप्टन क्यों कहते थे?’ नेताजी का चश्मा पाठ के आधार पर स्पष्ट कीजिए।',
    correctAnswer: 'कैप्टन एक साधारण, बूढ़ा और दिव्यांग फेरीवाला था, लेकिन उसके मन में स्वतंत्रता सेनानियों और विशेषकर नेताजी सुभाषचंद्र बोस के प्रति अगाध श्रद्धा और देशप्रेम की प्रबल भावना थी। वह नेताजी की बिना चश्मे वाली मूर्ति को अधूरा मानकर अपनी ओर से चश्मा लगाता था। उसकी इसी सच्ची देशभक्ति और आदर भावना के कारण लोग उसे आदर से ‘कैप्टन’ कहते थे।',
    markingScheme: '• देशभक्ति और नेताजी के प्रति अगाध निष्ठा का उल्लेख [1.5 अंक]\n• बिना चश्मे की मूर्ति पर चश्मा लगाने का प्रसंग एवं लोगों की सम्मान भावना [1.5 अंक]',
    pyqYear: 2024
  },
  {
    id: 'q-hin-a-4',
    subjectId: 'hindi-002',
    chapterId: 'hin-a-ch3',
    chapterName: 'क्षितिज पद्य: सूरदास के पद',
    type: 'sa',
    marks: 3,
    difficulty: 'medium',
    isCompetency: true,
    questionText: 'गोपियों ने उद्धव के योग संदेश को किन-किन दृष्टांतों द्वारा अनुपयोगी व कड़वी ककड़ी के समान बताया है? सूरदास के पद के आधार पर स्पष्ट कीजिए।',
    correctAnswer: 'गोपियों ने उद्धव के योग संदेश की तुलना कमल के पत्ते (जो जल में रहकर भी गीला नहीं होता) और तेल लगी गागर से की। उन्होंने योग को ‘कड़वी ककड़ी’ और एक ऐसी ‘बीमारी’ (व्याधि) बताया जिसे न कभी पहले देखा और न सुना। उनके अनुसार यह योग संदेश उन लोगों के लिए है जिनके मन चंचल (चकरी के समान) हैं, न कि अनन्य कृष्ण भक्तों के लिए।',
    markingScheme: '• कड़वी ककड़ी व तेल की गागर दृष्टांत [1.5 अंक]\n• प्रेम मार्ग की श्रेष्ठता एवं चंचल मन का संदर्भ [1.5 अंक]',
    pyqYear: 2023
  },
  {
    id: 'q-hin-a-5',
    subjectId: 'hindi-002',
    chapterId: 'hin-a-sec-d',
    chapterName: 'खंड ‘घ’ - रचनात्मक लेखन',
    type: 'la',
    marks: 5,
    difficulty: 'hard',
    isCompetency: true,
    questionText: 'अपने क्षेत्र में नियमित रूप से हो रही पेयजल की समस्या और दूषित जल आपूर्ति की ओर ध्यान आकर्षित करते हुए नगर निगम के मुख्य स्वास्थ्य अधिकारी / जलकल अभियंता को लगभग 100 शब्दों में शिकायती पत्र लिखिए।',
    correctAnswer: 'प्रारूप: प्रेषक का पता, दिनांक, सेवा में (मुख्य स्वास्थ्य अधिकारी), विषय: पेयजल समस्या एवं दूषित आपूर्ति के निवारण हेतु, महोदय, विषय-वस्तु (गंदे जल से जलजनित रोगों का खतरा, पानी का कम दबाव), समाधान हेतु निवेदन, भवदीय एवं हस्ताक्षर।',
    markingScheme: '• प्रारूप (आरंभ व अंत की औपचारिकताएं) [1 अंक]\n• विषय-वस्तु की स्पष्टता एवं तर्कसंगतता [3 अंक]\n• वर्तनी एवं भाषा शैली की शुद्धता [1 अंक]',
    pyqYear: 2024
  },

  // HINDI COURSE B (085) PRELOADED QUESTIONS
  {
    id: 'q-hin-b-1',
    subjectId: 'hindi-085',
    chapterId: 'hin-b-sec-b',
    chapterName: 'खंड ‘ख’ - व्यावहारिक व्याकरण',
    type: 'mcq',
    marks: 1,
    difficulty: 'medium',
    isCompetency: true,
    questionText: '‘दशरथ पुत्र राम ने रावण का वध किया।’ - इस वाक्य में रेखांकित पद ‘दशरथ पुत्र राम’ में कौन-सा पदबंध है?',
    options: ['A) संज्ञा पदबंध', 'B) विशेषण पदबंध', 'C) क्रिया पदबंध', 'D) सर्वनाम पदबंध'],
    correctAnswer: 'A) संज्ञा पदबंध',
    markingScheme: '1 अंक - सही पदबंध भेद पहचान हेतु।',
    explanation: 'शीर्ष पद ‘राम’ संज्ञा है और पूरा पद समूह संज्ञा का कार्य कर रहा है, अतः यह संज्ञा पदबंध है।',
    pyqYear: 2025
  },
  {
    id: 'q-hin-b-2',
    subjectId: 'hindi-085',
    chapterId: 'hin-b-ch1',
    chapterName: 'स्पर्श गद्य: बड़े भाई साहब',
    type: 'sa',
    marks: 3,
    difficulty: 'medium',
    isCompetency: true,
    questionText: 'बड़े भाई साहब दिमाग को आराम देने के लिए कॉपी-किताबों के हाशियों पर क्या करते थे? इससे उनके स्वभाव की किस विशेषता का पता चलता है?',
    correctAnswer: 'बड़े भाई साहब कॉपी-किताबों के हाशियों पर चिड़ियों, कुत्तों, बिल्लियों की तस्वीरें बनाते थे, कभी-कभी एक ही नाम या शब्द दस-बीस बार लिखते थे। इससे पता चलता है कि वे पढ़ाई में अत्यधिक परिश्रम करने के कारण मानसिक थकान महसूस करते थे और दिमाग को विश्राम देने के लिए ऐसी अनर्गल आकृतियाँ बनाते थे।',
    markingScheme: '• हाशियों पर चित्र व शब्द लिखने का उल्लेख [1.5 अंक]\n• मानसिक तनाव/थकान व स्वभाव का विश्लेषण [1.5 अंक]',
    pyqYear: 2024
  },
  {
    id: 'q-hin-b-3',
    subjectId: 'hindi-085',
    chapterId: 'hin-b-ch4',
    chapterName: 'संचयन: हरिहर काका',
    type: 'la',
    marks: 6,
    difficulty: 'hard',
    isCompetency: true,
    questionText: '‘हरिहर काका’ कहानी समाज में वृद्धों की उपेक्षा और स्वार्थ-लिप्त संबंधों का यथार्थ चित्रण करती है। कहानी के आधार पर स्पष्ट कीजिए कि धर्म और रिश्ते किस प्रकार संपत्ति के आगे गौण हो जाते हैं।',
    correctAnswer: 'कहानी में दिखाया गया है कि हरिहर काका के भाई और ठाकुरबारी के महंत केवल उनकी 15 बीघे जमीन हड़पना चाहते थे। जब तक काका ने जमीन नहीं दी, तब तक भाइयों के परिवार ने उनका तिरस्कार किया और महंत ने अपहरण कर जबरन अंगूठे के निशान लगवाए। यह स्थिति दर्शाती है कि आज भौतिकवादी समाज में आत्मीयता, धार्मिकता और रक्त संबंध केवल संपत्ति के लालच पर टिके हैं।',
    markingScheme: '• भाइयों और महंत के स्वार्थ का विश्लेषण [2.5 अंक]\n• वृद्धों की असहाय स्थिति व समाज का यथार्थ [2.5 अंक]\n• सुगठित निष्कर्ष व भाषा प्रवाह [1 अंक]',
    pyqYear: 2024
  },

  // Class 12 Questions from Master Pools
  ...poolToQuestions(CLASS12_PHYSICS_POOL, 'class12-physics-042', 'q-c12-phy'),
  ...poolToQuestions(CLASS12_CHEMISTRY_POOL, 'class12-chemistry-043', 'q-c12-chem'),
  ...poolToQuestions(CLASS12_MATHS_POOL, 'class12-maths-041', 'q-c12-math'),
  ...poolToQuestions(CLASS12_BIOLOGY_POOL, 'class12-biology-044', 'q-c12-bio'),
  ...poolToQuestions(CLASS12_CS_POOL, 'class12-computer-083', 'q-c12-cs'),
  ...poolToQuestions(CLASS12_ENGLISH_POOL, 'class12-english-301', 'q-c12-eng'),
  ...poolToQuestions(COMMERCE_ACCOUNTANCY_POOL, 'class12-accountancy-055', 'q-c12-acc'),
  ...poolToQuestions(COMMERCE_BUSINESS_STUDIES_POOL, 'class12-bst-054', 'q-c12-bst'),
  ...poolToQuestions(COMMERCE_ECONOMICS_POOL, 'class12-eco-030', 'q-c12-eco'),
  ...poolToQuestions(ARTS_HISTORY_POOL, 'class12-history-027', 'q-c12-hist'),
  ...poolToQuestions(ARTS_POLITICAL_SCIENCE_POOL, 'class12-polsci-028', 'q-c12-pol'),
  ...poolToQuestions(ARTS_GEOGRAPHY_POOL, 'class12-geography-029', 'q-c12-geo'),
  ...poolToQuestions(ARTS_SOCIOLOGY_POOL, 'class12-sociology-039', 'q-c12-soc'),
  ...poolToQuestions(HINDI_CORE_POOL, 'class12-hindi-302', 'q-c12-hin302'),

  // Class 11 Stream Questions from Master Pools
  ...poolToQuestions(CLASS12_PHYSICS_POOL, 'physics-042', 'q-c11-phy'),
  ...poolToQuestions(CLASS12_CHEMISTRY_POOL, 'chemistry-043', 'q-c11-chem'),
  ...poolToQuestions(CLASS12_MATHS_POOL, 'maths-041-11', 'q-c11-math'),
  ...poolToQuestions(CLASS12_BIOLOGY_POOL, 'biology-044-11', 'q-c11-bio'),
  ...poolToQuestions(CLASS12_CS_POOL, 'cs-083-11', 'q-c11-cs'),
  ...poolToQuestions(COMMERCE_ACCOUNTANCY_POOL, 'accountancy-055-11', 'q-c11-acc'),
  ...poolToQuestions(COMMERCE_BUSINESS_STUDIES_POOL, 'bst-054-11', 'q-c11-bst'),
  ...poolToQuestions(COMMERCE_ECONOMICS_POOL, 'eco-030-11', 'q-c11-eco'),
  ...poolToQuestions(ARTS_HISTORY_POOL, 'history-027-11', 'q-c11-hist'),
  ...poolToQuestions(ARTS_POLITICAL_SCIENCE_POOL, 'polsci-028-11', 'q-c11-pol'),
  ...poolToQuestions(ARTS_GEOGRAPHY_POOL, 'geography-029-11', 'q-c11-geo'),
  ...poolToQuestions(ARTS_SOCIOLOGY_POOL, 'sociology-039-11', 'q-c11-soc'),
  ...poolToQuestions(CLASS12_ENGLISH_POOL, 'english-301', 'q-c11-eng301'),
  ...poolToQuestions(HINDI_CORE_POOL, 'hindi-302-11', 'q-c11-hin302'),

  // Class 9 Questions from Master Pools
  ...poolToQuestions(CLASS9_SCIENCE_POOL, 'class9-science-086', 'q-c9-sci'),
  ...poolToQuestions(CLASS9_MATHS_POOL, 'class9-maths-041', 'q-c9-math'),
  ...poolToQuestions(CLASS9_SST_POOL, 'class9-social-087', 'q-c9-sst'),
  ...poolToQuestions(CLASS9_ENGLISH_POOL, 'class9-english-184', 'q-c9-eng'),
  ...poolToQuestions(CLASS9_HINDI_POOL, 'class9-hindi-002', 'q-c9-hin'),
  ...poolToQuestions(CLASS9_IT_POOL, 'class9-it-402', 'q-c9-it'),

  // Primary Class 3 & Class 4 Questions
  ...CLASS_3_QUESTION_BANK,
  ...CLASS_4_QUESTION_BANK
];

// GENERATE 10 YEARS (2016-2025) OF CBSE PYQ PAPERS FOR ALL SUBJECTS
const YEARS_10 = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];

interface PYQSubjectDef {
  subjectId: string;
  subjectName: string;
  classNum: string;
  prefix: string;
  totalMarks: number;
  durationMinutes: number;
  baseDownloads: number;
  fallbackSubjectId?: string;
}

const PYQ_SUBJECT_DEFS: PYQSubjectDef[] = [
  // Class 10
  { subjectId: 'science-086', subjectName: 'Science (086)', classNum: '10', prefix: '31', totalMarks: 80, durationMinutes: 180, baseDownloads: 22000 },
  { subjectId: 'maths-041', subjectName: 'Mathematics Standard (041)', classNum: '10', prefix: '30', totalMarks: 80, durationMinutes: 180, baseDownloads: 25000 },
  { subjectId: 'social-087', subjectName: 'Social Science (087)', classNum: '10', prefix: '32', totalMarks: 80, durationMinutes: 180, baseDownloads: 19000 },
  { subjectId: 'english-184', subjectName: 'English Language & Literature (184)', classNum: '10', prefix: '002', totalMarks: 80, durationMinutes: 180, baseDownloads: 18000 },
  { subjectId: 'hindi-002', subjectName: 'Hindi Course A (002)', classNum: '10', prefix: '003', totalMarks: 80, durationMinutes: 180, baseDownloads: 16000 },
  { subjectId: 'hindi-085', subjectName: 'Hindi Course B (085)', classNum: '10', prefix: '085', totalMarks: 80, durationMinutes: 180, baseDownloads: 14000 },
  { subjectId: 'it-402', subjectName: 'Information Technology (402)', classNum: '10', prefix: '402', totalMarks: 50, durationMinutes: 120, baseDownloads: 11000 },

  // Class 12
  { subjectId: 'class12-physics-042', subjectName: 'Physics (042) - Class 12', classNum: '12', prefix: '55', totalMarks: 70, durationMinutes: 180, baseDownloads: 29000 },
  { subjectId: 'class12-chemistry-043', subjectName: 'Chemistry (043) - Class 12', classNum: '12', prefix: '56', totalMarks: 70, durationMinutes: 180, baseDownloads: 27000 },
  { subjectId: 'class12-maths-041', subjectName: 'Mathematics (041) - Class 12', classNum: '12', prefix: '65', totalMarks: 80, durationMinutes: 180, baseDownloads: 32000 },
  { subjectId: 'class12-biology-044', subjectName: 'Biology (044) - Class 12', classNum: '12', prefix: '57', totalMarks: 70, durationMinutes: 180, baseDownloads: 21000 },
  { subjectId: 'class12-computer-083', subjectName: 'Computer Science (083) - Class 12', classNum: '12', prefix: '91', totalMarks: 70, durationMinutes: 180, baseDownloads: 15000 },
  { subjectId: 'class12-english-301', subjectName: 'English Core (301) - Class 12', classNum: '12', prefix: '001', totalMarks: 80, durationMinutes: 180, baseDownloads: 24000 },
  { subjectId: 'class12-accountancy-055', subjectName: 'Accountancy (055) - Class 12', classNum: '12', prefix: '58', totalMarks: 80, durationMinutes: 180, baseDownloads: 23000 },
  { subjectId: 'class12-bst-054', subjectName: 'Business Studies (054) - Class 12', classNum: '12', prefix: '66', totalMarks: 80, durationMinutes: 180, baseDownloads: 21000 },
  { subjectId: 'class12-eco-030', subjectName: 'Economics (030) - Class 12', classNum: '12', prefix: '59', totalMarks: 80, durationMinutes: 180, baseDownloads: 25000 },
  { subjectId: 'class12-history-027', subjectName: 'History (027) - Class 12', classNum: '12', prefix: '61', totalMarks: 80, durationMinutes: 180, baseDownloads: 19000 },
  { subjectId: 'class12-polsci-028', subjectName: 'Political Science (028) - Class 12', classNum: '12', prefix: '59/P', totalMarks: 80, durationMinutes: 180, baseDownloads: 18000 },
  { subjectId: 'class12-geography-029', subjectName: 'Geography (029) - Class 12', classNum: '12', prefix: '64', totalMarks: 70, durationMinutes: 180, baseDownloads: 16000 },
  { subjectId: 'class12-sociology-039', subjectName: 'Sociology (039) - Class 12', classNum: '12', prefix: '62', totalMarks: 80, durationMinutes: 180, baseDownloads: 14000 },
  { subjectId: 'class12-hindi-302', subjectName: 'Hindi Core (302) - Class 12', classNum: '12', prefix: '002', totalMarks: 80, durationMinutes: 180, baseDownloads: 20000 },

  // Class 9
  { subjectId: 'class9-science-086', subjectName: 'Science (086) - Class 9', classNum: '9', prefix: '09/S', totalMarks: 80, durationMinutes: 180, baseDownloads: 17000, fallbackSubjectId: 'science-086' },
  { subjectId: 'class9-maths-041', subjectName: 'Mathematics (041) - Class 9', classNum: '9', prefix: '09/M', totalMarks: 80, durationMinutes: 180, baseDownloads: 18000, fallbackSubjectId: 'maths-041' },
  { subjectId: 'class9-social-087', subjectName: 'Social Science (087) - Class 9', classNum: '9', prefix: '09/SS', totalMarks: 80, durationMinutes: 180, baseDownloads: 13000, fallbackSubjectId: 'social-087' },
  { subjectId: 'class9-english-184', subjectName: 'English (184) - Class 9', classNum: '9', prefix: '09/E', totalMarks: 80, durationMinutes: 180, baseDownloads: 12000, fallbackSubjectId: 'english-184' },
  { subjectId: 'class9-hindi-002', subjectName: 'Hindi (002) - Class 9', classNum: '9', prefix: '09/H', totalMarks: 80, durationMinutes: 180, baseDownloads: 11000, fallbackSubjectId: 'hindi-002' },
  { subjectId: 'class9-it-402', subjectName: 'Information Technology (402) - Class 9', classNum: '9', prefix: '09/IT', totalMarks: 50, durationMinutes: 120, baseDownloads: 9000, fallbackSubjectId: 'it-402' },

  // Class 11
  { subjectId: 'physics-042', subjectName: 'Physics (042) - Class 11', classNum: '11', prefix: '11/P', totalMarks: 70, durationMinutes: 180, baseDownloads: 14000, fallbackSubjectId: 'class12-physics-042' },
  { subjectId: 'chemistry-043', subjectName: 'Chemistry (043) - Class 11', classNum: '11', prefix: '11/C', totalMarks: 70, durationMinutes: 180, baseDownloads: 13000, fallbackSubjectId: 'class12-chemistry-043' },
  { subjectId: 'maths-041-11', subjectName: 'Mathematics (041) - Class 11', classNum: '11', prefix: '11/M', totalMarks: 80, durationMinutes: 180, baseDownloads: 15000, fallbackSubjectId: 'class12-maths-041' },
  { subjectId: 'biology-044-11', subjectName: 'Biology (044) - Class 11', classNum: '11', prefix: '11/B', totalMarks: 70, durationMinutes: 180, baseDownloads: 11000, fallbackSubjectId: 'class12-biology-044' },
  { subjectId: 'accountancy-055-11', subjectName: 'Accountancy (055) - Class 11', classNum: '11', prefix: '11/ACC', totalMarks: 80, durationMinutes: 180, baseDownloads: 12000, fallbackSubjectId: 'class12-accountancy-055' },
  { subjectId: 'bst-054-11', subjectName: 'Business Studies (054) - Class 11', classNum: '11', prefix: '11/BST', totalMarks: 80, durationMinutes: 180, baseDownloads: 11000, fallbackSubjectId: 'class12-bst-054' },
  { subjectId: 'eco-030-11', subjectName: 'Economics (030) - Class 11', classNum: '11', prefix: '11/ECO', totalMarks: 80, durationMinutes: 180, baseDownloads: 13000, fallbackSubjectId: 'class12-eco-030' },
  { subjectId: 'history-027-11', subjectName: 'History (027) - Class 11', classNum: '11', prefix: '11/HIS', totalMarks: 80, durationMinutes: 180, baseDownloads: 10000, fallbackSubjectId: 'class12-history-027' },
  { subjectId: 'polsci-028-11', subjectName: 'Political Science (028) - Class 11', classNum: '11', prefix: '11/POL', totalMarks: 80, durationMinutes: 180, baseDownloads: 10000, fallbackSubjectId: 'class12-polsci-028' },
  { subjectId: 'english-301', subjectName: 'English Core (301) - Class 11', classNum: '11', prefix: '11/ENG', totalMarks: 80, durationMinutes: 180, baseDownloads: 14000, fallbackSubjectId: 'class12-english-301' }
];

function buildGeneratedPYQs(): PYQPaper[] {
  const pyqList: PYQPaper[] = [];

  PYQ_SUBJECT_DEFS.forEach((def) => {
    let subjectQs = PRELOADED_QUESTIONS.filter(q => q.subjectId === def.subjectId);
    if (subjectQs.length === 0 && def.fallbackSubjectId) {
      subjectQs = PRELOADED_QUESTIONS.filter(q => q.subjectId === def.fallbackSubjectId);
    }
    if (subjectQs.length === 0) {
      subjectQs = PRELOADED_QUESTIONS.slice(0, 15);
    }

    YEARS_10.forEach((yr, idx) => {
      const setVariants = ['1/1', '1/2', '2/1', '2/2', '3/1', '3/2', 'T2/1', 'Main', '1/3', '3/3'];
      const setVariant = setVariants[idx % setVariants.length];
      const setNum = `${def.prefix}/${setVariant}`;

      let examType = 'Official Board Exam Paper';
      let marks = def.totalMarks;
      let duration = def.durationMinutes;

      if (def.classNum === '9' || def.classNum === '11') {
        examType = 'Annual Examination Paper';
      } else if (yr === 2022) {
        examType = 'Board Exam Term 2 Paper';
        marks = def.totalMarks === 80 ? 40 : 35;
        duration = 120;
      } else if (yr === 2021) {
        examType = 'Special Board Assessment Paper';
      }

      const isClassBoard = def.classNum === '10' || def.classNum === '12';
      const cleanSubjectName = def.subjectName.split(' - ')[0];
      const title = isClassBoard
        ? `CBSE Class ${def.classNum} ${cleanSubjectName} ${examType} ${yr} - Set ${setVariant}`
        : `CBSE Class ${def.classNum} ${cleanSubjectName} ${examType} ${yr}`;

      const downloads = def.baseDownloads + (yr - 2016) * 850 + (idx * 240);

      pyqList.push({
        id: `pyq-${def.subjectId}-${yr}-set${idx + 1}`,
        year: yr,
        subjectId: def.subjectId,
        subjectName: def.subjectName,
        title,
        setNumber: setNum,
        totalMarks: marks,
        durationMinutes: duration,
        downloadCount: downloads,
        questions: subjectQs
      });
    });
  });

  return pyqList;
}

export const PRELOADED_PYQS: PYQPaper[] = buildGeneratedPYQs();

