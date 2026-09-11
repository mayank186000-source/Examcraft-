import React, { useState } from 'react';
import {
  X,
  Crown,
  Users,
  Download,
  Shield,
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Sliders,
  Copy,
  Check,
  FileText,
  Eye,
  Filter,
  Layers,
  ChevronDown,
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle,
  XCircle,
  HelpCircle,
  Flame,
  Database,
  RefreshCw,
  UserX,
  Upload,
  Paperclip
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { User, DownloadRecord, GeneratedPaper, QuestionBankSet } from '../types';
import { fetchQuestionBankSets, saveQuestionBankSet, deleteQuestionBankSet } from '../utils/questionBankService';
import { getAllSavedPapers, deletePaperFromRegistry, syncSavedPapersWithServer } from '../utils/paperRegistry';
import { useFirestoreActivityLog } from '../hooks/useFirestoreActivityLog';
import { 
  getAllGrammarResults, 
  deleteGrammarResult, 
  syncGrammarResultsWithServer,
  SavedGrammarResult, 
  GRAMMAR_TOPICS 
} from '../data/grammarQuestions';
import { CBSE_SUBJECTS, getSubjectsByClass } from '../data/cbseData';
import {
  saveCustomQuestionsToServerVault,
  fetchServerCustomQuestions,
  deleteCustomQuestionFromServer,
  parseDocumentAndExtractQuestions
} from '../utils/questionVault';
import { Question } from '../types';
import { 
  subscribeToFirestoreUsers, 
  subscribeToStudentActivities, 
  subscribeToQuizSubmissions,
  subscribeToGeneratedPaperLogs,
  subscribeToGrammarResults,
  fetchFirestoreUsers,
  fetchFirestoreActivities,
  mergeActivities, 
  StudentActivityDoc,
  QuizSubmissionDoc,
  GeneratedPaperLogDoc
} from '../services/firestoreActivityService';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaper?: (paper: GeneratedPaper) => void;
}

