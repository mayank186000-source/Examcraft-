import React, { useState, useEffect } from 'react';
import { Search, Hash, FileText, Check, Copy, Clock, Sparkles, BookOpen, Trash2, ArrowRight, Share2 } from 'lucide-react';
import { GeneratedPaper } from '../types';
import { getPaperByCode, getAllSavedPapers, deletePaperFromRegistry } from '../utils/paperRegistry';

interface PaperCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaper: (paper: GeneratedPaper) => void;
  onOpenShareModal?: (paper: GeneratedPaper) => void;
}

export const PaperCodeModal: React.FC<PaperCodeModalProps> = ({
  isOpen,
  onClose,
  onSelectPaper,
  onOpenShareModal
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [savedPapers, setSavedPapers] = useState<GeneratedPaper[]>([]);
  const [classFilter, setClassFilter] = useState<'all' | '9' | '10' | '12'>('all');

  useEffect(() => {
    if (isOpen) {
      setSavedPapers(getAllSavedPapers());
      setErrorMsg('');
      setInputCode('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = (codeToSearch?: string) => {
    const code = codeToSearch || inputCode;
    if (!code.trim()) {
      setErrorMsg('कृपया पेपर कोड दर्ज करें (e.g., CBSE12-PHY-2026, CBSE10-MATH-2026, or CBSE9-SCI-4821)');
      return;
    }

    const paper = getPaperByCode(code);
    if (paper) {
      setErrorMsg('');
      onSelectPaper(paper);
      onClose();
    } else {
      setErrorMsg(`पेपर कोड '${code}' नहीं मिला। कृपया नीचे दिए गए उपलब्ध कोड में से चुनें।`);
    }
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeletePaper = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePaperFromRegistry(code);
    setSavedPapers(getAllSavedPapers());
  };

  const filteredPapers = savedPapers.filter(p => {
    const is12 = p.config?.subjectId?.startsWith('class12-') || (p.paperCode && p.paperCode.startsWith('CBSE12'));
    const is9 = p.config?.subjectId?.startsWith('class9-') || (p.paperCode && p.paperCode.startsWith('CBSE9'));
    if (classFilter === '12') return is12;
    if (classFilter === '9') return is9;
    if (classFilter === '10') return !is12 && !is9;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 border border-emerald-700 flex items-center justify-center shadow-inner">
              <Hash className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                Load Question Paper by Code
                <span className="text-[10px] bg-amber-400 text-stone-900 font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Regenerate
                </span>
              </h2>
              <p className="text-xs text-emerald-200">
                पेपर कोड दर्ज करें और समान प्रश्न पत्र व हल (Solutions) वापस लोड करें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white text-xl font-bold p-1 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Input Search Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-emerald-700" />
              <span>Enter Unique Paper Code (यूनिक पेपर कोड)</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value);
                    setErrorMsg('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. CBSE10-MATH-2026 or CBSE10-SCI-9821"
                  className="w-full bg-stone-50 border-2 border-stone-300 focus:border-emerald-600 focus:bg-white text-stone-900 font-mono text-base font-bold rounded-xl px-4 py-3 outline-none transition-all placeholder:font-sans placeholder:font-normal placeholder:text-stone-400 uppercase tracking-wider"
                />
              </div>
              <button
                onClick={() => handleSearch()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-md shadow-emerald-900/10 text-sm whitespace-nowrap"
              >
                <span>Fetch Paper</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-1.5">
                <span>⚠️ {errorMsg}</span>
              </p>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">How Unique Paper Codes Work:</p>
              <p className="text-amber-900 text-[11px] leading-relaxed mt-0.5">
                Every generated paper automatically gets a unique code (e.g. <code className="font-mono font-bold bg-amber-100 px-1 rounded">CBSE10-041-8932</code>). Save this code to view, re-print, or take an interactive practice quiz on the exact paper anytime later!
              </p>
            </div>
          </div>

          {/* Saved & Sample Papers List */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                Available & Saved Question Papers ({filteredPapers.length})
              </h3>
              
              {/* Class Filter Switcher */}
              <div className="flex items-center p-0.5 bg-stone-100 rounded-lg border border-stone-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setClassFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    classFilter === 'all' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  All ({savedPapers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setClassFilter('12')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    classFilter === '12' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Class 12
                </button>
                <button
                  type="button"
                  onClick={() => setClassFilter('10')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    classFilter === '10' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Class 10
                </button>
                <button
                  type="button"
                  onClick={() => setClassFilter('9')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    classFilter === '9' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Class 9
                </button>
              </div>
            </div>

            {filteredPapers.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-stone-500">No saved papers found for this filter.</p>
                <p className="text-[11px] text-stone-400">Generate a new paper from the Paper Generator tab to get your unique code!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-80 overflow-y-auto pr-1">
                {filteredPapers.map((paper) => {
                  const code = paper.paperCode || paper.config.examCode || paper.id;
                  const isCopied = copiedCode === code;
                  const isClass12 = paper.config?.subjectId?.startsWith('class12-') || code.startsWith('CBSE12');
                  const isClass11 = paper.config?.subjectId?.startsWith('class11-') || code.startsWith('CBSE11');
                  const isClass9 = paper.config?.subjectId?.startsWith('class9-') || code.startsWith('CBSE9');
                  const classBadgeText = isClass12 ? 'Class 12th Board' : isClass11 ? 'Class 11th' : isClass9 ? 'Class 9th' : 'Class 10th Board';

                  const totalQuestions = paper.sections
                    ? paper.sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0)
                    : 0;

                  return (
                    <div
                      key={code}
                      onClick={() => {
                        onSelectPaper(paper);
                        onClose();
                      }}
                      className="group bg-stone-50 hover:bg-emerald-50/70 border border-stone-200 hover:border-emerald-400 p-4 rounded-2xl transition-all cursor-pointer relative flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-md"
                    >
                      <div className="space-y-2">
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="bg-emerald-100 text-emerald-900 font-mono font-extrabold text-[11px] px-2.5 py-0.5 rounded-md border border-emerald-300">
                            {code}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 border border-stone-300">
                              {classBadgeText}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenShareModal?.(paper);
                              }}
                              className="text-stone-400 hover:text-emerald-700 p-1 rounded hover:bg-white transition-colors cursor-pointer"
                              title="Share Paper Link & QR Code"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleCopyCode(code, e)}
                              className="text-stone-400 hover:text-emerald-700 p-1 rounded hover:bg-white transition-colors cursor-pointer"
                              title="Copy Paper Code"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            {!code.endsWith('-2026') && (
                              <button
                                onClick={(e) => handleDeletePaper(code, e)}
                                className="text-stone-400 hover:text-rose-600 p-1 rounded hover:bg-white transition-colors"
                                title="Delete Saved Paper"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Exam Title */}
                        <h4 className="text-xs font-black text-stone-900 line-clamp-2 group-hover:text-emerald-950 transition-colors leading-snug">
                          {paper.config.title || paper.subjectName}
                        </h4>

                        {/* Metrics Row */}
                        <div className="flex items-center gap-2 text-[11px] text-stone-600 font-bold bg-white p-2 rounded-lg border border-stone-200/80">
                          <span className="text-amber-800">{paper.config.totalMarks || 80} Marks</span>
                          <span className="text-stone-300">•</span>
                          <span>{paper.config.durationMinutes || 180} Mins</span>
                          <span className="text-stone-300">•</span>
                          <span className="text-emerald-800">{totalQuestions} Questions</span>
                        </div>
                      </div>

                      {/* Footer CTA */}
                      <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-[11px] font-bold">
                        <span className="flex items-center gap-1 text-stone-400 font-normal text-[10px]">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {paper.config.date || 'Saved'}
                        </span>
                        <span className="text-emerald-700 font-extrabold group-hover:underline flex items-center gap-1 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                          <span>Open Board Paper View</span>
                          <span>→</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 flex items-center justify-between">
          <p className="text-[11px] text-stone-500">
            ExamCraft CBSE Unique Code Paper System • CBSE Board 2025-2026
          </p>
          <button
            onClick={onClose}
            className="text-xs font-bold text-stone-600 hover:text-stone-900 px-4 py-2 rounded-lg bg-stone-200 hover:bg-stone-300 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
