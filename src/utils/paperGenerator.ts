import { PaperConfig, GeneratedPaper, Question, PaperSection } from '../types';
import { CBSE_SUBJECTS, PRELOADED_QUESTIONS } from '../data/cbseData';
import { MATH_MCQ_BANK, SCIENCE_MCQ_BANK, SOCIAL_MCQ_BANK, ENGLISH_MCQ_BANK, IT_MCQ_BANK, HINDI_A_MCQ_BANK, HINDI_B_MCQ_BANK, PHYSICS_11_MCQ_BANK, CHEMISTRY_11_MCQ_BANK, MATH_11_MCQ_BANK, ENGLISH_11_MCQ_BANK } from '../data/textbookQuestions';
import { getMasterPool } from '../data/masterQuestionPool';
import { generatePaperCode } from './paperRegistry';
import { generateCombinatorialPaperFromVault } from './questionVault';

export function getGeneralInstructions(totalMarks: number, timeMinutes: number, subjectId?: string, subjectName?: string): string[] {
  const s = (subjectId || '').toLowerCase();
  const n = (subjectName || '').toLowerCase();

  // Subject-specific tailored board instructions
  if (s.includes('sociology') || s.includes('039') || n.includes('sociology')) {
    if (totalMarks >= 70) {
      return [
        "This question paper consists of 38 questions divided into 5 Sections: A, B, C, D and E.",
        "All questions are compulsory. Internal choices are provided in 2 questions of Section C and all questions of Section D.",
        "Section A comprises 20 Objective Type questions (MCQs and Assertion-Reasoning) carrying 1 mark each.",
        "Section B comprises 4 Very Short Answer (VSA) type questions carrying 2 marks each. Answers should not exceed 30 to 50 words.",
        "Section C comprises 8 Short Answer (SA) type questions carrying 3 marks each. Answers should not exceed 50 to 80 words.",
        "Section D comprises 3 Long Answer (LA) type questions carrying 5 marks each. Answers should be analytical and comprehensive (120 to 150 words).",
        "Section E comprises 3 Case-Based / Source-Based integrated units of assessment carrying 4 marks each with sub-parts (i), (ii), and (iii)."
      ];
    }
  }

  if (s.includes('history') || s.includes('027') || n.includes('history')) {
    if (totalMarks >= 70) {
      return [
        "This question paper consists of 34 questions divided into 5 Sections: A, B, C, D and E.",
        "All questions are compulsory. Internal choices are provided in 2 questions of Section C and all questions of Section D.",
        "Section A (Q1 to Q21) comprises 21 MCQs carrying 1 mark each.",
        "Section B (Q22 to Q27) comprises 6 Short Answer type questions carrying 3 marks each. Answers should not exceed 100 words.",
        "Section C (Q28 to Q30) comprises 3 Long Answer type questions carrying 8 marks each. Answers should not exceed 350 words.",
        "Section D (Q31 to Q33) comprises 3 Source-Based questions carrying 4 marks each with sub-parts.",
        "Section E (Q34) is Map-Based carrying 5 marks."
      ];
    }
  }

  if (totalMarks >= 70) {
    return [
      "This question paper contains questions divided into 5 Sections: A, B, C, D and E.",
      "All questions are compulsory. Internal choices are provided in 2 questions of Section C, all questions of Section D, and 1 question of Section E.",
      "Section A comprises Objective Type questions (MCQs and Assertion-Reasoning) carrying 1 mark each.",
      "Section B comprises Very Short Answer (VSA) type questions carrying 2 marks each. Answers should be within 30 to 50 words.",
      "Section C comprises Short Answer (SA) type questions carrying 3 marks each. Answers should be within 50 to 80 words.",
      "Section D comprises Long Answer (LA) type questions carrying 5 marks each. Answers should be within 120 to 150 words.",
      "Section E comprises Case-Based / Source-Based integrated units of assessment carrying 4 marks each with sub-parts (i), (ii), and (iii).",
      "There is no overall choice. Wherever necessary, neat, properly labeled diagrams and step-wise calculations should be shown."
    ];
  } else if (totalMarks >= 40) {
    return [
      "This Periodic Assessment paper consists of questions across 4 Sections: A, B, C and D.",
      "Section A consists of Objective MCQs / Assertion-Reasoning carrying 1 mark each.",
      "Section B consists of Very Short Answer questions carrying 2 marks each.",
      "Section C consists of Short / Long Answer questions carrying 3 marks each with internal choices.",
      "Section D consists of Case-Based / Competency units carrying 4 marks each.",
      "All questions are compulsory."
    ];
  } else {
    return [
      "This Unit Test Paper consists of questions carrying a total of " + totalMarks + " marks.",
      "Section A contains Objective MCQs of 1 mark each.",
      "Section B contains Short Answer questions of 2 marks each.",
      "Section C contains Long / Case Study questions of 4/5 marks each.",
      "All questions are compulsory."
    ];
  }
}

// Helper function for Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Robust sanitization function to strip placeholders and variants
const sanitize = (text: string) => {
  return text
    .replace(/\[.*?\]/g, '') // Strip bracketed text/numbers
    .replace(/Variant\s*\d+/gi, '') // Strip 'Variant 1', 'Variant 2'
    .replace(/Option\s*[A-D]/gi, '') // Strip 'Option A', 'Option B'
    .trim();
};

// Generate dynamic question variations with randomized numericals and contexts
function randomizeQuestionContent(q: Question, seedIndex: number): Question {
  const newQ = { ...q, id: `${q.id}-var-${Date.now()}-${seedIndex}` };

  if (q.questionText.includes('focal length 15 cm') || q.questionText.includes('focal length')) {
    const fVals = [10, 12, 15, 20, 25];
    const uVals = [20, 24, 30, 40, 50];
    const pickIdx = (seedIndex + Math.floor(Math.random() * fVals.length)) % fVals.length;
    const f = fVals[pickIdx];
    const u = uVals[pickIdx];
    const v = (f * u) / (u - f);
    const m = -v / u;
    newQ.questionText = `An optical bench experiment uses a convex lens of focal length ${f} cm. A lighted candle is placed at ${u} cm in front of the lens.\n(a) At what distance will the sharp image be formed on the screen?\n(b) Calculate the magnification produced.`;
    newQ.correctAnswer = `Using lens formula 1/f = 1/v - 1/u => 1/${f} = 1/v - 1/(-${u}) => v = +${v.toFixed(1)} cm. Magnification m = v/u = (+${v.toFixed(1)})/(-${u}) = ${m.toFixed(2)}.`;
    newQ.markingScheme = `[1 Mark] 1/f = 1/v - 1/u substitution\n[1 Mark] Image distance v = +${v.toFixed(1)} cm\n[1 Mark] Magnification calculation m = ${m.toFixed(2)}`;
  } else if (q.questionText.includes('HCF(306, 657)')) {
    const aVals = [306, 210, 144, 96];
    const bVals = [657, 55, 180, 404];
    const hcfVals = [9, 5, 36, 4];
    const idx = seedIndex % aVals.length;
    const a = aVals[idx];
    const b = bVals[idx];
    const hcf = hcfVals[idx];
    const lcm = (a * b) / hcf;
    newQ.questionText = `If HCF(${a}, ${b}) = ${hcf}, then LCM(${a}, ${b}) is equal to:`;
    newQ.options = shuffleArray([`A) ${lcm}`, `B) ${lcm - 10}`, `C) ${lcm + 50}`, `D) ${lcm + 100}`]);
    newQ.correctAnswer = `A) ${lcm}`;
    newQ.markingScheme = `1 Mark for applying LCM = (a × b)/HCF = (${a} × ${b})/${hcf} = ${lcm}.`;
  } else if (q.options && q.options.length > 0) {
    newQ.options = shuffleArray(q.options);
  }

  return newQ;
}

// ---------------------------------------------------------------------------
// QUESTION BANKS NOW IMPORTED FROM ../data/textbookQuestions.ts
// ---------------------------------------------------------------------------

