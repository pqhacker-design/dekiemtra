import React from 'react';
import { useAuth } from './useAuth';
import { Login } from './Login';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback,
}) => {
  const { user, firebaseUser, loading, isUnauthorized, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Đang kiểm tra quyền truy cập hệ thống...</p>
      </div>
    );
  }

  // Not logged in or unauthorized email
  if (!firebaseUser || !user || isUnauthorized || !user.active) {
    return <Login />;
  }

  // Admin role check
  if (requiredRole === 'admin' && !isAdmin) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-900/50 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-rose-950 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-800">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-white text-base">Không có quyền truy cập</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Trang này chỉ dành cho Quản trị viên (Admin). Bạn đang đăng nhập với vai trò Người dùng (User).
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
