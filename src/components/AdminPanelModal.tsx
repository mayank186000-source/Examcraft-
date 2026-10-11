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
  Mail,
  UserCheck,
  Upload,
  Paperclip,
  Calendar,
  ArrowUpDown,
  RotateCcw,
  BarChart3,
  Activity,
  Star,
  History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { User, DownloadRecord, GeneratedPaper, QuestionBankSet } from '../types';
import { formatGuestName } from '../utils/guestTracker';
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
import { fetchAllFeedbacks, updateFeedbackStatus, deleteFeedbackItem, FeedbackItem } from '../services/feedbackService';
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
  // 5 Primary Systematic Navigation Categories
  type MainTab = 'overview' | 'users' | 'content' | 'logs' | 'feedbacks';
  const [mainTab, setMainTab] = useState<MainTab>('overview');
  const [usersSubTab, setUsersSubTab] = useState<'all_students' | 'email_students' | 'guest_students' | 'admins'>('all_students');
  const [studentCategoryFilter, setStudentCategoryFilter] = useState<'all' | 'email' | 'guest'>('all');
  const [activityUserTypeFilter, setActivityUserTypeFilter] = useState<'all' | 'email' | 'guest'>('all');
  const [logUserTypeFilter, setLogUserTypeFilter] = useState<'all' | 'email' | 'guest'>('all');
  const [contentSubTab, setContentSubTab] = useState<'papers' | 'questionBank' | 'grammar' | 'importer'>('papers');
  const [logsSubTab, setLogsSubTab] = useState<'downloads' | 'firestore'>('downloads');

  // Feedbacks State
  const [feedbacksList, setFeedbacksList] = useState<FeedbackItem[]>([]);
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<string>('all');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<string>('all');
  const [feedbackSearch, setFeedbackSearch] = useState<string>('');

  // Universal Date & Time Filter State
  type DatePreset = 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'custom';
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [timeSortOrder, setTimeSortOrder] = useState<'desc' | 'asc'>('desc');

  // Universal Smart Date Matcher
  const isDateMatch = React.useCallback((dateVal: string | number | undefined | null) => {
    if (datePreset === 'all') return true;
    if (!dateVal) return true;
    let d = new Date(dateVal);
    if (isNaN(d.getTime())) {
      const cleaned = String(dateVal).replace(/(\d+)(st|nd|rd|th)/, '$1').trim();
      d = new Date(cleaned);
      if (isNaN(d.getTime())) return true;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (datePreset === 'today') {
      return d >= startOfToday && d <= endOfToday;
    }
    if (datePreset === 'yesterday') {
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      const endOfYesterday = new Date(startOfToday.getTime() - 1);
      return d >= startOfYesterday && d <= endOfYesterday;
    }
    if (datePreset === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= sevenDaysAgo && d <= now;
    }
    if (datePreset === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return d >= thirtyDaysAgo && d <= now;
    }
    if (datePreset === 'custom') {
      if (customStartDate) {
        const s = new Date(customStartDate + 'T00:00:00');
        if (d < s) return false;
      }
      if (customEndDate) {
        const e = new Date(customEndDate + 'T23:59:59');
        if (d > e) return false;
      }
      return true;
    }
    return true;
  }, [datePreset, customStartDate, customEndDate]);

  // Universal Timestamp Sorting Helper
  const sortByTime = React.useCallback((dateA: string | number | undefined | null, dateB: string | number | undefined | null) => {
    let tA = 0;
    let tB = 0;
    if (dateA) {
      const dA = new Date(dateA);
      tA = !isNaN(dA.getTime()) ? dA.getTime() : new Date(String(dateA).replace(/(\d+)(st|nd|rd|th)/, '$1')).getTime() || 0;
    }
    if (dateB) {
      const dB = new Date(dateB);
      tB = !isNaN(dB.getTime()) ? dB.getTime() : new Date(String(dateB).replace(/(\d+)(st|nd|rd|th)/, '$1')).getTime() || 0;
    }
    return timeSortOrder === 'desc' ? tB - tA : tA - tB;
  }, [timeSortOrder]);

  // Backward-compatible activeTab mapped dynamically from systematic mainTab & subTab
  const activeTab: 'overview' | 'users' | 'logs' | 'admins' | 'papers' | 'grammar' | 'firestore' | 'importer' | 'questionBank' | 'feedbacks' = React.useMemo(() => {
    if (mainTab === 'overview') return 'overview';
    if (mainTab === 'users') return usersSubTab === 'admins' ? 'admins' : 'users';
    if (mainTab === 'content') return contentSubTab;
    if (mainTab === 'logs') return logsSubTab === 'firestore' ? 'firestore' : 'logs';
    if (mainTab === 'feedbacks') return 'feedbacks';
    return 'overview';
  }, [mainTab, usersSubTab, contentSubTab, logsSubTab]);

  // Seamless navigation helper that updates both main and sub-categories
  const setActiveTab = React.useCallback((tab: 'overview' | 'users' | 'logs' | 'admins' | 'papers' | 'grammar' | 'firestore' | 'importer' | 'questionBank' | 'feedbacks') => {
    if (tab === 'overview') {
      setMainTab('overview');
    } else if (tab === 'users') {
      setMainTab('users');
      setUsersSubTab('all_students');
      setStudentCategoryFilter('all');
    } else if (tab === 'admins') {
      setMainTab('users');
      setUsersSubTab('admins');
    } else if (tab === 'papers') {
      setMainTab('content');
      setContentSubTab('papers');
    } else if (tab === 'questionBank') {
      setMainTab('content');
      setContentSubTab('questionBank');
    } else if (tab === 'grammar') {
      setMainTab('content');
      setContentSubTab('grammar');
    } else if (tab === 'importer') {
      setMainTab('content');
      setContentSubTab('importer');
    } else if (tab === 'logs') {
      setMainTab('logs');
      setLogsSubTab('downloads');
    } else if (tab === 'firestore') {
      setMainTab('logs');
      setLogsSubTab('firestore');
    } else if (tab === 'feedbacks') {
      setMainTab('feedbacks');
    }
  }, []);
  const [userSearch, setUserSearch] = useState<string>('');
  const [logSearch, setLogSearch] = useState<string>('');
  const [paperSearch, setPaperSearch] = useState<string>('');
  const [paperUserFilter, setPaperUserFilter] = useState<string>('all');
  const [paperClassFilter, setPaperClassFilter] = useState<string>('all');
  const [paperSubjectFilter, setPaperSubjectFilter] = useState<string>('all');
  const [paperMarksFilter, setPaperMarksFilter] = useState<string>('all');
  const [showVipModal, setShowVipModal] = useState<boolean>(false);

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
            const convertedGrammar: StudentActivityDoc[] = data.grammarResults.map((r: any) => {
              const validTime = r.date || r.timestamp || r.createdAt || r.syncedAt;
              return {
                id: `quiz_${r.code}_${validTime || 'fixed'}`,
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
                timestamp: validTime || new Date().toISOString()
              };
            });
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

  React.useEffect(() => {
    if (isOpen) {
      fetchAllFeedbacks().then(data => setFeedbacksList(data)).catch(console.error);
    }
  }, [isOpen, mainTab]);

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

          const convertedActivities: StudentActivityDoc[] = remoteGrammarResults.map(g => {
            const validTime = g.date || (g as any).timestamp || (g as any).createdAt || (g as any).syncedAt;
            return {
              id: `grammar_${g.code}_${validTime || 'fixed'}`,
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
              timestamp: validTime || new Date().toISOString()
            };
          });
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

  const safeDownloadLogs = Array.isArray(downloadLogs) ? downloadLogs : [];
  const safeAllUsers = Array.isArray(allUsers) ? allUsers : [];
  const safeAdminEmails = Array.isArray(adminEmails) ? adminEmails : [];
  const safeUnlimitedVipEmails = Array.isArray(unlimitedVipEmails) ? unlimitedVipEmails : [];
  const safeDeregisteredUserEmails = Array.isArray(deregisteredUserEmails) ? deregisteredUserEmails : [];
  const safeSavedPapers = Array.isArray(savedPapers) ? savedPapers : [];
  const safeGrammarResults = Array.isArray(grammarResults) ? grammarResults : [];
  const safeRealtimeUsers = Array.isArray(realtimeUsers) ? realtimeUsers : [];
  const safeRealtimeActivities = Array.isArray(realtimeActivities) ? realtimeActivities : [];

  const totalDownloads = safeDownloadLogs.length;

  const handleClearDownloadLogs = async () => {
    await clearDownloadLogs();
    setActionSuccess('Download logs successfully cleared.');
    setTimeout(() => setActionSuccess(null), 3000);
  };

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
    const listToExport = filteredLogs.length > 0 ? filteredLogs : safeDownloadLogs;
    if (listToExport.length === 0) return;
    const headers = ['Timestamp', 'User Email', 'User Name', 'Role', 'Subject', 'Paper Title', 'Paper Code'];
    const rows = listToExport.map(l => [
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
  const userPaperStats = safeSavedPapers.reduce((acc, paper) => {
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
  const userGrammarStats = safeGrammarResults.reduce((acc, result) => {
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

  const filteredGrammarResults = safeGrammarResults
    .filter(res => {
      const matchesDate = isDateMatch(res.date || (res as any).createdAt);
      if (!matchesDate) return false;

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
    })
    .sort((a, b) => sortByTime(a.date, b.date));

  // Merge real-time snapshot users with AuthContext users for immediate multi-device visibility
  const effectiveAllUsers = React.useMemo(() => {
    const map = new Map<string, User>();
    safeRealtimeUsers.forEach(u => {
      const key = (u.email || u.id || u.name || '').toLowerCase().trim();
      if (key) map.set(key, u);
    });
    safeAllUsers.forEach(u => {
      const key = (u.email || u.id || u.name || '').toLowerCase().trim();
      if (key && !map.has(key)) map.set(key, u);
    });
    return Array.from(map.values());
  }, [safeRealtimeUsers, safeAllUsers]);

  // Merge real-time snapshot activities with hook activities
  const effectiveActivities = React.useMemo(() => {
    return mergeActivities(safeRealtimeActivities, firestoreActivities || []);
  }, [safeRealtimeActivities, firestoreActivities]);

  const GENERIC_RESERVED_TERMS = React.useMemo(() => new Set([
    'student',
    'student@examidea.internal',
    'admin',
    'user',
    'guest',
    'guest user',
    'guest student',
    'guest@examcraft.internal',
    'anonymous',
    'null',
    'undefined'
  ]), []);

  const validDeregisteredEmails = React.useMemo(() => {
    if (!deregisteredUserEmails) return [];
    return deregisteredUserEmails
      .map(e => e.toLowerCase().trim())
      .filter(e => e.length > 0 && !GENERIC_RESERVED_TERMS.has(e));
  }, [deregisteredUserEmails, GENERIC_RESERVED_TERMS]);

  // Helper to check if email/user/id is deregistered
  const isDeregisteredUser = (...keys: (string | undefined | null)[]) => {
    if (validDeregisteredEmails.length === 0) return false;
    const normSet = new Set(validDeregisteredEmails);
    return keys.some(k => {
      if (!k) return false;
      const norm = String(k).toLowerCase().trim();
      if (!norm || GENERIC_RESERVED_TERMS.has(norm)) return false;
      if (normSet.has(norm)) return true;
      const cleanDocId = norm.replace(/[^a-zA-Z0-9]/g, '_');
      if (normSet.has(cleanDocId)) return true;
      if (norm.startsWith('usr-') && (normSet.has(norm.slice(4)) || normSet.has(norm.slice(4).replace(/_/g, '.')))) return true;
      return false;
    });
  };

  // Helper to distinguish Guest Users from Email Logged-in Students
  const isGuestUser = React.useCallback((u: { email?: string; id?: string; name?: string; isGuest?: boolean }) => {
    if (u.isGuest) return true;
    const email = (u.email || '').toLowerCase().trim();
    const name = (u.name || '').toLowerCase().trim();
    const id = (u.id || '').toLowerCase().trim();

    if (!email || email === 'guest' || email.includes('guest') || email.includes('examcraft.internal') || email.includes('unknown@') || !email.includes('@')) {
      return true;
    }
    if (name.includes('guest') || id.includes('guest')) {
      return true;
    }
    return false;
  }, []);

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
  safeDownloadLogs.forEach(l => {
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
  const emailStudentsCount = React.useMemo(() => masterUsersList.filter(u => u.role === 'student' && !isGuestUser(u)).length, [masterUsersList, isGuestUser]);
  const guestStudentsCount = React.useMemo(() => masterUsersList.filter(u => u.role === 'student' && isGuestUser(u)).length, [masterUsersList, isGuestUser]);
  const adminCount = React.useMemo(() => masterUsersList.filter(u => u.role === 'admin').length, [masterUsersList]);

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

  // Filtered dataset for selected datePreset/custom dates
  const filteredTimeframePapers = React.useMemo(() => {
    return savedPapers.filter(p => isDateMatch(p.createdAt));
  }, [savedPapers, isDateMatch]);

  const filteredTimeframeActivities = React.useMemo(() => {
    return effectiveActivities.filter(a => isDateMatch(a.timestamp));
  }, [effectiveActivities, isDateMatch]);

  const filteredTimeframeGrammar = React.useMemo(() => {
    return grammarResults.filter(g => isDateMatch(g.createdAt));
  }, [grammarResults, isDateMatch]);

  const filteredTimeframeDownloads = React.useMemo(() => {
    return safeDownloadLogs.filter(d => isDateMatch(d.timestamp));
  }, [safeDownloadLogs, isDateMatch]);

  // Combined Total Activity Feed for the selected timeframe
  const unifiedActivitiesFeed = React.useMemo(() => {
    const list: {
      id: string;
      category: 'Paper Created' | 'Quiz Completed' | 'Downloaded' | 'Live Activity';
      title: string;
      subtitle: string;
      userName: string;
      userEmail: string;
      isGuest: boolean;
      timestamp: string;
      paperCode?: string;
      badgeStyle: string;
      paperObj?: GeneratedPaper;
    }[] = [];

    // 1. Papers Generated
    savedPapers.forEach((p, idx) => {
      if (!isDateMatch(p.createdAt)) return;
      const email = p.generatedBy?.email || '';
      const rawName = p.generatedBy?.name || '';
      const isGuest = isGuestUser({ email, name: rawName });
      const displayUser = isGuest ? formatGuestName(email, rawName) : (rawName || 'Student');
      list.push({
        id: `pap-${p.id}-${idx}`,
        category: 'Paper Created',
        title: p.config.title || p.subjectName || 'CBSE Question Paper',
        subtitle: `${p.subjectName || 'CBSE'} • Class ${p.classLevel || '10'} • ${p.config.totalMarks || 80} Marks`,
        userName: displayUser,
        userEmail: isGuest ? `${displayUser.toLowerCase()}@examidea.internal` : (email || 'guest@examidea.internal'),
        isGuest,
        timestamp: p.createdAt,
        paperCode: p.paperCode || p.id,
        badgeStyle: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800',
        paperObj: p
      });
    });

    // 2. Quiz / Grammar Submissions
    grammarResults.forEach((g, idx) => {
      if (!isDateMatch(g.createdAt)) return;
      const email = g.userEmail || '';
      const rawName = g.userName || '';
      const isGuest = isGuestUser({ email, name: rawName });
      const displayUser = isGuest ? formatGuestName(email, rawName) : (rawName || 'Student');
      const pct = Math.round((g.score / (g.totalQuestions || 1)) * 100);
      list.push({
        id: `gram-${g.id}-${idx}`,
        category: 'Quiz Completed',
        title: g.topicTitle || 'Grammar Test',
        subtitle: `Score: ${g.score}/${g.totalQuestions} (${pct}%) • Class 5th-8th`,
        userName: displayUser,
        userEmail: isGuest ? `${displayUser.toLowerCase()}@examidea.internal` : (email || 'guest@examidea.internal'),
        isGuest,
        timestamp: g.createdAt,
        badgeStyle: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
      });
    });

    // 3. Download Logs
    safeDownloadLogs.forEach((d, idx) => {
      if (!isDateMatch(d.timestamp)) return;
      const email = d.userEmail || '';
      const rawName = d.userName || '';
      const isGuest = isGuestUser({ email, name: rawName });
      const displayUser = isGuest ? formatGuestName(email, rawName) : (rawName || 'Student');
      list.push({
        id: `dl-${d.id}-${idx}`,
        category: 'Downloaded',
        title: d.paperTitle || 'Downloaded Paper',
        subtitle: `${d.subject || 'CBSE'} • Paper Code: ${d.paperCode}`,
        userName: displayUser,
        userEmail: isGuest ? `${displayUser.toLowerCase()}@examidea.internal` : (email || 'guest@examidea.internal'),
        isGuest,
        timestamp: d.timestamp,
        paperCode: d.paperCode,
        badgeStyle: 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800'
      });
    });

    // 4. Firestore Activities
    effectiveActivities.forEach((act, idx) => {
      if (!isDateMatch(act.timestamp)) return;
      if (act.activityType === 'paper_generated' || act.activityType === 'quiz_submitted') return;
      const email = act.studentEmail || '';
      const rawName = act.studentName || '';
      const isGuest = isGuestUser({ email, name: rawName });
      const displayUser = isGuest ? formatGuestName(email, rawName) : (rawName || 'Student');
      list.push({
        id: `act-${act.id || idx}-${act.timestamp}`,
        category: 'Live Activity',
        title: act.paperTitle || act.activityType.replace(/_/g, ' ').toUpperCase(),
        subtitle: `${act.subject || 'General'} • Activity: ${act.activityType}`,
        userName: displayUser,
        userEmail: isGuest ? `${displayUser.toLowerCase()}@examidea.internal` : (email || 'guest@examidea.internal'),
        isGuest,
        timestamp: act.timestamp,
        paperCode: act.paperCode,
        badgeStyle: 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800'
      });
    });

    return list.sort((a, b) => sortByTime(a.timestamp, b.timestamp));
  }, [savedPapers, grammarResults, safeDownloadLogs, effectiveActivities, isDateMatch, isGuestUser, sortByTime]);

  const timeframeActiveUsers = React.useMemo(() => {
    const set = new Set<string>();
    unifiedActivitiesFeed.forEach(a => set.add(a.userName));
    return set.size;
  }, [unifiedActivitiesFeed]);
  const uniqueLogUsers = React.useMemo(() => {
    const map = new Map<string, { email: string; name: string }>();
    safeDownloadLogs.forEach(l => {
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
  }, [safeDownloadLogs, masterUsersList]);

  const filteredUsers = masterUsersList
    .filter(u => {
      // Subtab / Role filter
      if (usersSubTab === 'admins' && u.role !== 'admin') return false;
      if (usersSubTab !== 'admins' && u.role === 'admin') return false;

      // Separate Guest vs Email Student filter
      if (usersSubTab === 'email_students' && isGuestUser(u)) return false;
      if (usersSubTab === 'guest_students' && !isGuestUser(u)) return false;

      if (studentCategoryFilter === 'email' && isGuestUser(u)) return false;
      if (studentCategoryFilter === 'guest' && !isGuestUser(u)) return false;

      const userDate = u.createdAt || u.lastDownloadDate;
      const matchesDate = isDateMatch(userDate);
      if (!matchesDate) return false;

      return (
        (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
      );
    })
    .sort((a, b) => sortByTime(a.createdAt || a.lastDownloadDate, b.createdAt || b.lastDownloadDate));

  const filteredLogs = safeDownloadLogs
    .filter(l => {
      const matchesDate = isDateMatch(l.timestamp);
      if (!matchesDate) return false;

      const isGuest = isGuestUser({ email: l.userEmail, name: l.userName });
      if (logUserTypeFilter === 'email' && isGuest) return false;
      if (logUserTypeFilter === 'guest' && !isGuest) return false;

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
    })
    .sort((a, b) => sortByTime(a.timestamp, b.timestamp));

  const filteredFirestoreActivities = effectiveActivities
    .filter(act => {
      const matchesDate = isDateMatch(act.timestamp);
      if (!matchesDate) return false;

      const isGuest = isGuestUser({ email: act.studentEmail, id: act.studentId, name: act.studentName });
      if (activityUserTypeFilter === 'email' && isGuest) return false;
      if (activityUserTypeFilter === 'guest' && !isGuest) return false;

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
    })
    .sort((a, b) => sortByTime(a.timestamp, b.timestamp));

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

  const filteredPapers = savedPapers
    .filter(paper => {
      const matchesDate = isDateMatch(paper.createdAt);
      if (!matchesDate) return false;

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
    })
    .sort((a, b) => sortByTime(a.createdAt, b.createdAt));

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

  const filteredQbSets = questionBankSets
    .filter(setObj => {
      const matchesDate = isDateMatch(setObj.createdAt);
      if (!matchesDate) return false;

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
    })
    .sort((a, b) => sortByTime(a.createdAt, b.createdAt));

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

        {/* Tier-1 Master Category Navigation */}
        <div className="flex items-center px-4 sm:px-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 overflow-x-auto gap-2 py-2.5">
          <button
            onClick={() => setMainTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              mainTab === 'overview'
                ? 'bg-amber-700 text-white shadow-md shadow-amber-900/20'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-300" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setMainTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              mainTab === 'users'
                ? 'bg-amber-700 text-white shadow-md shadow-amber-900/20'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Users className="w-4 h-4 text-amber-300" />
            <span>Students & Limits</span>
            <span className="bg-amber-900/40 text-amber-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
              {totalStudents}
            </span>
          </button>

          <button
            onClick={() => setMainTab('content')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              mainTab === 'content'
                ? 'bg-amber-700 text-white shadow-md shadow-amber-900/20'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>Content Hub</span>
            <span className="bg-amber-900/40 text-amber-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
              {savedPapers.length + questionBankSets.length + grammarResults.length}
            </span>
          </button>

          <button
            onClick={() => setMainTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              mainTab === 'logs'
                ? 'bg-amber-700 text-white shadow-md shadow-amber-900/20'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>Logs & Audits</span>
            <span className="bg-amber-900/40 text-amber-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
              {totalDownloads}
            </span>
          </button>

          <button
            onClick={() => setMainTab('feedbacks')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              mainTab === 'feedbacks'
                ? 'bg-amber-700 text-white shadow-md shadow-amber-900/20'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-300" />
            <span>Feedbacks & Ideas</span>
            <span className="bg-emerald-900/40 text-emerald-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              {feedbacksList.length}
            </span>
          </button>
        </div>

        {/* Tier-2 Sub-Navigation Pills & Universal Date/Time Filter Bar */}
        {mainTab !== 'feedbacks' && (
        <div className="px-4 sm:px-6 py-2.5 bg-stone-100/90 dark:bg-stone-900/90 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Context-specific Sub-Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {mainTab === 'overview' && (
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300 font-medium py-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live System Status • Real-time Sync Active</span>
              </div>
            )}

            {mainTab === 'users' && (
              <>
                <button
                  onClick={() => { setUsersSubTab('all_students'); setStudentCategoryFilter('all'); }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    usersSubTab === 'all_students'
                      ? 'bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-400 shadow-xs border border-stone-300 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  <span>All Students ({totalStudents})</span>
                </button>

                <button
                  onClick={() => { setUsersSubTab('email_students'); setStudentCategoryFilter('email'); }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    usersSubTab === 'email_students'
                      ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 shadow-xs border border-stone-300 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-500" />
                  <span>📧 Email Logins ({emailStudentsCount})</span>
                </button>

                <button
                  onClick={() => { setUsersSubTab('guest_students'); setStudentCategoryFilter('guest'); }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    usersSubTab === 'guest_students'
                      ? 'bg-white dark:bg-stone-800 text-purple-700 dark:text-purple-400 shadow-xs border border-stone-300 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5 text-purple-500" />
                  <span>👤 Guest Logins ({guestStudentsCount})</span>
                </button>

                <button
                  onClick={() => setUsersSubTab('admins')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    usersSubTab === 'admins'
                      ? 'bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-400 shadow-xs border border-stone-300 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin Roster ({adminEmails.length})</span>
                </button>
              </>
            )}

            {mainTab === 'content' && (
              <>
                <button
                  onClick={() => setContentSubTab('papers')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    contentSubTab === 'papers'
                      ? 'bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-400 shadow-xs border border-stone-300 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Saved Papers ({savedPapers.length})</span>
                </button>

                <button
                  onClick={() => setContentSubTab('questionBank')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    contentSubTab === 'questionBank'
                      ? 'bg-white dark:bg-stone-800 text-purple-700 dark:text-purple-400 shadow-xs border border-stone-300 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                  <span>Question Bank Sets ({questionBankSets.length})</span>
                </button>

                <button
                  onClick={() => setContentSubTab('grammar')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    contentSubTab === 'grammar'
                      ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 shadow-xs border border-stone-300 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Kids Grammar 5th-8th ({grammarResults.length})</span>
                </button>

                <button
                  onClick={() => setContentSubTab('importer')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    contentSubTab === 'importer'
                      ? 'bg-white dark:bg-stone-800 text-sky-700 dark:text-sky-400 shadow-xs border border-stone-300 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-sky-500" />
                  <span>Import Questions ({serverCustomQuestions.length})</span>
                </button>
              </>
            )}

            {mainTab === 'logs' && (
              <>
                <button
                  onClick={() => setLogsSubTab('downloads')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    logsSubTab === 'downloads'
                      ? 'bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-400 shadow-xs border border-stone-300 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                  <span>Download Logs ({safeDownloadLogs.length})</span>
                </button>

                <button
                  onClick={() => setLogsSubTab('firestore')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    logsSubTab === 'firestore'
                      ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 shadow-xs border border-stone-300 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>Firestore Live Activity ({effectiveActivities.length})</span>
                </button>
              </>
            )}
          </div>

          {/* Right: Smart Date & Time Filter Bar */}
          {(mainTab === 'overview' || mainTab === 'logs' || (mainTab === 'content' && contentSubTab === 'papers')) && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-white dark:bg-stone-800/90 p-1 rounded-xl border border-stone-300 dark:border-stone-700 shadow-2xs">
              <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 px-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Date:</span>
              </span>

              {(['all', 'today', 'yesterday', '7days', '30days', 'custom'] as DatePreset[]).map((preset) => {
                const labels: Record<DatePreset, string> = {
                  all: 'All Time',
                  today: 'Today',
                  yesterday: 'Yesterday',
                  '7days': '7 Days',
                  '30days': '30 Days',
                  custom: 'Custom 📅'
                };
                const isActive = datePreset === preset;
                return (
                  <button
                    key={`date-preset-${preset}`}
                    onClick={() => setDatePreset(preset)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {labels[preset]}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Range Pickers */}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-stone-800/90 px-2.5 py-1 rounded-xl border border-stone-300 dark:border-stone-700 animate-in fade-in">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="text-[11px] font-bold bg-transparent text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
                  title="From Date"
                />
                <span className="text-stone-400 text-xs">→</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="text-[11px] font-bold bg-transparent text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
                  title="To Date"
                />
              </div>
            )}

            {/* Time Order Toggle */}
            <button
              onClick={() => setTimeSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800/90 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all cursor-pointer"
              title={`Sort: ${timeSortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] hidden sm:inline">{timeSortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>

            {/* Reset Button */}
            {datePreset !== 'all' && (
              <button
                onClick={() => {
                  setDatePreset('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-200 transition-all cursor-pointer text-[11px]"
                title="Reset Date Filter"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
          )}
        </div>
        )}

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
              {/* Clean Overview Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-amber-600" />
                    <span>System Overview & Activity Summary</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Live system metrics, papers generated, quizzes, and recent downloads.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold">
                  {(['all', 'today', 'yesterday', '7days', '30days'] as DatePreset[]).map((preset) => {
                    const labels: Record<DatePreset, string> = {
                      all: 'All Time',
                      today: 'Today',
                      yesterday: 'Yesterday',
                      '7days': '7 Days',
                      '30days': '30 Days',
                      custom: 'Custom'
                    };
                    const isActive = datePreset === preset;
                    return (
                      <button
                        key={`ov-preset-${preset}`}
                        onClick={() => setDatePreset(preset)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                          isActive
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                      >
                        {labels[preset]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Timeframe Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => setActiveTab('papers')}
                  className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-5 rounded-2xl cursor-pointer hover:border-amber-500 transition-all shadow-2xs group"
                >
                  <span className="text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                    📄 Papers Generated
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-black text-amber-950 dark:text-amber-100">
                      {filteredTimeframePapers.length}
                    </span>
                    <FileText className="w-6 h-6 text-amber-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-bold">
                    View saved papers for this timeframe →
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('content')}
                  className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-5 rounded-2xl cursor-pointer hover:border-emerald-500 transition-all shadow-2xs group"
                >
                  <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                    🎯 Quizzes & Tests Played
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-black text-emerald-950 dark:text-emerald-100">
                      {filteredTimeframeGrammar.length + filteredTimeframeActivities.length}
                    </span>
                    <GraduationCap className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-bold">
                    Includes 5th-8th & Board tests →
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('logs')}
                  className="bg-blue-50/90 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 p-5 rounded-2xl cursor-pointer hover:border-blue-500 transition-all shadow-2xs group"
                >
                  <span className="text-[11px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-wider block">
                    📥 Downloads Logged
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-black text-blue-950 dark:text-blue-100">
                      {filteredTimeframeDownloads.length}
                    </span>
                    <Download className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-1 font-bold">
                    View download audit logs →
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('users')}
                  className="bg-purple-50/90 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 p-5 rounded-2xl cursor-pointer hover:border-purple-500 transition-all shadow-2xs group"
                >
                  <span className="text-[11px] font-black text-purple-800 dark:text-purple-400 uppercase tracking-wider block">
                    👤 Active Students
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-black text-purple-950 dark:text-purple-100">
                      {timeframeActiveUsers}
                    </span>
                    <Users className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-1 font-bold">
                    Includes Guest-001 ID tracking →
                  </p>
                </div>
              </div>

              {/* Unified 1-Click Total Activity Feed Table */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm space-y-3">
                <div className="p-4 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-amber-600" />
                      <span>Total Activity Log Feed ({unifiedActivitiesFeed.length} records)</span>
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Shows all actions taken during the selected timeframe with persistent Guest user IDs.
                    </p>
                  </div>

                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                    Showing: {datePreset.toUpperCase()}
                  </span>
                </div>

                {unifiedActivitiesFeed.length === 0 ? (
                  <div className="p-10 text-center text-stone-500 space-y-2">
                    <Calendar className="w-8 h-8 text-stone-400 mx-auto opacity-50" />
                    <p className="font-bold text-xs">Is chuni gayi tarikh me koi activity record nahi hai.</p>
                    <p className="text-[11px]">Select "Today", "Yesterday", or "All Time" to view activities.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-bold border-b border-stone-200 dark:border-stone-700">
                        <tr>
                          <th className="p-3">Time & Date</th>
                          <th className="p-3">Student / User</th>
                          <th className="p-3">Event Type</th>
                          <th className="p-3">Item Title / Action</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {unifiedActivitiesFeed.slice(0, 30).map((act) => {
                          const dateStr = new Date(act.timestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <tr key={act.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                              <td className="p-3 whitespace-nowrap font-mono text-[11px] text-stone-500 dark:text-stone-400">
                                {dateStr}
                              </td>

                              <td className="p-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                                    act.isGuest ? 'bg-purple-600' : 'bg-emerald-600'
                                  }`}>
                                    {act.userName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1">
                                      <span>{act.userName}</span>
                                      {act.isGuest && (
                                        <span className="text-[9px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded border border-purple-300">
                                          GUEST
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-stone-400 font-mono">{act.userEmail}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3 whitespace-nowrap">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${act.badgeStyle}`}>
                                  {act.category}
                                </span>
                              </td>

                              <td className="p-3">
                                <div className="font-bold text-stone-800 dark:text-stone-200 line-clamp-1">
                                  {act.title}
                                </div>
                                <div className="text-[10px] text-stone-500 font-medium">
                                  {act.subtitle}
                                </div>
                              </td>

                              <td className="p-3 text-right whitespace-nowrap">
                                {act.paperObj ? (
                                  <button
                                    onClick={() => {
                                      if (onSelectPaper && act.paperObj) {
                                        onSelectPaper(act.paperObj);
                                        onClose();
                                      }
                                    }}
                                    className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 ml-auto shadow-xs cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View Paper</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-stone-400 font-bold">Logged</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SAVED PAPERS */}
          {activeTab === 'papers' && (
            <div className="space-y-4">
              {/* Clean Papers Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    <span>Saved Question Papers ({filteredPapers.length})</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    System me banaye gaye sabhi test papers ka record.
                  </p>
                </div>

                {(paperClassFilter !== 'all' || paperSubjectFilter !== 'all' || paperMarksFilter !== 'all' || paperUserFilter !== 'all' || paperSearch !== '') && (
                  <button
                    onClick={() => {
                      setPaperClassFilter('all');
                      setPaperSubjectFilter('all');
                      setPaperMarksFilter('all');
                      setPaperUserFilter('all');
                      setPaperSearch('');
                    }}
                    className="text-xs text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              {/* Clean Filter Controls: Search, Class, Subject, Marks, User */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={paperSearch}
                    onChange={e => setPaperSearch(e.target.value)}
                    placeholder="Search paper or user..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-amber-600 font-medium"
                  />
                </div>

                {/* 1. Class Filter */}
                <select
                  value={paperClassFilter}
                  onChange={e => setPaperClassFilter(e.target.value)}
                  className="py-1.5 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold focus:outline-amber-600 cursor-pointer"
                >
                  <option value="all">All Classes</option>
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

                {/* 2. Subject Filter */}
                <select
                  value={paperSubjectFilter}
                  onChange={e => setPaperSubjectFilter(e.target.value)}
                  className="py-1.5 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold focus:outline-amber-600 cursor-pointer"
                >
                  <option value="all">All Subjects</option>
                  {availableSubjects.map((sub, idx) => (
                    <option key={`sub-opt-${idx}`} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>

                {/* 3. Marks Filter */}
                <select
                  value={paperMarksFilter}
                  onChange={e => setPaperMarksFilter(e.target.value)}
                  className="py-1.5 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold focus:outline-amber-600 cursor-pointer"
                >
                  <option value="all">All Marks</option>
                  {availableMarks.map((m, idx) => (
                    <option key={`marks-opt-${idx}`} value={String(m)}>
                      {m} Marks
                    </option>
                  ))}
                </select>

                {/* 4. User Filter */}
                <select
                  value={paperUserFilter}
                  onChange={e => setPaperUserFilter(e.target.value)}
                  className="py-1.5 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold focus:outline-amber-600 cursor-pointer truncate"
                >
                  <option value="all">All Users ({savedPapers.length} Papers)</option>
                  {Object.values(userPaperStats).map((stat: { name: string; email: string; count: number }, idx: number) => (
                    <option key={`usr-flt-${stat.email}-${idx}`} value={stat.email}>
                      {stat.name} ({stat.count})
                    </option>
                  ))}
                </select>
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

          {/* TAB 3: STUDENTS & QUOTA MANAGER */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Clean Users Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-600" />
                    <span>Student Accounts & Usage Quotas ({totalStudents})</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Email aur Guest student accounts ki limits aur permissions manage karein.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVipModal(!showVipModal)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>VIP Unlimited Access ({unlimitedVipEmails.length})</span>
                  </button>
                </div>
              </div>

              {/* Expandable VIP Grant Bar */}
              {showVipModal && (
                <div className="bg-stone-50 dark:bg-stone-850 p-3.5 rounded-2xl border border-amber-300 dark:border-amber-800/60 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Grant Unlimited Generation & Downloads
                    </span>
                    <button
                      onClick={() => setShowVipModal(false)}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleGrantVip} className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={vipEmailInput}
                      onChange={e => setVipEmailInput(e.target.value)}
                      placeholder="Enter user email to grant unlimited access..."
                      className="flex-1 text-xs py-2 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-amber-600"
                    />
                    <button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Grant Unlimited</span>
                    </button>
                  </form>
                  {unlimitedVipEmails.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {unlimitedVipEmails.map((vipEmail, idx) => (
                        <div
                          key={`vip-chip-${vipEmail}-${idx}`}
                          className="bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800/80 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5"
                        >
                          <Crown className="w-3 h-3 text-amber-500" />
                          <span>{vipEmail}</span>
                          <button
                            type="button"
                            onClick={() => {
                              revokeUnlimitedAccess(vipEmail);
                              setActionSuccess(`Revoked Unlimited VIP Access for ${vipEmail}`);
                              setTimeout(() => setActionSuccess(null), 3000);
                            }}
                            className="text-stone-400 hover:text-red-600 cursor-pointer ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Clean Filter and Search Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl border border-stone-200 dark:border-stone-700 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setStudentCategoryFilter('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      studentCategoryFilter === 'all'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    <span>All Accounts ({totalStudents})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentCategoryFilter('email')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      studentCategoryFilter === 'email'
                        ? 'bg-white dark:bg-stone-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    <Mail className="w-3 h-3 text-emerald-500" />
                    <span>Email ({emailStudentsCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentCategoryFilter('guest')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      studentCategoryFilter === 'guest'
                        ? 'bg-white dark:bg-stone-700 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    <UserX className="w-3 h-3 text-purple-500" />
                    <span>Guest ({guestStudentsCount})</span>
                  </button>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search student by name or email..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-amber-600 font-medium"
                  />
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
                                  <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                    <span>{isGuestUser(user) ? formatGuestName(user.email, user.name) : user.name}</span>
                                    {isAdm && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                    {isGuestUser(user) ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1 shrink-0" title="Log in via Guest Session">
                                        <UserX className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                        <span>👤 गेस्ट (Guest)</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shrink-0" title="Log in via Registered Email">
                                        <Mail className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                        <span>📧 ईमेल (Email)</span>
                                      </span>
                                    )}
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

          {/* TAB 4: DOWNLOAD LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Clean Logs Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-600" />
                    <span>Download & Generation Logs ({filteredLogs.length})</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Students ke dwara papers download aur view karne ki history.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={handleClearDownloadLogs}
                    className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-red-50 text-stone-600 dark:text-stone-300 hover:text-red-700 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Controls: Search & Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    placeholder="Search logs by paper, subject or user email..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-amber-600"
                  />
                </div>

                {/* User Filter Dropdown */}
                <select
                  value={logUserFilter}
                  onChange={e => setLogUserFilter(e.target.value)}
                  className="py-1.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold focus:outline-amber-600 cursor-pointer max-w-[200px] truncate"
                >
                  <option value="all">All Users ({uniqueLogUsers.length})</option>
                  {uniqueLogUsers.map((u, i) => (
                    <option key={`log-usr-opt-${u.email}-${i}`} value={u.email}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>

                {/* Login Type Filter Dropdown */}
                <select
                  value={logUserTypeFilter}
                  onChange={e => setLogUserTypeFilter(e.target.value as 'all' | 'email' | 'guest')}
                  className="py-1.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold focus:outline-amber-600 cursor-pointer"
                >
                  <option value="all">All Login Types</option>
                  <option value="email">Email Logins</option>
                  <option value="guest">Guest Logins</option>
                </select>
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
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-600" />
                    <span>System Administrators ({adminEmails.length})</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Admin control panel access aur privileges wale accounts.
                  </p>
                </div>
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

          {/* TAB 6: KIDS GRAMMAR 3RD - 8TH */}
          {activeTab === 'grammar' && (
            <div className="space-y-4">
              {/* Clean Grammar Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-amber-600" />
                    <span>Grammar Tests & Student Scores ({filteredGrammarResults.length})</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Class 3rd to 8th grammar tests aur student results ka record.
                  </p>
                </div>

                {(grammarClassFilter !== 'all' || grammarTopicFilter !== 'all' || grammarDifficultyFilter !== 'all' || grammarUserFilter !== 'all' || grammarSearch !== '') && (
                  <button
                    onClick={() => {
                      setGrammarClassFilter('all');
                      setGrammarTopicFilter('all');
                      setGrammarDifficultyFilter('all');
                      setGrammarUserFilter('all');
                      setGrammarSearch('');
                    }}
                    className="text-xs text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              {/* Clean Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={grammarSearch}
                    onChange={e => setGrammarSearch(e.target.value)}
                    placeholder="Search test or student..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-amber-600 font-medium"
                  />
                </div>

                {/* Class */}
                <select
                  value={grammarClassFilter}
                  onChange={e => setGrammarClassFilter(e.target.value)}
                  className="py-1.5 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold focus:outline-amber-600 cursor-pointer"
                >
                  <option value="all">All Classes (3-8)</option>
                  <option value="3">Class 3rd</option>
                  <option value="4">Class 4th</option>
                  <option value="5">Class 5th</option>
                  <option value="6">Class 6th</option>
                  <option value="7">Class 7th</option>
                  <option value="8">Class 8th</option>
                </select>

                {/* Topic */}
                <select
                  value={grammarTopicFilter}
                  onChange={e => setGrammarTopicFilter(e.target.value)}
                  className="py-1.5 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold focus:outline-amber-600 cursor-pointer truncate"
                >
                  <option value="all">All Topics</option>
                  {GRAMMAR_TOPICS.filter(t => t !== 'All Topics (Mixed Test)').map((topic, idx) => (
                    <option key={`g-topic-opt-${idx}`} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>

                {/* Level */}
                <select
                  value={grammarDifficultyFilter}
                  onChange={e => setGrammarDifficultyFilter(e.target.value)}
                  className="py-1.5 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold focus:outline-amber-600 cursor-pointer"
                >
                  <option value="all">All Levels</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                {/* Student Filter */}
                <select
                  value={grammarUserFilter}
                  onChange={e => setGrammarUserFilter(e.target.value)}
                  className="py-1.5 px-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold focus:outline-amber-600 cursor-pointer truncate"
                >
                  <option value="all">All Students ({grammarResults.length} Tests)</option>
                  {(Object.values(userGrammarStats) as UserGrammarStat[]).map((stat, idx) => (
                    <option key={`g-usr-${stat.email}-${idx}`} value={stat.email}>
                      {stat.name} ({stat.count} Tests)
                    </option>
                  ))}
                </select>
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
            <div className="space-y-4">
              {/* Clean Firestore Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-600" />
                    <span>Firestore Database Logs ({filteredFirestoreActivities.length})</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Real-time student activity aur generation logs from Firebase Firestore.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRefreshFirestoreData}
                  disabled={isFirestoreRefreshing || isFirestoreLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFirestoreRefreshing || isFirestoreLoading ? 'animate-spin' : ''}`} />
                  <span>{isFirestoreRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={firestoreSearch}
                    onChange={(e) => setFirestoreSearch(e.target.value)}
                    placeholder="Search user, paper ID, subject..."
                    className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium focus:outline-amber-600"
                  />
                </div>

                {/* User / Student Filter Dropdown */}
                <select
                  value={firestoreUserFilter}
                  onChange={(e) => setFirestoreUserFilter(e.target.value)}
                  className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-amber-600 cursor-pointer truncate"
                >
                  <option value="all">All Users ({uniqueFirestoreUsers.length})</option>
                  {uniqueFirestoreUsers.map((usr) => (
                    <option key={`fs-usr-opt-${usr.id || usr.email}`} value={usr.email || usr.id}>
                      {usr.name} ({usr.email || usr.id})
                    </option>
                  ))}
                </select>

                {/* Login Category Filter Dropdown */}
                <select
                  value={activityUserTypeFilter}
                  onChange={(e) => setActivityUserTypeFilter(e.target.value as 'all' | 'email' | 'guest')}
                  className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-amber-600 cursor-pointer"
                >
                  <option value="all">All Login Types</option>
                  <option value="email">Email Logins</option>
                  <option value="guest">Guest Logins</option>
                </select>

                {/* Activity Type Dropdown */}
                <select
                  value={firestoreActivityFilter}
                  onChange={(e) => setFirestoreActivityFilter(e.target.value as any)}
                  className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-amber-600 cursor-pointer"
                >
                  <option value="all">All Activities</option>
                  <option value="paper_generated">Paper Generations</option>
                  <option value="quiz_submitted">Quiz Submissions</option>
                  <option value="user_login">User Logins</option>
                </select>
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
                  {filteredFirestoreActivities.map((activity, idx) => {
                    const isLogin = activity.activityType === 'user_login' || activity.activityType === 'user_registered';
                    const isQuiz = activity.activityType === 'quiz_submitted';

                    return (
                      <div
                        key={activity.id || `act-${idx}`}
                        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 hover:border-orange-300 dark:hover:border-orange-800 transition-all shadow-2xs flex flex-wrap items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3 min-w-[280px]">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isLogin
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 border border-blue-300 dark:border-blue-800'
                              : isQuiz
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-600 border border-amber-300 dark:border-amber-800'
                          }`}>
                            {isLogin ? (
                              <UserCheck className="w-5 h-5" />
                            ) : isQuiz ? (
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
                                isLogin
                                  ? 'bg-blue-600 text-white'
                                  : isQuiz
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}>
                                {isLogin ? 'User Login' : isQuiz ? 'Quiz Submitted' : 'Paper Generated'}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-1">
                              {activity.studentName} ({activity.studentEmail})
                            </h4>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                              {isLogin ? (
                                <span className="font-medium text-stone-600 dark:text-stone-300">Student authenticated successfully into portal</span>
                              ) : (
                                <>{activity.subject} • Class {activity.classLevel}th • Paper Title: <span className="font-semibold text-stone-700 dark:text-stone-300">{activity.paperTitle}</span></>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Paper ID & Quiz Score Mapping Details */}
                        <div className="flex items-center gap-4">
                          {!isLogin && (
                            <div className="bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-right">
                              <span className="text-[10px] font-black text-stone-400 uppercase block">Mapped Paper ID / Code</span>
                              <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                                {activity.paperCode || activity.paperId}
                              </span>
                            </div>
                          )}

                          {isQuiz && activity.score !== undefined && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-right">
                              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase block">Test Score</span>
                              <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                                {activity.score} / {activity.totalMarks || 0} ({activity.percentage || 0}%)
                              </span>
                            </div>
                          )}

                          <div className="text-right text-[11px] text-stone-400">
                            {(() => {
                              const rawT = activity.timestamp;
                              let d = new Date(rawT);
                              if (isNaN(d.getTime())) d = new Date();
                              return (
                                <>
                                  <p>{d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                  <p>{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: QUESTION IMPORTER (PDF / WORD / TEXT) */}
          {activeTab === 'importer' && (
            <div className="space-y-4">
              {/* Clean Importer Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Database className="w-5 h-5 text-sky-600" />
                    <span>Question Vault & AI Importer ({serverCustomQuestions.length})</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    PDF, Word (.docx) ya text se questions import aur classify karein.
                  </p>
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

          {/* TAB: FEEDBACKS & IMPROVEMENT IDEAS */}
          {mainTab === 'feedbacks' && (
            <div className="space-y-4">
              {/* Clean Feedbacks Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    <span>User Feedbacks & Suggestions ({feedbacksList.length})</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Students aur teachers ke dwara submit kiye gaye sujhaav aur bug reports.
                  </p>
                </div>

                <button
                  onClick={() => fetchAllFeedbacks().then(data => setFeedbacksList(data))}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto border border-stone-200 dark:border-stone-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-stone-50 dark:bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
                  <Search className="w-4 h-4 text-stone-400 shrink-0" />
                  <input
                    type="text"
                    value={feedbackSearch}
                    onChange={(e) => setFeedbackSearch(e.target.value)}
                    placeholder="Search by user email, name, message..."
                    className="w-full bg-transparent outline-none text-stone-900 dark:text-stone-100 font-medium"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={feedbackCategoryFilter}
                    onChange={(e) => setFeedbackCategoryFilter(e.target.value)}
                    className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-bold rounded-xl px-3 py-1.5 outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="feature_idea">Feature Ideas</option>
                    <option value="bug">Bugs / Issues</option>
                    <option value="wrong_question">Wrong Questions</option>
                    <option value="general">General</option>
                  </select>

                  <select
                    value={feedbackStatusFilter}
                    onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                    className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-bold rounded-xl px-3 py-1.5 outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Feedback List */}
              {(() => {
                const filtered = feedbacksList.filter(item => {
                  const matchCat = feedbackCategoryFilter === 'all' || item.category === feedbackCategoryFilter;
                  const matchStatus = feedbackStatusFilter === 'all' || item.status === feedbackStatusFilter;
                  const matchSearch = !feedbackSearch || 
                    (item.message && item.message.toLowerCase().includes(feedbackSearch.toLowerCase())) ||
                    (item.userEmail && item.userEmail.toLowerCase().includes(feedbackSearch.toLowerCase())) ||
                    (item.userName && item.userName.toLowerCase().includes(feedbackSearch.toLowerCase()));
                  return matchCat && matchStatus && matchSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center text-stone-500">
                      <p className="font-bold text-sm">No feedbacks or suggestions found.</p>
                      <p className="text-xs text-stone-400 mt-1">Users can submit feedback anytime using the bottom-left floating button.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((fb) => (
                      <div
                        key={fb.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          fb.status === 'resolved'
                            ? 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-80'
                            : 'bg-white dark:bg-stone-900 border-emerald-500/30 shadow-md'
                        }`}
                      >
                        <div className="space-y-2">
                          {/* Header badges */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              fb.category === 'bug'
                                ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                : fb.category === 'wrong_question'
                                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                                : fb.category === 'feature_idea'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-blue-100 text-blue-700 border border-blue-300'
                            }`}>
                              {fb.category.replace('_', ' ')}
                            </span>

                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    fb.rating >= s ? 'fill-amber-400 text-amber-500' : 'text-stone-300 dark:text-stone-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Message */}
                          <p className="text-xs font-medium text-stone-900 dark:text-stone-100 leading-relaxed whitespace-pre-wrap">
                            "{fb.message}"
                          </p>

                          {/* Context */}
                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-stone-500 dark:text-stone-400 pt-1">
                            <span>Class {fb.classLevel || 'General'}</span>
                            <span>•</span>
                            <span>{fb.subject || 'General'}</span>
                          </div>
                        </div>

                        {/* Footer Meta & Actions */}
                        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 text-[11px]">
                          <div>
                            <span className="font-bold text-stone-800 dark:text-stone-200 block">{fb.userName || 'Anonymous'}</span>
                            <span className="text-stone-400 text-[10px]">{fb.userEmail} • {new Date(fb.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                const nextStatus = fb.status === 'resolved' ? 'pending' : 'resolved';
                                await updateFeedbackStatus(fb.id, nextStatus);
                                setFeedbacksList(prev => prev.map(f => f.id === fb.id ? { ...f, status: nextStatus } : f));
                              }}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                                fb.status === 'resolved'
                                  ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                              }`}
                            >
                              {fb.status === 'resolved' ? 'Mark Pending' : '✓ Mark Resolved'}
                            </button>

                            <button
                              onClick={async () => {
                                await deleteFeedbackItem(fb.id);
                                setFeedbacksList(prev => prev.filter(f => f.id !== fb.id));
                              }}
                              className="p-1 rounded-lg text-stone-400 hover:text-rose-600 transition-colors"
                              title="Delete Feedback"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: QUESTION BANK & PAPER SETS */}
          {activeTab === 'questionBank' && (
            <div className="space-y-4">
              {/* Clean Question Bank Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    <span>Question Bank & Paper Sets ({filteredQbSets.length})</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Class-wise and subject-wise ready test paper sets.
                  </p>
                </div>

                <button
                  onClick={() => {
                    resetQbForm();
                    setShowQbModal(true);
                  }}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Paper Set</span>
                </button>
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* Search Title / Content */}
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search sets by title or subject..."
                    value={qbSearch}
                    onChange={(e) => setQbSearch(e.target.value)}
                    className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 pl-9 pr-3 py-1.5 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-amber-600"
                  />
                </div>

                {/* Class Filter */}
                <select
                  value={qbClassFilter}
                  onChange={(e) => setQbClassFilter(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-amber-600 cursor-pointer"
                >
                  <option value="all">All Classes</option>
                  <option value="12">Class 12th Board</option>
                  <option value="11">Class 11th Annual</option>
                  <option value="10">Class 10th Board</option>
                  <option value="9">Class 9th Annual</option>
                  <option value="8">Class 8th</option>
                  <option value="7">Class 7th</option>
                  <option value="6">Class 6th</option>
                </select>

                {/* Subject Filter */}
                <select
                  value={qbSubjectFilter}
                  onChange={(e) => setQbSubjectFilter(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-amber-600 cursor-pointer"
                >
                  <option value="all">All Subjects</option>
                  <option value="Science">Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Social Science">Social Science</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Accountancy">Accountancy</option>
                  <option value="Economics">Economics</option>
                  <option value="Computer Science">Computer Science</option>
                </select>

                {/* Marks Filter */}
                <select
                  value={qbMarksFilter}
                  onChange={(e) => setQbMarksFilter(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-amber-600 cursor-pointer"
                >
                  <option value="all">All Total Marks</option>
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
