import { QuestionBankSet } from '../types';

export const fetchQuestionBankSets = async (filters?: { classLevel?: string; subject?: string; marks?: string }): Promise<QuestionBankSet[]> => {
  try {
    const query = new URLSearchParams();
    if (filters?.classLevel && filters.classLevel !== 'all') query.append('classLevel', filters.classLevel);
    if (filters?.subject && filters.subject !== 'all') query.append('subject', filters.subject);
    if (filters?.marks && filters.marks !== 'all') query.append('marks', filters.marks);

    const url = `/api/question-bank${query.toString() ? '?' + query.toString() : ''}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      if (data.success && Array.isArray(data.questionBankSets)) {
        return data.questionBankSets;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch question bank sets:', err);
  }
  return [];
};

export const saveQuestionBankSet = async (paperSet: Partial<QuestionBankSet>): Promise<QuestionBankSet | null> => {
  try {
    const resp = await fetch('/api/question-bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paperSet })
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.paperSet) {
        return data.paperSet;
      }
    }
  } catch (err) {
    console.error('Failed to save question bank set:', err);
  }
  return null;
};

export const deleteQuestionBankSet = async (id: string): Promise<boolean> => {
  try {
    const resp = await fetch(`/api/question-bank/${id}`, {
      method: 'DELETE'
    });
    if (resp.ok) {
      const data = await resp.json();
      return Boolean(data.success);
    }
  } catch (err) {
    console.error('Failed to delete question bank set:', err);
  }
  return false;
};
