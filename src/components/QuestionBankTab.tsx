import React, { useState, useMemo, useEffect } from 'react';
import { PRELOADED_QUESTIONS, CBSE_SUBJECTS } from '../data/cbseData';
import { Question, QuestionType, DifficultyLevel, QuestionBankSet } from '../types';
import { fetchQuestionBankSets } from '../utils/questionBankService';
import { 
  Search, 
  Database, 
  Plus, 
  Check, 
  Filter, 
  Award, 
  Sparkles, 
  BookOpen, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Layers, 
  ListFilter, 
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  FolderOpen,
  Eye,
  Download,
  X
} from 'lucide-react';

interface QuestionBankTabProps {
  customCart: Question[];
  setCustomCart: (cart: Question[]) => void;
  onBuildCustomPaper: () => void;
}

// Class options
const CLASS_OPTIONS = [
  { id: 'all', label: 'All Classes (सभी कक्षाएं)', badge: '3rd-12th' },
  { id: '10', label: 'Class 10th (Board)', badge: 'Class 10' },
  { id: '12', label: 'Class 12th (Board)', badge: 'Class 12' },
  { id: '9', label: 'Class 9th (Annual)', badge: 'Class 9' },
  { id: '11', label: 'Class 11th (Annual)', badge: 'Class 11' },
  { id: '8', label: 'Class 8th (Annual)', badge: 'Class 8' },
  { id: '7', label: 'Class 7th (Annual)', badge: 'Class 7' },
  { id: '6', label: 'Class 6th (Annual)', badge: 'Class 6' },
  { id: '5', label: 'Class 5th (Primary)', badge: 'Class 5' },
  { id: '4', label: 'Class 4th (Primary)', badge: 'Class 4' },
  { id: '3', label: 'Class 3rd (Primary)', badge: 'Class 3' },
];

// Marks options
const MARKS_OPTIONS = [
  { id: 'all', label: 'All Marks (1M - 5M)', sub: 'All Questions' },
  { id: '1', label: '1 Mark Questions', sub: 'MCQs & Assertion-Reason' },
  { id: '2', label: '2 Marks Questions', sub: 'Very Short Answer (VSA)' },
  { id: '3', label: '3 Marks Questions', sub: 'Short Answer (SA)' },
  { id: '4', label: '4 Marks Questions', sub: 'Case Study / Source Based' },
  { id: '5', label: '5 Marks Questions', sub: 'Long Answer (LA)' },
];

// Determine class for a question
function getQuestionClass(q: Question): string {
  if (q.subjectId.startsWith('class12-')) return '12';
  if (q.subjectId.startsWith('class11-')) return '11';
  if (q.subjectId.startsWith('class9-')) return '9';
  if (q.subjectId.startsWith('class8-')) return '8';
  if (q.subjectId.startsWith('class7-')) return '7';
  if (q.subjectId.startsWith('class6-')) return '6';
  if (q.subjectId.startsWith('class5-')) return '5';
  if (q.subjectId.startsWith('class4-')) return '4';
  if (q.subjectId.startsWith('class3-')) return '3';
  if (q.chapterId.includes('c8') || q.id.includes('c8')) return '8';
  if (q.chapterId.includes('c7') || q.id.includes('c7')) return '7';
  if (q.chapterId.includes('c6') || q.id.includes('c6')) return '6';
  if (q.chapterId.includes('c5') || q.id.includes('c5')) return '5';
  if (q.chapterId.includes('c4') || q.id.includes('c4')) return '4';
  if (q.chapterId.includes('c3') || q.id.includes('c3')) return '3';
  if (q.chapterId.includes('12') || q.id.includes('c12')) return '12';
  if (q.chapterId.includes('11') || q.id.includes('c11')) return '11';
  if (q.chapterId.includes('c9') || q.id.includes('c9')) return '9';
  return '10'; // Default Class 10
}

