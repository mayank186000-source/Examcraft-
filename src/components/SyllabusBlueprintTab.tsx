import React, { useState } from 'react';
import { CBSE_CLASS_3_SUBJECTS, CBSE_CLASS_4_SUBJECTS, CBSE_CLASS_5_SUBJECTS, CBSE_CLASS_6_SUBJECTS, CBSE_CLASS_7_SUBJECTS, CBSE_CLASS_8_SUBJECTS, CBSE_CLASS_9_SUBJECTS, CBSE_CLASS_10_SUBJECTS, CBSE_CLASS_11_SUBJECTS, CBSE_CLASS_12_SUBJECTS } from '../data/cbseData';
import { BookOpenCheck, Layers, Award, FileText, CheckCircle2, ChevronRight, Calculator, FlaskConical, Globe, BookOpen, Laptop } from 'lucide-react';

export const SyllabusBlueprintTab: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<'12' | '11' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3'>('10');
  const [activeSubjectId, setActiveSubjectId] = useState<string>('science-086');

  const availableSubjects = selectedClass === '12' 
    ? CBSE_CLASS_12_SUBJECTS 
    : selectedClass === '11'
      ? CBSE_CLASS_11_SUBJECTS
      : selectedClass === '9' 
        ? CBSE_CLASS_9_SUBJECTS 
        : selectedClass === '8'
          ? CBSE_CLASS_8_SUBJECTS
          : selectedClass === '7'
            ? CBSE_CLASS_7_SUBJECTS
            : selectedClass === '6'
              ? CBSE_CLASS_6_SUBJECTS
              : selectedClass === '5'
                ? CBSE_CLASS_5_SUBJECTS
                : selectedClass === '4'
                  ? CBSE_CLASS_4_SUBJECTS
                  : selectedClass === '3'
                    ? CBSE_CLASS_3_SUBJECTS
                    : CBSE_CLASS_10_SUBJECTS;
  const currentSubject = availableSubjects.find(s => s.id === activeSubjectId) || availableSubjects[0];

  // Group chapters by Unit Name
  const unitMap = new Map<string, { weightage: number; chapters: typeof currentSubject.chapters }>();
  currentSubject.chapters.forEach(ch => {
    if (!unitMap.has(ch.unitName)) {
      unitMap.set(ch.unitName, { weightage: ch.unitWeightageMarks, chapters: [] });
    }
    unitMap.get(ch.unitName)!.chapters.push(ch);
  });

  const units = Array.from(unitMap.entries());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-700 text-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
            <BookOpenCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Official CBSE Curriculum 2025-2026</span>
          </div>

          <div className="flex flex-wrap items-center p-1 bg-stone-800 rounded-xl border border-stone-700 gap-1">
            {[
              { id: '12', label: 'Class 12th', sub: 'class12-physics-042' },
              { id: '11', label: 'Class 11th', sub: 'physics-042' },
              { id: '10', label: 'Class 10th', sub: 'science-086' },
              { id: '9', label: 'Class 9th', sub: 'class9-science-086' },
              { id: '8', label: 'Class 8th', sub: 'class8-science' },
              { id: '7', label: 'Class 7th', sub: 'class7-science' },
              { id: '6', label: 'Class 6th', sub: 'class6-science' },
              { id: '5', label: 'Class 5th', sub: 'class5-science-evs' },
              { id: '4', label: 'Class 4th', sub: 'class4-science-evs' },
              { id: '3', label: 'Class 3rd', sub: 'class3-science-evs' },
            ].map((cls) => (
              <button
                key={cls.id}
                type="button"
                onClick={() => {
                  setSelectedClass(cls.id as any);
                  setActiveSubjectId(cls.sub);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  selectedClass === cls.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                {cls.label}
              </button>
            ))}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white">
          CBSE Class {selectedClass}th Syllabus & Blueprint Weightage
        </h1>
        <p className="text-sm text-stone-300 max-w-2xl">
          Detailed unit-wise mark distribution, chapter topic lists, learning objectives, and question typology matrix according to CBSE Board guidelines.
        </p>
      </div>

      {/* Subject Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {availableSubjects.map((sub) => {
          const isActive = sub.id === activeSubjectId;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubjectId(sub.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-emerald-700 text-white border-emerald-600 shadow-md'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
            >
              <span>{sub.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>
                {sub.code}
              </span>
            </button>
          );
        })}
      </div>

      {/* Blueprint Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Units & Chapters List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">{currentSubject.name} Syllabus Breakdown</h2>
                <p className="text-xs text-stone-500">Total Theory Marks: {currentSubject.standardMarks} | Internal Assessment: 20 Marks</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full border border-emerald-200">
                100% Latest Pattern
              </span>
            </div>

            {/* Units */}
            <div className="space-y-6">
              {units.map(([unitName, data], uIdx) => (
                <div key={uIdx} className="border border-stone-200 rounded-xl overflow-hidden">
                  {/* Unit Bar */}
                  <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                        {uIdx + 1}
                      </span>
                      <h3 className="font-bold text-sm text-white">{unitName}</h3>
                    </div>
                    <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-amber-200">
                      {data.weightage} Marks
                    </span>
                  </div>

                  {/* Chapters in Unit */}
                  <div className="p-4 bg-stone-50 divide-y divide-stone-200 space-y-4">
                    {data.chapters.map(ch => (
                      <div key={ch.id} className="pt-3 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                            <span className="text-xs text-emerald-700 font-extrabold">Ch {ch.number}.</span>
                            <span>{ch.title}</span>
                          </h4>
                        </div>

                        {/* Topics */}
                        <div>
                          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Key Topics & Concepts:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ch.topics.map((t, idx) => (
                              <span key={idx} className="bg-white text-stone-700 text-[11px] px-2 py-1 rounded border border-stone-200 font-medium">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {ch.keyFormulasOrConcepts && ch.keyFormulasOrConcepts.length > 0 && (
                          <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200 text-xs font-mono text-emerald-950">
                            <span className="font-bold text-emerald-900 font-sans mr-2">Key Formula / Core Fact:</span>
                            {ch.keyFormulasOrConcepts.join(" • ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Official Question Typology Matrix */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-700" />
              <span>CBSE Question Typology Matrix</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-stone-900">
                  <span>Demonstrating Knowledge & Understanding</span>
                  <span className="text-emerald-700 font-extrabold">~46%</span>
                </div>
                <p className="text-[11px] text-stone-500">Exhibit memory of learned material by recalling facts, terms, basic concepts and answers.</p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-stone-900">
                  <span>Application of Knowledge / Concepts</span>
                  <span className="text-amber-800 font-extrabold">~22%</span>
                </div>
                <p className="text-[11px] text-stone-500">Solve problems to new situations by applying acquired knowledge, facts, techniques and rules.</p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-stone-900">
                  <span>Formulating, Analyzing, Evaluating & Creating</span>
                  <span className="text-stone-700 font-extrabold">~32%</span>
                </div>
                <p className="text-[11px] text-stone-500">Examine and break information into parts, identify motives, case studies, and generate solutions.</p>
              </div>
            </div>

            {/* Section Breakdown Table */}
            <div className="border-t border-stone-200 pt-4 space-y-3">
              <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">Board Exam Section Pattern</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 bg-stone-100 rounded font-medium">
                  <span>Section A (MCQ & AR)</span>
                  <span className="font-bold text-stone-900">20 Qs × 1M = 20 Marks</span>
                </div>
                <div className="flex justify-between p-2 bg-stone-100 rounded font-medium">
                  <span>Section B (VSA 2-Mark)</span>
                  <span className="font-bold text-stone-900">6 Qs × 2M = 12 Marks</span>
                </div>
                <div className="flex justify-between p-2 bg-stone-100 rounded font-medium">
                  <span>Section C (SA 3-Mark)</span>
                  <span className="font-bold text-stone-900">7 Qs × 3M = 21 Marks</span>
                </div>
                <div className="flex justify-between p-2 bg-stone-100 rounded font-medium">
                  <span>Section D (LA 5-Mark)</span>
                  <span className="font-bold text-stone-900">3 Qs × 5M = 15 Marks</span>
                </div>
                <div className="flex justify-between p-2 bg-stone-100 rounded font-medium">
                  <span>Section E (Case Study 4-Mark)</span>
                  <span className="font-bold text-stone-900">3 Qs × 4M = 12 Marks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
