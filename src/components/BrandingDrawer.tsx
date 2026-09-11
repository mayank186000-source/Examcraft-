import React from 'react';
import { CustomBranding } from '../types';
import { X, Building2, ShieldAlert, Award, FileSpreadsheet, Check } from 'lucide-react';

interface BrandingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  branding: CustomBranding;
  setBranding: (b: CustomBranding) => void;
}

export const BrandingDrawer: React.FC<BrandingDrawerProps> = ({
  isOpen,
  onClose,
  branding,
  setBranding
}) => {
  if (!isOpen) return null;

  const presets = [
    { school: "ExamCraft CBSE Test Generator", tagline: "Smart, Efficient, Reliable Paper Generation", watermark: "EXAMCRAFT CBSE PAPER" },
    { school: "Delhi Public School, R.K. Puram", tagline: "Affiliated to CBSE, New Delhi", watermark: "DPS EXAM PAPER" },
    { school: "Kendriya Vidyalaya Sangathan", tagline: "Ministry of Education, Govt of India", watermark: "KVS MODEL PAPER" },
    { school: "ExamCraft CBSE Coaching Academy", tagline: "Class 10th Board Preparation Series", watermark: "EXAMCRAFT SAMPLE" },
    { school: "St. Xavier's Senior Secondary School", tagline: "Affiliated to CBSE Code: 11029", watermark: "PRE-BOARD 2026" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-800/40 border border-emerald-700/50 flex items-center justify-center text-emerald-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">School & Paper Header Branding</h3>
              <p className="text-xs text-stone-400">Personalize generated board papers with school header and watermark</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Quick Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setBranding({
                    ...branding,
                    schoolName: p.school,
                    tagline: p.tagline,
                    watermark: p.watermark
                  })}
                  className="text-left p-2.5 rounded-lg border border-stone-200 hover:border-emerald-700 hover:bg-emerald-50/50 transition-all text-xs"
                >
                  <p className="font-semibold text-stone-800 truncate">{p.school}</p>
                  <p className="text-[10px] text-stone-500 truncate">{p.watermark}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-stone-200 pt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                School / Institute Name
              </label>
              <input
                type="text"
                value={branding.schoolName}
                onChange={(e) => setBranding({ ...branding, schoolName: e.target.value })}
                placeholder="e.g. DPS Senior Secondary School, New Delhi"
                className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tagline / Affiliation Info
              </label>
              <input
                type="text"
                value={branding.tagline}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                placeholder="e.g. Affiliated to CBSE | School Code: 20194"
                className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                <span>School Logo Image URL</span>
                <span className="text-[10px] text-stone-400">Leaves default CBSE emblem if empty</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={branding.logoUrl || ''}
                  onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                  placeholder="/logo.png or https://example.com/logo.png"
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 outline-none font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setBranding({ ...branding, logoUrl: '/logo.png' })}
                  className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-3 py-2 rounded-lg border border-stone-300 shrink-0"
                >
                  Reset Logo
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                <span>Background Watermark Text</span>
                <span className="text-[10px] text-stone-400">Appears diagonally across printable pages</span>
              </label>
              <input
                type="text"
                value={branding.watermark}
                onChange={(e) => setBranding({ ...branding, watermark: e.target.value })}
                placeholder="e.g. EXAMCRAFT MODEL PAPER"
                className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-none uppercase font-mono tracking-wider"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Teacher / Examiner Name
                </label>
                <input
                  type="text"
                  value={branding.teacherName}
                  onChange={(e) => setBranding({ ...branding, teacherName: e.target.value })}
                  placeholder="e.g. Dr. R. Sharma"
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Paper Code Prefix
                </label>
                <input
                  type="text"
                  value={branding.examCodePrefix}
                  onChange={(e) => setBranding({ ...branding, examCodePrefix: e.target.value })}
                  placeholder="e.g. EXAMCRAFT-10"
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Paper Preview Card */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
            <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">Live Paper Header Preview</p>
            <div className="bg-white p-4 rounded-lg border border-stone-300 text-center font-serif shadow-sm">
              <h4 className="font-bold text-sm text-stone-900 uppercase tracking-wide">{branding.schoolName || "YOUR SCHOOL NAME HERE"}</h4>
              <p className="text-[10px] text-stone-600 italic mt-0.5">{branding.tagline || "Affiliated to CBSE, New Delhi"}</p>
              <div className="border-b border-stone-900 my-2"></div>
              <div className="flex items-center justify-between text-[10px] font-sans font-bold text-stone-800">
                <span>CLASS X/XII EXAMINATION 2025-2026</span>
                <span>SUBJECT CODE: 086</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-100 px-6 py-4 border-t border-stone-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-900/15 flex items-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Apply Header Branding</span>
          </button>
        </div>
      </div>
    </div>
  );
};
