import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User, UserRole, DownloadRecord } from '../types';
import {
  syncUserToFirestore,
  subscribeToFirestoreUsers,
  logUserLoginToFirestore,
  deleteUserFromFirestore
} from '../services/firestoreActivityService';

interface CanDownloadResult {
  allowed: boolean;
  reason?: string;
  isGuestLimit?: boolean;
  isQuotaLimit?: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  guestDownloadsCount: number;
  guestMaxFreeDownloads: number;
  isAdmin: boolean;
  isPrimaryOwner: boolean;
  unlimitedVipEmails: string[];
  downloadLogs: DownloadRecord[];
  allUsers: User[];
  adminEmails: string[];
  deregisteredUserEmails: string[];
  loginWithGoogle: (email?: string, name?: string, photoURL?: string) => Promise<User>;
  loginWithEmail: (email: string, password?: string, name?: string) => Promise<User>;
  sendEmailOtp: (email: string) => Promise<{ success: boolean; otp: string; message: string }>;
  verifyEmailOtp: (email: string, otp: string, name?: string) => Promise<User>;
  logout: () => void;
  canDownload: () => CanDownloadResult;
  recordDownload: (paperTitle: string, subject: string, paperCode?: string) => void;
  updateUserQuota: (userId: string, newQuota: number) => void;
  grantUnlimitedAccess: (email: string) => void;
  revokeUnlimitedAccess: (email: string) => void;
  addAdminEmail: (email: string) => void;
  removeAdminEmail: (email: string) => void;
  deregisterUser: (userIdOrEmail: string, userObj?: User) => void;
  reRegisterUser: (email: string) => Promise<void>;
  clearDownloadLogs: () => void;
}

