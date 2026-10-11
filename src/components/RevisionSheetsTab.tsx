import React, { useState } from 'react';
import {
  Zap,
  BookOpen,
  Download,
  Share2,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Search,
  Filter
} from 'lucide-react';
import { REVISION_SHEETS, ChapterRevisionSheet } from '../data/revisionSheets';

export const RevisionSheetsTab: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<'3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'>('10');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const classSubjects: Record<string, Array<{ id: string; label: string }>> = {
    '3': [{ id: 'all', label: 'All Class 3 Subjects' }],
    '4': [{ id: 'all', label: 'All Class 4 Subjects' }],
    '5': [{ id: 'all', label: 'All Class 5 Subjects' }],
    '6': [{ id: 'all', label: 'All Class 6 Subjects' }],
    '7': [{ id: 'all', label: 'All Class 7 Subjects' }],
    '8': [{ id: 'all', label: 'All Class 8 Subjects' }],
    '9': [
      { id: 'all', label: 'All Class 9 Subjects' },
      { id: 'class9-science-086', label: 'Science (086)' },
      { id: 'class9-maths-041', label: 'Mathematics (041)' }
    ],
    '10': [
      { id: 'all', label: 'All Class 10 Subjects' },
      { id: 'science-086', label: 'Science (086)' },
      { id: 'maths-041', label: 'Mathematics (041)' },
      { id: 'social-087', label: 'Social Science (087)' }
    ],
    '11': [{ id: 'all', label: 'All Class 11 Subjects' }],
    '12': [
      { id: 'all', label: 'All Class 12 Subjects' },
      { id: 'class12-physics-042', label: 'Physics (042)' },
      { id: 'class12-chemistry-043', label: 'Chemistry (043)' },
      { id: 'class12-maths-041', label: 'Mathematics (041)' }
    ]
  };

  const filteredSheets = REVISION_SHEETS.filter(sheet => {
    const matchClass = sheet.classLevel === selectedClass;
    const matchSubject = selectedSubject === 'all' || sheet.subjectId === selectedSubject;
    const matchSearch = sheet.chapterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        sheet.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        sheet.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSubject && matchSearch;
  });

  const [selectedSheet, setSelectedSheet] = useState<ChapterRevisionSheet>(
    REVISION_SHEETS.find(s => s.classLevel === '10') || REVISION_SHEETS[0]
  );

  const handleClassChange = (newClass: '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12') => {
    setSelectedClass(newClass);
    setSelectedSubject('all');
    const firstForClass = REVISION_SHEETS.find(s => s.classLevel === newClass);
    if (firstForClass) {
      setSelectedSheet(firstForClass);
    }
  };

  const activeSheet = filteredSheets.find(s => s.id === selectedSheet?.id) || filteredSheets[0] || REVISION_SHEETS[0];

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!activeSheet) return;
    const text = 
