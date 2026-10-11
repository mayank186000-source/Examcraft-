import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getOrCreateGuestEmail, formatGuestName } from '../utils/guestTracker';

export interface FeedbackItem {
  id: string;
  rating: number; // 1 to 5
  category: 'bug' | 'wrong_question' | 'feature_idea' | 'general';
  message: string;
  userName?: string;
  userEmail?: string;
  classLevel?: string;
  subject?: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

const FEEDBACK_STORAGE_KEY = 'examcraft_user_feedbacks';

export async function submitUserFeedback(feedbackData: {
  rating: number;
  category: 'bug' | 'wrong_question' | 'feature_idea' | 'general';
  message: string;
  userName?: string;
  userEmail?: string;
  classLevel?: string;
  subject?: string;
}): Promise<FeedbackItem> {
  const newFeedback: FeedbackItem = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    rating: feedbackData.rating || 5,
    category: feedbackData.category || 'general',
    message: feedbackData.message.trim(),
    userName: feedbackData.userName || formatGuestName(),
    userEmail: feedbackData.userEmail || getOrCreateGuestEmail(),
    classLevel: feedbackData.classLevel || 'General',
    subject: feedbackData.subject || 'General',
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  // 1. Store in localStorage
  try {
    const existing = getAllLocalFeedbacks();
    existing.unshift(newFeedback);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Failed to save feedback locally:', err);
  }

  // 2. Sync to Firestore if online
  if (db) {
    try {
      await addDoc(collection(db, 'feedbacks'), newFeedback);
    } catch (err) {
      console.error('Failed to sync feedback to Firestore:', err);
      // Even if Firestore fails, local feedback is already recorded
    }
  }

  return newFeedback;
}

export function getAllLocalFeedbacks(): FeedbackItem[] {
  try {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.warn('Failed to parse local feedbacks:', err);
  }
  return [];
}

export async function fetchAllFeedbacks(): Promise<FeedbackItem[]> {
  const localList = getAllLocalFeedbacks();

  if (!db) return localList;

  try {
    const querySnapshot = await getDocs(collection(db, 'feedbacks'));
    const firestoreList: FeedbackItem[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as FeedbackItem;
      firestoreList.push({ ...data, id: docSnap.id || data.id });
    });

    if (firestoreList.length > 0) {
      // Merge unique
      const map = new Map<string, FeedbackItem>();
      localList.forEach(item => map.set(item.id, item));
      firestoreList.forEach(item => map.set(item.id, item));

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'feedbacks');
  }

  return localList;
}

export async function updateFeedbackStatus(id: string, status: 'pending' | 'resolved'): Promise<void> {
  const localList = getAllLocalFeedbacks();
  const updated = localList.map(item => item.id === id ? { ...item, status } : item);
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));

  if (db) {
    try {
      await updateDoc(doc(db, 'feedbacks', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'feedbacks');
    }
  }
}

export async function deleteFeedbackItem(id: string): Promise<void> {
  const localList = getAllLocalFeedbacks();
  const filtered = localList.filter(item => item.id !== id);
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(filtered));

  if (db) {
    try {
      await deleteDoc(doc(db, 'feedbacks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'feedbacks');
    }
  }
}
