import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Download, FileCode, Menu, Sparkles, UserCheck, FileText, CheckCircle2, Share2, LogOut, Shield, KeyRound, AlertTriangle, Loader2, Check } from 'lucide-react';
import { AppSettings, ExamPackage } from '../types';
import { useAuth } from '../auth/useAuth';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  settings: AppSettings;
  currentExamPackage: ExamPackage | null;
  onOpenPublishModal?: () => void;
  onExportWord?: (mode?: 'full' | 'exams' | 'answers') => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  settings,
  currentExamPackage,
  onOpenPublishModal,
  onExportWord,
  onExportPdf,
  onExportExcel,
}) => {
  const { user, role, isAdmin, logout, changePassword } = useAuth();
  const [isWordDropdownOpen, setIsWordDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Change Password Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const resetChangePasswordForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPassError('');
    setPassSuccess('');
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWordDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!oldPassword || !oldPassword.trim()) {
      setPassError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (!newPassword || newPassword.trim().length < 4) {
      setPassError('Mật khẩu mới phải có ít nhất 4 ký tự.');
      return;
    }

    if (oldPassword.trim() === newPassword.trim()) {
      setPassError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setChangingPass(true);
    try {
      await changePassword(oldPassword.trim(), newPassword.trim());
      setPassSuccess('Đã đổi mật khẩu thành công!');
      setTimeout(() => {
        setShowChangePasswordModal(false);
        resetChangePasswordForm();
      }, 1500);
    } catch (err: any) {
      setPassError(err.message || 'Lỗi khi đổi mật khẩu.');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-4 md:px-8 transition-all flex items-center justify-between shadow-xs">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Mở Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <span className="hidden sm:inline-flex items-center px-3 py-1 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20 shadow-2xs">
            <Sparkles className="w-3 h-3 mr-1 text-emerald-500 animate-spin-slow" />
            Công văn 7991/BGDĐT
          </span>
        </div>
      </div>

      {/* Right: Action Buttons & User Profile */}
      <div className="flex items-center gap-3">
        {currentExamPackage && (
          <div className="hidden sm:flex items-center gap-2">
            {onOpenPublishModal && (
              <button
                onClick={onOpenPublishModal}
                className="btn-glow-emerald text-white rounded-2xl font-black text-[11px] px-4 py-2 flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Lưu & Cấp Mã Thi Online Cho Học Sinh"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Cấp Mã Thi Online</span>
              </button>
            )}
            {onExportWord && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsWordDropdownOpen(!isWordDropdownOpen)}
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-2xl font-bold text-[11px] px-3.5 py-2 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Tùy chọn xuất Word (.docx)"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Xuất Word</span>
                  <ChevronDown className="w-3 h-3 text-blue-500" />
                </button>

                {isWordDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        onExportWord('full');
                        setIsWordDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-3 text-xs text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                    >
                      <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-500">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div>Xuất Trọn Gói</div>
                        <div className="text-[10px] text-slate-400 font-normal">Ma trận + Bảng đặc tả + Đề + Đáp án</div>
                      </div>
                    </button>
                    <div className="h-[1px] bg-slate-200/50 dark:bg-slate-800/80 my-1" />
                    <button
                      onClick={() => {
                        onExportWord('exams');
                        setIsWordDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-3 text-xs text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                    >
                      <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-emerald-600 dark:text-emerald-400">Chỉ Xuất Đề Thi</div>
                        <div className="text-[10px] text-slate-400 font-normal">Các mã đề thi (không kèm đáp án)</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        onExportWord('answers');
                        setIsWordDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-3 text-xs text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                    >
                      <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-cyan-600 dark:text-cyan-400">Chỉ Xuất Đáp Án</div>
                        <div className="text-[10px] text-slate-400 font-normal">Đáp án chi tiết + Rubric chấm điểm</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-2xl font-bold text-[11px] px-3.5 py-2 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Xuất Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>
            )}
            {onExportPdf && (
              <button
                onClick={onExportPdf}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-2xl font-bold text-[11px] px-3.5 py-2 transition-all flex items-center gap-1.5 cursor-pointer"
                title="In hoặc Xuất PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>In / PDF</span>
              </button>
            )}
          </div>
        )}

        <div className="h-7 w-[1px] bg-slate-200/80 dark:bg-slate-800/80 mx-1 hidden sm:block"></div>

        {/* User Profile & Role Dropdown Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">
                {user?.displayName || user?.username || 'Giáo viên'}
              </p>
              <div className="flex items-center justify-end space-x-1 mt-0.5">
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                  isAdmin 
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-700' 
                    : 'bg-teal-950 text-teal-300 border border-teal-800'
                }`}>
                  {isAdmin ? 'Admin' : 'User'}
                </span>
                <span className="text-[10px] text-slate-500 truncate max-w-[120px] font-mono">{user?.username}</span>
              </div>
            </div>

            {/* Avatar */}
            <div className="relative">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-indigo-600 p-[1.5px] shadow-sm">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-xs text-emerald-500">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Popover Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
              <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-2xl space-y-1">
                <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                  {user?.displayName || user?.username}
                </div>
                <div className="text-[11px] text-slate-500 truncate font-mono">
                  Tên ĐN: {user?.username}
                </div>
                <div className="pt-1 flex items-center space-x-1">
                  {isAdmin ? (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-black px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span>Quản Trị Viên (Admin)</span>
                    </span>
                  ) : (
                    <span className="text-[10px] bg-teal-500/20 text-teal-400 border border-teal-500/30 font-black px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <UserCheck className="w-3 h-3" />
                      <span>Người Dùng (User)</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200/60 dark:border-slate-800/80 pt-2 space-y-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setShowChangePasswordModal(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Đổi Mật Khẩu</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng Xuất Tài Khoản</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-800 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-white text-base">Đổi Mật Khẩu Tài Khoản</h3>
              </div>
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  resetChangePasswordForm();
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              {passError && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Mật khẩu hiện tại (*)</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Mật khẩu mới (*)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 4 ký tự)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Xác nhận mật khẩu mới (*)</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    resetChangePasswordForm();
                  }}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={changingPass}
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  {changingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Đổi Mật Khẩu</span>}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

