import { 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { User } from '../types';
import { 
  debugLogPaperGenerationPayload, 
  debugLogQuizSubmissionPayload 
} from '../lib/firestore-debug-logger';

export interface StudentActivityDoc {
  id?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  activityType: 'paper_generated' | 'quiz_submitted' | 'user_login' | 'user_registered';
  paperId: string;
  paperCode: string;
  paperTitle: string;
  subject: string;
  classLevel: string;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  timeTakenSeconds?: number;
  timestamp: string;
}

export interface QuizSubmissionDoc {
  id?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  paperId: string;
  paperCode: string;
  paperTitle: string;
  subject: string;
  classLevel: string;
  score: number;
  totalMarks: number;
  percentage: number;
  timeTakenSeconds: number;
  submittedAt: string;
}

export interface GeneratedPaperLogDoc {
  id?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  paperId: string;
  paperCode: string;
  title: string;
  subject: string;
  classLevel: string;
  totalMarks: number;
  createdAt: string;
}

const LOCAL_ACTIVITIES_KEY = 'cbse_student_activities_v2';

/**
 * Save student activity payload locally in LocalStorage
 */
export function saveActivityLocally(activity: StudentActivityDoc): void {
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
    const list: StudentActivityDoc[] = raw ? JSON.parse(raw) : [];
    const exists = list.some(a => 
      (a.id && a.id === activity.id) || 
      (a.paperCode === activity.paperCode && a.timestamp === activity.timestamp && a.activityType === activity.activityType)
    );
    if (!exists) {
      list.unshift(activity);
      localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(list.slice(0, 300)));
    }
  } catch (e) {
    console.warn('Failed to save activity locally:', e);
  }
}

/**
 * Gather local activities from LocalStorage
 */
export function getLocalStudentActivities(): StudentActivityDoc[] {
  const map = new Map<string, StudentActivityDoc>();

  // 1. Direct local student activities
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
    if (raw) {
      const list: StudentActivityDoc[] = JSON.parse(raw);
      list.forEach(a => {
        const key = a.id || `${a.studentEmail}_${a.paperCode}_${a.activityType}_${a.timestamp}`;
        map.set(key, a);
      });
    }
  } catch (e) {}

  // 2. Saved papers in registry (local storage)
  try {
    const rawPapers = localStorage.getItem('cbse_examidea_saved_papers_v2');
    if (rawPapers) {
      const paperMap = JSON.parse(rawPapers);
      Object.values(paperMap).forEach((p: any) => {
        const creator = p.generatedBy || {};
        const email = creator.email || 'student@examidea.internal';
        const name = creator.name || email.split('@')[0] || 'Student';
        const code = p.paperCode || p.id || 'PPR-10';
        const dateStr = p.createdAt || new Date().toISOString();
        const key = `paper_gen_${code}_${dateStr}`;
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            studentId: email,
            studentName: name,
            studentEmail: email,
            activityType: 'paper_generated',
            paperId: p.id || code,
            paperCode: code,
            paperTitle: p.config?.title || p.title || p.subjectName || 'CBSE Board Paper',
            subject: p.subjectName || 'CBSE Exam',
            classLevel: p.classLevel || p.config?.classLevel || '10',
            totalMarks: p.config?.totalMarks || 80,
            timestamp: dateStr
          });
        }
      });
    }
  } catch (e) {}

  // 3. Quiz / Test results in local storage
  try {
    const rawQuiz = localStorage.getItem('examcraft_grammar_results');
    if (rawQuiz) {
      const quizList = JSON.parse(rawQuiz);
      if (Array.isArray(quizList)) {
        quizList.forEach((q: any) => {
          const email = q.userEmail || 'student@examidea.internal';
          const name = q.userName || email.split('@')[0] || 'Student';
          const code = q.code || 'QUIZ-10';
          const dateStr = q.date || new Date().toISOString();
          const key = `quiz_sub_${code}_${dateStr}`;
          if (!map.has(key)) {
            map.set(key, {
              id: key,
              studentId: email,
              studentName: name,
              studentEmail: email,
              activityType: 'quiz_submitted',
              paperId: code,
              paperCode: code,
              paperTitle: q.topic || 'Interactive Practice Quiz',
              subject: q.topic || 'CBSE Exam',
              classLevel: String(q.classLevel || '10'),
              score: typeof q.score === 'number' ? q.score : 0,
              totalMarks: typeof q.total === 'number' ? q.total : 10,
              percentage: typeof q.percentage === 'number' ? q.percentage : 0,
              timeTakenSeconds: typeof q.timeTakenSeconds === 'number' ? q.timeTakenSeconds : 0,
              timestamp: dateStr
            });
          }
        });
      }
    }
  } catch (e) {}

  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime() || 0;
    const timeB = new Date(b.timestamp).getTime() || 0;
    return timeB - timeA;
  });
}

