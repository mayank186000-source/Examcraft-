import React, { useState, useEffect } from 'react';
import { MessageSquarePlus, Star, X, Send, CheckCircle2, AlertCircle, Lightbulb, Bug, HelpCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitUserFeedback } from '../services/feedbackService';

interface FeedbackWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackWidgetModal: React.FC<FeedbackWidgetModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<'bug' | 'wrong_question' | 'feature_idea' | 'general'>('feature_idea');
  const [message, setMessage] = useState<string>('');
  const [classLevel, setClassLevel] = useState<string>('10');
  const [subject, setSubject] = useState<string>('General / App Improvement');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsSubmitted(false);
    setErrorMessage(null);
    setMessage('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await submitUserFeedback({
        rating,
        category,
        message,
        userName: (currentUser as any)?.displayName || currentUser?.name || 'Teacher / Student',
        userEmail: currentUser?.email || '',
        classLevel,
        subject
      });
      setIsSubmitted(true);
      // Auto-close after 2.5 seconds, but user can also click the button immediately
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      // Even if network or firestore fails, local storage was saved
      setIsSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Always Fixed at Top */}
        <div className="px-5 py-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-emerald-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-800 rounded-xl">
              <MessageSquarePlus className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">Feedback & Improvement Ideas</h3>
              <p className="text-[11px] text-emerald-200">Aapke sujhaav se ExamCraft ko aur behtar banayenge</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
            title="Close / Band karein"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen */}
        {isSubmitted ? (
          <div className="p-6 sm:p-8 text-center space-y-4 flex flex-col items-center justify-center my-auto">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-xl text-stone-900 dark:text-stone-100">Shukriya! Thank You!</h4>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-sm mx-auto leading-relaxed">
                Aapka feedback successfully submit ho gaya hai. Hum ise review karke jald se jald app ko improve karenge!
              </p>
            </div>
            
            <button
              onClick={handleClose}
              className="mt-4 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Main Screen pe Wapas Jayein (Close)</span>
            </button>
            <span className="text-[10px] text-stone-400">Ye window 2 second me apne aap bhi band ho jayegi.</span>
          </div>
        ) : (
          /* Form with Scrollable Body and Pinned Footer */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Scrollable Form Content */}
            <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4 text-sm">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Rating Stars */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Overall Rating / Anubhav (Rating dein)
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-stone-300 dark:text-stone-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                    {rating === 5 ? 'Awesome! 🌟' : rating === 4 ? 'Very Good 👍' : rating === 3 ? 'Good 😊' : rating === 2 ? 'Needs Work 🛠️' : 'Poor 😞'}
                  </span>
                </div>
              </div>

              {/* Feedback Category */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Category (Kis baare me hai?)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'feature_idea', label: 'Feature Idea / Suggestion', icon: Lightbulb },
                    { id: 'bug', label: 'Bug / Technical Issue', icon: Bug },
                    { id: 'wrong_question', label: 'Question Error', icon: AlertCircle },
                    { id: 'general', label: 'General Feedback', icon: HelpCircle },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as any)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                            : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 hover:border-stone-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-500'}`} />
                        <span className="text-xs leading-tight">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Class & Subject context */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Class</label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                  >
                    <option value="3">Class 3</option>
                    <option value="4">Class 4</option>
                    <option value="5">Class 5</option>
                    <option value="6">Class 6</option>
                    <option value="7">Class 7</option>
                    <option value="8">Class 8</option>
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                    <option value="11">Class 11</option>
                    <option value="12">Class 12</option>
                    <option value="General">All Classes / App General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                    placeholder="Subject name..."
                  />
                </div>
              </div>

              {/* Detailed Feedback Message */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Aapka Sujhaav ya Detail (Your Feedback / Suggestion) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none leading-relaxed"
                  placeholder="Aapko app me kya improve karwana hai ya konsa new feature chahiye? Yahan detail me likhein..."
                />
              </div>
            </div>

            {/* Pinned Footer - ALWAYS Visible at Bottom */}
            <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Cancel (रद्द करें)
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
