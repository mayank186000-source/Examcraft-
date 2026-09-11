import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  BookOpen, 
  Sparkles, 
  Award, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  Trophy, 
  Star, 
  GraduationCap, 
  Lightbulb, 
  Check, 
  BarChart2, 
  Search,
  KeyRound,
  History,
  Clock,
  Copy,
  CheckCheck,
  Bookmark
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  GRAMMAR_QUESTION_BANK, 
  GRAMMAR_TOPICS, 
  GrammarQuestion, 
  SavedGrammarResult, 
  saveGrammarResult, 
  getAllGrammarResults,
  getQuestionDifficulty
} from '../data/grammarQuestions';

export const GrammarQuizTab: React.FC = () => {
  const { currentUser } = useAuth();

  const [selectedClass, setSelectedClass] = useState<'3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'>('3');
  const [selectedTopic, setSelectedTopic] = useState<string>('All Topics (Mixed Test)');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(10);
  
  // Dedicated Mode & Tenses State
  const [activeMode, setActiveMode] = useState<'tenses' | 'general'>('tenses');
  const [selectedTenseType, setSelectedTenseType] = useState<string>('All');
  const [showTenseRulesModal, setShowTenseRulesModal] = useState<boolean>(false);

  // Test State
  const [quizQuestions, setQuizQuestions] = useState<GrammarQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  
  // Flow State: 'setup' | 'taking' | 'submitted' | 'lookup'
  const [quizState, setQuizState] = useState<'setup' | 'taking' | 'submitted' | 'lookup'>('setup');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeTakenSeconds, setTimeTakenSeconds] = useState<number>(0);

  // Test Code and Saved Results
  const [currentTestCode, setCurrentTestCode] = useState<string>('');
  const [searchCodeInput, setSearchCodeInput] = useState<string>('');
  const [lookupResult, setLookupResult] = useState<SavedGrammarResult | null>(null);
  const [searchError, setSearchError] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [recentSavedCodes, setRecentSavedCodes] = useState<SavedGrammarResult[]>([]);

  // Load saved results on mount
  useEffect(() => {
    const list = getAllGrammarResults();
    setRecentSavedCodes(list.slice(0, 10));
  }, [quizState]);

  // Helper: Generate unique test code (e.g. EG-5921)
  const generateTestCode = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `EG-${selectedClass}${num}`;
  };

  // Fisher-Yates shuffle helper
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // Start fresh random test based on Class, Topic, Difficulty & Question Count
  const startNewQuiz = () => {
    let selected: GrammarQuestion[] = [];
    const isTargetDiff = (q: GrammarQuestion) => getQuestionDifficulty(q) === selectedDifficulty;

    if (activeMode === 'tenses') {
      let tensesPool = GRAMMAR_QUESTION_BANK.filter(q => q.topic === 'Verbs & Tenses');
      if (selectedTenseType !== 'All') {
        tensesPool = tensesPool.filter(q => q.tenseType === selectedTenseType);
      }
      
      // 1. Same Class + Same Difficulty in Tenses Pool
      const exactMatch = shuffleArray(
        tensesPool.filter(q => q.classLevel === selectedClass && isTargetDiff(q))
      );
      selected = [...exactMatch];

      // 2. Same Class across other difficulties in Tenses Pool
      if (selected.length < questionCount) {
        const sameClassDiff = shuffleArray(
          tensesPool.filter(q => q.classLevel === selectedClass && !selected.includes(q))
        );
        selected = [...selected, ...sameClassDiff.slice(0, questionCount - selected.length)];
      }

      // 3. Other classes in Tenses Pool matching target difficulty
      if (selected.length < questionCount) {
        const otherClassesDiff = shuffleArray(
          tensesPool.filter(q => q.classLevel !== selectedClass && isTargetDiff(q) && !selected.includes(q))
        );
        selected = [...selected, ...otherClassesDiff.slice(0, questionCount - selected.length)];
      }

      // 4. Remaining Tenses Pool
      if (selected.length < questionCount) {
        const restTenses = shuffleArray(tensesPool.filter(q => !selected.includes(q)));
        selected = [...selected, ...restTenses.slice(0, questionCount - selected.length)];
      }
    } else if (selectedTopic === 'All Topics (Mixed Test)') {
      // 1. Same Class + Same Difficulty
      const exactMatch = shuffleArray(
        GRAMMAR_QUESTION_BANK.filter(q => q.classLevel === selectedClass && isTargetDiff(q))
      );
      selected = [...exactMatch];

      // 2. Same Difficulty from Other Classes
      if (selected.length < questionCount) {
        const diffOtherClasses = shuffleArray(
          GRAMMAR_QUESTION_BANK.filter(q => q.classLevel !== selectedClass && isTargetDiff(q))
        );
        selected = [...selected, ...diffOtherClasses.slice(0, questionCount - selected.length)];
      }

      // 3. Same Class across Other Difficulties
      if (selected.length < questionCount) {
        const sameClassRemaining = shuffleArray(
          GRAMMAR_QUESTION_BANK.filter(q => q.classLevel === selectedClass && !selected.includes(q))
        );
        selected = [...selected, ...sameClassRemaining.slice(0, questionCount - selected.length)];
      }
    } else {
      // STRICT TOPIC FILTERING
      // 1. Same Topic + Same Class + Same Difficulty
      const exactMatch = shuffleArray(
        GRAMMAR_QUESTION_BANK.filter(
          q => q.topic === selectedTopic && q.classLevel === selectedClass && isTargetDiff(q)
        )
      );
      selected = [...exactMatch];

      // 2. Same Topic + Same Difficulty (Other Classes)
      if (selected.length < questionCount) {
        const sameTopicDiffOtherClasses = shuffleArray(
          GRAMMAR_QUESTION_BANK.filter(
            q => q.topic === selectedTopic && q.classLevel !== selectedClass && isTargetDiff(q)
          )
        );
        selected = [...selected, ...sameTopicDiffOtherClasses.slice(0, questionCount - selected.length)];
      }

      // 3. Same Topic across Other Difficulties
      if (selected.length < questionCount) {
        const sameTopicOtherDiff = shuffleArray(
          GRAMMAR_QUESTION_BANK.filter(q => q.topic === selectedTopic && !selected.includes(q))
        );
        selected = [...selected, ...sameTopicOtherDiff.slice(0, questionCount - selected.length)];
      }
    }

    // Fallback: fill remaining if needed
    if (selected.length < questionCount) {
      const restBank = shuffleArray(GRAMMAR_QUESTION_BANK.filter(q => !selected.includes(q)));
      selected = [...selected, ...restBank.slice(0, questionCount - selected.length)];
    }

    // Final shuffle so question order is randomized each time
    const finalQuestions = shuffleArray(selected.slice(0, questionCount));

    setQuizQuestions(finalQuestions);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowHints({});
    setQuizState('taking');
    setStartTime(Date.now());
    setCurrentTestCode(generateTestCode());
  };

  const handleOptionSelect = (questionId: string, option: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const toggleHint = (questionId: string) => {
    setShowHints(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmitQuiz = () => {
    const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    setTimeTakenSeconds(elapsed);

    // Calculate score
    let score = 0;
    const evaluatedQuestions = quizQuestions.map(q => {
      const uAns = userAnswers[q.id] || '(Not Answered)';
      const isCorrect = uAns === q.correctAnswer;
      if (isCorrect) score++;
      return {
        questionText: q.questionText,
        topic: q.topic,
        difficulty: getQuestionDifficulty(q),
        userAnswer: uAns,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation
      };
    });

    const total = quizQuestions.length;
    const percentage = Math.round((score / (total || 1)) * 100);

    let activeUserEmail = currentUser?.email;
    let activeUserName = currentUser?.name;
    if (!activeUserEmail) {
      try {
        const saved = localStorage.getItem('examidea_current_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email) {
            activeUserEmail = parsed.email;
            activeUserName = parsed.name || parsed.email.split('@')[0];
          }
        }
      } catch {}
    }

    // Save Result to localStorage & Global Registry for Admin
    const newResult: SavedGrammarResult = {
      code: currentTestCode,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      classLevel: selectedClass,
      topic: selectedTopic,
      difficulty: selectedDifficulty,
      score,
      total,
      percentage,
      timeTakenSeconds: elapsed,
      userEmail: activeUserEmail || 'guest@examcraft.internal',
      userName: activeUserName || 'Guest Student (Guest)',
      questions: evaluatedQuestions
    };

    saveGrammarResult(newResult);
    setRecentSavedCodes(getAllGrammarResults().slice(0, 10));

    setQuizState('submitted');

    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleSearchResultCode = (codeToSearch?: string) => {
    const query = (codeToSearch || searchCodeInput).trim().toUpperCase();
    if (!query) {
      setSearchError('Please enter a valid Test Code (e.g., EG-5921)');
      return;
    }

    try {
      const stored = localStorage.getItem('examcraft_grammar_results');
      if (stored) {
        const list: SavedGrammarResult[] = JSON.parse(stored);
        const match = list.find(r => r.code.toUpperCase() === query);
        if (match) {
          setLookupResult(match);
          setSearchError('');
          setQuizState('lookup');
          return;
        }
      }
      setSearchError(`No test record found for Code "${query}". Please check the code.`);
    } catch (e) {
      setSearchError('Error retrieving test record.');
    }
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const calculateCurrentScore = () => {
    let score = 0;
    quizQuestions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) score++;
    });
    const percentage = Math.round((score / (quizQuestions.length || 1)) * 100);
    return { score, total: quizQuestions.length, percentage };
  };

  const currentQ = quizQuestions[currentQuestionIndex];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 border border-blue-700/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold tracking-wide">
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>Kids English Grammar Corner • Class 4th to 8th</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Interactive Grammar Practice & Test Records
            </h1>
            <p className="text-blue-100/90 text-sm leading-relaxed font-medium">
              Aasan rules ke saath grammar seekhein, dynamic online test dein, aur unique <b>Test Code</b> se kabhi bhi apna result & marks record check karein!
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {quizState !== 'setup' && (
              <button
                onClick={() => setQuizState('setup')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>New Test</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QUICK LOOKUP CODE BAR & SEARCH */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Check Past Student Result by Test Code:</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Enter Code (e.g. EG-5921)"
            value={searchCodeInput}
            onChange={(e) => setSearchCodeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchResultCode()}
            className="w-full sm:w-48 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSearchResultCode()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {searchError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {/* SETUP VIEW: CLASS & TOPIC SELECTOR */}
      {quizState === 'setup' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-lg space-y-8">
          {/* MAIN MODE SWITCHER: DEDICATED TENSES MASTER vs ALL GRAMMAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-500/30 dark:border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-md">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Practice Module</span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                    3rd-8th Special
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Select between Dedicated Tenses Practice or General Grammar Topics Exam
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('tenses');
                  setSelectedTopic('Verbs & Tenses');
                }}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeMode === 'tenses'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>🔥 Tenses Practice Hub</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('general')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeMode === 'general'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>📋 All Grammar Topics</span>
              </button>
            </div>
          </div>

          {/* DEDICATED TENSES CHEAT SHEET CALLOUT */}
          {activeMode === 'tenses' && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl shrink-0 mt-0.5">
                  <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                    <span>12 Tense Formulas & Rules Guide (Tense ke Rules aur Structure)</span>
                  </h4>
                  <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
                    Simple, Continuous, Perfect aur Perfect Continuous tenses ke saare formulas aur shortcuts ek jagah dekhein!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTenseRulesModal(true)}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>📖 Open 12 Tense Rules & Formulas</span>
              </button>
            </div>
          )}

          {/* STEP 1: SELECT CLASS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-lg">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">1</span>
              <h3>Select Your Class (Apni Class Chunein)</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const).map(cls => {
                const isSelected = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col justify-between space-y-2 cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Class</span>
                      {isSelected && <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      Class {cls}th
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {cls === '3' ? 'Beginner Basics, Nouns & Articles' : cls === '4' ? 'Primary Basics & Nouns/Articles' : cls === '5' ? 'Foundational Grammar & Easy Rules' : cls === '6' ? 'Intermediate Rules & Practice' : cls === '7' ? 'Active/Passive & Speech Basics' : cls === '8' ? 'Advanced Grammar & Error Spotting' : 'Board Grammar & Editing'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: TENSES QUESTION TYPE vs GENERAL GRAMMAR TOPIC */}
          {activeMode === 'tenses' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-lg">
                  <span className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black">2</span>
                  <h3>Select Tense Question Type (Tense Questions ka Prakar)</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[
                  { id: 'All', label: 'All Tenses Mixed', desc: 'Random mix of all tense questions', badge: 'Mixed' },
                  { id: 'Identify Tense', label: 'Identify Tense', desc: 'Find Simple, Continuous, Perfect name', badge: 'Names' },
                  { id: 'Fill Verb Form', label: 'Fill Verb Form', desc: 'Conjugate verbs in correct tense', badge: 'Verbs' },
                  { id: 'Tense Conversion', label: 'Tense Conversion', desc: 'Transform sentences into past/future', badge: 'Transform' },
                  { id: 'Error Spotting', label: 'Error Spotting', desc: 'Spot wrong tense verb usage', badge: 'Errors' }
                ].map(type => {
                  const isSelected = selectedTenseType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedTenseType(type.id)}
                      className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col justify-between space-y-2 cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/90 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100 shadow-md ring-2 ring-amber-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                          {type.badge}
                        </span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}
                      </div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {type.label}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {type.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-lg">
                <span className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black">2</span>
                <h3>Choose Grammar Topic</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {GRAMMAR_TOPICS.map(topic => {
                  const isSelected = selectedTopic === topic;
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setSelectedTopic(topic)}
                      className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{topic}</span>
                      {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: SELECT DIFFICULTY LEVEL */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-lg">
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">3</span>
              <h3>Select Difficulty Level (कठिनाई का स्तर चुनें)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'Easy' as const,
                  title: 'Easy (सरल Level)',
                  desc: 'Foundational grammar, basic rules & easy sentences',
                  badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
                  activeBorder: 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100'
                },
                {
                  id: 'Medium' as const,
                  title: 'Medium (मध्यम Level)',
                  desc: 'Standard school syllabus, rules application & practice',
                  badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
                  activeBorder: 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100'
                },
                {
                  id: 'Hard' as const,
                  title: 'Hard (कठिन Challenge)',
                  desc: 'Advanced rules, error spotting & tricky questions',
                  badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300',
                  activeBorder: 'border-rose-600 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100'
                }
              ].map(diff => {
                const isSelected = selectedDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff.id)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col justify-between space-y-2 cursor-pointer ${
                      isSelected
                        ? `${diff.activeBorder} shadow-md ring-2 ring-emerald-500/20`
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${diff.badgeBg}`}>
                        {diff.id} Level
                      </span>
                      {isSelected && <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      {diff.title}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {diff.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 4: QUESTION COUNT & LAUNCH */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Questions:</span>
              {[5, 10, 15].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    questionCount === num
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {num} Questions
                </button>
              ))}
            </div>

            <button
              onClick={startNewQuiz}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-black px-8 py-3.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate {selectedDifficulty} Test ({questionCount} Qs)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* RECENT SAVED RESULTS LIST */}
          {recentSavedCodes.length > 0 && (
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                <History className="w-4 h-4 text-blue-600" />
                <span>Your Recent Test Records & Saved Codes:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {recentSavedCodes.map(res => (
                  <div
                    key={res.code}
                    onClick={() => handleSearchResultCode(res.code)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-blue-500 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                        {res.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                          res.difficulty === 'Easy'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : res.difficulty === 'Hard'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {res.difficulty || 'Medium'}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          {res.score}/{res.total} ({res.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      Class {res.classLevel}th • {res.topic}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {res.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAKING TEST VIEW */}
      {quizState === 'taking' && currentQ && (
        <div className="space-y-6">
          {/* PROGRESS & TEST CODE HEADER */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-black text-xs px-2.5 py-1 rounded-lg">
                Question {currentQuestionIndex + 1} of {quizQuestions.length}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Class {selectedClass}th • {currentQ.topic}
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                selectedDifficulty === 'Easy'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                  : selectedDifficulty === 'Hard'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
              }`}>
                {selectedDifficulty} Level
              </span>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                Code: {currentTestCode}
              </span>
            </div>

            <div className="w-32 sm:w-48 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* QUESTION CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                    Topic: {currentQ.topic}
                  </span>
                  {currentQ.tenseType && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200">
                      🎯 {currentQ.tenseType}
                    </span>
                  )}
                </div>

                {currentQ.hint && (
                  <button
                    onClick={() => toggleHint(currentQ.id)}
                    className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>{showHints[currentQ.id] ? 'Hide Hint' : '💡 Need a Hint?'}</span>
                  </button>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQ.questionText}
              </h2>

              {showHints[currentQ.id] && currentQ.hint && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-medium text-amber-900 dark:text-amber-200 animate-in fade-in duration-200">
                  <span className="font-extrabold text-amber-800 dark:text-amber-300">Hint: </span>
                  {currentQ.hint}
                </div>
              )}
            </div>

            {/* OPTIONS */}
            <div className="grid grid-cols-1 gap-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = userAnswers[currentQ.id] === opt;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOptionSelect(currentQ.id, opt)}
                    className={`p-4 rounded-2xl border-2 text-left font-semibold text-sm transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/90 dark:bg-blue-950/60 text-blue-950 dark:text-blue-100 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                    {isSelected && <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* NAVIGATION BUTTONS */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentQuestionIndex < quizQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Test & Save Code</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBMITTED / EVALUATION VIEW */}
      {quizState === 'submitted' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* SCORE CARD & TEST CODE BANNER */}
          {(() => {
            const { score, total, percentage } = calculateCurrentScore();
            let badgeTitle = '💪 Keep Practicing!';
            let badgeBg = 'from-amber-600 to-orange-600';
            let message = 'Grammar rules ko acche se samajhne ke liye neeche diye gaye explanations dekhein!';

            if (percentage >= 90) {
              badgeTitle = '🏆 Grammar Champion!';
              badgeBg = 'from-emerald-600 via-teal-600 to-blue-600';
              message = 'Awesome job! Aapke saare concepts bilkul clear hain!';
            } else if (percentage >= 70) {
              badgeTitle = '⭐ Grammar Star!';
              badgeBg = 'from-blue-600 to-indigo-600';
              message = 'Very good score! Thoda sa revision karke aap 100% full marks la sakte hain!';
            } else if (percentage >= 50) {
              badgeTitle = '🌟 Good Effort!';
              badgeBg = 'from-purple-600 to-pink-600';
              message = 'Accha attempt! Niche har question ka explanation padhein aur apni mistakes sudharein.';
            }

            return (
              <div className={`bg-gradient-to-r ${badgeBg} text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center`}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-xs font-black tracking-wide">
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>{badgeTitle}</span>
                </div>

                <div className="space-y-2">
                  <div className="text-4xl sm:text-6xl font-black tracking-tight">
                    {score} / {total}
                  </div>
                  <div className="text-lg font-bold text-white/90">
                    Score: {percentage}% Accuracy
                  </div>
                  <p className="text-xs sm:text-sm text-white/80 max-w-md mx-auto font-medium">
                    {message}
                  </p>
                </div>

                {/* TEST CODE DISPLAY */}
                <div className="p-4 bg-black/30 backdrop-blur-md rounded-2xl max-w-sm mx-auto border border-white/20 space-y-2">
                  <div className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
                    Your Unique Student Test Code
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl font-black font-mono text-amber-300 tracking-widest">
                      {currentTestCode}
                    </span>
                    <button
                      onClick={() => copyCodeToClipboard(currentTestCode)}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
                      title="Copy Code"
                    >
                      {copiedCode ? <CheckCheck className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-white/70">
                    Is code ko save karein! Baad me ise daal kar aap apna report check kar sakte hain.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={startNewQuiz}
                    className="bg-white text-slate-900 hover:bg-slate-100 text-xs font-black px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake Fresh Test</span>
                  </button>

                  <button
                    onClick={() => setQuizState('setup')}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 text-xs font-black px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Change Class / Topic</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* DETAILED EVALUATION */}
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              <span>Question-by-Question Evaluation & Rule Explanation</span>
            </h3>

            <div className="space-y-4">
              {quizQuestions.map((q, idx) => {
                const userAns = userAnswers[q.id] || '(Not Answered)';
                const isCorrect = userAns === q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border p-5 sm:p-6 transition-all space-y-4 ${
                      isCorrect
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            Q{idx + 1} • {isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Topic: {q.topic}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900 dark:text-white pt-1">
                          {q.questionText}
                        </h4>
                      </div>

                      {isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
                      <div className={`p-3 rounded-xl border ${
                        isCorrect
                          ? 'bg-emerald-100/60 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200'
                          : 'bg-rose-100/60 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-200'
                      }`}>
                        <span className="font-extrabold block mb-0.5 text-[11px] uppercase tracking-wider">Your Answer:</span>
                        <span>{userAns}</span>
                      </div>

                      <div className="p-3 rounded-xl border bg-emerald-100/60 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200">
                        <span className="font-extrabold block mb-0.5 text-[11px] uppercase tracking-wider">Correct Answer:</span>
                        <span>{q.correctAnswer}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span>Simple Grammar Rule:</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LOOKUP PAST RESULT VIEW */}
      {quizState === 'lookup' && lookupResult && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center border border-indigo-700/50">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-black tracking-wide text-blue-300">
              <Bookmark className="w-4 h-4 text-amber-300" />
              <span>Saved Student Test Report • Code: {lookupResult.code}</span>
            </div>

            <div className="space-y-2">
              <div className="text-4xl sm:text-6xl font-black tracking-tight text-white">
                {lookupResult.score} / {lookupResult.total}
              </div>
              <div className="text-lg font-bold text-blue-300">
                Score: {lookupResult.percentage}% Accuracy
              </div>
              <p className="text-xs text-slate-300">
                Class {lookupResult.classLevel}th • Topic: {lookupResult.topic} • Date: {lookupResult.date}
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setQuizState('setup')}
                className="bg-white text-slate-900 hover:bg-slate-100 text-xs font-black px-6 py-2 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Setup / New Test</span>
              </button>
            </div>
          </div>

          {/* DETAILED QUESTION BREAKDOWN */}
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              <span>Saved Evaluation Breakdown for Code {lookupResult.code}</span>
            </h3>

            <div className="space-y-4">
              {lookupResult.questions.map((q, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border p-5 sm:p-6 transition-all space-y-4 ${
                    q.isCorrect
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                          q.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}>
                          Q{idx + 1} • {q.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Topic: {q.topic}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white pt-1">
                        {q.questionText}
                      </h4>
                    </div>

                    {q.isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
                    <div className={`p-3 rounded-xl border ${
                      q.isCorrect
                        ? 'bg-emerald-100/60 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200'
                        : 'bg-rose-100/60 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-200'
                    }`}>
                      <span className="font-extrabold block mb-0.5 text-[11px] uppercase tracking-wider">Student's Answer:</span>
                      <span>{q.userAnswer}</span>
                    </div>

                    <div className="p-3 rounded-xl border bg-emerald-100/60 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200">
                      <span className="font-extrabold block mb-0.5 text-[11px] uppercase tracking-wider">Correct Answer:</span>
                      <span>{q.correctAnswer}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>Rule Explanation:</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* 12 TENSES RULES & FORMULAS CHEAT-SHEET MODAL */}
      {showTenseRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-purple-600 text-white p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    12 Tense Formulas & Master Rules (Class 4th - 8th)
                  </h3>
                  <p className="text-xs text-amber-100 font-medium">
                    Complete reference card with Hindi explanations, formulas & exam shortcuts
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTenseRulesModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
              {/* PRESENT TENSES */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-black text-emerald-600 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-800/60 pb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black">1</span>
                  <h4>PRESENT TENSES (वर्तमान काल)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">Simple Present</span>
                      <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">S + V1(s/es) + O</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><b>Rule:</b> Daily habits, routines & universal facts.</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400"><i>Example:</i> He plays cricket every Sunday.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">Present Continuous</span>
                      <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">S + is/am/are + V1-ing + O</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><b>Rule:</b> Action happening right now.</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400"><i>Example:</i> She is writing a poem right now.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">Present Perfect</span>
                      <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">S + has/have + V3 + O</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><b>Rule:</b> Recently completed action with present impact.</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400"><i>Example:</i> They have already finished lunch.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">Present Perfect Cont.</span>
                      <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">S + has/have + been + V-ing + since/for</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><b>Rule:</b> Started in past, still continuing.</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400"><i>Example:</i> He has been studying since 8 AM.</p>
                  </div>
                </div>
              </div>

              {/* PAST TENSES */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-400 border-b border-blue-200 dark:border-blue-800/60 pb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-black">2</span>
                  <h4>PAST TENSES (भूतकाल)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">Simple Past</span>
                      <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">S + V2 + O</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><b>Rule:</b> Completed past event (yesterday, ago, last year).</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400"><i>Example:</i> I watched a movie yesterday.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">Past Continuous</span>
                      <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">S + was/were + V1-ing + O</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><b>Rule:</b> Action in progress in the past.</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400"><i>Example:</i> It was raining when I left.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">Past Perfect</span>
                      <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">S + had + V3 + O</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><b>Rule:</b> Earlier of two past actions.</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400"><i>Example:</i> The train had left before we arrived.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">Past Perfect Cont.</span>
                      <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">S + had + been + V-ing + since/for</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><b>Rule:</b> Past action continuing before another past point.</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400"><i>Example:</i> He had been working for 3 hours before resting.</p>
                  </div>
                </div>
              </div>

              {/* FUTURE TENSES */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-black text-purple-600 dark:text-purple-400 border-b border-purple-200 dark:border-purple-800/60 pb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-black">3</span>
                  <h4>FUTURE TENSES (भविष्य काल)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">Simple Future</span>
                      <span className="text-[10px] font-mono bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded">S + will/shall + V1 + O</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><b>Rule:</b> Action taking place tomorrow or in future.</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400"><i>Example:</i> We will travel to Jaipur next month.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">Future Continuous</span>
                      <span className="text-[10px] font-mono bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded">S + will be + V1-ing + O</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><b>Rule:</b> Action in progress at a future time.</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400"><i>Example:</i> I will be taking my exam at 10 AM tomorrow.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">Future Perfect</span>
                      <span className="text-[10px] font-mono bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded">S + will have + V3 + O</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><b>Rule:</b> Action completed by a specific future deadline.</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400"><i>Example:</i> She will have graduated by next year.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">Future Perfect Cont.</span>
                      <span className="text-[10px] font-mono bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded">S + will have been + V-ing</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><b>Rule:</b> Continuous future action up to a given time.</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400"><i>Example:</i> By 2028, he will have been teaching for 10 years.</p>
                  </div>
                </div>
              </div>

              {/* SHORTCUTS & TIME MARKS */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-amber-900 dark:text-amber-200">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Exam Tense Shortcuts & Golden Rules:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-950 dark:text-amber-300 font-medium">
                  <div>📌 <b>Since vs For:</b> Use "Since" for exact starting point (Since 2020, Since 4 PM). Use "For" for duration (For 3 hours, For 5 days).</div>
                  <div>📌 <b>Yesterday / Ago:</b> Always use Simple Past (V2). Never use "have/has" with "yesterday".</div>
                  <div>📌 <b>Listen! / Look!:</b> Signals an immediate ongoing action -&gt; Present Continuous.</div>
                  <div>📌 <b>By next week / By 2027:</b> Indicates Future Perfect (will have + V3).</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowTenseRulesModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Close Reference Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
