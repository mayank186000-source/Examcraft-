import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Loader2, 
  FileCheck, 
  Settings, 
  Clock, 
  Award,
  Layers
} from 'lucide-react';
import { CustomBlueprint, CustomBlueprintSection, QuestionType } from '../types';

interface CustomBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBlueprint?: CustomBlueprint;
  onApplyBlueprint: (blueprint: CustomBlueprint) => void;
}

export const CustomBlueprintModal: React.FC<CustomBlueprintModalProps> = ({
  isOpen,
  onClose,
  currentBlueprint,
  onApplyBlueprint,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  
  // Form State
  const [title, setTitle] = useState(currentBlueprint?.title || 'Custom Exam Pattern');
  const [timeMinutes, setTimeMinutes] = useState(currentBlueprint?.timeMinutes || 180);
  const [sections, setSections] = useState<CustomBlueprintSection[]>(
    currentBlueprint?.sections || [
      { id: 'sec-1', name: 'SECTION A', description: 'Objective MCQs', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1, hasChoice: false },
      { id: 'sec-2', name: 'SECTION B', description: 'Very Short Answers', questionType: 'vsa', questionCount: 5, marksPerQuestion: 2, hasChoice: true },
      { id: 'sec-3', name: 'SECTION C', description: 'Short Answer Questions', questionType: 'sa', questionCount: 4, marksPerQuestion: 3, hasChoice: true },
      { id: 'sec-4', name: 'SECTION D', description: 'Long Answer Questions', questionType: 'la', questionCount: 2, marksPerQuestion: 5, hasChoice: true },
    ]
  );

  // File Upload State for AI Scanning
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [textNotes, setTextNotes] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);

  if (!isOpen) return null;

  // Calculate Total Marks dynamically from sections
  const totalCalculatedMarks = sections.reduce(
    (sum, sec) => sum + (Number(sec.questionCount) || 0) * (Number(sec.marksPerQuestion) || 0),
    0
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setScanError(null);
      setScanSuccess(false);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          setFilePreviewUrl(evt.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreviewUrl(null);
      }
    }
  };

  const handleScanBlueprint = async () => {
    if (!selectedFile && !textNotes.trim()) {
      setScanError('Please upload a file (Image/PDF) or enter blueprint notes text.');
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setScanSuccess(false);

    try {
      let fileDataBase64 = '';
      let mimeType = '';

      if (selectedFile) {
        mimeType = selectedFile.type || 'application/pdf';
        fileDataBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Str = result.split(',')[1] || result;
            resolve(base64Str);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      const response = await fetch('/api/parse-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: textNotes,
          fileDataBase64,
          mimeType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.blueprint) {
        throw new Error(data.error || 'Failed to analyze blueprint with AI.');
      }

      const scanned = data.blueprint;
      if (scanned.title) setTitle(scanned.title);
      if (scanned.timeMinutes) setTimeMinutes(Number(scanned.timeMinutes) || 180);

      if (Array.isArray(scanned.sections) && scanned.sections.length > 0) {
        const formattedSections: CustomBlueprintSection[] = scanned.sections.map((s: any, idx: number) => ({
          id: `scanned-sec-${Date.now()}-${idx}`,
          name: s.name || `SECTION ${String.fromCharCode(65 + idx)}`,
          description: s.description || '',
          questionType: (['mcq', 'vsa', 'sa', 'la', 'case'].includes(s.questionType) ? s.questionType : 'sa') as QuestionType,
          questionCount: Number(s.questionCount) || 5,
          marksPerQuestion: Number(s.marksPerQuestion) || 1,
          hasChoice: Boolean(s.hasChoice),
        }));

        setSections(formattedSections);
      }

      setScanSuccess(true);
      setActiveTab('manual'); // Switch to manual editor to review extracted sections
    } catch (err: any) {
      console.error('AI Blueprint Scan error:', err);
      setScanError(err.message || 'AI scanning failed. Please try again or construct manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddSection = () => {
    const newChar = String.fromCharCode(65 + sections.length);
    const newSec: CustomBlueprintSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `SECTION ${newChar}`,
      description: 'Custom Section',
      questionType: 'sa',
      questionCount: 4,
      marksPerQuestion: 3,
      hasChoice: false,
    };
    setSections([...sections, newSec]);
  };

  const handleUpdateSection = (id: string, field: keyof CustomBlueprintSection, value: any) => {
    setSections(
      sections.map((sec) => {
        if (sec.id === id) {
          return { ...sec, [field]: value };
        }
        return sec;
      })
    );
  };

  const handleDeleteSection = (id: string) => {
    if (sections.length <= 1) {
      alert('Paper must have at least one section.');
      return;
    }
    setSections(sections.filter((s) => s.id !== id));
  };

  const handleApply = () => {
    if (sections.length === 0) {
      alert('Please add at least one section to your blueprint.');
      return;
    }

    const blueprintObj: CustomBlueprint = {
      enabled: true,
      title: title || 'Custom Exam Pattern',
      totalMarks: totalCalculatedMarks,
      timeMinutes: Number(timeMinutes) || 180,
      sections,
    };

    onApplyBlueprint(blueprintObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800/80 dark:to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Custom Paper Blueprint Builder
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> AI Powered
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload image/PDF of your pattern or build your custom question sections manually.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-6 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'scan'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            1. AI Auto-Scan (PDF / Image)
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-500" />
            2. Blueprint Section Editor ({sections.length} Sections)
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'scan' ? (
            <div className="space-y-6">
              {/* File Dropzone */}
              <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-500 dark:hover:border-indigo-500 bg-indigo-50/30 dark:bg-slate-800/20 rounded-2xl p-6 text-center transition-all group relative">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-4 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Drag & Drop your Blueprint Image or PDF here
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports JPG, PNG, WEBP, and PDF syllabus files
                    </p>
                  </div>
                  {selectedFile && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-xs z-20">
                      <FileCheck className="w-4 h-4" />
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              </div>

              {/* Image Preview if uploaded */}
              {filePreviewUrl && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-center">
                  <img src={filePreviewUrl} alt="Blueprint Preview" className="max-h-48 object-contain rounded-lg shadow-sm" />
                </div>
              )}

              {/* Text Description Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Or Enter Blueprint Details in Text / Hindi / English:</span>
                  <span className="text-slate-400 text-[11px]">Optional</span>
                </label>
                <textarea
                  value={textNotes}
                  onChange={(e) => setTextNotes(e.target.value)}
                  placeholder="e.g. Unit Test Paper of 30 Marks, Time 60 Minutes. Section A: 5 MCQs of 1 mark each. Section B: 3 Short questions of 3 marks each. Section C: 2 Long questions of 8 marks each with internal choices."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                />
              </div>

              {/* Status / Error Message */}
              {scanError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2 border border-red-200 dark:border-red-900">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {scanError}
                </div>
              )}

              {scanSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-900">
                  <Check className="w-4 h-4 shrink-0" />
                  Blueprint extracted successfully! Switched to Section Editor for your review.
                </div>
              )}

              {/* AI Scan Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleScanBlueprint}
                  disabled={isScanning || (!selectedFile && !textNotes.trim())}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Blueprint with Gemini AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Scan Blueprint with AI
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Manual Section Editor Tab */
            <div className="space-y-6">
              {/* Top Meta Info (Title, Duration, Calculated Total Marks) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Blueprint Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(Number(e.target.value) || 60)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" /> Total Paper Marks
                  </label>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 p-1.5 px-3 rounded-lg border border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
                    <span>{totalCalculatedMarks} Marks</span>
                    <span className="text-[10px] text-slate-400 font-normal">Auto-sum</span>
                  </div>
                </div>
              </div>

              {/* Sections List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Question Paper Sections ({sections.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Section
                  </button>
                </div>

                <div className="space-y-3">
                  {sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={sec.name}
                            onChange={(e) => handleUpdateSection(sec.id, 'name', e.target.value)}
                            className="font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 px-1 py-0.5"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                            Total: {(sec.questionCount || 0) * (sec.marksPerQuestion || 0)} Marks
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSection(sec.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Delete Section"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        {/* Question Type */}
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Question Type
                          </label>
                          <select
                            value={sec.questionType}
                            onChange={(e) => handleUpdateSection(sec.id, 'questionType', e.target.value as QuestionType)}
                            className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200"
                          >
                            <option value="mcq">MCQ / Objective (1M)</option>
                            <option value="vsa">Very Short Answer VSA (2M)</option>
                            <option value="sa">Short Answer SA (3M)</option>
                            <option value="la">Long Answer LA (5M / 6M)</option>
                            <option value="case">Case Study / Passage (4M)</option>
                          </select>
                        </div>

                        {/* Number of Questions */}
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            No. of Questions
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={sec.questionCount}
                            onChange={(e) => handleUpdateSection(sec.id, 'questionCount', Math.max(1, Number(e.target.value)))}
                            className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200"
                          />
                        </div>

                        {/* Marks Per Question */}
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Marks per Question
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={sec.marksPerQuestion}
                            onChange={(e) => handleUpdateSection(sec.id, 'marksPerQuestion', Math.max(1, Number(e.target.value)))}
                            className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200"
                          />
                        </div>

                        {/* Description / Instructions */}
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Section Subtitle / Description
                          </label>
                          <input
                            type="text"
                            value={sec.description || ''}
                            onChange={(e) => handleUpdateSection(sec.id, 'description', e.target.value)}
                            placeholder="e.g. All questions are compulsory"
                            className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total Sections: <strong className="text-slate-800 dark:text-slate-200">{sections.length}</strong> | Total Marks: <strong className="text-indigo-600 dark:text-indigo-400">{totalCalculatedMarks}</strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Apply Custom Blueprint ({totalCalculatedMarks} Marks)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
