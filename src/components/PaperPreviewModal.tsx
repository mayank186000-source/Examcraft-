import React, { useState, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { GeneratedPaper, CustomBranding } from '../types';
import { ExamTimerWidget } from './ExamTimerWidget';
import { useAuth } from '../context/AuthContext';
import {
  Printer,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  FileText,
  PlayCircle,
  Copy,
  Check,
  Download,
  Loader2,
  FileCode,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Share2,
  Timer,
  Flag,
  CheckSquare,
  Square,
  Crown,
  Lock,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Languages
} from 'lucide-react';
import { MATH_MCQ_BANK, SCIENCE_MCQ_BANK, SOCIAL_MCQ_BANK, ENGLISH_MCQ_BANK, HINDI_A_MCQ_BANK, HINDI_B_MCQ_BANK } from '../data/textbookQuestions';
import { getRefreshedQuestion, regenerateEntirePaper } from '../utils/questionVault';
import { LanguageMode, translateInstruction, translateQuestionText, translateOption, translateHeaderTerm, translateAnswer, translatePaperState, ensurePaperHindiTranslations } from '../utils/translator';
import { QuestionDiagramRenderer } from './QuestionDiagramRenderer';

interface PaperPreviewModalProps {
  paper: GeneratedPaper | null;
  onClose: () => void;
  branding: CustomBranding;
  onStartInteractiveQuiz?: (paper: GeneratedPaper) => void;
  onOpenAuthModal?: (message?: string) => void;
  onOpenShareModal?: (paper: GeneratedPaper) => void;
}

// Helper to format official CBSE section headers
const getFormattedSectionHeader = (sectionName: string, description: string, subjectCode?: string): { title: string; subtitle: string } => {
  const cleanName = (sectionName || '').trim();
  const cleanDesc = (description || '').trim();
  const upperName = cleanName.toUpperCase();

  if (cleanName.includes(':')) {
    return { title: cleanName.toUpperCase(), subtitle: cleanDesc };
  }

  const code = (subjectCode || '').trim();
  let explicitTitle = upperName;

  if (code === '184' || code.includes('English') || code.includes('184')) {
    if (upperName === 'SECTION A') explicitTitle = 'SECTION A: READING SKILLS';
    else if (upperName === 'SECTION B') explicitTitle = 'SECTION B: WRITING SKILLS & GRAMMAR';
    else if (upperName === 'SECTION C') explicitTitle = 'SECTION C: LITERATURE TEXTBOOKS';
  } else if (code === '402' || code.includes('402')) {
    if (upperName === 'SECTION A') explicitTitle = 'SECTION A: OBJECTIVE TYPE QUESTIONS';
    else if (upperName === 'SECTION B') explicitTitle = 'SECTION B: SUBJECTIVE TYPE QUESTIONS';
  } else {
    if (upperName === 'SECTION A') explicitTitle = 'SECTION A: MULTIPLE CHOICE QUESTIONS';
    else if (upperName === 'SECTION B') explicitTitle = 'SECTION B: VERY SHORT ANSWER QUESTIONS';
    else if (upperName === 'SECTION C') explicitTitle = 'SECTION C: SHORT ANSWER QUESTIONS';
    else if (upperName === 'SECTION D') explicitTitle = 'SECTION D: LONG ANSWER QUESTIONS';
    else if (upperName === 'SECTION E') explicitTitle = 'SECTION E: CASE-BASED INTEGRATED UNITS';
    else if (upperName === 'SECTION F') explicitTitle = 'SECTION F: MAP SKILL BASED QUESTIONS';
  }

  return { title: explicitTitle, subtitle: cleanDesc };
};

export const PaperPreviewModal: React.FC<PaperPreviewModalProps> = ({
  paper: initialPaper,
  onClose,
  branding,
  onStartInteractiveQuiz,
  onOpenAuthModal,
  onOpenShareModal
}) => {
  const { canDownload, recordDownload, currentUser, isAdmin } = useAuth();
  const [basePaper, setBasePaper] = useState<GeneratedPaper>(initialPaper!);
  const [languageMode, setLanguageMode] = useState<LanguageMode>(
    initialPaper?.config?.subjectId?.includes('hindi') ? 'hi' : 'en'
  );
  
  // Field-by-field translated paper state derived from basePaper + languageMode
  const [paper, setPaper] = useState<GeneratedPaper>(() => 
    initialPaper ? translatePaperState(initialPaper, initialPaper?.config?.subjectId?.includes('hindi') ? 'hi' : 'en') : (null as any)
  );

  useEffect(() => {
    if (basePaper) {
      setPaper(translatePaperState(basePaper, languageMode));
    }
  }, [basePaper, languageMode]);

  const [showAnswers, setShowAnswers] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const handleLanguageChange = async (targetMode: LanguageMode) => {
    setLanguageMode(targetMode);

    if (targetMode === 'en' || !basePaper) return;

    // Check if paper already has Hindi translations attached
    const hasHindiAlready = basePaper.sections?.some(sec => 
      sec.questions?.some(q => Boolean(q.questionTextHindi))
    );

    if (!hasHindiAlready) {
      setIsTranslating(true);
      try {
        const enriched = await ensurePaperHindiTranslations(basePaper);
        setBasePaper(enriched);
      } catch (err) {
        console.warn('Hindi translation error:', err);
      } finally {
        setIsTranslating(false);
      }
    }
  };
  const [showGeneralInstructions, setShowGeneralInstructions] = useState<boolean>(
    initialPaper?.config?.includeGeneralInstructions ?? true
  );

  const [refreshingKey, setRefreshingKey] = useState<string | null>(null);
  const [isRegeneratingPaper, setIsRegeneratingPaper] = useState<boolean>(false);

  // Per-question history stack for Undo / Redo functionality
  const [questionHistory, setQuestionHistory] = useState<Record<string, { history: any[]; currentIndex: number }>>({});
  
  // Paper-level history stack for Undo paper regeneration
  const [paperHistory, setPaperHistory] = useState<GeneratedPaper[]>(() => initialPaper ? [initialPaper] : []);
  const [paperHistoryIndex, setPaperHistoryIndex] = useState<number>(0);

  const refreshQuestion = (secIdx: number, qIdx: number) => {
    if (!basePaper) return;
    const key = `${secIdx}-${qIdx}`;
    setRefreshingKey(key);

    try {
      const currentQuestion = basePaper.sections[secIdx]?.questions[qIdx];
      if (!currentQuestion) return;

      const slotHist = questionHistory[key] || {
        history: [currentQuestion],
        currentIndex: 0
      };

      const newQ = getRefreshedQuestion(basePaper, secIdx, qIdx);

      const updatedHistoryList = [
        ...slotHist.history.slice(0, slotHist.currentIndex + 1),
        newQ
      ];
      const newIndex = updatedHistoryList.length - 1;

      setQuestionHistory(prev => ({
        ...prev,
        [key]: {
          history: updatedHistoryList,
          currentIndex: newIndex
        }
      }));

      const newBasePaper: GeneratedPaper = JSON.parse(JSON.stringify(basePaper));
      if (newBasePaper.sections[secIdx] && newBasePaper.sections[secIdx].questions[qIdx]) {
        newBasePaper.sections[secIdx].questions[qIdx] = newQ;
        setBasePaper(newBasePaper);
      }
    } catch (err) {
      console.error('Failed to refresh question:', err);
    } finally {
      setTimeout(() => {
        setRefreshingKey(null);
      }, 350);
    }
  };

  const undoQuestion = (secIdx: number, qIdx: number) => {
    if (!basePaper) return;
    const key = `${secIdx}-${qIdx}`;
    const currentQuestion = basePaper.sections[secIdx]?.questions[qIdx];
    if (!currentQuestion) return;

    const slotHist = questionHistory[key] || {
      history: [currentQuestion],
      currentIndex: 0
    };

    if (slotHist.currentIndex <= 0) return;

    const newIndex = slotHist.currentIndex - 1;
    const prevQ = slotHist.history[newIndex];

    setQuestionHistory(prev => ({
      ...prev,
      [key]: {
        ...slotHist,
        currentIndex: newIndex
      }
    }));

    const newBasePaper: GeneratedPaper = JSON.parse(JSON.stringify(basePaper));
    if (newBasePaper.sections[secIdx] && newBasePaper.sections[secIdx].questions[qIdx]) {
      newBasePaper.sections[secIdx].questions[qIdx] = prevQ;
      setBasePaper(newBasePaper);
    }
  };

  const redoQuestion = (secIdx: number, qIdx: number) => {
    if (!basePaper) return;
    const key = `${secIdx}-${qIdx}`;
    const currentQuestion = basePaper.sections[secIdx]?.questions[qIdx];
    if (!currentQuestion) return;

    const slotHist = questionHistory[key];
    if (!slotHist || slotHist.currentIndex >= slotHist.history.length - 1) return;

    const newIndex = slotHist.currentIndex + 1;
    const nextQ = slotHist.history[newIndex];

    setQuestionHistory(prev => ({
      ...prev,
      [key]: {
        ...slotHist,
        currentIndex: newIndex
      }
    }));

    const newBasePaper: GeneratedPaper = JSON.parse(JSON.stringify(basePaper));
    if (newBasePaper.sections[secIdx] && newBasePaper.sections[secIdx].questions[qIdx]) {
      newBasePaper.sections[secIdx].questions[qIdx] = nextQ;
      setBasePaper(newBasePaper);
    }
  };

  const canUndoQuestion = (secIdx: number, qIdx: number): boolean => {
    const key = `${secIdx}-${qIdx}`;
    const slotHist = questionHistory[key];
    return !!slotHist && slotHist.currentIndex > 0;
  };

  const canRedoQuestion = (secIdx: number, qIdx: number): boolean => {
    const key = `${secIdx}-${qIdx}`;
    const slotHist = questionHistory[key];
    return !!slotHist && slotHist.currentIndex < slotHist.history.length - 1;
  };

  const getQuestionHistoryInfo = (secIdx: number, qIdx: number) => {
    const key = `${secIdx}-${qIdx}`;
    const slotHist = questionHistory[key];
    if (!slotHist) return { current: 1, total: 1 };
    return {
      current: slotHist.currentIndex + 1,
      total: slotHist.history.length
    };
  };

  const handleRegenerateAllQuestions = () => {
    if (!basePaper) return;
    setIsRegeneratingPaper(true);
    setTimeout(() => {
      try {
        const refreshedPaper = regenerateEntirePaper(basePaper);
        const newPaperHist = [...paperHistory.slice(0, paperHistoryIndex + 1), refreshedPaper];
        setPaperHistory(newPaperHist);
        setPaperHistoryIndex(newPaperHist.length - 1);
        setBasePaper(refreshedPaper);
      } catch (err) {
        console.error('Failed to regenerate paper:', err);
      } finally {
        setIsRegeneratingPaper(false);
      }
    }, 300);
  };

  const handleUndoPaperRegeneration = () => {
    if (paperHistoryIndex <= 0) return;
    const newIdx = paperHistoryIndex - 1;
    setPaperHistoryIndex(newIdx);
    setBasePaper(paperHistory[newIdx]);
  };

  const [copied, setCopied] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [attemptedQuestions, setAttemptedQuestions] = useState<Set<string>>(new Set());
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  if (!paper) return null;

  const isPyqPaper = paper.id.startsWith('pyq') ||
                    paper.paperCode?.startsWith('PYQ') ||
                    (paper as any).isOfficialPyq === true;

  const pyqYearMatch = paper.config.date?.match(/\d{4}/) || paper.paperCode?.match(/\d{4}/) || paper.config.title?.match(/\d{4}/);
  const examYear = pyqYearMatch ? pyqYearMatch[0] : '2025';

  const classNum = paper.subjectName?.match(/Class\s*(\d+)/i)?.[1] ||
                   (paper.paperCode?.includes('CBSE12') ? '12' : paper.paperCode?.includes('CBSE9') ? '9' : paper.paperCode?.includes('CBSE11') ? '11' : '10');

  const examTitleText = isPyqPaper
    ? (classNum === '12'
        ? `ALL INDIA SENIOR SCHOOL CERTIFICATE EXAMINATION ${examYear}`
        : classNum === '10'
        ? `ALL INDIA SECONDARY SCHOOL EXAMINATION ${examYear}`
        : `CLASS ${classNum} ANNUAL EXAMINATION ${examYear}`)
    : (paper.paperTitle || paper.config.title || `CLASS ${classNum} EXAMINATION 2025-2026`);

  const handleToggleAttempt = (qId: string) => {
    setAttemptedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleToggleFlag = (qId: string) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleFinishExam = (timeSpentSeconds: number) => {};

  
  const generateVectorPdf = (paperObj: GeneratedPaper, schoolName: string) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 18;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > 275) {
        doc.addPage();
        y = 18;
      }
    };

    // School Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(schoolName || 'DELHI PUBLIC SCHOOL', pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(10);
    doc.text(paperObj.config.title || 'CBSE SAMPLE QUESTION PAPER', pageWidth / 2, y, { align: 'center' });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Subject: ${paperObj.subjectName} (${paperObj.subjectCode || '041'}) | Time: ${paperObj.config.durationMinutes} Mins | Max Marks: ${paperObj.config.totalMarks}`, pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // Instructions
    if (showGeneralInstructions && paperObj.generalInstructions && paperObj.generalInstructions.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('GENERAL INSTRUCTIONS:', margin, y);
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      paperObj.generalInstructions.forEach((inst, idx) => {
        const lines = doc.splitTextToSize(`${idx + 1}. ${inst}`, contentWidth);
        checkPageBreak(lines.length * 3.8 + 2);
        doc.text(lines, margin, y);
        y += lines.length * 3.8 + 1;
      });
      y += 3;
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    }

    // Sections & Questions
    paperObj.sections.forEach(sec => {
      const { title, subtitle } = getFormattedSectionHeader(sec.sectionName, sec.description, paperObj.subjectCode);
      checkPageBreak(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(title, margin, y);
      y += 5;

      if (subtitle) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        const subLines = doc.splitTextToSize(subtitle, contentWidth);
        doc.text(subLines, margin, y);
        y += subLines.length * 3.8 + 2;
      }

      sec.questions.forEach((q, qIdx) => {
        checkPageBreak(12);

        if (q.casePassage) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          const passLines = doc.splitTextToSize(`[CASE STUDY PASSAGE]:\n${q.casePassage}`, contentWidth);
          checkPageBreak(passLines.length * 3.8 + 3);
          doc.text(passLines, margin, y);
          y += passLines.length * 3.8 + 2;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        const qNumText = `Q${qIdx + 1}. [${q.marks} Mark${q.marks > 1 ? 's' : ''}] `;
        doc.text(qNumText, margin, y);
        const qNumWidth = doc.getTextWidth(qNumText);

        doc.setFont('helvetica', 'normal');
        const qLines = doc.splitTextToSize(q.questionText, contentWidth - qNumWidth);
        if (qLines.length > 0) {
          doc.text(qLines[0], margin + qNumWidth, y);
          y += 4;
          for (let l = 1; l < qLines.length; l++) {
            checkPageBreak(4.5);
            doc.text(qLines[l], margin + 4, y);
            y += 4;
          }
        }

        if (q.options && q.options.length > 0) {
          q.options.forEach(opt => {
            checkPageBreak(4.5);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const optLines = doc.splitTextToSize(`   ${opt}`, contentWidth - 4);
            doc.text(optLines, margin + 4, y);
            y += optLines.length * 3.8;
          });
        }

        if (showAnswers) {
          checkPageBreak(8);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(180, 80, 0);
          doc.text(`   [CORRECT ANSWER]: ${q.correctAnswer}`, margin + 4, y);
          y += 4;

          if (q.markingScheme) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80, 80, 80);
            const msLines = doc.splitTextToSize(`   Marking Scheme: ${q.markingScheme}`, contentWidth - 8);
            doc.text(msLines, margin + 4, y);
            y += msLines.length * 3.5;
          }
          doc.setTextColor(0, 0, 0);
        }

        y += 2.5;
      });
      y += 3;
    });

    return doc;
  };

  const handleDownloadPDF = async () => {
    const authCheck = canDownload();
    if (!authCheck.allowed) {
      onOpenAuthModal?.(authCheck.reason);
      return;
    }

    const element = document.getElementById('printable-paper-content');
    if (!element) return;

    recordDownload(paper.config.title || `${paper.subjectName} Board Paper`, paper.subjectName, paper.paperCode);
    setIsGeneratingPdf(true);

    const safeFilename = (paper.subjectName || 'Paper').replace(/[^a-zA-Z0-9]/g, '_');
    const classMatch = paper.subjectName?.match(/Class\s*(\d+)/i);
    const targetClass = classMatch ? classMatch[1] : '10';
    const filename = `CBSE_Class${targetClass}_${safeFilename}_QuestionPaper.pdf`;

    try {
      // Attempt canvas rendering with timeout
      const renderPromise = (async () => {
        const originalStyle = element.style.cssText;
        element.style.width = '210mm';
        element.style.maxWidth = 'none';
        element.style.padding = '12mm';
        element.style.backgroundColor = '#ffffff';

        const dataUrl = await htmlToImage.toJpeg(element, {
          quality: 0.95,
          pixelRatio: 1.5,
          backgroundColor: '#ffffff'
        });

        element.style.cssText = originalStyle;

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(dataUrl);
        const imgWidth = pdfWidth;
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(dataUrl, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }

        return pdf;
      })();

      // 6 second timeout race condition for canvas rendering on slow mobile memory
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Canvas render timeout')), 6000)
      );

      const finalPdf = await Promise.race([renderPromise, timeoutPromise]);
      finalPdf.save(filename);
      setIsGeneratingPdf(false);
    } catch (err) {
      console.warn('Canvas PDF failed or timed out. Falling back to direct vector PDF generation:', err);
      try {
        const vectorDoc = generateVectorPdf(paper, branding.schoolName);
        vectorDoc.save(filename);
      } catch (fallbackErr) {
        console.error('Vector PDF fallback failed, executing Word/HTML download fallback:', fallbackErr);
        handleDownloadWordDoc();
      } finally {
        setIsGeneratingPdf(false);
      }
    }
  };

  const handleDownloadWordDoc = () => {
    const authCheck = canDownload();
    if (!authCheck.allowed) {
      onOpenAuthModal?.(authCheck.reason);
      return;
    }
    recordDownload(paper.config.title || `${paper.subjectName} Board Paper`, paper.subjectName, paper.paperCode);

    const safeFilename = (paper.subjectName || 'Paper').replace(/[^a-zA-Z0-9]/g, '_');
    const classMatch = paper.subjectName?.match(/Class\s*(\d+)/i);
    const targetClass = classMatch ? classMatch[1] : '10';
    const filename = `CBSE_Class${targetClass}_${safeFilename}_ExamPaper.doc`;

    const element = document.getElementById('printable-paper-content');
    if (!element) return;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${paper.subjectName} Question Paper</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #000; margin: 20px; }
          h1, h2, h3 { text-align: center; margin: 4px 0; }
          .section-title { background-color: #f3f4f6; font-weight: bold; padding: 6px; margin-top: 15px; border-bottom: 1.5pt solid #000; }
          .question-item { margin-bottom: 10px; page-break-inside: avoid; }
          .answer-scheme { background-color: #fffbe3; border-left: 3pt solid #d97706; padding: 6px; margin-top: 4px; font-size: 9.5pt; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const authCheck = canDownload();
    if (!authCheck.allowed) {
      onOpenAuthModal?.(authCheck.reason);
      return;
    }
    recordDownload(paper.config.title || `${paper.subjectName} Board Paper`, paper.subjectName, paper.paperCode);
    
    const element = document.getElementById('printable-paper-content');
    if (!element) {
      window.print();
      return;
    }

    // Create a print-only container appended to body
    const printContainer = document.createElement('div');
    printContainer.className = 'print-overlay';
    
    // Clone the paper content
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = '100%';
    clone.style.maxWidth = 'none';
    clone.style.boxShadow = 'none';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.border = 'none';
    
    // Ensure text colors are black for printing
    const allElements = clone.querySelectorAll('*');
    allElements.forEach(el => {
      (el as HTMLElement).style.color = '#000000';
    });
    
    printContainer.appendChild(clone);
    document.body.appendChild(printContainer);

    // Give browser a moment to render the appended DOM
    setTimeout(() => {
      window.print();
      // Cleanup after print dialog closes
      setTimeout(() => {
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
        }
      }, 1000);
    }, 200);
  };

  const handleCopyText = () => {
    let fullText = `${branding.schoolName || 'DELHI PUBLIC SCHOOL'}\n${paper.paperTitle || paper.config.title}\nSubject: ${paper.subjectName} (${paper.subjectCode})\nTime Allowed: ${paper.config.durationMinutes} Mins | Max Marks: ${paper.config.totalMarks}\n\n`;
    if (showGeneralInstructions && paper.generalInstructions && paper.generalInstructions.length > 0) {
      fullText += `GENERAL INSTRUCTIONS:\n`;
      paper.generalInstructions.forEach((inst, idx) => {
        fullText += `${idx + 1}. ${inst}\n`;
      });
      fullText += `\n`;
    }
    fullText += `------------------------------------------------------------\n`;

    paper.sections.forEach(sec => {
      const { title, subtitle } = getFormattedSectionHeader(sec.sectionName, sec.description, paper.subjectCode);
      fullText += `\n${title}${subtitle ? ` - ${subtitle}` : ''}\n\n`;
      sec.questions.forEach((q, idx) => {
        if (q.casePassage) {
          fullText += `[CASE STUDY PASSAGE]:\n${q.casePassage}\n\n`;
        }
        fullText += `Q${idx + 1}. [${q.marks} Mark${q.marks > 1 ? 's' : ''}] ${q.questionText}\n`;
        if (q.options && q.options.length > 0) {
          q.options.forEach(opt => {
            fullText += `   ${opt}\n`;
          });
        }
        if (showAnswers) {
          fullText += `   [ANSWER & MARKING SCHEME]: ${q.correctAnswer}\n   ${q.markingScheme}\n`;
        }
        fullText += `\n`;
      });
    });

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-md flex flex-col items-center p-2 sm:p-6 print:p-0 print:static print:bg-white print:overflow-visible">
      {/* Top Floating Control Bar */}
      <div className="w-full max-w-5xl bg-stone-900 border border-stone-800 text-white rounded-2xl p-4 mb-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-800/40 border border-emerald-700/50 flex items-center justify-center text-emerald-300">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">{paper.subjectName} Board Paper</h3>
            <p className="text-[11px] text-stone-400">
              {paper.config.totalMarks} Marks • {paper.config.durationMinutes} Minutes • CBSE Pattern
            </p>
          </div>
        </div>

        {/* View Controls & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Language Switcher */}
          <div className="flex items-center bg-stone-800/90 border border-amber-500/40 rounded-lg p-0.5 text-xs font-bold shadow-md relative">
            {isTranslating ? (
              <div className="flex items-center gap-1.5 px-3 py-1 text-amber-300 font-bold animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Translating Hindi...</span>
              </div>
            ) : (
              <>
                <Languages className="w-3.5 h-3.5 text-amber-400 ml-2 mr-1 shrink-0" />
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    languageMode === 'en'
                      ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => handleLanguageChange('hi')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    languageMode === 'hi'
                      ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  हिंदी
                </button>
                <button
                  onClick={() => handleLanguageChange('bilingual')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    languageMode === 'bilingual'
                      ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                  title="English and Hindi Both (bilingual)"
                >
                  द्विभाषी
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setShowGeneralInstructions(!showGeneralInstructions)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
              showGeneralInstructions
                ? 'bg-emerald-700 text-white border-emerald-600 shadow-md shadow-emerald-900/30'
                : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
            }`}
            title="Toggle General Instructions On / Off"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Instructions: {showGeneralInstructions ? 'ON' : 'OFF'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRegenerateAllQuestions}
              disabled={isRegeneratingPaper}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 bg-stone-800 text-stone-200 border-stone-700 hover:text-white hover:border-emerald-600 hover:bg-stone-750 active:scale-95 cursor-pointer disabled:opacity-50"
              title="Regenerate all questions in this paper with fresh authentic CBSE questions"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRegeneratingPaper ? 'animate-spin' : ''}`} />
              <span>{isRegeneratingPaper ? 'Regenerating...' : 'Regenerate Paper'}</span>
            </button>

            {paperHistoryIndex > 0 && (
              <button
                onClick={handleUndoPaperRegeneration}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20 hover:border-amber-400 cursor-pointer active:scale-95 shadow-xs"
                title={`Undo Paper Regeneration (Step ${paperHistoryIndex + 1}/${paperHistory.length})`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Undo Paper</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showAnswers
                ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-950/20 font-extrabold'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:text-white hover:border-stone-600'
            }`}
          >
            {showAnswers ? (
              <EyeOff className="w-3.5 h-3.5 text-stone-950" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-amber-400" />
            )}
            <div className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Marking Scheme: {showAnswers ? 'SHOWN' : 'HIDDEN'}</span>
            </div>
          </button>

          {onStartInteractiveQuiz && (
            <button
              onClick={() => onStartInteractiveQuiz(paper)}
              className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all"
            >
              <PlayCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Start Online Test</span>
            </button>
          )}

          <button
            onClick={handleCopyText}
            className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs px-3.5 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            title="Direct PDF Download"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-stone-950" />
            )}
            <span>{isGeneratingPdf ? 'Saving PDF...' : 'Download PDF (पीडीएफ)'}</span>
          </button>

          <button
            onClick={handleDownloadWordDoc}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-3.5 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download editable MS Word / Doc paper file"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-200" />
            <span>Download Word (वर्ड फ़ाइल)</span>
          </button>

          

          <button
            onClick={() => onOpenShareModal?.(paper)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            title="Share Paper via link, WhatsApp, or QR Code"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-300" />
            <span>Share Paper (शेयर)</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            title="Print Paper via Printer"
          >
            <Printer className="w-3.5 h-3.5 text-stone-300" />
            <span>Print Paper</span>
          </button>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <ExamTimerWidget
        paper={paper}
        attemptedQuestions={attemptedQuestions}
        flaggedQuestions={flaggedQuestions}
        onToggleAttempt={handleToggleAttempt}
        onToggleFlag={handleToggleFlag}
        onRevealAnswers={() => setShowAnswers(true)}
        onFinishExam={handleFinishExam}
      />

      <div className="w-full max-w-4xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-xl p-4 shadow-lg border border-emerald-700/60 print:hidden flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 font-black flex items-center justify-center text-lg shadow-inner">
            #
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-300">
                Unique Paper Code (यूनिक पेपर कोड)
              </span>
              <span className="bg-emerald-950 text-emerald-200 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-700">
                Auto-Saved
              </span>
            </div>
            <div className="text-lg font-mono font-extrabold text-white tracking-widest mt-0.5">
              {paper.paperCode || paper.config.examCode}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => onOpenShareModal?.(paper)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap cursor-pointer"
            title="Share Public Link & QR Code"
          >
            <Share2 className="w-4 h-4 text-amber-300" />
            <span>Share Paper</span>
          </button>
          <button
            onClick={() => {
              const code = paper.paperCode || paper.config.examCode;
              navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-900" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Code Copied!' : 'Copy Unique Code'}</span>
          </button>
        </div>
      </div>

      <div
        id="printable-paper-content"
        className="w-full max-w-4xl bg-white text-stone-900 rounded-xl shadow-2xl p-6 sm:p-12 print:p-0 print:shadow-none print:w-full print:max-w-none print:rounded-none relative font-serif text-sm leading-relaxed border border-stone-200 print:border-none"
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
          <span className="text-stone-200/40 print:text-stone-300/30 font-sans font-black text-6xl sm:text-7xl uppercase -rotate-45 tracking-widest text-center whitespace-nowrap">
            {branding.watermark || 'EXAMCRAFT CBSE SAMPLE PAPER'}
          </span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between border-b-2 border-stone-900 pb-3 font-sans text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold">{translateHeaderTerm('Roll No.', languageMode)}</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => (
                  <div key={i} className="w-5 h-6 border border-stone-800 flex items-center justify-center text-[10px] font-mono font-bold text-stone-700">
                  </div>
                ))}
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-stone-800">
                {translateHeaderTerm('Q.P. Code / Set No.', languageMode)}: {paper.config.examCode}
              </span>
              <p className="text-[10px] text-stone-600 font-bold">
                Series: {isPyqPaper ? `CBSE-${examYear}-EXAM` : 'EXAMCRAFT-10-2026'}
              </p>
            </div>
          </div>

          <div className="text-center font-sans space-y-1 py-2 border-b border-stone-900">
            <div className="flex items-center justify-center gap-2 mb-1">
              <img 
                src={branding.logoUrl || "/logo.png"} 
                alt="CBSE Logo" 
                className="h-16 w-auto object-contain max-h-16"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide text-stone-900">
              {isPyqPaper
                ? 'CENTRAL BOARD OF SECONDARY EDUCATION'
                : (branding.schoolName || paper.config.schoolName || 'DELHI PUBLIC SCHOOL')}
            </h1>
            <p className="text-xs text-stone-600 italic font-medium">
              {isPyqPaper
                ? 'केन्द्रीय माध्यमिक शिक्षा बोर्ड (An Autonomous Organisation under the Ministry of Education, Govt. of India)'
                : (branding.tagline || 'Affiliated to Central Board of Secondary Education (CBSE), New Delhi')}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <span className="text-sm sm:text-base font-black uppercase text-stone-900 tracking-wider">
                {translateHeaderTerm(examTitleText, languageMode)}
              </span>
            </div>

            {showAnswers && (
              <div className="my-1.5 py-1 px-3 bg-amber-100 print:bg-amber-100 border border-amber-400 rounded text-[11px] font-bold text-amber-950 inline-flex items-center gap-1.5 shadow-sm">
                <GraduationCap className="w-3.5 h-3.5 text-amber-800" />
                <span>{translateHeaderTerm('CONFIDENTIAL TEACHER EVALUATION COPY • MARKING SCHEME & STEP-WISE SOLUTIONS INCLUDED', languageMode)}</span>
              </div>
            )}
            <h2 className="text-base font-bold uppercase text-emerald-900 pt-1">
              {paper.subjectName} (SUBJECT CODE: {paper.subjectCode})
            </h2>
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 pt-3">
              <span>{translateHeaderTerm('Time Allowed:', languageMode)} {paper.config.durationMinutes / 60} {translateHeaderTerm('Hours', languageMode)} ({paper.config.durationMinutes} {translateHeaderTerm('Mins', languageMode)})</span>
              <span>{translateHeaderTerm('Maximum Marks:', languageMode)} {paper.config.totalMarks}</span>
            </div>
          </div>

          {showGeneralInstructions && paper.generalInstructions && paper.generalInstructions.length > 0 && (
            <div className="bg-stone-50 print:bg-white p-4 rounded-lg border border-stone-900 font-sans text-xs space-y-2">
              <p className="font-bold uppercase tracking-wider text-stone-900 border-b border-stone-300 pb-1">
                {translateHeaderTerm('General Instructions:', languageMode)}
              </p>
              <ol className="list-decimal list-inside space-y-1 text-stone-800 text-[11px] leading-relaxed">
                {paper.generalInstructions.map((inst, idx) => (
                  <li key={idx}>{translateInstruction(inst, languageMode)}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="border-t-2 border-stone-900 my-4"></div>

          <div className="space-y-8 font-serif">
            {(() => {
              let globalQCounter = 0;
              return paper.sections.map((section, secIdx) => {
                const { title, subtitle } = getFormattedSectionHeader(section.sectionName, section.description, paper.subjectCode);
                return (
                  <div key={secIdx} className="space-y-6">
                    <div className="text-center font-sans space-y-0.5 my-6">
                      <h3 className="font-extrabold text-base tracking-widest uppercase text-stone-900 underline decoration-2 underline-offset-4">
                        {translateHeaderTerm(title, languageMode)}
                      </h3>
                      {subtitle && (
                        <p className="text-xs font-semibold text-stone-700 italic">
                          {translateInstruction(subtitle, languageMode)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-6">
                    {section.questions.map((q, qIdx) => {
                      const currentGlobalIdx = globalQCounter++;
                      const qUniqueId = q.id ? `sec-${secIdx}-${qIdx}-${q.id}` : `sec-${secIdx}-q-${qIdx}-${currentGlobalIdx}`;
                      const isAttempted = attemptedQuestions.has(qUniqueId);
                      const isFlagged = flaggedQuestions.has(qUniqueId);

                      const isCaseType = q.type === 'case';
                      const isCaseSection = section.sectionName.toUpperCase().includes('SECTION E') ||
                                            section.description.toLowerCase().includes('case');
                      const isCaseQuestion = isCaseType || Boolean(q.casePassage) || isCaseSection;

                      const rawPassage = q.casePassage ||
                        (q as any).passage ||
                        (q as any).passageText ||
                        (q as any).passageContent ||
                        (q as any).sourceData ||
                        (q as any).context ||
                        (q as any).case_passage ||
                        (q as any).caseStudy ||
                        (q as any).caseText ||
                        '';

                      let passageContent = rawPassage.trim();

                      // Clean out generic placeholder meta instructions from passage text
                      passageContent = passageContent
                        .replace(/^Read the case study \/ contextual scenario given below and answer the following sub-questions:\s*/i, '')
                        .replace(/^Read the passage\/source given below and answer the questions that follow:\s*/i, '')
                        .replace(/^Based on the scientific study of Legislature, Executive & Judiciary:\s*/i, '')
                        .trim();

                      if (!passageContent && q.questionText) {
                        const splitPatterns = ['\nQ1.', '\n1.', '\n(a)', '\n(i)', '\na.', '\ni.', 'Q1.', '1.', '(a)', '(i)'];
                        for (const pattern of splitPatterns) {
                          if (q.questionText.includes(pattern)) {
                            const parts = q.questionText.split(pattern);
                            const cand = parts[0].replace(/^Read the case study.*?\n/i, '').replace(/^Based on the scientific study of Legislature.*?\n/i, '').trim();
                            if (cand.length > 15) {
                              passageContent = cand;
                              break;
                            }
                          }
                        }
                      }

                      let questionDisplay = q.questionText;
                      if (passageContent && q.questionText.startsWith(passageContent)) {
                        questionDisplay = q.questionText.replace(passageContent, '').trim();
                      } else if (passageContent && q.questionText.includes(passageContent)) {
                        questionDisplay = q.questionText.replace(passageContent, '').trim();
                      }

                      if (questionDisplay) {
                        questionDisplay = questionDisplay
                          .replace(/^\[(?:Question|Q)\s*\d+\]\s*/i, '')
                          .replace(/^(?:Question|Q)\s*\d+[:.]\s*/i, '')
                          .replace(/^Read the case study \/ contextual scenario given below and answer the following sub-questions:\s*/i, '')
                          .replace(/^Based on the scientific study of Legislature, Executive & Judiciary:\s*/i, '')
                          .trim();
                      }

                      if (!questionDisplay || questionDisplay.trim().length === 0) {
                        questionDisplay = q.questionText;
                      }

                      const hasValidPassage = Boolean(passageContent && passageContent.trim().length > 0 && !passageContent.toLowerCase().includes('read the case study'));

                      return (
                        <div
                          key={qUniqueId}
                          id={`question-anchor-${currentGlobalIdx}`}
                          className={`space-y-3 border-b pb-5 transition-colors ${
                            isAttempted
                              ? 'bg-emerald-50/40 p-3 sm:p-4 rounded-xl border-emerald-200 print:bg-transparent print:p-0 print:border-stone-200'
                              : 'border-stone-100 print:border-stone-200'
                          }`}
                        >
                          {hasValidPassage && (
                            <div className="case-study-container bg-amber-50/95 print:bg-stone-50 p-5 sm:p-6 rounded-2xl border-2 border-amber-300/80 print:border-stone-400 font-sans mb-4 shadow-sm">
                              <div className="flex items-center gap-2 text-amber-950 print:text-stone-900 font-black uppercase tracking-wider text-xs sm:text-sm mb-2.5 border-b-2 border-amber-200/80 print:border-stone-300 pb-1.5">
                                <FileText className="w-4 h-4 text-amber-700 print:hidden" />
                                <span>{translateHeaderTerm('CASE STUDY REFERENCE PASSAGE / SOURCE DATA:', languageMode)}</span>
                              </div>
                              <div className="case-study-text text-stone-950 print:text-stone-900 leading-relaxed text-base sm:text-lg font-serif italic whitespace-pre-line break-words py-1">
                                {translateQuestionText(passageContent, languageMode)}
                              </div>
                            </div>
                          )}

                          {/* Render Visual Diagram / Scenario Graphic */}
                          <QuestionDiagramRenderer
                            question={{ ...q, casePassage: passageContent || q.casePassage }}
                            subjectName={paper.subjectName}
                            languageMode={languageMode}
                          />

                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 text-sm font-medium text-stone-900 leading-relaxed whitespace-pre-line">
                              <span className="font-bold font-sans text-stone-900 mr-2">Q{qIdx + 1}.</span>
                              {translateQuestionText(questionDisplay || q.questionText, languageMode, q)}
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-start">
                              <div className="flex items-center gap-1.5 print:hidden">
                                <button
                                  onClick={() => refreshQuestion(secIdx, qIdx)}
                                  disabled={refreshingKey === `${secIdx}-${qIdx}`}
                                  className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                                    refreshingKey === `${secIdx}-${qIdx}`
                                      ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                                      : 'border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900'
                                  }`}
                                  title={languageMode === 'hi' ? 'नया प्रश्न रिफ्रेश करें (Refresh)' : 'Refresh this question with a fresh authentic question'}
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingKey === `${secIdx}-${qIdx}` ? 'animate-spin text-emerald-600' : ''}`} />
                                </button>

                                <button
                                  onClick={() => undoQuestion(secIdx, qIdx)}
                                  disabled={!canUndoQuestion(secIdx, qIdx)}
                                  className={`px-2 py-1 rounded-lg border transition-all active:scale-95 flex items-center gap-1 text-[11px] font-sans font-bold ${
                                    canUndoQuestion(secIdx, qIdx)
                                      ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 shadow-xs cursor-pointer'
                                      : 'border-stone-200 bg-stone-50 text-stone-300 cursor-not-allowed opacity-50'
                                  }`}
                                  title={
                                    canUndoQuestion(secIdx, qIdx)
                                      ? languageMode === 'hi'
                                        ? `पिछला प्रश्न देखें (${getQuestionHistoryInfo(secIdx, qIdx).current}/${getQuestionHistoryInfo(secIdx, qIdx).total})`
                                        : `Go back to previous question (${getQuestionHistoryInfo(secIdx, qIdx).current}/${getQuestionHistoryInfo(secIdx, qIdx).total})`
                                      : languageMode === 'hi'
                                        ? 'कोई पिछला प्रश्न उपलब्ध नहीं है'
                                        : 'No previous question to undo'
                                  }
                                >
                                  <RotateCcw className={`w-3.5 h-3.5 ${canUndoQuestion(secIdx, qIdx) ? 'text-amber-700' : 'text-stone-300'}`} />
                                  <span>{languageMode === 'hi' ? 'Undo' : 'Undo'}</span>
                                  {getQuestionHistoryInfo(secIdx, qIdx).total > 1 && (
                                    <span className="text-[10px] font-mono px-1 rounded bg-amber-200/80 text-amber-900 font-extrabold ml-0.5">
                                      {getQuestionHistoryInfo(secIdx, qIdx).current}/{getQuestionHistoryInfo(secIdx, qIdx).total}
                                    </span>
                                  )}
                                </button>

                                {canRedoQuestion(secIdx, qIdx) && (
                                  <button
                                    onClick={() => redoQuestion(secIdx, qIdx)}
                                    className="p-1.5 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 cursor-pointer transition-all active:scale-95 shadow-xs"
                                    title={
                                      languageMode === 'hi'
                                        ? `अगला प्रश्न देखें (${getQuestionHistoryInfo(secIdx, qIdx).current}/${getQuestionHistoryInfo(secIdx, qIdx).total})`
                                        : `Go forward (${getQuestionHistoryInfo(secIdx, qIdx).current}/${getQuestionHistoryInfo(secIdx, qIdx).total})`
                                    }
                                  >
                                    <RotateCw className="w-3.5 h-3.5 text-blue-700" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleToggleAttempt(qUniqueId)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-bold flex items-center gap-1 border transition-all active:scale-95 cursor-pointer ${
                                    isAttempted
                                      ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs'
                                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300'
                                  }`}
                                  title="Mark as Solved / Attempted"
                                >
                                  {isAttempted ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-200" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-stone-400" />
                                  )}
                                  <span>{isAttempted ? (languageMode === 'hi' ? 'हल किया' : 'Solved') : (languageMode === 'hi' ? 'हल करें' : 'Solve')}</span>
                                </button>

                                <button
                                  onClick={() => handleToggleFlag(qUniqueId)}
                                  className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                                    isFlagged
                                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-xs'
                                      : 'bg-stone-100 hover:bg-stone-200 text-stone-400 border-stone-300 hover:text-stone-600'
                                  }`}
                                  title={isFlagged ? 'Flagged for Review' : 'Flag Question'}
                                >
                                  <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
                                </button>
                              </div>

                              <div className="font-sans font-bold text-xs text-stone-900 whitespace-nowrap bg-stone-100 print:bg-transparent px-2.5 py-1 rounded border border-stone-300 print:border-none">
                                [{q.marks} {languageMode === 'hi' ? 'अंक' : languageMode === 'bilingual' ? 'Mark/अंक' : `Mark${q.marks > 1 ? 's' : ''}`}]
                              </div>
                            </div>
                          </div>

                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 font-sans text-xs pt-1">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="text-stone-800 font-medium">
                                {translateOption(opt, languageMode, (q as any).optionsHi?.[oIdx])}
                              </div>
                            ))}
                          </div>
                        )}

                        {showAnswers && (
                          <div className="mt-4 p-4 bg-emerald-50/90 print:bg-emerald-50/60 rounded-xl border-2 border-emerald-300/80 text-xs font-sans space-y-3 shadow-sm">
                            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                              <div className="flex items-center gap-2 text-emerald-950 font-black tracking-wide uppercase text-xs">
                                <CheckCircle className="w-4 h-4 text-emerald-700" />
                                <span>{translateHeaderTerm('Official CBSE Board Answer & Marking Scheme:', languageMode)}</span>
                              </div>
                              <span className="bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded text-[11px]">
                                Total: {q.marks} Mark{q.marks > 1 ? 's' : ''}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                                Model Answer / Final Value:
                              </div>
                              <p className="font-semibold text-stone-900 bg-white p-2.5 rounded-lg border border-emerald-200 leading-relaxed text-xs">
                                {translateAnswer(q.correctAnswer, languageMode)}
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                                <span>CBSE Step-wise Marks Distribution:</span>
                              </div>
                              <div className="bg-emerald-900/5 p-3 rounded-lg border border-emerald-200 font-mono text-[11px] text-stone-800 space-y-1.5 whitespace-pre-line leading-relaxed">
                                {q.markingScheme || (
                                  q.marks === 1 ? "• [1 Mark] Correct option & concise key reason" :
                                  q.marks === 2 ? "• Step 1: Correct formula/principle [1 Mark]\n• Step 2: Accurate substitution & unit [1 Mark]" :
                                  q.marks === 3 ? "• Step 1: Fundamental concept/formula [1 Mark]\n• Step 2: Detailed intermediate steps/diagram [1 Mark]\n• Step 3: Final accurate answer with SI units [1 Mark]" :
                                  "• Step 1: Conceptual derivation/given equations [1.5 Marks]\n• Step 2: Stepwise logical calculation/labeled schematic [2.5 Marks]\n• Step 3: Conclusion with standard units & justifications [1 Mark]"
                                )}
                              </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200/80 p-2.5 rounded-lg flex items-start gap-2 text-amber-900 text-[11px]">
                              <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold uppercase tracking-wider mr-1">CBSE Examiner Tip:</span>
                                {q.marks === 1 ? "Write both the option letter (A/B/C/D) and the option text to secure full credit." :
                                 q.marks === 2 ? "Always state the relevant formula and SI units clearly; 1/2 mark is deducted for missing units." :
                                 q.marks === 3 ? "Draw neat labeled diagrams or write balanced chemical equations with state symbols (s, l, g, aq)." :
                                 "Underline final values and write clear sub-headings. Step marks are awarded even if the final calculation has minor arithmetic slips."}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
      </div>

          <div className="border-t-2 border-stone-900 pt-6 mt-12 flex items-center justify-between font-sans text-xs text-stone-600">
            <div>
              <p className="font-bold text-stone-900 uppercase">{branding.schoolName || 'DELHI PUBLIC SCHOOL'}</p>
              <p className="text-[10px]">Prepared by Senior Subject Faculty</p>
            </div>
            <div className="text-center font-bold text-stone-800 uppercase tracking-widest text-xs">
              *** END OF QUESTION PAPER ***
            </div>
            <div className="text-right">
              <p className="font-bold text-stone-900">Page 1 of 1</p>
              <p className="text-[10px] text-stone-500">ExamCraft CBSE Test Generator</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
