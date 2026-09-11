import React, { useState, useEffect } from 'react';
import { X, Cloud, HardDrive, Download, Upload, Trash2, CheckCircle2, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { GeneratedPaper } from '../types';
import {
  initDriveAuth,
  signInWithGoogleDrive,
  getDriveAccessToken,
  logoutDrive,
  listDrivePapers,
  savePaperToGoogleDrive,
  readDrivePaperContent,
  deleteDrivePaper,
  DriveFileItem
} from '../utils/googleDriveService';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGeneratedPaper: GeneratedPaper | null;
  onLoadPaperFromDrive: (paper: GeneratedPaper) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  currentGeneratedPaper,
  onLoadPaperFromDrive
}) => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = initDriveAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
        fetchFiles(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setFiles([]);
      }
    );
    return () => unsubscribe();
  }, [isOpen]);

  const fetchFiles = async (token: string) => {
    setIsLoadingFiles(true);
    setErrorMsg(null);
    try {
      const list = await listDrivePapers(token);
      setFiles(list);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to list Google Drive files.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const res = await signInWithGoogleDrive();
      setUser(res.user);
      setAccessToken(res.accessToken);
      await fetchFiles(res.accessToken);
      setSuccessMsg('Successfully connected to Google Drive!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Drive authentication failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutDrive();
    setUser(null);
    setAccessToken(null);
    setFiles([]);
    setSuccessMsg('Disconnected from Google Drive.');
  };

  const handleUploadCurrentPaper = async () => {
    if (!currentGeneratedPaper || !accessToken) return;
    setIsUploading(true);
    setErrorMsg(null);
    try {
      await savePaperToGoogleDrive(currentGeneratedPaper, accessToken);
      setSuccessMsg(`Successfully saved "${currentGeneratedPaper.subjectName}" paper to Google Drive!`);
      await fetchFiles(accessToken);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save paper to Google Drive.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadFile = async (fileId: string) => {
    if (!accessToken) return;
    setIsLoadingFiles(true);
    setErrorMsg(null);
    try {
      const paper = await readDrivePaperContent(fileId, accessToken);
      onLoadPaperFromDrive(paper);
      setSuccessMsg(`Loaded paper "${paper.subjectName}" into preview!`);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to read paper from Google Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    // MANDATORY USER CONFIRMATION DIALOG FOR DESTRUCTIVE OPERATIONS
    const confirmed = window.confirm(
      `Are you sure you want to delete "${fileName}" from your Google Drive? This action cannot be undone.`
    );
    if (!confirmed) return;

    if (!accessToken) return;
    setIsLoadingFiles(true);
    setErrorMsg(null);
    try {
      await deleteDrivePaper(fileId, accessToken);
      setSuccessMsg(`Deleted "${fileName}" from Google Drive.`);
      await fetchFiles(accessToken);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete file from Google Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800 rounded-xl">
              <HardDrive className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Google Drive Question Vault Sync</h2>
              <p className="text-xs text-emerald-200">Save and sync CBSE question papers securely to your Google Drive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Auth Section */}
          {!user || !accessToken ? (
            <div className="text-center py-8 px-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                <Cloud className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">Connect Your Google Drive Account</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
                  Sign in with Google to securely store generated question papers, exam blueprints, and question vaults directly in your personal Google Drive.
                </p>
              </div>

              {/* Official Google Sign-In Button */}
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                type="button"
                className="gsi-material-button mx-auto inline-flex items-center justify-center cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: '#ffffff',
                  backgroundImage: 'none',
                  border: '1px solid #747775',
                  borderRadius: '20px',
                  boxSizing: 'border-box',
                  color: '#1f1f1f',
                  cursor: 'pointer',
                  fontFamily: 'Roboto, arial, sans-serif',
                  fontSize: '14px',
                  height: '40px',
                  letterSpacing: '0.25px',
                  outline: 'none',
                  overflow: 'hidden',
                  padding: '0 16px',
                  position: 'relative',
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  width: '240px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper flex items-center gap-3">
                  <div className="gsi-material-button-icon shrink-0">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '18px', height: '18px' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents font-semibold text-stone-700">
                    {isSigningIn ? 'Connecting...' : 'Sign in with Google'}
                  </span>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Connected User Header */}
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border border-emerald-300 object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center">
                      {(user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                      {user.displayName || user.email}
                      <span className="bg-emerald-200 text-emerald-900 text-[9px] px-1.5 py-0.2 rounded font-black">Connected</span>
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                >
                  Disconnect
                </button>
              </div>

              {/* Upload Current Paper Box */}
              {currentGeneratedPaper ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-white">Active Generated Paper Ready</p>
                      <p className="text-[11px] text-stone-600 dark:text-stone-300">{currentGeneratedPaper.subjectName} ({currentGeneratedPaper.paperCode})</p>
                    </div>
                  </div>

                  <button
                    onClick={handleUploadCurrentPaper}
                    disabled={isUploading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/15 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? 'Uploading...' : 'Save to Drive'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-stone-100 dark:bg-stone-800/60 rounded-xl text-center text-xs text-stone-500">
                  Generate a question paper in the Generator tab to save it directly to Google Drive.
                </div>
              )}

              {/* Google Drive Saved Files List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Your Google Drive ExamCraft CBSE Papers ({files.length})
                  </h4>
                  <button
                    onClick={() => accessToken && fetchFiles(accessToken)}
                    disabled={isLoadingFiles}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    title="Refresh list"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {isLoadingFiles && files.length === 0 ? (
                  <div className="text-center py-8 text-xs text-stone-500">Loading Google Drive files...</div>
                ) : files.length === 0 ? (
                  <div className="text-center py-8 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-dashed border-stone-200 dark:border-stone-700 text-xs text-stone-500">
                    No ExamCraft CBSE papers found in your Google Drive yet. Click "Save to Drive" above to upload your first paper!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {files.map(file => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl hover:border-emerald-500 transition-all"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-stone-900 dark:text-white truncate">{file.name}</p>
                            <p className="text-[10px] text-stone-400">
                              {file.createdTime ? new Date(file.createdTime).toLocaleString() : 'Saved in Drive'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleLoadFile(file.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-bold transition-colors"
                            title="Load paper into preview"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Load</span>
                          </button>

                          <button
                            onClick={() => handleDeleteFile(file.id, file.name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                            title="Delete file from Google Drive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 dark:bg-stone-800/80 border-t border-stone-200 dark:border-stone-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
