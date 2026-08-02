import { useAuth } from '../auth/useAuth';

export const useRole = () => {
  const { role, isAdmin, isUser, loading } = useAuth();
  return {
    role,
    isAdmin,
    isUser,
    loading,
  };
};
