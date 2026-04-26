import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEMO_MODE, auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MOCK_USERS, type AppUser, type Role } from '@/lib/mockData';
import { getUser } from '@/services/dataStore';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: { email: string; password: string; name: string; role: Role; kelas?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  loginAsDemo: (userId: string) => void;
  demoMode: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const DEMO_STORAGE_KEY = '_lms_demo_session'; // in-memory session only
let demoSession: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE || !auth) {
      // Demo: no persistent session (sandbox blocks storage). Start logged out.
      if (demoSession) {
        const u = MOCK_USERS.find((x) => x.id === demoSession);
        setUser(u ?? null);
      }
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      // Load profile doc
      if (db) {
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        if (snap.exists()) {
          setUser({ id: fbUser.uid, ...(snap.data() as Omit<AppUser, 'id'>) });
        } else {
          setUser({
            id: fbUser.uid,
            name: fbUser.displayName ?? fbUser.email ?? 'User',
            email: fbUser.email ?? '',
            role: 'siswa',
            avatar: '🙂',
            points: 0,
            badges: [],
            streakDays: 0,
          });
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loginAsDemo = (userId: string) => {
    const u = MOCK_USERS.find((x) => x.id === userId);
    if (u) {
      demoSession = userId;
      setUser(u);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (DEMO_MODE || !auth) {
      // Demo mode: just match by email
      const u = MOCK_USERS.find((x) => x.email.toLowerCase() === email.toLowerCase());
      if (!u) throw new Error('Email tidak terdaftar (coba pilih akun demo di bawah).');
      demoSession = u.id;
      setUser(u);
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp: AuthContextValue['signUp'] = async ({ email, password, name, role, kelas }) => {
    if (DEMO_MODE || !auth || !db) {
      const newUser: AppUser = {
        id: `new-${Date.now()}`,
        name,
        email,
        role,
        avatar: role === 'guru' ? '👩‍🏫' : '🙂',
        kelas,
        points: 0,
        badges: [],
        streakDays: 0,
      };
      MOCK_USERS.push(newUser);
      demoSession = newUser.id;
      setUser(newUser);
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const newUser: AppUser = {
      id: cred.user.uid,
      name,
      email,
      role,
      avatar: role === 'guru' ? '👩‍🏫' : '🙂',
      kelas,
      points: 0,
      badges: [],
      streakDays: 0,
    };
    await setDoc(doc(db, 'users', cred.user.uid), {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      kelas: newUser.kelas ?? null,
      points: 0,
      badges: [],
      streakDays: 0,
    });
    setUser(newUser);
  };

  const signOut = async () => {
    if (DEMO_MODE || !auth) {
      demoSession = null;
      setUser(null);
      return;
    }
    await fbSignOut(auth);
    setUser(null);
  };

  // Refresh user from store whenever the demo store updates
  useEffect(() => {
    if (!user) return;
    if (!DEMO_MODE) return;
    let mounted = true;
    (async () => {
      const fresh = await getUser(user.id);
      if (mounted && fresh) setUser(fresh);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.points, user?.badges?.length]);

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, loginAsDemo, demoMode: DEMO_MODE }}
    >
      {children}
    </AuthContext.Provider>
  );
}
