import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { GeneratorTab } from './components/GeneratorTab';
import { SyllabusBlueprintTab } from './components/SyllabusBlueprintTab';
import { PYQRepositoryTab } from './components/PYQRepositoryTab';
import { AIEvaluatorTab } from './components/AIEvaluatorTab';
import { QuestionBankTab } from './components/QuestionBankTab';
import { InteractiveQuizTab } from './components/InteractiveQuizTab';
import { GrammarQuizTab } from './components/GrammarQuizTab';
import { RevisionSheetsTab } from './components/RevisionSheetsTab';
import { PaperPreviewModal } from './components/PaperPreviewModal';
import { BrandingDrawer } from './components/BrandingDrawer';
import { PaperCodeModal } from './components/PaperCodeModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { QuestionVaultModal } from './components/QuestionVaultModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { SharePaperModal } from './components/SharePaperModal';
import { FloatingPen } from './components/FloatingPen';
import { ThreeBackground } from './components/ThreeBackground';
import { useAmbientTimeLighting } from './hooks/useAmbientTimeLighting';
import { useAuth } from './context/AuthContext';

import { PaperConfig, GeneratedPaper, CustomBranding, Question } from './types';
import { generateLocalPaper } from './utils/paperGenerator';
import {
  harvestQuestionsFromPaper,
  generateCombinatorialPaperFromVault,
  sanitizeAndDeduplicatePaper,
  ensureQuestionAssetId
} from './utils/questionVault';
import { savePaperToRegistry, initSamplePapersIfEmpty, generatePaperCode, getPaperByCode } from './utils/paperRegistry';
import { CBSE_SUBJECTS } from './data/cbseData';

// Helper to determine class level from a subjectId
const getClassFromSubjectId = (subId?: string): string => {
  if (!subId) return 'Unknown Class';
  const s = subId.toLowerCase();
  if (s.includes('-12') || s.includes('physics') || s.includes('chemistry') || s.includes('biology') || s.includes('accountancy') || s.includes('business') || s.includes('economics') || s.includes('computer-science')) {
    return 'Class 12';
  }
  if (s.includes('-11')) {
    return 'Class 11';
  }
  if (s.includes('-9')) {
    return 'Class 9';
  }
  return 'Class 10';
};

// Granular pipeline logger to detect subject and class cross-contamination during paper generation
const logPaperQuestionsPipeline = (paper: GeneratedPaper, pipelineSource: string) => {
  const targetSub = CBSE_SUBJECTS.find(s => s.id === paper.config.subjectId);
  const targetSubName = targetSub?.name || paper.subjectName || paper.config.subjectId;
  const targetClass = getClassFromSubjectId(paper.config.subjectId);

  console.group(`🔍 [Paper Generation Pipeline] Source: ${pipelineSource} | Target Subject: "${targetSubName}" (${paper.config.subjectId}) | Target Class: ${targetClass}`);
  console.log(`[Pipeline Summary] Paper Code: ${paper.paperCode} | Sections: ${paper.sections.length} | Total Marks: ${paper.config.totalMarks}`);

  let totalQuestions = 0;
  let mismatchCount = 0;

  paper.sections.forEach((sec, secIdx) => {
    console.group(`  📂 Section ${secIdx + 1}: ${sec.sectionName} (${sec.questions.length} questions)`);
    sec.questions.forEach((q, qIdx) => {
      totalQuestions++;
      const sourceSubId = q.subjectId || 'UNSPECIFIED';
      const sourceSub = CBSE_SUBJECTS.find(s => s.id === sourceSubId);
      const sourceSubName = sourceSub?.name || sourceSubId;
      const sourceClass = getClassFromSubjectId(sourceSubId);

      const isSubjectMatch = !q.subjectId || q.subjectId === paper.config.subjectId;
      const isClassMatch = sourceClass === targetClass || !q.subjectId;
      const isPerfectMatch = isSubjectMatch && isClassMatch;

      if (!isPerfectMatch) {
        mismatchCount++;
      }

      console.log(
        `    Q${secIdx + 1}.${qIdx + 1} | ` +
        `Status: ${isPerfectMatch ? '✅ MATCH' : '⚠️ CROSS-CONTAMINATION'} | ` +
        `Source Subject: "${sourceSubName}" (${sourceSubId}) | ` +
        `Source Class: ${sourceClass} | ` +
        `Target Subject: "${targetSubName}" (${paper.config.subjectId}) | ` +
        `Target Class: ${targetClass} | ` +
        `Type: ${(q.type || 'N/A').toUpperCase()} (${q.marks}M) | ` +
        `Chapter: "${q.chapterName || 'N/A'}" | ` +
        `Text: "${(q.questionText || '').substring(0, 50)}..."`
      );
    });
    console.groupEnd();
  });

  if (mismatchCount > 0) {
    console.warn(`🚨 [CROSS-CONTAMINATION ALERT] Detected ${mismatchCount}/${totalQuestions} questions with mismatched subject/class in pipeline source: ${pipelineSource}!`);
  } else {
    console.log(`✅ [STRICT ISOLATION CONFIRMED] All ${totalQuestions} questions strictly belong to "${targetSubName}" (${targetClass}).`);
  }
  console.groupEnd();
};

