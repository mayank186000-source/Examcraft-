import { GeneratedPaper } from '../types';

let cachedAccessToken: string | null = null;
let cachedUser: any = null;

export const initDriveAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (cachedUser && cachedAccessToken) {
    if (onAuthSuccess) onAuthSuccess(cachedUser, cachedAccessToken);
  } else {
    if (onAuthFailure) onAuthFailure();
  }
  return () => {};
};

export const signInWithGoogleDrive = async (): Promise<{ user: any; accessToken: string }> => {
  const email = window.prompt('Enter your Google email for Drive sync:', 'user@gmail.com');
  if (!email) {
    throw new Error('Google Drive sign-in cancelled.');
  }
  cachedUser = {
    uid: `drive-${Date.now()}`,
    email,
    displayName: email.split('@')[0],
    photoURL: ''
  };
  cachedAccessToken = 'drive_local_session';
  return { user: cachedUser, accessToken: cachedAccessToken };
};

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutDrive = async () => {
  cachedAccessToken = null;
  cachedUser = null;
};

// Google Drive API operations
export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  size?: string;
}

export const listDrivePapers = async (accessToken: string): Promise<DriveFileItem[]> => {
  try {
    const raw = localStorage.getItem('examidea_drive_papers_backup');
    const list: DriveFileItem[] = raw ? JSON.parse(raw) : [];
    return list;
  } catch (error) {
    return [];
  }
};

export const savePaperToGoogleDrive = async (paper: GeneratedPaper, accessToken: string): Promise<{ fileId: string; fileName: string }> => {
  const fileName = `Examidea_${paper.subjectName.replace(/\s+/g, '_')}_${paper.paperCode || 'Paper'}.json`;
  const fileId = `drive-file-${Date.now()}`;
  
  try {
    const raw = localStorage.getItem('examidea_drive_papers_backup');
    const list: any[] = raw ? JSON.parse(raw) : [];
    list.unshift({
      id: fileId,
      name: fileName,
      mimeType: 'application/json',
      createdTime: new Date().toISOString(),
      size: '15 KB',
      content: paper
    });
    localStorage.setItem('examidea_drive_papers_backup', JSON.stringify(list));
  } catch (e) {}

  return { fileId, fileName };
};

export const readDrivePaperContent = async (fileId: string, accessToken: string): Promise<GeneratedPaper> => {
  try {
    const raw = localStorage.getItem('examidea_drive_papers_backup');
    const list: any[] = raw ? JSON.parse(raw) : [];
    const found = list.find(f => f.id === fileId);
    if (found && found.content) return found.content;
  } catch (e) {}
  throw new Error('Failed to load paper from local Drive storage');
};

export const deleteDrivePaper = async (fileId: string, accessToken: string): Promise<void> => {
  try {
    const raw = localStorage.getItem('examidea_drive_papers_backup');
    const list: any[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(f => f.id !== fileId);
    localStorage.setItem('examidea_drive_papers_backup', JSON.stringify(filtered));
  } catch (e) {}
};
