import { GeneratedPaper } from '../types';
import { generateLocalPaper } from './paperGenerator';
import { CBSE_SUBJECTS } from '../data/cbseData';
import { logPaperGenerationToFirestore, syncUserToFirestore } from '../services/firestoreActivityService';

const LOCAL_STORAGE_KEY = 'cbse_examidea_saved_papers_v2';

// Normalize user code inputs (strips spaces, converts to uppercase)
export function normalizePaperCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

// Generate a readable 4-part unique code, e.g. "CBSE12-PHY-8932", "CBSE10-041-8932" or "CBSE9-086-4821"
export function generatePaperCode(subjectCodeOrCategory: string, classLevel?: '9' | '10' | '12' | string | number | boolean): string {
  const cleanSub = (subjectCodeOrCategory || '100').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  let prefix = 'CBSE10';
  if (String(classLevel) === '12') {
    prefix = 'CBSE12';
  } else if (String(classLevel) === '9' || classLevel === true) {
    prefix = 'CBSE9';
  }
  return `${prefix}-${cleanSub}-${randomDigits}`;
}

// Save paper to LocalStorage Registry and Server Persistence
export function savePaperToRegistry(paper: GeneratedPaper, user?: { email: string; name: string }): void {
  try {
    const existing = getAllSavedPapersMap();
    const cleanCode = normalizePaperCode(paper.paperCode || paper.id);
    let creator = paper.generatedBy || user;
    if (!creator) {
      try {
        const savedUserStr = localStorage.getItem('examidea_current_user');
        if (savedUserStr) {
          const parsed = JSON.parse(savedUserStr);
          if (parsed && parsed.email) {
            creator = { email: parsed.email, name: parsed.name || parsed.email.split('@')[0] };
          }
        }
      } catch {}
    }
    if (!creator) {
      creator = { email: 'guest@examcraft.internal', name: 'Guest User (Guest)' };
    }
    const fullPaper = {
      ...paper,
      paperCode: cleanCode,
      generatedBy: creator
    };
    existing[cleanCode] = fullPaper;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn('LocalStorage quota exceeded in paperRegistry:', e);
    }

    // Async sync to central server backend
    fetch('/api/papers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paper: fullPaper, user: creator })
    }).catch(err => console.warn('Server paper sync background warning:', err));

    // Sync user profile to Firestore & server store
    syncUserToFirestore({
      id: `usr-${creator.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: creator.name,
      email: creator.email,
      role: creator.email === 'mukesh186000@gmail.com' ? 'admin' : 'student'
    }).catch(() => {});

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: {
          id: `usr-${creator.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: creator.name,
          email: creator.email,
          role: creator.email === 'mukesh186000@gmail.com' ? 'admin' : 'student',
          lastDownloadDate: new Date().toISOString().split('T')[0]
        }
      })
    }).catch(() => {});

    // Log paper generation activity to Firestore database
    logPaperGenerationToFirestore(
      { id: creator.email, name: creator.name, email: creator.email },
      {
        id: fullPaper.id,
        paperCode: cleanCode,
        title: fullPaper.config?.title || (fullPaper as any).title || fullPaper.subjectName || 'CBSE Question Paper',
        subjectName: fullPaper.subjectName,
        classLevel: (fullPaper as any).classLevel || (fullPaper.config as any)?.classLevel || '10',
        totalMarks: fullPaper.config?.totalMarks || 80
      }
    ).catch(err => console.warn('Firestore paper generation log error:', err));
  } catch (err) {
    console.warn('Failed to save paper to registry:', err);
  }
}

// Retrieve paper from registry by unique code
export function getPaperByCode(codeInput: string): GeneratedPaper | null {
  if (!codeInput) return null;
  const cleanCode = normalizePaperCode(codeInput);
  const map = getAllSavedPapersMap();

  // 1. Direct match
  if (map[cleanCode]) {
    return map[cleanCode];
  }

  // 2. Loose match (ignoring hyphens or prefixes)
  const keys = Object.keys(map);
  const strippedInput = cleanCode.replace(/[^A-Z0-9]/g, '');

  for (const key of keys) {
    const strippedKey = key.replace(/[^A-Z0-9]/g, '');
    if (strippedKey === strippedInput || key.endsWith(cleanCode)) {
      return map[key];
    }
  }

  return null;
}