export function mergeActivities(remote: StudentActivityDoc[], local: StudentActivityDoc[]): StudentActivityDoc[] {
  const map = new Map<string, StudentActivityDoc>();

  remote.forEach(r => {
    const key = r.id || `${r.studentEmail}_${r.paperCode}_${r.activityType}_${r.timestamp}`;
    map.set(key, r);
  });

  local.forEach(l => {
    const key = l.id || `${l.studentEmail}_${l.paperCode}_${l.activityType}_${l.timestamp}`;
    if (!map.has(key)) {
      map.set(key, l);
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime() || 0;
    const timeB = new Date(b.timestamp).getTime() || 0;
    return timeB - timeA;
  });
}

/**
 * Log a paper generation event directly to Firestore
 */
export async function logPaperGenerationToFirestore(
  student: { id?: string; name?: string; email?: string },
  paper: { id: string; paperCode?: string; title: string; subjectName?: string; classLevel?: string; totalMarks?: number }
): Promise<string | null> {
  const studentEmail = (student.email || 'guest@examidea.internal').toLowerCase().trim();
  const studentName = student.name || (studentEmail.includes('guest') ? 'Guest Student' : studentEmail.split('@')[0]);
  const studentId = student.id || studentEmail;
  const paperCode = paper.paperCode || paper.id;
  const now = new Date().toISOString();

  const activityPayload: StudentActivityDoc = {
    studentId,
    studentName,
    studentEmail,
    activityType: 'paper_generated',
    paperId: paper.id,
    paperCode,
    paperTitle: paper.title || 'CBSE Model Question Paper',
    subject: paper.subjectName || 'General CBSE',
    classLevel: paper.classLevel || '10',
    totalMarks: paper.totalMarks || 80,
    timestamp: now,
  };

  saveActivityLocally(activityPayload);
  debugLogPaperGenerationPayload(student, paper, activityPayload);

  // Write directly to Firestore
  try {
    if (db && db.app) {
      await addDoc(collection(db, 'student_activities'), activityPayload);
    }
  } catch (e) {
    console.warn('Firestore write activity warning:', e);
  }

  // Backup sync to server
  try {
    fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity: activityPayload })
    }).catch(() => {});
  } catch {}

  return `log-${Date.now()}`;
}

/**
 * Log a quiz submission event directly to Firestore
 */
