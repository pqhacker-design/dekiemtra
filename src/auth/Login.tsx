import React, { useState } from 'react';
import { useAuth } from './useAuth';
import { ShieldAlert, LogOut, Loader2, Sparkles, CheckCircle, Lock } from 'lucide-react';

export const Login: React.FC = () => {
  const { firebaseUser, isUnauthorized, login, logout, loading } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoggingIn(true);
    try {
      await login();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoggingIn(false);
    }
  };

  // Screen for Unauthorized Account (Not active or not in Firestore)
  if (firebaseUser && isUnauthorized) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex items-center justify-center p-4 overflow-y-auto">
        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 text-center space-y-6 backdrop-blur-xl my-auto">
          <div className="w-16 h-16 bg-rose-950/80 border border-rose-800/60 rounded-2xl flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-950/50">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-wide">
              Tài khoản chưa được cấp quyền
            </h2>
            <p className="text-xs text-rose-300 font-semibold bg-rose-950/40 border border-rose-800/40 px-3 py-1.5 rounded-xl inline-block">
              {firebaseUser.email}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed pt-2">
              Tài khoản của bạn chưa được Admin phê duyệt hoặc đang ở trạng thái bị khóa. Vui lòng liên hệ Quản trị viên hệ thống để được cấp quyền truy cập.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={logout}
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-md cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Đăng xuất / Đăng nhập tài khoản khác</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard Login Screen
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex items-center justify-center p-4 overflow-y-auto">
      {/* Dynamic Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-8 backdrop-blur-xl my-auto">
        {/* Brand Title */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-indigo-600 p-[2px] mx-auto shadow-xl shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400 font-black text-xl">
              AI
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              AI TEST PRO
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Hệ Thống Đánh Giá Năng Lực AI & Tạo Đề Thi CV 7991
            </p>
          </div>
        </div>

        {/* Info box */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs space-y-2 text-slate-300">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Yêu cầu đăng nhập</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Ứng dụng chỉ dành riêng cho các tài khoản Gmail được Quản trị viên cấp quyền. Vui lòng sử dụng Google Auth để xác thực.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs rounded-xl flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Login Button */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loggingIn || loading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm rounded-2xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg shadow-white/5 active:scale-[0.99] cursor-pointer disabled:opacity-60"
          >
            {loggingIn || loading ? (
              <>
                <Loader2 className="w-5 h-5 text-slate-700 animate-spin" />
                <span>Đang kết nối Google...</span>
              </>
            ) : (
              <>
                {/* Google SVG Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Đăng nhập bằng Google</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-500">
            Hệ thống bảo mật xác thực với Firebase Authentication & Google OAuth.
          </p>
        </div>
      </div>
    </div>
  );
};
