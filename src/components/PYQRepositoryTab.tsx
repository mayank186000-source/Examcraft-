import React, { useState, useMemo } from 'react';
import { PRELOADED_PYQS } from '../data/cbseData';
import { PYQPaper, GeneratedPaper, CustomBranding } from '../types';
import { buildFullPYQBoardPaper } from '../utils/pyqFullPaperBuilder';
import {
  History,
  Download,
  Eye,
  Sparkles,
  Search,
  Calendar,
  FileCheck,
  Printer,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Filter,
  X,
  Languages,
  Award
} from 'lucide-react';

interface PYQRepositoryTabProps {
  onLoadPaperToPreview: (paper: GeneratedPaper) => void;
  branding: CustomBranding;
}

// Helper function to extract class level ('9', '10', '11', '12')
function getClassLevel(pyq: PYQPaper): string {
  const sub = pyq.subjectId.toLowerCase();
  const title = pyq.title.toLowerCase();
  const name = pyq.subjectName.toLowerCase();

  if (sub.includes('class3') || title.includes('class 3') || name.includes('class 3')) return '3';
  if (sub.includes('class4') || title.includes('class 4') || name.includes('class 4')) return '4';
  if (sub.includes('class5') || title.includes('class 5') || name.includes('class 5')) return '5';
  if (sub.includes('class6') || title.includes('class 6') || name.includes('class 6')) return '6';
  if (sub.includes('class7') || title.includes('class 7') || name.includes('class 7')) return '7';
  if (sub.includes('class8') || title.includes('class 8') || name.includes('class 8')) return '8';
  if (sub.includes('class9') || title.includes('class 9') || name.includes('class 9')) return '9';
  if (sub.includes('class11') || title.includes('class 11') || name.includes('class 11')) return '11';
  if (sub.includes('class12') || title.includes('class 12') || name.includes('class 12')) return '12';
  return '10'; // Default Class 10 Board
}

// Helper function to extract high-level subject group
function getSubjectCategory(pyq: PYQPaper): string {
  const sub = pyq.subjectId.toLowerCase();
  const name = pyq.subjectName.toLowerCase();
  const title = pyq.title.toLowerCase();

  if (name.includes('physics') || title.includes('physics')) return 'Physics';
  if (name.includes('chemistry') || title.includes('chemistry')) return 'Chemistry';
  if (name.includes('biology') || title.includes('biology')) return 'Biology';
  if (name.includes('accountancy') || title.includes('accountancy') || sub.includes('acc')) return 'Accountancy';
  if (name.includes('business') || title.includes('business') || sub.includes('bst')) return 'Business Studies';
  if (name.includes('economics') || title.includes('economics') || sub.includes('eco')) return 'Economics';
  if (name.includes('history') || title.includes('history') || sub.includes('hist')) return 'History';
  if (name.includes('political') || title.includes('political') || sub.includes('pol')) return 'Political Science';
  if (name.includes('geography') || title.includes('geography') || sub.includes('geo')) return 'Geography';
  if (name.includes('sociology') || title.includes('sociology') || sub.includes('socio')) return 'Sociology';
  if (sub.includes('sci') || name.includes('science') || title.includes('science')) return 'Science';
  if (sub.includes('math') || name.includes('mathematics') || name.includes('math')) return 'Mathematics';
  if (sub.includes('soc') || sub.includes('sst') || name.includes('social')) return 'Social Science';
  if (sub.includes('eng') || name.includes('english')) return 'English';
  if (sub.includes('hin') || name.includes('hindi')) return 'Hindi';
  if (sub.includes('comp') || sub.includes('cs') || sub.includes('it') || name.includes('computer') || name.includes('technology')) return 'IT & CS';
  return 'Other';
}