const PRIMARY_OWNER_EMAIL = 'mukesh186000@gmail.com';
const DEFAULT_ADMIN_EMAILS = ['mukesh186000@gmail.com'];
const GUEST_FREE_LIMIT = 1;
const DEFAULT_STUDENT_DAILY_QUOTA = 5;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminEmails, setAdminEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('examidea_admin_emails');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_ADMIN_EMAILS;
  });

  const [unlimitedVipEmails, setUnlimitedVipEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('examidea_unlimited_vip_emails');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return ['student.unlimited@examidea.in'];
  });

  const [guestDownloadsCount, setGuestDownloadsCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('examidea_guest_downloads');
      if (saved) return parseInt(saved, 10) || 0;
    } catch {
      // Fallback
    }
    return 0;
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('examidea_all_users');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    // Seed initial Super Admin user
    return [
      {
        id: 'usr-admin-1',
        name: 'Mukesh (Super Admin)',
        email: 'mukesh186000@gmail.com',
        role: 'admin',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        dailyQuotaLimit: 999999,
        dailyDownloadsUsed: 0,
        lastDownloadDate: new Date().toISOString().split('T')[0],
        totalDownloads: 14,
        createdAt: '2026-08-01T10:00:00.000Z'
      }
    ];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('examidea_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      }
    } catch {
      // Fallback
    }
    return null;
  });

  const [downloadLogs, setDownloadLogs] = useState<DownloadRecord[]>(() => {
    try {
      const saved = localStorage.getItem('examidea_download_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      {
        id: 'log-1',
        paperTitle: 'Official Board Model Paper 2026 - Science',
        subject: 'Science (086)',
        paperCode: 'CBSE10-SCI-2026-A1',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        userEmail: 'aarav.sharma@gmail.com',
        userName: 'Aarav Sharma',
        userRole: 'student'
      },
      {
        id: 'log-2',
        paperTitle: 'Standard Mathematics Pre-Board 80-Marks',
        subject: 'Mathematics (041)',
        paperCode: 'CBSE10-MTH-2026-B2',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        userEmail: 'mukesh186000@gmail.com',
        userName: 'Mukesh (Super Admin)',
        userRole: 'admin'
      }
    ];
  });

  // Pending OTP storage
  const [activeOtps, setActiveOtps] = useState<{ [email: string]: string }>({});

  // Temporarily deregistered student emails (persisted & synced with server)
  const GENERIC_RESERVED = new Set(['student', 'admin', 'user', 'guest', 'anonymous', 'null', 'undefined']);

  const [deregisteredUserEmails, setDeregisteredUserEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('examidea_deregistered_user_emails');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((e: string) => e.toLowerCase().trim()).filter((e: string) => e && !GENERIC_RESERVED.has(e));
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('examidea_deregistered_user_emails', JSON.stringify(deregisteredUserEmails));
    } catch {}
  }, [deregisteredUserEmails]);

  // Helper to sync user to server store
  const syncUserToServer = async (userToSync: User) => {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userToSync })
      });
    } catch (err) {
      console.warn('Sync user to server warning:', err);
    }
  };

  // Initial and periodic server sync for users and logs (Poll every 4 seconds)
  useEffect(() => {
    const syncAllWithServer = async () => {
      try {
        const resp = await fetch('/api/admin/all-data');
        if (resp.ok) {
          const data = await resp.json();

          if (data.success) {
            if (Array.isArray(data.deregisteredEmails)) {
              const cleaned = data.deregisteredEmails
                .map((e: string) => e.toLowerCase().trim())
                .filter((e: string) => e && !GENERIC_RESERVED.has(e));
              setDeregisteredUserEmails(prev => {
                const combined = Array.from(new Set([...prev, ...cleaned])).filter(e => !GENERIC_RESERVED.has(e));
                try {
                  localStorage.setItem('examidea_deregistered_user_emails', JSON.stringify(combined));
                } catch {}
                return combined;
              });
            }

            // 1. Sync All Users (from server without resurrecting deleted users)
            if (Array.isArray(data.users)) {
              const serverDeregList = Array.isArray(data.deregisteredEmails) ? data.deregisteredEmails : [];
              const deregSet = new Set(
                [...serverDeregList, ...deregisteredUserEmails]
                  .map((e: string) => String(e).toLowerCase().trim())
                  .filter((e: string) => e && !GENERIC_RESERVED.has(e))
              );

              setAllUsers(() => {
                const map = new Map<string, User>();
                data.users.forEach((u: User) => {
                  const email = (u.email || '').toLowerCase().trim();
                  const id = (u.id || '').toLowerCase().trim();
                  const name = (u.name || '').toLowerCase().trim();
                  const key = email || id || name;
                  if (key && !deregSet.has(email) && !deregSet.has(id) && !deregSet.has(name)) {
                    map.set(key, u);
                  }
                });
                const cleanList = Array.from(map.values());
                try {
                  localStorage.setItem('examidea_all_users', JSON.stringify(cleanList));
                } catch {}
                return cleanList;
              });
            }

            // 2. Sync Download Logs
            if (Array.isArray(data.downloadLogs)) {
              const serverDeregList = Array.isArray(data.deregisteredEmails) ? data.deregisteredEmails : [];
              const deregSet = new Set(
                [...serverDeregList, ...deregisteredUserEmails]
                  .map((e: string) => String(e).toLowerCase().trim())
                  .filter((e: string) => e && !GENERIC_RESERVED.has(e))
              );

              setDownloadLogs(() => {
                const map = new Map<string, DownloadRecord>();
                data.downloadLogs.forEach((l: DownloadRecord) => {
                  const lEmail = (l.userEmail || '').toLowerCase().trim();
                  const lName = (l.userName || '').toLowerCase().trim();
                  if (l.id && !deregSet.has(lEmail) && !deregSet.has(lName)) {
                    map.set(l.id, l);
                  }
                });
                const list = Array.from(map.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                try {
                  localStorage.setItem('examidea_download_logs', JSON.stringify(list));
                } catch {}
                return list;
              });
            }
          }
        }
      } catch (err) {
        // Fallback silently if offline
      }
    };

    // Run immediately on mount
    syncAllWithServer();

    // Poll every 4 seconds so Admin sees new registrations in real time
    const interval = setInterval(syncAllWithServer, 4000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Firestore users synchronization across all devices & mobile phones
  useEffect(() => {
    const unsubscribe = subscribeToFirestoreUsers((remoteUsers) => {
      if (Array.isArray(remoteUsers)) {
        setAllUsers(prev => {
          const map = new Map<string, User>();
          const deregSet = new Set((deregisteredUserEmails || []).map(e => String(e).toLowerCase().trim()));
          remoteUsers.forEach(u => {
            const email = (u.email || '').toLowerCase().trim();
            const id = (u.id || '').toLowerCase().trim();
            const name = (u.name || '').toLowerCase().trim();
            const key = email || id || name;
            if (key && !deregSet.has(email) && !deregSet.has(id) && !deregSet.has(name)) {
              map.set(key, u);
            }
          });
          prev.forEach(u => {
            const email = (u.email || '').toLowerCase().trim();
            const id = (u.id || '').toLowerCase().trim();
            const name = (u.name || '').toLowerCase().trim();
            const key = email || id || name;
            if (key && !deregSet.has(email) && !deregSet.has(id) && !deregSet.has(name) && !map.has(key)) {
              map.set(key, u);
            }
          });
          return Array.from(map.values());
        });
      }
    });
    return () => unsubscribe();
  }, [deregisteredUserEmails]);

  // Synchronize state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('examidea_admin_emails', JSON.stringify(adminEmails));
    } catch {}
  }, [adminEmails]);

  useEffect(() => {
    try {
      localStorage.setItem('examidea_unlimited_vip_emails', JSON.stringify(unlimitedVipEmails));
    } catch {}
  }, [unlimitedVipEmails]);

  useEffect(() => {
    try {
      localStorage.setItem('examidea_guest_downloads', guestDownloadsCount.toString());
    } catch {}
  }, [guestDownloadsCount]);

  useEffect(() => {
    try {
      localStorage.setItem('examidea_all_users', JSON.stringify(allUsers));
    } catch {}
  }, [allUsers]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('examidea_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('examidea_current_user');
      }
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('examidea_download_logs', JSON.stringify(downloadLogs));
    } catch {}
  }, [downloadLogs]);

  // Daily quota reset check
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (currentUser && currentUser.lastDownloadDate !== today) {
      const updated = {
        ...currentUser,
        dailyDownloadsUsed: 0,
        lastDownloadDate: today
      };
      setCurrentUser(updated);
      setAllUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    }
  }, [currentUser]);

  const isAdmin = currentUser?.role === 'admin' || (currentUser?.email && adminEmails.map(e => e.toLowerCase()).includes(currentUser.email.toLowerCase())) || false;

  const isPrimaryOwner = Boolean(
    currentUser?.email && currentUser.email.trim().toLowerCase() === PRIMARY_OWNER_EMAIL
  );

  const isEmailAdmin = (email: string): boolean => {
    const normalized = email.trim().toLowerCase();
    return adminEmails.some(adm => adm.trim().toLowerCase() === normalized);
  };

  const isEmailVip = (email: string): boolean => {
    const normalized = email.trim().toLowerCase();
    return unlimitedVipEmails.some(vip => vip.trim().toLowerCase() === normalized);
  };

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const loginWithGoogle = async (
    customEmail?: string,
    customName?: string,
    customPhoto?: string
  ): Promise<User> => {
    let emailToUse = customEmail?.trim().toLowerCase();
    let nameToUse = customName;
    let photoToUse = customPhoto;

    // 1. If no custom email provided, attempt real Firebase Google Auth Popup
    if (!emailToUse) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        if (result.user && result.user.email) {
          emailToUse = result.user.email.toLowerCase().trim();
          nameToUse = result.user.displayName || nameToUse;
          photoToUse = result.user.photoURL || photoToUse;
        }
      } catch (popupErr: any) {
        console.warn('Firebase signInWithPopup warning/fallback:', popupErr);
        if (popupErr?.code === 'auth/popup-closed-by-user') {
          throw new Error('Google Sign-In popup बंद कर दिया गया। (Sign-In popup was closed)');
        }
      }
    }

    // 2. Strict Email Validation check
    if (!emailToUse || !EMAIL_REGEX.test(emailToUse)) {
      throw new Error('कृपया एक सही एवं वैध ईमेल आईडी दर्ज करें (Please enter a valid email ID, e.g. student@gmail.com)।');
    }

    // Block obvious dummy emails like abc@abc.com, test@test.com, a@b.c
    const domain = emailToUse.split('@')[1] || '';
    if (domain.length < 4 || !domain.includes('.')) {
      throw new Error('कृपया अपनी सही Gmail/Google ID (e.g. user@gmail.com) से लॉग इन करें।');
    }

    const normalizedEmail = emailToUse;

    // Clear student from deregistered list if re-registering or logging in
    if (normalizedEmail) {
      setDeregisteredUserEmails(prev => prev.filter(e => {
        const normE = e.toLowerCase().trim();
        return normE !== normalizedEmail && !normE.includes(normalizedEmail) && !normalizedEmail.includes(normE);
      }));

      try {
        const savedDereg = localStorage.getItem('examidea_deregistered_user_emails');
        if (savedDereg) {
          const parsed = JSON.parse(savedDereg);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((item: string) => {
              const normI = String(item).toLowerCase().trim();
              return normI !== normalizedEmail && !normI.includes(normalizedEmail) && !normalizedEmail.includes(normI);
            });
            localStorage.setItem('examidea_deregistered_user_emails', JSON.stringify(filtered));
          }
        }
      } catch {}

      try {
        await fetch('/api/users/re-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, name: nameToUse })
        });
      } catch {}
    }

    const role: UserRole = isEmailAdmin(normalizedEmail) ? 'admin' : 'student';
    const name = nameToUse || (role === 'admin' ? 'Mukesh (Admin)' : normalizedEmail.split('@')[0]);
    const photoURL =
      photoToUse ||
      (role === 'admin'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces');

    const today = new Date().toISOString().split('T')[0];
    const hasVipAccess = isEmailVip(normalizedEmail) || role === 'admin';

    // Check if user already exists
    const existing = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    let loggedInUser: User;

    if (existing) {
      loggedInUser = {
        ...existing,
        name: name || existing.name,
        role: role,
        dailyQuotaLimit: hasVipAccess ? 999999 : existing.dailyQuotaLimit || DEFAULT_STUDENT_DAILY_QUOTA,
        dailyDownloadsUsed: existing.lastDownloadDate === today ? existing.dailyDownloadsUsed : 0,
        lastDownloadDate: today
      };
    } else {
      loggedInUser = {
        id: `usr-${Date.now()}`,
        name,
        email: normalizedEmail,
        role,
        photoURL,
        dailyQuotaLimit: hasVipAccess ? 999999 : DEFAULT_STUDENT_DAILY_QUOTA,
        dailyDownloadsUsed: 0,
        lastDownloadDate: today,
        totalDownloads: 0,
        createdAt: new Date().toISOString()
      };
    }

    setCurrentUser(loggedInUser);
    setAllUsers(prev => {
      const idx = prev.findIndex(u => u.email.toLowerCase() === normalizedEmail);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = loggedInUser;
        return next;
      }
      return [loggedInUser, ...prev];
    });

    // Sync user login to backend server
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: loggedInUser })
    }).catch(err => console.warn('User login server sync warning:', err));

    // Sync user profile & login activity event to Firestore for cross-device real-time sync
    syncUserToFirestore(loggedInUser).catch(err => console.warn('Firestore user sync warning:', err));
    logUserLoginToFirestore(
      { id: loggedInUser.id, name: loggedInUser.name, email: loggedInUser.email },
      !existing
    ).catch(err => console.warn('Firestore login log warning:', err));

    return loggedInUser;
  };

  const loginWithEmail = async (email: string, password?: string, name?: string): Promise<User> => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      throw new Error('कृपया एक सही ईमेल एड्रेस दर्ज करें (उदा. student@gmail.com)');
    }
    if (password !== undefined && password.trim().length < 4) {
      throw new Error('पासवर्ड कम से कम 4 अक्षरों का होना चाहिए (Password must be at least 4 characters)');
    }
    return loginWithGoogle(normalized, name);
  };

  const sendEmailOtp = async (email: string): Promise<{ success: boolean; otp: string; message: string }> => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      throw new Error('कृपया एक वैध ईमेल आईडी दर्ज करें।');
    }
    const generatedOtp = '123456';
    setActiveOtps(prev => ({ ...prev, [normalized]: generatedOtp }));
    return {
      success: true,
      otp: generatedOtp,
      message: `Direct verification code ready for ${email}`
    };
  };

  const verifyEmailOtp = async (email: string, otp: string, name?: string): Promise<User> => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      throw new Error('कृपया एक सही ईमेल दर्ज करें (Valid Email Required).');
    }
    return loginWithEmail(normalized, undefined, name);
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('examidea_current_user');
      localStorage.removeItem('examcraft_auth_user');
    } catch {}
  };

  const canDownload = (): CanDownloadResult => {
    // 1. Admin has unlimited access
    if (isAdmin || (currentUser && currentUser.role === 'admin')) {
      return { allowed: true };
    }

    // 2. Logged in student
    if (currentUser) {
      const today = new Date().toISOString().split('T')[0];
      const usedToday = currentUser.lastDownloadDate === today ? currentUser.dailyDownloadsUsed : 0;
      const limit = currentUser.dailyQuotaLimit ?? DEFAULT_STUDENT_DAILY_QUOTA;
      const isVip = isEmailVip(currentUser.email);

      // Handle infinite quota
      if (limit >= 999999 || limit === -1 || isVip || usedToday < limit) {
        return { allowed: true };
      }
      return {
        allowed: false,
        isQuotaLimit: true,
        reason: `Daily quota limit reached (${usedToday}/${limit} papers). Your quota refreshes tomorrow, or you can request Primary Owner for unlimited access.`
      };
    }

    // 3. Guest user
    if (guestDownloadsCount < GUEST_FREE_LIMIT) {
      return { allowed: true };
    }

    return {
      allowed: false,
      isGuestLimit: true,
      reason: 'You have used your 1 free guest paper download. Please sign in with Google or Email to continue daily free downloads!'
    };
  };

  const recordDownload = (paperTitle: string, subject: string, paperCode?: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const newLog: DownloadRecord = {
      id: `log-${Date.now()}`,
      paperTitle,
      subject,
      paperCode: paperCode || 'CBSE-PAPER',
      timestamp: now.toISOString(),
      userEmail: currentUser?.email || 'guest@anonymous.user',
      userName: currentUser?.name || 'Guest Student',
      userRole: currentUser?.role || 'student'
    };

    setDownloadLogs(prev => [newLog, ...prev]);

    // Send download log to server backend
    fetch('/api/download-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: newLog })
    }).catch(err => console.warn('Record download log server warning:', err));

    if (currentUser) {
      const updatedUser: User = {
        ...currentUser,
        dailyDownloadsUsed: (currentUser.lastDownloadDate === today ? currentUser.dailyDownloadsUsed : 0) + 1,
        totalDownloads: (currentUser.totalDownloads || 0) + 1,
        lastDownloadDate: today
      };
      setCurrentUser(updatedUser);
      setAllUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));

      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: updatedUser })
      }).catch(() => {});
    } else {
      setGuestDownloadsCount(prev => prev + 1);
      const guestUser: User = {
        id: 'usr-guest-student',
        name: 'Guest Student (Guest)',
        email: 'guest@examcraft.internal',
        role: 'student',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
        dailyQuotaLimit: 1,
        dailyDownloadsUsed: guestDownloadsCount + 1,
        lastDownloadDate: today,
        totalDownloads: guestDownloadsCount + 1,
        createdAt: new Date().toISOString()
      };
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: guestUser })
      }).catch(() => {});
      syncUserToFirestore(guestUser).catch(() => {});
    }
  };

  const updateUserQuota = (userId: string, newQuota: number) => {
    setAllUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updated = { ...u, dailyQuotaLimit: newQuota };
          if (currentUser?.id === userId) setCurrentUser(updated);

          // Synchronize VIP list
          const uEmail = u.email.toLowerCase();
          if (newQuota >= 999999) {
            setUnlimitedVipEmails(vips => (vips.includes(uEmail) ? vips : [...vips, uEmail]));
          } else {
            setUnlimitedVipEmails(vips => vips.filter(e => e.toLowerCase() !== uEmail));
          }

          fetch('/api/users/quota', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, newQuota })
          }).catch(() => {});

          syncUserToFirestore(updated).catch(() => {});

          return updated;
        }
        return u;
      })
    );
  };

  const grantUnlimitedAccess = (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;

    setUnlimitedVipEmails(prev => {
      if (prev.includes(normalized)) return prev;
      return [...prev, normalized];
    });

    setAllUsers(prev =>
      prev.map(u => {
        if (u.email.toLowerCase() === normalized) {
          const updated = { ...u, dailyQuotaLimit: 999999 };
          if (currentUser?.email.toLowerCase() === normalized) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const revokeUnlimitedAccess = (email: string) => {
    const normalized = email.trim().toLowerCase();
    setUnlimitedVipEmails(prev => prev.filter(e => e.toLowerCase() !== normalized));

    setAllUsers(prev =>
      prev.map(u => {
        if (u.email.toLowerCase() === normalized) {
          const updated = { ...u, dailyQuotaLimit: DEFAULT_STUDENT_DAILY_QUOTA };
          if (currentUser?.email.toLowerCase() === normalized) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const addAdminEmail = (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (normalized && !adminEmails.includes(normalized)) {
      setAdminEmails(prev => [...prev, normalized]);
      // Update allUsers if matching user exists
      setAllUsers(prev =>
        prev.map(u => (u.email.toLowerCase() === normalized ? { ...u, role: 'admin', dailyQuotaLimit: 999999 } : u))
      );
      if (currentUser?.email.toLowerCase() === normalized) {
        setCurrentUser(prev => (prev ? { ...prev, role: 'admin', dailyQuotaLimit: 999999 } : null));
      }
    }
  };

  const removeAdminEmail = (email: string) => {
    const normalized = email.trim().toLowerCase();
    setAdminEmails(prev => prev.filter(e => e.toLowerCase() !== normalized));
  };

  const deregisterUser = async (userIdOrEmail: string, userObj?: User) => {
    if (!userIdOrEmail && !userObj) return;
    const targetId = userObj?.id || userIdOrEmail;
    const targetEmail = (userObj?.email || userIdOrEmail || '').toLowerCase().trim();

    if (targetEmail === PRIMARY_OWNER_EMAIL.toLowerCase()) {
      alert('Primary Super Admin owner cannot be deregistered.');
      return;
    }

    // Filter out target user from allUsers state
    setAllUsers(prev => {
      const updated = prev.filter(u => {
        const uEmail = (u.email || '').toLowerCase().trim();
        const uId = (u.id || '').toLowerCase().trim();
        const uName = (u.name || '').toLowerCase().trim();
        if (targetId && uId === targetId.toLowerCase().trim()) return false;
        if (targetEmail && uEmail === targetEmail) return false;
        if (userObj?.name && uName === userObj.name.toLowerCase().trim()) return false;
        return true;
      });
      try {
        localStorage.setItem('examidea_all_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Also filter out target user from downloadLogs state
    setDownloadLogs(prev => {
      const updated = prev.filter(l => {
        const lEmail = (l.userEmail || '').toLowerCase().trim();
        const lName = (l.userName || '').toLowerCase().trim();
        if (targetEmail && lEmail === targetEmail) return false;
        if (userObj?.name && lName === userObj.name.toLowerCase().trim()) return false;
        return true;
      });
      try {
        localStorage.setItem('examidea_download_logs', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Add specific user identifiers (email, id, raw input) to deregistered list
    const nameKey = userObj?.name ? userObj.name.toLowerCase().trim() : '';
    const emailDocId = targetEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const keysToAdd = [
      targetEmail,
      targetId,
      nameKey,
      emailDocId,
      `usr-${emailDocId}`,
      userIdOrEmail.toLowerCase().trim()
    ].filter(k => k && k.length > 0 && k !== PRIMARY_OWNER_EMAIL.toLowerCase() && !GENERIC_RESERVED.has(k));

    setDeregisteredUserEmails(prev => {
      const combined = Array.from(new Set([...prev, ...keysToAdd])).filter(k => !GENERIC_RESERVED.has(k));
      try {
        localStorage.setItem('examidea_deregistered_user_emails', JSON.stringify(combined));
      } catch {}
      return combined;
    });

    // Revoke VIP if granted
    if (targetEmail) {
      revokeUnlimitedAccess(targetEmail);
    }

    // Delete user from Firestore by exact ID, email, name
    try {
      if (targetId) await deleteUserFromFirestore(targetId);
      if (targetEmail) await deleteUserFromFirestore(targetEmail);
      if (userObj?.name) await deleteUserFromFirestore(userObj.name);
    } catch (e) {
      console.warn('Firestore delete user error:', e);
    }

    // Server API call to deregister
    try {
      await fetch('/api/users/deregister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetId,
          email: targetEmail,
          name: userObj?.name || '',
          userIdOrEmail
        })
      });
    } catch {}

    // If currentUser is being deleted, log out
    if (
      currentUser &&
      ((targetId && currentUser.id === targetId) || (targetEmail && currentUser.email.toLowerCase() === targetEmail))
    ) {
      logout();
    }
  };

  const reRegisterUser = async (identifier: string) => {
    const norm = identifier.trim().toLowerCase();
    if (!norm) return;

    // Find if any user in allUsers matches this identifier (email, id, or name)
    const matchedUser = allUsers.find(
      u =>
        (u.email && u.email.toLowerCase().trim() === norm) ||
        (u.id && u.id.toLowerCase().trim() === norm) ||
        (u.name && u.name.toLowerCase().trim() === norm)
    );

    const keysToRemove = new Set<string>([norm]);
    if (matchedUser) {
      if (matchedUser.email) keysToRemove.add(matchedUser.email.toLowerCase().trim());
      if (matchedUser.id) keysToRemove.add(matchedUser.id.toLowerCase().trim());
      if (matchedUser.name) keysToRemove.add(matchedUser.name.toLowerCase().trim());
    }

    setDeregisteredUserEmails(prev =>
      prev.filter(item => {
        const itemNorm = item.toLowerCase().trim();
        for (const k of keysToRemove) {
          if (itemNorm === k || itemNorm.includes(k) || k.includes(itemNorm)) return false;
        }
        return true;
      })
    );

    try {
      await fetch('/api/users/re-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: Array.from(keysToRemove), email: matchedUser?.email || norm, userId: matchedUser?.id || norm })
      });
    } catch {}
  };

  const clearDownloadLogs = () => {
    setDownloadLogs([]);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        guestDownloadsCount,
        guestMaxFreeDownloads: GUEST_FREE_LIMIT,
        isAdmin,
        isPrimaryOwner,
        unlimitedVipEmails,
        downloadLogs,
        allUsers,
        adminEmails,
        deregisteredUserEmails,
        loginWithGoogle,
        loginWithEmail,
        sendEmailOtp,
        verifyEmailOtp,
        logout,
        canDownload,
        recordDownload,
        updateUserQuota,
        grantUnlimitedAccess,
        revokeUnlimitedAccess,
        addAdminEmail,
        removeAdminEmail,
        deregisterUser,
        reRegisterUser,
        clearDownloadLogs
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