// GENERATOR ENGINE FOR SUBJECT MCQS
function generateSubjectMcq(subjectId: string, idx: number, usedTexts: Set<string>): Question {
  const ts = Date.now();

  const master = getMasterPool(subjectId);
  if (master && master.mcqs && master.mcqs.length > 0) {
    let pickIdx = idx % master.mcqs.length;
    let attempts = 0;
    while (usedTexts.has(master.mcqs[pickIdx].q) && attempts < master.mcqs.length) {
      pickIdx = (pickIdx + 1) % master.mcqs.length;
      attempts++;
    }
    const item = master.mcqs[pickIdx];
    usedTexts.add(item.q);
    return {
      id: `gen-${subjectId}-mcq-${ts}-${idx}`,
      subjectId,
      chapterId: 'ch1',
      chapterName: item.ch,
      type: idx % 5 === 0 ? 'ar' : 'mcq',
      marks: 1,
      difficulty: 'medium',
      isCompetency: idx % 2 === 1,
      questionText: sanitize(item.q),
      options: shuffleArray((item.opts || ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4']).map(sanitize)),
      correctAnswer: sanitize(item.ans),
      markingScheme: `1 Mark for choosing correct option (${item.ans.charAt(0)}).`,
      explanation: item.exp || 'Official CBSE Board Marking Scheme Requirement.'
    };
  }

  let bank: { q: string; opts: string[]; ans: string; ch: string }[] | null = null;

  // Handle Class 11
  if (subjectId.includes('-11')) {
    if (subjectId.includes('physics')) bank = PHYSICS_11_MCQ_BANK[1];
    else if (subjectId.includes('chemistry')) bank = CHEMISTRY_11_MCQ_BANK[1];
    else if (subjectId.includes('maths')) bank = MATH_11_MCQ_BANK[1];
    else if (subjectId.includes('english')) bank = ENGLISH_11_MCQ_BANK[1];
  } else {
    // Existing Class 9/10/12 logic
    if (subjectId.includes('maths')) bank = MATH_MCQ_BANK[1];
    else if (subjectId.includes('social') || subjectId.includes('history') || subjectId.includes('pol') || subjectId.includes('geo') || subjectId.includes('soc')) bank = SOCIAL_MCQ_BANK[1];
    else if (subjectId.includes('english')) bank = ENGLISH_MCQ_BANK[1];
    else if (subjectId.includes('it-402') || subjectId.includes('computer')) bank = IT_MCQ_BANK[1];
    else if (subjectId.includes('hindi-002') || subjectId.includes('hindi-a')) bank = HINDI_A_MCQ_BANK[1];
    else if (subjectId.includes('hindi-085') || subjectId.includes('hindi-b')) bank = HINDI_B_MCQ_BANK[1];
    else bank = SCIENCE_MCQ_BANK[1];
  }

  if (!bank || bank.length === 0) {
    bank = SCIENCE_MCQ_BANK[1];
  }

  // Pick item from bank that hasn't been used yet
  let pickIdx = idx % bank.length;
  let attempts = 0;
  while (usedTexts.has(bank[pickIdx].q) && attempts < bank.length) {
    pickIdx = (pickIdx + 1) % bank.length;
    attempts++;
  }

  const item = bank[pickIdx];
  usedTexts.add(item.q);

  return {
    id: `gen-${subjectId}-mcq-${ts}-${idx}`,
    subjectId,
    chapterId: 'ch1',
    chapterName: item.ch,
    type: idx % 5 === 0 ? 'ar' : 'mcq',
    marks: 1,
    difficulty: 'medium',
    isCompetency: idx % 2 === 1,
    questionText: sanitize(item.q),
    options: shuffleArray(item.opts.map(sanitize)),
    correctAnswer: sanitize(item.ans),
    markingScheme: `1 Mark for choosing correct option (${item.ans.charAt(0)}).`,
    explanation: 'Official CBSE Board Marking Scheme Requirement.'
  };
}

// GENERATOR ENGINE FOR VSAs (2 MARKS)
function generateSubjectVsa(subjectId: string, idx: number, usedTexts: Set<string>): Question {
  const ts = Date.now();

  const master = getMasterPool(subjectId);
  if (master && master.vsas && master.vsas.length > 0) {
    let pickIdx = idx % master.vsas.length;
    let attempts = 0;
    while (usedTexts.has(master.vsas[pickIdx].q) && attempts < master.vsas.length) {
      pickIdx = (pickIdx + 1) % master.vsas.length;
      attempts++;
    }
    const item = master.vsas[pickIdx];
    usedTexts.add(item.q);
    return {
      id: `gen-${subjectId}-vsa-${ts}-${idx}`,
      subjectId,
      chapterId: 'ch1',
      chapterName: item.ch,
      type: 'vsa',
      marks: 2,
      difficulty: 'medium',
      isCompetency: true,
      questionText: sanitize(item.q),
      correctAnswer: sanitize(item.ans),
      markingScheme: item.ms || "[1 Mark] Correct definition/concept\n[1 Mark] Accurate step result/explanation",
      explanation: "Step-wise marking scheme according to CBSE guidelines."
    };
  }

  const item = getSubjectFallbackQuestion(subjectId, 'vsa', idx, usedTexts);
  return {
    id: `gen-${subjectId}-vsa-${ts}-${idx}`,
    subjectId,
    chapterId: 'ch1',
    chapterName: item.ch,
    type: 'vsa',
    marks: 2,
    difficulty: 'medium',
    isCompetency: true,
    questionText: sanitize(item.q),
    correctAnswer: sanitize(item.ans),
    markingScheme: item.ms || "[1 Mark] Correct definition/formula\n[1 Mark] Accurate step result/explanation",
    explanation: "Step-wise marking scheme according to CBSE board guidelines."
  };
}

// GENERATOR ENGINE FOR SAs (3 MARKS)
function generateSubjectSa(subjectId: string, idx: number, usedTexts: Set<string>): Question {
  const ts = Date.now();

  const master = getMasterPool(subjectId);
  if (master && master.sas && master.sas.length > 0) {
    let pickIdx = idx % master.sas.length;
    let attempts = 0;
    while (usedTexts.has(master.sas[pickIdx].q) && attempts < master.sas.length) {
      pickIdx = (pickIdx + 1) % master.sas.length;
      attempts++;
    }
    const item = master.sas[pickIdx];
    usedTexts.add(item.q);
    return {
      id: `gen-${subjectId}-sa-${ts}-${idx}`,
      subjectId,
      chapterId: 'ch1',
      chapterName: item.ch,
      type: 'sa',
      marks: 3,
      difficulty: 'medium',
      isCompetency: true,
      questionText: sanitize(item.q),
      correctAnswer: sanitize(item.ans),
      markingScheme: item.ms || "[1 Mark] Definition/Formula\n[2 Marks] Detailed explanation/stepwise solution",
      explanation: "3 Marks Short Answer Board Marking Scheme."
    };
  }

  const item = getSubjectFallbackQuestion(subjectId, 'sa', idx, usedTexts);
  return {
    id: `gen-${subjectId}-sa-${ts}-${idx}`,
    subjectId,
    chapterId: 'ch1',
    chapterName: item.ch,
    type: 'sa',
    marks: 3,
    difficulty: 'medium',
    isCompetency: true,
    questionText: sanitize(item.q),
    correctAnswer: sanitize(item.ans),
    markingScheme: item.ms || "[1 Mark] Formula/Concept derivation\n[1 Mark] Intermediate calculation/logic\n[1 Mark] Final answer with correct units/conclusion",
    explanation: "3 Marks Short Answer Board Scheme."
  };
}

// GENERATOR ENGINE FOR LAs (5 MARKS)
function generateSubjectLa(subjectId: string, idx: number, usedTexts: Set<string>): Question {
  const ts = Date.now();

  const master = getMasterPool(subjectId);
  if (master && master.las && master.las.length > 0) {
    let pickIdx = idx % master.las.length;
    let attempts = 0;
    while (usedTexts.has(master.las[pickIdx].q) && attempts < master.las.length) {
      pickIdx = (pickIdx + 1) % master.las.length;
      attempts++;
    }
    const item = master.las[pickIdx];
    usedTexts.add(item.q);
    return {
      id: `gen-${subjectId}-la-${ts}-${idx}`,
      subjectId,
      chapterId: 'ch1',
      chapterName: item.ch,
      type: 'la',
      marks: 5,
      difficulty: 'hard',
      isCompetency: true,
      questionText: sanitize(item.q),
      correctAnswer: sanitize(item.ans),
      markingScheme: item.ms || "[1 Mark] Correct formula/diagram\n[2 Marks] Stepwise calculations\n[2 Marks] Final answer with unit & conclusion",
      explanation: "5 Marks Long Answer Board Scheme."
    };
  }

  const item = getSubjectFallbackQuestion(subjectId, 'la', idx, usedTexts);
  return {
    id: `gen-${subjectId}-la-${ts}-${idx}`,
    subjectId,
    chapterId: 'ch1',
    chapterName: item.ch,
    type: 'la',
    marks: 5,
    difficulty: 'hard',
    isCompetency: true,
    questionText: sanitize(item.q),
    correctAnswer: sanitize(item.ans),
    markingScheme: item.ms || "[1 Mark] Correct formula/diagram\n[2 Marks] Stepwise calculations\n[2 Marks] Final answer with unit & conclusion",
    explanation: "5 Marks Long Answer Board Scheme."
  };
}

// GENERATOR ENGINE FOR CASE STUDY ASSESSMENT (4 MARKS EACH)
function generateSubjectCase(subjectId: string, idx: number, usedTexts: Set<string>): Question {
  const ts = Date.now();

  const master = getMasterPool(subjectId);
  if (master && master.cases && master.cases.length > 0) {
    let pickIdx = idx % master.cases.length;
    let attempts = 0;
    while (usedTexts.has(master.cases[pickIdx].q) && attempts < master.cases.length) {
      pickIdx = (pickIdx + 1) % master.cases.length;
      attempts++;
    }
    const item = master.cases[pickIdx];
    usedTexts.add(item.q);
    return {
      id: `gen-${subjectId}-case-${ts}-${idx}`,
      subjectId,
      chapterId: 'ch1',
      chapterName: item.ch,
      type: 'case',
      marks: 4,
      difficulty: 'hard',
      isCompetency: true,
      casePassage: sanitize(item.passage || ''),
      questionText: sanitize(item.q),
      correctAnswer: sanitize(item.ans),
      markingScheme: (item as any).ms || "[1 Mark] Q1 Answer\n[2 Marks] Q2 Answer with working\n[1 Mark] Q3 Answer",
      explanation: "4 Marks Integrated Case Study Unit."
    };
  }

  const item = getSubjectFallbackQuestion(subjectId, 'case', idx, usedTexts);
  return {
    id: `gen-${subjectId}-case-${ts}-${idx}`,
    subjectId,
    chapterId: 'ch1',
    chapterName: item.ch,
    type: 'case',
    marks: 4,
    difficulty: 'hard',
    isCompetency: true,
    casePassage: sanitize(item.passage || ''),
    questionText: sanitize(item.q),
    correctAnswer: sanitize(item.ans),
    markingScheme: item.ms || "[1 Mark] Q1 Answer\n[2 Marks] Q2 Answer with working\n[1 Mark] Q3 Answer",
    explanation: "4 Marks Integrated Case Study Unit."
  };
}

// ---------------------------------------------------------------------------
// DEDICATED AUTHENTIC FALLBACK QUESTION BANKS FOR ALL CBSE SUBJECTS
// ---------------------------------------------------------------------------
interface FallbackItem {
  q: string;
  ans: string;
  ch: string;
  ms?: string;
  passage?: string;
}

function getSubjectFallbackQuestion(
  subjectId: string,
  type: 'vsa' | 'sa' | 'la' | 'case',
  idx: number,
  usedTexts: Set<string>
): FallbackItem {
  const lower = (subjectId || '').toLowerCase();

  // 1. PHYSICS (042)
  if (lower.includes('phy') || lower.includes('042')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "State Gauss's Law in electrostatics and write its mathematical formula for a closed surface enclosing total charge Q.", ans: "Gauss's Law states that total electric flux ∮ E·dA through any closed surface in vacuum equals Q_enclosed / ε₀.", ch: "Electric Charges and Fields" },
        { q: "Define electric susceptibility and magnetic permeability of a magnetic substance.", ans: "Electric susceptibility χ_e measures how easily a dielectric polarizes in an electric field (P = ε₀ χ_e E). Magnetic permeability μ relates B and H (B = μH).", ch: "Magnetism and Matter" },
        { q: "What is de Broglie wavelength? Calculate wavelength associated with an electron accelerated through potential difference V = 100 V.", ans: "λ = h / p = 1.227 / √V nm. For V = 100 V, λ = 1.227 / 10 = 0.1227 nm (1.227 Å).", ch: "Dual Nature of Radiation and Matter" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "Derive an expression for the potential energy of an electric dipole placed in a uniform external electric field E at an angle θ.", ans: "Work done dW = τ dθ = pE sinθ dθ. Integrating from θ1 to θ2: U = -pE(cosθ2 - cosθ1). For standard reference (θ1=90°, θ2=θ), U = -pE cosθ = -p·E.", ch: "Electrostatic Potential and Capacitance" },
        { q: "With a neat circuit diagram, explain the principle and working of a Full Wave Bridge Rectifier using p-n junction diodes.", ans: "Converts AC into pulsating DC. Uses 4 diodes in bridge formation. During positive half cycle D1 & D3 conduct; during negative half cycle D2 & D4 conduct, yielding unidirectional output.", ch: "Semiconductor Electronics" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "(a) State Lens Maker's Formula and derive it for a thin convex lens of radii R1 and R2 immersed in medium of refractive index n1.\n(b) A convex lens of focal length 20 cm in air is immersed in water (refractive index 4/3). Calculate its new focal length in water.", ans: "(a) 1/f = (n2/n1 - 1)(1/R1 - 1/R2).\n(b) f_water / f_air = [(n_g - 1)] / [(n_g/n_w - 1)] = (1.5 - 1) / (1.5 / 1.333 - 1) = 0.5 / 0.125 = 4. f_water = 4 × 20 = 80 cm.", ch: "Ray Optics and Optical Instruments" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "A astronomical telescope consists of an objective lens of focal length fo = 100 cm and aperture 10 cm, and an eyepiece lens of focal length fe = 5 cm.",
        q: "Q1. Calculate the magnifying power M of the telescope in normal adjustment. (1M)\nQ2. What is the length of the telescope tube in normal adjustment? (1M)\nQ3. State two advantages of a reflecting telescope (Cassegrain) over a refracting telescope. (2M)",
        ans: "Q1. M = -fo / fe = -100 / 5 = -20.\nQ2. L = fo + fe = 100 + 5 = 105 cm.\nQ3. 1. Free from chromatic aberration. 2. Spherical aberration is minimized using parabolic mirrors.",
        ch: "Ray Optics and Optical Instruments"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 2. CHEMISTRY (043)
  if (lower.includes('chem') || lower.includes('043')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "State Raoult's Law for a solution containing volatile liquids. How does a non-ideal solution showing positive deviation differ from an ideal solution?", ans: "Raoult's Law: Partial vapor pressure of each volatile component is p_i = p_i° x_i. Positive deviation shows ΔH_mix > 0 and ΔV_mix > 0 due to weaker solute-solvent interactions.", ch: "Solutions" },
        { q: "Define molar conductivity (Λm). Write the relation between Λm and specific conductivity (κ) for a solution of concentration C mol/L.", ans: "Λm = (κ × 1000) / M S cm² mol⁻¹. It is the conducting power of all ions produced by dissolving 1 mole of electrolyte in V cm³ solution.", ch: "Electrochemistry" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "A first order reaction is 50% complete in 40 minutes at 300 K. Calculate rate constant k and time required for 90% completion of the reaction.", ans: "k = 0.693 / t1/2 = 0.693 / 40 = 0.01732 min⁻¹. t_90% = (2.303 / k) log(100/10) = 2.303 / 0.01732 = 132.96 minutes.", ch: "Chemical Kinetics" },
        { q: "Explain SN1 and SN2 reaction mechanisms with stereochemical consequences (inversion vs racemization).", ans: "SN1: Two-step mechanism via carbocation intermediate leading to racemization.\nSN2: One-step bimolecular transition state leading to complete Walden inversion.", ch: "Haloalkanes and Haloarenes" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "(a) An organic compound 'A' (C7H6O) reacts with NaOH and benzaldehyde to undergo Cannizzaro reaction giving 'B' and 'C'. Identify A, B, C.\n(b) Write chemical equations for Aldol Condensation, Clemmensen Reduction, and Wolff-Kishner Reduction.", ans: "(a) A = Benzaldehyde (C6H5CHO), B = Sodium Benzoate (C6H5COONa), C = Benzyl Alcohol (C6H5CH2OH).\n(b) Aldol: 2CH3CHO + dil.NaOH → CH3CH(OH)CH2CHO.\nClemmensen: >C=O + Zn-Hg/HCl → >CH2 + H2O.\nWolff-Kishner: >C=O + NH2NH2/KOH → >CH2.", ch: "Aldehydes, Ketones and Carboxylic Acids" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "A galvanic cell consists of a Zinc rod dipped in 1.0 M ZnSO4 solution and a Copper rod dipped in 1.0 M CuSO4 solution at 298 K. Given E°(Zn²⁺/Zn) = -0.76 V and E°(Cu²⁺/Cu) = +0.34 V.",
        q: "Q1. Write the cell representation and calculate standard EMF E°cell. (1M)\nQ2. Identify cathode, anode, and direction of electron flow in external circuit. (1M)\nQ3. How will cell EMF change if concentration of Zn²⁺ is increased to 2.0 M keeping Cu²⁺ constant? Use Nernst Equation. (2M)",
        ans: "Q1. Zn(s)|Zn²⁺(aq,1M) || Cu²⁺(aq,1M)|Cu(s). E°cell = +0.34 - (-0.76) = 1.10 V.\nQ2. Anode = Zn, Cathode = Cu. Electrons flow from Zn to Cu in external circuit.\nQ3. E = E° - (0.0591/2) log([Zn²⁺]/[Cu²⁺]) = 1.10 - 0.0295 log(2/1) = 1.10 - 0.00888 = 1.091 V (EMF decreases).",
        ch: "Electrochemistry"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 3. BIOLOGY (044)
  if (lower.includes('bio') || lower.includes('044')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "Differentiate between microsporogenesis and megasporogenesis in angiosperms.", ans: "Microsporogenesis: Formation of microspores (pollen grains) from microspore mother cell via meiosis in anther.\nMegasporogenesis: Formation of megaspores from megaspore mother cell in ovule ovary.", ch: "Sexual Reproduction in Flowering Plants" },
        { q: "State Hershey and Chase experiment principle proving DNA as genetic material.", ans: "Used radioactive isotopes 35S (labeled protein coat) and 32P (labeled DNA) with T2 bacteriophage infecting E. coli. Radioactive 32P entered bacteria, proving DNA is genetic material.", ch: "Molecular Basis of Inheritance" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "Explain the central dogma of molecular biology. Describe transcription unit structure with promoter, structural gene, and terminator.", ans: "Central Dogma: Replication → DNA → Transcription → RNA → Translation → Protein. Promoter binds RNA polymerase, structural gene codes protein, terminator halts transcription.", ch: "Molecular Basis of Inheritance" },
        { q: "Describe the steps involved in Recombinant DNA Technology using restriction endonucleases, DNA ligase, and competent host cells.", ans: "1. Isolation of target gene. 2. Cutting vector & insert with same restriction enzyme. 3. Ligation using DNA ligase to form rDNA. 4. Transformation into host cells.", ch: "Biotechnology: Principles and Processes" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "(a) Describe human male reproductive system with neat labeled diagram of seminiferous tubule.\n(b) Explain hormonal regulation of spermatogenesis including role of GnRH, LH, FSH, and Testosterone.", ans: "(a) Testes contain seminiferous tubules lined by spermatogonia and Sertoli cells.\n(b) Hypothalamus releases GnRH → Pituitary secretes LH (acts on Leydig cells → Testosterone) & FSH (acts on Sertoli cells → Spermiogenesis).", ch: "Human Reproduction" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "Genetically engineered insulin (Humulin) was synthesized by Eli Lilly in 1983 by introducing DNA sequences for chains A and B separately into E. coli plasmids.",
        q: "Q1. How is pro-insulin structurally different from mature functional human insulin? (1M)\nQ2. Name the chemical bonds linking chain A and chain B in active insulin. (1M)\nQ3. Explain why bovine/porcine insulin caused allergic reactions in diabetic human patients. (2M)",
        ans: "Q1. Pro-insulin contains C-peptide which is removed during maturation.\nQ2. Disulfide bonds (-S-S-).\nQ3. Foreign animal proteins triggered immune inflammatory antibody responses in humans.",
        ch: "Biotechnology and its Applications"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 4. CLASS 11/12 MATHEMATICS (041)
  if ((lower.includes('math') || lower.includes('041')) && (lower.includes('12') || lower.includes('11') || lower.includes('cbse12') || lower.includes('cbse11') || lower.includes('-11'))) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "Evaluate integral ∫ (2x + 3) / (x² + 3x + 5) dx.", ans: "Let u = x² + 3x + 5 => du = (2x + 3) dx. Integral = ∫ du / u = ln|x² + 3x + 5| + C.", ch: "Integrals" },
        { q: "Find the unit vector perpendicular to both vectors a⃗ = 2î + ĵ + k̂ and b⃗ = î - ĵ + 2k̂.", ans: "a⃗ × b⃗ = |î ĵ k̂; 2 1 1; 1 -1 2| = 3î - 3ĵ - 3k̂. Magnitude = 3√3. Unit vector n̂ = (î - ĵ - k̂) / √3.", ch: "Vector Algebra" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "Find the shortest distance between parallel/skew lines r⃗ = (î + 2ĵ + k̂) + λ(î - ĵ + k̂) and r⃗ = (2î - ĵ - k̂) + μ(2î + ĵ + 2k̂).", ans: "a2⃗ - a1⃗ = î - 3ĵ - 2k̂. b1⃗ × b2⃗ = -3î + 3k̂. Magnitude = 3√2. Shortest distance d = |(a2-a1)·(b1xb2)| / |b1xb2| = |-3 - 6| / (3√2) = 9 / (3√2) = 3/√2 units.", ch: "Three Dimensional Geometry" },
        { q: "Solve differential equation dy/dx + y sec x = tan x.", ans: "Integrating factor IF = e^(∫ sec x dx) = sec x + tan x. Solution: y(sec x + tan x) = ∫ tan x(sec x + tan x) dx = sec x + tan x - x + C.", ch: "Differential Equations" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "Solve the system of linear equations using Matrix Method (Inverse Matrix A⁻¹):\n2x + 3y + 3z = 5\nx - 2y + z = -4\n3x - y - 2z = 3", ans: "A = [[2,3,3],[1,-2,1],[3,-1,-2]], X = [[x],[y],[z]], B = [[5],[-4],[3]]. |A| = 2(4+1) - 3(-2-3) + 3(-1+6) = 10 + 15 + 15 = 40. X = A⁻¹ B => x = 1, y = 2, z = -1.", ch: "Matrices and Determinants" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "A logistics company optimizes its rectangular warehouse floor plan of perimeter 200 meters to maximize storage area.",
        q: "Q1. Write the expression for area A in terms of length x alone. (1M)\nQ2. Find the dimensions x and y that yield maximum floor area using derivative test. (2M)\nQ3. Calculate the maximum floor storage area in square meters. (1M)",
        ans: "Q1. Perimeter 2(x + y) = 200 => y = 100 - x. Area A(x) = x(100 - x) = 100x - x².\nQ2. A'(x) = 100 - 2x = 0 => x = 50 m. A''(x) = -2 < 0 (Maximum). Thus y = 50 m (Square shape).\nQ3. Max Area = 50 × 50 = 2500 m².",
        ch: "Application of Derivatives"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 5. ACCOUNTANCY (055)
  if (lower.includes('account') || lower.includes('055')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "Define Sacrifice Ratio and Gaining Ratio in Partnership accounting with formulas.", ans: "Sacrificing Ratio = Old Share - New Share (used for goodwill distribution on partner admission).\nGaining Ratio = New Share - Old Share (used on partner retirement/death).", ch: "Reconstitution of Partnership" },
        { q: "What is Forfeiture of Shares? Pass journal entry for forfeiture of 100 shares of ₹10 each for non-payment of allotment money of ₹4.", ans: "Forfeiture is cancellation of membership due to non-payment of calls.\nJournal Entry:\nShare Capital A/c Dr. 1000\n  To Share Allotment A/c 400\n  To Share Forfeiture A/c 600", ch: "Accounting for Share Capital" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "A and B are partners sharing profits in 3:2. They admit C for 1/5th share. Calculate new profit sharing ratio and sacrificing ratio.", ans: "Remaining share = 1 - 1/5 = 4/5. A's new = 3/5 × 4/5 = 12/25. B's new = 2/5 × 4/5 = 8/25. C's new = 5/25. New Ratio = 12:8:5. Sacrificing Ratio = 3:2.", ch: "Admission of a Partner" },
        { q: "Distinguish between Dissolution of Partnership and Dissolution of Partnership Firm on 3 bases.", ans: "1. Scope: Partnership changes relation; Firm closes business completely. 2. Books: Revaluation account in partnership; Realisation account in firm. 3. Court order: Court does not intervene in partnership; can dissolve firm.", ch: "Dissolution of Partnership Firm" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "From the following details, prepare Realisation Account, Partners' Capital Accounts, and Bank Account on dissolution of firm A and B:\nAssets: Machinery ₹50,000, Stock ₹20,000, Debtors ₹30,000.\nLiabilities: Creditors ₹25,000. Realisation expenses ₹2,000. Machinery realized ₹45,000, Stock ₹18,000, Debtors ₹28,000.", ans: "Total Assets transferred = ₹1,00,000. Liabilities = ₹25,000. Total Realized = ₹91,000. Realisation Loss = (1,00,000 + 25,000 + 2,000) - (25,000 + 91,000) = ₹6,000 distributed between A and B.", ch: "Dissolution of Partnership Firm" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "Apex Ltd issued 10,000 9% Debentures of ₹100 each at a discount of 5% redeemable at a premium of 10% after 5 years.",
        q: "Q1. Calculate total discount / loss on issue of debentures. (1M)\nQ2. Pass Journal Entry for issue of debentures. (2M)\nQ3. State how Loss on Issue of Debentures is written off as per Accounting Standards. (1M)",
        ans: "Q1. Issue discount = 5% of 10 L = ₹50,000. Redemption Premium = 10% of 10 L = ₹1,00,000. Total Loss = ₹1,50,000.\nQ2. Bank A/c Dr 9,50,000; Loss on Issue Dr 1,50,000 To 9% Debentures 10,00,000 To Premium on Redemption 1,00,000.\nQ3. Written off immediately in the year of issue from Securities Premium Reserve or Statement of Profit & Loss.",
        ch: "Issue and Redemption of Debentures"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 6. BUSINESS STUDIES (054)
  if (lower.includes('bst') || lower.includes('business') || lower.includes('054')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "Define Management. State any two characteristics of Management as a process.", ans: "Management is the process of planning, organizing, directing, and controlling resources to achieve goals efficiently and effectively. Characteristics: Goal-oriented, Pervasive, Multidimensional.", ch: "Nature and Significance of Management" },
        { q: "Distinguish between Functional Structure and Divisional Structure of organization.", ans: "Functional structure groups jobs on basis of functions (Production, Sales). Divisional structure groups jobs on basis of product lines (Cosmetics, Garments).", ch: "Organising" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "Explain Henri Fayol's principles of 'Unity of Command' and 'Unity of Direction' with real corporate examples.", ans: "Unity of Command: An employee should receive orders from one superior only to avoid confusion. Unity of Direction: Each group of activities with same objective must have one head and one plan.", ch: "Principles of Management" },
        { q: "Explain the steps involved in the Selection Process of employees in a manufacturing organization.", ans: "1. Preliminary Screening. 2. Selection Tests. 3. Employment Interview. 4. Reference & Background checks. 5. Medical Examination. 6. Job Offer.", ch: "Staffing" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "(a) What is Financial Management? Explain four key factors affecting Capital Structure decision of a company.\n(b) Differentiate between Fixed Capital and Working Capital requirement.", ans: "(a) Financial Management deals with procurement and utilization of funds. Factors: Cash Flow Position, Interest Coverage Ratio (ICR), Cost of Debt, Return on Investment (ROI).\n(b) Fixed Capital funds long-term assets (machinery); Working Capital funds day-to-day operations (inventory, cash).", ch: "Financial Management" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "Radhika Enterprise manufactures organic skincare products. Due to sudden surge in digital demand, the Managing Director sets ambitious sales targets, delegates authority to department managers, and establishes weekly feedback reports.",
        q: "Q1. Identify the management function highlighted when MD sets sales targets and weekly reports. (1M)\nQ2. State two benefits of Delegation of Authority implemented by the MD. (2M)\nQ3. Name the modern controlling technique used by tracking weekly feedback reports. (1M)",
        ans: "Q1. Planning and Controlling.\nQ2. 1. Reduces workload of top executive. 2. Empowers lower management and speeds up decision making.\nQ3. Management Information System (MIS) / Performance Management Control.",
        ch: "Directing and Controlling"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 7. ECONOMICS (030)
  if (lower.includes('eco') || lower.includes('030')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "Distinguish between Gross Domestic Product (GDP) and Net National Product at Factor Cost (NNPfc).", ans: "GDPmp is market value of final goods/services produced within domestic territory. NNPfc = GDPmp - Depreciation + NFIA - Net Indirect Taxes (National Income).", ch: "National Income Accounting" },
        { q: "Define Inflationary Gap. How does Central Bank use Repo Rate to correct Inflationary Gap?", ans: "Inflationary Gap arises when Aggregate Demand exceeds Aggregate Supply at full employment level. RBI increases Repo Rate, making loans costlier, reducing money supply and AD.", ch: "Determination of Income and Employment" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "Explain the working of Money Multiplier (Credit Creation) by Commercial Banks with a numerical example using LRR = 20%.", ans: "Money Multiplier = 1 / LRR = 1 / 0.20 = 5. Initial deposit ₹1,000 creates total deposits of ₹1,000 × 5 = ₹5,000 through primary & secondary loan rounds.", ch: "Money and Banking" },
        { q: "Distinguish between Revenue Deficit and Fiscal Deficit in Government Budget. State implications of high Fiscal Deficit.", ans: "Revenue Deficit = Revenue Expenditure - Revenue Receipts. Fiscal Deficit = Total Expenditure - Total Receipts (excluding borrowings). Implications: Inflationary pressure, debt trap, foreign dependence.", ch: "Government Budget and Economy" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "(a) Calculate National Income (NNPfc) using Expenditure Method from data:\n Private Final Consumption = ₹800 Cr, Govt Final Consumption = ₹300 Cr, Gross Domestic Capital Formation = ₹200 Cr, Net Exports = -₹20 Cr, Depreciation = ₹30 Cr, NFIA = -₹10 Cr, NIT = ₹40 Cr.\n(b) Differentiate between Real GDP and Nominal GDP.", ans: "(a) GDPmp = 800 + 300 + 200 + (-20) = ₹1,280 Cr. NNPfc = GDPmp - Dep + NFIA - NIT = 1280 - 30 - 10 - 40 = ₹1,200 Crores.\n(b) Nominal GDP measured at current prices; Real GDP measured at constant base year prices (indicates true volume output).", ch: "National Income Accounting" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "During post-COVID economic recovery, the Indian economy observed an expansion in private consumption alongside rising international crude oil prices.",
        q: "Q1. What type of inflation occurs due to rising international crude oil prices? (1M)\nQ2. Explain two fiscal policy measures government can adopt to stabilize prices. (2M)\nQ3. State the impact of foreign capital inflows on the Balance of Payments (BoP) Capital Account. (1M)",
        ans: "Q1. Cost-Push Inflation.\nQ2. 1. Cut excise duty on fuel/essential items. 2. Reduce non-developmental government expenditure.\nQ3. Foreign capital inflows (FDI/FPI) are recorded as positive Credit (+) items in BoP Capital Account.",
        ch: "Balance of Payments & Foreign Exchange"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 8. HISTORY (027)
  if (lower.includes('hist') || lower.includes('027')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "State two key features of Harappan town planning and drainage system.", ans: "1. Grid pattern town layout with Citadel and Lower Town. 2. Covered brick drains running parallel to streets with inspection sumps.", ch: "Bricks, Beads and Bones" },
        { q: "Who was James Prinsep? State his contribution to ancient Indian epigraphy.", ans: "James Prinsep was an officer in East India Company mint who deciphered Brahmi and Kharosthi scripts in 1837, unlocking Ashokan edicts.", ch: "Kings, Farmers and Towns" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "Describe the structural features and architectural significance of Vijayanagara city capital (Hampi).", ans: "Fortified city with 7 concentric rings of walls enclosing agricultural hinterlands, Royal Centre, Lotus Mahal, Mahanavami Dibba, and Virupaksha Temple.", ch: "An Imperial Capital: Vijayanagara" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "Critically evaluate the causes, nature, and spread of the Revolt of 1857 in North India with focus on Awadh.", ans: "Causes: Doctrine of Lapse, annexation of Awadh ('cherry that will drop'), greased cartridges. Sepoys, peasants, and taluqdars united. Suppressed violently by British.", ch: "Rebels and the Raj" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "Mahatma Gandhi transformed Indian national movement into a mass movement through Non-Cooperation and Salt Satyagraha.",
        q: "Q1. Where and when did Mahatma Gandhi launch his first satyagraha in India? (1M)\nQ2. Explain two key methods adopted during Non-Cooperation Movement. (2M)\nQ3. Name the British Viceroy who signed the Pact with Gandhi in 1931. (1M)",
        ans: "Q1. Champaran (Bihar) in 1917 for indigo sharecroppers.\nQ2. Surrender of titles/honors and boycott of British schools, courts, & foreign goods.\nQ3. Lord Irwin (Gandhi-Irwin Pact).",
        ch: "Mahatma Gandhi and the Nationalist Movement"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 9. POLITICAL SCIENCE (028)
  if (lower.includes('pol') || lower.includes('028')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "What was the Cold War? Name two military alliances formed by USA and USSR during Cold War.", ans: "Cold War was ideological tension without direct full-scale war between USA (Capitalist) and USSR (Communist). USA formed NATO; USSR formed Warsaw Pact.", ch: "Contemporary World Politics" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "Explain three major challenges faced by India immediately after Independence in 1947.", ans: "1. Integration of Princely States (565 states). 2. Partition and refugee rehabilitation. 3. Establishing democratic governance and economic development.", ch: "Challenges of Nation Building" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "Examine the origin, evolution, and role of NITI Aayog in India. How does it differ from Planning Commission?", ans: "NITI Aayog (established 1 Jan 2015) acts as think-tank adopting 'Bottom-Up' federal approach. Planning Commission used 'Top-Down' centralized allocation.", ch: "Politics of Planned Development" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "The United Nations was formed in 1945 post WWII to preserve international peace and prevent global catastrophe.",
        q: "Q1. How many permanent members exist in UN Security Council? Name them. (1M)\nQ2. What is Veto Power? Explain its significance. (2M)\nQ3. Name the principal judicial organ of the United Nations situated at The Hague. (1M)",
        ans: "Q1. 5 permanent members (P5): USA, UK, France, Russia, China.\nQ2. Veto power allows any P5 member to reject a substantive resolution regardless of majority support.\nQ3. International Court of Justice (ICJ).",
        ch: "International Organisations"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 10. GEOGRAPHY (029)
  if (lower.includes('geo') || lower.includes('029')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "Distinguish between Determinism and Possibilism in Human Geography.", ans: "Determinism: Environment dictates human lifestyle (nature dominates man).\nPossibilism: Humans adapt and modify environment using technology (man dominates nature).", ch: "Human Geography: Nature and Scope" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "Explain the Demographic Transition Theory with three stages of population growth.", ans: "Stage 1: High birth & high death rate (primitive agriculture). Stage 2: High birth & falling death rate (population explosion). Stage 3: Low birth & low death rate (urban industrialized society).", ch: "The World Population" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "Classify mineral resources in India into Metallic and Non-Metallic. Describe distribution of Iron Ore and Bauxite reserves.", ans: "Metallic (Ferrous like Iron ore in Odisha/Jharkhand belt; Non-ferrous like Bauxite in Kalahandi/Koraput). Non-Metallic includes Mica & Limestone.", ch: "Mineral and Energy Resources" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "India's agricultural production has seen structural transformation through high-yielding varieties, micro-irrigation, and warehousing infrastructure.",
        q: "Q1. Distinguish between Kharif and Rabi cropping seasons with two crop examples each. (2M)\nQ2. State two major challenges faced by Indian farmers in rainfed agricultural regions. (1M)\nQ3. Name the watershed development program sponsored by Central Government for rainfed farming. (1M)",
        ans: "Q1. Kharif: Monsoon crops (Rice, Maize). Rabi: Winter crops (Wheat, Mustard).\nQ2. Erratic rainfall, small land holdings, and soil degradation.\nQ3. Neeranchal / Haryali Watershed Development Project.",
        ch: "Land Resources and Agriculture"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 11. SOCIOLOGY (039)
  if (lower.includes('sociology') || lower.includes('039')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "Define Caste and Class as systems of social stratification.", ans: "Caste: Closed ascribed status system based on birth and endogamy.\nClass: Open achieved status system based on wealth, education, and occupation.", ch: "Social Institutions: Continuity and Change" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "Explain M.N. Srinivas's concept of 'Sanskritisation' and state two criticisms against it.", ans: "Sanskritisation is process where lower caste adopts customs, rituals, and beliefs of higher caste. Criticisms: Exaggerates Brahminical superiority and accepts caste hierarchy.", ch: "Cultural Change" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "Examine the impact of Industrialization and Urbanization on Indian Joint Family structure.", ans: "Transformed joint families into nuclear units, encouraged geographic mobility, increased female economic independence, but preserved emotional & ritual inter-generational ties.", ch: "Structural Change" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "Social movements in contemporary India address environment, gender rights, tribal land rights, and agrarian distress.",
        q: "Q1. Differentiate between Reformist and Revolutionary social movements. (1M)\nQ2. Describe the Chipko Movement and its ecological significance. (2M)\nQ3. Name the prominent women's movement campaign against dowry in post-independent India. (1M)",
        ans: "Q1. Reformist seeks gradual changes within existing system; Revolutionary seeks complete overhaul of social system.\nQ2. Villagers in Uttarakhand hugged trees to prevent commercial deforestation, saving Himalayan ecology.\nQ3. Anti-Dowry Campaign (1970s-80s leading to Dowry Prohibition Amendment).",
        ch: "Social Movements"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 12. COMPUTER SCIENCE (083) / IT (402)
  if (lower.includes('cs') || lower.includes('computer') || lower.includes('083') || lower.includes('it-402') || lower.includes('402')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "Differentiate between r+ and w+ file opening modes in Python.", ans: "r+: Opens existing file for reading & writing without truncating.\nw+: Opens file for reading & writing, truncates existing file to 0 bytes.", ch: "File Handling in Python" },
        { q: "Explain Primary Key and Candidate Key in RDBMS.", ans: "Candidate Key: Any column capable of uniquely identifying rows. Primary Key: The single candidate key selected by DB administrator.", ch: "Database Management System" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "Write a Python function Push(stack, item) and Pop(stack) for Stack data structure.", ans: "def Push(st, item):\n  st.append(item)\ndef Pop(st):\n  if len(st)==0: return 'Underflow'\n  return st.pop()", ch: "Data Structure: Stacks" },
        { q: "Write SQL queries to create table STUDENT with constraints (RollNo PK, Name NOT NULL, Age > 15).", ans: "CREATE TABLE STUDENT (RollNo INT PRIMARY KEY, Name VARCHAR(30) NOT NULL, Age INT CHECK(Age > 15));", ch: "Structured Query Language (SQL)" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "Given table EMPLOYEE(EmpID, Name, Dept, Salary, Commission):\nWrite SQL queries for:\n(a) Display Name & Net Income (Salary + Commission) for Sales dept.\n(b) Count employees in each Dept with Avg Salary > 50000.\n(c) Increase Salary by 10% for Dept = 'IT'.\n(d) Delete records where Salary < 20000.", ans: "(a) SELECT Name, Salary + IFNULL(Commission,0) FROM EMPLOYEE WHERE Dept = 'Sales';\n(b) SELECT Dept, COUNT(*) FROM EMPLOYEE GROUP BY Dept HAVING AVG(Salary) > 50000;\n(c) UPDATE EMPLOYEE SET Salary = Salary * 1.10 WHERE Dept = 'IT';\n(d) DELETE FROM EMPLOYEE WHERE Salary < 20000;", ch: "Structured Query Language (SQL)" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "TechCorp office has 4 blocks: HR (40 PCs), Admin (80 PCs), Development (150 PCs), Accounts (30 PCs).",
        q: "Q1. Suggest best block to place central server with reason. (1M)\nQ2. Suggest best topology connecting all blocks economically. (1M)\nQ3. Name hardware device required to connect PCs inside each block and expand beyond 100 meters. (2M)",
        ans: "Q1. Development block (80-20 rule - maximum 150 PCs to minimize traffic).\nQ2. Star Topology with Development block at center.\nQ3. Switch / Hub inside block, and Repeater for distances > 100 meters.",
        ch: "Computer Networks"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 13. HINDI CORE (302)
  if (lower.includes('hindi-302') || lower.includes('302')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "‘भक्तिन’ पाठ के आधार पर भक्तिन के चरित्र की दो प्रमुख विशेषताओं का उल्लेख कीजिए।", ans: "1. स्वामिभक्ति और समर्पण भाव। 2. कर्मठता, सादगी और स्वाभिमानी स्वभाव।", ch: "आरोह: भक्तिन" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "‘सिल्वर वैडिंग’ कहानी में यशोधर बाबू की सोच और उनके बच्चों की सोच में मुख्य अंतर क्या था?", ans: "यशोधर बाबू पुरानी परंपराओं, संयुक्त परिवार व सादगी के समर्थक थे; जबकि उनके बच्चे आधुनिकता, भौतिक सुख-सुविधाओं व दिखावे में विश्वास रखते थे।", ch: "वितान: सिल्वर वैडिंग" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "‘बाज़ार दर्शन’ निबंध में जैनेंद्र कुमार ने ‘बाज़ार के जादू’ और ‘मन के खालीपन’ का क्या संबंध बताया है? स्पष्ट कीजिए।", ans: "जब मन खाली होता है और जेब भरी होती है, तो बाज़ार का जादू (अनावश्यक वस्तुओं का आकर्षण) मनुष्य पर हावी हो जाता है, जिससे असंतोष व अपव्यय बढ़ता है।", ch: "आरोह: बाज़ार दर्शन" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "गद्यांश: ‘बाज़ार में एक जादू है। वह जादू आँख की राह काम करता है। वह रूप का जादू है पर जैसे सम्मोहन की राह है। पर वह जादू की मर्यादा है। जेब भरी हो और मन खाली हो, तो जादू का असर खूब होता है।’",
        q: "Q1. बाज़ार का जादू किस माध्यम से काम करता है? (1M)\nQ2. बाज़ार के जादू का असर किस स्थिति में सबसे ज़्यादा होता है? (1M)\nQ3. बाज़ार के जादू से बचने का लेखक ने क्या उपाय बताया है? (2M)",
        ans: "Q1. बाज़ार का जादू आँख के माध्यम से वस्तुओं के सौंदर्य और आकर्षण द्वारा काम करता है।\nQ2. जब मनुष्य की जेब भरी हो और मन खाली (असंतृप्त) हो।\nQ3. बाज़ार जाते समय मन को लक्ष्यबद्ध (निश्चित आवश्यकता के साथ) रखना चाहिए ताकि अनपेक्षित आकर्षणों से बचा जा सके।",
        ch: "आरोह: बाज़ार दर्शन"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 14. HINDI COURSE A (002)
  if (lower.includes('hindi-002') || lower.includes('hindi-a')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "‘सेनानी न होते हुए भी चश्मेवाले को लोग कैप्टन क्यों कहते थे?’", ans: "कैप्टन में अगाध देशभक्ति थी और वह नेताजी की मूर्ति के प्रति पूर्ण आदर रखता था।", ch: "क्षितिज: नेताजी का चश्मा" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "गोपियों के अनुसार राजा का धर्म क्या होना चाहिए? सूरदास के पद के आधार पर लिखिए।", ans: "प्रजा को न सताया जाए और प्रजा के हितों की रक्षा की जाए।", ch: "क्षितिज: सूरदास के पद" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "‘बालगोबिन भगत’ पाठ के आधार पर भगत के गृहस्थ-संन्यासी व्यक्तित्व पर प्रकाश डालिए।", ans: "भगत गृहस्थ रहकर भी मोह-माया से परे कबीर के आदर्शों पर निष्काम जीवन जीते थे।", ch: "क्षितिज: बालगोबिन भगत" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "गद्यांश: ‘मूर्ति संगमरमर की थी। टोपी की नोक से कोट के दूसरे बटन तक दो फुट ऊँची...’",
        q: "Q1. नेताजी की मूर्ति किस material की थी? (1M)\nQ2. मूर्ति में क्या कमी थी? (1M)\nQ3. कमी को कौन कैसे पूरा करता था? (2M)",
        ans: "Q1. संगमरमर। Q2. आँखों पर चश्मा नहीं था। Q3. कैप्टन चश्मेवाला असली चश्मा लगाता था।",
        ch: "क्षितिज: नेताजी का चश्मा"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 15. HINDI COURSE B (085)
  if (lower.includes('hindi-085') || lower.includes('hindi-b') || lower.includes('hindi')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "‘बड़े भाई साहब’ छोटे भाई पर निगरानी क्यों रखते थे?", ans: "छोटा भाई पढ़ाई में लापरवाही न करे और अनुशासित रहे।", ch: "स्पर्श: बड़े भाई साहब" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "कबीर की साखी के अनुसार मीठी वाणी का क्या महत्व है?", ans: "दूसरों को सुख और स्वयं के मन को शीतलता प्रदान करती है।", ch: "स्पर्श: कबीर की साखी" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "‘हरिहर काका’ कहानी के आधार पर समाज में मानवीय मूल्यों के ह्रास पर टिप्पणी कीजिए।", ans: "स्वार्थ के कारण रिश्ते-नाते समाप्त हो रहे हैं और संपत्ति के लिए अमानवीय अत्याचार हो रहे हैं।", ch: "संचयन: हरिहर काका" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "गद्यांश: ‘मेरे भाई साहब मुझसे पाँच साल बड़े थे, लेकिन केवल तीन दरजे आगे...’",
        q: "Q1. बड़े भाई साहब लेखक से कितने साल बड़े थे? (1M)\nQ2. तालीम के मामले में वे जल्दबाजी क्यों नहीं करते थे? (1M)\nQ3. लेखक ने किस व्यवस्था पर व्यंग्य किया है? (2M)",
        ans: "Q1. 5 साल। Q2. ज्ञान की नींव मजबूत करना चाहते थे। Q3. रटंत शिक्षा प्रणाली पर।",
        ch: "स्पर्श: बड़े भाई साहब"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 16. ENGLISH (184 / 301)
  if (lower.includes('english') || lower.includes('eng') || lower.includes('184') || lower.includes('301')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "Why did Lencho say the raindrops were like 'new coins'?", ans: "Rain promised a bountiful harvest and financial prosperity.", ch: "A Letter to God" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "How did Nelson Mandela's perception of freedom transform with age and experience?", ans: "Evolved from personal boyhood freedom to total emancipation of his oppressed black nation.", ch: "Nelson Mandela" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "Draft a formal Application for Job with complete Bio-Data for post of Senior Educator.", ans: "Covering Letter with 3 paragraphs followed by structured Bio-Data with qualifications and references.", ch: "Writing Skills" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "Passage on Digital Learning: 68% secondary students use digital tools for board revision.",
        q: "Q1. What % of students use digital tools? (1M)\nQ2. State two benefits of interactive testing. (2M)\nQ3. Find synonym for 'employ'. (1M)",
        ans: "Q1. 68%. Q2. Instant feedback and concept reinforcement. Q3. Utilize.",
        ch: "Reading Comprehension"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 17. CLASS 9/10 MATHEMATICS (041)
  if (lower.includes('math') || lower.includes('041')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: `Find a quadratic polynomial whose zeros are ${3 + idx} and ${-idx - 1}.`, ans: `Sum = ${2 - 0.5 * idx}, Product = ${-3 - idx}. Polynomial: x² - (${2 - 0.5 * idx})x + (${-3 - idx})`, ch: "Polynomials" },
        { q: "Find the 20th term from last of AP: 3, 8, 13, ..., 253.", ans: "a20 = 253 + 19(-5) = 158.", ch: "Arithmetic Progressions" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "Solve for x: 1/(x + 4) - 1/(x - 7) = 11/30 (x ≠ -4, 7).", ans: "x² - 3x + 2 = 0 => x = 1 or x = 2.", ch: "Quadratic Equations" },
        { q: "Prove lengths of tangents drawn from external point to a circle are equal.", ans: "In △OPA and △OPB: OP=OP, OA=OB, ∠OAP=∠OBP=90°. △OPA ≅ △OPB (RHS) => PA=PB.", ch: "Circles" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "From top of 7 m building, angle of elevation of top of cable tower is 60° and depression of foot is 45°. Find height of tower.", ans: "Height = 7 + 7√3 = 19.12 m.", ch: "Some Applications of Trigonometry" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "Building pavilion seating arranged in AP: Row 1 has 20 seats, Row 2 has 24 seats, Row 3 has 28 seats up to 30 rows.",
        q: "Q1. Find seats in 15th row. (1M)\nQ2. Total seats in 30 rows. (2M)\nQ3. Complete rows for 600 guests. (1M)",
        ans: "Q1. 76. Q2. 2340. Q3. 13 rows.",
        ch: "Arithmetic Progressions"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 18. CLASS 9/10 SOCIAL SCIENCE (087)
  if (lower.includes('social') || lower.includes('sst') || lower.includes('087')) {
    if (type === 'vsa') {
      const bank: FallbackItem[] = [
        { q: "Explain Resource Planning in India with two steps.", ans: "Judicious resource strategy. 1. Inventory survey. 2. Evolving planning structure.", ch: "Resources and Development" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'sa') {
      const bank: FallbackItem[] = [
        { q: "Explain Prudential vs Moral reasons for power sharing.", ans: "Prudential reduces social conflict. Moral is soul of democracy.", ch: "Power Sharing" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    if (type === 'la') {
      const bank: FallbackItem[] = [
        { q: "Describe major steps taken in 1992 towards decentralisation in India.", ans: "Mandatory local elections, 33% female reservation, State Election Commission.", ch: "Federalism" }
      ];
      return pickItem(bank, idx, usedTexts);
    }
    const bank: FallbackItem[] = [
      {
        passage: "Village with 4 families, average income ₹5000. Three families earn ₹4000, ₹7000, ₹3000.",
        q: "Q1. Fourth family income. (1M)\nQ2. Two limitations of PCI. (2M)\nQ3. UNDP development index. (1M)",
        ans: "Q1. ₹6000. Q2. Hides inequality, ignores health/education. Q3. HDI.",
        ch: "Development"
      }
    ];
    return pickItem(bank, idx, usedTexts);
  }

  // 19. CLASS 9/10 GENERAL SCIENCE (086) - DEFAULT
  if (type === 'vsa') {
    const bank: FallbackItem[] = [
      { q: "Differentiate between exothermic and endothermic reactions with balanced chemical equations.", ans: "Exothermic releases heat (CaO + H2O → Ca(OH)2). Endothermic absorbs heat (CaCO3 → CaO + CO2).", ch: "Chemical Reactions" },
      { q: "A current of 0.5 A flows for 10 minutes. Calculate electric charge.", ans: "Q = I × t = 0.5 × 600 = 300 Coulombs.", ch: "Electricity" }
    ];
    return pickItem(bank, idx, usedTexts);
  }
  if (type === 'sa') {
    const bank: FallbackItem[] = [
      { q: "Draw ray diagram for convex lens with object between F1 and 2F1. State image nature.", ans: "Image beyond 2F2. Real, Inverted, Magnified.", ch: "Light - Reflection and Refraction" },
      { q: "Explain double circulation in human heart. Why is it necessary?", ans: "Pulmonary & Systemic circulation. Separates oxygenated & deoxygenated blood for high energy.", ch: "Life Processes" }
    ];
    return pickItem(bank, idx, usedTexts);
  }
  if (type === 'la') {
    const bank: FallbackItem[] = [
      { q: "(a) What is homologous series? State 3 features.\n(b) Write formula of second alkene.\n(c) Describe Saponification reaction.", ans: "(a) Same functional group, -CH2 difference. (b) Propene C3H6. (c) CH3COOC2H5 + NaOH → CH3COONa + C2H5OH.", ch: "Carbon and its Compounds" }
    ];
    return pickItem(bank, idx, usedTexts);
  }
  const bank: FallbackItem[] = [
    {
      passage: "Optical bench experiment with convex lens of focal length 15 cm. Candle placed at 30 cm.",
      q: "Q1. Distance of sharp image. (1M)\nQ2. Magnification m. (1M)\nQ3. Effect if top half covered with black paper. (2M)",
      ans: "Q1. v = +30 cm. Q2. m = -1. Q3. Complete image formed with half brightness.",
      ch: "Light - Reflection and Refraction"
    }
  ];
  return pickItem(bank, idx, usedTexts);
}

function pickItem(bank: FallbackItem[], idx: number, usedTexts: Set<string>): FallbackItem {
  let pickIdx = idx % bank.length;
  let attempts = 0;
  while (usedTexts.has(bank[pickIdx].q) && attempts < bank.length) {
    pickIdx = (pickIdx + 1) % bank.length;
    attempts++;
  }
  const item = bank[pickIdx];
  usedTexts.add(item.q);
  return item;
}


// GENERATOR ENGINE FOR ENGLISH WRITING & GRAMMAR TASKS
function generateEnglishWritingAndGrammar(): Question[] {
  const ts = Date.now();
  return [
    {
      id: `gen-eng-grammar-1-${ts}`,
      subjectId: 'english-184',
      chapterId: 'eng-sec-b',
      chapterName: 'Writing Skills & Grammar',
      type: 'vsa',
      marks: 10,
      difficulty: 'medium',
      isCompetency: true,
      questionText: 'SECTION B: INTEGRATED GRAMMAR TASKS (10 MARKS)\n\nI. Complete the following sentences by choosing the correct option / form of verb:\n(a) Neither the teacher nor the students ______ (was / were) present in the seminar hall.\n(b) By the time the rescue team arrived, the flood waters ______ (had receded / recedes).\n(c) You ______ (must / ought) follow the traffic regulations to avoid heavy penalties.\n\nII. Transformation of Sentences (Reported Speech):\n(d) Read the conversation and report the doctor\'s advice:\nPatient: "How long should I rest after taking this medication?"\nDoctor: "Take complete bed rest for three days and avoid strenuous exercise."\nReported Speech: The patient asked the doctor how long he should rest after taking that medication. The doctor advised him __________.\n\nIII. Error Correction:\n(e) Identify the error in the following news excerpt and write the correction:\n"Each of the participating scholars have submitted their research abstract before the deadline."',
      correctAnswer: '(a) were\n(b) had receded\n(c) must\n(d) to take complete bed rest for three days and avoid strenuous exercise.\n(e) Error: "have" | Correction: "has"',
      markingScheme: '[3 Marks] Items (a)-(c) Grammar choices (1M each)\n[2 Marks] Item (d) Accurate reported speech transformation\n[5 Marks Total] Step-wise grammar precision according to CBSE criteria',
      explanation: 'Official CBSE Integrated Grammar Assessment Engine.'
    },
    {
      id: `gen-eng-letter-${ts}`,
      subjectId: 'english-184',
      chapterId: 'eng-sec-b',
      chapterName: 'Writing Skills & Grammar',
      type: 'la',
      marks: 5,
      difficulty: 'hard',
      isCompetency: true,
      questionText: 'SECTION B: CREATIVE WRITING SKILLS - FORMAL LETTER (5 MARKS)\n\nYou are Sunita / Suresh, President of the Youth Cultural Club, 12-A Model Town, Jaipur. You have noticed an alarming increase in open garbage dumping and lack of proper waste segregation in your locality, causing severe health hazards.\n\nWrite a formal Letter to the Editor of a prominent national newspaper (100–120 words) highlighting this critical public health concern. Suggest measures such as door-to-door segregated waste collection, imposition of fines on open dumping, and conducting resident awareness drives.',
      correctAnswer: 'Format:\nSender\'s Address, Date, Receiver\'s Designation & Address, Subject, Salutation, Body (3 Paragraphs), Complimentary Close.\nBody Content:\n- Para 1: State purpose of letter highlighting unhygienic conditions.\n- Para 2: Consequences (foul smell, disease vectors, blocked drains).\n- Para 3: Actionable recommendations (fines, segregated bins, community drives).',
      markingScheme: '[1 Mark] Format\n[2 Marks] Content & Practical Suggestions\n[2 Marks] Expression, Coherence, and Vocabulary',
      explanation: '5 Marks Formal Letter Writing CBSE Marking Standard.'
    },
    {
      id: `gen-eng-analytical-${ts}`,
      subjectId: 'english-184',
      chapterId: 'eng-sec-b',
      chapterName: 'Writing Skills & Grammar',
      type: 'la',
      marks: 5,
      difficulty: 'hard',
      isCompetency: true,
      questionText: 'SECTION B: CREATIVE WRITING SKILLS - ANALYTICAL PARAGRAPH (5 MARKS)\n\nThe bar graph below summarizes the primary learning channels utilized by Class 10 secondary students for CBSE Board Examination preparation:\n• Interactive AI Mock Tests & Smart Question Banks: 45%\n• Textbooks & Official NCERT Exemplars: 30%\n• Classroom Lectures & Notes: 15%\n• Peer Study Groups: 10%\n\nWrite an Analytical Paragraph (100–120 words) analyzing the given data. Compare trends, highlight key insights, and formulate a concise concluding summary.',
      correctAnswer: 'Analytical Paragraph Structure:\n1. Intro: State what the graph represents.\n2. Body: Compare major proportions (45% digital AI testing dominating over 30% NCERT textbooks, followed by 15% classroom notes and 10% peer study).\n3. Conclusion: Summarize that self-paced digital practice coupled with core NCERT textbooks forms the backbone of modern board preparation.',
      markingScheme: '[1 Mark] Introductory Overview\n[2 Marks] Data Comparison & Trend Analysis\n[2 Marks] Synthesizing Conclusion & Language Accuracy',
      explanation: '5 Marks Analytical Paragraph CBSE Standard.'
    }
  ];
}

// ---------------------------------------------------------------------------
// MAIN PAPER GENERATION ASSEMBLY ENGINE
// ---------------------------------------------------------------------------

export function generateLocalPaper(config: PaperConfig): GeneratedPaper {
  return generateCombinatorialPaperFromVault(config);
}