`⚡ *CBSE Class ${activeSheet.classLevel || selectedClass} Quick Revision Sheet*
📖 *Subject:* ${activeSheet.subjectName}
📌 *Chapter:* Ch-${activeSheet.chapterNumber}: ${activeSheet.chapterName}
⚖️ *Weightage:* ${activeSheet.marksWeightage}

💡 *Key Concepts:*
${activeSheet.keyConcepts.map(c => `• ${c}`).join('\n')}

🎯 *Topper Tip:* ${activeSheet.topperTips}

Shared via CBSE Paper Generator & Revision Hub`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-8 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>High-Yield Chapter Revision Summaries</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Formula & Chapter Revision Sheets
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
            Essential board examination formulas, key reactions, theorems, and examiner tips summarized into concise 1-page revision guides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Sheet</span>
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-lg shadow-xs transition-colors text-xs cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Filter & Chapter List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            {/* Class Switcher */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Select CBSE Class
              </label>
              <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(['12', '11', '10', '9', '8', '7', '6', '5', '4', '3'] as const).map((cls) => (
                  <button
                    key={cls}
                    onClick={() => handleClassChange(cls)}
                    className={`py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      selectedClass === cls
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Class {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={`Search Class ${selectedClass} chapter or topic...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {/* Subject Filters */}
            <div className="flex flex-wrap gap-1.5">
              {(classSubjects[selectedClass] || []).map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubject(s.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedSubject === s.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chapter Selector List */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[580px] overflow-y-auto">
            {filteredSheets.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500">
                No revision sheets found for the current search/filter.
              </div>
            ) : (
              filteredSheets.map(sheet => {
                const isSelected = activeSheet?.id === sheet.id;
                return (
                  <button
                    key={sheet.id}
                    onClick={() => setSelectedSheet(sheet)}
                    className={`w-full text-left p-4 transition-all flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-amber-50 border-l-4 border-amber-600' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-stone-200/80 text-stone-700">
                          Ch-{sheet.chapterNumber}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700">
                          {sheet.marksWeightage}
                        </span>
                      </div>
                      <h4 className={`text-xs font-bold leading-tight ${isSelected ? 'text-amber-950 font-black' : 'text-stone-800'}`}>
                        {sheet.chapterName}
                      </h4>
                      <p className="text-[11px] text-stone-500 line-clamp-1">{sheet.unit}</p>
                    </div>
                    <BookOpen className={`w-4 h-4 shrink-0 mt-1 ${isSelected ? 'text-amber-600' : 'text-stone-300'}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Selected Revision Sheet Preview */}
        <div className="lg:col-span-8 edtech-card sheet-card rounded-3xl border border-stone-200 shadow-md p-6 sm:p-8 space-y-6 print:border-none print:shadow-none">
          {/* Sheet Header */}
          <div className="border-b border-stone-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Class {activeSheet.classLevel || selectedClass} • {activeSheet.subjectName}
                </span>
                <span className="text-xs font-bold text-stone-500">
                  Unit: {activeSheet.unit}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-1.5">
                Ch-{activeSheet.chapterNumber}: {activeSheet.chapterName}
              </h2>
            </div>

            <div className="bg-amber-500/10 border border-amber-200 px-3.5 py-2 rounded-xl text-right">
              <span className="text-[10px] font-bold text-stone-500 block uppercase tracking-wider">CBSE Weightage</span>
              <span className="text-base font-black text-amber-800">{activeSheet.marksWeightage}</span>
            </div>
          </div>

          {/* Key Syllabus Concepts */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black tracking-wider uppercase text-stone-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Core Competency & Key Syllabus Concepts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeSheet.keyConcepts.map((concept, idx) => (
                <div key={idx} className="bg-stone-50 border border-stone-200/80 p-3 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs font-medium text-stone-800 leading-relaxed">{concept}</span>
                </div>
              ))}
            </div>
          </div>

          {/* High-Yield Formulas & Reactions */}
          <div className="space-y-3">
            <h3 className="text-xs font-black tracking-wider uppercase text-stone-700 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
              High-Yield Formulas & Board Exam Essentials
            </h3>
            <div className="space-y-3">
              {activeSheet.formulasAndReactions.map((item, idx) => (
                <div key={idx} className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">{item.name}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                      item.examImportance === 'Guaranteed' ? 'bg-red-100 text-red-700' :
                      item.examImportance === 'Very High' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      ★ {item.examImportance}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-amber-200 font-mono text-xs font-bold text-amber-950 tracking-wide whitespace-pre-line">
                    {item.formulaOrRule}
                  </div>
                  <p className="text-[11px] text-stone-600 font-medium italic">
                    💡 Note: {item.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Common Mistakes & Topper Advice Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Common Mistakes */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Common Traps & Student Mistakes:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-red-950 font-medium list-disc list-inside">
                {activeSheet.commonMistakes.map((mistake, idx) => (
                  <li key={idx}>{mistake}</li>
                ))}
              </ul>
            </div>

            {/* Topper Pro Tip */}
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <Lightbulb className="w-4 h-4 text-emerald-700" />
                <span>Board Topper Score Multiplier:</span>
              </div>
              <p className="text-[11px] text-emerald-950 leading-relaxed font-medium">
                {activeSheet.topperTips}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
