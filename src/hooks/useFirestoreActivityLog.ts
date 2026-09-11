import { useState, useEffect, useCallback } from 'react';
import { 
  StudentActivityDoc, 
  QuizSubmissionDoc, 
  logPaperGenerationToFirestore, 
  logQuizSubmissionToFirestore, 
  subscribeToStudentActivities,
  fetchFirestoreActivities,
  fetchFirestoreQuizSubmissions
} from '../services/firestoreActivityService';
import { useAuth } from '../context/AuthContext';

export function useFirestoreActivityLog() {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState<StudentActivityDoc[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmissionDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);

  // Subscribe to real-time student activity feed
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToStudentActivities((data) => {
      setActivities(data);
      setIsLoading(false);
      setIsFirestoreConnected(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch student activities & quiz submissions manually
  const refreshActivities = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchFirestoreActivities(150);
      setActivities(data);
      const subs = await fetchFirestoreQuizSubmissions(100);
      setQuizSubmissions(subs);
    } catch (e) {
      console.warn('Failed to refresh activities:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Fetch quiz submissions for detail views
  const refreshQuizSubmissions = useCallback(async () => {
    try {
      const subs = await fetchFirestoreQuizSubmissions(100);
      setQuizSubmissions(subs);
    } catch (e) {
      console.warn('Failed to fetch quiz submissions:', e);
    }
  }, []);

  useEffect(() => {
    refreshQuizSubmissions();
  }, [refreshQuizSubmissions]);

  // Hook action: Log Paper Generation
  const logPaperGeneration = useCallback(
    async (paper: { id: string; paperCode?: string; title: string; subjectName?: string; classLevel?: string; totalMarks?: number }) => {
      const student = currentUser
        ? { id: currentUser.id, name: currentUser.name, email: currentUser.email }
        : { id: 'guest_student', name: 'Guest Student', email: 'guest@examidea.internal' };

      return await logPaperGenerationToFirestore(student, paper);
    },
    [currentUser]
  );

  // Hook action: Log Quiz Submission
  const logQuizSubmission = useCallback(
    async (quiz: {
      paperId: string;
      paperCode?: string;
      paperTitle?: string;
      subjectName?: string;
      classLevel?: string;
      score: number;
      totalMarks: number;
      percentage: number;
      timeTakenSeconds: number;
    }) => {
      const student = currentUser
        ? { id: currentUser.id, name: currentUser.name, email: currentUser.email }
        : { id: 'guest_student', name: 'Guest Student', email: 'guest@examidea.internal' };

      const res = await logQuizSubmissionToFirestore(student, quiz);
      refreshQuizSubmissions();
      return res;
    },
    [currentUser, refreshQuizSubmissions]
  );

  return {
    activities,
    quizSubmissions,
    isLoading,
    isRefreshing,
    isFirestoreConnected,
    logPaperGeneration,
    logQuizSubmission,
    refreshActivities,
    refreshQuizSubmissions,
  };
}
