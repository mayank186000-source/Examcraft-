export type QuestionType = 'mcq' | 'ar' | 'vsa' | 'sa' | 'la' | 'case';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type TestPreset = 'board80' | 'periodic40' | 'unit20' | 'custom';

export interface Chapter {
  id: string;
  number: number;
  title: string;
  unitName: string;
  unitWeightageMarks: number;
  topics: string[];
  keyFormulasOrConcepts?: string[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  category: 'Science' | 'Mathematics' | 'Social Science' | 'Languages' | 'Other';
  stream?: 'Science' | 'Commerce' | 'Arts' | 'Common';
  color: string;
  badgeBg: string;
  icon: string;
  totalChapters: number;
  standardMarks: number;
  standardTime: number;
  chapters: Chapter[];
}

export interface Question {
  id: string;
  subjectId: string;
  chapterId: string;
  chapterName: string;
  type: QuestionType;
  questionText: string;
  questionTextHindi?: string;
  options?: string[]; // For MCQ / Assertion-Reasoning
  optionsHindi?: string[];
  correctAnswer: string;
  correctAnswerHindi?: string;
  markingScheme: string; // Stepwise evaluation breakdown
  markingSchemeHindi?: string;
  explanation?: string;
  explanationHindi?: string;
  difficulty: DifficultyLevel;
  marks: number;
  isCompetency: boolean;
  pyqYear?: number;
  diagramDescription?: string;
  diagramUrl?: string;
  assetId?: string; // Unique mapped asset identifier for diagrams/images
  assetUrl?: string; // Mapped asset URL or visual data string
  hasDiagram?: boolean;
  casePassage?: string; // For Section E case study integrated context
  casePassageHindi?: string;
}

export interface PaperConfig {
  subjectId: string;
  preset: TestPreset;
  title: string;
  schoolName: string;
  examCode: string;
  date: string;
  durationMinutes: number;
  totalMarks: number;
  selectedChapterIds: string[];
  competencyRatio: number; // e.g. 50%
  difficultySplit: {
    easy: number;
    medium: number;
    hard: number;
  };
  watermarkText: string;
  logoUrl?: string;
  includeGeneralInstructions?: boolean;
  includeSolutions: boolean;
  useAI: boolean;
  language?: 'en' | 'hi' | 'bilingual';
}

export interface PaperSection {
  sectionName: string; // e.g. "SECTION A"
  description: string; // e.g. "MCQs & Assertion-Reasoning (1 Mark Each)"
  descriptionHindi?: string;
  questions: Question[];
}

export interface GeneratedPaper {
  id: string;
  paperCode?: string; // Unique paper code for reloading/regenerating exact paper & solutions
  config: PaperConfig;
  subjectName: string;
  subjectCode: string;
  generalInstructions: string[];
  generalInstructionsHindi?: string[];
  language?: 'en' | 'hi' | 'bilingual';
  sections: PaperSection[];
  createdAt: string;
  generatedBy?: {
    email: string;
    name: string;
  };
}

export interface PYQPaper {
  id: string;
  year: number;
  subjectId: string;
  subjectName: string;
  title: string;
  setNumber: string;
  totalMarks: number;
  durationMinutes: number;
  downloadCount: number;
  questions: Question[];
}

export interface AnswerEvaluationResult {
  awardedMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  stepBreakdown: Array<{
    step: string;
    marksGiven: number;
    maxForStep: number;
    status: 'correct' | 'partial' | 'incorrect';
    remark?: string;
  }>;
  missingKeywords: string[];
  examinerFeedback: string;
  idealAnswer: string;
}

export interface CustomBranding {
  schoolName: string;
  tagline: string;
  logoUrl: string;
  watermark: string;
  teacherName: string;
  examCodePrefix: string;
}

export type UserRole = 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  dailyQuotaLimit: number; // 5 for students, Infinity for admin
  dailyDownloadsUsed: number;
  lastDownloadDate: string; // YYYY-MM-DD
  totalDownloads: number;
  createdAt: string;
}

export interface DownloadRecord {
  id: string;
  paperTitle: string;
  subject: string;
  paperCode?: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
}

export interface EvaluatedCopyRecord {
  id: string;
  testTitle: string;
  subjectName: string;
  studentName: string;
  studentEmail: string;
  maxMarks: number;
  awardedMarks: number;
  percentage: number;
  grade: string;
  evaluatedAt: string;
  questionText: string;
  studentAnswer: string;
  evaluation: AnswerEvaluationResult;
  emailSent: boolean;
  emailSentAt?: string;
  imageDataUrl?: string;
}

export interface QuestionBankSet {
  id: string;
  title: string;
  classLevel: string; // '6' | '7' | '8' | '9' | '10' | '11' | '12'
  subject: string;
  subjectId?: string;
  totalMarks: number; // e.g. 10, 20, 40, 80, 100
  timeAllowed?: string; // e.g. '30 Mins', '1 Hour', '2 Hours', '3 Hours'
  description?: string;
  questionsCount?: number;
  questions?: Question[];
  rawContent?: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}