// Retrieve all saved papers list sorted by date descending & trigger server sync
export function getAllSavedPapers(): GeneratedPaper[] {
  // Trigger background sync
  syncSavedPapersWithServer().catch(() => {});

  const map = getAllSavedPapersMap();
  const list = Object.values(map);
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Full async server paper synchronization
export async function syncSavedPapersWithServer(): Promise<GeneratedPaper[]> {
  try {
    const localMap = getAllSavedPapersMap();

    // 1. Fetch server papers
    const resp = await fetch('/api/papers');
    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.papers) {
        const serverPapers: GeneratedPaper[] = data.papers;
        
        // Merge server papers into local map
        let changed = false;
        for (const sp of serverPapers) {
          const code = normalizePaperCode(sp.paperCode || sp.id);
          if (!localMap[code]) {
            localMap[code] = sp;
            changed = true;
          }
        }

        // Upload any local papers missing on server
        for (const [code, lp] of Object.entries(localMap)) {
          const existsOnServer = serverPapers.some(sp => normalizePaperCode(sp.paperCode || sp.id) === code);
          if (!existsOnServer) {
            fetch('/api/papers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paper: lp, user: lp.generatedBy })
            }).catch(() => {});
          }
        }

        if (changed) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localMap));
        }
      }
    }
  } catch (err) {
    console.warn('Could not sync with server papers:', err);
  }

  const list = Object.values(getAllSavedPapersMap());
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Delete paper by code locally and on server
export function deletePaperFromRegistry(code: string): void {
  try {
    const cleanCode = normalizePaperCode(code);
    const map = getAllSavedPapersMap();
    if (map[cleanCode]) {
      delete map[cleanCode];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
    }

    fetch(`/api/papers/${encodeURIComponent(cleanCode)}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Failed to delete paper on server:', err));
  } catch (err) {
    console.warn('Failed to delete paper from registry:', err);
  }
}

// Helper to load registry map with multi-version fallback & consolidation
function getAllSavedPapersMap(): Record<string, GeneratedPaper> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    let map: Record<string, GeneratedPaper> = {};
    if (raw) {
      map = JSON.parse(raw) as Record<string, GeneratedPaper>;
    }

    // Check legacy storage keys to consolidate any papers created under prior keys
    const legacyKeys = [
      'cbse_examidea_saved_papers',
      'cbse_examidea_saved_papers_v1',
      'examidea_saved_papers',
      'cbse_saved_papers'
    ];
    let migrated = false;

    for (const legacyKey of legacyKeys) {
      try {
        const legacyRaw = localStorage.getItem(legacyKey);
        if (legacyRaw) {
          const parsed = JSON.parse(legacyRaw);
          const items: GeneratedPaper[] = Array.isArray(parsed) ? parsed : Object.values(parsed);
          for (const item of items) {
            if (item && (item.id || item.paperCode)) {
              const cleanCode = normalizePaperCode(item.paperCode || item.id);
              if (!map[cleanCode]) {
                map[cleanCode] = { ...item, paperCode: cleanCode };
                migrated = true;
              }
            }
          }
        }
      } catch (e) {
        // Ignore parsing errors for legacy items
      }
    }

    if (migrated) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
    }

    // Ensure all papers have valid generatedBy metadata
    Object.keys(map).forEach(code => {
      if (!map[code].generatedBy) {
        map[code].generatedBy = { email: 'guest@examcraft.internal', name: 'Guest User (Guest)' };
      }
    });

    return map;
  } catch {
    return {};
  }
}

// Pre-populate standard sample papers with fixed codes on first visit
export function initSamplePapersIfEmpty(): void {
  try {
    const map = getAllSavedPapersMap();
    const defaultCodes = ['CBSE10-MATH-2026', 'CBSE10-SCI-2026', 'CBSE10-SST-2026', 'CBSE10-ENG-2026'];
    const hasDefault = defaultCodes.some(c => Boolean(map[c]));

    if (!hasDefault) {
      // 1. Mathematics 041
      const mathSub = CBSE_SUBJECTS.find(s => s.id === 'maths-041') || CBSE_SUBJECTS[0];
      const mathPaper = generateLocalPaper({
        subjectId: mathSub.id,
        preset: 'board80',
        title: 'CBSE CLASS 10 MATHEMATICS STANDARD MODEL BOARD PAPER 2026',
        schoolName: 'Delhi Public School, R.K. Puram',
        examCode: 'CBSE10-MATH-2026',
        date: '15 MARCH 2026',
        durationMinutes: 180,
        totalMarks: 80,
        selectedChapterIds: mathSub.chapters.map(c => c.id),
        competencyRatio: 50,
        difficultySplit: { easy: 30, medium: 50, hard: 20 },
        watermarkText: 'CBSE OFFICIAL SAMPLE 2026',
        includeSolutions: true,
        useAI: false
      });
      mathPaper.paperCode = 'CBSE10-MATH-2026';
      savePaperToRegistry(mathPaper);

      // 2. Science 086
      const sciSub = CBSE_SUBJECTS.find(s => s.id === 'science-086') || CBSE_SUBJECTS[1];
      const sciPaper = generateLocalPaper({
        subjectId: sciSub.id,
        preset: 'board80',
        title: 'CBSE CLASS 10 SCIENCE MODEL BOARD QUESTION PAPER 2026',
        schoolName: 'Delhi Public School, R.K. Puram',
        examCode: 'CBSE10-SCI-2026',
        date: '20 MARCH 2026',
        durationMinutes: 180,
        totalMarks: 80,
        selectedChapterIds: sciSub.chapters.map(c => c.id),
        competencyRatio: 50,
        difficultySplit: { easy: 30, medium: 50, hard: 20 },
        watermarkText: 'CBSE OFFICIAL SAMPLE 2026',
        includeSolutions: true,
        useAI: false
      });
      sciPaper.paperCode = 'CBSE10-SCI-2026';
      savePaperToRegistry(sciPaper);

      // 3. Social Science 087
      const sstSub = CBSE_SUBJECTS.find(s => s.id === 'social-087') || CBSE_SUBJECTS[2];
      const sstPaper = generateLocalPaper({
        subjectId: sstSub.id,
        preset: 'board80',
        title: 'CBSE CLASS 10 SOCIAL SCIENCE MODEL BOARD PAPER 2026',
        schoolName: 'Delhi Public School, R.K. Puram',
        examCode: 'CBSE10-SST-2026',
        date: '25 MARCH 2026',
        durationMinutes: 180,
        totalMarks: 80,
        selectedChapterIds: sstSub.chapters.map(c => c.id),
        competencyRatio: 50,
        difficultySplit: { easy: 30, medium: 50, hard: 20 },
        watermarkText: 'CBSE OFFICIAL SAMPLE 2026',
        includeSolutions: true,
        useAI: false
      });
      sstPaper.paperCode = 'CBSE10-SST-2026';
      savePaperToRegistry(sstPaper);

      // 4. English 184
      const engSub = CBSE_SUBJECTS.find(s => s.id === 'english-184') || CBSE_SUBJECTS[3];
      const engPaper = generateLocalPaper({
        subjectId: engSub.id,
        preset: 'board80',
        title: 'CBSE CLASS 10 ENGLISH LANGUAGE & LITERATURE MODEL PAPER 2026',
        schoolName: 'Delhi Public School, R.K. Puram',
        examCode: 'CBSE10-ENG-2026',
        date: '28 MARCH 2026',
        durationMinutes: 180,
        totalMarks: 80,
        selectedChapterIds: engSub.chapters.map(c => c.id),
        competencyRatio: 50,
        difficultySplit: { easy: 30, medium: 50, hard: 20 },
        watermarkText: 'CBSE OFFICIAL SAMPLE 2026',
        includeSolutions: true,
        useAI: false
      });
      engPaper.paperCode = 'CBSE10-ENG-2026';
      savePaperToRegistry(engPaper);
    }
  } catch (err) {
    console.warn('Could not initialize sample paper registry:', err);
  }
}
