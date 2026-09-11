import React, { useState, useEffect, useRef } from 'react';
import { Subject, PaperConfig, CustomBranding, TestPreset, Question } from '../types';
import { CBSE_SUBJECTS, CBSE_CLASS_3_SUBJECTS, CBSE_CLASS_4_SUBJECTS, CBSE_CLASS_5_SUBJECTS, CBSE_CLASS_6_SUBJECTS, CBSE_CLASS_7_SUBJECTS, CBSE_CLASS_8_SUBJECTS, CBSE_CLASS_9_SUBJECTS, CBSE_CLASS_10_SUBJECTS, CBSE_CLASS_11_SUBJECTS, CBSE_CLASS_12_SUBJECTS } from '../data/cbseData';
import { RegionCropper } from './RegionCropper';
import {
  Sparkles,
  CheckCircle2,
  Sliders,
  Layers,
  GraduationCap,
  Clock,
  Award,
  BookOpen,
  FileCheck,
  Zap,
  HelpCircle,
  FileCode,
  ShieldCheck,
  Building2,
  Hash,
  FileText,
  Database,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Camera,
  Upload,
  Image as ImageIcon,
  X,
  RefreshCw,
  Plus,
  Trash2,
  Scan,
  Check,
  AlertCircle,
  Crop,
  Scissors,
  ZoomIn,
  RotateCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getVaultStats, parseDocumentAndExtractQuestions, saveCustomQuestionsToServerVault } from '../utils/questionVault';

// Helper to calculate cropped image canvas
async function getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (err) => reject(err));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageSrc;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg', 0.95);
}

interface GeneratorTabProps {
  onGeneratePaper: (config: PaperConfig) => Promise<void>;
  isGenerating: boolean;
  branding: CustomBranding;
  onOpenBranding: () => void;
  onOpenPaperCodeModal: () => void;
  onOpenQuestionVault: () => void;
}

