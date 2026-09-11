import { Subject } from '../types';

export const CBSE_CLASS_9_SUBJECTS: Subject[] = [
  {
    id: 'class9-maths-041',
    name: 'Class 9 Mathematics',
    code: '041',
    category: 'Mathematics',
    color: 'from-blue-600 to-indigo-700',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    icon: 'Calculator',
    totalChapters: 12,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      {
        id: 'c9-math-ch1',
        number: 1,
        title: 'Number Systems',
        unitName: 'Number Systems',
        unitWeightageMarks: 10,
        topics: ['Rational & Irrational numbers', 'Real numbers on number line', 'Laws of exponents for real numbers', 'Rationalization of denominators'],
        keyFormulasOrConcepts: ['p/q form where q ≠ 0', 'Rationalizing factor: (a-√b)(a+√b)=a²-b', 'a^p · a^q = a^(p+q)']
      },
      {
        id: 'c9-math-ch2',
        number: 2,
        title: 'Polynomials',
        unitName: 'Algebra',
        unitWeightageMarks: 20,
        topics: ['Degree of polynomial', 'Zeros of a polynomial', 'Remainder and Factor Theorem', 'Algebraic Identities'],
        keyFormulasOrConcepts: ['(x+y+z)² = x²+y²+z²+2xy+2yz+2zx', 'x³+y³+z³-3xyz = (x+y+z)(x²+y²+z²-xy-yz-zx)', 'Factor Theorem: If P(a)=0, (x-a) is a factor']
      },
      {
        id: 'c9-math-ch3',
        number: 3,
        title: 'Coordinate Geometry',
        unitName: 'Coordinate Geometry',
        unitWeightageMarks: 4,
        topics: ['Cartesian plane', 'Coordinates of a point', 'Quadrants and axes', 'Plotting points in plane'],
        keyFormulasOrConcepts: ['Abscissa (x-coordinate)', 'Ordinate (y-coordinate)', 'Origin (0,0)', 'Points on x-axis: (x,0), y-axis: (0,y)']
      },
      {
        id: 'c9-math-ch4',
        number: 4,
        title: 'Linear Equations in Two Variables',
        unitName: 'Algebra',
        unitWeightageMarks: 6,
        topics: ['Standard form ax + by + c = 0', 'Solutions of linear equation', 'Graph of linear equation in two variables'],
        keyFormulasOrConcepts: ['Standard form: ax+by+c=0 (a,b ≠ 0)', 'Infinitely many solutions for a single linear equation']
      },
      {
        id: 'c9-math-ch5',
        number: 5,
        title: 'Introduction to Euclid Geometry',
        unitName: 'Geometry',
        unitWeightageMarks: 5,
        topics: ['Euclid definitions, axioms and postulates', 'Fifth postulate and equivalent versions'],
        keyFormulasOrConcepts: ['Axiom 1: Things equal to same thing are equal', 'Postulate 1: A straight line may be drawn from any one point to another']
      },
      {
        id: 'c9-math-ch6',
        number: 6,
        title: 'Lines and Angles',
        unitName: 'Geometry',
        unitWeightageMarks: 7,
        topics: ['Complementary & Supplementary angles', 'Intersecting & Non-intersecting lines', 'Transversal & Parallel lines angles', 'Linear pair axiom'],
        keyFormulasOrConcepts: ['Linear Pair: ∠1 + ∠2 = 180°', 'Vertically opposite angles are equal', 'Alternate interior angles are equal']
      },
      {
        id: 'c9-math-ch7',
        number: 7,
        title: 'Triangles',
        unitName: 'Geometry',
        unitWeightageMarks: 10,
        topics: ['Congruence criteria: SAS, ASA, AAS, SSS, RHS', 'Isosceles triangle properties', 'Inequalities in a triangle'],
        keyFormulasOrConcepts: ['SAS, ASA, SSS, RHS congruence', 'Angles opposite to equal sides are equal']
      },
      {
        id: 'c9-math-ch8',
        number: 8,
        title: 'Quadrilaterals',
        unitName: 'Geometry',
        unitWeightageMarks: 7,
        topics: ['Angle sum property of quadrilateral', 'Properties of Parallelogram, Rectangle, Rhombus, Square', 'Mid-point Theorem'],
        keyFormulasOrConcepts: ['Mid-point Theorem: Line joining midpoints of 2 sides is parallel to 3rd side and half of it']
      },
      {
        id: 'c9-math-ch9',
        number: 9,
        title: 'Circles',
        unitName: 'Geometry',
        unitWeightageMarks: 8,
        topics: ['Equal chords & their distances from center', 'Angle subtended by an arc at center and on remaining circle', 'Cyclic quadrilaterals'],
        keyFormulasOrConcepts: ['Angle subtended by arc at center is double the angle at remaining circle', 'Opposite angles of cyclic quadrilateral sum to 180°']
      },
      {
        id: 'c9-math-ch10',
        number: 10,
        title: "Heron's Formula",
        unitName: 'Mensuration',
        unitWeightageMarks: 6,
        topics: ['Area of triangle using Heron formula', 'Applications in finding areas of quadrilaterals'],
        keyFormulasOrConcepts: ['s = (a+b+c)/2', 'Area = √[s(s-a)(s-b)(s-c)]']
      },
      {
        id: 'c9-math-ch11',
        number: 11,
        title: 'Surface Areas and Volumes',
        unitName: 'Mensuration',
        unitWeightageMarks: 8,
        topics: ['Surface areas and volumes of Right Circular Cones and Spheres/Hemispheres'],
        keyFormulasOrConcepts: ['Cone CSA = πrl, TSA = πr(l+r), Vol = 1/3 πr²h (l=√(r²+h²))', 'Sphere SA = 4πr², Vol = 4/3 πr³', 'Hemisphere CSA = 2πr², TSA = 3πr², Vol = 2/3 πr³']
      },
      {
        id: 'c9-math-ch12',
        number: 12,
        title: 'Statistics',
        unitName: 'Statistics',
        unitWeightageMarks: 6,
        topics: ['Bar graphs', 'Histograms with varying base widths', 'Frequency polygons'],
        keyFormulasOrConcepts: ['Adjusted frequency for histogram with unequal widths = (Minimum class width / Class width) * Frequency']
      }
    ]
  },
  {
    id: 'class9-science-086',
    name: 'Class 9 Science',
    code: '086',
    category: 'Science',
    color: 'from-emerald-600 to-teal-700',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: 'FlaskConical',
    totalChapters: 12,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      {
        id: 'c9-sci-ch1',
        number: 1,
        title: 'Matter in Our Surroundings',
        unitName: 'Matter - Its Nature and Behaviour',
        unitWeightageMarks: 6,
        topics: ['Physical nature of matter', 'States of matter: Solid, Liquid, Gas', 'Interconversion of states', 'Latent heat & Evaporation'],
        keyFormulasOrConcepts: ['Latent heat of fusion & vaporization', 'Factors affecting evaporation: Surface area, Temperature, Humidity, Wind speed']
      },
      {
        id: 'c9-sci-ch2',
        number: 2,
        title: 'Is Matter Around Us Pure',
        unitName: 'Matter - Its Nature and Behaviour',
        unitWeightageMarks: 7,
        topics: ['Mixtures, Solutions, Suspensions, Colloids', 'Tyndall effect', 'Elements & Compounds', 'Physical and Chemical changes'],
        keyFormulasOrConcepts: ['Mass percentage = (Mass of solute / Mass of solution) × 100', 'Colloidal dispersed phase and dispersion medium']
      },
      {
        id: 'c9-sci-ch3',
        number: 3,
        title: 'Atoms and Molecules',
        unitName: 'Matter - Its Nature and Behaviour',
        unitWeightageMarks: 6,
        topics: ['Law of conservation of mass & constant proportions', 'Dalton atomic theory', 'Atomic mass, Chemical formula writing', 'Molecular mass'],
        keyFormulasOrConcepts: ['Law of Definite Proportions', 'Valency & criss-cross method for formulas', 'Formula unit mass calculation']
      },
      {
        id: 'c9-sci-ch4',
        number: 4,
        title: 'Structure of the Atom',
        unitName: 'Matter - Its Nature and Behaviour',
        unitWeightageMarks: 6,
        topics: ['Thomson, Rutherford, Bohr atomic models', 'Protons, Neutrons, Electrons', 'Valency & Electronic configuration', 'Isotopes & Isobars'],
        keyFormulasOrConcepts: ['2n² rule for maximum electrons in shell', 'Mass number A = Protons + Neutrons', 'Isotopes: Same Z, different A']
      },
      {
        id: 'c9-sci-ch5',
        number: 5,
        title: 'The Fundamental Unit of Life',
        unitName: 'Organization in the Living World',
        unitWeightageMarks: 7,
        topics: ['Cell as basic unit of life', 'Prokaryotic vs Eukaryotic cells', 'Cell organelles: Nucleus, Mitochondria, ER, Golgi, Lysosomes, Plastids, Vacuoles', 'Osmosis & Diffusion'],
        keyFormulasOrConcepts: ['Hypotonic, Isotonic, Hypertonic solutions and plasmolysis', 'Mitochondria: Powerhouse (ATP)', 'Lysosomes: Suicide bags']
      },
      {
        id: 'c9-sci-ch6',
        number: 6,
        title: 'Tissues',
        unitName: 'Organization in the Living World',
        unitWeightageMarks: 8,
        topics: ['Meristematic & Permanent plant tissues (Parenchyma, Collenchyma, Sclerenchyma, Xylem, Phloem)', 'Animal tissues: Epithelial, Connective, Muscular, Nervous'],
        keyFormulasOrConcepts: ['Xylem (Tracheids, Vessels, Xylem parenchyma, Xylem fibres)', 'Phloem (Sieve tubes, Companion cells, Phloem parenchyma, Phloem fibres)', 'Neuron structure']
      },
      {
        id: 'c9-sci-ch7',
        number: 7,
        title: 'Motion',
        unitName: 'Motion, Force and Work',
        unitWeightageMarks: 8,
        topics: ['Distance and Displacement', 'Speed and Velocity', 'Uniform and Non-uniform motion', 'Equations of motion', 'Uniform circular motion'],
        keyFormulasOrConcepts: ['v = u + at', 's = ut + 1/2 at²', 'v² = u² + 2as', 'v = 2πr / t for circular motion']
      },
      {
        id: 'c9-sci-ch8',
        number: 8,
        title: 'Force and Laws of Motion',
        unitName: 'Motion, Force and Work',
        unitWeightageMarks: 8,
        topics: ['Newton First, Second, Third laws of motion', 'Inertia and Mass', 'Momentum', 'Conservation of momentum'],
        keyFormulasOrConcepts: ['F = ma', 'Momentum p = mv', 'm1u1 + m2u2 = m1v1 + m2v2']
      },
      {
        id: 'c9-sci-ch9',
        number: 9,
        title: 'Gravitation',
        unitName: 'Motion, Force and Work',
        unitWeightageMarks: 7,
        topics: ['Universal Law of Gravitation', 'Free fall, Acceleration due to gravity (g)', 'Mass and Weight', 'Thrust, Pressure, Archimedes Principle, Buoyancy'],
        keyFormulasOrConcepts: ['F = G·(M·m)/d²', 'g = GM/R² ≈ 9.8 m/s²', 'Weight W = mg', 'Pressure = Force / Area']
      },
      {
        id: 'c9-sci-ch10',
        number: 10,
        title: 'Work and Energy',
        unitName: 'Motion, Force and Work',
        unitWeightageMarks: 7,
        topics: ['Work done by constant force', 'Kinetic and Potential Energy', 'Law of conservation of energy', 'Power & Commercial unit of energy'],
        keyFormulasOrConcepts: ['W = F · s · cosθ', 'KE = 1/2 mv²', 'PE = mgh', 'Power P = W/t (Watt)', '1 kWh = 3.6 × 10⁶ J']
      },
      {
        id: 'c9-sci-ch11',
        number: 11,
        title: 'Sound',
        unitName: 'Motion, Force and Work',
        unitWeightageMarks: 5,
        topics: ['Production and propagation of sound', 'Longitudinal waves, Wavelength, Frequency, Speed', 'Reflection of sound, Echo, Reverberation', 'Ultrasound applications'],
        keyFormulasOrConcepts: ['v = λ · f', 'Echo minimum distance = 17.2 m at 22°C', 'SONAR equation: 2d = v × t']
      },
      {
        id: 'c9-sci-ch12',
        number: 12,
        title: 'Improvement in Food Resources',
        unitName: 'Food Production',
        unitWeightageMarks: 5,
        topics: ['Crop variety improvement', 'Crop production management (Nutrients, Manure, Fertilizers, Irrigation, Cropping patterns)', 'Crop protection', 'Animal husbandry (Cattle, Poultry, Fisheries, Apiculture)'],
        keyFormulasOrConcepts: ['Macro vs Micro nutrients (16 essential nutrients)', 'Inter-cropping vs Crop rotation', 'Bee species: Apis cerana indica, Apis mellifera']
      }
    ]
  },
  {
    id: 'class9-social-087',
    name: 'Class 9 Social Science',
    code: '087',
    category: 'Social Science',
    color: 'from-amber-600 to-orange-700',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    icon: 'Globe2',
    totalChapters: 14,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      {
        id: 'c9-sst-his1',
        number: 1,
        title: 'The French Revolution',
        unitName: 'India and the Contemporary World - I (History)',
        unitWeightageMarks: 6,
        topics: ['French society in late 18th century', 'Outbreak of revolution & Estate General', 'France becomes Constitutional Monarchy to Republic', 'Reign of Terror & Directory', 'Abolition of slavery & Women revolution'],
        keyFormulasOrConcepts: ['Three Estates (Clergy, Nobility, Commoners)', 'Storming of Bastille (14 July 1789)', 'Maximilien Robespierre and Reign of Terror (1793-94)']
      },
      {
        id: 'c9-sst-his2',
        number: 2,
        title: 'Socialism in Europe and the Russian Revolution',
        unitName: 'India and the Contemporary World - I (History)',
        unitWeightageMarks: 6,
        topics: ['Liberals, Radicals, Conservatives', 'Industrial society & Social change', 'Russian Empire in 1914', 'February Revolution 1917 & October Revolution 1917', 'Collectivization program of Stalin'],
        keyFormulasOrConcepts: ['Bolsheviks led by Vladimir Lenin (April Theses)', 'Bloody Sunday 1905', 'Kolkhoz (Collective farms)']
      },
      {
        id: 'c9-sst-his3',
        number: 3,
        title: 'Nazism and the Rise of Hitler',
        unitName: 'India and the Contemporary World - I (History)',
        unitWeightageMarks: 6,
        topics: ['Birth of Weimar Republic', "Hitler's rise to power", 'The Nazi Worldview & Youth in Nazi Germany', 'The Holocaust and Crimes against humanity'],
        keyFormulasOrConcepts: ['Enabling Act of 1933', 'Racial Hierarchy & Aryan superiority ideology', 'Nuremberg Laws 1935']
      },
      {
        id: 'c9-sst-geo1',
        number: 4,
        title: 'India - Size and Location',
        unitName: 'Contemporary India - I (Geography)',
        unitWeightageMarks: 4,
        topics: ['Location (Latitudinal & Longitudinal extent)', 'Size and Coastline', 'Standard Meridian of India (82°30’ E)', 'India and the World / Neighbours'],
        keyFormulasOrConcepts: ['Total Area: 3.28 million sq km (2.4% of world)', '82°30\'E passing through Mirzapur (UP)', 'Land boundary: 15,200 km; Coastline: 7,516.6 km']
      },
      {
        id: 'c9-sst-geo2',
        number: 5,
        title: 'Physical Features of India',
        unitName: 'Contemporary India - I (Geography)',
        unitWeightageMarks: 6,
        topics: ['Major physiographic divisions: Himalayas, Northern Plains, Peninsular Plateau, Indian Desert, Coastal Plains, Islands', 'Theory of Plate Tectonics'],
        keyFormulasOrConcepts: ['Himalayan parallel ranges: Himadri, Himachal, Shiwaliks', 'Bhabar, Terai, Bhangar, Khadar', 'Western Ghats vs Eastern Ghats']
      },
      {
        id: 'c9-sst-geo3',
        number: 6,
        title: 'Drainage',
        unitName: 'Contemporary India - I (Geography)',
        unitWeightageMarks: 4,
        topics: ['Himalayan River Systems (Indus, Ganga, Brahmaputra)', 'Peninsular River Systems (Narmada, Tapi, Godavari, Mahanadi, Krishna, Kaveri)', 'Lakes & Role of rivers in economy'],
        keyFormulasOrConcepts: ['Water Divide', 'West flowing (Rift valley: Narmada, Tapi) vs East flowing (Deltas)', 'National River Conservation Plan (NRCP)']
      },
      {
        id: 'c9-sst-geo4',
        number: 7,
        title: 'Climate',
        unitName: 'Contemporary India - I (Geography)',
        unitWeightageMarks: 5,
        topics: ['Climatic controls', 'Factors affecting India climate: Latitude, Altitude, Pressure and Winds', 'The Indian Monsoon (Mechanism & Onset/Withdrawal)', 'Seasons of India'],
        keyFormulasOrConcepts: ['Coriolis Force (Ferrel Law)', 'El Niño and Southern Oscillation (ENSO)', 'Jet Streams and Western Cyclonic Disturbances']
      },
      {
        id: 'c9-sst-civ1',
        number: 8,
        title: 'What is Democracy? Why Democracy?',
        unitName: 'Democratic Politics - I (Civics)',
        unitWeightageMarks: 5,
        topics: ['Features of democracy', 'Major decisions by elected leaders', 'Free and fair electoral competition', 'One person, one vote, one value', 'Rule of law and respect for rights', 'Arguments for and against democracy'],
        keyFormulasOrConcepts: ['Democracy is a form of government in which rulers are elected by the people', 'Accountable government & Enhances dignity of citizens']
      },
      {
        id: 'c9-sst-civ2',
        number: 9,
        title: 'Constitutional Design',
        unitName: 'Democratic Politics - I (Civics)',
        unitWeightageMarks: 5,
        topics: ['Democratic Constitution in South Africa (Apartheid)', 'Why do we need a Constitution?', 'Making of the Indian Constitution', 'Guiding values and Preamble of Indian Constitution'],
        keyFormulasOrConcepts: ['Constituent Assembly (Adopted 26 Nov 1949, Enacted 26 Jan 1950)', 'Preamble keywords: Sovereign, Socialist, Secular, Democratic, Republic, Justice, Liberty, Equality, Fraternity']
      },
      {
        id: 'c9-sst-civ3',
        number: 10,
        title: 'Electoral Politics',
        unitName: 'Democratic Politics - I (Civics)',
        unitWeightageMarks: 5,
        topics: ['Why Elections?', 'What makes an election democratic?', 'System of elections in India (Constituencies, Reserved constituencies, Voters list, Nomination, Campaign, Polling)', 'Election Commission of India (ECI)'],
        keyFormulasOrConcepts: ['Universal Adult Suffrage (18+ years)', 'Model Code of Conduct', 'Independent Election Commission']
      },
      {
        id: 'c9-sst-civ4',
        number: 11,
        title: 'Working of Institutions',
        unitName: 'Democratic Politics - I (Civics)',
        unitWeightageMarks: 5,
        topics: ['How is a major policy decision taken? (Office Memorandum)', 'Parliament (Lok Sabha vs Rajya Sabha)', 'Political Executive (Prime Minister, Cabinet, President)', 'The Judiciary (Supreme Court, Judicial Review)'],
        keyFormulasOrConcepts: ['Mandal Commission Recommendations (27% OBC quota)', 'Lok Sabha is more powerful in money bills and no-confidence motions', 'Independent and Integrated Judiciary']
      },
      {
        id: 'c9-sst-eco1',
        number: 12,
        title: 'The Story of Village Palampur / People as Resource',
        unitName: 'Economics',
        unitWeightageMarks: 5,
        topics: ['Economic activities: Market & Non-market', 'Human Capital Formation (Education & Health)', 'Unemployment (Disguised & Seasonal unemployment)'],
        keyFormulasOrConcepts: ['Gross National Product & Human Capital Investment', 'Disguised unemployment in agriculture', 'Sarva Shiksha Abhiyan']
      },
      {
        id: 'c9-sst-eco2',
        number: 13,
        title: 'Poverty as a Challenge',
        unitName: 'Economics',
        unitWeightageMarks: 6,
        topics: ['Poverty line estimation in India', 'Vulnerable groups', 'Inter-state disparities', 'Global poverty scenario', 'Causes of poverty', 'Anti-poverty measures (MGNREGA, PMGY, AAY)'],
        keyFormulasOrConcepts: ['Poverty Line: Minimum calorie norm (2400 rural, 2100 urban)', 'MGNREGA 2005 (100 days guaranteed wage employment)']
      },
      {
        id: 'c9-sst-eco3',
        number: 14,
        title: 'Food Security in India',
        unitName: 'Economics',
        unitWeightageMarks: 5,
        topics: ['Dimensions of food security: Availability, Accessibility, Affordability', 'Buffer Stock & Public Distribution System (PDS)', 'Minimum Support Price (MSP) & Issue Price', 'Role of Cooperatives (Amul, Mother Dairy)'],
        keyFormulasOrConcepts: ['FCI (Food Corporation of India) Buffer Stock', 'National Food Security Act (NFSA) 2013', 'Fair Price Shops (FPS)']
      }
    ]
  },
  {
    id: 'class9-english-184',
    name: 'Class 9 English (Language & Literature)',
    code: '184',
    category: 'Languages',
    color: 'from-purple-600 to-violet-700',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    icon: 'BookOpen',
    totalChapters: 12,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      {
        id: 'c9-eng-ch1',
        number: 1,
        title: 'The Fun They Had & The Road Not Taken',
        unitName: 'Beehive (Prose & Poem)',
        unitWeightageMarks: 8,
        topics: ['Isaac Asimov futuristic story about mechanical teachers', 'Robert Frost poem on life choices and individuality'],
        keyFormulasOrConcepts: ['Tommy and Margie finding a real book', 'Two roads diverged in a yellow wood (Metaphor of choice)']
      },
      {
        id: 'c9-eng-ch2',
        number: 2,
        title: 'The Sound of Music & Wind',
        unitName: 'Beehive (Prose & Poem)',
        unitWeightageMarks: 8,
        topics: ['Part I: Evelyn Glennie listens to sound without hearing it', 'Part II: Bismillah Khan and Shehnai', 'Subramania Bharati poem on Wind resilience'],
        keyFormulasOrConcepts: ['Ron Forbes tuning two large drums', 'Bharat Ratna 2001 to Bismillah Khan', 'Wind as symbol of adversity']
      },
      {
        id: 'c9-eng-ch3',
        number: 3,
        title: 'The Little Girl & Rain on the Roof',
        unitName: 'Beehive (Prose & Poem)',
        unitWeightageMarks: 8,
        topics: ['Kezia and her strict father', 'Coates Kinney poem on childhood memories'],
        keyFormulasOrConcepts: ['Kezia making a pin-cushion birthday gift', 'Father caring for Kezia during nightmare']
      },
      {
        id: 'c9-eng-ch4',
        number: 4,
        title: 'A Truly Beautiful Mind & The Lake Isle of Innisfree',
        unitName: 'Beehive (Prose & Poem)',
        unitWeightageMarks: 8,
        topics: ['Albert Einstein biography and peace activism', 'W.B. Yeats poem on seeking peaceful natural solitude'],
        keyFormulasOrConcepts: ['Einstein Nobel Prize in Physics 1921', 'Einstein letter to Franklin D. Roosevelt']
      },
      {
        id: 'c9-eng-ch5',
        number: 5,
        title: 'The Snake and the Mirror & A Legend of the Northland',
        unitName: 'Beehive (Prose & Poem)',
        unitWeightageMarks: 7,
        topics: ['Vaikom Muhammad Basheer humorous narrative', 'Phoebe Cary ballad on greed and St. Peter curse'],
        keyFormulasOrConcepts: ['Homeopathic doctor encountering cobra', 'Greedy woman turned into a woodpecker']
      },
      {
        id: 'c9-eng-ch6',
        number: 6,
        title: 'My Childhood & No Men Are Foreign',
        unitName: 'Beehive (Prose & Poem)',
        unitWeightageMarks: 8,
        topics: ['APJ Abdul Kalam early life in Rameswaram', 'James Kirkup poem on universal brotherhood'],
        keyFormulasOrConcepts: ['Sivasubramania Iyer scientific and liberal mindset', 'No men are strange, no countries foreign']
      },
      {
        id: 'c9-eng-ch7',
        number: 7,
        title: 'Reach for the Top (Santosh Yadav & Maria Sharapova)',
        unitName: 'Beehive (Prose)',
        unitWeightageMarks: 8,
        topics: ['Santosh Yadav scale of Mt Everest twice', 'Maria Sharapova determination and sacrifice in tennis'],
        keyFormulasOrConcepts: ['Environmental concern (500 kg garbage brought down from Everest)', 'Dedication to Russian nationality']
      },
      {
        id: 'c9-eng-ch8',
        number: 8,
        title: 'The Lost Child',
        unitName: 'Moments (Supplementary)',
        unitWeightageMarks: 6,
        topics: ['Mulk Raj Anand story about child emotional longing vs materialistic desires'],
        keyFormulasOrConcepts: ['Child fascinated by toys and sweets at fair', 'Panic and realization that parents are supreme priority']
      },
      {
        id: 'c9-eng-ch9',
        number: 9,
        title: 'The Adventures of Toto',
        unitName: 'Moments (Supplementary)',
        unitWeightageMarks: 5,
        topics: ['Ruskin Bond humorous account of a mischievous pet monkey'],
        keyFormulasOrConcepts: ['Grandfather buying Toto for 5 rupees from tonga driver', 'Toto mischievous acts leading to ticket collector charging fare']
      },
      {
        id: 'c9-eng-ch10',
        number: 10,
        title: 'Iswaran the Storyteller & In the Kingdom of Fools',
        unitName: 'Moments (Supplementary)',
        unitWeightageMarks: 6,
        topics: ['Iswaran dramatized narration for Mahendra', 'Kannada folktale of a foolish king and clever Guru'],
        keyFormulasOrConcepts: ['Tusker elephant story and female ghost story', 'Everything costing one Duddu', 'Guru saving disciple with wit']
      },
      {
        id: 'c9-eng-ch11',
        number: 11,
        title: 'The Happy Prince & The Last Leaf',
        unitName: 'Moments (Supplementary)',
        unitWeightageMarks: 8,
        topics: ['Oscar Wilde story of self-sacrifice of Prince and Little Swallow', 'O. Henry masterpiece of Behrman painted leaf saving Johnsy'],
        keyFormulasOrConcepts: ['Happy Prince giving ruby, sapphires and gold leaf to needy', 'Behrman masterpiece painted in freezing rain']
      },
      {
        id: 'c9-eng-ch12',
        number: 12,
        title: 'Integrated Grammar & Creative Writing',
        unitName: 'Grammar & Writing Skills',
        unitWeightageMarks: 20,
        topics: ['Tenses', 'Modals', 'Subject-Verb Concord', 'Reported Speech (Commands, Statements, Questions)', 'Descriptive Paragraph (Person/Event/Situation)', 'Story Writing from Outline / Diary Entry'],
        keyFormulasOrConcepts: ['Reported Speech transformation rules', 'Subject-verb concord with either/neither/each', 'Formal diary entry format']
      }
    ]
  },
  {
    id: 'class9-hindi-002',
    name: 'Class 9 Hindi (Course A)',
    code: '002',
    category: 'Languages',
    color: 'from-rose-600 to-pink-700',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    icon: 'Languages',
    totalChapters: 8,
    standardMarks: 80,
    standardTime: 180,
    chapters: [
      {
        id: 'c9-hin-ch1',
        number: 1,
        title: 'दो बैलों की कथा (प्रेमचंद)',
        unitName: 'क्षितिज भाग-1 (गद्य खंड)',
        unitWeightageMarks: 7,
        topics: ['हीरा और मोती की आत्मीय मित्रता', 'पशुओं की मूक भाषा और स्वाभिमान', 'गया के अत्याचार और कांजीहौस की घटना'],
        keyFormulasOrConcepts: ['प्रेमचंद का यथार्थवादी दृष्टिकोण', 'स्वतंत्रता सहज नहीं मिलती, संघर्ष करना पड़ता है']
      },
      {
        id: 'c9-hin-ch2',
        number: 2,
        title: 'ल्हासा की ओर (राहुल सांकृत्यायन)',
        unitName: 'क्षितिज भाग-1 (गद्य खंड)',
        unitWeightageMarks: 6,
        topics: ['तिब्बत यात्रा वृत्तांत', 'डांडे की विकट परिस्थितियाँ', 'सुमति का परिचय और बौद्ध धर्म प्रभाव'],
        keyFormulasOrConcepts: ['तिब्बती समाज में पर्दा प्रथा न होना', 'भिखमंगे के वेश में यात्रा का कारण']
      },
      {
        id: 'c9-hin-ch3',
        number: 3,
        title: 'उपभोक्तावाद की संस्कृति (श्यामाचरण दुबे)',
        unitName: 'क्षितिज भाग-1 (गद्य खंड)',
        unitWeightageMarks: 6,
        topics: ['दिखावे की संस्कृति और विज्ञापन का प्रभाव', 'सामाजिक सरोकार और नैतिक मूल्यों का ह्रास'],
        keyFormulasOrConcepts: ['हम विज्ञापनों के गुलाम बन रहे हैं', 'उपभोग को ही सुख मान लेना']
      },
      {
        id: 'c9-hin-ch4',
        number: 4,
        title: 'साँवले सपनों की याद (जाबिर हुसैन)',
        unitName: 'क्षितिज भाग-1 (गद्य खंड)',
        unitWeightageMarks: 6,
        topics: ['प्रसिद्ध पक्षी विज्ञानी सालिम अली का जीवन', 'प्रकृति और पक्षी संरक्षण का संदेश'],
        keyFormulasOrConcepts: ['सालिम अली का ‘फॉल ऑफ अ स्पैरो’', 'प्रकृति को प्रकृति की नज़र से देखना']
      },
      {
        id: 'c9-hin-ch5',
        number: 5,
        title: 'साखियाँ एवं सबद (कबीरदास)',
        unitName: 'क्षितिज भाग-1 (काव्य खंड)',
        unitWeightageMarks: 7,
        topics: ['ज्ञान की महत्ता और ईश्वर की सर्वव्यापकता', 'वाह्य आडंबरों और पाखंडों का खंडन'],
        keyFormulasOrConcepts: ['मोको कहाँ ढूँढ़े बंदे, मैं तो तेरे पास में', 'सद्गुरु की महिमा']
      },
      {
        id: 'c9-hin-ch6',
        number: 6,
        title: 'वाख (ललद्यद) व सवैये (रसखान)',
        unitName: 'क्षितिज भाग-1 (काव्य खंड)',
        unitWeightageMarks: 7,
        topics: ['ललद्यद की ईश्वर प्राप्ति की तड़प', 'रसखान की श्रीकृष्ण और ब्रजभूमि के प्रति अनन्य भक्ति'],
        keyFormulasOrConcepts: ['रस्सी कच्चे धागे की खींच रही मैं नाव', 'मानुष हों तो वही रसखानि बसौं ब्रज गोकुल गाँव के ग्वारन']
      },
      {
        id: 'c9-hin-ch7',
        number: 7,
        title: 'इस जल प्रलय में व मेरे संग की औरतें',
        unitName: 'कृतिका भाग-1',
        unitWeightageMarks: 8,
        topics: ['फणीश्वरनाथ रेणु का पटना बाढ़ का सजीव चित्रण', 'मृदुला गर्ग का स्वतंत्र चेता पारिवारिक नारियों का वर्णन'],
        keyFormulasOrConcepts: ['बाढ़ की विभीषिका और मानवीय संवेदनशीलता', 'परंपराओं से हटकर स्वतंत्र व्यक्तित्व']
      },
      {
        id: 'c9-hin-ch8',
        number: 8,
        title: 'व्यावहारिक व्याकरण एवं रचनात्मक लेखन',
        unitName: 'व्याकरण एवं लेखन',
        unitWeightageMarks: 33,
        topics: ['उपसर्ग एवं प्रत्यय', 'समास (अव्ययीभाव, तत्पुरुष, कर्मधारय, द्विगु, द्वंद्व, बहुव्रीहि)', 'अर्थ की दृष्टि से वाक्य भेद (8 भेद)', 'अलंकार (अनुप्रास, यमक, उपमा, रूपक, उत्प्रेक्षा, अतिशयोक्ति)', 'अनुच्छेद लेखन, पत्र लेखन, संवाद लेखन / लघुकथा लेखन'],
        keyFormulasOrConcepts: ['उपसर्ग-प्रत्यय मूल शब्द विभाजन', 'अर्थ के आधार पर 8 वाक्य भेद रूपांतरण', 'अलंकार पहचान के नियम']
      }
    ]
  }
];