export async function logQuizSubmissionToFirestore(
  student: { id?: string; name?: string; email?: string },
  quiz: { 
    paperId: string; 
    paperCode?: string; 
    paperTitle?: string; 
    subjectName?: string; 
    classLevel?: string; 
    score: number; 
    totalMarks: number; 
    percentage: number; 
    timeTakenSeconds: number;
  }
): Promise<string | null> {
  const studentEmail = (student.email || 'guest@examidea.internal').toLowerCase().trim();
  const studentName = student.name || (studentEmail.includes('guest') ? 'Guest Student' : studentEmail.split('@')[0]);
  const studentId = student.id || studentEmail;
  const paperCode = quiz.paperCode || quiz.paperId;
  const now = new Date().toISOString();

  const activityPayload: StudentActivityDoc = {
    studentId,
    studentName,
    studentEmail,
    activityType: 'quiz_submitted',
    paperId: quiz.paperId,
    paperCode,
    paperTitle: quiz.paperTitle || 'Interactive Practice Quiz',
    subject: quiz.subjectName || 'CBSE Exam',
    classLevel: quiz.classLevel || '10',
    score: quiz.score,
    totalMarks: quiz.totalMarks,
    percentage: quiz.percentage,
    timeTakenSeconds: quiz.timeTakenSeconds,
    timestamp: now,
  };

  saveActivityLocally(activityPayload);
  debugLogQuizSubmissionPayload(student, quiz, activityPayload);

  const grammarResultPayload = {
    code: paperCode,
    topic: quiz.paperTitle || quiz.subjectName || 'Practice Test',
    score: quiz.score,
    total: quiz.totalMarks,
    percentage: quiz.percentage,
    timeTakenSeconds: quiz.timeTakenSeconds,
    date: now,
    userName: studentName,
    userEmail: studentEmail,
    classLevel: quiz.classLevel || '10'
  };

  syncGrammarResultToFirestore(grammarResultPayload);

  // Write directly to Firestore
  try {
    if (db && db.app) {
      await addDoc(collection(db, 'student_activities'), activityPayload);
      await addDoc(collection(db, 'grammar_results'), grammarResultPayload);
    }
  } catch (e) {
    console.warn('Firestore write quiz submission warning:', e);
  }

  // Backup sync to server
  try {
    fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity: activityPayload })
    }).catch(() => {});
  } catch {}

  return `quiz-${Date.now()}`;
}

/**
 * Real-time subscription to student activities in Firestore
 */
export function subscribeToStudentActivities(
  callback: (activities: StudentActivityDoc[]) => void,
  maxRecords: number = 100
): () => void {
  // First send local items immediately
  callback(getLocalStudentActivities());

  if (!db || !db.app) return () => {};

  try {
    const q = query(
      collection(db, 'student_activities'),
      orderBy('timestamp', 'desc'),
      limit(maxRecords)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const remoteList: StudentActivityDoc[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as StudentActivityDoc));

        const localList = getLocalStudentActivities();
        const merged = mergeActivities(remoteList, localList);
        callback(merged);
      },
      (error) => {
        console.warn('Firestore student_activities listener error, falling back:', error);
        fetchFirestoreActivities(maxRecords).then(res => callback(res)).catch(() => {});
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn('Failed to attach student_activities snapshot:', e);
    return () => {};
  }
}

/**
 * Real-time subscription to Grammar Results in Firestore
 */
export function subscribeToGrammarResults(
  callback: (results: any[]) => void
): () => void {
  try {
    const raw = localStorage.getItem('examcraft_grammar_results');
    callback(raw ? JSON.parse(raw) : []);
  } catch {
    callback([]);
  }

  if (!db || !db.app) return () => {};

  try {
    const q = query(collection(db, 'grammar_results'), limit(150));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const remoteResults = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const raw = localStorage.getItem('examcraft_grammar_results');
        const localResults: any[] = raw ? JSON.parse(raw) : [];
        const map = new Map<string, any>();
        localResults.forEach(r => map.set(r.code, r));
        remoteResults.forEach((r: any) => map.set(r.code, r));
        const merged = Array.from(map.values()).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        try {
          localStorage.setItem('examcraft_grammar_results', JSON.stringify(merged));
        } catch {}
        callback(merged);
      },
      (error) => {
        console.warn('Firestore grammar_results listener error:', error);
      }
    );
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
}

export async function fetchFirestoreActivities(maxRecords: number = 100): Promise<StudentActivityDoc[]> {
  try {
    if (db && db.app) {
      const q = query(collection(db, 'student_activities'), orderBy('timestamp', 'desc'), limit(maxRecords));
      const snap = await getDocs(q);
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentActivityDoc));
      const local = getLocalStudentActivities();
      return mergeActivities(remote, local);
    }
  } catch (e) {
    console.warn('Direct fetch firestore activities warning:', e);
  }
  return getLocalStudentActivities();
}

