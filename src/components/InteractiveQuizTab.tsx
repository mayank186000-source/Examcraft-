import React, { useState, useEffect } from 'react';
import { GeneratedPaper, Question } from '../types';
import confetti from 'canvas-confetti';
import { PlayCircle, Clock, CheckCircle, Flag, ArrowRight, ArrowLeft, Trophy, RotateCcw, Award, FileText, Sparkles, BookOpen, Layers, CheckSquare } from 'lucide-react';
import { generateLocalPaper } from '../utils/paperGenerator';
import { getAllSavedPapers, savePaperToRegistry } from '../utils/paperRegistry';
import { sanitizeAndDeduplicatePaper } from '../utils/questionVault';
import { getSubjectsByClass, CBSE_SUBJECTS } from '../data/cbseData';
import { useAuth } from '../context/AuthContext';
import { saveGrammarResult } from '../data/grammarQuestions';
import { logQuizSubmissionToFirestore, syncUserToFirestore } from '../services/firestoreActivityService';

interface InteractiveQuizTabProps {
  paper?: GeneratedPaper | null;
  onSelectPaper?: (paper: GeneratedPaper) => void;
  onExitQuiz: () => void;
}

export const InteractiveQuizTab: React.FC<InteractiveQuizTabProps> = ({
  paper: initialPaper,
  onSelectPaper,
  onExitQuiz
}) => {
  const { currentUser } = useAuth();
  const [selectedClass, setSelectedClass] = useState<'12' | '11' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3'>('10');
  // If no paper is passed, allow user to pick any subject paper or auto-load science
  const [activePaper, setActivePaper] = useState<GeneratedPaper | null>(initialPaper ? sanitizeAndDeduplicatePaper(initialPaper) : null);

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(180 * 60);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (initialPaper) {
      const sanitized = sanitizeAndDeduplicatePaper(initialPaper);
      setActivePaper(sanitized);
      setCurrentIdx(0);
      setAnswers({});
      setFlagged({});
      setIsSubmitted(false);
      setTimeLeft((sanitized.config?.durationMinutes || 180) * 60);
    }
  }, [initialPaper]);

  useEffect(() => {
    if (!activePaper || isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activePaper, isSubmitted, timeLeft]);

  const availableSubjects = getSubjectsByClass(selectedClass);

  // If still no paper is active, show the Quick Subject Practice Launcher
  if (!activePaper) {
    const savedPapers = getAllSavedPapers();

    const handleQuickStartSubject = (subjectId: string) => {
      const subject = CBSE_SUBJECTS.find(s => s.id === subjectId) || CBSE_SUBJECTS[0];
      const classLabel = subject.id.startsWith('class12-') ? 'Class 12th'
        : subject.id.startsWith('class11-') ? 'Class 11th'
        : subject.id.startsWith('class9-') ? 'Class 9th'
        : subject.id.startsWith('class8-') ? 'Class 8th'
        : subject.id.startsWith('class7-') ? 'Class 7th'
        : subject.id.startsWith('class6-') ? 'Class 6th'
        : subject.id.startsWith('class5-') ? 'Class 5th'
        : subject.id.startsWith('class4-') ? 'Class 4th'
        : subject.id.startsWith('class3-') ? 'Class 3rd'
        : `Class ${selectedClass}th`;
      const newPaper = generateLocalPaper({
        subjectId: subject.id,
        preset: 'board80',
        title: `${subject.name} (Code ${subject.code}) - ${classLabel} Board Practice Test`,
        schoolName: 'Central Board of Secondary Education',
        examCode: `EXAMIDEA-${subject.code}`,
        date: new Date().toLocaleDateString('en-GB'),
        durationMinutes: subject.standardTime || 180,
        totalMarks: subject.standardMarks || 80,
        selectedChapterIds: subject.chapters.map(c => c.id),
        competencyRatio: 50,
        difficultySplit: { easy: 30, medium: 50, hard: 20 },
        watermarkText: 'EXAMIDEA CBSE MODEL TEST',
        includeGeneralInstructions: true,
        includeSolutions: true,
        useAI: false
      });
      savePaperToRegistry(newPaper, currentUser ? { email: currentUser.email, name: currentUser.name } : undefined);
      setActivePaper(newPaper);
      setCurrentIdx(0);
      setAnswers({});
      setFlagged({});
      setIsSubmitted(false);
      setTimeLeft((newPaper.config?.durationMinutes || 180) * 60);
      if (onSelectPaper) onSelectPaper(newPaper);
    };

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 border border-emerald-800 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="bg-emerald-800 text-emerald-200 border border-emerald-600 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              CBSE Class {selectedClass}th Interactive Exam Center
            </span>

            <div className="flex flex-wrap items-center p-1 bg-stone-800 rounded-xl border border-stone-700 gap-1">
              {(['12', '11', '10', '9', '8', '7', '6', '5', '4', '3'] as const).map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    selectedClass === cls
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Class {cls}th
                </button>
              ))}
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Class {selectedClass} Timed Practice Test Mode (लाइव बोर्ड अभ्यास)
          </h1>
          <p className="text-sm sm:text-base text-stone-300 max-w-3xl leading-relaxed">
            Select any Class {selectedClass}th subject below to launch a full real-time timed test session with instant question navigation, bookmarking, and step-by-step scoring.
          </p>
        </div>

        {/* Subject Quick-Launch Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <span>Choose a Class {selectedClass} Subject to Start Timed Practice:</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableSubjects.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl p-6 border-2 border-stone-200 hover:border-emerald-600 hover:shadow-xl transition-all flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-300">
                      Code: {sub.code}
                    </span>
                    <span className="text-xs font-bold text-stone-500">
                      {sub.standardMarks} Marks • 3 Hours
                    </span>
                  </div>

                  <h3 className="font-extrabold text-lg text-stone-900 group-hover:text-emerald-800 transition-colors">
                    {sub.name}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {sub.chapters.length} Chapters • Section-wise CBSE Pattern (MCQ, Assertion-Reason, Short Answer, Long Answer, Case-based)
                  </p>
                </div>

                <button
                  onClick={() => handleQuickStartSubject(sub.id)}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4 text-amber-300" />
                  <span>Start Practice Test (अभ्यास शुरू करें)</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Saved & Generated Papers History if any */}
        {savedPapers.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-stone-200">
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              <span>Or Practice with Your Previously Generated / Saved Papers:</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPapers.slice(0, 6).map((saved, idx) => (
                <div
                  key={`quiz-saved-${saved.id}-${idx}`}
                  className="bg-white rounded-2xl p-5 border border-stone-200 hover:border-amber-500 hover:shadow-lg transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                        {saved.paperCode || 'CODE-10'}
                      </span>
                      <span className="text-[11px] text-stone-500 font-medium">
                        {saved.config?.totalMarks || 80} Marks
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-stone-900 line-clamp-2">
                      {saved.config?.title || `${saved.subjectName} Board Paper`}
                    </h4>
                  </div>

                  <button
                    onClick={() => {
                      setActivePaper(saved);
                      setCurrentIdx(0);
                      setAnswers({});
                      setFlagged({});
                      setIsSubmitted(false);
                      setTimeLeft((saved.config?.durationMinutes || 180) * 60);
                      if (onSelectPaper) onSelectPaper(saved);
                    }}
                    className="w-full bg-stone-900 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlayCircle className="w-3.5 h-3.5 text-amber-300" />
                    <span>Launch This Paper</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active Paper is present - Render Full Timed Question Engine
  const paper = activePaper;
  const allQuestions: Question[] = paper.sections.flatMap(s => s.questions);


  const currentQ = allQuestions[currentIdx] || allQuestions[0];

  const handleAnswerSelect = (val: string) => {
    setAnswers({ ...answers, [currentQ.id]: val });
  };

  const toggleFlag = () => {
    setFlagged({ ...flagged, [currentQ.id]: !flagged[currentQ.id] });
  };

  const handleSubmitQuiz = () => {
    setIsSubmitted(true);

    // Calculate time taken
    const totalDurationSecs = (paper?.config?.durationMinutes || 180) * 60;
    const elapsedSecs = Math.max(1, totalDurationSecs - timeLeft);

    // Calculate evaluated score
    let score = 0;
    let total = 0;
    const evaluatedQuestions = allQuestions.map(q => {
      total += q.marks;
      const uAns = answers[q.id] || '(Not Answered)';
      const isCorrect = Boolean(uAns && q.correctAnswer && uAns.toLowerCase().includes(q.correctAnswer.charAt(0).toLowerCase()));
      if (isCorrect) score += q.marks;
      return {
        questionText: q.questionText,
        topic: q.chapterName || paper?.subjectName || 'Practice Test',
        difficulty: 'Medium' as const,
        userAnswer: uAns,
        correctAnswer: q.correctAnswer || '',
        isCorrect,
        explanation: q.explanation || q.markingScheme || 'Stepwise evaluation scheme.'
      };
    });

    const pct = Math.round((score / (total || 1)) * 100);

    // Ensure paper is registered in master saved papers registry
    if (paper) {
      savePaperToRegistry(paper, currentUser ? { email: currentUser.email, name: currentUser.name } : undefined);
    }

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

    const studentEmail = activeUserEmail || 'guest@examcraft.internal';
    const studentName = activeUserName || 'Guest Student (Guest)';

    // Save test result into server & local grammar/test results registry
    const testCode = paper?.paperCode || paper?.config?.examCode || `PPR-${selectedClass}-${Math.floor(1000 + Math.random() * 9000)}`;
    saveGrammarResult({
      code: testCode,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      classLevel: selectedClass,
      topic: `${paper?.subjectName || 'CBSE Practice'} Test`,
      difficulty: 'Medium',
      score,
      total,
      percentage: pct,
      timeTakenSeconds: elapsedSecs,
      userEmail: studentEmail,
      userName: studentName,
      questions: evaluatedQuestions
    });

    // Sync user profile to Firestore & server
    syncUserToFirestore({
      id: currentUser?.id || `usr-${studentEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: studentName,
      email: studentEmail,
      role: studentEmail === 'mukesh186000@gmail.com' ? 'admin' : 'student'
    }).catch(err => console.warn('Firestore user sync error:', err));

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: {
          id: currentUser?.id || `usr-${studentEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: studentName,
          email: studentEmail,
          role: studentEmail === 'mukesh186000@gmail.com' ? 'admin' : 'student',
          lastDownloadDate: new Date().toISOString().split('T')[0]
        }
      })
    }).catch(() => {});

    // Log Quiz Submission & Test Score to Firebase Firestore Database
    logQuizSubmissionToFirestore(
      {
        id: currentUser?.id || studentEmail,
        name: studentName,
        email: studentEmail
      },
      {
        paperId: paper?.id || testCode,
        paperCode: testCode,
        paperTitle: paper?.config?.title || `${paper?.subjectName || 'CBSE'} Practice Test`,
        subjectName: paper?.subjectName || 'CBSE Board Practice',
        classLevel: selectedClass,
        score,
        totalMarks: total,
        percentage: pct,
        timeTakenSeconds: elapsedSecs
      }
    ).catch(err => console.warn('Firestore quiz logging error:', err));

    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.log('Confetti triggered');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate total score for auto-evaluable MCQs
  let totalScore = 0;
  let maxScore = 0;
  allQuestions.forEach(q => {
    maxScore += q.marks;
    const userAns = answers[q.id];
    if (userAns && q.correctAnswer && userAns.toLowerCase().includes(q.correctAnswer.charAt(0).toLowerCase())) {
      totalScore += q.marks;
    }
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 sm:p-6 border border-stone-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-800/80 text-emerald-200 border border-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">
            Interactive Student Test Mode
          </span>
          <h2 className="font-extrabold text-lg text-white mt-1">{paper.config?.title || `${paper.subjectName} Practice Test`}</h2>
        </div>

        {/* Live Timer */}
        {!isSubmitted && (
          <div className="flex items-center gap-2 bg-stone-800 px-4 py-2 rounded-xl border border-stone-700">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-mono font-black text-amber-400 text-base">{formatTime(timeLeft)}</span>
          </div>
        )}

        <button
          onClick={onExitQuiz}
          className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold px-3.5 py-2 rounded-xl"
        >
          Exit Test
        </button>
      </div>

      {!isSubmitted ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Question Card */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
            
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <span className="font-bold text-stone-900 text-sm">
                Question {currentIdx + 1} of {allQuestions.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                  {currentQ.marks} Mark{currentQ.marks > 1 ? 's' : ''}
                </span>
                <button
                  onClick={toggleFlag}
                  className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1 ${
                    flagged[currentQ.id] ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flagged[currentQ.id] ? 'Flagged' : 'Flag'}</span>
                </button>
              </div>
            </div>

            {/* Case passage if available */}
            {currentQ.casePassage && (
              <div className="case-study-container bg-amber-50/95 p-5 rounded-2xl border-2 border-amber-300/80 mb-4 shadow-sm">
                <p className="font-black not-italic text-amber-950 uppercase tracking-wider text-xs mb-2 border-b border-amber-200/80 pb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>Case Study Passage / Context:</span>
                </p>
                <div className="case-study-text text-stone-950 text-base sm:text-lg font-serif italic leading-relaxed whitespace-pre-line">
                  {currentQ.casePassage}
                </div>
              </div>
            )}

            {/* Question Text */}
            <p className="font-bold text-stone-900 text-base whitespace-pre-line leading-relaxed">
              {currentQ.questionText}
            </p>

            {/* Options for MCQ */}
            {currentQ.options && currentQ.options.length > 0 ? (
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = answers[currentQ.id] === opt;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(opt)}
                      className={`w-full text-left p-4 rounded-xl border-2 text-xs font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950 font-bold shadow-sm'
                          : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-emerald-700" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Type Your Answer Below:</label>
                <textarea
                  rows={6}
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  placeholder="Write your step-by-step solution here..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-700 outline-none"
                />
              </div>
            )}

            {/* Next / Prev Navigation */}
            <div className="pt-6 border-t border-stone-200 flex items-center justify-between">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(currentIdx - 1)}
                className="bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-800 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentIdx < allQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-900/15"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-900/20 flex items-center gap-1.5"
                >
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span>Submit Test & View Results</span>
                </button>
              )}
            </div>

          </div>

          {/* Right Question Palette */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
              <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider">Question Navigator</h3>

              <div className="grid grid-cols-5 gap-2">
                {allQuestions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id]);
                  const isFlagged = Boolean(flagged[q.id]);
                  const isCurrent = idx === currentIdx;

                  return (
                    <button
                      key={`${q.id || 'q'}-${idx}`}
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'ring-2 ring-emerald-700 bg-emerald-700 text-white shadow-md'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isFlagged
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-stone-100 space-y-2 text-[11px] text-stone-600 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></span>
                  <span>Flagged for Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-stone-100 border border-stone-300"></span>
                  <span>Unanswered</span>
                </div>
              </div>

              <button
                onClick={handleSubmitQuiz}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-emerald-900/15 mt-2"
              >
                Submit Complete Test
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* Test Completion Scorecard */
        <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-2xl max-w-3xl mx-auto space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-stone-900">Test Submitted Successfully!</h2>
            <p className="text-xs text-stone-500">
              CBSE {paper.config.subjectId.startsWith('class12-') ? 'Class 12th' : paper.config.subjectId.startsWith('class11-') ? 'Class 11th' : paper.config.subjectId.startsWith('class9-') ? 'Class 9th' : 'Class 10th'} Timed Practice Evaluation Summary
            </p>
          </div>

          {/* Score Box */}
          <div className="bg-stone-900 text-white p-6 rounded-2xl max-w-sm mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Calculated Score</span>
            <div className="text-4xl font-black text-white">
              {totalScore} <span className="text-lg text-stone-400 font-normal">/ {maxScore} Marks</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setIsSubmitted(false);
                setTimeLeft(paper.config.durationMinutes * 60);
                setAnswers({});
              }}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Test</span>
            </button>

            <button
              onClick={onExitQuiz}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
            >
              Back to Paper Generator
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