interface UserGrammarStat {
  name: string;
  email: string;
  count: number;
  totalScore: number;
  totalMax: number;
  highestPercentage: number;
  results: SavedGrammarResult[];
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onSelectPaper
}) => {
  const {
    currentUser,
    isAdmin,
    allUsers,
    downloadLogs,
    adminEmails,
    unlimitedVipEmails,
    isPrimaryOwner,
    updateUserQuota,
    grantUnlimitedAccess,
    revokeUnlimitedAccess,
    addAdminEmail,
    removeAdminEmail,
    deregisterUser,
    reRegisterUser,
    deregisteredUserEmails,
    clearDownloadLogs
  } = useAuth();

  const {
    activities: firestoreActivities,
    quizSubmissions: firestoreQuizSubmissions,
    isLoading: isFirestoreLoading,
    isRefreshing: isFirestoreRefreshing,
    isFirestoreConnected,
    refreshActivities,
    refreshQuizSubmissions
  } = useFirestoreActivityLog();

  const [savedPapers, setSavedPapers] = useState<GeneratedPaper[]>([]);
  const [grammarResults, setGrammarResults] = useState<SavedGrammarResult[]>([]);

  // Real-time Firestore state driven by onSnapshot listeners for 'users' and 'activities' collections
  const [realtimeUsers, setRealtimeUsers] = useState<User[]>([]);
  const [realtimeActivities, setRealtimeActivities] = useState<StudentActivityDoc[]>([]);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs' | 'admins' | 'papers' | 'grammar' | 'firestore' | 'importer' | 'questionBank' | 'deregistered'>('overview');
  const [userSearch, setUserSearch] = useState<string>('');
  const [logSearch, setLogSearch] = useState<string>('');
  const [paperSearch, setPaperSearch] = useState<string>('');
  const [paperUserFilter, setPaperUserFilter] = useState<string>('all');
  const [paperClassFilter, setPaperClassFilter] = useState<string>('all');
  const [paperSubjectFilter, setPaperSubjectFilter] = useState<string>('all');
  const [paperMarksFilter, setPaperMarksFilter] = useState<string>('all');

  // Question Bank Sets State
  const [questionBankSets, setQuestionBankSets] = useState<QuestionBankSet[]>([]);
  const [qbSearch, setQbSearch] = useState<string>('');
  const [qbClassFilter, setQbClassFilter] = useState<string>('all');
  const [qbSubjectFilter, setQbSubjectFilter] = useState<string>('all');
  const [qbMarksFilter, setQbMarksFilter] = useState<string>('all');
  const [selectedQbPreview, setSelectedQbPreview] = useState<QuestionBankSet | null>(null);

  // Form Modal State for Adding / Editing Question Bank Sets
  const [showQbModal, setShowQbModal] = useState<boolean>(false);
  const [editingQbId, setEditingQbId] = useState<string | null>(null);
  const [qbTitleInput, setQbTitleInput] = useState<string>('');
  const [qbClassInput, setQbClassInput] = useState<string>('10');
  const [qbSubjectInput, setQbSubjectInput] = useState<string>('Science');
  const [qbMarksInput, setQbMarksInput] = useState<number>(40);
  const [qbTimeInput, setQbTimeInput] = useState<string>('1 Hour');
  const [qbDescriptionInput, setQbDescriptionInput] = useState<string>('');
  const [qbRawContentInput, setQbRawContentInput] = useState<string>('');
  const [qbFile, setQbFile] = useState<File | null>(null);
  const [qbFileBase64, setQbFileBase64] = useState<string>('');
  const [qbFileName, setQbFileName] = useState<string>('');
  const [isParsingQbFile, setIsParsingQbFile] = useState<boolean>(false);
  const [isSavingQb, setIsSavingQb] = useState<boolean>(false);
  const [qbStatusMsg, setQbStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Question Importer State
  const [importClass, setImportClass] = useState<string>('10');
  const [importSubjectId, setImportSubjectId] = useState<string>('science-086');
  const [importChapterId, setImportChapterId] = useState<string>('');
  const [importChapterName, setImportChapterName] = useState<string>('');
  const [importTopic, setImportTopic] = useState<string>('');
  const [importMode, setImportMode] = useState<'file' | 'text'>('file');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importRawText, setImportRawText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [serverCustomQuestions, setServerCustomQuestions] = useState<Question[]>([]);
  const [isSavingCustom, setIsSavingCustom] = useState<boolean>(false);
  const [importStatusMessage, setImportStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [customSearch, setCustomSearch] = useState<string>('');

  // Firestore Activity Log Filters
  const [firestoreSearch, setFirestoreSearch] = useState<string>('');
  const [firestoreActivityFilter, setFirestoreActivityFilter] = useState<'all' | 'paper_generated' | 'quiz_submitted'>('all');
  const [firestoreUserFilter, setFirestoreUserFilter] = useState<string>('all');

  // System Download Logs User Filter
  const [logUserFilter, setLogUserFilter] = useState<string>('all');
  
  // Kids Grammar Filters
  const [grammarSearch, setGrammarSearch] = useState<string>('');
  const [grammarUserFilter, setGrammarUserFilter] = useState<string>('all');
  const [grammarClassFilter, setGrammarClassFilter] = useState<string>('all');
  const [grammarTopicFilter, setGrammarTopicFilter] = useState<string>('all');
  const [grammarDifficultyFilter, setGrammarDifficultyFilter] = useState<string>('all');
  const [selectedGrammarDetail, setSelectedGrammarDetail] = useState<SavedGrammarResult | null>(null);

  const [newAdminInput, setNewAdminInput] = useState<string>('');
  const [vipEmailInput, setVipEmailInput] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadAllAdminData = async () => {
    try {
      const resp = await fetch('/api/admin/all-data');
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          if (Array.isArray(data.papers)) setSavedPapers(data.papers);
          if (Array.isArray(data.grammarResults) && data.grammarResults.length > 0) {
            setGrammarResults(data.grammarResults);
            const convertedGrammar: StudentActivityDoc[] = data.grammarResults.map((r: any) => ({
              id: `quiz_${r.code}_${r.date}`,
              studentId: r.userEmail || 'student',
              studentName: r.userName || (r.userEmail ? r.userEmail.split('@')[0] : 'Student'),
              studentEmail: r.userEmail || 'student@examcraft.internal',
              activityType: 'quiz_submitted',
              paperId: r.code,
              paperCode: r.code,
              paperTitle: `${r.topic || 'Grammar Practice'} (Class ${r.classLevel || 'General'})`,
              subject: 'English Grammar & Practice',
              classLevel: String(r.classLevel || '10'),
              score: r.score || 0,
              totalMarks: r.total || 5,
              percentage: r.percentage || 0,
              timeTakenSeconds: r.timeTakenSeconds || 60,
              timestamp: r.timestamp || new Date().toISOString()
            }));
            setRealtimeActivities(prev => mergeActivities(convertedGrammar, prev));
          }
          if (Array.isArray(data.customQuestions)) setServerCustomQuestions(data.customQuestions);
          if (Array.isArray(data.questionBankSets)) setQuestionBankSets(data.questionBankSets);
          if (Array.isArray(data.users) && data.users.length > 0) setRealtimeUsers(data.users);

          // Convert activities & logs
          if (Array.isArray(data.activities) && data.activities.length > 0) {
            setRealtimeActivities(prev => mergeActivities(data.activities, prev));
          }

          if (Array.isArray(data.downloadLogs) && data.downloadLogs.length > 0) {
            const converted: StudentActivityDoc[] = data.downloadLogs.map((l: any) => ({
              id: l.id || `log_${l.timestamp}`,
              studentId: l.userEmail || 'student',
              studentName: l.userName || (l.userEmail ? l.userEmail.split('@')[0] : 'Student'),
              studentEmail: l.userEmail || 'student@examcraft.internal',
              activityType: 'paper_generated',
              paperId: l.paperCode || 'paper',
              paperCode: l.paperCode || 'PPR',
              paperTitle: l.paperTitle || 'Generated Paper',
              subject: l.subject || 'CBSE Exam',
              classLevel: '10',
              timestamp: l.timestamp || new Date().toISOString()
            }));
            setRealtimeActivities(prev => mergeActivities(converted, prev));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load admin server data:', err);
    }
  };

  React.useEffect(() => {
    let intervalId: any = null;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSavedPapers(getAllSavedPapers());
      setGrammarResults(getAllGrammarResults());
      refreshActivities();
      refreshQuizSubmissions();

      loadAllAdminData();
      syncSavedPapersWithServer().then(papers => setSavedPapers(papers)).catch(() => {});
      syncGrammarResultsWithServer().then(results => setGrammarResults(results)).catch(() => {});
      fetchServerCustomQuestions().then(qs => setServerCustomQuestions(qs)).catch(() => {});
      fetchQuestionBankSets().then(sets => setQuestionBankSets(sets)).catch(() => {});

      // Live 5-second polling timer for cross-device sync
      intervalId = setInterval(() => {
        loadAllAdminData();
        fetchFirestoreUsers().then(u => {
          if (Array.isArray(u) && u.length > 0) setRealtimeUsers(u);
        }).catch(() => {});
        fetchFirestoreActivities().then(act => {
          if (Array.isArray(act) && act.length > 0) setRealtimeActivities(prev => mergeActivities(act, prev));
        }).catch(() => {});
      }, 5000);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, refreshActivities]);

  // Real-time Firestore onSnapshot listeners for 'users', 'student_activities', 'quiz_submissions', 'generated_paper_logs', 'grammar_results', and 'saved_papers'
  React.useEffect(() => {
    if (!isOpen) return;

    let unsubUsers: (() => void) | null = null;
    let unsubActivities: (() => void) | null = null;
    let unsubQuizSubmissions: (() => void) | null = null;
    let unsubPaperLogs: (() => void) | null = null;
    let unsubGrammar: (() => void) | null = null;
    let unsubSavedPapers: (() => void) | null = null;
    let unsubDirectActivities: (() => void) | null = null;

    try {
      // 1. Users real-time listener (registered & guest users across devices)
      unsubUsers = subscribeToFirestoreUsers((remoteUsers) => {
        if (Array.isArray(remoteUsers)) {
          setRealtimeUsers(remoteUsers);
          setIsRealtimeActive(true);
        }
      });

      // 2. Student Activities real-time listener (paper_generated, quiz_submitted, user_login)
      unsubActivities = subscribeToStudentActivities((remoteActivities) => {
        if (Array.isArray(remoteActivities)) {
          setRealtimeActivities(prev => mergeActivities(remoteActivities, prev));
          setIsRealtimeActive(true);
        }
      }, 250);

      // 3. Quiz Submissions real-time listener (test scores across devices)
      unsubQuizSubmissions = subscribeToQuizSubmissions((remoteQuizSubs) => {
        if (Array.isArray(remoteQuizSubs) && remoteQuizSubs.length > 0) {
          const convertedActivities: StudentActivityDoc[] = remoteQuizSubs.map((q: QuizSubmissionDoc) => ({
            id: q.id || `quiz_${q.paperCode || 'code'}_${q.submittedAt || new Date().toISOString()}`,
            studentId: q.studentId || q.studentEmail || 'student',
            studentName: q.studentName || (q.studentEmail ? q.studentEmail.split('@')[0] : 'Student'),
            studentEmail: q.studentEmail || 'student@examcraft.internal',
            activityType: 'quiz_submitted',
            paperId: q.paperId || q.paperCode || 'quiz',
            paperCode: q.paperCode || 'QUIZ',
            paperTitle: q.paperTitle || 'Online Test / Quiz',
            subject: q.subject || 'General',
            classLevel: q.classLevel || '10',
            score: q.score,
            totalMarks: q.totalMarks,
            percentage: q.percentage,
            timeTakenSeconds: q.timeTakenSeconds,
            timestamp: q.submittedAt || new Date().toISOString()
          }));
          setRealtimeActivities(prev => mergeActivities(convertedActivities, prev));
        }
      }, 250);

      // 4. Generated Paper Logs real-time listener (generated papers across devices)
      unsubPaperLogs = subscribeToGeneratedPaperLogs((remotePaperLogs) => {
        if (Array.isArray(remotePaperLogs) && remotePaperLogs.length > 0) {
          const convertedActivities: StudentActivityDoc[] = remotePaperLogs.map((p: GeneratedPaperLogDoc) => ({
            id: p.id || `paper_${p.paperCode || 'code'}_${p.createdAt || new Date().toISOString()}`,
            studentId: p.studentId || p.studentEmail || 'student',
            studentName: p.studentName || (p.studentEmail ? p.studentEmail.split('@')[0] : 'Student'),
            studentEmail: p.studentEmail || 'student@examcraft.internal',
            activityType: 'paper_generated',
            paperId: p.paperId || p.paperCode || 'paper',
            paperCode: p.paperCode || 'PAPER',
            paperTitle: p.title || 'Generated Question Paper',
            subject: p.subject || 'General',
            classLevel: p.classLevel || '10',
            totalMarks: p.totalMarks || 80,
            timestamp: p.createdAt || new Date().toISOString()
          }));
          setRealtimeActivities(prev => mergeActivities(convertedActivities, prev));
        }
      }, 250);

      // 5. Kids Grammar Test Results real-time listener
      unsubGrammar = subscribeToGrammarResults((remoteGrammarResults) => {
        if (Array.isArray(remoteGrammarResults) && remoteGrammarResults.length > 0) {
          setGrammarResults(prev => {
            const map = new Map<string, SavedGrammarResult>();
            prev.forEach(g => map.set(g.code, g));
            remoteGrammarResults.forEach(g => map.set(g.code, g));
            return Array.from(map.values()).sort((a, b) => new Date(b.date || (b as any).timestamp || 0).getTime() - new Date(a.date || (a as any).timestamp || 0).getTime());
          });

          const convertedActivities: StudentActivityDoc[] = remoteGrammarResults.map(g => ({
            id: `grammar_${g.code}_${(g as any).timestamp || (g as any).syncedAt || g.date || new Date().toISOString()}`,
            studentId: `usr_${g.userEmail || g.userName || 'guest'}`,
            studentName: g.userName || (g.userEmail ? g.userEmail.split('@')[0] : 'Kids Student'),
            studentEmail: g.userEmail || 'guest@examcraft.internal',
            activityType: 'quiz_submitted',
            paperId: g.code,
            paperCode: g.code,
            paperTitle: `Kids Test: ${g.topic || 'Grammar'} (${g.difficulty || 'Medium'})`,
            subject: `Grammar Class ${g.classLevel || '5-8'}`,
            classLevel: String(g.classLevel || '5-8'),
            score: g.score,
            totalMarks: g.total || 10,
            percentage: g.percentage || (g.total ? Math.round((g.score / g.total) * 100) : 0),
            timestamp: (g as any).timestamp || (g as any).syncedAt || g.date || new Date().toISOString()
          }));
          setRealtimeActivities(prev => mergeActivities(convertedActivities, prev));
        }
      });

    } catch (err) {
      console.warn('[AdminPanelModal] Real-time listeners error:', err);
    }

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubActivities) unsubActivities();
      if (unsubQuizSubmissions) unsubQuizSubmissions();
      if (unsubPaperLogs) unsubPaperLogs();
      if (unsubGrammar) unsubGrammar();
      if (unsubSavedPapers) unsubSavedPapers();
      if (unsubDirectActivities) unsubDirectActivities();
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (activeTab === 'importer') {
      fetchServerCustomQuestions().then(qs => setServerCustomQuestions(qs)).catch(() => {});
    }
  }, [activeTab]);

  const availableClassSubjects = getSubjectsByClass(importClass as any);
  const selectedImportSubject = availableClassSubjects.find(s => s.id === importSubjectId) || availableClassSubjects[0];

  const handleImportClassChange = (newClass: string) => {
    setImportClass(newClass);
    const subList = getSubjectsByClass(newClass as any);
    if (subList.length > 0) {
      setImportSubjectId(subList[0].id);
      if (subList[0].chapters && subList[0].chapters.length > 0) {
        setImportChapterId(subList[0].chapters[0].id);
        setImportChapterName(subList[0].chapters[0].title);
      } else {
        setImportChapterId('ch-gen');
        setImportChapterName('General Chapter');
      }
    }
  };

  const handleImportSubjectChange = (newSubId: string) => {
    setImportSubjectId(newSubId);
    const sub = availableClassSubjects.find(s => s.id === newSubId);
    if (sub && sub.chapters && sub.chapters.length > 0) {
      setImportChapterId(sub.chapters[0].id);
      setImportChapterName(sub.chapters[0].title);
    } else {
      setImportChapterId('ch-gen');
      setImportChapterName('General Chapter');
    }
  };

  const handleStartParsing = async () => {
    if (importMode === 'file' && !importFile) {
      setImportStatusMessage({ type: 'error', message: 'Please select a PDF, Word (.docx), or Text file to upload.' });
      return;
    }
    if (importMode === 'text' && (!importRawText || importRawText.trim().length < 10)) {
      setImportStatusMessage({ type: 'error', message: 'Please paste or enter question text (at least 10 characters).' });
      return;
    }

    setIsParsing(true);
    setImportStatusMessage({ type: 'info', message: 'Extracting document text and AI parsing into structured questions... Please wait.' });

    let fileBase64: string | undefined = undefined;
    let fileName: string | undefined = undefined;

    if (importMode === 'file' && importFile) {
      fileName = importFile.name;
      fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const base64Str = res.includes(',') ? res.split(',')[1] : res;
          resolve(base64Str);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(importFile);
      });
    }

    const res = await parseDocumentAndExtractQuestions({
      rawText: importRawText,
      fileBase64,
      fileName,
      classLevel: importClass,
      subjectId: importSubjectId,
      subjectName: selectedImportSubject?.name || 'General Subject',
      chapterId: importChapterId || 'ch-gen',
      chapterName: importChapterName || 'General Chapter',
      topic: importTopic || 'General Topic'
    });

    setIsParsing(false);

    if (res.success && res.questions.length > 0) {
      setParsedQuestions(res.questions);
      setImportStatusMessage({
        type: 'success',
        message: `Successfully extracted ${res.totalExtracted} question(s)! Review, edit, or adjust below before saving to server vault.`
      });
    } else {
      setImportStatusMessage({
        type: 'error',
        message: res.error || 'Failed to extract valid questions from the document.'
      });
    }
  };

  const handleSaveParsedQuestions = async () => {
    if (parsedQuestions.length === 0) return;
    setIsSavingCustom(true);
    setImportStatusMessage({ type: 'info', message: 'Saving questions to Server Vault & Firebase...' });

    const res = await saveCustomQuestionsToServerVault(parsedQuestions);
    setIsSavingCustom(false);

    if (res.success) {
      setImportStatusMessage({
        type: 'success',
        message: `Saved ${res.count} question(s) to Server Vault! They are now active for paper generation and quizzes.`
      });
      setParsedQuestions([]);
      setImportRawText('');
      setImportFile(null);
      fetchServerCustomQuestions().then(qs => setServerCustomQuestions(qs));
    } else {
      setImportStatusMessage({
        type: 'error',
        message: res.error || 'Failed to save questions to server vault.'
      });
    }
  };

  const handleDeleteCustomQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom question from server vault?')) return;
    const ok = await deleteCustomQuestionFromServer(id);
    if (ok) {
      setServerCustomQuestions(prev => prev.filter(q => q.id !== id));
      setActionSuccess('Custom question deleted successfully from server vault.');
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const refreshSavedPapers = () => {
    setSavedPapers(getAllSavedPapers());
    syncSavedPapersWithServer().then(papers => setSavedPapers(papers)).catch(() => {});
  };

  const refreshGrammarResults = () => {
    setGrammarResults(getAllGrammarResults());
    syncGrammarResultsWithServer().then(results => setGrammarResults(results)).catch(() => {});
  };

  const handleRefreshFirestoreData = async () => {
    await refreshActivities();
    refreshSavedPapers();
    refreshGrammarResults();
    setActionSuccess('Firestore activity logs and database records successfully refreshed!');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleDeleteGrammarRecord = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteGrammarResult(code);
    refreshGrammarResults();
    if (selectedGrammarDetail?.code === code) {
      setSelectedGrammarDetail(null);
    }
    setActionSuccess(`Deleted Grammar test record with code ${code}`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleDeregisterStudent = async (user: User) => {
    if ((user.email && user.email.toLowerCase() === 'mukesh186000@gmail.com') || (user.name && user.name.toLowerCase().includes('super admin'))) {
      setActionSuccess('Primary Super Admin owner cannot be deregistered.');
      setTimeout(() => setActionSuccess(null), 3000);
      return;
    }
    const userDisplay = user.email || user.id || user.name;
    const userTargetKeys = [user.email, user.id, user.name].filter(Boolean).map(s => String(s).toLowerCase().trim());

    // Execute immediate deregister without blocking window.confirm (which gets blocked in browser iframes)
    await deregisterUser(user.email || user.id || user.name, user);

    // Also update local papers and grammar state for immediate UI feedback
    setSavedPapers(prev => prev.filter(p => {
      const pEmail = (p.generatedBy?.email || '').toLowerCase().trim();
      const pName = (p.generatedBy?.name || '').toLowerCase().trim();
      return !userTargetKeys.includes(pEmail) && !userTargetKeys.includes(pName);
    }));
    setGrammarResults(prev => prev.filter(g => {
      const gEmail = (g.userEmail || '').toLowerCase().trim();
      const gName = (g.userName || '').toLowerCase().trim();
      return !userTargetKeys.includes(gEmail) && !userTargetKeys.includes(gName);
    }));

    setActionSuccess(`Student "${user.name}" (${userDisplay}) permanently deleted / deregistered!`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const totalDownloads = downloadLogs.length;

  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeletePaper = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePaperFromRegistry(code);
    refreshSavedPapers();
    setActionSuccess(`Deleted paper with code ${code}`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminInput || !newAdminInput.includes('@')) return;
    addAdminEmail(newAdminInput.trim());
    setNewAdminInput('');
    setActionSuccess(`Added ${newAdminInput} to Super Admin roster.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleGrantVip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipEmailInput || !vipEmailInput.includes('@')) return;
    grantUnlimitedAccess(vipEmailInput.trim());
    const targetEmail = vipEmailInput.trim();
    setVipEmailInput('');
    setActionSuccess(`Granted Unlimited Papers & Downloads Access to ${targetEmail} (Student Access Only).`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleExportCSV = () => {
    if (downloadLogs.length === 0) return;
    const headers = ['Timestamp', 'User Email', 'User Name', 'Role', 'Subject', 'Paper Title', 'Paper Code'];
    const rows = downloadLogs.map(l => [
      `"${new Date(l.timestamp).toLocaleString()}"`,
      `"${l.userEmail}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.subject}"`,
      `"${l.paperTitle.replace(/"/g, '""')}"`,
      `"${l.paperCode || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ExamCraft_CBSE_Paper_Downloads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quota Drop Box Change Handler
  const handleQuotaChange = (userId: string, userName: string, valueStr: string) => {
    let newQuota = parseInt(valueStr, 10);
    if (valueStr === 'custom') {
      const customVal = prompt(`Enter custom daily paper limit for ${userName}:`, '10');
      if (customVal === null) return;
      const parsed = parseInt(customVal, 10);
      if (isNaN(parsed) || parsed < 0) {
        alert('Invalid limit entered.');
        return;
      }
      newQuota = parsed;
    } else if (valueStr === 'infinite') {
      newQuota = 999999;
    }

    updateUserQuota(userId, newQuota);
    const limitDisplay = newQuota >= 999999 || newQuota === -1 ? 'Infinite (असीमित)' : `${newQuota} Papers/day`;
    setActionSuccess(`Updated limit for ${userName} to ${limitDisplay}`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // User paper generation counts
  const userPaperStats = savedPapers.reduce((acc, paper) => {
    const rawEmail = paper.generatedBy?.email?.toLowerCase();
    const email = (!rawEmail || rawEmail === 'unknown@guest') ? 'guest@examcraft.internal' : rawEmail;
    const name = paper.generatedBy?.name || (email === 'guest@examcraft.internal' ? 'Guest User (Guest)' : 'Registered User');
    if (!acc[email]) {
      acc[email] = { name, email, count: 0, papers: [] };
    }
    acc[email].count += 1;
    acc[email].papers.push(paper);
    return acc;
  }, {} as Record<string, { name: string; email: string; count: number; papers: GeneratedPaper[] }>);

  // User Kids Grammar 5th-8th test generation and score stats
  const userGrammarStats = grammarResults.reduce((acc, result) => {
    const rawEmail = result.userEmail?.toLowerCase();
    const email = (!rawEmail || rawEmail === 'unknown@guest') ? 'guest@examcraft.internal' : rawEmail;
    const name = result.userName || (email === 'guest@examcraft.internal' ? 'Guest Student (Guest)' : 'Registered Student');

    if (!acc[email]) {
      acc[email] = {
        name,
        email,
        count: 0,
        totalScore: 0,
        totalMax: 0,
        highestPercentage: 0,
        results: []
      };
    }
    acc[email].count += 1;
    acc[email].totalScore += result.score;
    acc[email].totalMax += result.total;
    if (result.percentage > acc[email].highestPercentage) {
      acc[email].highestPercentage = result.percentage;
    }
    acc[email].results.push(result);
    return acc;
  }, {} as Record<string, {
    name: string;
    email: string;
    count: number;
    totalScore: number;
    totalMax: number;
    highestPercentage: number;
    results: SavedGrammarResult[];
  }>);

  const filteredGrammarResults = grammarResults.filter(res => {
    const rawEmail = res.userEmail?.toLowerCase();
    const userEmail = (!rawEmail || rawEmail === 'unknown@guest') ? 'guest@examcraft.internal' : rawEmail;
    const matchesUser = grammarUserFilter === 'all' || userEmail === grammarUserFilter;
    const matchesClass = grammarClassFilter === 'all' || res.classLevel === grammarClassFilter;
    const matchesTopic = grammarTopicFilter === 'all' || res.topic === grammarTopicFilter;
    const resDiff = res.difficulty || 'Medium';
    const matchesDifficulty = grammarDifficultyFilter === 'all' || resDiff === grammarDifficultyFilter;

    const matchesSearch =
      res.code.toLowerCase().includes(grammarSearch.toLowerCase()) ||
      res.topic.toLowerCase().includes(grammarSearch.toLowerCase()) ||
      (res.userEmail && res.userEmail.toLowerCase().includes(grammarSearch.toLowerCase())) ||
      (res.userName && res.userName.toLowerCase().includes(grammarSearch.toLowerCase()));

    return matchesUser && matchesClass && matchesTopic && matchesDifficulty && matchesSearch;
  });

  // Merge real-time snapshot users with AuthContext users for immediate multi-device visibility
  const effectiveAllUsers = React.useMemo(() => {
    const map = new Map<string, User>();
    realtimeUsers.forEach(u => {
      const key = (u.email || u.id || u.name || '').toLowerCase().trim();
      if (key) map.set(key, u);
    });
    allUsers.forEach(u => {
      const key = (u.email || u.id || u.name || '').toLowerCase().trim();
      if (key && !map.has(key)) map.set(key, u);
    });
    return Array.from(map.values());
  }, [realtimeUsers, allUsers]);

  // Merge real-time snapshot activities with hook activities
  const effectiveActivities = React.useMemo(() => {
    return mergeActivities(realtimeActivities, firestoreActivities);
  }, [realtimeActivities, firestoreActivities]);

  const GENERIC_RESERVED_TERMS = React.useMemo(() => new Set(['student', 'admin', 'user', 'guest', 'anonymous', 'null', 'undefined']), []);

  const validDeregisteredEmails = React.useMemo(() => {
    if (!deregisteredUserEmails) return [];
    return deregisteredUserEmails
      .map(e => e.toLowerCase().trim())
      .filter(e => e.length > 0 && !GENERIC_RESERVED_TERMS.has(e));
  }, [deregisteredUserEmails, GENERIC_RESERVED_TERMS]);

  // Helper to check if email/user/id is temporarily deregistered
  const isDeregisteredUser = (...keys: (string | undefined | null)[]) => {
    if (validDeregisteredEmails.length === 0) return false;
    const normSet = new Set(validDeregisteredEmails);
    return keys.some(k => {
      if (!k) return false;
      const norm = String(k).toLowerCase().trim();
      return norm.length > 0 && !GENERIC_RESERVED_TERMS.has(norm) && normSet.has(norm);
    });
  };

  // Build master unified user list by merging effectiveAllUsers, effectiveActivities, userPaperStats, userGrammarStats, downloadLogs
  const unifiedUserMap = new Map<string, User>();

  // 1. All Registered Users from Auth Context and Realtime Firestore Listener
  effectiveAllUsers.forEach(u => {
    if (isDeregisteredUser(u.email, u.id, u.name)) return;
    const emailKey = (u.email || u.id || u.name || '').toLowerCase().trim();
    if (emailKey) {
      unifiedUserMap.set(emailKey, { ...u });
    }
  });

  // 2. Firestore Live Activity Feed Students
  effectiveActivities.forEach(act => {
    if (isDeregisteredUser(act.studentEmail, act.studentId, act.studentName)) return;
    const emailKey = (act.studentEmail || act.studentId || act.studentName || '').toLowerCase().trim();
    if (!emailKey) return;
    if (!unifiedUserMap.has(emailKey)) {
      unifiedUserMap.set(emailKey, {
        id: act.studentId || `usr-fs-${emailKey}`,
        name: act.studentName || act.studentEmail || emailKey,
        email: act.studentEmail || emailKey,
        role: (act.studentEmail && (act.studentEmail.toLowerCase().includes('admin') || act.studentEmail.toLowerCase() === 'mukesh186000@gmail.com')) ? 'admin' : 'student',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
        dailyQuotaLimit: 5,
        dailyDownloadsUsed: 0,
        lastDownloadDate: new Date().toISOString().split('T')[0],
        totalDownloads: 0,
        createdAt: act.timestamp || new Date().toISOString()
      });
    }
  });

  // 3. User Paper Generation Stats
  Object.entries(userPaperStats).forEach(([emailKey, stat]) => {
    const normKey = emailKey.toLowerCase().trim();
    const statName = (stat as any)?.name;
    if (isDeregisteredUser(normKey, statName)) return;
    if (!unifiedUserMap.has(normKey)) {
      unifiedUserMap.set(normKey, {
        id: `usr-gen-${normKey}`,
        name: statName || normKey.split('@')[0],
        email: normKey,
        role: normKey === 'mukesh186000@gmail.com' ? 'admin' : 'student',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
        dailyQuotaLimit: 5,
        dailyDownloadsUsed: 0,
        lastDownloadDate: new Date().toISOString().split('T')[0],
        totalDownloads: 0,
        createdAt: new Date().toISOString()
      });
    }
  });

  // 4. User Test Submissions Stats
  Object.entries(userGrammarStats).forEach(([emailKey, stat]) => {
    const normKey = emailKey.toLowerCase().trim();
    const statName = (stat as any)?.name;
    if (isDeregisteredUser(normKey, statName)) return;
    if (!unifiedUserMap.has(normKey)) {
      unifiedUserMap.set(normKey, {
        id: `usr-tst-${normKey}`,
        name: statName || normKey.split('@')[0],
        email: normKey,
        role: normKey === 'mukesh186000@gmail.com' ? 'admin' : 'student',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
        dailyQuotaLimit: 5,
        dailyDownloadsUsed: 0,
        lastDownloadDate: new Date().toISOString().split('T')[0],
        totalDownloads: 0,
        createdAt: new Date().toISOString()
      });
    }
  });

  // 5. Download Logs
  downloadLogs.forEach(l => {
    if (isDeregisteredUser(l.userEmail, l.userName)) return;
    const emailKey = (l.userEmail || '').toLowerCase().trim();
    if (!emailKey) return;
    if (!emailKey || isDeregisteredUser(emailKey)) return;
    if (!unifiedUserMap.has(emailKey)) {
      unifiedUserMap.set(emailKey, {
        id: `usr-log-${emailKey}`,
        name: l.userName || emailKey.split('@')[0] || emailKey,
        email: l.userEmail || emailKey,
        role: l.userRole === 'admin' ? 'admin' : 'student',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
        dailyQuotaLimit: 5,
        dailyDownloadsUsed: 1,
        lastDownloadDate: new Date().toISOString().split('T')[0],
        totalDownloads: 1,
        createdAt: l.timestamp
      });
    }
  });

  const masterUsersList = Array.from(unifiedUserMap.values());
  const totalStudents = masterUsersList.filter(u => u.role === 'student').length;

  // Unique users list for Firestore Activity Logs dropdown filter
  const uniqueFirestoreUsers = React.useMemo(() => {
    const map = new Map<string, { id: string; email: string; name: string }>();
    effectiveActivities.forEach(act => {
      const key = (act.studentEmail || act.studentId || '').toLowerCase().trim();
      if (key && !map.has(key)) {
        map.set(key, {
          id: act.studentId || key,
          email: act.studentEmail || act.studentId || key,
          name: act.studentName || act.studentEmail || act.studentId || 'Student'
        });
      }
    });

    masterUsersList.forEach(u => {
      const key = (u.email || u.id || '').toLowerCase().trim();
      if (key && !map.has(key)) {
        map.set(key, {
          id: u.id,
          email: u.email,
          name: u.name
        });
      }
    });

    return Array.from(map.values());
  }, [effectiveActivities, masterUsersList]);

  // Unique users list for System Download Activity Logs dropdown filter
  const uniqueLogUsers = React.useMemo(() => {
    const map = new Map<string, { email: string; name: string }>();
    downloadLogs.forEach(l => {
      const email = l.userEmail || '';
      const key = email.toLowerCase().trim();
      if (key && !map.has(key)) {
        map.set(key, {
          email,
          name: l.userName || (email ? email.split('@')[0] : 'User')
        });
      }
    });

    masterUsersList.forEach(u => {
      const email = u.email || '';
      const key = email.toLowerCase().trim();
      if (key && !map.has(key)) {
        map.set(key, {
          email,
          name: u.name || email.split('@')[0] || 'User'
        });
      }
    });

    return Array.from(map.values());
  }, [downloadLogs, masterUsersList]);

  const filteredUsers = masterUsersList.filter(u =>
    (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredLogs = downloadLogs.filter(l => {
    const search = logSearch.toLowerCase();
    const matchesSearch =
      (l.paperTitle || '').toLowerCase().includes(search) ||
      (l.userEmail || '').toLowerCase().includes(search) ||
      (l.subject || '').toLowerCase().includes(search) ||
      (l.paperCode && l.paperCode.toLowerCase().includes(search));

    const userKey = logUserFilter.toLowerCase().trim();
    const matchesUser =
      logUserFilter === 'all' ||
      (l.userEmail || '').toLowerCase().trim() === userKey ||
      (l.userName && l.userName.toLowerCase().trim().includes(userKey));

    return matchesSearch && matchesUser;
  });

  const filteredFirestoreActivities = effectiveActivities.filter(act => {
    const search = firestoreSearch.toLowerCase();
    const matchesSearch =
      act.studentId.toLowerCase().includes(search) ||
      act.studentName.toLowerCase().includes(search) ||
      act.studentEmail.toLowerCase().includes(search) ||
      act.paperCode.toLowerCase().includes(search) ||
      act.paperTitle.toLowerCase().includes(search) ||
      act.subject.toLowerCase().includes(search);

    const matchesType = firestoreActivityFilter === 'all' || act.activityType === firestoreActivityFilter;

    const userKey = firestoreUserFilter.toLowerCase().trim();
    const matchesUser =
      firestoreUserFilter === 'all' ||
      act.studentEmail.toLowerCase().trim() === userKey ||
      act.studentId.toLowerCase().trim() === userKey ||
      act.studentName.toLowerCase().trim().includes(userKey);

    return matchesSearch && matchesType && matchesUser;
  });

  const availableSubjects = Array.from(
    new Set(
      savedPapers
        .map(p => {
          const name = p.subjectName || '';
          return name.replace(/Class\s*\d+/gi, '').replace(/CBSE/gi, '').trim() || name;
        })
        .filter(Boolean)
    )
  ).sort();

  const availableMarks = Array.from(
    new Set(savedPapers.map(p => Number(p.config.totalMarks || 80)))
  ).sort((a: number, b: number) => b - a);

  const filteredPapers = savedPapers.filter(paper => {
    const matchesSearch =
      paper.config.title.toLowerCase().includes(paperSearch.toLowerCase()) ||
      paper.subjectName.toLowerCase().includes(paperSearch.toLowerCase()) ||
      (paper.paperCode && paper.paperCode.toLowerCase().includes(paperSearch.toLowerCase())) ||
      (paper.generatedBy?.email && paper.generatedBy.email.toLowerCase().includes(paperSearch.toLowerCase())) ||
      (paper.generatedBy?.name && paper.generatedBy.name.toLowerCase().includes(paperSearch.toLowerCase()));

    const rawEmail = paper.generatedBy?.email?.toLowerCase();
    const paperUserEmail = (!rawEmail || rawEmail === 'unknown@guest') ? 'guest@examcraft.internal' : rawEmail;
    const matchesUser = paperUserFilter === 'all' || paperUserEmail === paperUserFilter;

    // Class Filter
    const fullText = `${paper.subjectName} ${paper.config.title || ''}`;
    const classMatch = fullText.match(/Class\s*(12|11|10|9|8|7|6|5|4|3)/i) || fullText.match(/\b(12|11|10|9|8|7|6|5|4|3)\b/);
    const paperClass = classMatch ? classMatch[1] : '';
    const matchesClass = paperClassFilter === 'all' || paperClass === paperClassFilter;

    // Subject Filter
    const cleanSub = paper.subjectName.replace(/Class\s*\d+/gi, '').replace(/CBSE/gi, '').trim();
    const matchesSubject =
      paperSubjectFilter === 'all' ||
      cleanSub.toLowerCase().includes(paperSubjectFilter.toLowerCase()) ||
      paper.subjectName.toLowerCase().includes(paperSubjectFilter.toLowerCase());

    // Marks Filter
    const paperMarks = String(paper.config.totalMarks || 80);
    const matchesMarks = paperMarksFilter === 'all' || paperMarks === paperMarksFilter;

    return matchesSearch && matchesUser && matchesClass && matchesSubject && matchesMarks;
  });

  // Question Bank Sets Handlers
  const handleQbFileUpload = async (file: File) => {
    if (!file) return;
    setQbFile(file);
    setQbFileName(file.name);
    setIsParsingQbFile(true);
    setQbStatusMsg({ type: 'success', message: `फाइल read हो रही है: ${file.name}...` });

    // Suggest clean title from file name if title is empty
    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    if (!qbTitleInput || qbTitleInput.trim() === '') {
      setQbTitleInput(cleanName);
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Str = e.target?.result as string;
      setQbFileBase64(base64Str);

      try {
        const fileContentBase64 = base64Str.split(',')[1] || base64Str;
        const res = await fetch('/api/parse-document-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: fileContentBase64,
            fileName: file.name,
            classLevel: qbClassInput,
            subjectName: qbSubjectInput
          })
        });

        const data = await res.json();
        setIsParsingQbFile(false);

        if (data.rawText || data.extractedText) {
          const text = data.rawText || data.extractedText || '';
          setQbRawContentInput(text);
          setQbStatusMsg({
            type: 'success',
            message: `फाइल (${file.name}) सफलता पूर्वक अपलोड हो गई एवं इसके प्रश्न एक्सट्रैक्ट हो गए!`
          });
        } else if (data.questions && Array.isArray(data.questions)) {
          const formatted = data.questions.map((q: any, i: number) => {
            let item = `Q${i+1}. ${q.questionText || q.question}`;
            if (q.options && Array.isArray(q.options)) {
              item += `\nOptions:\nA) ${q.options[0] || ''}\nB) ${q.options[1] || ''}\nC) ${q.options[2] || ''}\nD) ${q.options[3] || ''}`;
            }
            if (q.answer) item += `\nAnswer: ${q.answer}`;
            if (q.explanation) item += `\nExplanation: ${q.explanation}`;
            return item;
          }).join('\n\n');
          setQbRawContentInput(formatted);
          setQbStatusMsg({
            type: 'success',
            message: `फाइल (${file.name}) से ${data.questions.length} प्रश्न ऑटो-एक्सट्रैक्ट हो गए!`
          });
        } else {
          setQbStatusMsg({
            type: 'success',
            message: `फाइल (${file.name}) अटैच हो गई। अब आप विवरण या प्रश्न सेव कर सकते हैं।`
          });
        }
      } catch (err) {
        setIsParsingQbFile(false);
        setQbStatusMsg({
          type: 'success',
          message: `फाइल (${file.name}) अटैच हो गई।`
        });
      }
    };

    reader.onerror = () => {
      setIsParsingQbFile(false);
      setQbStatusMsg({ type: 'error', message: 'फाइल पढ़ने में समस्या आई।' });
    };

    reader.readAsDataURL(file);
  };

  const handleSaveQbSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qbTitleInput.trim()) {
      setQbStatusMsg({ type: 'error', message: 'कृपया प्रश्न पत्र सेट का शीर्षक (Title) लिखें।' });
      return;
    }
    setIsSavingQb(true);
    setQbStatusMsg(null);

    const newSet: Partial<QuestionBankSet> = {
      id: editingQbId || `qb-set-${Date.now()}`,
      title: qbTitleInput.trim(),
      classLevel: qbClassInput,
      subject: qbSubjectInput,
      totalMarks: Number(qbMarksInput) || 40,
      timeAllowed: qbTimeInput || '1 Hour',
      description: qbDescriptionInput.trim(),
      rawContent: qbRawContentInput.trim(),
      fileUrl: qbFileBase64 || undefined,
      createdBy: currentUser?.name || 'Mukesh (Admin)'
    };

    const saved = await saveQuestionBankSet(newSet);
    setIsSavingQb(false);

    if (saved) {
      setQbStatusMsg({ type: 'success', message: 'क्वेश्चन बैंक पेपर सेट सफलता पूर्वक सेव हो गया!' });
      setQuestionBankSets(prev => {
        const idx = prev.findIndex(s => s.id === saved.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [saved, ...prev];
      });
      setTimeout(() => {
        setShowQbModal(false);
        resetQbForm();
      }, 1000);
    } else {
      setQbStatusMsg({ type: 'error', message: 'पेपर सेट सेव करने में विफल रहा। कृपया पुन: प्रयास करें।' });
    }
  };

  const handleDeleteQbSet = async (id: string) => {
    if (!window.confirm('क्या आप इस क्वेश्चन बैंक प्रश्न पत्र सेट को हटाना चाहते हैं?')) return;
    const success = await deleteQuestionBankSet(id);
    if (success) {
      setQuestionBankSets(prev => prev.filter(s => s.id !== id));
      setActionSuccess('क्वेश्चन बैंक पेपर सेट सफलता पूर्वक हटा दिया गया!');
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const openEditQbSet = (setObj: QuestionBankSet) => {
    setEditingQbId(setObj.id);
    setQbTitleInput(setObj.title);
    setQbClassInput(setObj.classLevel || '10');
    setQbSubjectInput(setObj.subject || 'Science');
    setQbMarksInput(setObj.totalMarks || 40);
    setQbTimeInput(setObj.timeAllowed || '1 Hour');
    setQbDescriptionInput(setObj.description || '');
    setQbRawContentInput(setObj.rawContent || '');
    setQbFileBase64(setObj.fileUrl || '');
    setQbFileName(setObj.fileUrl ? 'Attached Document' : '');
    setQbStatusMsg(null);
    setShowQbModal(true);
  };

  const resetQbForm = () => {
    setEditingQbId(null);
    setQbTitleInput('');
    setQbClassInput('10');
    setQbSubjectInput('Science');
    setQbMarksInput(40);
    setQbTimeInput('1 Hour');
    setQbDescriptionInput('');
    setQbRawContentInput('');
    setQbFile(null);
    setQbFileBase64('');
    setQbFileName('');
    setIsParsingQbFile(false);
    setQbStatusMsg(null);
  };

  const filteredQbSets = questionBankSets.filter(setObj => {
    const query = qbSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      setObj.title.toLowerCase().includes(query) ||
      setObj.subject.toLowerCase().includes(query) ||
      (setObj.description && setObj.description.toLowerCase().includes(query)) ||
      (setObj.rawContent && setObj.rawContent.toLowerCase().includes(query));

    const matchesClass = qbClassFilter === 'all' || String(setObj.classLevel) === String(qbClassFilter);
    const matchesSubject = qbSubjectFilter === 'all' || setObj.subject.toLowerCase().includes(qbSubjectFilter.toLowerCase());
    const matchesMarks = qbMarksFilter === 'all' || String(setObj.totalMarks) === String(qbMarksFilter);

    return matchesSearch && matchesClass && matchesSubject && matchesMarks;
  });

  if (!isOpen) return null;

  // STRICT ADMIN AUTHORIZATION CHECK
  if (!currentUser || !isAdmin) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
        <div className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl text-white relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-rose-400">Access Restricted • केवल अधिकृत एडमिन</h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              यह एडमिन कंट्रोल पैनल केवल मुख्य स्वामी (<strong>mukesh186000@gmail.com</strong>) के लिए सुरक्षित है।
            </p>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-1.5 text-xs text-slate-400">
            <p className="text-slate-200 font-bold">How to Unlock Admin Panel:</p>
            <p>1. Log in with registered admin email <span className="text-amber-400 font-mono font-bold">mukesh186000@gmail.com</span>.</p>
            <p>2. Once verified, the Admin Panel opens automatically.</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-lg transition-all"
          >
            Close Restricted Window (बंद करें)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="admin-panel-modal"
      className="fixed inset-0 z-[99999] bg-stone-950 dark:bg-stone-950 text-stone-900 dark:text-stone-100 animate-in fade-in duration-150 flex flex-col w-full h-full min-h-[100dvh] overflow-hidden p-0 m-0"
    >
      <div className="bg-white dark:bg-stone-900 w-full h-full flex flex-col overflow-hidden border-0 shadow-none rounded-none flex-1">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-stone-900 text-amber-50 p-5 sm:p-6 flex items-center justify-between border-b border-amber-700/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-amber-500/20 border border-amber-400/40 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
              <Crown className="w-6 h-6 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">Master Admin Control Panel</h2>
                <span className="bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-full hidden sm:inline-block">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Logged in as: <span className="font-bold text-white">{currentUser?.email}</span> (प्रशासक नियंत्रण कक्ष)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-amber-200/80 hover:text-white bg-black/30 hover:bg-black/40 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 sm:px-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 overflow-x-auto gap-2 py-2.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('papers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'papers'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>Saved Papers ({savedPapers.length})</span>
            <span className="bg-amber-400 text-stone-900 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
              1-Click View
            </span>
          </button>

          <button
            onClick={() => setActiveTab('grammar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'grammar'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Kids Grammar 5th-8th ({grammarResults.length})</span>
            <span className="bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
              Userwise
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students & Limit Manager ({totalStudents})</span>
          </button>

          {validDeregisteredEmails.length > 0 && (
            <button
              onClick={() => setActiveTab('deregistered')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'deregistered'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              <UserX className="w-4 h-4 text-amber-400" />
              <span>Unregistered Students ({validDeregisteredEmails.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Downloads Log ({totalDownloads})</span>
          </button>

          <button
            onClick={() => setActiveTab('firestore')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'firestore'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Firestore Activity Logs ({effectiveActivities.length})</span>
            <span className="bg-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
              Firestore DB
            </span>
          </button>

          <button
            onClick={() => setActiveTab('importer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'importer'
                ? 'bg-sky-700 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Database className="w-4 h-4 text-sky-400" />
            <span>Import Questions ({serverCustomQuestions.length})</span>
            <span className="bg-sky-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
              PDF/Word/Text
            </span>
          </button>

          <button
            onClick={() => setActiveTab('questionBank')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'questionBank'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-300" />
            <span>Question Bank & Paper Sets ({questionBankSets.length})</span>
            <span className="bg-purple-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
              Classwise Set
            </span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'admins'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin Roster ({adminEmails.length})</span>
          </button>
        </div>

        {/* Action feedback banner */}
        {actionSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-6 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Tab Content Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => setActiveTab('papers')}
                  className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl cursor-pointer hover:border-amber-400 transition-all shadow-2xs"
                >
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                    Saved Papers in Control Panel
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-black text-amber-950 dark:text-amber-100">{savedPapers.length}</span>
                    <FileText className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400/80 mt-1 font-bold">1-Click Saved Paper View →</p>
                </div>

                <div
                  onClick={() => setActiveTab('users')}
                  className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-5 rounded-2xl cursor-pointer hover:border-emerald-400 transition-all shadow-2xs"
                >
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                    Total Registered Students
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-black text-emerald-950 dark:text-emerald-100">{totalStudents}</span>
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400/80 mt-1 font-bold">Manage Drop Box Limits →</p>
                </div>

                <div
                  onClick={() => setActiveTab('logs')}
                  className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-5 rounded-2xl cursor-pointer hover:border-blue-400 transition-all shadow-2xs"
                >
                  <span className="text-[11px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider block">
                    Total Download Logs
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-black text-blue-950 dark:text-blue-100">{totalDownloads}</span>
                    <Download className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400/80 mt-1">Live Download Logs & CSV Export</p>
                </div>

                <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 p-5 rounded-2xl">
                  <span className="text-[11px] font-bold text-purple-800 dark:text-purple-400 uppercase tracking-wider block">
                    Admin Privileges
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-black text-purple-950 dark:text-purple-100">Unlimited (∞)</span>
                    <Crown className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-[11px] text-purple-700 dark:text-purple-400/80 mt-1">Master Control Active</p>
                </div>
              </div>

              {/* Saved Papers Preview Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Saved Papers in Admin Panel ({savedPapers.length})</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('papers')}
                    className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>View All Saved Papers in 1-Click</span> →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedPapers.slice(0, 4).map((paper, idx) => (
                    <div
                      key={`admin-overview-paper-${paper.id}-${idx}`}
                      onClick={() => {
                        if (onSelectPaper) {
                          onSelectPaper(paper);
                          onClose();
                        }
                      }}
                      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                    >
                      <div>
                        <span className="font-mono text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-extrabold px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                          {paper.paperCode || 'CBSE-PAPER'}
                        </span>
                        <h5 className="text-xs font-bold text-stone-900 dark:text-white mt-1 group-hover:text-amber-600 transition-colors line-clamp-1">
                          {paper.config.title || paper.subjectName}
                        </h5>
                        <p className="text-[11px] text-stone-500 font-medium">
                          Generated by: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{paper.generatedBy?.name || 'Guest'}</span> ({paper.generatedBy?.email || 'N/A'})
                        </p>
                      </div>

                      <button
                        type="button"
                        className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 shrink-0 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>1-Click View</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAVED PAPERS (सुरक्षित पेपर) */}
          {activeTab === 'papers' && (
            <div className="space-y-6">
              {/* User Generation Stats Header */}
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 sm:p-5 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-600" />
                      Paper Generation Summary by User (किसने कितने पेपर बनाए)
                    </h3>
                    <p className="text-xs text-amber-800 dark:text-amber-300/80 mt-0.5">
                      एडमिन कंट्रोल पैनल में सुरक्षित सभी पेपर्स का पूरा रिकॉर्ड। किसी भी यूज़र पर क्लिक करके उनके पेपर्स फ़िल्टर करें।
                    </p>
                  </div>

                  <span className="bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-black text-xs px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700">
                    Total Saved: {savedPapers.length}
                  </span>
                </div>

                {/* User Cards / Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => setPaperUserFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      paperUserFilter === 'all'
                        ? 'bg-amber-700 text-white shadow-sm'
                        : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100'
                    }`}
                  >
                    <span>All Users ({savedPapers.length} Papers)</span>
                  </button>

                  {Object.values(userPaperStats).map((stat: { name: string; email: string; count: number; papers: GeneratedPaper[] }, idx: number) => (
                    <button
                      key={`user-stat-chip-${stat.email}-${idx}`}
                      onClick={() => setPaperUserFilter(stat.email)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        paperUserFilter === stat.email
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100'
                      }`}
                    >
                      <span className="font-semibold">{stat.name}:</span>
                      <span className="bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100 px-1.5 py-0.2 rounded font-black">
                        {stat.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Class, Subject & Marks Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-stone-100 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-700">
                {/* 1. Class Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 shrink-0">Class:</span>
                  <select
                    value={paperClassFilter}
                    onChange={e => setPaperClassFilter(e.target.value)}
                    className="flex-1 text-xs py-1.5 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-bold focus:outline-amber-600 cursor-pointer"
                  >
                    <option value="all">All Classes (सभी कक्षाएं)</option>
                    <option value="12">Class 12</option>
                    <option value="11">Class 11</option>
                    <option value="10">Class 10</option>
                    <option value="9">Class 9</option>
                    <option value="8">Class 8</option>
                    <option value="7">Class 7</option>
                    <option value="6">Class 6</option>
                    <option value="5">Class 5</option>
                    <option value="4">Class 4</option>
                    <option value="3">Class 3</option>
                  </select>
                </div>

                {/* 2. Subject Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 shrink-0">Subject:</span>
                  <select
                    value={paperSubjectFilter}
                    onChange={e => setPaperSubjectFilter(e.target.value)}
                    className="flex-1 text-xs py-1.5 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-bold focus:outline-amber-600 cursor-pointer"
                  >
                    <option value="all">All Subjects (सभी विषय)</option>
                    {availableSubjects.map((sub, idx) => (
                      <option key={`sub-opt-${idx}`} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Marks Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 shrink-0">Marks:</span>
                  <select
                    value={paperMarksFilter}
                    onChange={e => setPaperMarksFilter(e.target.value)}
                    className="flex-1 text-xs py-1.5 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-bold focus:outline-amber-600 cursor-pointer"
                  >
                    <option value="all">All Marks (सभी अंक)</option>
                    {availableMarks.map((m, idx) => (
                      <option key={`marks-opt-${idx}`} value={String(m)}>
                        {m} Marks
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Bar for Saved Papers */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    value={paperSearch}
                    onChange={e => setPaperSearch(e.target.value)}
                    placeholder="Search paper by title, code, subject, or creator..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-amber-600"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {(paperClassFilter !== 'all' || paperSubjectFilter !== 'all' || paperMarksFilter !== 'all' || paperUserFilter !== 'all' || paperSearch !== '') && (
                    <button
                      onClick={() => {
                        setPaperClassFilter('all');
                        setPaperSubjectFilter('all');
                        setPaperMarksFilter('all');
                        setPaperUserFilter('all');
                        setPaperSearch('');
                      }}
                      className="text-xs text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                  <span className="text-xs text-stone-500 font-medium">
                    Showing {filteredPapers.length} of {savedPapers.length} papers
                  </span>
                </div>
              </div>

              {/* Saved Papers Table & Mobile Cards */}
              {/* 1. Mobile Cards Layout (visible on small mobile screens) */}
              <div className="block sm:hidden space-y-3">
                {filteredPapers.map((paper, idx) => {
                  const code = paper.paperCode || paper.config.examCode || paper.id;
                  return (
                    <div
                      key={`admin-paper-card-mobile-${paper.id}-${idx}`}
                      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-2.5">
                        <button
                          onClick={(e) => handleCopyCode(code, e)}
                          className="font-mono text-[11px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800 font-extrabold flex items-center gap-1"
                        >
                          <span>{code}</span>
                          {copiedCode === code ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-amber-700" />
                          )}
                        </button>

                        <span className="text-[11px] text-stone-500 font-medium">
                          {new Date(paper.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-stone-900 dark:text-white text-sm">
                          {paper.config.title || paper.subjectName}
                        </h4>
                        <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold mt-0.5">
                          {paper.subjectName} • {paper.config.totalMarks || 80} Marks • {paper.config.durationMinutes || 180} Mins
                        </p>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Generated by: <span className="font-bold text-emerald-800 dark:text-emerald-300">{paper.generatedBy?.name || 'Guest User'}</span> ({paper.generatedBy?.email || 'N/A'})
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            if (onSelectPaper) {
                              onSelectPaper(paper);
                              onClose();
                            }
                          }}
                          className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
                        >
                          <Eye className="w-4 h-4 text-amber-200" />
                          <span>👁️ View Paper (पेपर देखें)</span>
                        </button>

                        <button
                          onClick={(e) => handleDeletePaper(code, e)}
                          className="p-2.5 text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl border border-stone-200 dark:border-stone-800 transition-colors"
                          title="Delete Paper"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredPapers.length === 0 && (
                  <div className="bg-white dark:bg-stone-900 p-8 rounded-2xl text-center text-stone-500 border border-stone-200 dark:border-stone-800 text-xs">
                    No saved papers found matching your search or user filter.
                  </div>
                )}
              </div>

              {/* 2. Desktop & Tablet Table Layout (hidden on small mobile screens, horizontally scrollable) */}
              <div className="hidden sm:block bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-stone-700 font-bold">
                    <tr>
                      <th className="p-3.5">Date Created</th>
                      <th className="p-3.5">Paper Code</th>
                      <th className="p-3.5">Paper Title & Subject</th>
                      <th className="p-3.5">Generated By (User)</th>
                      <th className="p-3.5 text-right">1-Click View Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {filteredPapers.map((paper, idx) => {
                      const code = paper.paperCode || paper.config.examCode || paper.id;
                      return (
                        <tr key={`admin-paper-row-${paper.id}-${idx}`} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors">
                          <td className="p-3.5 text-stone-500 whitespace-nowrap font-medium">
                            {new Date(paper.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <button
                              onClick={(e) => handleCopyCode(code, e)}
                              className="font-mono text-[11px] bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-2 py-1 rounded border border-amber-300 dark:border-amber-800 font-extrabold flex items-center gap-1 transition-colors"
                              title="Click to copy code"
                            >
                              <span>{code}</span>
                              {copiedCode === code ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-amber-700" />
                              )}
                            </button>
                          </td>

                          <td
                            className="p-3.5 cursor-pointer group"
                            onClick={() => {
                              if (onSelectPaper) {
                                onSelectPaper(paper);
                                onClose();
                              }
                            }}
                          >
                            <div className="font-bold text-stone-900 dark:text-white line-clamp-1 group-hover:text-amber-700 transition-colors flex items-center gap-1">
                              <span>{paper.config.title || paper.subjectName}</span>
                              <Eye className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            </div>
                            <div className="text-[11px] text-stone-500 font-medium">
                              {paper.subjectName} • {paper.config.totalMarks || 80} Marks • {paper.config.durationMinutes || 180} Mins
                            </div>
                          </td>

                          <td className="p-3.5">
                            {paper.generatedBy ? (
                              <div>
                                <div className="font-bold text-emerald-800 dark:text-emerald-300">{paper.generatedBy.name}</div>
                                <div className="text-[11px] text-stone-500">{paper.generatedBy.email}</div>
                              </div>
                            ) : (
                              <span className="text-stone-400 italic">Guest User</span>
                            )}
                          </td>

                          <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => {
                                if (onSelectPaper) {
                                  onSelectPaper(paper);
                                  onClose();
                                }
                              }}
                              className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                              title="Open & Preview complete paper in 1 click"
                            >
                              <Eye className="w-4 h-4 text-amber-200" />
                              <span>👁️ View Paper (पेपर देखें)</span>
                            </button>

                            <button
                              onClick={(e) => handleDeletePaper(code, e)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors inline-block"
                              title="Delete Paper"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredPapers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-stone-500">
                          No saved papers found matching your search or user filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: STUDENTS & QUOTA DROP BOX MANAGER */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* PRIMARY OWNER UNLIMITED VIP GRANT CARD */}
              <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-stone-900 text-white p-5 rounded-2xl border border-amber-700 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-700/60 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-amber-200 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Primary Owner Power: Unlimited Paper Generation & Download VIP Grant
                    </h3>
                    <p className="text-xs text-amber-100/80 mt-0.5">
                      किसी भी यूज़र की ईमेल दर्ज करके उसे असीमित पेपर बनाने व डाउनलोड करने की छूट दें। (केवल असीमित जनरेशन की छूट - एडमिन पैनल अधिकार नहीं दिया जाएगा)।
                    </p>
                  </div>
                  <span className="bg-amber-400/20 text-amber-200 border border-amber-300/40 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shrink-0">
                    VIP Unlimited Granted
                  </span>
                </div>

                {/* VIP Email Input Form */}
                <form onSubmit={handleGrantVip} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={vipEmailInput}
                    onChange={e => setVipEmailInput(e.target.value)}
                    placeholder="Enter student / user email (e.g. rahul@gmail.com)..."
                    className="flex-1 text-xs p-3 rounded-xl border border-amber-600/80 bg-stone-900/90 text-white focus:outline-amber-400 placeholder:text-stone-400"
                  />
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-black px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <Zap className="w-4 h-4 fill-amber-950" />
                    <span>Grant Unlimited Access (असीमित पावर दें)</span>
                  </button>
                </form>

                {/* List of Users with Granted Unlimited VIP Access */}
                {unlimitedVipEmails.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider block">
                      Users Granted Unlimited Papers & Downloads Access ({unlimitedVipEmails.length}):
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {unlimitedVipEmails.map((vipEmail, idx) => (
                        <div
                          key={`vip-chip-${vipEmail}-${idx}`}
                          className="bg-amber-950/80 border border-amber-600/60 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 font-bold text-amber-200 shadow-2xs"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{vipEmail}</span>
                          <span className="text-[10px] text-emerald-400 font-extrabold">∞ Unlimited</span>
                          <button
                            type="button"
                            onClick={() => {
                              revokeUnlimitedAccess(vipEmail);
                              setActionSuccess(`Revoked Unlimited VIP Access for ${vipEmail}`);
                              setTimeout(() => setActionSuccess(null), 3000);
                            }}
                            className="text-amber-400 hover:text-red-400 hover:bg-red-950/60 p-1 rounded transition-colors cursor-pointer ml-1"
                            title="Revoke Unlimited Access"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
                    Student Quota & Paper Limit Drop Box Manager (ड्रॉप बॉक्स से लिमिट सेट करें)
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300/80 mt-0.5">
                    ड्रॉप बॉक्स से किसी भी यूज़र को दैनिक पेपर्स की असीमित (Infinite) या कोई भी पसंदीदा लिमिट तुरंत दें।
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  {validDeregisteredEmails.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('deregistered')}
                      className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <UserX className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Unregistered Students ({validDeregisteredEmails.length})</span>
                    </button>
                  )}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Search students by name or email..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-stone-700 font-bold">
                    <tr>
                      <th className="p-3.5">User Profile</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Today's Downloads</th>
                      <th className="p-3.5">Generated Papers</th>
                      <th className="p-3.5">5th-8th & Board Tests</th>
                      <th className="p-3.5">Current Daily Limit</th>
                      <th className="p-3.5 text-right">Set Limit (Drop Box)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {filteredUsers.map((user, idx) => {
                      const isAdm = user.role === 'admin';
                      const isInfinite = user.dailyQuotaLimit >= 999999 || user.dailyQuotaLimit === -1;
                      const uEmailKey = (user.email || user.id || user.name || '').toLowerCase().trim();
                      const userGenCount = userPaperStats[uEmailKey]?.count || 0;
                      const userTestStats = userGrammarStats[uEmailKey];
                      const userTestCount = userTestStats?.count || 0;
                      const userHighPct = userTestStats?.highestPercentage || 0;

                      return (
                        <tr key={`admin-user-row-${user.id}-${idx}`} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                          <td className="p-3.5">
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5">
                                {user.photoURL ? (
                                  <img
                                    src={user.photoURL}
                                    alt={user.name}
                                    referrerPolicy="no-referrer"
                                    className="w-8 h-8 rounded-full border border-stone-300 dark:border-stone-700 object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                                    {user.name}
                                    {isAdm && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                  </div>
                                  <div className="text-[11px] text-stone-500">{user.email || user.id}</div>
                                </div>
                              </div>
                              {(user.email?.toLowerCase().trim() !== 'mukesh186000@gmail.com') && (
                                <button
                                  type="button"
                                  onClick={() => handleDeregisterStudent(user)}
                                  className="bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded-lg border border-red-300 dark:border-red-800 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
                                  title="Quick Deregister / Delete User"
                                >
                                  <UserX className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                  <span className="hidden sm:inline">Delete</span>
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isAdm
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-bold text-stone-800 dark:text-stone-200">
                              {user.dailyDownloadsUsed} papers
                            </span>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            {userGenCount > 0 ? (
                              <button
                                onClick={() => {
                                  setPaperUserFilter(user.email);
                                  setActiveTab('papers');
                                }}
                                className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                                title="Click to view papers generated by this user"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                                <span>{userGenCount} Papers (View All)</span>
                              </button>
                            ) : (
                              <span className="text-stone-400 font-medium">0 papers</span>
                            )}
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            {userTestCount > 0 ? (
                              <button
                                onClick={() => {
                                  setGrammarUserFilter(user.email);
                                  setActiveTab('grammar');
                                }}
                                className="bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                                title="Click to view test records for this student"
                              >
                                <GraduationCap className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                                <span>{userTestCount} Tests ({userHighPct}% High)</span>
                              </button>
                            ) : (
                              <span className="text-stone-400 font-medium">0 tests</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {isAdm || isInfinite ? (
                              <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[11px] font-extrabold px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-600" />
                                <span>Infinite (असीमित)</span>
                              </span>
                            ) : (
                              <span className="bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-lg font-mono font-bold text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                                {user.dailyQuotaLimit || 5} Papers / Day
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            {!isAdm ? (
                              <div className="inline-flex items-center gap-2">
                                {/* Drop Box Selector for Setting Limit */}
                                <select
                                  value={isInfinite ? 'infinite' : user.dailyQuotaLimit?.toString() || '5'}
                                  onChange={e => handleQuotaChange(user.id, user.name, e.target.value)}
                                  className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold px-3 py-1.5 cursor-pointer focus:outline-amber-600"
                                >
                                  <option value="5">5 Papers/Day (Standard)</option>
                                  <option value="10">10 Papers/Day</option>
                                  <option value="15">15 Papers/Day</option>
                                  <option value="25">25 Papers/Day</option>
                                  <option value="50">50 Papers/Day</option>
                                  <option value="100">100 Papers/Day</option>
                                  <option value="infinite">Infinite / Unlimited (असीमित)</option>
                                  <option value="custom">Set Custom Number...</option>
                                </select>

                                {/* Deregister Student Button */}
                                <button
                                  type="button"
                                  onClick={() => handleDeregisterStudent(user)}
                                  className="bg-red-50 hover:bg-red-100 dark:bg-red-950/80 hover:dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 rounded-xl text-xs font-bold px-2.5 py-1.5 flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
                                  title="Deregister Student (अकाउंट डिलीट करें)"
                                >
                                  <UserX className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                  <span>Deregister (हटाएं)</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold italic">Super Admin Owner</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 10: TEMPORARILY DEREGISTERED / UNREGISTERED STUDENTS */}
          {activeTab === 'deregistered' && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-stone-900 border-2 border-amber-300 dark:border-amber-800 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-sm sm:text-base uppercase tracking-wider">
                      <UserX className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <span>Temporarily Deregistered / Unregistered Students ({validDeregisteredEmails.length})</span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                      यह वो छात्र हैं जिन्हें एडमिन पैनल से अस्थाई रूप से अनरजिस्टर्ड किया गया है। आप इन्हें यहाँ से 1-क्लिक में रिस्टोर (Restore) कर सकते हैं।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className="bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-stone-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
                  >
                    ← Back to Active Students
                  </button>
                </div>

                {validDeregisteredEmails.length === 0 ? (
                  <div className="text-center py-8 text-stone-500 dark:text-stone-400 text-xs font-semibold">
                    No temporarily unregistered students found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {validDeregisteredEmails.map((email, idx) => (
                      <div
                        key={`dereg-tab-student-${email}-${idx}`}
                        className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-800 border border-amber-200 dark:border-amber-900/60 shadow-xs gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-extrabold text-stone-800 dark:text-stone-200 truncate block">
                            {email}
                          </span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                            Temporarily Unregistered
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await reRegisterUser(email);
                            alert(`Student ${email} restored & re-registered!`);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl shrink-0 cursor-pointer shadow-xs transition-all active:scale-95 flex items-center gap-1"
                        >
                          <span>Restore Student</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DOWNLOAD LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1 w-full sm:w-auto">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                    <input
                      type="text"
                      value={logSearch}
                      onChange={e => setLogSearch(e.target.value)}
                      placeholder="Search logs by paper, subject or email..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-amber-600"
                    />
                  </div>

                  {/* User Filter Dropdown for Download Logs */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold">
                    <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-stone-600 dark:text-stone-400 shrink-0">User:</span>
                    <select
                      value={logUserFilter}
                      onChange={e => setLogUserFilter(e.target.value)}
                      className="bg-transparent outline-none cursor-pointer max-w-[180px] truncate text-stone-800 dark:text-stone-200"
                    >
                      <option value="all">All Users ({uniqueLogUsers.length})</option>
                      {uniqueLogUsers.map((u, i) => (
                        <option key={`log-usr-opt-${u.email}-${i}`} value={u.email}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export CSV Spreadsheet</span>
                  </button>

                  <button
                    onClick={clearDownloadLogs}
                    className="flex items-center gap-1.5 bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 border border-stone-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Logs</span>
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-stone-700 font-bold">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Subject</th>
                      <th className="p-3.5">Paper Title</th>
                      <th className="p-3.5">Exam Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {filteredLogs.map((log, idx) => (
                      <tr key={`admin-log-row-${log.id}-${idx}`} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                        <td className="p-3.5 text-stone-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-stone-900 dark:text-white">{log.userName}</div>
                          <div className="text-[11px] text-stone-500">{log.userEmail}</div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              log.userRole === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {log.userRole}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium text-stone-800 dark:text-stone-200">{log.subject}</td>
                        <td className="p-3.5 font-medium text-stone-800 dark:text-stone-200">{log.paperTitle}</td>
                        <td className="p-3.5">
                          {log.paperCode ? (
                            <button
                              onClick={(e) => handleCopyCode(log.paperCode!, e)}
                              className="inline-flex items-center gap-1 font-mono text-[11px] bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2 py-1 rounded border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                              title="Click to copy Paper Code"
                            >
                              <span>{log.paperCode}</span>
                              {copiedCode === log.paperCode ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                              )}
                            </button>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-stone-500">
                          No matching download logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ADMIN ROSTER */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl">
                <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider mb-1">
                  Manage Super Admin Emails (सह-प्रशासक सूची)
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300/80">
                  Any email in this list automatically inherits full Admin Master Privileges (Zero download limits & access to this panel).
                </p>
              </div>

              {/* Add New Admin Input */}
              {isPrimaryOwner ? (
                <form onSubmit={handleAddAdmin} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newAdminInput}
                    onChange={e => setNewAdminInput(e.target.value)}
                    placeholder="Enter teacher/admin email (e.g. admin@example.com)..."
                    className="flex-1 text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-amber-600"
                  />
                  <button
                    type="submit"
                    className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Admin</span>
                  </button>
                </form>
              ) : (
                <p className="text-xs text-stone-500 italic bg-stone-100 dark:bg-stone-800 p-3 rounded-xl">
                  🔒 Only the Primary Owner (mukesh186000@gmail.com) can grant or revoke admin permissions.
                </p>
              )}

              {/* List of Admins */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl divide-y divide-stone-100 dark:divide-stone-800">
                {adminEmails.map((email, idx) => {
                  const isPrimary = email.toLowerCase() === 'mukesh186000@gmail.com';
                  return (
                    <div key={`admin-email-row-${email}-${idx}`} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                          <Crown className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-900 dark:text-white">
                            {email} {isPrimary && <span className="text-amber-600 font-extrabold">(Primary Owner)</span>}
                          </p>
                          <p className="text-[10px] text-stone-500">Super Administrator • Full Master Privileges</p>
                        </div>
                      </div>

                      {!isPrimary && isPrimaryOwner ? (
                        <button
                          onClick={() => {
                            removeAdminEmail(email);
                            setActionSuccess(`Removed ${email} from admin list.`);
                            setTimeout(() => setActionSuccess(null), 3000);
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : isPrimary ? (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                          Root Owner
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: KIDS GRAMMAR 5TH - 8TH (यूज़र वाइज़ रिकॉर्ड) */}
          {activeTab === 'grammar' && (
            <div className="space-y-6">
              {/* Header & Userwise Summary Bar */}
              <div className="bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-stone-900 text-white p-5 rounded-2xl border border-emerald-700/50 space-y-3 shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-emerald-400" />
                      Kids English Grammar Test & Score Registry (Class 4th - 8th)
                    </h3>
                    <p className="text-xs text-emerald-100/80 mt-1">
                      छात्रवार (Userwise) रिकॉर्ड - जानें किस छात्र ने कितने 4th to 8th ग्रामर टेस्ट्स दिए और क्या स्कोर पाया।
                    </p>
                  </div>

                  <span className="bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-black text-xs px-3 py-1 rounded-full shrink-0">
                    Total Tests Saved: {grammarResults.length}
                  </span>
                </div>

                {/* User Filter Chips */}
                <div className="space-y-1.5 pt-2 border-t border-emerald-800/60">
                  <span className="text-[11px] font-bold text-emerald-200/90 uppercase tracking-wider block">
                    Filter by Student (छात्र के अनुसार फ़िल्टर करें):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setGrammarUserFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        grammarUserFilter === 'all'
                          ? 'bg-emerald-400 text-stone-950 font-black shadow-sm'
                          : 'bg-stone-900/80 text-emerald-100 border border-emerald-700/60 hover:bg-emerald-900/40'
                      }`}
                    >
                      <span>All Students ({grammarResults.length} Tests)</span>
                    </button>

                    {(Object.values(userGrammarStats) as UserGrammarStat[]).map((stat, idx) => {
                      const avgPct = stat.count > 0 ? Math.round((stat.totalScore / stat.totalMax) * 100) : 0;
                      return (
                        <button
                          key={`grammar-user-chip-${stat.email}-${idx}`}
                          onClick={() => setGrammarUserFilter(stat.email)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            grammarUserFilter === stat.email
                              ? 'bg-emerald-400 text-stone-950 font-black shadow-sm'
                              : 'bg-stone-900/80 text-emerald-100 border border-emerald-700/60 hover:bg-emerald-900/40'
                          }`}
                        >
                          <span>{stat.name}:</span>
                          <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded text-[10px] font-black border border-emerald-700">
                            {stat.count} Tests ({avgPct}% Avg)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Class, Topic, Difficulty & Search Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-stone-100 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-700">
                {/* 1. Class Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 shrink-0">Class:</span>
                  <select
                    value={grammarClassFilter}
                    onChange={e => setGrammarClassFilter(e.target.value)}
                    className="flex-1 text-xs py-1.5 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-bold focus:outline-emerald-600 cursor-pointer"
                  >
                    <option value="all">All Classes (3rd - 8th)</option>
                    <option value="3">Class 3rd</option>
                    <option value="4">Class 4th</option>
                    <option value="5">Class 5th</option>
                    <option value="6">Class 6th</option>
                    <option value="7">Class 7th</option>
                    <option value="8">Class 8th</option>
                  </select>
                </div>

                {/* 2. Topic Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 shrink-0">Topic:</span>
                  <select
                    value={grammarTopicFilter}
                    onChange={e => setGrammarTopicFilter(e.target.value)}
                    className="flex-1 text-xs py-1.5 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-bold focus:outline-emerald-600 cursor-pointer"
                  >
                    <option value="all">All Grammar Topics</option>
                    {GRAMMAR_TOPICS.filter(t => t !== 'All Topics (Mixed Test)').map((topic, idx) => (
                      <option key={`g-topic-opt-${idx}`} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Difficulty Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 shrink-0">Level:</span>
                  <select
                    value={grammarDifficultyFilter}
                    onChange={e => setGrammarDifficultyFilter(e.target.value)}
                    className="flex-1 text-xs py-1.5 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-bold focus:outline-emerald-600 cursor-pointer"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="Easy">Easy Level</option>
                    <option value="Medium">Medium Level</option>
                    <option value="Hard">Hard Level</option>
                  </select>
                </div>

                {/* 4. Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={grammarSearch}
                    onChange={e => setGrammarSearch(e.target.value)}
                    placeholder="Search by Code, Student, Topic..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* Test Cards List */}
              {filteredGrammarResults.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 space-y-2">
                  <GraduationCap className="w-10 h-10 text-stone-400 mx-auto opacity-50" />
                  <p className="text-sm font-bold text-stone-600 dark:text-stone-400">No Kids Grammar Test records found.</p>
                  <p className="text-xs text-stone-500">
                    When students generate and take Kids Grammar (Class 4th to 8th) tests, their results will automatically appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredGrammarResults.map((result, idx) => {
                    const isPass = result.percentage >= 70;
                    const isMid = result.percentage >= 50 && result.percentage < 70;
                    return (
                      <div
                        key={`g-res-card-${result.code}-${idx}`}
                        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-500 transition-all rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-2xs group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-black px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
                                {result.code}
                              </span>
                              <span className="text-[10px] font-extrabold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded uppercase">
                                Class {result.classLevel}th
                              </span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                result.difficulty === 'Easy'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : result.difficulty === 'Hard'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}>
                                {result.difficulty || 'Medium'}
                              </span>
                            </div>

                            {/* Score Badge */}
                            <div
                              className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 ${
                                isPass
                                  ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                                  : isMid
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                                  : 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                              }`}
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>{result.score} / {result.total} ({result.percentage}%)</span>
                            </div>
                          </div>

                          <h4 className="text-sm font-bold text-stone-900 dark:text-white mt-2 group-hover:text-emerald-600 transition-colors line-clamp-1">
                            {result.topic}
                          </h4>

                          <div className="mt-2 text-xs space-y-1 text-stone-600 dark:text-stone-400">
                            <p className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                Student: <strong className="text-stone-900 dark:text-stone-200">{result.userName || 'Guest Student'}</strong> ({result.userEmail || 'guest@examcraft.internal'})
                              </span>
                            </p>
                            <p className="flex items-center gap-1.5 text-[11px] text-stone-500">
                              <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span>Attempted on {result.date} • Duration: {result.timeTakenSeconds || 0}s</span>
                            </p>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                          <button
                            type="button"
                            onClick={() => setSelectedGrammarDetail(result)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>1-Click View Full Paper</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteGrammarRecord(result.code, e)}
                            className="text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 p-2 rounded-xl transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: FIRESTORE ACTIVITY LOGS */}
          {activeTab === 'firestore' && (
            <div className="space-y-6">
              {/* Firestore Connection Banner & Live Sync Status */}
              <div className="bg-gradient-to-r from-orange-950/80 via-amber-950/60 to-stone-900 border border-orange-600/40 rounded-2xl p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500/20 border border-orange-400/40 rounded-2xl flex items-center justify-center shrink-0">
                    <Flame className="w-7 h-7 text-orange-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black tracking-tight text-white">Firebase Firestore Database Logs</h3>
                      <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Live Firestore Sync Active
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 mt-1">
                      Real-time activity mapping: Unique Student IDs → Generated Paper IDs & Quiz Scores
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRefreshFirestoreData}
                  disabled={isFirestoreRefreshing || isFirestoreLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isFirestoreRefreshing || isFirestoreLoading ? 'animate-spin' : ''}`} />
                  <span>{isFirestoreRefreshing ? 'Refreshing...' : 'Refresh Firestore Data'}</span>
                </button>
              </div>

              {/* Firestore Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-4 rounded-2xl">
                  <span className="text-[11px] font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider block">
                    Total Logged Activities
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-black text-orange-950 dark:text-orange-100">{effectiveActivities.length}</span>
                    <Database className="w-6 h-6 text-orange-600" />
                  </div>
                </div>

                <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                    Generated Paper Logs
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-black text-amber-950 dark:text-amber-100">
                      {effectiveActivities.filter(a => a.activityType === 'paper_generated').length}
                    </span>
                    <FileText className="w-6 h-6 text-amber-600" />
                  </div>
                </div>

                <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                    Quiz Test Submissions
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-black text-emerald-950 dark:text-emerald-100">
                      {effectiveActivities.filter(a => a.activityType === 'quiz_submitted').length}
                    </span>
                    <Award className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={firestoreSearch}
                    onChange={(e) => setFirestoreSearch(e.target.value)}
                    placeholder="Search by Student ID, Student Email, Paper ID, Code, Subject..."
                    className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* User / Student Filter Dropdown */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-2.5 py-1.5">
                    <Users className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="text-xs font-bold text-stone-600 dark:text-stone-400 shrink-0">User / Student:</span>
                    <select
                      value={firestoreUserFilter}
                      onChange={(e) => setFirestoreUserFilter(e.target.value)}
                      className="bg-transparent text-xs font-bold outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate text-stone-800 dark:text-stone-200"
                    >
                      <option value="all">All Users ({uniqueFirestoreUsers.length})</option>
                      {uniqueFirestoreUsers.map((usr) => (
                        <option key={`fs-usr-opt-${usr.id || usr.email}`} value={usr.email || usr.id}>
                          {usr.name} ({usr.email || usr.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Activity Type Dropdown */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-2.5 py-1.5">
                    <Filter className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span className="text-xs font-bold text-stone-600 dark:text-stone-400 shrink-0">Type:</span>
                    <select
                      value={firestoreActivityFilter}
                      onChange={(e) => setFirestoreActivityFilter(e.target.value as any)}
                      className="bg-transparent text-xs font-bold outline-none cursor-pointer text-stone-800 dark:text-stone-200"
                    >
                      <option value="all">All Activities</option>
                      <option value="paper_generated">Paper Generations</option>
                      <option value="quiz_submitted">Quiz Submissions</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Firestore Activity Records Table / Cards */}
              {isFirestoreLoading ? (
                <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
                  <p className="text-sm font-bold">Fetching real-time activity logs from Firebase Firestore...</p>
                </div>
              ) : filteredFirestoreActivities.length === 0 ? (
                <div className="p-12 text-center text-stone-500 border border-dashed border-stone-300 dark:border-stone-800 rounded-3xl">
                  <Database className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">No Firestore activity records found</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                    Try changing the selected user or filter, or generate papers/submit quizzes to populate live logs in Firestore.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFirestoreActivities.map((activity, idx) => (
                    <div
                      key={activity.id || `act-${idx}`}
                      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 hover:border-orange-300 dark:hover:border-orange-800 transition-all shadow-2xs flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-[280px]">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          activity.activityType === 'quiz_submitted'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-600 border border-amber-300 dark:border-amber-800'
                        }`}>
                          {activity.activityType === 'quiz_submitted' ? (
                            <Award className="w-5 h-5" />
                          ) : (
                            <FileText className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-900 dark:text-stone-100">
                              Student ID: {activity.studentId}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              activity.activityType === 'quiz_submitted'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-amber-500 text-white'
                            }`}>
                              {activity.activityType === 'quiz_submitted' ? 'Quiz Submitted' : 'Paper Generated'}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-1">
                            {activity.studentName} ({activity.studentEmail})
                          </h4>
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                            {activity.subject} • Class {activity.classLevel}th • Paper Title: <span className="font-semibold text-stone-700 dark:text-stone-300">{activity.paperTitle}</span>
                          </p>
                        </div>
                      </div>

                      {/* Paper ID & Quiz Score Mapping Details */}
                      <div className="flex items-center gap-4">
                        <div className="bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-right">
                          <span className="text-[10px] font-black text-stone-400 uppercase block">Mapped Paper ID / Code</span>
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                            {activity.paperCode || activity.paperId}
                          </span>
                        </div>

                        {activity.activityType === 'quiz_submitted' && activity.score !== undefined && (
                          <div className="bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-right">
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase block">Test Score</span>
                            <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                              {activity.score} / {activity.totalMarks || 0} ({activity.percentage || 0}%)
                            </span>
                          </div>
                        )}

                        <div className="text-right text-[11px] text-stone-400">
                          <p>{new Date(activity.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p>{new Date(activity.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: QUESTION IMPORTER (PDF / WORD / TEXT) */}
          {activeTab === 'importer' && (
            <div className="space-y-6">
              {/* Header card */}
              <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-stone-900 text-white p-6 rounded-3xl shadow-md border border-sky-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0">
                    <Database className="w-6 h-6 text-sky-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                      Admin Question Vault & AI File Importer
                      <span className="bg-sky-400 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        Class 3rd to 12th
                      </span>
                    </h3>
                    <p className="text-xs text-sky-200/80 mt-1 max-w-xl">
                      Upload PDF, Word (.docx), or paste raw text. AI will automatically parse, classify into MCQs, Short & Long questions, and permanently store them on the server vault for paper generation.
                    </p>
                  </div>
                </div>

                <div className="bg-sky-950/80 border border-sky-600/40 px-4 py-2.5 rounded-2xl text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 block">Server Vault Count</span>
                  <span className="text-xl font-black text-white">{serverCustomQuestions.length} Questions Stored</span>
                </div>
              </div>

              {/* Status Message */}
              {importStatusMessage && (
                <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in ${
                  importStatusMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : importStatusMessage.type === 'error'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {importStatusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {importStatusMessage.type === 'error' && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    {importStatusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0" />}
                    <span>{importStatusMessage.message}</span>
                  </div>
                  <button onClick={() => setImportStatusMessage(null)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Grid: Form & File Dropzone */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Classification Controls */}
                <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xs space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-sky-600" />
                    1. Target Classification
                  </h4>

                  {/* Class Selection */}
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 block">
                      Select Class Level
                    </label>
                    <select
                      value={importClass}
                      onChange={(e) => handleImportClassChange(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="3">Class 3rd (Primary CBSE)</option>
                      <option value="4">Class 4th (Primary CBSE)</option>
                      <option value="5">Class 5th (Middle CBSE)</option>
                      <option value="6">Class 6th (Middle CBSE)</option>
                      <option value="7">Class 7th (Middle CBSE)</option>
                      <option value="8">Class 8th (Middle CBSE)</option>
                      <option value="9">Class 9th (Secondary CBSE)</option>
                      <option value="10">Class 10th (Secondary CBSE Board)</option>
                      <option value="11">Class 11th (Sr. Secondary CBSE)</option>
                      <option value="12">Class 12th (Sr. Secondary CBSE Board)</option>
                    </select>
                  </div>

                  {/* Subject Selection */}
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 block">
                      Select Subject
                    </label>
                    <select
                      value={importSubjectId}
                      onChange={(e) => handleImportSubjectChange(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {availableClassSubjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.code || 'Curriculum'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Chapter Selection */}
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 block">
                      Select Chapter
                    </label>
                    <select
                      value={importChapterId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        setImportChapterId(cid);
                        if (cid === 'ch-custom') {
                          setImportChapterName('');
                        } else {
                          const found = selectedImportSubject?.chapters?.find(ch => ch.id === cid);
                          setImportChapterName(found ? found.title : 'General Chapter');
                        }
                      }}
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                    >
                      {selectedImportSubject?.chapters?.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          Ch {ch.number}: {ch.title}
                        </option>
                      ))}
                      <option value="ch-custom">➕ Custom Chapter Title...</option>
                    </select>

                    {(importChapterId === 'ch-custom' || !selectedImportSubject?.chapters?.length) && (
                      <input
                        type="text"
                        placeholder="Enter Custom Chapter Name (e.g., Chapter 1: Motion)"
                        value={importChapterName}
                        onChange={(e) => setImportChapterName(e.target.value)}
                        className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    )}
                  </div>

                  {/* Topic Name */}
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 block">
                      Topic Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Newton's Third Law, Photosynthesis..."
                      value={importTopic}
                      onChange={(e) => setImportTopic(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Import File / Text Upload Box */}
                <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xs space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        2. Choose Import Method
                      </h4>

                      <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl gap-1">
                        <button
                          onClick={() => setImportMode('file')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            importMode === 'file'
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                          }`}
                        >
                          PDF / Word File
                        </button>
                        <button
                          onClick={() => setImportMode('text')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            importMode === 'text'
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                          }`}
                        >
                          Paste Raw Text
                        </button>
                      </div>
                    </div>

                    {importMode === 'file' ? (
                      <div className="border-2 border-dashed border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/30 rounded-2xl p-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 mx-auto flex items-center justify-center">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                            Upload PDF, Microsoft Word (.docx), or TXT file
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            AI will scan all pages, extract questions, options & answers automatically.
                          </p>
                        </div>

                        <label className="inline-flex items-center gap-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-all">
                          <Plus className="w-4 h-4" />
                          <span>{importFile ? 'Change Selected File' : 'Browse File...'}</span>
                          <input
                            type="file"
                            accept=".pdf,.docx,.doc,.txt"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setImportFile(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                        </label>

                        {importFile && (
                          <div className="bg-white dark:bg-stone-900 p-3 rounded-xl border border-sky-200 dark:border-sky-800 flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100 max-w-md mx-auto">
                            <span className="truncate max-w-[280px]">📄 {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</span>
                            <button onClick={() => setImportFile(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          rows={6}
                          placeholder="Paste your questions text here... E.g.&#10;Q1. What is Photosynthesis?&#10;Q2. Which planet is closest to the Sun? A) Earth B) Mercury C) Venus D) Mars&#10;Ans: B) Mercury"
                          value={importRawText}
                          onChange={(e) => setImportRawText(e.target.value)}
                          className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-3 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Parse Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleStartParsing}
                      disabled={isParsing}
                      className="w-full bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 text-white font-black text-xs py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isParsing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>AI Extracting & Categorizing Questions...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-amber-300" />
                          <span>Extract & Auto-Parse Questions with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Parsed Preview Section */}
              {parsedQuestions.length > 0 && (
                <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-sky-300 dark:border-sky-800 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
                    <div>
                      <h4 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-sky-600" />
                        AI Parsed Questions Preview ({parsedQuestions.length} Questions Extracted)
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Verify and edit any field before permanently saving to the server vault.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setParsedQuestions([])}
                        className="bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer"
                      >
                        Discard
                      </button>
                      <button
                        onClick={handleSaveParsedQuestions}
                        disabled={isSavingCustom}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingCustom ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Save All to Server Vault</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {parsedQuestions.map((q, idx) => (
                      <div key={`parsed-q-${idx}`} className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                              Type: {q.type.toUpperCase()} ({q.marks} Marks)
                            </span>
                          </div>
                          <button
                            onClick={() => setParsedQuestions(prev => prev.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-black text-stone-400 block mb-1">Question Text</label>
                          <textarea
                            rows={2}
                            value={q.questionText}
                            onChange={(e) => {
                              const val = e.target.value;
                              setParsedQuestions(prev => prev.map((item, i) => i === idx ? { ...item, questionText: val } : item));
                            }}
                            className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-2 text-xs font-bold text-stone-900 dark:text-stone-100"
                          />
                        </div>

                        {q.options && q.options.length > 0 && (
                          <div>
                            <label className="text-[10px] uppercase font-black text-stone-400 block mb-1">MCQ Options</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt, oIdx) => (
                                <input
                                  key={`opt-${oIdx}`}
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setParsedQuestions(prev => prev.map((item, i) => {
                                      if (i === idx && item.options) {
                                        const newOpts = [...item.options];
                                        newOpts[oIdx] = val;
                                        return { ...item, options: newOpts };
                                      }
                                      return item;
                                    }));
                                  }}
                                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase font-black text-stone-400 block mb-1">Correct Answer</label>
                            <input
                              type="text"
                              value={q.correctAnswer}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedQuestions(prev => prev.map((item, i) => i === idx ? { ...item, correctAnswer: val } : item));
                              }}
                              className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-2 text-xs font-bold text-emerald-700 dark:text-emerald-400"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-black text-stone-400 block mb-1">Marking Scheme / Hint</label>
                            <input
                              type="text"
                              value={q.markingScheme || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedQuestions(prev => prev.map((item, i) => i === idx ? { ...item, markingScheme: val } : item));
                              }}
                              className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-2 text-xs font-medium text-stone-700 dark:text-stone-300"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Server Custom Questions List Table */}
              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
                  <div>
                    <h4 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <Database className="w-5 h-5 text-sky-600" />
                      Server Stored Question Bank ({serverCustomQuestions.length} Questions)
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      These questions are stored permanently on the server and are automatically included in paper generation.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search question bank..."
                      value={customSearch}
                      onChange={(e) => setCustomSearch(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none"
                    />
                  </div>
                </div>

                {serverCustomQuestions.length === 0 ? (
                  <div className="p-10 text-center text-stone-500 border border-dashed border-stone-300 dark:border-stone-800 rounded-2xl">
                    <Database className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-stone-800 dark:text-stone-200">No imported custom questions in server vault yet.</p>
                    <p className="text-xs text-stone-500 mt-0.5">Use the PDF/Word file uploader above to import questions class-wise and chapter-wise.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {serverCustomQuestions
                      .filter(q => !customSearch || q.questionText.toLowerCase().includes(customSearch.toLowerCase()) || q.chapterName?.toLowerCase().includes(customSearch.toLowerCase()) || q.subjectId?.toLowerCase().includes(customSearch.toLowerCase()))
                      .map((q, idx) => (
                        <div key={q.id || `sq-${idx}`} className="bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 space-y-2 hover:border-sky-300 dark:hover:border-sky-800 transition-all">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                                Class {q.classLevel || '10'}th
                              </span>
                              <span className="bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                                {q.subjectId || 'Subject'}
                              </span>
                              <span className="text-xs font-extrabold text-stone-700 dark:text-stone-300">
                                {q.chapterName}
                              </span>
                              {q.topic && (
                                <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                                  Topic: {q.topic}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleDeleteCustomQuestion(q.id)}
                              className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                              title="Delete from server vault"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            {q.questionText}
                          </p>

                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-stone-600 dark:text-stone-400 pt-1">
                              {q.options.map((opt, oI) => (
                                <div key={`sopt-${oI}`} className="bg-white dark:bg-stone-900 px-2 py-1 rounded border border-stone-200 dark:border-stone-800">
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                            Answer: {q.correctAnswer}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: QUESTION BANK & PAPER SETS */}
          {activeTab === 'questionBank' && (
            <div className="space-y-6">
              {/* Top Banner & Action */}
              <div className="bg-gradient-to-r from-purple-900 via-stone-900 to-indigo-950 p-6 rounded-3xl border border-purple-500/30 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      Direct Class & Exam Bank
                    </span>
                    <h3 className="text-lg font-black tracking-tight text-purple-100">
                      Question Bank & Paper Sets Management (क्वेश्चन बैंक एवं पेपर सेट)
                    </h3>
                  </div>
                  <p className="text-xs text-purple-200/80">
                    कक्षा-वार एवं विषय-वार 10, 20, 40, 80 अंक के पूरे टेस्ट पेपर सेट बनाएं एवं मैनेज करें। छात्र व शिक्षक इन्हें सीधे एक्सेस कर सकते हैं।
                  </p>
                </div>

                <button
                  onClick={() => {
                    resetQbForm();
                    setShowQbModal(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 text-purple-200" />
                  <span>+ Create New Question Paper Set (नया पेपर सेट जोड़ें)</span>
                </button>
              </div>

              {/* Filter Bar */}
              <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search Title / Content */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search title, subject, content..."
                      value={qbSearch}
                      onChange={(e) => setQbSearch(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 pl-9 pr-3 py-2 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Class Filter */}
                  <div>
                    <select
                      value={qbClassFilter}
                      onChange={(e) => setQbClassFilter(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-3 py-2 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="all">All Classes (सभी कक्षाएं)</option>
                      <option value="12">Class 12th Board</option>
                      <option value="11">Class 11th Annual</option>
                      <option value="10">Class 10th Board</option>
                      <option value="9">Class 9th Annual</option>
                      <option value="8">Class 8th</option>
                      <option value="7">Class 7th</option>
                      <option value="6">Class 6th</option>
                    </select>
                  </div>

                  {/* Subject Filter */}
                  <div>
                    <select
                      value={qbSubjectFilter}
                      onChange={(e) => setQbSubjectFilter(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-3 py-2 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="all">All Subjects (सभी विषय)</option>
                      <option value="Science">Science (विज्ञान)</option>
                      <option value="Mathematics">Mathematics (गणित)</option>
                      <option value="Physics">Physics (भौतिकी)</option>
                      <option value="Chemistry">Chemistry (रसायन विज्ञान)</option>
                      <option value="Biology">Biology (जीव विज्ञान)</option>
                      <option value="Social Science">Social Science (सामाजिक विज्ञान)</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Accountancy">Accountancy</option>
                      <option value="Economics">Economics</option>
                      <option value="Computer Science">Computer Science</option>
                    </select>
                  </div>

                  {/* Marks Filter */}
                  <div>
                    <select
                      value={qbMarksFilter}
                      onChange={(e) => setQbMarksFilter(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-3 py-2 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="all">All Total Marks (10M - 100M)</option>
                      <option value="10">10 Marks Test Set</option>
                      <option value="20">20 Marks Unit Test Set</option>
                      <option value="30">30 Marks Test Set</option>
                      <option value="40">40 Marks Periodic Test Set</option>
                      <option value="50">50 Marks Half-Yearly Set</option>
                      <option value="70">70 Marks Theory Board Set</option>
                      <option value="80">80 Marks Full Board Set</option>
                      <option value="100">100 Marks Full Paper Set</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Question Bank Paper Sets List */}
              {filteredQbSets.length === 0 ? (
                <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 text-center space-y-3">
                  <BookOpen className="w-12 h-12 text-purple-400 mx-auto" />
                  <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">
                    No Question Paper Sets Found
                  </h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    अभी कोई क्वेश्चन बैंक पेपर सेट नहीं है। ऊपर दिए गए <strong>"+ Create New Question Paper Set"</strong> बटन पर क्लिक करके नया 10, 20, 40 या 80 अंक का पूरा पेपर सेट जोड़ें।
                  </p>
                  <button
                    onClick={() => {
                      resetQbForm();
                      setShowQbModal(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Paper Set Now</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredQbSets.map((setObj) => (
                    <div
                      key={setObj.id}
                      className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xs hover:border-purple-300 dark:hover:border-purple-800 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg">
                            Class {setObj.classLevel}
                          </span>
                          <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg">
                            {setObj.subject}
                          </span>
                          <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg">
                            {setObj.totalMarks} Marks • {setObj.timeAllowed || '1 Hour'}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="text-sm font-black text-stone-900 dark:text-stone-100 leading-snug">
                            {setObj.title}
                          </h4>
                          {setObj.description && (
                            <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                              {setObj.description}
                            </p>
                          )}
                        </div>

                        {/* Info Subtext */}
                        <div className="text-[11px] text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                          <span>By: {setObj.createdBy || 'Admin'}</span>
                          <span>{new Date(setObj.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                        <button
                          onClick={() => setSelectedQbPreview(setObj)}
                          className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => openEditQbSet(setObj)}
                          className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteQbSet(setObj.id)}
                          className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT QUESTION PAPER SET MODAL */}
      {showQbModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-2xl w-full my-auto overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 to-stone-900 text-white p-5 flex items-center justify-between border-b border-purple-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingQbId ? 'Edit Question Paper Set (संपादित करें)' : 'Create New Question Paper Set (नया पेपर सेट)'}
                  </h3>
                  <p className="text-xs text-purple-200/80">
                    Enter details, total marks (10, 20, 40, 80 Marks) and question paper text.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowQbModal(false);
                  resetQbForm();
                }}
                className="text-purple-200 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Message */}
            {qbStatusMsg && (
              <div
                className={`p-3 text-xs font-bold flex items-center gap-2 ${
                  qbStatusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-b border-rose-200'
                }`}
              >
                {qbStatusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                <span>{qbStatusMsg.message}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSaveQbSet} className="p-5 sm:p-6 space-y-4 text-stone-900 dark:text-stone-100 overflow-y-auto max-h-[75vh]">
              {/* PDF / WORD DOCUMENT UPLOAD BOX */}
              <div className="bg-purple-50/80 dark:bg-purple-950/30 border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-2xl p-4 text-center transition-all hover:border-purple-500">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-purple-900 dark:text-purple-200">
                      Upload PDF / Word (.docx) / Text Question Paper File
                    </p>
                    <p className="text-[11px] text-purple-600 dark:text-purple-400">
                      फाइल चुनें — AI ऑटोमैटिकली प्रश्न पढ़ कर भर देगा और फाइल अटैच कर देगा!
                    </p>
                  </div>

                  <div className="pt-1 flex items-center justify-center gap-2">
                    <label className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-4 py-2 rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-2 transition-all">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isParsingQbFile ? 'Parsing File...' : 'Choose PDF / Word File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleQbFileUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {qbFileName && (
                    <div className="mt-2 inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200 text-xs font-bold px-3 py-1 rounded-lg">
                      <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                      <span>{qbFileName}</span>
                      {qbFileBase64 && <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.2 rounded">Attached</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Paper Set Title */}
              <div>
                <label className="text-xs font-black uppercase text-stone-500 block mb-1">
                  Paper Set Title (पेपर सेट का नाम) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Class 10 Science Unit Test-1 (20 Marks) or Class 12 Physics CBSE Sample Paper (70 Marks)"
                  value={qbTitleInput}
                  onChange={(e) => setQbTitleInput(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Class Selection */}
                <div>
                  <label className="text-xs font-black uppercase text-stone-500 block mb-1">
                    Class (कक्षा)
                  </label>
                  <select
                    value={qbClassInput}
                    onChange={(e) => setQbClassInput(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-2.5 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="12">Class 12th</option>
                    <option value="11">Class 11th</option>
                    <option value="10">Class 10th</option>
                    <option value="9">Class 9th</option>
                    <option value="8">Class 8th</option>
                    <option value="7">Class 7th</option>
                    <option value="6">Class 6th</option>
                  </select>
                </div>

                {/* Subject Selection */}
                <div>
                  <label className="text-xs font-black uppercase text-stone-500 block mb-1">
                    Subject (विषय)
                  </label>
                  <select
                    value={qbSubjectInput}
                    onChange={(e) => setQbSubjectInput(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-2.5 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="Science">Science (विज्ञान)</option>
                    <option value="Mathematics">Mathematics (गणित)</option>
                    <option value="Physics">Physics (भौतिकी)</option>
                    <option value="Chemistry">Chemistry (रसायन विज्ञान)</option>
                    <option value="Biology">Biology (जीव विज्ञान)</option>
                    <option value="Social Science">Social Science (सामाजिक विज्ञान)</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Accountancy">Accountancy</option>
                    <option value="Economics">Economics</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>

                {/* Total Marks */}
                <div>
                  <label className="text-xs font-black uppercase text-stone-500 block mb-1">
                    Total Marks (कुल अंक)
                  </label>
                  <select
                    value={qbMarksInput}
                    onChange={(e) => setQbMarksInput(Number(e.target.value))}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-2.5 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value={10}>10 Marks Test</option>
                    <option value={20}>20 Marks Unit Test</option>
                    <option value={30}>30 Marks Test</option>
                    <option value={40}>40 Marks Periodic Test</option>
                    <option value={50}>50 Marks Exam</option>
                    <option value={70}>70 Marks Theory Board</option>
                    <option value={80}>80 Marks Full Board</option>
                    <option value={100}>100 Marks Full Paper</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Time Allowed */}
                <div>
                  <label className="text-xs font-black uppercase text-stone-500 block mb-1">
                    Time Allowed (समय सीमा)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. 30 Mins, 1 Hour, 2 Hours, 3 Hours"
                    value={qbTimeInput}
                    onChange={(e) => setQbTimeInput(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-2.5 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-black uppercase text-stone-500 block mb-1">
                    Instructions / Notes (विवरण)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. CBSE pattern paper with 3 Sections: A, B & C."
                    value={qbDescriptionInput}
                    onChange={(e) => setQbDescriptionInput(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-2.5 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Raw Questions Content Textarea */}
              <div>
                <label className="text-xs font-black uppercase text-stone-500 block mb-1">
                  Full Question Paper Questions & Solutions Content (प्रश्न व उत्तर पूरा सेट)
                </label>
                <textarea
                  rows={8}
                  placeholder="यहाँ पूरे प्रश्न पत्र के प्रश्न व उत्तर लिखें या पेस्ट करें...&#10;&#10;SECTION A (MCQs - 1 Mark Each):&#10;Q1. What is the chemical formula of rust?&#10;A) FeO  B) Fe2O3.xH2O  C) Fe3O4  D) FeSO4&#10;Answer: B) Fe2O3.xH2O&#10;&#10;SECTION B (Short Answer - 2 Marks):&#10;Q2. Explain the process of photosynthesis with chemical equation.&#10;Solution: 6CO2 + 6H2O -> C6H12O6 + 6O2 in presence of Sunlight & Chlorophyll."
                  value={qbRawContentInput}
                  onChange={(e) => setQbRawContentInput(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowQbModal(false);
                    resetQbForm();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingQb}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingQb ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingQbId ? 'Update Paper Set' : 'Save Question Paper Set'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW QUESTION PAPER SET MODAL */}
      {selectedQbPreview && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-3xl w-full my-auto overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 via-purple-950 to-stone-900 text-white p-5 flex items-center justify-between border-b border-purple-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-purple-400 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                    Class {selectedQbPreview.classLevel} • {selectedQbPreview.subject}
                  </span>
                  <span className="bg-emerald-400 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                    {selectedQbPreview.totalMarks} Marks
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1">
                  {selectedQbPreview.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedQbPreview(null)}
                className="text-purple-200 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Paper Overview Sub-header */}
            <div className="bg-purple-50 dark:bg-purple-950/40 p-4 border-b border-purple-200 dark:border-purple-800 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-stone-800 dark:text-stone-200">
              <div>
                <span>Time Allowed: {selectedQbPreview.timeAllowed || '1 Hour'}</span>
                {selectedQbPreview.description && <p className="text-stone-500 font-normal text-[11px] mt-0.5">{selectedQbPreview.description}</p>}
              </div>
              <button
                onClick={() => window.print()}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Print / Download PDF</span>
              </button>
            </div>

            {/* Paper Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="bg-stone-50 dark:bg-stone-800/60 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 whitespace-pre-wrap font-mono text-xs text-stone-800 dark:text-stone-200 leading-relaxed">
                {selectedQbPreview.rawContent || 'No raw text questions content provided.'}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex justify-end">
              <button
                onClick={() => setSelectedQbPreview(null)}
                className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Inspection Modal for Kids Grammar Test */}
      {selectedGrammarDetail && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Detail Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-stone-900 text-white p-5 flex items-center justify-between border-b border-emerald-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-emerald-400 text-stone-950 font-black px-2 py-0.5 rounded">
                      {selectedGrammarDetail.code}
                    </span>
                    <h3 className="text-base font-black text-white">
                      Class {selectedGrammarDetail.classLevel}th Grammar Test
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    Topic: <strong>{selectedGrammarDetail.topic}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedGrammarDetail(null)}
                className="text-emerald-200 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student & Score Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 border-b border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-emerald-950 dark:text-emerald-100">
                  Student: <span className="text-stone-900 dark:text-white font-extrabold">{selectedGrammarDetail.userName || 'Guest Student'}</span> ({selectedGrammarDetail.userEmail || 'guest@examcraft.internal'})
                </p>
                <p className="text-emerald-800 dark:text-emerald-300 text-[11px] mt-0.5">
                  Attempt Date: {selectedGrammarDetail.date} • Duration: {selectedGrammarDetail.timeTakenSeconds || 0}s
                </p>
              </div>

              <div className="bg-white dark:bg-stone-900 px-4 py-2 rounded-2xl border border-emerald-300 dark:border-emerald-800 flex items-center gap-3">
                <Award className="w-6 h-6 text-emerald-600" />
                <div>
                  <span className="text-[10px] uppercase font-black text-stone-500 block">Final Score</span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                    {selectedGrammarDetail.score} / {selectedGrammarDetail.total} ({selectedGrammarDetail.percentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Question & Answer Breakdown List */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Detailed Questions Breakdown ({selectedGrammarDetail.questions.length} Questions)
              </h4>

              {selectedGrammarDetail.questions.map((q, qIdx) => (
                <div
                  key={`detail-q-${qIdx}`}
                  className={`p-4 rounded-2xl border ${
                    q.isCorrect
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                  } space-y-2.5`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        Q{qIdx + 1}
                      </span>
                      <p className="text-sm font-bold text-stone-900 dark:text-white">
                        {q.questionText}
                      </p>
                    </div>

                    {q.isCorrect ? (
                      <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <CheckCircle className="w-3 h-3" /> Correct
                      </span>
                    ) : (
                      <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <XCircle className="w-3 h-3" /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800">
                      <span className="text-[10px] uppercase font-black text-stone-400 block">Student's Answer:</span>
                      <span className={`font-bold ${q.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {q.userAnswer || '(Skipped)'}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800">
                      <span className="text-[10px] uppercase font-black text-stone-400 block">Correct Answer:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {q.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {/* Grammar Rule / Explanation */}
                  {q.explanation && (
                    <div className="bg-white/80 dark:bg-stone-900/80 p-3 rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-800 dark:text-emerald-400 block text-[11px] uppercase font-black">
                          Grammar Rule Explanation:
                        </strong>
                        <span>{q.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Close */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex justify-end">
              <button
                onClick={() => setSelectedGrammarDetail(null)}
                className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