export const PYQRepositoryTab: React.FC<PYQRepositoryTabProps> = ({
  onLoadPaperToPreview,
  branding
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'downloads' | 'newest'>('downloads');
  const [selectedPyq, setSelectedPyq] = useState<PYQPaper | null>(null);

  // Class badge styling
  const getClassBadge = (cls: string) => {
    switch (cls) {
      case '10':
        return { label: 'Class 10th Board', bg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800' };
      case '12':
        return { label: 'Class 12th Board', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800' };
      case '9':
        return { label: 'Class 9th Annual', bg: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800' };
      case '11':
        return { label: 'Class 11th Annual', bg: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800' };
      default:
        return { label: `Class ${cls}th`, bg: 'bg-stone-100 text-stone-900 border-stone-300' };
    }
  };

  // Available subject options based on selected class
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    PRELOADED_PYQS.forEach(p => {
      const cls = getClassLevel(p);
      if (selectedClass === 'all' || selectedClass === cls) {
        set.add(getSubjectCategory(p));
      }
    });
    return Array.from(set).sort();
  }, [selectedClass]);

  // Filtered and sorted PYQ list
  const filteredPyqs = useMemo(() => {
    return PRELOADED_PYQS.filter(p => {
      const cls = getClassLevel(p);
      const subjCat = getSubjectCategory(p);

      const matchesClass = selectedClass === 'all' || cls === selectedClass;
      const matchesSubject = selectedSubject === 'all' || subjCat === selectedSubject;
      const matchesYear = selectedYear === 'all' || p.year === selectedYear;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.subjectName.toLowerCase().includes(q) ||
        p.setNumber.toLowerCase().includes(q) ||
        p.year.toString().includes(q);

      return matchesClass && matchesSubject && matchesYear && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'downloads') {
        return (b.downloadCount || 0) - (a.downloadCount || 0);
      }
      return b.year - a.year;
    });
  }, [selectedClass, selectedSubject, selectedYear, searchQuery, sortBy]);

  const handleConvertPyqToPaper = (pyq: PYQPaper) => {
    const convertedPaper = buildFullPYQBoardPaper(pyq, branding);
    onLoadPaperToPreview(convertedPaper);
  };

  const resetFilters = () => {
    setSelectedClass('all');
    setSelectedSubject('all');
    setSelectedYear('all');
    setSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-700 text-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
              <History className="w-3.5 h-3.5 text-amber-300" />
              <span>Student-Friendly CBSE PYQ Repository (2016-2025: Last 10 Years)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Class-wise & Subject-wise Official CBSE Papers
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Find real board question papers arranged by <strong>Class (9th, 10th, 11th, 12th)</strong>, <strong>Subject</strong>, and <strong>Year</strong>. Preview questions, view step-by-step marking schemes, or download/print with 1-click!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-stone-800/90 border border-stone-700/80 px-4 py-3 rounded-2xl">
            <GraduationCap className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">{filteredPyqs.length} Papers Available</p>
              <p className="text-[11px] text-stone-400">100% Free PDF / Print Access</p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        
        {/* Row 1: Class Selection Tabs */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-stone-500 dark:text-stone-400 tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. Choose Class (कक्षा चुनें):</span>
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All Classes (सभी कक्षाएं)' },
              { id: '10', label: 'Class 10th Board' },
              { id: '12', label: 'Class 12th Board' },
              { id: '9', label: 'Class 9th' },
              { id: '11', label: 'Class 11th' },
              { id: '8', label: 'Class 8th' },
              { id: '7', label: 'Class 7th' },
              { id: '6', label: 'Class 6th' },
              { id: '5', label: 'Class 5th' },
              { id: '4', label: 'Class 4th' },
              { id: '3', label: 'Class 3rd' }
            ].map(cls => (
              <button
                key={cls.id}
                onClick={() => {
                  setSelectedClass(cls.id);
                  setSelectedSubject('all'); // reset subject on class change
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedClass === cls.id
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20 ring-2 ring-emerald-500'
                    : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                <span>{cls.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Subject & Year Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 pt-2 border-t border-stone-100 dark:border-stone-800">
          
          {/* Subject Filter Dropdown / Chips */}
          <div className="lg:col-span-5 space-y-1">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-500" />
              <span>2. Subject (विषय):</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2.5 font-bold text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
            >
              <option value="all">All Subjects (सभी विषय)</option>
              {availableSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Year Filter Dropdown */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-500" />
              <span>3. Year (वर्ष):</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2.5 font-bold text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
            >
              <option value="all">All 10 Years (2016-2025)</option>
              {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016].map((yr) => (
                <option key={yr} value={yr}>
                  {yr} {yr >= 2022 || yr <= 2020 ? 'Board Exam' : 'Exam Paper'}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="lg:col-span-4 space-y-1">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-400 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-stone-500" />
              <span>Search Keywords:</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search set, code, title..."
                className="w-full text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl pl-3 pr-8 py-2.5 text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-emerald-600 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Tags & Reset */}
        {(selectedClass !== 'all' || selectedSubject !== 'all' || selectedYear !== 'all' || searchQuery) && (
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-stone-500">Active Filters:</span>
              {selectedClass !== 'all' && (
                <span className="bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md font-bold">
                  Class {selectedClass}
                </span>
              )}
              {selectedSubject !== 'all' && (
                <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md font-bold">
                  Subject: {selectedSubject}
                </span>
              )}
              {selectedYear !== 'all' && (
                <span className="bg-sky-100 text-sky-900 px-2.5 py-0.5 rounded-md font-bold">
                  Year: {selectedYear}
                </span>
              )}
              {searchQuery && (
                <span className="bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-md font-bold">
                  "{searchQuery}"
                </span>
              )}
            </div>

            <button
              onClick={resetFilters}
              className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* RESULT STATUS & SORT */}
      <div className="flex items-center justify-between text-xs font-bold text-stone-600 dark:text-stone-400">
        <p>Showing {filteredPyqs.length} Previous Year Papers</p>
        <div className="flex items-center gap-2">
          <span>Sort By:</span>
          <button
            onClick={() => setSortBy('downloads')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              sortBy === 'downloads'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            Most Downloaded
          </button>
          <button
            onClick={() => setSortBy('newest')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              sortBy === 'newest'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            Newest Year
          </button>
        </div>
      </div>

      {/* PYQ CARDS GRID */}
      {filteredPyqs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPyqs.map((pyq) => {
            const cls = getClassLevel(pyq);
            const classStyle = getClassBadge(cls);

            return (
              <div
                key={pyq.id}
                className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border ${classStyle.bg}`}>
                      {classStyle.label}
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono font-bold bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                      Set: {pyq.setNumber}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-stone-900 dark:text-white text-base group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    {pyq.title}
                  </h3>

                  {/* Features / Details */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {pyq.totalMarks} Marks
                      </span>
                      <span>•</span>
                      <span>{pyq.durationMinutes} Mins</span>
                      <span>•</span>
                      <span>{pyq.questions.length} Questions</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>Includes Official CBSE Answer & Marking Scheme</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleConvertPyqToPaper(pyq)}
                    className="bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Open Paper & Solutions</span>
                  </button>

                  <button
                    onClick={() => handleConvertPyqToPaper(pyq)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-900/15 transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Download / Print PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-12 text-center border border-stone-200 dark:border-stone-800 space-y-3">
          <BookOpen className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto" />
          <h3 className="font-bold text-stone-800 dark:text-stone-200 text-base">No Matching Papers Found</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Try resetting your class, subject, or year filters to view available previous year question papers.
          </p>
          <button
            onClick={resetFilters}
            className="mt-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Questions & Marking Scheme Modal */}
      {selectedPyq && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-stone-200 dark:border-stone-800">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
              <div>
                <h3 className="font-bold text-base text-white">{selectedPyq.title}</h3>
                <p className="text-xs text-stone-400">
                  CBSE Official Board Set {selectedPyq.setNumber} • {selectedPyq.totalMarks} Marks • Class {getClassLevel(selectedPyq)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPyq(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {selectedPyq.questions.map((q, idx) => (
                <div key={`${selectedPyq.id}-${q.id || idx}`} className="p-4 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-800 dark:text-emerald-400">Q{idx + 1}. ({q.type.toUpperCase()})</span>
                    <span className="bg-white dark:bg-stone-900 px-2 py-0.5 rounded border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200">
                      {q.marks} Mark{q.marks > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-stone-900 dark:text-stone-100 whitespace-pre-line">{q.questionText}</p>

                  {q.options && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-stone-700 dark:text-stone-300 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div key={`opt-${q.id || idx}-${oIdx}`}>{opt}</div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs">
                    <p className="font-bold text-emerald-900 dark:text-emerald-300">Official Answer & Step Marking Scheme:</p>
                    <p className="font-medium text-stone-800 dark:text-stone-200 mt-0.5">{q.correctAnswer}</p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 italic">{q.markingScheme}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-stone-100 dark:bg-stone-800 p-4 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Ready for print & practice</span>
              <button
                onClick={() => {
                  handleConvertPyqToPaper(selectedPyq);
                  setSelectedPyq(null);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Open in Full Paper & Print View</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

