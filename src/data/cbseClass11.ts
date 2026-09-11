import { Subject } from '../types';

export const CBSE_CLASS_11_SUBJECTS: Subject[] = [
  // SCIENCE STREAM
  {
    id: 'physics-042',
    name: 'Physics',
    code: '042',
    category: 'Science',
    stream: 'Science',
    color: '#0284c7', 
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
    icon: 'Atom',
    totalChapters: 14,
    standardMarks: 70,
    standardTime: 180,
    chapters: [
      { id: 'phy11-ch1', number: 1, title: 'Units and Measurements', unitName: 'Physical World and Measurement', unitWeightageMarks: 5, topics: ['Units', 'Dimensions', 'Errors'], keyFormulasOrConcepts: ['Dimension Formula'] },
      { id: 'phy11-ch2', number: 2, title: 'Motion in a Straight Line', unitName: 'Kinematics', unitWeightageMarks: 10, topics: ['Velocity', 'Acceleration'], keyFormulasOrConcepts: ['v=u+at'] },
      { id: 'phy11-ch3', number: 3, title: 'Motion in a Plane', unitName: 'Kinematics', unitWeightageMarks: 10, topics: ['Vectors', 'Projectile'], keyFormulasOrConcepts: ['Projectile equations'] },
      { id: 'phy11-ch4', number: 4, title: 'Laws of Motion', unitName: 'Laws of Motion', unitWeightageMarks: 10, topics: ['Newtons Laws', 'Friction'], keyFormulasOrConcepts: ['F=ma'] },
      { id: 'phy11-ch5', number: 5, title: 'Work, Energy and Power', unitName: 'Work, Energy and Power', unitWeightageMarks: 10, topics: ['Work-Energy Theorem'], keyFormulasOrConcepts: ['W=F.s'] },
      { id: 'phy11-ch6', number: 6, title: 'System of Particles and Rotational Motion', unitName: 'Motion of System of Particles', unitWeightageMarks: 10, topics: ['Torque', 'Moment of Inertia'], keyFormulasOrConcepts: ['τ=r×F'] },
      { id: 'phy11-ch7', number: 7, title: 'Gravitation', unitName: 'Gravitation', unitWeightageMarks: 5, topics: ['Universal Law'], keyFormulasOrConcepts: ['F=Gm1m2/r²'] },
      { id: 'phy11-ch8', number: 8, title: 'Mechanical Properties of Solids', unitName: 'Properties of Bulk Matter', unitWeightageMarks: 5, topics: ['Stress', 'Strain'], keyFormulasOrConcepts: ['Young\'s Modulus'] },
      { id: 'phy11-ch9', number: 9, title: 'Mechanical Properties of Fluids', unitName: 'Properties of Bulk Matter', unitWeightageMarks: 5, topics: ['Pascal\'s Law', 'Bernoulli'], keyFormulasOrConcepts: ['P + 1/2ρv² + ρgh = constant'] },
      { id: 'phy11-ch10', number: 10, title: 'Thermal Properties of Matter', unitName: 'Thermodynamics', unitWeightageMarks: 5, topics: ['Heat', 'Conduction'], keyFormulasOrConcepts: ['ΔQ=msΔT'] },
      { id: 'phy11-ch11', number: 11, title: 'Thermodynamics', unitName: 'Thermodynamics', unitWeightageMarks: 5, topics: ['Laws of Thermo'], keyFormulasOrConcepts: ['ΔU = Q - W'] },
      { id: 'phy11-ch12', number: 12, title: 'Kinetic Theory', unitName: 'Thermodynamics', unitWeightageMarks: 5, topics: ['Ideal Gas Laws'], keyFormulasOrConcepts: ['PV=nRT'] },
      { id: 'phy11-ch13', number: 13, title: 'Oscillations', unitName: 'Oscillations and Waves', unitWeightageMarks: 5, topics: ['SHM'], keyFormulasOrConcepts: ['F=-kx'] },
      { id: 'phy11-ch14', number: 14, title: 'Waves', unitName: 'Oscillations and Waves', unitWeightageMarks: 5, topics: ['Wave equation'], keyFormulasOrConcepts: ['y=A sin(ωt-kx)'] }
    ]
  },
  {
    id: 'chemistry-043',
    name: 'Chemistry',
    code: '043',
    category: 'Science',
    stream: 'Science',
    color: '#7c3aed', 
    badgeBg: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800',
    icon: 'FlaskConical',
    totalChapters: 7,
    standardMarks: 70,
    standardTime: 180,
    chapters: [
      { id: 'chem11-ch1', number: 1, title: 'Some Basic Concepts of Chemistry', unitName: 'Basic Concepts', unitWeightageMarks: 7, topics: ['Mole Concept'], keyFormulasOrConcepts: ['Stoichiometry'] },
      { id: 'chem11-ch2', number: 2, title: 'Structure of Atom', unitName: 'Structure', unitWeightageMarks: 9, topics: ['Bohr model', 'Quantum numbers'], keyFormulasOrConcepts: ['E=hv'] },
      { id: 'chem11-ch3', number: 3, title: 'Classification of Elements and Periodicity', unitName: 'Periodicity', unitWeightageMarks: 6, topics: ['Trends'], keyFormulasOrConcepts: ['Ionization Enthalpy'] },
      { id: 'chem11-ch4', number: 4, title: 'Chemical Bonding and Molecular Structure', unitName: 'Bonding', unitWeightageMarks: 7, topics: ['VSEPR', 'Hybridization'], keyFormulasOrConcepts: ['Bond order'] },
      { id: 'chem11-ch5', number: 5, title: 'Chemical Thermodynamics', unitName: 'Thermodynamics', unitWeightageMarks: 9, topics: ['Laws', 'Entropy'], keyFormulasOrConcepts: ['ΔG = ΔH - TΔS'] },
      { id: 'chem11-ch6', number: 6, title: 'Equilibrium', unitName: 'Equilibrium', unitWeightageMarks: 7, topics: ['Le Chatelier'], keyFormulasOrConcepts: ['Kc'] },
      { id: 'chem11-ch7', number: 7, title: 'Organic Chemistry - Basic Principles', unitName: 'Organic', unitWeightageMarks: 11, topics: ['Nomenclature', 'Isomerism'], keyFormulasOrConcepts: ['IUPAC Rules'] }
    ]
  },
  {
    id: 'maths-041-11',
    name: 'Mathematics',
    code: '041',
    category: 'Mathematics',
    stream: 'Science',
    color: '#16a34a', 
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    icon: 'Calculator',
    totalChapters: 14,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'm11-ch1', number: 1, title: 'Sets', unitName: 'Sets and Functions', unitWeightageMarks: 5, topics: ['Sets'], keyFormulasOrConcepts: ['n(A∪B)'] },
      { id: 'm11-ch2', number: 2, title: 'Relations and Functions', unitName: 'Sets and Functions', unitWeightageMarks: 7, topics: ['Domain'], keyFormulasOrConcepts: ['f(x)'] },
      { id: 'm11-ch3', number: 3, title: 'Trigonometric Functions', unitName: 'Sets and Functions', unitWeightageMarks: 10, topics: ['Graphs'], keyFormulasOrConcepts: ['sin²x+cos²x=1'] },
      { id: 'm11-ch4', number: 4, title: 'Complex Numbers', unitName: 'Algebra', unitWeightageMarks: 6, topics: ['i^2=-1'], keyFormulasOrConcepts: ['z=a+ib'] },
      { id: 'm11-ch5', number: 5, title: 'Linear Inequalities', unitName: 'Algebra', unitWeightageMarks: 6, topics: ['Inequality'], keyFormulasOrConcepts: ['x < y'] },
      { id: 'm11-ch6', number: 6, title: 'Permutations and Combinations', unitName: 'Algebra', unitWeightageMarks: 6, topics: ['nPr'], keyFormulasOrConcepts: ['nCr = n! / (r!(n-r)!)'] },
      { id: 'm11-ch7', number: 7, title: 'Binomial Theorem', unitName: 'Algebra', unitWeightageMarks: 4, topics: ['Expansion'], keyFormulasOrConcepts: ['General term'] },
      { id: 'm11-ch8', number: 8, title: 'Sequences and Series', unitName: 'Algebra', unitWeightageMarks: 10, topics: ['AP, GP'], keyFormulasOrConcepts: ['Sn'] },
      { id: 'm11-ch9', number: 9, title: 'Straight Lines', unitName: 'Co-ordinate Geometry', unitWeightageMarks: 5, topics: ['Slope'], keyFormulasOrConcepts: ['y=mx+c'] },
      { id: 'm11-ch10', number: 10, title: 'Conic Sections', unitName: 'Co-ordinate Geometry', unitWeightageMarks: 7, topics: ['Circle, Parabola'], keyFormulasOrConcepts: ['x²/a²+y²/b²=1'] },
      { id: 'm11-ch11', number: 11, title: 'Introduction to 3D Geometry', unitName: 'Co-ordinate Geometry', unitWeightageMarks: 4, topics: ['Distance'], keyFormulasOrConcepts: ['√(x2-x1)²+...'] },
      { id: 'm11-ch12', number: 12, title: 'Limits and Derivatives', unitName: 'Calculus', unitWeightageMarks: 9, topics: ['Differentiation'], keyFormulasOrConcepts: ['d/dx(x^n)=nx^(n-1)'] },
      { id: 'm11-ch13', number: 13, title: 'Statistics', unitName: 'Statistics and Probability', unitWeightageMarks: 5, topics: ['Mean'], keyFormulasOrConcepts: ['Σfx/Σf'] },
      { id: 'm11-ch14', number: 14, title: 'Probability', unitName: 'Statistics and Probability', unitWeightageMarks: 8, topics: ['Event'], keyFormulasOrConcepts: ['P(A)=n(A)/n(S)'] }
    ]
  },
  {
    id: 'biology-044-11',
    name: 'Biology',
    code: '044',
    category: 'Science',
    stream: 'Science',
    color: '#059669',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    icon: 'FlaskConical',
    totalChapters: 5,
    standardMarks: 70,
    standardTime: 180,
    chapters: [
      { id: 'bio11-ch1', number: 1, title: 'Diversity in Living World', unitName: 'Diversity in Living World', unitWeightageMarks: 15, topics: ['Taxonomy', 'Five Kingdom Classification'], keyFormulasOrConcepts: ['Binomial Nomenclature'] },
      { id: 'bio11-ch2', number: 2, title: 'Structural Organisation in Plants and Animals', unitName: 'Structural Organisation', unitWeightageMarks: 10, topics: ['Plant Anatomy', 'Animal Tissues'], keyFormulasOrConcepts: ['Xylem & Phloem'] },
      { id: 'bio11-ch3', number: 3, title: 'Cell Structure and Function', unitName: 'Cell Structure and Function', unitWeightageMarks: 15, topics: ['Cell Organelles', 'Biomolecules', 'Cell Cycle'], keyFormulasOrConcepts: ['Mitosis & Meiosis'] },
      { id: 'bio11-ch4', number: 4, title: 'Plant Physiology', unitName: 'Plant Physiology', unitWeightageMarks: 12, topics: ['Photosynthesis', 'Respiration in Plants', 'Plant Growth'], keyFormulasOrConcepts: ['Calvin Cycle & Krebs Cycle'] },
      { id: 'bio11-ch5', number: 5, title: 'Human Physiology', unitName: 'Human Physiology', unitWeightageMarks: 18, topics: ['Breathing', 'Circulation', 'Excretion', 'Neural Control'], keyFormulasOrConcepts: ['ECG & Reflex Arc'] }
    ]
  },

  // COMMERCE STREAM
  {
    id: 'accountancy-055-11',
    name: 'Accountancy',
    code: '055',
    category: 'Other',
    stream: 'Commerce',
    color: '#ea580c',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
    icon: 'Calculator',
    totalChapters: 8,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'acc11-ch1', number: 1, title: 'Introduction to Accounting', unitName: 'Theoretical Framework', unitWeightageMarks: 12, topics: ['Accounting Concepts', 'GAAP', 'GST'], keyFormulasOrConcepts: ['Dual Aspect Principle'] },
      { id: 'acc11-ch2', number: 2, title: 'Accounting Process & Journal', unitName: 'Accounting Process', unitWeightageMarks: 15, topics: ['Journal Entries', 'Ledger', 'Cash Book'], keyFormulasOrConcepts: ['Debits & Credits Rules'] },
      { id: 'acc11-ch3', number: 3, title: 'Bank Reconciliation Statement', unitName: 'Accounting Process', unitWeightageMarks: 8, topics: ['Passbook vs Cashbook'], keyFormulasOrConcepts: ['BRS Adjustments'] },
      { id: 'acc11-ch4', number: 4, title: 'Depreciation, Provisions and Reserves', unitName: 'Accounting Process', unitWeightageMarks: 12, topics: ['Straight Line Method', 'Diminishing Value Method'], keyFormulasOrConcepts: ['Depreciation = (Cost - Scrap)/Life'] },
      { id: 'acc11-ch5', number: 5, title: 'Trial Balance and Rectification of Errors', unitName: 'Accounting Process', unitWeightageMarks: 10, topics: ['One-sided & Two-sided Errors', 'Suspense Account'], keyFormulasOrConcepts: ['Rectification Entries'] },
      { id: 'acc11-ch6', number: 6, title: 'Financial Statements of Sole Proprietorship', unitName: 'Financial Statements', unitWeightageMarks: 23, topics: ['Trading A/c', 'P&L A/c', 'Balance Sheet'], keyFormulasOrConcepts: ['Gross Profit = Net Sales - COGS'] },
      { id: 'acc11-ch7', number: 7, title: 'Incomplete Records (Single Entry System)', unitName: 'Financial Statements', unitWeightageMarks: 10, topics: ['Statement of Affairs'], keyFormulasOrConcepts: ['Profit = Closing Capital - Opening Capital'] }
    ]
  },
  {
    id: 'bst-054-11',
    name: 'Business Studies',
    code: '054',
    category: 'Other',
    stream: 'Commerce',
    color: '#d97706',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    icon: 'Laptop',
    totalChapters: 8,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'bst11-ch1', number: 1, title: 'Business, Trade and Commerce', unitName: 'Foundations of Business', unitWeightageMarks: 16, topics: ['History of Commerce', 'Business Risks', 'Objectives'], keyFormulasOrConcepts: ['Trade & Auxiliaries to Trade'] },
      { id: 'bst11-ch2', number: 2, title: 'Forms of Business Organisations', unitName: 'Foundations of Business', unitWeightageMarks: 18, topics: ['Sole Proprietorship', 'Partnership', 'Joint Stock Company'], keyFormulasOrConcepts: ['MoA & AoA'] },
      { id: 'bst11-ch3', number: 3, title: 'Private, Public and Global Enterprises', unitName: 'Foundations of Business', unitWeightageMarks: 14, topics: ['Departmental Undertakings', 'Statutory Corporations', 'MNCs'], keyFormulasOrConcepts: ['PPP Model'] },
      { id: 'bst11-ch4', number: 4, title: 'Business Services', unitName: 'Foundations of Business', unitWeightageMarks: 12, topics: ['Banking', 'Insurance', 'E-Banking'], keyFormulasOrConcepts: ['Principles of Insurance'] },
      { id: 'bst11-ch5', number: 5, title: 'Emerging Modes of Business', unitName: 'Corporate Social Responsibility', unitWeightageMarks: 10, topics: ['E-Commerce', 'B2B, B2C', 'Outsourcing (BPO)'], keyFormulasOrConcepts: ['Digital Business Models'] },
      { id: 'bst11-ch6', number: 6, title: 'Social Responsibilities of Business & Ethics', unitName: 'Corporate Social Responsibility', unitWeightageMarks: 10, topics: ['CSR', 'Environmental Protection'], keyFormulasOrConcepts: ['Business Ethics'] }
    ]
  },
  {
    id: 'eco-030-11',
    name: 'Economics',
    code: '030',
    category: 'Social Science',
    stream: 'Commerce',
    color: '#2563eb',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    icon: 'Globe',
    totalChapters: 8,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'eco11-ch1', number: 1, title: 'Statistics for Economics: Data Collection & Presentation', unitName: 'Statistics for Economics', unitWeightageMarks: 15, topics: ['Sampling', 'Tabulation', 'Diagrams'], keyFormulasOrConcepts: ['Frequency Distribution'] },
      { id: 'eco11-ch2', number: 2, title: 'Measures of Central Tendency', unitName: 'Statistics for Economics', unitWeightageMarks: 25, topics: ['Mean', 'Median', 'Mode'], keyFormulasOrConcepts: ['x̄ = Σx/N'] },
      { id: 'eco11-ch3', number: 3, title: 'Correlation and Index Numbers', unitName: 'Statistics for Economics', unitWeightageMarks: 10, topics: ['Karl Pearson Correlation', 'Laspeyres & Paasche Index'], keyFormulasOrConcepts: ['r = Σxy / √(Σx² Σy²)'] },
      { id: 'eco11-ch4', number: 4, title: 'Introductory Microeconomics: Consumer Equilibrium', unitName: 'Introductory Microeconomics', unitWeightageMarks: 15, topics: ['Utility Analysis', 'Indifference Curve'], keyFormulasOrConcepts: ['MUx/Px = MUy/Py'] },
      { id: 'eco11-ch5', number: 5, title: 'Demand and Elasticity of Demand', unitName: 'Introductory Microeconomics', unitWeightageMarks: 15, topics: ['Law of Demand', 'Price Elasticity'], keyFormulasOrConcepts: ['Ed = (%ΔQ / %ΔP)'] },
      { id: 'eco11-ch6', number: 6, title: 'Producer Behaviour and Supply', unitName: 'Introductory Microeconomics', unitWeightageMarks: 20, topics: ['Production Function', 'Cost & Revenue', 'Supply'], keyFormulasOrConcepts: ['MR = MC Rule'] }
    ]
  },

  // ARTS / HUMANITIES STREAM
  {
    id: 'history-027-11',
    name: 'History',
    code: '027',
    category: 'Social Science',
    stream: 'Arts',
    color: '#b45309',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    icon: 'BookOpenCheck',
    totalChapters: 7,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'hist11-ch1', number: 1, title: 'Writing and City Life (Mesopotamia)', unitName: 'Early Societies', unitWeightageMarks: 20, topics: ['Ur & Uruk', 'Cuneiform Script'], keyFormulasOrConcepts: ['Mesopotamian Urbanization'] },
      { id: 'hist11-ch2', number: 2, title: 'An Empire Across Three Continents (Roman Empire)', unitName: 'Empires', unitWeightageMarks: 20, topics: ['Roman Republic & Principate', 'Slavery & Economy'], keyFormulasOrConcepts: ['Pax Romana'] },
      { id: 'hist11-ch3', number: 3, title: 'Nomadic Empires (Mongols under Genghis Khan)', unitName: 'Empires', unitWeightageMarks: 10, topics: ['Yasa Code', 'Military Organization'], keyFormulasOrConcepts: ['Pax Mongolica'] },
      { id: 'hist11-ch4', number: 4, title: 'Changing Cultural Traditions (The Renaissance)', unitName: 'Changing Traditions', unitWeightageMarks: 15, topics: ['Humanism', 'Art & Science in Europe'], keyFormulasOrConcepts: ['Renaissance Humanism'] },
      { id: 'hist11-ch5', number: 5, title: 'Displacing Indigenous Peoples', unitName: 'Towards Modernisation', unitWeightageMarks: 15, topics: ['Native Americans & Aborigines'], keyFormulasOrConcepts: ['Colonial Displacement'] }
    ]
  },
  {
    id: 'polsci-028-11',
    name: 'Political Science',
    code: '028',
    category: 'Social Science',
    stream: 'Arts',
    color: '#0369a1',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
    icon: 'Globe',
    totalChapters: 8,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'pol11-ch1', number: 1, title: 'Indian Constitution at Work: Constitution & Rights', unitName: 'Indian Constitution at Work', unitWeightageMarks: 20, topics: ['Preamble', 'Fundamental Rights & Duties'], keyFormulasOrConcepts: ['Basic Structure Doctrine'] },
      { id: 'pol11-ch2', number: 2, title: 'Election and Representation', unitName: 'Indian Constitution at Work', unitWeightageMarks: 10, topics: ['FPTP vs Proportional Representation'], keyFormulasOrConcepts: ['Election Commission Rules'] },
      { id: 'pol11-ch3', number: 3, title: 'Legislature, Executive & Judiciary', unitName: 'Indian Constitution at Work', unitWeightageMarks: 20, topics: ['Parliamentary System', 'Judicial Review & PIL'], keyFormulasOrConcepts: ['Separation of Powers'] },
      { id: 'pol11-ch4', number: 4, title: 'Political Theory: Freedom, Equality & Social Justice', unitName: 'Political Theory', unitWeightageMarks: 15, topics: ['Negative vs Positive Liberty', 'Rawls Theory of Justice'], keyFormulasOrConcepts: ['Pillars of Democracy'] },
      { id: 'pol11-ch5', number: 5, title: 'Rights, Citizenship & Secularism', unitName: 'Political Theory', unitWeightageMarks: 15, topics: ['Indian Secularism vs Western Secularism'], keyFormulasOrConcepts: ['Universal Citizenship'] }
    ]
  },
  {
    id: 'geography-029-11',
    name: 'Geography',
    code: '029',
    category: 'Social Science',
    stream: 'Arts',
    color: '#15803d',
    badgeBg: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    icon: 'Globe',
    totalChapters: 8,
    standardMarks: 70,
    standardTime: 180,
    chapters: [
      { id: 'geo11-ch1', number: 1, title: 'Fundamentals of Physical Geography: Earth & Landforms', unitName: 'Physical Geography', unitWeightageMarks: 20, topics: ['Interior of Earth', 'Plate Tectonics', 'Geomorphic Processes'], keyFormulasOrConcepts: ['Continental Drift Theory'] },
      { id: 'geo11-ch2', number: 2, title: 'Climate, Atmosphere & Oceans', unitName: 'Physical Geography', unitWeightageMarks: 15, topics: ['Atmospheric Circulation', 'Ocean Currents'], keyFormulasOrConcepts: ['Coriolis Force & El Nino'] },
      { id: 'geo11-ch3', number: 3, title: 'India: Physical Environment', unitName: 'India Physical Environment', unitWeightageMarks: 20, topics: ['Physiographic Divisions', 'Drainage Systems (Himalayan vs Peninsular)'], keyFormulasOrConcepts: ['Monsoon Mechanism'] },
      { id: 'geo11-ch4', number: 4, title: 'Climate, Vegetation and Soils of India', unitName: 'India Physical Environment', unitWeightageMarks: 15, topics: ['Forest Cover', 'Soil Classification of India'], keyFormulasOrConcepts: ['Social Forestry & Conservation'] }
    ]
  },
  {
    id: 'sociology-039-11',
    name: 'Sociology',
    code: '039',
    category: 'Social Science',
    stream: 'Arts',
    color: '#9333ea',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    icon: 'BookOpen',
    totalChapters: 6,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'soc11-ch1', number: 1, title: 'Introducing Sociology: Society & Social Groups', unitName: 'Introducing Sociology', unitWeightageMarks: 20, topics: ['Sociological Imagination', 'Primary & Secondary Groups'], keyFormulasOrConcepts: ['Social Stratification'] },
      { id: 'soc11-ch2', number: 2, title: 'Social Institutions: Family, Caste & Class', unitName: 'Introducing Sociology', unitWeightageMarks: 20, topics: ['Kinship', 'Caste vs Class'], keyFormulasOrConcepts: ['Functionalism vs Conflict Theory'] },
      { id: 'soc11-ch3', number: 3, title: 'Culture, Socialization and Environment', unitName: 'Understanding Society', unitWeightageMarks: 20, topics: ['Cultural Identity', 'Agents of Socialization'], keyFormulasOrConcepts: ['Ethnocentrism vs Cultural Relativism'] },
      { id: 'soc11-ch4', number: 4, title: 'Western & Indian Thinkers: Marx, Weber, Ghurye', unitName: 'Understanding Society', unitWeightageMarks: 20, topics: ['Class Struggle', 'Bureaucracy', 'Caste in India'], keyFormulasOrConcepts: ['Historical Materialism'] }
    ]
  },

  // COMMON CORE LANGUAGES
  {
    id: 'english-301',
    name: 'English Core',
    code: '301',
    category: 'Languages',
    stream: 'Common',
    color: '#8b5cf6', 
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    icon: 'BookOpen',
    totalChapters: 6,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'eng11-ch1', number: 1, title: 'Hornbill: The Portrait of a Lady & Poetry', unitName: 'Hornbill Prose & Poetry', unitWeightageMarks: 25, topics: ['The Portrait of a Lady', 'A Photograph (Poem)', 'The Laburnum Top'], keyFormulasOrConcepts: ['Character Sketch & Poetic Devices'] },
      { id: 'eng11-ch2', number: 2, title: 'Hornbill: We are not afraid to die & Discovering Tut', unitName: 'Hornbill Prose', unitWeightageMarks: 15, topics: ['Seafaring voyage', 'Egyptian Pharaoh Saga'], keyFormulasOrConcepts: ['Themes of Courage & History'] },
      { id: 'eng11-ch3', number: 3, title: 'Snapshots: The Summer of the Beautiful White Horse & The Address', unitName: 'Snapshots Supplementary Reader', unitWeightageMarks: 15, topics: ['Garoghlanian tribe values', 'Post-war trauma in Holland'], keyFormulasOrConcepts: ['Characterization & Irony'] },
      { id: 'eng11-ch4', number: 4, title: 'Reading Skills & Unseen Passages', unitName: 'Section A - Reading', unitWeightageMarks: 26, topics: ['Factual & Discursive Passages', 'Note Making & Summarization'], keyFormulasOrConcepts: ['Note Making Format'] },
      { id: 'eng11-ch5', number: 5, title: 'Creative Writing Skills & Grammar', unitName: 'Section B - Writing & Grammar', unitWeightageMarks: 24, topics: ['Notices, Advertisements', 'Letters & Articles', 'Integrated Grammar'], keyFormulasOrConcepts: ['Official Formats'] }
    ]
  },
  {
    id: 'hindi-302-11',
    name: 'Hindi Core',
    code: '302',
    category: 'Languages',
    stream: 'Common',
    color: '#dc2626',
    badgeBg: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    icon: 'Languages',
    totalChapters: 6,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      { id: 'hin11-ch1', number: 1, title: 'आरोह भाग-1 (गद्य खंड)', unitName: 'पाठ्यपुस्तक आरोह गद्य', unitWeightageMarks: 20, topics: ['नमक का दारोगा (प्रेमचंद)', 'मियां नसीरुद्दीन (कृष्णा सोबती)'], keyFormulasOrConcepts: ['ईमानदारी व सत्यनिष्ठा'] },
      { id: 'hin11-ch2', number: 2, title: 'आरोह भाग-1 (काव्य खंड)', unitName: 'पाठ्यपुस्तक आरोह पद्य', unitWeightageMarks: 20, topics: ['कबीर के पद', 'मीरा के पद', 'घर की याद (भवानी प्रसाद मिश्र)'], keyFormulasOrConcepts: ['भक्ति व पारिवारिक संवेग'] },
      { id: 'hin11-ch3', number: 3, title: 'पूरक पुस्तक वितान भाग-1', unitName: 'वितान भाग-1', unitWeightageMarks: 10, topics: ['भारतीय गायिकाओं में बेजोड़: लता मंगेशकर (कुमार गंधर्व)'], keyFormulasOrConcepts: ['गानपन व संगीत शास्त्र'] },
      { id: 'hin11-ch4', number: 4, title: 'अभिव्यक्ति और माध्यम (जनसंचार माध्यम)', unitName: 'जनसंचार व रचनात्मक लेखन', unitWeightageMarks: 30, topics: ['सृजनात्मक लेखन', 'पत्रकारिता के विविध आयाम', 'कार्यक्रमीय पत्र व प्रतिवेदन'], keyFormulasOrConcepts: ['प्रारूप की शुद्धता'] }
    ]
  }
];