export const QuestionBankTab: React.FC<QuestionBankTabProps> = ({
  customCart,
  setCustomCart,
  onBuildCustomPaper
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('10'); // Default Class 10
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedMarks, setSelectedMarks] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Grouping mode: 'marks' | 'chapter' | 'flat'
  const [groupMode, setGroupMode] = useState<'marks' | 'chapter' | 'flat'>('marks');
  
  // Question Bank Full Paper Sets State
  const [viewMode, setViewMode] = useState<'questions' | 'sets'>('questions');
  const [qbSets, setQbSets] = useState<QuestionBankSet[]>([]);
  const [selectedSetPreview, setSelectedSetPreview] = useState<QuestionBankSet | null>(null);

  useEffect(() => {
    fetchQuestionBankSets().then(sets => {
      if (Array.isArray(sets)) setQbSets(sets);
    }).catch(err => console.warn('Failed to fetch QB sets:', err));
  }, []);

  // State for showing solution toggles per question
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const cartQuestionIds = useMemo(() => new Set(customCart.map(q => q.id)), [customCart]);

  // Master question list with class tag
  const allQuestionsWithClass = useMemo(() => {
    return PRELOADED_QUESTIONS.map(q => ({
      ...q,
      classNum: getQuestionClass(q)
    }));
  }, []);

  // Filter available subjects based on selected class
  const availableSubjects = useMemo(() => {
    if (selectedClass === 'all') return CBSE_SUBJECTS;
    if (selectedClass === '12') {
      return CBSE_SUBJECTS.filter(s => s.id.startsWith('class12-') || s.id === 'class12-physics-042');
    }
    if (selectedClass === '11') {
      return CBSE_SUBJECTS.filter(s => s.id.startsWith('class11-'));
    }
    if (selectedClass === '9') {
      return CBSE_SUBJECTS.filter(s => s.id.startsWith('class9-'));
    }
    // Class 10
    return CBSE_SUBJECTS.filter(s => 
      !s.id.startsWith('class12-') && 
      !s.id.startsWith('class11-') && 
      !s.id.startsWith('class9-')
    );
  }, [selectedClass]);

  // Handle class change reset
  const handleClassChange = (cls: string) => {
    setSelectedClass(cls);
    setSelectedSubject('all');
    setSelectedChapter('all');
  };

  // Filter questions based on all criteria
  const filteredQuestions = useMemo(() => {
    return allQuestionsWithClass.filter(q => {
      // Class filter
      if (selectedClass !== 'all' && q.classNum !== selectedClass) {
        return false;
      }
      // Subject filter
      if (selectedSubject !== 'all' && q.subjectId !== selectedSubject) {
        return false;
      }
      // Marks filter
      if (selectedMarks !== 'all' && q.marks !== Number(selectedMarks)) {
        return false;
      }
      // Type filter
      if (selectedType !== 'all' && q.type !== selectedType) {
        return false;
      }
      // Chapter filter
      if (selectedChapter !== 'all' && q.chapterName !== selectedChapter) {
        return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchText = q.questionText.toLowerCase().includes(query) ||
                          q.chapterName.toLowerCase().includes(query) ||
                          (q.casePassage && q.casePassage.toLowerCase().includes(query)) ||
                          (q.correctAnswer && q.correctAnswer.toLowerCase().includes(query));
        if (!matchText) return false;
      }
      return true;
    });
  }, [allQuestionsWithClass, selectedClass, selectedSubject, selectedMarks, selectedType, selectedChapter, selectedDifficulty, searchQuery]);

  // Filter full paper sets
  const filteredSets = useMemo(() => {
    return qbSets.filter(s => {
      if (selectedClass !== 'all' && String(s.classLevel) !== String(selectedClass)) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const match = s.title.toLowerCase().includes(q) || s.subject.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [qbSets, selectedClass, searchQuery]);

  // Unique chapters available in current filtered list
  const availableChapters = useMemo(() => {
    const chapters = new Set<string>();
    allQuestionsWithClass.forEach(q => {
      if ((selectedClass === 'all' || q.classNum === selectedClass) &&
          (selectedSubject === 'all' || q.subjectId === selectedSubject)) {
        chapters.add(q.chapterName);
      }
    });
    return Array.from(chapters).sort();
  }, [allQuestionsWithClass, selectedClass, selectedSubject]);

  // Marks stats breakdown
  const marksBreakdown = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, total: filteredQuestions.length };
    filteredQuestions.forEach(q => {
      if (q.marks >= 1 && q.marks <= 5) {
        counts[q.marks as keyof typeof counts]++;
      }
    });
    return counts;
  }, [filteredQuestions]);

  // Group questions by Marks
  const groupedByMarks = useMemo(() => {
    const map: Record<number, (Question & { classNum?: string })[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    filteredQuestions.forEach(q => {
      const m = q.marks >= 5 ? 5 : q.marks <= 1 ? 1 : q.marks;
      if (!map[m]) map[m] = [];
      map[m].push(q);
    });
    return map;
  }, [filteredQuestions]);

  // Group questions by Chapter
  const groupedByChapter = useMemo(() => {
    const map: Record<string, (Question & { classNum?: string })[]> = {};
    filteredQuestions.forEach(q => {
      if (!map[q.chapterName]) map[q.chapterName] = [];
      map[q.chapterName].push(q);
    });
    return map;
  }, [filteredQuestions]);

  const toggleCart = (q: Question) => {
    if (cartQuestionIds.has(q.id)) {
      setCustomCart(customCart.filter(item => item.id !== q.id));
    } else {
      setCustomCart([...customCart, q]);
    }
  };

  const toggleSolution = (qId: string) => {
    setExpandedSolutions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const copyQuestionText = (q: Question) => {
    const textToCopy = `[${q.marks} Mark${q.marks > 1 ? 's' : ''}] ${q.questionText}\n\nAnswer: ${q.correctAnswer}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMarksBadgeColor = (marks: number) => {
    switch (marks) {
      case 1: return 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-900/40 dark:text-sky-200';
      case 2: return 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-200';
      case 3: return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200';
      case 4: return 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200';
      case 5: return 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200';
      default: return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    }
  };

  const renderQuestionCard = (q: Question & { classNum?: string }, index: number) => {
    const inCart = cartQuestionIds.has(q.id);
    const showSolution = !!expandedSolutions[q.id];
    const isCopied = copiedId === q.id;

    return (
      <div
        key={q.id}
        className={`bg-white dark:bg-stone-900 rounded-2xl p-5 border transition-all space-y-3 relative ${
          inCart 
            ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/30' 
            : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 shadow-xs'
        }`}
      >
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Class Badge */}
            <span className="bg-stone-900 text-white dark:bg-stone-800 dark:text-stone-200 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-stone-700">
              Class {q.classNum || getQuestionClass(q)}th
            </span>

            {/* Marks Badge */}
            <span className={`font-mono font-extrabold text-[11px] px-2.5 py-0.5 rounded-md border ${getMarksBadgeColor(q.marks)}`}>
              {q.marks} Mark{q.marks > 1 ? 's' : ''} ({q.type.toUpperCase()})
            </span>

            {/* Chapter Badge */}
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md line-clamp-1 max-w-[220px]">
              {q.chapterName}
            </span>

            {q.isCompetency && (
              <span className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-300/60">
                Competency
              </span>
            )}

            {q.pyqYear && (
              <span className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-300/60">
                CBSE {q.pyqYear}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyQuestionText(q)}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Copy Question Text"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => toggleCart(q)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                inCart
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20'
                  : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
              }`}
            >
              {inCart ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{inCart ? 'Added to Paper' : 'Add to Paper'}</span>
            </button>
          </div>
        </div>

        {/* Case Study Passage */}
        {q.casePassage && (
          <div className="case-study-container bg-amber-50/90 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-300/70 dark:border-amber-800/60 my-2">
            <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-200 font-black text-xs uppercase tracking-wider mb-1.5 border-b border-amber-200/60 dark:border-amber-800 pb-1">
              <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Case Study Passage:</span>
            </div>
            <div className="text-stone-900 dark:text-stone-200 text-sm font-serif italic leading-relaxed whitespace-pre-line">
              {q.casePassage}
            </div>
          </div>
        )}

        {/* Question Text */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 whitespace-pre-line leading-relaxed">
            <span className="text-stone-400 mr-2 font-mono">Q{index + 1}.</span>
            {q.questionText}
          </p>

          {/* Options for MCQs */}
          {q.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-stone-800 dark:text-stone-200 pt-1 pl-4">
              {q.options.map((opt, idx) => (
                <div key={`opt-${q.id}-${idx}`} className="bg-stone-50 dark:bg-stone-800/80 p-2 rounded-lg border border-stone-200/60 dark:border-stone-700">
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Solution Toggle & Box */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80">
          <button
            onClick={() => toggleSolution(q.id)}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer py-1"
          >
            {showSolution ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showSolution ? 'Hide Solution & Marking Scheme' : 'View Answer & Marking Scheme'}</span>
          </button>

          {showSolution && (
            <div className="mt-2 p-3 bg-emerald-50/70 dark:bg-stone-850 rounded-xl text-xs text-stone-800 dark:text-stone-200 border border-emerald-200/80 dark:border-stone-700 space-y-1.5 animate-in fade-in duration-200">
              <div>
                <span className="font-extrabold text-emerald-900 dark:text-emerald-300 font-sans mr-2">Official Answer / Solution:</span>
                <p className="whitespace-pre-line text-stone-900 dark:text-stone-100 mt-1 font-mono text-[11px] leading-relaxed">
                  {q.correctAnswer}
                </p>
              </div>

              {q.markingScheme && (
                <div className="pt-2 border-t border-emerald-200/50 dark:border-stone-800">
                  <span className="font-bold text-stone-700 dark:text-stone-300 mr-2">CBSE Marking Scheme:</span>
                  <span className="text-stone-600 dark:text-stone-400 font-mono text-[11px] whitespace-pre-line">
                    {q.markingScheme}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 bg-emerald-800/90 border border-emerald-700 text-emerald-200 px-3.5 py-1 rounded-full text-xs font-extrabold">
            <Database className="w-3.5 h-3.5 text-amber-300" />
            <span>Class-wise & Marks-wise CBSE Official Question Bank</span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-stone-800 p-1 rounded-xl border border-stone-700 flex items-center gap-1">
              <button
                onClick={() => setViewMode('questions')}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  viewMode === 'questions'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Individual Questions ({filteredQuestions.length})
              </button>
              <button
                onClick={() => setViewMode('sets')}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'sets'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-300" />
                <span>Question Paper Sets ({filteredSets.length})</span>
              </button>
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          CBSE Systematic Question Bank & Custom Builder
        </h1>
        <p className="text-xs sm:text-sm text-stone-300 max-w-3xl leading-relaxed">
          Filter and explore questions strictly arranged by Class (9th, 10th, 11th, 12th), Subject, Chapter, and Marks (1M MCQs/AR, 2M VSA, 3M SA, 4M Case Studies, 5M Long Answers). Select questions to build custom test papers instantly.
        </p>

        {/* Class Selection Tabs */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-stone-800">
          <span className="text-xs font-bold text-stone-400 mr-1 flex items-center gap-1">
            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
            Select Class:
          </span>
          {CLASS_OPTIONS.map((c) => {
            const isActive = selectedClass === c.id;
            return (
              <button
                key={c.id}
                onClick={() => handleClassChange(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 ring-2 ring-emerald-400'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Questions Cart Banner */}
      {customCart.length > 0 && (
        <div className="bg-emerald-800 text-white p-4 sm:p-5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 border border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-900/90 p-2.5 rounded-xl border border-emerald-600">
              <BookOpen className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="font-black text-sm text-white">
                {customCart.length} Question{customCart.length > 1 ? 's' : ''} Selected in Your Custom Vault
              </p>
              <p className="text-xs text-emerald-100 font-bold mt-0.5">
                Total Weightage: <span className="text-amber-300 font-black">{customCart.reduce((acc, q) => acc + q.marks, 0)} Marks</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCustomCart([])}
              className="bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-700 transition-colors cursor-pointer"
            >
              Clear Cart
            </button>
            <button
              onClick={onBuildCustomPaper}
              className="bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Generate Paper from Selected ({customCart.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE: FULL QUESTION PAPER SETS */}
      {viewMode === 'sets' ? (
        filteredSets.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-12 text-center border border-stone-200 dark:border-stone-800 space-y-3">
            <BookOpen className="w-12 h-12 text-purple-400 mx-auto" />
            <h3 className="text-base font-black text-stone-800 dark:text-stone-200">
              No Question Paper Sets Found for Class {selectedClass === 'all' ? 'All' : selectedClass}
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              अभी इस क्लास के लिए एडमिन द्वारा कोई पेपर सेट नहीं बनाया गया है या सर्च से मैच नहीं हो रहा।
            </p>
            <button
              onClick={() => {
                setSelectedClass('all');
                setSearchQuery('');
              }}
              className="bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow cursor-pointer mt-2"
            >
              Show All Paper Sets
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSets.map((setObj) => (
              <div
                key={setObj.id}
                className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm hover:border-purple-400 dark:hover:border-purple-800 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg">
                      Class {setObj.classLevel}th
                    </span>
                    <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg">
                      {setObj.subject}
                    </span>
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg">
                      {setObj.totalMarks} Marks • {setObj.timeAllowed || '1 Hour'}
                    </span>
                    {setObj.fileUrl && (
                      <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-600" />
                        <span>PDF / Doc Attached</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-stone-900 dark:text-stone-100 leading-tight">
                      {setObj.title}
                    </h3>
                    {setObj.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                        {setObj.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-400 font-medium">
                    By {setObj.createdBy || 'Mukesh (Admin)'}
                  </span>
                  <button
                    onClick={() => setSelectedSetPreview(setObj)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Paper & Solutions</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* VIEW MODE: INDIVIDUAL QUESTIONS */
        <>
          {/* Comprehensive Filter Controls */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-extrabold text-sm">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span>Filter & Refine Question Bank</span>
          </div>

          {/* Grouping Mode Toggle */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <button
              onClick={() => setGroupMode('marks')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                groupMode === 'marks'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Group by Marks
            </button>
            <button
              onClick={() => setGroupMode('chapter')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                groupMode === 'chapter'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Group by Chapter
            </button>
            <button
              onClick={() => setGroupMode('flat')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                groupMode === 'flat'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              All List
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keyword or topic..."
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-600 outline-none font-medium"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedChapter('all');
              }}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
            >
              <option value="all">All Subjects (सभी विषय)</option>
              {availableSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* Marks Filter */}
          <div>
            <select
              value={selectedMarks}
              onChange={(e) => setSelectedMarks(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
            >
              {MARKS_OPTIONS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Typology Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
            >
              <option value="all">All Question Types</option>
              <option value="mcq">1M - MCQ / Objective</option>
              <option value="ar">1M - Assertion-Reasoning</option>
              <option value="vsa">2M - Very Short Answer</option>
              <option value="sa">3M - Short Answer</option>
              <option value="case">4M - Case Study</option>
              <option value="la">5M - Long Answer</option>
            </select>
          </div>

          {/* Chapter Filter */}
          <div>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
            >
              <option value="all">All Chapters ({availableChapters.length})</option>
              {availableChapters.map(ch => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Marks Breakdown Pills */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-stone-100 dark:border-stone-800">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mr-1">
            Marks Breakdown:
          </span>
          <button
            onClick={() => setSelectedMarks('1')}
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border cursor-pointer transition-all ${
              selectedMarks === '1' ? 'ring-2 ring-emerald-600' : ''
            } ${getMarksBadgeColor(1)}`}
          >
            1 Mark ({marksBreakdown[1]})
          </button>
          <button
            onClick={() => setSelectedMarks('2')}
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border cursor-pointer transition-all ${
              selectedMarks === '2' ? 'ring-2 ring-emerald-600' : ''
            } ${getMarksBadgeColor(2)}`}
          >
            2 Marks ({marksBreakdown[2]})
          </button>
          <button
            onClick={() => setSelectedMarks('3')}
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border cursor-pointer transition-all ${
              selectedMarks === '3' ? 'ring-2 ring-emerald-600' : ''
            } ${getMarksBadgeColor(3)}`}
          >
            3 Marks ({marksBreakdown[3]})
          </button>
          <button
            onClick={() => setSelectedMarks('4')}
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border cursor-pointer transition-all ${
              selectedMarks === '4' ? 'ring-2 ring-emerald-600' : ''
            } ${getMarksBadgeColor(4)}`}
          >
            4 Marks Case ({marksBreakdown[4]})
          </button>
          <button
            onClick={() => setSelectedMarks('5')}
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border cursor-pointer transition-all ${
              selectedMarks === '5' ? 'ring-2 ring-emerald-600' : ''
            } ${getMarksBadgeColor(5)}`}
          >
            5 Marks LA ({marksBreakdown[5]})
          </button>
          {(selectedMarks !== 'all' || selectedSubject !== 'all' || selectedChapter !== 'all' || searchQuery !== '') && (
            <button
              onClick={() => {
                setSelectedMarks('all');
                setSelectedSubject('all');
                setSelectedChapter('all');
                setSelectedType('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Question Listing Display */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-12 text-center border border-stone-200 dark:border-stone-800 space-y-3">
          <Database className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto" />
          <h3 className="text-base font-black text-stone-800 dark:text-stone-200">No questions found matching your criteria</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Try resetting your filters or selecting a different subject or class.
          </p>
          <button
            onClick={() => {
              setSelectedClass('all');
              setSelectedSubject('all');
              setSelectedMarks('all');
              setSelectedChapter('all');
              setSearchQuery('');
            }}
            className="bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow cursor-pointer mt-2"
          >
            Show All Questions
          </button>
        </div>
      ) : groupMode === 'marks' ? (
        /* Systematic Grouping by Marks (Section A to E) */
        <div className="space-y-8">
          {[1, 2, 3, 4, 5].map((m) => {
            const list = groupedByMarks[m] || [];
            if (list.length === 0) return null;

            const sectionTitles: Record<number, { title: string; desc: string }> = {
              1: { title: "SECTION A: 1 Mark Questions (Objective & Assertion-Reason)", desc: "1 Mark Each • MCQs, Fill-ups & Assertion-Reasoning" },
              2: { title: "SECTION B: 2 Marks Questions (Very Short Answer - VSA)", desc: "2 Marks Each • Concise conceptual and numerical answers" },
              3: { title: "SECTION C: 3 Marks Questions (Short Answer - SA)", desc: "3 Marks Each • Detailed multi-step derivations & reasoning" },
              4: { title: "SECTION D: 4 Marks Questions (Case-Based Integrated Units)", desc: "4 Marks Each • Source-based & real-world competency scenarios" },
              5: { title: "SECTION E: 5 Marks Questions (Long Answer - LA)", desc: "5 Marks Each • Comprehensive long answers & proofs" },
            };

            const sec = sectionTitles[m];

            return (
              <div key={`marks-sec-${m}`} className="space-y-4">
                {/* Section Header Banner */}
                <div className="bg-stone-900 text-white p-4 rounded-2xl border border-stone-800 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${m === 1 ? 'bg-sky-400' : m === 2 ? 'bg-indigo-400' : m === 3 ? 'bg-amber-400' : m === 4 ? 'bg-rose-400' : 'bg-purple-400'}`} />
                      {sec.title}
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">{sec.desc}</p>
                  </div>
                  <span className="bg-stone-800 border border-stone-700 text-emerald-300 text-xs font-mono font-extrabold px-3 py-1 rounded-xl">
                    {list.length} Questions
                  </span>
                </div>

                {/* Section Cards */}
                <div className="space-y-3">
                  {list.map((q, idx) => renderQuestionCard(q, idx))}
                </div>
              </div>
            );
          })}
        </div>
      ) : groupMode === 'chapter' ? (
        /* Systematic Grouping by Chapter */
        <div className="space-y-8">
          {(Object.entries(groupedByChapter) as [string, (Question & { classNum?: string })[]][]).map(([chapterName, list]) => (
            <div key={chapterName} className="space-y-4">
              <div className="bg-stone-900 text-white p-4 rounded-2xl border border-stone-800 flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    Chapter: {chapterName}
                  </h3>
                  <p className="text-xs text-stone-400">Class {list[0]?.classNum || '10'} • {list.length} Questions</p>
                </div>
                <span className="bg-stone-800 border border-stone-700 text-emerald-300 text-xs font-mono font-extrabold px-3 py-1 rounded-xl">
                  {list.length} Questions
                </span>
              </div>

              <div className="space-y-3">
                {list.map((q, idx) => renderQuestionCard(q, idx))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Flat List */
        <div className="space-y-3">
          {filteredQuestions.map((q, idx) => renderQuestionCard(q, idx))}
        </div>
      )}
        </>
      )}

      {/* STUDENT / TEACHER PAPER SET PREVIEW MODAL */}
      {selectedSetPreview && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-3xl w-full my-auto overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 via-stone-900 to-purple-950 text-white p-5 flex items-center justify-between border-b border-purple-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-purple-400 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                    Class {selectedSetPreview.classLevel}th • {selectedSetPreview.subject}
                  </span>
                  <span className="bg-emerald-400 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                    {selectedSetPreview.totalMarks} Marks
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1">
                  {selectedSetPreview.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedSetPreview(null)}
                className="text-purple-200 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-header */}
            <div className="bg-purple-50 dark:bg-purple-950/40 p-4 border-b border-purple-200 dark:border-purple-800 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-stone-800 dark:text-stone-200">
              <div>
                <span>Time Allowed: {selectedSetPreview.timeAllowed || '1 Hour'}</span>
                {selectedSetPreview.description && <p className="text-stone-500 font-normal text-[11px] mt-0.5">{selectedSetPreview.description}</p>}
              </div>

              <div className="flex items-center gap-2">
                {selectedSetPreview.fileUrl && (
                  <a
                    href={selectedSetPreview.fileUrl}
                    download={`${selectedSetPreview.title.replace(/\s+/g, '_')}`}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Original File (PDF/Word)</span>
                  </a>
                )}
                <button
                  onClick={() => window.print()}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Print / Generate Formatted Paper</span>
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="bg-stone-50 dark:bg-stone-800/60 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 whitespace-pre-wrap font-mono text-xs text-stone-800 dark:text-stone-200 leading-relaxed">
                {selectedSetPreview.rawContent || 'No question paper text found for this set.'}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex justify-end">
              <button
                onClick={() => setSelectedSetPreview(null)}
                className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