export async function logUserLoginToFirestore(
  student: { id?: string; name?: string; email: string },
  isNewRegistration: boolean = false
): Promise<string | null> {
  const studentEmail = student.email.toLowerCase().trim();
  const studentName = student.name || studentEmail.split('@')[0];
  const studentId = student.id || studentEmail;
  const now = new Date().toISOString();

  const activityPayload: StudentActivityDoc = {
    studentId,
    studentName,
    studentEmail,
    activityType: isNewRegistration ? 'user_registered' : 'user_login',
    paperId: `AUTH-${Date.now()}`,
    paperCode: `AUTH-${studentEmail.split('@')[0].toUpperCase()}`,
    paperTitle: isNewRegistration ? 'New Student Registration' : 'Student Account Login',
    subject: 'CBSE Portal Access',
    classLevel: '10',
    timestamp: now,
  };

  saveActivityLocally(activityPayload);

  // Sync user record to Firestore
  syncUserToFirestore({
    id: studentId,
    name: studentName,
    email: studentEmail,
    role: studentEmail === 'mukesh186000@gmail.com' ? 'admin' : 'student'
  });

  // Write login activity directly to Firestore
  try {
    if (db && db.app) {
      await addDoc(collection(db, 'student_activities'), activityPayload);
    }
  } catch (e) {
    console.warn('Firestore login log error:', e);
  }

  return `auth-${Date.now()}`;
}

export async function syncUserToFirestore(user: { id?: string; name?: string; email?: string; role?: string; photoURL?: string; dailyQuotaLimit?: number; dailyDownloadsUsed?: number; lastDownloadDate?: string; totalDownloads?: number; createdAt?: string }): Promise<void> {
  if (!user || !user.email) return;
  const rawEmail = user.email.toLowerCase().trim();
  const rawName = user.name || (rawEmail.includes('guest') ? 'Guest Student' : rawEmail.split('@')[0]);

  const updatedUser: User = {
    id: user.id || `usr-${Date.now()}`,
    name: rawName,
    email: rawEmail,
    role: (rawEmail === 'mukesh186000@gmail.com' ? 'admin' : (user.role || 'student')) as any,
    photoURL: user.photoURL || '',
    dailyQuotaLimit: user.dailyQuotaLimit ?? 5,
    dailyDownloadsUsed: user.dailyDownloadsUsed ?? 0,
    lastDownloadDate: user.lastDownloadDate || new Date().toISOString().split('T')[0],
    totalDownloads: user.totalDownloads ?? 0,
    createdAt: user.createdAt || new Date().toISOString()
  };

  // Sync locally
  try {
    const rawUsers = localStorage.getItem('examidea_all_users');
    const list: User[] = rawUsers ? JSON.parse(rawUsers) : [];
    const idx = list.findIndex(u => u.email.toLowerCase().trim() === rawEmail);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updatedUser };
    } else {
      list.unshift(updatedUser);
    }
    localStorage.setItem('examidea_all_users', JSON.stringify(list));
  } catch (e) {}

  // Write directly to Firestore
  try {
    if (db && db.app) {
      const docId = rawEmail.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, 'users', docId), updatedUser, { merge: true });
    }
  } catch (e) {
    console.warn('Firestore sync user error:', e);
  }
}

export function subscribeToQuizSubmissions(
  callback: (submissions: QuizSubmissionDoc[]) => void,
  maxRecords: number = 100
): () => void {
  callback([]);
  return () => {};
}

export function subscribeToGeneratedPaperLogs(
  callback: (logs: GeneratedPaperLogDoc[]) => void,
  maxRecords: number = 100
): () => void {
  callback([]);
  return () => {};
}

export async function fetchFirestoreQuizSubmissions(maxRecords: number = 100): Promise<QuizSubmissionDoc[]> {
  return [];
}