export const GeneratorTab: React.FC<GeneratorTabProps> = ({
  onGeneratePaper,
  isGenerating,
  branding,
  onOpenBranding,
  onOpenPaperCodeModal,
  onOpenQuestionVault
}) => {
  const { isAdmin } = useAuth();
  const [selectedClass, setSelectedClass] = useState<'12' | '11' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3'>('10');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('science-086');
  const [selectedStream, setSelectedStream] = useState<'All' | 'Science' | 'Commerce' | 'Arts' | 'Common'>('All');
  const [preset, setPreset] = useState<TestPreset>('board80');
  const [customPaperTitle, setCustomPaperTitle] = useState<string>('');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [generationMode, setGenerationMode] = useState<'smart_auto' | 'vault_remix' | 'pure_ai'>('smart_auto');
  const [competencyRatio, setCompetencyRatio] = useState<number>(50);
  const [includeGeneralInstructions, setIncludeGeneralInstructions] = useState<boolean>(true);
  const [includeSolutions, setIncludeSolutions] = useState<boolean>(true);

  // Vault Stats for live count
  const vaultStats = getVaultStats();

  // OCR Scanner Modal State
  const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);
  const [ocrSourceMode, setOcrSourceMode] = useState<'upload' | 'camera'>('upload');
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null);
  const [rawUncroppedImage, setRawUncroppedImage] = useState<string | null>(null);
  const [isCropMode, setIsCropMode] = useState<boolean>(false);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [ocrFileName, setOcrFileName] = useState<string>('');
  const [ocrSelectedChapterId, setOcrSelectedChapterId] = useState<string>('');
  const [ocrSelectedChapterName, setOcrSelectedChapterName] = useState<string>('');
  const [ocrTopic, setOcrTopic] = useState<string>('');
  const [isOcrScanning, setIsOcrScanning] = useState<boolean>(false);
  const [ocrExtractedQuestions, setOcrExtractedQuestions] = useState<Question[]>([]);
  const [isSavingOcrQuestions, setIsSavingOcrQuestions] = useState<boolean>(false);
  const [ocrStatus, setOcrStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleCropComplete = (_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const applyImageCrop = async () => {
    const sourceImage = rawUncroppedImage || ocrImagePreview;
    if (sourceImage && croppedAreaPixels) {
      try {
        const croppedImg = await getCroppedImg(sourceImage, croppedAreaPixels);
        setOcrImagePreview(croppedImg);
        setIsCropMode(false);
        setOcrStatus({ type: 'success', message: 'Question image cropped & frame updated successfully!' });
      } catch (err: any) {
        setOcrStatus({ type: 'error', message: 'Failed to crop image: ' + (err.message || 'Error processing canvas') });
      }
    }
  };

  // Camera helpers
  const startCamera = async () => {
    try {
      setOcrStatus(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setOcrStatus({
        type: 'error',
        message: 'Could not access camera: ' + (err.message || 'Permission denied or no camera device found.')
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const captureFromCamera = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setOcrImagePreview(dataUrl);
        setRawUncroppedImage(dataUrl);
        setOcrFileName(`camera-scan-${Date.now()}.jpg`);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    if (ocrSourceMode === 'camera' && isOcrModalOpen && !ocrImagePreview) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [ocrSourceMode, isOcrModalOpen, ocrImagePreview]);

  const handleScanOcrImage = async () => {
    if (!ocrImagePreview) {
      setOcrStatus({ type: 'error', message: 'Please upload or capture an image of paper questions first.' });
      return;
    }

    setIsOcrScanning(true);
    setOcrStatus({ type: 'info', message: 'Gemini Multimodal AI is extracting text, questions, subject, chapter, and marking scheme...' });

    const cleanBase64 = ocrImagePreview.includes(',') ? ocrImagePreview.split(',')[1] : ocrImagePreview;

    const res = await parseDocumentAndExtractQuestions({
      fileBase64: cleanBase64,
      fileName: ocrFileName || 'scanned-paper-questions.jpg',
      classLevel: selectedClass,
      subjectId: currentSubject.id,
      subjectName: currentSubject.name,
      chapterId: ocrSelectedChapterId || (currentSubject.chapters[0]?.id || 'ch-gen'),
      chapterName: ocrSelectedChapterName || (currentSubject.chapters[0]?.title || 'General Chapter'),
      topic: ocrTopic || 'Scanned Paper Questions'
    });

    setIsOcrScanning(false);

    if (res.success && res.questions.length > 0) {
      setOcrExtractedQuestions(res.questions);
      setOcrStatus({
        type: 'success',
        message: `Successfully extracted ${res.totalExtracted} question(s) with subject, chapter, and marking scheme!`
      });
    } else {
      setOcrStatus({
        type: 'error',
        message: res.error || 'Could not extract questions from the image. Please try a clearer photo or higher resolution.'
      });
    }
  };

  const handleSaveOcrQuestionsToVault = async () => {
    if (ocrExtractedQuestions.length === 0) return;
    setIsSavingOcrQuestions(true);
    setOcrStatus({ type: 'info', message: 'Saving questions into QuestionVault...' });

    const res = await saveCustomQuestionsToServerVault(ocrExtractedQuestions);
    setIsSavingOcrQuestions(false);

    if (res.success) {
      setOcrStatus({
        type: 'success',
        message: `Saved ${res.count} question(s) directly into QuestionVault! You can now generate test papers with them.`
      });
      setOcrExtractedQuestions([]);
      setOcrImagePreview(null);
    } else {
      setOcrStatus({
        type: 'error',
        message: res.error || 'Failed to save questions to QuestionVault.'
      });
    }
  };

  // Difficulty distribution
  const [difficultySplit, setDifficultySplit] = useState({
    easy: 30,
    medium: 50,
    hard: 20
  });

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

  const filteredSubjects = (selectedClass === '11' || selectedClass === '12') && selectedStream !== 'All'
    ? availableSubjects.filter(sub => sub.stream === selectedStream)
    : availableSubjects;

  const currentSubject = availableSubjects.find(s => s.id === selectedSubjectId) || availableSubjects[0];

  // Presets definition
  const [customMarksInput, setCustomMarksInput] = useState<number>(50);
  const [customDurationInput, setCustomDurationInput] = useState<number>(120);

  const targetBoardMarks = currentSubject.standardMarks || 80;

  const presetDetails: Record<TestPreset, { title: string; marks: number; time: number; desc: string }> = {
    board80: { title: `CBSE Board Exam Pattern (${targetBoardMarks}M)`, marks: targetBoardMarks, time: 180, desc: `Full ${targetBoardMarks} Marks board paper pattern with Sections A, B, C, D and E` },
    periodic40: { title: 'Periodic Assessment Test', marks: 40, time: 90, desc: '40 Marks mid-term / periodic paper for chapter-wise assessment' },
    unit20: { title: 'Weekly Unit Test', marks: 20, time: 45, desc: '20 Marks quick evaluation test for 1-2 chapters' },
    custom: { title: 'Custom Test Format', marks: customMarksInput, time: customDurationInput, desc: `Custom target of ${customMarksInput} Marks (${customDurationInput} mins)` }
  };

  const activePresetInfo = preset === 'custom' 
    ? { title: 'Custom Target Test', marks: customMarksInput, time: customDurationInput, desc: `Custom target marks of ${customMarksInput} Marks` }
    : presetDetails[preset];

  const handleSelectAllChapters = () => {
    if (selectedChapters.length === currentSubject.chapters.length) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters(currentSubject.chapters.map(c => c.id));
    }
  };

  const handleChapterToggle = (id: string) => {
    if (selectedChapters.includes(id)) {
      setSelectedChapters(selectedChapters.filter(chId => chId !== id));
    } else {
      setSelectedChapters([...selectedChapters, id]);
    }
  };

  // 1. Live Paper Sample Models for Top Hero Preview Card (reverted to clean paper layout)
  const samplePaperSlides = [
    {
      filename: 'cbse_class10_science_2026.pdf',
      school: 'XYZ PUBLIC SCHOOL, NEW DELHI',
      title: 'MID-TERM BOARD EXAMINATION 2025-2026',
      details: 'CLASS: X (SCIENCE - 086) | MARKS: 80 | TIME: 3 HRS',
      section: 'SECTION A: OBJECTIVE & COMPETENCY (20 MARKS)',
      q1: 'Q1. Which of the following equations represents a redox reaction?',
      q1opts: '(a) CuO + H₂ → Cu + H₂O   (b) CaCO₃ → CaO + CO₂',
      q2: 'Q2. [Case Study] A student sets up an electric circuit with a 12V battery and resistors...',
      code: 'EXAMIDEA-10-086',
      tag: 'Class 10 Science'
    },
    {
      filename: 'cbse_class12_physics_2026.pdf',
      school: 'ABC SENIOR SECONDARY SCHOOL',
      title: 'ANNUAL BOARD PRE-BOARD EXAMINATION 2026',
      details: 'CLASS: XII (PHYSICS - 042) | MARKS: 70 | TIME: 3 HRS',
      section: 'SECTION B: DERIVATIONS & NUMERICALS (25 MARKS)',
      q1: 'Q1. Derive an expression for the energy density of a parallel plate capacitor.',
      q1opts: '(a) ½ ε₀E²   (b) ε₀E²   (c) ½ ε₀E   (d) 2ε₀E²',
      q2: 'Q2. [Assertion-Reason] Assertion (A): Rays of light passing through prism suffer deviation...',
      code: 'EXAMIDEA-12-042',
      tag: 'Class 12 Physics'
    },
    {
      filename: 'cbse_class10_maths_std.pdf',
      school: 'XYZ INTERNATIONAL SCHOOL',
      title: 'CBSE STANDARD MATHS ASSESSMENT 2025-2026',
      details: 'CLASS: X (MATHS STD - 041) | MARKS: 80 | TIME: 3 HRS',
      section: 'SECTION C: SHORT ANSWER & COMPETENCY (18 MARKS)',
      q1: 'Q1. Find the roots of quadratic equation 2x² - 5x + 3 = 0 using quadratic formula.',
      q1opts: '(a) x = 1, 3/2   (b) x = -1, 3   (c) x = 2, 5',
      q2: 'Q2. [Case Study] A tower stands vertically on ground. From a point 15m from foot...',
      code: 'EXAMIDEA-10-041',
      tag: 'Class 10 Maths'
    },
    {
      filename: 'cbse_class12_chemistry_2026.pdf',
      school: 'ABC MODEL ACADEMY, NEW DELHI',
      title: 'PRE-BOARD MOCK MODEL TEST PAPER',
      details: 'CLASS: XII (CHEMISTRY - 043) | MARKS: 70 | TIME: 3 HRS',
      section: 'SECTION A: MULTIPLE CHOICE QUESTIONS (16 MARKS)',
      q1: 'Q1. Which transition metal exhibits highest oxidation state in 3d series?',
      q1opts: '(a) Manganese (+7)   (b) Chromium (+6)   (c) Iron (+3)',
      q2: 'Q2. An organic compound A (C₇H₆O) reacts with NaOH to give benzyl alcohol and benzoate...',
      code: 'EXAMIDEA-12-043',
      tag: 'Class 12 Chemistry'
    }
  ];

  // 2. Trust Feature Points Array for the 3.5s rotating feature preview
  const trustFeatureSlides = [
    {
      icon: Zap,
      badge: 'SPEED & ACCURACY',
      title: '1. Sub-Second AI Blueprint Assembly',
      desc: 'Generates balanced question papers with zero repeating questions. Automatically computes section marks, difficulty ratios, and chapter weightages according to official CBSE sample paper blueprints.',
      tags: ['Zero Repeat Engine', 'Step-wise Answer Key', 'Auto-Section Marks'],
      color: 'from-blue-600 via-indigo-600 to-blue-800'
    },
    {
      icon: BookOpen,
      badge: '100% BOARD ALIGNED',
      title: '2. 2025-2026 Official CBSE Board Blueprint',
      desc: 'Strictly aligned with latest CBSE curriculum featuring 50% Competency-based questions, Case Studies, Source-based passage units, and Assertion-Reasoning.',
      tags: ['50% Competency', 'Case Studies', 'Assertion-Reasoning'],
      color: 'from-indigo-600 via-purple-600 to-indigo-800'
    },
    {
      icon: FileCheck,
      badge: 'EXPORT & PRINT',
      title: '3. Printable A4 PDF & Custom Watermarks',
      desc: 'Customize school headers, teacher names, watermark text, exam duration, and print crisp A4 test papers with matching answer keys instantly.',
      tags: ['Custom Watermark', 'School Logo Header', 'Printable A4 PDF'],
      color: 'from-emerald-600 via-teal-600 to-emerald-800'
    },
    {
      icon: GraduationCap,
      badge: 'MULTI-LINGUAL',
      title: '4. Bilingual Dual-Language (English & Hindi)',
      desc: 'Generate test papers in English, Hindi, or dual-language side-by-side mode for maximum student comprehension and regional board standards.',
      tags: ['English & Hindi', 'Dual Column Support', 'Regional Support'],
      color: 'from-blue-700 via-cyan-600 to-blue-900'
    },
    {
      icon: Hash,
      badge: 'REUSABLE CODES',
      title: '5. Unique Paper Code Engine',
      desc: 'Every generated paper receives a unique 10-character paper code (e.g. EXAMIDEA-10-086) for instant re-loading, editing, and teacher sharing.',
      tags: ['Unique Paper ID', 'Instant Reloading', 'Easy Teacher Share'],
      color: 'from-amber-600 via-orange-600 to-amber-800'
    }
  ];

  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [trustSlide, setTrustSlide] = useState<number>(0);

  // Auto-cycle Hero Paper Preview (3.5s)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % samplePaperSlides.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [samplePaperSlides.length]);

  // Auto-cycle Trust Feature Preview (3.5s)
  useEffect(() => {
    const interval = setInterval(() => {
      setTrustSlide((prev) => (prev + 1) % trustFeatureSlides.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [trustFeatureSlides.length]);

  const handleSubmit = (modeOverride?: 'smart_auto' | 'vault_remix' | 'pure_ai') => {
    const activeMode = modeOverride || generationMode;
    const isAIMode = activeMode !== 'vault_remix';

    const classLabel = selectedClass === '12' ? 'Class XII' : selectedClass === '11' ? 'Class XI' : selectedClass === '9' ? 'Class IX' : 'Class X';

    const defaultTitle = `${classLabel} ${activePresetInfo.title} 2025-2026`;
    const paperTitleToUse = customPaperTitle.trim() || defaultTitle;

    const config: PaperConfig = {
      subjectId: currentSubject.id,
      preset,
      title: paperTitleToUse,
      schoolName: branding.schoolName || 'DPS Senior Secondary School, New Delhi',
      examCode: `${branding.examCodePrefix || `EXAMIDEA-${selectedClass}`}-${currentSubject.code}`,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      durationMinutes: activePresetInfo.time,
      totalMarks: activePresetInfo.marks,
      selectedChapterIds: selectedChapters.length > 0 ? selectedChapters : currentSubject.chapters.map(c => c.id),
      competencyRatio,
      difficultySplit,
      watermarkText: branding.watermark || 'EXAMIDEA MODEL PAPER',
      includeGeneralInstructions,
      includeSolutions,
      useAI: isAIMode
    };

    onGeneratePaper(config);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      {/* 1. HERO SECTION (Modern EdTech SaaS Style) */}
      <div className="relative rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-2xl border border-blue-800/40 overflow-hidden">
        {/* Ambient background glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Hero Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold tracking-wide">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Official 2025-2026 CBSE Board Blueprint Engine</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              CBSE Test Papers in <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">10 Seconds</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
              Trusted by 50,000+ educators and top-scoring students. Generate 100% board-compliant question papers for Classes 9th, 10th, 11th & 12th with bilingual support, case studies, and step-wise marking schemes.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href="#generator-form"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base px-8 py-4 rounded-full shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all flex items-center justify-center gap-3 cursor-pointer group btn-3d"
              >
                <Zap className="w-5 h-5 text-emerald-300 fill-emerald-300 group-hover:scale-110 transition-transform" />
                <span>Generate Free Test Paper</span>
              </a>

              <button
                onClick={onOpenPaperCodeModal}
                className="w-full sm:w-auto bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-bold text-sm px-6 py-4 rounded-full border border-slate-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Hash className="w-4 h-4 text-amber-400" />
                <span>Load Paper Code</span>
              </button>
            </div>

            {/* Stats row */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>100% CBSE Aligned</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Bilingual (English & Hindi)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Step-Wise Solutions</span>
              </div>
            </div>
          </div>

          {/* Right Interactive Mockup Visual Element (Auto-changing 4 Sample Slides) */}
          <div className="lg:col-span-5">
            <div className="edtech-card bg-slate-900/90 border-slate-700/80 p-5 rounded-2xl shadow-2xl relative space-y-4">
              {/* Card Top Bar with Slide Counter */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-mono text-slate-300 ml-2 truncate max-w-[170px]">
                    {samplePaperSlides[activeSlide].filename}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    SAMPLE {activeSlide + 1} / {samplePaperSlides.length}
                  </span>
                </div>
              </div>

              {/* Sample Paper Mockup Content with Smooth Fade-In Transition */}
              <div 
                key={activeSlide}
                className="bg-white text-slate-900 p-4 rounded-xl space-y-3 font-serif text-[11px] leading-relaxed shadow-inner transition-all duration-300 animate-in fade-in zoom-in-95 min-h-[220px]"
              >
                <div className="text-center border-b border-slate-900/20 pb-2 space-y-0.5">
                  <p className="font-extrabold uppercase text-xs tracking-wider text-slate-950">
                    {samplePaperSlides[activeSlide].school}
                  </p>
                  <p className="font-bold text-[10px] text-slate-700">
                    {samplePaperSlides[activeSlide].title}
                  </p>
                  <div className="flex justify-between font-sans text-[10px] font-extrabold text-slate-700 pt-1">
                    <span>{samplePaperSlides[activeSlide].details.split('|')[0]}</span>
                    <span>{samplePaperSlides[activeSlide].details.split('|').slice(1).join('|')}</span>
                  </div>
                </div>

                <div className="space-y-2 font-sans">
                  <div className="flex items-center justify-between font-bold text-[10px] text-blue-900 bg-blue-50 p-1.5 rounded border border-blue-100">
                    <span>{samplePaperSlides[activeSlide].section}</span>
                    <span className="text-emerald-700 font-extrabold">CBSE MODEL</span>
                  </div>
                  <div className="space-y-1 text-[10px] text-slate-900">
                    <p className="font-semibold">{samplePaperSlides[activeSlide].q1}</p>
                    <p className="text-slate-600 pl-2 font-medium">{samplePaperSlides[activeSlide].q1opts}</p>
                  </div>
                  <div className="space-y-1 text-[10px] text-slate-900">
                    <p className="font-semibold">{samplePaperSlides[activeSlide].q2}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-600 font-sans">
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Answer Key & Marking Scheme
                  </span>
                  <span className="font-mono text-slate-500 font-bold">Code: {samplePaperSlides[activeSlide].code}</span>
                </div>
              </div>

              {/* Slide Navigation Pagination Dots */}
              <div className="flex items-center justify-center pt-1">
                <div className="flex items-center gap-1.5">
                  {samplePaperSlides.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        activeSlide === idx
                          ? 'w-6 bg-gradient-to-r from-emerald-400 to-blue-400'
                          : 'w-2 bg-slate-700 hover:bg-slate-600'
                      }`}
                      title={s.tag}
                    />
                  ))}
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 text-white font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg border border-emerald-400/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{samplePaperSlides[activeSlide].tag}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ROTATING TRUST FEATURE PREVIEW ("Why Teachers & Students Trust ExamCraft") */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Why Teachers & Students Trust ExamCraft</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Built specifically for 100% compliance with CBSE guidelines</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Point {trustSlide + 1} of {trustFeatureSlides.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTrustSlide((prev) => (prev === 0 ? trustFeatureSlides.length - 1 : prev - 1))}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                aria-label="Previous Feature"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTrustSlide((prev) => (prev + 1) % trustFeatureSlides.length)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                aria-label="Next Feature"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Auto-Rotating Trust Feature Card (3.5s interval) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-blue-900/60 min-h-[190px]">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {(() => {
            const currentFeature = trustFeatureSlides[trustSlide];
            const FeatureIcon = currentFeature.icon;
            return (
              <div 
                key={trustSlide}
                className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300 animate-in fade-in zoom-in-95"
              >
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-amber-300 text-[11px] font-black tracking-wider uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{currentFeature.badge}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-200 shrink-0">
                      <FeatureIcon className="w-6 h-6 text-amber-300" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">{currentFeature.title}</h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                    {currentFeature.desc}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentFeature.tags.map((tag, tIdx) => (
                      <span 
                        key={tIdx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Pagination Indicators */}
                <div className="flex md:flex-col items-center gap-2 shrink-0 self-center md:self-auto">
                  {trustFeatureSlides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTrustSlide(idx)}
                      className={`transition-all cursor-pointer rounded-full ${
                        trustSlide === idx 
                          ? 'w-8 md:w-3 h-3 md:h-8 bg-gradient-to-r md:bg-gradient-to-b from-amber-400 to-emerald-400' 
                          : 'w-3 h-3 bg-slate-700 hover:bg-slate-600'
                      }`}
                      title={`Go to point ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* OCR SCANNER BANNER CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-purple-500/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5 text-purple-300" />
              <span>Multimodal AI Paper OCR Scanner</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Scan & Convert Printed / Handwritten Questions
            </h3>
            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed font-normal">
              Snap a live camera photo or upload an image of paper questions. Gemini AI automatically parses text, options, subject, chapter, and marking scheme directly into QuestionVault.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsOcrModalOpen(true);
                setOcrSourceMode('camera');
                setOcrImagePreview(null);
                setOcrExtractedQuestions([]);
                setOcrStatus(null);
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer btn-3d"
            >
              <Camera className="w-4 h-4" />
              <span>Live Camera Snap</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOcrModalOpen(true);
                setOcrSourceMode('upload');
                setOcrImagePreview(null);
                setOcrExtractedQuestions([]);
                setOcrStatus(null);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-purple-200 border border-purple-500/40 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-purple-300" />
              <span>Upload Question Photo</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CLASS SELECTION CARDS */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Choose Target Class</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Select class to load official CBSE syllabus and unit blueprints</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
          {[
            {
              id: '12',
              title: 'Class 12th',
              badge: 'Senior Secondary',
              subjects: 'Physics, Chem, Math, Bio, CS + 5 more',
              chapters: '100+ Board Chapters',
              marks: '70 / 80 Marks Pattern',
              defaultSub: 'class12-physics-042'
            },
            {
              id: '11',
              title: 'Class 11th',
              badge: 'Higher Secondary',
              subjects: 'Physics, Chem, Math, Bio + 4 more',
              chapters: '95+ Unit Chapters',
              marks: '70 / 80 Marks Pattern',
              defaultSub: 'physics-042'
            },
            {
              id: '10',
              title: 'Class 10th',
              badge: 'Secondary Board',
              subjects: 'Science, Math, SST, Eng, Hindi',
              chapters: '65+ Board Chapters',
              marks: '80 Marks Board Pattern',
              defaultSub: 'science-086'
            },
            {
              id: '9',
              title: 'Class 9th',
              badge: 'Foundation Board',
              subjects: 'Science, Math, SST, Eng, Hindi',
              chapters: '60+ Foundation Chapters',
              marks: '80 Marks School Pattern',
              defaultSub: 'class9-science-086'
            },
            {
              id: '8',
              title: 'Class 8th',
              badge: 'Middle School',
              subjects: 'Science, Math, SST, Eng, Hindi',
              chapters: '50+ NCERT Chapters',
              marks: '80 Marks Pattern',
              defaultSub: 'class8-science'
            },
            {
              id: '7',
              title: 'Class 7th',
              badge: 'Middle School',
              subjects: 'Science, Math, SST, Eng, Hindi',
              chapters: '45+ NCERT Chapters',
              marks: '80 Marks Pattern',
              defaultSub: 'class7-science'
            },
            {
              id: '6',
              title: 'Class 6th',
              badge: 'Middle School',
              subjects: 'Science, Math, SST, Eng, Hindi',
              chapters: '40+ NCERT Chapters',
              marks: '80 Marks Pattern',
              defaultSub: 'class6-science'
            },
            {
              id: '5',
              title: 'Class 5th',
              badge: 'Primary School',
              subjects: 'EVS/Science, Math, Eng, Hindi',
              chapters: '30+ Primary Chapters',
              marks: '80 Marks Pattern',
              defaultSub: 'class5-science-evs'
            },
            {
              id: '4',
              title: 'Class 4th',
              badge: 'Primary School',
              subjects: 'EVS/Science, Math, Eng, Hindi',
              chapters: '25+ NCERT Chapters',
              marks: '80 Marks Pattern',
              defaultSub: 'class4-science-evs'
            },
            {
              id: '3',
              title: 'Class 3rd',
              badge: 'Primary School',
              subjects: 'EVS/Science, Math, Eng, Hindi',
              chapters: '20+ NCERT Chapters',
              marks: '80 Marks Pattern',
              defaultSub: 'class3-science-evs'
            }
          ].map((cItem) => {
            const isSelected = selectedClass === cItem.id;
            return (
              <button
                key={cItem.id}
                type="button"
                onClick={() => {
                  setSelectedClass(cItem.id as any);
                  setSelectedSubjectId(cItem.defaultSub);
                  setSelectedChapters([]);
                }}
                className={`edtech-card p-3 sm:p-5 text-left cursor-pointer transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-2 border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 shadow-lg shadow-blue-600/10'
                    : 'hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 text-blue-600 dark:text-blue-400">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 fill-blue-100 dark:fill-blue-950" />
                  </div>
                )}
                <span className={`text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}>
                  {cItem.badge}
                </span>

                <h3 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white mt-2 sm:mt-3">{cItem.title}</h3>
                <p className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5 sm:mt-1 line-clamp-2">{cItem.subjects}</p>

                <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 gap-1">
                  <span>{cItem.chapters}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{cItem.marks}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN GENERATOR FORM SECTION */}
      <div id="generator-form" className="pt-4 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Customize Test Paper</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure subject, test duration, chapters, and competency ratio</p>
          </div>
          <button
            onClick={onOpenBranding}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Edit School Header ({branding.schoolName?.substring(0, 15)}...)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form Column */}
          <div className="lg:col-span-8 space-y-8">

            {/* STEP 1: Select Subject */}
            <div className="edtech-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Select Subject ({selectedClass === '12' ? 'Class 12' : selectedClass === '11' ? 'Class 11' : selectedClass === '9' ? 'Class 9' : 'Class 10'})</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Choose subject from official curriculum</p>
                  </div>
                </div>
              </div>

              {/* Stream Filter Pills for Class 11 & Class 12 */}
              {(selectedClass === '11' || selectedClass === '12') && (
                <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  {[
                    { id: 'All', label: 'All Streams', count: availableSubjects.length },
                    { id: 'Science', label: 'Science 🔬', count: availableSubjects.filter(s => s.stream === 'Science').length },
                    { id: 'Commerce', label: 'Commerce 💼', count: availableSubjects.filter(s => s.stream === 'Commerce').length },
                    { id: 'Arts', label: 'Arts 🎨', count: availableSubjects.filter(s => s.stream === 'Arts').length },
                    { id: 'Common', label: 'Languages 📖', count: availableSubjects.filter(s => s.stream === 'Common').length },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStream(st.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        selectedStream === st.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{st.label}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        selectedStream === st.id ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}>
                        {st.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {filteredSubjects.map((sub) => {
                  const isSelected = sub.id === selectedSubjectId;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubjectId(sub.id);
                        setSelectedChapters([]);
                      }}
                      className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        isSelected
                          ? 'border-2 border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-slate-900 dark:text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 absolute top-2.5 right-2.5" />
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Code {sub.code}
                        </span>
                        {sub.stream && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            sub.stream === 'Science' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300' :
                            sub.stream === 'Commerce' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            sub.stream === 'Arts' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {sub.stream}
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-xs mt-1.5 sm:mt-2 truncate">{sub.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{sub.totalChapters} Ch • {sub.standardMarks} Marks</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Choose Test Pattern / Preset */}
            <div className="edtech-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Choose Test Pattern & Duration</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Select full board paper, periodic test, or unit test pattern</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {(['board80', 'periodic40', 'unit20', 'custom'] as TestPreset[]).map((key) => {
                  const pInfo = presetDetails[key];
                  const isSelected = preset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPreset(key)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-blue-700 dark:text-blue-300 text-sm">
                          {key === 'custom' ? `${customMarksInput}M` : `${pInfo.marks} Marks`}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          <Clock className="w-3 h-3" />
                          {key === 'custom' ? `${customDurationInput}m` : `${pInfo.time}m`}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs mt-2 text-slate-900 dark:text-white">{key === 'custom' ? 'Custom Marks' : pInfo.title}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{pInfo.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Custom Inputs */}
              {preset === 'custom' && (
                <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Target Marks:</label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={customMarksInput}
                      onChange={(e) => setCustomMarksInput(Math.max(5, parseInt(e.target.value) || 5))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Duration (Mins):</label>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={customDurationInput}
                      onChange={(e) => setCustomDurationInput(Math.max(10, parseInt(e.target.value) || 10))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Custom Exam Title / Paper Heading Input */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Paper / Exam Heading Title</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional (e.g., PERIODIC TEST - 1 2025-26, HALF YEARLY EXAMINATION)</span>
                </label>
                <input
                  type="text"
                  value={customPaperTitle}
                  onChange={(e) => setCustomPaperTitle(e.target.value)}
                  placeholder={`Default: ${selectedClass === '12' ? 'Class XII' : selectedClass === '11' ? 'Class XI' : selectedClass === '9' ? 'Class IX' : 'Class X'} ${activePresetInfo.title} 2025-2026`}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* STEP 3: Select Chapters */}
            <div className="edtech-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Syllabus & Chapters</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedChapters.length === 0
                        ? 'Full Syllabus selected'
                        : `${selectedChapters.length} of ${currentSubject.chapters.length} Chapters selected`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSelectAllChapters}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer"
                >
                  {selectedChapters.length === currentSubject.chapters.length ? 'Deselect All' : 'Select All Chapters'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {currentSubject.chapters.map((ch) => {
                  const isChecked = selectedChapters.length === 0 || selectedChapters.includes(ch.id);
                  return (
                    <div
                      key={ch.id}
                      onClick={() => handleChapterToggle(ch.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                        isChecked
                          ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-400 dark:border-blue-700 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 w-4 h-4 rounded text-blue-600 accent-blue-600 shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[10px] text-blue-700 dark:text-blue-300">Ch {ch.number}</span>
                          <span className="text-[10px] font-semibold text-slate-400">~{ch.unitWeightageMarks}M</span>
                        </div>
                        <p className="font-bold truncate mt-0.5">{ch.title}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 4: Competency & Blueprint */}
            <div className="edtech-card p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                  4
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Competency & Blueprint</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">CBSE mandates ~50% Application & Case Study questions</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>Competency / Case-Based Ratio:</span>
                  <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {competencyRatio}% Competency
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="5"
                  value={competencyRatio}
                  onChange={(e) => setCompetencyRatio(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={includeGeneralInstructions}
                    onChange={(e) => setIncludeGeneralInstructions(e.target.checked)}
                    className="w-4 h-4 text-blue-600 accent-blue-600"
                  />
                  <span>General Instructions</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={includeSolutions}
                    onChange={(e) => setIncludeSolutions(e.target.checked)}
                    className="w-4 h-4 text-blue-600 accent-blue-600"
                  />
                  <span>Marking Scheme & Answers</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Summary & CTA */}
          <div className="lg:col-span-4 space-y-6">
            <div className="edtech-card p-6 space-y-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-blue-900 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Blueprint Summary</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  100% CBSE
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Class:</span>
                  <span className="font-bold text-white">Class {selectedClass}th</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Subject:</span>
                  <span className="font-bold text-white">{currentSubject.name} ({currentSubject.code})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Target Marks:</span>
                  <span className="font-bold text-amber-300">{activePresetInfo.marks} Marks</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Duration:</span>
                  <span className="font-bold text-white">{activePresetInfo.time} Minutes</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Chapters:</span>
                  <span className="font-bold text-white">
                    {selectedChapters.length === 0 ? `All ${currentSubject.chapters.length}` : `${selectedChapters.length} Selected`}
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => handleSubmit('smart_auto')}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base py-4 px-6 rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all btn-3d cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating Paper...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 text-emerald-300 fill-emerald-300" />
                      <span>Generate Free Test Paper</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit('vault_remix')}
                  disabled={isGenerating}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-3 px-4 rounded-full border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Vault Remix (&lt; 1s)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. OCR MULTIMODAL QUESTION SCANNER MODAL */}
      {isOcrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>Paper Question OCR & Multimodal Scanner</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Gemini 2.5 Flash
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Snap or upload paper questions to extract text, subject, chapter, and marking scheme into QuestionVault.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsOcrModalOpen(false);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Target Classification Bar */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span>Target Class, Subject & Chapter Mapping</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Class Level</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="12">Class 12th</option>
                      <option value="11">Class 11th</option>
                      <option value="10">Class 10th</option>
                      <option value="9">Class 9th</option>
                      <option value="8">Class 8th</option>
                      <option value="7">Class 7th</option>
                      <option value="6">Class 6th</option>
                      <option value="5">Class 5th</option>
                      <option value="4">Class 4th</option>
                      <option value="3">Class 3rd</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Subject</label>
                    <select
                      value={currentSubject.id}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-purple-500"
                    >
                      {availableSubjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Chapter</label>
                    <select
                      value={ocrSelectedChapterId || (currentSubject.chapters[0]?.id || '')}
                      onChange={(e) => {
                        const chId = e.target.value;
                        const chObj = currentSubject.chapters.find((c) => c.id === chId);
                        setOcrSelectedChapterId(chId);
                        setOcrSelectedChapterName(chObj?.title || 'General Chapter');
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-purple-500"
                    >
                      {currentSubject.chapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Source Mode Tabs (Camera vs Upload) */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setOcrSourceMode('upload');
                    setOcrImagePreview(null);
                    stopCamera();
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    ocrSourceMode === 'upload'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Image File</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOcrSourceMode('camera');
                    setOcrImagePreview(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    ocrSourceMode === 'camera'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Live Camera Capture</span>
                </button>
              </div>

              {/* Status Alert Banner */}
              {ocrStatus && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
                    ocrStatus.type === 'error'
                      ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                      : ocrStatus.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                      : 'bg-blue-950/60 border-blue-800/80 text-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {ocrStatus.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    ) : ocrStatus.type === 'success' ? (
                      <Check className="w-4 h-4 shrink-0" />
                    ) : (
                      <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                    )}
                    <span>{ocrStatus.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOcrStatus(null)}
                    className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Input Area (Upload vs Camera Stream) */}
              {!ocrImagePreview ? (
                ocrSourceMode === 'upload' ? (
                  <div className="border-2 border-dashed border-slate-700 hover:border-purple-500/60 rounded-2xl p-8 text-center bg-slate-950/40 transition-colors">
                    <input
                      type="file"
                      id="ocr-file-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setOcrFileName(file.name);
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const dataUrl = evt.target?.result as string;
                            setOcrImagePreview(dataUrl);
                            setRawUncroppedImage(dataUrl);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="ocr-file-input"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <div className="p-4 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Click to upload or drag image here</p>
                        <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP photo of textbook or question paper</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[280px]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-h-[360px] object-cover rounded-2xl"
                    />
                    <div className="p-4 bg-slate-900/90 w-full flex items-center justify-between border-t border-slate-800">
                      <span className="text-xs text-slate-400 font-medium">Position paper questions clearly inside camera frame</span>
                      <button
                        type="button"
                        onClick={captureFromCamera}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer btn-3d"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Snap Photo</span>
                      </button>
                    </div>
                  </div>
                )
              ) : (
                /* Preview Captured/Uploaded Image OR Interactive Cropper */
                isCropMode ? (
                  <RegionCropper
                    imageSrc={rawUncroppedImage || ocrImagePreview!}
                    onCrop={(croppedDataUrl) => {
                      setOcrImagePreview(croppedDataUrl);
                      setIsCropMode(false);
                      setOcrStatus({ type: 'success', message: 'Question region cropped successfully!' });
                    }}
                    onCancel={() => setIsCropMode(false)}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-h-[320px] flex items-center justify-center p-2">
                      <img
                        src={ocrImagePreview}
                        alt="Scanned question preview"
                        className="max-h-[300px] w-auto object-contain rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setOcrImagePreview(null);
                          setRawUncroppedImage(null);
                          setOcrExtractedQuestions([]);
                          setIsCropMode(false);
                        }}
                        className="absolute top-4 right-4 bg-slate-900/80 hover:bg-rose-600 text-white p-2 rounded-full backdrop-blur-sm transition-colors cursor-pointer"
                        title="Remove Image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setOcrImagePreview(null);
                            setRawUncroppedImage(null);
                            setOcrExtractedQuestions([]);
                            setIsCropMode(false);
                            if (ocrSourceMode === 'camera') startCamera();
                          }}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer bg-slate-800/60 px-3 py-2 rounded-xl"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retake / Change Photo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!rawUncroppedImage) setRawUncroppedImage(ocrImagePreview);
                            setIsCropMode(true);
                            setZoom(1);
                            setCrop({ x: 0, y: 0 });
                          }}
                          className="text-xs font-bold text-purple-300 hover:text-purple-200 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <Crop className="w-3.5 h-3.5 text-purple-400" />
                          <span>Crop Question Area</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleScanOcrImage}
                        disabled={isOcrScanning}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 btn-3d"
                      >
                        {isOcrScanning ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                            <span>Extracting with Gemini AI...</span>
                          </>
                        ) : (
                          <>
                            <Scan className="w-4 h-4 text-emerald-300" />
                            <span>Extract Questions with AI OCR</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* Extracted Questions Preview & Edit Cards */}
              {ocrExtractedQuestions.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Extracted Questions ({ocrExtractedQuestions.length})</span>
                    </h4>

                    <button
                      type="button"
                      onClick={handleSaveOcrQuestionsToVault}
                      disabled={isSavingOcrQuestions}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 btn-3d"
                    >
                      {isSavingOcrQuestions ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving to Vault...</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-3.5 h-3.5" />
                          <span>Save All to QuestionVault</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {ocrExtractedQuestions.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-purple-400">Q{idx + 1}.</span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold uppercase">
                              {q.type} • {q.marks} Mark(s)
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {q.chapterName || 'General Chapter'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setOcrExtractedQuestions((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                            title="Remove Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 font-semibold mb-1">Question Statement</label>
                          <textarea
                            value={q.questionText}
                            onChange={(e) => {
                              const newText = e.target.value;
                              setOcrExtractedQuestions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, questionText: newText } : item))
                              );
                            }}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-1 focus:ring-purple-500"
                            rows={2}
                          />
                        </div>

                        {q.options && q.options.length > 0 && (
                          <div>
                            <label className="block text-[10px] text-slate-400 font-semibold mb-1">Options</label>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((opt, oIdx) => (
                                <input
                                  key={oIdx}
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setOcrExtractedQuestions((prev) =>
                                      prev.map((item, i) => {
                                        if (i === idx && item.options) {
                                          const newOpts = [...item.options];
                                          newOpts[oIdx] = val;
                                          return { ...item, options: newOpts };
                                        }
                                        return item;
                                      })
                                    );
                                  }}
                                  className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg p-2 text-xs font-mono"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {(q.correctAnswer || q.markingScheme) && (
                          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                            {q.correctAnswer && (
                              <p className="text-emerald-400 font-mono text-[11px] font-bold">
                                Answer: {q.correctAnswer}
                              </p>
                            )}
                            {q.markingScheme && (
                              <p className="text-slate-400 text-[10px]">
                                Marking Scheme: {q.markingScheme}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                {ocrExtractedQuestions.length > 0
                  ? `${ocrExtractedQuestions.length} question(s) ready to be saved`
                  : 'Capture or upload paper question photo to start'}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsOcrModalOpen(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Close
                </button>

                {ocrExtractedQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveOcrQuestionsToVault}
                    disabled={isSavingOcrQuestions}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer btn-3d"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Save to QuestionVault</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
