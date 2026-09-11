import { Question, GeneratedPaper, PaperConfig, PaperSection, Subject } from '../types';
import { CBSE_SUBJECTS, PRELOADED_QUESTIONS } from '../data/cbseData';
import { MATH_MCQ_BANK, SCIENCE_MCQ_BANK, SOCIAL_MCQ_BANK, ENGLISH_MCQ_BANK, IT_MCQ_BANK, HINDI_A_MCQ_BANK, HINDI_B_MCQ_BANK } from '../data/textbookQuestions';
import { getMasterPool } from '../data/masterQuestionPool';
import { generatePaperCode, savePaperToRegistry, getAllSavedPapers } from './paperRegistry';
import { getGeneralInstructions } from './paperGenerator';

const VAULT_STORAGE_KEY = 'cbse_examidea_question_vault_v1';

export interface VaultStats {
  totalQuestions: number;
  bySubject: Record<string, number>;
  byMarks: {
    oneMark: number;
    twoMarks: number;
    threeMarks: number;
    fourMarks: number;
    fiveMarks: number;
  };
  aiHarvestedCount: number;
}

export interface StoredVaultQuestion extends Question {
  harvestedAt?: string;
  source?: 'ai_generated' | 'curated_bank' | 'user_created';
  timesUsed?: number;
}

// Normalize question text by stripping numbers, bullet points, and special characters
export function normalizeQuestionText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/^q\s*\d+[\.\:\)]/i, '')
    .replace(/^\(?\d+\)?[\.\:]/i, '')
    .replace(/^\([a-z]\)/i, '')
    // Allow alphanumeric and Devanagari characters (Hindi)
    .replace(/[^a-z0-9\u0900-\u097F]/g, '')
    .slice(0, 120);
}

// Generate a fast, accurate hash to prevent duplicate questions
export function hashQuestionText(text: string): string {
  if (!text) return '';
  const clean = normalizeQuestionText(text);
  if (!clean) return `h_${Math.random().toString(36).substring(2, 8)}`;
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash)}`;
}

// Ensure every question with visual/diagram content is mapped to a unique asset ID and asset URL
export function ensureQuestionAssetId(q: Question): Question {
  const imageUrl = q.assetUrl || q.diagramUrl || (q as any).imageUrl || (q as any).image;
  const textLower = ((q.questionText || '') + ' ' + (q.diagramDescription || '')).toLowerCase();
  
  const hasVisual = Boolean(
    imageUrl || 
    q.hasDiagram || 
    q.assetId || 
    (q.diagramDescription && q.diagramDescription.trim().length > 0) ||
    textLower.includes('ray diagram') || 
    textLower.includes('circuit diagram') || 
    textLower.includes('given figure') || 
    textLower.includes('given diagram') || 
    textLower.includes('shown in the figure') || 
    textLower.includes('bar graph below')
  );

  if (!hasVisual) {
    return q;
  }

  const qHash = hashQuestionText(q.questionText || q.id);
  const assetId = q.assetId || `ast_${qHash}`;
  const assetUrl = imageUrl || q.assetUrl || q.diagramUrl;

  return {
    ...q,
    assetId,
    assetUrl,
    diagramUrl: assetUrl || q.diagramUrl,
    hasDiagram: true
  };
}

// Helper to shuffle array (Fisher-Yates)
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Seeded shuffle for section-specific independent randomization
function seededShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const rnd = s / 233280;
    const j = Math.floor(rnd * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Sanitize Vault Map against cross-domain pollution
export function sanitizeVaultMap(map: Record<string, StoredVaultQuestion>): Record<string, StoredVaultQuestion> {
  const sanitized: Record<string, StoredVaultQuestion> = {};
  Object.entries(map).forEach(([hash, q]) => {
    if (!q || !q.questionText) return;
    
    let subId = q.subjectId || 'science-086';
    const textLower = q.questionText.toLowerCase();

    // Auto-correct subjectId if mislabelled
    if (/bismarck|kaiser|vernacular|sinhala|concurrent list|tertiary sector|reserve bank|purna swaraj|rowlatt|power sharing|federalism|non-cooperation|belgium|sri lanka|democracy|nationalism|french revolution|regur soil|alluvial|black soil|multinational corporation|treaty of vienna|gdp|per capita/i.test(textLower)) {
      subId = 'social-087';
    } else if (/acid|base|salt|reaction|equation|chemical|convex lens|concave mirror|refraction|reflection|ohm|circuit|resistor|ammeter|voltmeter|photosynthesis|stomata|xylem|phloem|nephron|neuron|brain|dna|chromosome|gene|heredity|mitochondria|exothermic|endothermic|bleaching powder|baking soda|washing soda/i.test(textLower)) {
      subId = 'science-086';
    } else if (/quadratic|polynomial|discriminant|trigonometry|sin θ|cos θ|tan θ|pythagoras|area of sector|hcf|lcm|arithmetic progression/i.test(textLower)) {
      subId = 'maths-041';
    } else if (/lencho|mandela|valli|bholi|tricki|griffin|anne frank|first flight|footprints without feet/i.test(textLower)) {
      subId = 'english-184';
    }

    const subObj = CBSE_SUBJECTS.find(s => s.id === subId) || CBSE_SUBJECTS.find(s => s.code === subId);
    if (isSubjectAndClassMatch(subId, subObj?.name, subId, q.questionText)) {
      sanitized[hash] = {
        ...q,
        subjectId: subId
      };
    }
  });
  return sanitized;
}

// Load all questions from LocalStorage Vault
export function getStoredVault(): Record<string, StoredVaultQuestion> {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) {
      const initialMap = initVaultFromSeed();
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(initialMap));
      return initialMap;
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeVaultMap(parsed);
    if (Object.keys(sanitized).length !== Object.keys(parsed).length) {
      saveVaultMap(sanitized);
    }
    return sanitized;
  } catch (err) {
    console.warn('Error reading question vault:', err);
    return initVaultFromSeed();
  }
}

// Save the full map back to storage
function saveVaultMap(map: Record<string, StoredVaultQuestion>): void {
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save to question vault storage:', err);
  }
}

// Seed the vault from PRELOADED_QUESTIONS and saved registry papers
function initVaultFromSeed(): Record<string, StoredVaultQuestion> {
  const map: Record<string, StoredVaultQuestion> = {};
  
  // 1. Curated base seed questions
  PRELOADED_QUESTIONS.forEach((qRaw, idx) => {
    const q = ensureQuestionAssetId(qRaw);
    const hash = hashQuestionText(q.questionText);
    map[hash] = {
      ...q,
      id: q.id || `seed-q-${idx}-${Date.now()}`,
      harvestedAt: new Date().toISOString(),
      source: 'curated_bank',
      timesUsed: 0
    };
  });

  // 2. Questions from all saved papers in paper registry
  try {
    const savedPapers = getAllSavedPapers();
    savedPapers.forEach((paper) => {
      const paperSubjectId = paper.config?.subjectId || 
        CBSE_SUBJECTS.find(s => s.code === paper.subjectCode || s.id === paper.subjectCode)?.id || 
        (paper.subjectName?.toLowerCase().includes('social') ? 'social-087' : 
         paper.subjectName?.toLowerCase().includes('math') ? 'maths-041' : 
         paper.subjectName?.toLowerCase().includes('english') ? 'english-184' : 
         paper.subjectName?.toLowerCase().includes('hindi') ? 'hindi-002' : 
         'science-086');

      (paper.sections || []).forEach((sec) => {
        (sec.questions || []).forEach((qRaw) => {
          if (!qRaw.questionText || qRaw.questionText.length < 5) return;
          const q = ensureQuestionAssetId(qRaw);
          const hash = hashQuestionText(q.questionText);
          const targetSubId = q.subjectId || paperSubjectId;

          if (isSubjectAndClassMatch(targetSubId, paper.subjectName, targetSubId, q.questionText)) {
            if (!map[hash]) {
              map[hash] = {
                ...q,
                subjectId: targetSubId,
                harvestedAt: paper.createdAt || new Date().toISOString(),
                source: 'curated_bank',
                timesUsed: 1
              };
            }
          }
        });
      });
    });
  } catch (e) {
    console.warn('Error seeding vault from saved papers:', e);
  }

  return sanitizeVaultMap(map);
}

// HARVEST QUESTIONS AUTOMATICALLY FROM ANY AI OR GENERATED PAPER
export function harvestQuestionsFromPaper(paper: GeneratedPaper, source: 'ai_generated' | 'curated_bank' = 'ai_generated'): number {
  if (!paper || !Array.isArray(paper.sections)) return 0;

  const currentVault = getStoredVault();
  let newAddedCount = 0;
  const now = new Date().toISOString();

  const paperSubjectId = paper.config?.subjectId || 
    CBSE_SUBJECTS.find(s => s.code === paper.subjectCode || s.id === paper.subjectCode)?.id || 
    (paper.subjectName?.toLowerCase().includes('social') ? 'social-087' : 
     paper.subjectName?.toLowerCase().includes('math') ? 'maths-041' : 
     paper.subjectName?.toLowerCase().includes('english') ? 'english-184' : 
     paper.subjectName?.toLowerCase().includes('hindi') ? 'hindi-002' : 
     'science-086');

  paper.sections.forEach((sec) => {
    (sec.questions || []).forEach((qRaw) => {
      if (!qRaw.questionText || qRaw.questionText.trim().length < 5) return;

      const q = ensureQuestionAssetId(qRaw);
      const hash = hashQuestionText(q.questionText);
      const targetSubId = q.subjectId || paperSubjectId;

      if (!isSubjectAndClassMatch(targetSubId, paper.subjectName, targetSubId, q.questionText)) {
        return; // Reject cross-domain polluted question
      }

      if (!currentVault[hash]) {
        currentVault[hash] = {
          ...q,
          id: q.id || `vault-${paperSubjectId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          subjectId: targetSubId,
          chapterName: q.chapterName || 'General Syllabus',
          harvestedAt: now,
          source,
          timesUsed: 1
        };
        newAddedCount++;
      } else {
        // Increment usage counter and retain asset link
        currentVault[hash].timesUsed = (currentVault[hash].timesUsed || 0) + 1;
        if (q.assetId && !currentVault[hash].assetId) {
          currentVault[hash].assetId = q.assetId;
          currentVault[hash].assetUrl = q.assetUrl;
        }
      }
    });
  });

  if (newAddedCount > 0) {
    saveVaultMap(currentVault);
    console.log(`[Auto-Vault] Successfully harvested ${newAddedCount} new questions into the vault.`);
  }

  return newAddedCount;
}

// Get Vault Summary Statistics
export function getVaultStats(): VaultStats {
  const vault = getStoredVault();
  const list = Object.values(vault);

  const bySubject: Record<string, number> = {};
  CBSE_SUBJECTS.forEach(s => { bySubject[s.id] = 0; });

  const byMarks = {
    oneMark: 0,
    twoMarks: 0,
    threeMarks: 0,
    fourMarks: 0,
    fiveMarks: 0
  };

  let aiHarvestedCount = 0;

  list.forEach(q => {
    if (q.subjectId) {
      bySubject[q.subjectId] = (bySubject[q.subjectId] || 0) + 1;
    }

    if (q.marks === 1) byMarks.oneMark++;
    else if (q.marks === 2) byMarks.twoMarks++;
    else if (q.marks === 3) byMarks.threeMarks++;
    else if (q.marks === 4) byMarks.fourMarks++;
    else if (q.marks >= 5) byMarks.fiveMarks++;

    if (q.source === 'ai_generated') {
      aiHarvestedCount++;
    }
  });

  return {
    totalQuestions: list.length,
    bySubject,
    byMarks,
    aiHarvestedCount
  };
}

// Retrieve questions by subject, marks, or chapter
export function getVaultQuestions(filters?: {
  subjectId?: string;
  marks?: number;
  chapterIds?: string[];
  type?: string;
}): StoredVaultQuestion[] {
  const vault = getStoredVault();
  let list = Object.values(vault);

  if (filters?.subjectId) {
    list = list.filter(q => q.subjectId === filters.subjectId);
  }

  if (filters?.marks !== undefined) {
    list = list.filter(q => q.marks === filters.marks);
  }

  if (filters?.type) {
    list = list.filter(q => q.type === filters.type);
  }

  if (filters?.chapterIds && filters.chapterIds.length > 0) {
    const chSet = new Set(filters.chapterIds);
    list = list.filter(q => q.chapterId && chSet.has(q.chapterId));
  }

  return list;
}

// ---------------------------------------------------------------------------
// INTELLIGENT QUESTION PAPER GENERATION FALLBACK SYSTEM
// - Accept ANY target marks requested by admin/super admin (e.g. 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100...)
// - Mix & Match random individual questions from saved papers database & vault
// - Never copy any old paper as a whole or sequentially ("same-to-same")
// - Strict mark matching (sum of question marks === Target Marks)
// - Clean, well-structured layout with clear question numbers & proper sections
// ---------------------------------------------------------------------------

export function findChapterIdByName(subject: Subject, chapterName?: string): string {
  if (!chapterName || !subject?.chapters || subject.chapters.length === 0) return 'ch1';
  const cleanTarget = chapterName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!cleanTarget) return subject.chapters[0].id;

  const match = subject.chapters.find(c => {
    const cleanTitle = c.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanTitle.includes(cleanTarget) || cleanTarget.includes(cleanTitle);
  });
  return match ? match.id : subject.chapters[0].id;
}

