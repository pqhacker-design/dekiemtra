import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppUser, userService } from '../services/userService';

export interface AuthContextType {
  firebaseUser: any | null; // Backwards compatible null
  user: AppUser | null;
  role: 'admin' | 'user' | null;
  loading: boolean;
  isUnauthorized: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithRedirect?: () => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
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
  changePassword: async () => {},
  isAdmin: false,
  isUser: false,
  refetchUser: async () => {},
});

const SESSION_KEY = 'vision_test_app_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);

  // Initialize and check saved session
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // Always ensure default admin account exists in Firestore
        await userService.ensureDefaultAdmin();

        const savedUserId = localStorage.getItem(SESSION_KEY);
        if (savedUserId) {
          const appUser = await userService.getUserById(savedUserId);
          if (appUser && appUser.active) {
            setUser(appUser);
            setIsUnauthorized(false);
          } else if (appUser && !appUser.active) {
            setUser(appUser);
            setIsUnauthorized(true);
          } else {
            localStorage.removeItem(SESSION_KEY);
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (usernameInput: string, passwordInput: string) => {
    setLoading(true);
    try {
      const authenticatedUser = await userService.authenticateUser(usernameInput, passwordInput);
      setUser(authenticatedUser);
      setIsUnauthorized(false);
      if (authenticatedUser.id) {
        localStorage.setItem(SESSION_KEY, authenticatedUser.id);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
      setIsUnauthorized(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!user || !user.id) throw new Error('Chưa đăng nhập tài khoản.');
    await userService.changePassword(user.id, newPassword);
    setUser({ ...user, password: newPassword });
  };

  const refetchUser = async () => {
    if (user && user.id) {
      const updated = await userService.getUserById(user.id);
      if (updated) {
        setUser(updated);
        setIsUnauthorized(!updated.active);
      }
    }
  };

  const role = user?.active ? user.role : null;
  const isAdmin = role === 'admin';
  const isUser = role === 'user';

  return (
    <AuthContext.Provider
      value={{
        firebaseUser: user ? { uid: user.id || 'admin', email: user.email, displayName: user.displayName } : null,
        user,
        role,
        loading,
        isUnauthorized,
        login,
        logout,
        changePassword,
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

