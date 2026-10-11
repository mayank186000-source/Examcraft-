import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Edit3, 
  Loader2, 
  BookOpen, 
  FileText, 
  PenTool, 
  CheckCircle2, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { JuniorCustomPrompt, Question } from '../types';

interface JuniorWritingGrammarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: string;
  subjectName: string;
  currentCustomPrompt?: JuniorCustomPrompt;
  onApplyPrompt: (customPrompt: JuniorCustomPrompt) => void;
}

export const JuniorWritingGrammarModal: React.FC<JuniorWritingGrammarModalProps> = ({
  isOpen,
  onClose,
  selectedClass,
  subjectName,
  currentCustomPrompt,
  onApplyPrompt,
}) => {
  const [writingPrompt, setWritingPrompt] = useState(currentCustomPrompt?.writingPrompt || '');
  const [grammarPrompt, setGrammarPrompt] = useState(currentCustomPrompt?.grammarPrompt || '');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>(currentCustomPrompt?.confirmedQuestions || []);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(Boolean(currentCustomPrompt?.enabled));

  if (!isOpen) return null;

  const writingChips = [
    "Paragraph: My Best Friend",
    "Paragraph: My School",
    "Application to Principal: Sick Leave",
    "Application to Class Teacher: Urgent Work",
    "Guided Story: The Thirsty Crow",
    "Short Note: My Favorite Festival"
  ];

  const grammarChips = [
    "Prepositions (in/on/under/at/behind)",
    "Action Verbs & Nouns Identification",
    "Singular to Plural Conversions",
    "Use of Is / Am / Are / Was / Were",
    "Opposite Words (Antonyms)",
    "Punctuation & Capitalization"
  ];

  const handleAddWritingChip = (chip: string) => {
    if (writingPrompt.includes(chip)) return;
    setWritingPrompt((prev) => (prev ? `${prev}, ${chip}` : chip));
  };

  const handleAddGrammarChip = (chip: string) => {
    if (grammarPrompt.includes(chip)) return;
    setGrammarPrompt((prev) => (prev ? `${prev}, ${chip}` : chip));
  };

  const handleGenerateAIPreview = async () => {
    if (!writingPrompt.trim() && !grammarPrompt.trim()) {
      setPreviewError('Please enter writing topics or grammar instructions.');
      return;
    }

    setIsGeneratingPreview(true);
    setPreviewError(null);

    try {
      const response = await fetch('/api/preview-junior-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetClass: selectedClass,
          subjectName,
          writingPrompt,
          grammarPrompt,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !Array.isArray(data.questions)) {
        throw new Error(data.error || 'Failed to generate preview questions.');
      }

      setPreviewQuestions(data.questions);
      setIsConfirmed(false);
    } catch (err: any) {
      console.error('AI Preview generation error:', err);
      setPreviewError(err.message || 'Failed to generate question preview.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleConfirmAndApply = () => {
    const customPromptObj: JuniorCustomPrompt = {
      enabled: true,
      writingPrompt: writingPrompt.trim(),
      grammarPrompt: grammarPrompt.trim(),
      confirmedQuestions: previewQuestions,
    };

    onApplyPrompt(customPromptObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Custom Writing & Grammar Assistant (Class {selectedClass})
                <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full">
                  Junior Wing
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Specify exact writing topics & grammar concepts taught in class, preview AI questions, and confirm before paper generation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Writing Topics Input */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-500" />
              Writing Section Custom Topics (Paragraph, Essay, Application, Story):
            </label>
            <textarea
              value={writingPrompt}
              onChange={(e) => setWritingPrompt(e.target.value)}
              placeholder="e.g. Write a 5-line paragraph on 'My School' AND an Application to Principal requesting 2 days leave for sister's wedding."
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 self-center">Quick Ideas:</span>
              {writingChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleAddWritingChip(chip)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-200 rounded-lg border border-amber-200 dark:border-amber-800/80 transition-colors cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Grammar Concepts Input */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Grammar Section Custom Instructions & Question Types:
            </label>
            <textarea
              value={grammarPrompt}
              onChange={(e) => setGrammarPrompt(e.target.value)}
              placeholder="e.g. Fill in the blanks with correct Prepositions (in, on, under, at) AND Circle Nouns and Verbs in given sentences."
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 self-center">Quick Ideas:</span>
              {grammarChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleAddGrammarChip(chip)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-200 rounded-lg border border-indigo-200 dark:border-indigo-800/80 transition-colors cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Preview Action */}
          <div className="flex justify-between items-center pt-2">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Click Preview to review questions before adding to final paper
            </p>
            <button
              type="button"
              onClick={handleGenerateAIPreview}
              disabled={isGeneratingPreview || (!writingPrompt.trim() && !grammarPrompt.trim())}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPreview ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating AI Question Preview...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Step 1: Preview AI Questions
                </>
              )}
            </button>
          </div>

          {previewError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2 border border-red-200 dark:border-red-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {previewError}
            </div>
          )}

          {/* Section 3: Live Preview & Confirmation Box */}
          {previewQuestions.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Step 2: AI Generated Questions Preview ({previewQuestions.length} Questions)
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  Ready for Review
                </span>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {previewQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        Q{idx + 1} ({q.marks || 5} Marks) [{q.questionType?.toUpperCase() || 'CUSTOM'}]:
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-pre-line">
                      {q.question}
                    </p>
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx}>• {opt}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmAndApply}
            disabled={!writingPrompt.trim() && !grammarPrompt.trim() && previewQuestions.length === 0}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Confirm & Apply Custom Writing/Grammar
          </button>
        </div>

      </div>
    </div>
  );
};