export function generateCombinatorialPaperFromVault(config: PaperConfig): GeneratedPaper {
  const subject = CBSE_SUBJECTS.find(s => s.id === config.subjectId) || CBSE_SUBJECTS[0];
  
  // 1. Gather all questions from Master Curated Repository, Vault AND Saved Papers Database
  const vaultMap = getStoredVault();
  const allSaved = getAllSavedPapers();
  const combinedPoolMap: Record<string, Question> = {};

  // Add all master curated questions for the subject
  const master = getMasterPool(subject.id);
  master.mcqs.forEach((m, idx) => {
    const h = hashQuestionText(m.q);
    combinedPoolMap[h] = {
      id: `m-mcq-${subject.id}-${idx}`,
      subjectId: subject.id,
      chapterId: findChapterIdByName(subject, m.ch),
      chapterName: m.ch,
      type: m.type || 'mcq',
      marks: 1,
      difficulty: 'medium',
      isCompetency: true,
      questionText: m.q,
      options: m.opts,
      correctAnswer: m.ans,
      markingScheme: `1 Mark for choosing correct option (${m.ans.charAt(0)}).`,
      explanation: m.exp || 'Official CBSE Curriculum Solution.'
    };
  });

  master.vsas.forEach((v, idx) => {
    const h = hashQuestionText(v.q);
    combinedPoolMap[h] = {
      id: `m-vsa-${subject.id}-${idx}`,
      subjectId: subject.id,
      chapterId: findChapterIdByName(subject, v.ch),
      chapterName: v.ch,
      type: 'vsa',
      marks: 2,
      difficulty: 'medium',
      isCompetency: true,
      questionText: v.q,
      correctAnswer: v.ans,
      markingScheme: v.ms || '[2 Marks] Stepwise key conceptual points.'
    };
  });

  master.sas.forEach((s, idx) => {
    const h = hashQuestionText(s.q);
    combinedPoolMap[h] = {
      id: `m-sa-${subject.id}-${idx}`,
      subjectId: subject.id,
      chapterId: findChapterIdByName(subject, s.ch),
      chapterName: s.ch,
      type: 'sa',
      marks: 3,
      difficulty: 'medium',
      isCompetency: true,
      questionText: s.q,
      correctAnswer: s.ans,
      markingScheme: s.ms || '[3 Marks] Full credit for complete stepwise explanation.'
    };
  });

  master.las.forEach((l, idx) => {
    const h = hashQuestionText(l.q);
    combinedPoolMap[h] = {
      id: `m-la-${subject.id}-${idx}`,
      subjectId: subject.id,
      chapterId: findChapterIdByName(subject, l.ch),
      chapterName: l.ch,
      type: 'la',
      marks: 5,
      difficulty: 'hard',
      isCompetency: true,
      questionText: l.q,
      correctAnswer: l.ans,
      markingScheme: l.ms || '[5 Marks] Detailed stepwise solution.'
    };
  });

  master.cases.forEach((c, idx) => {
    const h = hashQuestionText(c.q);
    combinedPoolMap[h] = {
      id: `m-case-${subject.id}-${idx}`,
      subjectId: subject.id,
      chapterId: findChapterIdByName(subject, c.ch),
      chapterName: c.ch,
      type: 'case',
      marks: 4,
      difficulty: 'medium',
      isCompetency: true,
      casePassage: c.passage,
      questionText: c.q,
      correctAnswer: c.ans,
      markingScheme: '[4 Marks] Sub-question wise scoring scheme.'
    };
  });

  // Add all from stored vault matching strictly this subjectId & domain rules
  Object.values(vaultMap).forEach(q => {
    if (q.subjectId === subject.id || isSubjectAndClassMatch(subject.id, subject.name, q.subjectId, q.questionText)) {
      if (!isSubjectAndClassMatch(subject.id, subject.name, q.subjectId || subject.id, q.questionText)) return;
      const h = hashQuestionText(q.questionText);
      combinedPoolMap[h] = q;
    }
  });

  // Add all questions from all previously saved papers in database matching strictly this subjectId & domain rules
  allSaved.forEach(paper => {
    if (paper.config?.subjectId === subject.id) {
      (paper.sections || []).forEach(sec => {
        (sec.questions || []).forEach(q => {
          if (q.questionText && q.questionText.length > 5) {
            if (isSubjectAndClassMatch(subject.id, subject.name, q.subjectId || paper.config?.subjectId, q.questionText)) {
              const h = hashQuestionText(q.questionText);
              if (!combinedPoolMap[h]) {
                combinedPoolMap[h] = {
                  ...q,
                  subjectId: subject.id
                };
              }
            }
          }
        });
      });
    }
  });

  // Add preloaded curated safety bank
  PRELOADED_QUESTIONS.filter(q => q.subjectId === subject.id).forEach(q => {
    if (isSubjectAndClassMatch(subject.id, subject.name, q.subjectId, q.questionText)) {
      const h = hashQuestionText(q.questionText);
      if (!combinedPoolMap[h]) {
        combinedPoolMap[h] = q;
      }
    }
  });

  let candidatePool = Object.values(combinedPoolMap);

  // Chapter filter if specific chapters requested
  const isAllChapters = !config.selectedChapterIds || 
                        config.selectedChapterIds.length === 0 || 
                        config.selectedChapterIds.length === (subject.chapters?.length || 0);

  const chSet = new Set(config.selectedChapterIds || []);
  const selectedChObjs = (subject.chapters || []).filter(c => chSet.has(c.id));
  const selectedChapterTitles = selectedChObjs.map(c => c.title);
  const selectedTitlesSet = new Set(selectedChapterTitles.map(t => t.toLowerCase().replace(/[^a-z0-9]/g, '')));

  const isChapterMatch = (chName: string, id: string) => {
    if (chSet.has(id)) return true;
    if (!chName || selectedTitlesSet.size === 0) return false;
    const clean = chName.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const st of selectedTitlesSet) {
      if (st.length > 3 && (clean.includes(st) || st.includes(clean))) return true;
    }
    return false;
  };

  if (!isAllChapters) {
    const chapterFiltered = candidatePool.filter(q => isChapterMatch(q.chapterName || '', q.chapterId || ''));
    // Always enforce chapter filtering if specific chapters were selected
    candidatePool = chapterFiltered;
  }

  // Group candidate pool by marks & shuffle randomly to guarantee non-sequential mix-and-match
  const pool1M = shuffle(candidatePool.filter(q => q.marks === 1 || q.type === 'mcq' || q.type === 'ar'));
  const pool2M = shuffle(candidatePool.filter(q => q.marks === 2 || q.type === 'vsa'));
  const pool3M = shuffle(candidatePool.filter(q => q.marks === 3 || q.type === 'sa'));
  const pool4M = shuffle(candidatePool.filter(q => q.marks === 4 || q.type === 'case'));
  const pool5M = shuffle(candidatePool.filter(q => q.marks >= 5 || q.type === 'la'));

  const targetMarks = Math.max(5, config.totalMarks || 80);
  const usedHashes = new Set<string>();
  const usedAssetIds = new Set<string>();
  let globalCounter = 0;

  // Generate unique randomized selection seeds for each section
  const paperSeed = Date.now() + Math.floor(Math.random() * 1000000);
  const seedSecA = paperSeed + 101;
  const seedSecB = paperSeed + 211;
  const seedSecC = paperSeed + 317;
  const seedSecD = paperSeed + 431;
  const seedSecE = paperSeed + 523;

  // Helper to pick unique random question from pool with intelligent procedural fallback and section seeding
  const pickFromPool = (pool: Question[], defaultMarks: number, fallbackType: string, secPrefix: string, sectionSeed: number): Question => {
    // Shuffle pool with section-specific seed so each section draws in a randomized unique order
    const sectionPool = seededShuffle(pool, sectionSeed);

    for (const qRaw of sectionPool) {
      const q = ensureQuestionAssetId(qRaw);
      const h = hashQuestionText(q.questionText);

      // Check text hash AND unique mapped assetId to guarantee no image/diagram repeats across questions
      if (!usedHashes.has(h)) {
        if (q.assetId && usedAssetIds.has(q.assetId)) {
          // Asset already mapped to another question block in this paper -> skip to avoid repeating image
          continue;
        }

        usedHashes.add(h);
        if (q.assetId) {
          usedAssetIds.add(q.assetId);
        }

        globalCounter++;
        const randId = Math.random().toString(36).substring(2, 7);
        return {
          ...q,
          id: `mix-${secPrefix}-${globalCounter}-${Date.now()}-${randId}`,
          marks: q.marks || defaultMarks
        };
      }
    }

    // Dynamic procedural generation with authentic curriculum numericals & concepts if pool is exhausted
    globalCounter++;
    const randId = Math.random().toString(36).substring(2, 7);
    const seedA = (globalCounter * 3 + 7);
    const seedB = (globalCounter * 5 + 11);
    
    let dynText = "";
    let dynAns = "";
    let dynPassage: string | undefined = undefined;
    let dynOpts: string[] | undefined = undefined;
    const fallbackChapters = selectedChapterTitles.length > 0 ? selectedChapterTitles : (subject.chapters || []).map(c => c.title);
    let dynCh = fallbackChapters[globalCounter % fallbackChapters.length] || `${subject.name} Core Syllabus`;

    // 1. Master Pool fallback for any question type (MCQ, VSA, SA, LA, Case)
    if (!dynText && master) {
      if ((fallbackType === 'case' || defaultMarks === 4) && master.cases && master.cases.length > 0) {
        const filteredCases = isAllChapters ? master.cases : master.cases.filter(c => isChapterMatch(c.ch || '', ''));
        const caseBank = filteredCases.length > 0 ? filteredCases : master.cases;
        const c = caseBank.find(item => !usedHashes.has(hashQuestionText(item.q))) || caseBank[globalCounter % caseBank.length];
        if (c) {
          dynPassage = c.passage;
          dynText = c.q;
          dynAns = c.ans;
          dynCh = c.ch || dynCh;
        }
      } else if (defaultMarks === 1 && master.mcqs && master.mcqs.length > 0) {
        const filteredMcqs = isAllChapters ? master.mcqs : master.mcqs.filter(m => isChapterMatch(m.ch || '', ''));
        const mcqBank = filteredMcqs.length > 0 ? filteredMcqs : master.mcqs;
        const m = mcqBank.find(item => !usedHashes.has(hashQuestionText(item.q))) || mcqBank[globalCounter % mcqBank.length];
        if (m) {
          dynText = m.q;
          dynOpts = m.opts;
          dynAns = m.ans;
          dynCh = m.ch || dynCh;
        }
      } else if (defaultMarks === 2 && master.vsas && master.vsas.length > 0) {
        const filteredVsas = isAllChapters ? master.vsas : master.vsas.filter(v => isChapterMatch(v.ch || '', ''));
        const vsaBank = filteredVsas.length > 0 ? filteredVsas : master.vsas;
        const v = vsaBank.find(item => !usedHashes.has(hashQuestionText(item.q))) || vsaBank[globalCounter % vsaBank.length];
        if (v) {
          dynText = v.q;
          dynAns = v.ans;
          dynCh = v.ch || dynCh;
        }
      } else if (defaultMarks === 3 && master.sas && master.sas.length > 0) {
        const filteredSas = isAllChapters ? master.sas : master.sas.filter(s => isChapterMatch(s.ch || '', ''));
        const saBank = filteredSas.length > 0 ? filteredSas : master.sas;
        const s = saBank.find(item => !usedHashes.has(hashQuestionText(item.q))) || saBank[globalCounter % saBank.length];
        if (s) {
          dynText = s.q;
          dynAns = s.ans;
          dynCh = s.ch || dynCh;
        }
      } else if (defaultMarks >= 5 && master.las && master.las.length > 0) {
        const filteredLas = isAllChapters ? master.las : master.las.filter(l => isChapterMatch(l.ch || '', ''));
        const laBank = filteredLas.length > 0 ? filteredLas : master.las;
        const l = laBank.find(item => !usedHashes.has(hashQuestionText(item.q))) || laBank[globalCounter % laBank.length];
        if (l) {
          dynText = l.q;
          dynAns = l.ans;
          dynCh = l.ch || dynCh;
        }
      }
    }

    // Procedural Fallback ONLY if dynText is still empty
    if (!dynText) {
      // CLASS 9 SCIENCE
      if (subject.id === 'class9-science-086') {
      const c9SciBank = [
        {
          m1: { q: `A vehicle starts from rest and accelerates at ${seedA % 4 + 2} m/s² for ${(seedA % 5 + 4)} seconds. What is its final velocity?`, opts: [`A) ${(seedA % 4 + 2) * (seedA % 5 + 4)} m/s`, `B) ${((seedA % 4 + 2) * (seedA % 5 + 4)) / 2} m/s`, `C) ${(seedA % 4 + 2) + (seedA % 5 + 4)} m/s`, `D) 0 m/s`], a: `A) ${(seedA % 4 + 2) * (seedA % 5 + 4)} m/s`, ch: "Motion" },
          m2: { q: `(a) State Newton's Second Law of Motion.\n(b) A constant force acts on an object of mass ${seedA % 5 + 3} kg, increasing its velocity from 4 m/s to 10 m/s in 2 s. Find the magnitude of the applied force.`, a: `(a) Rate of change of momentum is proportional to applied unbalanced force F = ma.\n(b) a = (10 - 4)/2 = 3 m/s². Force F = ${(seedA % 5 + 3)} × 3 = ${(seedA % 5 + 3) * 3} N.`, ch: "Force and Laws of Motion" },
          m3: { q: `(a) State the Universal Law of Gravitation.\n(b) An object has mass ${(seedA % 6 + 10)} kg on Earth. What will be its mass and weight on the surface of the Moon? (g_earth = 9.8 m/s², g_moon = 1/6 g_earth)`, a: `(a) F = G (m1 · m2) / r².\n(b) Mass remains invariant = ${(seedA % 6 + 10)} kg. Weight on Moon = m × (9.8 / 6) = ${(((seedA % 6 + 10) * 9.8) / 6).toFixed(2)} N.`, ch: "Gravitation" },
          m5: { q: `(a) State the Law of Conservation of Energy and mathematically prove it for an object of mass m freely falling from height h.\n(b) An electric bulb of ${(seedA % 3 + 1) * 50} W is used for 6 hours daily. Calculate the electrical units consumed in a month of 30 days.`, a: `(a) At top: TE = mgh + 0 = mgh. At midway (drop x): v²=2gx, KE=mgx, PE=mg(h-x) => TE = mgh. At ground: v²=2gh, KE=mgh, PE=0 => TE = mgh. Energy is conserved.\n(b) Energy = Power(kW) × Time(h) = ${((seedA % 3 + 1) * 50) / 1000} kW × 180 h = ${(((seedA % 3 + 1) * 50) / 1000 * 180).toFixed(1)} units.`, ch: "Work and Energy" }
        },
        {
          m1: { q: `Which of the following cellular organelles contains its own genetic material (DNA) and ribosomes?`, opts: [`A) Mitochondria`, `B) Lysosome`, `C) Golgi apparatus`, `D) Endoplasmic reticulum`], a: `A) Mitochondria`, ch: "The Fundamental Unit of Life" },
          m2: { q: `(i) Why are lysosomes known as 'suicide bags' of a cell?\n(ii) Differentiate between rough endoplasmic reticulum (RER) and smooth endoplasmic reticulum (SER).`, a: `(i) When cell gets damaged, lysosomes burst and digestive enzymes hydrolyze cell's own contents.\n(ii) RER has ribosomes on its surface and synthesizes proteins; SER lacks ribosomes and synthesizes lipids/fats.`, ch: "The Fundamental Unit of Life" },
          m3: { q: `Solve the following problem regarding structure and functioning of Xylem and Phloem tissues in plants. Why are they called complex permanent tissues?`, a: `They consist of more than one type of cell working together to perform a common function.\nXylem: Tracheids, vessels, xylem parenchyma, xylem fibres (conducts water & minerals unidirectionally).\nPhloem: Sieve tubes, companion cells, phloem parenchyma, phloem fibres (translocates organic food bidirectionally).`, ch: "Tissues" },
          m5: { q: `(a) Write the chemical formula and calculate molecular mass of: (i) Aluminium sulphate (ii) Calcium carbonate (Al=27, S=32, O=16, Ca=40, C=12).\n(b) State the Postulates of Dalton's Atomic Theory and mention one limitation.`, a: `(a) (i) Al2(SO4)3: 2(27) + 3(32 + 64) = 54 + 288 = 342 u. (ii) CaCO3: 40 + 12 + 48 = 100 u.\n(b) Postulates: Matter consists of indivisible atoms; atoms of same element are identical; compounds formed by combining whole number atoms. Limitation: Discovery of subatomic particles (electrons, protons) showed atoms are divisible.`, ch: "Atoms and Molecules" }
        }
      ];
      const findUnusedC9Sci = c9SciBank.find(it => {
        const qText = defaultMarks === 1 ? it.m1.q : defaultMarks === 2 ? it.m2.q : defaultMarks === 3 ? it.m3.q : it.m5.q;
        return !usedHashes.has(hashQuestionText(qText));
      }) || c9SciBank[globalCounter % c9SciBank.length];
      const item = findUnusedC9Sci;
      if (defaultMarks === 1) { dynText = item.m1.q; dynOpts = item.m1.opts; dynAns = item.m1.a; dynCh = item.m1.ch; }
      else if (defaultMarks === 2) { dynText = item.m2.q; dynAns = item.m2.a; dynCh = item.m2.ch; }
      else if (defaultMarks === 3) { dynText = item.m3.q; dynAns = item.m3.a; dynCh = item.m3.ch; }
      else { dynText = item.m5.q; dynAns = item.m5.a; dynCh = item.m5.ch; }
    }
    // CLASS 9 MATHEMATICS
    else if (subject.id === 'class9-maths-041') {
      const c9MathBank = [
        {
          m1: { q: `If (x + ${seedA % 3 + 1}) is a factor of polynomial p(x) = x² + ${(seedA % 3 + 1) * 3}x + k, find the value of k.`, opts: [`A) ${(seedA % 3 + 1) * (seedA % 3 + 1) * 2}`, `B) -${(seedA % 3 + 1) * 2}`, `C) 0`, `D) 1`], a: `A) ${(seedA % 3 + 1) * (seedA % 3 + 1) * 2}`, ch: "Polynomials" },
          m2: { q: `Express 0.${seedA % 7 + 2}${seedA % 7 + 2}${seedA % 7 + 2}... in the rational p/q form where p and q are co-prime integers.`, a: `Let x = 0.${seedA % 7 + 2}... => 10x = ${seedA % 7 + 2}.${seedA % 7 + 2}... => 9x = ${seedA % 7 + 2} => x = ${seedA % 7 + 2}/9.`, ch: "Number Systems" },
          m3: { q: `In △ABC, the bisectors of ∠B and ∠C intersect each other at a point O inside the triangle. Prove that ∠BOC = 90° + 1/2 ∠A.`, a: `In △ABC: ∠A + ∠B + ∠C = 180° => 1/2 ∠B + 1/2 ∠C = 90° - 1/2 ∠A.\nIn △BOC: ∠BOC = 180° - (1/2 ∠B + 1/2 ∠C) = 180° - (90° - 1/2 ∠A) = 90° + 1/2 ∠A.`, ch: "Lines and Angles" },
          m5: { q: `(a) Factorize completely using factor theorem: x³ - 6x² + 11x - 6.\n(b) Using Heron's formula, find the area of an isosceles triangle whose perimeter is 32 cm and base is 12 cm.`, a: `(a) P(1) = 1 - 6 + 11 - 6 = 0 => (x - 1) is a factor. Dividing gives x² - 5x + 6 = (x - 2)(x - 3). Factors: (x - 1)(x - 2)(x - 3).\n(b) Equal sides a = (32 - 12)/2 = 10 cm. s = 16 cm. Area = √[16(16-10)(16-10)(16-12)] = √[16 × 6 × 6 × 4] = 4 × 6 × 2 = 48 cm².`, ch: "Heron's Formula" }
        }
      ];
      const findUnusedC9Math = c9MathBank.find(it => {
        const qText = defaultMarks === 1 ? it.m1.q : defaultMarks === 2 ? it.m2.q : defaultMarks === 3 ? it.m3.q : it.m5.q;
        return !usedHashes.has(hashQuestionText(qText));
      }) || c9MathBank[globalCounter % c9MathBank.length];
      const item = findUnusedC9Math;
      if (defaultMarks === 1) { dynText = item.m1.q; dynOpts = item.m1.opts; dynAns = item.m1.a; dynCh = item.m1.ch; }
      else if (defaultMarks === 2) { dynText = item.m2.q; dynAns = item.m2.a; dynCh = item.m2.ch; }
      else if (defaultMarks === 3) { dynText = item.m3.q; dynAns = item.m3.a; dynCh = item.m3.ch; }
      else { dynText = item.m5.q; dynAns = item.m5.a; dynCh = item.m5.ch; }
    }
    // CLASS 12 PHYSICS
    else if (subject.id === 'class12-physics-042') {
      const c12PhyBank = [
        {
          m1: { q: `A parallel plate capacitor has capacitance C. If plate separation is doubled and space is filled with dielectric constant K = ${(seedA % 4 + 3)}, new capacitance is:`, opts: [`A) ${((seedA % 4 + 3) / 2).toFixed(1)} C`, `B) ${(seedA % 4 + 3) * 2} C`, `C) C / ${(seedA % 4 + 3)}`, `D) 2 C`], a: `A) ${((seedA % 4 + 3) / 2).toFixed(1)} C`, ch: "Electrostatic Potential and Capacitance" },
          m2: { q: `State Gauss's Law in Electrostatics and write its integral mathematical form for a closed surface enclosing charge q.`, a: `Total electric flux through any closed Gaussian surface in vacuum is equal to q_enclosed / ε₀.\n∮ E · dA = q / ε₀.`, ch: "Electric Charges and Fields" },
          m3: { q: `Derive the expression for the magnetic field B at a point on the axis of a circular current-carrying loop of radius R and turns N at distance x from center.`, a: `Using Biot-Savart Law: dB = (μ₀/4π) · (I dl / r²). Integrating axial components dB_x = dB cosθ gives B = (μ₀ N I R²) / [2 (R² + x²)^(3/2)].`, ch: "Moving Charges and Magnetism" },
          m5: { q: `(a) Derive Lens Maker's Formula: 1/f = (μ - 1)(1/R₁ - 1/R₂) for a thin double convex lens.\n(b) In Young's Double Slit Experiment, the slits are separated by 0.28 mm and screen is at 1.4 m. If wavelength λ = 600 nm, calculate the fringe width.`, a: `(a) Refraction at spherical interfaces: μ₂/v₁ - μ₁/u = (μ₂-μ₁)/R₁ and μ₁/v - μ₂/v₁ = (μ₁-μ₂)/R₂. Adding yields 1/v - 1/u = (μ-1)(1/R₁ - 1/R₂) => 1/f = (μ-1)(1/R₁ - 1/R₂).\n(b) Fringe width β = λD / d = (600 × 10⁻⁹ × 1.4) / (0.28 × 10⁻³) = 3.0 × 10⁻³ m = 3 mm.`, ch: "Wave Optics" }
        }
      ];
      const findUnusedC12Phy = c12PhyBank.find(it => {
        const qText = defaultMarks === 1 ? it.m1.q : defaultMarks === 2 ? it.m2.q : defaultMarks === 3 ? it.m3.q : it.m5.q;
        return !usedHashes.has(hashQuestionText(qText));
      }) || c12PhyBank[globalCounter % c12PhyBank.length];
      const item = findUnusedC12Phy;
      if (defaultMarks === 1) { dynText = item.m1.q; dynOpts = item.m1.opts; dynAns = item.m1.a; dynCh = item.m1.ch; }
      else if (defaultMarks === 2) { dynText = item.m2.q; dynAns = item.m2.a; dynCh = item.m2.ch; }
      else if (defaultMarks === 3) { dynText = item.m3.q; dynAns = item.m3.a; dynCh = item.m3.ch; }
      else { dynText = item.m5.q; dynAns = item.m5.a; dynCh = item.m5.ch; }
    }
    // CLASS 12 CHEMISTRY
    else if (subject.id === 'class12-chemistry-043') {
      const c12ChemBank = [
        {
          m1: { q: `The unit of rate constant (k) for a zero-order chemical reaction is:`, opts: [`A) mol L⁻¹ s⁻¹`, `B) s⁻¹`, `C) L mol⁻¹ s⁻¹`, `D) mol⁻² L² s⁻¹`], a: `A) mol L⁻¹ s⁻¹`, ch: "Chemical Kinetics" },
          m2: { q: `State Kohlrausch's Law of Independent Migration of Ions. Write its mathematical expression for NaCl.`, a: `At infinite dilution, limiting molar conductivity of an electrolyte is equal to the sum of individual contributions of anions and cations.\nΛ°_m(NaCl) = λ°(Na⁺) + λ°(Cl⁻).`, ch: "Electrochemistry" },
          m3: { q: `(i) Write the IUPAC name of [Co(NH₃)₅(CO₃)]Cl.\n(ii) Why are transition metal complexes generally colored?\n(iii) Differentiate between homoleptic and heteroleptic complexes.`, a: `(i) Pentaamminecarbonatocobalt(III) chloride.\n(ii) Due to d-d electronic transitions in the presence of crystal field splitting.\n(iii) Homoleptic complexes have only one kind of ligand (e.g. [Fe(CN)₆]⁴⁻); heteroleptic have more than one kind of ligand (e.g. [Pt(NH₃)₂Cl₂]).`, ch: "Coordination Compounds" },
          m5: { q: `(a) Solve the following problem regarding mechanism of nucleophilic substitution SN1 and SN2 reactions in haloalkanes with stereochemical outcomes.\n(b) Write short notes with chemical equations: (i) Reimer-Tiemann reaction (ii) Cannizzaro reaction.`, a: `(a) SN1: Two-step carbocation intermediate mechanism, 1st order kinetics, racemization. SN2: Single-step concerted backside attack, 2nd order kinetics, Walden inversion.\n(b) (i) Phenol + CHCl3 + 3NaOH (340K) -> Salicylaldehyde + 3NaCl + 2H2O. (ii) Formaldehyde (HCHO) + conc. NaOH -> Methanol (CH3OH) + Sodium formate (HCOONa).`, ch: "Aldehydes, Ketones and Carboxylic Acids" }
        }
      ];
      const findUnusedC12Chem = c12ChemBank.find(it => {
        const qText = defaultMarks === 1 ? it.m1.q : defaultMarks === 2 ? it.m2.q : defaultMarks === 3 ? it.m3.q : it.m5.q;
        return !usedHashes.has(hashQuestionText(qText));
      }) || c12ChemBank[globalCounter % c12ChemBank.length];
      const item = findUnusedC12Chem;
      if (defaultMarks === 1) { dynText = item.m1.q; dynOpts = item.m1.opts; dynAns = item.m1.a; dynCh = item.m1.ch; }
      else if (defaultMarks === 2) { dynText = item.m2.q; dynAns = item.m2.a; dynCh = item.m2.ch; }
      else if (defaultMarks === 3) { dynText = item.m3.q; dynAns = item.m3.a; dynCh = item.m3.ch; }
      else { dynText = item.m5.q; dynAns = item.m5.a; dynCh = item.m5.ch; }
    }
    // CLASS 12 MATHEMATICS
    else if (subject.id === 'class12-maths-041') {
      const c12MathBank = [
        {
          m1: { q: `If A is a square matrix of order 3 such that |A| = ${(seedA % 4 + 2)}, find the value of |adj A|.`, opts: [`A) ${Math.pow(seedA % 4 + 2, 2)}`, `B) ${(seedA % 4 + 2) * 3}`, `C) ${(seedA % 4 + 2)}`, `D) ${Math.pow(seedA % 4 + 2, 3)}`], a: `A) ${Math.pow(seedA % 4 + 2, 2)}`, ch: "Determinants" },
          m2: { q: `Find the general solution of the differential equation dy/dx + ${(seedA % 3 + 2)}y = 0.`, a: `dy/y = -${(seedA % 3 + 2)} dx => ln|y| = -${(seedA % 3 + 2)}x + C => y = A e^(-${(seedA % 3 + 2)}x).`, ch: "Differential Equations" },
          m3: { q: `Evaluate the integral: ∫ [ (2x + 3) / (x² + 3x + 5) ] dx using substitution method.`, a: `Let t = x² + 3x + 5 => dt = (2x + 3) dx. Integral becomes ∫ dt/t = ln|t| + C = ln|x² + 3x + 5| + C.`, ch: "Integrals" },
          m5: { q: `(a) Find the shortest distance between the skew lines: r = (i + 2j + k) + λ(i - j + k) and r = (2i - j - k) + μ(2i + j + 2k).\n(b) Solve the linear programming problem (LPP) graphically: Maximize Z = 4x + y subject to constraints x + y ≤ 50, 3x + y ≤ 90, x ≥ 0, y ≥ 0.`, a: `(a) SD = |(a2 - a1) · (b1 × b2)| / |b1 × b2|. Calculation yields shortest distance = 3/√19 units.\n(b) Corner points: (0,0) -> Z=0; (30,0) -> Z=120; (20,30) -> Z=110; (0,50) -> Z=50. Maximum Z = 120 at (30, 0).`, ch: "Three Dimensional Geometry" }
        }
      ];
      const findUnusedC12Math = c12MathBank.find(it => {
        const qText = defaultMarks === 1 ? it.m1.q : defaultMarks === 2 ? it.m2.q : defaultMarks === 3 ? it.m3.q : it.m5.q;
        return !usedHashes.has(hashQuestionText(qText));
      }) || c12MathBank[globalCounter % c12MathBank.length];
      const item = findUnusedC12Math;
      if (defaultMarks === 1) { dynText = item.m1.q; dynOpts = item.m1.opts; dynAns = item.m1.a; dynCh = item.m1.ch; }
      else if (defaultMarks === 2) { dynText = item.m2.q; dynAns = item.m2.a; dynCh = item.m2.ch; }
      else if (defaultMarks === 3) { dynText = item.m3.q; dynAns = item.m3.a; dynCh = item.m3.ch; }
      else { dynText = item.m5.q; dynAns = item.m5.a; dynCh = item.m5.ch; }
    }
    // CLASS 12 BIOLOGY / CS / ENGLISH
    else if (subject.id === 'class12-biology-044') {
      dynText = defaultMarks === 1 
        ? `The functional unit of inheritance that controls a specific phenotype is known as a:` 
        : defaultMarks === 2
          ? `(a) Differentiate between homologous and analogous organs with one example of each.\n(b) State Hardy-Weinberg Principle.`
          : defaultMarks === 3
            ? `Solve the following problem regarding process of DNA replication with reference to the enzymes Helicase, DNA Polymerase, and Ligase.`
            : `(a) Describe the structure of a mature embryo sac in angiosperms with a neat labelled diagram.\n(b) Solve the following problem regarding steps involved in recombinant DNA technology (rDNA).`;
      dynAns = `Full credit awarded for accurate biological terminology, correct labeling, and stepwise biochemical mechanism.`;
      if (defaultMarks === 1) dynOpts = [`A) Gene`, `B) Chromosome`, `C) Centromere`, `D) Histone`];
    }
    else if (subject.id === 'class12-computer-083') {
      dynText = defaultMarks === 1
        ? `Which SQL constraint is used to ensure all values in a column are distinct and unique?`
        : defaultMarks === 2
          ? `(a) Differentiate between mutable and immutable data types in Python with examples.\n(b) What is a Stack? Write push and pop algorithm.`
          : defaultMarks === 3
            ? `Write a Python function to read a text file 'STORY.TXT' and count the total number of words starting with vowels (A, E, I, O, U).`
            : `(a) Write SQL queries to create table 'STUDENT' with fields (RollNo INT PRIMARY KEY, Name VARCHAR(30), Marks DECIMAL(5,2), Stream VARCHAR(15)).\n(b) Differentiate between Packet Switching and Circuit Switching in Computer Networks.`;
      dynAns = `Correct syntax, logic flow, and execution output rewarded as per CBSE CS 083 guidelines.`;
      if (defaultMarks === 1) dynOpts = [`A) UNIQUE`, `B) DEFAULT`, `C) CHECK`, `D) FOREIGN KEY`];
    }
    // CLASS 10 MATHS
    else if (subject.id.includes('maths')) {
      const bank = MATH_MCQ_BANK;
      const questions = bank[defaultMarks] || bank[1];
      if (bank && questions) {
        const item = questions[Math.floor(Math.random() * questions.length)];
        dynText = item.q;
        dynOpts = item.opts;
        dynAns = item.ans;
        dynCh = item.ch;
      } else {
        // Fallback to a random question from bank 1
        const fallback = bank[1][Math.floor(Math.random() * bank[1].length)];
        dynText = fallback.q;
        dynOpts = fallback.opts;
        dynAns = fallback.ans;
        dynCh = fallback.ch;
      }
    }
    // CLASS 10 SCIENCE
    else if (subject.id.includes('science')) {
      const bank = SCIENCE_MCQ_BANK;
      const questions = bank[defaultMarks] || bank[1];
      if (bank && questions) {
        const item = questions[Math.floor(Math.random() * questions.length)];
        dynText = item.q;
        dynOpts = item.opts;
        dynAns = item.ans;
        dynCh = item.ch;
      } else {
        // Fallback to a random question from bank 1
        const fallback = bank[1][Math.floor(Math.random() * bank[1].length)];
        dynText = fallback.q;
        dynOpts = fallback.opts;
        dynAns = fallback.ans;
        dynCh = fallback.ch;
      }
    }
    // ENGLISH (CLASS 9, 10, 12)
    else if (subject.id === 'english-184' || subject.id === 'class9-english-184' || subject.id === 'class12-english-301' || subject.name.toLowerCase().includes('english')) {
      if (defaultMarks === 1) {
        const eng1M = [
          { q: "Choose the correct reported speech: The teacher said, 'Practice regular writing to improve speed.'", opts: ["A) The teacher advised students to practice regular writing to improve speed.", "B) The teacher said that practice writing.", "C) The teacher asked if students practice writing.", "D) The teacher told to practiced writing."], ans: "A) The teacher advised students to practice regular writing to improve speed.", ch: "Grammar: Reported Speech" },
          { q: "Identify the error and select correction: 'The list of shortlisted candidates have been displayed on the notice board.'", opts: ["A) Error: have -> Correction: has", "B) Error: displayed -> Correction: display", "C) Error: on -> Correction: at", "D) Error: list -> Correction: lists"], ans: "A) Error: have -> Correction: has (Singular subject 'list' requires singular verb 'has').", ch: "Grammar: Subject-Verb Concord" },
          { q: "In 'A Letter to God', why did Lencho compare large raindrops to new silver coins?", opts: ["A) They promised a rich corn harvest and economic prosperity", "B) They looked shiny", "C) He collected coins from the sky", "D) It was a metaphor for hail"], ans: "A) They promised a rich corn harvest and economic prosperity", ch: "First Flight: A Letter to God" },
          { q: "Select the correct modal auxiliary: 'Citizens ______ preserve national heritage and historical monuments.'", opts: ["A) ought to", "B) might", "C) could", "D) would"], ans: "A) ought to", ch: "Grammar: Modals" }
        ];
        const pick = eng1M.find(it => !usedHashes.has(hashQuestionText(it.q))) || eng1M[globalCounter % eng1M.length];
        dynText = pick.q;
        dynOpts = pick.opts;
        dynAns = pick.ans;
        dynCh = pick.ch;
      } else if (defaultMarks === 2) {
        const eng2M = [
          { q: "Why did Nelson Mandela call the policy of apartheid a 'deep and lasting wound' on his country?", a: "Mandela explained that decades of racial oppression produced extraordinary leaders of courage like Sisulu and Tambo, but left emotional and physical scars on generations of South Africans.", ch: "First Flight: Nelson Mandela" },
          { q: "How did Hari Singh justify stealing money from Anil despite Anil's immense kindness?", a: "Hari rationalized that Anil was careless with money and would waste it on his friends anyway, and if Hari didn't take it, someone else would.", ch: "Footprints without Feet: The Thief's Story" },
          { q: "Correct the sentence and state the grammatical rule: 'Neither the teacher nor the students was present in the laboratory.'", a: "Correction: Replace 'was' with 'were'.\nRule: When subjects are joined by 'neither...nor', the verb agrees with the nearer subject ('students').", ch: "Grammar: Subject-Verb Agreement" }
        ];
        const pick = eng2M.find(it => !usedHashes.has(hashQuestionText(it.q))) || eng2M[globalCounter % eng2M.length];
        dynText = pick.q;
        dynAns = pick.a;
        dynCh = pick.ch;
      } else if (defaultMarks === 3) {
        const eng3M = [
          { q: "Contrast the life of the tiger in his natural jungle habitat with his caged confinement in Leslie Norris's poem 'A Tiger in the Zoo'.", a: "In the wild, the tiger is majestic, lurking in shadows near water holes to hunt deer naturally. In captivity, he is imprisoned behind concrete walls, stalking the quiet cage in quiet rage and ignoring visitors.", ch: "First Flight: A Tiger in the Zoo" },
          { q: "How did Valli meticulously plan and execute her first solo bus ride to the nearby town in 'Madam Rides the Bus'?", a: "Valli listened to regular bus passengers, calculated total fare (60 paise) and duration (45 mins each way), and saved every coin by sacrificing candies, toys, and joy rides.", ch: "First Flight: Madam Rides the Bus" },
          { q: "What profound realization did Kisa Gotami arrive at after failing to procure mustard seeds from a death-free house?", a: "She realized that grief is universal, human life is brief and fragile, and death is the inescapable common destiny of all living beings.", ch: "First Flight: The Sermon at Benares" }
        ];
        const pick = eng3M.find(it => !usedHashes.has(hashQuestionText(it.q))) || eng3M[globalCounter % eng3M.length];
        dynText = pick.q;
        dynAns = pick.a;
        dynCh = pick.ch;
      } else if (defaultMarks === 4) {
        dynPassage = `Deep reading of literary works strengthens neural connectivity in the brain's left temporal cortex, enhancing vocabulary, empathy, and concentration (Set #${globalCounter + 1}). Educational psychologists highlight that dedicating 20 minutes a day to undisturbed reading reduces stress hormones by 68% and elevates analytical reasoning in secondary school learners.`;
        dynText = `Q1. Which part of the brain is stimulated by deep reading and what function does it serve? (1M)\nQ2. State two distinct emotional and cognitive advantages of reading for 20 minutes daily. (2M)\nQ3. Find a word in the passage that means 'pertaining to the nervous system'. (1M)`;
        dynAns = "Q1. The left temporal cortex, responsible for language reception and empathy.\nQ2. (i) Reduces cortisol stress hormones by 68%. (ii) Elevates analytical problem solving and vocabulary.\nQ3. 'Neural'.";
        dynCh = "Reading Comprehension: Discursive Passage";
      } else {
        const eng5M = [
          { q: "SECTION B: CREATIVE WRITING SKILLS - FORMAL LETTER TO EDITOR (5 MARKS)\n\nYou are Armaan / Ananya, a resident of Preet Vihar, Delhi. Write a formal Letter to the Editor of a national daily (100–120 words) highlighting the urgent necessity of restoring public libraries and community reading hubs in urban sectors. Suggest realistic civic measures.", a: "Format: Sender Address, Date, Receiver Address, Subject, Salutation, 3-Paragraph Body, Complimentary Close.\nContent: Importance of public libraries for youth focus, diminishing open reading spaces, civic recommendations (digital catalogue, subsidized membership, school partnerships).", ch: "Writing Skills: Formal Letter" },
          { q: "SECTION B: CREATIVE WRITING SKILLS - ANALYTICAL PARAGRAPH (5 MARKS)\n\nThe chart below outlines the preferred preparation modes of CBSE Class 10 students:\n• Interactive Question Banks & AI Mock Tests: 45%\n• NCERT Textbooks & Reference Guides: 35%\n• Group Peer Discussions: 20%\n\nWrite an analytical paragraph (100–120 words) interpreting the data, comparing trends, and drawing a valid conclusion.", a: "Analytical interpretation: Digital AI-driven practice leads at 45%, followed by foundational NCERT self-study at 35%, and peer discussions at 20%. Conclude that a blended approach yields the highest academic retention.", ch: "Writing Skills: Analytical Paragraph" },
          { q: "Nelson Mandela states: 'The brave man is not he who does not feel afraid, but he who conquers that fear.' Justify this statement with reference to Mandela's lifelong struggle against apartheid.", a: "Mandela witnessed countless comrades sacrifice their lives without breaking. He learned that courage was the conscious mastery over fear. Despite decades in prison, he refused to let hatred dictate his actions.", ch: "First Flight: Long Walk to Freedom" }
        ];
        const pick = eng5M.find(it => !usedHashes.has(hashQuestionText(it.q))) || eng5M[globalCounter % eng5M.length];
        dynText = pick.q;
        dynAns = pick.a;
        dynCh = pick.ch;
      }
    } else if (subject.id.includes('social')) {
      const bank = SOCIAL_MCQ_BANK;
      const questions = bank[defaultMarks] || bank[1];
      if (bank && questions) {
        const item = questions.find(it => !usedHashes.has(hashQuestionText(it.q))) || questions[Math.floor(Math.random() * questions.length)];
        dynText = item.q;
        dynOpts = item.opts;
        dynAns = item.ans;
        dynCh = item.ch;
      } else {
        dynText = "Analyze the given historical or geographical concept.";
        dynAns = "Refer to textbook.";
      }
    } else if (subject.id.includes('hindi')) {
      if (subject.id.includes('085') || subject.id.includes('hindi-b')) {
        // Hindi Course B (085)
        const hinBTopics = [
          { q: "अपने क्षेत्र में पार्क के विकास और रखरखाव के लिए नगर निगम अधिकारी को एक पत्र लिखिए।", a: "औपचारिक पत्र: प्रारूप के अनुसार प्रेषक का पता, दिनांक, सेवा में, विषय, महोदय, पार्क की दुर्दशा का वर्णन, और भवदीय।", ch: "रचनात्मक लेखन: पत्र लेखन" },
          { q: "‘ऑनलाइन शिक्षा: लाभ और चुनौतियाँ’ विषय पर लगभग 120 शब्दों में एक सारगर्भित अनुच्छेद लिखिए।", a: "अनुच्छेद लेखन: भूमिका, लाभ (सुलभता, ज्ञान), चुनौतियाँ (आँखों पर प्रभाव, नेटवर्क), और निष्कर्ष।", ch: "रचनात्मक लेखन: अनुच्छेद लेखन" },
          { q: "आपके विद्यालय में आयोजित होने वाले ‘स्वच्छता अभियान’ में छात्रों की भागीदारी हेतु एक आकर्षक सूचना तैयार कीजिए।", a: "सूचना लेखन: विद्यालय का नाम, 'सूचना', विषय, दिनांक, विवरण और हस्ताक्षर।", ch: "रचनात्मक लेखन: सूचना लेखन" },
          { q: "‘डायरी का एक पन्ना’ के माध्यम से स्पष्ट कीजिए कि स्वतंत्रता आंदोलन में कलकत्ता वासियों का क्या योगदान था?", a: "26 जनवरी 1931 को पुलिस की लाठियों के बावजूद लोगों ने झंडोत्सव मनाया और जुलूस निकाला।", ch: "स्पर्श: डायरी का एक पन्ना" }
        ];
        const pick = hinBTopics.find(it => !usedHashes.has(hashQuestionText(it.q))) || hinBTopics[globalCounter % hinBTopics.length];
        dynText = pick.q;
        dynAns = pick.a;
        dynCh = pick.ch;
      } else {
        const hinATopics = [
          { q: "‘नेताजी का चश्मा’ पाठ में कैप्टन चश्मेवाले के माध्यम से लेखक ने किस भावना को व्यक्त किया है?", a: "कैप्टन के माध्यम से लेखक ने देश के उन अनगिनत नागरिकों के प्रति सम्मान और देशभक्ति प्रकट की है जो देश निर्माण में योगदान देते हैं।", ch: "नेताजी का चश्मा" },
          { q: "‘बालगोबिन भगत’ के गायन और चरित्र की मुख्य विशेषताएँ अपने शब्दों में लिखिए।", a: "बालगोबिन भगत कबीर को साहब मानते थे, वे गृहस्थ होकर भी सच्चे साधु थे और सत्य तथा निष्ठा के प्रतीक थे।", ch: "बालगोबिन भगत" }
        ];
        const pick = hinATopics.find(it => !usedHashes.has(hashQuestionText(it.q))) || hinATopics[globalCounter % hinATopics.length];
        dynText = pick.q;
        dynAns = pick.a;
        dynCh = pick.ch;
      }
    } else if (subject.id.includes('accountancy') || subject.id.includes('account')) {
      const accTopics = [
        { q: "Explain the accounting treatment for Goodwill and Reconstitution of a Partnership Firm upon admission of a new partner.", a: "Goodwill is valued based on average profit, super profit, or capitalization method. Partner's capital accounts are credited/debited according to sacrificing ratio.", ch: "Partnership Accounts" },
        { q: "Explain the preparation and presentation of Cash Flow Statement as per AS-3 (Revised).", a: "Cash flows are classified into Operating, Investing, and Financing activities. Non-cash expenses and working capital changes are adjusted.", ch: "Cash Flow Statement" },
        { q: "What are Accounting Ratios? Distinguish between Liquidity, Solvency, and Profitability ratios.", a: "Liquidity ratios (Current/Quick ratio) measure short-term solvency. Solvency ratios (Debt-Equity) measure long-term solvency. Profitability ratios measure earning capacity.", ch: "Financial Statement Analysis" },
        { q: "Discuss the forfeiture and reissue of shares issued at premium or discount in Company Accounts.", a: "Shares forfeited reduce subscribed capital. Amount already received on forfeited shares is transferred to Share Forfeiture Account. Reissue discount cannot exceed forfeiture balance.", ch: "Company Accounts" }
      ];
      const pick = accTopics.find(it => !usedHashes.has(hashQuestionText(it.q))) || accTopics[globalCounter % accTopics.length];
      dynText = pick.q;
      dynAns = pick.a;
      dynCh = pick.ch;
    } else if (subject.id.includes('bst') || subject.id.includes('business')) {
      const bstTopics = [
        { q: "Discuss the significance and principles of Management as highlighted by Henri Fayol and F.W. Taylor.", a: "Fayol emphasized 14 general administrative principles. Taylor emphasized Scientific Management, time study, motion study, and functional foremanship.", ch: "Principles of Management" },
        { q: "Explain the role of Financial Management and Capital Structure decisions in an enterprise.", a: "Financial management aims at wealth maximization. Capital structure balances debt and equity considering cost of capital, risk, and cash flow position.", ch: "Financial Management" },
        { q: "Analyze the four elements of Marketing Mix (Product, Price, Place, Promotion) in consumer goods marketing.", a: "Product design, pricing strategies, distribution channels, and promotional tools work together to satisfy customer needs and achieve business objectives.", ch: "Marketing Management" }
      ];
      const pick = bstTopics.find(it => !usedHashes.has(hashQuestionText(it.q))) || bstTopics[globalCounter % bstTopics.length];
      dynText = pick.q;
      dynAns = pick.a;
      dynCh = pick.ch;
    } else if (subject.id.includes('eco') || subject.id.includes('economic')) {
      const ecoTopics = [
        { q: "State the Law of Demand. Explain the distinction between 'Movement along Demand Curve' and 'Shift in Demand Curve' with examples.", a: "Law of Demand states inverse price-quantity relationship. Movement along curve is due to price change alone; Shift in curve is due to income, substitutes, or tastes.", ch: "Demand and Elasticity of Demand" },
        { q: "A consumer buys 80 units of a commodity at ₹ 5 per unit. Price elasticity of demand is (-) 2. Calculate new quantity demanded if price falls to ₹ 4 per unit.", a: "%ΔP = -20%. Ed = %ΔQ / %ΔP => -2 = %ΔQ / -20% => %ΔQ = +40%. New quantity = 80 + 32 = 112 units.", ch: "Demand and Elasticity of Demand" },
        { q: "Explain the determination of Equilibrium National Income and the concept of Investment Multiplier (K = 1 / (1 - MPC)).", a: "Equilibrium occurs when Aggregate Demand equals Aggregate Supply (AD = AS) or Savings equals Investment (S = I). Multiplier K = 1 / (1 - MPC).", ch: "National Income Accounting" },
        { q: "Discuss the credit control functions of Central Bank (RBI) using Repo Rate, CRR, and Open Market Operations.", a: "RBI controls credit using Repo Rate, Reverse Repo Rate, CRR, SLR, and Open Market Operations to curb inflation or boost liquidity.", ch: "Money and Banking" }
      ];
      const pick = ecoTopics.find(it => !usedHashes.has(hashQuestionText(it.q))) || ecoTopics[globalCounter % ecoTopics.length];
      dynText = pick.q;
      dynAns = pick.a;
      dynCh = pick.ch;
    } else if (subject.id.includes('history') || subject.id.includes('hist')) {
      const histTopics = [
        { q: "Critically examine the main features of urban town planning, drainage systems, and social structures in the Harappan Civilisation.", a: "Grid pattern roads, burnt brick houses, sophisticated drainage system, citadel, granaries, and specialized crafts.", ch: "Bricks, Beads and Bones" },
        { q: "Examine the social, economic, and political significance of the Non-Cooperation Movement led by Mahatma Gandhi.", a: "Boycott of British institutions, foreign cloth, mass mobilization of peasants and workers, and national awakening.", ch: "Mahatma Gandhi and National Movement" }
      ];
      const pick = histTopics.find(it => !usedHashes.has(hashQuestionText(it.q))) || histTopics[globalCounter % histTopics.length];
      dynText = pick.q;
      dynAns = pick.a;
      dynCh = pick.ch;
    } else if (subject.id.includes('polsci') || subject.id.includes('pol')) {
      const polTopics = [
        { q: "Explain the role and constitutional significance of Fundamental Rights and Directive Principles of State Policy in India.", a: "Fundamental Rights guarantee civil liberties; DPSP guide state policies for socio-economic justice.", ch: "Indian Constitution" },
        { q: "Analyze the key objectives, structure, and challenges of the United Nations in maintaining global peace and security.", a: "UN General Assembly, Security Council, peace-keeping operations, and challenges in reform.", ch: "International Organisations" }
      ];
      const pick = polTopics.find(it => !usedHashes.has(hashQuestionText(it.q))) || polTopics[globalCounter % polTopics.length];
      dynText = pick.q;
      dynAns = pick.a;
      dynCh = pick.ch;
    } else if (subject.id.includes('geography') || subject.id.includes('geo')) {
      const geoTopics = [
        { q: "Explain the factors influencing the spatial distribution of population and urbanization in India.", a: "Physical factors (relief, climate, water), economic factors (minerals, industrialization), and socio-cultural factors.", ch: "Population Distribution" },
        { q: "Distinguish between Conventional and Non-Conventional sources of energy in India with suitable examples.", a: "Conventional: Coal, petroleum (exhaustible, polluting). Non-conventional: Solar, wind, geothermal (renewable, clean).", ch: "Mineral and Energy Resources" }
      ];
      const pick = geoTopics.find(it => !usedHashes.has(hashQuestionText(it.q))) || geoTopics[globalCounter % geoTopics.length];
      dynText = pick.q;
      dynAns = pick.a;
      dynCh = pick.ch;
    } else if (subject.id.includes('sociology') || subject.id.includes('soc')) {
      const socTopics = [
        { q: "Distinguish between Caste System and Class System as forms of social stratification in Indian society.", a: "Caste is closed, hereditary, and based on ritual purity. Class is open, fluid, and based on economic status and wealth.", ch: "Social Institutions" },
        { q: "Explain the concept of 'Sanskritisation' introduced by M.N. Srinivas and its role in social mobility.", a: "Process by which lower caste adopts customs, rituals, and lifestyle of higher dominant caste to seek upward mobility.", ch: "Social Change" }
      ];
      const pick = socTopics.find(it => !usedHashes.has(hashQuestionText(it.q))) || socTopics[globalCounter % socTopics.length];
      dynText = pick.q;
      dynAns = pick.a;
      dynCh = pick.ch;
    } else {
      const isCommerceOrHumanitiesOrLang = subject.id.includes('accountancy') || subject.id.includes('bst') || subject.id.includes('eco') || subject.id.includes('history') || subject.id.includes('polsci') || subject.id.includes('geography') || subject.id.includes('sociology') || subject.id.includes('english') || subject.id.includes('hindi') || subject.id.includes('social') || subject.name.toLowerCase().includes('account') || subject.name.toLowerCase().includes('business') || subject.name.toLowerCase().includes('economic') || subject.name.toLowerCase().includes('history') || subject.name.toLowerCase().includes('political') || subject.name.toLowerCase().includes('geography') || subject.name.toLowerCase().includes('sociology');

      if (isCommerceOrHumanitiesOrLang) {
        dynText = `Analyze the key concepts, statutory guidelines, and practical implications related to ${dynCh}.`;
        dynAns = `Structured evaluation covering core theoretical concepts, key definitions, and practical analysis.`;
      } else {
        dynText = `Solve the fundamental numerical or standard problem related to ${dynCh}. Provide complete steps, calculations, and final answer.`;
        dynAns = `Comprehensive point-wise evaluation covering core definitions, factual reasons, and step-wise reasoning.`;
      }
    }
  }

    if (usedHashes.has(hashQuestionText(dynText))) {
      dynText = `${dynText} (Set #${globalCounter + 1})`;
    }
    usedHashes.add(hashQuestionText(dynText));
    const dynObj = ensureQuestionAssetId({
      id: `dyn-${secPrefix}-${globalCounter}-${Date.now()}-${randId}`,
      subjectId: subject.id,
      chapterId: config.selectedChapterIds?.[0] || 'ch1',
      chapterName: dynCh,
      type: (dynOpts ? 'mcq' : fallbackType) as any,
      options: dynOpts,
      marks: defaultMarks,
      difficulty: 'medium',
      isCompetency: true,
      casePassage: dynPassage,
      questionText: dynText,
      correctAnswer: dynAns,
      markingScheme: `[${defaultMarks} Mark(s)] Full credit awarded for correct conceptual reasoning and steps.`
    });

    if (dynObj.assetId) {
      usedAssetIds.add(dynObj.assetId);
    }

    return dynObj;
  };

  // Sections containers
  const secAQuestions: Question[] = []; // 1 Mark
  const secBQuestions: Question[] = []; // 2 Marks
  const secCQuestions: Question[] = []; // 3 Marks
  const secDQuestions: Question[] = []; // 5 Marks (or 4 Marks)
  const secEQuestions: Question[] = []; // 4 Marks Case Study

  // ALGORITHM: DYNAMIC MARK ALLOCATION FOR ANY TARGET MARKS
  let remainingMarks = targetMarks;

  if (targetMarks >= 70) {
    // 80 Marks (or 70-90): Standard Full Board Pattern
    const count1M = Math.min(20, Math.floor(remainingMarks * 0.25));
    for (let i = 0; i < count1M; i++) {
      secAQuestions.push(pickFromPool(pool1M, 1, 'mcq', 'secA', seedSecA));
    }
    remainingMarks -= count1M * 1;

    const count5M = Math.min(3, Math.floor(remainingMarks / 15));
    for (let i = 0; i < count5M; i++) {
      secDQuestions.push(pickFromPool(pool5M, 5, 'la', 'secD', seedSecD));
    }
    remainingMarks -= count5M * 5;

    const count4M = Math.min(3, Math.floor(remainingMarks / 10));
    for (let i = 0; i < count4M; i++) {
      secEQuestions.push(pickFromPool(pool4M, 4, 'case', 'secE', seedSecE));
    }
    remainingMarks -= count4M * 4;

    const count3M = Math.min(7, Math.floor(remainingMarks / 6));
    for (let i = 0; i < count3M; i++) {
      secCQuestions.push(pickFromPool(pool3M, 3, 'sa', 'secC', seedSecC));
    }
    remainingMarks -= count3M * 3;

    while (remainingMarks >= 2) {
      secBQuestions.push(pickFromPool(pool2M, 2, 'vsa', 'secB', seedSecB));
      remainingMarks -= 2;
    }

    if (remainingMarks === 1) {
      secAQuestions.push(pickFromPool(pool1M, 1, 'mcq', 'secA', seedSecA));
      remainingMarks -= 1;
    }

  } else if (targetMarks >= 35) {
    // 40-60 Marks: Periodic / Mid-Term Pattern
    const count1M = Math.min(10, Math.floor(remainingMarks * 0.20));
    for (let i = 0; i < count1M; i++) {
      secAQuestions.push(pickFromPool(pool1M, 1, 'mcq', 'secA', seedSecA));
    }
    remainingMarks -= count1M * 1;

    const count4M = Math.min(2, Math.floor(remainingMarks / 15));
    for (let i = 0; i < count4M; i++) {
      secEQuestions.push(pickFromPool(pool4M, 4, 'case', 'secE', seedSecE));
    }
    remainingMarks -= count4M * 4;

    const count3M = Math.min(4, Math.floor(remainingMarks / 8));
    for (let i = 0; i < count3M; i++) {
      secCQuestions.push(pickFromPool(pool3M, 3, 'sa', 'secC', seedSecC));
    }
    remainingMarks -= count3M * 3;

    while (remainingMarks >= 2) {
      secBQuestions.push(pickFromPool(pool2M, 2, 'vsa', 'secB', seedSecB));
      remainingMarks -= 2;
    }

    if (remainingMarks === 1) {
      secAQuestions.push(pickFromPool(pool1M, 1, 'mcq', 'secA', seedSecA));
      remainingMarks -= 1;
    }

  } else {
    // 5 to 30 Marks: Flexible Unit Test Pattern (Handles ANY Target Mark)
    const count1M = Math.min(6, Math.max(1, Math.floor(remainingMarks * 0.3)));
    for (let i = 0; i < count1M && remainingMarks >= 1; i++) {
      secAQuestions.push(pickFromPool(pool1M, 1, 'mcq', 'secA', seedSecA));
      remainingMarks -= 1;
    }

    const count3M = Math.floor(remainingMarks / 6);
    for (let i = 0; i < count3M && remainingMarks >= 3; i++) {
      secCQuestions.push(pickFromPool(pool3M, 3, 'sa', 'secC', seedSecC));
      remainingMarks -= 3;
    }

    while (remainingMarks >= 2) {
      secBQuestions.push(pickFromPool(pool2M, 2, 'vsa', 'secB', seedSecB));
      remainingMarks -= 2;
    }

    if (remainingMarks === 1) {
      secAQuestions.push(pickFromPool(pool1M, 1, 'mcq', 'secA', seedSecA));
      remainingMarks -= 1;
    }
  }

  // Exact mark verification & fine-tuning:
  let currentSum = 
    secAQuestions.reduce((sum, q) => sum + (q.marks || 1), 0) +
    secBQuestions.reduce((sum, q) => sum + (q.marks || 2), 0) +
    secCQuestions.reduce((sum, q) => sum + (q.marks || 3), 0) +
    secDQuestions.reduce((sum, q) => sum + (q.marks || 5), 0) +
    secEQuestions.reduce((sum, q) => sum + (q.marks || 4), 0);

  // If deficit, add 1M MCQs until exact match
  while (currentSum < targetMarks) {
    const diff = targetMarks - currentSum;
    if (diff >= 3) {
      secCQuestions.push(pickFromPool(pool3M, 3, 'sa', 'secC', seedSecC));
      currentSum += 3;
    } else if (diff >= 2) {
      secBQuestions.push(pickFromPool(pool2M, 2, 'vsa', 'secB', seedSecB));
      currentSum += 2;
    } else {
      secAQuestions.push(pickFromPool(pool1M, 1, 'mcq', 'secA', seedSecA));
      currentSum += 1;
    }
  }

  // ---------------------------------------------------------------------------
  // ENFORCE BOARD EXAM QUESTION STYLES & CHOICE STRUCTURE (CBSE PATTERN)
  // ---------------------------------------------------------------------------

  // 1. SECTION C (SA - 3M/4M): Board exam pattern includes internal choice (OR / अथवा) in 2 questions
  if (secCQuestions.length >= 2) {
    const choiceIndices = [1, Math.min(3, secCQuestions.length - 1)];
    for (const idx of choiceIndices) {
      const q = secCQuestions[idx];
      if (q && !q.questionText.includes('\n\nOR\n\n') && !q.questionText.includes('\n\nOR / अथवा\n\n') && !q.questionText.includes('\n\nअथवा\n\n')) {
        const altQ = pickFromPool(pool3M, q.marks || 3, 'sa', 'secCAlt', seedSecC + idx + 10);
        if (altQ && altQ.questionText !== q.questionText) {
          q.questionText = `${q.questionText}\n\nOR / अथवा\n\n${altQ.questionText}`;
          q.markingScheme = `[Option 1]: ${q.markingScheme || q.correctAnswer}\n\nOR / अथवा\n\n[Option 2]: ${altQ.markingScheme || altQ.correctAnswer}`;
          q.correctAnswer = `[Option 1]: ${q.correctAnswer}\n\nOR / अथवा\n\n[Option 2]: ${altQ.correctAnswer}`;
        }
      }
    }
  }

  // 2. SECTION D (LA - 5M/6M): Board exam pattern includes internal choice (OR / अथवा) in ALL long answer questions
  for (let idx = 0; idx < secDQuestions.length; idx++) {
    const q = secDQuestions[idx];
    if (q && !q.questionText.includes('\n\nOR\n\n') && !q.questionText.includes('\n\nOR / अथवा\n\n') && !q.questionText.includes('\n\nअथवा\n\n')) {
      const altQ = pickFromPool(pool5M, q.marks || 5, 'la', 'secDAlt', seedSecD + idx + 20);
      if (altQ && altQ.questionText !== q.questionText) {
        q.questionText = `${q.questionText}\n\nOR / अथवा\n\n${altQ.questionText}`;
        q.markingScheme = `[Option 1]: ${q.markingScheme || q.correctAnswer}\n\nOR / अथवा\n\n[Option 2]: ${altQ.markingScheme || altQ.correctAnswer}`;
        q.correctAnswer = `[Option 1]: ${q.correctAnswer}\n\nOR / अथवा\n\n[Option 2]: ${altQ.correctAnswer}`;
      }
    }
  }

  // 3. SECTION E (CASE-BASED INTEGRATED ASSESSMENT - 4M): Board exam pattern includes Source/Case Passage + sub-questions
  for (let idx = 0; idx < secEQuestions.length; idx++) {
    const q = secEQuestions[idx];
    if (q) {
      if (!q.casePassage) {
        // If questionText contains passage, extract or assign clean passage
        const lowerQ = q.questionText.toLowerCase();
        if (lowerQ.includes('optics') || lowerQ.includes('lens') || lowerQ.includes('focal') || lowerQ.includes('refraction')) {
          q.casePassage = "A student set up an optical bench experiment to study image formation using a convex lens of focal length 20 cm. An illuminated object was placed at various distances u from the optical center, and the corresponding image positions v and nature were recorded in a lab journal.";
          q.diagramDescription = "Convex lens optical bench setup with object at 2F1, light rays refracting through focus F2, and inverted real image formed at 2F2.";
        } else if (lowerQ.includes('circuit') || lowerQ.includes('resistor') || lowerQ.includes('current')) {
          q.casePassage = "In a physics laboratory, a domestic electric circuit model was constructed with three resistors R1 = 2Ω, R2 = 3Ω, and R3 = 6Ω connected across a 220V power supply with a key switch, ammeter, and voltmeter.";
          q.diagramDescription = "Electric circuit schematic showing resistors R1, R2, R3 connected in series with battery, ammeter, and voltmeter.";
        } else if (lowerQ.includes('belgium') || lowerQ.includes('power sharing') || lowerQ.includes('brussels')) {
          q.casePassage = "Power sharing arrangements can take many forms in modern democracies. In Belgium, the Constitution prescribes that the number of Dutch and French-speaking ministers shall be equal in the Central Government. Many powers of the Central Government have been given to State Governments of the two regions. Brussels has a separate government in which both communities have equal representation. This accommodative model prevented civil strife.";
          q.diagramDescription = "Belgian power-sharing organogram showing Central Government, Regional Flemish/Wallonia Governments, Brussels Capital Government, and Community Government.";
        } else if (lowerQ.includes('groundwater') || lowerQ.includes('water level') || lowerQ.includes('irrigation')) {
          q.casePassage = "Sustainable development requires balancing economic progress with environmental preservation. Groundwater in India is under serious threat of overuse in many parts of the country. About 300 districts have reported a water level decline of over 4 meters during the past 20 years. Nearly one-third of the country is overusing its groundwater reserves, particularly in agriculturally prosperous regions of Punjab and Western UP.";
          q.diagramDescription = "Groundwater level decline bar chart showing normal levels vs 4m decline in Punjab and Western Uttar Pradesh over 20 years.";
        } else {
          q.casePassage = "Read the case scenario / experimental setup described below carefully to answer the following sub-questions.";
        }
      }
    }
  }

  // Build clean, well-structured sections layout
  const sections: PaperSection[] = [];

  if (secAQuestions.length > 0) {
    sections.push({
      sectionName: "SECTION A: MULTIPLE CHOICE & OBJECTIVE QUESTIONS",
      description: `Objective Type & Conceptual Questions (${secAQuestions.length} Questions carrying 1 Mark each = ${secAQuestions.length} Marks)`,
      questions: secAQuestions
    });
  }

  if (secBQuestions.length > 0) {
    const marksB = secBQuestions.reduce((s, q) => s + (q.marks || 2), 0);
    sections.push({
      sectionName: "SECTION B: VERY SHORT ANSWER (VSA) QUESTIONS",
      description: `Very Short Answer Questions (${secBQuestions.length} Questions carrying 2 Marks each = ${marksB} Marks)`,
      questions: secBQuestions
    });
  }

  if (secCQuestions.length > 0) {
    const marksC = secCQuestions.reduce((s, q) => s + (q.marks || 3), 0);
    sections.push({
      sectionName: "SECTION C: SHORT ANSWER (SA) QUESTIONS",
      description: `Short Answer Questions (${secCQuestions.length} Questions carrying 3 Marks each = ${marksC} Marks)`,
      questions: secCQuestions
    });
  }

  if (secDQuestions.length > 0) {
    const marksD = secDQuestions.reduce((s, q) => s + (q.marks || 5), 0);
    sections.push({
      sectionName: "SECTION D: LONG ANSWER (LA) QUESTIONS",
      description: `Long Answer Questions with Stepwise Evaluation (${secDQuestions.length} Questions = ${marksD} Marks)`,
      questions: secDQuestions
    });
  }

  if (secEQuestions.length > 0) {
    const marksE = secEQuestions.reduce((s, q) => s + (q.marks || 4), 0);
    sections.push({
      sectionName: "SECTION E: CASE-BASED INTEGRATED ASSESSMENT",
      description: `Competency & Contextual Case Study Units (${secEQuestions.length} Questions = ${marksE} Marks)`,
      questions: secEQuestions
    });
  }

  // Social Science Map Work for Board scale
  if (subject.id === 'social-087' && targetMarks >= 70) {
    sections.push({
      sectionName: "SECTION F: MAP SKILL BASED QUESTIONS",
      description: "Map Skill Based Questions (2 Marks History + 3 Marks Geography = 5 Marks)",
      questions: [
        {
          id: `sst-map-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          subjectId: 'social-087',
          chapterId: 'sst-ch2',
          chapterName: 'Nationalism in India & Resources',
          type: 'sa',
          marks: 5,
          difficulty: 'medium',
          isCompetency: true,
          questionText: 'SECTION F: MAP WORK (5 MARKS)\n\n(A) History Map Work (2 Marks):\n1. The place where the Indian National Congress Session of September 1920 was held (Calcutta).\n2. The place where Mahatma Gandhi organized Satyagraha for Indigo cotton mill workers / farmers (Champaran / Kheda).\n\n(B) Geography Map Work (3 Marks):\nLocate and label any THREE on the outline map of India:\n1. Bhakra Nangal Dam (Himachal Pradesh)\n2. Tarapur Nuclear Power Plant (Maharashtra)\n3. Singrauli Thermal Power Plant (Madhya Pradesh)\n4. Kandla Major Sea Port (Gujarat)',
          correctAnswer: '(A) 1. Calcutta (Kolkata, West Bengal), 2. Champaran (Bihar).\n(B) Exact geographical coordinates on the political map of India.',
          markingScheme: '[2 Marks] History locations labeled correctly.\n[3 Marks] Geography symbols marked accurately.'
        }
      ]
    });
  }

  const classLevel = subject.id.startsWith('class12-') ? '12' : subject.id.startsWith('class9-') ? '9' : '10';
  const paperCode = generatePaperCode(subject.code, classLevel);

  const rawAssembledPaper: GeneratedPaper = {
    id: `vault-remix-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    paperCode,
    subjectName: subject.name,
    subjectCode: subject.code,
    generalInstructions: getGeneralInstructions(targetMarks, config.durationMinutes || (targetMarks >= 70 ? 180 : targetMarks >= 40 ? 90 : 45), subject.id, subject.name),
    config: {
      ...config,
      totalMarks: targetMarks,
      examCode: paperCode
    },
    sections,
    createdAt: new Date().toISOString()
  };

  // Run full-paper de-duplication and sanity check
  const assembledPaper = sanitizeAndDeduplicatePaper(rawAssembledPaper);

  // Auto-save the newly remixed paper to registry so it can be retrieved anytime via Paper Code
  savePaperToRegistry(assembledPaper);

  return assembledPaper;
}

// ---------------------------------------------------------------------------
// SUBJECT & CLASS MATCH GUARD
// Prevents cross-subject & cross-class question pollution during refresh/generation
// ---------------------------------------------------------------------------
export function getClassFromSubjectId(subjectId: string, subjectName?: string): number {
  const s = (subjectId || '').toLowerCase();
  const n = (subjectName || '').toLowerCase();

  if (s.includes('class12') || s.includes('c12') || s.includes('12th') || n.includes('class 12') || n.includes('12th')) return 12;
  if (s.includes('class11') || s.includes('c11') || s.includes('11th') || s.endsWith('-11') || n.includes('class 11') || n.includes('11th')) return 11;
  if (s.includes('class9') || s.includes('c9') || s.includes('9th') || n.includes('class 9') || n.includes('9th')) return 9;

  if (s === 'physics-042' || s === 'chemistry-043' || s === 'english-301' || s === 'maths-041-11' || s === 'biology-044-11' || s === 'cs-083-11' || s === 'hindi-302-11' || s === 'accountancy-055-11' || s === 'bst-054-11' || s === 'eco-030-11' || s === 'history-027-11' || s === 'polsci-028-11' || s === 'geography-029-11' || s === 'sociology-039-11') return 11;

  if (s === 'science-086' || s === 'maths-041' || s === 'social-087' || s === 'english-184' || s === 'it-402' || s === 'hindi-002' || s === 'hindi-085') return 10;
  if (s.includes('class10') || s.includes('c10') || s.includes('10th') || n.includes('class 10') || n.includes('10th')) return 10;

  return 10;
}

export function getSubjectDomain(subjectId: string, subjectName?: string): string {
  const s = (subjectId || '').toLowerCase();
  const n = (subjectName || '').toLowerCase();

  if (s.includes('chem') || s.includes('043') || n.includes('chemistry')) return 'chemistry';
  if (s.includes('phy') || s.includes('042') || n.includes('physics')) return 'physics';
  if (s.includes('bio') || s.includes('044') || n.includes('biology')) return 'biology';
  if (s.includes('math') || s.includes('041') || n.includes('math')) return 'math';
  if (s.includes('sci') || s.includes('086') || n.includes('science')) return 'science';
  if (s.includes('account') || s.includes('055') || n.includes('account')) return 'accountancy';
  if (s.includes('bst') || s.includes('business') || s.includes('054') || n.includes('business')) return 'bst';
  if (s.includes('eco') || s.includes('030') || n.includes('economic')) return 'economics';
  if (s.includes('hist') || s.includes('027') || n.includes('history')) return 'history';
  if (s.includes('pol') || s.includes('028') || n.includes('political')) return 'polsci';
  if (s.includes('geo') || s.includes('029') || n.includes('geography')) return 'geography';
  if (s.includes('soc') || s.includes('039') || n.includes('sociology')) return 'sociology';
  if (s.includes('social') || s.includes('087') || s.includes('sst') || n.includes('social')) return 'social';
  if (s.includes('eng') || s.includes('184') || s.includes('301') || n.includes('english')) return 'english';
  if (s.includes('hin') || s.includes('002') || s.includes('085') || s.includes('302') || n.includes('hindi')) return 'hindi';
  if (s.includes('cs') || s.includes('it') || s.includes('402') || s.includes('083') || n.includes('computer') || n.includes('information')) return 'cs';

  return 'other';
}

export function isSubjectAndClassMatch(
  paperSubjectId: string,
  paperSubjectName: string | undefined,
  qSubjectId: string | undefined,
  qText: string
): boolean {
  if (!qText || qText.trim().length === 0) return false;

  const targetDomain = getSubjectDomain(paperSubjectId, paperSubjectName);
  const hasDevanagari = /[\u0900-\u097F]/.test(qText);

  // 1. Language Guard
  if (targetDomain === 'hindi' && !hasDevanagari) return false;
  if (targetDomain !== 'hindi' && hasDevanagari) return false;

  // 2. Class Level Guard
  const targetClass = getClassFromSubjectId(paperSubjectId, paperSubjectName);
  if (qSubjectId) {
    const qClass = getClassFromSubjectId(qSubjectId);
    if (targetClass !== qClass) return false;
  }

  // 3. Subject Domain Guard
  if (qSubjectId) {
    const qDomain = getSubjectDomain(qSubjectId);
    if (targetDomain === 'science' && (qDomain === 'science' || qDomain === 'physics' || qDomain === 'chemistry' || qDomain === 'biology')) {
      // General Science in Class 9/10 encompasses physics/chem/bio
    } else if (targetDomain === 'social' && (qDomain === 'social' || qDomain === 'history' || qDomain === 'polsci' || qDomain === 'geography' || qDomain === 'economics')) {
      // General Social Science in Class 9/10 encompasses history/polsci/geo/eco
    } else if (targetDomain !== qDomain) {
      return false;
    }
  }

  // 4. Keyword verification against cross-domain pollution
  const textLower = qText.toLowerCase();

  const englishPatterns = /lencho|nelson mandela|valli|bholi|tricki|horace|griffin|pumphrey|wanda|custard the dragon|anne frank|rajvir|pranjol|matilda|ebright|kisa gotami|lomo|natalya|chubukov|coorg|mijbil|kezia|glennie|bismillah|sharapova|margie|tommy|subbu|sophie|jansie|crofter|peddler|ironmaster|saheb|mukesh|douglas|franz|m\. hamel|poet|poem|stanza|metaphor|alliteration|personification|rhyme scheme|literary device|figure of speech|analytical paragraph|reported speech|direct speech|indirect speech|passive voice|modal verb|subject-verb|letter to editor|letter of complaint|notice writing|report writing|read the following passage|read the extract|first flight|footprints without feet|beehive|moments|flamingo|vistas/i;

  const sciencePatterns = /lead nitrate|potassium iodide|exothermic|endothermic|convex lens|concave mirror|focal length|ohm's law|resistor|ammeter|voltmeter|kilowatt|catenation|saponification|esterification|alkyne|alkane|iupac|chemical reaction|decomposition|bleaching powder|refraction|dispersion|solenoid|tropisms|nephron|reflex arc|tropic level|cfcs|dioptre|photosynthesis|mitochondria|xylem|phloem|lysosome|chloroplast|stigma|ovary|sperm|dna replication|newton's|gravitation|acid|base|salt|element|compound|valency|electron|proton|neutron|periodic table|displacement reaction|combustion|oxidation|reduction|ph value|ph scale|litmus|neutralisation|corrosion|rancidity|carbonate|bicarbonate|hydroxide|hydrochloric|sulphuric|nitric|alkali|metal|non-metal|calcination|roasting|electrolysis|thermite|homologous series|isomer|functional group|ethanol|ethanoic|covalent|ionic bond|myopia|hypermetropia|presbyopia|refractive index|scattering of light|tyndall|spectrum|resistance|resistivity|parallel circuit|series circuit|joule's law|fuse|electric current|potential difference|magnetic field|fleming's|right hand thumb|electromagnet|galvanometer|electric motor|generator|induction|digestive system|pepsin|trypsin|bile|villi|transpiration|stomata|translocation|aorta|capillary|dialysis|excretion|neuron|synapse|cerebrum|cerebellum|medulla|reflex action|auxin|gibberellin|cytokinin|abscisic|thyroxine|insulin|adrenaline|testosterone|estrogen|pituitary|asexual|binary fission|budding|fragmentation|regeneration|spore formation|vegetative propagation|pollination|embryo|placenta|menstruation|contraceptive|monohybrid|dihybrid|genotype|phenotype|dominant allele|recessive|sex determination|autosome|homologous organ|analogous organ|fossils|ozone layer|biological magnification|biodegradable|garbage management/i;

  const socialPatterns = /kaiser william|bismarck|regur soil|vernacular press|sinhala|concurrent list|tertiary sector|reserve bank|treaty of vienna|purna swaraj|rowlatt act|multinational corporation|unification of germany|power sharing|federalism|non-cooperation|civil code|napoleonic|babu ramchandra/i;

  const commercePatterns = /journal entry|balance sheet|working capital|demat|debit|credit|goodwill|partnership deed|trial balance|ledger account|shares issued|debentures|sebi/i;

  const mathPatterns = /hcf|lcm|quadratic|polynomial|discriminant|arithmetic progression|ap term|zeros of|trigonometry|sin θ|sin\(|cos θ|cos\(|tan θ|tan\(|cosec|sec θ|cot θ|hypotenuse|pythagoras|angle of elevation|angle of depression|area of sector|curved surface area|empirical relationship|coprime|section formula|distance formula|modal class|common difference|probability|frequency distribution|histogram|ogive/i;

  if (targetDomain === 'math') {
    if (englishPatterns.test(textLower) || sciencePatterns.test(textLower) || socialPatterns.test(textLower) || commercePatterns.test(textLower)) return false;
  } else if (targetDomain === 'english') {
    if (sciencePatterns.test(textLower) || socialPatterns.test(textLower) || commercePatterns.test(textLower) || mathPatterns.test(textLower)) return false;
  } else if (targetDomain === 'science' || targetDomain === 'physics' || targetDomain === 'chemistry' || targetDomain === 'biology') {
    if (englishPatterns.test(textLower) || socialPatterns.test(textLower) || commercePatterns.test(textLower)) return false;
  } else if (targetDomain === 'social' || targetDomain === 'history' || targetDomain === 'polsci' || targetDomain === 'geography' || targetDomain === 'economics') {
    if (englishPatterns.test(textLower) || sciencePatterns.test(textLower) || commercePatterns.test(textLower) || mathPatterns.test(textLower)) return false;
  } else if (targetDomain === 'accountancy' || targetDomain === 'bst') {
    if (englishPatterns.test(textLower) || sciencePatterns.test(textLower) || socialPatterns.test(textLower)) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// AUTHENTIC FALLBACK QUESTION GENERATOR
// Ensures 0% generic strings, no [Variant] prefixes, and subject-appropriate CBSE text
// ---------------------------------------------------------------------------
export function createAuthenticFallbackQuestion(subject: Subject | any, targetMarks: number, qIdx: number, usedHashes?: Set<string>): Question {
  const sId = (subject.id || '').toLowerCase();
  const sName = (subject.name || '').toLowerCase();
  const domain = getSubjectDomain(sId, sName);
  const pId = `auth-pad-${sId}-${targetMarks}m-${qIdx}-${Date.now()}`;
  
  const chObj = subject.chapters?.[qIdx % (subject.chapters?.length || 1)];
  const chName = chObj?.title || chObj?.name || 'Core Syllabus Unit';

  // Helper to select an unused question from a bank, or generate a unique variant
  const pickUnusedFromBank = (bank: { q: string; opts?: string[]; ans: string; ch: string; passage?: string }[]) => {
    if (usedHashes && usedHashes.size > 0) {
      const unused = bank.find(item => !usedHashes.has(hashQuestionText(item.q)));
      if (unused) return unused;
    }
    // Fallback: cycle through bank and append a subtle variation tag to guarantee unique text hash
    const base = bank[qIdx % bank.length];
    const suffix = qIdx >= bank.length ? `\n[Case Analysis #${qIdx + 1}]` : '';
    return {
      ...base,
      q: `${base.q}${suffix}`
    };
  };

  // 1. HINDI
  if (domain === 'hindi') {
    if (targetMarks === 1) {
      const hinMcqBank = [
        { q: "कबीर की साखियों में 'मीठी वाणी' बोलने का क्या मुख्य उद्देश्य बताया गया है?", opts: ["A) मन का आपा खोकर और औरों को सुख पहुँचाना", "B) केवल समाज में प्रसिद्धि पाना", "C) दूसरों को पराजित करना", "D) भाषा का अलंकार दिखाना"], ans: "A) मन का आपा खोकर और औरों को सुख पहुँचाना", ch: "साखी (कबीर)" },
        { q: "मीराबाई श्री कृष्ण से अपनी पीड़ा हरने के लिए किसका उदाहरण देती हैं?", opts: ["A) द्रोपदी, प्रह्लाद और गजराज", "B) सुदामा और अर्जुन", "C) विभीषण और बाली", "D) बलराम और नंदबाबा"], ans: "A) द्रोपदी, प्रह्लाद और गजराज", ch: "पद (मीरा)" },
        { q: "'बड़े भाई साहब' पाठ में लेखक के बड़े भाई साहब हर साल एक ही कक्षा में क्यों रह जाते थे?", opts: ["A) क्योंकि वे तालीम की बुनियाद को बहुत मजबूत बनाना चाहते थे", "B) क्योंकि वे पढ़ाई बिल्कुल नहीं करते थे", "C) क्योंकि वे परीक्षा देने नहीं जाते थे", "D) क्योंकि वे बीमार रहते थे"], ans: "A) क्योंकि वे तालीम की बुनियाद को बहुत मजबूत बनाना चाहते थे", ch: "बड़े भाई साहब" },
        { q: "'तताँरा-वामीरो कथा' किस द्वीप समूह की पृष्ठभूमि पर आधारित लोककथा है?", opts: ["A) अंडमान-निकोबार द्वीप समूह", "B) लक्षद्वीप", "C) मालदीव", "D) दमन और दीव"], ans: "A) अंडमान-निकोबार द्वीप समूह", ch: "तताँरा-वामीरो कथा" },
        { q: "'तीसरी कसम के शिल्पकार शैलेंद्र' पाठ के अनुसार शैलेंद्र ने किस फिल्म का निर्माण किया था?", opts: ["A) तीसरी कसम", "B) श्री 420", "C) आवारा", "D) संगम"], ans: "A) तीसरी कसम", ch: "तीसरी कसम के शिल्पकार" },
        { q: "निम्नलिखित में से 'पदबंध' का कौन सा भेद सही है?", opts: ["A) संज्ञा पदबंध, सर्वनाम पदबंध, विशेषण पदबंध, क्रिया पदबंध, क्रियाविशेषण पदबंध", "B) केवल शब्द पदबंध", "C) केवल कारक पदबंध", "D) केवल समास पदबंध"], ans: "A) संज्ञा पदबंध, सर्वनाम पदबंध, विशेषण पदबंध, क्रिया पदबंध, क्रियाविशेषण पदबंध", ch: "व्याकरण - पदबंध" },
        { q: "'सूर्योदय हुआ और अंधकार गायब हो गया' - यह किस प्रकार का वाक्य है?", opts: ["A) संयुक्त वाक्य", "B) सरल वाक्य", "C) मिश्र वाक्य", "D) प्रश्नवाचक वाक्य"], ans: "A) संयुक्त वाक्य", ch: "व्याकरण - वाक्य रूपांतरण" },
        { q: "दिए गए शब्दों में से किस शब्द में 'द्विगु समास' है?", opts: ["A) नवरत्न", "B) नीलकंठ", "C) यथाशक्ति", "D) राजपुत्र"], ans: "A) नवरत्न", ch: "व्याकरण - समास" },
        { q: "'गागर में सागर भरना' मुहावरे का सही अर्थ क्या है?", opts: ["A) थोड़े शब्दों में बहुत बड़ी बात कहना", "B) बर्तन में पानी भरना", "C) व्यर्थ का समय गंवाना", "D) कठिन परिश्रम करना"], ans: "A) थोड़े शब्दों में बहुत बड़ी बात कहना", ch: "व्याकरण - मुहावरे" },
        { q: "'अब कहाँ दूसरों के दुख से दुखी होने वाले' पाठ में सुलेमान के विषय में क्या बताया गया है?", opts: ["A) वे केवल मनुष्यों के ही नहीं, पशु-पक्षियों के भी रखवाले थे", "B) वे केवल युद्ध जीतते थे", "C) वे एक महान व्यापारी थे", "D) वे लेखक थे"], ans: "A) वे केवल मनुष्यों के ही नहीं, पशु-पक्षियों के भी रखवाले थे", ch: "अब कहाँ दूसरों के दुख से दुखी होने वाले" }
      ];
      const sel = pickUnusedFromBank(hinMcqBank);
      return {
        id: pId, subjectId: subject.id, chapterId: 'hin-mcq', chapterName: sel.ch, type: 'mcq', marks: 1, difficulty: 'medium', isCompetency: true,
        questionText: sel.q, options: sel.opts, correctAnswer: sel.ans, markingScheme: "[1 अंक] सही विकल्प पर 1 अंक।"
      };
    } else {
      const hinTextBank = [
        { q: "कबीर की साखियों में 'निंदक' को अपने पास रखने की सलाह क्यों दी गई है? इससे हमारे व्यक्तित्व पर क्या प्रभाव पड़ता है?", ans: "निंदक हमारे दोषों को बिना किसी मूल्य के उजागर करता है। उसकी बातों से हम अपनी कमियों को सुधारकर अपने स्वभाव को निर्मल बना सकते हैं।", ch: "साखी (कबीर)" },
        { q: "'बड़े भाई साहब' की डाँट-डपट का छोटे भाई पर क्या प्रभाव पड़ता था? उदाहरण सहित लिखिए।", ans: "बड़े भाई की डाँट सुनकर छोटा भाई पहले तो दुखी होकर टाइम-टेबल बनाता था, परंतु खेल-कूद का मैदान देखते ही वह पढ़ाई भूलकर खेलने चला जाता था।", ch: "बड़े भाई साहब" },
        { q: "'हरिहर काका' पाठ में महंत और काका के भाइयों के व्यवहार में क्या समानता दिखाई देती है?", ans: "दोनों ही काका से सच्चा प्रेम नहीं करते थे, बल्कि उनकी 15 बीघे ज़मीन को धोखे से हड़पना चाहते थे। दोनों स्वार्थी और हिंसक हो गए थे।", ch: "हरिहर काका" },
        { q: "'टोपी शुक्ला' पाठ में टोपी और इफ़्फ़न की दादी के बीच अटूट आत्मीय संबंध का क्या कारण था?", ans: "इफ़्फ़न की दादी टोपी को अपनी माँ जैसा निश्छल स्नेह देती थीं। जाति और धर्म की दीवारों से परे उनके बीच केवल अटूट वात्सल्य का रिश्ता था।", ch: "टोपी शुक्ला" },
        { q: "सुभाष बाबू के जुलूस में स्त्री समाज की क्या भूमिका रही? 'डायरी का एक पन्ना' पाठ के आधार पर स्पष्ट कीजिए।", ans: "स्त्री समाज ने लाल बाज़ार में बड़ा जुलूस निकाला, मोन्यूमेंट पर झंडा फहराया तथा पुलिस की लाठियों और गिरफ्तारियों का डटकर सामना किया।", ch: "डायरी का एक पन्ना" },
        { q: "'आत्मत्राण' कविता में कवि ईश्वर से दुखों को दूर करने के बजाय किस बात की प्रार्थना करता है?", ans: "कवि ईश्वर से दुखों को दूर करने की नहीं, बल्कि दुखों से न डरने, उनका धैर्यपूर्वक सामना करने और अपने मन में संशय न आने देने की शक्ति माँगता है।", ch: "आत्मत्राण" },
        { q: "वज़ीर अली के अदम्य साहस और देशभक्ति का वर्णन 'कारतूस' पाठ के आलोक में कीजिए।", ans: "वज़ीर अली ने अकेले ही कर्नल के खेमे में जाकर उससे कारतूस हासिल किए तथा कर्नल को स्तब्ध कर दिया। वह अंग्रेज़ों को भारत से खदेड़ने के लिए अपनी जान हथेली पर रखकर लड़ता रहा।", ch: "कारतूस" },
        { q: "'सपनों के-से दिन' पाठ में पी.टी. साहब की कड़ाई और अनुशासन का बच्चों के मन पर क्या प्रभाव पड़ता था?", ans: "पी.टी. साहब की ज़रा-सी भूल पर दी जाने वाली कठोर सज़ा से बच्चे उनसे थर-थर काँपते थे, परंतु जब वे बच्चों को शाबाशी देते थे तो बच्चे बहुत खुश होते थे।", ch: "सपनों के-से दिन" }
      ];
      const sel = pickUnusedFromBank(hinTextBank);
      return {
        id: pId, subjectId: subject.id, chapterId: 'hin-text', chapterName: sel.ch,
        type: targetMarks === 2 ? 'vsa' : targetMarks === 3 ? 'sa' : 'la',
        marks: targetMarks, difficulty: 'medium', isCompetency: true,
        questionText: sel.q,
        correctAnswer: sel.ans,
        markingScheme: `[${targetMarks} अंक] भाषा की शुद्धता एवं सटीक वैचारिक प्रस्तुति पर अंक दिए जाएंगे।`
      };
    }
  }

  // 2. MATHEMATICS (Class 9 - 12)
  if (domain === 'math') {
    if (targetMarks === 1) {
      const mathMcqBank = [
        { q: "If two positive integers 'a' and 'b' are written as a = x³y² and b = xy³, where x, y are prime numbers, then HCF(a, b) is:", opts: ["A) xy²", "B) x³y³", "C) x²y²", "D) xy"], ans: "A) xy²", ch: "Real Numbers" },
        { q: "If one zero of the quadratic polynomial x² + 3x + k is 2, then the value of k is:", opts: ["A) -10", "B) 10", "C) -7", "D) -2"], ans: "A) -10", ch: "Polynomials" },
        { q: "The pair of equations x + 2y + 5 = 0 and -3x - 6y + 1 = 0 has:", opts: ["A) No solution", "B) Unique solution", "C) Exactly two solutions", "D) Infinitely many solutions"], ans: "A) No solution", ch: "Pair of Linear Equations" },
        { q: "If the discriminant of the quadratic equation 2x² - 4x + c = 0 is zero, then c is equal to:", opts: ["A) 2", "B) 4", "C) 8", "D) -2"], ans: "A) 2", ch: "Quadratic Equations" },
        { q: "The 11th term of the AP: -3, -1/2, 2, ... is:", opts: ["A) 22", "B) 28", "C) -38", "D) 47/2"], ans: "A) 22", ch: "Arithmetic Progressions" },
        { q: "The distance of the point P(-6, 8) from the origin is:", opts: ["A) 10 units", "B) 2√7 units", "C) 6 units", "D) 8 units"], ans: "A) 10 units", ch: "Coordinate Geometry" },
        { q: "If sin A = 1/2, then the value of cot A is:", opts: ["A) √3", "B) 1/√3", "C) √3/2", "D) 1"], ans: "A) √3", ch: "Introduction to Trigonometry" },
        { q: "If the perimeter and the area of a circle are numerically equal, then the radius of the circle is:", opts: ["A) 2 units", "B) π units", "C) 4 units", "D) 7 units"], ans: "A) 2 units", ch: "Areas Related to Circles" },
        { q: "A line intersecting a circle in two distinct points is called a:", opts: ["A) Secant", "B) Tangent", "C) Chord", "D) Diameter"], ans: "A) Secant", ch: "Circles" },
        { q: "If a card is drawn from a well-shuffled deck of 52 cards, the probability of getting a red face card is:", opts: ["A) 3/26", "B) 3/13", "C) 1/26", "D) 1/13"], ans: "A) 3/26", ch: "Probability" }
      ];
      const sel = pickUnusedFromBank(mathMcqBank);
      return {
        id: pId, subjectId: subject.id, chapterId: 'math-mcq', chapterName: sel.ch, type: 'mcq', marks: 1, difficulty: 'medium', isCompetency: true,
        questionText: sel.q, options: sel.opts, correctAnswer: sel.ans, markingScheme: "[1 Mark] Correct option."
      };
    } else {
      const mathTextBank = [
        { q: "Prove that √5 is an irrational number using the method of contradiction.", ans: "Assume √5 = a/b where a, b are coprime. 5b² = a² => 5 divides a. Let a = 5c => 5b² = 25c² => b² = 5c² => 5 divides b. Contradiction to coprimality, hence √5 is irrational.", ch: "Real Numbers" },
        { q: "Solve the linear equations graphically or algebraically: 2x + 3y = 11 and 2x - 4y = -24. Hence find 'm' for which y = mx + 3.", ans: "Subtracting equations gives 7y = 35 => y = 5. Substituting y = 5 in 2x + 15 = 11 gives x = -2. Then y = mx + 3 => 5 = m(-2) + 3 => -2m = 2 => m = -1.", ch: "Linear Equations" },
        { q: "Prove that the tangents drawn from an external point to a circle are equal in length.", ans: "Given circle C(O, r) and external point P with tangents PQ and PR. In ΔOPQ and ΔOPR, OP = OP (common), OQ = OR (radii), ∠OQP = ∠ORP = 90°. By RHS congruence, ΔOPQ ≅ ΔOPR, hence PQ = PR.", ch: "Circles" },
        { q: "A tower stands vertically on the ground. From a point on the ground 15 m away from the foot of the tower, the angle of elevation of the top is 60°. Find the height of the tower.", ans: "Let height = h. tan 60° = h / 15 => √3 = h / 15 => h = 15√3 meters ≈ 25.98 meters.", ch: "Applications of Trigonometry" },
        { q: "Find the roots of the quadratic equation 2x² - 7x + 3 = 0 using the quadratic formula.", ans: "a = 2, b = -7, c = 3. D = b² - 4ac = 49 - 24 = 25. x = (7 ± √25) / 4 = (7 ± 5)/4 => x = 3 or x = 1/2.", ch: "Quadratic Equations" },
        { q: "The sum of the 4th and 8th terms of an AP is 24 and the sum of the 6th and 10th terms is 44. Find the first three terms of the AP.", ans: "a4 + a8 = 2a + 10d = 24 => a + 5d = 12. a6 + a10 = 2a + 14d = 44 => a + 7d = 22. Subtracting gives 2d = 10 => d = 5, a = -13. First three terms: -13, -8, -3.", ch: "Arithmetic Progressions" },
        { q: "Find the coordinates of the point which divides the line segment joining A(4, -3) and B(8, 5) in the ratio 3:1 internally.", ans: "Section formula: x = (3×8 + 1×4)/(3+1) = 28/4 = 7. y = (3×5 + 1×(-3))/(3+1) = 12/4 = 3. Point P is (7, 3).", ch: "Coordinate Geometry" },
        { q: "Prove the trigonometric identity: (sin A - 2 sin³ A) / (2 cos³ A - cos A) = tan A.", ans: "LHS = sin A (1 - 2 sin² A) / [cos A (2 cos² A - 1)]. Since 1 - 2 sin² A = cos 2A and 2 cos² A - 1 = cos 2A, LHS = sin A / cos A = tan A = RHS.", ch: "Trigonometry" },
        { q: "A solid sphere of radius 6 cm is melted and recast into a wire of uniform circular cross-section of radius 0.2 cm. Find the length of the wire.", ans: "Volume of sphere = Volume of cylinder wire. (4/3) π r1³ = π r2² h => (4/3) × 216 = (0.04) h => 288 = 0.04 h => h = 7200 cm = 72 meters.", ch: "Surface Areas and Volumes" },
        { q: "The median of the following frequency distribution of marks of 100 students is 32. Find the missing frequencies f1 and f2.", ans: "Using cumulative frequency table, median class is 30-40. Applying M = L + [(N/2 - CF)/f] × h yields equations to solve f1 = 9, f2 = 15.", ch: "Statistics" }
      ];
      const sel = pickUnusedFromBank(mathTextBank);
      return {
        id: pId, subjectId: subject.id, chapterId: 'math-text', chapterName: sel.ch,
        type: targetMarks === 2 ? 'vsa' : targetMarks === 3 ? 'sa' : targetMarks === 4 ? 'case' : 'la',
        marks: targetMarks, difficulty: 'medium', isCompetency: true,
        questionText: sel.q, correctAnswer: sel.ans, markingScheme: `[${targetMarks} Marks] Full credit for correct step-wise working.`
      };
    }
  }

  // 3. SCIENCE / PCB (Class 9 - 12)
  if (domain === 'science' || domain === 'physics' || domain === 'chemistry' || domain === 'biology') {
    if (targetMarks === 1) {
      const sciMcqBank = [
        { q: "When aqueous solutions of potassium iodide and lead nitrate are mixed, a insoluble precipitate is formed. What is the color of this precipitate?", opts: ["A) Yellow (Lead Iodide)", "B) White (Potassium Nitrate)", "C) Blue (Copper Oxide)", "D) Brown (Iron Rust)"], ans: "A) Yellow (Lead Iodide)", ch: "Chemical Reactions and Equations" },
        { q: "Which of the following aqueous solutions turns red litmus blue?", opts: ["A) Baking soda solution (NaHCO₃)", "B) Lemon juice", "C) Hydrochloric acid", "D) Vinegar"], ans: "A) Baking soda solution (NaHCO₃)", ch: "Acids, Bases and Salts" },
        { q: "Which metal is liquid at room temperature and is used in clinical thermometers?", opts: ["A) Mercury", "B) Gallium", "C) Sodium", "D) Bromine"], ans: "A) Mercury", ch: "Metals and Non-metals" },
        { q: "The functional group present in ethanoic acid (acetic acid) is:", opts: ["A) -COOH (Carboxylic acid)", "B) -CHO (Aldehyde)", "C) -OH (Alcohol)", "D) -CO- (Ketone)"], ans: "A) -COOH (Carboxylic acid)", ch: "Carbon and its Compounds" },
        { q: "In human digestive system, bile juice is secreted by which organ and stored in which gland?", opts: ["A) Secreted by Liver, stored in Gallbladder", "B) Secreted by Pancreas, stored in Stomach", "C) Secreted by Stomach, stored in Liver", "D) Secreted by Intestine, stored in Kidney"], ans: "A) Secreted by Liver, stored in Gallbladder", ch: "Life Processes" },
        { q: "The gap between two neurons across which nerve impulses pass is known as a:", opts: ["A) Synapse", "B) Axon", "C) Dendrite", "D) Myelin sheath"], ans: "A) Synapse", ch: "Control and Coordination" },
        { q: "A convex lens of focal length 20 cm has a optical power of:", opts: ["A) +5 D", "B) -5 D", "C) +0.05 D", "D) +2 D"], ans: "A) +5 D", ch: "Light - Reflection and Refraction" },
        { q: "The defect of vision in which a person can see nearby objects clearly but cannot see distant objects distinctly is:", opts: ["A) Myopia (Short-sightedness)", "B) Hypermetropia", "C) Presbyopia", "D) Cataract"], ans: "A) Myopia (Short-sightedness)", ch: "Human Eye and Colorful World" },
        { q: "The SI unit of electrical resistance is:", opts: ["A) Ohm (Ω)", "B) Volt (V)", "C) Ampere (A)", "D) Watt (W)"], ans: "A) Ohm (Ω)", ch: "Electricity" },
        { q: "The magnetic field lines inside a current-carrying long straight solenoid are:", opts: ["A) Parallel straight lines indicating uniform magnetic field", "B) Concentric circles", "C) Elliptical loops", "D) Radial lines"], ans: "A) Parallel straight lines indicating uniform magnetic field", ch: "Magnetic Effects of Electric Current" }
      ];
      const sel = pickUnusedFromBank(sciMcqBank);
      return {
        id: pId, subjectId: subject.id, chapterId: 'sci-mcq', chapterName: sel.ch, type: 'mcq', marks: 1, difficulty: 'medium', isCompetency: true,
        questionText: sel.q, options: sel.opts, correctAnswer: sel.ans, markingScheme: "[1 Mark] Correct option."
      };
    } else {
      const sciTextBank = [
        { q: "Why do silver articles turn black when exposed to air for a long time? Write the balanced chemical reaction.", ans: "Silver reacts with hydrogen sulfide (H₂S) present in air to form a black coating of Silver Sulfide (Ag₂S). Equation: 2Ag + H₂S -> Ag₂S + H₂.", ch: "Chemical Reactions" },
        { q: "State Ohm's Law. Draw a circuit diagram to verify Ohm's law in the laboratory.", ans: "Ohm's Law: At constant temperature, current (I) flowing through a conductor is directly proportional to potential difference (V) across its ends: V = IR. Diagram includes battery, ammeter, voltmeter, resistor, rheostat, key.", ch: "Electricity" },
        { q: "Trace the path of blood through the four chambers of the human heart during a single complete double circulation.", ans: "Deoxygenated blood: Vena Cava -> Right Atrium -> Right Ventricle -> Pulmonary Artery -> Lungs.\nOxygenated blood: Lungs -> Pulmonary Vein -> Left Atrium -> Left Ventricle -> Aorta -> Body.", ch: "Life Processes" },
        { q: "What is speciation? Mention three factors that lead to the origin of a new species.", ans: "Speciation is the evolutionary process by which new biological species arise. Factors: 1. Genetic drift 2. Natural selection 3. Reproductive / Geographical isolation.", ch: "Heredity and Evolution" },
        { q: "Differentiate between calcination and roasting with chemical equations. Name one ore purified by each method.", ans: "Calcination: Heating ore in limited air below MP to remove carbonate/volatile impurities (e.g. ZnCO₃ -> ZnO + CO₂). Roasting: Heating sulfide ore in excess air to convert to oxide (e.g. 2ZnS + 3O₂ -> 2ZnO + 2SO₂).", ch: "Metals and Non-metals" },
        { q: "Explain the Chlor-alkali process with chemical equation. Name the three useful products formed and write one industrial application of each.", ans: "Electrolysis of aqueous NaCl (brine): 2NaCl + 2H₂O -> 2NaOH + Cl₂ + H₂. Products: 1. NaOH (soap/paper manufacturing), 2. Cl₂ (disinfecting water/bleaching powder), 3. H₂ (rocket fuel/margarine).", ch: "Acids, Bases and Salts" },
        { q: "What are amphoteric oxides? Give two examples with balanced chemical equations showing their reactions with both acids and bases.", ans: "Oxides reacting with both acids and bases to produce salt and water are amphoteric. Examples: Al₂O₃ and ZnO. Equations: Al₂O₃ + 6HCl -> 2AlCl₃ + 3H₂O, and Al₂O₃ + 2NaOH -> 2NaAlO₂ + H₂O.", ch: "Metals and Non-metals" },
        { q: "Describe the structure and functioning of a Nephron with a labelled diagram reference. Explain ultrafiltration and selective reabsorption.", ans: "Nephron consists of Bowman's capsule, Glomerulus, PCT, Loop of Henle, DCT & Collecting Duct. Ultrafiltration under high pressure forces water & small solutes into capsule. Selective reabsorption retrieves glucose, amino acids & salts back into capillaries.", ch: "Life Processes" },
        { q: "What is a reflex arc? Trace the sequence of events when a person accidentally touches a hot object.", ans: "Reflex arc is the neural pathway controlling a reflex action. Path: Heat Receptor in skin -> Sensory Neuron -> Spinal Cord (Relay Neuron) -> Motor Neuron -> Effector Muscle in arm contracts to withdraw hand immediately.", ch: "Control and Coordination" },
        { q: "Differentiate between esterification and saponification reactions. Write balanced chemical equations for both.", ans: "Esterification: Reaction of carboxylic acid with alcohol in presence of acid catalyst to form sweet-smelling ester (e.g. CH₃COOH + C₂H₅OH -> CH₃COOC₂H₅ + H₂O). Saponification: Alkaline hydrolysis of ester to yield sodium salt of carboxylic acid & alcohol (e.g. CH₃COOC₂H₅ + NaOH -> CH₃COONa + C₂H₅OH).", ch: "Carbon and its Compounds" },
        { q: "State Snell's Law of refraction. A ray of light travels from air into glass slab of refractive index 1.50. If angle of incidence is 30°, calculate sin r.", ans: "Snell's Law: sin i / sin r = μ₂/μ₁. Given μ = 1.50, i = 30° => sin 30° / sin r = 1.50 => 0.50 / sin r = 1.50 => sin r = 0.50 / 1.50 = 1/3 ≈ 0.333.", ch: "Light - Reflection and Refraction" },
        { q: "A student sitting on the back bench cannot read the blackboard clearly. Identify the vision defect, state two causes, and draw a ray diagram for its correction.", ans: "Defect: Myopia (Short-sightedness). Causes: 1. Excessive curvature of eye lens, 2. Elongation of eyeball. Correction: Using concave lens of suitable focal length.", ch: "Human Eye and Colorful World" },
        { q: "Explain why stars twinkle while planets do not twinkle. Illustrate with a concept diagram.", ans: "Stars are distant point sources; atmospheric turbulence continuously shifts optical density of air, causing light rays to fluctuate in brightness. Planets are extended sources, so individual intensity variations average out to constant illumination.", ch: "Human Eye and Colorful World" },
        { q: "State Joule's Law of heating. Derive the formula H = I²Rt. An electric iron of resistance 20 Ω draws a current of 5 A for 30 s. Calculate heat generated.", ans: "Joule's Law: Heat produced H = V I t = (I R) I t = I² R t. Given R = 20 Ω, I = 5 A, t = 30 s => H = (5)² × 20 × 30 = 25 × 600 = 15,000 Joules = 15 kJ.", ch: "Electricity" },
        { q: "Two resistors R₁ = 4 Ω and R₂ = 6 Ω are connected in (i) Series, (ii) Parallel across a 12 V battery. Calculate total resistance and current in each case.", ans: "(i) Series: R_eq = 4 + 6 = 10 Ω, I = 12/10 = 1.2 A.\n(ii) Parallel: 1/R_eq = 1/4 + 1/6 = 5/12 => R_eq = 2.4 Ω, I = 12/2.4 = 5.0 A.", ch: "Electricity" },
        { q: "Draw the magnetic field pattern around a current-carrying straight solenoid. State three methods to increase the strength of its magnetic field.", ans: "Solenoid magnetic field resembles a bar magnet with parallel uniform lines inside. Field strength increases by: 1. Increasing current I, 2. Increasing number of turns N per unit length, 3. Inserting soft iron core.", ch: "Magnetic Effects of Electric Current" },
        { q: "State Mendel's Law of Segregation and Law of Independent Assortment with cross diagrams / genotype ratios.", ans: "Law of Segregation: Alleles segregate during gamete formation (Monohybrid F2 ratio 3:1 phenotypic, 1:2:1 genotypic). Law of Independent Assortment: Allele pairs segregate independently during dihybrid cross (F2 phenotypic ratio 9:3:3:1).", ch: "Heredity and Evolution" },
        { q: "Explain the 10% Law of energy transfer in a food chain with a suitable ecosystem example. Why are food chains limited to 3-4 trophic levels?", ans: "Only 10% of energy captured at one trophic level is transferred to next level; 90% is lost as metabolic heat. At 4th/5th level, remaining energy is insufficient to support viable predator population.", ch: "Our Environment" }
      ];
      const sel = pickUnusedFromBank(sciTextBank);
      return {
        id: pId, subjectId: subject.id, chapterId: 'sci-text', chapterName: sel.ch,
        type: targetMarks === 2 ? 'vsa' : targetMarks === 3 ? 'sa' : targetMarks === 4 ? 'case' : 'la',
        marks: targetMarks, difficulty: 'medium', isCompetency: true,
        questionText: sel.q, correctAnswer: sel.ans, markingScheme: `[${targetMarks} Marks] Step-wise marking for scientific concepts and equations.`
      };
    }
  }

  // 4. SOCIAL SCIENCE / HUMANITIES
  if (domain === 'social' || domain === 'history' || domain === 'polsci' || domain === 'geography' || domain === 'sociology') {
    if (targetMarks === 1) {
      const sstMcqBank = [
        { q: "Who among the following was proclaimed the first German Emperor in 1871 at Versailles?", opts: ["A) Kaiser William I", "B) Otto von Bismarck", "C) Victor Emmanuel II", "D) Napoleon III"], ans: "A) Kaiser William I", ch: "Nationalism in Europe" },
        { q: "Which soil is also known as 'Regur Soil' and is ideal for the cultivation of cotton in India?", opts: ["A) Black Soil", "B) Alluvial Soil", "C) Laterite Soil", "D) Red Soil"], ans: "A) Black Soil", ch: "Resources and Development" },
        { q: "In which year was the Vernacular Press Act passed in British India?", opts: ["A) 1878", "B) 1857", "C) 1919", "D) 1935"], ans: "A) 1878", ch: "Print Culture" },
        { q: "Which language was recognized as the sole official language of Sri Lanka under the Act of 1956?", opts: ["A) Sinhala", "B) Tamil", "C) English", "D) Dutch"], ans: "A) Sinhala", ch: "Power Sharing" },
        { q: "Which subject is included in the Concurrent List under the Indian Constitution?", opts: ["A) Education", "B) Defence", "C) Foreign Affairs", "D) Police"], ans: "A) Education", ch: "Federalism" },
        { q: "The sector contributing highest to India's Gross Domestic Product (GDP) today is:", opts: ["A) Tertiary Sector", "B) Primary Sector", "C) Secondary Sector", "D) Mining"], ans: "A) Tertiary Sector", ch: "Sectors of Economy" },
        { q: "Which institution issues currency notes in India on behalf of the Central Government?", opts: ["A) Reserve Bank of India", "B) State Bank of India", "C) Ministry of Finance", "D) NITI Aayog"], ans: "A) Reserve Bank of India", ch: "Money and Credit" },
        { q: "At which Congress session was the resolution for 'Purna Swaraj' adopted in 1929?", opts: ["A) Lahore Session", "B) Calcutta Session", "C) Nagpur Session", "D) Madras Session"], ans: "A) Lahore Session", ch: "Nationalism in India" }
      ];
      const sel = pickUnusedFromBank(sstMcqBank);
      return {
        id: pId, subjectId: subject.id, chapterId: 'sst-mcq', chapterName: sel.ch, type: 'mcq', marks: 1, difficulty: 'medium', isCompetency: true,
        questionText: sel.q, options: sel.opts, correctAnswer: sel.ans, markingScheme: "[1 Mark] Correct option."
      };
    } else {
      const sstTextBank = [
        { q: "Explain three main features of the Napoleonic Code (Civil Code of 1804).", ans: "1. Abolished privileges based on birth.\n2. Established equality before the law.\n3. Secured right to property and simplified administrative divisions.", ch: "Nationalism in Europe" },
        { q: "Analyze the economic impacts of the Non-Cooperation Movement (1921-1922) in India.", ans: "1. Foreign cloth boycotted and burnt in bonfires.\n2. Foreign cloth imports halved from ₹102 crore to ₹57 crore.\n3. Production of Indian textile mills and handlooms surged.", ch: "Nationalism in India" },
        { q: "Why is credit considered to have a 'double-edged' impact on borrowers?", ans: "Positive impact: Helps expand business and increase earnings.\nNegative impact (Debt Trap): If crop/business fails, borrower is forced to sell assets to repay.", ch: "Money and Credit" },
        { q: "Describe the unification of Germany led by Otto von Bismarck. Highlight the three major wars involved.", ans: "Bismarck led Prussian army through three wars over 7 years against Denmark, Austria, and France, culminating in proclamation of Kaiser William I as German Emperor in 1871.", ch: "Nationalism in Europe" },
        { q: "Explain the Belgian model of power sharing and how it accommodated cultural diversity.", ans: "1. Equal Dutch and French speaking ministers in central government.\n2. Powers handed to state governments.\n3. Separate Brussels government with equal representation.\n4. 'Community Government' for linguistic matters.", ch: "Power Sharing" },
        { q: "Differentiate between 'Coming Together' and 'Holding Together' federations with suitable country examples.", ans: "Coming Together: Independent states join to form bigger union, pooling sovereignty (e.g. USA, Australia, Switzerland). Holding Together: Large country divides power between national & constituent units (e.g. India, Spain, Belgium).", ch: "Federalism" },
        { q: "Why is the tertiary sector growing so rapidly in India? State four key reasons.", ans: "1. Provision of basic services (hospitals, schools, transport).\n2. Growth of agriculture/industry boosts trade & storage.\n3. Rise in income levels demands tourism, eating out, shopping.\n4. Boom in ICT and digital software services.", ch: "Sectors of Economy" },
        { q: "Highlight the role of Self-Help Groups (SHGs) in empowering rural women and overcoming informal debt traps.", ans: "SHGs aggregate small savings of 15-20 women, provide micro-loans at reasonable interest without collateral, and build financial independence & social leadership.", ch: "Money and Credit" },
        { q: "Explain the impacts of globalization on small Indian producers and agricultural farmers.", ans: "1. Increased competition from cheap imported goods.\n2. Pressure on prices and profit margins.\n3. Access to advanced technology & international markets for large players.", ch: "Globalisation and Economy" }
      ];
      const sel = pickUnusedFromBank(sstTextBank);
      return {
        id: pId, subjectId: subject.id, chapterId: 'sst-text', chapterName: sel.ch,
        type: targetMarks === 2 ? 'vsa' : targetMarks === 3 ? 'sa' : targetMarks === 4 ? 'case' : 'la',
        marks: targetMarks, difficulty: 'medium', isCompetency: true,
        questionText: sel.q, correctAnswer: sel.ans, markingScheme: `[${targetMarks} Marks] Full credit for structured point-wise answer.`
      };
    }
  }

  // 5. COMMERCE (Accountancy / BST / Economics)
  if (domain === 'accountancy' || domain === 'bst' || domain === 'economics') {
    if (targetMarks === 1) {
      const comMcqBank = [
        { q: "In Accounting, the principle which dictates that revenue is recognized when realized or earned is:", opts: ["A) Revenue Recognition Principle", "B) Going Concern Concept", "C) Money Measurement Concept", "D) Dual Aspect Principle"], ans: "A) Revenue Recognition Principle", ch: "Accounting Principles" },
        { q: "Which financial ratio measures the ability of a firm to meet its short-term obligations using its liquid assets?", opts: ["A) Current Ratio / Quick Ratio", "B) Debt to Equity Ratio", "C) Return on Investment", "D) Inventory Turnover Ratio"], ans: "A) Current Ratio / Quick Ratio", ch: "Accounting Ratios" },
        { q: "Which function of management involves establishing standards, measuring actual performance, and taking corrective actions?", opts: ["A) Controlling", "B) Planning", "C) Organizing", "D) Directing"], ans: "A) Controlling", ch: "Principles of Management" },
        { q: "In Microeconomics, when price of a good increases and total expenditure on it also increases, price elasticity of demand is:", opts: ["A) Less than 1 (Inelastic)", "B) Greater than 1 (Elastic)", "C) Equal to 1 (Unitary)", "D) Zero"], ans: "A) Less than 1 (Inelastic)", ch: "Theory of Consumer Behaviour" }
      ];
      const sel = comMcqBank[qIdx % comMcqBank.length];
      return {
        id: pId, subjectId: subject.id, chapterId: 'com-mcq', chapterName: sel.ch, type: 'mcq', marks: 1, difficulty: 'medium', isCompetency: true,
        questionText: sel.q, options: sel.opts, correctAnswer: sel.ans, markingScheme: "[1 Mark] Correct option."
      };
    } else {
      const comTextBank = [
        { q: "Distinguish between Fixed Capital and Working Capital requirement of a business enterprise.", ans: "Fixed Capital is invested in long-term assets (land, machinery). Working Capital is required for day-to-day operations (raw material, salaries).", ch: "Financial Management" },
        { q: "Explain the concept of 'Opportunity Cost' with a suitable economic illustration.", ans: "Opportunity cost is the value of the next best alternative foregone when a choice is made. Example: If a land can yield Wheat worth ₹50,000 or Rice worth ₹40,000, opportunity cost of growing Wheat is ₹40,000.", ch: "Microeconomics" }
      ];
      const sel = comTextBank[qIdx % comTextBank.length];
      return {
        id: pId, subjectId: subject.id, chapterId: 'com-text', chapterName: sel.ch,
        type: targetMarks === 2 ? 'vsa' : targetMarks === 3 ? 'sa' : targetMarks === 4 ? 'case' : 'la',
        marks: targetMarks, difficulty: 'medium', isCompetency: true,
        questionText: sel.q, correctAnswer: sel.ans, markingScheme: `[${targetMarks} Marks] Full credit for financial principles and numerical calculations.`
      };
    }
  }

  // 9. ENGLISH
  if (domain === 'english') {
    if (targetMarks === 1) {
      const engMcqBank = [
        { q: "In 'A Letter to God', why did Lencho describe the post office employees as 'a bunch of crooks'?", opts: ["A) Because he received only 70 pesos instead of 100", "B) Because they refused to send his letter", "C) Because they stole his crops", "D) Because they demanded extra fees"], ans: "A) Because he received only 70 pesos instead of 100", ch: "A Letter to God" },
        { q: "In 'Nelson Mandela: Long Walk to Freedom', what does 'extraordinary human disaster' refer to?", opts: ["A) The practice of Apartheid in South Africa", "B) The World War II devastation", "C) The economic crisis in Africa", "D) The Great Depression"], ans: "A) The practice of Apartheid in South Africa", ch: "Nelson Mandela" },
        { q: "In 'His First Flight', what maddened the young seagull to finally dive off the ledge?", opts: ["A) The sight of food in his mother's beak", "B) The strong sea wind", "C) The fear of his father's anger", "D) The call of his siblings"], ans: "A) The sight of food in his mother's beak", ch: "Two Stories About Flying" },
        { q: "In 'From the Diary of Anne Frank', why did Mr. Keesing assign Anne an essay on 'An Incorrigible Chatterbox'?", opts: ["A) As a punishment for talking excessively in class", "B) To test her writing skills", "C) Because it was part of the syllabus", "D) To prepare her for a debate"], ans: "A) As a punishment for talking excessively in class", ch: "From the Diary of Anne Frank" },
        { q: "In 'Glimpses of India', what is the traditional Goan village baker known as?", opts: ["A) Pader", "B) Kabai", "C) Bol", "D) Bolinhas"], ans: "A) Pader", ch: "Glimpses of India" },
        { q: "In 'Mijbil the Otter', where did Gavin Maxwell find the otter sent by his Arab friend?", opts: ["A) In a sack on the floor of his bedroom in Basra", "B) Near the Tigris river bank", "C) At the London zoo", "D) On the aircraft seat"], ans: "A) In a sack on the floor of his bedroom in Basra", ch: "Mijbil the Otter" },
        { q: "In 'Madam Rides the Bus', what was Valli's deepest and most overwhelming desire?", opts: ["A) To ride on the bus that traveled between her village and the town", "B) To visit the big town market", "C) To buy toys and sweets", "D) To meet the bus conductor"], ans: "A) To ride on the bus that traveled between her village and the town", ch: "Madam Rides the Bus" },
        { q: "In 'The Sermon at Benares', why was Kisa Gotami overcome with intense grief?", opts: ["A) Her only son had died", "B) She lost all her wealth", "C) She had no mustard seeds", "D) Buddha refused to speak to her"], ans: "A) Her only son had died", ch: "The Sermon at Benares" },
        { q: "In 'The Proposal', what is the initial land dispute between Lomov and Natalya about?", opts: ["A) Oxen Meadows", "B) Birchwoods", "C) Burnt Marsh", "D) Green Pastures"], ans: "A) Oxen Meadows", ch: "The Proposal" },
        { q: "In the poem 'Dust of Snow', what lifted the poet Robert Frost's gloomy mood?", opts: ["A) The falling of snow dust shaken by a crow from a hemlock tree", "B) The warm sunshine", "C) The singing of a bird", "D) A cup of hot tea"], ans: "A) The falling of snow dust shaken by a crow from a hemlock tree", ch: "Dust of Snow" },
        { q: "In 'Fire and Ice', what emotion or human trait does 'Ice' symbolize according to Frost?", opts: ["A) Cold hatred and insensitivity", "B) Uncontrolled desire and passion", "C) Deep love and affection", "D) Greed and lust"], ans: "A) Cold hatred and insensitivity", ch: "Fire and Ice" },
        { q: "In 'A Tiger in the Zoo', where should the tiger ideally be lurking according to the poet?", opts: ["A) In the shadows near the water hole to hunt deer", "B) Inside a concrete cell", "C) On a circus stage", "D) Behind iron bars"], ans: "A) In the shadows near the water hole to hunt deer", ch: "A Tiger in the Zoo" },
        { q: "In 'The Ball Poem', what fundamental lesson does the young boy learn after losing his ball?", opts: ["A) The epistemology of loss and taking responsibility in a world of possessions", "B) How to buy a new ball with money", "C) How to play better sports", "D) How to save money"], ans: "A) The epistemology of loss and taking responsibility in a world of possessions", ch: "The Ball Poem" },
        { q: "In 'Amanda!', what does Amanda imagine herself to be while her mother naggingly instructs her?", opts: ["A) A mermaid, an orphan, and Rapunzel", "B) A princess and a queen", "C) A doctor and an astronaut", "D) A bird in a cage"], ans: "A) A mermaid, an orphan, and Rapunzel", ch: "Amanda!" },
        { q: "In 'The Trees', where are the trees moving out from in Adrienne Rich's poem?", opts: ["A) Out of the indoor house into the forest", "B) Out of the park into the river", "C) Out of the city into the mountains", "D) Out of the garden into the yard"], ans: "A) Out of the indoor house into the forest", ch: "The Trees" },
        { q: "In 'A Triumph of Surgery', what was the real root cause of Tricki's serious illness?", opts: ["A) Mrs. Pumphrey's overfeeding and lack of physical exercise", "B) A dangerous viral infection", "C) Food poisoning", "D) High fever"], ans: "A) Mrs. Pumphrey's overfeeding and lack of physical exercise", ch: "A Triumph of Surgery" },
        { q: "In 'The Thief's Story', what transformed Hari Singh's heart and stopped him from boarding the train with Anil's stolen money?", opts: ["A) Anil's quiet trust, kindness, and desire to teach him to read and write", "B) Fear of getting caught by the police", "C) The heavy rain at the station", "D) Lack of train tickets"], ans: "A) Anil's quiet trust, kindness, and desire to teach him to read and write", ch: "The Thief's Story" },
        { q: "In 'Footprints without Feet', how did Griffin the scientist make his body invisible?", opts: ["A) By swallowing certain rare drugs that made his body transparent like glass", "B) By wearing a magic cloak", "C) By using an electronic gadget", "D) By applying chemical paint"], ans: "A) By swallowing certain rare drugs that made his body transparent like glass", ch: "Footprints without Feet" },
        { q: "In 'The Making of a Scientist', which book gifted by his mother became a turning point in Richard Ebright's life?", opts: ["A) The Travels of Monarch X", "B) The Life of Butterflies", "C) The World of Insects", "D) The Origin of Species"], ans: "A) The Travels of Monarch X", ch: "The Making of a Scientist" },
        { q: "In 'Bholi', why did Bholi courageously refuse to marry Bishamber Nath at the wedding altar?", opts: ["A) Because he demanded ₹5,000 dowry and was mean, greedy, and contemptible", "B) Because she wanted to marry someone else", "C) Because her father forced her", "D) Because he was illiterate"], ans: "A) Because he demanded ₹5,000 dowry and was mean, greedy, and contemptible", ch: "Bholi" }
      ];
      const sel = engMcqBank[qIdx % engMcqBank.length];
      return {
        id: pId, subjectId: subject.id, chapterId: 'eng-mcq', chapterName: sel.ch, type: 'mcq', marks: 1, difficulty: 'medium', isCompetency: true,
        questionText: sel.q,
        options: sel.opts,
        correctAnswer: sel.ans,
        markingScheme: `[1 Mark] 1 Mark for selecting option ${sel.ans.charAt(0)}.`
      };
    } else if (targetMarks === 2) {
      const engVsaBank = [
        { q: "How did the destructive hailstorm affect Lencho's corn fields? Describe his emotional reaction.", ans: "The hailstorm ruined the entire corn crop, leaving not a leaf on the trees. Lencho felt deep sorrow, comparing the destruction to an attack worse than a plague of locusts.", ch: "A Letter to God" },
        { q: "What 'twin obligations' does Nelson Mandela highlight in his autobiography?", ans: "1. Obligation to family, parents, wife, and children.\n2. Obligation to people, community, and country.", ch: "Nelson Mandela" },
        { q: "Why was the young seagull terrified of making his first flight? How did his parents urge him?", ans: "He feared his wings would not support him over the vast ocean. His parents called to him shrilly, upbraiding and threatening to let him starve unless he flew.", ch: "His First Flight" },
        { q: "Why did Anne Frank believe that 'paper has more patience than people'?", ans: "She felt people are often uninterested or judgment-prone, whereas her diary 'Kitty' would listen patiently to her private thoughts without judgment.", ch: "From the Diary of Anne Frank" },
        { q: "Describe the traditional dress 'Kabai' worn by Goan bakers in the old days.", ans: "The Kabai was a single-piece long frock reaching down to the knees, uniquely worn by traditional Goan bakers (Paders).", ch: "Glimpses of India" },
        { q: "How did Dr. Herriot treat Tricki at his veterinary surgery without administering medical drugs?", ans: "He kept Tricki on a strict liquid diet with plenty of water for two days, followed by physical play with other dogs to naturally regain fitness.", ch: "A Triumph of Surgery" },
        { q: "Why did Hari Singh decide to return Anil's stolen money despite having successfully escaped?", ans: "Anil's genuine trust and his offer to teach Hari to read, write, and add numbers inspired Hari to choose education and self-respect over crime.", ch: "The Thief's Story" },
        { q: "How did Griffin's invisibility create severe hardship for him in London during mid-winter?", ans: "To remain invisible, he had to wander naked in the bitter cold without clothes, shelter, or food, facing immense physical discomfort.", ch: "Footprints without Feet" }
      ];
      const sel = engVsaBank[qIdx % engVsaBank.length];
      return {
        id: pId, subjectId: subject.id, chapterId: 'eng-vsa', chapterName: sel.ch, type: 'vsa', marks: 2, difficulty: 'medium', isCompetency: true,
        questionText: sel.q,
        correctAnswer: sel.ans,
        markingScheme: "[2 Marks] 1 Mark for Content accuracy + 1 Mark for Expression & Grammar."
      };
    } else if (targetMarks === 3) {
      const engSaBank = [
        { q: "Examine the poignant irony in the climax of 'A Letter to God' regarding Lencho's perception of the postmaster and staff.", ans: "The postmaster and staff generously collected 70 pesos out of empathy to preserve Lencho's faith. Irony lies in Lencho calling these very benefactors 'a bunch of crooks', suspecting them of stealing 30 pesos.", ch: "A Letter to God" },
        { q: "Analyze how Nelson Mandela's understanding of freedom transformed from boyhood to adulthood.", ans: "In boyhood, freedom meant running freely in fields and swimming. As a young adult, he realized personal freedom was an illusion and transformed into a freedom fighter dedicated to liberating all South Africans from Apartheid.", ch: "Nelson Mandela" },
        { q: "Detail how Bholi's school teacher played a pivotal role in boosting her self-confidence and self-respect.", ans: "The teacher spoke to Bholi with affection and patience, encouraging her to speak without stammering. She gave Bholi books and assured her that education would earn her respect, empowering her to stand up against injustice.", ch: "Bholi" },
        { q: "Explain how Richard Ebright's childhood hobby of collecting butterflies sparked his research on insect hormones.", ans: "Ebright tagged Monarch butterflies for Dr. Urquhart. When butterfly season ended, he raised monarchs at home and discovered tiny gold spots on pupa produce a hormone vital for growth, launching his career in molecular biology.", ch: "The Making of a Scientist" }
      ];
      const sel = engSaBank[qIdx % engSaBank.length];
      return {
        id: pId, subjectId: subject.id, chapterId: 'eng-sa', chapterName: sel.ch, type: 'sa', marks: 3, difficulty: 'medium', isCompetency: true,
        questionText: sel.q,
        correctAnswer: sel.ans,
        markingScheme: "[3 Marks] 2 Marks for Content + 1 Mark for Language & Expression."
      };
    } else {
      const engLaBank = [
        { q: "Matilda's excessive vanity and longing for luxury ruined ten precious years of her life. Elaborate with reference to Guy de Maupassant's 'The Necklace'.", ans: "Matilda was never content with her modest lifestyle. To appear wealthy at a ball, she borrowed a necklace, lost it, and spent ten agonizing years doing menial manual labor to repay loans, only to discover the original was cheap imitation jewelry.", ch: "The Necklace" },
        { q: "Compare and contrast the character traits of Anil and Hari Singh in 'The Thief's Story'. Highlight how trust transformed a thief.", ans: "Anil was an easygoing, compassionate, and trusting writer. Hari Singh was a deceitful 15-year-old thief. Anil's unshakeable trust and willingness to educate Hari reformed the thief, proving love is more powerful than force.", ch: "The Thief's Story" },
        { q: "Trace the journey of Valli's meticulous planning, resourcefulness, and self-restraint during her first independent bus ride in 'Madam Rides the Bus'.", ans: "Valli systematically gathered details on bus fare, timing, and distance by listening to neighbors. She saved 60 paise by resisting temptations like candy and merry-go-rounds, demonstrating remarkable maturity and self-discipline.", ch: "Madam Rides the Bus" }
      ];
      const sel = engLaBank[qIdx % engLaBank.length];
      return {
        id: pId, subjectId: subject.id, chapterId: 'eng-la', chapterName: sel.ch, type: targetMarks === 4 ? 'case' : 'la', marks: targetMarks, difficulty: 'hard', isCompetency: true,
        questionText: sel.q,
        correctAnswer: sel.ans,
        markingScheme: `[${targetMarks} Marks] Stepwise evaluation for literary analysis, thematic understanding, and linguistic fluency.`
      };
    }
  }

  // DEFAULT ACADEMIC FALLBACK
  return {
    id: pId, subjectId: subject.id, chapterId: 'ch1', chapterName: chName,
    type: targetMarks === 1 ? 'mcq' : targetMarks === 2 ? 'vsa' : targetMarks === 3 ? 'sa' : targetMarks === 4 ? 'case' : 'la',
    marks: targetMarks, difficulty: 'medium', isCompetency: true,
    questionText: targetMarks === 1 
      ? `Which fundamental principle or rule correctly applies to ${chName}?`
      : targetMarks === 4
        ? `Read the context of ${chName} and answer:\n(i) State the key concept.\n(ii) Explain its application.\n(iii) Mention two important outcomes.`
        : `Explain the core concepts, key mechanisms, and practical applications of ${chName} in a structured step-wise manner.`,
    options: targetMarks === 1 ? ["A) Core standard principle & statutory definition", "B) Arbitrary assumption", "C) Non-standard derivative", "D) Zero-value constant"] : undefined,
    correctAnswer: `Point-wise structured explanation covering core definitions, key principles, and practical applications of ${chName}.`,
    markingScheme: `[${targetMarks} Mark(s)] Full credit awarded for structured factual answer.`
  };
}

// ---------------------------------------------------------------------------
// UNIVERSAL QUESTION REFRESH ENGINE FOR ANY PAPER, SUBJECT & CLASS
// ---------------------------------------------------------------------------
export function getRefreshedQuestion(
  paper: GeneratedPaper,
  secIdx: number,
  qIdx: number
): Question {
  const section = paper.sections[secIdx];
  const oldQ = section?.questions[qIdx];
  const targetMarks = oldQ?.marks || (secIdx === 0 ? 1 : secIdx === 1 ? 2 : secIdx === 2 ? 3 : secIdx === 3 ? 5 : 4);
  const isCaseTarget = oldQ?.type === 'case' || targetMarks === 4 || section?.sectionName?.toUpperCase().includes('SECTION E');

  // Collect all hashes currently in this paper to guarantee 0% duplicate collision
  const seenHashes = new Set<string>();
  paper.sections.forEach(sec => {
    sec.questions.forEach(q => {
      if (q && q.questionText) {
        seenHashes.add(hashQuestionText(q.questionText));
      }
    });
  });

  // Extract subject and class info
  const subjectId = (paper.config?.subjectId || oldQ?.subjectId || paper.subjectCode || paper.subjectName || '').toLowerCase();
  let matchedSubject = CBSE_SUBJECTS.find(s => s.id.toLowerCase() === subjectId || s.code.toLowerCase() === subjectId);
  if (!matchedSubject) {
    matchedSubject = CBSE_SUBJECTS.find(s => 
      paper.subjectName?.toLowerCase().includes(s.name.toLowerCase()) ||
      subjectId.includes(s.id.toLowerCase())
    );
  }
  if (!matchedSubject) {
    matchedSubject = {
      id: paper.config?.subjectId || 'general',
      name: paper.subjectName || 'CBSE Subject',
      code: paper.subjectCode || '000',
      category: 'Other',
      color: '#10b981',
      badgeBg: '#ecfdf5',
      icon: 'BookOpen',
      totalChapters: 1,
      standardMarks: 80,
      standardTime: 180,
      chapters: []
    };
  }

  const targetClassLevel = getClassFromSubjectId(matchedSubject.id, matchedSubject.name);
  const targetSubjectId = matchedSubject.id;

  // EXPLICIT INDEX RE-FETCH: Force re-fetching the clean, dedicated question pool index directly for this subject/class
  const pool = getMasterPool(targetSubjectId);
  const candidateList: any[] = [];

  // 1. Primary candidate source: Re-fetch directly from the dedicated Master Pool index
  if (targetMarks === 1 && !isCaseTarget) {
    if (pool.mcqs && pool.mcqs.length > 0) {
      pool.mcqs.forEach((m: any) => candidateList.push({ ...m, subjectId: targetSubjectId, type: 'mcq', marks: 1 }));
    }
    // Only pick Class 10 textbook MCQ banks if target class level is Class 10
    if (targetClassLevel === 10) {
      let matchedBank: any = null;
      if (subjectId.includes('math')) matchedBank = MATH_MCQ_BANK;
      else if (subjectId.includes('sci')) matchedBank = SCIENCE_MCQ_BANK;
      else if (subjectId.includes('soc') || subjectId.includes('sst')) matchedBank = SOCIAL_MCQ_BANK;
      else if (subjectId.includes('eng')) matchedBank = ENGLISH_MCQ_BANK;
      else if (subjectId.includes('it') || subjectId.includes('402')) matchedBank = IT_MCQ_BANK;
      else if (subjectId.includes('hindi')) matchedBank = subjectId.includes('085') ? HINDI_B_MCQ_BANK : HINDI_A_MCQ_BANK;

      if (matchedBank && matchedBank[1]) {
        matchedBank[1].forEach((item: any) => candidateList.push({ ...item, subjectId: targetSubjectId, type: 'mcq', marks: 1 }));
      }
    }
  } else if (targetMarks === 2) {
    if (pool.vsas && pool.vsas.length > 0) {
      pool.vsas.forEach((v: any) => candidateList.push({ ...v, subjectId: targetSubjectId, type: 'vsa', marks: 2 }));
    }
  } else if (targetMarks === 3) {
    if (pool.sas && pool.sas.length > 0) {
      pool.sas.forEach((s: any) => candidateList.push({ ...s, subjectId: targetSubjectId, type: 'sa', marks: 3 }));
    }
  } else if (isCaseTarget || targetMarks === 4) {
    if (pool.cases && pool.cases.length > 0) {
      pool.cases.forEach((c: any) => candidateList.push({ ...c, subjectId: targetSubjectId, type: 'case', marks: 4 }));
    }
  } else if (targetMarks >= 5) {
    if (pool.las && pool.las.length > 0) {
      pool.las.forEach((l: any) => candidateList.push({ ...l, subjectId: targetSubjectId, type: 'la', marks: targetMarks }));
    }
  }

  // 2. Secondary candidate source: PRELOADED_QUESTIONS with strict subject & class matching
  PRELOADED_QUESTIONS.forEach(pq => {
    if (pq.marks === targetMarks && (pq.subjectId === targetSubjectId || isSubjectAndClassMatch(targetSubjectId, matchedSubject.name, pq.subjectId, pq.questionText))) {
      candidateList.push({
        q: pq.questionText,
        opts: pq.options,
        ans: pq.correctAnswer,
        markingScheme: pq.markingScheme,
        ch: pq.chapterName,
        passage: pq.casePassage,
        type: pq.type,
        marks: pq.marks,
        subjectId: pq.subjectId || targetSubjectId
      });
    }
  });

  // 3. Check Stored Question Vault with strict subject & class matching
  const storedVault = getStoredVault();
  Object.values(storedVault).forEach(vq => {
    if (vq.marks === targetMarks && vq.subjectId === targetSubjectId && isSubjectAndClassMatch(targetSubjectId, matchedSubject.name, vq.subjectId, vq.questionText)) {
      candidateList.push({
        q: vq.questionText,
        opts: vq.options,
        ans: vq.correctAnswer,
        markingScheme: vq.markingScheme,
        ch: vq.chapterName,
        passage: vq.casePassage,
        type: vq.type,
        marks: vq.marks,
        subjectId: vq.subjectId
      });
    }
  });

  // Filter out any candidates that are currently in the paper OR fail class/subject validation
  const freshCandidates = candidateList.filter(c => {
    const text = c.q || c.questionText;
    if (!text) return false;
    const h = hashQuestionText(text);
    if (seenHashes.has(h)) return false;
    return isSubjectAndClassMatch(targetSubjectId, matchedSubject.name, c.subjectId || targetSubjectId, text);
  });

  const newId = `refreshed-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  if (freshCandidates.length > 0) {
    const picked = freshCandidates[Math.floor(Math.random() * freshCandidates.length)];
    const qText = picked.q || picked.questionText;
    const qOpts = picked.opts || picked.options;
    const qAns = picked.ans || picked.correctAnswer;
    const qMs = picked.markingScheme;
    const qPassage = picked.passage || picked.casePassage;
    const qCh = picked.ch || picked.chapterName || oldQ?.chapterName || 'Core Syllabus Unit';

    if (isCaseTarget || targetMarks === 4) {
      return {
        id: newId,
        subjectId: matchedSubject.id,
        chapterId: oldQ?.chapterId || 'ch1',
        chapterName: qCh,
        type: 'case',
        marks: 4,
        difficulty: oldQ?.difficulty || 'hard',
        isCompetency: true,
        casePassage: qPassage || `Case study on the practical principles and applications of ${qCh}.`,
        questionText: qText,
        options: qOpts,
        correctAnswer: qAns || 'Step-wise evaluation based on the passage provided.',
        markingScheme: qMs || '[4 Marks] 1 Mark each for parts (i) to (iv) / comprehensive scheme.'
      };
    }

    if (targetMarks === 1) {
      return {
        id: newId,
        subjectId: matchedSubject.id,
        chapterId: oldQ?.chapterId || 'ch1',
        chapterName: qCh,
        type: 'mcq',
        marks: 1,
        difficulty: oldQ?.difficulty || 'medium',
        isCompetency: true,
        questionText: qText,
        options: qOpts && qOpts.length >= 2 ? qOpts : ["A) Option A", "B) Option B", "C) Option C", "D) Option D"],
        correctAnswer: qAns || "A) Option A",
        markingScheme: qMs || "[1 Mark] Correct option selected."
      };
    }

    return {
      id: newId,
      subjectId: matchedSubject.id,
      chapterId: oldQ?.chapterId || 'ch1',
      chapterName: qCh,
      type: targetMarks === 2 ? 'vsa' : targetMarks === 3 ? 'sa' : 'la',
      marks: targetMarks,
      difficulty: oldQ?.difficulty || 'medium',
      isCompetency: true,
      questionText: qText,
      correctAnswer: qAns || `Point-wise explanation and solution for ${qCh}.`,
      markingScheme: qMs || `[${targetMarks} Marks] Full credit awarded for step-wise standard solution.`
    };
  }

  // If candidate list exhausted, generate authentic variation fallback
  const randomShift = Math.floor(Math.random() * 80) + 1;
  const authFallback = createAuthenticFallbackQuestion(matchedSubject, targetMarks, qIdx + randomShift);
  return {
    ...authFallback,
    id: newId
  };
}

// ---------------------------------------------------------------------------
// REGENERATE / REMIX ALL QUESTIONS IN ENTIRE PAPER
// ---------------------------------------------------------------------------
export function regenerateEntirePaper(paper: GeneratedPaper): GeneratedPaper {
  const paperClone: GeneratedPaper = JSON.parse(JSON.stringify(paper));
  
  paperClone.sections = paperClone.sections.map((sec, secIdx) => {
    const newQuestions = sec.questions.map((_, qIdx) => {
      return getRefreshedQuestion(paperClone, secIdx, qIdx);
    });
    return {
      ...sec,
      questions: newQuestions
    };
  });

  return sanitizeAndDeduplicatePaper(paperClone);
}

// ---------------------------------------------------------------------------
// FULL-PAPER DEDUPLICATION, PADDING AND SANITATION ENGINE
// Scans any paper (AI or Vault generated) and guarantees 0% question repetition
// and full CBSE blueprint section counts.
// ---------------------------------------------------------------------------
export function sanitizeAndDeduplicatePaper(paper: GeneratedPaper): GeneratedPaper {
  if (!paper || !Array.isArray(paper.sections)) return paper;

  const rawSubId = (paper.config?.subjectId || paper.subjectCode || paper.subjectName || '').toLowerCase();
  let subject = CBSE_SUBJECTS.find(s => s.id.toLowerCase() === rawSubId || s.code.toLowerCase() === rawSubId);
  if (!subject) {
    subject = CBSE_SUBJECTS.find(s => rawSubId.includes(s.id.toLowerCase()) || paper.subjectName?.toLowerCase().includes(s.name.toLowerCase()));
  }
  if (!subject) {
    subject = {
      id: paper.config?.subjectId || 'general',
      name: paper.subjectName || 'CBSE Subject',
      code: paper.subjectCode || '000',
      category: 'Other',
      color: '#10b981',
      badgeBg: '#ecfdf5',
      icon: 'BookOpen',
      totalChapters: 1,
      standardMarks: 80,
      standardTime: 180,
      chapters: []
    };
  }

  const seenHashes = new Set<string>();
  const seenAssetIds = new Set<string>();
  const allMasterQuestions = getMasterPool(subject.id);
  const backupPool: Question[] = [];

  allMasterQuestions.mcqs.forEach((m, i) => backupPool.push({
    id: `dedup-mcq-${i}`,
    subjectId: subject.id,
    chapterId: 'ch1',
    chapterName: m.ch,
    type: 'mcq',
    marks: 1,
    difficulty: 'medium',
    isCompetency: true,
    questionText: m.q,
    options: m.opts,
    correctAnswer: m.ans,
    markingScheme: `1 Mark for choosing correct option (${m.ans.charAt(0)}).`
  }));

  allMasterQuestions.vsas.forEach((v, i) => backupPool.push({
    id: `dedup-vsa-${i}`,
    subjectId: subject.id,
    chapterId: 'ch1',
    chapterName: v.ch,
    type: 'vsa',
    marks: 2,
    difficulty: 'medium',
    isCompetency: true,
    questionText: v.q,
    correctAnswer: v.ans,
    markingScheme: v.ms || '[2 Marks] Stepwise answer.'
  }));

  allMasterQuestions.sas.forEach((s, i) => backupPool.push({
    id: `dedup-sa-${i}`,
    subjectId: subject.id,
    chapterId: 'ch1',
    chapterName: s.ch,
    type: 'sa',
    marks: 3,
    difficulty: 'medium',
    isCompetency: true,
    questionText: s.q,
    correctAnswer: s.ans,
    markingScheme: s.ms || '[3 Marks] Complete stepwise explanation.'
  }));

  allMasterQuestions.las.forEach((l, i) => backupPool.push({
    id: `dedup-la-${i}`,
    subjectId: subject.id,
    chapterId: 'ch1',
    chapterName: l.ch,
    type: 'la',
    marks: 5,
    difficulty: 'hard',
    isCompetency: true,
    questionText: l.q,
    correctAnswer: l.ans,
    markingScheme: l.ms || '[5 Marks] Detailed stepwise solution.'
  }));

  // Also pull from PRELOADED_QUESTIONS and vault map if backupPool is small
  PRELOADED_QUESTIONS.filter(q => q.subjectId === subject.id).forEach(q => backupPool.push(q));
  const storedVault = getStoredVault();
  Object.values(storedVault).forEach((q: any) => {
    if (q && q.questionText && q.subjectId === subject.id) {
      if (subject.id.includes('hindi') && !/[\u0900-\u097F]/.test(q.questionText)) return;
      backupPool.push(q);
    }
  });

  // Shuffle backup pool to ensure random selection of questions when padding or deduplicating
  const shuffledBackupPool = shuffle(backupPool);

  const targetTotalMarks = paper.config?.totalMarks || 80;

  const sanitizedSections = paper.sections.map((sec, secIdx) => {
    const secNameUpper = sec.sectionName.toUpperCase();
    let expectedCount = 5;
    let targetMarks = 1;

    if (secNameUpper.includes('SECTION A') || secNameUpper.includes('OBJECTIVE') || secNameUpper.includes('READING')) {
      expectedCount = targetTotalMarks >= 70 ? 20 : 10;
      targetMarks = 1;
    } else if (secNameUpper.includes('SECTION B') || secNameUpper.includes('VERY SHORT')) {
      expectedCount = targetTotalMarks >= 70 ? 5 : 3;
      targetMarks = 2;
    } else if (secNameUpper.includes('SECTION C') || secNameUpper.includes('SHORT ANSWER')) {
      expectedCount = targetTotalMarks >= 70 ? 6 : 4;
      targetMarks = 3;
    } else if (secNameUpper.includes('SECTION D') || secNameUpper.includes('LONG ANSWER')) {
      expectedCount = targetTotalMarks >= 70 ? 3 : 2;
      targetMarks = 5;
    } else if (secNameUpper.includes('SECTION E') || secNameUpper.includes('CASE')) {
      expectedCount = 3;
      targetMarks = 4;
    }

    let currentQuestions = [...(sec.questions || [])];

    // If section has too few questions, pad it up to expectedCount
    while (currentQuestions.length < expectedCount) {
      const match = shuffledBackupPool.find(bq => Math.abs((bq.marks || 1) - targetMarks) <= 1 && !seenHashes.has(hashQuestionText(bq.questionText)));
      if (match) {
        seenHashes.add(hashQuestionText(match.questionText));
        currentQuestions.push({
          ...match,
          id: `pad-${secIdx}-${currentQuestions.length}-${Date.now()}`,
          marks: targetMarks
        });
      } else {
        // Fallback procedural question if backup pool exhausted
        const authenticPad = createAuthenticFallbackQuestion(subject, targetMarks, currentQuestions.length, seenHashes);
        seenHashes.add(hashQuestionText(authenticPad.questionText));
        if (authenticPad.assetId) seenAssetIds.add(authenticPad.assetId);
        currentQuestions.push(authenticPad);
      }
    }

    const sanitizedQuestions = currentQuestions.map((qRaw, qIdx) => {
      const q = ensureQuestionAssetId(qRaw);

      if (!q.questionText || q.questionText.trim().length < 5 || q.questionText.includes('[Variant') || q.questionText.includes('Solve the following standard problem')) {
        const matchRaw = shuffledBackupPool.find(bq => {
          const bqWithAsset = ensureQuestionAssetId(bq);
          const hMatch = !seenHashes.has(hashQuestionText(bqWithAsset.questionText));
          const aMatch = !bqWithAsset.assetId || !seenAssetIds.has(bqWithAsset.assetId);
          return hMatch && aMatch;
        });
        if (matchRaw) {
          const match = ensureQuestionAssetId(matchRaw);
          seenHashes.add(hashQuestionText(match.questionText));
          if (match.assetId) seenAssetIds.add(match.assetId);
          return { ...match, id: `rep-${secIdx}-${qIdx}-${Date.now()}` };
        } else {
          const authRep = ensureQuestionAssetId(createAuthenticFallbackQuestion(subject, q.marks || targetMarks, qIdx, seenHashes));
          seenHashes.add(hashQuestionText(authRep.questionText));
          if (authRep.assetId) seenAssetIds.add(authRep.assetId);
          return authRep;
        }
      }

      const h = hashQuestionText(q.questionText);
      const isAssetDup = Boolean(q.assetId && seenAssetIds.has(q.assetId));

      if (!seenHashes.has(h) && !isAssetDup) {
        seenHashes.add(h);
        if (q.assetId) seenAssetIds.add(q.assetId);
        return q;
      }

      // Duplicate question text or duplicate image asset detected: swap with unused backup question
      const matchRaw = shuffledBackupPool.find(bq => {
        const bqWithAsset = ensureQuestionAssetId(bq);
        const hMatch = !seenHashes.has(hashQuestionText(bqWithAsset.questionText));
        const aMatch = !bqWithAsset.assetId || !seenAssetIds.has(bqWithAsset.assetId);
        return hMatch && aMatch;
      });

      if (matchRaw) {
        const match = ensureQuestionAssetId(matchRaw);
        seenHashes.add(hashQuestionText(match.questionText));
        if (match.assetId) seenAssetIds.add(match.assetId);
        return {
          ...match,
          id: `dedup-rep-${secIdx}-${qIdx}-${Date.now()}`,
          marks: q.marks || targetMarks
        };
      } else {
        const authRep = ensureQuestionAssetId(createAuthenticFallbackQuestion(subject, q.marks || targetMarks, qIdx, seenHashes));
        seenHashes.add(hashQuestionText(authRep.questionText));
        if (authRep.assetId) seenAssetIds.add(authRep.assetId);
        return authRep;
      }
    });

    return {
      ...sec,
      questions: sanitizedQuestions
    };
  });

  return {
    ...paper,
    sections: sanitizedSections
  };
}

// Export Vault as JSON string
export function exportVaultJSON(): string {
  const vault = getStoredVault();
  return JSON.stringify(vault, null, 2);
}

// Import external JSON into vault
export function importVaultJSON(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, count: 0, error: 'Invalid JSON format' };
    }

    const currentVault = getStoredVault();
    let count = 0;

    Object.values(parsed).forEach((q: any) => {
      if (q && q.questionText) {
        const hash = hashQuestionText(q.questionText);
        currentVault[hash] = {
          ...q,
          id: q.id || `imported-${Date.now()}-${count}`,
          source: 'curated_bank'
        };
        count++;
      }
    });

    saveVaultMap(currentVault);
    return { success: true, count };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Failed to parse JSON' };
  }
}

// Save custom admin imported questions to Server Vault
export async function saveCustomQuestionsToServerVault(questions: Question[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const resp = await fetch('/api/custom-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions })
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || 'Server error while saving custom questions');
    }
    const data = await resp.json();

    // Also inject into client local vault map
    const currentVault = getStoredVault();
    questions.forEach((q) => {
      const hash = hashQuestionText(q.questionText);
      currentVault[hash] = {
        ...ensureQuestionAssetId(q),
        id: q.id || `cq-${Date.now()}`,
        harvestedAt: new Date().toISOString(),
        source: 'user_created',
        timesUsed: 0
      };
    });
    saveVaultMap(currentVault);

    return { success: true, count: data.count || questions.length };
  } catch (err: any) {
    console.warn('Error saving custom questions to server:', err);
    return { success: false, count: 0, error: err?.message || 'Failed to save to server' };
  }
}

// Sync custom questions from server vault to client
export async function fetchServerCustomQuestions(): Promise<Question[]> {
  try {
    const resp = await fetch('/api/custom-questions');
    if (!resp.ok) return [];
    const data = await resp.json();
    const serverQuestions: Question[] = data.questions || [];

    if (serverQuestions.length > 0) {
      const currentVault = getStoredVault();
      serverQuestions.forEach((q) => {
        const hash = hashQuestionText(q.questionText);
        if (!currentVault[hash]) {
          currentVault[hash] = {
            ...ensureQuestionAssetId(q),
            harvestedAt: new Date().toISOString(),
            source: 'user_created'
          };
        }
      });
      saveVaultMap(currentVault);
    }
    return serverQuestions;
  } catch (err) {
    console.warn('Error fetching server custom questions:', err);
    return [];
  }
}

// Delete custom question from server
export async function deleteCustomQuestionFromServer(id: string): Promise<boolean> {
  try {
    const resp = await fetch(`/api/custom-questions/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return resp.ok;
  } catch (err) {
    console.warn('Error deleting custom question:', err);
    return false;
  }
}

// Call AI Document Parser Endpoint
export async function parseDocumentAndExtractQuestions(payload: {
  rawText?: string;
  fileBase64?: string;
  fileName?: string;
  classLevel?: string;
  subjectId?: string;
  subjectName?: string;
  chapterId?: string;
  chapterName?: string;
  topic?: string;
  customKeys?: { gemini?: string; openai?: string; grok?: string };
  preferredProvider?: 'gemini' | 'openai' | 'grok';
}): Promise<{ success: boolean; questions: Question[]; totalExtracted: number; error?: string }> {
  try {
    const resp = await fetch('/api/parse-document-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to parse document on server');
    }
    const data = await resp.json();
    return {
      success: true,
      questions: data.questions || [],
      totalExtracted: data.totalExtracted || 0
    };
  } catch (err: any) {
    return {
      success: false,
      questions: [],
      totalExtracted: 0,
      error: err?.message || 'Failed to parse document questions'
    };
  }
}


