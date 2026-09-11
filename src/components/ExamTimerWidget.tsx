import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Flag,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Award,
  Bell,
  Clock,
  Zap,
  Sparkles,
  BookOpen,
  CheckSquare,
  Square,
  Eye,
  GraduationCap
} from 'lucide-react';
import { GeneratedPaper } from '../types';

interface ExamTimerWidgetProps {
  paper: GeneratedPaper;
  attemptedQuestions: Set<string>;
  flaggedQuestions: Set<string>;
  onToggleAttempt: (questionId: string) => void;
  onToggleFlag: (questionId: string) => void;
  onRevealAnswers: () => void;
  onFinishExam: (timeSpentSeconds: number) => void;
}

// Audio chime using Web Audio API (safe, no external sound assets required)
const playExamTone = (type: 'start' | 'reading' | 'warning' | 'final' | 'bell') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'warning') {
      // 30 min / 10 min warning double chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'final') {
      // Time Up Bell
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // AudioContext blocked by browser autoplay policy
  }
};

export const ExamTimerWidget: React.FC<ExamTimerWidgetProps> = ({
  paper,
  attemptedQuestions,
  flaggedQuestions,
  onToggleAttempt,
  onToggleFlag,
  onRevealAnswers,
  onFinishExam
}) => {
  const standardDurationMinutes = paper.config.durationMinutes || 180;
  const [targetDurationMinutes, setTargetDurationMinutes] = useState<number>(standardDurationMinutes);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(standardDurationMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isReadingMode, setIsReadingMode] = useState<boolean>(false); // 15 mins CBSE reading time
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [showQuestionMap, setShowQuestionMap] = useState<boolean>(false);
  const [examStartTime, setExamStartTime] = useState<number | null>(null);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);

  // Flatten all questions for navigation and status
  const allQuestions = React.useMemo(() => {
    const list: { id: string; sectionName: string; qIdx: number; marks: number; text: string; uniqueKey: string }[] = [];
    let globalIdx = 0;
    paper.sections.forEach((sec, secIdx) => {
      sec.questions.forEach((q, idx) => {
        globalIdx++;
        const uniqueKey = `timer-item-${secIdx}-${idx}-${q.id || globalIdx}`;
        list.push({
          id: q.id ? `sec-${secIdx}-${idx}-${q.id}` : `sec-${secIdx}-q-${idx}-${globalIdx}`,
          sectionName: sec.sectionName,
          qIdx: idx + 1,
          marks: q.marks || 1,
          text: q.questionText,
          uniqueKey
        });
      });
    });
    return list;
  }, [paper]);

  const totalQuestionsCount = allQuestions.length;
  const attemptedCount = attemptedQuestions.size;
  const flaggedCount = flaggedQuestions.size;

  // Warning thresholds flagged flags to play audio only once
  const warned30MinRef = useRef(false);
  const warned10MinRef = useRef(false);
  const warned5MinRef = useRef(false);

  // Timer Tick Engine
  useEffect(() => {
    let interval: any = null;

    if (isRunning && !isPaused && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            if (soundEnabled) playExamTone('final');
            setShowSummaryModal(true);
            return 0;
          }

          // Sound triggers for real exam pressure milestones
          if (soundEnabled) {
            if (prev === 30 * 60 && !warned30MinRef.current) {
              warned30MinRef.current = true;
              playExamTone('warning');
            } else if (prev === 10 * 60 && !warned10MinRef.current) {
              warned10MinRef.current = true;
              playExamTone('warning');
            } else if (prev === 5 * 60 && !warned5MinRef.current) {
              warned5MinRef.current = true;
              playExamTone('warning');
            }
          }

          return prev - 1;
        });

        setTimeSpentSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, secondsRemaining, soundEnabled]);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const totalTimeInSeconds = targetDurationMinutes * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalTimeInSeconds - secondsRemaining) / totalTimeInSeconds) * 100));

  // Determine urgency level for styling
  const isUrgent = secondsRemaining < 10 * 60 && secondsRemaining > 0;
  const isWarning = secondsRemaining <= 30 * 60 && secondsRemaining >= 10 * 60;

  // Start exam handler
  const handleStartExam = (durationMins: number, readingMode = false) => {
    setTargetDurationMinutes(durationMins);
    setSecondsRemaining(durationMins * 60);
    setIsRunning(true);
    setIsPaused(false);
    setIsReadingMode(readingMode);
    setExamStartTime(Date.now());
    setTimeSpentSeconds(0);
    warned30MinRef.current = false;
    warned10MinRef.current = false;
    warned5MinRef.current = false;
    if (soundEnabled) playExamTone('start');
  };

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      if (soundEnabled) playExamTone('bell');
    } else {
      setIsPaused(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsReadingMode(false);
    setSecondsRemaining(targetDurationMinutes * 60);
    setTimeSpentSeconds(0);
    warned30MinRef.current = false;
    warned10MinRef.current = false;
    warned5MinRef.current = false;
  };

  const handleFinishConfirm = () => {
    setIsRunning(false);
    setShowSummaryModal(true);
    if (soundEnabled) playExamTone('bell');
    onFinishExam(timeSpentSeconds);
  };

  // Scroll to question
  const scrollToQuestion = (questionIndex: number) => {
    const el = document.getElementById(`question-anchor-${questionIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setShowQuestionMap(false);
  };

  return (
    <>
      {/* Top Floating / Sticky HUD during Exam Practice */}
      <div className="w-full max-w-4xl bg-stone-900 border-2 border-stone-700 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl print:hidden transition-all">
        {/* Banner Header & Timer Display */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all shadow-md ${
                !isRunning
                  ? 'bg-stone-800 text-stone-300 border border-stone-700'
                  : isUrgent
                  ? 'bg-rose-600 text-white animate-pulse shadow-rose-900/50'
                  : isWarning
                  ? 'bg-amber-500 text-stone-950 shadow-amber-900/30'
                  : 'bg-emerald-600 text-white shadow-emerald-900/30'
              }`}
            >
              <Timer className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Real-Time CBSE Exam Practice Timer
                </span>
                {isRunning && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isPaused
                        ? 'bg-amber-900/80 text-amber-200 border border-amber-600'
                        : isUrgent
                        ? 'bg-rose-900/90 text-rose-100 animate-pulse border border-rose-500'
                        : 'bg-emerald-900/80 text-emerald-200 border border-emerald-600'
                    }`}
                  >
                    {isPaused ? 'PAUSED' : isReadingMode ? '15M READING TIME' : 'EXAM IN PROGRESS'}
                  </span>
                )}
              </div>

              {/* Digital Countdown Time */}
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className={`font-mono font-black text-2xl sm:text-3xl tracking-tight transition-colors ${
                    !isRunning
                      ? 'text-stone-300'
                      : isUrgent
                      ? 'text-rose-400 animate-pulse'
                      : isWarning
                      ? 'text-amber-300'
                      : 'text-emerald-400'
                  }`}
                >
                  {formatTime(secondsRemaining)}
                </span>
                <span className="text-xs text-stone-400 font-medium">
                  / {targetDurationMinutes} min ({paper.config.totalMarks} Marks)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Controls */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl text-xs border transition-all ${
                soundEnabled
                  ? 'bg-stone-800 text-amber-400 border-stone-700 hover:bg-stone-700'
                  : 'bg-stone-800 text-stone-500 border-stone-700 hover:text-stone-400'
              }`}
              title={soundEnabled ? 'Bell & Milestone Chimes ON' : 'Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {!isRunning ? (
              /* Timer Preset Selector & Start Button */
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 15 Mins CBSE Official Cool-off Reading Timer */}
                <button
                  onClick={() => handleStartExam(15, true)}
                  className="bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                  title="Official 15-Minute CBSE Reading & Cool-off Period (10:15 AM - 10:30 AM)"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>15m Reading Mode</span>
                </button>

                {/* Preset Options */}
                <select
                  value={targetDurationMinutes}
                  onChange={(e) => {
                    const mins = parseInt(e.target.value);
                    setTargetDurationMinutes(mins);
                    setSecondsRemaining(mins * 60);
                  }}
                  className="bg-stone-800 text-white text-xs font-bold px-2.5 py-2 rounded-xl border border-stone-700 focus:outline-none focus:border-amber-400"
                >
                  <option value={180}>Full 3 Hours (180 Mins)</option>
                  <option value={120}>2 Hours (120 Mins)</option>
                  <option value={90}>1.5 Hours (90 Mins)</option>
                  <option value={60}>1 Hour (60 Mins)</option>
                  <option value={45}>45 Mins Quick Test</option>
                  <option value={15}>15 Mins Speed Drill</option>
                </select>

                <button
                  onClick={() => handleStartExam(targetDurationMinutes, false)}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Exam Timer</span>
                </button>
              </div>
            ) : (
              /* Active Timer Controls */
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handlePauseResume}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all active:scale-95 ${
                    isPaused
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md'
                      : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border-stone-700'
                  }`}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>

                <button
                  onClick={() => setShowQuestionMap(!showQuestionMap)}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all"
                  title="Open live question tracker & quick-jump matrix"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Track ({attemptedCount}/{totalQuestionsCount})
                  </span>
                  {showQuestionMap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handleReset}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white border border-stone-700 p-2 rounded-xl transition-all"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleFinishConfirm}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Submit / Finish</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar & Exam Pacing Stats */}
        {isRunning && (
          <div className="mt-3 pt-3 border-t border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <div className="flex items-center gap-3">
                <span className="text-stone-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Attempted: <strong className="text-white">{attemptedCount}</strong> / {totalQuestionsCount}
                </span>
                {flaggedCount > 0 && (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5 fill-current" />
                    Review: <strong className="text-white">{flaggedCount}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-stone-400 font-mono">
                  Pace: ~{(secondsRemaining / (totalQuestionsCount - attemptedCount || 1) / 60).toFixed(1)} min/question
                </span>
                <span className="text-stone-400 font-mono font-bold">
                  {Math.round(progressPercent)}% Elapsed
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden border border-stone-700/60 relative">
              <div
                className={`h-full transition-all duration-1000 ${
                  isUrgent
                    ? 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                    : isWarning
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Reading Mode Alert */}
            {isReadingMode && (
              <div className="bg-amber-950/70 border border-amber-600/60 rounded-xl p-2.5 flex items-center justify-between text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>CBSE Reading Time Active:</strong> Scan question choices, verify case passages, and plan answer structure. (Writing starts in {formatTime(secondsRemaining)})
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsReadingMode(false);
                    setTargetDurationMinutes(standardDurationMinutes);
                    setSecondsRemaining(standardDurationMinutes * 60);
                    if (soundEnabled) playExamTone('start');
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap ml-2"
                >
                  Start Writing Now →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live Question Matrix Map (Collapsible) */}
        {isRunning && showQuestionMap && (
          <div className="mt-3 p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-stone-300 border-b border-stone-800 pb-1.5">
              <span>Quick Jump & Live Progress Grid:</span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Attempted
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Flagged
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-700 inline-block"></span> Pending
                </span>
              </div>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5 pt-1">
              {allQuestions.map((q, idx) => {
                const isAttempted = attemptedQuestions.has(q.id);
                const isFlagged = flaggedQuestions.has(q.id);
                return (
                  <button
                    key={q.uniqueKey || `q-btn-${idx}`}
                    onClick={() => scrollToQuestion(idx)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all relative ${
                      isAttempted
                        ? 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm'
                        : isFlagged
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-400 border border-stone-700'
                    }`}
                    title={`Q${idx + 1} (${q.marks}M) - Click to jump`}
                  >
                    Q{idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-stone-900"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Exam Completion & Performance Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-stone-700 text-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center mx-auto shadow-xl">
                <Award className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Practice Exam Complete!</h3>
              <p className="text-xs text-stone-400 font-medium">
                {paper.subjectName} • Class 10 CBSE Mock Test Session
              </p>
            </div>

            {/* Performance Analytics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-stone-800/80 p-3 rounded-2xl border border-stone-700 text-center space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Time Taken</p>
                <p className="text-lg font-black font-mono text-amber-400">{formatTime(timeSpentSeconds)}</p>
                <p className="text-[10px] text-stone-500">of {targetDurationMinutes} mins</p>
              </div>

              <div className="bg-stone-800/80 p-3 rounded-2xl border border-stone-700 text-center space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Attempted</p>
                <p className="text-lg font-black font-mono text-emerald-400">
                  {attemptedCount} / {totalQuestionsCount}
                </p>
                <p className="text-[10px] text-stone-500">
                  {Math.round((attemptedCount / (totalQuestionsCount || 1)) * 100)}% coverage
                </p>
              </div>

              <div className="bg-stone-800/80 p-3 rounded-2xl border border-stone-700 text-center space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Flagged</p>
                <p className="text-lg font-black font-mono text-amber-300">{flaggedCount}</p>
                <p className="text-[10px] text-stone-500">Review marked</p>
              </div>
            </div>

            {/* Feedback & Pacing Advice */}
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-3.5 rounded-2xl text-xs text-emerald-200 space-y-1 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-emerald-300">
                <Sparkles className="w-4 h-4" />
                Examiner Self-Evaluation Next Steps:
              </p>
              <p className="text-[11px] text-stone-300">
                Reveal the official step-wise marking scheme to verify your answers, match formulas, check SI units, and tally your estimated score out of {paper.config.totalMarks} marks.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setShowSummaryModal(false);
                  onRevealAnswers();
                }}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Reveal Solutions & Marking Scheme</span>
              </button>

              <button
                onClick={() => setShowSummaryModal(false)}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs py-3 px-4 rounded-xl border border-stone-700 transition-all"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
