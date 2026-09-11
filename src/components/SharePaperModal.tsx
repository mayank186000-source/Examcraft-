import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  QrCode,
  Mail,
  Link,
  PlayCircle,
  FileText,
  X,
  Sparkles,
  ExternalLink,
  Hash,
  Send,
  Printer,
  CheckCircle2
} from 'lucide-react';
import { GeneratedPaper } from '../types';

interface SharePaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: GeneratedPaper | null;
  onOpenInteractiveQuiz?: (paper: GeneratedPaper) => void;
}

export const SharePaperModal: React.FC<SharePaperModalProps> = ({
  isOpen,
  onClose,
  paper,
  onOpenInteractiveQuiz
}) => {
  const [copiedLink, setCopiedLink] = useState<'paper' | 'quiz' | 'code' | null>(null);
  const [activeTab, setActiveTab] = useState<'link' | 'whatsapp' | 'qrcode'>('link');

  if (!isOpen || !paper) return null;

  const paperCode = paper.paperCode || paper.config.examCode || paper.id;
  
  // Construct baseline shareable URLs
  const baseUrl = window.location.origin + window.location.pathname;
  const paperShareUrl = `${baseUrl}?paper=${encodeURIComponent(paperCode)}`;
  const quizShareUrl = `${baseUrl}?quiz=${encodeURIComponent(paperCode)}`;

  const totalQuestions = paper.sections
    ? paper.sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0)
    : 0;

  const handleCopy = (text: string, type: 'paper' | 'quiz' | 'code') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const whatsappMessage = `📝 *${paper.config.title || paper.subjectName}*\n` +
    `🏫 *School/Exam:* ${paper.config.schoolName || 'CBSE Board Examination'}\n` +
    `📊 *Marks:* ${paper.config.totalMarks || 80} | *Time:* ${paper.config.durationMinutes || 180} Mins | *Questions:* ${totalQuestions}\n` +
    `🔑 *Unique Paper Code:* \`${paperCode}\` \n\n` +
    `👇 *View Question Paper & Marking Scheme:* \n${paperShareUrl}\n\n` +
    `⚡ *Take Interactive Online Practice Test:* \n${quizShareUrl}\n\n` +
    `_Shared via ExamCraft CBSE Test Generator_`;

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`CBSE Question Paper: ${paper.config.title || paper.subjectName}`);
    const body = encodeURIComponent(whatsappMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paperShareUrl)}&color=064e3b&bgcolor=ffffff`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 font-extrabold flex items-center justify-center shadow-md">
              <Share2 className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                Share Question Paper
                <span className="text-[10px] bg-emerald-950 text-emerald-200 font-extrabold px-2 py-0.5 rounded-md border border-emerald-600">
                  Public Link
                </span>
              </h2>
              <p className="text-xs text-emerald-200">
                Generate shareable links, WhatsApp messages & QR codes for students
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Summary Card */}
        <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-4 border-b border-emerald-100 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-xs text-emerald-800 dark:text-emerald-300 bg-white dark:bg-stone-800 px-2.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                {paperCode}
              </span>
              <span className="text-xs text-stone-500 font-bold">
                • {paper.subjectName}
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-white mt-1 line-clamp-1">
              {paper.config.title || paper.subjectName}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold shrink-0">
            <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800">
              {paper.config.totalMarks || 80} Marks
            </span>
            <span className="bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded-lg">
              {paper.config.durationMinutes || 180} Mins
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800/50 p-1.5 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'link'
                ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-extrabold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Public Links</span>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-extrabold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp / Msg</span>
          </button>
          <button
            onClick={() => setActiveTab('qrcode')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'qrcode'
                ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-extrabold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-amber-500" />
            <span>Classroom QR Code</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* TAB 1: Links */}
          {activeTab === 'link' && (
            <div className="space-y-5">
              
              {/* Option 1: View Question Paper Link */}
              <div className="space-y-2 bg-stone-50 dark:bg-stone-800/60 p-4 rounded-xl border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Board View & Printable PDF Link (छात्र व्यू लिंक)</span>
                  </label>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                    Standard View
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Anyone with this link can view the formatted paper, print, or download PDF directly.
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={paperShareUrl}
                    className="flex-1 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono text-xs rounded-xl px-3 py-2.5 outline-none select-all"
                  />
                  <button
                    onClick={() => handleCopy(paperShareUrl, 'paper')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {copiedLink === 'paper' ? (
                      <>
                        <Check className="w-4 h-4 text-amber-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Option 2: Interactive Online Quiz Link */}
              <div className="space-y-2 bg-stone-50 dark:bg-stone-800/60 p-4 rounded-xl border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-amber-500" />
                    <span>Interactive Online Practice Test Link (ऑनलाइन टेस्ट लिंक)</span>
                  </label>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded font-bold">
                    Quiz Mode
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Directly opens the timed practice test mode with instant answer validation for students.
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={quizShareUrl}
                    className="flex-1 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono text-xs rounded-xl px-3 py-2.5 outline-none select-all"
                  />
                  <button
                    onClick={() => handleCopy(quizShareUrl, 'quiz')}
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {copiedLink === 'quiz' ? (
                      <>
                        <Check className="w-4 h-4 text-stone-950" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-stone-950" />
                        <span>Copy Quiz Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Option 3: Unique Paper Code copy */}
              <div className="flex items-center justify-between bg-amber-50/60 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60">
                <div className="flex items-center gap-2.5">
                  <Hash className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      Unique Paper Code Only:
                    </span>
                    <span className="font-mono font-extrabold text-xs text-amber-900 dark:text-amber-100 ml-2 bg-amber-100 dark:bg-amber-900/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                      {paperCode}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(paperCode, 'code')}
                  className="text-xs font-extrabold text-amber-900 dark:text-amber-200 hover:text-amber-950 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedLink === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink === 'code' ? 'Code Copied' : 'Copy Code'}</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: WhatsApp & Messaging */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Pre-formatted WhatsApp Announcement Message</span>
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Ready to send directly to your WhatsApp student/parent class groups or coaching broadcast list.
                </p>
              </div>

              <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-200 dark:border-stone-800 font-mono text-xs leading-relaxed text-stone-800 dark:text-stone-300 whitespace-pre-line max-h-52 overflow-y-auto select-all">
                {whatsappMessage}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer text-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Send to WhatsApp Class Group</span>
                </button>
                <button
                  onClick={handleEmailShare}
                  className="w-full sm:flex-1 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer text-xs"
                >
                  <Mail className="w-4 h-4 text-amber-500" />
                  <span>Share via Email</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Classroom QR Code */}
          {activeTab === 'qrcode' && (
            <div className="space-y-4 text-center">
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-stone-800 dark:text-stone-200 flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-amber-500" />
                  <span>Classroom Screen & Printed Notice Board QR Code</span>
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Project this QR code on smart boards in classroom or print it for notice boards. Students can scan with smartphone cameras to open paper instantly!
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border-2 border-stone-200 dark:border-stone-700 inline-block shadow-lg mx-auto">
                <img
                  src={qrCodeImageUrl}
                  alt={`QR Code for ${paperCode}`}
                  className="w-48 h-48 mx-auto object-contain"
                  referrerPolicy="no-referrer"
                />
                <p className="font-mono font-black text-xs text-stone-900 mt-2">
                  CODE: {paperCode}
                </p>
              </div>

              <div className="flex justify-center pt-1">
                <button
                  onClick={() => {
                    window.open(qrCodeImageUrl, '_blank');
                  }}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open High-Res QR Image to Download / Print</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-stone-50 dark:bg-stone-800/80 border-t border-stone-200 dark:border-stone-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Students can also enter code <code className="font-mono font-bold text-stone-800 dark:text-stone-200">{paperCode}</code> on homepage!</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
