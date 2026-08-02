import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebase';
import { AppUser, userService } from '../services/userService';

export interface AuthContextType {
  firebaseUser: User | null;
  user: AppUser | null;
  role: 'admin' | 'user' | null;
  loading: boolean;
  isUnauthorized: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isUser: boolean;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  user: null,
  role: null,
  loading: true,
  isUnauthorized: false,
  login: async () => {},
  logout: async () => {},
  isAdmin: false,
  isUser: false,
  refetchUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);

  const syncUserFromFirestore = async (fbUser: User) => {
    try {
      const appUser = await userService.checkAndSyncUser(fbUser);
      if (!appUser || appUser.active === false) {
        setUser(appUser);
        setIsUnauthorized(true);
      } else {
        setUser(appUser);
        setIsUnauthorized(false);
      }
    } catch (err) {
      console.error('Lỗi kiểm tra quyền Firestore:', err);
      setUser(null);
      setIsUnauthorized(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        await syncUserFromFirestore(fbUser);
      } else {
        setFirebaseUser(null);
        setUser(null);
        setIsUnauthorized(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setFirebaseUser(result.user);
        await syncUserFromFirestore(result.user);
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setUser(null);
      setIsUnauthorized(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetchUser = async () => {
    if (firebaseUser) {
      await syncUserFromFirestore(firebaseUser);
    }
  };

  const role = user?.active ? user.role : null;
  const isAdmin = role === 'admin';
  const isUser = role === 'user';

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        role,
        loading,
        isUnauthorized,
        login,
        logout,
        isAdmin,
        isUser,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