export async function fetchFirestoreGrammarResults(): Promise<any[]> {
  try {
    if (db && db.app) {
      const snap = await getDocs(query(collection(db, 'grammar_results'), limit(150)));
      const remoteResults = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const raw = localStorage.getItem('examcraft_grammar_results');
      const localResults: any[] = raw ? JSON.parse(raw) : [];
      const map = new Map<string, any>();
      localResults.forEach(r => map.set(r.code, r));
      remoteResults.forEach((r: any) => map.set(r.code, r));
      const merged = Array.from(map.values()).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      try {
        localStorage.setItem('examcraft_grammar_results', JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem('examcraft_grammar_results');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function syncGrammarResultToFirestore(result: any): Promise<void> {
  if (!result || !result.code) return;
  try {
    const raw = localStorage.getItem('examcraft_grammar_results');
    const list: any[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(r => r.code === result.code);
    if (idx >= 0) list[idx] = result;
    else list.unshift(result);
    localStorage.setItem('examcraft_grammar_results', JSON.stringify(list));

    if (db && db.app) {
      const docId = result.code.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, 'grammar_results', docId), result, { merge: true });
    }
  } catch (e) {
    console.warn('Firestore sync grammar result error:', e);
  }
}

export function subscribeToFirestoreUsers(
  callback: (users: User[]) => void
): () => void {
  try {
    const raw = localStorage.getItem('examidea_all_users');
    callback(raw ? JSON.parse(raw) : []);
  } catch {
    callback([]);
  }

  if (!db || !db.app) return () => {};

  try {
    const q = query(collection(db, 'users'), limit(200));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const remoteUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
        const raw = localStorage.getItem('examidea_all_users');
        const localUsers: User[] = raw ? JSON.parse(raw) : [];
        const map = new Map<string, User>();
        localUsers.forEach(u => {
          const key = (u.email || u.id || u.name || '').toLowerCase().trim();
          if (key) map.set(key, u);
        });
        remoteUsers.forEach(u => {
          const key = (u.email || u.id || u.name || '').toLowerCase().trim();
          if (key) map.set(key, u);
        });
        const merged = Array.from(map.values());
        try {
          localStorage.setItem('examidea_all_users', JSON.stringify(merged));
        } catch {}
        callback(merged);
      },
      (error) => {
        console.warn('Firestore users listener error:', error);
      }
    );
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
}

export async function fetchFirestoreUsers(): Promise<User[]> {
  try {
    if (db && db.app) {
      const snap = await getDocs(query(collection(db, 'users'), limit(200)));
      const remoteUsers = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      const raw = localStorage.getItem('examidea_all_users');
      const localUsers: User[] = raw ? JSON.parse(raw) : [];
      const map = new Map<string, User>();
      localUsers.forEach(u => {
        const key = (u.email || u.id || u.name || '').toLowerCase().trim();
        if (key) map.set(key, u);
      });
      remoteUsers.forEach(u => {
        const key = (u.email || u.id || u.name || '').toLowerCase().trim();
        if (key) map.set(key, u);
      });
      return Array.from(map.values());
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem('examidea_all_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function deleteUserFromFirestore(userIdOrEmail: string): Promise<void> {
  if (!userIdOrEmail) return;
  const target = userIdOrEmail.toLowerCase().trim();

  // Local filter
  try {
    const raw = localStorage.getItem('examidea_all_users');
    if (raw) {
      const list: User[] = JSON.parse(raw);
      const filtered = list.filter(u => (u.id || '').toLowerCase() !== target && (u.email || '').toLowerCase() !== target);
      localStorage.setItem('examidea_all_users', JSON.stringify(filtered));
    }
  } catch (e) {}

  // Delete from Firestore
  try {
    if (db && db.app) {
      const docId = target.replace(/[^a-zA-Z0-9]/g, '_');
      await deleteDoc(doc(doc(db, 'users'), docId));
    }
  } catch (e) {
    console.warn('Delete user from firestore error:', e);
  }
}

export function deleteUser(userIdOrEmail: string): void {
  deleteUserFromFirestore(userIdOrEmail);
}
