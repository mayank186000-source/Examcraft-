/**
 * Firestore Debug Logger
 * Hooks into paper generation & quiz submission functions to log and verify
 * payload structure (studentID, paperID, test scores) in browser console before Firebase transmission.
 */

export interface PaperGenerationPayloadDebug {
  studentId: string;
  studentName: string;
  studentEmail: string;
  activityType?: string;
  paperId: string;
  paperCode: string;
  paperTitle: string;
  subject: string;
  classLevel: string;
  totalMarks?: number;
  timestamp: string;
}

export interface QuizSubmissionPayloadDebug {
  studentId: string;
  studentName: string;
  studentEmail: string;
  activityType?: string;
  paperId: string;
  paperCode: string;
  paperTitle: string;
  subject: string;
  classLevel: string;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  timeTakenSeconds?: number;
  timestamp?: string;
  submittedAt?: string;
}

/**
 * Debug log and verify paper generation payload structure
 */
export function debugLogPaperGenerationPayload(
  studentInput: { id?: string; name?: string; email?: string },
  paperInput: { id: string; paperCode?: string; title: string; subjectName?: string; classLevel?: string; totalMarks?: number },
  payload: PaperGenerationPayloadDebug
) {
  const isStudentIDValid = Boolean(payload.studentId && payload.studentId.trim().length > 0);
  const isPaperIDValid = Boolean(payload.paperId && payload.paperId.trim().length > 0);
  const isMarksValid = typeof payload.totalMarks === 'number' && payload.totalMarks > 0;

  console.groupCollapsed(
    `🔥 [Firestore Debug Logger] Paper Generation Payload | Paper: "${payload.paperTitle}" (${payload.paperCode})`
  );
  console.log('%cRaw Inputs:', 'font-weight: bold; color: #d97706;', { studentInput, paperInput });
  console.log('%cGenerated Firestore Payload:', 'font-weight: bold; color: #059669;', payload);

  console.table([
    {
      Field: 'studentID',
      Value: payload.studentId,
      Type: typeof payload.studentId,
      Status: isStudentIDValid ? '✅ PASS' : '❌ FAIL (Missing ID)',
    },
    {
      Field: 'studentEmail',
      Value: payload.studentEmail,
      Type: typeof payload.studentEmail,
      Status: payload.studentEmail.includes('@') ? '✅ PASS' : '⚠️ WARNING (Non-standard email)',
    },
    {
      Field: 'paperID',
      Value: payload.paperId,
      Type: typeof payload.paperId,
      Status: isPaperIDValid ? '✅ PASS' : '❌ FAIL (Missing Paper ID)',
    },
    {
      Field: 'paperCode',
      Value: payload.paperCode,
      Type: typeof payload.paperCode,
      Status: payload.paperCode ? '✅ PASS' : '⚠️ WARNING',
    },
    {
      Field: 'totalMarks',
      Value: payload.totalMarks,
      Type: typeof payload.totalMarks,
      Status: isMarksValid ? '✅ PASS' : '❌ FAIL (Invalid Marks)',
    },
    {
      Field: 'timestamp',
      Value: payload.timestamp,
      Type: typeof payload.timestamp,
      Status: '✅ PASS',
    },
  ]);

  if (isStudentIDValid && isPaperIDValid && isMarksValid) {
    console.log(
      '%c[Payload Verification] ✅ All paper generation fields are correctly formatted for Firebase transmission.',
      'color: #059669; font-weight: bold;'
    );
  } else {
    console.warn('⚠️ [Payload Verification] Missing or malformed required fields before sending to Firebase!');
  }

  console.groupEnd();
}

/**
 * Debug log and verify quiz submission payload structure including test scores
 */
export function debugLogQuizSubmissionPayload(
  studentInput: { id?: string; name?: string; email?: string },
  quizInput: { paperId: string; score: number; totalMarks: number; percentage: number; timeTakenSeconds: number },
  payload: QuizSubmissionPayloadDebug
) {
  const isStudentIDValid = Boolean(payload.studentId && payload.studentId.trim().length > 0);
  const isPaperIDValid = Boolean(payload.paperId && payload.paperId.trim().length > 0);
  const isScoreValid = typeof payload.score === 'number' && !isNaN(payload.score);
  const isTotalMarksValid = typeof payload.totalMarks === 'number' && payload.totalMarks > 0;
  const isPercentageValid = typeof payload.percentage === 'number' && payload.percentage >= 0 && payload.percentage <= 100;
  const isTimeTakenValid = typeof payload.timeTakenSeconds === 'number' && payload.timeTakenSeconds >= 0;

  console.groupCollapsed(
    `🔥 [Firestore Debug Logger] Quiz Submission Payload | Score: ${payload.score}/${payload.totalMarks} (${payload.percentage}%)`
  );
  console.log('%cRaw Inputs:', 'font-weight: bold; color: #d97706;', { studentInput, quizInput });
  console.log('%cGenerated Firestore Payload:', 'font-weight: bold; color: #2563eb;', payload);

  console.table([
    {
      Field: 'studentID',
      Value: payload.studentId,
      Type: typeof payload.studentId,
      Status: isStudentIDValid ? '✅ PASS' : '❌ FAIL (Missing ID)',
    },
    {
      Field: 'paperID',
      Value: payload.paperId,
      Type: typeof payload.paperId,
      Status: isPaperIDValid ? '✅ PASS' : '❌ FAIL (Missing Paper ID)',
    },
    {
      Field: 'testScore (score)',
      Value: payload.score,
      Type: typeof payload.score,
      Status: isScoreValid ? '✅ PASS' : '❌ FAIL (Invalid Score)',
    },
    {
      Field: 'totalMarks',
      Value: payload.totalMarks,
      Type: typeof payload.totalMarks,
      Status: isTotalMarksValid ? '✅ PASS' : '❌ FAIL (Invalid Total Marks)',
    },
    {
      Field: 'percentage',
      Value: `${payload.percentage}%`,
      Type: typeof payload.percentage,
      Status: isPercentageValid ? '✅ PASS' : '❌ FAIL (Invalid Percentage)',
    },
    {
      Field: 'timeTakenSeconds',
      Value: `${payload.timeTakenSeconds}s`,
      Type: typeof payload.timeTakenSeconds,
      Status: isTimeTakenValid ? '✅ PASS' : '❌ FAIL (Invalid Time)',
    },
  ]);

  if (isStudentIDValid && isPaperIDValid && isScoreValid && isTotalMarksValid) {
    console.log(
      '%c[Payload Verification] ✅ All quiz submission fields & test scores are correctly formatted for Firebase transmission.',
      'color: #059669; font-weight: bold;'
    );
  } else {
    console.warn('⚠️ [Payload Verification] Missing or malformed test score / studentID / paperID fields before sending to Firebase!');
  }

  console.groupEnd();
}