export default function App() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('generator');
  const [isBrandingOpen, setIsBrandingOpen] = useState<boolean>(false);
  const [isPaperCodeModalOpen, setIsPaperCodeModalOpen] = useState<boolean>(false);
  const [isQuestionVaultOpen, setIsQuestionVaultOpen] = useState<boolean>(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [paperToShare, setPaperToShare] = useState<GeneratedPaper | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Authentication & Admin Modals State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>(undefined);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);

  // 3D Animated Background Toggle State
  const [is3DEnabled, setIs3DEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('examcraft_3d_bg');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  // Current selected class and subject for dynamic 3D NCERT diagram background
  const [currentBgClass, setCurrentBgClass] = useState<string>('10');
  const [currentBgSubjectId, setCurrentBgSubjectId] = useState<string>('science-086');

  // Detects local time to smoothly adjust ambient lighting (daylight energetic to night warm low-contrast)
  const ambientLighting = useAmbientTimeLighting();

  // Sync background subject when navigating to language/grammar tab
  useEffect(() => {
    if (activeTab === 'grammar') {
      setCurrentBgSubjectId('english-184');
      window.dispatchEvent(
        new CustomEvent('examcraft:subject_changed', {
          detail: { classLevel: currentBgClass, subjectId: 'english-184' }
        })
      );
    }
  }, [activeTab, currentBgClass]);

  const handleToggle3D = () => {
    setIs3DEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('examcraft_3d_bg', String(next));
      } catch {}
      return next;
    });
  };

  const handleOpenAuthModal = (message?: string) => {
    setAuthModalMessage(message);
    setIsAuthModalOpen(true);
  };

  const handleOpenShareModal = (paper: GeneratedPaper) => {
    setPaperToShare(paper);
    setIsShareModalOpen(true);
  };

  useEffect(() => {
    initSamplePapersIfEmpty();

    // Check URL query parameters or hash for shared paper or quiz links
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const paperCodeParam = searchParams.get('paper');
      const quizCodeParam = searchParams.get('quiz');

      if (paperCodeParam) {
        const loadedPaper = getPaperByCode(paperCodeParam);
        if (loadedPaper) {
          setGeneratedPaper(loadedPaper);
          setIsPreviewOpen(true);
        }
      } else if (quizCodeParam) {
        const loadedPaper = getPaperByCode(quizCodeParam);
        if (loadedPaper) {
          setGeneratedPaper(loadedPaper);
          setActiveTab('quiz');
        }
      }
    } catch (e) {
      console.warn('Could not parse shared URL parameter:', e);
    }
  }, []);

  // Custom School Branding State
  const [branding, setBranding] = useState<CustomBranding>({
    schoolName: 'Delhi Public School, R.K. Puram',
    tagline: 'Affiliated to CBSE, New Delhi | School Code: 20194',
    logoUrl: '/logo.png',
    watermark: 'EXAMCRAFT CBSE MODEL PAPER',
    teacherName: 'Senior Board Faculty',
    examCodePrefix: 'EXAMCRAFT-10'
  });

  // Paper Preview State
  const [generatedPaper, setGeneratedPaper] = useState<GeneratedPaper | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Question Cart State
  const [customCart, setCustomCart] = useState<Question[]>([]);

  // Paper Generator Trigger with Smart Auto-Harvest & Vault Failover
  const handleGeneratePaper = async (config: PaperConfig) => {
    setIsGenerating(true);

    try {
      if (config.useAI) {
        const targetSubId = config.subjectId || 'social-087';
        const subject = CBSE_SUBJECTS.find(s => s.id === targetSubId) || 
          CBSE_SUBJECTS.find(s => s.code === targetSubId) || 
          CBSE_SUBJECTS.find(s => targetSubId.includes(s.code));

        const resolvedSubjectName = subject?.name || 
          (targetSubId.includes('social') || targetSubId.includes('087') ? 'Social Science' :
           targetSubId.includes('math') || targetSubId.includes('041') ? 'Mathematics' :
           targetSubId.includes('english') || targetSubId.includes('184') || targetSubId.includes('301') ? 'English' :
           targetSubId.includes('hindi') || targetSubId.includes('002') || targetSubId.includes('085') || targetSubId.includes('302') ? 'Hindi' :
           'Science');

        const resolvedSubjectCode = subject?.code || 
          (targetSubId.includes('social') || targetSubId.includes('087') ? '087' :
           targetSubId.includes('math') || targetSubId.includes('041') ? '041' :
           targetSubId.includes('english') || targetSubId.includes('184') ? '184' :
           targetSubId.includes('hindi') || targetSubId.includes('002') ? '002' :
           '086');

        const geminiKey = localStorage.getItem('EXAMIDEA_GEMINI_KEY') || undefined;
        const openaiKey = localStorage.getItem('EXAMIDEA_OPENAI_KEY') || undefined;
        const grokKey = localStorage.getItem('EXAMIDEA_GROK_KEY') || undefined;
        const preferredProvider = localStorage.getItem('EXAMIDEA_PREFERRED_PROVIDER') || undefined;

        // 12-second timeout guard to ensure zero stalling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
          const selectedChObjs = subject?.chapters?.filter(c => config.selectedChapterIds?.includes(c.id)) || [];
          const selectedChTitles = selectedChObjs.length > 0 
            ? selectedChObjs.map(c => c.title) 
            : (subject?.chapters?.map(c => c.title) || config.selectedChapterIds);

          const response = await fetch('/api/generate-paper', {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subjectName: resolvedSubjectName,
              subjectCode: resolvedSubjectCode,
              selectedChapters: selectedChTitles,
              totalMarks: config.totalMarks,
              timeMinutes: config.durationMinutes,
              difficulty: 'Balanced',
              competencyPercent: config.competencyRatio,
              schoolName: config.schoolName,
              examName: config.title,
              customKeys: { gemini: geminiKey, openai: openaiKey, grok: grokKey },
              preferredProvider
            })
          });

          clearTimeout(timeoutId);

          const data = await response.json();
          if (data.success && data.paper && Array.isArray(data.paper.sections)) {
            const code = generatePaperCode(resolvedSubjectCode);
            const aiPaper: GeneratedPaper = {
              id: 'ai-paper-' + Date.now(),
              paperCode: code,
              config: { ...config, examCode: code },
              subjectName: resolvedSubjectName,
              subjectCode: resolvedSubjectCode,
              generalInstructions: data.paper.generalInstructions || [
                "Question paper comprises structured Sections as per official CBSE syllabus.",
                "Section A consists of objective MCQs / Reading Skills.",
                "Section B / C / D / E consist of Short Answers, Long Answers & Integrated Case Units."
              ],
              sections: data.paper.sections.map((sec: any) => ({
                sectionName: sec.sectionName || sec.name || 'SECTION',
                description: sec.description || 'CBSE Pattern Section',
                questions: (sec.questions || sec.items || []).map((q: any, idx: number) => {
                  const qChapterName = q.chapter || q.chapterName || '';
                  const matchedCh = subject?.chapters?.find(c => 
                    qChapterName && (
                      c.title.toLowerCase().includes(qChapterName.toLowerCase()) || 
                      qChapterName.toLowerCase().includes(c.title.toLowerCase())
                    )
                  ) || selectedChObjs[idx % (selectedChObjs.length || 1)] || subject?.chapters?.[0];

                  return ensureQuestionAssetId({
                    id: q.id || `q-${idx}-${Math.random().toString(36).substring(2, 6)}`,
                    subjectId: config.subjectId,
                    chapterId: matchedCh?.id || 'ch1',
                    chapterName: qChapterName || matchedCh?.title || 'Core Syllabus',
                    type: q.type || (q.options ? 'mcq' : 'short'),
                    questionText: q.questionText || q.text || q.question || `Question ${q.qNo || idx + 1}`,
                    options: Array.isArray(q.options) ? q.options : undefined,
                    correctAnswer: q.correctAnswer || q.answer || 'Refer to marking scheme',
                    markingScheme: q.markingScheme || q.marking_scheme || '1 mark awarded for correct step',
                    explanation: q.explanation || q.solution,
                    difficulty: 'medium',
                    marks: Number(q.marks) || 1,
                    isCompetency: Boolean(q.isCompetency),
                    casePassage: q.casePassage || q.passage || q.caseStudy,
                    diagramDescription: q.diagramDescription || q.diagram_description,
                    diagramUrl: q.diagramUrl || q.imageUrl || q.image,
                    assetId: q.assetId,
                    assetUrl: q.assetUrl || q.diagramUrl || q.imageUrl
                  });
                })
              })),
              createdAt: new Date().toISOString()
            };

            // Cleanse & Deduplicate AI Paper to guarantee zero repetition
            const cleanAiPaper = sanitizeAndDeduplicatePaper(aiPaper);

            // Log granular question pipeline info to detect cross-contamination
            logPaperQuestionsPipeline(cleanAiPaper, 'API (Gemini / AI Provider)');

            // AUTO-HARVEST: Save all generated questions into the Smart Auto-Vault
            harvestQuestionsFromPaper(cleanAiPaper, 'ai_generated');

            savePaperToRegistry(cleanAiPaper, currentUser ? { email: currentUser.email, name: currentUser.name } : undefined);
            setGeneratedPaper(cleanAiPaper);
            setIsPreviewOpen(true);
            return;
          }
        } catch (fetchErr) {
          console.warn('AI generation limit/timeout reached, seamlessly assembling unique paper from Auto-Vault:', fetchErr);
        }
      }

      // Vault Combinatorial Assembly Mode (Randomized, 100% Unique, Zero API Cost)
      const combinatorialPaper = generateCombinatorialPaperFromVault(config);
      logPaperQuestionsPipeline(combinatorialPaper, 'Combinatorial Auto-Vault');

      harvestQuestionsFromPaper(combinatorialPaper, 'curated_bank');
      savePaperToRegistry(combinatorialPaper, currentUser ? { email: currentUser.email, name: currentUser.name } : undefined);
      setGeneratedPaper(combinatorialPaper);
      setIsPreviewOpen(true);

    } catch (error) {
      console.log('Using local paper assembly fallback:', error);
      const fallbackPaper = sanitizeAndDeduplicatePaper(generateLocalPaper(config));
      logPaperQuestionsPipeline(fallbackPaper, 'Local Paper Assembly Fallback');

      savePaperToRegistry(fallbackPaper, currentUser ? { email: currentUser.email, name: currentUser.name } : undefined);
      setGeneratedPaper(fallbackPaper);
      setIsPreviewOpen(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Build custom paper from Cart items
  const handleBuildCustomFromCart = () => {
    if (customCart.length === 0) return;

    const totalMarks = customCart.reduce((sum, q) => sum + q.marks, 0);
    const code = generatePaperCode('CUSTOM');

    const customPaper: GeneratedPaper = {
      id: 'custom-cart-' + Date.now(),
      paperCode: code,
      subjectName: 'Custom CBSE Assembly',
      subjectCode: '100',
      generalInstructions: [
        "This custom question paper has been built from selected Examidea Question Bank items.",
        "Answers must be written with step-wise calculations and diagrams."
      ],
      config: {
        subjectId: customCart[0]?.subjectId || 'science-086',
        preset: 'custom',
        title: `${branding.schoolName || 'CUSTOM'} SELECTED PAPER 2025-2026`,
        schoolName: branding.schoolName || 'DPS SENIOR SECONDARY SCHOOL',
        examCode: code,
        date: new Date().toLocaleDateString('en-IN'),
        durationMinutes: Math.min(180, customCart.length * 5),
        totalMarks,
        selectedChapterIds: [],
        competencyRatio: 50,
        difficultySplit: { easy: 30, medium: 50, hard: 20 },
        watermarkText: branding.watermark || 'CUSTOM EXAMIDEA PAPER',
        includeSolutions: true,
        useAI: false
      },
      sections: [
        {
          sectionName: "SECTION A",
          description: "Objective MCQs & Short Questions",
          questions: customCart.filter(q => q.type === 'mcq' || q.type === 'ar' || q.type === 'vsa')
        },
        {
          sectionName: "SECTION B",
          description: "Long Answer & Case Study Assessment Units",
          questions: customCart.filter(q => q.type === 'sa' || q.type === 'la' || q.type === 'case')
        }
      ],
      createdAt: new Date().toISOString()
    };

    logPaperQuestionsPipeline(customPaper, 'Custom Question Cart');

    savePaperToRegistry(customPaper, currentUser ? { email: currentUser.email, name: currentUser.name } : undefined);
    setGeneratedPaper(customPaper);
    setIsPreviewOpen(true);
  };

  return (
    <div
      className="min-h-screen bg-slate-50/60 dark:bg-slate-950/70 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-blue-600 selection:text-white print:bg-white transition-colors duration-500 bg-ambient-mesh relative w-full max-w-full overflow-x-auto"
      style={ambientLighting.meshStyle}
    >
      {/* 3D Animated Canvas Background (Particles Wave + Floating Geometric Shapes + NCERT Diagrams) */}
      <ThreeBackground
        enabled={is3DEnabled}
        classLevel={currentBgClass}
        subjectId={currentBgSubjectId}
        isNight={ambientLighting.isNight}
      />

      {/* Time-Adaptive Decorative Ambient Lighting Auras */}
      <div
        className={`pointer-events-none fixed top-0 left-1/4 -translate-x-1/2 rounded-full blur-3xl -z-10 animate-pulse transition-all duration-1000 ${ambientLighting.auraTopClass}`}
        style={{ animationDuration: '8s' }}
      />
      <div
        className={`pointer-events-none fixed top-1/3 right-10 rounded-full blur-3xl -z-10 animate-pulse transition-all duration-1000 ${ambientLighting.auraRightClass}`}
        style={{ animationDuration: '10s' }}
      />
      <div
        className={`pointer-events-none fixed bottom-10 left-10 rounded-full blur-3xl -z-10 transition-all duration-1000 ${ambientLighting.auraBottomClass}`}
      />

      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        branding={branding}
        onOpenBranding={() => setIsBrandingOpen(true)}
        onOpenPaperCodeModal={() => setIsPaperCodeModalOpen(true)}
        onOpenQuestionVault={() => setIsQuestionVaultOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        onOpenAuthModal={() => handleOpenAuthModal()}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        generatedPaperCount={generatedPaper ? 1 : 0}
        customCartCount={customCart.length}
        is3DEnabled={is3DEnabled}
        onToggle3D={handleToggle3D}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'generator' && (
          <GeneratorTab
            onGeneratePaper={handleGeneratePaper}
            isGenerating={isGenerating}
            branding={branding}
            onOpenBranding={() => setIsBrandingOpen(true)}
            onOpenPaperCodeModal={() => setIsPaperCodeModalOpen(true)}
            onOpenQuestionVault={() => setIsQuestionVaultOpen(true)}
            onSubjectChange={(cls, subId) => {
              setCurrentBgClass(cls);
              setCurrentBgSubjectId(subId);
            }}
          />
        )}

        {activeTab === 'revision' && (
          <RevisionSheetsTab />
        )}

        {activeTab === 'syllabus' && (
          <SyllabusBlueprintTab />
        )}

        {activeTab === 'pyq' && (
          <PYQRepositoryTab
            onLoadPaperToPreview={(paper) => {
              setGeneratedPaper(paper);
              setIsPreviewOpen(true);
            }}
            branding={branding}
          />
        )}

        {(activeTab === 'evaluator' || activeTab === 'copy-checker') && (
          <AIEvaluatorTab onOpenAuthModal={(msg) => handleOpenAuthModal(msg)} />
        )}

        {activeTab === 'qbank' && (
          <QuestionBankTab
            customCart={customCart}
            setCustomCart={setCustomCart}
            onBuildCustomPaper={handleBuildCustomFromCart}
          />
        )}

        {activeTab === 'grammar' && (
          <GrammarQuizTab />
        )}

        {activeTab === 'quiz' && (
          <InteractiveQuizTab
            paper={generatedPaper}
            onSelectPaper={(paper) => setGeneratedPaper(paper)}
            onExitQuiz={() => setActiveTab('generator')}
          />
        )}
      </main>

      {/* Paper Preview Modal */}
      {isPreviewOpen && generatedPaper && (
        <PaperPreviewModal
          paper={generatedPaper}
          onClose={() => setIsPreviewOpen(false)}
          branding={branding}
          onStartInteractiveQuiz={(paper) => {
            setIsPreviewOpen(false);
            setActiveTab('quiz');
          }}
          onOpenAuthModal={(msg) => handleOpenAuthModal(msg)}
          onOpenShareModal={(paper) => handleOpenShareModal(paper)}
        />
      )}

      {/* School Branding Header Drawer */}
      <BrandingDrawer
        isOpen={isBrandingOpen}
        onClose={() => setIsBrandingOpen(false)}
        branding={branding}
        setBranding={setBranding}
      />

      {/* Unique Paper Code Search & History Modal */}
      <PaperCodeModal
        isOpen={isPaperCodeModalOpen}
        onClose={() => setIsPaperCodeModalOpen(false)}
        onSelectPaper={(paper) => {
          setGeneratedPaper(paper);
          setIsPreviewOpen(true);
        }}
        onOpenShareModal={(paper) => handleOpenShareModal(paper)}
      />

      {/* Auth / Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMessage={authModalMessage}
      />

      {/* Super Admin Dashboard & User Management */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        onSelectPaper={(paper) => {
          setGeneratedPaper(paper);
          setIsPreviewOpen(true);
        }}
      />

      {/* Smart Question Auto-Vault & Combinatorial Paper Remix Modal */}
      <QuestionVaultModal
        isOpen={isQuestionVaultOpen}
        onClose={() => setIsQuestionVaultOpen(false)}
        onSelectPaper={(paper) => {
          savePaperToRegistry(paper);
          setGeneratedPaper(paper);
          setIsPreviewOpen(true);
        }}
        branding={branding}
      />

      {/* Google Drive Cloud Sync Modal */}
      <GoogleDriveModal
        isOpen={isGoogleDriveOpen}
        onClose={() => setIsGoogleDriveOpen(false)}
        currentGeneratedPaper={generatedPaper}
        onLoadPaperFromDrive={(paper) => {
          savePaperToRegistry(paper);
          setGeneratedPaper(paper);
          setIsPreviewOpen(true);
        }}
      />

      {/* Share Paper Modal */}
      <SharePaperModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        paper={paperToShare}
        onOpenInteractiveQuiz={(paper) => {
          setGeneratedPaper(paper);
          setIsPreviewOpen(false);
          setActiveTab('quiz');
        }}
      />

      {/* Floating Pen Overlay */}
      <FloatingPen />

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-8 border-t border-stone-800 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img 
              src={branding?.logoUrl || "/logo.png"} 
              alt="ExamCraft CBSE Logo" 
              className="w-8 h-8 object-cover rounded-md filter drop-shadow-[0_2px_6px_rgba(16,185,129,0.3)] border border-stone-700/50"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
              referrerPolicy="no-referrer"
            />
            <span className="font-bold text-stone-200 text-sm">ExamCraft CBSE Test Generator</span>
          </div>
          <p className="text-center sm:text-right">
            Designed for CBSE Class 9, 10 & 12 Students, Teachers, and Coaching Institutes • Aligned with Latest 2025-2026 Sample Papers & Competency Blueprints
          </p>
        </div>
      </footer>
    </div>
  );
}
