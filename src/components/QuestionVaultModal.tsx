import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Sparkles,
  Zap,
  Filter,
  Search,
  BookOpen,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
  Layers,
  ChevronRight,
  HelpCircle,
  FileText
} from 'lucide-react';
import {
  getStoredVault,
  getVaultStats,
  generateCombinatorialPaperFromVault,
  exportVaultJSON,
  importVaultJSON,
  StoredVaultQuestion,
  VaultStats
} from '../utils/questionVault';
import { CBSE_SUBJECTS } from '../data/cbseData';
import { PaperConfig, GeneratedPaper, CustomBranding } from '../types';

interface QuestionVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaper: (paper: GeneratedPaper) => void;
  branding: CustomBranding;
}

export const QuestionVaultModal: React.FC<QuestionVaultModalProps> = ({
  isOpen,
  onClose,
  onSelectPaper,
  branding
}) => {
  const [vaultQuestions, setVaultQuestions] = useState<StoredVaultQuestion[]>([]);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedMarks, setSelectedMarks] = useState<number | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<'all' | 'ai_generated' | 'curated_bank'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGeneratingRemix, setIsGeneratingRemix] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [customVaultMarks, setCustomVaultMarks] = useState<number>(30);

  const loadVaultData = () => {
    const raw = getStoredVault();
    setVaultQuestions(Object.values(raw));
    setStats(getVaultStats());
  };

  useEffect(() => {
    if (isOpen) {
      loadVaultData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstantRemix = (marks: number) => {
    setIsGeneratingRemix(true);
    const subId = selectedSubjectId === 'all' ? 'science-086' : selectedSubjectId;
    const sub = CBSE_SUBJECTS.find(s => s.id === subId) || CBSE_SUBJECTS[0];

    const presetName = marks >= 70 ? 'board80' : marks >= 35 ? 'periodic40' : 'unit20';
    const duration = marks >= 70 ? 180 : marks >= 35 ? 90 : 45;

    const config: PaperConfig = {
      subjectId: sub.id,
      preset: presetName,
      title: `${branding.schoolName || 'CBSE Class 10'} ${marks} Marks Mix & Match Fallback 2025-2026`,
      schoolName: branding.schoolName || 'DPS Senior Secondary School, New Delhi',
      examCode: `${branding.examCodePrefix || 'EXAMIDEA'}-${sub.code}`,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      durationMinutes: duration,
      totalMarks: marks,
      selectedChapterIds: [],
      competencyRatio: 50,
      difficultySplit: { easy: 30, medium: 50, hard: 20 },
      watermarkText: branding.watermark || 'EXAMIDEA VAULT REMIX',
      includeGeneralInstructions: true,
      includeSolutions: true,
      useAI: false
    };

    setTimeout(() => {
      const paper = generateCombinatorialPaperFromVault(config);
      setIsGeneratingRemix(false);
      onSelectPaper(paper);
      onClose();
    }, 150);
  };

  const handleExport = () => {
    const jsonStr = exportVaultJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CBSE_Examidea_Question_Vault_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importVaultJSON(content);
      if (res.success) {
        setImportStatus(`Successfully imported ${res.count} questions into your vault!`);
        loadVaultData();
      } else {
        setImportStatus(`Import failed: ${res.error}`);
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  // Filter questions
  const filteredQuestions = vaultQuestions.filter(q => {
    if (selectedSubjectId !== 'all' && q.subjectId !== selectedSubjectId) return false;
    if (selectedMarks !== 'all' && q.marks !== selectedMarks) return false;
    if (selectedSource !== 'all' && q.source !== selectedSource) return false;
    if (searchQuery.trim()) {
      const text = (q.questionText + ' ' + (q.chapterName || '') + ' ' + (q.correctAnswer || '')).toLowerCase();
      if (!text.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div
      id="question-vault-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 p-5 sm:p-6 text-white flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Smart CBSE Question Auto-Vault
                </h2>
                <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  CBSE Question Bank
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Integrated official CBSE Board Practice Papers & Question Bank (Class 9th to 12th). Instantly generate classwise, subjectwise, and chapterwise test papers with 0 API delay.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Instant Remix Ribbon */}
        <div className="bg-emerald-50/70 dark:bg-stone-800/60 p-4 border-b border-stone-200 dark:border-stone-700/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
          {/* Quick Metrics */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs">
            <div>
              <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Total Vault Pool</span>
              <span className="text-base font-black text-emerald-900 dark:text-emerald-300">{stats?.totalQuestions || 0} Questions</span>
            </div>
            <div className="h-7 w-px bg-stone-300 dark:bg-stone-700"></div>
            <div>
              <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold tracking-wider">AI Harvested</span>
              <span className="text-base font-black text-amber-800 dark:text-amber-300">{stats?.aiHarvestedCount || 0} Questions</span>
            </div>
            <div className="h-7 w-px bg-stone-300 dark:bg-stone-700"></div>
            <div className="hidden sm:block">
              <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Marks Split</span>
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                1M: {stats?.byMarks.oneMark} • 2M: {stats?.byMarks.twoMarks} • 3M: {stats?.byMarks.threeMarks} • 4M: {stats?.byMarks.fourMarks} • 5M: {stats?.byMarks.fiveMarks}
              </span>
            </div>
          </div>

          {/* Instant Remix Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 hidden md:inline">Instant Mix & Match:</span>
            <button
              onClick={() => handleInstantRemix(20)}
              disabled={isGeneratingRemix}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs px-2.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>20M</span>
            </button>
            <button
              onClick={() => handleInstantRemix(40)}
              disabled={isGeneratingRemix}
              className="bg-teal-700 hover:bg-teal-800 text-white font-black text-xs px-2.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>40M</span>
            </button>
            <button
              onClick={() => handleInstantRemix(80)}
              disabled={isGeneratingRemix}
              className="bg-amber-700 hover:bg-amber-800 text-white font-black text-xs px-2.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>80M</span>
            </button>

            {/* Custom Target Marks remix */}
            <div className="flex items-center bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-xl p-0.5 shadow-xs">
              <input
                type="number"
                min={5}
                max={120}
                value={customVaultMarks}
                onChange={(e) => setCustomVaultMarks(Math.max(5, parseInt(e.target.value) || 5))}
                className="w-12 px-1 text-center font-black text-xs bg-transparent focus:outline-none"
                placeholder="30"
              />
              <span className="text-[10px] font-bold text-stone-500 mr-1">M</span>
              <button
                onClick={() => handleInstantRemix(customVaultMarks)}
                disabled={isGeneratingRemix}
                className="bg-stone-900 dark:bg-stone-700 hover:bg-stone-800 text-white font-bold text-[11px] px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <span>Generate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 bg-stone-50/50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center gap-3 text-xs shrink-0">
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-bold">Subject:</span>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="p-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs font-semibold focus:outline-emerald-600"
            >
              <option value="all">All CBSE Subjects</option>
              {CBSE_SUBJECTS.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* Marks Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-bold">Marks:</span>
            <select
              value={selectedMarks}
              onChange={e => setSelectedMarks(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="p-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs font-semibold focus:outline-emerald-600"
            >
              <option value="all">All Marks</option>
              <option value={1}>1 Mark (MCQ / AR)</option>
              <option value={2}>2 Marks (VSA)</option>
              <option value={3}>3 Marks (SA)</option>
              <option value={4}>4 Marks (Case Study)</option>
              <option value={5}>5 Marks (Long Answer)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search concepts, questions, reactions..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs focus:outline-emerald-600"
            />
          </div>

          {/* Export & Import Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              title="Export Question Vault as JSON"
              className="px-2.5 py-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <label
              title="Import JSON into Question Vault"
              className="px-2.5 py-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>

        {importStatus && (
          <div className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-4 py-2 text-xs font-bold flex items-center justify-between">
            <span>{importStatus}</span>
            <button onClick={() => setImportStatus(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Question List View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Database className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto" />
              <h3 className="text-base font-bold text-stone-700 dark:text-stone-300">No questions found matching your filter</h3>
              <p className="text-xs text-stone-500">Try adjusting subject or marks filters above.</p>
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const subObj = CBSE_SUBJECTS.find(s => s.id === q.subjectId);
              return (
                <div
                  key={q.id || `q-item-${idx}`}
                  className="bg-white dark:bg-stone-800/80 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 hover:border-emerald-500 transition-all space-y-2.5 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-stone-400">#{idx + 1}</span>
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded text-[11px]">
                        {q.marks} Mark{q.marks > 1 ? 's' : ''}
                      </span>
                      <span className="bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold px-2 py-0.5 rounded text-[11px]">
                        {subObj?.name || 'General'}
                      </span>
                      {q.chapterName && (
                        <span className="text-stone-500 dark:text-stone-400 text-[11px] italic">
                          {q.chapterName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {q.source === 'ai_generated' && (
                        <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI Harvested
                        </span>
                      )}
                      {q.timesUsed ? (
                        <span className="text-[10px] text-stone-400">Used {q.timesUsed}x in papers</span>
                      ) : null}
                    </div>
                  </div>

                  {q.casePassage && (
                    <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 text-stone-800 dark:text-stone-200 italic leading-relaxed text-[11px]">
                      {q.casePassage}
                    </div>
                  )}

                  <p className="font-medium text-stone-900 dark:text-stone-100 whitespace-pre-line leading-relaxed">
                    {q.questionText}
                  </p>

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg border text-[11px] ${
                            q.correctAnswer && opt.startsWith(q.correctAnswer.slice(0, 2))
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                              : 'bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.correctAnswer && (
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-700/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                      <span className="font-bold shrink-0">Answer / Marking:</span>
                      <span className="text-stone-600 dark:text-stone-300 font-normal">{q.correctAnswer}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-stone-500 dark:text-stone-400">
            Showing {filteredQuestions.length} of {vaultQuestions.length} vault questions.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold rounded-xl transition-all"
          >
            Close Vault
          </button>
        </div>

      </div>
    </div>
  );
};
